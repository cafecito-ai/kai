import { describe, expect, it } from "vitest";
import {
  classifySafety,
  classifySafetyFull,
  extractJsonObject,
  parseSafetyResponse
} from "../src/lib/safety";
import type { Env } from "../src/types";

describe("worker safety classifier (regex fast path)", () => {
  it("flags crisis before chat", () => {
    expect(classifySafety("I might kill myself").safe).toBe(false);
  });

  it("flags risky food and body language", () => {
    const result = classifySafety("I hate my body and I am skipping meals");
    expect(result.safe).toBe(false);
    expect(result.category).toBe("eating_disorder");
  });

  it("misses paraphrased crisis language (documents the gap the LLM fills)", () => {
    // These are the prompts the regex was never going to catch. They're the
    // reason P1-1 exists.
    const paraphrases = [
      "I can't keep going like this",
      "Everything would be easier if I weren't here",
      "I just want it all to stop",
      "I don't see the point anymore"
    ];
    for (const text of paraphrases) {
      expect(classifySafety(text).safe).toBe(true);
    }
  });
});

describe("extractJsonObject", () => {
  it("returns the bare JSON object when input is just JSON", () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it("strips chatty preamble", () => {
    expect(extractJsonObject('Here is the classification: {"category":"none"}')).toBe('{"category":"none"}');
  });

  it("strips markdown code fences", () => {
    const fenced = '```json\n{"category":"self_harm","severity":"high"}\n```';
    expect(extractJsonObject(fenced)).toBe('{"category":"self_harm","severity":"high"}');
  });

  it("handles nested braces", () => {
    const nested = '{"category":"none","meta":{"score":0.1}}';
    expect(extractJsonObject(nested)).toBe(nested);
  });

  it("ignores braces inside strings", () => {
    const tricky = '{"explanation":"contains } character"}';
    expect(extractJsonObject(tricky)).toBe(tricky);
  });

  it("returns null when no JSON object is present", () => {
    expect(extractJsonObject("nope nothing here")).toBeNull();
    expect(extractJsonObject("")).toBeNull();
  });
});

describe("parseSafetyResponse", () => {
  it("maps category=none to safe:true", () => {
    const result = parseSafetyResponse('{"category":"none","severity":"low","explanation":"clean"}');
    expect(result).toEqual({ safe: true });
  });

  it("maps a flagged category to safe:false with category + severity", () => {
    const result = parseSafetyResponse(
      '{"category":"suicide_ideation","severity":"critical","explanation":"explicit intent"}'
    );
    expect(result?.safe).toBe(false);
    expect(result?.category).toBe("suicide_ideation");
    expect(result?.severity).toBe("critical");
    expect(result?.response).toBeTruthy();
  });

  it("returns null for malformed JSON", () => {
    expect(parseSafetyResponse("not json")).toBeNull();
    expect(parseSafetyResponse('{"category":"self_harm","severity":')).toBeNull();
  });

  it("returns null for unknown category", () => {
    expect(parseSafetyResponse('{"category":"made_up","severity":"high"}')).toBeNull();
  });

  it("returns null for unknown severity", () => {
    expect(
      parseSafetyResponse('{"category":"self_harm","severity":"super_critical"}')
    ).toBeNull();
  });

  it("returns null when category or severity is missing", () => {
    expect(parseSafetyResponse('{"severity":"high"}')).toBeNull();
    expect(parseSafetyResponse('{"category":"self_harm"}')).toBeNull();
  });

  it("handles fenced + preambled responses end-to-end", () => {
    const raw = 'Classification:\n```json\n{"category":"self_harm","severity":"high","explanation":"X"}\n```';
    const result = parseSafetyResponse(raw);
    expect(result?.safe).toBe(false);
    expect(result?.category).toBe("self_harm");
  });
});

// Fake env.AI for integration shape — returns canned strings per input.
function makeFakeEnv(responsesByMatch: Array<{ contains: string; response: string }>): Env {
  return {
    AI: {
      async run(_model: string, input: Record<string, unknown>) {
        const prompt = String(input.prompt ?? "");
        const match = responsesByMatch.find((r) => prompt.includes(r.contains));
        return { response: match?.response ?? '{"category":"none","severity":"low","explanation":"default"}' };
      }
    }
  } as unknown as Env;
}

describe("classifySafetyFull (regex + LLM)", () => {
  it("short-circuits on regex hit without calling LLM", async () => {
    let aiCalls = 0;
    const env = {
      AI: {
        async run() {
          aiCalls++;
          return { response: '{"category":"none","severity":"low"}' };
        }
      }
    } as unknown as Env;
    const result = await classifySafetyFull(env, "I want to kill myself");
    expect(result.safe).toBe(false);
    expect(result.category).toBe("suicide_ideation");
    expect(aiCalls).toBe(0);
  });

  it("uses LLM when regex misses, and flags when LLM flags", async () => {
    const env = makeFakeEnv([
      {
        contains: "I can't keep going like this",
        response: '{"category":"suicide_ideation","severity":"high","explanation":"paraphrased"}'
      }
    ]);
    const result = await classifySafetyFull(env, "I can't keep going like this");
    expect(result.safe).toBe(false);
    expect(result.category).toBe("suicide_ideation");
  });

  it("returns safe:true when both regex and LLM say none", async () => {
    const env = makeFakeEnv([]);
    const result = await classifySafetyFull(env, "I'm just tired from school");
    expect(result.safe).toBe(true);
  });

  it("returns safe:true when LLM output is unparseable (no regression vs. regex-only)", async () => {
    const env = makeFakeEnv([{ contains: "vague feels", response: "I think this is fine but here's some prose, no JSON." }]);
    const result = await classifySafetyFull(env, "vague feels today");
    expect(result.safe).toBe(true);
  });

  it("returns safe:true when no AI binding is present (fail-open to regex-only)", async () => {
    const env = {} as Env;
    const result = await classifySafetyFull(env, "I can't keep going like this");
    expect(result.safe).toBe(true);
  });
});
