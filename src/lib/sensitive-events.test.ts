import { describe, expect, it } from "vitest";
import {
  SENSITIVE_EVENT_TYPES,
  scrubPayload,
  scrubProgressEvent
} from "./sensitive-events";

describe("SENSITIVE_EVENT_TYPES", () => {
  it("includes the sensitive primer categories", () => {
    expect(SENSITIVE_EVENT_TYPES.has("substances_primer_read")).toBe(true);
    expect(SENSITIVE_EVENT_TYPES.has("trauma_primer_read")).toBe(true);
    expect(SENSITIVE_EVENT_TYPES.has("sex_ed_primer_read")).toBe(true);
    expect(SENSITIVE_EVENT_TYPES.has("body_image_primer_read")).toBe(true);
    expect(SENSITIVE_EVENT_TYPES.has("online_safety_primer_read")).toBe(true);
    expect(SENSITIVE_EVENT_TYPES.has("grief_primer_read")).toBe(true);
    expect(SENSITIVE_EVENT_TYPES.has("mood_logged")).toBe(true);
  });

  it("does NOT include benign event types", () => {
    expect(SENSITIVE_EVENT_TYPES.has("workout")).toBe(false);
    expect(SENSITIVE_EVENT_TYPES.has("meal_logged")).toBe(false);
    expect(SENSITIVE_EVENT_TYPES.has("breathing_session")).toBe(false);
  });
});

describe("scrubPayload", () => {
  it("strips article identifiers from sensitive events", () => {
    const result = scrubPayload("substances_primer_read", {
      articleId: "sextortion-reality",
      engine: "physical"
    });
    expect(result).toEqual({ engine: "physical" });
  });

  it("strips when no engine field is present", () => {
    const result = scrubPayload("trauma_primer_read", {
      articleId: "complex-trauma-patterns"
    });
    expect(result).toEqual({});
  });

  it("preserves payload for non-sensitive events", () => {
    const payload = { articleId: "workout-strength", engine: "physical", duration: 30 };
    const result = scrubPayload("workout", payload);
    expect(result).toEqual(payload);
  });

  it("returns undefined when payload is undefined", () => {
    expect(scrubPayload("trauma_primer_read", undefined)).toBeUndefined();
  });

  it("never returns the same object reference for a sensitive event (no mutation risk)", () => {
    const payload = { articleId: "x", engine: "physical" };
    const result = scrubPayload("sex_ed_primer_read", payload);
    expect(result).not.toBe(payload);
    expect(payload.articleId).toBe("x"); // original untouched
  });
});

describe("scrubProgressEvent", () => {
  it("scrubs the payload of a sensitive event", () => {
    const event = {
      engine: "physical",
      eventType: "online_safety_primer_read",
      eventValue: 6,
      payload: { articleId: "sextortion-reality" }
    };
    const result = scrubProgressEvent(event);
    expect(result.payload).toEqual({});
    expect(result.eventType).toBe("online_safety_primer_read");
    expect(result.eventValue).toBe(6);
  });

  it("leaves non-sensitive events fully intact", () => {
    const event = {
      engine: "physical",
      eventType: "workout",
      eventValue: 30,
      payload: { type: "sport", duration: 35 }
    };
    const result = scrubProgressEvent(event);
    expect(result.payload).toEqual({ type: "sport", duration: 35 });
  });
});
