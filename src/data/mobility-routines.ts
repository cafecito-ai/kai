// T-026 — Mobility / stretch routine library.
//
// 12 short, teen-appropriate routines. No advanced or risky stretches
// (no bridges/wheel, no deep contortion, no PNF holds beyond 30s). All
// movements are common, well-coached recovery work. Form cues are
// embedded in each step's instruction.
//
// Routines are referenced by id from the Body agent prompt so it can
// suggest a specific one in chat. E.g. "Try the calf-release routine —
// it's 3 minutes, just floor work."

export type MobilityCategory =
  | "legs"
  | "hips"
  | "back"
  | "shoulders"
  | "fullBody"
  | "recovery"
  | "morning"
  | "evening"
  | "warmup";

export type MobilityStep = {
  /** Display name of the movement. */
  name: string;
  /** Seconds to hold or perform. */
  durationSec: number;
  /** Short form cue / instruction. One sentence. */
  instruction: string;
};

export type MobilityRoutine = {
  id: string;
  title: string;
  /** One-line summary teens see in the list. */
  blurb: string;
  /** Body parts / contexts this hits — used for filtering & agent recs. */
  categories: MobilityCategory[];
  /** Total minutes (rounded). */
  durationMin: number;
  /** When to do this. Shown as a tag. */
  bestFor: string;
  steps: MobilityStep[];
};

export const MOBILITY_ROUTINES: MobilityRoutine[] = [
  {
    id: "neck-shoulders-3",
    title: "Neck & shoulders reset",
    blurb: "For when your phone, laptop, or backpack made your shoulders feel like cement.",
    categories: ["shoulders", "evening"],
    durationMin: 3,
    bestFor: "After school or screen time",
    steps: [
      { name: "Slow neck circles", durationSec: 30, instruction: "Drop chin to chest, roll slowly side to side. No forced movement." },
      { name: "Shoulder rolls", durationSec: 30, instruction: "10 backward, 10 forward. Big, slow circles." },
      { name: "Ear-to-shoulder", durationSec: 30, instruction: "Right ear toward right shoulder, gentle hold. Switch." },
      { name: "Chest opener", durationSec: 30, instruction: "Hands behind your back, clasp if you can, gently lift away from your low back." },
      { name: "Reach overhead", durationSec: 30, instruction: "Arms straight up, lengthen one side then the other." },
      { name: "Settle", durationSec: 30, instruction: "Roll shoulders once more. Notice the difference." },
    ],
  },
  {
    id: "hip-openers-5",
    title: "Hip openers",
    blurb: "Sit too much? This loosens what gets locked up.",
    categories: ["hips", "evening"],
    durationMin: 5,
    bestFor: "After a long day of sitting",
    steps: [
      { name: "Figure-4 stretch (each side)", durationSec: 60, instruction: "Lying down, cross one ankle over opposite knee. Pull thigh toward chest." },
      { name: "Low lunge (each side)", durationSec: 60, instruction: "One knee down, other foot forward 90°. Sink hips. Hands on front thigh." },
      { name: "Butterfly fold", durationSec: 60, instruction: "Soles of feet together, knees out. Hinge forward from hips, don't round the back." },
      { name: "Glute bridge", durationSec: 30, instruction: "On your back, knees bent, lift hips. 10 slow reps, squeeze glutes at top." },
      { name: "Knees to chest", durationSec: 30, instruction: "Both knees pulled in. Rock gently side to side." },
    ],
  },
  {
    id: "hamstring-loosen-4",
    title: "Hamstring loosen",
    blurb: "Tight after running or sitting? This helps.",
    categories: ["legs", "recovery"],
    durationMin: 4,
    bestFor: "Post-run or post-sit",
    steps: [
      { name: "Standing forward fold", durationSec: 45, instruction: "Soft knees, hinge from hips, let head hang. Don't force fingertips to floor." },
      { name: "Seated forward fold", durationSec: 60, instruction: "Legs straight ahead, reach for shins or ankles. Long spine, not rounded back." },
      { name: "Lying hamstring (each side)", durationSec: 60, instruction: "One leg up, strap or towel around foot. Gentle pull, knee can stay slightly bent." },
      { name: "Half split (each side)", durationSec: 30, instruction: "One leg back, front leg straight, hips back over heel." },
    ],
  },
  {
    id: "calf-release-3",
    title: "Calf release",
    blurb: "Floor work for tight calves and Achilles.",
    categories: ["legs", "recovery"],
    durationMin: 3,
    bestFor: "Runners, walkers, anyone in cleats",
    steps: [
      { name: "Downward dog calf pedal", durationSec: 60, instruction: "Pike position. Pedal heels one at a time. Slow." },
      { name: "Wall calf stretch (each side)", durationSec: 45, instruction: "Hands on wall, back leg straight, heel down. Lean in." },
      { name: "Bent-knee calf (each side)", durationSec: 30, instruction: "Same wall stretch, but bend the back knee — hits the lower calf." },
      { name: "Ankle circles", durationSec: 30, instruction: "Foot in the air, 10 circles each direction." },
    ],
  },
  {
    id: "lower-back-relief-5",
    title: "Lower back relief",
    blurb: "Gentle work to undo a day of sitting or a heavy lift session.",
    categories: ["back", "recovery"],
    durationMin: 5,
    bestFor: "Tight low back after sitting or lifting",
    steps: [
      { name: "Cat-cow", durationSec: 60, instruction: "On hands and knees. Round and arch, slow and breathy. 10 reps." },
      { name: "Child's pose", durationSec: 60, instruction: "Knees wide, big toes touching, sit hips back, arms long ahead." },
      { name: "Knees to chest", durationSec: 30, instruction: "Both knees pulled in, hug. Rock side to side." },
      { name: "Supine twist (each side)", durationSec: 60, instruction: "On back, drop knees to one side. Other arm out to the side. Look the opposite way." },
      { name: "Sphinx", durationSec: 30, instruction: "On belly, forearms down, lift chest gently. No clenching." },
    ],
  },
  {
    id: "morning-wake-up-4",
    title: "Morning wake-up",
    blurb: "Four moves to feel awake without coffee.",
    categories: ["fullBody", "morning"],
    durationMin: 4,
    bestFor: "First thing in the morning",
    steps: [
      { name: "Standing side bends", durationSec: 45, instruction: "Feet hip-width, reach one arm over your head, lean. Switch sides." },
      { name: "Cat-cow", durationSec: 45, instruction: "10 slow rounds on hands and knees." },
      { name: "Downward dog", durationSec: 45, instruction: "Hold and breathe. Bend one knee, then the other." },
      { name: "Squat to stand", durationSec: 45, instruction: "Hands toward toes, sink into squat, stand back up. 8 reps." },
      { name: "Big breath", durationSec: 30, instruction: "Reach arms up on inhale, settle on exhale. 3 rounds." },
    ],
  },
  {
    id: "wind-down-6",
    title: "Wind-down sequence",
    blurb: "Slow movements to help you actually sleep.",
    categories: ["fullBody", "evening"],
    durationMin: 6,
    bestFor: "20-30 min before bed",
    steps: [
      { name: "Child's pose", durationSec: 60, instruction: "Settle in. Three slow breaths." },
      { name: "Cat-cow", durationSec: 45, instruction: "Match breath to movement." },
      { name: "Pigeon (each side)", durationSec: 60, instruction: "Front shin forward, back leg long. Sink chest toward the floor." },
      { name: "Reclined butterfly", durationSec: 60, instruction: "On back, soles of feet together, knees fall open. Hands on belly." },
      { name: "Legs up the wall", durationSec: 90, instruction: "Hips close to wall, legs up. Eyes closed. Just breathe." },
      { name: "Savasana", durationSec: 45, instruction: "Lie flat, arms by sides. Let everything go heavy." },
    ],
  },
  {
    id: "post-strength-7",
    title: "Post-strength recovery",
    blurb: "After a lifting session — full body decompression.",
    categories: ["fullBody", "recovery"],
    durationMin: 7,
    bestFor: "Right after a strength session",
    steps: [
      { name: "Standing forward fold", durationSec: 45, instruction: "Soft knees, head hangs. Slow breaths." },
      { name: "Low lunge (each side)", durationSec: 60, instruction: "Knee down, hips sink, lift chest." },
      { name: "Pigeon (each side)", durationSec: 60, instruction: "Front shin forward, back leg long. Breathe into the hip." },
      { name: "Thread the needle (each side)", durationSec: 45, instruction: "From hands & knees, slide one arm under the other, side of head to floor." },
      { name: "Child's pose", durationSec: 45, instruction: "Knees wide. Long arms ahead. Reset." },
      { name: "Supine twist (each side)", durationSec: 60, instruction: "Drop knees side, look opposite way, breathe." },
      { name: "Legs up the wall", durationSec: 60, instruction: "Helps the lower body drain. Two minutes is a treat." },
    ],
  },
  {
    id: "sport-warmup-5",
    title: "Sport-day warm-up",
    blurb: "Before a game, practice, or pickup. Five minutes, no equipment.",
    categories: ["warmup", "fullBody"],
    durationMin: 5,
    bestFor: "Before a sport or scrimmage",
    steps: [
      { name: "Jog or jumping jacks", durationSec: 60, instruction: "Easy pace. Just raise your heart rate." },
      { name: "Leg swings (each leg)", durationSec: 45, instruction: "Hold something for balance. Front-back, then side-to-side." },
      { name: "Walking lunges", durationSec: 45, instruction: "10 total. Knee tracks over middle of foot." },
      { name: "High knees", durationSec: 30, instruction: "In place. Knees to belly button height. 20 total." },
      { name: "Butt kicks", durationSec: 30, instruction: "Heels toward glutes. 20 total." },
      { name: "Arm circles", durationSec: 30, instruction: "Big circles, 10 forward, 10 back." },
      { name: "Body weight squats", durationSec: 30, instruction: "10 slow reps. Hips back, chest up." },
    ],
  },
  {
    id: "upper-back-laptop-4",
    title: "Laptop-hunch undo",
    blurb: "Counter the screen-slump in four moves.",
    categories: ["back", "shoulders"],
    durationMin: 4,
    bestFor: "Mid-homework, mid-Zoom, mid-game",
    steps: [
      { name: "Doorway chest opener", durationSec: 45, instruction: "Forearm on doorframe at 90°. Step through. Switch arms." },
      { name: "Wall angels", durationSec: 60, instruction: "Back to wall, arms in goalpost. Slide up and down. 10 reps." },
      { name: "Thread the needle (each side)", durationSec: 60, instruction: "Hands and knees, slide one arm under, shoulder to floor." },
      { name: "Standing T-spine rotation", durationSec: 45, instruction: "Hands on hips. Rotate upper body side to side, slow. 10 each way." },
      { name: "Stand tall, deep breaths", durationSec: 30, instruction: "Crown of head reaches up. Shoulders down. Three breaths." },
    ],
  },
  {
    id: "ankles-feet-3",
    title: "Ankles & feet",
    blurb: "Quick foot and ankle work — especially for athletes.",
    categories: ["legs", "recovery"],
    durationMin: 3,
    bestFor: "Before or after running / jumping sports",
    steps: [
      { name: "Ankle circles", durationSec: 30, instruction: "10 each direction, each ankle." },
      { name: "Tennis ball foot roll (each foot)", durationSec: 45, instruction: "Roll the arch of your foot slowly. A bottle works too." },
      { name: "Calf raises", durationSec: 30, instruction: "20 slow reps. Pause at the top." },
      { name: "Toe spreads", durationSec: 30, instruction: "Try to spread your toes. Holds your foot strength awake." },
      { name: "Heel walks / toe walks", durationSec: 30, instruction: "15 seconds heels-only, 15 seconds toes-only." },
    ],
  },
  {
    id: "tension-reset-5",
    title: "Tension reset",
    blurb: "Tight chest, racing thoughts? Movement + breath, no fluff.",
    categories: ["fullBody", "recovery", "evening"],
    durationMin: 5,
    bestFor: "When your body feels wound up",
    steps: [
      { name: "Box breathing", durationSec: 60, instruction: "Inhale 4, hold 4, exhale 4, hold 4. Three rounds." },
      { name: "Shoulder shrug release", durationSec: 30, instruction: "Shrug shoulders up to ears. Hold 5. Drop. Repeat 5 times." },
      { name: "Standing forward fold", durationSec: 60, instruction: "Let arms and head hang. Sway gently." },
      { name: "Cat-cow", durationSec: 45, instruction: "Slow, breath-led. Five rounds." },
      { name: "Child's pose", durationSec: 60, instruction: "Settle. Heavy breath in and out the nose." },
      { name: "Lie flat", durationSec: 45, instruction: "Hands on belly. Five breaths. Let the floor hold you." },
    ],
  },
];

/** Look up by id. Returns null if unknown. */
export function getRoutine(id: string): MobilityRoutine | null {
  return MOBILITY_ROUTINES.find((r) => r.id === id) ?? null;
}

/** Filter by category — used by the Body agent to recommend by context. */
export function routinesByCategory(cat: MobilityCategory): MobilityRoutine[] {
  return MOBILITY_ROUTINES.filter((r) => r.categories.includes(cat));
}

/** Total seconds in a routine (sum of step durations). Used to render
 *  the progress bar on the player. */
export function routineTotalSeconds(r: MobilityRoutine): number {
  return r.steps.reduce((s, step) => s + step.durationSec, 0);
}
