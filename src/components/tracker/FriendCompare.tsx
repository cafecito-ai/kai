import { Lock, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Friend = Awaited<ReturnType<typeof api.getFriendCompare>>["friends"][number];

/**
 * Friend compare — opt-in, aggregate only. Section 9.3:
 *   "Does NOT show: any conversation content, any goal content, any
 *    reflection content, any meal photos. Aggregate stats only."
 *
 * Behind VITE_FRIEND_COMPARE_ENABLED so it never accidentally ships
 * before minor-specific privacy review (plan note in P2-5). When
 * disabled, renders a small "coming after privacy review" placeholder
 * for internal previews.
 */
export function FriendCompare() {
  // Enabled by default — the /friends/compare backend is aggregate-only (level +
  // streak + total score; never conversation/goal/reflection content). Set
  // VITE_FRIEND_COMPARE_ENABLED=0 to hide it again.
  const enabled = import.meta.env.VITE_FRIEND_COMPARE_ENABLED !== "0";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    if (!enabled) {
      setState("ok");
      return;
    }
    let cancelled = false;
    api
      .getFriendCompare()
      .then((result) => {
        if (cancelled) return;
        setFriends(result.friends);
        setState("ok");
      })
      .catch(() => {
        if (cancelled) return;
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) {
    return (
      <section className="rounded-kai border border-line bg-paper p-5">
        <div className="mb-3 grid size-12 place-items-center rounded-full bg-white text-muted">
          <Lock />
        </div>
        <p className="eyebrow">friend compare</p>
        <h2 className="mt-2 font-display text-2xl font-black tracking-normal">Coming after privacy review.</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Opt-in only, aggregate stats only: streak, level, weekly score. Never reflection content, never meal photos. The
          surface stays hidden from teens until a minor-specific privacy review is on the record.
        </p>
      </section>
    );
  }

  if (state === "loading") {
    return <p className="text-sm text-muted">Loading friend leaderboard…</p>;
  }

  if (state === "error") {
    return <p className="text-sm text-coral">Could not load friend compare. Try again in a moment.</p>;
  }

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-full bg-[#EEEAFF] text-plum">
          <Users />
        </div>
        <div>
          <p className="eyebrow">friend compare</p>
          <h2 className="mt-1 font-display text-2xl font-black tracking-normal">Opt-in leaderboard</h2>
        </div>
      </div>
      <p className="text-xs text-muted">Aggregate stats only — no content shared between accounts.</p>
      {friends.length === 0 ? (
        <p className="mt-4 rounded-kai border border-line bg-paper p-3 text-sm text-muted">
          No friend connections yet. Use Settings to invite someone, then they'll show up here.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {friends.map((friend, index) => (
            <li key={friend.userId} className="flex items-center gap-3 rounded-kai border border-line bg-paper p-3">
              <span className="grid size-8 place-items-center rounded-full bg-white font-display text-sm font-black text-plum">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black">{friend.displayName}</p>
                <p className="text-xs text-muted">
                  Level {friend.level} · {friend.streakOverall} day streak
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
