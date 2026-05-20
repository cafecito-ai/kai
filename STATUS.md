# STATUS.md — KAI build progress

Live tracker maintained by the build agent. Each task: `done` / `iterating` / `awaiting_review` / `blocked`. Gate approvals posted as bare markers (e.g. `gate-1-approved`).

---

## Current task
**Phase E complete — awaiting Gate 5 review** (2026-05-20, Ratner explicit "let it rip" authorization). T-029 → T-031 all in. Body scan AI vision pipeline:
  - Vision call orchestrator with disable_training=true, 3-regen filter loop, structured error fallback
  - Word-boundary fix in body-language-filter (eliminated "thin" inside "breathing" false positive that would have falsely rejected clinically clean outputs)
  - 20-image filter compliance harness asserting 100% clean→pass + 100% forbidden→catch
  - /api/scan/analyze endpoint persisting only parsed observations (never image bytes) to D1
  - Path B chosen over the spec's Path A — see D-020. Client decrypts and sends bytes to Worker for vision; no server-side photo persistence anywhere.
  - /scan/result/:sessionId page with observation cards (accentWarm left border) + action cards (✓ icon) per CLAUDE_v3_PATCH §3
  - First-view privacy reminder ("These are yours alone")

**Gate 5 checklist (highest-stakes gate per CLAUDE.md §5):**
  - [ ] Ratner verifies disable_training=true flag (defaultVisionCall in workers/src/lib/scan-vision.ts)
  - [ ] Ratner audits filter regex change in body-language-filter.ts (word boundaries added)
  - [ ] 20-test-image filter compliance auto-test PASSES (workers/test/scan-vision.test.ts)
  - [ ] Clinician / movement specialist reviews 10 sample real-image outputs (Ratner schedules)
  - [ ] Lev tests end-to-end on his own phone

## Phase A — Foundations (T-001 → T-008) ✅
- [x] T-001 — Branch setup and status files (`d22d24c`; B-001 resolved)
- [x] T-002 — Build understanding written (`a4d3141`; 498-word summary in DECISIONS.md)
- [x] T-003 — Light glass design tokens + signature elements (`adfcc24`, `c15a254`; KaiOrb + ScoreRing + KaiMessage; `/_design-tokens` live; Q-002 + Q-003)
- [x] T-004 — Floating glass tabbar + QuickActionSheet + Groups/Profile placeholders (`1ed6c97`)
- [x] T-005 — Onboarding v3 §4 7-step flow with two-agent intro (`ca7c222`)
- [x] T-006 — Routing classifier wired (`19c068e`; pickAgent + classifyRoute; Q-006)
- [x] T-007 + T-008 — Mind + Body system prompts wired into /kai/chat with body-language filter + regen loop (`HEAD`; Q-004 + Q-005)

**Open questions surfaced for gate review:**
- Q-002 — token names AGENT_PLAN vs v2 §7 (for Ratner)
- Q-003 — light mode override of "dark-only" v2 §7 (for Lev — visual direction)
- Q-004 — Mind agent 5 sample responses (for Lev — voice)
- Q-005 — Body agent 5 sample responses (for Lev — voice)
- Q-006 — 30-message routing accuracy sweep (for Ratner — staging-deploy)

## Phase B — Daily Score (T-009 → T-014)
Pending Gate 1.

## Phase C — Mind agent depth (T-015 → T-021) ✅ Awaiting Gate 3
- [x] T-015 — Emotional check-in flow (mood 1–5 + optional mind/better; local-first; Mind reflection)
- [x] T-016 — Journaling mode (sentiment heuristic; mood-keyed offline reflection)
- [x] T-017 — Sleep awareness logging (hours stepper + slider, quality, 3-night pattern detection)
- [x] T-018 — Optional screen-time chips on evening check-in (observational only)
- [x] T-019/T-020 — Identity-based goals (max 3 active, streak counter, day-7/14/30 reframes)
- [x] T-021 — Mental Health pattern recognition (`mental-patterns.ts` detector; `user_patterns` D1 table; daily cron + on-read fetch; wired into `recentPatterns` slot of Mind prompt)

## Phase D — Body agent (T-022 → T-028) ✅ Awaiting Gate 4
- [x] T-022 — Food photo → Body 1-2 sentence comment, body-language filter + 3-regen + fallback
- [x] T-023 — Workout logging (5 types: run/strength/yoga/sport/other), 2-3 sentence Body comment, under-16 bodyweight default rule
- [x] T-024 — Sleep + Body recovery comment when recent-workout or training-notes context warrants
- [x] T-025 — Hydration tracker (+/- glass counter, default 8, daily local-midnight reset)
- [x] T-026 — Mobility library (12 teen-appropriate routines, 3-10 min, step-by-step player with countdown)
- [x] T-027 — Energy check-in (1-5 scale, low-streak detection fires recovery note when today + yesterday both ≤2)
- [x] T-028 — Body scan UI scaffold (welcome / capture / history + AES-GCM encryption + 3-per-week limit) — REQUIRES SAFETY REVIEW

## Phase E — AI Body Scan (T-029 → T-031) — HIGHEST RISK ✅ Awaiting Gate 5
- [x] T-029 — Vision prompt + parser + 20-image filter compliance test set (10 clean → 10 pass; 10 forbidden → 10 caught)
- [x] T-030 — /api/scan/analyze with disable_training=true, 3-regen filter loop, scan_observations D1 persistence; only observations stored, photos never leave client
- [x] T-031 — /scan/result/:sessionId page with accentWarm observation cards + ✓ action cards per v3 §3, first-view privacy reminder, history page enhanced with KAI's-read summary tile per session

## Phase F — Voice mode (T-032 → T-035)
Pending Gate 5.

## Phase G — Groups (T-036 → T-040)
Pending Gate 6.

## Phase H — Polish (T-041 → T-045)
Pending Phase G.

## Phase I — Real-user test (T-046 → T-047)
Pending Phase H.

---

## Gate approvals (post bare markers here)
_None yet._
