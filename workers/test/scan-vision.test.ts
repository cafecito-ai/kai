// T-029 — body scan vision pipeline tests.
//
// CRITICAL Gate-5 invariants tested here:
//   - Parser handles every documented field correctly
//   - 20 synthetic "model outputs" exercise the filter:
//     - 10 are clean → all 10 must produce ok:true analyses
//     - 10 contain forbidden language → all 10 must be caught by the
//       filter and result in ok:false / reason: filter_failed
//   - Regeneration loop tops out at 3 attempts then errors
//   - disable_training is always passed in the AI call (verified via mock)
//
// We DON'T test the actual vision model here — that requires a real
// Workers AI binding and live images. We test the orchestration layer:
// given any model output (synthetic), does the pipeline do the right
// thing? Gate 5 requires manual review of 10 sample outputs with real
// vision; this file is the automated harness underneath.

import { describe, expect, it, vi } from "vitest";
import {
  analyzeScan,
  defaultVisionCall,
  parseScanOutput,
  SCAN_RETAKE_ERROR,
  type ScanImages,
  type VisionCallFn,
} from "../src/lib/scan-vision";
import { passesBodyLanguageFilter } from "../src/lib/body-language-filter";
import type { Env } from "../src/types";

// ─────────────────────────────────────────────────────────────────────
// Test fixtures — synthetic model outputs
// ─────────────────────────────────────────────────────────────────────

const dummyImages: ScanImages = {
  front: { mime: "image/jpeg", bytesB64: "AAAA" },
  side: { mime: "image/jpeg", bytesB64: "BBBB" },
  back: { mime: "image/jpeg", bytesB64: "CCCC" },
};

/** 10 clean, filter-passing model outputs covering each combination
 *  of 1/2/3 observations + summary. None contain forbidden words. */
const CLEAN_OUTPUTS: string[] = [
  // 1 — single observation
  `[OBSERVATION_1]: Your left shoulder sits slightly higher than your right, often from carrying a bag on one side. Over time this can cause neck tension.
[ACTION_1]: Shoulder rolls — 10 backward, slow, twice a day. Hold a doorway pec stretch 30 seconds per side.
[SUMMARY]: Small daily work on the left side will take pressure off your neck.`,

  // 2 — two observations, common posture findings
  `[OBSERVATION_1]: Slight forward head posture relative to the shoulders, common from screens. Can cause upper-neck strain.
[OBSERVATION_2]: Anterior pelvic tilt suggesting tight hip flexors from sitting.
[ACTION_1]: Chin tucks — gently retract the chin, hold 5 seconds, 10 reps, 2-3 times per day.
[ACTION_2]: Couch stretch — 60 seconds per side, daily. Activates glutes after.
[SUMMARY]: Two small habits will release the upper neck and front of the hips.`,

  // 3 — three observations, all postural
  `[OBSERVATION_1]: Rounded shoulders suggesting tight chest from typing posture.
[OBSERVATION_2]: Right hip slightly elevated, possibly from dominant-side standing.
[OBSERVATION_3]: Slight knee valgus on the right when squatting visible.
[ACTION_1]: Doorway pec stretch — 30 seconds per side, twice daily.
[ACTION_2]: Single-leg glute bridges, 10 per side, 3 times per week.
[ACTION_3]: Banded squat with knees out cue, 2 sets of 8, twice weekly.
[SUMMARY]: Posture, hip symmetry, and knee tracking will all improve with this trio.`,

  // 4 — back-focused
  `[OBSERVATION_1]: Slight excessive thoracic curve from extended sitting.
[ACTION_1]: Foam-roll the upper back daily for 60 seconds, then 10 prone Y-raises.
[SUMMARY]: Re-extending the upper spine restores breathing capacity and shoulder mobility.`,

  // 5 — neck-focused
  `[OBSERVATION_1]: Forward head carriage and elevated traps.
[OBSERVATION_2]: Mild left tilt of the cervical spine.
[ACTION_1]: Chin tucks against a wall, 10 reps, twice daily.
[ACTION_2]: Suboccipital release with a tennis ball, 60 seconds.
[SUMMARY]: Two minutes a day on the neck pays off in less headaches.`,

  // 6 — feet/ankle
  `[OBSERVATION_1]: Slight overpronation of the right foot when standing.
[ACTION_1]: Single-leg balance work, 30 seconds per side, daily.
[SUMMARY]: Foot stability transfers up the chain to knees and hips.`,

  // 7 — hips
  `[OBSERVATION_1]: Hips drift forward of the heels in standing, suggesting tight hip flexors.
[OBSERVATION_2]: Limited posterior tilt indicating weak glutes.
[ACTION_1]: 90/90 hip openers, 60 seconds per side.
[ACTION_2]: Glute bridges, 15 reps, 3 sets, daily.
[SUMMARY]: Mobility plus strength will reset the hips back over the heels.`,

  // 8 — squat patterns
  `[OBSERVATION_1]: Heels lift slightly in a deep squat — ankle restriction likely.
[ACTION_1]: Calf wall stretch, 60 seconds per side. Daily ankle mobility drill.
[SUMMARY]: Restoring ankle range opens up your squat depth.`,

  // 9 — shoulder symmetry
  `[OBSERVATION_1]: Visible asymmetry in shoulder height — right side higher by a small margin.
[OBSERVATION_2]: Mild forward roll of the left shoulder.
[OBSERVATION_3]: Slight winging of the right scapula at rest.
[ACTION_1]: Carry your bag on alternating sides daily.
[ACTION_2]: Wall slides, 10 reps, three times per week.
[ACTION_3]: Push-up plus, 10 reps, three times per week.
[SUMMARY]: The shoulder girdle responds quickly to symmetric work.`,

  // 10 — clean error (the model can also return ERROR — that's a valid clean output)
  `[ERROR]: The lighting or angle makes it hard to see clearly. Try retaking with better lighting and a plain background.`,
];

/** 10 forbidden-language outputs — every one MUST be caught by the filter. */
const FORBIDDEN_OUTPUTS: string[] = [
  // 1 — direct physique word
  `[OBSERVATION_1]: You look pretty skinny but your posture is bringing down your appearance.
[ACTION_1]: Stand taller.
[SUMMARY]: Posture matters.`,

  // 2 — body-fat reference
  `[OBSERVATION_1]: Your body fat looks low which is great but your shoulders round forward.
[ACTION_1]: Pec stretch daily.
[SUMMARY]: Keep at it.`,

  // 3 — comparison language
  `[OBSERVATION_1]: For someone your age, your posture is about average.
[ACTION_1]: Work on neck position.
[SUMMARY]: Above average effort needed.`,

  // 4 — aesthetic word
  `[OBSERVATION_1]: You have a nice physique but rounded shoulders.
[ACTION_1]: Wall slides.
[SUMMARY]: Beautiful frame, just need to align it.`,

  // 5 — BMI / body composition
  `[OBSERVATION_1]: Your BMI looks healthy, posture-wise things are good.
[ACTION_1]: Chin tucks.
[SUMMARY]: Keep going.`,

  // 6 — cutting / bulking diet culture
  `[OBSERVATION_1]: If you're cutting, your shoulders will pop more.
[ACTION_1]: Lift more.
[SUMMARY]: Shredded soon.`,

  // 7 — shaming language
  `[OBSERVATION_1]: You've been lazy with your form — no excuse for this slouch.
[ACTION_1]: Stand straight.
[SUMMARY]: Try harder.`,

  // 8 — multiple violations
  `[OBSERVATION_1]: Your fat distribution suggests poor posture habits.
[OBSERVATION_2]: For your age and weight, this is below average.
[ACTION_1]: Stretch.
[ACTION_2]: Bulk up.
[SUMMARY]: You'll look more attractive with better posture.`,

  // 9 — "lean" aesthetic
  `[OBSERVATION_1]: You're lean but rounded forward.
[ACTION_1]: Stretch the pecs.
[SUMMARY]: Looking ripped, just align it.`,

  // 10 — calorie talk
  `[OBSERVATION_1]: A calorie deficit will help align your posture.
[ACTION_1]: Eat less.
[SUMMARY]: Lose weight.`,
];

/** Build a VisionCallFn that returns the given sequence of outputs. */
function mockVision(outputs: string[]): VisionCallFn {
  const queue = [...outputs];
  return async () => queue.shift() ?? "";
}

// ─────────────────────────────────────────────────────────────────────
// Parser tests
// ─────────────────────────────────────────────────────────────────────

describe("parseScanOutput", () => {
  it("parses a 3-observation response", () => {
    const r = parseScanOutput(CLEAN_OUTPUTS[2]);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.observations).toHaveLength(3);
      expect(r.observations[0].index).toBe(1);
      expect(r.observations[0].text).toMatch(/rounded shoulders/i);
      expect(r.observations[0].action).toMatch(/doorway pec/i);
      expect(r.summary).toMatch(/posture, hip symmetry/i);
    }
  });

  it("parses a 1-observation response", () => {
    const r = parseScanOutput(CLEAN_OUTPUTS[0]);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.observations).toHaveLength(1);
    }
  });

  it("recognises [ERROR] outputs", () => {
    const r = parseScanOutput(CLEAN_OUTPUTS[9]);
    expect(r.kind).toBe("error");
    if (r.kind === "error") {
      expect(r.message).toMatch(/lighting or angle/i);
    }
  });

  it("returns unparseable for garbage", () => {
    const r = parseScanOutput("just a paragraph with no tags");
    expect(r.kind).toBe("unparseable");
  });

  it("returns unparseable when observations have no matching action", () => {
    const r = parseScanOutput(`[OBSERVATION_1]: Something.
[SUMMARY]: Something else.`);
    expect(r.kind).toBe("unparseable");
  });

  it("orders observations by index, not by appearance", () => {
    const r = parseScanOutput(`[OBSERVATION_2]: Second.
[ACTION_2]: Second action.
[OBSERVATION_1]: First.
[ACTION_1]: First action.
[SUMMARY]: Both.`);
    expect(r.kind).toBe("ok");
    if (r.kind === "ok") {
      expect(r.observations[0].index).toBe(1);
      expect(r.observations[1].index).toBe(2);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// 20-image filter compliance — Gate 5 invariant
// ─────────────────────────────────────────────────────────────────────

describe("Gate 5 filter compliance — 20 synthetic outputs", () => {
  it("all 10 clean outputs pass the filter", () => {
    for (const [i, text] of CLEAN_OUTPUTS.entries()) {
      expect(passesBodyLanguageFilter(text), `clean #${i + 1} failed`).toBe(true);
    }
  });

  it("all 10 forbidden outputs are caught by the filter", () => {
    for (const [i, text] of FORBIDDEN_OUTPUTS.entries()) {
      expect(passesBodyLanguageFilter(text), `forbidden #${i + 1} sneaked through`).toBe(false);
    }
  });

  it("clean outputs → analyzeScan returns ok:true", async () => {
    for (const text of CLEAN_OUTPUTS.slice(0, 9)) {
      // Skip the ERROR variant — it's intentionally an error path
      const result = await analyzeScan(dummyImages, mockVision([text]));
      expect(result.ok).toBe(true);
    }
  });

  it("[ERROR] clean output → ok:false with model_returned_error", async () => {
    const result = await analyzeScan(dummyImages, mockVision([CLEAN_OUTPUTS[9]]));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("model_returned_error");
      expect(result.message).toMatch(/lighting or angle/i);
    }
  });

  it("forbidden outputs → after 3 regens, filter_failed with retake message", async () => {
    // Same forbidden output 3 times in a row → no recovery
    for (const text of FORBIDDEN_OUTPUTS) {
      const result = await analyzeScan(
        dummyImages,
        mockVision([text, text, text]),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("filter_failed");
        expect(result.message).toBe(SCAN_RETAKE_ERROR);
        expect(result.attempts).toBe(3);
      }
    }
  });

  it("forbidden first then clean → ok:true after regen", async () => {
    const result = await analyzeScan(
      dummyImages,
      mockVision([FORBIDDEN_OUTPUTS[0], CLEAN_OUTPUTS[0]]),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.attempts).toBe(2);
      expect(result.filterHitsDuringRegens).toHaveLength(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// Vision call adapter — disable_training invariant
// ─────────────────────────────────────────────────────────────────────

describe("defaultVisionCall", () => {
  it("passes disable_training: true on every AI invocation", async () => {
    const runMock = vi.fn(async () => ({ response: "ok" }));
    const env = {
      AI: { run: runMock },
      AI_VISION_MODEL: "@cf/test/vision",
    } as unknown as Env;

    const call = defaultVisionCall(env);
    await call({
      systemPrompt: "stub",
      images: [{ mime: "image/jpeg", bytesB64: "AAAA" }],
    });

    expect(runMock).toHaveBeenCalledTimes(1);
    const firstCall = runMock.mock.calls[0] as unknown as [string, { disable_training: unknown }];
    expect(firstCall[0]).toBe("@cf/test/vision");
    expect(firstCall[1].disable_training).toBe(true);
  });

  it("throws if no vision backend configured (no Anthropic key, no AI binding)", async () => {
    const env = {} as unknown as Env;
    const call = defaultVisionCall(env);
    await expect(
      call({ systemPrompt: "x", images: [{ mime: "image/jpeg", bytesB64: "AAAA" }] }),
    ).rejects.toThrow(/no vision backend/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Vision call errors
// ─────────────────────────────────────────────────────────────────────

describe("analyzeScan — vision errors", () => {
  it("returns vision_error if the vision call throws", async () => {
    const failing: VisionCallFn = async () => {
      throw new Error("network down");
    };
    const result = await analyzeScan(dummyImages, failing);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("vision_error");
      expect(result.message).toBe(SCAN_RETAKE_ERROR);
    }
  });

  it("returns parse_failed on filter-clean garbage output", async () => {
    const result = await analyzeScan(
      dummyImages,
      mockVision(["here is some text but no tags"]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("parse_failed");
    }
  });
});
