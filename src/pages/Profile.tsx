import { Brain, Droplets, Heart, Moon, Plus, Reply, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { AppPage, KaiAvatar } from "../components/ui/AppPrimitives";
import { dailyScore, deltaVsYesterday, hydrationGlasses, mindScore, moodScore, recentRows, sleepHours, tierLabel } from "../lib/score";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

export function Profile() {
  const events = useProgressStore((state) => state.events);
  const addEvent = useProgressStore((state) => state.addEvent);
  const kaiName = useUserStore((state) => state.kaiName);
  const score = dailyScore(events);
  const delta = deltaVsYesterday(events);
  const hydration = hydrationGlasses(events);
  const rows = recentRows(events, 6);
  const nudge = dashboardNudge(events, kaiName);

  function bumpHydration(direction: 1 | -1) {
    const next = Math.max(0, Math.min(8, hydration + direction));
    addEvent({ engine: "physical", eventType: "hydration", eventValue: direction * 4, payload: { glassCount: next } });
  }

  return (
    <AppPage className="max-w-md">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.22em] text-inkMute">Tuesday morning</p>
          <h1 className="mt-1 font-display text-5xl font-semibold leading-none tracking-normal">Morning.</h1>
          <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-ink shadow-sm">4-day streak</span>
        </div>
        <Link to="/home" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full bg-ink px-3 text-xs font-black text-white">
          <KaiAvatar size={24} label={kaiName} />
          Talk to {kaiName}
        </Link>
      </header>

      <section className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4 rounded-[28px] border border-line bg-white p-5 shadow-sm">
        <div>
          <p className="eyebrow">today</p>
          <div className="mt-2 flex items-end gap-1">
            <span className="font-display text-6xl font-black leading-none tabular-nums">{score}</span>
            <span className="pb-2 text-xl font-black text-muted">/100</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#E7F7EF] px-3 py-1 text-xs font-black text-[#267A4C]">{tierLabel(score)}</span>
            <span className="rounded-full bg-paper px-3 py-1 text-xs font-black text-muted">{delta >= 0 ? `+${delta}` : delta} vs yesterday</span>
          </div>
        </div>
        <ScoreRing score={score} />
      </section>

      <section className="mt-3 grid grid-cols-3 gap-2">
        <Metric icon={Brain} label="Mind" value={`${mindScore(events)}/10`} tone="bg-[#EEEAFF] text-[#5B47F0]" />
        <Metric icon={Moon} label="Sleep" value={sleepHours(events) ? `${sleepHours(events)} hrs` : "--"} tone="bg-[#EAF6FF] text-[#287AA5]" />
        <Metric icon={Heart} label="Mood" value={String(moodScore(events))} tone="bg-[#FFF0EC] text-[#C86B31]" />
      </section>

      <section className="mt-3 rounded-[24px] border border-line bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-full bg-[#EAF6FF] text-[#287AA5]"><Droplets size={18} /></span>
            <div>
              <p className="eyebrow">hydration</p>
              <p className="text-sm font-black">{hydration} / 8</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => bumpHydration(-1)} className="focus-ring grid size-9 place-items-center rounded-full bg-paper text-xl font-black" aria-label="Subtract hydration">-</button>
            <button type="button" onClick={() => bumpHydration(1)} className="focus-ring grid size-9 place-items-center rounded-full bg-ink text-white" aria-label="Add hydration"><Plus size={17} /></button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-8 gap-1">
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className={`h-7 rounded-md ${index < hydration ? "bg-[#287AA5]" : "bg-paper"}`} />
          ))}
        </div>
      </section>

      <section className="mt-3 rounded-[24px] border border-line bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <KaiAvatar size={42} label={kaiName} pulse />
          <div className="min-w-0">
            <p className="eyebrow">Kai · this morning</p>
            <p className="mt-1 text-sm font-black leading-6">{nudge}</p>
            <Link to="/home" className="focus-ring mt-3 inline-flex min-h-9 items-center gap-2 rounded-full bg-ink px-3 text-xs font-black text-white">
              <Reply size={14} /> Reply
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">recent</p>
          <Link to="/profile/details" className="focus-ring inline-flex min-h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-ink">
            <UserRound size={14} />
            Details
          </Link>
        </div>
        <div className="mt-2 space-y-2">
          {rows.length === 0 && <p className="rounded-kai border border-line bg-white p-4 text-sm font-semibold text-muted">No reps yet today. Start with one small thing.</p>}
          {rows.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 rounded-kai border border-line bg-white p-3">
              <div>
                <p className="text-sm font-black capitalize">{row.title}</p>
                <p className="text-xs font-semibold text-muted">{row.when}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-black ${row.delta >= 0 ? "bg-[#E7F7EF] text-[#267A4C]" : "bg-[#FFF0EC] text-[#C86B31]"}`}>
                {row.delta >= 0 ? `+${row.delta}` : row.delta}
              </span>
            </div>
          ))}
        </div>
      </section>
    </AppPage>
  );
}

function ScoreRing({ score }: { score: number }) {
  const sweep = Math.max(0, Math.min(100, score));
  return (
    <div className="grid size-24 place-items-center rounded-full" style={{ background: `conic-gradient(#7BAE8E ${sweep}%, #A88DE8 ${sweep}%, #F4F0E8 ${sweep}% 100%)` }}>
      <div className="grid size-16 place-items-center rounded-full bg-white text-sm font-black tabular-nums">{score}</div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Brain; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-[20px] border border-line bg-white p-3 shadow-sm">
      <span className={`grid size-9 place-items-center rounded-full ${tone}`}><Icon size={17} /></span>
      <p className="mt-3 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function dashboardNudge(events: ReturnType<typeof useProgressStore.getState>["events"], kaiName: string) {
  const sleep = sleepHours(events);
  if (sleep > 0 && sleep < 7) return `Sleep came in under 7 hours. Want to start light and check in again by lunch?`;
  if (hydrationGlasses(events) < 3) return `Tiny body thing: water first, then decide what kind of day this is.`;
  return `${kaiName} has enough signal to start small: one honest rep, then reassess.`;
}
