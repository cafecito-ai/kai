import { describe, expect, it } from "vitest";
import {
  currentCue,
  formatClock,
  trackerEventValue,
  TRACKER_SESSIONS,
  type TrackerSession
} from "./tracker-sessions";

const sample: TrackerSession = {
  id: "test",
  title: "Test",
  summary: "for tests",
  durationSeconds: 300,
  cues: [
    { atSeconds: 0, text: "first" },
    { atSeconds: 60, text: "second" },
    { atSeconds: 180, text: "third" }
  ]
};

describe("TRACKER_SESSIONS", () => {
  it("has at least three sessions wired", () => {
    expect(TRACKER_SESSIONS.length).toBeGreaterThanOrEqual(3);
  });

  it("every session has unique id, positive duration, and at least three cues", () => {
    const ids = new Set<string>();
    for (const session of TRACKER_SESSIONS) {
      expect(session.id).toBeTruthy();
      expect(ids.has(session.id)).toBe(false);
      ids.add(session.id);
      expect(session.durationSeconds).toBeGreaterThan(0);
      expect(session.cues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("every cue lands within its session's duration", () => {
    for (const session of TRACKER_SESSIONS) {
      for (const cue of session.cues) {
        expect(cue.atSeconds).toBeGreaterThanOrEqual(0);
        expect(cue.atSeconds).toBeLessThanOrEqual(session.durationSeconds);
      }
    }
  });
});

describe("currentCue", () => {
  it("returns the first cue at t=0", () => {
    expect(currentCue(sample, 0)?.text).toBe("first");
  });

  it("returns the latest cue whose atSeconds <= elapsed", () => {
    expect(currentCue(sample, 60)?.text).toBe("second");
    expect(currentCue(sample, 119)?.text).toBe("second");
    expect(currentCue(sample, 180)?.text).toBe("third");
    expect(currentCue(sample, 250)?.text).toBe("third");
  });

  it("returns null for a session with no cues", () => {
    expect(currentCue({ ...sample, cues: [] }, 30)).toBeNull();
  });
});

describe("trackerEventValue", () => {
  it("returns 0 for a zero-duration session (safety)", () => {
    expect(trackerEventValue(0, 0)).toBe(0);
  });

  it("returns the floor (8) for a session barely started", () => {
    expect(trackerEventValue(600, 0)).toBe(8);
  });

  it("returns the cap (30) for a fully-completed session", () => {
    expect(trackerEventValue(600, 600)).toBe(30);
  });

  it("scales linearly between floor and cap", () => {
    expect(trackerEventValue(600, 300)).toBe(19); // 8 + 0.5 * 22 = 19
  });

  it("does not exceed the cap when elapsed > duration", () => {
    expect(trackerEventValue(600, 800)).toBe(30);
  });
});

describe("formatClock", () => {
  it("zero-pads seconds", () => {
    expect(formatClock(65)).toBe("1:05");
  });

  it("renders minutes-only correctly", () => {
    expect(formatClock(180)).toBe("3:00");
  });

  it("clamps negatives to 0:00", () => {
    expect(formatClock(-30)).toBe("0:00");
  });
});
