import { describe, expect, it } from "vitest";
import { classifySafety, shouldNotifyParent } from "../src/lib/safety";

describe("worker safety classifier", () => {
  it("flags crisis before chat", () => {
    expect(classifySafety("I might kill myself").safe).toBe(false);
  });

  it("flags risky food and body language", () => {
    const result = classifySafety("I hate my body and I am skipping meals");
    expect(result.safe).toBe(false);
    expect(result.category).toBe("eating_disorder");
  });
});

describe("shouldNotifyParent", () => {
  const baseParent = { parentEmail: "parent@example.com", lastNotifiedAt: null };

  it("notifies parent for critical suicide_ideation", () => {
    expect(shouldNotifyParent({ ...baseParent, severity: "critical", category: "suicide_ideation" })).toBe(true);
  });

  it("notifies parent for high self_harm (current classifier tiers it as high, spec treats it as critical)", () => {
    expect(shouldNotifyParent({ ...baseParent, severity: "high", category: "self_harm" })).toBe(true);
  });

  it("notifies parent for high abuse_disclosure", () => {
    expect(shouldNotifyParent({ ...baseParent, severity: "high", category: "abuse_disclosure" })).toBe(true);
  });

  it("does not notify parent for eating_disorder (separate resource path)", () => {
    expect(shouldNotifyParent({ ...baseParent, severity: "critical", category: "eating_disorder" })).toBe(false);
  });

  it("does not notify parent for violence_to_others (ops alert only)", () => {
    expect(shouldNotifyParent({ ...baseParent, severity: "critical", category: "violence_to_others" })).toBe(false);
  });

  it("does not notify when no parent email on file", () => {
    expect(shouldNotifyParent({ parentEmail: null, severity: "critical", category: "suicide_ideation", lastNotifiedAt: null })).toBe(false);
    expect(shouldNotifyParent({ parentEmail: "", severity: "critical", category: "suicide_ideation", lastNotifiedAt: null })).toBe(false);
  });

  it("does not notify for medium or low severity", () => {
    expect(shouldNotifyParent({ ...baseParent, severity: "medium", category: "self_harm" })).toBe(false);
    expect(shouldNotifyParent({ ...baseParent, severity: "low", category: "suicide_ideation" })).toBe(false);
  });

  it("suppresses re-notification within 24h cooldown for same category", () => {
    const now = new Date("2026-05-12T12:00:00Z");
    const recent = new Date("2026-05-11T13:00:00Z").toISOString(); // 23h ago
    expect(
      shouldNotifyParent({ ...baseParent, severity: "critical", category: "suicide_ideation", lastNotifiedAt: recent, now })
    ).toBe(false);
  });

  it("re-notifies after the 24h cooldown elapses", () => {
    const now = new Date("2026-05-12T12:00:00Z");
    const old = new Date("2026-05-11T11:00:00Z").toISOString(); // 25h ago
    expect(
      shouldNotifyParent({ ...baseParent, severity: "critical", category: "suicide_ideation", lastNotifiedAt: old, now })
    ).toBe(true);
  });

  it("ignores an unparseable lastNotifiedAt timestamp (fail-open to notify)", () => {
    expect(
      shouldNotifyParent({ ...baseParent, severity: "critical", category: "suicide_ideation", lastNotifiedAt: "not-a-date" })
    ).toBe(true);
  });
});
