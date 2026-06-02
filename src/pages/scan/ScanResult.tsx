// /scan/result/:sessionId — body scan analysis result (T-031).
//
// Per CLAUDE_v3_PATCH §3:
//   - Observations rendered as cards with an accentWarm left border
//   - Actions rendered as cards with a checkmark icon
//   - Privacy reminder on first view: "These are yours alone. Nobody else
//     can see them."
//   - Compare-over-time toggle for any 2 sessions (text observations
//     only — never side-by-side raw images without user request)

import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { KaiMessage } from "../../components/KaiMessage";
import { api } from "../../lib/api";

type Observation = { index: 1 | 2 | 3; text: string; action: string };
type ObservationRecord = {
  id: string;
  sessionId: string;
  observations: Observation[];
  summary: string;
  attempts: number;
  createdAt: string;
};

type LoadState =
  | { phase: "loading" }
  | { phase: "loaded"; record: ObservationRecord }
  | { phase: "pending" }
  | { phase: "error"; message: string };

const FIRST_VIEW_KEY = "kai_scan_first_view_v1";

export function ScanResult() {
  const params = useParams<{ sessionId: string }>();
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [showFirstViewReminder, setShowFirstViewReminder] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!params.sessionId) return;
      try {
        const res = await api.getScanObservation(params.sessionId);
        if (cancelled) return;
        if (res.observation) {
          setState({ phase: "loaded", record: res.observation });
        } else {
          setState({ phase: "pending" });
        }
      } catch {
        if (cancelled) return;
        // Worker unreachable — render pending state so the page is still useful.
        setState({ phase: "pending" });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.sessionId]);

  // First-view privacy reminder.
  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    if (!localStorage.getItem(FIRST_VIEW_KEY)) {
      setShowFirstViewReminder(true);
      localStorage.setItem(FIRST_VIEW_KEY, "1");
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/scan/history"
          aria-label="Back to scan history"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          scan result
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {showFirstViewReminder && (
        <div className="mb-4 rounded-glass border border-glass-border bg-accent-cool-soft px-4 py-3 shadow-card">
          <div className="flex items-start gap-2">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent-cool" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-text-primary">
              These are yours alone. Nobody else can see them.
            </p>
          </div>
        </div>
      )}

      {state.phase === "loading" && <LoadingCard />}
      {state.phase === "pending" && <PendingCard />}
      {state.phase === "loaded" && <ResultBody record={state.record} />}
      {state.phase === "error" && <ErrorCard message={state.message} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// States
// ─────────────────────────────────────────────────────────────────────

function LoadingCard() {
  return (
    <div className="flex flex-col items-center rounded-glass border border-glass-border bg-surface p-8 text-center shadow-card">
      <Loader2 size={20} className="animate-spin text-text-secondary" aria-hidden="true" />
      <p className="mt-3 text-sm text-text-secondary">Loading your read…</p>
    </div>
  );
}

function PendingCard() {
  return (
    <div className="flex flex-col items-center rounded-glass border border-glass-border bg-surface p-8 text-center shadow-card">
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        Not analyzed yet
      </h2>
      <p className="mt-2 max-w-xs text-sm text-text-secondary">
        Your scan was saved on this device. KAI'll analyze it once you're
        back online and signed in.
      </p>
      <Link
        to="/scan/history"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-glass-border bg-surface px-5 text-sm font-medium text-text-primary shadow-card focus-ring"
      >
        View history
      </Link>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center rounded-glass border border-warning-soft bg-warning-soft px-5 py-6 text-center shadow-card">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
        Try retaking
      </h2>
      <p className="mt-2 max-w-xs text-sm text-text-primary">{message}</p>
      <Link
        to="/scan"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-text-primary px-5 text-sm font-medium text-background shadow-card focus-ring"
      >
        Take new scan
      </Link>
    </div>
  );
}

function ResultBody({ record }: { record: ObservationRecord }) {
  return (
    <>
      <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
        Your read
      </h1>
      <p className="mt-2 text-sm text-text-secondary">{formatDate(record.createdAt)}</p>

      {/* Summary as a KaiMessage at top */}
      <div className="mt-4">
        <KaiMessage orbSize={32}>{record.summary}</KaiMessage>
      </div>

      {/* Observation cards — accentWarm left border per v3 §3 */}
      <section className="mt-6">
        <p className="mb-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          observations
        </p>
        <div className="space-y-3">
          {record.observations.map((o) => (
            <article
              key={o.index}
              className="
                rounded-glass border border-glass-border bg-surface
                border-l-4 border-l-accent-warm
                p-4 shadow-card
              "
            >
              <p className="text-sm leading-relaxed text-text-primary">{o.text}</p>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-success-soft p-3">
                <Check
                  size={14}
                  className="mt-0.5 shrink-0 text-success"
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-text-primary">{o.action}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-2">
        <Link
          to="/scan/history"
          className="
            flex h-12 w-full items-center justify-center gap-2 rounded-full
            border border-glass-border bg-surface text-text-primary font-medium
            shadow-card transition hover:bg-surface-muted focus-ring
          "
        >
          See all scans
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
        <Link
          to="/mobility"
          className="
            flex h-12 w-full items-center justify-center rounded-full
            bg-text-primary text-background font-medium
            shadow-card transition active:scale-[0.99] focus-ring
          "
        >
          Try a recovery routine
        </Link>
      </div>
    </>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
