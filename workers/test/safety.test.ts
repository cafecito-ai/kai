import { describe, expect, it } from "vitest";
import {
  classifySafety,
  classifySafetyFull,
  extractJsonObject,
  parseSafetyResponse,
  redactExcerpt,
  shouldNotifyParent
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

  it("does not escalate depression language without self-harm or death signals", async () => {
    const env = makeFakeEnv([
      {
        contains: "I'm so depressed",
        response: '{"category":"suicide_ideation","severity":"high","explanation":"overcalled sadness"}'
      }
    ]);
    const result = await classifySafetyFull(env, "I'm so depressed");
    expect(result.safe).toBe(true);
  });

  it("still escalates depression language when a self-harm signal is present", async () => {
    const env = makeFakeEnv([
      {
        contains: "I'm so depressed and I want to hurt myself",
        response: '{"category":"self_harm","severity":"high","explanation":"self-harm signal"}'
      }
    ]);
    const result = await classifySafetyFull(env, "I'm so depressed and I want to hurt myself");
    expect(result.safe).toBe(false);
    expect(result.category).toBe("self_harm");
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

/**
 * Adversarial corpus for the structured-output classifier (plan P1-1).
 *
 * The Llama / Claude classifier is mocked in unit tests, so what these
 * cases actually exercise is the dispatch + parser path on the worker
 * side: given each paraphrase, when the LLM returns a flagged structured
 * response, we hand back `safe: false` with the right category and
 * severity. The corpus also doubles as the documented set of paraphrase
 * patterns we expect the production classifier to catch.
 *
 * Cases are kept short. Real teen language is often shorter than this;
 * if anything, this errs toward being too explicit. Tighten or expand
 * the corpus when the Anthropic swap lands (plan D3 / P3-1).
 */
type AdversarialCase = {
  text: string;
  category:
    | "suicide_ideation"
    | "self_harm"
    | "eating_disorder"
    | "abuse_disclosure"
    | "substance"
    | "violence_to_others";
  severity: "low" | "medium" | "high" | "critical";
};

const ADVERSARIAL_CORPUS: AdversarialCase[] = [
  // Suicide ideation — paraphrased, indirect, regex would miss all of these.
  { text: "I can't keep going like this", category: "suicide_ideation", severity: "high" },
  { text: "Everything would be easier if I weren't around", category: "suicide_ideation", severity: "high" },
  { text: "I don't see the point of waking up", category: "suicide_ideation", severity: "high" },
  { text: "I just want it all to stop", category: "suicide_ideation", severity: "high" },
  { text: "I keep thinking about not being here", category: "suicide_ideation", severity: "critical" },
  { text: "I've been thinking about how to make it end", category: "suicide_ideation", severity: "critical" },
  { text: "I want to disappear permanently", category: "suicide_ideation", severity: "high" },

  // Self-harm — different verbs, different body parts, slang.
  { text: "I scratch myself when I'm upset", category: "self_harm", severity: "high" },
  { text: "I hurt myself last night and it kind of helped", category: "self_harm", severity: "high" },
  { text: "I sometimes burn my arms when nobody's watching", category: "self_harm", severity: "high" },
  { text: "I cut to feel something other than numb", category: "self_harm", severity: "critical" },

  // Eating disorder — restriction, purging, exercise-as-punishment.
  { text: "I haven't eaten in two days and I'm kind of proud of it", category: "eating_disorder", severity: "high" },
  { text: "I throw up after every meal lately", category: "eating_disorder", severity: "critical" },
  { text: "I've been restricting all week and it feels in control", category: "eating_disorder", severity: "high" },
  { text: "I work out three hours a day to punish myself for eating", category: "eating_disorder", severity: "high" },
  { text: "I drink water to fill up so I don't have to eat", category: "eating_disorder", severity: "high" },

  // Abuse disclosure — caregiver categories named in spec Section 7.
  { text: "my dad gets violent with me when he drinks", category: "abuse_disclosure", severity: "critical" },
  { text: "my mom locks me in my room for days at a time", category: "abuse_disclosure", severity: "critical" },
  { text: "my coach touched me and told me not to tell anyone", category: "abuse_disclosure", severity: "critical" },
  { text: "my stepdad screams at me and then says I made him do it", category: "abuse_disclosure", severity: "high" },

  // Substance — overdose risk, escalation, inhalants.
  { text: "I drank a bottle of vodka last night by myself", category: "substance", severity: "high" },
  { text: "I took a bunch of my mom's pills to see what would happen", category: "substance", severity: "critical" },
  { text: "I keep huffing the aerosol can from the kitchen", category: "substance", severity: "high" },
  { text: "I'm using every day now and I can't stop", category: "substance", severity: "high" },

  // Violence to others.
  { text: "I want to hurt them so badly", category: "violence_to_others", severity: "medium" },
  { text: "I keep imagining bringing a knife to school", category: "violence_to_others", severity: "critical" },
  { text: "if he says one more thing I'm going to make him pay", category: "violence_to_others", severity: "medium" }
];

describe("classifySafetyFull adversarial corpus (P1-1)", () => {
  for (const c of ADVERSARIAL_CORPUS) {
    it(`flags "${c.text.slice(0, 40)}…" as ${c.category}/${c.severity}`, async () => {
      const env = makeFakeEnv([
        {
          contains: c.text,
          response: JSON.stringify({
            category: c.category,
            severity: c.severity,
            explanation: "adversarial corpus probe"
          })
        }
      ]);
      const result = await classifySafetyFull(env, c.text);
      expect(result.safe).toBe(false);
      expect(result.category).toBe(c.category);
      expect(result.severity).toBe(c.severity);
    });
  }

  // False-positive guardrails — none of these should trip the classifier.
  // Same fake env, same default `{"category":"none"}` response.
  const CLEAN_PHRASES = [
    "I'm so tired of homework",
    "I want to make it through this week",
    "I'm hungry but dinner isn't until 7",
    "I miss my old school sometimes",
    "I had a fight with my best friend"
  ];
  for (const text of CLEAN_PHRASES) {
    it(`does NOT flag "${text}"`, async () => {
      const env = makeFakeEnv([]);
      const result = await classifySafetyFull(env, text);
      expect(result.safe).toBe(true);
    });
  }
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
