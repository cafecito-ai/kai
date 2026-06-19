// Friends — the lightweight accountability surface (spec #9). NOT a social
// network: just the people you're doing this with and a simple read on how
// they're showing up. Aggregate-only by design (name + streak + level) — never
// conversations, goals, reflections, or meal photos.
//
// Reads the existing /friends/compare endpoint. The friend GRAPH (search,
// invite-link acceptance, 1:1 challenges) is backend-owned and not built here;
// until a connection exists this shows the honest empty state + invite CTA.

import { ArrowLeft, Flame, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api } from "../lib/api";

type Friend = {
  userId: string;
  displayName: string;
  level: number;
  streakOverall: number;
  totalScore: number;
};

export function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    api
      .getFriendCompare()
      .then((res) => {
        if (alive) setFriends(res.friends ?? []);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-border bg-surface text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Friends</h1>
          <p className="text-sm text-text-secondary">The people you're doing this with.</p>
        </div>
        <Link
          to="/invite"
          aria-label="Invite a friend"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent transition hover:bg-accent-soft/60 focus-ring"
        >
          <UserPlus size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6">
        {failed || (friends && friends.length === 0) ? (
          <EmptyState />
        ) : !friends ? (
          <p className="py-10 text-center text-sm text-text-muted">Loading…</p>
        ) : (
          <ul className="space-y-2">
            {friends.map((f) => (
              <li
                key={f.userId}
                className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted font-mono text-sm font-semibold text-text-primary">
                    {f.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{f.displayName}</p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
                      Level {f.level}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs">
                  <Flame size={12} className="text-accent-warm" aria-hidden="true" />
                  <span className="font-medium text-text-primary">
                    {f.streakOverall}-day streak
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-glass-border bg-surface-muted/40 px-5 py-8 text-center">
      <p className="font-display text-lg font-medium text-text-primary">No friends here yet.</p>
      <p className="mt-1 text-sm text-text-secondary">
        Doing this with someone makes it stick. Send them your link.
      </p>
      <Link
        to="/invite"
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-text-primary px-4 py-2.5 text-sm font-semibold text-background shadow-card transition active:scale-95 focus-ring"
      >
        <UserPlus size={14} aria-hidden="true" />
        Invite a friend
      </Link>
    </div>
  );
}
