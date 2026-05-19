# DECISIONS.md — Log of decisions and their reasons

Append-only log. Every non-trivial decision (especially when picking the conservative interpretation of an ambiguity) lands here with a date and a one-paragraph rationale.

---

## D-001 — Initial local git scaffold (superseded by D-002)
**Date:** 2026-05-19 (T-001)
**Status:** Superseded — once Evan Ratner published `cafecito-ai/kai`, that became the working tree. The local-init artifacts were backed up to `/Users/evanseder/Documents/KAI-local-bak-1779211120/` and are not part of the build history. Original rationale below for the record.
**Original decision:** `git init` and create `feature/kai-v1` locally in the KAI folder rather than waiting on remote repo access. T-001's `Done_when` required a branch and status files. The remote `eratner15/boostai` was inaccessible, but local init unblocked documentation/scaffolding tasks. Conservative move per AGENT_PLAN §2.7.

---

## D-002 — Repo is `cafecito-ai/kai`, not `eratner15/boostai`
**Date:** 2026-05-19 (T-001 redo)
**Decision:** Treat `cafecito-ai/kai` as the source of truth. The plan documents (`AGENT_PLAN.md`, `KICKOFF.md`) refer to `eratner15/boostai`; that name is stale. `feature/kai-v1` was created off `main` of `cafecito-ai/kai`.
**Why:** Evan Ratner confirmed the published repo location. Repo's `package.json` and `wrangler.toml` confirm it matches the plan's stack (Vite + React + TS + Tailwind frontend, Cloudflare Workers + Hono + D1 backend). The existing v0 infrastructure described in plan §1 is present: auth, onboarding, food-photo, safety classifier (`workers/src/lib/safety.ts`) all wired up. Plan's instruction "Do not delete the existing backend infrastructure. Update it, extend it, restyle it." applies cleanly.
**Action:** AGENT_PLAN.md and KICKOFF.md still say `eratner15/boostai` in their text. Not patching those docs in this commit because they're spec artifacts from the planning meeting; instead this decision overrides them by reference.

---

## D-003 — Backend path is `workers/src/`, not `src/server/`
**Date:** 2026-05-19 (T-001 redo)
**Decision:** Treat AGENT_PLAN.md's `src/server/*` paths as a planning placeholder. Map them onto the repo's actual layout:
- `src/server/agents/*` → `workers/src/lib/prompts/*` (alongside the existing `kai.ts`, `engines.ts`, `intake.ts`, `strengths.ts`, `demo-feelings.ts` prompts)
- `src/server/middleware/safety.ts` → `workers/src/lib/safety.ts` (already exists; protected per CLAUDE.md v2 §6)
- `src/server/db/schema.ts` → tba; D1 migrations live in `workers/migrations/` and `migrations/`
- `src/server/routing/agent-router.ts` → `workers/src/routes/chat.ts` is the existing chat router; routing classifier will plug in there
**Why:** The repo predates the plan's invented path names. Building to the actual layout preserves git history, avoids duplicate-directory drift, and keeps the existing v0 backend intact per AGENT_PLAN §1's "extend it, restyle it" rule.
**Action:** The four prompt files (`mental-health-prompt.ts`, `physical-health-prompt.ts`, `routing-classifier.ts`, `body-scan-prompt.ts`) were installed at `workers/src/lib/prompts/`. The build agent at T-006, T-007, T-008, T-029 will import from there.

---

## D-004 — CLAUDE.md replaced with v2 spec; legacy preserved at docs/CLAUDE_legacy.md
**Date:** 2026-05-19 (T-001 redo)
**Decision:** The repo's existing root `CLAUDE.md` (1254 lines, three-engine architecture "Project North Star") is moved to `docs/CLAUDE_legacy.md`. The v2 two-agent KAI spec from the planning meeting becomes the new root `CLAUDE.md`. `CLAUDE_v3_PATCH.md` is added alongside.
**Why:** The repo's most recent commit on `main` is "Reframe Kai around mental and physical agents" (51adbf2), confirming the codebase is mid-pivot from the three-engine model to the two-agent model. The v2 + v3 spec from the planning meeting is the canonical target for this pivot. Legacy is preserved because it documents the v0 implementation that the build agent must "extend, not delete" per AGENT_PLAN §1.
**Caveat:** The legacy CLAUDE.md may contain accurate guidance about existing endpoint shapes, table structures, or component contracts. Build agent should consult `docs/CLAUDE_legacy.md` when extending an existing surface, but v2 + v3 PATCH are authoritative for new product behavior.

---

## Build understanding (T-002)
_To be written when T-002 executes._

---
