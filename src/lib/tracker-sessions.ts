/**
 * Static data for the v1 Physical Tracker. Each session is a fixed
 * duration with a timed sequence of Kai cues that surface as
 * captions while the timer runs. No live computer-vision / form
 * correction in v1 — explicitly scoped out.
 *
 * Adding a session: pick a slug, a duration, and 4–10 cues. The
 * tracker widget treats them as ordered captions and surfaces the
 * one whose `atSeconds` is closest-without-exceeding the elapsed
 * time. Cues should be short (≤90 chars) and written in Kai's
 * voice (warm, plain, no preaching, no should).
 */

export interface TrackerCue {
  atSeconds: number;
  text: string;
}

export interface TrackerSession {
  id: string;
  title: string;
  summary: string;
  durationSeconds: number;
  cues: TrackerCue[];
}

export const TRACKER_SESSIONS: TrackerSession[] = [
  {
    id: "posture-reset",
    title: "5-min posture reset",
    summary: "Open the chest, drop the shoulders, breathe.",
    durationSeconds: 5 * 60,
    cues: [
      { atSeconds: 0, text: "Stand or sit tall. Feet planted. Take one slow breath." },
      { atSeconds: 30, text: "Roll the shoulders back and down. Three slow rolls." },
      { atSeconds: 75, text: "Hands behind your head, elbows wide. Open the chest. Hold." },
      { atSeconds: 135, text: "Drop the arms. Look gently side to side. Slow." },
      { atSeconds: 195, text: "Chin tuck — pull your head back like making a double chin. Hold five." },
      { atSeconds: 240, text: "Final breath. Notice if anything feels different." }
    ]
  },
  {
    id: "mobility-flow",
    title: "10-min mobility flow",
    summary: "Hips, spine, shoulders. Light and slow.",
    durationSeconds: 10 * 60,
    cues: [
      { atSeconds: 0, text: "Stand with feet hip-width. Big slow breath in, slow breath out." },
      { atSeconds: 30, text: "Hip circles — five each direction. Take your time." },
      { atSeconds: 120, text: "Cat-cow on hands and knees. Arch and round, ten rounds." },
      { atSeconds: 240, text: "Thread the needle — right arm under left, hold. Switch." },
      { atSeconds: 360, text: "Down-dog or fold — let the head hang. Three breaths." },
      { atSeconds: 450, text: "World's greatest stretch — lunge, hand to floor, twist. Each side." },
      { atSeconds: 540, text: "Stand. Shake out the legs. One last full breath." },
      { atSeconds: 585, text: "Done. Nice work." }
    ]
  },
  {
    id: "hip-opener",
    title: "7-min hip opener",
    summary: "For long sit days. No props.",
    durationSeconds: 7 * 60,
    cues: [
      { atSeconds: 0, text: "Sit on the floor. Cross-legged. Tall spine." },
      { atSeconds: 30, text: "Lean forward over the crossed legs. Hold one minute." },
      { atSeconds: 90, text: "Switch the cross. Lean again. Another minute." },
      { atSeconds: 150, text: "Butterfly — soles together, knees out. Forward fold." },
      { atSeconds: 240, text: "Lie back. Pigeon — right ankle on left knee, pull left thigh in." },
      { atSeconds: 330, text: "Switch sides. Same hold." },
      { atSeconds: 390, text: "Knees to chest. Hug. One slow breath." },
      { atSeconds: 405, text: "Done. Stand up slowly when you're ready." }
    ]
  },
  {
    id: "neck-unlock",
    title: "Quick neck unlock",
    summary: "3 minutes. Phone, desk, head-forward fix.",
    durationSeconds: 3 * 60,
    cues: [
      { atSeconds: 0, text: "Sit or stand tall. Roll the shoulders back once. Big breath." },
      { atSeconds: 20, text: "Ear toward right shoulder — slow. Hold." },
      { atSeconds: 50, text: "Center. Other side. Ear to left shoulder. Hold." },
      { atSeconds: 80, text: "Look up at the ceiling. Open the throat. Hold." },
      { atSeconds: 110, text: "Chin tuck — pull head straight back, double-chin style. Five slow ones." },
      { atSeconds: 150, text: "Slow shoulder rolls — three back, three forward." },
      { atSeconds: 175, text: "Done. Notice if the neck feels lighter." }
    ]
  },
  {
    id: "pre-sleep-wind-down",
    title: "Pre-sleep wind down",
    summary: "10 min. Settle the system before bed.",
    durationSeconds: 10 * 60,
    cues: [
      { atSeconds: 0, text: "Lights low. Sit or lie down. Phone face-down once this starts." },
      { atSeconds: 20, text: "Long exhale through the mouth. Then nose breath in. Slower than usual." },
      { atSeconds: 60, text: "Box breath — in 4, hold 4, out 4, hold 4. Five rounds." },
      { atSeconds: 180, text: "Shake out the hands and arms. Loose. Drop the jaw." },
      { atSeconds: 240, text: "Child's pose or knees-to-chest. Hold here a minute." },
      { atSeconds: 360, text: "Legs up the wall or flat on the bed. Two more minutes of slow breath." },
      { atSeconds: 510, text: "Notice where the body feels heavier. That's the system letting go." },
      { atSeconds: 570, text: "Done. Stay here as long as you want. Sleep when you're ready." }
    ]
  }
];

/**
 * Returns the cue currently active for an elapsed time. The cue
 * whose `atSeconds` is the greatest value ≤ elapsedSeconds. Returns
 * null if the session hasn't started or has no cues defined.
 */
export function currentCue(session: TrackerSession, elapsedSeconds: number): TrackerCue | null {
  if (!session.cues.length) return null;
  let active: TrackerCue | null = null;
  for (const cue of session.cues) {
    if (cue.atSeconds <= elapsedSeconds) active = cue;
    else break;
  }
  return active;
}

/**
 * Wellness-event point value for a completed (or partial) tracker
 * session. Linear by completion fraction with a 30-point cap so an
 * abandoned session still records something meaningful.
 */
export function trackerEventValue(durationSeconds: number, elapsedSeconds: number): number {
  if (durationSeconds <= 0) return 0;
  const fraction = Math.max(0, Math.min(1, elapsedSeconds / durationSeconds));
  return Math.round(8 + fraction * 22);
}

/** "mm:ss" formatter. Exported for the widget + tests. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
