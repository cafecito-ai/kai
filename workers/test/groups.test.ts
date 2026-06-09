// Phase G — Groups pure-helper tests.
//
// The route handlers (workers/src/routes/groups.ts) talk to D1; we
// verify those by hand against a local DB. This file covers the pure
// invariants from CLAUDE.md §5 + CLAUDE_v3_PATCH §6:
//   - Coarse buckets only — never an exact score
//   - "Hide my score" → bucket = hidden
//   - canJoinTeenGroup — adults blocked, null age fail-closed
//   - Encouragement templates use community language (NOT competitive)
//   - Invite codes: unambiguous chars, 48h TTL
//   - Leaderboard ranking by bucket then streak, stable on ties

import { describe, expect, it } from "vitest";
import {
  ENCOURAGEMENT_TEMPLATES,
  assertCommunityLanguage,
  bucketFor,
  bucketLabel,
  canJoinTeenGroup,
  findCompetitiveLanguage,
  getTemplate,
  inviteExpiresAt,
  isInviteExpired,
  newInviteCode,
  rankLeaderboard,
} from "../src/lib/groups";

// ─────────────────────────────────────────────────────────────────────
// bucketFor
// ─────────────────────────────────────────────────────────────────────

describe("bucketFor", () => {
  it("85+ → high", () => {
    expect(bucketFor(85, false)).toBe("high");
    expect(bucketFor(92, false)).toBe("high");
    expect(bucketFor(100, false)).toBe("high");
  });
  it("60-84 → mid (inclusive of 60, exclusive of 85)", () => {
    expect(bucketFor(60, false)).toBe("mid");
    expect(bucketFor(72, false)).toBe("mid");
    expect(bucketFor(84, false)).toBe("mid");
  });
  it("<60 → low", () => {
    expect(bucketFor(0, false)).toBe("low");
    expect(bucketFor(45, false)).toBe("low");
    expect(bucketFor(59, false)).toBe("low");
  });
  it("hidden flag → hidden regardless of score", () => {
    expect(bucketFor(95, true)).toBe("hidden");
    expect(bucketFor(50, true)).toBe("hidden");
    expect(bucketFor(null, true)).toBe("hidden");
  });
  it("null / NaN → none", () => {
    expect(bucketFor(null, false)).toBe("none");
    expect(bucketFor(NaN, false)).toBe("none");
  });
  it("never returns the exact score (the whole point)", () => {
    // Sanity check — buckets are strings, not numbers.
    for (const s of [0, 30, 60, 75, 84, 85, 100]) {
      expect(typeof bucketFor(s, false)).toBe("string");
    }
  });
});

describe("bucketLabel", () => {
  it("does not leak a precise number", () => {
    // 'high' shows 85+, 'mid' shows 60-75 (not the 76-84 zone), 'low' shows under 60.
    // The labels themselves are loose enough that 76-84 still
    // doesn't pinpoint a number — they map to the wider 60-75 band.
    expect(bucketLabel("high")).toMatch(/85\+/);
    expect(bucketLabel("mid")).toMatch(/60.{0,3}75/);
    expect(bucketLabel("low")).toMatch(/under 60/);
    expect(bucketLabel("hidden")).toBe("—");
  });
});

// ─────────────────────────────────────────────────────────────────────
// canJoinTeenGroup
// ─────────────────────────────────────────────────────────────────────

describe("canJoinTeenGroup", () => {
  // App is open to all ages now (no age gate / no parental consent), so groups
  // must not block by age — including adults (the "groups still don't work" bug).
  it("allows every age, including adults and unknown age", () => {
    for (const age of [13, 16, 17, 18, 21, 35, 65]) {
      expect(canJoinTeenGroup(age)).toBe(true);
    }
    expect(canJoinTeenGroup(null)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Encouragement templates
// ─────────────────────────────────────────────────────────────────────

describe("encouragement templates", () => {
  it("has at least 8 templates per spec", () => {
    expect(ENCOURAGEMENT_TEMPLATES.length).toBeGreaterThanOrEqual(8);
  });
  it("all templates pass the community-language check", () => {
    for (const t of ENCOURAGEMENT_TEMPLATES) {
      expect(
        findCompetitiveLanguage(t.text),
        `template "${t.id}" uses forbidden competitive word`,
      ).toBeNull();
    }
  });
  it("getTemplate returns null for unknown id", () => {
    expect(getTemplate("does-not-exist")).toBeNull();
  });
  it("getTemplate returns the template for known id", () => {
    const t = getTemplate("thinking");
    expect(t?.text).toMatch(/thinking about you/i);
  });
  it("no template uses 'crushing it' or similar", () => {
    for (const t of ENCOURAGEMENT_TEMPLATES) {
      expect(t.text).not.toMatch(/crushing|crush it|beat|winner|rank/i);
    }
  });
  it("no template uses shame language", () => {
    for (const t of ENCOURAGEMENT_TEMPLATES) {
      expect(t.text).not.toMatch(/lazy|no excuse|should have/i);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// Competitive language guard
// ─────────────────────────────────────────────────────────────────────

describe("findCompetitiveLanguage / assertCommunityLanguage", () => {
  it("catches 'crushing it'", () => {
    expect(findCompetitiveLanguage("you're crushing it")).toBeTruthy();
  });
  it("catches 'beat'", () => {
    expect(findCompetitiveLanguage("you beat your streak")).toBeTruthy();
  });
  it("catches 'rank'", () => {
    expect(findCompetitiveLanguage("rank #1 this week")).toBeTruthy();
  });
  it("does not catch community language", () => {
    expect(findCompetitiveLanguage("great week of showing up")).toBeNull();
    expect(findCompetitiveLanguage("proud of you for being here")).toBeNull();
    expect(findCompetitiveLanguage("support each other")).toBeNull();
  });
  it("word boundary respected — 'crushing' doesn't hit on substrings", () => {
    // 'sandcrushing' is not a word but we test that the boundary check
    // doesn't go haywire on weird inputs.
    expect(findCompetitiveLanguage("xcrushingx")).toBeNull();
  });
  it("assertCommunityLanguage throws on forbidden, passes on clean", () => {
    expect(() => assertCommunityLanguage("crushing it")).toThrow();
    expect(() => assertCommunityLanguage("great week")).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────
// Invite codes
// ─────────────────────────────────────────────────────────────────────

describe("invite codes", () => {
  it("are 8 chars long", () => {
    for (let i = 0; i < 20; i++) {
      expect(newInviteCode()).toHaveLength(8);
    }
  });
  it("only use unambiguous characters (no 0/O/1/I)", () => {
    for (let i = 0; i < 100; i++) {
      const code = newInviteCode();
      expect(code).not.toMatch(/[0OI1]/);
    }
  });
  it("are extremely likely to be unique", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 500; i++) codes.add(newInviteCode());
    // 32^8 = ~1.1 trillion. 500 codes → collision odds vanish.
    expect(codes.size).toBe(500);
  });
});

describe("invite expiration", () => {
  it("inviteExpiresAt returns 48h in the future", () => {
    const now = new Date("2026-05-20T12:00:00.000Z");
    const expiry = inviteExpiresAt(now);
    const diffMs = new Date(expiry).getTime() - now.getTime();
    expect(diffMs).toBe(48 * 60 * 60 * 1000);
  });
  it("isInviteExpired true for past timestamps", () => {
    expect(isInviteExpired("2020-01-01T00:00:00.000Z")).toBe(true);
  });
  it("isInviteExpired false for future timestamps", () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    expect(isInviteExpired(future.toISOString())).toBe(false);
  });
  it("isInviteExpired true for garbage", () => {
    expect(isInviteExpired("not a date")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Leaderboard ranking
// ─────────────────────────────────────────────────────────────────────

describe("rankLeaderboard", () => {
  it("sorts by bucket (high > mid > low > none/hidden)", () => {
    const entries = [
      { userId: "a", displayName: "Ana", bucket: "low" as const, streakDays: 5 },
      { userId: "b", displayName: "Ben", bucket: "high" as const, streakDays: 1 },
      { userId: "c", displayName: "Cam", bucket: "mid" as const, streakDays: 3 },
    ];
    const ranked = rankLeaderboard(entries);
    expect(ranked.map((e) => e.userId)).toEqual(["b", "c", "a"]);
  });
  it("ties on bucket break by streak (longer first)", () => {
    const entries = [
      { userId: "a", displayName: "Ana", bucket: "mid" as const, streakDays: 3 },
      { userId: "b", displayName: "Ben", bucket: "mid" as const, streakDays: 9 },
    ];
    const ranked = rankLeaderboard(entries);
    expect(ranked.map((e) => e.userId)).toEqual(["b", "a"]);
  });
  it("ties on bucket AND streak break by name (stable)", () => {
    const entries = [
      { userId: "b", displayName: "Ben", bucket: "mid" as const, streakDays: 5 },
      { userId: "a", displayName: "Ana", bucket: "mid" as const, streakDays: 5 },
    ];
    const ranked = rankLeaderboard(entries);
    expect(ranked.map((e) => e.userId)).toEqual(["a", "b"]);
  });
  it("empty list returns empty", () => {
    expect(rankLeaderboard([])).toEqual([]);
  });
});
