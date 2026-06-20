// HomeQuickActions — the "talk to KAI" shortcuts row on Home.
//
// Five one-tap entries (Can't Sleep, Feeling Stressed, Need Motivation, Need a
// Workout, Low Energy). Each opens a BRAND-NEW chat (never continues the old
// thread) where KAI opens by understanding first. Lives alongside the existing
// "+" logging sheet — these are conversation starters, not loggers.

import { BatteryLow, Dumbbell, Flame, Moon, Wind, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { QUICK_ACTIONS, type QuickActionTopic } from "../lib/quick-actions";

const ICONS: Record<QuickActionTopic, LucideIcon> = {
  sleep: Moon,
  stress: Wind,
  motivation: Flame,
  workout: Dumbbell,
  energy: BatteryLow,
};

export function HomeQuickActions() {
  const navigate = useNavigate();
  return (
    <section aria-label="Talk to KAI" className="space-y-2">
      <p className="px-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
        Talk to KAI
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_ACTIONS.map((action) => {
          const Icon = ICONS[action.topic];
          return (
            <button
              key={action.topic}
              type="button"
              // A fresh quick-action chat — Chat.tsx reads this and starts a new
              // conversation instead of hydrating the previous one.
              onClick={() => navigate("/chat", { state: { quickAction: action.topic } })}
              className="
                flex shrink-0 items-center gap-2 rounded-full
                border border-glass-border bg-surface
                px-3.5 py-2 text-sm font-medium text-text-primary
                shadow-card transition active:scale-95 hover:bg-surface-muted
                focus-ring
              "
            >
              <Icon size={15} className="text-accent" aria-hidden="true" />
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
