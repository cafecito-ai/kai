import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../lib/api";
import type { ProgressEvent } from "../lib/types";
import { useProgressStore } from "./progressStore";

describe("useProgressStore.addEvent — server id reconciliation", () => {
  beforeEach(() => {
    useProgressStore.setState({ events: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("appends an optimistic row immediately, then swaps in the server row when api.logProgress resolves", async () => {
    const serverEvent: ProgressEvent = {
      id: "server-id-123",
      occurredAt: "2026-05-26T05:00:00.000Z",
      engine: "physical",
      eventType: "meal_logged",
      eventValue: 24
    };
    const logSpy = vi.spyOn(api, "logProgress").mockResolvedValue({ event: serverEvent });

    useProgressStore.getState().addEvent({
      engine: "physical",
      eventType: "meal_logged",
      eventValue: 24
    });

    // Synchronous: a single optimistic row with a local UUID.
    const afterAdd = useProgressStore.getState().events;
    expect(afterAdd).toHaveLength(1);
    expect(afterAdd[0].engine).toBe("physical");
    expect(afterAdd[0].eventType).toBe("meal_logged");
    expect(afterAdd[0].id).not.toBe("server-id-123");

    // After the API resolves, the same row exists but with the
    // server's authoritative id + occurredAt.
    await vi.waitFor(() => {
      const events = useProgressStore.getState().events;
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe("server-id-123");
      expect(events[0].occurredAt).toBe("2026-05-26T05:00:00.000Z");
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it("leaves the optimistic row in place if the API call fails", async () => {
    vi.spyOn(api, "logProgress").mockRejectedValue(new Error("network down"));

    useProgressStore.getState().addEvent({
      engine: "mental",
      eventType: "feelings_check_in",
      eventValue: 18
    });

    const afterAdd = useProgressStore.getState().events;
    expect(afterAdd).toHaveLength(1);
    const localId = afterAdd[0].id;

    // Wait a tick so the rejection is observed without blowing up.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const afterFail = useProgressStore.getState().events;
    expect(afterFail).toHaveLength(1);
    expect(afterFail[0].id).toBe(localId); // not swapped
    expect(afterFail[0].engine).toBe("mental");
  });

  it("doesn't drop or duplicate when two addEvent calls land back-to-back", async () => {
    let counter = 0;
    vi.spyOn(api, "logProgress").mockImplementation(async (event) => ({
      event: {
        ...event,
        id: `server-${++counter}`,
        occurredAt: `2026-05-26T05:00:0${counter}.000Z`
      }
    }));

    useProgressStore.getState().addEvent({ engine: "physical", eventType: "a", eventValue: 1 });
    useProgressStore.getState().addEvent({ engine: "physical", eventType: "b", eventValue: 2 });

    await vi.waitFor(() => {
      const events = useProgressStore.getState().events;
      expect(events).toHaveLength(2);
      const ids = events.map((row) => row.id);
      expect(ids).toContain("server-1");
      expect(ids).toContain("server-2");
    });
  });
});
