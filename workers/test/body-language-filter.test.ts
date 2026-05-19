import { describe, expect, it } from "vitest";
import {
  BODY_LANGUAGE_FALLBACK,
  findForbidden,
  passesBodyLanguageFilter,
  FORBIDDEN_BODY_LANGUAGE,
} from "../src/lib/body-language-filter";

describe("body-language filter", () => {
  it("passes clean output focused on posture / performance / mobility", () => {
    expect(
      passesBodyLanguageFilter(
        "Try a shoulder mobility flow for 5 minutes — focus on how the joint feels at the top of the range.",
      ),
    ).toBe(true);
  });

  it("flags physique descriptors", () => {
    expect(passesBodyLanguageFilter("You look ripped now.")).toBe(false);
    expect(passesBodyLanguageFilter("Aiming for that shredded summer body.")).toBe(false);
  });

  it("flags body metrics + diet-culture language", () => {
    expect(passesBodyLanguageFilter("Your BMI is too high.")).toBe(false);
    expect(passesBodyLanguageFilter("Try a calorie deficit this week.")).toBe(
      false,
    );
    expect(passesBodyLanguageFilter("Time for a cutting phase.")).toBe(false);
  });

  it("flags shame language", () => {
    expect(passesBodyLanguageFilter("Stop being lazy about your training.")).toBe(
      false,
    );
    expect(passesBodyLanguageFilter("No excuse to miss leg day.")).toBe(false);
  });

  it("flags comparisons even when worded politely", () => {
    expect(passesBodyLanguageFilter("Compared to average teens, you're ahead.")).toBe(
      false,
    );
    expect(passesBodyLanguageFilter("For your age, that's solid.")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(passesBodyLanguageFilter("you look RIPPED")).toBe(false);
    expect(passesBodyLanguageFilter("LAZY effort today")).toBe(false);
  });

  it("findForbidden returns all matches for the caller to log / retry", () => {
    const hits = findForbidden("You're too fat and lazy.");
    const words = hits.map((h) => h.word);
    expect(words).toContain("fat");
    expect(words).toContain("lazy");
  });

  it("exports a non-empty forbidden list", () => {
    expect(FORBIDDEN_BODY_LANGUAGE.length).toBeGreaterThan(20);
  });

  it("exports a fallback message that complies with its own filter", () => {
    expect(passesBodyLanguageFilter(BODY_LANGUAGE_FALLBACK)).toBe(true);
  });
});
