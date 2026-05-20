// T-028 — Body scan storage scaffold.
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  ⚠️ requires_safety_review — Evan Ratner must sign off on this   ║
// ║  before Phase E (T-029) ships.                                   ║
// ║                                                                  ║
// ║  This file is a SCAFFOLD. It:                                    ║
// ║    - Uses WebCrypto AES-256-GCM for client-side encryption       ║
// ║    - Derives the key from a per-user secret via PBKDF2           ║
// ║    - Stores encrypted blobs in localStorage (NOT R2 yet)         ║
// ║    - Has no public network surface                               ║
// ║                                                                  ║
// ║  BEFORE GOING LIVE (Phase E / T-030):                            ║
// ║    [ ] Replace localStorage with R2 upload via Worker            ║
// ║    [ ] Replace user-id-as-secret with a proper passphrase /      ║
// ║        device key, OR use a server-issued key wrapping scheme    ║
// ║    [ ] Confirm R2 bucket has no public ACL, signed URLs only     ║
// ║    [ ] Confirm vision API call only receives the decrypted blob  ║
// ║        in-memory, never persists plaintext                       ║
// ║    [ ] Penetration test against the upload path                  ║
// ║    [ ] Clinician review of 10 sample outputs (Gate 5)            ║
// ╚══════════════════════════════════════════════════════════════════╝
//
// What this scaffold IS good for:
//   - The UI flow can be exercised end-to-end (capture → encrypt →
//     persist → list → decrypt → delete) on a real device
//   - Encryption primitives can be reviewed before R2 wiring
//   - The shape of the API (encryptScan, getScans, deleteScan) is
//     stable and won't change in Phase E

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export type ScanAngle = "front" | "side" | "back";

export type EncryptedScanRecord = {
  id: string;
  /** Logical scan session — three angles share a sessionId. */
  sessionId: string;
  angle: ScanAngle;
  /** ISO timestamp. */
  capturedAt: string;
  /** Base64 of the AES-GCM ciphertext (image bytes + 16-byte tag at end). */
  ciphertextB64: string;
  /** Base64 of the 12-byte IV used for this encryption. */
  ivB64: string;
  /** MIME of the original (so we can re-render correctly after decrypt). */
  mime: string;
};

const STORAGE_KEY = "kai_scans_v1";
const SCAN_SESSION_LIMIT = 3;
const SCAN_SESSION_WINDOW_DAYS = 7;

// ─────────────────────────────────────────────────────────────────────
// Key derivation
// ─────────────────────────────────────────────────────────────────────

/**
 * Derive an AES-GCM key from a per-user secret.
 *
 * SCAFFOLD: the "secret" is just the user id for now — INSECURE for
 * production. Phase E should switch to either:
 *   - A passphrase the user sets at scan setup, derived via PBKDF2
 *   - A device-bound key generated and wrapped server-side
 *
 * The salt is intentionally constant per user (the userId itself) so
 * the same key can be re-derived on different sessions; in production
 * the salt should be a random per-user value stored alongside the user.
 */
async function deriveKey(userSecret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(userSecret),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(`kai-scan-salt-v1:${userSecret}`),
      iterations: 120_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// ─────────────────────────────────────────────────────────────────────
// Encrypt / decrypt
// ─────────────────────────────────────────────────────────────────────

export async function encryptImage(
  bytes: ArrayBuffer,
  userSecret: string,
): Promise<{ ciphertextB64: string; ivB64: string }> {
  const key = await deriveKey(userSecret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return {
    ciphertextB64: arrayBufferToB64(ct),
    ivB64: arrayBufferToB64(iv.buffer as ArrayBuffer),
  };
}

export async function decryptImageBytes(
  record: EncryptedScanRecord,
  userSecret: string,
): Promise<ArrayBuffer> {
  const key = await deriveKey(userSecret);
  const iv = b64ToArrayBuffer(record.ivB64);
  const ct = b64ToArrayBuffer(record.ciphertextB64);
  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    ct,
  );
}

export async function decryptImage(
  record: EncryptedScanRecord,
  userSecret: string,
): Promise<Blob> {
  const pt = await decryptImageBytes(record, userSecret);
  return new Blob([pt], { type: record.mime });
}

// ─────────────────────────────────────────────────────────────────────
// Persistence (localStorage for the scaffold)
// ─────────────────────────────────────────────────────────────────────

function readAll(): EncryptedScanRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as EncryptedScanRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: EncryptedScanRecord[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage quota — silently fail. Phase E will move to R2.
  }
}

/** Save an already-encrypted scan record. */
export function saveScan(record: EncryptedScanRecord): void {
  const all = readAll();
  all.push(record);
  writeAll(all);
}

/** All scan records, newest session first. */
export function listScans(): EncryptedScanRecord[] {
  return [...readAll()].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

/** Group scans by sessionId — used by the history view. */
export function listScanSessions(): Array<{
  sessionId: string;
  capturedAt: string; // earliest of the 3 angles
  scans: EncryptedScanRecord[];
}> {
  const all = readAll();
  const bySession = new Map<string, EncryptedScanRecord[]>();
  for (const r of all) {
    const arr = bySession.get(r.sessionId) ?? [];
    arr.push(r);
    bySession.set(r.sessionId, arr);
  }
  return Array.from(bySession.entries())
    .map(([sessionId, scans]) => ({
      sessionId,
      scans: [...scans].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)),
      capturedAt: [...scans].sort((a, b) =>
        a.capturedAt.localeCompare(b.capturedAt),
      )[0].capturedAt,
    }))
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

/** Delete a single record (one angle). */
export function deleteScan(id: string): void {
  writeAll(readAll().filter((r) => r.id !== id));
}

/** Delete an entire session (all 3 angles). */
export function deleteScanSession(sessionId: string): void {
  writeAll(readAll().filter((r) => r.sessionId !== sessionId));
}

// ─────────────────────────────────────────────────────────────────────
// Rate limit (CLAUDE_v3_PATCH §3 — max 3 scan sessions / 7 days)
// ─────────────────────────────────────────────────────────────────────

export function sessionsInLastSevenDays(now: Date = new Date()): number {
  const sessions = listScanSessions();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - SCAN_SESSION_WINDOW_DAYS);
  return sessions.filter((s) => new Date(s.capturedAt) >= cutoff).length;
}

export function canStartNewScanSession(now: Date = new Date()): boolean {
  return sessionsInLastSevenDays(now) < SCAN_SESSION_LIMIT;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

function arrayBufferToB64(buf: ArrayBuffer): string {
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Generate a new scan session id. */
export function newSessionId(): string {
  return `scan_${crypto.randomUUID()}`;
}

/** Generate a record id for an individual angle. */
export function newRecordId(): string {
  return `r_${crypto.randomUUID()}`;
}
