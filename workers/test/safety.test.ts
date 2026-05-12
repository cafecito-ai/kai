import { describe, expect, it } from "vitest";
import { classifySafety, redactExcerpt, shouldNotifyParent } from "../src/lib/safety";

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

describe("redactExcerpt", () => {
  it("returns short text as-is with length prefix", () => {
    const short = "I hate my body";
    expect(redactExcerpt(short)).toBe(`len:${short.length}|${short}`);
  });

  it("returns exactly-80-char text intact", () => {
    const eighty = "a".repeat(80);
    expect(redactExcerpt(eighty)).toBe(`len:80|${eighty}`);
  });

  it("truncates long text to first 40 + last 40 with length prefix", () => {
    const text = "a".repeat(100) + "b".repeat(100); // 200 chars
    const result = redactExcerpt(text);
    expect(result).toMatch(/^len:200\|a{40}\.\.\.[ab]{40}$/);
    expect(result.includes("...")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(100); // way smaller than the 200 input
  });

  it("does not contain any 41st-to-160th character of long input", () => {
    // Sentinel only appears in the middle of the input. After redaction, the
    // middle is dropped, so the sentinel must not survive.
    const middle = "SECRET_MIDDLE_DO_NOT_PERSIST";
    const text = "a".repeat(60) + middle + "b".repeat(60);
    const result = redactExcerpt(text);
    expect(result.includes(middle)).toBe(false);
  });

  it("handles empty and null input safely", () => {
    expect(redactExcerpt("")).toBe("len:0|");
    expect(redactExcerpt(null)).toBe("len:0|");
    expect(redactExcerpt(undefined)).toBe("len:0|");
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
