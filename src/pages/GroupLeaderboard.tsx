// /groups/:id/leaderboard — opt-in weekly leaderboard (T-039).
//
// Community language only — never "compete / beat / win / rank / crushing".
// Top three get a subtle highlight, not aggressive framing.

import { ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "../lib/api";

type Bucket = "high" | "mid" | "low" | "hidden" | "none";
type Entry = {
  userId: string;
  displayName: string;
  bucket: Bucket;
  streakDays: number;
};

export function GroupLeaderboard() {
  const { id } = useParams<{ id: string }>();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getGroupLeaderboard(id)
      .then((r) => setEntries(r.entries))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Couldn't load."),
      );
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-md px-5 pt-2 pb-6 sm:max-w-lg">
      <header className="flex items-center justify-between pb-3">
        <Link
          to={`/groups/${id}`}
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">
          leaderboard
        </p>
        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      <div className="pb-5">
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          This week
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Only people who opted in show up here. It's not a contest — just a
          read on who's showing up alongside you.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-warning-soft bg-warning-soft px-3 py-2 text-sm text-warning">
          {error}
        </p>
      )}

      {entries == null ? (
        <p className="rounded-glass border border-glass-border bg-surface p-6 text-center text-sm text-text-secondary shadow-card">
          Loading…
        </p>
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {entries.map((e, i) => (
            <Row key={e.userId} entry={e} position={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ entry, position }: { entry: Entry; position: number }) {
  const isTop3 = position <= 3;
  const tint = bucketTint(entry.bucket);
  return (
    <div
      className={`
        flex items-center gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3
        shadow-card
        ${isTop3 ? "border-l-4 border-l-accent-cool" : ""}
      `}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted font-mono text-sm font-medium text-text-primary">
        {position}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          {entry.displayName}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${tint}`}>
            {bucketLabel(entry.bucket)}
          </span>
          {entry.streakDays > 0 && (
            <span>{entry.streakDays}-day streak</span>
          )}
        </p>
      </div>
      {isTop3 && (
        <Sparkles size={14} className="text-accent-cool" aria-hidden="true" />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-glass border border-glass-border bg-surface p-6 text-center shadow-card">
      <p className="text-sm text-text-secondary">
        Nobody's on the leaderboard yet — including you. Turn on "Show me on
        the weekly leaderboard" on the group page to opt in.
      </p>
    </div>
  );
}

function bucketLabel(b: Bucket): string {
  switch (b) {
    case "high":
      return "85+";
    case "mid":
      return "60–75";
    case "low":
      return "under 60";
    case "hidden":
      return "—";
    case "none":
      return "no read yet";
  }
}

function bucketTint(b: Bucket): string {
  switch (b) {
    case "high":
      return "bg-success-soft text-success";
    case "mid":
      return "bg-accent-cool-soft text-accent-cool";
    case "low":
      return "bg-warning-soft text-warning";
    case "hidden":
    case "none":
      return "bg-surface-muted text-text-secondary";
  }
}
