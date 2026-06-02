// Rawz/7 — group-activity helpers (pure functions only).
//
// renderActivityLabel is the safety-critical surface here: it renders
// the text that goes into the group feed. The catch: KAI's gamification
// guardrails (D-021 / CLAUDE.md §5) ban comparative or shame words.
// Tests verify that even if a hint contains a banned word, the rendered
// label drops it before the row gets written.

import { describe, expect, it } from "vitest";
import {
  ALLOWED_REACTIONS,
  renderActivityLabel,
} from "../src/lib/group-activity";

describe("renderActivityLabel", () => {
  it("badge label uses the hint title when provided", () => {
    expect(renderActivityLabel("badge", "week-strong", "Week Strong")).toBe(
      "earned Week Strong",
    );
  });
  it("badge label falls back to the refKey when no hint", () => {
    expect(renderActivityLabel("badge", "first-checkin")).toBe(
      "earned first-checkin",
    );
  });
  it("level_up label includes the level number + optional name", () => {
    expect(renderActivityLabel("level_up", "5", "Consistent")).toBe(
      "hit Level 5 — Consistent",
    );
    expect(renderActivityLabel("level_up", "5")).toBe("hit Level 5");
  });
  it("streak label uses the day count", () => {
    expect(renderActivityLabel("streak", "30")).toBe(
      "checked in 30 days in a row",
    );
  });
  it("goal_completed includes the goal title when provided", () => {
    expect(
      renderActivityLabel("goal_completed", "g_1", "someone who reads"),
    ).toBe("finished a goal: someone who reads");
    expect(renderActivityLabel("goal_completed", "g_1")).toBe(
      "finished a goal",
    );
  });

  // D-021 — no competitive / shame language ever lands in a label.
  it("strips comparative words from hints (D-021)", () => {
    // Hypothetical hostile badge title — should never ship, but the
    // filter is the last line of defense if one slips in.
    expect(
      renderActivityLabel("badge", "x", "Crush the competition"),
    ).not.toMatch(/\bcrush\b/i);
    expect(
      renderActivityLabel("badge", "x", "Best in group"),
    ).not.toMatch(/\bbest\b/i);
    expect(
      renderActivityLabel("goal_completed", "g_1", "I beat everyone"),
    ).not.toMatch(/\bbeat\b/i);
  });

  it("never matches forbidden words inside legitimate words (word-boundary)", () => {
    // "rank" lives inside "frank" — must NOT be stripped.
    expect(
      renderActivityLabel("badge", "x", "Frank's challenge"),
    ).toContain("Frank");
  });
});

describe("ALLOWED_REACTIONS", () => {
  it("is the fixed four-emoji set — no text reactions, ever", () => {
    expect(ALLOWED_REACTIONS).toEqual(["🔥", "💪", "👏", "🎯"]);
  });
  it("contains no characters that could carry meaning beyond affirmation", () => {
    // Sanity: no thumbs-down, no crying laugh, no aesthetic-loaded
    // emoji (muscle is fine — it's a strength signal, not a body
    // judgement; it's been vetted with Lev).
    const forbidden = ["👎", "💀", "🤡", "😭", "🍑", "🍆"];
    for (const f of forbidden) {
      expect(ALLOWED_REACTIONS).not.toContain(f);
    }
  });
});
