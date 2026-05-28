# Kai Lev / Offy Review Loop

Date: 2026-05-28
Branch: `kai-pr143-chat-engine`
Preview: `https://kai-pr143-chat-engine.kai-epk.pages.dev`
Worker: `https://kai-staging.evan-ratner.workers.dev`

## Objective

Get Kai into a clean, mobile-first, client-testable state for Lev and Offy: first-run onboarding, personalized home, real KAI chat, working logging tools, believable gamification, and clear teen-friendly UX.

## P0 Demo Blockers

- [x] Nutrition / bulking: KAI must answer safe muscle-gain and summer training questions instead of refusing. Keep teen-safe guardrails: no calorie targets, no weight targets, no body-shaming language.
- [x] Home hero: add one large evolving goal at the top, alongside daily goals. It should feel alive over time: flower, fire, aura, or level-up style.
- [x] Daily goals: make them larger, more pressable, lightly animated, and visibly personalized from onboarding answers.
- [x] Onboarding: ensure first load starts with the premium fast onboarding flow and ends with the personalized system reveal.
- [x] Day 0: add private Day 0 video capture near the end of onboarding with a small home/Journey card after completion.
- [x] Plus actions: verify every `+` action opens the right page and completes a real log or task.
- [ ] Food logger: verify photo upload, AI item identification, USDA nutrition enrichment, and user-facing result copy.
- [x] Sleep logging: fix the sleep counter / score update path so sleep changes are obvious immediately after logging.
- [x] Profile gamification: reduce card overload and make the path understandable: score, streak, XP/level, badges, growth visual.
- [ ] Mobile QA: check home, onboarding, chat, profile, plus sheet, food, sleep, mood, goals, and journal on a 390px mobile viewport.

## P1 Client Polish

- [x] Chat depth: KAI should ask better follow-ups for depression/sadness without over-escalating to crisis resources.
- [x] Chat formatting: keep responses separated and readable, with tasteful emphasis and a closing prompt for philosophy or next move.
- [x] Chat speed: reduce perceived latency with immediate optimistic state, shorter default responses, and better loading treatment.
- [ ] "Talk to KAI": make the chat entry larger and impossible to miss on home.
- [x] Daily score shortcuts: tapping Mind / Sleep / Mood should instantly route to the right logging/tracking flow.
- [x] Quote module: keep the motivational quote small and profile-relevant.
- [ ] Mission personalization: avoid generic goals unless they match onboarding. Examples: overthinking -> breathing reset; confidence -> posture / eye contact; basketball -> shooting / recovery.
- [ ] Remove noisy chat updates: logs like "fuel note saved" should not appear as normal chat messages.
- [ ] Logo and copy: keep KAI branding, not RAWZ; remove age and parent-email asks.

## P2 Working-System Depth

- [ ] Journey timeline: support Day 0, Day 30, Day 90, and Day 365 private reflections.
- [ ] Motivation detection: when missed habits, inactivity, late-night use, or "unmotivated" appear, surface Day 0 as "Watch this before quitting."
- [ ] AI Day 0 analysis: generate core mission, desired identity, likely struggles, and home priorities from the video/transcript.
- [ ] Community / progress sharing: minimal non-toxic posting for achievements, routines, and transformations.
- [ ] Notifications: adapt reminders based on motivation style and onboarding answers.
- [ ] Advanced analytics: show patterns without feeling clinical or overwhelming.

## Verification Gates

- [x] Unit tests pass for touched logic.
- [x] Typecheck passes.
- [x] Worker deploys to staging.
- [x] Pages preview deploys for branch.
- [x] Fresh-profile browser test starts at onboarding.
- [ ] Completed onboarding produces personalized home goals.
- [ ] Food, sleep, mood, workout, journal, and goal logging work from mobile.
- [x] Explicit crisis language still intercepts; normal sadness/depression routes to coaching.
- [ ] Lev/Offy can test without local state cleanup or manual setup.

## Suggested Work Order

1. Fix KAI refusing safe bulking / muscle-gain requests.
2. Add evolving goal + larger personalized daily goals on home.
3. Add Day 0 onboarding capture and small Journey/home recall surface.
4. Verify plus actions and split broken cards into dedicated working pages.
5. Fix food logger and sleep score update edge cases.
6. Simplify profile gamification.
7. Full mobile QA and deploy.
