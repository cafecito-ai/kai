// Friend challenges (spec #10) — simple shared goals between two friends
// ("20 workouts this month", "7-day sleep challenge"). The purpose is growing
// together, not competition: both members can complete. Lightweight on top of
// the friend graph; needs an accepted friendship to create one.

import { ArrowLeft, Plus, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../lib/api";

type Member = { userId: string; displayName: string; count: number; isYou: boolean; complete: boolean };
type Challenge = {
  id: string;
  title: string;
  metric: string;
  target: number;
  endsOn: string;
  daysRemaining: number;
  members: Member[];
};

export function FriendChallenges() {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(20);
  const [days, setDays] = useState(30);

  async function load() {
    const [list, friends] = await Promise.all([
      api.listChallenges().catch(() => ({ challenges: [] as Challenge[] })),
      api.listFriends().catch(() => ({ accepted: [], incoming: [], outgoing: [] })),
    ]);
    setChallenges(list.challenges ?? []);
    setFriendshipId(friends.accepted[0]?.friendshipId ?? null);
  }
  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (!friendshipId || !title.trim() || creating) return;
    setCreating(true);
    try {
      await api.createChallenge({ friendshipId, title: title.trim(), metric: "custom", target, days });
      setTitle("");
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function bump(id: string) {
    await api.bumpChallenge(id, 1).catch(() => undefined);
    await load();
  }

  return (
    <div className="mx-auto max-w-md px-5 py-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Back"
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-border bg-surface text-text-secondary transition hover:bg-surface-muted focus-ring"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Challenges</h1>
          <p className="text-sm text-text-secondary">Shared goals. Grow together, not against.</p>
        </div>
      </div>

      {/* Create */}
      <div className="mt-6 rounded-lg border border-glass-border bg-surface p-4 shadow-card">
        {!friendshipId ? (
          <p className="text-sm text-text-secondary">
            Add a friend first — challenges are something you do together.
          </p>
        ) : (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 20 workouts this month"
              className="w-full rounded-full border border-glass-border bg-surface-muted px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus-ring"
            />
            <div className="mt-3 flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                Target
                <input
                  type="number"
                  value={target}
                  min={1}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-16 rounded-lg border border-glass-border bg-surface-muted px-2 py-1 text-sm text-text-primary focus-ring"
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                Days
                <input
                  type="number"
                  value={days}
                  min={1}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-16 rounded-lg border border-glass-border bg-surface-muted px-2 py-1 text-sm text-text-primary focus-ring"
                />
              </label>
              <button
                type="button"
                onClick={create}
                disabled={!title.trim() || creating}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-text-primary px-4 py-2 text-sm font-semibold text-background transition active:scale-95 disabled:bg-text-soft focus-ring"
              >
                <Plus size={14} aria-hidden="true" /> Start
              </button>
            </div>
          </>
        )}
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {!challenges ? (
          <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
        ) : challenges.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No challenges yet.</p>
        ) : (
          challenges.map((ch) => (
            <div key={ch.id} className="rounded-lg border border-glass-border bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-display text-base font-semibold text-text-primary">
                  <Trophy size={15} className="text-accent" aria-hidden="true" />
                  {ch.title}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
                  {ch.daysRemaining > 0 ? `${ch.daysRemaining}d left` : "ended"}
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {ch.members.map((m) => (
                  <div key={m.userId} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-text-secondary">
                      {m.isYou ? "You" : m.displayName}
                      {m.complete ? " ✅" : ""}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-text-primary">
                        {m.count}/{ch.target}
                      </span>
                      {m.isYou && !m.complete && (
                        <button
                          type="button"
                          onClick={() => bump(ch.id)}
                          className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent transition active:scale-95 focus-ring"
                        >
                          +1
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
