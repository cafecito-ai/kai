import { BREATH_PATTERNS, type BreathPattern } from "./breathing";

/**
 * Maps a teen-stated feeling to a recommended breath pattern with a short
 * rationale. Pure function so the recommendation is deterministic and
 * testable without rendering anything.
 *
 * Mapping logic (per spec Section 6 and standard polyvagal-informed
 * breathwork):
 *   - Anxious / racing / panicked → 4-7-8 (longest exhale, strong
 *     parasympathetic signal)
 *   - Wired but tired / can't focus → calming (4-8: long exhale, less
 *     work than 4-7-8)
 *   - Tired / dragging / need to wake up → energizing (4-2: short exhale,
 *     gentle sympathetic nudge)
 *   - Before something big / nervous → box (steady, predictable, takes
 *     the edge off without dropping energy)
 *   - After something hard → 4-7-8 (real downshift)
 *   - Just maintaining → box (default for "no specific complaint")
 */

export type Feeling =
  | "anxious"
  | "wired_tired"
  | "tired"
  | "before_big"
  | "after_hard"
  | "maintaining";

export type BreathRecommendation = {
  pattern: BreathPattern;
  /** Why this pattern fits this feeling, in teen-current language. */
  rationale: string;
};

const FEELING_TO_PATTERN_ID: Record<Feeling, BreathPattern["id"]> = {
  anxious: "4-7-8",
  wired_tired: "calming",
  tired: "energizing",
  before_big: "box",
  after_hard: "4-7-8",
  maintaining: "box"
};

const RATIONALES: Record<Feeling, string> = {
  anxious:
    "Long exhales tell the body the threat is over. 4-7-8 has the longest exhale of the four — useful when your system is buzzing.",
  wired_tired:
    "Wired-but-tired usually means your nervous system is stuck on. Long exhales (calming, 4-8) help without forcing a hold.",
  tired:
    "Short exhales (energizing, 4-2) give the body a small sympathetic nudge — wake up, focus, then go.",
  before_big:
    "Box breath is steady and predictable. Takes the edge off without dropping you into rest mode before you need to perform.",
  after_hard:
    "4-7-8 lets the body actually downshift. Big inhale, real hold, very long exhale.",
  maintaining:
    "Box is the safe default — steady in, steady out. Good for general practice when nothing's specifically off."
};

export const FEELING_LABEL: Record<Feeling, string> = {
  anxious: "Anxious / racing",
  wired_tired: "Wired but tired",
  tired: "Tired / dragging",
  before_big: "Before something big",
  after_hard: "After something hard",
  maintaining: "Just maintaining"
};

export function recommendBreath(feeling: Feeling): BreathRecommendation {
  const patternId = FEELING_TO_PATTERN_ID[feeling];
  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0];
  return {
    pattern,
    rationale: RATIONALES[feeling]
  };
}

export const FEELINGS_ORDERED: Feeling[] = [
  "anxious",
  "wired_tired",
  "tired",
  "before_big",
  "after_hard",
  "maintaining"
];
