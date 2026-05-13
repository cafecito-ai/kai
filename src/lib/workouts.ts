/**
 * Teen-appropriate workout library. Designed against spec Section 6
 * Physical engine rules:
 *
 *   - Movement they enjoy, not punishment-based exercise.
 *   - No weight-loss framing. No calorie targeting. No "burn".
 *   - No "no pain no gain". Pain language is replaced with "ease off".
 *   - Bodyweight + everyday objects only. No equipment assumptions.
 *   - Mobility / sport / stress / strength foundations balanced.
 *
 * Every exercise has a teen-current cue line. The point is the practice,
 * not the optics.
 */

export type ExerciseSegment = {
  name: string;
  /** A short cue in the teen's voice: how to do it, what should feel like. */
  cue: string;
  /** EITHER timed OR rep-based; never both. */
  durationSeconds?: number;
  reps?: number;
  /** Optional rest after this segment in seconds. */
  restSeconds?: number;
};

export type WorkoutCategory = "warmup" | "mobility" | "strength" | "conditioning" | "reset";

export type Workout = {
  id: string;
  name: string;
  category: WorkoutCategory;
  totalMinutes: number;
  /** One-sentence description of who this is for / when to do it. */
  description: string;
  /** Equipment-readiness hint: "anywhere" / "needs floor space" / "needs stairs" / etc. */
  setup: string;
  exercises: ReadonlyArray<ExerciseSegment>;
};

/**
 * Total accumulated time, in seconds, including rests.
 */
export function workoutDurationSeconds(workout: Workout): number {
  return workout.exercises.reduce((sum, ex) => sum + (ex.durationSeconds ?? 30) + (ex.restSeconds ?? 0), 0);
}

export const WORKOUTS: ReadonlyArray<Workout> = [
  {
    id: "wakeup-5",
    name: "Wake-up 5",
    category: "warmup",
    totalMinutes: 5,
    description: "Light five-minute reset for the first thing in the morning. Eyes still half-closed is fine.",
    setup: "Anywhere with floor space. No shoes needed.",
    exercises: [
      { name: "Slow neck rolls", cue: "Five slow circles each way. Stop if anything pinches.", durationSeconds: 40 },
      { name: "Shoulder rolls", cue: "Big lazy circles. Loosen, don't strain.", durationSeconds: 40 },
      { name: "Standing forward fold", cue: "Bend at the hips. Knees soft. Hang the head.", durationSeconds: 45 },
      { name: "Cat / cow", cue: "On hands and knees. Round up, dip down. Match your breath.", durationSeconds: 60 },
      { name: "Tall stand and breathe", cue: "Feet planted. Three slow inhales, longer exhales.", durationSeconds: 45 },
      { name: "Walk in place", cue: "Lift the knees gently. Don't grind.", durationSeconds: 60 }
    ]
  },
  {
    id: "pre-game-10",
    name: "Pre-game warmup",
    category: "warmup",
    totalMinutes: 10,
    description: "Dynamic warmup before sport, practice, or anything you'll sprint in.",
    setup: "Open space, 10 ft. Athletic shoes if you have them.",
    exercises: [
      { name: "Easy jog in place", cue: "Just get the blood moving. Two full minutes.", durationSeconds: 120 },
      { name: "Leg swings", cue: "Hold a wall. 10 each leg, front-back, then side-side.", reps: 10 },
      { name: "Walking lunges", cue: "Step, drop the back knee toward the floor, stand up. Slow.", reps: 12 },
      { name: "High knees", cue: "Quick taps, not crashes. Land soft.", durationSeconds: 30, restSeconds: 15 },
      { name: "Butt kicks", cue: "Heels toward your seat. Stay light.", durationSeconds: 30, restSeconds: 15 },
      { name: "A-skips", cue: "Drive one knee up while the opposite arm swings forward. Rhythm > height.", durationSeconds: 30, restSeconds: 15 },
      { name: "Hip circles", cue: "Hands on hips. 10 circles each direction.", reps: 10 },
      { name: "Two short accelerations", cue: "Build to 70 percent over 15-20 yards. Then walk back.", reps: 2 }
    ]
  },
  {
    id: "bedroom-mobility-15",
    name: "Bedroom mobility",
    category: "mobility",
    totalMinutes: 15,
    description: "Quiet floor work for tight days. No jumping, no thuds.",
    setup: "Floor space the size of a yoga mat. Late-night friendly.",
    exercises: [
      { name: "Child's pose", cue: "Knees wide, big toes touch. Arms forward. Breathe into your back.", durationSeconds: 90 },
      { name: "Thread the needle (each side)", cue: "On all fours. Thread your right arm under your left. Hold and breathe. Switch.", durationSeconds: 60 },
      { name: "Pigeon pose (each side)", cue: "Shin forward, back leg long. Sink the hips. Don't force.", durationSeconds: 60 },
      { name: "Seated forward fold", cue: "Legs out. Reach toward your shins or feet. Soft jaw.", durationSeconds: 60 },
      { name: "Supine spinal twist (each side)", cue: "On your back. Drop your knees one way, look the other. Two long breaths.", durationSeconds: 60 },
      { name: "Happy baby", cue: "On your back. Grab the outsides of your feet. Rock side to side.", durationSeconds: 45 },
      { name: "Legs up the wall", cue: "Hips close to the wall, legs straight up. Pure rest.", durationSeconds: 180 },
      { name: "Savasana", cue: "Flat on your back. Palms up. Let everything go for two minutes.", durationSeconds: 120 }
    ]
  },
  {
    id: "full-body-20",
    name: "Full-body bodyweight 20",
    category: "strength",
    totalMinutes: 20,
    description: "A real session. Builds general strength without any equipment. Ease off any move that doesn't feel right today.",
    setup: "Floor space. Optional: backpack to load for pushups.",
    exercises: [
      { name: "Squat", cue: "Feet hip-width. Sit back. Knees track over toes. Stand tall.", reps: 12, restSeconds: 20 },
      { name: "Pushup (or knee pushup)", cue: "Body straight. Lower with control. Knee version is the real version when you need it.", reps: 10, restSeconds: 20 },
      { name: "Reverse lunge (each side)", cue: "Step back, drop, stand up. Slow over fast.", reps: 8, restSeconds: 20 },
      { name: "Glute bridge", cue: "On your back. Push through your heels. Squeeze at the top.", reps: 15, restSeconds: 20 },
      { name: "Bird dog (each side)", cue: "On all fours. Opposite arm and leg out. Hold three seconds.", reps: 10, restSeconds: 20 },
      { name: "Plank", cue: "Forearms down. Body straight. Stop when form goes — not when it burns.", durationSeconds: 30, restSeconds: 30 },
      { name: "Squat (round 2)", cue: "Same as before. Same speed.", reps: 12, restSeconds: 20 },
      { name: "Pushup (round 2)", cue: "Same target. Drop to knees if needed.", reps: 10, restSeconds: 20 },
      { name: "Mountain climbers", cue: "Plank position. Drive knees toward chest. Easy pace.", durationSeconds: 30, restSeconds: 30 },
      { name: "Cool down stretch", cue: "Forward fold, then shake out arms and legs.", durationSeconds: 60 }
    ]
  },
  {
    id: "stress-walk-10",
    name: "Quick stress walk",
    category: "reset",
    totalMinutes: 10,
    description: "Walking is exercise. This is a guided structure so the walk doesn't turn into doomscrolling.",
    setup: "Outside if you can. Around the block, or up and down a hallway. Phone away.",
    exercises: [
      { name: "First 2 minutes: noticing", cue: "Walk. Notice 5 things you see, 4 you hear, 3 you feel on your skin.", durationSeconds: 120 },
      { name: "Next 3 minutes: pick up the pace", cue: "Walk faster than you normally would. Not running. Big strides.", durationSeconds: 180 },
      { name: "Next 3 minutes: free thought", cue: "Let your mind go wherever. No agenda.", durationSeconds: 180 },
      { name: "Last 2 minutes: slow finish", cue: "Pace back down. Three deep breaths. Notice your body now vs before.", durationSeconds: 120 }
    ]
  },
  {
    id: "post-school-8",
    name: "Post-school reset",
    category: "reset",
    totalMinutes: 8,
    description: "For when you're home and your body still feels like it's in a chair.",
    setup: "Backpack off. Any open space.",
    exercises: [
      { name: "Doorframe stretch", cue: "Stand in a doorway. Hands on the frame at shoulder height. Lean forward. Open the chest.", durationSeconds: 45 },
      { name: "Cat / cow", cue: "Hands and knees. Round and dip with your breath.", durationSeconds: 60 },
      { name: "Hip flexor (each side)", cue: "Half-kneel. Tuck your back hip under. Don't push past easy.", durationSeconds: 45 },
      { name: "Shoulder thread", cue: "Both arms behind your back, hands clasped. Squeeze shoulder blades together.", durationSeconds: 45 },
      { name: "Bouncing on your toes", cue: "Tiny bounces. Wake the calves and ankles up.", durationSeconds: 30 },
      { name: "Three deep breaths", cue: "Inhale 4. Exhale 6. Three rounds. Done.", durationSeconds: 60 }
    ]
  },
  {
    id: "floor-flow-15",
    name: "Floor flow",
    category: "mobility",
    totalMinutes: 15,
    description: "Slow yoga-style sequence. Builds joint range without intensity.",
    setup: "Floor mat or carpet. Loose clothes.",
    exercises: [
      { name: "Diaphragmatic breathing", cue: "Lie on your back. Hand on belly. 8 slow rises and falls.", durationSeconds: 90 },
      { name: "Knees to chest", cue: "Pull both knees in. Rock side to side.", durationSeconds: 45 },
      { name: "Half pigeon (each side)", cue: "Front shin parallel to the front of the mat. Sink hips.", durationSeconds: 60 },
      { name: "Down dog", cue: "Hands and feet down, hips up. Pedal the heels.", durationSeconds: 60 },
      { name: "Low lunge (each side)", cue: "One foot forward, back knee on the floor. Hands on the front knee or up overhead.", durationSeconds: 60 },
      { name: "Wide-legged forward fold", cue: "Stand, feet wide, hinge at the hips. Hang.", durationSeconds: 60 },
      { name: "Seated twist (each side)", cue: "Cross one leg over. Twist toward the bent knee. Two long breaths.", durationSeconds: 45 },
      { name: "Final rest", cue: "Lie flat. Three minutes. Don't skip.", durationSeconds: 180 }
    ]
  },
  {
    id: "stair-conditioning-12",
    name: "Stair conditioning",
    category: "conditioning",
    totalMinutes: 12,
    description: "A real cardio session if you've got a flight of stairs.",
    setup: "A staircase you can walk up and down 6-8 times without disturbing anyone.",
    exercises: [
      { name: "Two slow flights up", cue: "Walking pace. Don't grip the rail.", durationSeconds: 60, restSeconds: 30 },
      { name: "Round 1: walk-up", cue: "Steady walk up, slow walk back down. Three rounds.", durationSeconds: 90, restSeconds: 45 },
      { name: "Round 2: every-other step", cue: "Take two stairs per step up. Slow back down.", durationSeconds: 90, restSeconds: 60 },
      { name: "Round 3: quick steps", cue: "One step at a time, quicker. Land soft.", durationSeconds: 60, restSeconds: 60 },
      { name: "Walk it off", cue: "Walk a flat hallway or pace. Bring the breath back down.", durationSeconds: 120 }
    ]
  }
];

export const WORKOUT_CATEGORY_LABEL: Record<WorkoutCategory, string> = {
  warmup: "Warm up",
  mobility: "Mobility",
  strength: "Strength",
  conditioning: "Conditioning",
  reset: "Reset"
};
