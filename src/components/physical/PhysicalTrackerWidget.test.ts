import { describe, expect, it } from "vitest";
import { TRACKER_SESSIONS } from "../../lib/tracker-sessions";
import { findLastMoveSession } from "./PhysicalTrackerWidget";

/**
 * Tests for the "continue last" hero on the Move card.
 */

describe("findLastMoveSession", () => {
  const knownSessionId = TRACKER_SESSIONS[0].id;

  it("returns null when there are no Move events at all", () => {
    expect(findLastMoveSession([])).toBeNull();
    expect(
      findLastMoveSession([
        { engine: "physical", eventType: "meal_logged", occurredAt: "2026-05-26T00:00:00Z" }
      ])
    ).toBeNull();
  });

  it("returns the matching session for the most recent Move event", () => {
    const result = findLastMoveSession([
      { engine: "physical", eventType: "workout", occurredAt: "2026-05-26T00:00:00Z", payload: { sessionId: knownSessionId } }
    ]);
    expect(result?.id).toBe(knownSessionId);
  });

  it("scans events newest-last and picks the most recent Move event (assumes chronological append)", () => {
    const result = findLastMoveSession([
      { engine: "physical", eventType: "workout", occurredAt: "2026-05-24T00:00:00Z", payload: { sessionId: "old-id" } },
      { engine: "physical", eventType: "meal_logged", occurredAt: "2026-05-25T00:00:00Z" },
      { engine: "physical", eventType: "workout_partial", occurredAt: "2026-05-26T00:00:00Z", payload: { sessionId: knownSessionId } }
    ]);
    expect(result?.id).toBe(knownSessionId);
  });

  it("skips events from other engines", () => {
    const result = findLastMoveSession([
      { engine: "mental", eventType: "workout", occurredAt: "2026-05-26T00:00:00Z", payload: { sessionId: knownSessionId } }
    ]);
    expect(result).toBeNull();
  });

  it("skips events with no sessionId in payload", () => {
    const result = findLastMoveSession([
      { engine: "physical", eventType: "workout", occurredAt: "2026-05-26T00:00:00Z", payload: { other: "thing" } }
    ]);
    expect(result).toBeNull();
  });

  it("returns null if the sessionId references a session that's no longer in the catalog", () => {
    const result = findLastMoveSession([
      { engine: "physical", eventType: "workout", occurredAt: "2026-05-26T00:00:00Z", payload: { sessionId: "deleted-session-id" } }
    ]);
    expect(result).toBeNull();
  });

  it("recognizes both 'workout' and 'workout_partial' event types", () => {
    const partial = findLastMoveSession([
      { engine: "physical", eventType: "workout_partial", occurredAt: "2026-05-26T00:00:00Z", payload: { sessionId: knownSessionId } }
    ]);
    expect(partial?.id).toBe(knownSessionId);
  });
});
