// /voice — phone call with KAI (T-035).
//
// Visual: glowing breathing orb, animated waveform tied to live mic
// amplitude (after user grants permission), session timer that caps
// at 10:00, "Tap to call" CTA.
//
// Eligibility: under-16 users blocked 11 PM–6 AM (server enforces;
// we also gate the button client-side for a clean UX).
//
// How calls actually happen: tapping "Call KAI" hits /api/voice/start
// which asks Bland to dial OUT to the user's phone. We show a
// "Connecting…" state while that happens. If Bland isn't configured
// yet (no BLAND_API_KEY), the server returns 503 and we show a
// "Voice isn't available yet" message.

import { ArrowLeft, Mic, Phone, PhoneOff, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { KaiOrb } from "../components/KaiOrb";
import { api } from "../lib/api";

type CallState =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "blocked"; message: string }
  | { phase: "needs_number" }
  | { phase: "dialing" }
  | { phase: "connected"; callId: string; startedAt: number }
  | { phase: "error"; message: string }
  | { phase: "unavailable"; message: string };

const SESSION_CAP_SEC = 10 * 60;

export function Voice() {
  const [state, setState] = useState<CallState>({ phase: "checking" });
  const [phone, setPhone] = useState("");
  const [micGranted, setMicGranted] = useState(false);
  const [amplitude, setAmplitude] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Eligibility check on mount.
  useEffect(() => {
    let cancelled = false;
    const localHour = new Date().getHours();
    api
      .getVoiceEligibility(localHour)
      .then((res) => {
        if (cancelled) return;
        if (res.allowed) {
          setState({ phase: "idle" });
        } else {
          setState({ phase: "blocked", message: res.message });
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Backend unreachable. Show idle but the call will fail.
        setState({ phase: "idle" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mic stream — for the waveform animation, NOT for sending audio
  // (the audio goes over the phone call, not over WebRTC here).
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  async function requestMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setMicGranted(true);
      tickAmplitude();
    } catch {
      // User denied or no mic — silently continue. The orb still
      // breathes; the waveform just stays flat.
      setMicGranted(false);
    }
  }

  function tickAmplitude() {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (const v of data) sum += v;
    setAmplitude(sum / data.length / 255);
    rafRef.current = requestAnimationFrame(tickAmplitude);
  }

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  // Session timer.
  useEffect(() => {
    if (state.phase !== "connected") return;
    const id = window.setInterval(() => {
      const sec = Math.floor((Date.now() - state.startedAt) / 1000);
      setElapsed(sec);
      if (sec >= SESSION_CAP_SEC) {
        setState({ phase: "idle" });
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state]);

  async function callKai() {
    if (!phone.trim()) {
      setState({ phase: "needs_number" });
      return;
    }
    // Normalize to E.164-ish.
    const normalized = phone.trim().startsWith("+")
      ? phone.trim()
      : `+1${phone.replace(/\D/g, "")}`;
    setState({ phase: "dialing" });
    try {
      const res = await api.startVoiceCall({
        toNumber: normalized,
        localHour: new Date().getHours(),
      });
      setState({
        phase: "connected",
        callId: res.callId,
        startedAt: Date.now(),
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error && /503/.test(err.message)
          ? "Voice mode isn't configured yet — Ratner needs to wire up the Bland AI account."
          : "Couldn't start the call. Try again in a minute.";
      setState({ phase: "unavailable", message: msg });
    }
  }

  function hangUp() {
    setState({ phase: "idle" });
    setElapsed(0);
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-md flex-col px-5 pt-2 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          voice
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {/* Orb + waveform */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full"
            aria-hidden="true"
            style={{
              boxShadow: `0 0 ${40 + amplitude * 80}px ${
                10 + amplitude * 20
              }px rgba(123, 110, 246, ${0.25 + amplitude * 0.4})`,
              transition: "box-shadow 80ms ease-out",
            }}
          />
          <KaiOrb size={160} />
        </div>
        <Waveform amplitude={amplitude} active={state.phase === "connected"} />

        {state.phase === "connected" && (
          <p className="font-mono text-2xl font-bold tabular-nums text-text-primary">
            {formatTime(elapsed)}
          </p>
        )}
      </div>

      {/* Control area */}
      <div className="flex flex-col gap-3 pb-5">
        {state.phase === "checking" && (
          <p className="text-center text-sm text-text-secondary">
            Checking eligibility…
          </p>
        )}

        {state.phase === "blocked" && (
          <BlockedCard message={state.message} />
        )}

        {(state.phase === "idle" ||
          state.phase === "needs_number" ||
          state.phase === "error" ||
          state.phase === "unavailable") && (
          <>
            <p className="text-center text-sm text-text-secondary">
              Call KAI for a 10-minute conversation. Mental health, physical
              coaching, or just whatever's on your mind.
            </p>

            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                your phone number
              </p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-555-0100"
                className="
                  w-full rounded-lg border border-glass-border bg-surface
                  px-4 py-3 text-base text-text-primary
                  placeholder:text-text-muted shadow-card focus-ring
                "
              />
            </div>

            <button
              type="button"
              onClick={callKai}
              className="
                flex h-12 w-full items-center justify-center gap-2 rounded-full
                bg-text-primary text-background font-medium
                shadow-card transition active:scale-[0.99] focus-ring
              "
            >
              <Phone size={16} aria-hidden="true" />
              Call KAI
            </button>

            {!micGranted && (
              <button
                type="button"
                onClick={requestMic}
                className="
                  inline-flex h-10 w-full items-center justify-center gap-1.5
                  rounded-full text-xs font-medium text-text-secondary
                  transition hover:bg-surface-muted focus-ring
                "
              >
                <Mic size={12} aria-hidden="true" /> Allow mic for waveform (optional)
              </button>
            )}

            {state.phase === "needs_number" && (
              <p className="text-center text-xs text-warning">
                Add your phone number first.
              </p>
            )}
            {(state.phase === "unavailable" || state.phase === "error") && (
              <p className="text-center text-xs text-text-secondary">
                {state.message}
              </p>
            )}
          </>
        )}

        {state.phase === "dialing" && (
          <p className="text-center text-sm text-text-secondary">
            Dialing… answer the incoming call from KAI.
          </p>
        )}

        {state.phase === "connected" && (
          <button
            type="button"
            onClick={hangUp}
            className="
              flex h-12 w-full items-center justify-center gap-2 rounded-full
              bg-danger text-background font-medium
              shadow-card transition active:scale-[0.99] focus-ring
            "
          >
            <PhoneOff size={16} aria-hidden="true" />
            End call
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────────────────

function Waveform({
  amplitude,
  active,
}: {
  amplitude: number;
  active: boolean;
}) {
  // 24 bars, height eased off amplitude with per-bar randomness.
  const bars = 24;
  const seed = Date.now() / 200;
  return (
    <div className="flex h-12 items-center gap-1">
      {Array.from({ length: bars }).map((_, i) => {
        const noise = 0.5 + 0.5 * Math.sin(seed + i * 0.7);
        const h = active ? Math.max(4, 6 + amplitude * 60 * noise) : 4;
        return (
          <span
            key={i}
            aria-hidden="true"
            className="w-1.5 rounded-full bg-accent-cool/70 transition-[height] duration-100"
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

function BlockedCard({ message }: { message: string }) {
  return (
    <div className="rounded-glass border border-glass-border bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2 pb-2">
        <ShieldCheck size={16} className="text-accent-cool" aria-hidden="true" />
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          night mode
        </p>
      </div>
      <p className="text-sm leading-relaxed text-text-primary">{message}</p>
      <Link
        to="/check-in"
        className="
          mt-3 inline-flex h-10 items-center justify-center rounded-full
          border border-glass-border bg-surface px-4 text-sm font-medium
          text-text-primary shadow-card focus-ring
        "
      >
        Try a check-in instead
      </Link>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
