import { verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";
import { ensureUser } from "./db";
import type { AppVariables, Env } from "../types";

type AuthContext = Context<{ Bindings: Env; Variables: AppVariables }>;

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Make sure a `users` row exists for this id before a write hits the DB.
 * Several tables FK to users(id) (workouts, scan_observations, voice, groups,
 * daily_scores, …); in the anonymous no-auth pilot a fresh x-dev-user has no
 * users row, so those writes would fail a FOREIGN KEY constraint. We do this
 * once per mutating request (cheap INSERT OR IGNORE), and fail open — the
 * route's own write surfaces any real error.
 */
async function ensureUserForWrite(c: AuthContext, userId: string) {
  if (!MUTATING.has(c.req.method)) return;
  try {
    await ensureUser(c.env.DB, userId);
  } catch {
    // fail open
  }
}

export async function requireAuth(c: AuthContext, next: Next) {
  if (
    c.req.method === "OPTIONS" ||
    c.req.path === "/health" ||
    c.req.path === "/api/health" ||
    c.req.path === "/api/parent/consent" ||
    c.req.path === "/api/demo-feedback" ||
    c.req.path === "/api/scope-feedback" ||
    c.req.path === "/api/demo-kai" ||
    c.req.path === "/api/demo-food-photo" ||
    c.req.path === "/api/demo-food-photo-upload" ||
    c.req.path === "/api/demo-session" ||
    // T-034 — Bland AI webhook is called by Bland's servers, not by an
    // authenticated user. Authn is via BLAND_WEBHOOK_SECRET signature
    // (X-Bland-Signature header, verified inside the route handler).
    c.req.path === "/api/voice/webhook"
  ) {
    await next();
    return;
  }

  const devUser = c.req.header("x-dev-user");
  const isNonProd = c.env.APP_ENV === "development" || c.env.APP_ENV === "staging";
  // The product is launching as a no-auth pilot (Clerk not yet wired) — each
  // browser is its own anonymous user via x-dev-user. Allow that on prod ONLY
  // when ALLOW_DEV_USER=1 is explicitly set. Never grant ops/admin to an
  // anonymous prod dev-user (that would expose the ops + safety dashboards) —
  // ops stays dev/staging-only.
  const allowDevUser = isNonProd || c.env.ALLOW_DEV_USER === "1";
  if (devUser && allowDevUser) {
    c.set("userId", devUser);
    c.set("isOps", isNonProd);
    await ensureUserForWrite(c, devUser);
    await next();
    return;
  }

  const token = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  if (!c.env.CLERK_SECRET_KEY) return c.json({ error: "Clerk is not configured" }, 503);

  try {
    const verified = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
      jwtKey: c.env.CLERK_JWT_KEY
    });
    if (!verified.sub) return c.json({ error: "Unauthorized" }, 401);
    const metadata = verified.metadata as { role?: string } | undefined;
    c.set("userId", verified.sub);
    c.set("isOps", Boolean(verified.org_role === "org:admin" || metadata?.role === "ops"));
    await ensureUserForWrite(c, verified.sub);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
}
