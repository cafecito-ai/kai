# BLOCKERS.md — Outstanding blockers

Agent writes a blocker when it can't make safe forward progress. Supervisor (Evan Seder) clears each one before the loop resumes.

---

## B-001 — Target repo does not exist or is inaccessible ✅ RESOLVED 2026-05-19
**Opened:** 2026-05-19 (during T-001)
**Closed:** 2026-05-19 (same day)
**Severity:** HIGH — blocked T-002 onward in any meaningful sense
**Reported by:** build agent

**Resolution:** Evan Ratner published the real repo at `cafecito-ai/kai` (not `eratner15/boostai` as AGENT_PLAN.md §1 claims). Cloned, created `feature/kai-v1` off `main`, replayed T-001 docs + prompt files into the real repo. The repo's stack matches the plan: Vite + React + TS + Tailwind frontend, Cloudflare Workers + Hono + D1 backend, with auth/onboarding/food-photo/safety already wired up in `workers/src/`. See D-002 (CLAUDE.md replacement) and D-003 (prompts path remap).

**Original report (preserved for context):** AGENT_PLAN.md §1 names `eratner15/boostai` branch `feature/kai-v1`. `gh repo view eratner15/boostai` returned 404. eratner15 has 20+ visible public repos; none are KAI-shaped. Authenticated `gh` account is `Siderman123`. Local folder had only docs + prompt files when build started — no v0 backend to extend.

---
