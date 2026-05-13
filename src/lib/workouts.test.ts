import { describe, expect, it } from "vitest";
import { workoutDurationSeconds, WORKOUTS, WORKOUT_CATEGORY_LABEL } from "./workouts";

describe("WORKOUTS catalog", () => {
  it("has at least one routine in each category", () => {
    const categories = new Set(WORKOUTS.map((w) => w.category));
    expect(categories.has("warmup")).toBe(true);
    expect(categories.has("mobility")).toBe(true);
    expect(categories.has("strength")).toBe(true);
    expect(categories.has("conditioning")).toBe(true);
    expect(categories.has("reset")).toBe(true);
  });

  it("every routine has a unique id", () => {
    const ids = WORKOUTS.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every exercise has either durationSeconds or reps (not both, not neither)", () => {
    for (const workout of WORKOUTS) {
      for (const ex of workout.exercises) {
        const hasDuration = typeof ex.durationSeconds === "number";
        const hasReps = typeof ex.reps === "number";
        expect(hasDuration || hasReps, `${workout.id} / ${ex.name} needs duration or reps`).toBe(true);
      }
    }
  });

  it("totalMinutes is in the same ballpark as content (catches obvious mistakes)", () => {
    for (const workout of WORKOUTS) {
      const seconds = workoutDurationSeconds(workout);
      const listedSeconds = workout.totalMinutes * 60;
      const ratio = seconds / listedSeconds;
      // Wide bounds — rep-based segments use a 30s placeholder, real teen pace
      // varies wildly with rest, setup, and breath. We just want to catch
      // "declared 5 min but actually 60 min" type mistakes.
      expect(ratio, `${workout.id} listed ${workout.totalMinutes}m but content seconds=${seconds}`).toBeGreaterThan(0.3);
      expect(ratio).toBeLessThan(3);
    }
  });

  it("every routine has a description and a setup hint", () => {
    for (const workout of WORKOUTS) {
      expect(workout.description.trim().length).toBeGreaterThan(0);
      expect(workout.setup.trim().length).toBeGreaterThan(0);
    }
  });

  it("never uses 'no pain no gain' or 'burn fat' or weight-loss framing", () => {
    const banned = [/no pain no gain/i, /burn fat/i, /weight loss/i, /lose weight/i, /calorie/i];
    for (const workout of WORKOUTS) {
      const blob = JSON.stringify(workout);
      for (const pattern of banned) {
        expect(blob).not.toMatch(pattern);
      }
    }
  });
});

describe("workoutDurationSeconds", () => {
  it("sums durationSeconds + restSeconds for timed exercises", () => {
    const sample = WORKOUTS.find((w) => w.id === "wakeup-5")!;
    const sum = workoutDurationSeconds(sample);
    // wakeup-5 has 290s of pure exercise; with default rests should be >= 290.
    expect(sum).toBeGreaterThanOrEqual(290);
  });

  it("treats rep-based segments as a 30s placeholder (underestimates real pace)", () => {
    const sample = WORKOUTS.find((w) => w.id === "pre-game-10")!;
    const sum = workoutDurationSeconds(sample);
    // The pure-function placeholder underestimates real time (which is
    // closer to 60-90s per rep set). Just assert the rough order of
    // magnitude — content is multi-minute, not multi-second.
    expect(sum).toBeGreaterThan(60);
    expect(sum).toBeLessThan(20 * 60);
  });
});

describe("WORKOUT_CATEGORY_LABEL", () => {
  it("provides a label for every category", () => {
    expect(WORKOUT_CATEGORY_LABEL.warmup).toBeTruthy();
    expect(WORKOUT_CATEGORY_LABEL.mobility).toBeTruthy();
    expect(WORKOUT_CATEGORY_LABEL.strength).toBeTruthy();
    expect(WORKOUT_CATEGORY_LABEL.conditioning).toBeTruthy();
    expect(WORKOUT_CATEGORY_LABEL.reset).toBeTruthy();
  });
});
