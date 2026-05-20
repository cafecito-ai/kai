// QuickActionSheet — bottom sheet that opens from the + button.
//
// Per CLAUDE_v3_PATCH §5: actions are Check in, Log workout, Log food,
// Journal, Log sleep. The actions themselves wire up in Phase C/D as those
// features land — for T-004 each one navigates to a placeholder route so
// the sheet is functional but the destinations are stubs.

import {
  Brain,
  Camera,
  Dumbbell,
  Moon,
  NotebookPen,
  ScanLine,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ACTIONS = [
  {
    label: "Check in",
    blurb: "Morning or evening reflection.",
    icon: Brain,
    tint: "bg-accent-cool-soft text-accent-cool",
    to: "/check-in",
  },
  {
    label: "Log workout",
    blurb: "Any session — even a walk.",
    icon: Dumbbell,
    tint: "bg-accent-warm-soft text-accent-warm",
    to: "/workout/log",
  },
  {
    label: "Log food",
    blurb: "Snap a photo, KAI handles the rest.",
    icon: Camera,
    tint: "bg-accent-warm-soft text-accent-warm",
    to: "/food/log",
  },
  {
    label: "Journal",
    blurb: "Write anything — private.",
    icon: NotebookPen,
    tint: "bg-accent-soft text-accent",
    to: "/journal",
  },
  {
    label: "Log sleep",
    blurb: "Last night's hours and quality.",
    icon: Moon,
    tint: "bg-accent-soft text-accent",
    to: "/sleep/log",
  },
  {
    label: "Set a goal",
    blurb: "Identity-based, never task-based.",
    icon: Target,
    tint: "bg-accent-cool-soft text-accent-cool",
    to: "/goals",
  },
  {
    label: "Stretch / move",
    blurb: "3-10 min mobility routines.",
    icon: Sparkles,
    tint: "bg-accent-soft text-accent",
    to: "/mobility",
  },
  {
    label: "Energy check",
    blurb: "1-5 read on how today feels.",
    icon: Zap,
    tint: "bg-accent-warm-soft text-accent-warm",
    to: "/energy",
  },
  {
    label: "Body scan",
    blurb: "3 photos — KAI checks posture only.",
    icon: ScanLine,
    tint: "bg-accent-cool-soft text-accent-cool",
    to: "/scan",
  },
] as const;

type QuickActionSheetProps = {
  open: boolean;
  onClose: () => void;
};

export function QuickActionSheet({ open, onClose }: QuickActionSheetProps) {
  const navigate = useNavigate();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-actions-title"
    >
      {/* Scrim */}
      <button
        type="button"
        aria-label="Close quick actions"
        onClick={onClose}
        className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm"
      />

      {/* Sheet */}
      <div
        className="
          relative w-full max-w-md
          rounded-tl-3xl rounded-tr-3xl
          border-t border-l border-r border-glass-border
          bg-surface
          p-5 pb-8
          shadow-glass-lg
          animate-fade-slide-up
        "
        style={{
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Grab handle */}
        <div className="mx-auto h-1.5 w-10 rounded-full bg-text-soft/40" />

        <div className="mt-4 flex items-baseline justify-between">
          <h2
            id="quick-actions-title"
            className="font-display text-2xl font-semibold tracking-tight"
          >
            What's up?
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-text-secondary hover:bg-surface-muted"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {ACTIONS.map(({ label, blurb, icon: Icon, tint, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                onClose();
                navigate(to);
              }}
              className="
                focus-ring
                flex w-full items-center gap-4
                rounded-lg
                border border-glass-border
                bg-surface px-4 py-3
                text-left
                transition
                hover:bg-surface-muted
                active:scale-[0.99]
              "
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tint}`}
              >
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium text-text-primary">
                  {label}
                </span>
                <span className="block text-xs text-text-secondary">
                  {blurb}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
