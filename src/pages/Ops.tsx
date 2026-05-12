import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

type SafetyEvent = Awaited<ReturnType<typeof api.getSafetyEvents>>["events"][number];

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function Ops() {
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "error">("loading");
  const [events, setEvents] = useState<SafetyEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .getSafetyEvents()
      .then((result) => {
        if (cancelled) return;
        const sorted = [...result.events].sort((a, b) => {
          const sevDelta = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
          if (sevDelta !== 0) return sevDelta;
          return a.createdAt > b.createdAt ? -1 : 1;
        });
        setEvents(sorted);
        setState("ok");
      })
      .catch((err: Error) => {
        if (cancelled) return;
        if (err.message.includes("403")) setState("forbidden");
        else setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return <p className="text-sm text-muted">Loading safety events…</p>;
  }

  if (state === "forbidden") {
    return (
      <section className="mx-auto max-w-lg rounded-kai border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 grid size-12 place-items-center rounded-full bg-[#FFF1EB] text-coral">
          <ShieldCheck />
        </div>
        <p className="eyebrow">ops only</p>
        <h1 className="mt-2 font-display text-2xl font-black">Ops dashboard requires elevated access.</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Sign in as an ops user (Clerk org admin or metadata role `ops`) to view safety events. Staging accepts an `x-dev-user`
          fallback.
        </p>
      </section>
    );
  }

  if (state === "error") {
    return <p className="text-sm text-coral">Could not load safety events. Try again in a moment.</p>;
  }

  return (
    <section className="space-y-5">
      <header className="rounded-kai border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-[#FFF1EB] text-coral">
            <AlertTriangle />
          </div>
          <div>
            <p className="eyebrow">ops</p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-normal">Safety events</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Most recent 100 flagged messages, ordered by severity then time. Raw teen text is never stored — only redacted excerpts. Use
          this view to spot patterns and confirm parent notifications fired correctly.
        </p>
        <SummaryBar events={events} />
      </header>

      <section className="rounded-kai border border-line bg-white p-2 shadow-sm sm:p-5">
        {events.length === 0 ? (
          <p className="p-3 text-sm text-muted">No safety events logged. Good week.</p>
        ) : (
          <ul className="divide-y divide-line">
            {events.map((event) => (
              <li key={event.id} className="grid gap-2 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <SeverityBadge severity={event.severity} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{event.category.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted">
                    user {event.userId.slice(0, 8)}… · {formatRelative(event.createdAt)} · conv {event.conversationId ? event.conversationId.slice(0, 8) : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.parentNotified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F4EC] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sage">
                      <CheckCircle2 size={12} /> parent
                    </span>
                  ) : null}
                  {event.reviewedByOps ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EEEAFF] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-plum">
                      reviewed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF1EB] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-coral">
                      open
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function SummaryBar({ events }: { events: SafetyEvent[] }) {
  const buckets = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const event of events) {
    if (event.severity in buckets) buckets[event.severity as keyof typeof buckets]++;
  }
  const total = events.length;
  return (
    <div className="mt-4 grid gap-2 text-xs font-semibold uppercase tracking-wider text-muted sm:grid-cols-4">
      <SummaryCell label="Total" value={total} />
      <SummaryCell label="Critical" value={buckets.critical} tone="coral" />
      <SummaryCell label="High" value={buckets.high} />
      <SummaryCell label="Med + Low" value={buckets.medium + buckets.low} />
    </div>
  );
}

function SummaryCell({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const toneClass = tone === "coral" ? "text-coral" : "text-ink";
  return (
    <div className="rounded-kai border border-line bg-paper p-3">
      <p>{label}</p>
      <p className={`mt-1 font-display text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const cls =
    severity === "critical"
      ? "bg-coral text-white"
      : severity === "high"
        ? "bg-[#FFE0D6] text-coral"
        : severity === "medium"
          ? "bg-[#FFF1EB] text-coral"
          : "bg-paper text-muted";
  return (
    <span className={`inline-block min-w-[68px] rounded-full px-2 py-0.5 text-center text-[11px] font-bold uppercase tracking-wider ${cls}`}>
      {severity}
    </span>
  );
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
