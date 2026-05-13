/**
 * User-namespaced localStorage helpers.
 *
 * Codex review (PR #36, cycle tracker) flagged that `kai_cycle_v1`,
 * `kai_screen_time_v1`, `kai_hydration_v1`, `kai_mood_log_v1` are all
 * fixed keys. On a shared browser (school computer, family iPad), if
 * teen A signs in / logs cycle data / signs out, then teen B signs in,
 * teen B sees teen A's data.
 *
 * The fix: prefix each storage key with the authenticated user ID
 * when one is present. Anonymous / signed-out usage keeps the plain
 * key (so the demo flow still works).
 *
 * Callers pass the userId (typically Clerk's `useUser()?.user?.id`)
 * to the helpers. When `userId` is null/undefined, the helpers
 * behave like plain localStorage.
 */

export function namespacedKey(baseKey: string, userId?: string | null): string {
  if (!userId) return baseKey;
  return `u_${userId}__${baseKey}`;
}

export function loadJSON<T>(
  baseKey: string,
  userId: string | null | undefined,
  fallback: T
): T {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(namespacedKey(baseKey, userId));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(
  baseKey: string,
  userId: string | null | undefined,
  value: unknown
): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(namespacedKey(baseKey, userId), JSON.stringify(value));
  } catch {
    // localStorage can fail on quota or in private-mode contexts;
    // swallow rather than break the UI.
  }
}

export function clearKey(
  baseKey: string,
  userId: string | null | undefined
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(namespacedKey(baseKey, userId));
}
