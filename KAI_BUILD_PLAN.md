# KAI — Complete Build Plan
## Using AGENT_PLAN.md + Our Design System + All 4 Agent Files

---

## Before You Start — Two Things to Do Right Now

**1. Message Evan Ratner:**
Ask him for CLAUDE.md and CLAUDE_v3_PATCH.md. The agent needs these at T-002. While you wait, you can still start — the agent will halt at T-002 and write a blocker, which is fine.

**2. Add these 4 files to the repo root under `/src/server/agents/`:**
- `mental-health-prompt.ts`
- `physical-health-prompt.ts`
- `routing-classifier.ts`
- `body-scan-prompt.ts`

These are ready to go. Drop them in before starting Claude Code.

---

## STEP 1 — Start a fresh Claude Code session

Open Claude Code pointed at the `eratner15/boostai` repo.
Make sure you're on the `feature/kai-v1` branch or can create it.

---

## STEP 2 — Paste this first

```
The app is called KAI. All references to "Aura" anywhere in the codebase, copy, or generated content should be "KAI". The two internal agents are called Mind (mental health) and Body (physical health) but the user always experiences them as one character: KAI.
```

---

## STEP 3 — Paste the kickoff prompt

```
You are the build agent for Project North Star / KAI — an AI wellness companion for teenagers being built by Boost AI.

Your operating instructions are in /AGENT_PLAN.md in the repo root. Read that file end-to-end before doing anything else. It contains:
- Project context and stack
- Universal guardrails that apply to every task
- A 47-task graph organized in 9 phases with 6 mandatory gates
- The loop you'll execute

After reading AGENT_PLAN.md, also read:
- /CLAUDE.md (v2 base spec) — if this file does not exist yet, write a note to BLOCKERS.md and continue
- /CLAUDE_v3_PATCH.md (v3 patch over the base spec) — if this file does not exist yet, write a note to BLOCKERS.md and continue

The agent files for both agents, the routing classifier and body scan prompt are already written and sitting in /src/server/agents/. Read them before starting T-007 and T-008 — use them as the implementation, do not rewrite them.

Then begin task T-001.

Operating mode:
- Work the task graph in dependency order
- Self-verify each task against its Done_when criteria before committing
- Update STATUS.md, BLOCKERS.md, QUESTIONS.md, DECISIONS.md as you go
- Use the branch pattern kai/T-NNN-description for each feature task
- HALT at every GATE marker and wait for explicit approval in STATUS.md
- For tasks marked requires_safety_review: stop and wait for Evan Ratner approval
- For tasks marked requires_lev_input: write the question to QUESTIONS.md and continue with other work

Design system to use throughout the entire build:
Colors: background #0A0A0F, surface #13131A, surfaceElevated #1C1C26, border rgba(255,255,255,0.07), accent #7B6EF6, accentWarm #F0A868, accentCool #68C5B8, textPrimary #F0F0F5, textSecondary rgba(240,240,245,0.55), textMuted rgba(240,240,245,0.3), success #5EBF8A, warning #F0C568, danger #E06B6B

Typography: Fraunces for display and headings, DM Sans for body and UI text, JetBrains Mono for stats and numbers

Animation presets: springSnappy (damping 18, stiffness 300), springGentle (damping 22, stiffness 180), fadeSlideUp (opacity 0 to 1 + translateY 16 to 0, 380ms), scalePress (scale 1 to 0.96 on press)

GlassCard component: backdrop blur intensity 18, rgba(255,255,255,0.04) overlay, 1px border rgba(255,255,255,0.08), border radius 24px. This is the primary card surface used everywhere.

When in doubt, do less. Privacy beats features. Safety beats speed.

Your supervisor is Evan Seder. Evan Ratner has final approval on safety-critical decisions. Lev (16, product owner) has final approval on voice and visual direction.

Begin.
```

---

## STEP 4 — Let the agent run Phase A (T-001 to T-008)

The agent will work autonomously through:
- T-001: Branch setup and status files
- T-002: Read CLAUDE.md and CLAUDE_v3_PATCH.md (will halt here if files missing — unblock by adding files)
- T-003: Tailwind config with glass design tokens
- T-004: App shell and floating glass tabbar
- T-005: Onboarding flow update for two agents
- T-006: Routing classifier wired up (uses our routing-classifier.ts)
- T-007: Mental Health agent prompt (uses our mental-health-prompt.ts)
- T-008: Physical Health agent prompt (uses our physical-health-prompt.ts)

**It will halt at GATE 1 and wait for you.**

---

## STEP 5 — GATE 1 Review (your first approval)

Check before approving:
- [ ] Branch feature/kai-v1 exists and is clean
- [ ] Design tokens render correctly — check the /_design-tokens test page
- [ ] App shell and tabbar look correct on mobile (375px width)
- [ ] Onboarding completes end to end without breaking existing safety/consent flow
- [ ] Routing classifier returns correct results on test messages
- [ ] Both agent prompts are in place — forward to Evan Ratner for safety review
- [ ] Sample responses from each agent feel right — forward to Lev for voice review

When Evan Ratner and Lev both sign off: post `gate-1-approved` in STATUS.md.

---

## STEP 6 — Let the agent run Phase B (T-009 to T-014)

Agent builds the Daily Score system:
- T-009: Database schema for Daily Score (D1 tables)
- T-010: Score calculation engine (mental 40%, sleep 30%, mood 30%)
- T-011: Daily Score component — big number, animated ring, three sub-scores
- T-012: Score detail panels — what contributed, suggestions
- T-013: Score ingestion from all activity sources
- T-014: Recent check-in card on home screen

**Halts at GATE 2.**

---

## STEP 7 — GATE 2 Review

Check before approving:
- [ ] Daily Score renders and matches Lev's Lovable mockup
- [ ] Score updates correctly when you complete a real action
- [ ] Sub-scores (mental, sleep, mood) all calculating correctly
- [ ] Suggestions in detail panel are not preachy or urgent
- [ ] Empty states are friendly
- [ ] Looks correct on mobile

Post `gate-2-approved` in STATUS.md.

---

## STEP 8 — Let the agent run Phase C (T-015 to T-021)

Agent builds Mental Health agent depth:
- T-015: Emotional check-in flow (morning and evening)
- T-016: Journaling mode with agent reflection
- T-017: Sleep awareness and logging
- T-018: Screen time / dopamine awareness
- T-019: Goal setting (identity-based, max 3 active goals)
- T-020: Goal progress tracking with identity reframe at day 7/14/30
- T-021: Mental health pattern recognition (background, runs daily)

**Halts at GATE 3.**

---

## STEP 9 — GATE 3 Review

Check before approving:
- [ ] Check-in and journal flows feel natural and fast
- [ ] Forward 5 sample Mental Health agent responses to Evan Ratner AND Lev for voice review
- [ ] Sleep, screen time and goal features all working
- [ ] Pattern recognition produces useful observations (not creepy)
- [ ] Safety classifier still firing across all flows
- [ ] Agent never uses any of the forbidden phrases from the prompt

Post `gate-3-approved` only after Evan Ratner and Lev both confirm the voice is right.

---

## STEP 10 — Let the agent run Phase D (T-022 to T-028)

Agent builds Physical Health agent features:
- T-022: Food photo logging extended with Physical Health agent commentary
- T-023: Workout logging with agent response
- T-024: Sleep logging (physical recovery side)
- T-025: Hydration tracker
- T-026: Mobility and stretch recommendations library
- T-027: Energy/fatigue check-in
- T-028: Body scan UI scaffold — camera capture, R2 upload, encryption (NO AI vision yet)

**Halts at GATE 4.**

---

## STEP 11 — GATE 4 Review

Check before approving:
- [ ] All physical features working end to end
- [ ] Forbidden language filter catching everything in the test set
- [ ] Body scan UI feels safe, private and clear about what it does
- [ ] Evan Ratner specifically verifies the encryption and R2 access is user-scoped only
- [ ] Lev tests the full physical flow on his actual phone
- [ ] Agent never uses forbidden language on food or body comments

Post `gate-4-approved` only after Evan Ratner signs off on the privacy architecture.

---

## STEP 12 — Let the agent run Phase E (T-029 to T-031) — HIGHEST RISK

Agent builds AI Body Scan:
- T-029: Body scan vision prompt wired up (uses our body-scan-prompt.ts)
- T-030: Vision API integration — decrypt from R2, send to Claude vision, filter output, store observations
- T-031: Body scan history and timeline view

**Halts at GATE 5.**

---

## STEP 13 — GATE 5 Review (most important — do not rush this)

Before approving, ALL of the following must be true:
- [ ] Evan Ratner verifies all guardrails are firing correctly
- [ ] Workers AI gateway has disable_training: true confirmed
- [ ] 20 test images run through the system — 100% compliant outputs
- [ ] Forbidden language filter rejects 100% of forbidden-word attempts
- [ ] Privacy architecture audited end to end
- [ ] A clinician or movement specialist reviews 10 sample outputs (Evan Ratner schedules this)
- [ ] Lev tests the body scan on himself and reports back

Post BOTH `gate-5-approved` AND `clinician-review-complete` in STATUS.md.
Do not approve this gate alone — Evan Ratner must explicitly sign off.

---

## STEP 14 — Let the agent run Phase F (T-032 to T-035)

Agent builds Voice mode:
- T-032: Bland AI account and webhook configuration
- T-033: Voice agent prompts for both agents (shorter, faster, more conversational)
- T-034: Voice safety — real-time transcript safety classifier, crisis handoff on hit
- T-035: In-app voice button and session UI (the glowing orb screen per Lev's reference)

**Halts at GATE 6.**

---

## STEP 15 — GATE 6 Review

Check before approving:
- [ ] Voice call quality is acceptable — no bad latency or crashes
- [ ] Safety classifier working on voice transcripts in near real-time
- [ ] Visual matches Lev's reference image for the orb/waveform screen
- [ ] Lev makes a live test call and confirms the experience
- [ ] Under-16 time blocking working (11pm-6am)

Post `gate-6-approved` in STATUS.md.

---

## STEP 16 — Let the agent run Phase G (T-036 to T-040)

Agent builds Groups:
- T-036: Group schema, creation and invite links (max 8 members, max 3 groups per user)
- T-037: Group dashboard with coarse score buckets only (never exact scores)
- T-038: Encouragement message templates (Lev approves the copy)
- T-039: Opt-in leaderboard (defaults off)
- T-040: Block, leave and report controls

No gate after Phase G — continues automatically.

---

## STEP 17 — Let the agent run Phase H (T-041 to T-045)

Agent handles polish:
- T-041: PWA manifest and add-to-home-screen
- T-042: Widget UI (Daily Score big number + ring)
- T-043: Every empty state across the app — friendly and action-oriented
- T-044: Every error state — never blames the user, always has retry
- T-045: Full accessibility pass (WCAG AA)

No gate after Phase H — continues automatically.

---

## STEP 18 — Let the agent run Phase I (T-046 to T-047)

- T-046: Onboarding tighten pass — target under 90 seconds, 7 questions max
- T-047: Real user test sessions — 5 teens from Lev's network, 30 minutes each, observed

**Agent fixes all P0 and P1 bugs. P2/P3 go to v1.1 backlog.**

---

## STEP 19 — FINAL GATE

Before pushing to production, ALL of this must be true:
- [ ] All P0/P1 bugs from real user testing fixed
- [ ] All 6 gates approved and logged in STATUS.md
- [ ] Final demo to Offy scheduled and confirmed
- [ ] Production deploy plan confirmed with Evan Ratner

**Evan Ratner pushes the production deploy. Not you.**

---

## Your Day-to-Day Role

You do not write code. Your job is:
1. Review agent commits — read the diffs before approving
2. Approve gates — only after checking everything on the checklist
3. Forward questions — Lev questions go to Lev, safety questions go to Evan Ratner
4. Unblock the agent — if something is in BLOCKERS.md, figure out what it needs
5. Demo on Fridays — show what shipped that week
6. Tuesdays at 4pm — teach-up with Evan Ratner

**If you find yourself approving commits without reading them, stop. That's the worst mode.**

---

## The One Thing That Blocks You Right Now

Get CLAUDE.md and CLAUDE_v3_PATCH.md from Evan Ratner.
Everything else is ready to go.
