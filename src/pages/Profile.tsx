import { BadgeCheck, Dumbbell, Flame, HeartPulse, Moon, NotebookPen, Settings as SettingsIcon, Target, Trophy, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { AppPage, KaiMark } from "../components/ui/AppPrimitives";
import type { ProgressEvent } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

export function Profile() {
  const { kaiName, kaiTone } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const level = useProgressStore((state) => state.level());
  const streak = useProgressStore((state) => state.streak());
  const score = dailyScore(events);
  const xp = totalXp(events);
  const nextLevelXp = nextLevelTarget(xp);
  const levelProgress = nextLevelXp ? Math.min(100, Math.round((xp / nextLevelXp) * 100)) : 100;
  const badges = achievementBadges({ events, level, streak, score });
  const missions = dailyMissions(events);
  const path = growthPath({ level, streak, score });

  return (
    <AppPage className="utility-page-shell pb-28 sm:pb-12">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-ink text-paper shadow-calm">
        <div className="relative p-4 sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-20 -top-28 size-48 rounded-full bg-[#8F5CFF]/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-0 size-40 rounded-full bg-[#44D7B6]/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <KaiMark size="sm" />
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-paper/55 sm:text-xs">KAI · profile</p>
              </div>
              <h1 className="mt-3 max-w-[15rem] break-words font-display text-[2.15rem] font-black leading-[0.9] tracking-normal sm:max-w-3xl sm:text-6xl">
                Your path.
              </h1>
              <p className="mt-2 max-w-[18rem] text-sm font-semibold leading-5 text-paper/70 sm:max-w-2xl sm:text-base sm:leading-7">
                Level {level}. {streak} day streak. {kaiName} is tracking the next rep.
              </p>
            </div>
            <Link to="/settings" className="focus-ring grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink sm:inline-flex sm:w-auto sm:px-4">
              <SettingsIcon size={17} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-sm sm:font-black">Tune</span>
            </Link>
          </div>

          <div className="relative mt-5 grid grid-cols-[7.5rem_1fr] items-center gap-4 sm:mt-7 sm:grid-cols-[11rem_1fr] sm:gap-6">
            <ScoreRing score={score} inverted />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-paper/45">daily score</p>
              <h2 className="mt-2 text-2xl font-black leading-none tracking-normal text-paper sm:text-3xl">Make today count.</h2>
              <ProgressBar label={`Level ${level} XP`} value={levelProgress} detail={`${xp} / ${nextLevelXp ?? "max"}`} inverted />
              <div className="mt-4 grid grid-cols-3 gap-2">
                <StatChip icon={Flame} label="Streak" value={String(streak)} />
                <StatChip icon={Trophy} label="Level" value={String(level)} />
                <StatChip icon={BadgeCheck} label="XP" value={String(xp)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-line bg-white/86 p-4 shadow-sm backdrop-blur-xl sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <GrowthIcon level={level} score={score} />
            <div className="min-w-0">
              <p className="eyebrow">current path</p>
              <h2 className="mt-1 truncate text-2xl font-black leading-none text-ink">{path.current.name}</h2>
              <p className="mt-1 text-xs font-semibold capitalize text-muted">{kaiTone} Kai voice</p>
            </div>
          </div>
          <span className="rounded-full bg-[#F4F1EB] px-3 py-1 text-xs font-black text-muted">{path.current.label}</span>
        </div>
        <PathStrip path={path} />
      </section>

      <section className="rounded-[26px] border border-line bg-white/86 p-4 shadow-sm backdrop-blur-xl sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">today's path</p>
          <span className="rounded-full bg-[#F4F1EB] px-3 py-1 text-xs font-black text-muted">{score}% complete</span>
        </div>
        <div className="mt-3 grid gap-2">
          {missions.map((mission) => (
            <MissionRow key={mission.label} {...mission} />
          ))}
        </div>
      </section>

      <section className="rounded-[26px] border border-line bg-white/70 p-4 shadow-sm backdrop-blur-xl sm:p-5">
        <p className="eyebrow">next unlocks</p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {badges.slice(0, 4).map((badge) => (
            <UnlockPill key={badge.label} {...badge} />
          ))}
        </div>
      </section>
    </AppPage>
  );
}

function GrowthIcon({ level, score, size = "md" }: { level: number; score: number; size?: "sm" | "md" }) {
  const progress = Math.max(0.18, Math.min(1, level / 8 + score / 500));
  const stemHeight = 18 + progress * 36;
  const bloomScale = 0.72 + progress * 0.34;
  const shell = size === "sm" ? "size-10 rounded-[16px]" : "size-14 rounded-[22px]";

  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden border border-[#C7F1E8] bg-[#F4FFFC] text-[#218A7D] shadow-sm ${shell}`}
      aria-label={`Growth icon level ${level}`}
      role="img"
    >
      <svg viewBox="0 0 64 64" className="size-[82%]" aria-hidden="true">
        <path d="M15 53h34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.18" />
        <path
          d="M32 52V20"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          style={{
            strokeDasharray: 64,
            strokeDashoffset: 64 - stemHeight,
            transition: "stroke-dashoffset 700ms ease"
          }}
        />
        <path d="M31 39c-9-1-13-8-13-15 8 0 14 4 15 13" fill="currentColor" opacity={progress > 0.32 ? 0.26 : 0.1} />
        <path d="M33 34c9-1 13-8 13-15-8 0-14 4-15 13" fill="currentColor" opacity={progress > 0.52 ? 0.34 : 0.12} />
        <g
          className="origin-center motion-safe:animate-pulse"
          style={{
            transform: `translate(32px, 18px) scale(${bloomScale}) translate(-32px, -18px)`,
            transition: "transform 700ms ease"
          }}
        >
          <circle cx="32" cy="18" r="5" fill="#111116" />
          <circle cx="32" cy="9.5" r="6" fill="currentColor" opacity="0.84" />
          <circle cx="40.5" cy="18" r="6" fill="currentColor" opacity="0.78" />
          <circle cx="32" cy="26.5" r="6" fill="currentColor" opacity="0.68" />
          <circle cx="23.5" cy="18" r="6" fill="currentColor" opacity="0.74" />
        </g>
      </svg>
    </div>
  );
}

function ScoreRing({ score, inverted = false }: { score: number; inverted?: boolean }) {
  const degrees = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <div className="mx-auto grid size-28 place-items-center rounded-full motion-safe:animate-pulse sm:size-44" style={{ background: `conic-gradient(${inverted ? "#FFFFFF" : "#111116"} ${degrees}deg, ${inverted ? "rgba(255,255,255,0.18)" : "#ECE7DC"} 0deg)` }}>
      <div className={`grid size-24 place-items-center rounded-full shadow-sm sm:size-36 ${inverted ? "bg-[#111116]" : "bg-white"}`}>
        <div className="text-center">
          <p className={`text-4xl font-black leading-none sm:text-5xl ${inverted ? "text-paper" : "text-ink"}`}>{score}</p>
          <p className={`mt-1 text-[10px] font-black uppercase tracking-wider ${inverted ? "text-paper/45" : "text-muted"}`}>today</p>
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[16px] border border-white/10 bg-white/10 p-2 text-paper backdrop-blur">
      <div className="flex items-center gap-1.5">
        <Icon size={14} aria-hidden="true" />
        <span className="truncate text-[9px] font-black uppercase tracking-wider text-paper/45">{label}</span>
      </div>
      <p className="mt-1 text-lg font-black leading-none">{value}</p>
    </div>
  );
}

function PathStrip({ path }: { path: ReturnType<typeof growthPath> }) {
  return (
    <div className="mt-4 rounded-[22px] border border-line bg-paper p-3">
      <div className="grid grid-cols-4 gap-1.5">
        {path.stages.map((stage, index) => (
          <div key={stage.name} className="grid gap-2">
            <div className={`h-2 rounded-full transition-all duration-700 ${index <= path.currentIndex ? "bg-[#111116]" : "bg-[#DCD6CA]"}`} />
            <p className={`truncate text-[10px] font-black uppercase tracking-wider ${index === path.currentIndex ? "text-ink" : "text-muted"}`}>{stage.name}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold leading-5 text-muted">{path.current.copy}</p>
    </div>
  );
}

function ProgressBar({ label, value, detail, inverted = false }: { label: string; value: number; detail: string; inverted?: boolean }) {
  return (
    <div className="mt-4">
      <div className={`flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider ${inverted ? "text-paper/55" : "text-muted"}`}>
        <span>{label}</span>
        <span>{detail}</span>
      </div>
      <div className={`mt-2 h-3 overflow-hidden rounded-full ${inverted ? "bg-white/14" : "bg-[#ECE7DC]"}`}>
        <div className={`h-full rounded-full transition-all duration-700 ${inverted ? "bg-white" : "bg-[#111116]"}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function MissionRow({ icon: Icon, label, points, done }: { icon: LucideIcon; label: string; points: number; done: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-[18px] p-2.5 sm:p-3 ${done ? "bg-[#F4FFFC]" : "bg-paper"}`}>
      <span className="flex min-w-0 items-center gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-full ${done ? "bg-[#E4F7F4] text-[#218A7D]" : "bg-white text-muted"}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-black text-ink sm:text-sm">{label}</span>
          <span className="block text-xs font-bold text-muted">+{points} pts</span>
        </span>
      </span>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${done ? "bg-[#111116] text-white" : "bg-white text-muted"}`}>{done ? "Done" : "Open"}</span>
    </div>
  );
}

function UnlockPill({ icon: Icon, label, unlocked }: { icon: LucideIcon; label: string; unlocked: boolean }) {
  return (
    <div className={`flex min-w-[9.5rem] items-center gap-2 rounded-full border px-3 py-2 ${unlocked ? "border-[#111116] bg-[#111116] text-white" : "border-line bg-paper text-muted"}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${unlocked ? "bg-white/12" : "bg-white"}`}>
        <Icon size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-black leading-tight">{label}</span>
        <span className={`block text-xs font-bold ${unlocked ? "text-white/55" : "text-muted"}`}>{unlocked ? "Unlocked" : "In progress"}</span>
      </span>
    </div>
  );
}

const LEVEL_TARGETS = [0, 100, 250, 500, 1000, 1750, 2750, 4000, 6000, 9000];

function totalXp(events: ProgressEvent[]) {
  return events.reduce((sum, event) => sum + Math.max(0, event.eventValue), 0);
}

function nextLevelTarget(xp: number) {
  return LEVEL_TARGETS.find((target) => target > xp) ?? null;
}

function todayEvents(events: ProgressEvent[]) {
  const today = new Date().toISOString().slice(0, 10);
  return events.filter((event) => event.occurredAt.slice(0, 10) === today);
}

function dailyScore(events: ProgressEvent[]) {
  return Math.min(100, todayEvents(events).reduce((sum, event) => sum + Math.max(0, event.eventValue), 0));
}

function hasEvent(events: ProgressEvent[], patterns: RegExp[]) {
  return events.some((event) => patterns.some((pattern) => pattern.test(`${event.engine} ${event.eventType}`.toLowerCase())));
}

function dailyMissions(events: ProgressEvent[]) {
  const todays = todayEvents(events);
  return [
    { icon: Target, label: "Complete one goal", points: 20, done: hasEvent(todays, [/goal/, /potential/]) },
    { icon: Moon, label: "Log sleep", points: 15, done: hasEvent(todays, [/sleep/]) },
    { icon: Dumbbell, label: "Exercise or stretch", points: 20, done: hasEvent(todays, [/workout/, /stretch/, /move/, /scan/]) },
    { icon: Utensils, label: "Log food", points: 15, done: hasEvent(todays, [/food/, /meal/, /nutrition/]) },
    { icon: NotebookPen, label: "Journal or check in", points: 15, done: hasEvent(todays, [/journal/, /reflection/, /check/]) }
  ];
}

function achievementBadges({ events, level, streak, score }: { events: ProgressEvent[]; level: number; streak: number; score: number }) {
  return [
    { icon: Flame, label: "3-day streak", unlocked: streak >= 3 },
    { icon: Trophy, label: "Level 3", unlocked: level >= 3 },
    { icon: BadgeCheck, label: "100 XP club", unlocked: totalXp(events) >= 100 },
    { icon: Target, label: "Perfect day", unlocked: score >= 100 },
    { icon: HeartPulse, label: "Wellness rep", unlocked: hasEvent(events, [/mental/, /reset/, /mood/, /breath/]) },
    { icon: Utensils, label: "Fuel logged", unlocked: hasEvent(events, [/food/, /meal/, /nutrition/]) }
  ];
}

function growthPath({ level, streak, score }: { level: number; streak: number; score: number }) {
  const stages = [
    { name: "Start", label: "Foundation", copy: "Show up once today. One honest rep starts the system." },
    { name: "Build", label: "Consistency", copy: "Repeat the basics: sleep, fuel, movement, mood, and one goal." },
    { name: "Prove", label: "Evidence", copy: "Stack enough proof that discipline feels normal, not dramatic." },
    { name: "Lead", label: "Identity", copy: "Your routines become part of who you are becoming." }
  ];
  let currentIndex = 0;
  if (level >= 2 || streak >= 2 || score >= 35) currentIndex = 1;
  if (level >= 4 || streak >= 5 || score >= 70) currentIndex = 2;
  if (level >= 7 || streak >= 14 || score >= 95) currentIndex = 3;
  return { stages, currentIndex, current: stages[currentIndex] };
}
