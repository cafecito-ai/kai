// Detect when a chat message is asking KAI to add or drop a sub-system, so the
// System page can be mutated device-locally (the prototype's "ask KAI to add one
// for you or take one off"). Pragmatic regex, not full NLU.

export type SubSystemIntent =
  | { kind: "add"; name: string }
  | { kind: "remove"; name: string }
  | null;

// "drop the strength system", "remove my footwork system", "get rid of finishing"
const REMOVE = /\b(?:drop|remove|delete|get rid of|take off|cut)\b\s+(?:the |my |a |an )?(.+?)\s*(?:sub-?\s*system|system)?\s*$/i;
// "add a strength system", "can you add finishing", "build me a recovery system"
const ADD = /\b(?:add|create|build|make)\b\s+(?:me )?(?:a |an |the )?(.+?)\s*(?:sub-?\s*system|system)\b/i;

function clean(s: string): string {
  return s.replace(/["'.?!]+$/g, "").trim().slice(0, 40);
}

export function detectSubSystemIntent(text: string): SubSystemIntent {
  // Only act when "system" is mentioned, so normal chat isn't hijacked.
  if (!/system/i.test(text)) return null;
  const rm = text.match(REMOVE);
  if (rm && clean(rm[1])) return { kind: "remove", name: clean(rm[1]) };
  const add = text.match(ADD);
  if (add && clean(add[1])) return { kind: "add", name: clean(add[1]) };
  return null;
}
