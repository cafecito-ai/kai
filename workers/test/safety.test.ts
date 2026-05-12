import { describe, expect, it } from "vitest";
import { classifySafety, redactExcerpt } from "../src/lib/safety";

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
    expect(result).toMatch(/^len:200\|a{40}…[ab]{40}$/);
    expect(result.includes("…")).toBe(true);
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
