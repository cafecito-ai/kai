// Phase G — friend-graph END-TO-END test. Drives the REAL route handlers
// (workers/src/routes/friends.ts) through the full two-user flow against an
// in-memory D1 stand-in. No Clerk / no staging needed: a test middleware sets
// c.get("userId") from an x-test-user header, exactly what requireAuth does in
// prod. This is the deterministic equivalent of the live two-user E2E.

import { Hono } from "hono";
import { beforeEach, describe, expect, it } from "vitest";

import { friendsRoutes } from "../src/routes/friends";

// ── Minimal in-memory D1 that understands the queries friends.ts runs ──
type Row = Record<string, unknown>;
function makeDb() {
  const users: Row[] = [];
  const friendships: Row[] = [];
  const challenges: Row[] = [];
  const progress: Row[] = [];
  const progressEvents: Row[] = [];

  function exec(sqlRaw: string, args: unknown[]) {
    const sql = sqlRaw.replace(/\s+/g, " ").trim();
    const has = (frag: string) => sql.includes(frag);

    // users
    if (has("UPDATE users SET username")) {
      const u = users.find((x) => x.id === args[1]);
      if (u) u.username = args[0];
      return {};
    }
    if (has("SELECT id, username, display_name FROM users WHERE username = ? AND id != ?")) {
      return users.find((x) => x.username === args[0] && x.id !== args[1] && !x.deleted_at) ?? null;
    }
    if (has("SELECT id FROM users WHERE username = ? AND id != ?")) {
      return users.find((x) => x.username === args[0] && x.id !== args[1]) ?? null;
    }
    if (has("SELECT id FROM users WHERE username = ? AND deleted_at IS NULL")) {
      return users.find((x) => x.username === args[0] && !x.deleted_at) ?? null;
    }
    if (has("SELECT username, display_name FROM users WHERE id = ?")) {
      return users.find((x) => x.id === args[0]) ?? null;
    }
    if (has("SELECT display_name FROM users WHERE id = ?")) {
      return users.find((x) => x.id === args[0]) ?? null;
    }

    // friendships
    if (has("INSERT INTO friendships")) {
      friendships.push({ id: args[0], user_a: args[1], user_b: args[2], status: "pending", created_at: new Date().toISOString() });
      return {};
    }
    if (has("(user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)")) {
      return (
        friendships.find(
          (f) =>
            (f.user_a === args[0] && f.user_b === args[1]) ||
            (f.user_a === args[2] && f.user_b === args[3]),
        ) ?? null
      );
    }
    if (has("UPDATE friendships SET status = 'accepted'")) {
      const f = friendships.find((x) => x.id === args[0]);
      if (f) f.status = "accepted";
      return {};
    }
    if (has("FROM friendships WHERE id = ?")) {
      return friendships.find((x) => x.id === args[0]) ?? null;
    }
    if (has("status = 'accepted' AND (user_a = ? OR user_b = ?)")) {
      return friendships.filter((f) => f.status === "accepted" && (f.user_a === args[0] || f.user_b === args[0]));
    }
    if (has("FROM friendships WHERE user_a = ? OR user_b = ?")) {
      return friendships.filter((f) => f.user_a === args[0] || f.user_b === args[0]);
    }

    // progress_events (for /compare)
    if (has("FROM progress_events WHERE user_id = ?")) {
      return progressEvents.filter((e) => e.user_id === args[0]);
    }

    // challenges
    if (has("INSERT INTO friend_challenges")) {
      challenges.push({
        id: args[0], friendship_id: args[1], creator_id: args[2], title: args[3],
        metric: args[4], target: args[5], starts_on: args[6], ends_on: args[7],
        status: "active", created_at: new Date().toISOString(),
      });
      return {};
    }
    if (has("FROM friend_challenges ch JOIN friendships f")) {
      const mine = challenges.filter((ch) => {
        const f = friendships.find((x) => x.id === ch.friendship_id);
        return f && f.status === "accepted" && (f.user_a === args[0] || f.user_b === args[0]);
      });
      return mine.map((ch) => ({
        id: ch.id, title: ch.title, metric: ch.metric, target: ch.target,
        starts_on: ch.starts_on, ends_on: ch.ends_on, status: ch.status,
      }));
    }

    // challenge progress
    if (has("INSERT INTO friend_challenge_progress")) {
      progress.push({ challenge_id: args[0], user_id: args[1], count: 0 });
      return {};
    }
    if (has("FROM friend_challenge_progress p JOIN users u")) {
      return progress
        .filter((p) => p.challenge_id === args[0])
        .map((p) => ({
          user_id: p.user_id,
          count: p.count,
          display_name: users.find((u) => u.id === p.user_id)?.display_name ?? null,
        }));
    }
    if (has("SELECT status, ends_on FROM friend_challenges WHERE id = ?")) {
      return challenges.find((ch) => ch.id === args[0]) ?? null;
    }
    if (has("SELECT count FROM friend_challenge_progress WHERE challenge_id = ? AND user_id = ?")) {
      return progress.find((p) => p.challenge_id === args[0] && p.user_id === args[1]) ?? null;
    }
    if (has("UPDATE friend_challenge_progress SET count")) {
      const p = progress.find((x) => x.challenge_id === args[1] && x.user_id === args[2]);
      if (p) p.count = args[0];
      return {};
    }

    throw new Error(`Unhandled SQL in fake D1: ${sql}`);
  }

  const DB = {
    prepare(sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            first: async () => exec(sql, args),
            all: async () => ({ results: exec(sql, args) }),
            run: async () => exec(sql, args),
          };
        },
      };
    },
  };
  return { DB, users, progressEvents };
}

function makeClient(db: ReturnType<typeof makeDb>) {
  const app = new Hono<{ Variables: { userId: string } }>();
  app.use("*", async (c, next) => {
    c.set("userId", c.req.header("x-test-user") ?? "");
    await next();
  });
  app.route("/", friendsRoutes);
  return (user: string, path: string, init: RequestInit = {}) =>
    app.request(
      path,
      { ...init, headers: { "content-type": "application/json", "x-test-user": user, ...(init.headers ?? {}) } },
      { DB: db.DB } as unknown as Record<string, unknown>,
    );
}

// Typed JSON reader so the test stays strict without `unknown` noise.
async function body<T>(r: Response): Promise<T> {
  return (await r.json()) as T;
}

describe("friend graph — two-user E2E", () => {
  let db: ReturnType<typeof makeDb>;
  let call: ReturnType<typeof makeClient>;

  beforeEach(() => {
    db = makeDb();
    db.users.push({ id: "alice", username: null, display_name: "Alice", deleted_at: null });
    db.users.push({ id: "bob", username: null, display_name: "Bob", deleted_at: null });
    db.users.push({ id: "carol", username: null, display_name: "Carol", deleted_at: null });
    call = makeClient(db);
  });

  it("runs the whole flow: usernames → search → request → accept → compare → challenge → progress", async () => {
    // 1. Both set usernames.
    expect((await call("alice", "/friends/username", { method: "PATCH", body: JSON.stringify({ username: "AliceBoxer" }) })).status).toBe(200);
    expect((await call("bob", "/friends/username", { method: "PATCH", body: JSON.stringify({ username: "bob_99" }) })).status).toBe(200);

    // 2. Bob finds Alice.
    const search = await call("bob", "/friends/search?u=aliceboxer");
    expect(search.status).toBe(200);
    expect((await body<{ user: { username: string } }>(search)).user.username).toBe("aliceboxer");

    // 3. Bob requests Alice.
    const reqRes = await call("bob", "/friends/request", { method: "POST", body: JSON.stringify({ username: "aliceboxer" }) });
    expect(reqRes.status).toBe(200);
    const friendshipId = (await body<{ friendship: { id: string } }>(reqRes)).friendship.id;

    // 4. Duplicate request is guarded.
    const dup = await call("bob", "/friends/request", { method: "POST", body: JSON.stringify({ username: "aliceboxer" }) });
    expect((await body<{ alreadyExists: boolean }>(dup)).alreadyExists).toBe(true);

    // 5. Self-request rejected.
    const self = await call("alice", "/friends/request", { method: "POST", body: JSON.stringify({ username: "aliceboxer" }) });
    expect(self.status).toBe(400);

    // 6. Only the recipient (Alice) can accept — Bob (the requester) cannot.
    const bobAccept = await call("bob", `/friends/${friendshipId}/accept`, { method: "POST" });
    expect(bobAccept.status).toBe(403);
    const aliceAccept = await call("alice", `/friends/${friendshipId}/accept`, { method: "POST" });
    expect(aliceAccept.status).toBe(200);
    expect((await body<{ friendship: { status: string } }>(aliceAccept)).friendship.status).toBe("accepted");

    // 7. Compare now shows the friend (aggregate-only).
    const cmp = await call("alice", "/friends/compare");
    const friends = (await body<{ friends: Array<{ displayName: string }> }>(cmp)).friends;
    expect(friends.map((f) => f.displayName)).toContain("Bob");

    // 8. Alice creates a challenge on the friendship.
    const create = await call("alice", "/friends/challenges", {
      method: "POST",
      body: JSON.stringify({ friendshipId, title: "20 workouts this month", metric: "workout", target: 20, days: 30 }),
    });
    expect(create.status).toBe(200);
    const challengeId = (await body<{ challenge: { id: string } }>(create)).challenge.id;

    // 9. A non-member cannot bump progress.
    const carolBump = await call("carol", `/friends/challenges/${challengeId}/progress`, { method: "POST", body: JSON.stringify({ delta: 1 }) });
    expect(carolBump.status).toBe(403);

    // 10. Alice bumps her own progress.
    const bump = await call("alice", `/friends/challenges/${challengeId}/progress`, { method: "POST", body: JSON.stringify({ delta: 1 }) });
    expect((await body<{ count: number }>(bump)).count).toBe(1);

    // 11. Listing shows both members, Alice at 1, Bob at 0.
    const list = await call("alice", "/friends/challenges");
    const challenge = (
      await body<{
        challenges: Array<{
          title: string;
          target: number;
          members: Array<{ isYou: boolean; displayName: string; count: number }>;
        }>;
      }>(list)
    ).challenges[0];
    expect(challenge.title).toBe("20 workouts this month");
    expect(challenge.target).toBe(20);
    const alice = challenge.members.find((m) => m.isYou);
    const bob = challenge.members.find((m) => m.displayName === "Bob");
    expect(alice?.count).toBe(1);
    expect(bob?.count).toBe(0);
  });

  it("rejects an invalid username and a taken one", async () => {
    expect((await call("alice", "/friends/username", { method: "PATCH", body: JSON.stringify({ username: "no" }) })).status).toBe(400);
    await call("alice", "/friends/username", { method: "PATCH", body: JSON.stringify({ username: "taken1" }) });
    expect((await call("bob", "/friends/username", { method: "PATCH", body: JSON.stringify({ username: "taken1" }) })).status).toBe(409);
  });
});
