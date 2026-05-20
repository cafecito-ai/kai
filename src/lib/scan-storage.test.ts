// T-028 — scan storage scaffold tests.
//
// Critical invariants for the scaffold:
//   - Encrypt then decrypt round-trips the original bytes
//   - Different IVs produce different ciphertexts for the same plaintext
//   - Save → list → delete works
//   - Rate limit fires at 3+ sessions in last 7 days
//   - listScanSessions groups records by sessionId
//
// NOTE: WebCrypto requires a secure-context-shaped global crypto.subtle.
// Vitest's happy-dom / jsdom provides one on `crypto` — we just need
// localStorage shimmed.

import { beforeEach, describe, expect, it } from "vitest";
import {
  canStartNewScanSession,
  decryptImage,
  decryptImageBytes,
  deleteScan,
  deleteScanSession,
  encryptImage,
  listScans,
  listScanSessions,
  newRecordId,
  newSessionId,
  saveScan,
  sessionsInLastSevenDays,
  type EncryptedScanRecord,
  type ScanAngle,
} from "./scan-storage";

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => { memory.set(k, v); },
    removeItem: (k: string) => { memory.delete(k); },
    clear: () => memory.clear(),
    key: (i: number) => Array.from(memory.keys())[i] ?? null,
    get length() { return memory.size; },
  } as unknown as Storage;
});

function bytes(): ArrayBuffer {
  // Synthetic 8-byte "image" — content doesn't matter for round-trip test.
  const arr = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  return arr.buffer;
}

function makeRecord(
  partial: Partial<EncryptedScanRecord> & {
    sessionId: string;
    angle: ScanAngle;
    capturedAt?: string;
  },
): EncryptedScanRecord {
  return {
    id: partial.id ?? newRecordId(),
    sessionId: partial.sessionId,
    angle: partial.angle,
    capturedAt: partial.capturedAt ?? new Date().toISOString(),
    ciphertextB64: partial.ciphertextB64 ?? "AAAA",
    ivB64: partial.ivB64 ?? "BBBB",
    mime: partial.mime ?? "image/jpeg",
  };
}

describe("encryptImage / decryptImage", () => {
  it("round-trips plaintext bytes", async () => {
    const original = bytes();
    const { ciphertextB64, ivB64 } = await encryptImage(original, "user-1");
    const record: EncryptedScanRecord = makeRecord({
      sessionId: "s1",
      angle: "front",
      ciphertextB64,
      ivB64,
      mime: "image/jpeg",
    });
    // Use the raw-bytes path — happy-dom's Blob has issues with binary
    // round-trips, but decryptImageBytes returns the ArrayBuffer directly.
    const restored = new Uint8Array(await decryptImageBytes(record, "user-1"));
    expect(Array.from(restored)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // And verify the Blob path still produces a Blob (just don't trust
    // happy-dom's binary fidelity on it).
    const blob = await decryptImage(record, "user-1");
    expect(blob.type).toBe("image/jpeg");
  });

  it("uses a fresh IV per encrypt — same plaintext → different ciphertexts", async () => {
    const a = await encryptImage(bytes(), "user-1");
    const b = await encryptImage(bytes(), "user-1");
    expect(a.ivB64).not.toBe(b.ivB64);
    expect(a.ciphertextB64).not.toBe(b.ciphertextB64);
  });

  it("decryption fails with wrong user secret", async () => {
    const { ciphertextB64, ivB64 } = await encryptImage(bytes(), "user-1");
    const record = makeRecord({
      sessionId: "s1",
      angle: "front",
      ciphertextB64,
      ivB64,
    });
    await expect(decryptImage(record, "user-2")).rejects.toBeTruthy();
  });
});

describe("saveScan / listScans / delete", () => {
  it("save + list returns what was saved", () => {
    saveScan(makeRecord({ sessionId: "s1", angle: "front" }));
    expect(listScans()).toHaveLength(1);
  });

  it("deleteScan removes by id", () => {
    const r = makeRecord({ sessionId: "s1", angle: "front" });
    saveScan(r);
    deleteScan(r.id);
    expect(listScans()).toHaveLength(0);
  });

  it("deleteScanSession removes all angles", () => {
    saveScan(makeRecord({ sessionId: "s1", angle: "front" }));
    saveScan(makeRecord({ sessionId: "s1", angle: "side" }));
    saveScan(makeRecord({ sessionId: "s1", angle: "back" }));
    saveScan(makeRecord({ sessionId: "s2", angle: "front" }));
    deleteScanSession("s1");
    expect(listScans()).toHaveLength(1);
    expect(listScans()[0].sessionId).toBe("s2");
  });

  it("listScanSessions groups by sessionId", () => {
    saveScan(makeRecord({ sessionId: "s1", angle: "front" }));
    saveScan(makeRecord({ sessionId: "s1", angle: "side" }));
    saveScan(makeRecord({ sessionId: "s2", angle: "front" }));
    const sessions = listScanSessions();
    expect(sessions).toHaveLength(2);
    const s1 = sessions.find((s) => s.sessionId === "s1")!;
    expect(s1.scans).toHaveLength(2);
  });
});

describe("rate limit", () => {
  function sessionAt(daysAgo: number, id: string) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    saveScan(
      makeRecord({
        sessionId: id,
        angle: "front",
        capturedAt: d.toISOString(),
      }),
    );
  }

  it("allows scans when under 3 sessions in last 7 days", () => {
    expect(canStartNewScanSession()).toBe(true);
    sessionAt(0, "s1");
    expect(canStartNewScanSession()).toBe(true);
    sessionAt(2, "s2");
    expect(canStartNewScanSession()).toBe(true);
  });

  it("blocks at 3 sessions in last 7 days", () => {
    sessionAt(0, "s1");
    sessionAt(2, "s2");
    sessionAt(5, "s3");
    expect(sessionsInLastSevenDays()).toBe(3);
    expect(canStartNewScanSession()).toBe(false);
  });

  it("does not count sessions older than 7 days", () => {
    sessionAt(10, "s1");
    sessionAt(11, "s2");
    sessionAt(12, "s3");
    expect(canStartNewScanSession()).toBe(true);
  });
});

describe("id helpers", () => {
  it("newSessionId and newRecordId are unique enough", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(newSessionId());
      ids.add(newRecordId());
    }
    expect(ids.size).toBe(2000);
  });
});
