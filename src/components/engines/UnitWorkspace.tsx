import type { ElementType, ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Activity, ArrowLeft, Brain, HeartPulse } from "lucide-react";
import { AppPage, KaiAvatar } from "../ui/AppPrimitives";

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
  modules
}: {
  title: string;
  label: string;
  intro: string;
  tone: "mental" | "physical";
  modules: UnitModule[];
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

  return (
    <AppPage className="engine-page-shell pb-28 sm:pb-12">
      <section className={`min-w-0 overflow-hidden rounded-[30px] border border-[#0A0A0A0F] bg-gradient-to-br ${wash} p-5 shadow-[0_2px_4px_rgba(10,10,10,0.04),0_16px_40px_rgba(10,10,10,0.08)] sm:p-7`}>
        <div className="flex items-center justify-between gap-3">
          <Link to="/home" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full bg-white/75 px-3 text-sm font-black text-[#1A1A1F] shadow-sm">
            <ArrowLeft size={16} aria-hidden="true" />
            Home
          </Link>
          <KaiAvatar size={42} label="KAI" pulse />
        </div>
        <div className="mt-5 grid gap-5 sm:mt-7 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8A8F]">{label}</p>
            <h1 className="mt-3 max-w-[13ch] break-words font-display text-[2rem] font-semibold leading-[0.96] tracking-normal text-[#111116] sm:max-w-3xl sm:text-6xl">
              {title}
            </h1>
            <p className="mt-3 max-w-full break-words text-base font-medium leading-7 text-[#5E5E64] sm:mt-4 sm:max-w-2xl">{intro}</p>
          </div>
          <div className="hidden rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-sm sm:block">
            <div className={`grid size-11 place-items-center rounded-full bg-white ${iconTone}`}>
              <HeaderIcon size={21} aria-hidden="true" />
            </div>
            <p className="mt-4 text-sm font-black text-[#1A1A1F]">Pick one move. Save one rep.</p>
            <p className="mt-1 text-sm font-semibold leading-5 text-[#8A8A8F]">Kai uses each saved rep to make the next suggestion sharper.</p>
            <Link to="/progress" className="focus-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1A1A1F] px-4 text-sm font-black text-white">
              <Activity size={15} aria-hidden="true" />
              Wins
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-[#0A0A0A0F] bg-white/80 p-3 shadow-sm backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label={`${title} moves`}>
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
                className={`focus-ring flex min-w-[8.5rem] items-center gap-2 rounded-[20px] border px-3 py-3 text-left transition ${
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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">{active.content}</div>
        <aside className="hidden rounded-[28px] border border-[#0A0A0A0F] bg-white/80 p-4 shadow-sm backdrop-blur-xl lg:block">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">Kai can open</p>
          <div className="mt-3 grid gap-2">
            {modules.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => selectModule(module.id)}
                className={`focus-ring rounded-[18px] px-3 py-3 text-left text-sm font-black ${module.id === active.id ? "bg-[#1A1A1F] text-white" : "bg-[#FAFAF7] text-[#1A1A1F]"}`}
              >
                {module.label}
              </button>
            ))}
          </div>
        </aside>
      </section>
    </AppPage>
  );
}
