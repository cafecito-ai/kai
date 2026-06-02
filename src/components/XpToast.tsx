// XpToast — tiny floating tile that appears whenever the user logs
// something, surfacing the XP gain that's been silently accruing.
//
// Listens for the global "kai:input-appended" event (dispatched from
// appendLocalInput). Maps the source to its XP value via the existing
// XP_BY_SOURCE table, shows a toast for ~2s, fades out.
//
// Mounted once in AppShell so it works app-wide without each call site
// having to wire its own UI.

import { useEffect, useState } from "react";
import { Award } from "lucide-react";

type Toast = {
  id: number;
  xp: number;
  label: string;
};

const SOURCE_XP: Record<string, number> = {
  check_in: 10,
  journal: 10,
  food_log: 5,
  workout: 15,
  sleep_log: 10,
  goal_progress: 15,
  energy_check_in: 5,
  hydration_goal_hit: 10,
};

const SOURCE_LABELS: Record<string, string> = {
  check_in: "Check-in",
  journal: "Journal",
  food_log: "Food logged",
  workout: "Workout",
  sleep_log: "Sleep logged",
  goal_progress: "Goal progress",
  energy_check_in: "Energy check-in",
  hydration_goal_hit: "Hydration goal hit",
};

export function XpToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onAppended(e: Event) {
      const detail = (e as CustomEvent<{ source?: string }>).detail;
      const source = detail?.source;
      if (!source) return;
      const xp = SOURCE_XP[source];
      if (!xp) return;
      const id = Date.now();
      const label = SOURCE_LABELS[source] ?? source;
      setToasts((prev) => [...prev, { id, xp, label }]);
      // Auto-dismiss after 3.5 seconds — longer than before because
      // testers were missing the 2.2s flash.
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    }
    window.addEventListener("kai:input-appended", onAppended);
    return () => window.removeEventListener("kai:input-appended", onAppended);
  }, []);

  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="
        pointer-events-none fixed top-4 left-1/2 z-50 flex -translate-x-1/2
        flex-col items-center gap-2
      "
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="
            pointer-events-none flex items-center gap-2 rounded-full
            border-2 border-accent bg-background px-5 py-2.5
            text-sm font-semibold text-accent shadow-lg
            animate-fade-slide-up
          "
        >
          <span
            className="
              flex h-7 w-7 items-center justify-center rounded-full
              bg-accent text-background
            "
            aria-hidden="true"
          >
            <Award size={14} strokeWidth={2.5} />
          </span>
          <span>
            +{t.xp} XP
            <span className="ml-1 font-normal text-text-secondary">· {t.label}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
