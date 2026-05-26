import type { ElementType, ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Brain, HeartPulse } from "lucide-react";
import { AppPage } from "../ui/AppPrimitives";

export interface UnitModule {
  id: string;
  label: string;
  summary: string;
  icon: ElementType;
  content: ReactNode;
}

export function UnitWorkspace({
  title,
  label,
  intro,
  tone,
  modules,
  banners,
  liveNote
}: {
  title: string;
  label: string;
  intro: string;
  tone: "mental" | "physical";
  modules: UnitModule[];
  /** Safety / disclosure banners that must be visible on every tab (spec §1, §7). */
  banners?: ReactNode;
  /** Ephemeral Kai-cue note shown between banners and tabs. Engines
   * use this for the "after each action" cue from /api/kai/cue. */
  liveNote?: ReactNode;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("module");
  const active = modules.find((module) => module.id === requested) ?? modules[0];
  const isPhysical = tone === "physical";
  const HeaderIcon = isPhysical ? HeartPulse : Brain;
  const wash = isPhysical ? "from-[#FFF0EC] to-white" : "from-[#E4F7F4] to-white";
  const iconTone = isPhysical ? "text-[#C86B31]" : "text-[#218A7D]";

  function selectModule(id: string) {
    const next = new URLSearchParams(searchParams);
    next.set("module", id);
    setSearchParams(next, { replace: false });
  }

  // Single-column layout end-to-end. The previous version had a desktop
  // `<aside>` sidebar that duplicated the top-tab row, plus a right-side
  // hero card that re-stated the tab purpose ("Pick one module..."). Both
  // were redundant on top of the tabs that already exist below, so they're
  // gone. The page now reads: hero (title + intro) -> tabs -> active module.
  return (
    <AppPage className="max-w-3xl">
      <section className={`rounded-[30px] border border-[#0A0A0A0F] bg-gradient-to-br ${wash} p-5 shadow-[0_2px_4px_rgba(10,10,10,0.04),0_16px_40px_rgba(10,10,10,0.08)] sm:p-7`}>
        <div className="flex items-center justify-between gap-3">
          <Link to="/home" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full bg-white/75 px-3 text-sm font-black text-[#1A1A1F] shadow-sm">
            <ArrowLeft size={16} aria-hidden="true" />
            Home
          </Link>
          <div className={`grid size-11 place-items-center rounded-full bg-white ${iconTone}`}>
            <HeaderIcon size={21} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-7">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8A8F]">{label}</p>
          <h1 className="mt-3 max-w-3xl break-words font-display text-[2.65rem] font-semibold leading-[0.96] tracking-normal text-[#111116] sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl break-words text-base font-medium leading-7 text-[#5E5E64]">{intro}</p>
        </div>
      </section>

      {banners && <div className="grid gap-3">{banners}</div>}
      {liveNote && <div>{liveNote}</div>}

      <section className="rounded-[30px] border border-[#0A0A0A0F] bg-white/80 p-3 shadow-sm backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={`${title} modules`}>
          {modules.map((module) => {
            const Icon = module.icon;
            const selected = module.id === active.id;
            return (
              <button
                key={module.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectModule(module.id)}
                className={`focus-ring flex min-w-[9rem] items-center gap-2 rounded-[20px] border px-3 py-3 text-left transition ${
                  selected ? "border-[#1A1A1F] bg-[#1A1A1F] text-white shadow-sm" : "border-[#0A0A0A0F] bg-[#FAFAF7] text-[#1A1A1F]"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                <span>
                  <span className="block text-sm font-black">{module.label}</span>
                  <span className={`mt-0.5 block text-xs font-semibold ${selected ? "text-white/65" : "text-[#8A8A8F]"}`}>{module.summary}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>{active.content}</section>
    </AppPage>
  );
}
