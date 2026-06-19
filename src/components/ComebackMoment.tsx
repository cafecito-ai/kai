// ComebackMoment — a warm full-screen welcome when the user returns after a
// 7+ day gap. No broken-streak shame: "It's been N days. No guilt. You're here
// now." Shown once per gap (gated in local-comeback.ts), then dismissed.

import { ArrowRight } from "lucide-react";

import { KaiCharacter } from "./KaiCharacter";
import { MagicField } from "./MagicField";
import { comebackInfo, markComebackSeen } from "../lib/local-comeback";
import { getSystemGoal } from "../lib/local-systems";
import { useUserStore } from "../stores/userStore";

export function ComebackMoment({ onClose }: { onClose: () => void }) {
  const displayName = useUserStore((s) => s.displayName);
  const { daysAway } = comebackInfo();
  const goal = getSystemGoal();

  function pickBackUp() {
    markComebackSeen();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background px-6 pb-8 pt-10">
      <MagicField />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
        <KaiCharacter size={170} face speaking gesture="reach" />

        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
          {daysAway} days away
        </p>
        <h1 className="mt-3 max-w-sm font-display text-3xl font-semibold leading-tight tracking-tight text-text-primary">
          {displayName ? `Welcome back, ${displayName}.` : "Welcome back."}
        </h1>
        <p className="mt-3 max-w-xs text-base leading-relaxed text-text-secondary">
          No guilt. You're here now, and that's the part that counts.
        </p>
        {goal && (
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-text-secondary">
            You were working toward{" "}
            <span className="font-semibold text-accent">{goal}</span>. Let's pick it back up.
          </p>
        )}
      </div>

      <div className="relative z-10" style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}>
        <button
          type="button"
          onClick={pickBackUp}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-text-primary text-lg font-semibold text-background shadow-card transition active:scale-[0.99] focus-ring"
        >
          Pick back up
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
