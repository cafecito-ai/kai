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

## D-007 — Ratner delegated build-phase safety-review authority to Seder
**Date:** 2026-05-19
**Decision:** Evan Ratner has explicitly authorized Evan Seder to proceed with all `requires_safety_review` tasks through Gate 1 (Phase A: T-005, T-007, T-008) without per-task hold-and-wait. Build implementation proceeds; final production sign-off still rests with Ratner per CLAUDE.md §9.
**Why:** Seder is the day-to-day intern working for Ratner on this build. Bouncing every safety-flagged task back for explicit approval pre-merge would stall the loop. The implementation work is mostly plumbing (wiring already-written prompt files; restyling existing consent flow); the SAFETY of the system is in the prompt files themselves + the existing `workers/src/lib/safety.ts` (untouched), both of which Ratner has already cleared.
**Bounded:** This delegation is for Phase A only. Gates still halt the loop — Gate 1 review by Ratner + Lev, Gate 5 (body scan, highest stakes) still requires Ratner explicit sign-off and clinician review per CLAUDE.md §6 and the build plan.
**Action:** Continue T-005 → T-008. Mark each commit as `awaiting_review` in STATUS.md, not `merged`. Gate 1 review after T-008 is mandatory.

---

## D-005 — Override CLAUDE.md v2 §7 "Dark mode only" → light mode
**Date:** 2026-05-19 (T-003 revision)
**Decision:** KAI ships in light mode. The v0 dark glass aesthetic is replaced with a warm off-white wellness-app aesthetic (background #FAFAF7, surface #FFFFFF, near-black text). Brand accent hues from v2 §7 are preserved (violet #7B6EF6, warm #F0A868, cool #68C5B8) and reused as soft-tinted chip backgrounds (`accent-soft`, `accent-warm-soft`, `accent-cool-soft`). Status colors slightly muted (#3F9D6A success, #D89A2C warning, #C75555 danger) to match the warmer palette.
**Why:** Evan Seder's call. Parents need to trust the product. Light reads as "real wellness app" (Apple Health / Calm / Headspace school); dark reads as "edgy teen app" and undermines parent trust. Teens are also fine with light — every major wellness app they use defaults to light.
**Spec conflict:** CLAUDE.md v2 §7 explicitly says "Dark mode only. No light mode." This decision overrides that line. v3 patch does not weigh in on light vs dark.
**Authority:** Visual direction is Lev's final call per CLAUDE.md §9. This decision is a working default pending Lev's review at Gate 1. Q-003 logged in QUESTIONS.md to flag for Lev.
**Action:** `tailwind.config.js`, `index.html` theme-color, `src/styles/globals.css` :root/body all flipped to light. `/_design-tokens` page rebuilt to show the light aesthetic + a full Home-screen mockup at iPhone width.

---

## D-006 — Three signature elements: orb, gradient score ring, KAI message bubble
**Date:** 2026-05-19 (T-003 revision continued)
**Decision:** KAI ships with three distinctive visual elements that no other wellness app has:
1. **KaiOrb** (`src/components/KaiOrb.tsx`) — A multi-stop radial gradient (cool → violet → warm) with a soft inner highlight and outer glow. Breathes on a 4s loop. Used at 28px next to messages, 44–56px in the home reflection card, and 180–240px as the voice-mode hero. KAI's "face" everywhere.
2. **ScoreRing** (`src/components/ScoreRing.tsx`) — The Daily Score ring uses an amber → violet → green linear gradient stroke along the arc. Color itself communicates how the day is going, not just fill amount. Animates from 0 → score over 900ms with a cubic-bezier ease-out on first paint.
3. **KaiMessage** (`src/components/KaiMessage.tsx`) — Reflections, check-in responses, and agent comments render as iMessage-style bubbles (tight bottom-left corner = "speaker tail" without an actual triangle, off-white tinted surface, KaiOrb anchored at the corner). Reads as a friend texting, not as a UI card.
**Why:** Without distinctive visual moments, KAI looks like every other wellness app. These three components are cheap to build but transform perceived quality — the orb is the "face" teens screenshot and share; the gradient ring is the home-screen hero; the bubbles make AI feel warm not mechanical.
**Action:** All three live in `src/components/`. The `/_design-tokens` page demos them in a "Signature elements" hero section + uses them in the iPhone-width Home mockup.

---

## Build understanding (T-002)
**Date:** 2026-05-19
**Source:** CLAUDE.md (v2 base spec) + CLAUDE_v3_PATCH.md (v3 patch — wins where the two conflict)

**The product.** KAI is an AI wellness companion for teenagers aged 13–18, built by Boost AI (JV of Cafecito AI and Madison AI Search) for client Offy. **Lev (16)** is Offy's son, the product owner, and first real user; he has final approval on voice and visual direction. The user perceives KAI as one warm "older sibling" character — internally it's two agents (**Mind** mental, **Body** physical) plus a routing classifier and a safety classifier. KAI is explicitly not therapy, not a fitness tracker, not a productivity app. Voice is honest, direct, occasionally funny, never preachy, never toxic-positive, never clinical.

**The two agents.** **Mind** draws on adolescent psychology, identity-based habits, Stoic practice and meaning-making — internal scaffolding only, never named to the user. Handles check-ins, journaling, goals, sleep reflection, loneliness, screen-time awareness. Default 2–3 sentences (v3 tightened from v2's 2–4). **Body** draws on sports science, teen physiology, Huberman-style protocols. Handles workouts, food photos, hydration, mobility, body scans. All output runs through a forbidden-word filter. Forbidden everywhere: physique descriptors (fat/skinny/toned-as-aesthetic), body metrics (BMI, calories, target weight), comparisons ("for your age"), shame language.

**Routing + safety.** Every message hits two classifiers in parallel: a **safety classifier** (always wins if it fires — routes to 988 crisis flow) and a **routing classifier** (Haiku 4.5, returns mental/physical/unclear; unclear → mental). User never sees this. **The safety surface is protected** — `safety/classifier`, `crisis-page`, `parental-consent`, `handoff`, and the safety middleware all require Evan Ratner approval for any change, even cosmetic. In this repo those map onto `workers/src/lib/safety.ts` and friends.

**Home hero is Daily Score** — composite 0–100 = mental·40% + sleep·30% + mood·30%. v3 thresholds: 0–40 amber (never red), 41–70 violet, 71–100 green. Animated 8px ring, JetBrains Mono number, sub-scores horizontal-scroll on mobile, tap opens a bottom-sheet detail.

**Highest-risk feature: body scan.** Three photos (front/side/back) with neutral white-outline silhouette guides. Client-side encrypted before R2 upload, no public R2 access. Output is posture/alignment only — never aesthetics, never body metrics. Hard delete on user request. Re-consent for under-16 on first use. Max 3 scans per 7 days. **Gate 5 is the highest-stakes gate**: 20 test images at 100% filter compliance, clinician review of 10 sample outputs, explicit Evan Ratner sign-off — no shortcut.

**What v3 changes from v2.** Mind tighter (default 2–3 sentences, banned-phrase list expanded). Body food logging capped at 2 sentences. Score gets 8px ring + three color thresholds. Body scan: verbatim privacy copy, neutral silhouette, observation/action cards, 3-per-week cap. Onboarding step order locked. Tab bar = 4 tabs + persistent +. Group invite links expire 48h. Voice opens "Mental or physical today — or just want to talk?", 10-min cap. Safety architecture, Body forbidden language, crisis protocol, tech stack and approval hierarchy are unchanged.

**Reporting line.** Seder day-to-day, Ratner for safety, Lev for voice/visual, Offy funds. Loop: work the graph, self-verify Done_when, halt at every Gate, escalate `requires_safety_review`, log `requires_lev_input`.

---

## D-018 — T-021 pattern detection runs on abstracted signals only
**Date:** 2026-05-20 (T-021)
**Decision:** The Mental Health pattern detector (`workers/src/lib/mental-patterns.ts`) operates on a `DaySignal` type that has no slot for raw text — only numeric fields (mood 1–5, sleepHours, journalSentiment scalar, journalCount, finalScore). The aggregator that builds DaySignals from `score_inputs` rows reads only known numeric keys (`mood`, `hours`, `sentiment`); any `mind` / `better` / `note` / `content` strings on the value JSON are loaded but never read.
**Why:** AGENT_PLAN T-021 guardrail: "patterns never include specific journal content in summary; only abstracted observations." The cleanest way to enforce that is at the type system boundary, not via a downstream filter — make it impossible to ever include text in a pattern observation because the detector physically can't see it. A test (`mental-patterns.test.ts` → "ignores any text/note fields") asserts the DaySignal shape stays clean even when raw inputs carry text fields.
**Patterns we surface:** mood trend (3+ days monotonic), mood swing (≥1.5 points over 5 days), sleep streak (3+ nights <6h), sleep variance (>2.5h stddev over 7 days), journaling habit/drop-off, week-over-week score lift/dip. Max 5 patterns per user. Stored in `user_patterns` with 14-day TTL. Recomputed by the daily Cloudflare cron in the existing `scheduled` handler.

---

## D-019 — T-028 body scan: scaffold-grade encryption + storage, flagged for Ratner review
**Date:** 2026-05-20 (T-028)
**Status:** Scaffold only — must not ship to real users without Ratner sign-off and the Phase E swap.
**Decision:** Implement the body scan UI end-to-end (welcome / 3-photo capture / encrypted save / history with delete / 3-per-week rate limit / verbatim privacy promise per v3 §3) so the flow can be exercised on a real device for design + UX review. The encryption and storage layers are intentionally scaffold-grade:
  - **Key derivation:** PBKDF2 with the per-device UUID as both secret and salt. Allows round-trip on the same device but is not a real authentication boundary. Phase E (T-030) must replace this with either a passphrase + proper salt, or a server-issued wrapped key.
  - **Persistence:** localStorage. No network surface, so the privacy promise ("never shared, never used for training, never seen by anyone else") holds for the scaffold by construction. Phase E swaps for R2 with no-public ACL.
**Why this approach:** the AGENT_PLAN T-028 spec is "build the secure infrastructure" with **no AI vision call yet** (that's T-030). The pieces of "secure infrastructure" that genuinely need Ratner / clinician review (R2 ACL, vision API key handling, plaintext never persists) can't be wired without R2 credentials and a vision API contract — both of which are Phase E concerns. The scaffold lets us proof-of-concept the UI without putting any real-user data at risk.
**Gate 4 reviewers must verify before approving Phase E start:**
  - [ ] No R2 wiring exists yet (verify in `workers/src/index.ts` and `workers/wrangler.worker.toml`)
  - [ ] No outbound network requests carry scan bytes (verify in `src/lib/scan-storage.ts` and `src/pages/scan/*`)
  - [ ] Verbatim privacy promise matches CLAUDE_v3_PATCH §3 exactly
  - [ ] Delete buttons present on every photo and every session, exercised in `scan-storage.test.ts`
  - [ ] 3-sessions-per-7-days limit enforced client-side (will be re-enforced server-side in Phase E)
  - [ ] Encryption round-trip tested (`scan-storage.test.ts > encryptImage / decryptImage`)
**Phase E (T-029-T-031) checklist installed in `src/lib/scan-storage.ts` top-of-file comment block.**

---
