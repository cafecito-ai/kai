// ThenVsNowCard — a "who you were when you started vs now" reflection on the
// Progress tab. Anchors the numbers to the emotional why (the origin story) so
// progress reads as identity, not a scoreboard. Device-local.

import { ArrowRight } from "lucide-react";

import { daysBuilding, getOriginStory } from "../../lib/local-identity";
import { computeLocalScore, readLocalInputs } from "../../lib/local-score";
import { daysBetween, parseLocalDate } from "../../lib/dates";

function fmt(dateKey: string | null): string {
  if (!dateKey) return "";
  const d = parseLocalDate(dateKey);
  if (!d) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ThenVsNowCard() {
  const inputs = readLocalInputs();
  const origin = getOriginStory();

  let earliest: string | null = null;
  let latest: string | null = null;
  for (const i of inputs) {
    if (!earliest || i.date < earliest) earliest = i.date;
    if (!latest || i.date > latest) latest = i.date;
  }

  // Show once there's something to reflect on: an origin story, or a real span
  // of history (≥7 days from first to last activity).
  const span =
    earliest && latest
      ? daysBetween(parseLocalDate(earliest)!, parseLocalDate(latest)!)
      : 0;
  if (!origin && span < 7) return null;

  const days = daysBuilding();
  const total = inputs.length;
  const streak = computeLocalScore(inputs).streak;

  return (
    <section className="mb-4 rounded-glass border border-glass-border bg-surface p-5 shadow-card">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        Then → now
      </p>

      {origin && (
        <p className="mt-3 border-l-2 border-accent-soft pl-3 text-sm italic leading-relaxed text-text-secondary">
          “{origin}”
        </p>
      )}

      <div className="mt-4 flex items-stretch gap-3">
        <div className="flex-1 rounded-lg border border-glass-border bg-surface-muted/40 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Then</p>
          <p className="mt-1 font-display text-lg font-semibold text-text-primary">Day 1</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {earliest ? `started ${fmt(earliest)}` : "you showed up"}
          </p>
        </div>

        <div className="flex items-center text-text-muted">
          <ArrowRight size={16} aria-hidden="true" />
        </div>

        <div className="flex-1 rounded-lg border border-glass-border bg-surface-muted/40 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Now</p>
          <p className="mt-1 font-display text-lg font-semibold text-text-primary">Day {days}</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            {total} logged{streak > 0 ? ` · ${streak}-day streak` : ""}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-text-primary">You're not who you were.</p>
    </section>
  );
}
