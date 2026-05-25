import { ArrowRight, Brain, Dumbbell, Sparkles, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { recommendNextLoop } from "../../lib/tracker";
import { useProgressStore } from "../../stores/progressStore";

const laneMeta: Record<"mental" | "physical" | "potential", { icon: LucideIcon; tone: string; cta: string }> = {
  mental: {
    icon: Brain,
    tone: "bg-[#E4F7F4] text-[#218A7D]",
    cta: "Open Mental"
  },
  physical: {
    icon: Dumbbell,
    tone: "bg-[#FFF0EC] text-[#C86B31]",
    cta: "Open Health"
  },
  potential: {
    icon: Target,
    tone: "bg-goalsWash text-goals",
    cta: "Open Goals"
  }
};

export function NextLoopCard({ context = "default" }: { context?: "default" | "compact" }) {
  const events = useProgressStore((state) => state.events);
  const recommendation = recommendNextLoop(events);
  const meta = laneMeta[recommendation.lane];
  const Icon = meta.icon;
  const compact = context === "compact";

  return (
    <section className={`rounded-[28px] border border-[#0A0A0A0F] bg-white p-5 shadow-[0_1px_2px_rgba(10,10,10,0.04),0_12px_36px_rgba(10,10,10,0.08)] ${compact ? "" : "sm:p-6"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`grid size-11 shrink-0 place-items-center rounded-full ${meta.tone}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">{recommendation.label}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-normal text-[#111116]">{recommendation.title}</h2>
          </div>
        </div>
        {!compact && (
          <span className="hidden size-9 shrink-0 place-items-center rounded-full bg-[#F4F1EB] text-[#7B6EF6] sm:grid">
            <Sparkles size={17} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-[#5E5E64]">{recommendation.copy}</p>
      <Link to={recommendation.to} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1A1A1F] px-4 text-sm font-black text-white">
        {meta.cta}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
