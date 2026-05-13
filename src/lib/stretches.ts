/**
 * Teen-appropriate stretching catalog. Same spec rules as workouts but with
 * a different shape: all segments are timed holds (no reps). Cues focus on
 * breathing into the hold and on "ease off if you feel sharp pain."
 *
 * Holds default to 30-45s for adolescent connective tissue — long enough
 * to be useful, short enough not to overstretch growing joints.
 */

export type StretchSegment = {
  name: string;
  cue: string;
  /** Hold duration in seconds. */
  holdSeconds: number;
  /** Optional rest between this and the next segment. */
  restSeconds?: number;
};

export type StretchCategory = "morning" | "desk" | "post_sport" | "wind_down" | "tightness";

export type StretchFlow = {
  id: string;
  name: string;
  category: StretchCategory;
  totalMinutes: number;
  description: string;
  setup: string;
  segments: ReadonlyArray<StretchSegment>;
};

export function stretchFlowDurationSeconds(flow: StretchFlow): number {
  return flow.segments.reduce((sum, seg) => sum + seg.holdSeconds + (seg.restSeconds ?? 0), 0);
}

export const STRETCH_FLOWS: ReadonlyArray<StretchFlow> = [
  {
    id: "morning-back-unstick-10",
    name: "Morning back unstick",
    category: "morning",
    totalMinutes: 10,
    description: "For when your back feels like it slept funny. Slow, no jumping.",
    setup: "Floor space. Pajamas are fine.",
    segments: [
      { name: "Knees to chest", cue: "On your back. Hug both knees in. Rock side to side.", holdSeconds: 45 },
      { name: "Supine spinal twist (right)", cue: "Knees drop right, look left. Two long breaths.", holdSeconds: 45 },
      { name: "Supine spinal twist (left)", cue: "Knees drop left, look right.", holdSeconds: 45 },
      { name: "Cat / cow flow", cue: "Hands and knees. Round up on exhale, dip down on inhale.", holdSeconds: 60 },
      { name: "Child's pose", cue: "Knees wide, arms forward. Breathe into your lower back.", holdSeconds: 60 },
      { name: "Down dog", cue: "Hands and feet down, hips up. Pedal heels. Not about hitting the floor.", holdSeconds: 45 },
      { name: "Standing forward fold", cue: "Knees soft. Hang the head. Let the spine release.", holdSeconds: 45 },
      { name: "Tall reach", cue: "Stand. Arms overhead. Long side body. Hold each side 20s.", holdSeconds: 40 },
      { name: "Three breaths standing", cue: "Eyes closed if that feels right. Inhale 4, exhale 6.", holdSeconds: 45 }
    ]
  },
  {
    id: "desk-shoulders-5",
    name: "Desk shoulders and neck",
    category: "desk",
    totalMinutes: 5,
    description: "Five-minute reset between classes or during homework. Stand if you can; sit if you can't.",
    setup: "Anywhere. Phone face-down ideally.",
    segments: [
      { name: "Shoulder rolls", cue: "Slow circles. Five each direction.", holdSeconds: 30 },
      { name: "Ear to shoulder (right)", cue: "Tilt right. Left shoulder relaxes down. Don't pull.", holdSeconds: 30 },
      { name: "Ear to shoulder (left)", cue: "Switch sides.", holdSeconds: 30 },
      { name: "Chin tucks", cue: "Slide your chin straight back. Hold 3s, release. Repeat 5x.", holdSeconds: 30 },
      { name: "Doorframe chest opener", cue: "Hand on doorframe. Step forward. Open the chest.", holdSeconds: 40, restSeconds: 5 },
      { name: "Same — other side", cue: "Switch sides.", holdSeconds: 40, restSeconds: 5 },
      { name: "Eagle arms / reverse prayer", cue: "Whichever feels better. Squeeze shoulder blades.", holdSeconds: 30 },
      { name: "Three breaths", cue: "Inhale 4, exhale 6. Reset.", holdSeconds: 30 }
    ]
  },
  {
    id: "post-sport-12",
    name: "Post-sport cooldown",
    category: "post_sport",
    totalMinutes: 12,
    description: "After running, soccer, basketball, lifting — anything that left your legs working.",
    setup: "Mat or grass. While the body is still warm.",
    segments: [
      { name: "Walking-it-out", cue: "Walk slowly for 30s to bring the heart rate down.", holdSeconds: 30 },
      { name: "Standing forward fold", cue: "Knees soft. Let the hamstrings open.", holdSeconds: 45 },
      { name: "Pigeon (right)", cue: "Front shin forward, back leg long. Don't force the depth.", holdSeconds: 60 },
      { name: "Pigeon (left)", cue: "Switch sides.", holdSeconds: 60 },
      { name: "Seated forward fold", cue: "Legs out. Reach toward feet. Round if needed.", holdSeconds: 45 },
      { name: "Butterfly (knees out)", cue: "Soles together. Lean forward gently.", holdSeconds: 45 },
      { name: "Quad stretch (right)", cue: "Stand. Hold right ankle behind you. Don't yank.", holdSeconds: 30 },
      { name: "Quad stretch (left)", cue: "Switch sides.", holdSeconds: 30 },
      { name: "Calf stretch (right)", cue: "Back foot flat, lean toward a wall.", holdSeconds: 30 },
      { name: "Calf stretch (left)", cue: "Switch sides.", holdSeconds: 30 },
      { name: "Lie back, knees up, breathe", cue: "On your back. Let everything go for a full minute.", holdSeconds: 90 }
    ]
  },
  {
    id: "wind-down-10",
    name: "Pre-bed wind down",
    category: "wind_down",
    totalMinutes: 10,
    description: "Slow stretches to drop the nervous system before sleep. No standing required after the first segment.",
    setup: "On your bed or floor. Lights dim if possible.",
    segments: [
      { name: "Standing forward fold", cue: "Last standing thing. Hang for a full minute.", holdSeconds: 60 },
      { name: "Lying knees to chest", cue: "Pull both knees in. Soft jaw.", holdSeconds: 60 },
      { name: "Reclined butterfly", cue: "On your back. Soles together, knees fall apart.", holdSeconds: 90 },
      { name: "Reclined twist (right)", cue: "Knees over to the right. Look left.", holdSeconds: 60 },
      { name: "Reclined twist (left)", cue: "Switch.", holdSeconds: 60 },
      { name: "Legs up the wall", cue: "Hips at the wall. Legs straight up. Free rest.", holdSeconds: 120 },
      { name: "Final stillness", cue: "Lie flat. Let the body soften. Two minutes.", holdSeconds: 120 }
    ]
  },
  {
    id: "tight-hips-15",
    name: "Tight hips",
    category: "tightness",
    totalMinutes: 15,
    description: "Slow, intentional hip openers. Most teens (especially after long sitting) carry tightness here.",
    setup: "Mat or carpet.",
    segments: [
      { name: "Cat / cow", cue: "Wake the spine up. Match breath.", holdSeconds: 60 },
      { name: "Low lunge (right)", cue: "Right foot forward, back knee down. Sink the hips gently.", holdSeconds: 60 },
      { name: "Half-split (right)", cue: "From low lunge, straighten the front leg. Flex the foot.", holdSeconds: 45 },
      { name: "Lizard (right)", cue: "From low lunge, drop both forearms inside the front foot. Or stay on hands.", holdSeconds: 60 },
      { name: "Pigeon (right)", cue: "Bring the front shin forward. Sink hips. Two long breaths.", holdSeconds: 60 },
      { name: "Repeat left side", cue: "Same sequence: low lunge → half-split → lizard → pigeon.", holdSeconds: 225 },
      { name: "Happy baby", cue: "On your back. Grab outsides of feet. Rock side to side.", holdSeconds: 60 },
      { name: "Reclined figure-4 (right)", cue: "Ankle on opposite knee. Pull the standing leg in.", holdSeconds: 45 },
      { name: "Reclined figure-4 (left)", cue: "Switch.", holdSeconds: 45 },
      { name: "Final rest", cue: "Lie flat. Let it settle.", holdSeconds: 90 }
    ]
  },
  {
    id: "hamstring-opener-8",
    name: "Hamstring opener",
    category: "tightness",
    totalMinutes: 8,
    description: "Slow lengthening. Useful before sport, before bed, or after a day of sitting.",
    setup: "Mat. Optional strap or belt for the lying versions.",
    segments: [
      { name: "Standing forward fold", cue: "Knees soft. Let the hamstrings open. Don't bounce.", holdSeconds: 60 },
      { name: "Seated forward fold", cue: "Legs straight ahead. Round forward. Reach where you reach.", holdSeconds: 60 },
      { name: "Lying hamstring (right)", cue: "On back. Right leg up. Strap or hand behind thigh. Knee can bend a little.", holdSeconds: 60 },
      { name: "Lying hamstring (left)", cue: "Switch sides.", holdSeconds: 60 },
      { name: "Wide-legged forward fold", cue: "Stand, feet wide. Hinge forward. Hands or forearms down.", holdSeconds: 60 },
      { name: "Half-split (right)", cue: "Kneel, extend the right leg straight. Hinge over it.", holdSeconds: 45 },
      { name: "Half-split (left)", cue: "Switch.", holdSeconds: 45 },
      { name: "Recover and breathe", cue: "Lie on your back. Knees up. Three slow breaths.", holdSeconds: 50 }
    ]
  },
  {
    id: "wrist-forearm-5",
    name: "Wrist and forearm reset",
    category: "desk",
    totalMinutes: 5,
    description: "For phone hands, writing hands, controller hands.",
    setup: "Anywhere. Sit or stand.",
    segments: [
      { name: "Wrist circles", cue: "10 each direction. Slow.", holdSeconds: 30 },
      { name: "Prayer hands lift", cue: "Palms together at chest. Lift elbows. Feel the forearm stretch.", holdSeconds: 30 },
      { name: "Reverse prayer behind back", cue: "Or just hands clasped behind your back. Open the chest.", holdSeconds: 30 },
      { name: "Wrist extension stretch (right)", cue: "Right arm out, palm up, gently pull fingers back.", holdSeconds: 30 },
      { name: "Wrist extension stretch (left)", cue: "Switch sides.", holdSeconds: 30 },
      { name: "Wrist flexion stretch (right)", cue: "Right arm out, palm down, gently pull fingers down and back.", holdSeconds: 30 },
      { name: "Wrist flexion stretch (left)", cue: "Switch sides.", holdSeconds: 30 },
      { name: "Shake it out", cue: "Drop your arms. Shake the hands loose. Tiny micro-tremors.", holdSeconds: 30 },
      { name: "Open and close (5x)", cue: "Make a fist, spread fingers wide. Five rounds.", holdSeconds: 30 }
    ]
  }
];

export const STRETCH_CATEGORY_LABEL: Record<StretchCategory, string> = {
  morning: "Morning",
  desk: "Desk",
  post_sport: "Post sport",
  wind_down: "Wind down",
  tightness: "Tightness"
};
