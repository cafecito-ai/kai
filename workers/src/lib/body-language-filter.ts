// Body-language filter — applied to every Body agent + body scan response
// before the user sees it. Per CLAUDE.md v2 §3 and AGENT_PLAN §2.2:
//
//   "If your generated AI prompt outputs anything matching this list,
//    regenerate with a stricter system prompt."
//
// The forbidden-word list is shared between the Body chat agent and the
// body scan vision pipeline. Body scan's vision prompt re-exports its own
// filter (workers/src/lib/prompts/body-scan-prompt.ts) for backward compat,
// but it should use this canonical list going forward.

/**
 * Forbidden words and phrases. Match is case-insensitive, substring.
 * Order doesn't matter for correctness but longer phrases are listed first
 * for easier audit.
 */
export const FORBIDDEN_BODY_LANGUAGE = [
  // Comparisons
  "compared to average",
  "for your age",
  "for a guy",
  "for a girl",
  "above average",
  "below average",
  "most people your age",
  // Body metrics
  "body fat percentage",
  "body fat",
  "body composition",
  "lean body mass",
  "lean mass",
  "calorie deficit",
  "target weight",
  "ideal weight",
  "weight estimate",
  "bmi",
  // Physique descriptors
  "ideal body",
  "perfect body",
  "fat",
  "skinny",
  "overweight",
  "underweight",
  "obese",
  "chubby",
  "plump",
  "scrawny",
  "thin",
  "bulky",
  "ripped",
  "shredded",
  // Aesthetic words (case-insensitive substring)
  "attractive",
  "ugly",
  "beautiful",
  // Shame language
  "lazy",
  "undisciplined",
  "no excuse",
  // Diet culture
  "cutting",
  "bulking",
] as const;

export type ForbiddenMatch = {
  word: string;
  index: number;
};

/**
 * Return every forbidden hit in the response. Useful for logging /
 * regeneration context — the caller can tell the model exactly which words
 * to avoid on the retry.
 */
export function findForbidden(response: string): ForbiddenMatch[] {
  const lower = response.toLowerCase();
  const hits: ForbiddenMatch[] = [];
  for (const word of FORBIDDEN_BODY_LANGUAGE) {
    let from = 0;
    while (from <= lower.length) {
      const idx = lower.indexOf(word, from);
      if (idx === -1) break;
      hits.push({ word, index: idx });
      from = idx + word.length;
    }
  }
  return hits;
}

/**
 * `true` if the response is clean of forbidden body-language terms.
 */
export function passesBodyLanguageFilter(response: string): boolean {
  return findForbidden(response).length === 0;
}

/**
 * Fallback message returned after the regeneration loop gives up.
 * Per CLAUDE.md v2 §6: "Returns fallback after 3 failures."
 */
export const BODY_LANGUAGE_FALLBACK =
  "Let me try that again — I want to focus on how your body feels and performs, not how it looks. What's the specific goal we're working toward?";
