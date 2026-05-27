// Adaptive onboarding follow-ups (Rawz/5).
//
// After the user picks their focus areas, we ask 2-3 targeted follow-up
// questions tailored to what they chose. The Rawz vision doc framing:
//
//   "User says they want more energy → app asks about sleep → asks
//    about exercise → asks about screen time → then helps the user
//    choose goals and habits that fit their lifestyle."
//
// Implementation: every focus area has ONE follow-up question with
// quick-select chip options + a free-text fallback. We pick up to 3
// of the most actionable follow-ups based on what was selected (in a
// stable priority order so the experience is predictable). All
// questions are skippable — never block onboarding progress.
//
// The answers are added to the existing intake payload so the Mind +
// Body agents have richer context from day one.

export type FocusAreaId =
  | "mental_clarity"
  | "managing_stress"
  | "anxiety"
  | "mood"
  | "confidence"
  | "motivation"
  | "focus"
  | "finding_purpose"
  | "school_pressure"
  | "social_life"
  | "friendships"
  | "family_stuff"
  | "better_sleep"
  | "energy"
  | "getting_stronger"
  | "eating_better"
  | "body_image";

export type FollowUpQuestion = {
  id: string;
  focusArea: FocusAreaId;
  prompt: string;
  /** Quick-pick chips. User can also type free-text. */
  options: string[];
  /** Higher priority = picked first when multiple focus areas are selected. */
  priority: number;
};

// ─────────────────────────────────────────────────────────────────────
// Question bank
// ─────────────────────────────────────────────────────────────────────

export const FOLLOW_UPS: FollowUpQuestion[] = [
  // BODY / WELLNESS — high actionability, asked first
  {
    id: "sleep_hours",
    focusArea: "better_sleep",
    prompt: "Roughly how many hours of sleep are you getting on a normal night?",
    options: ["Under 5", "5–6", "6–7", "7–8", "8+"],
    priority: 95,
  },
  {
    id: "energy_low",
    focusArea: "energy",
    prompt: "When is your energy lowest?",
    options: ["Mornings", "After school", "Evenings", "All day"],
    priority: 90,
  },
  {
    id: "training_setup",
    focusArea: "getting_stronger",
    prompt: "What's your training situation?",
    options: ["Gym access", "Home only", "Sport-specific", "Just starting"],
    priority: 85,
  },
  {
    id: "eating_goal",
    focusArea: "eating_better",
    prompt: "What does 'better' look like for you?",
    options: ["More energy", "Eating more regularly", "Less junk", "More variety"],
    priority: 80,
  },
  // MENTAL — feelings + identity stuff
  {
    id: "stress_source",
    focusArea: "managing_stress",
    prompt: "Where do you feel stress most?",
    options: ["School", "Social stuff", "Family", "Sports", "Inside my head"],
    priority: 85,
  },
  {
    id: "anxiety_when",
    focusArea: "anxiety",
    prompt: "When does it hit hardest?",
    options: ["Mornings", "At school", "Before bed", "Around people", "Randomly"],
    priority: 88,
  },
  {
    id: "school_source",
    focusArea: "school_pressure",
    prompt: "What's the biggest piece of it?",
    options: ["Grades", "Parents", "College apps", "Workload", "Comparing to others"],
    priority: 78,
  },
  {
    id: "social_focus",
    focusArea: "social_life",
    prompt: "What's the situation?",
    options: ["Making new friends", "Working on existing ones", "Working through a fight", "Just feel lonely"],
    priority: 75,
  },
  {
    id: "confidence_where",
    focusArea: "confidence",
    prompt: "Where do you want it most?",
    options: ["At school", "Around people", "In sports", "Just inside my own head"],
    priority: 75,
  },
  {
    id: "focus_lost",
    focusArea: "focus",
    prompt: "Where do you lose focus most?",
    options: ["Homework", "Class", "Conversations", "When I'm alone", "Everywhere"],
    priority: 70,
  },
  // IDENTITY / PURPOSE
  {
    id: "purpose_anchor",
    focusArea: "finding_purpose",
    prompt: "Something you've cared about for over a year — one word is fine.",
    options: ["Family", "Friends", "Sport", "Art", "Creating", "Helping people"],
    priority: 72,
  },
  {
    id: "motivation_start",
    focusArea: "motivation",
    prompt: "Something you want to start (or restart)?",
    options: ["Workout routine", "Reading", "Sleep schedule", "Creative project", "Just showing up"],
    priority: 70,
  },
  // BODY IMAGE / MOOD — gentle entry
  {
    id: "body_image_frame",
    focusArea: "body_image",
    prompt: "Where would you rather KAI keep the focus?",
    options: ["How I feel in my body", "What my body can do", "Stuff in my head about it", "All of the above"],
    priority: 65,
  },
  {
    id: "mood_pull_out",
    focusArea: "mood",
    prompt: "When you're off, what usually pulls you back?",
    options: ["A walk", "A friend", "Sleep", "Eating", "Music"],
    priority: 65,
  },
  {
    id: "mental_clarity_block",
    focusArea: "mental_clarity",
    prompt: "What gets in the way most?",
    options: ["Stress", "Sleep", "Screens", "Schedule", "Just my own thoughts"],
    priority: 68,
  },
  {
    id: "friendships_situation",
    focusArea: "friendships",
    prompt: "What's the situation?",
    options: ["Making new ones", "Keeping current ones", "Working through a fight", "Feeling left out"],
    priority: 60,
  },
  {
    id: "family_dynamic",
    focusArea: "family_stuff",
    prompt: "Pick the one that fits best.",
    options: ["Parent stuff", "Sibling stuff", "Going through a big change", "Just complicated"],
    priority: 55,
  },
];

// ─────────────────────────────────────────────────────────────────────
// Picker — given selected focus areas, return up to N follow-up Qs
// ─────────────────────────────────────────────────────────────────────

const MAX_FOLLOWUPS = 3;

/** Pick up to MAX_FOLLOWUPS follow-up questions based on which focus
 *  areas the user selected. Stable ordering — same selections always
 *  return the same questions in the same order. */
export function pickFollowUps(focusAreas: FocusAreaId[]): FollowUpQuestion[] {
  const selected = new Set(focusAreas);
  const matching = FOLLOW_UPS.filter((q) => selected.has(q.focusArea));
  // Sort by priority desc, then by id (stable) for ties.
  const sorted = [...matching].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.id.localeCompare(b.id);
  });
  return sorted.slice(0, MAX_FOLLOWUPS);
}

// ─────────────────────────────────────────────────────────────────────
// Response shape — used in intake payload
// ─────────────────────────────────────────────────────────────────────

export type FollowUpResponse = Record<string, string>;

/** Format follow-up responses for the intake summary string. */
export function formatFollowUpsForIntake(
  questions: FollowUpQuestion[],
  responses: FollowUpResponse,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of questions) {
    const v = responses[q.id]?.trim();
    if (v) out[`followup_${q.id}`] = v;
  }
  return out;
}
