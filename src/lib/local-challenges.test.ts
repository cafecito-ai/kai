// Rawz/6 — challenges tests.

import { beforeEach, describe, expect, it } from "vitest";
import {
  CHALLENGE_CATALOG,
  challengeSummary,
  getActiveChallenges,
  getChallengeListings,
  joinChallenge,
  leaveChallenge,
} from "./local-challenges";
import { appendLocalInput } from "./local-score";

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => { memory.set(k, v); },
    removeItem: (k: string) => { memory.delete(k); },
    clear: () => memory.clear(),
    key: (i: number) => Array.from(memory.keys())[i] ?? null,
    get length() { return memory.size; },
  } as unknown as Storage;
});

describe("CHALLENGE_CATALOG", () => {
  it("has at least 5 challenges", () => {
    expect(CHALLENGE_CATALOG.length).toBeGreaterThanOrEqual(5);
  });

  it("every challenge has targetDays ≤ durationDays", () => {
    for (const c of CHALLENGE_CATALOG) {
      expect(c.targetDays).toBeLessThanOrEqual(c.durationDays);
    }
  });

  it("no challenge uses shame / pressure language in blurbs", () => {
    const FORBIDDEN = ["lazy", "no excuse", "you should", "must", "behind"];
    for (const c of CHALLENGE_CATALOG) {
      const blob = `${c.title} ${c.blurb}`.toLowerCase();
      for (const w of FORBIDDEN) {
        expect(blob.includes(w), `challenge ${c.id} uses "${w}"`).toBe(false);
      }
    }
  });
});

describe("join / leave", () => {
  it("joinChallenge adds to active list", () => {
    joinChallenge("morning-7");
    const listings = getChallengeListings();
    const m = listings.find((l) => l.challenge.id === "morning-7");
    expect(m?.state).toBe("active");
  });

  it("leaveChallenge removes from active list (silent)", () => {
    joinChallenge("morning-7");
    leaveChallenge("morning-7");
    const listings = getChallengeListings();
    const m = listings.find((l) => l.challenge.id === "morning-7");
    expect(m?.state).toBe("available");
  });

  it("joinChallenge is idempotent", () => {
    joinChallenge("morning-7");
    joinChallenge("morning-7");
    expect(challengeSummary().active).toBe(1);
  });

  it("unknown challenge id is silently ignored", () => {
    joinChallenge("does-not-exist");
    expect(challengeSummary().active).toBe(0);
  });
});

describe("progress computation", () => {
  it("0 inputs = 0 days hit", () => {
    joinChallenge("morning-7");
    const active = getActiveChallenges();
    expect(active[0].daysHit).toBe(0);
    expect(active[0].completed).toBe(false);
  });

  it("logging a check-in counts toward morning-7", () => {
    joinChallenge("morning-7");
    const today = new Date().toISOString().slice(0, 10);
    appendLocalInput({ date: today, source: "check_in", value: { mood: 4 } });
    const active = getActiveChallenges();
    expect(active[0].daysHit).toBe(1);
  });

  it("two check-ins on the SAME day still count as 1 day hit", () => {
    joinChallenge("morning-7");
    const today = new Date().toISOString().slice(0, 10);
    appendLocalInput({ date: today, source: "check_in", value: { mood: 4 } });
    appendLocalInput({ date: today, source: "check_in", value: { mood: 5 } });
    const active = getActiveChallenges();
    expect(active[0].daysHit).toBe(1);
  });

  it("metric='any' counts any input source", () => {
    joinChallenge("show-up-30");
    const today = new Date().toISOString().slice(0, 10);
    appendLocalInput({ date: today, source: "workout", value: {} });
    const active = getActiveChallenges();
    const showUp = active.find((a) => a.challenge.id === "show-up-30");
    expect(showUp?.daysHit).toBe(1);
  });

  it("completes when daysHit >= targetDays", () => {
    // Backdate the join so the input dates fall AFTER the join timestamp.
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    localStorage.setItem(
      "kai_challenges_v1",
      JSON.stringify({
        active: [{ challengeId: "morning-7", joinedAt: sevenDaysAgo.toISOString() }],
        completed: [],
      }),
    );
    // Log a check-in on each of the past 7 days
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      appendLocalInput({
        date: d.toISOString().slice(0, 10),
        source: "check_in",
        value: { mood: 4 },
      });
    }
    const active = getActiveChallenges();
    expect(active[0].completed).toBe(true);
  });
});

describe("challengeSummary", () => {
  it("starts at 0/0", () => {
    expect(challengeSummary()).toEqual({ active: 0, completed: 0 });
  });

  it("counts active", () => {
    joinChallenge("morning-7");
    joinChallenge("sleep-week");
    expect(challengeSummary().active).toBe(2);
  });
});
