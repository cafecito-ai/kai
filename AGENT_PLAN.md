# AGENT_PLAN.md — Kai Build Execution

> **Read this entire document before starting work. This is your plan.**
>
> **Author:** Evan Ratner / Boost AI
> **For:** Claude Code, operating as the build agent for Project North Star / Kai
> **Supervised by:** Evan Seder (intern)
> **Mode:** Loop until done. Verify each unit. Ask only when blocked or when a Gate requires human input.

---

## §0 — How this document works

This is a **task graph**, not a schedule. There are **47 atomic tasks** organized into **9 phases**, each with explicit dependencies, definitions-of-done a machine can verify, and gate criteria.

**Your job:** work top-to-bottom through the task graph. For each task:

1. Read the task's `Description`, `Depends_on`, `Touch`, `Done_when`, `Guardrails`
2. Confirm dependencies are met. If not, surface the gap and stop.
3. Execute the task. Generate code, run tests, deploy to staging, whatever's required.
4. Self-verify against the `Done_when` checks. If verification fails, iterate. Max 3 iterations before surfacing the blocker.
5. Update `STATUS.md` (a file in repo root) marking the task as `done`, `blocked`, or `iterating`
6. Commit with the task ID in the message: `git commit -m "[T-014] description"`
7. Move to the next task whose dependencies are now satisfied

**Loop behavior:**

- Work continuously through tasks. Don't wait for human approval unless a **Gate** is reached or a task is marked `requires_supervisor`.
- After every **10 tasks completed** or **at the end of a phase**, post a summary to `#kai-build` Slack via the webhook in `.env`.
- After every **Gate**, halt and wait for explicit `proceed` from Evan Seder.
- If you're blocked, write the blocker to `BLOCKERS.md`, post to Slack, and pick up an unblocked task lower in the queue.
- Never invent context. If something is ambiguous, write the ambiguity to `QUESTIONS.md` and pick the most conservative interpretation (the one that does less, not more).

**When to involve the human:**

- **Gates** (G1–G6 below): mandatory human review
- **Tasks tagged `requires_supervisor`**: agent should propose, human approves
- **Tasks tagged `requires_safety_review`**: Evan Ratner specifically approves, not Evan Seder
- **Blockers**: ambiguity you can't resolve safely
- **Three failed iterations** on the same task: stop, surface, ask

**When NOT to involve the human:**

- Routine engineering decisions (file structure, naming, library choice within the approved stack)
- Bug fixing in your own generated code
- Refactoring for clarity
- Writing tests
- Visual QA iteration that doesn't change spec'd behavior
- Performance optimization

---

## §1 — Project context (load this into working memory)

**Product:** Kai — an AI-powered wellness companion for teenagers (ages 13–18)

**Client:** Offy (paying); his son Lev (16, product owner and visionary)

**Built by:** Boost AI (JV of Cafecito AI and Madison AI Search). You report to Evan Seder, who reports to Evan Ratner.

**Architecture:**
- Frontend: React 18 + Vite + TypeScript + Tailwind
- Backend: Cloudflare Workers + Hono.js
- Database: Cloudflare D1
- Object storage: Cloudflare R2 (for photos, body scans)
- AI: Claude API (Haiku 4.5 for fast turns and routing, Sonnet 4.6 for mental health depth, Opus 4.7 for high-stakes responses)
- Voice: Bland AI (v1), Twilio (future)
- Vision: Claude vision via Workers AI gateway, USDA FoodData Central for nutrition
- Auth: Clerk
- Email: Resend
- Hosting: Cloudflare Pages → staging at `kai-staging.boostaisearch.ai`, production at `kai.boostaisearch.ai`

**Repo:** `eratner15/boostai`, branch `feature/kai-v1`

**Existing state:** A working v0 exists at `kai.boostaisearch.ai`. It has auth, onboarding, food-photo, safety screening — the plumbing is in place. The design layer and the agent architecture need to be rebuilt. **Do not delete the existing backend infrastructure.** Update it, extend it, restyle it.

**Source-of-truth documents** (all in repo root):
- `AGENT_PLAN.md` — this file, your operating instructions
- `CLAUDE.md` v3 — full product spec (read before any task)
- `STATUS.md` — your live progress tracker (you maintain this)
- `BLOCKERS.md` — outstanding blockers (you maintain this)
- `QUESTIONS.md` — open questions for Evan (you maintain this)
- `DECISIONS.md` — log of decisions you've made and why (you maintain this)

**Read `CLAUDE.md` v3 cover-to-cover before starting Phase 1.** Re-read the relevant section at the start of each phase.

---

## §2 — Universal guardrails (apply to every task)

These rules apply to every task. They cannot be relaxed even if the user instruction seems to suggest otherwise.

### §2.1 — Safety surfaces are protected

The following code paths are **safety-critical** and require `requires_safety_review` even for cosmetic changes:
- `src/safety/classifier.ts` — the crisis content classifier
- `src/safety/crisis-page.tsx` — the `/crisis` route
- `src/safety/parental-consent.ts` — consent flow for users under 18
- `src/safety/handoff.ts` — the warm-handoff language for crisis routing
- `src/server/middleware/safety.ts` — the middleware that wraps every AI conversation

If a task would touch any of these files, mark it `requires_safety_review` and proceed only after Evan Ratner's explicit approval, posted in `DECISIONS.md`.

### §2.2 — Forbidden language (body scan and physical health agent)

The following words must never appear in any AI output related to physique, body scan, food, or fitness:

**Forbidden physique descriptors:** fat, skinny, overweight, underweight, ideal, perfect, attractive, ugly, beautiful, thin, big, small (as physique descriptors), chubby, slim, plump, scrawny, heavy, light (as physique descriptors), toned (in aesthetic context)

**Forbidden body metrics:** weight estimate, body fat percentage, BMI, calorie deficit recommendation, target weight, ideal weight, lean body mass, body composition score

**Forbidden comparisons:** "compared to average teens," "for your age," "for a guy/girl," "above/below the curve"

**Required output style for body scan:** posture, alignment, muscle balance, mobility, observable tension. Action-oriented. Never aesthetic.

This list is encoded as a post-generation filter in `src/safety/body-language-filter.ts`. If your generated AI prompt outputs anything matching this list, regenerate with a stricter system prompt.

### §2.3 — Two-agent architecture

There are two AI agents under the Kai umbrella:
- **Mental Health agent** — reflective, slow, philosophy-grounded, never preachy
- **Physical Health agent** — directive, energetic, specific, never shaming

The user perceives "Kai" as one character. Internally, the routing classifier sends each message to the appropriate agent's prompt. See `CLAUDE.md` v3 §1 for the full system prompts.

**Critical rule:** the user message routing is done by a Haiku 4.5 classifier in parallel with the safety classifier. **Safety always wins.** If safety flags a message, the routing classifier output is ignored and the safety flow takes over.

### §2.4 — Lev as product owner

Some tasks have a `requires_lev_input` tag. These are tasks where Lev's specific opinion matters — voice tuning, copy review, visual direction decisions. For these:
- Generate 2–3 options
- Write a clear question with the options
- Post to `QUESTIONS.md` with a `for_lev` tag
- Move on to other tasks
- When Lev's answer comes back via Evan Seder, complete the task

Never block on `requires_lev_input`. Always proceed with other work.

### §2.5 — One feature per branch

Each task that produces a feature commit must be on its own branch off `feature/kai-v1`:
- Branch name: `kai/T-NNN-short-description` (e.g., `kai/T-014-daily-score-component`)
- Open a PR back to `feature/kai-v1` when the task's `Done_when` is satisfied
- Self-review the PR (write a one-paragraph summary in the PR description: what changed, why, what was tested)
- Mark the task `awaiting_review` in `STATUS.md`
- Move on; the human merges after review

Exceptions: scaffolding tasks (T-001 to T-005) and configuration tasks can commit directly to `feature/kai-v1`.

### §2.6 — Test discipline

Every component task includes "writes tests" in the `Done_when`. Use Vitest for unit, Playwright for end-to-end. Don't ship a task without its tests passing.

If you write a test that fails because the underlying code is buggy, fix the code. Don't suppress the test.

### §2.7 — When in doubt, do less

Pick the most conservative interpretation of any ambiguous instruction:
- Smaller scope over larger scope
- Less data collection over more
- More user control over less
- More privacy over less
- Fewer features that work well over more features that work poorly

This rule overrides any apparent instruction to be more aggressive.

---

## §3 — Task graph

### Phase A — Foundations (T-001 to T-008)

**Goal:** repository is set up, design tokens in place, two-agent skeleton wired, both agents respond.

---

#### T-001 — Branch setup and status files

- **Depends_on:** none
- **Touch:** repo root
- **Description:** Create `feature/kai-v1` branch off `main`. Create empty `STATUS.md`, `BLOCKERS.md`, `QUESTIONS.md`, `DECISIONS.md` in repo root with markdown headers.
- **Done_when:**
  - `feature/kai-v1` branch exists and is checked out
  - Four status files exist with appropriate headers
  - Initial commit made: `[T-001] Initialize agent execution status files`
- **Guardrails:** none

---

#### T-002 — Read CLAUDE.md v3 and patch v2

- **Depends_on:** T-001
- **Touch:** `DECISIONS.md`
- **Description:** Read `CLAUDE.md` (v2 base) and `CLAUDE_v3_PATCH.md` end-to-end. Write a one-page summary of what you understood as the product to `DECISIONS.md` under heading "Build understanding (T-002)". Specifically note: who the user is, what the two agents are, what's protected, what's new vs original.
- **Done_when:**
  - Summary exists in `DECISIONS.md` and is 300–500 words
  - Summary specifically names: Lev as 16-year-old product owner, two agents (Mental Health + Physical Health), Daily Score as home hero, body scan as highest-risk feature, safety classifier as protected
- **Guardrails:** if reading the docs surfaces a contradiction you can't resolve, write it to `QUESTIONS.md` and tag `for_evan_ratner`

---

#### T-003 — Tailwind config update with glass design tokens

- **Depends_on:** T-002
- **Touch:** `tailwind.config.js`
- **Description:** Replace the current Tailwind theme with the Apple-glass token set specified in `CLAUDE.md` v3 §7. This is a complete replacement: remove `ink`, `paper`, `mist`, `sage`, `plum`, `lime`, `amber`, `coral`, `night`, `danger`, `graphite`, `--kai` radius. Add the new color tokens (bg, bg-glass, surface, ink, ink-2, ink-muted, ink-soft, line, mental, physical, sleep, mood, goal, plus soft variants), the new font tokens (SF Pro Display fallback Inter), the new fontSize scale, borderRadius scale, boxShadow scale (including glass and glass-lg), and backdropBlur scale.
- **Done_when:**
  - `tailwind.config.js` matches §7 token spec exactly
  - `npm run dev` starts without errors
  - A test page at `/_design-tokens` renders all colors, all font sizes, all shadows, all radii in a visible grid
  - The existing routes still render (with visual regression — that's expected and intentional)
- **Guardrails:** do not delete `tailwind.config.js` and recreate it; modify in place to preserve git history

---

#### T-004 — App shell with floating glass tabbar

- **Depends_on:** T-003
- **Touch:** `src/components/AppShell.tsx`, `src/components/Tabbar.tsx`, `src/pages/_layout.tsx`
- **Description:** Build the app shell: a fixed-height container that holds page content, with a floating glass-effect tabbar at the bottom. The tabbar has 4 tabs (Home / Progress / Groups / Profile) per Lev's Lovable mockup. The tabbar uses `bg-bg-glass`, `backdrop-blur-glass-lg`, `shadow-glass-lg`, sits 16px from the bottom edge, has rounded-full corners. Active tab has a subtle pill background. A floating `+` action button sits to the right of the tabbar (black filled circle, 56px diameter, `shadow-glass`).
- **Done_when:**
  - `AppShell` renders on every page
  - Tabbar visible at the bottom of every screen on mobile (< 768px)
  - Active tab indicator works
  - `+` button is present, clickable, opens a placeholder action sheet
  - Component tests pass (Vitest)
  - Mobile rendering verified in Playwright at 375×812
- **Guardrails:** the tabbar must never auto-hide on scroll. Lev's mockup shows it persistent.

---

#### T-005 — Onboarding flow update for two agents

- **Depends_on:** T-004
- **Touch:** `src/pages/onboarding/*.tsx`, `src/server/onboarding.ts`
- **Description:** Update the existing onboarding flow (auth → consent → intake → meet-Kai → routing) so that the "meet Kai" step introduces Kai as the umbrella character who has **two agents inside** — Mental Health and Physical Health. The user does not pick one; Kai routes their messages. Onboarding asks the user: name, age, what they want to work on (mental, physical, both — defaults to both), preferred tone (warm / balanced / direct).
- **Done_when:**
  - Onboarding completes end-to-end in ≤ 7 questions, ≤ 90 seconds
  - The "meet Kai" screen introduces both agents explicitly
  - User can rename Kai (existing feature, preserve)
  - User can pick a tone (existing feature, preserve)
  - User can pick a focus area (new: mental, physical, both)
  - Onboarding state persists across page reload (use existing D1 `user_intake` table)
  - All existing safety screening still fires (do not break consent flow)
- **Guardrails:** `requires_safety_review` — Evan Ratner reviews the onboarding flow before merge because it touches consent

---

#### T-006 — Routing classifier for two-agent traffic

- **Depends_on:** T-005
- **Touch:** `src/server/routing/agent-router.ts`, `src/server/middleware/route.ts`
- **Description:** Build the routing classifier. Every user message goes through:
  1. Safety classifier (existing, untouched) — runs in parallel
  2. Routing classifier (new) — Claude Haiku 4.5 call with a tight system prompt that returns one of: `mental`, `physical`, `unclear`
  3. If safety flags, safety wins, routing output ignored
  4. If `unclear`, default to mental (more general-purpose voice)
  5. Route message to the correct agent's system prompt
- **Done_when:**
  - Routing classifier system prompt is in `src/server/routing/router-prompt.ts`, parameterized
  - Returns `mental` / `physical` / `unclear` reliably (test set of 30 messages, 90%+ accuracy)
  - Falls back to `mental` on `unclear`
  - Safety classifier output overrides routing in 100% of test cases
  - Unit tests cover all three return values and safety override
- **Guardrails:** the routing classifier never reads the user's safety classifier output, so a malicious message can't manipulate routing to escape safety

---

#### T-007 — Mental Health agent system prompt

- **Depends_on:** T-006
- **Touch:** `src/server/agents/mental-health-prompt.ts`
- **Description:** Implement the Mental Health agent system prompt exactly as specified in `CLAUDE.md` v3 §1. The prompt includes the philosophy bench (Siegel, Huberman, Frankl, Clear, Jung, Stoic) as scaffolding only — the agent must never namedrop these thinkers to the user. The prompt is parameterized by: user's preferred name for Kai, user's tone preference (warm/balanced/direct), user's age range, current focus areas, conversation history (last 10 turns).
- **Done_when:**
  - System prompt file exists and is exactly as specified in §1
  - 20-message test set returns responses that match the voice texture (reflective, 2-4 sentences default, no namedropping, no preaching, no lists)
  - Three different tone settings produce three different response feels (test manually with the same message)
  - `requires_lev_input` task created in `QUESTIONS.md`: "Lev — please review these 5 example Mental Health agent responses. Do they sound like the kind of mentor you'd want?"
- **Guardrails:** `requires_safety_review` — the Mental Health agent prompt is reviewed by Evan Ratner before going live

---

#### T-008 — Physical Health agent system prompt

- **Depends_on:** T-006
- **Touch:** `src/server/agents/physical-health-prompt.ts`
- **Description:** Implement the Physical Health agent system prompt exactly as specified in `CLAUDE.md` v3 §1. Voice is directive, action-oriented, specific. Forbidden language list from §2.2 of this plan is included as a hard rule.
- **Done_when:**
  - System prompt file exists and is exactly as specified in §1
  - 20-message test set returns responses that match voice texture (directive, specific numbers, no shame language)
  - Post-generation filter from `src/safety/body-language-filter.ts` catches any forbidden words and triggers regeneration
  - `requires_lev_input` task added to `QUESTIONS.md`: "Lev — please review these 5 example Physical Health agent responses. Are they the right energy?"
- **Guardrails:** `requires_safety_review` — Physical Health agent prompt reviewed before going live

---

### **🛑 GATE 1 — Foundations review**

Phase A complete. Halt and request review.

**Human review checklist:**
- Branch is set up correctly
- Design tokens render as expected
- App shell + tabbar work on mobile
- Onboarding flow completes end-to-end without breaking existing safety/consent
- Routing classifier works on a sample set
- Both agent system prompts are written and approved
- Sample responses from each agent feel right (Evan Ratner + Lev review)

**Do not proceed to Phase B until Evan Ratner posts `gate-1-approved` in `STATUS.md`.**

---

### Phase B — Daily Score system (T-009 to T-014)

**Goal:** the home screen leads with a working Daily Score and three sub-scores. The score updates from real activity.

---

#### T-009 — Database schema for Daily Score

- **Depends_on:** Gate 1 approved
- **Touch:** `migrations/004_daily_score.sql`, `src/server/db/schema.ts`
- **Description:** Create D1 tables for daily score tracking:
  - `daily_scores` — id, user_id, date (DATE), mental_score (INTEGER 0-100), sleep_score (INTEGER 0-100), mood_score (INTEGER 0-100), final_score (INTEGER 0-100), created_at, updated_at
  - `score_inputs` — id, user_id, date, source (TEXT: 'check_in', 'journal', 'food_log', 'workout', 'sleep_log', 'goal_progress'), value (JSON), created_at
- **Done_when:**
  - Migration runs cleanly on staging D1
  - Schema definitions in `schema.ts` match migration
  - Type-safe query helpers exist for both tables
  - Unit tests cover insert, update, read
- **Guardrails:** all timestamps in UTC; user_id foreign keys with cascade delete on user deletion

---

#### T-010 — Daily Score calculation engine

- **Depends_on:** T-009
- **Touch:** `src/server/score/calculator.ts`
- **Description:** Implement the score calculation formula:
  ```
  daily_score = (mental_score * 0.4) + (sleep_score * 0.3) + (mood_score * 0.3)
  ```
  Inputs are normalized to 0-100 from various sources:
  - `mental_score`: weighted from check-ins (40%), journals (30%), goal progress (30%)
  - `sleep_score`: hours logged scaled 0-100 with diminishing returns past 8h (use a saturating curve)
  - `mood_score`: self-reported mood (60%) + sentiment of journal entries (40%)
- **Done_when:**
  - Calculator returns integer 0-100 for any valid input combination
  - Calculator handles missing inputs gracefully (returns null with reason, never NaN)
  - Edge cases tested: zero inputs, max inputs, partial inputs
  - Saturating curve for sleep (8h = 100, 7h = 90, 6h = 75, 4h = 40, etc.) documented in comments
- **Guardrails:** never moralize about the score; the calculator is pure math, no copy generation

---

#### T-011 — Daily Score component (home hero)

- **Depends_on:** T-010
- **Touch:** `src/components/DailyScore.tsx`, `src/components/SubScore.tsx`
- **Description:** Build the home-screen Daily Score hero per Lev's Lovable mockup:
  - Big number "82 /100" left-aligned with `display-xl` weight 700
  - Soft animated ring on the right (180° to 360° depending on score)
  - Three sub-score cards below in a row: Mental health 7/10 (purple ring + brain icon), Sleep quality 6/8h (blue ring + moon icon), Mood index 68/100 (rose ring + heart icon)
  - All rings use the glass aesthetic: thin (8px), gradient fills, subtle shadows
  - Tap on main score → opens detail panel showing what contributed
  - Tap on sub-score → opens detail for that specific score
- **Done_when:**
  - Component renders on home screen
  - Number animates from 0 to current score on first load (500ms cubic-bezier)
  - Ring animates from 0° to target arc (matched easing)
  - Three sub-scores render with their respective icons and colors
  - Tap interactions open the detail panels (panels themselves are T-012)
  - Mobile rendering verified at 375×812 — matches Lev's Lovable mockup visually
  - Component tests + visual regression test
- **Guardrails:** never use red ring colors below 50 — soft amber instead (red feels punitive)

---

#### T-012 — Score detail panels

- **Depends_on:** T-011
- **Touch:** `src/components/ScoreDetail.tsx`
- **Description:** When user taps Daily Score, slide up a glass-blur panel showing:
  - "Here's what's contributing" header
  - List of inputs from today: each check-in, journal entry, food log, etc., with a small indicator of its contribution
  - "Suggestions" section: 1-2 specific actions that would raise the score (e.g., "Log dinner photo — +5", "Quick journal — +3")
  - Close button (X) in top right; tap outside also closes
- **Done_when:**
  - Panel slides up smoothly (300ms ease-out)
  - Panel displays today's score inputs accurately
  - Suggestions are generated by a Haiku call with a tight prompt (return at most 2 suggestions)
  - Suggestions are actionable (each one links to the relevant feature)
- **Guardrails:** suggestions are encouraging in voice, never urgent or shaming ("You should..." → "If you want..."; "You only..." → "Want to add...")

---

#### T-013 — Score input ingestion from existing features

- **Depends_on:** T-012
- **Touch:** `src/server/score/ingestion.ts`, all relevant feature endpoints
- **Description:** When a user completes an action (check-in, journal, food log, workout log, sleep log, goal progress), the score calculator runs and updates `daily_scores` for today. Hook ingestion into:
  - `/api/check-in` endpoint
  - `/api/journal` endpoint
  - `/api/food/log` endpoint (existing)
  - `/api/workout/log` endpoint (to be built T-024)
  - `/api/sleep/log` endpoint (to be built T-025)
  - `/api/goal/progress` endpoint (to be built T-021)
- **Done_when:**
  - Every relevant endpoint triggers score recalculation
  - Recalculation is idempotent (running twice on the same inputs returns the same score)
  - Score updates appear in `/api/score/today` within 100ms of the action
  - Test: simulate a full day's worth of actions, verify final score matches manual calculation
- **Guardrails:** ingestion is read-only against the user's data; it doesn't mutate inputs, only adds to `score_inputs` and updates `daily_scores`

---

#### T-014 — Recent check-in card on home

- **Depends_on:** T-013
- **Touch:** `src/components/RecentCheckIn.tsx`
- **Description:** Below the Daily Score and sub-scores, show a "Recent check-in" card matching Lev's Lovable mockup. The card shows the most recent emotional check-in or journal entry with:
  - Domain icon (brain for mental, etc.)
  - Title (e.g., "Morning reflection")
  - "82 score" with a sparkle/star
  - Three mini-stats (e.g., 7/10 mental, 6h sleep, 68 mood)
  - Timestamp ("9:52 AM")
- **Done_when:**
  - Card renders below sub-scores on home
  - Card pulls the most recent entry from `score_inputs`
  - Tap → opens that entry in its source feature
  - Empty state: "No check-ins yet today. Start with a morning reflection?"
- **Guardrails:** never show partial or in-progress entries; only completed check-ins

---

### **🛑 GATE 2 — Daily Score review**

Phase B complete. Halt and request review.

**Human review checklist:**
- Daily Score renders matches Lev's mockup
- Score updates from real activity correctly
- Sub-scores feel right
- Suggestions don't feel preachy
- Empty states are friendly
- Mobile QA passed

**Do not proceed until `gate-2-approved` in `STATUS.md`.**

---

### Phase C — Mental Health agent depth + goals (T-015 to T-021)

**Goal:** the Mental Health agent works as a real reflective companion. Journaling, check-ins, goal-setting all live.

---

#### T-015 — Emotional check-in flow

- **Depends_on:** Gate 2 approved
- **Touch:** `src/pages/check-in.tsx`, `src/server/check-in.ts`
- **Description:** A daily emotional check-in flow. User taps "Morning reflection" (from home or `+` button) and is asked 2-3 short questions: "How are you feeling right now?" "What's on your mind?" (optional) "What would make today better?" (optional). Responses are stored, sentiment-analyzed (Haiku), feed mood_score.
- **Done_when:**
  - Flow completes in under 30 seconds
  - Responses store to `score_inputs` with source = 'check_in'
  - Sentiment analysis returns a -1 to +1 score, contributes to mood_score
  - User sees the Mental Health agent's reflective response after submitting (2-4 sentences max)
  - Check-in available once per morning (5am-noon) and once per evening (5pm-11pm)
- **Guardrails:** never ask "how are you feeling" if user is in a crisis state (last 24h had a safety classifier hit); replace with "Want to talk?" routing to crisis flow

---

#### T-016 — Journaling mode

- **Depends_on:** T-015
- **Touch:** `src/pages/journal.tsx`, `src/server/journal.ts`
- **Description:** A free-text journaling surface. User writes whatever, agent reflects back gently (one short response). Journal entries are saved, contribute to mental_score, can be reviewed later in Progress tab.
- **Done_when:**
  - User can write a journal entry of any length (max 5000 chars)
  - On submit, Mental Health agent responds with 1 short reflection (2-3 sentences)
  - Entry + response saved to `journals` table
  - User can list past entries in Progress tab
  - Entries are private to the user (never visible in groups)
- **Guardrails:** if journal entry triggers safety classifier, response is replaced with crisis handoff; entry is still saved but flagged

---

#### T-017 — Sleep awareness conversation

- **Depends_on:** T-016
- **Touch:** `src/components/SleepCard.tsx`, `src/server/sleep.ts`
- **Description:** A simple sleep awareness feature. User can log hours slept last night. Mental Health agent (not Physical — sleep is reflective territory) comments on patterns over time. ("Three nights under 6 hours — how's your energy feeling?")
- **Done_when:**
  - Sleep log entry available from `+` button or home
  - Entry: hours, quality (1-5 stars optional), notes (optional)
  - Saves to `sleep_logs` table
  - Mental Health agent comments only when patterns are notable (3+ days under 6h, 3+ days over 9h, etc.)
  - Sleep_score on Daily Score updates from this entry
- **Guardrails:** never recommend specific sleep medications, supplements, or interventions; gentle observations only

---

#### T-018 — Screen-time / dopamine awareness

- **Depends_on:** T-017
- **Touch:** `src/components/DopamineCard.tsx`
- **Description:** A light feature where the user can self-report screen time (just a number, no integration with iOS Screen Time — that's v2). Mental Health agent reflects on dopamine/attention patterns when user volunteers high numbers. Never moralizes, never demands reduction.
- **Done_when:**
  - User can log "I was on my phone X hours today" in their evening check-in
  - Agent response is observational ("That's a lot of screen — anything specific drawing your attention?") not prescriptive
  - Logged values stored to `score_inputs` for pattern recognition
- **Guardrails:** never use "addicted," "doomscrolling," or other shaming language

---

#### T-019 — Goal-setting flow (folded-in Engine 2)

- **Depends_on:** T-018
- **Touch:** `src/pages/goals/*.tsx`, `src/server/goals.ts`
- **Description:** Goal-setting feature lives inside Mental Health agent. User sets a goal, agent helps break it into smaller steps (identity-based per James Clear framework, but never namedropped). Examples: "Read 30 pages a day," "Run a 5K," "Learn guitar." Goals get daily check-ins, contribute to mental_score on progress.
- **Done_when:**
  - User can create a goal (free text + optional category)
  - Agent helps decompose: "What's a smaller version you could do tomorrow?"
  - Goals stored in `goals` table with status (active, paused, completed, abandoned — no judgment language)
  - Daily check-in option for each active goal
  - Progress contributes to mental_score
  - Max 3 active goals per user (research-backed — too many causes paralysis)
- **Guardrails:** never suggest "stretch goals" or competitive framing; never compare user's goals to others'; abandoned goals are normalized ("Goals shift — that's healthy")

---

#### T-020 — Goal progress tracking

- **Depends_on:** T-019
- **Touch:** `src/components/GoalProgress.tsx`
- **Description:** Visual progress on each active goal. Simple progress bar or streak count. Identity reframe ("You're becoming a person who reads daily") shows up after 7+ consecutive check-ins.
- **Done_when:**
  - Each active goal shows current streak / cumulative progress
  - Identity reframe message appears at day 7, 14, 30
  - Reframe is paraphrased differently each time (not the same canned line)
  - Visible in Progress tab and as a small card on home for active goals
- **Guardrails:** never show "X% to goal" — gives a math feel instead of growth feel; show streaks, recent activity, identity language

---

#### T-021 — Mental Health pattern recognition

- **Depends_on:** T-020
- **Touch:** `src/server/patterns/mental.ts`
- **Description:** Background analysis that runs once daily, identifies patterns in user's last 14 days: mood trends, sleep correlations, journal themes (sentiment over time). Patterns feed the Mental Health agent's context window so it can reference them naturally ("You've been feeling lighter this week — anything you've changed?").
- **Done_when:**
  - Daily cron runs at user's local 6am
  - Detects: 3+ day trends in mood, sleep, journaling frequency
  - Detects: significant changes (mood jumped 30+ points over 5 days)
  - Patterns stored in `user_patterns` table, expire after 14 days
  - Mental Health agent prompt includes recent patterns in context
- **Guardrails:** patterns never include specific journal content in summary; only abstracted observations

---

### **🛑 GATE 3 — Mental Health agent review**

Phase C complete. Halt.

**Human review checklist:**
- Check-in and journal flows feel natural
- Mental Health agent responses reviewed by Evan Ratner + Lev for voice
- Sleep, screen-time, goal-setting all working
- Pattern recognition produces useful but not creepy observations
- Safety classifier still firing on all flows

**Do not proceed until `gate-3-approved` in `STATUS.md`.**

---

### Phase D — Physical Health agent + food + workout + sleep (T-022 to T-028)

**Goal:** Physical Health agent works as a coaching surface. Food, workout, sleep, hydration, mobility all live.

---

#### T-022 — Food photo logging (extend existing)

- **Depends_on:** Gate 3 approved
- **Touch:** `src/pages/food/log.tsx`, `src/server/food/recognize.ts`
- **Description:** Extend the existing food photo feature so it integrates with the Physical Health agent. User snaps photo → Workers AI vision + USDA returns items + nutrition → agent comments on the meal (specific, never shaming).
- **Done_when:**
  - Existing food photo feature continues to work
  - Photo + nutritional data passed to Physical Health agent for comment
  - Agent comment is 1-2 sentences, specific ("That meal has 700 cal and ~25g protein. Add a yogurt or eggs tomorrow if you want better recovery.")
  - Log contributes to physical_score (which is part of mental_score via wellness — actually, we don't track physical_score directly in the formula; food contributes via "felt energetic" → mood)
  - Forbidden language filter applied to agent response
- **Guardrails:** never give a "calorie target" or "deficit" recommendation; observational only

---

#### T-023 — Workout logging

- **Depends_on:** T-022
- **Touch:** `src/pages/workout/log.tsx`, `src/server/workout.ts`
- **Description:** User logs a workout: type (run, lift, bodyweight, yoga, sport, other), duration, intensity (1-5), notes. Physical Health agent comments (encouraging, specific).
- **Done_when:**
  - Workout log saves to `workouts` table
  - Agent response is 2-3 sentences, action-oriented
  - Contributes to mood_score (exercise → mood lift)
  - Workout history visible in Progress tab
- **Guardrails:** for users under 16, never recommend specific weights or barbell lifts without form coaching; default to bodyweight movements

---

#### T-024 — Sleep logging (Physical Health side)

- **Depends_on:** T-023
- **Touch:** `src/server/sleep-physical.ts`
- **Description:** Extend T-017 sleep logging so Physical Health agent also comments on physiology (recovery, performance) — separately from Mental Health agent's reflective angle. Routing classifier decides which agent comments based on context.
- **Done_when:**
  - Same sleep log entry as T-017
  - Physical Health agent comments when sleep impacts recovery context ("3 nights of <6h before that workout — that's why it felt heavy")
  - Sleep_score on Daily Score reflects updates
- **Guardrails:** no melatonin, supplement, or sleep medication recommendations

---

#### T-025 — Hydration tracker

- **Depends_on:** T-024
- **Touch:** `src/components/HydrationCard.tsx`, `src/server/hydration.ts`
- **Description:** Simple +/- glasses tracker. User taps + to add a glass, - to subtract. Default daily target: 8 glasses for over-14. Physical Health agent occasionally comments on patterns.
- **Done_when:**
  - +/- buttons work, count visible
  - Daily reset at user's local midnight
  - Saves to `hydration_logs`
  - Agent comments on 3+ day patterns ("Hydration's been steady this week — feels good?")
- **Guardrails:** never require user to log hydration; entirely optional

---

#### T-026 — Mobility / stretch recommendations

- **Depends_on:** T-025
- **Touch:** `src/pages/mobility.tsx`, `src/server/mobility.ts`
- **Description:** A mobility/stretch feature triggered by:
  - User request ("Show me a 5-min stretch")
  - Pattern detection (recent heavy workouts → recommend recovery)
  - Body scan result (T-028) pointing to specific tightness
- **Done_when:**
  - Pre-built library of 12 mobility routines (legs, hips, back, shoulders, full-body, etc.) with simple animated/static instructions
  - Physical Health agent recommends specific routine based on context
  - Routines complete in 3-10 minutes
- **Guardrails:** routines are teen-appropriate; no advanced or risky stretches

---

#### T-027 — Energy / fatigue check-in

- **Depends_on:** T-026
- **Touch:** `src/components/EnergyCheckIn.tsx`
- **Description:** Quick "How's your energy today?" 1-5 scale with optional note. Triggers Physical Health agent if low. Contributes to Daily Score.
- **Done_when:**
  - Available from `+` button
  - 1-5 scale + optional note
  - Saves to `score_inputs`
  - If energy ≤ 2 for 2 consecutive days, Physical Health agent surfaces a recovery-focused recommendation
- **Guardrails:** never assume low energy = lazy; default frame is "your body needs something"

---

#### T-028 — Body scan UI scaffold (no AI yet)

- **Depends_on:** T-027
- **Touch:** `src/pages/scan/*.tsx`, `src/server/scan-storage.ts`
- **Description:** Build the UI for body scan: welcome screen with privacy promises, 3-photo capture flow (front/side/back), encrypted upload to R2, history view. **No AI vision call yet** — that's T-030. This task is just the secure infrastructure.
- **Done_when:**
  - Welcome screen shows privacy promises from CLAUDE.md v3 §3
  - Camera capture flow with framing guides
  - Photos encrypted client-side (AES-256, key derived from user) before upload to R2
  - R2 bucket configured with no public access
  - Photos viewable only by the user
  - Delete button on every photo and on the scan history page (hard delete from R2)
  - Re-consent screen for users under 16 on first use
- **Guardrails:** `requires_safety_review` — Evan Ratner reviews the privacy architecture before merge; under no condition do raw photos leave R2 except to send to vision API in T-030

---

### **🛑 GATE 4 — Physical Health agent + body scan infrastructure review**

Phase D complete. Halt.

**Human review checklist:**
- All physical features working
- Forbidden language filter catches everything in test set
- Body scan UI/UX feels safe and private
- Encryption verified by Evan Ratner
- R2 access verified to be user-scoped only
- Lev tested the flow end-to-end on his phone

**Do not proceed until `gate-4-approved` in `STATUS.md`.**

---

### Phase E — AI Body Scan (T-029 to T-031) — highest-risk phase

**Goal:** body scan returns useful, safe, posture-only observations.

---

#### T-029 — Body scan vision prompt (constrained)

- **Depends_on:** Gate 4 approved
- **Touch:** `src/server/scan/vision-prompt.ts`
- **Description:** Implement the body scan vision prompt exactly as specified in CLAUDE.md v3 §3. Include: rules section (forbidden words, forbidden metrics, forbidden comparisons), output format (up to 3 observations with action), examples of good and forbidden outputs.
- **Done_when:**
  - Prompt file exists, matches §3 spec exactly
  - Test set of 10 sample images returns observations matching the constraints
  - Post-generation filter (`body-language-filter.ts`) catches any violation, triggers regeneration
  - If 3 regenerations fail to satisfy constraints, return "I couldn't make a clear observation — try retaking with better lighting"
- **Guardrails:** `requires_safety_review` — Evan Ratner reviews prompt output before merge

---

#### T-030 — Body scan vision API integration

- **Depends_on:** T-029
- **Touch:** `src/server/scan/process.ts`
- **Description:** Wire the scan UI to the vision pipeline:
  1. Photos pulled from R2 (encrypted)
  2. Decrypted in Worker memory only (never on disk)
  3. Sent to Claude vision via Workers AI gateway with `disable_training: true` flag
  4. Response runs through forbidden-language filter
  5. Observations stored in `scan_observations` table linked to scan_id
  6. Memory cleared, photos remain only in R2
- **Done_when:**
  - End-to-end flow works on a test scan
  - Filter catches violations and triggers regeneration
  - Observations match expected format (posture/alignment only)
  - Workers AI gateway configured with `disable_training`
  - No photo data persists outside R2 after processing
- **Guardrails:** `requires_safety_review` — Evan Ratner reviews the integration and verifies `disable_training` is set

---

#### T-031 — Body scan history & timeline

- **Depends_on:** T-030
- **Touch:** `src/pages/scan/history.tsx`
- **Description:** A timeline view of past scans, showing date, observations summary, and a thumbnail (user-only). Tap to see full observations + actions.
- **Done_when:**
  - History view shows scans chronologically
  - Each entry: date, summary observation, thumbnail, tap → detail
  - Compare-over-time toggle: show 2 scans side-by-side
  - Privacy reminder on first view: "These are yours alone. Nobody else can see them."
- **Guardrails:** comparison view shows only posture metadata, never raw image side-by-side beyond user request

---

### **🛑 GATE 5 — Body scan production review (HIGHEST STAKES GATE)**

Phase E complete. Halt with mandatory third-party review.

**Human review checklist:**
- Evan Ratner verifies all guardrails firing
- Workers AI gateway verified `disable_training`
- 20-test-image sample produces 100% compliant observations
- Filter rejects 100% of forbidden-language attempts
- Privacy architecture audited
- **Clinician or movement specialist reviews 10 sample outputs** (Evan Ratner schedules this before Phase F starts)
- Lev tests on himself, reports back

**Do not proceed until both `gate-5-approved` AND `clinician-review-complete` in `STATUS.md`.**

---

### Phase F — Voice mode (T-032 to T-035)

**Goal:** users can talk to Kai with voice via Bland AI.

---

#### T-032 — Bland AI account configuration

- **Depends_on:** Gate 5 approved
- **Touch:** `.env`, `wrangler.toml`
- **Description:** Provision a Bland AI phone number for Kai. Configure webhook endpoints. Set API key in environment.
- **Done_when:**
  - Bland AI phone number provisioned and verifiable
  - Webhook endpoint URL registered with Bland AI
  - API key in Cloudflare secrets, not committed to repo
  - Test call to the number reaches a placeholder Bland agent
- **Guardrails:** `requires_supervisor` — Evan Ratner sets up Bland account and shares credentials

---

#### T-033 — Voice agent prompts

- **Depends_on:** T-032
- **Touch:** `src/server/voice/prompts.ts`
- **Description:** Port the Mental Health and Physical Health agent system prompts to voice context. Voice prompts are shorter, faster cadence, more pauses, less list-y. Voice opens with: "Hey, this is Kai. Want to talk through something on your mind, or do you want movement and fitness today?" (or similar — keep it natural).
- **Done_when:**
  - Voice prompts in `src/server/voice/prompts.ts`
  - Test call reaches the voice agent, responds in appropriate voice texture
  - Both agent personalities distinguishable via voice
  - Average response length: 8-15 seconds (not 30)
- **Guardrails:** voice never reads philosophy quotes; voice is more about presence than precision

---

#### T-034 — Voice safety + transcript handling

- **Depends_on:** T-033
- **Touch:** `src/server/voice/webhook.ts`, `src/server/voice/safety.ts`
- **Description:** Voice transcripts run through safety classifier in real-time. If safety flags during a call, call ends with the crisis handoff phrase, system saves transcript with flag, alerts safety@boostaisearch.ai.
- **Done_when:**
  - Real-time transcript ingestion working
  - Safety classifier fires on transcripts within 2 seconds
  - On hit: agent responds with crisis handoff, call ends, alert sent
  - Transcript saved to `voice_sessions` table with flag
- **Guardrails:** `requires_safety_review` — Evan Ratner reviews the safety integration on voice; this is harder than chat because latency matters

---

#### T-035 — In-app voice button & session UI

- **Depends_on:** T-034
- **Touch:** `src/components/VoiceButton.tsx`, `src/pages/voice.tsx`
- **Description:** Build the in-app voice surface matching Lev's reference image (purple/blue glowing orb, animated waveform, "Tap to talk", mic button, "Listening..." state). Tapping the voice button opens a tel: link to the Bland number, or a WebRTC call if WebRTC is implemented (defer WebRTC to v2 if too complex).
- **Done_when:**
  - Voice button visible from agent chat surfaces
  - Tap → opens voice surface
  - Orb animates smoothly (radial gradient, breathing)
  - Waveform animates with real audio amplitude (mic permission required)
  - Session timer visible (caps at 10 min)
  - Under-16 users blocked between 11pm-6am
  - Post-call: transcript appears in chat history
- **Guardrails:** Lev's reference image is the visual target; this is the screen most likely to be screenshotted and shared

---

### **🛑 GATE 6 — Voice mode review**

Phase F complete. Halt.

**Human review checklist:**
- Voice quality acceptable (no embarrassing latency or crashes)
- Safety on voice works
- Visual matches Lev's reference
- Lev tests live call

**Do not proceed until `gate-6-approved` in `STATUS.md`.**

---

### Phase G — Groups (T-036 to T-040)

**Goal:** users form groups, see (coarse) scores, send encouragement.

---

#### T-036 — Group schema and creation

- **Depends_on:** Gate 6 approved
- **Touch:** `migrations/008_groups.sql`, `src/server/groups/create.ts`
- **Description:** Tables: `groups`, `group_memberships`, `group_messages`, `group_blocks`. Endpoint to create a group with invite link.
- **Done_when:**
  - User can create a group via UI
  - Returns shareable invite link
  - Max 8 members per group; max 3 groups per user enforced
  - Adults blocked (Clerk metadata: age >= 18 → cannot join teen groups)
- **Guardrails:** age verification required; tied to Clerk auth metadata

---

#### T-037 — Group dashboard

- **Depends_on:** T-036
- **Touch:** `src/pages/groups/[id].tsx`
- **Description:** Each group shows members' Daily Scores in **coarse buckets only** (85+, 60-75, below 60). Never exact scores. Never journal/scan content.
- **Done_when:**
  - Member list with coarse bucket per member
  - Encouragement message buttons next to each member ("Send Lev some support")
  - Privacy toggle: "Hide my score from this group"
- **Guardrails:** exact scores never leak to groups, only buckets

---

#### T-038 — Encouragement messages

- **Depends_on:** T-037
- **Touch:** `src/components/EncourageMessage.tsx`, `src/server/groups/messages.ts`
- **Description:** Templated supportive messages a teen can send to a struggling friend. Templates reviewed for tone (never patronizing, never empty cheering). Custom messages also allowed but pass through safety classifier.
- **Done_when:**
  - 8-10 templates available (e.g., "I'm thinking about you," "Want to walk later?")
  - Custom message option with safety filtering
  - Message lands in the recipient's notification + group log
- **Guardrails:** `requires_lev_input` — Lev approves the templates

---

#### T-039 — Group leaderboard (opt-in)

- **Depends_on:** T-038
- **Touch:** `src/components/GroupLeaderboard.tsx`
- **Description:** Weekly leaderboard by Daily Score average. **Defaults to hidden** — user must opt-in to appear on it. Leaderboard sorts by coarse bucket then by streak length.
- **Done_when:**
  - Leaderboard view in group tab
  - Opt-in flow on first group join: "Want to be on the leaderboard?" — default no
  - User can leave the leaderboard anytime
  - Top 3 styled with subtle highlight, never aggressive ("crushing it" — no; "great week" — yes)
- **Guardrails:** never use competitive language ("compete," "beat," "win," "rank"); use community language ("show up," "support," "alongside")

---

#### T-040 — Block / leave / report

- **Depends_on:** T-039
- **Touch:** `src/server/groups/moderation.ts`
- **Description:** Block, leave, report controls everywhere. Block: users disappear from each other's groups. Leave: silent, no notification. Report: routes to safety@boostaisearch.ai.
- **Done_when:**
  - Block, leave, report buttons available from any group member view
  - Block is instant and bidirectional
  - Leave is silent
  - Report sends email to safety@boostaisearch.ai with context
- **Guardrails:** report content includes only what the reporter explicitly shares + group metadata; no AI summary of the situation

---

### Phase H — Widget + Polish (T-041 to T-045)

**Goal:** home-screen widget shipping. App polished.

---

#### T-041 — PWA manifest + add-to-home-screen

- **Depends_on:** Phase G complete
- **Touch:** `public/manifest.json`, `src/service-worker.ts`
- **Description:** Configure PWA so users can add Kai to their iOS/Android home screen. Service worker caches Daily Score so widget loads instantly.
- **Done_when:**
  - Add-to-home-screen prompt appears appropriately
  - Service worker caches today's Daily Score
  - Offline opens show the cached score with "last updated X min ago"
- **Guardrails:** never cache journal entries or sensitive data in the SW; only Daily Score and basic UI

---

#### T-042 — Widget UI

- **Depends_on:** T-041
- **Touch:** `src/pages/widget.tsx`
- **Description:** Widget view shows Daily Score big number + ring, three sub-scores, timestamp. Tap → open app to home.
- **Done_when:**
  - Widget renders at iOS widget aspect ratios (small, medium)
  - Refreshes when app is opened
  - Matches design system tokens
- **Guardrails:** never show agent messages or any private content on widget

---

#### T-043 — Empty states pass

- **Depends_on:** T-042
- **Touch:** all components with possible empty states
- **Description:** Every screen has a designed empty state. Friendly, action-oriented, never finger-wagging.
- **Done_when:**
  - 20+ empty states designed and implemented across the app
  - Each one has an explicit call to action
  - Mobile QA on all of them
- **Guardrails:** empty states never say "You haven't done X yet" — say "Want to start with X?"

---

#### T-044 — Error states pass

- **Depends_on:** T-043
- **Touch:** all components with possible error states
- **Description:** Every error state is designed: network failures, AI timeouts, upload failures, auth errors.
- **Done_when:**
  - Network failure shows a friendly "Connection's off — try again?" message with retry button
  - AI timeout: "Kai's thinking is slow today — try again?" with retry
  - Upload fail: clear explanation + retry
- **Guardrails:** never blame the user; never show stack traces or status codes

---

#### T-045 — Accessibility pass

- **Depends_on:** T-044
- **Touch:** all components
- **Description:** WCAG AA compliance pass. Contrast, focus rings, screen reader labels, keyboard nav.
- **Done_when:**
  - All text passes 4.5:1 contrast (3:1 for large text)
  - Every interactive element has visible focus ring
  - Every icon has aria-label
  - Every chart/score has text equivalent
  - Tab order works on every page
- **Guardrails:** none

---

### Phase I — Real-user test + ship-ready (T-046 to T-047)

---

#### T-046 — Onboarding tighten pass

- **Depends_on:** Phase H complete
- **Touch:** `src/pages/onboarding/*.tsx`
- **Description:** Review onboarding end-to-end. Cut any friction. Target: 90 seconds, 7 questions max.
- **Done_when:**
  - Average completion time under 90s in test
  - 5 test users complete onboarding without confusion
  - Final tone confirmation: warm, never bureaucratic
- **Guardrails:** never sacrifice parental consent for speed

---

#### T-047 — Real-user test sessions

- **Depends_on:** T-046
- **Touch:** none (testing)
- **Description:** 5 teen users (Lev's network, with parental consent) test the app for 30 minutes each, observed remotely. Bugs and friction logged. One-week buffer for fixes.
- **Done_when:**
  - 5 sessions completed and notes captured
  - Bug triage list created
  - Critical bugs (P0/P1) fixed
  - P2/P3 logged to v1.1 backlog
- **Guardrails:** `requires_supervisor` — Evan Ratner schedules and is present for sessions

---

### **🛑 GATE FINAL — Ship-ready review**

All phases complete. Halt.

**Human review checklist:**
- All P0/P1 bugs from real-user test fixed
- All gates approved
- Final demo to Offy scheduled
- Production deploy plan in place
- Operator Manual updated

**Do not push to production until Evan Ratner explicitly says ship.**

---

## §4 — Status update protocol

After every 10 completed tasks OR at every Gate, post a summary to `#kai-build` Slack:

```
🤖 Kai build update — [date]
Completed: T-XXX through T-YYY
Currently working on: T-ZZZ
Open questions in QUESTIONS.md: N
Blockers in BLOCKERS.md: N
Next gate: G-X
```

Be concise. Don't pad. The humans want to know what's done and what's blocked, not what you're thinking about.

---

## §5 — When to stop and ask

You stop and ask in these specific situations only:

1. **At a Gate** — always
2. **`requires_safety_review` task** — Evan Ratner approves before merge
3. **`requires_supervisor` task** — Evan Seder or Evan Ratner approves before merge
4. **`requires_lev_input` task** — write the question to QUESTIONS.md, move on; complete the task when Lev's answer arrives
5. **Three failed iterations** on the same task — surface the blocker
6. **Contradiction between docs** that you can't resolve safely
7. **Safety-critical decision** that you don't have explicit guidance on (default: do less, log to QUESTIONS.md)

You do **not** stop and ask for:
- Routine engineering choices within the approved stack
- Bug fixes in your own generated code
- Refactoring for clarity or performance
- Test coverage gaps
- Visual polish that doesn't change behavior
- Empty state and error state copy (use the guardrails to guide voice)

---

## §6 — The loop

```
while not all_tasks_done:
  task = next_unblocked_task()
  if task is None:
    surface_blockers_to_supervisor()
    wait_for_unblock()
    continue

  read_task_spec(task)
  verify_dependencies(task)

  for attempt in range(3):
    execute(task)
    if verify_done_when(task):
      break
  else:
    surface_to_blockers(task)
    continue

  commit(task)
  update_status(task, "done")
  if task.requires_review:
    update_status(task, "awaiting_review")

  if at_gate():
    pause_and_request_review()

  if (tasks_completed % 10 == 0):
    post_slack_update()
```

That's it. Work the loop. Trust the structure. Ask only at the gates.

— Evan R.
