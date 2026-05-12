/**
 * Spec Phase 3 Task 3: a 15-minute Kai-facilitated guided question sequence
 * to help a teen surface their hidden strengths. These defaults are
 * conservative — Lev/Offy can override (decision D4) once they curate the
 * exact wording. Sectioned for UI pagination.
 */
export const STRENGTHS_DISCOVERY_QUESTIONS: ReadonlyArray<{
  id: string;
  prompt: string;
  section: "energy" | "curiosity" | "feedback" | "repetition" | "courage";
}> = [
  // Energy — what naturally fills you up
  { id: "q01", section: "energy", prompt: "Walk me through the last week. When did the time feel like it moved fast — what were you actually doing?" },
  { id: "q02", section: "energy", prompt: "What's something you do that other people seem to find draining, but you don't?" },
  { id: "q03", section: "energy", prompt: "When you finish what kind of work, you feel more energized rather than more tired?" },
  // Curiosity — what you keep coming back to
  { id: "q04", section: "curiosity", prompt: "What's a topic, problem, or kind of thing you keep falling down rabbit holes on?" },
  { id: "q05", section: "curiosity", prompt: "What question do you find yourself asking again and again — to friends, in your head, in search bars?" },
  { id: "q06", section: "curiosity", prompt: "If a tutor handed you free access to learn one thing in depth for six months, what would you pick?" },
  // Feedback — what others actually notice about you
  { id: "q07", section: "feedback", prompt: "What do friends ask you for help with — schoolwork, advice, a specific skill?" },
  { id: "q08", section: "feedback", prompt: "What's a compliment you've heard from more than one person about something you do?" },
  { id: "q09", section: "feedback", prompt: "When a group project goes sideways, what's the role you usually end up filling?" },
  // Repetition — what you do without being told
  { id: "q10", section: "repetition", prompt: "What's something you've practiced or worked at consistently, even when nobody's checking?" },
  { id: "q11", section: "repetition", prompt: "What do you do for fun that quietly is also a skill?" },
  { id: "q12", section: "repetition", prompt: "When you have unplanned time and no one to please, where does your attention naturally go?" },
  // Courage — what you're willing to try
  { id: "q13", section: "courage", prompt: "What's something you've done that scared you a little, but you did it anyway?" },
  { id: "q14", section: "courage", prompt: "What's a problem in your life or community that bugs you enough that you'd consider trying to fix it?" },
  { id: "q15", section: "courage", prompt: "If you could try ONE small experiment in the next two weeks — low stakes, no pressure to commit — what would you try?" }
];

export const STRENGTHS_SUMMARY_PROMPT = [
  "You are Kai, an AI mentor for a teenager. They just answered fifteen strengths-discovery questions. Read their answers and write a 4-sentence summary in Kai's voice, addressed to the teen directly (\"you\"), capturing:",
  "1. Three to five concrete strengths you noticed, in their own words where possible.",
  "2. One pattern across their answers (energy + curiosity + repetition often align).",
  "3. One specific small experiment they could try in the next two weeks. Modest enough to start.",
  "4. A short closing note that the summary is a working draft, not a verdict.",
  "",
  "Voice rules: warm, real, slightly irreverent, plain language. No diagnoses, no \"you have a gift for...\" hyperbole, no \"natural-born\" language. Use the teen's own concrete nouns when possible.",
  "",
  "Return ONLY the 4-sentence summary as plain text. No JSON, no headers, no quotation marks."
].join("\n");
