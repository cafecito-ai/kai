import { useUser } from "@clerk/clerk-react";
import { CalendarDays, Lock, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clearKey, loadJSON, saveJSON } from "../../lib/local-storage";
import { Button } from "../ui/Button";
import {
  computePhase,
  PHASE_NOTES,
  todayIso,
  validatePeriodStart,
  type PeriodEntry
} from "../../lib/cycle";

const STORAGE_KEY = "kai.cycle.entries.v1";
const OPT_IN_KEY = "kai.cycle.opted_in.v1";

type Props = {
  /** Called when the teen logs a new period start. Light-touch — payload
   *  carries only the date, never the cycle stats. Unused inside the
   *  guide-page mount; kept for possible reuse elsewhere. */
  onLogPeriod?: (input: { startDate: string }) => void;
};

/**
 * Opt-in menstrual cycle tracker. Stores all entries in localStorage —
 * NEVER sent to the Worker. Sensitive minor health data; legal/privacy
 * review (D6) is required before any server-side storage is added.
 *
 * Storage is namespaced by the signed-in user (Codex P1): on shared
 * browsers (school computers, family iPads), entries are scoped to the
 * Clerk user id and never leak between accounts.
 *
 * All date math uses LOCAL time (Codex P2): the day-of-cycle ticks at
 * local midnight, not UTC midnight.
 *
 * Voice:
 * - Frame as "if you have a cycle" — usable by anyone with a cycle
 *   regardless of gender. Not assumed for every teen.
 * - Acknowledge irregularity explicitly; don't fearmonger about
 *   "late" cycles, which are normal in teen years.
 * - No ovulation/fertility prediction — irresponsible for teens.
 * - PMS is real and not a personal failing.
 */
export function CycleTracker({ onLogPeriod }: Props) {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [optedIn, setOptedIn] = useState<boolean>(false);
  const [entries, setEntries] = useState<PeriodEntry[]>([]);
  const [draftStart, setDraftStart] = useState<string>(todayIso());
  const [validationError, setValidationError] = useState<string | null>(null);

  // Re-load whenever the signed-in user changes — keeps separate teens
  // from seeing each other's data on a shared browser.
  useEffect(() => {
    const optInFlag = loadJSON<boolean>(OPT_IN_KEY, userId, false);
    setOptedIn(optInFlag === true);
    const stored = loadJSON<PeriodEntry[]>(STORAGE_KEY, userId, []);
    setEntries(Array.isArray(stored) ? stored : []);
  }, [userId]);

  function save(next: PeriodEntry[]) {
    setEntries(next);
    saveJSON(STORAGE_KEY, userId, next);
  }

  function optIn() {
    saveJSON(OPT_IN_KEY, userId, true);
    setOptedIn(true);
  }

  function logStart() {
    const validated = validatePeriodStart(draftStart);
    if (!validated) {
      setValidationError("Pick a real date (today or earlier).");
      return;
    }
    setValidationError(null);
    const next = [...entries, { startDate: validated }];
    save(next);
    onLogPeriod?.({ startDate: validated });
    setDraftStart(todayIso());
  }

  function clearAll() {
    clearKey(STORAGE_KEY, userId);
    clearKey(OPT_IN_KEY, userId);
    setOptedIn(false);
    setEntries([]);
    setValidationError(null);
  }

  const phaseInfo = useMemo(() => computePhase(entries), [entries]);

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <CalendarDays />
      </div>
      <p className="eyebrow">cycle tracker</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">If you have a cycle, the pattern is useful.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Optional. Lives on this device only — never sent anywhere. Use it to spot patterns in energy and mood across the month.
      </p>

      {!optedIn ? (
        <div className="mt-4 rounded-kai border border-line bg-paper p-4">
          <div className="mb-3 grid size-10 place-items-center rounded-full bg-white text-muted">
            <Lock size={18} aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold">Why this is optional and on-device only</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
            <li>• Period data is sensitive. We don't store it on Kai's servers in v1.</li>
            <li>• Clearing this surface or signing out wipes the data.</li>
            <li>• We don't predict ovulation or fertility windows — that's not what this is for.</li>
            <li>• Irregular cycles are normal, especially in the first years after they start.</li>
          </ul>
          <div className="mt-4">
            <Button onClick={optIn}>Turn this on for me</Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-kai border border-sage/30 bg-lime p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-sage">Current phase</p>
            <p className="mt-1 font-display text-2xl font-black tracking-normal">
              {PHASE_NOTES[phaseInfo.phase].label}
              {phaseInfo.dayOfCycle ? ` · day ${phaseInfo.dayOfCycle}` : ""}
            </p>
            <p className="mt-2 text-sm leading-6 text-ink">{PHASE_NOTES[phaseInfo.phase].energyNote}</p>
            {phaseInfo.averageCycleLength && (
              <p className="mt-2 text-xs text-muted">
                Your average cycle length so far: {phaseInfo.averageCycleLength} days. Teen-typical range is roughly 21-45 days.
              </p>
            )}
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">Log a period start</legend>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label htmlFor="cycle-start-date" className="sr-only">
                Period start date
              </label>
              <input
                id="cycle-start-date"
                type="date"
                className="field"
                value={draftStart}
                max={todayIso()}
                onChange={(event) => setDraftStart(event.target.value)}
              />
              <Button onClick={logStart}>Save start</Button>
            </div>
            {validationError && (
              <p className="mt-2 text-xs text-coral" role="alert">
                {validationError}
              </p>
            )}
          </fieldset>

          {/* Codex P2 fix: the opt-out / wipe affordance used to be inside
              `<details>` that only rendered when entries.length > 0. After
              opting in, before logging anything, there was no way back. */}
          <details className="mt-5 rounded-kai border border-line bg-paper p-3" open={entries.length === 0}>
            <summary className="cursor-pointer text-sm font-semibold">
              {entries.length > 0 ? `Recent entries (${entries.length})` : "Manage this tracker"}
            </summary>
            {entries.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {[...entries]
                  .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
                  .slice(0, 6)
                  .map((entry) => (
                    <li key={entry.startDate} className="rounded-kai bg-white px-3 py-1.5">
                      Start: {entry.startDate}
                    </li>
                  ))}
              </ul>
            )}
            <button
              type="button"
              onClick={clearAll}
              className="focus-ring mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-coral underline"
            >
              <Trash2 size={12} aria-hidden="true" />{" "}
              {entries.length > 0
                ? "Wipe all entries (and opt back out)"
                : "Opt back out of this tracker"}
            </button>
          </details>
        </>
      )}
    </section>
  );
}
