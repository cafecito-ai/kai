import { describe, expect, it } from "vitest";
import { parseVisionResponse } from "../src/lib/vision";

describe("parseVisionResponse", () => {
  it("parses a clean JSON response", () => {
    const raw = JSON.stringify({
      items: [
        { name: "grilled chicken breast", estimated_grams: 150 },
        { name: "white rice", estimated_grams: 100 }
      ],
      confidence: "high",
      notes: "clear photo"
    });
    const result = parseVisionResponse(raw);
    expect(result?.confidence).toBe("high");
    expect(result?.items).toHaveLength(2);
    expect(result?.items[0]).toEqual({ name: "grilled chicken breast", estimated_grams: 150 });
  });

  it("strips chatty preamble and markdown fences", () => {
    const raw = 'Analysis result:\n```json\n{"items":[{"name":"toast","estimated_grams":40}],"confidence":"medium","notes":"x"}\n```';
    expect(parseVisionResponse(raw)?.confidence).toBe("medium");
  });

  it("recognizes the no-food-detected response", () => {
    const result = parseVisionResponse('{"items":[],"confidence":"low","notes":"no food detected"}');
    expect(result?.items).toEqual([]);
    expect(result?.confidence).toBe("low");
    expect(result?.notes).toBe("no food detected");
  });

  it("returns null for unknown confidence", () => {
    expect(
      parseVisionResponse('{"items":[],"confidence":"definitely","notes":""}')
    ).toBeNull();
  });

  it("filters out items with missing name or invalid grams", () => {
    const raw = JSON.stringify({
      items: [
        { name: "valid", estimated_grams: 50 },
        { name: "", estimated_grams: 100 },
        { name: "missing grams" },
        { name: "negative", estimated_grams: -5 }
      ],
      confidence: "low",
      notes: ""
    });
    const result = parseVisionResponse(raw);
    expect(result?.items).toEqual([{ name: "valid", estimated_grams: 50 }]);
  });

  it("rounds grams and caps absurd portions at 2000g", () => {
    const raw = JSON.stringify({
      items: [{ name: "rice", estimated_grams: 99.7 }, { name: "joke", estimated_grams: 99999 }],
      confidence: "low",
      notes: ""
    });
    const result = parseVisionResponse(raw);
    expect(result?.items[0].estimated_grams).toBe(100);
    expect(result?.items[1].estimated_grams).toBe(2000);
  });

  it("caps item count at 12 to keep response bounded", () => {
    const tooMany = Array.from({ length: 25 }, (_, i) => ({ name: `item${i}`, estimated_grams: 10 }));
    const raw = JSON.stringify({ items: tooMany, confidence: "low", notes: "" });
    const result = parseVisionResponse(raw);
    expect(result?.items.length).toBe(12);
  });

  it("returns null for malformed JSON", () => {
    expect(parseVisionResponse("not json")).toBeNull();
    expect(parseVisionResponse('{"items":[]')).toBeNull();
  });
});
