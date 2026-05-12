import type { Env } from "../types";

export type RateLimitConfig = {
  route: string;
  limit: number;
  periodSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

/**
 * Build a KV key for a fixed sliding-window counter.
 * Window boundary is `floor(nowMs / periodMs) * periodMs`, so all requests
 * inside the same window share a key. Crossing the boundary creates a fresh
 * counter — net effect is roughly "N requests per period", with a small burst
 * at boundaries (acceptable for anti-spam).
 */
export function rateLimitKey(route: string, userId: string, nowMs: number, periodSeconds: number): string {
  const periodMs = periodSeconds * 1000;
  const windowStart = Math.floor(nowMs / periodMs) * periodMs;
  return `rl:${route}:${userId}:${windowStart}`;
}

export function shouldAllow(count: number, limit: number): boolean {
  return count < limit;
}

/**
 * Check (and increment) the rate-limit counter for this user+route.
 *
 * Returns `allowed: true` when under the limit. The counter is incremented
 * best-effort; KV is eventually consistent, so two concurrent requests at
 * the limit boundary may both succeed (small over-burst). Acceptable
 * trade-off for anti-spam, not for security.
 *
 * If SESSIONS_KV is unavailable or fails, fail open and log a warning — we
 * don't want the rate limiter taking down chat. Real abuse triggers ops
 * alert via separate channels anyway.
 */
export async function rateLimit(env: Env, userId: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const periodMs = config.periodSeconds * 1000;
  const now = Date.now();
  const key = rateLimitKey(config.route, userId, now, config.periodSeconds);
  const windowStart = Math.floor(now / periodMs) * periodMs;
  const resetAt = windowStart + periodMs;

  if (!env.SESSIONS_KV) {
    return { allowed: true, remaining: config.limit, resetAt };
  }

  let count = 0;
  try {
    const current = await env.SESSIONS_KV.get(key);
    count = current ? Number.parseInt(current, 10) || 0 : 0;
  } catch (err) {
    console.warn(`rate-limit KV read failed for ${config.route}; failing open`, err);
    return { allowed: true, remaining: config.limit, resetAt };
  }

  const allowed = shouldAllow(count, config.limit);

  // Always increment so the counter reflects attempt count, not allowed count.
  // TTL covers the window plus a small grace for clock skew.
  try {
    await env.SESSIONS_KV.put(key, String(count + 1), { expirationTtl: config.periodSeconds + 5 });
  } catch (err) {
    console.warn(`rate-limit KV write failed for ${config.route}; not enforcing this turn`, err);
    return { allowed: true, remaining: Math.max(0, config.limit - count), resetAt };
  }

  return {
    allowed,
    remaining: Math.max(0, config.limit - count - 1),
    resetAt
  };
}

/**
 * Build a 429 JSON response with Retry-After + standard rate-limit headers.
 */
export function rateLimitedResponse(result: RateLimitResult, config: RateLimitConfig): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return Response.json(
    { error: "Too many requests. Slow down a sec." },
    {
      status: 429,
      headers: {
        "retry-after": String(retryAfterSeconds),
        "x-ratelimit-limit": String(config.limit),
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.ceil(result.resetAt / 1000))
      }
    }
  );
}
