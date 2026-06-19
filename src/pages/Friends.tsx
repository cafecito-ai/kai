// Friends — the lightweight accountability surface (spec #9). NOT a social
// network: the people you're doing this with, a simple read on how they're
// showing up (aggregate-only: name + level + streak), an add-by-username flow,
// an accept inbox, and a link to 1:1 challenges. No conversations, goals,
// reflections, or meal photos ever cross between friends.

import { ArrowLeft, Check, Flame, Trophy, UserPlus } from "lucide-react";
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
type Incoming = { friendshipId: string; username: string | null; displayName: string };

export function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [failed, setFailed] = useState(false);

  // Add-a-friend state.
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Your-username state (so friends can find you).
  const [myHandle, setMyHandle] = useState("");
  const [myHandleStatus, setMyHandleStatus] = useState<string | null>(null);

  async function saveMyHandle() {
    const u = myHandle.trim();
    if (!u) return;
    const res = await api
      .setUsername(u)
      .catch(() => ({ error: "Couldn't save." }) as { username?: string; error?: string });
    setMyHandleStatus(res.error ?? `You're findable as @${res.username}.`);
  }

  async function load() {
    try {
      const [cmp, list] = await Promise.all([api.getFriendCompare(), api.listFriends()]);
      setFriends(cmp.friends ?? []);
      setIncoming(list.incoming ?? []);
    } catch {
      setFailed(true);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function addFriend() {
    const u = handle.trim();
    if (!u || busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const res = await api.requestFriend(u);
      if (res.error) setStatus(res.error);
      else if (res.alreadyExists) setStatus("You're already connected (or a request is pending).");
      else setStatus(`Request sent to ${u}.`);
      setHandle("");
    } catch {
      setStatus("Couldn't send that — try again.");
    } finally {
      setBusy(false);
    }
  }

  async function accept(friendshipId: string) {
    await api.acceptFriend(friendshipId).catch(() => undefined);
    await load();
  }

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

      {/* Your username — so friends can find you */}
      <div className="mt-6 rounded-lg border border-glass-border bg-surface p-4 shadow-card">
        <p className="text-sm font-medium text-text-primary">Your username</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={myHandle}
            onChange={(e) => setMyHandle(e.target.value)}
            placeholder="pick a username"
            className="flex-1 rounded-full border border-glass-border bg-surface-muted px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus-ring"
          />
          <button
            type="button"
            onClick={saveMyHandle}
            disabled={!myHandle.trim()}
            className="rounded-full bg-text-primary px-4 py-2 text-sm font-semibold text-background transition active:scale-95 disabled:bg-text-soft focus-ring"
          >
            Save
          </button>
        </div>
        {myHandleStatus && <p className="mt-2 text-xs text-text-secondary">{myHandleStatus}</p>}
      </div>

      {/* Add by username */}
      <div className="mt-4 rounded-lg border border-glass-border bg-surface p-4 shadow-card">
        <p className="text-sm font-medium text-text-primary">Add a friend by username</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="their username"
            className="flex-1 rounded-full border border-glass-border bg-surface-muted px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus-ring"
          />
          <button
            type="button"
            onClick={addFriend}
            disabled={busy || !handle.trim()}
            className="rounded-full bg-text-primary px-4 py-2 text-sm font-semibold text-background transition active:scale-95 disabled:bg-text-soft focus-ring"
          >
            Add
          </button>
        </div>
        {status && <p className="mt-2 text-xs text-text-secondary">{status}</p>}
      </div>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">requests</p>
          <ul className="mt-2 space-y-2">
            {incoming.map((r) => (
              <li
                key={r.friendshipId}
                className="flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card"
              >
                <span className="text-sm text-text-primary">
                  {r.displayName}
                  {r.username ? ` · @${r.username}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => accept(r.friendshipId)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent transition active:scale-95 focus-ring"
                >
                  <Check size={13} aria-hidden="true" /> Accept
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Challenges entry */}
      <Link
        to="/challenges"
        className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-glass-border bg-surface px-4 py-3 shadow-card transition hover:bg-surface-muted focus-ring"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
            <Trophy size={16} className="text-accent" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-text-primary">Challenges</span>
        </span>
        <span className="text-text-muted">›</span>
      </Link>

      {/* Accountability list */}
      <div className="mt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
          showing up
        </p>
        {failed || (friends && friends.length === 0) ? (
          <EmptyState />
        ) : !friends ? (
          <p className="py-8 text-center text-sm text-text-muted">Loading…</p>
        ) : (
          <ul className="mt-2 space-y-2">
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
                  <span className="font-medium text-text-primary">{f.streakOverall}-day streak</span>
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
    <div className="mt-2 rounded-2xl border border-glass-border bg-surface-muted/40 px-5 py-8 text-center">
      <p className="font-display text-lg font-medium text-text-primary">No friends here yet.</p>
      <p className="mt-1 text-sm text-text-secondary">
        Add someone by username above, or send them your invite link.
      </p>
    </div>
  );
}
