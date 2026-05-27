// Rawz/7 — group activity feed.
//
// Renders the most recent 50 achievements posted into one group. Each
// row gets a fixed 4-emoji reaction strip — tap to add yours, tap the
// same one again to remove. People who haven't reacted can still see the
// count, so the social proof loop closes even without you tapping.
//
// Lives inside /groups/:id below the privacy toggles and above the
// member list. Empty state is friendly — never shame the group for
// being quiet.

import { Award, Flame, Sparkles, Target as TargetIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

type ActivityKind = "badge" | "level_up" | "streak" | "goal_completed";
type Reaction = "🔥" | "💪" | "👏" | "🎯";

type ActivityItem = {
  id: string;
  actorUserId: string;
  actorDisplayName: string;
  isMe: boolean;
  kind: ActivityKind;
  label: string;
  refKey: string;
  createdAt: string;
  reactions: Partial<Record<Reaction, number>>;
  myReactions: Reaction[];
};

const REACTIONS: ReadonlyArray<Reaction> = ["🔥", "💪", "👏", "🎯"];

export function GroupActivityFeed({ groupId }: { groupId: string }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const r = await api.getGroupActivity(groupId);
      setItems(r.activity);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't load activity.");
    }
  }, [groupId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Optimistic toggle — flip the count locally, fire the API, reload on
  // mismatch. Most teen apps feel slow because they wait for the server;
  // this keeps taps instant.
  const toggle = useCallback(
    async (activityId: string, reaction: Reaction) => {
      setItems((current) => {
        if (!current) return current;
        return current.map((it) => {
          if (it.id !== activityId) return it;
          const had = it.myReactions.includes(reaction);
          const nextMine = had
            ? it.myReactions.filter((r) => r !== reaction)
            : [...it.myReactions, reaction];
          const nextCounts = { ...it.reactions };
          const delta = had ? -1 : 1;
          const curr = nextCounts[reaction] ?? 0;
          const next = Math.max(0, curr + delta);
          if (next === 0) delete nextCounts[reaction];
          else nextCounts[reaction] = next;
          return { ...it, reactions: nextCounts, myReactions: nextMine };
        });
      });
      try {
        await api.toggleGroupActivityReaction(activityId, reaction);
      } catch {
        // Reconcile with the server's view if our optimistic guess was
        // wrong — covers the rare case where someone reacted at the same
        // instant on another device.
        void reload();
      }
    },
    [reload],
  );

  if (error) {
    return (
      <section className="mt-5">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          activity
        </p>
        <p className="rounded-glass border border-glass-border bg-surface p-4 text-sm text-text-secondary shadow-card">
          {error}
        </p>
      </section>
    );
  }
  if (items === null) {
    return (
      <section className="mt-5">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
          activity
        </p>
        <p className="rounded-glass border border-glass-border bg-surface p-4 text-sm text-text-secondary shadow-card">
          Loading…
        </p>
      </section>
    );
  }

  return (
    <section className="mt-5">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        activity
      </p>
      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <ActivityRow
              key={it.id}
              item={it}
              onReact={(r) => toggle(it.id, r)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="rounded-glass border border-glass-border bg-surface p-4 shadow-card">
      <p className="text-sm text-text-secondary">
        Nothing yet. When anyone in the group hits a milestone — a badge,
        a level, a streak — it'll show up here so you can give them a 🔥.
      </p>
    </div>
  );
}

function ActivityRow({
  item,
  onReact,
}: {
  item: ActivityItem;
  onReact: (r: Reaction) => void;
}) {
  const Icon = iconFor(item.kind);
  const accent = accentFor(item.kind);
  return (
    <div className="rounded-glass border border-glass-border bg-surface p-3 shadow-card">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${accent}`}
          aria-hidden="true"
        >
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <div className="flex-1">
          <p className="text-sm leading-snug text-text-primary">
            <span className="font-semibold">
              {item.isMe ? "You" : item.actorDisplayName}
            </span>{" "}
            <span className="text-text-secondary">{item.label}</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {relativeTime(item.createdAt)}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {REACTIONS.map((r) => {
          const count = item.reactions[r] ?? 0;
          const mine = item.myReactions.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => onReact(r)}
              aria-label={`React ${r}${mine ? " (added)" : ""}`}
              className={`
                inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs
                transition active:scale-95 focus-ring
                ${
                  mine
                    ? "border-accent-warm bg-accent-warm-soft text-accent-warm"
                    : "border-glass-border bg-surface text-text-secondary hover:bg-surface-muted"
                }
              `}
            >
              <span aria-hidden="true">{r}</span>
              {count > 0 && (
                <span className="font-mono text-[10px] tabular-nums">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function iconFor(kind: ActivityKind) {
  switch (kind) {
    case "badge":
      return Award;
    case "level_up":
      return Sparkles;
    case "streak":
      return Flame;
    case "goal_completed":
      return TargetIcon;
  }
}

// Tinted backgrounds matching the rest of the app's accent vocabulary.
function accentFor(kind: ActivityKind): string {
  switch (kind) {
    case "badge":
      return "bg-accent-cool-soft text-accent-cool";
    case "level_up":
      return "bg-accent-soft text-accent";
    case "streak":
      return "bg-accent-warm-soft text-accent-warm";
    case "goal_completed":
      return "bg-accent-cool-soft text-accent-cool";
  }
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso + (iso.endsWith("Z") ? "" : "Z")).getTime();
  if (Number.isNaN(ms)) return "just now";
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}
