// Group routes (T-036 → T-040).
//
// All endpoints require auth. All score data returned is COARSE BUCKETED,
// never an exact number. "Hide my score" is enforced server-side.

import { Hono } from "hono";
import {
  ENCOURAGEMENT_TEMPLATES,
  bucketFor,
  canJoinTeenGroup,
  getTemplate,
  inviteExpiresAt,
  isInviteExpired,
  newInviteCode,
  rankLeaderboard,
  type LeaderboardEntry,
} from "../lib/groups";
import { sendSafetyAlert } from "../lib/email";
import { classifySafetyFull, logSafetyEvent } from "../lib/safety";
import type { AppVariables, Env } from "../types";

const MAX_GROUPS_PER_USER = 3;
const MAX_MEMBERS_PER_GROUP = 8;

export const groupsRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// ─────────────────────────────────────────────────────────────────────
// T-036 — Create + list + join
// ─────────────────────────────────────────────────────────────────────

groupsRoutes.get("/groups", async (c) => {
  const userId = c.get("userId");
  const result = await c.env.DB
    .prepare(
      `SELECT g.id, g.name, g.invite_code, g.invite_expires,
              gm.hide_score, gm.leaderboard_opt_in, gm.joined_at,
              (SELECT COUNT(*) FROM group_memberships WHERE group_id = g.id) AS member_count
         FROM groups g
         JOIN group_memberships gm ON gm.group_id = g.id
        WHERE gm.user_id = ?
        ORDER BY gm.joined_at DESC`,
    )
    .bind(userId)
    .all<{
      id: string;
      name: string;
      invite_code: string;
      invite_expires: string;
      hide_score: number;
      leaderboard_opt_in: number;
      joined_at: string;
      member_count: number;
    }>()
    .catch(() => ({ results: [] as never[] }));
  return c.json({
    groups: (result.results ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      inviteCode: r.invite_code,
      inviteExpires: r.invite_expires,
      inviteExpired: isInviteExpired(r.invite_expires),
      hideScore: !!r.hide_score,
      leaderboardOptIn: !!r.leaderboard_opt_in,
      joinedAt: r.joined_at,
      memberCount: r.member_count,
    })),
  });
});

groupsRoutes.post("/groups", async (c) => {
  const userId = c.get("userId");
  const body = await c.req
    .json<{ name: string }>()
    .catch((): { name: string } => ({ name: "" }));
  const name = (body.name ?? "").trim();
  if (name.length < 1 || name.length > 24) {
    return c.json({ error: "name must be 1-24 characters" }, 400);
  }

  // Adult check — every group in this app is a teen group.
  const me = await c.env.DB
    .prepare("SELECT age FROM users WHERE id = ?")
    .bind(userId)
    .first<{ age: number | null }>()
    .catch(() => null);
  if (!canJoinTeenGroup(me?.age ?? null)) {
    return c.json(
      { error: "Adult accounts can't create or join teen groups." },
      403,
    );
  }

  // Cap on groups-per-user.
  const count = await c.env.DB
    .prepare(
      "SELECT COUNT(*) AS n FROM group_memberships WHERE user_id = ?",
    )
    .bind(userId)
    .first<{ n: number }>()
    .catch(() => ({ n: 0 }));
  if ((count?.n ?? 0) >= MAX_GROUPS_PER_USER) {
    return c.json(
      {
        error: `You can be in at most ${MAX_GROUPS_PER_USER} groups. Leave one to join another.`,
      },
      403,
    );
  }

  const groupId = `grp_${crypto.randomUUID()}`;
  const inviteCode = newInviteCode();
  const expires = inviteExpiresAt();

  await c.env.DB
    .prepare(
      "INSERT INTO groups (id, name, created_by, invite_code, invite_expires) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(groupId, name, userId, inviteCode, expires)
    .run();
  await c.env.DB
    .prepare(
      "INSERT INTO group_memberships (group_id, user_id) VALUES (?, ?)",
    )
    .bind(groupId, userId)
    .run();

  return c.json({
    group: {
      id: groupId,
      name,
      inviteCode,
      inviteExpires: expires,
    },
  });
});

groupsRoutes.post("/groups/join/:inviteCode", async (c) => {
  const userId = c.get("userId");
  const inviteCode = c.req.param("inviteCode");

  const me = await c.env.DB
    .prepare("SELECT age FROM users WHERE id = ?")
    .bind(userId)
    .first<{ age: number | null }>()
    .catch(() => null);
  if (!canJoinTeenGroup(me?.age ?? null)) {
    return c.json(
      { error: "Adult accounts can't join teen groups." },
      403,
    );
  }

  const group = await c.env.DB
    .prepare(
      "SELECT id, name, invite_expires FROM groups WHERE invite_code = ?",
    )
    .bind(inviteCode)
    .first<{ id: string; name: string; invite_expires: string }>()
    .catch(() => null);
  if (!group) return c.json({ error: "Invite code not found." }, 404);
  if (isInviteExpired(group.invite_expires)) {
    return c.json({ error: "This invite has expired." }, 410);
  }

  // Group capacity.
  const cap = await c.env.DB
    .prepare(
      "SELECT COUNT(*) AS n FROM group_memberships WHERE group_id = ?",
    )
    .bind(group.id)
    .first<{ n: number }>()
    .catch(() => ({ n: 0 }));
  if ((cap?.n ?? 0) >= MAX_MEMBERS_PER_GROUP) {
    return c.json({ error: "This group is full." }, 403);
  }

  // User's group count.
  const userGroups = await c.env.DB
    .prepare(
      "SELECT COUNT(*) AS n FROM group_memberships WHERE user_id = ?",
    )
    .bind(userId)
    .first<{ n: number }>()
    .catch(() => ({ n: 0 }));
  if ((userGroups?.n ?? 0) >= MAX_GROUPS_PER_USER) {
    return c.json(
      {
        error: `You can be in at most ${MAX_GROUPS_PER_USER} groups. Leave one to join another.`,
      },
      403,
    );
  }

  // Already a member?
  const existing = await c.env.DB
    .prepare(
      "SELECT 1 FROM group_memberships WHERE group_id = ? AND user_id = ?",
    )
    .bind(group.id, userId)
    .first()
    .catch(() => null);
  if (existing) {
    return c.json({ group: { id: group.id, name: group.name } });
  }

  await c.env.DB
    .prepare(
      "INSERT INTO group_memberships (group_id, user_id) VALUES (?, ?)",
    )
    .bind(group.id, userId)
    .run();

  return c.json({ group: { id: group.id, name: group.name } });
});

// ─────────────────────────────────────────────────────────────────────
// T-037 — Group dashboard (members with COARSE buckets only)
// ─────────────────────────────────────────────────────────────────────

groupsRoutes.get("/groups/:id", async (c) => {
  const userId = c.get("userId");
  const groupId = c.req.param("id");

  // Membership check.
  const myMembership = await c.env.DB
    .prepare(
      "SELECT hide_score, leaderboard_opt_in FROM group_memberships WHERE group_id = ? AND user_id = ?",
    )
    .bind(groupId, userId)
    .first<{ hide_score: number; leaderboard_opt_in: number }>()
    .catch(() => null);
  if (!myMembership) return c.json({ error: "Not a member" }, 403);

  const group = await c.env.DB
    .prepare(
      "SELECT id, name, invite_code, invite_expires, created_by FROM groups WHERE id = ?",
    )
    .bind(groupId)
    .first<{
      id: string;
      name: string;
      invite_code: string;
      invite_expires: string;
      created_by: string;
    }>()
    .catch(() => null);
  if (!group) return c.json({ error: "Group not found" }, 404);

  // Members: pull display_name + age + hide_score + latest final_score.
  // We join through daily_scores for today, then fall back to most-recent.
  const today = new Date().toISOString().slice(0, 10);
  const membersRes = await c.env.DB
    .prepare(
      `SELECT u.id AS user_id, u.display_name, gm.hide_score, gm.leaderboard_opt_in,
              (
                SELECT ds.final_score
                  FROM daily_scores ds
                 WHERE ds.user_id = u.id
                   AND ds.date <= ?
                 ORDER BY ds.date DESC
                 LIMIT 1
              ) AS final_score
         FROM group_memberships gm
         JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = ?
        ORDER BY gm.joined_at ASC`,
    )
    .bind(today, groupId)
    .all<{
      user_id: string;
      display_name: string | null;
      hide_score: number;
      leaderboard_opt_in: number;
      final_score: number | null;
    }>()
    .catch(() => ({ results: [] as never[] }));

  // Blocks — hide blocked members from each other.
  const blockedRes = await c.env.DB
    .prepare(
      "SELECT blocked_id FROM group_blocks WHERE blocker_id = ? UNION SELECT blocker_id FROM group_blocks WHERE blocked_id = ?",
    )
    .bind(userId, userId)
    .all<{ blocked_id: string }>()
    .catch(() => ({ results: [] as never[] }));
  const blockedIds = new Set(
    (blockedRes.results ?? []).map((r) => r.blocked_id),
  );

  const members = (membersRes.results ?? [])
    .filter((m) => !blockedIds.has(m.user_id))
    .map((m) => ({
      userId: m.user_id,
      displayName: m.display_name ?? "friend",
      bucket: bucketFor(m.final_score, !!m.hide_score),
      // Streak isn't displayed to other members (it's a leaderboard-only
      // signal) but include for the API; UI gates on isMe.
      isMe: m.user_id === userId,
      leaderboardOptIn: !!m.leaderboard_opt_in,
    }));

  return c.json({
    group: {
      id: group.id,
      name: group.name,
      inviteCode: group.invite_code,
      inviteExpires: group.invite_expires,
      inviteExpired: isInviteExpired(group.invite_expires),
      createdByMe: group.created_by === userId,
    },
    me: {
      hideScore: !!myMembership.hide_score,
      leaderboardOptIn: !!myMembership.leaderboard_opt_in,
    },
    members,
  });
});

groupsRoutes.patch("/groups/:id/me", async (c) => {
  const userId = c.get("userId");
  const groupId = c.req.param("id");
  const body = await c.req
    .json<{ hideScore?: boolean; leaderboardOptIn?: boolean }>()
    .catch((): { hideScore?: boolean; leaderboardOptIn?: boolean } => ({}));

  const sets: string[] = [];
  const args: unknown[] = [];
  if (typeof body.hideScore === "boolean") {
    sets.push("hide_score = ?");
    args.push(body.hideScore ? 1 : 0);
  }
  if (typeof body.leaderboardOptIn === "boolean") {
    sets.push("leaderboard_opt_in = ?");
    args.push(body.leaderboardOptIn ? 1 : 0);
  }
  if (sets.length === 0) return c.json({ ok: true });

  await c.env.DB
    .prepare(
      `UPDATE group_memberships SET ${sets.join(", ")}
         WHERE group_id = ? AND user_id = ?`,
    )
    .bind(...args, groupId, userId)
    .run();
  return c.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────
// T-038 — Encouragement messages (templates + custom)
// ─────────────────────────────────────────────────────────────────────

groupsRoutes.get("/groups/templates", (c) => {
  return c.json({ templates: ENCOURAGEMENT_TEMPLATES });
});

groupsRoutes.post("/groups/:id/encourage", async (c) => {
  const userId = c.get("userId");
  const groupId = c.req.param("id");
  const body = await c.req.json<{
    toUserId: string;
    templateId?: string;
    customText?: string;
  }>();

  // Both sender and recipient must be group members.
  const senderMember = await c.env.DB
    .prepare(
      "SELECT 1 FROM group_memberships WHERE group_id = ? AND user_id = ?",
    )
    .bind(groupId, userId)
    .first()
    .catch(() => null);
  const recipMember = await c.env.DB
    .prepare(
      "SELECT 1 FROM group_memberships WHERE group_id = ? AND user_id = ?",
    )
    .bind(groupId, body.toUserId)
    .first()
    .catch(() => null);
  if (!senderMember || !recipMember) {
    return c.json({ error: "Both users must be group members." }, 403);
  }

  // Resolve text — either a template or a custom string.
  let text = "";
  let templateId: string | null = null;
  if (body.templateId) {
    const tpl = getTemplate(body.templateId);
    if (!tpl) return c.json({ error: "Unknown template" }, 400);
    text = tpl.text;
    templateId = tpl.id;
  } else if (body.customText && body.customText.trim().length > 0) {
    const custom = body.customText.trim().slice(0, 280);
    // Safety classifier on custom messages — anything concerning goes
    // to ops, message itself is NOT delivered.
    const safety = await classifySafetyFull(c.env, custom);
    if (!safety.safe) {
      const event = await logSafetyEvent(c.env, {
        userId,
        conversationId: groupId,
        messageId: undefined,
        rawText: custom,
        classification: safety,
      });
      if (event && safety.category && safety.severity) {
        await sendSafetyAlert(c.env, {
          eventId: event.id,
          category: safety.category,
          severity: safety.severity,
        });
      }
      return c.json(
        {
          error: "That message was flagged for review. If you're in crisis, please call or text 988.",
        },
        400,
      );
    }
    text = custom;
  } else {
    return c.json({ error: "templateId or customText required" }, 400);
  }

  const msgId = `msg_${crypto.randomUUID()}`;
  await c.env.DB
    .prepare(
      `INSERT INTO group_messages (id, group_id, from_user_id, to_user_id, kind, template_id, text)
       VALUES (?, ?, ?, ?, 'encouragement', ?, ?)`,
    )
    .bind(msgId, groupId, userId, body.toUserId, templateId, text)
    .run();

  return c.json({ message: { id: msgId, text } });
});

groupsRoutes.get("/groups/inbox", async (c) => {
  const userId = c.get("userId");
  const result = await c.env.DB
    .prepare(
      `SELECT m.id, m.group_id, m.from_user_id, m.text, m.created_at, m.acked,
              u.display_name AS from_display_name,
              g.name AS group_name
         FROM group_messages m
         JOIN users u ON u.id = m.from_user_id
         JOIN groups g ON g.id = m.group_id
        WHERE m.to_user_id = ? AND m.kind = 'encouragement'
        ORDER BY m.created_at DESC
        LIMIT 50`,
    )
    .bind(userId)
    .all<{
      id: string;
      group_id: string;
      from_user_id: string;
      text: string;
      created_at: string;
      acked: number;
      from_display_name: string | null;
      group_name: string;
    }>()
    .catch(() => ({ results: [] as never[] }));
  return c.json({
    messages: (result.results ?? []).map((r) => ({
      id: r.id,
      groupId: r.group_id,
      groupName: r.group_name,
      fromUserId: r.from_user_id,
      fromDisplayName: r.from_display_name ?? "friend",
      text: r.text,
      acked: !!r.acked,
      createdAt: r.created_at,
    })),
  });
});

groupsRoutes.post("/groups/messages/:id/ack", async (c) => {
  const userId = c.get("userId");
  const msgId = c.req.param("id");
  await c.env.DB
    .prepare(
      "UPDATE group_messages SET acked = 1 WHERE id = ? AND to_user_id = ?",
    )
    .bind(msgId, userId)
    .run();
  return c.json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────────
// T-039 — Leaderboard (opt-in)
// ─────────────────────────────────────────────────────────────────────

groupsRoutes.get("/groups/:id/leaderboard", async (c) => {
  const userId = c.get("userId");
  const groupId = c.req.param("id");

  const myMember = await c.env.DB
    .prepare(
      "SELECT 1 FROM group_memberships WHERE group_id = ? AND user_id = ?",
    )
    .bind(groupId, userId)
    .first()
    .catch(() => null);
  if (!myMember) return c.json({ error: "Not a member" }, 403);

  // Only opt-in members appear. We need their bucket + streak. Streak
  // is the count of consecutive days with at least one score_input
  // ending today.
  const today = new Date().toISOString().slice(0, 10);
  const optInRes = await c.env.DB
    .prepare(
      `SELECT u.id AS user_id, u.display_name, gm.hide_score,
              (
                SELECT ds.final_score FROM daily_scores ds
                 WHERE ds.user_id = u.id AND ds.date <= ?
                 ORDER BY ds.date DESC LIMIT 1
              ) AS final_score
         FROM group_memberships gm
         JOIN users u ON u.id = gm.user_id
        WHERE gm.group_id = ? AND gm.leaderboard_opt_in = 1`,
    )
    .bind(today, groupId)
    .all<{
      user_id: string;
      display_name: string | null;
      hide_score: number;
      final_score: number | null;
    }>()
    .catch(() => ({ results: [] as never[] }));

  // Streak per user (cheap-ish): count distinct dates in score_inputs
  // counting back from today until a gap.
  const entries: LeaderboardEntry[] = [];
  for (const row of optInRes.results ?? []) {
    const datesRes = await c.env.DB
      .prepare(
        "SELECT DISTINCT date FROM score_inputs WHERE user_id = ? AND date <= ? ORDER BY date DESC LIMIT 60",
      )
      .bind(row.user_id, today)
      .all<{ date: string }>()
      .catch(() => ({ results: [] as never[] }));
    const dates = new Set((datesRes.results ?? []).map((r) => r.date));
    let streak = 0;
    const d = new Date(today);
    for (let i = 0; i < 60; i++) {
      const key = d.toISOString().slice(0, 10);
      if (dates.has(key)) streak += 1;
      else break;
      d.setDate(d.getDate() - 1);
    }
    entries.push({
      userId: row.user_id,
      displayName: row.display_name ?? "friend",
      bucket: bucketFor(row.final_score, !!row.hide_score),
      streakDays: streak,
    });
  }

  return c.json({ entries: rankLeaderboard(entries) });
});

// ─────────────────────────────────────────────────────────────────────
// T-040 — Block / leave / report
// ─────────────────────────────────────────────────────────────────────

groupsRoutes.post("/groups/:id/block/:targetUserId", async (c) => {
  const userId = c.get("userId");
  const targetUserId = c.req.param("targetUserId");
  const groupId = c.req.param("id");
  if (userId === targetUserId) {
    return c.json({ error: "Can't block yourself." }, 400);
  }
  // Bidirectional rows so a single direction query is enough.
  await c.env.DB
    .prepare(
      "INSERT OR IGNORE INTO group_blocks (blocker_id, blocked_id) VALUES (?, ?)",
    )
    .bind(userId, targetUserId)
    .run();
  await c.env.DB
    .prepare(
      "INSERT OR IGNORE INTO group_blocks (blocker_id, blocked_id) VALUES (?, ?)",
    )
    .bind(targetUserId, userId)
    .run();
  await c.env.DB
    .prepare(
      "INSERT INTO group_moderation_log (id, group_id, actor_user_id, target_user_id, action) VALUES (?, ?, ?, ?, 'block')",
    )
    .bind(`mod_${crypto.randomUUID()}`, groupId, userId, targetUserId)
    .run();
  return c.json({ ok: true });
});

groupsRoutes.post("/groups/:id/leave", async (c) => {
  const userId = c.get("userId");
  const groupId = c.req.param("id");
  await c.env.DB
    .prepare(
      "DELETE FROM group_memberships WHERE group_id = ? AND user_id = ?",
    )
    .bind(groupId, userId)
    .run();
  // Silent — no notification per spec.
  await c.env.DB
    .prepare(
      "INSERT INTO group_moderation_log (id, group_id, actor_user_id, action) VALUES (?, ?, ?, 'leave')",
    )
    .bind(`mod_${crypto.randomUUID()}`, groupId, userId)
    .run();
  return c.json({ ok: true });
});

groupsRoutes.post("/groups/:id/report", async (c) => {
  const userId = c.get("userId");
  const groupId = c.req.param("id");
  const body = await c.req
    .json<{ targetUserId?: string; context?: string }>()
    .catch((): { targetUserId?: string; context?: string } => ({}));
  const context = (body.context ?? "").trim().slice(0, 1000);
  if (context.length < 1) {
    return c.json({ error: "Add a short note about what happened." }, 400);
  }
  await c.env.DB
    .prepare(
      "INSERT INTO group_moderation_log (id, group_id, actor_user_id, target_user_id, action, context) VALUES (?, ?, ?, ?, 'report', ?)",
    )
    .bind(
      `mod_${crypto.randomUUID()}`,
      groupId,
      userId,
      body.targetUserId ?? null,
      context,
    )
    .run();

  // Email ops. Per spec: reporter context + group metadata only.
  // No AI summary.
  if (c.env.EMAIL && c.env.SAFETY_ALERT_EMAIL) {
    await c.env.EMAIL.send({
      to: c.env.SAFETY_ALERT_EMAIL,
      from: c.env.EMAIL_FROM,
      subject: `[KAI] Group report — ${groupId}`,
      text: [
        `Reporter: ${userId}`,
        `Group: ${groupId}`,
        body.targetUserId ? `Target: ${body.targetUserId}` : "Target: (group-wide)",
        ``,
        `Reporter's note (verbatim):`,
        context,
      ].join("\n"),
    }).catch(() => {
      /* email failure is non-fatal — the log row is the source of truth */
    });
  }

  return c.json({ ok: true });
});
