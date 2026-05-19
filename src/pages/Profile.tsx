// Profile — placeholder for the new IA's Profile tab. The real settings
// page (src/pages/Settings.tsx) is still mounted at /settings; in later
// phases its functionality will move here. T-004 just needs this to exist
// so the tabbar's Profile tab has a destination.

import { ChevronRight, Settings as SettingsIcon, Target, User } from "lucide-react";
import { Link } from "react-router-dom";

export function Profile() {
  return (
    <div className="mx-auto max-w-md py-8">
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

      <div className="mt-8 space-y-2">
        <Link
          to="/goals"
          className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card transition hover:bg-surface-muted"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-cool-soft">
              <Target size={16} className="text-accent-cool" />
            </span>
            <span>
              <span className="block text-sm font-medium text-text-primary">
                Goals
              </span>
              <span className="block text-xs text-text-secondary">
                Identity-based · max 3 active
              </span>
            </span>
          </span>
          <ChevronRight size={18} className="text-text-muted" />
        </Link>
        <Link
          to="/settings"
          className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card transition hover:bg-surface-muted"
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
