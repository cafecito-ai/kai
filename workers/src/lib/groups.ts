// Pure helpers for the Groups feature (T-036 → T-040).
//
// The rules these helpers enforce (CLAUDE.md §5 + CLAUDE_v3_PATCH §6):
//   1. Scores in groups are ALWAYS coarse buckets, never exact numbers.
//   2. "Hide my score" is per-group, not global.
//   3. Encouragement templates use community language, NEVER competitive.
//   4. Adults (age ≥ 18) cannot join teen groups.

// ─────────────────────────────────────────────────────────────────────
// Coarse score buckets (T-037)
// ─────────────────────────────────────────────────────────────────────

export type ScoreBucket = "high" | "mid" | "low" | "hidden" | "none";

/**
 * Map an exact Daily Score (0-100) to the coarse bucket the spec
 * allows in groups. Per CLAUDE.md §5: 85+, 60-75, below 60.
 *
 * Returns "hidden" when the member has hide_score on for this group.
 * Returns "none" when there's no score yet (new user, no data).
 *
 * Buckets sit between the spec numbers intentionally — anyone scoring
 * 76-84 still maps to "mid" rather than leaking a precise number.
 */
export function bucketFor(
  finalScore: number | null,
  hidden: boolean,
): ScoreBucket {
  if (hidden) return "hidden";
  if (finalScore == null || !Number.isFinite(finalScore)) return "none";
  if (finalScore >= 85) return "high";
  if (finalScore < 60) return "low";
  return "mid";
}

/** Friendly label rendered next to a member's name in the group view. */
export function bucketLabel(b: ScoreBucket): string {
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

/** Tailwind tint class for the bucket pill — band-aware, never red. */
export function bucketTint(b: ScoreBucket): string {
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

// ─────────────────────────────────────────────────────────────────────
// Encouragement templates (T-038)
// ─────────────────────────────────────────────────────────────────────

export type EncouragementTemplate = {
  id: string;
  text: string;
  /** Which contexts this template fits — UI surfaces only matching ones
   *  when "encourage <name> in their X" context is known. Empty array
   *  means "always available". */
  fitsContexts: Array<"any" | "low_week" | "mid_week" | "high_week">;
};

/** Reviewed for tone — never patronizing, never empty cheering,
 *  community language (no compete/beat/win/rank). Final approval is
 *  T-038's `requires_lev_input` — these are Phase G v1 defaults Lev
 *  can edit later. */
export const ENCOURAGEMENT_TEMPLATES: EncouragementTemplate[] = [
  {
    id: "thinking",
    text: "Thinking about you today.",
    fitsContexts: ["any"],
  },
  {
    id: "walk_later",
    text: "Want to walk later? No pressure.",
    fitsContexts: ["any"],
  },
  {
    id: "proud_of_you",
    text: "Proud of you for showing up this week.",
    fitsContexts: ["mid_week", "high_week"],
  },
  {
    id: "rough_week_ok",
    text: "Rough week is allowed. I'm here.",
    fitsContexts: ["low_week"],
  },
  {
    id: "easy_day_ok",
    text: "An easy day is still a day. Be gentle.",
    fitsContexts: ["low_week", "mid_week"],
  },
  {
    id: "ask_later",
    text: "I want to hear how you're doing. Free later?",
    fitsContexts: ["any"],
  },
  {
    id: "good_to_see",
    text: "Good to see you logging this week.",
    fitsContexts: ["mid_week", "high_week"],
  },
  {
    id: "small_thing",
    text: "Small things count. Keep at it.",
    fitsContexts: ["any"],
  },
  {
    id: "remind_strength",
    text: "Remember what got you through last time.",
    fitsContexts: ["low_week"],
  },
  {
    id: "real_one",
    text: "You're a real one. Don't forget that.",
    fitsContexts: ["any"],
  },
];

/** Look up a template by id. Null if not found. */
export function getTemplate(id: string): EncouragementTemplate | null {
  return ENCOURAGEMENT_TEMPLATES.find((t) => t.id === id) ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// Adult/teen gating (T-036)
// ─────────────────────────────────────────────────────────────────────

/** Group eligibility. The app is now open to ALL ages (the 13–18 gate and
 *  parental-consent requirement were removed per product direction, 2026-06-08),
 *  so groups must not block by age either — an age ≥ 18 was the "groups still
 *  don't work" bug for adult testers. Any user can create/join a group.
 *
 *  NOTE (child-safety): this lets adults and minors share a social group. If the
 *  product later wants age-segregated groups, reintroduce a gate here — this is
 *  the single chokepoint both create and join run through. */
export function canJoinTeenGroup(_age: number | null): boolean {
  return true;
}

// ─────────────────────────────────────────────────────────────────────
// Invite codes (T-036)
// ─────────────────────────────────────────────────────────────────────

const INVITE_TTL_HOURS = 48;
const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — readability

/** 8-char unambiguous invite code. */
export function newInviteCode(): string {
  let s = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const b of bytes) s += INVITE_ALPHABET[b % INVITE_ALPHABET.length];
  return s;
}

/** ISO timestamp 48 hours from now. */
export function inviteExpiresAt(now: Date = new Date()): string {
  const d = new Date(now);
  d.setHours(d.getHours() + INVITE_TTL_HOURS);
  return d.toISOString();
}

export function isInviteExpired(
  expires: string,
  now: Date = new Date(),
): boolean {
  const t = new Date(expires).getTime();
  if (!Number.isFinite(t)) return true;
  return t <= now.getTime();
}

// ─────────────────────────────────────────────────────────────────────
// Leaderboard ranking (T-039)
// ─────────────────────────────────────────────────────────────────────

const BUCKET_RANK: Record<ScoreBucket, number> = {
  high: 3,
  mid: 2,
  low: 1,
  hidden: 0,
  none: 0,
};

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  bucket: ScoreBucket;
  streakDays: number;
};

/** Sort by bucket (high→low) then by streak (longer first). Ties
 *  broken by display name ascending so the order is stable. */
export function rankLeaderboard(
  entries: LeaderboardEntry[],
): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    const bucketDiff = BUCKET_RANK[b.bucket] - BUCKET_RANK[a.bucket];
    if (bucketDiff !== 0) return bucketDiff;
    if (b.streakDays !== a.streakDays) return b.streakDays - a.streakDays;
    return a.displayName.localeCompare(b.displayName);
  });
}

// ─────────────────────────────────────────────────────────────────────
// Forbidden competitive language check (T-039 guardrail)
// ─────────────────────────────────────────────────────────────────────

const COMPETITIVE_WORDS = [
  "compete",
  "beat",
  "win",
  "winning",
  "winner",
  "rank",
  "ranking",
  "crushing",
  "crush",
  "dominate",
  "loser",
];

/** Returns the first forbidden competitive word in a string, or null. */
export function findCompetitiveLanguage(text: string): string | null {
  for (const word of COMPETITIVE_WORDS) {
    const re = new RegExp(`\\b${word}\\b`, "i");
    if (re.test(text)) return word;
  }
  return null;
}

/** Asserts a UI string passes the no-competitive-language rule. Throws
 *  in dev to surface accidental "crushing it" copy at boot time. */
export function assertCommunityLanguage(text: string): void {
  const hit = findCompetitiveLanguage(text);
  if (hit) {
    throw new Error(
      `Group UI string contains forbidden competitive word "${hit}": ${JSON.stringify(text)}`,
    );
  }
}
