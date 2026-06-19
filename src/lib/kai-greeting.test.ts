import { afterEach, describe, expect, it } from "vitest";

import { pickKaiGreeting } from "./kai-greeting";
import { setIdentityStatement } from "./local-identity";
import { setNorthStar } from "./local-northstar";

// A morning time with no logged inputs falls through to the generic
// fallback — exactly the path the spec wants replaced with identity.
const MORNING = new Date("2026-06-19T09:00:00");

describe("kai greeting — identity-led fallback", () => {
  afterEach(() => localStorage.clear());

  it("never returns a bare time-of-day greeting when a goal exists", () => {
    setNorthStar("180 lb Boxer", "custom");
    const g = pickKaiGreeting("Lev", MORNING);
    expect(g.line).not.toMatch(/good morning/i);
    expect(g.line).not.toMatch(/^morning/i);
    // Identity-led line should reference who they're becoming.
    expect(g.line).toMatch(/180 lb Boxer/);
  });

  it("leads with the identity statement when there's no goal name", () => {
    setIdentityStatement("Someone who keeps his word");
    const g = pickKaiGreeting("Lev", MORNING);
    expect(g.line).not.toMatch(/^morning/i);
    expect(g.line).toMatch(/keeps his word/);
  });

  it("still uses the generic greeting when no identity is set", () => {
    const g = pickKaiGreeting("Lev", MORNING);
    // One of the morning fallback variants (they vary: "Morning…" / "new day…").
    expect(g.line).toMatch(/morning|new day/i);
  });
});
