import { describe, expect, it } from "vitest";
import { extractJsonObject } from "../src/lib/json-utils";

describe("extractJsonObject", () => {
  it("returns the bare JSON when input is just JSON", () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it("strips chatty preamble", () => {
    expect(extractJsonObject('Here you go: {"a":1}')).toBe('{"a":1}');
  });

  it("strips markdown code fences", () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("handles nested braces", () => {
    expect(extractJsonObject('{"a":1,"b":{"c":2}}')).toBe('{"a":1,"b":{"c":2}}');
  });

  it("ignores braces inside strings", () => {
    expect(extractJsonObject('{"explanation":"a } character is fine"}')).toBe(
      '{"explanation":"a } character is fine"}'
    );
  });

  it("handles escaped quotes inside strings", () => {
    expect(extractJsonObject('{"text":"she said \\"hi\\""}')).toBe(
      '{"text":"she said \\"hi\\""}'
    );
  });

  it("returns null on empty / no-brace input", () => {
    expect(extractJsonObject("")).toBeNull();
    expect(extractJsonObject("nothing here")).toBeNull();
  });

  it("returns null when an opening brace has no balanced close", () => {
    expect(extractJsonObject('{"a":1')).toBeNull();
  });

  it("returns only the first balanced object when there are several", () => {
    expect(extractJsonObject('{"a":1}{"b":2}')).toBe('{"a":1}');
  });
});
