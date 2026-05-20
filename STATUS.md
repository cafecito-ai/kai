# STATUS.md — KAI build progress

Live tracker maintained by the build agent. Each task: `done` / `iterating` / `awaiting_review` / `blocked`. Gate approvals posted as bare markers (e.g. `gate-1-approved`).

---

## Current task
**Phase D complete — awaiting Gate 4 review** (2026-05-20). T-022 → T-028 all in. Physical Health agent surface area: food photo comments, workout logging, sleep recovery angle, hydration counter, 12-routine mobility library, energy check-in with low-streak detection, and the body scan UI scaffold (encryption + UI flow only — AI vision is Phase E).

**Body scan scaffold (T-028) flagged for Ratner pre-Phase-E review** — see D-019. Client-side AES-GCM with PBKDF2 key derivation works end-to-end (encrypt → store → decrypt round-trip tested), but the per-device "secret" and the localStorage-not-R2 persistence are scaffold-grade. Phase E swaps both for production-ready primitives, with full safety review at Gate 4.

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

## Phase E — AI Body Scan (T-029 → T-031) — HIGHEST RISK
Pending Gate 4.

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
