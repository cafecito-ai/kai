import { ArrowRight, CheckCircle2, Flame, Plus, Target, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";

const slides = [
  {
    id: "score",
    label: "Score",
    title: "Win the day.",
    copy: "Small reps raise your daily score.",
    icon: Trophy,
    visual: "score"
  },
  {
    id: "goals",
    label: "Goals",
    title: "Pick one rep.",
    copy: "Goals stay tiny enough to move.",
    icon: Target,
    visual: "goals"
  },
  {
    id: "streaks",
    label: "Streaks",
    title: "Come back tomorrow.",
    copy: "Consistency beats intensity.",
    icon: Flame,
    visual: "streaks"
  },
  {
    id: "log",
    label: "Log",
    title: "Tap the plus.",
    copy: "Sleep, food, mood, movement.",
    icon: Plus,
    visual: "log"
  },
  {
    id: "progress",
    label: "Progress",
    title: "Proof stacks up.",
    copy: "KAI learns what helps you.",
    icon: CheckCircle2,
    visual: "progress"
  }
] as const;

export function Walkthrough() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const Icon = slide.icon;
  const isLast = index === slides.length - 1;
  const progress = useMemo(() => ((index + 1) / slides.length) * 100, [index]);

  function finish() {
    try {
      localStorage.setItem("kai.walkthroughSeen", new Date().toISOString());
    } catch {
      // Local storage can fail in private browsing; the walkthrough can still finish.
    }
    navigate("/home");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-7rem)] w-full max-w-md flex-col justify-center pb-28 text-[#111116]">
      <section className="overflow-hidden rounded-[34px] border border-[#0A0A0A0F] bg-white shadow-[0_24px_80px_rgba(10,10,10,0.12)]">
        <header className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <KaiAvatar size={44} label="KAI" pulse />
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">Quick tour</p>
              <h1 className="text-xl font-black leading-tight">How KAI works</h1>
            </div>
          </div>
          <Link to="/home" className="text-xs font-black text-[#8A8A8F]">
            Skip
          </Link>
        </header>

        <div className="h-1.5 bg-[#F0EFEC]">
          <div className="h-full rounded-r-full bg-[#111116] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>

        <div className="px-5 py-6">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#111116] text-white shadow-[0_18px_45px_rgba(10,10,10,0.22)]">
            <Icon size={28} aria-hidden="true" />
          </div>

          <div className="mt-6 text-center">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-[#8A8A8F]">{slide.label}</p>
            <h2 className="mt-2 text-4xl font-black leading-none tracking-normal">{slide.title}</h2>
            <p className="mx-auto mt-3 max-w-64 text-sm font-semibold leading-6 text-[#6D6D73]">{slide.copy}</p>
          </div>

          <WalkthroughVisual kind={slide.visual} />

          <div className="mt-6 grid grid-cols-5 gap-2" aria-label="Walkthrough progress">
            {slides.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-label={`Show ${item.label}`}
                className={`h-2 rounded-full transition ${itemIndex <= index ? "bg-[#111116]" : "bg-[#E8E4DC]"}`}
              />
            ))}
          </div>
        </div>

        <footer className="border-t border-[#0A0A0A0F] bg-[#FAFAF7] p-4">
          <Button type="button" onClick={isLast ? finish : () => setIndex((value) => value + 1)} className="min-h-12 w-full">
            {isLast ? "Start KAI" : "Next"}
            <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </footer>
      </section>
    </main>
  );
}

function WalkthroughVisual({ kind }: { kind: (typeof slides)[number]["visual"] }) {
  if (kind === "score") {
    return (
      <div className="mt-7 rounded-[28px] bg-[#F4F1EB] p-5">
        <div className="mx-auto grid size-36 place-items-center rounded-full bg-white shadow-sm">
          <div className="grid size-28 place-items-center rounded-full border-[12px] border-[#111116]">
            <span className="text-4xl font-black">72</span>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {["Sleep", "Move", "Mood"].map((item) => (
            <span key={item} className="rounded-full bg-white px-3 py-2 text-center text-xs font-black text-[#5E5E64]">
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "goals") {
    return (
      <div className="mt-7 space-y-2 rounded-[28px] bg-[#F4F1EB] p-5">
        {["Finish 20 min study rep", "Log workout", "Phone down by 10"].map((item, itemIndex) => (
          <div key={item} className="flex items-center gap-3 rounded-[20px] bg-white p-3">
            <span className={`grid size-8 place-items-center rounded-full ${itemIndex === 0 ? "bg-[#111116] text-white" : "bg-[#E8E4DC] text-[#8A8A8F]"}`}>
              {itemIndex === 0 ? <CheckCircle2 size={16} aria-hidden="true" /> : itemIndex + 1}
            </span>
            <span className="text-sm font-black">{item}</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "streaks") {
    return (
      <div className="mt-7 rounded-[28px] bg-[#F4F1EB] p-5">
        <div className="grid grid-cols-7 gap-2">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, dayIndex) => (
            <div key={`${day}-${dayIndex}`} className="grid gap-2 text-center">
              <span className="text-[10px] font-black text-[#8A8A8F]">{day}</span>
              <span className={`grid size-8 place-items-center rounded-full text-xs font-black ${dayIndex < 5 ? "bg-[#111116] text-white" : "bg-white text-[#8A8A8F]"}`}>
                {dayIndex < 5 ? "✓" : ""}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-3xl font-black">5 days</p>
      </div>
    );
  }

  if (kind === "log") {
    return (
      <div className="mt-7 grid grid-cols-2 gap-2 rounded-[28px] bg-[#F4F1EB] p-5">
        {["Sleep", "Food", "Mood", "Move"].map((item) => (
          <div key={item} className="grid min-h-20 place-items-center rounded-[22px] bg-white text-sm font-black">
            {item}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-7 rounded-[28px] bg-[#F4F1EB] p-5">
      <div className="space-y-3">
        {[82, 64, 74, 91].map((width, itemIndex) => (
          <div key={width} className="rounded-[20px] bg-white p-3">
            <div className="h-3 rounded-full bg-[#E8E4DC]">
              <div className="h-full rounded-full bg-[#111116]" style={{ width: `${width}%` }} />
            </div>
            <p className="mt-2 text-xs font-black text-[#8A8A8F]">Week {itemIndex + 1}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
