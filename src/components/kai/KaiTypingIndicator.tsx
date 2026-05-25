import { useUserStore } from "../../stores/userStore";

/**
 * Spec §4 motion: "Kai typing indicator — three dots, staggered pulse,
 * 600ms cycle." Replaces the placeholder text swap in KaiChat. The
 * outer container carries a polite ARIA live label so screen readers
 * announce the state when it appears.
 */
export function KaiTypingIndicator() {
  const kaiName = useUserStore((state) => state.kaiName);
  return (
    <div
      className="flex w-fit items-center gap-2 rounded-[22px] bg-warmPaper px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{kaiName} is typing</span>
      <span aria-hidden="true" className="flex gap-1">
        <Dot delayMs={0} />
        <Dot delayMs={200} />
        <Dot delayMs={400} />
      </span>
    </div>
  );
}

function Dot({ delayMs }: { delayMs: number }) {
  return (
    <span
      className="block size-1.5 rounded-full bg-ink/55 motion-safe:animate-pulse motion-reduce:opacity-100"
      style={{ animationDelay: `${delayMs}ms`, animationDuration: "600ms" }}
    />
  );
}
