import { ShieldAlert } from "lucide-react";

/**
 * Spec Phase 4 Gate G5: "Get a third-party clinical reviewer (provided by
 * Offy) to review the entire mental engine flow before any of it goes
 * live." Until D5 lands and we have a documented signoff, render this
 * banner above every mental-engine workflow.
 *
 * Visibility is controlled by VITE_MENTAL_ENGINE_CLINICAL_REVIEWED. Default
 * is unset → banner shows. Setting it to "1" hides the banner (post-review).
 */
export function ClinicalReviewBanner() {
  const reviewed = import.meta.env.VITE_MENTAL_ENGINE_CLINICAL_REVIEWED === "1";
  if (reviewed) return null;
  return (
    <div className="rounded-kai border border-coral/40 bg-[#FFF1EB] p-3 text-sm leading-6 text-ink">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 shrink-0 text-coral" size={18} />
        <p>
          <strong className="font-black uppercase tracking-wider text-coral">Internal preview</strong> — the mental wellness
          engine has not yet been cleared by a clinical reviewer (plan decision D5). These workflows are visible for
          internal QA only and should not be shared with teen testers until review is complete.
        </p>
      </div>
    </div>
  );
}
