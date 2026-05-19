# STATUS.md — KAI build progress

Live tracker maintained by the build agent. Each task: `done` / `iterating` / `awaiting_review` / `blocked`. Gate approvals posted as bare markers (e.g. `gate-1-approved`).

---

## Current task
🛑 **HALTED AT GATE 1.** Phase A complete. Awaiting Ratner (architecture + safety) and Lev (voice + visual) approval. Post `gate-1-approved` here when both sign off.

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

## Phase C — Mind agent depth (T-015 → T-021)
Pending Gate 2.

## Phase D — Body agent (T-022 → T-028)
Pending Gate 3.

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
