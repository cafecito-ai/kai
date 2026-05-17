import { Check, MessageCircle, ShieldCheck, Sparkles, Trophy, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Session = Awaited<ReturnType<typeof api.getDemoSessions>>["sessions"][number];

const TRY_ICON: Record<string, typeof Trophy> = {
  win: Trophy,
  feelings: MessageCircle,
  fuel: UtensilsCrossed
};

export function OpsDemoSessions() {
  const [state, setState] = useState<"loading" | "ok" | "forbidden" | "error">("loading");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "named">("all");

  useEffect(() => {
    let cancelled = false;
    api
      .getDemoSessions()
      .then((result) => {
        if (cancelled) return;
        setSessions(result.sessions);
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

  const visible = useMemo(() => {
    if (filter === "completed") return sessions.filter((s) => Boolean(s.completedAt));
    if (filter === "named") return sessions.filter((s) => s.reviewerName || s.reviewerEmail);
    return sessions;
  }, [sessions, filter]);

  const totals = useMemo(() => {
    const completed = sessions.filter((s) => Boolean(s.completedAt)).length;
    const named = sessions.filter((s) => s.reviewerName || s.reviewerEmail).length;
    return { all: sessions.length, completed, named };
  }, [sessions]);

  if (state === "loading") return <p className="text-sm text-muted">Loading demo sessions…</p>;
  if (state === "forbidden") {
    return (
      <section className="mx-auto max-w-lg rounded-kai border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 grid size-12 place-items-center rounded-full bg-[#FFF1EB] text-coral">
          <ShieldCheck />
        </div>
        <p className="eyebrow">ops only</p>
        <h1 className="mt-2 font-display text-2xl font-black">Demo sessions require elevated access.</h1>
      </section>
    );
  }
  if (state === "error") return <p className="text-sm text-coral">Could not load sessions. Try again in a moment.</p>;

  return (
    <section className="space-y-5">
      <header className="rounded-kai border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-full bg-[#EEEAFF] text-plum">
            <Sparkles />
          </div>
          <div>
            <p className="eyebrow">ops</p>
            <h1 className="mt-1 font-display text-3xl font-black tracking-normal">Demo sessions</h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Every /demo walk-through, autosaved through the flow. Use this to read what a reviewer (Lev or
          anyone) actually said and tried instead of doing a sync call. Newest first, 100 most recent.
        </p>

        <div className="mt-4 grid gap-2 text-xs font-semibold uppercase tracking-wider text-muted sm:grid-cols-3">
          <StatCell label="Total" value={totals.all} />
          <StatCell label="Completed (reached Ship)" value={totals.completed} />
          <StatCell label="Self-identified" value={totals.named} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterChip label="Completed only" active={filter === "completed"} onClick={() => setFilter("completed")} />
          <FilterChip label="Self-identified only" active={filter === "named"} onClick={() => setFilter("named")} />
        </div>
      </header>

      <section className="rounded-kai border border-line bg-white p-2 shadow-sm sm:p-5">
        {visible.length === 0 ? (
          <p className="p-3 text-sm text-muted">
            {sessions.length === 0
              ? "No demo sessions captured yet. Walk through /demo once to seed."
              : "No sessions match this filter."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((s) => (
              <li key={s.sessionId}>
                <Link
                  to={`/ops/demo-sessions/${encodeURIComponent(s.sessionId)}`}
                  className="grid gap-2 py-3 transition hover:bg-paper sm:grid-cols-[1.4fr_1.4fr_1fr_auto] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      {s.reviewerName || (s.reviewerEmail ? s.reviewerEmail : <span className="text-muted">anonymous</span>)}
                    </p>
                    {s.reviewerEmail && s.reviewerName && (
                      <p className="truncate text-[11px] text-muted">{s.reviewerEmail}</p>
                    )}
                    <p className="truncate text-[11px] text-muted">
                      Kai{s.kaiName && s.kaiName !== "Kai" ? `: ${s.kaiName}` : ""}{" "}
                      {s.kaiTone && <span className="text-muted/80">· {s.kaiTone}</span>}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold text-muted">
                      {s.vibes.length > 0 ? s.vibes.slice(0, 4).join(" · ") : "no vibes"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.tried.length === 0 ? (
                        <span className="text-[10px] uppercase tracking-wider text-muted/70">no tries</span>
                      ) : (
                        s.tried.map((t) => {
                          const Icon = TRY_ICON[t] ?? Sparkles;
                          return (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1 rounded-full bg-[#EEEAFF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-plum"
                            >
                              <Icon size={10} /> {t}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted">
                    <p>act {s.lastAct}/6 · {actLabel(s.lastAct)}</p>
                    <p className="mt-1">updated {formatRelative(s.updatedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 justify-self-end">
                    {s.completedAt ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F4EC] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sage">
                        <Check size={12} /> shipped
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                        in progress
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-kai border border-line bg-paper p-3">
      <p>{label}</p>
      <p className="mt-1 font-display text-2xl font-black text-ink">{value}</p>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
        active ? "border-ink bg-ink text-paper" : "border-line bg-white text-muted hover:bg-paper"
      }`}
    >
      {label}
    </button>
  );
}

function actLabel(n: number): string {
  return ["meet", "read", "chat", "try", "build", "ship"][n - 1] ?? "?";
}

function formatRelative(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, Math.round((now - then) / 1000));
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
