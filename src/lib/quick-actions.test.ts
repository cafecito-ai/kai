import { describe, expect, it } from "vitest";
import { getQuickAction, QUICK_ACTIONS } from "./quick-actions";

describe("quick-actions", () => {
  it("defines the five Home quick actions in order", () => {
    expect(QUICK_ACTIONS.map((a) => a.topic)).toEqual([
      "sleep",
      "stress",
      "motivation",
      "workout",
      "energy",
    ]);
  });

  it("every action has a label, an understand-first opener, and causes", () => {
    for (const action of QUICK_ACTIONS) {
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.opener.length).toBeGreaterThan(0);
      expect(action.causes.length).toBeGreaterThan(0);
      // Opener understands first: it asks rather than only prescribing.
      expect(action.opener).toContain("?");
      for (const cause of action.causes) {
        expect(cause.label.length).toBeGreaterThan(0);
        // Cause messages are self-contained first-person sentences so the
        // fresh server conversation is coherent without the client opener.
        expect(cause.message.length).toBeGreaterThan(cause.label.length);
      }
    }
  });

  it("looks up an action by topic", () => {
    expect(getQuickAction("sleep")?.label).toBe("Can't Sleep");
    expect(getQuickAction("workout")?.topic).toBe("workout");
  });

  it("returns undefined for unknown or non-string topics", () => {
    expect(getQuickAction("nope")).toBeUndefined();
    expect(getQuickAction(undefined)).toBeUndefined();
    expect(getQuickAction(42)).toBeUndefined();
  });
});
