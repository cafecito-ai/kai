import { BadgeCheck, Brain, Dumbbell, Flame, HeartPulse, Moon, NotebookPen, Settings as SettingsIcon, Target, Trophy, Utensils, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { NextLoopCard } from "../components/tracker/NextLoopCard";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { AppPage, AppSurface, KaiMark, MetricPill } from "../components/ui/AppPrimitives";
import type { ProgressEvent } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

export function Profile() {
  const { kaiName, kaiTone, primaryEngine, consentStatus } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const level = useProgressStore((state) => state.level());
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());
  const score = dailyScore(events);
  const xp = totalXp(events);
  const nextLevelXp = nextLevelTarget(xp);
  const levelProgress = nextLevelXp ? Math.min(100, Math.round((xp / nextLevelXp) * 100)) : 100;
  const completions = completionBreakdown(events);
  const badges = achievementBadges({ events, level, streak, score });
  const missions = dailyMissions(events);
  const path = growthPath({ level, streak, score });

  return (
    <AppPage className="utility-page-shell pb-28 sm:pb-12">
      <section className="overflow-hidden rounded-[26px] border border-white/10 bg-ink text-paper shadow-calm">
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
                Daily proof, streaks, XP, and the next move.
              </p>
            </div>
            <Link to="/settings" className="focus-ring grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink sm:inline-flex sm:w-auto sm:px-4">
              <SettingsIcon size={17} aria-hidden="true" />
              <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-sm sm:font-black">Tune</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
        <AppSurface className="p-4 sm:p-6">
          <div className="grid grid-cols-[7.5rem_1fr] items-center gap-4 sm:grid-cols-[11rem_1fr] sm:gap-5">
            <ScoreRing score={score} />
            <div className="min-w-0">
              <p className="eyebrow">daily score</p>
              <h2 className="mt-2 text-2xl font-black leading-none tracking-normal text-ink sm:text-3xl">Make today count.</h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-muted sm:mt-3 sm:text-sm sm:leading-6">
                Points from goals, sleep, movement, food, journaling, wellness, and showing up.
              </p>
              <div className="mt-4 sm:mt-5">
                <ProgressBar label={`Level ${level} XP`} value={levelProgress} detail={`${xp} / ${nextLevelXp ?? "max"}`} />
              </div>
            </div>
          </div>
        </AppSurface>

        <PathCard path={path} level={level} streak={streak} xp={xp} score={score} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="grid gap-4">
          <AppSurface className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">today's path</p>
              <span className="rounded-full bg-[#F4F1EB] px-3 py-1 text-xs font-black text-muted">{score}% complete</span>
            </div>
            <div className="mt-3 grid gap-2 sm:mt-4">
              {missions.map((mission) => (
                <MissionRow key={mission.label} {...mission} />
              ))}
            </div>
          </AppSurface>

          <AppSurface className="p-4 sm:p-5 lg:hidden">
            <p className="eyebrow">completion</p>
            <div className="mt-3 grid gap-3">
              {completions.map((item) => (
                <ProgressBar key={item.label} label={item.label} value={item.value} detail={item.detail} />
              ))}
            </div>
          </AppSurface>

          <AppSurface className="p-4 sm:p-5">
            <p className="eyebrow">next unlocks</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
              {badges.map((badge) => (
                <BadgeTile key={badge.label} {...badge} />
              ))}
            </div>
          </AppSurface>

          <AppSurface className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <GrowthIcon level={level} score={score} />
              <div className="min-w-0">
                <p className="eyebrow">AI coach</p>
                <h2 className="mt-1 truncate font-display text-2xl font-black tracking-normal sm:text-3xl">{kaiName}</h2>
                <p className="mt-1 text-xs font-semibold capitalize text-muted sm:text-sm">{kaiTone} voice</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5">
              <MetricPill label="Read level" value={String(level)} tone="goals" />
              <MetricPill label="Days in" value={String(streak)} tone="care" />
              <MetricPill label="Mode" value={belt} tone="body" />
            </div>
            <div className="mt-4 grid gap-2 sm:mt-5 sm:gap-3">
              <ProfileRow icon={Brain} label="Kai starts with" value={primaryEngine === "physical" ? "Body" : primaryEngine === "potential" ? "Goals" : "Mind"} />
              <ProfileRow icon={HeartPulse} label="Saved reps" value={String(events.length)} />
              <ProfileRow icon={UserRound} label="Safety status" value={consentStatus.replace(/_/g, " ")} />
            </div>
          </AppSurface>

          <NextLoopCard context="compact" />
        </div>

        <div className="grid gap-4">
          <AppSurface className="hidden p-4 sm:p-5 lg:block">
            <p className="eyebrow">completion</p>
            <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4">
              {completions.map((item) => (
                <ProgressBar key={item.label} label={item.label} value={item.value} detail={item.detail} />
              ))}
            </div>
          </AppSurface>
          <ProgressSummary />
        </div>
      </div>
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

function ScoreRing({ score }: { score: number }) {
  const degrees = Math.max(0, Math.min(100, score)) * 3.6;
  return (
    <div className="mx-auto grid size-28 place-items-center rounded-full motion-safe:animate-pulse sm:size-44" style={{ background: `conic-gradient(#111116 ${degrees}deg, #ECE7DC 0deg)` }}>
      <div className="grid size-24 place-items-center rounded-full bg-white shadow-sm sm:size-36">
        <div className="text-center">
          <p className="text-4xl font-black leading-none text-ink sm:text-5xl">{score}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-muted">today</p>
        </div>
      </div>
    </div>
  );
}

function PathCard({
  path,
  level,
  streak,
  xp,
  score
}: {
  path: ReturnType<typeof growthPath>;
  level: number;
  streak: number;
  xp: number;
  score: number;
}) {
  return (
    <AppSurface className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <GrowthIcon level={level} score={score} size="sm" />
          <div className="min-w-0">
            <p className="eyebrow">current path</p>
            <h2 className="mt-1 truncate text-xl font-black leading-none text-ink sm:text-2xl">{path.current.name}</h2>
          </div>
        </div>
        <span className="rounded-full bg-[#F4F1EB] px-3 py-1 text-xs font-black text-muted">{path.current.label}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ProfileStat icon={Flame} label="Streak" value={String(streak)} tone="bg-[#FFF7D6] text-[#9A6A00]" />
        <ProfileStat icon={Trophy} label="Level" value={String(level)} tone="bg-[#111116] text-white" />
        <ProfileStat icon={BadgeCheck} label="XP" value={String(xp)} tone="bg-[#E4F7F4] text-[#218A7D]" />
      </div>

      <div className="mt-4 rounded-[22px] border border-line bg-paper p-3 sm:mt-5">
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
      <StreakStrip streak={streak} />
    </AppSurface>
  );
}

function ProgressBar({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-wider text-muted">
        <span>{label}</span>
        <span>{detail}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#ECE7DC]">
        <div className="h-full rounded-full bg-[#111116] transition-all duration-700" style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function StreakStrip({ streak }: { streak: number }) {
  return (
    <div className="mt-4 grid grid-cols-7 gap-1.5 sm:mt-5">
      {Array.from({ length: 7 }, (_, index) => {
        const active = index < Math.min(streak || 0, 7);
        return (
          <div key={index} className="grid gap-1 text-center">
            <span className={`grid size-7 place-items-center rounded-full text-xs font-black sm:size-8 ${active ? "bg-[#111116] text-white" : "bg-[#F4F1EB] text-muted"}`}>
              {active ? "✓" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MissionRow({ icon: Icon, label, points, done }: { icon: LucideIcon; label: string; points: number; done: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-[18px] border p-2.5 sm:p-3 ${done ? "border-[#D7F0EA] bg-[#F4FFFC]" : "border-line bg-paper"}`}>
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

function BadgeTile({ icon: Icon, label, unlocked }: { icon: LucideIcon; label: string; unlocked: boolean }) {
  return (
    <div className={`rounded-[18px] border p-3 ${unlocked ? "border-[#0A0A0A0F] bg-[#111116] text-white shadow-sm" : "border-line bg-paper text-muted"}`}>
      <div className={`grid size-9 place-items-center rounded-full ${unlocked ? "bg-white/12" : "bg-white"}`}>
        <Icon size={17} aria-hidden="true" />
      </div>
      <p className="mt-3 text-[13px] font-black leading-tight sm:text-sm">{label}</p>
      <p className={`mt-1 text-xs font-bold ${unlocked ? "text-white/55" : "text-muted"}`}>{unlocked ? "Unlocked" : "In progress"}</p>
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

function completionBreakdown(events: ProgressEvent[]) {
  const todays = todayEvents(events);
  const count = (patterns: RegExp[]) => todays.filter((event) => patterns.some((pattern) => pattern.test(`${event.engine} ${event.eventType}`.toLowerCase()))).length;
  const item = (label: string, patterns: RegExp[], target: number) => {
    const completed = count(patterns);
    return {
      label,
      value: Math.min(100, Math.round((completed / target) * 100)),
      detail: `${Math.min(completed, target)}/${target}`
    };
  };

  return [
    item("Goals", [/goal/, /potential/], 2),
    item("Sleep", [/sleep/], 1),
    item("Exercise", [/workout/, /stretch/, /move/, /scan/], 2),
    item("Food", [/food/, /meal/, /nutrition/], 1),
    item("Journal", [/journal/, /reflection/, /check/], 1),
    item("Wellness", [/mental/, /breath/, /reset/, /mood/], 2)
  ];
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

function ProfileStat({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/70 bg-white/82 p-3 shadow-sm backdrop-blur-xl sm:rounded-[24px] sm:p-4">
      <div className={`grid size-8 place-items-center rounded-full sm:size-9 ${tone}`}>
        <Icon size={17} aria-hidden="true" />
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-xl font-black leading-none text-ink sm:text-2xl">{value}</p>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof Brain; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-kai border border-line bg-paper p-3">
      <span className="flex min-w-0 items-center gap-2 text-sm font-black text-ink">
        <Icon size={17} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-muted">{value}</span>
    </div>
  );
}
