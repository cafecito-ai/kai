// Profile — placeholder for the new IA's Profile tab. The real settings
// page (src/pages/Settings.tsx) is still mounted at /settings; in later
// phases its functionality will move here. T-004 just needs this to exist
// so the tabbar's Profile tab has a destination.

// Profile — account + preferences + the deeper "get to know yourself"
// Strengths Discovery flow.
//
// Goals are deliberately NOT linked here — they're set-and-forget
// daily-action stuff, surfaced from the + sheet ("Set a goal"). Profile
// is for things that don't fit "do a thing today": who KAI is for you,
// who YOU are to KAI, and the boring account knobs.

import { Award, ChevronRight, Flame, Settings as SettingsIcon, Sparkles, User, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { LevelCard } from "../components/LevelCard";
import { badgeSummary } from "../lib/local-badges";
import { challengeSummary } from "../lib/local-challenges";

export function Profile() {
  const [badges, setBadges] = useState<{ earned: number; total: number } | null>(null);
  const [challenges, setChallenges] = useState<{ active: number; completed: number } | null>(null);
  useEffect(() => {
    setBadges(badgeSummary());
    setChallenges(challengeSummary());
  }, []);

  return (
    <div className="mx-auto max-w-md py-8 px-5">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-cool-soft">
          <User size={24} className="text-accent-cool" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="mt-2 text-text-secondary">
          Your account and preferences.
        </p>
      </div>

      {/* Rawz/3 — level + XP overview */}
      <div className="mt-6">
        <LevelCard />
      </div>

      <div className="mt-4 space-y-2">
        {/* Rawz/6 — Challenges entry */}
        <Link
          to="/challenges"
          className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card transition hover:bg-surface-muted focus-ring"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft">
              <Flame size={16} className="text-success" />
            </span>
            <span>
              <span className="block text-sm font-medium text-text-primary">
                Challenges
              </span>
              <span className="block text-xs text-text-secondary">
                {challenges
                  ? `${challenges.active} active · ${challenges.completed} done`
                  : "Short opt-in stretches, no penalties"}
              </span>
            </span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </Link>

        {/* Rawz/4 — Badges entry */}
        <Link
          to="/badges"
          className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card transition hover:bg-surface-muted focus-ring"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-warm-soft">
              <Award size={16} className="text-accent-warm" />
            </span>
            <span>
              <span className="block text-sm font-medium text-text-primary">
                Badges
              </span>
              <span className="block text-xs text-text-secondary">
                {badges ? `${badges.earned} of ${badges.total} earned` : "Milestones, not measurements"}
              </span>
            </span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </Link>

        {/* About you — edit the answers from onboarding (name, goal, why,
            tone) and your future photo. Saving updates the home screen. */}
        <Link
          to="/about-you"
          className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card transition hover:bg-surface-muted focus-ring"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-cool-soft">
              <Sparkles size={16} className="text-accent-cool" />
            </span>
            <span>
              <span className="block text-sm font-medium text-text-primary">
                About you
              </span>
              <span className="block text-xs text-text-secondary">
                Your name, goal, why, and future photo
              </span>
            </span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </Link>

        {/* Invite a friend — shareable link + QR (friend graph is backend). */}
        <Link
          to="/invite"
          className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card transition hover:bg-surface-muted focus-ring"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
              <UserPlus size={16} className="text-accent" />
            </span>
            <span>
              <span className="block text-sm font-medium text-text-primary">
                Invite a friend
              </span>
              <span className="block text-xs text-text-secondary">
                Share your link or QR
              </span>
            </span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </Link>

        <Link
          to="/settings"
          className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card transition hover:bg-surface-muted focus-ring"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
              <SettingsIcon size={16} className="text-text-secondary" />
            </span>
            <span>
              <span className="block text-sm font-medium text-text-primary">
                Settings
              </span>
              <span className="block text-xs text-text-secondary">
                Tone, notifications, privacy
              </span>
            </span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </Link>
      </div>
    </div>
  );
}
