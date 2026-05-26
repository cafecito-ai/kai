import { X } from "lucide-react";
import { KaiAvatar } from "../ui/AppPrimitives";
import { useUserStore } from "../../stores/userStore";

type Props = {
  cue: string;
  onDismiss: () => void;
};

/**
 * Ephemeral "Kai cue" surfaced after a completed engine action.
 * Calm sage-tone card with the Kai avatar on the left, one-sentence
 * cue, and a small dismiss button. Stays visible until the teen
 * dismisses or the next action replaces it.
 *
 * Voice rule: the cue text is generated server-side and passes the
 * isSafeCue filter (no "should", no exclamation, no corporate-
 * wellness vocab). This component is the renderer only.
 */
export function KaiCueNote({ cue, onDismiss }: Props) {
  const kaiName = useUserStore((state) => state.kaiName);
  return (
    <aside
      className="flex items-start gap-3 rounded-calm border border-body/25 bg-bodyWash px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <span className="mt-0.5 shrink-0">
        <KaiAvatar size={28} label={kaiName} />
      </span>
      <p className="flex-1 text-sm font-semibold leading-snug text-ink">{cue}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="focus-ring shrink-0 rounded-full p-1 text-inkSoft hover:text-ink"
        aria-label="Dismiss"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </aside>
  );
}
