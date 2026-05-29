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
          <div className="text-text-primary">
            {typeof children === "string" ? (
              <FormattedKaiText text={children} />
            ) : (
              <div className="whitespace-pre-line font-display text-[17px] leading-snug">
                {children}
              </div>
            )}
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

function FormattedKaiText({ text }: { text: string }) {
  const blocks = text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((paragraph, index) => {
        const lines = paragraph.split("\n").map((line) => line.trim()).filter(Boolean);
        if (lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line))) {
          return (
            <ul key={`${paragraph}-${index}`} className="space-y-1.5 pl-5 font-sans text-[15px] leading-relaxed text-text-secondary">
              {lines.map((line, lineIndex) => (
                <li key={`${line}-${lineIndex}`} className="list-disc">
                  {line.replace(/^[-*]\s+/, "")}
                </li>
              ))}
            </ul>
          );
        }
        if (lines.length > 1 && lines.every((line) => /^\d+\.\s+/.test(line))) {
          return (
            <ol key={`${paragraph}-${index}`} className="space-y-1.5 pl-5 font-sans text-[15px] leading-relaxed text-text-secondary">
              {lines.map((line, lineIndex) => (
                <li key={`${line}-${lineIndex}`} className="list-decimal">
                  {line.replace(/^\d+\.\s+/, "")}
                </li>
              ))}
            </ol>
          );
        }
        const isFirst = index === 0;
        const isFinalQuestion = index === blocks.length - 1 && paragraph.endsWith("?");
        return (
          <p
            key={`${paragraph}-${index}`}
            className={
              isFinalQuestion
                ? "font-sans text-[14px] font-semibold leading-snug text-accent-cool"
                : isFirst
                  ? "font-display text-[18px] font-semibold leading-snug tracking-tight"
                  : "font-sans text-[15px] leading-relaxed text-text-secondary"
            }
          >
            {paragraph}
          </p>
        );
      })}
    </div>
  );
}
