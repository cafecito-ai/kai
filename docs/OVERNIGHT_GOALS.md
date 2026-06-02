# Kai — Overnight Improvement Goals (client handoff)

Autonomous self-paced loop backlog. Each goal: implement on `kai-improvements`
(off `main`), `npm run worker:typecheck` + `npm test`, deploy to **staging**,
verify, then **prod**, mark done here, move to the next. Verify-before-prod every
time. Stop at staging + flag if a change can't be verified or touches a
protected safety flow in a risky way.

Vision: a **teen super-app** where every part links together and Kai is the front
door — something a teen would open instead of ChatGPT. Brand line:
**"Stop Waiting. Start Becoming."**

Status legend: [ ] todo · [~] in progress · [x] done (prod) · [s] on staging only

---

## Tier 0 — Brand
- [x] **G1. Canonical slogan "Stop Waiting. Start Becoming."** (live on prod: title+meta, Welcome tagline, Landing eyebrow — proper case, verified.) Proper case, as the
  brand line: welcome tagline, Landing hero, Home header eyebrow, and the page
  `<title>`/meta description. One consistent treatment. *Accept:* slogan visible
  (proper case) on `/`, and in the document title on prod.

## Overnight run results (2026-06-02)
- [x] **G1** slogan — prod.
- [x] **G2** food tracking — Claude vision (Haiku, llava fallback) — prod.
- [x] **G3** body scan — VERIFIED end-to-end + privacy intact (disable_training, no image bytes). Claude-vision upgrade = Gate-5 morning item.
- [x] **G4** community — friend-compare enabled (aggregate-only backend), Groups verified — prod.
- [x] **G5/G6** cohesion — check-in "keep talking" seeds Kai with mood+note (via Chat.tsx, safety path intact); chat already sends clientContext (recent activity/score/goals) so Kai references what you did — prod.
- [x] **G8** chat agent — 84→90/100, safety 1/1 (5 prior iterations) — prod.
- [x] **G9** QA sweep — pages render; **FOUND + FIXED a critical prod 401**: authed API was rejecting the no-auth pilot's x-dev-user on prod; now accepted via ALLOW_DEV_USER (no ops granted) — prod.
- [~] **G10** full 100-persona teen-sim report — running.

**Morning flags (human):** body-scan→Claude-vision (Gate 5, clinician/Ratner); chat depth-tuning is Lev's voice call (live, measured-better, confirm/revert); wire real Clerk auth to replace the no-auth pilot (NEXT_STEPS P0); deep chat→feature deep-linking (bigger cohesion feature).

## Tier 1 — Make the core feature sets actually work
- [ ] **G2. Food tracking, for real.** Upgrade food-photo analysis from Workers-AI
  llava to **Claude vision** (accurate item + macro + quality read), keep USDA
  enrichment, persist the meal, feed the daily score, show it in history. Graceful
  fallback to manual entry if vision fails. *Accept:* a real food photo returns
  plausible items+macros, persists, appears on Home, and moves the score.
- [ ] **G3. Body scan, for real.** Verify the 3-photo flow end-to-end → Claude
  vision posture/alignment read (keep `disable_training`, never persist image
  bytes) → result page with 1-2 cues + reassurance. Delete works. *Accept:* a scan
  returns real posture observations, result renders, no raw image stored.
- [ ] **G4. Community.** Safely enable friend-compare (aggregate-only: streak +
  level + weekly-score buckets, never content) and polish Groups (create, join by
  code, coarse-bucket leaderboard, block/leave/report). Invite flow works.
  *Accept:* create a group, join by code, see members' buckets, zero content leak.

## Tier 2 — Super-app cohesion (each part links to the next)
- [ ] **G5. Everything feeds the loop.** Every logged action (workout, food, sleep,
  journal, check-in, scan, goal, mobility) updates the daily score, surfaces on
  Home, and enters Kai's chat context so Kai references it ("saw you logged a
  workout — how'd it feel?"). *Accept:* logging in one feature is reflected on
  Home + score + Kai's next reply.
- [ ] **G6. Chat is the front door.** When Kai suggests an action, deep-link it to
  the actual feature (food log, breathing, goal, scan). Home surfaces the next-best
  action. *Accept:* a chat suggestion opens the right feature route in one tap.
- [ ] **G7. Onboarding → first value.** After onboarding, drop the teen into one
  concrete first move (a goal, a check-in, or a feature) — not a dead dashboard.
  *Accept:* a fresh user finishes onboarding and lands on a clear first action.

## Tier 3 — Chat agent (keep sharpening the killer feature)
- [ ] **G8. Depth without bloat.** Lift `depth_usefulness` (3.36) — make replies
  end with one genuinely concrete, doable next move — without re-inflating
  length/voice. Re-measure with teen-sim. *Accept:* depth_usefulness up, voice_fit
  and overall hold ≥90.

## Tier 4 — Quality & proof
- [ ] **G9. Per-feature QA sweep.** Exercise each page (Home, Chat, Food, Scan,
  Sleep, Workout, Mobility, Journal, Goals, Groups, Progress, Profile, Settings);
  fix broken flows, dead buttons, console errors. *Accept:* each core flow works
  end-to-end with no blocking bug.
- [ ] **G10. Quality proof for the client.** Run the full 100-persona `teen-sim`,
  commit `docs/KAI_TEEN_SIM_REPORT.md` as the handoff quality artifact. *Accept:*
  report committed, overall ≥90, safety 100%.

---

## Done so far (context)
Chat agent **84 → 90/100, safety 1/1** across 5 iterations: session-sticky safety,
depth, one-question discipline, anti-clinical voice, voice/length rebalance,
safety precision. All live on prod; branch `kai-improvements` (PR-able vs `main`).
