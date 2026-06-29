// Sub-system generation — KAI breaks a main goal into 2-4 named sub-skills.
//
// Live AI via the existing /api/kai/chat endpoint (no worker changes): we send
// a strict JSON-instruction prompt, extract + validate the JSON, and fall back
// to deterministic built-in templates whenever the call fails, times out, or
// returns unparseable output. The template fallback means a live demo NEVER
// hard-fails, even fully offline.

import { api } from "./api";
import { markGeneratedConversation } from "./generated-convos";
import { classifyTheme, type GoalTheme } from "./local-northstar";
import type { SubHabitInput, SubSystemInput } from "./local-subsystems";
import { GENERATED_TEMPLATES } from "./subsystem-templates.generated";

const TIMEOUT_MS = 10000;

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

function buildPrompt(goal: string): string {
  return [
    `A teenager's main goal is: "${goal}".`,
    `Break it into 2 to 4 named SUB-SYSTEMS — the component skills they must build to reach it.`,
    `For each sub-system give a short "name" (1 to 3 words), a one-line "blurb", and 2 to 4 weekly "habits".`,
    `Each habit MUST have:`,
    `- "section": one of daily, training, sleep, routine, mindset`,
    `- "title": the action, short (under 8 words)`,
    `- "detail": one concrete how-to instruction telling them EXACTLY what to do (under 14 words)`,
    `- "days": array of weekday numbers 0=Sunday..6=Saturday; use [] for every day`,
    `Be SPECIFIC and measurable: real numbers, sets, reps, minutes, distances, drills.`,
    `No vague habits like "exercise more", "be positive", or "practice". If you can't say exactly`,
    `what to do and how much, don't include it. Tailor it tightly to the goal above.`,
    `Reply with ONLY valid JSON, no prose and no markdown fences, exactly this shape:`,
    `{"systems":[{"name":"Endurance","blurb":"Build a bigger engine","habits":[{"section":"training","title":"Tempo run","detail":"25 min at a hard, steady pace you can just hold","days":[2,5]}]}]}`,
  ].join("\n");
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/** Pull the first {...} block out of the model reply and validate it. */
function parseReply(reply: string): SubSystemInput[] | null {
  const match = reply.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let obj: unknown;
  try {
    obj = JSON.parse(match[0]);
  } catch {
    return null;
  }
  const systems = asRecord(obj)?.systems;
  if (!Array.isArray(systems)) return null;

  const out: SubSystemInput[] = [];
  for (const s of systems) {
    const rec = asRecord(s);
    const name = typeof rec?.name === "string" ? rec.name : "";
    const habitsRaw = Array.isArray(rec?.habits) ? rec.habits : [];
    if (!name || habitsRaw.length === 0) continue;
    const items: SubHabitInput[] = [];
    for (const h of habitsRaw) {
      const hr = asRecord(h);
      const title = typeof hr?.title === "string" ? hr.title : "";
      if (!title) continue;
      items.push({
        title,
        detail: typeof hr?.detail === "string" ? hr.detail : "",
        section: typeof hr?.section === "string" ? hr.section : "daily",
        days: Array.isArray(hr?.days) ? (hr.days as unknown[]).map(Number) : [],
      });
    }
    if (items.length > 0) {
      out.push({ name, blurb: typeof rec?.blurb === "string" ? rec.blurb : undefined, items });
    }
  }
  return out.length >= 2 ? out : null;
}

// ─── Template fallback ──────────────────────────────────────────────────
// Keyword overrides first (so Evan's demo goals land exactly), then theme map,
// then a generic 3-system set. Realistic section + days so the weekly meters
// have proper targets.

type T = { name: string; blurb: string; items: SubHabitInput[] };

const SOCCER: T[] = [
  { name: "Endurance", blurb: "A bigger engine for the full 90", items: [
    { section: "training", title: "Easy 30-min run", detail: "Conversational Zone-2 pace, nose breathing", days: [1, 4] },
    { section: "training", title: "Sprint intervals", detail: "8 x 30m sprints, full rest between", days: [2, 6] },
    { section: "daily", title: "Hit 9k steps", detail: "Stay on your feet on off days", days: [] },
  ] },
  { name: "Footwork & Passing", blurb: "First touch and ball control", items: [
    { section: "training", title: "15-min ball mastery", detail: "Toe taps, rolls, V-pulls, inside-outside", days: [1, 2, 3, 4, 5] },
    { section: "training", title: "Wall passing", detail: "200 one-touch passes, both feet", days: [3, 6] },
  ] },
  { name: "Finishing", blurb: "Calm in front of goal", items: [
    { section: "training", title: "Shooting reps", detail: "40 finishes from the edge of the box", days: [2, 5] },
    { section: "mindset", title: "Visualize finishes", detail: "Picture 3 goals you'll score this week", days: [0, 4] },
  ] },
  { name: "Strength", blurb: "Win the physical battles", items: [
    { section: "training", title: "Lower-body lift", detail: "Squats + lunges, 3 x 8, add weight weekly", days: [1, 4] },
    { section: "training", title: "Core circuit", detail: "Planks, leg raises, twists, 3 rounds", days: [3, 6] },
    { section: "sleep", title: "8 hours sleep", detail: "Same bedtime, screens off 45 min before", days: [] },
  ] },
];

const LUMBERJACK: T[] = [
  { name: "Strength", blurb: "Raw power to swing all day", items: [
    { section: "training", title: "Heavy compound lifts", detail: "Deadlift, squat, row, 4 x 5", days: [1, 3, 5] },
    { section: "training", title: "Grip & forearm work", detail: "Farmer carries + wrist curls, 3 sets", days: [2, 5] },
  ] },
  { name: "Cutting Technique", blurb: "The perfect, efficient cut", items: [
    { section: "training", title: "Practice swing form", detail: "30 controlled swings, focus on the hinge", days: [1, 4] },
    { section: "mindset", title: "Study one cut method", detail: "Watch a pro, note one thing to copy", days: [6] },
  ] },
  { name: "Conditioning", blurb: "Stamina that lasts the shift", items: [
    { section: "training", title: "20-min cardio", detail: "Row or ruck at a steady working pace", days: [2, 4, 6] },
    { section: "sleep", title: "8 hours sleep", detail: "Recover so you can swing hard tomorrow", days: [] },
  ] },
];

const BASKETBALL: T[] = [
  { name: "Conditioning", blurb: "Run all four quarters", items: [
    { section: "training", title: "Suicides / sprints", detail: "6 full-court suicides, jog back to start", days: [1, 4] },
    { section: "daily", title: "Hit 9k steps", detail: "Keep moving on off days", days: [] },
  ] },
  { name: "Ball Handling", blurb: "Tight, confident dribble", items: [
    { section: "training", title: "15-min dribble drills", detail: "Pound, crossover, between-legs, both hands", days: [1, 2, 3, 4, 5] },
  ] },
  { name: "Shooting", blurb: "Repeatable, reliable form", items: [
    { section: "training", title: "Make 100 shots", detail: "Spots around the arc, count makes not misses", days: [2, 5] },
    { section: "mindset", title: "Visualize free throws", detail: "10 in your head, same routine each time", days: [0] },
  ] },
  { name: "Strength", blurb: "Finish through contact", items: [
    { section: "training", title: "Full-body lift", detail: "Squat, press, pull, 3 x 8", days: [3, 6] },
    { section: "sleep", title: "8 hours sleep", detail: "Lights out the same time nightly", days: [] },
  ] },
];

const THEME_TEMPLATES: Record<GoalTheme, T[]> = {
  strength: [
    { name: "Power", blurb: "Get stronger on the big lifts", items: [
      { section: "training", title: "Heavy compound lift", detail: "Squat or deadlift, 5 x 5, add weight weekly", days: [1, 4] },
      { section: "training", title: "Accessory work", detail: "Press, rows, pull-ups, 3 x 8", days: [2, 5] },
    ] },
    { name: "Volume", blurb: "Put in the reps", items: [
      { section: "training", title: "Hypertrophy session", detail: "8-12 reps near failure, 4 exercises", days: [3, 6] },
      { section: "daily", title: "Hit 8k steps", detail: "Stay active on rest days", days: [] },
    ] },
    { name: "Recovery", blurb: "Grow between sessions", items: [
      { section: "sleep", title: "8 hours sleep", detail: "Muscle is built asleep, not in the gym", days: [] },
      { section: "routine", title: "10-min mobility", detail: "Hips, shoulders, ankles after training", days: [0, 3] },
    ] },
    { name: "Fuel", blurb: "Eat to build", items: [
      { section: "daily", title: "Protein every meal", detail: "A palm of protein at each meal", days: [] },
      { section: "daily", title: "Drink enough water", detail: "Aim for 2-3 litres across the day", days: [] },
    ] },
  ],
  fitness: [
    { name: "Endurance", blurb: "A bigger engine", items: [
      { section: "training", title: "Easy 30-min cardio", detail: "Zone-2, you can hold a conversation", days: [1, 4] },
      { section: "training", title: "Interval session", detail: "6 x 1 min hard, 2 min easy", days: [2, 6] },
    ] },
    { name: "Strength", blurb: "Power and resilience", items: [
      { section: "training", title: "Full-body lift", detail: "Squat, push, pull, 3 x 8", days: [1, 4] },
      { section: "training", title: "Core circuit", detail: "Plank, side plank, deadbugs, 3 rounds", days: [3] },
    ] },
    { name: "Recovery", blurb: "Bounce back stronger", items: [
      { section: "sleep", title: "8 hours sleep", detail: "Consistent bedtime each night", days: [] },
      { section: "routine", title: "Mobility / stretch", detail: "10 min on the tight areas", days: [0, 5] },
    ] },
  ],
  sleep: [
    { name: "Wind-Down", blurb: "Land softly each night", items: [
      { section: "routine", title: "Screens off early", detail: "No phone 45 min before bed", days: [] },
      { section: "routine", title: "Lights low + read", detail: "Dim the room, read a few pages", days: [] },
    ] },
    { name: "Consistency", blurb: "Same time, every day", items: [
      { section: "sleep", title: "Same bedtime", detail: "Within 30 min, even on weekends", days: [] },
      { section: "sleep", title: "Same wake time", detail: "Get up at the same time daily", days: [] },
    ] },
    { name: "Daytime Energy", blurb: "Set up tonight's sleep today", items: [
      { section: "routine", title: "Morning sunlight", detail: "10 min outside soon after waking", days: [] },
      { section: "daily", title: "No caffeine after 2pm", detail: "Switch to water or decaf", days: [] },
    ] },
  ],
  nutrition: [
    { name: "Fueling", blurb: "Eat for how you want to feel", items: [
      { section: "daily", title: "Protein every meal", detail: "A palm of protein at each meal", days: [] },
      { section: "daily", title: "Veg with two meals", detail: "Add a handful to lunch and dinner", days: [] },
    ] },
    { name: "Hydration", blurb: "Stay topped up", items: [
      { section: "daily", title: "3 water bottles", detail: "Refill morning, noon, and evening", days: [] },
    ] },
    { name: "Prep", blurb: "Make the easy choice default", items: [
      { section: "routine", title: "Prep meals ahead", detail: "Cook 2-3 meals for the days ahead", days: [0, 3] },
    ] },
  ],
  mind: [
    { name: "Calm", blurb: "Steady your nervous system", items: [
      { section: "mindset", title: "5-min breathing", detail: "Box breathing: in 4, hold 4, out 4", days: [] },
      { section: "routine", title: "Evening journal", detail: "Write 3 lines about your day", days: [] },
    ] },
    { name: "Focus", blurb: "Train your attention", items: [
      { section: "mindset", title: "One deep-work block", detail: "45 min, phone away, one task", days: [1, 2, 3, 4, 5] },
      { section: "daily", title: "Phone out of reach", detail: "Leave it in another room while you work", days: [] },
    ] },
    { name: "Connection", blurb: "You're not in it alone", items: [
      { section: "daily", title: "Reach out to one person", detail: "Text or call a friend, no reason needed", days: [2, 5] },
    ] },
  ],
  school: [
    { name: "Focus", blurb: "Real work, fewer hours", items: [
      { section: "mindset", title: "One deep-work block", detail: "45 min on the hardest subject, no phone", days: [1, 2, 3, 4, 5] },
      { section: "daily", title: "Phone in another room", detail: "Out of sight while you study", days: [] },
    ] },
    { name: "Study System", blurb: "Learn it once, properly", items: [
      { section: "routine", title: "Review notes same day", detail: "10-min recap of each class that night", days: [1, 2, 3, 4, 5] },
      { section: "routine", title: "Weekly review", detail: "Redo the week's hardest problems", days: [0] },
    ] },
    { name: "Recovery", blurb: "A rested brain learns", items: [
      { section: "sleep", title: "8 hours sleep", detail: "Sleep locks in what you studied", days: [] },
    ] },
  ],
  general: [
    { name: "Body", blurb: "Move and fuel well", items: [
      { section: "training", title: "30-min workout", detail: "Walk, run, or lift, your pick", days: [1, 3, 5] },
      { section: "daily", title: "Drink enough water", detail: "2-3 litres across the day", days: [] },
    ] },
    { name: "Mind", blurb: "Steady and clear", items: [
      { section: "mindset", title: "5-min reset", detail: "Breathe slow or step outside", days: [] },
      { section: "routine", title: "Evening journal", detail: "Three lines about your day", days: [] },
    ] },
    { name: "Discipline", blurb: "Small wins that compound", items: [
      { section: "sleep", title: "8 hours sleep", detail: "Same bedtime each night", days: [] },
      { section: "routine", title: "Plan tomorrow tonight", detail: "Write your top 3 for the morning", days: [] },
    ] },
  ],
};

function keywordOverride(goal: string): T[] | null {
  const g = goal.toLowerCase();
  // Generated goal-specific templates first. American-football etc. use specific
  // terms, so they win over soccer's plain "football".
  for (const t of GENERATED_TEMPLATES) {
    if (t.test.test(g)) return t.systems;
  }
  if (/soccer|football|attacker|striker|forward|winger|midfield/.test(g)) return SOCCER;
  if (/lumber|axe|chop|wood|timber|logging|sawyer|forestry/.test(g)) return LUMBERJACK;
  if (/basketball|hoops|point ?guard|nba|baller/.test(g)) return BASKETBALL;
  return null;
}

function toInput(t: T): SubSystemInput {
  return { name: t.name, blurb: t.blurb, items: t.items };
}

export function templateSubSystems(goal: string): SubSystemInput[] {
  const set = keywordOverride(goal) ?? THEME_TEMPLATES[classifyTheme(goal)] ?? THEME_TEMPLATES.general;
  return set.map(toInput);
}

/** Live-AI generation (no template fallback). Returns parsed sub-systems, or
 *  null if the call fails / times out / returns unusable output.
 *
 *  The only general-completion endpoint is /api/kai/chat, which PERSISTS the
 *  turn to a conversation even when we pass conversationId=null. So we delete
 *  that throwaway conversation afterward — otherwise the generation prompt + raw
 *  JSON would pollute the user's real chat history.
 *
 *  Designed to run in the BACKGROUND as an "upgrade" over the instant template:
 *  the page shows templateSubSystems() immediately, then swaps in this richer,
 *  goal-specific result when it arrives. */
export async function generateSubSystemsAI(goal: string): Promise<SubSystemInput[] | null> {
  const clean = goal.trim();
  if (!clean) return null;
  const chatPromise = api.chat("kai", buildPrompt(clean), null);
  void chatPromise
    .then((r) => {
      if (!r?.conversationId) return;
      // Hide it from chat client-side (reliable), and best-effort delete it
      // server-side (often 404s due to async persistence — that's fine).
      markGeneratedConversation(r.conversationId);
      return api.deleteConversation(r.conversationId).catch(() => {});
    })
    .catch(() => {});
  try {
    const res = (await Promise.race([chatPromise, timeout(TIMEOUT_MS)])) as { reply: string };
    const parsed = parseReply(res.reply ?? "");
    if (parsed && parsed.length >= 2) return parsed;
  } catch {
    /* fall through */
  }
  return null;
}

/** A single sub-system built from a name the user asked KAI to add. Used for an
 *  instant, offline-safe add from chat. */
export function stubSubSystem(name: string, goal: string): SubSystemInput {
  const clean = name.trim();
  const Title = clean.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 40) || "New System";
  const lower = clean.toLowerCase() || "this";
  return {
    name: Title,
    blurb: `Your ${lower} work`,
    goal,
    items: [
      { section: "training", title: `${Title} session`, detail: `30 focused minutes on ${lower}`, days: [1, 3, 5] },
      { section: "daily", title: `Practice ${lower}`, detail: `One small rep of ${lower} today`, days: [] },
      { section: "mindset", title: `Review ${lower}`, detail: `Note what improved and what's next`, days: [0] },
    ],
  };
}
