// Chat → feature deep-links (G6 cohesion).
//
// When KAI suggests a concrete in-app action in a reply, surface a single
// tappable chip under that message that routes straight to the feature. This
// is a pure frontend affordance — it does NOT change what KAI says, the
// safety classifier, or server-side routing. It only reads the reply text and
// offers a shortcut.
//
// Design rules:
//   - At most ONE chip per message (the highest-priority match wins).
//   - Conservative matching: target suggestion phrasing near a feature noun,
//     not every bare mention, to avoid false positives.
//   - NEVER attach a chip to a crisis / safety reply. The caller also passes
//     the server `safetyEvent` flag; this crisis-marker guard is a second line.

export type ChatAction = { route: string; label: string };

// If the reply reads like a safety/crisis response, suppress all chips.
const CRISIS_MARKERS =
  /\b988\b|crisis text line|741741|suicid|self[- ]harm|trevor project|crisis line|1-?800-?273|neda helpline/i;

type Rule = { route: string; label: string; test: RegExp };

// Ordered by priority — first match wins.
const RULES: Rule[] = [
  {
    route: "/scan",
    label: "Start a body scan",
    test: /\bbody scan\b|posture (check|scan|read)|alignment (check|scan)/i,
  },
  {
    route: "/food/log",
    label: "Log a meal",
    test: /\b(log|track|snap|add|jot down)\b[^.?!]{0,32}\b(meal|food|lunch|dinner|breakfast|what you ate|what you're eating)\b/i,
  },
  {
    route: "/workout/log",
    label: "Log a workout",
    test: /\b(log|track|after (your|that)|how(?:'d| did) (your|that))\b[^.?!]{0,32}\b(workout|training session|lift|gym session)\b/i,
  },
  {
    route: "/sleep/log",
    label: "Log your sleep",
    test: /\b(log|track|how(?:'s| was| is)?)\b[^.?!]{0,28}\bsleep\b/i,
  },
  {
    route: "/journal",
    label: "Open the journal",
    test: /\b(journal( it| about)?|write it (out|down)|write to (yourself|your (future|past)))\b/i,
  },
  {
    route: "/goals",
    label: "Set a goal",
    test: /\b(set|name|pick|start)\b[^.?!]{0,24}\bgoal\b|\bgoal\b[^.?!]{0,18}\b(to set|to start|worth setting)\b/i,
  },
  {
    route: "/check-in",
    label: "Do a check-in",
    test: /\bcheck[- ]in\b/i,
  },
  {
    route: "/mobility",
    label: "Try a stretch",
    test: /\b(stretch( it out)?|mobility|loosen up|yoga flow)\b/i,
  },
  {
    route: "/strengths",
    label: "Discover your strengths",
    test: /\bstrengths? (quiz|discovery|finder)\b|discover (your|what your) strengths?/i,
  },
];

/** Return at most one deep-link action suggested by KAI's reply, or null. */
export function suggestChatAction(text: string): ChatAction | null {
  if (!text) return null;
  if (CRISIS_MARKERS.test(text)) return null;
  for (const r of RULES) {
    if (r.test.test(text)) return { route: r.route, label: r.label };
  }
  return null;
}
