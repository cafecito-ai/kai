import { afterEach, describe, expect, it, vi } from "vitest";

import { setIdentityStatement, setOriginStory } from "./local-identity";
import { buildKaiClientContext } from "./kai-client-context";
import { setNorthStar } from "./local-northstar";

describe("kai client context — identity", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("includes goal name, identity statement, and origin story", () => {
    setNorthStar("180 lb Boxer", "custom");
    setIdentityStatement("Someone who keeps his word");
    setOriginStory("I'm tired of wasting my potential");

    const ctx = buildKaiClientContext(new Date("2026-06-19T12:00:00"));

    expect(ctx.identity?.goalName).toBe("180 lb Boxer");
    expect(ctx.identity?.statement).toBe("Someone who keeps his word");
    expect(ctx.identity?.originStory).toBe("I'm tired of wasting my potential");
    expect(ctx.identity?.daysBuilding).toBeGreaterThanOrEqual(1);
  });

  it("leaves identity fields null when nothing has been set", () => {
    const ctx = buildKaiClientContext(new Date("2026-06-19T12:00:00"));
    expect(ctx.identity?.goalName).toBeNull();
    expect(ctx.identity?.statement).toBeNull();
    expect(ctx.identity?.originStory).toBeNull();
  });
});
