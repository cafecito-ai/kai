import { useUser } from "@clerk/clerk-react";
import { Droplets, Minus, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { loadJSON, saveJSON } from "../../lib/local-storage";
import { scrubProgressEvent } from "../../lib/sensitive-events";
import { useProgressStore } from "../../stores/progressStore";
import { Button } from "../ui/Button";
import {
  cueFor,
  DAILY_CUP_FLOOR,
  incrementCups,
  resetIfNewDay,
  todayIso,
  type HydrationToday
} from "../../lib/hydration";

const STORAGE_KEY = "kai.hydration.today.v1";

type Props = {
  /** Called when a new cup is added (not when removed). Only fires once
   *  per local day to avoid tap-spam farming. If omitted, the component
   *  logs the soft progress event directly via the progress store. */
  onCupLogged?: (input: { cups: number }) => void;
};

/**
 * Daily cup-tap hydration tracker. Local-only — namespaced by signed-in
 * user (Codex P1). Auto-resets at the local-day boundary, both on mount
 * AND on each bump (Codex P2: previously the reset only ran in the mount
 * effect, so a session left open past midnight would re-increment
 * yesterday's count).
 *
 * Surface stays small: 2 buttons + a number + a soft cue. No streaks,
 * no "you failed", no badges. The point is the nudge to sip, not the
 * tracking-as-game.
 */
export function HydrationTracker({ onCupLogged }: Props) {
  const { user } = useUser();
  const userId = user?.id ?? null;
  const addEvent = useProgressStore((state) => state.addEvent);

  const [state, setState] = useState<HydrationToday>({ dateIso: todayIso(), cups: 0 });

  // Re-load on userId change (shared browsers between teens).
  useEffect(() => {
    const stored = loadJSON<HydrationToday | null>(STORAGE_KEY, userId, null);
    const reset = resetIfNewDay(stored);
    setState(reset);
    if (stored && stored.dateIso !== reset.dateIso) {
      saveJSON(STORAGE_KEY, userId, reset);
    }
  }, [userId]);

  function persist(next: HydrationToday) {
    setState(next);
    saveJSON(STORAGE_KEY, userId, next);
  }

  function bump(delta: number) {
    // Day-boundary reset applied on every interaction, not just mount.
    const baseline = resetIfNewDay(state);
    const next = incrementCups(baseline, delta);

    let withFirstCupFlag = next;
    if (delta > 0 && next.cups > baseline.cups) {
      // First positive bump of the day — emit the soft "first cup" event
      // but only once per local day (Codex P2 fix: decrementing back to
      // zero and re-incrementing used to refire).
      const todayKey = next.dateIso;
      if (state.firstCupLoggedFor !== todayKey && baseline.firstCupLoggedFor !== todayKey) {
        if (onCupLogged) {
          onCupLogged({ cups: next.cups });
        } else {
          addEvent(
            scrubProgressEvent({
              engine: "physical" as const,
              eventType: "hydration_first_cup",
              eventValue: 4,
              payload: { cups: next.cups }
            })
          );
        }
        withFirstCupFlag = { ...next, firstCupLoggedFor: todayKey };
      }
    }
    persist(withFirstCupFlag);
  }

  function resetToday() {
    persist({ dateIso: todayIso(), cups: 0 });
  }

  const cue = cueFor(state.cups);
  const progressPct = Math.min(100, Math.round((state.cups / DAILY_CUP_FLOOR) * 100));

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-lime text-sage">
        <Droplets />
      </div>
      <p className="eyebrow">hydration</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">A nudge to sip.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Tap once for each ~8oz cup or water bottle. Pee color is the real signal, not a number — this is here so you remember to drink.
      </p>

      <div className="mt-5 flex flex-col items-center gap-3">
        <p className="font-display text-6xl font-black text-sage tabular-nums" aria-live="polite">
          {state.cups}
        </p>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">cups today</p>

        <div className="h-2 w-full max-w-sm rounded-full bg-paper" role="progressbar" aria-valuenow={state.cups} aria-valuemin={0} aria-valuemax={DAILY_CUP_FLOOR}>
          <div
            className="h-2 rounded-full bg-sage transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="mt-2 max-w-sm text-center text-sm leading-6 text-ink">{cue.message}</p>

        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => bump(-1)} aria-label="Subtract one cup" disabled={state.cups <= 0}>
            <Minus size={16} aria-hidden="true" />
          </Button>
          <Button onClick={() => bump(1)} aria-label="Add one cup">
            <Plus size={16} aria-hidden="true" /> Cup
          </Button>
        </div>
      </div>

      <details className="mt-5">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-muted">
          What counts and what doesn't
        </summary>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-muted">
          <li>• Water, tea, milk, sparkling water, broth — all count.</li>
          <li>• Coffee and caffeinated tea count too (the 'caffeine dehydrates you' line is old).</li>
          <li>• Watermelon, soup, fruit — water-rich foods count.</li>
          <li>• Sugary drinks and alcohol contain water but make the body work harder.</li>
          <li>• Sports practice / hot day / sweating a lot → scale up.</li>
        </ul>
        <button
          type="button"
          onClick={resetToday}
          className="focus-ring mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-muted underline"
        >
          <RefreshCw size={12} aria-hidden="true" /> Reset today
        </button>
      </details>
    </section>
  );
}
