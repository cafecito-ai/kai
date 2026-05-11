import { describe, expect, it } from "vitest";
import { classifySafety } from "../src/lib/safety";

describe("worker safety classifier", () => {
  it("flags crisis before chat", () => {
    expect(classifySafety("I might kill myself").safe).toBe(false);
  });
});
