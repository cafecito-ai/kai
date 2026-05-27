// KaiMessage — KAI speaking to the user. Reads like an iMessage from a friend,
// not like a UI card. Use this anywhere KAI is "saying" something to the user
// (reflections, check-in responses, body-agent comments, voice transcript).
//
// Visual notes:
//   - Asymmetric radius (tight bottom-left corner) gives it the "speaker tail"
//     feel without an actual triangle
//   - Subtle off-white tinted surface so it sits forward from the page bg
//   - Avatar (KaiOrb) anchored bottom-left at the corner
//   - When `timestamp` provided, shown small + muted at the top

import { KaiOrb } from "./KaiOrb";

type KaiMessageProps = {
  children: React.ReactNode;
  timestamp?: string;
  orbSize?: number;
  /** Optional CTA shown under the message. */
  action?: {
    label: string;
    onClick?: () => void;
  };
};

export function KaiMessage({
  children,
  timestamp,
  orbSize = 32,
  action,
}: KaiMessageProps) {
  return (
    <div className="flex items-end gap-2.5">
      {/* Avatar pinned to the bottom of the bubble */}
      <div className="shrink-0 pb-0.5">
        <KaiOrb size={orbSize} />
      </div>

      {/* Bubble */}
      <div className="relative flex-1">
        <div
          className="
            rounded-tl-3xl rounded-tr-3xl rounded-br-3xl rounded-bl-md
            border border-glass-border
            bg-accent-cool-soft/40
            px-5 py-4
            shadow-card
          "
        >
          {timestamp ? (
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
              KAI · {timestamp}
            </p>
          ) : null}
          <div className="whitespace-pre-line font-display text-[17px] leading-snug text-text-primary">
            {children}
          </div>
          {action ? (
            <button
              onClick={action.onClick}
              className="
                mt-3 inline-flex items-center gap-1
                rounded-full
                bg-text-primary px-3.5 py-1.5
                font-sans text-xs font-medium text-background
                transition active:scale-[0.97]
              "
            >
              {action.label}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
