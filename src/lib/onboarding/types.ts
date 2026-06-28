// Shared types for the v2 voice-first onboarding. Kept in their own module so
// the pure engine, the profile builder, and the React hook can all import them
// without creating an import cycle.

export type ConversationPhase = "welcome" | "conversation" | "plan" | "complete";

export type TurnRole = "kai" | "user";

export type Turn = { role: TurnRole; text: string; ts: number };

export type KaiTone = "warm" | "balanced" | "direct";

/** What the backend extracts from a single user message. All fields optional —
 *  the model only fills what THIS message gave real signal for. Mirrors the
 *  `delta` shape returned by POST /api/onboarding/converse. */
export type ProfileDelta = {
  firstName?: string | null;
  primaryGoal?: string | null;
  focusAreas?: string[];
  motivation?: string | null;
  emotionalMotivation?: string | null;
  timeframe?: string | null;
  tone?: KaiTone | null;
  blocker?: string | null;
  identityStatement?: string | null;
  originStory?: string | null;
};

/** The accumulated profile, built up across turns. */
export type ProfileDraft = {
  firstName: string;
  primaryGoal: string;
  focusAreas: string[];
  motivation: string;
  emotionalMotivation: string;
  timeframe: string;
  tone: KaiTone | null;
  blocker: string;
  identityStatement: string;
  originStory: string;
};

export const EMPTY_DRAFT: ProfileDraft = {
  firstName: "",
  primaryGoal: "",
  focusAreas: [],
  motivation: "",
  emotionalMotivation: "",
  timeframe: "",
  tone: null,
  blocker: "",
  identityStatement: "",
  originStory: "",
};

/** The backend converse response shape (client view). */
export type ConverseResult = {
  safety: { safe: boolean; response?: string };
  kaiLine: string;
  done: boolean;
  delta: ProfileDelta;
};
