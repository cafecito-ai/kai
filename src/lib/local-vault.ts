// Vault — the user's private/sacred space.
//
// Holds the "why I started" Day 0 video/note. Locked behind a device
// biometric (Face ID on iOS, Touch ID on Mac, fingerprint on Android)
// via the WebAuthn standard. Deliberately NOT shown on Home in the
// normal case — only resurfaces when the system detects the user is
// fading (low activity, broken streak, low mood). The whole point is
// that the emotional charge of a sacred reminder disappears if you
// see it every day.

import { readLocalInputs } from "./local-score";

/** Soft signals that the user might be drifting. When ANY of these are
 *  true, a small "Why you started" tile appears on Home with a link to
 *  the Vault. Tuned to be gentle — we never tell the teen they're
 *  failing, we just make the door visible for the moments they might
 *  want to walk through it. */
export type VaultResurfaceSignal =
  | "low_activity"           // < 1 input/day across the last 4 days
  | "streak_just_broke"      // had a 3+ day streak that ended in the last 2 days
  | "low_mood"               // average check-in mood ≤ 2 over last 4 days
  | "inconsistent_check_ins" // 2+ consecutive days with zero inputs
  | "fading_motivation";     // composite of any 2 of the above

/** Returns the signals that are currently true. Empty array = user is
 *  doing fine, Home stays clean. Any signal = show the tile. */
export function detectVaultResurfaceSignals(now: Date = new Date()): VaultResurfaceSignal[] {
  const inputs = readLocalInputs();
  const today = now.toISOString().slice(0, 10);
  const todayMs = new Date(today).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const signals: VaultResurfaceSignal[] = [];

  // Distinct active dates ordered most-recent first.
  const activeDays = Array.from(new Set(inputs.map((i) => i.date)))
    .sort()
    .reverse();

  // Low activity: < 4 active days in the last 7.
  const sevenDaysAgo = today;
  const within7 = activeDays.filter((d) => {
    const days = Math.round((todayMs - new Date(d).getTime()) / dayMs);
    return days >= 0 && days <= 6;
  });
  if (within7.length < 4 && inputs.length > 0) {
    // Only fire low_activity if they USED to be more active (avoid
    // hammering brand-new users who literally just signed up).
    if (inputs.length >= 10) signals.push("low_activity");
  }

  // Inconsistent check-ins: 2+ consecutive zero days ending today/yesterday.
  let consecutiveGap = 0;
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (activeDays.includes(key)) break;
    consecutiveGap += 1;
  }
  if (consecutiveGap >= 2 && inputs.length >= 5) {
    signals.push("inconsistent_check_ins");
  }

  // Streak just broke: had ≥ 3 consecutive days that ended in the last 2.
  // Approximated: look for a 3+ run that ends 1-2 days back.
  if (activeDays.length >= 3) {
    // Walk recent days finding the most recent consecutive run.
    let runLength = 1;
    let prev = activeDays[0];
    for (let i = 1; i < activeDays.length; i += 1) {
      const cur = activeDays[i];
      const dayDiff = Math.round(
        (new Date(prev).getTime() - new Date(cur).getTime()) / dayMs,
      );
      if (dayDiff === 1) {
        runLength += 1;
        prev = cur;
      } else {
        break;
      }
    }
    const lastActiveMs = new Date(activeDays[0]).getTime();
    const daysSinceLast = Math.round((todayMs - lastActiveMs) / dayMs);
    if (runLength >= 3 && daysSinceLast >= 1 && daysSinceLast <= 2) {
      signals.push("streak_just_broke");
    }
  }

  // Low mood: average mood over check-ins in last 4 days ≤ 2.
  const fourDaysAgo = new Date(now);
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
  const cutoff = fourDaysAgo.toISOString().slice(0, 10);
  const recentMoods = inputs
    .filter((i) => i.source === "check_in" && i.date >= cutoff)
    .map((i) => (i.value as { mood?: number }).mood)
    .filter((m): m is number => typeof m === "number");
  if (recentMoods.length >= 2) {
    const avg = recentMoods.reduce((s, m) => s + m, 0) / recentMoods.length;
    if (avg <= 2) signals.push("low_mood");
  }

  // Fading motivation: composite signal — any 2 of the above.
  if (signals.length >= 2) {
    signals.push("fading_motivation");
  }
  return signals;
}

/** Whether to show the "Why you started" tile on Home right now. */
export function shouldSurfaceVaultOnHome(now: Date = new Date()): boolean {
  return detectVaultResurfaceSignals(now).length > 0;
}

// ─────────────────────────────────────────────────────────────────────
// WebAuthn helpers
// ─────────────────────────────────────────────────────────────────────

const VAULT_CRED_KEY = "kai_vault_credential_v1";
const VAULT_UNLOCKED_AT_KEY = "kai_vault_unlocked_at_v1";
// How long an unlock stays valid before we re-prompt for biometric.
const UNLOCK_TTL_MS = 5 * 60 * 1000;

export function isVaultUnlocked(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const raw = localStorage.getItem(VAULT_UNLOCKED_AT_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return Number.isFinite(ts) && Date.now() - ts < UNLOCK_TTL_MS;
  } catch {
    return false;
  }
}

export function markVaultUnlocked(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(VAULT_UNLOCKED_AT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function lockVault(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(VAULT_UNLOCKED_AT_KEY);
  } catch {
    /* ignore */
  }
}

export function hasVaultCredential(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return !!localStorage.getItem(VAULT_CRED_KEY);
  } catch {
    return false;
  }
}

/** Register a passkey for the vault. Triggers the device's native
 *  biometric prompt (Face ID / Touch ID / fingerprint). The resulting
 *  credential id is stored locally so we can verify on subsequent
 *  visits.
 *
 *  Returns true on success. Throws / returns false if the user cancels
 *  or the device doesn't support WebAuthn. */
export async function registerVaultBiometric(displayName: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.credentials) return false;
  try {
    // 32-byte challenge — for a local-only vault we don't need a
    // server, so the challenge is just random bytes. (If we later move
    // verification server-side, the worker will issue this.)
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const cred = await navigator.credentials.create({
      publicKey: {
        rp: { name: "KAI Vault" },
        user: {
          id: userId,
          name: displayName || "kai user",
          displayName: displayName || "KAI user",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },   // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        challenge,
        authenticatorSelection: {
          // Prefer a platform authenticator (Face ID / Touch ID / fingerprint)
          // over a roaming key (USB / NFC).
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60_000,
      },
    });
    if (!cred) return false;
    const credId = (cred as PublicKeyCredential).id;
    try {
      localStorage.setItem(VAULT_CRED_KEY, credId);
    } catch {
      /* private mode quota — that's fine for one-tab */
    }
    markVaultUnlocked();
    return true;
  } catch {
    return false;
  }
}

/** Verify the stored vault credential — triggers the biometric prompt.
 *  Returns true on success. */
export async function verifyVaultBiometric(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.credentials) return false;
  const credId = localStorage.getItem(VAULT_CRED_KEY);
  if (!credId) return false;
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    // Decode the credential id from base64url so we can pass it back.
    const allowCredentialId = base64UrlToBytes(credId);
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: allowCredentialId,
            type: "public-key",
            transports: ["internal"],
          },
        ],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    if (!assertion) return false;
    markVaultUnlocked();
    return true;
  } catch {
    return false;
  }
}

function base64UrlToBytes(s: string): ArrayBuffer {
  // Browser-issued credential ids are base64url. Pad and decode.
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i += 1) bytes[i] = binStr.charCodeAt(i);
  return bytes.buffer;
}
