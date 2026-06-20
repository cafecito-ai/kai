import { afterEach, describe, expect, it } from "vitest";
import { appendLocalInput, clearLocalInputs, explainScore, readLocalInputs } from "./local-score";

afterEach(() => clearLocalInputs());

const today = new Date().toISOString().slice(0, 10);

describe("explainScore (Bucket 4 — score transparency)", () => {
  it("explains the composition: Mind 40 + Sleep 30 + Mood 30, nothing done yet", () => {
    clearLocalInputs();
    const e = explainScore([]);
    expect(e.final).toBe(0);
    expect(e.pointsLeft).toBe(100);
    expect(e.components.map((c) => [c.key, c.weight])).toEqual([
      ["mental", 40],
      ["sleep", 30],
      ["mood", 30],
    ]);
    // With nothing logged, each part lists how to raise it.
    const mind = e.components.find((c) => c.key === "mental")!;
    expect(mind.done).toEqual([]);
    expect(mind.todos.map((t) => t.label)).toContain("Check in");
    // The remaining-points math is exact, not a guess.
    expect(e.pointsLeft).toBe(100 - e.final);
  });

  it("moves a completed log from 'remaining' to 'done' and raises the score", () => {
    clearLocalInputs();
    appendLocalInput({ date: today, source: "check_in", value: { mood: 4 } });
    const e = explainScore(readLocalInputs());
    const mind = e.components.find((c) => c.key === "mental")!;
    expect(mind.done).toContain("Check in");
    expect(mind.todos.map((t) => t.label)).not.toContain("Check in");
    expect(e.final).toBeGreaterThan(0);
    // Sleep is untouched, so it still points at logging sleep.
    const sleep = e.components.find((c) => c.key === "sleep")!;
    expect(sleep.todos.map((t) => t.label)).toContain("Log last night's sleep");
  });
});
