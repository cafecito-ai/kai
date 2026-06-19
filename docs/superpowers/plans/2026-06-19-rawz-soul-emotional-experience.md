# Rawz "Soul" — Onboarding & Emotional Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Rawz/KAI *feel* like "Kai knows who I'm trying to become" by wiring the identity data we already capture into every surface, and building the missing emotional moments (identity-first home, comeback, reflection, callbacks, friends).

**Architecture:** Each phase is one independently-shippable PR that auto-deploys on merge (`deploy.yml`). Device-local identity (`local-identity.ts`, `local-northstar.ts`) stays the source of truth; we surface it on Home, inject it into Kai's chat context (`kai-client-context.ts` → `prompts/kai.ts`), and add a small number of new screens. No new backend tables until Phase G.

**Tech Stack:** React 18 + Vite + TS + Tailwind (frontend), Cloudflare Workers + Hono + D1 (backend), Vitest for tests. Node 20 locally (`nvm use 20`), Node 22 in CI.

**Build/verify commands (run from `/home/eratner/kai-work`, `nvm use 20` first):**
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Targeted tests: `npx vitest run <path>`
- Lint changed file: `npx eslint <path>`

**Known-flaky baseline (ignore — fail on `main`, pass in CI):** `src/lib/scan-storage.test.ts` (3 jsdom `crypto.subtle` cases).

**Spec → Phase map:**
| Spec item | Phase |
|---|---|
| #3 Kai memory (identity/origin injection) | A |
| #2 Identity Hero on Home, #7 identity-not-tracking, no generic greeting | B |
| #5 Comeback screen | C |
| Onboarding 2/3 (split identity vs origin), Onboarding 5 (Meet Kai copy/flow) | D |
| #4 Origin-story callbacks, #11 open loops | E |
| #6 Progress reflection, #8 progress-they-can't-see | F |
| #9 Friend accountability feed, #10 friend challenges | G |

---

## Phase A — Kai actually knows your identity (#3)

**Why first:** The data (goal name, identity statement, origin story, days-building) is already stored; it's just never sent to Kai. Cheapest path to the core feeling.

**Files:**
- Modify: `src/lib/kai-client-context.ts` (add an `identity` block to `KaiClientContext` + builder)
- Modify: `workers/src/lib/prompts/kai.ts` (render the identity block in the system prompt)
- Test: `src/lib/kai-client-context.test.ts` (create if absent)

- [ ] **A1: Failing test for identity in client context**

Create/extend `src/lib/kai-client-context.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { setNorthStar } from "./local-northstar";
import { setIdentityStatement, setOriginStory } from "./local-identity";
import { buildKaiClientContext } from "./kai-client-context";

describe("kai client context — identity", () => {
  afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

  it("includes goal name, identity statement, and origin story", () => {
    setNorthStar("180 lb Boxer", "custom");
    setIdentityStatement("Someone who keeps his word");
    setOriginStory("I'm tired of wasting my potential");
    const ctx = buildKaiClientContext(new Date("2026-06-19T12:00:00"));
    expect(ctx.identity?.goalName).toBe("180 lb Boxer");
    expect(ctx.identity?.statement).toBe("Someone who keeps his word");
    expect(ctx.identity?.originStory).toBe("I'm tired of wasting my potential");
    expect(ctx.identity?.daysBuilding).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **A2: Run, verify it fails** — `npx vitest run src/lib/kai-client-context.test.ts` → FAIL (`identity` undefined).

- [ ] **A3: Add `identity` to the type + builder** in `src/lib/kai-client-context.ts`.

Add to `KaiClientContext` type:
```ts
  /** Who the user is becoming — the durable identity layer KAI must hold. */
  identity?: {
    goalName: string | null;       // North Star goal, e.g. "180 lb Boxer"
    statement: string | null;      // "Someone who keeps his word"
    originStory: string | null;    // Day-1 "why", write-once
    daysBuilding: number;          // days since they started
  };
```
Import at top:
```ts
import { getNorthStar } from "./local-northstar";
import { daysBuilding, getIdentityStatement, getOriginStory } from "./local-identity";
```
In `buildKaiClientContext(...)`, before the return, build and include:
```ts
  const identity = {
    goalName: getNorthStar()?.goal ?? null,
    statement: getIdentityStatement(),
    originStory: getOriginStory(),
    daysBuilding: daysBuilding(now),
  };
```
Add `identity,` to the returned object.

- [ ] **A4: Run, verify pass** — `npx vitest run src/lib/kai-client-context.test.ts` → PASS.

- [ ] **A5: Render identity in the system prompt** — `workers/src/lib/prompts/kai.ts`, inside `renderClientContextBlock(ctx)`, before the `Active goals` lines:

```ts
  const id = ctx.identity;
  if (id && (id.goalName || id.statement || id.originStory)) {
    if (id.goalName) lines.push(`- Becoming: ${id.goalName} (day ${id.daysBuilding})`);
    if (id.statement) lines.push(`- Identity they chose: "${id.statement}"`);
    if (id.originStory) lines.push(`- Why they started (day one, never forget): "${id.originStory}"`);
  }
```

Also confirm the `KaiClientContext` type imported by the worker prompt includes `identity` (it imports from the shared type; if the worker keeps its own copy of the type, mirror the `identity` field there). Grep: `grep -rn "activeChallenges" workers/src` to find the worker-side type and add the same optional `identity` field.

- [ ] **A6: Typecheck + build + targeted tests**
Run: `npm run typecheck && npm run build && npx vitest run src/lib/kai-client-context.test.ts`
Expected: all pass.

- [ ] **A7: Commit & PR** — branch `feat/soul-a-identity-in-chat`. PR body: "Phase A — inject identity statement + origin story + days-building into Kai's chat context so Kai references who the user is becoming." Merge when CI green (auto-deploys).

---

## Phase B — Identity-first Home (#2, #7) + kill generic greeting

**Why:** The first thing on every open should be *who they're becoming*, not "Good Morning, Lev" + metrics.

**Files:**
- Modify: `src/components/KaiGreeting.tsx` (promote hero + identity to the lead; add "N days becoming")
- Modify: `src/lib/kai-greeting.ts` (replace time-of-day fallback with identity-led line)
- Modify: `src/pages/Home.tsx` (order: identity hero first, metrics demoted below)
- Test: `src/lib/kai-greeting.test.ts` (create if absent)

- [ ] **B1: Failing test — greeting leads with identity, never "Good Morning"**

Create/extend `src/lib/kai-greeting.test.ts`:
```ts
import { afterEach, describe, expect, it } from "vitest";
import { setNorthStar } from "./local-northstar";
import { pickKaiGreeting } from "./kai-greeting";

describe("kai greeting — identity-led", () => {
  afterEach(() => localStorage.clear());

  it("never returns a bare time-of-day greeting when an identity goal exists", () => {
    setNorthStar("180 lb Boxer", "custom");
    const line = pickKaiGreeting("Lev");
    expect(line).not.toMatch(/good morning/i);
    expect(line.toLowerCase()).not.toMatch(/^morning[!,. ]/);
  });
});
```
Note: confirm the real signature of `pickKaiGreeting` first (`grep -n "export function pickKaiGreeting" src/lib/kai-greeting.ts`) and match the test to it (it may take more than just `name`). Adjust args accordingly.

- [ ] **B2: Run, verify it fails** — `npx vitest run src/lib/kai-greeting.test.ts`.

- [ ] **B3: Replace the time-of-day fallback** in `src/lib/kai-greeting.ts`. Where `timeOfDayGreeting()` is the no-signal fallback (~lines 137-182), when an identity goal/statement exists prefer an identity-led line, e.g. rotate among:
  - `Still becoming ${goalName}.` / `One day closer to ${goalName}.` / `${statement} — that's the work today.`
Keep the signal-driven lines (sleep/mood/streak) as-is; only the *bare* fallback changes. Pull identity via `getNorthStar()?.goal` and `getIdentityStatement()`.

- [ ] **B4: Run, verify pass** — `npx vitest run src/lib/kai-greeting.test.ts`.

- [ ] **B5: Promote hero + identity to the lead in `KaiGreeting.tsx`.** Currently hero is `opacity-0.14 blur-2xl` ambient and identity is a small line. Change so that when a hero image exists it renders as a prominent rounded hero band (not a faint blur) with the goal name and identity statement overlaid, and add a "N days becoming the person you said you'd be" line using `daysBuilding()` from `local-identity.ts`. Keep graceful empty state (no hero → current character + identity text). This is presentational — no test; verify by build + visual.

- [ ] **B6: Reorder `Home.tsx`** so the identity hero (KaiGreeting) leads and the metric stack (XpPill, DailyScoreCard) is demoted below the goal/identity, per #7 ("avoid leading with metrics"). Keep all cards; just change the order/emphasis. Surface `daysBuilding()` near the goal if not already shown by KaiGreeting.

- [ ] **B7: Typecheck + build** — `npm run typecheck && npm run build`. Then run the app and eyeball Home (`npm run dev`) — identity hero first, no "Good Morning".

- [ ] **B8: Commit & PR** — branch `feat/soul-b-identity-home`. Merge on green.

---

## Phase C — Comeback screen (#5)

**Why:** Returning after a lapse must feel safe, not shameful.

**Files:**
- Create: `src/pages/Comeback.tsx` (the screen)
- Modify: `src/lib/local-score.ts` or `src/lib/kai-client-context.ts` (add `daysSinceAnyActivity()` helper)
- Modify: `src/App.tsx` (gate: if inactive 7+ days and not already shown this return, route to `/comeback` before `/home`)
- Test: `src/lib/local-score.test.ts` (or wherever the helper lives) for the 7-day threshold

- [ ] **C1: Failing test for inactivity detection**

```ts
// in the test file for the lib that owns the helper
import { daysSinceAnyActivity } from "./local-score";
it("returns days since the most recent logged input", () => {
  // seed inputs via the existing test helpers / readLocalInputs source
  // assert: no inputs -> null/0 sentinel; last input 8 days ago -> 8
});
```
First grep the real input store API (`grep -n "readLocalInputs\|export" src/lib/local-score.ts`) and write the test against the actual shape.

- [ ] **C2: Run, verify fail.**

- [ ] **C3: Implement `daysSinceAnyActivity(now)`** — max recency across all logged inputs; returns `null` when there's never been activity (don't show comeback to brand-new users).

- [ ] **C4: Run, verify pass.**

- [ ] **C5: Build `Comeback.tsx`** with the exact spec copy:
> Welcome back. / The story isn't over. / Everyone falls off sometimes. / What matters is what happens next.

A single `[Continue]` button → navigates to `/home`. No streaks, no guilt. Reuse `KaiOrb` for warmth. On Continue, set a localStorage flag `kai_comeback_shown_<isoDate>` so it shows once per return.

- [ ] **C6: Wire the gate in `App.tsx`** — a small wrapper around the home route (or inside `protectedOnboarding`): if `daysSinceAnyActivity() >= 7` and the comeback flag for today isn't set, redirect to `/comeback`. Add the `/comeback` route.

- [ ] **C7: Typecheck + build + run.** Manually simulate by back-dating inputs in localStorage; confirm `/comeback` shows then `/home`.

- [ ] **C8: Commit & PR** — branch `feat/soul-c-comeback`. Merge on green.

---

## Phase D — Onboarding: split identity vs origin, fix Meet Kai (Onboarding 2/3/5)

**Why:** Today one "why" question feeds both the identity statement and the origin story; the spec wants them distinct, and Meet-Kai copy/flow should match.

**Files:**
- Modify: `src/pages/Onboarding.tsx` (Draft type + stages array + `finish()` persistence)
- Modify: `src/pages/Onboarding.test.tsx` (update flow expectations)

- [ ] **D1: Update the `Draft` type** — add a distinct `identityStatement: string` field alongside `whyMatters` (rename `whyMatters` → `originStory` for clarity, or keep `whyMatters` as origin and add `identityStatement`). Pick one naming and use it consistently through stages + `finish()`.

- [ ] **D2: Add the Identity Statement stage** (Step 2) between goal and origin: question "What kind of person do you want to become?", placeholder examples ("Someone who keeps his word", "Someone who never quits"), field `identityStatement`.

- [ ] **D3: Reframe the Origin stage** (Step 3) to "Why are you downloading Rawz today?" with examples ("I'm tired of wasting my potential", "I need structure"), field = origin.

- [ ] **D4: Update `finish()`** so `setIdentityStatement(draft.identityStatement)` and `setOriginStory(draft.origin)` get DISTINCT values (no longer the same string). Keep write-once on origin. Keep `keyedResponses.identity_statement` / `origin_story` distinct too.

- [ ] **D5: Fix Meet-Kai (Step 5) copy** to: "Hey {name}. I'm Kai. My job isn't to judge you. My job is to help you become the person you just described." Then immediately ask "What's the biggest thing holding you back right now?" — i.e. the `blocker` question should follow the Meet-Kai intro, not precede it. Reorder the stages so `meet` → `blocker`.

- [ ] **D6: Update `Onboarding.test.tsx`** to walk the new stage order and assert both `getIdentityStatement()` and `getOriginStory()` end up set to their distinct answers. Run `npx vitest run src/pages/Onboarding.test.tsx`.

- [ ] **D7: Typecheck + build + full onboarding test.** Manually walk onboarding in `npm run dev`.

- [ ] **D8: Commit & PR** — branch `feat/soul-d-onboarding-identity-split`. Merge on green.

---

## Phase E — Origin-story callbacks (#4) + open loops (#11)

**Why:** Kai should occasionally reference *why they started* (only at meaningful moments) and plant anticipation for the next session.

**Files:**
- Modify: `workers/src/lib/prompts/kai.ts` (prompt guidance for when to use origin story + how to plant one open loop)
- Modify: `src/lib/kai-client-context.ts` (add a `moment` signal: `milestone | struggle | routine`)
- Test: `src/lib/kai-client-context.test.ts` (the moment classifier)

- [ ] **E1: Failing test for the `moment` classifier** — given streak just crossed 7/14/30 → `milestone`; given low mood / broken streak → `struggle`; else `routine`. Reuse the existing signal sources (`detectVaultResurfaceSignals` in `local-vault.ts`, streak from score).

- [ ] **E2: Run, verify fail.**

- [ ] **E3: Implement `moment` in `buildKaiClientContext`** and add `moment` to `KaiClientContext`.

- [ ] **E4: Run, verify pass.**

- [ ] **E5: Prompt guidance** in `prompts/kai.ts`: when `moment === "milestone" || "struggle"` AND an origin story exists, instruct Kai to gently reference it ("Remember when you said you started because …") — and explicitly NOT to do this on `routine` moments. Add one open-loop instruction: Kai may end a session by planting *one* concrete teaser about tomorrow ("Tomorrow I'll show you the pattern in your sleep") — sparingly, never as filler.

- [ ] **E6: Typecheck + build + tests.**

- [ ] **E7: Commit & PR** — branch `feat/soul-e-callbacks-open-loops`. Merge on green.

---

## Phase F — Progress reflection (#6) + progress they can't see (#8)

**Why:** Help users see growth they don't notice — then/now, every 60–90 days.

**Files:**
- Create: `src/lib/baseline.ts` (capture week-1 baseline once: avg sleep, workouts/wk, check-in cadence) + tests
- Create: `src/pages/Reflection.tsx` (the then/now screen)
- Modify: `src/App.tsx` (route `/reflection`; surface a gentle entry when ≥60 days building and a baseline exists)
- Modify: `src/pages/Progress.tsx` (add baseline-vs-now lines: "You sleep 1.5h more than when you started", lifetime workout count)
- Test: `src/lib/baseline.test.ts`

- [ ] **F1: Failing tests for baseline capture + deltas** — first activity stamps a baseline snapshot; `progressDeltas(now)` returns `{ sleepHoursDelta, workoutsLifetime, consistencyPct }` computed from `readLocalInputs()`.

- [ ] **F2: Run, verify fail.**

- [ ] **F3: Implement `baseline.ts`** — `captureBaselineOnce()` (write-once, called on first meaningful log) + `progressDeltas(now)`. Store under a versioned key.

- [ ] **F4: Run, verify pass.**

- [ ] **F5: Build `Reflection.tsx`** — headline "You're not the same person who downloaded Rawz." then a then/now table from `progressDeltas`. `[Keep going]` → `/home`.

- [ ] **F6: Surface entry + Progress lines** — show reflection availability at ≥60 days building; add the delta lines to `Progress.tsx`.

- [ ] **F7: Typecheck + build + tests + manual.**

- [ ] **F8: Commit & PR** — branch `feat/soul-f-reflection`. Merge on green.

---

## Phase G — Friend accountability feed (#9) + 1:1 challenges (#10)

**Why:** Biggest lift — needs the real friend graph. Lightweight accountability, not a social network.

**Files (backend):**
- Modify: `workers/src/routes/friends.ts` (username search, request/accept, accountability feed aggregate)
- Create: migration `migrations/00NN_friend_challenges.sql` (challenge columns / table keyed to a friendship)
- Modify: `workers/.../friends.ts` challenge endpoints (create/join/progress)

**Files (frontend):**
- Modify: `src/pages/FriendInvite.tsx` → real link/QR (already shell) + accept flow
- Create: `src/pages/Friends.tsx` (friend list + accountability feed: "Lev completed his workout ✅")
- Create: `src/pages/FriendChallenges.tsx` (create/join "20 workouts this month", "7-day sleep challenge")
- Modify: `src/App.tsx` (routes), `src/pages/Profile.tsx` (entry)

- [ ] **G1: Schema + migration** for 1:1 challenges (id, friendship_id, title, metric, target, start/end, per-user progress). Apply locally (`wrangler d1 migrations apply`).
- [ ] **G2: Backend tests + endpoints** — username search, request/accept, accountability feed (aggregate completions only, per existing §9.3 privacy rule — no meal photos/conversations), challenge CRUD + progress. TDD with the worker test harness (`workers/test/`).
- [ ] **G3: Friends list + feed UI** (`Friends.tsx`) — simple per-friend "✅ completed workout / hit protein / checked in today".
- [ ] **G4: Challenges UI** (`FriendChallenges.tsx`) — create/join shared goal, show both users' progress.
- [ ] **G5: Wire FriendInvite accept flow + routes + Profile entries.**
- [ ] **G6: Typecheck + build + worker tests + manual end-to-end with two dev users.**
- [ ] **G7: Commit & PR** — branch `feat/soul-g-friends`. Merge on green.

---

## Self-review notes
- **Privacy:** Friend feed (G) must stay aggregate-only per the existing §9.3 rule already enforced in `friends.ts` (no conversations/goals/reflections/meal photos). Carry that forward.
- **Safety:** None of these phases touch the protected safety files (`src/safety/*`, `workers/.../middleware/safety.ts`). If any change appears to, STOP — those need Evan Ratner approval.
- **Origin story stays write-once** everywhere (D, E). Identity statement is editable (About You already supports clearing).
- **Each phase is deployable alone** and ordered by feeling-per-effort; A→D deliver most of the "Kai knows me" feeling for the least code.
