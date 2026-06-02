// /scan/capture — 3-photo capture flow (T-028).
//
// Walks user through front → side → back. Each step:
//   1. Show silhouette overlay (white outline 40% opacity, neutral)
//   2. User taps "Take photo" → file picker with capture=environment
//   3. We encrypt the image client-side (scan-storage.ts)
//   4. Save encrypted blob, advance to next angle
//
// On completing all three, navigate to /scan/history.
//
// AI vision is NOT wired here. Phase E (T-030) plugs that in.

import { ArrowLeft, Camera, Check, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { SilhouetteOverlay } from "../../components/scan/SilhouetteOverlay";
import { api } from "../../lib/api";
import {
  decryptImage,
  encryptImage,
  listScans,
  newRecordId,
  newSessionId,
  saveScan,
  type ScanAngle,
} from "../../lib/scan-storage";

const ANGLES: Array<{ angle: ScanAngle; label: string; instruction: string }> = [
  {
    angle: "front",
    label: "Front",
    instruction: "Stand facing the camera. Arms relaxed at your sides. Phone roughly chest height.",
  },
  {
    angle: "side",
    label: "Side",
    instruction: "Turn 90°. Same neutral posture. Either side is fine.",
  },
  {
    angle: "back",
    label: "Back",
    instruction: "Turn 90° again — back to camera now. Relax your shoulders.",
  },
];

export function ScanCapture() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  // Persist the session id across the three captures.
  const sessionIdRef = useRef<string>(newSessionId());
  // SCAFFOLD: per the storage module, the userSecret is currently just
  // a stable per-device id. Phase E will replace this. For the scaffold
  // we read it from localStorage so the same key encrypts + decrypts
  // across page navigations.
  const userSecretRef = useRef<string>(getOrCreateDeviceSecret());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = ANGLES[idx];
  const isLast = idx === ANGLES.length - 1;

  async function handleFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const bytes = await file.arrayBuffer();
      const { ciphertextB64, ivB64 } = await encryptImage(
        bytes,
        userSecretRef.current,
      );
      saveScan({
        id: newRecordId(),
        sessionId: sessionIdRef.current,
        angle: step.angle,
        capturedAt: new Date().toISOString(),
        ciphertextB64,
        ivB64,
        mime: file.type || "image/jpeg",
      });
      if (isLast) {
        // T-030 — Trigger vision analysis. Best-effort: if it fails
        // (no AI binding, network), we still navigate to history. The
        // observations will be re-computable on demand from history.
        analyzeAndNavigate();
      } else {
        setIdx(idx + 1);
      }
    } catch {
      setError("Couldn't save that photo — try once more.");
      setBusy(false);
    }
  }

  async function analyzeAndNavigate() {
    setBusy(true);
    try {
      const sessionId = sessionIdRef.current;
      const sessionScans = listScans().filter((s) => s.sessionId === sessionId);
      const byAngle = (a: ScanAngle) => sessionScans.find((s) => s.angle === a);
      const fr = byAngle("front");
      const si = byAngle("side");
      const ba = byAngle("back");
      if (!fr || !si || !ba) {
        navigate(`/scan/result/${sessionId}`);
        return;
      }
      // Decrypt all three in memory only; send to Worker for vision.
      const [front, side, back] = await Promise.all([
        decryptImage(fr, userSecretRef.current),
        decryptImage(si, userSecretRef.current),
        decryptImage(ba, userSecretRef.current),
      ]);
      try {
        await api.analyzeScan({ sessionId, front, side, back });
      } catch {
        // Worker unreachable or AI not configured — skip silently and
        // let the result page render a "not yet analyzed" state.
      }
      navigate(`/scan/result/${sessionId}`);
    } catch {
      // Analysis path itself broke — fall back to history.
      navigate("/scan/history");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-md flex-col px-5 pt-2 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/scan"
          aria-label="Back to scan welcome"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          scan {idx + 1} of 3 · {step.label.toLowerCase()}
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {/* Progress dots */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {ANGLES.map((a, i) => (
          <span
            key={a.angle}
            className={`h-1.5 w-8 rounded-full transition-colors ${
              i < idx ? "bg-success" : i === idx ? "bg-text-primary" : "bg-surface-muted"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Silhouette card */}
      <div className="relative mb-5 flex flex-1 flex-col items-center justify-center rounded-glass border border-glass-border bg-gradient-to-b from-surface to-surface-muted/40 p-4 shadow-card">
        <p className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
          framing guide
        </p>
        <SilhouetteOverlay angle={step.angle} className="h-full max-h-[60vh] w-auto" />
      </div>

      <div className="pb-5">
        <p className="font-display text-xl font-semibold leading-tight tracking-tight">
          {step.label} view
        </p>
        <p className="mt-1 text-sm text-text-secondary">{step.instruction}</p>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-warning-soft bg-warning-soft px-3 py-2 text-sm text-warning">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
        className="
          flex h-12 w-full items-center justify-center gap-2 rounded-full
          bg-text-primary text-background font-medium
          shadow-card transition active:scale-[0.99]
          disabled:cursor-not-allowed disabled:bg-text-soft
          focus-ring
        "
      >
        {busy ? (
          "Saving…"
        ) : isLast ? (
          <>
            <Check size={16} aria-hidden="true" />
            Take {step.label.toLowerCase()} & finish
          </>
        ) : (
          <>
            <Camera size={16} aria-hidden="true" />
            Take {step.label.toLowerCase()} photo
            <ChevronRight size={16} aria-hidden="true" />
          </>
        )}
      </button>
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        photo is encrypted before save
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Scaffold-only: per-device "secret" so encrypt + decrypt round-trip.
// Phase E replaces this with a proper passphrase or wrapped key.
// ─────────────────────────────────────────────────────────────────────

const DEVICE_SECRET_KEY = "kai_scan_device_secret_v1";

function getOrCreateDeviceSecret(): string {
  if (typeof localStorage === "undefined") {
    return "fallback-no-storage";
  }
  let existing = localStorage.getItem(DEVICE_SECRET_KEY);
  if (!existing) {
    existing = crypto.randomUUID();
    try {
      localStorage.setItem(DEVICE_SECRET_KEY, existing);
    } catch {
      /* ignore */
    }
  }
  return existing;
}
