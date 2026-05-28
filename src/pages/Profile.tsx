import { Award, ChevronRight, Flame, Settings as SettingsIcon, Sparkles, Trophy, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { FlowerProgressBar } from "../components/FlowerProgressBar";
import { badgeSummary } from "../lib/local-badges";
import { challengeSummary } from "../lib/local-challenges";
import { computeLocalScore, readLocalInputs } from "../lib/local-score";
import { getCurrentLevel, type LevelInfo } from "../lib/local-xp";

type ProfileState = {
  level: LevelInfo;
  streak: number;
  badges: { earned: number; total: number };
  challenges: { active: number; completed: number };
};

export function Profile() {
  const [state] = useState<ProfileState>(() => buildProfileState());

  const levelTarget = state.level.nextLevelXp - state.level.levelStartXp;
  const badgePct = state.badges.total > 0 ? state.badges.earned / state.badges.total : 0;

  return (
    <div className="mx-auto w-full max-w-xs space-y-5 py-6 sm:max-w-sm">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
            profile
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Your path
          </h1>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-cool-soft">
          <User size={21} className="text-accent-cool" />
        </div>
      </header>

      <section className="overflow-hidden rounded-glass border border-glass-border bg-surface p-5 shadow-card-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
              growth
            </p>
            <p className="mt-1 font-display text-2xl font-semibold leading-tight">
              Level {state.level.level}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {state.level.label}
            </p>
          </div>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft">
            <Sparkles size={18} className="text-accent" />
          </span>
        </div>

        <div className="mt-6">
          <FlowerProgressBar
            value={state.level.xpInLevel}
            target={levelTarget}
            category={state.streak >= 3 ? "body" : "mind"}
            ariaLabel={`${state.level.xpInLevel} of ${levelTarget} XP to next level`}
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            <span>{state.level.xpInLevel} XP</span>
            <span>{state.level.xpToNext} to next</span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-1.5">
          <Stat label="streak" value={`${state.streak}d`} icon={Flame} />
          <Stat label="xp" value={String(state.level.totalXp)} icon={Trophy} />
          <Stat label="badges" value={`${state.badges.earned}/${state.badges.total}`} icon={Award} />
        </div>
      </section>

      <section className="rounded-glass border border-glass-border bg-surface p-4 shadow-card">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          next on the path
        </p>
        <div className="mt-3 divide-y divide-glass-border">
          <PathRow to="/badges" title="Badges" detail={`${Math.round(badgePct * 100)}% discovered`} icon={Award} />
          <PathRow
            to="/challenges"
            title="Challenges"
            detail={`${state.challenges.active} active · ${state.challenges.completed} done`}
            icon={Flame}
          />
          <PathRow to="/strengths" title="Strengths discovery" detail="Know your patterns" icon={Sparkles} />
          <PathRow to="/settings" title="Settings" detail="Tone, privacy, notifications" icon={SettingsIcon} />
        </div>
      </section>

      <p className="px-2 text-center text-xs leading-relaxed text-text-muted">
        XP never drops. Missed days do not punish you. The path just waits for the next honest rep.
      </p>
    </div>
  );
}

function buildProfileState(): ProfileState {
  const inputs = readLocalInputs();
  return {
    level: getCurrentLevel(),
    streak: computeLocalScore(inputs).streak,
    badges: badgeSummary(),
    challenges: challengeSummary(),
  };
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Flame;
}) {
  return (
    <div className="rounded-2xl bg-surface-muted px-2 py-3 text-center">
      <Icon size={14} className="mx-auto text-text-secondary" />
      <p className="mt-1 font-mono text-base font-semibold tabular-nums text-text-primary">
        {value}
      </p>
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">
        {label}
      </p>
    </div>
  );
}

function PathRow({
  to,
  title,
  detail,
  icon: Icon,
}: {
  to: string;
  title: string;
  detail: string;
  icon: typeof Flame;
}) {
  return (
    <Link to={to} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 focus-ring">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
        <Icon size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text-primary">{title}</span>
        <span className="block text-xs text-text-secondary">{detail}</span>
      </span>
      <ChevronRight size={16} className="text-text-muted" />
    </Link>
  );
}
