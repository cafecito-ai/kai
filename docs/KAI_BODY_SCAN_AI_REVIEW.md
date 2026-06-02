# Body Scan — AI Gate-5 Review (2026-06-02)

**Status: APPROVED for a supervised feedback pilot. Live on production.**

> This is an **AI safety review**, not a licensed-clinician sign-off. It was
> performed by Claude (build agent) plus an independent Claude reviewer agent.
> Per CLAUDE.md §9, Evan Ratner is the final safety approver and authorized this
> pilot launch. A human clinical review is still recommended before unsupervised
> general availability.

## What the body scan does
Three photos (front/side/back) → Claude vision (Sonnet, direct Anthropic API) →
posture/alignment observations + corrective stretches → forbidden-language filter
→ structured result. Posture and movement only. Never aesthetics, size, weight,
BMI, body composition, or comparisons (CLAUDE.md §3 Body Agent, §6).

## Why it's safe to pilot (the core guarantee)
The pipeline can only ever surface either (a) parsed text that already passed the
forbidden-language filter, or (b) hardcoded safe constants. **There is no
"best-effort" leak path.** If the model drifts into forbidden language, the
pipeline regenerates with a stricter prompt up to 3×; if it still fails, the user
gets a safe "retake with better lighting" message — never leaked content.

Verified by the red-team suite (`workers/test/scan-vision-redteam.test.ts`, 13/13):
adversarial model outputs — diet-culture jargon **and** plain-English aesthetic
description ("your gut sticks out", "carrying extra weight", "you look chunky") —
all caught → safe error; clean output passes; model `[ERROR]`/garbage/thrown-call
all degrade safely.

## Privacy (verified)
- Image bytes live in Worker memory for the request only. **Never persisted** —
  no R2 write, no logging in the scan path. Only parsed text observations reach D1.
- Delete is user-scoped and hard-deletes (`scan.ts` DELETE; FK `ON DELETE CASCADE`).
- Anthropic API does not train on inputs by default (commercial terms); the
  Workers-AI fallback passes `disable_training: true`.

## Findings from the review and what was fixed
- **M1/M2 (moderate, FIXED):** the backstop filter caught diet-culture *jargon*
  but not plain-English aesthetic *description*. Added `weight`, `pounds`,
  `leaner`, `gorgeous`, `gut`, `belly`, `pot belly`, `double chin`, `chunky`,
  `pudgy`, `curvy` (and earlier: `toned`, `slim`, `physique`, `flabby`, `jacked`,
  `swole`, `lanky`, `stocky`, `dad bod`, `beer belly`, `love handles`, `muffin top`,
  `thigh gap`, `six-pack`). The vision prompt now says to describe load as
  "pressure/load/balance", never "weight", so legit posture cues don't fight the
  filter. Added plain-English adversarial probes to the red-team suite.
- **F3 (minor, FIXED):** scan observations silently failed to persist for fresh
  anonymous users (FK to `users`). Fixed by `ensureUser` in the auth middleware.
- **Deliberately NOT filtered** (would block legit movement language, low leak
  risk, prompt + supervised review cover them): `lean`/`size`/`big`/`small`
  (e.g. "lean forward", "small of your back"), `figure` (figure-four stretch),
  `abs`/`chin` (engage your abs, chin tuck).

## Residual risk (accept for supervised pilot; close before GA)
A vision model that obeys the output format but invents a novel plain-English
body descriptor not on the blocklist could pass. Mitigations: (1) the prompt
strongly constrains to posture; (2) supervised pilot with human review of the
first batch of real outputs (`filter_hits` is logged per scan); (3) **recommended
before GA:** add a cheap Haiku "is this sentence about appearance/size?" semantic
classifier as defense-in-depth, instead of a vocabulary blocklist alone.

## Live verification (prod, 2026-06-02)
- Pipeline reaches Claude vision (no longer the dead `@cf/anthropic/claude-sonnet-4`
  gateway id → `vision_error`). Scan model pinned: `ANTHROPIC_MODEL_PHYSICAL=claude-sonnet-4-6`.
- Real-body qualitative output is validated in the supervised pilot (Lev + first users).
