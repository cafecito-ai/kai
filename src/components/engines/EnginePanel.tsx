import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowLeft, Brain, HeartPulse } from "lucide-react";
import { AppPage, KaiAvatar } from "../ui/AppPrimitives";

export function EnginePanel({ title, intro, label = "Engine", children }: { title: string; intro: string; label?: string; children: ReactNode }) {
  const isPhysical = title.toLowerCase().includes("physical") || label.toLowerCase().includes("physical");
  const Icon = isPhysical ? HeartPulse : Brain;
  const wash = isPhysical ? "from-[#FFF0EC] to-white" : "from-[#E4F7F4] to-white";
  const tone = isPhysical ? "text-[#C86B31]" : "text-[#218A7D]";

  return (
    <AppPage className="max-w-5xl">
      <section className={`rounded-[30px] border border-[#0A0A0A0F] bg-gradient-to-br ${wash} p-5 shadow-[0_2px_4px_rgba(10,10,10,0.04),0_16px_40px_rgba(10,10,10,0.08)] sm:p-7`}>
        <div className="flex items-center justify-between gap-3">
          <Link to="/home" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full bg-white/75 px-3 text-sm font-black text-[#1A1A1F] shadow-sm">
            <ArrowLeft size={16} aria-hidden="true" />
            Home
          </Link>
          <KaiAvatar size={42} label="KAI" pulse />
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8A8F]">{label}</p>
            <h1 className="mt-3 max-w-3xl break-words font-display text-[2.65rem] font-semibold leading-[0.96] tracking-normal text-[#111116] sm:text-6xl">{title}</h1>
            <div className="mt-4 max-w-2xl break-words text-base font-medium leading-7 text-[#5E5E64]">{intro}</div>
          </div>
          <div className="rounded-[24px] border border-white/70 bg-white/70 p-4 shadow-sm">
            <div className={`grid size-11 place-items-center rounded-full bg-white ${tone}`}>
              <Icon size={21} aria-hidden="true" />
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
      {children}
    </AppPage>
  );
}
