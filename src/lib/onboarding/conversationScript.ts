// The local conversation script — deterministic ordering + Kai's opening lines.
//
// The HYBRID design: scripted openings (here) run instantly and work offline,
// while the backend (/api/onboarding/converse) produces the warm, contextual
// "understanding" lines that react to what the teen actually said. The engine
// prefers the backend line and falls back to the scripted one when the backend
// is slow/unavailable — so the conversation NEVER stalls.
//
// These are intentionally short, human, and weave a little product value in
// (system / daily actions / accountability / memory) without a scripted pitch.

import type { ProfileDraft } from "./types";

export type ScriptStep = {
  id: string;
  /** Kai's opening line for this step. May reference what we already know. */
  line: (draft: ProfileDraft) => string;
};

function firstNameOr(draft: ProfileDraft, fallback: string): string {
  return draft.firstName ? draft.firstName : fallback;
}

// The spine of the first conversation. The backend can finish early (done=true)
// once it has enough; otherwise we walk these in order.
export const SCRIPT: ScriptStep[] = [
  {
    id: "name",
    line: () => "Hey — I'm Kai. I'm here to help you become who you actually want to be, and to make the day-to-day of getting there a lot less lonely. First things first: what should I call you?",
  },
  {
    id: "reason",
    line: (d) => `Good to meet you, ${firstNameOr(d, "")}`.trim() + ". So — what made you open this today? No wrong answer, just say it how it is.",
  },
  {
    id: "vision",
    line: () => "I hear you. Picture a year from now and everything's gone right — what does that actually look like for you?",
  },
  {
    id: "why",
    line: () => "That matters. What's underneath it — why does that one hit for you?",
  },
  {
    id: "blocker",
    line: () => "Real. And when you've tried before, what usually gets in the way? I ask because I'll build the plan around that, not pretend it doesn't exist.",
  },
  {
    id: "wrap",
    line: (d) =>
      `Okay${d.firstName ? `, ${d.firstName}` : ""} — I've got what I need. Give me a second and I'll turn this into something real you can actually do.`,
  },
];

export const FIRST_STEP_ID = SCRIPT[0].id;

/** The scripted line for a step index (clamped). Used as the instant opener and
 *  as the fallback when the backend doesn't return a usable line. */
export function scriptedLineFor(stepIndex: number, draft: ProfileDraft): string {
  const step = SCRIPT[Math.max(0, Math.min(stepIndex, SCRIPT.length - 1))];
  return step.line(draft);
}

export function stepIdAt(stepIndex: number): string {
  const step = SCRIPT[Math.max(0, Math.min(stepIndex, SCRIPT.length - 1))];
  return step.id;
}

export const SCRIPT_LENGTH = SCRIPT.length;
