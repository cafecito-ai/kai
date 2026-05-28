import { ArrowLeft, Lock, Save, Trash2, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { KaiOrb } from "../components/KaiOrb";
import { analyzeDayZero } from "../lib/day-zero-analysis";
import { readDayZeroMeta, type DayZeroMeta } from "../lib/day-zero";
import {
  clearJourneyReflection,
  JOURNEY_MILESTONES,
  readJourneyReflections,
  saveJourneyReflection,
  type JourneyMilestone,
  type JourneyReflection,
} from "../lib/journey-reflections";
import { loadLocalOnboardingProfile } from "../lib/onboarding-profile";

export function Journey() {
  const [dayZero, setDayZero] = useState<DayZeroMeta | null>(() => readDayZeroMeta());
  const [reflections, setReflections] = useState<JourneyReflection[]>(() =>
    readJourneyReflections(),
  );
  const [profile, setProfile] = useState(() => loadLocalOnboardingProfile());

  useEffect(() => {
    function refresh() {
      setDayZero(readDayZeroMeta());
      setReflections(readJourneyReflections());
      setProfile(loadLocalOnboardingProfile());
    }
    window.addEventListener("kai:day-zero-changed", refresh);
    window.addEventListener("kai:journey-changed", refresh);
    return () => {
      window.removeEventListener("kai:day-zero-changed", refresh);
      window.removeEventListener("kai:journey-changed", refresh);
    };
  }, []);

  const byMilestone = useMemo(() => {
    return new Map(reflections.map((item) => [item.milestone, item]));
  }, [reflections]);
  const analysis = useMemo(() => analyzeDayZero(dayZero, profile), [dayZero, profile]);

  return (
    <div className="mx-auto min-h-[calc(100vh-2rem)] w-full max-w-md px-5 pb-8 pt-2 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to="/home"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          journey
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <section className="pt-4 text-center">
        <KaiOrb size={96} />
        <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight">
          Your timeline.
        </h1>
        <p className="mx-auto mt-3 max-w-[300px] text-sm leading-relaxed text-text-secondary">
          Private checkpoints for the person you're becoming.
        </p>
      </section>

      <div className="mt-8 space-y-3">
        {analysis && <DayZeroAnalysisCard analysis={analysis} />}
        {JOURNEY_MILESTONES.map((milestone) => (
          <MilestoneCard
            key={milestone}
            milestone={milestone}
            dayZero={milestone === 0 ? dayZero : null}
            reflection={byMilestone.get(milestone)}
          />
        ))}
      </div>
    </div>
  );
}

function DayZeroAnalysisCard({
  analysis,
}: {
  analysis: NonNullable<ReturnType<typeof analyzeDayZero>>;
}) {
  return (
    <section className="rounded-2xl border border-accent-cool/25 bg-accent-cool-soft/40 p-4 shadow-card">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent-cool">
        KAI's read
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold leading-tight">
        {analysis.coreMission}
      </h2>
      <p className="mt-2 text-sm text-text-secondary">
        Identity: <span className="font-medium text-text-primary">{analysis.desiredIdentity}</span>
      </p>
      <div className="mt-4 grid gap-3">
        <MiniList title="Likely friction" items={analysis.likelyStruggles} />
        <MiniList title="Habits to build" items={analysis.habitsToBuild} />
        <MiniList title="Home priorities" items={analysis.homePriorities} />
      </div>
    </section>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        {title}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-surface px-2.5 py-1 text-xs text-text-secondary">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({
  milestone,
  dayZero,
  reflection,
}: {
  milestone: JourneyMilestone;
  dayZero: DayZeroMeta | null;
  reflection?: JourneyReflection;
}) {
  const [draft, setDraft] = useState(reflection?.text ?? "");
  const isDayZero = milestone === 0;

  useEffect(() => {
    setDraft(reflection?.text ?? "");
  }, [reflection?.text]);

  function save() {
    saveJourneyReflection(milestone, draft);
  }

  function remove() {
    clearJourneyReflection(milestone);
  }

  return (
    <section className="rounded-2xl border border-glass-border bg-surface p-4 shadow-card">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
          {isDayZero ? <Video size={18} /> : <span className="font-mono text-xs font-semibold">{milestone}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-text-muted" />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              Day {milestone} · private
            </p>
          </div>
          <h2 className="mt-1 font-display text-xl font-semibold leading-tight">
            {titleForMilestone(milestone)}
          </h2>
          {isDayZero && dayZero ? (
            <p className="mt-1 text-xs text-text-secondary">
              Recorded {relativeDay(dayZero.createdAt)}
              {dayZero.quote ? ` · "${dayZero.quote}"` : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-text-secondary">
              {promptForMilestone(milestone)}
            </p>
          )}
        </div>
      </div>

      {!isDayZero && (
        <div className="mt-4 space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Talk to your future self."
            className="w-full resize-none rounded-lg border border-glass-border bg-background px-3 py-3 text-sm text-text-primary placeholder:text-text-muted shadow-card focus-ring"
          />
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-[10px] text-text-muted">
              {draft.length}/1000
            </p>
            <div className="flex gap-2">
              {reflection && (
                <button
                  type="button"
                  onClick={remove}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-glass-border px-3 text-xs font-medium text-text-secondary transition hover:bg-surface-muted focus-ring"
                >
                  <Trash2 size={13} aria-hidden="true" /> Delete
                </button>
              )}
              <button
                type="button"
                onClick={save}
                disabled={!draft.trim()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-text-primary px-3 text-xs font-medium text-background transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-text-soft focus-ring"
              >
                <Save size={13} aria-hidden="true" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function titleForMilestone(milestone: JourneyMilestone): string {
  if (milestone === 0) return "The first honest read";
  if (milestone === 30) return "First proof";
  if (milestone === 90) return "Identity check";
  return "One-year proof";
}

function promptForMilestone(milestone: JourneyMilestone): string {
  if (milestone === 30) return "What changed first?";
  if (milestone === 90) return "Who are you becoming when nobody is watching?";
  return "What would Day 0 you not believe yet?";
}

function relativeDay(createdAt: string): string {
  const delta = Date.now() - new Date(createdAt).getTime();
  const days = Math.max(0, Math.floor(delta / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
