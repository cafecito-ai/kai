# Kai Handoff

Last updated: 2026-05-25

## Review Links

- Stable staging: `https://staging.kai-epk.pages.dev`
- Pull request: `https://github.com/cafecito-ai/kai/pull/84`
- Source branch: `kai-first-home-companion`
- Base branch: `engine-scoped-chat-persistence`
- Production remains gated: `https://kai.boostaisearch.ai`

## Product State

Kai is now a mobile-first teen coaching companion, not a tabbed wellness dashboard. The first screen centers Kai, chat, the nebula mark, one useful next move, and a quiet bottom dock. Mind, Body, and Goals still exist, but they behave like tools Kai opens from conversation instead of separate app sections.

The current staging build is ready for Lev/client handoff review. It is not ready for broad public teen beta until legal, safety, auth, production infrastructure, and clinical review are complete.

## What Is Real

- Chat-first Home with Kai as the center of gravity.
- Nebula-style Kai identity shared across Home, app chrome, onboarding, chat, and utility pages.
- Mobile shell with Home, Kai, and Tools as the primary navigation.
- Global Kai chat sheet with recent memory, prompt chips, and a routed `Kai's read` action.
- Tools sheet curated as `Kai can open`, with compact action tiles instead of app navigation.
- Kai chat persists by engine and hydrates recent conversation history.
- Kai Worker prompts include structured onboarding answers and recent conversation turns as untrusted personalization context.
- Worker chat returns structured `nextAction` data for Kai and engine conversations.
- Frontend and Worker both route intent to:
  - Talk it out
  - Build confidence
  - Handle social pressure
  - Reset screen time
  - Log food
  - Protect sleep
  - Stretch it out
  - Body scan
  - Move a goal
  - Reset today
- Home `Try this next` and shortcuts can switch to Kai's inferred current action.
- Deep-linked tools show `Kai opened this` copy so the route feels intentional.
- Onboarding captures age, parent email, Kai name, coaching tone, personality style, current vibes, stressors, sleep/energy/confidence/movement/food/social baselines, first mission, and freeform context.
- Onboarding marks local completion, seeds a personalized first Kai message, and lands on Home.
- Under-18 onboarding triggers the parent consent send path when configured.
- Food logging supports manual fuel notes and camera/file photo upload through the real food-photo API path.
- Food photo selection processes immediately and can store R2-backed photos when configured.
- Mobile page smoke now exercises the real food photo file input and waits for a processed/saved state.
- Body scan selection processes immediately and stores private scan entries through the Worker.
- Food, body scan, stretch, and sleep are first-class focused mobile routes.
- Sleep and movement capture real inputs and persist entries through the engine entry/progress path.
- Physical tool surfaces show recent private saved context and next nudges.
- Mental check-ins, reframes, resets, social boundaries, identity notes, strengths, and goal patterns show visible private memory.
- Goals support creation, continuation, next action planning, achievement, reframe, release, and Kai-first goal memory.
- Progress, profile, groups, settings, crisis, privacy, terms, and parent-facing pages render on mobile staging.
- Safety layer intercepts crisis/self-harm/eating/body-risk language before normal coaching.

## What Is Beta

- Kai is coaching support, not therapy, medical care, diagnosis, or crisis response.
- Body scan is a private beta surface. It stores a safe posture/recovery-style scan entry; it is not clinical body composition analysis.
- Food analysis is descriptive and reviewable. It must not be presented as precise nutrition, calorie targeting, or diet advice.
- Conversation memory is visible recent context, not a complete long-term personalization model.
- Social/community is a locked privacy-safe support concept, not a full community launch.
- Home-screen presence is represented as product direction in the PWA/web experience, not native iOS widgets yet.
- The app is web-first. Native iOS/background presence is future work.
- Legal copy still needs counsel review before real teen testing.
- Mental health guidance needs clinical/safety reviewer sign-off before broader beta.

## What Changed In PR #84

- Made Home chat-first and Kai-centered.
- Reworked the Kai logo toward a calming galaxy/nebula mark.
- Replaced dashboard language with teen-coach copy across main and utility routes.
- Added deterministic chat-to-action routing on the frontend.
- Added structured Worker `nextAction` responses for Kai and engine chat.
- Added focused mental actions for confidence, social pressure, and screen-time reset.
- Made Tools feel like Kai actions rather than navigation.
- Made the global Kai chat sheet cleaner and more mobile-safe.
- Made onboarding feel Kai-led and personalized.
- Made onboarding-selected actions show immediately on Home.
- Made sleep and movement logs input-driven.
- Made food photos and body scans process immediately on image selection.
- Split Food, Body scan, Stretch / move, and Log sleep into focused mobile routes.
- Tightened focused Body routes so the first phone viewport reaches the active tool instead of only route chrome.
- Changed focused engine segments into real links so every segment is directly tappable and deep-linkable.
- Surfaced recent conversation and tool-completion context as `Kai remembers`.
- Added structured onboarding context and recent turns to the Worker chat prompt.
- Added private physical and mental history panels inside tool surfaces.
- Reworked Goals, Loop, and Goals list so goal reps feel carried by Kai.
- Hardened mobile smoke coverage for all key pages and focused action deep links.

## Verified Gates

Most recent verified surface: stable staging alias `https://staging.kai-epk.pages.dev`

- `npm run typecheck`
- `npm run worker:typecheck`
- `npm run lint`
  - Passes with existing Fast Refresh warnings in `ArticleBody.tsx` and `main.tsx`.
- `npm run build`
- Focused action/store/Worker tests:
  - `npm test -- --run src/lib/kai-actions.test.ts src/stores/kaiStore.test.ts workers/test/kai-actions.test.ts workers/test/chat-route.test.ts`
- Local mobile smoke:
  - `SMOKE_BASE_URL=http://127.0.0.1:4181 npm run smoke:pages`
- Staging mobile smoke:
  - `npm run smoke:staging`
- GitHub Actions CI on PR #84: passing
- 390px CDP screenshots/metrics captured for:
  - Home
  - Onboarding
  - Tools sheet
  - Kai chat sheet
  - Physical routes
  - Mental focused deep links
  - Goals routes
  - Utility pages

## Demo Script For Lev

1. Open `https://staging.kai-epk.pages.dev`.
2. Start on Home and read it as a teen: Kai should feel like the center, not a dashboard.
3. Type natural messages into Kai:
   - `I slept badly and feel tired but wired`
   - `I have practice later and do not know what to eat`
   - `Can Kai check my posture and alignment?`
   - `I feel insecure and not good enough`
   - `The group chat made me feel left out`
   - `I keep doomscrolling and comparing myself`
   - `I keep procrastinating and need one move`
4. Confirm Kai suggests the right next action.
5. Open the center Kai button and confirm the chat sheet feels like the controller.
6. Open Tools and confirm it feels curated around actions, not app tabs.
7. Open onboarding and check whether it feels like Kai learning the teen.
8. Open Body:
   - Add a food note.
   - Select a food photo and confirm it starts processing.
   - Open Body scan and review the private/no-body-score framing.
   - Log stretch/move minutes and sleep hours/quality.
9. Open Mind:
   - Complete a feelings check-in.
   - Try a screen-time/social reset.
   - Use the confidence/purpose path.
   - Open guides and check whether the mentor/philosophy framing feels useful.
10. Open Goals and create one concrete goal/next action.
11. Open Progress and confirm saved reps/memory show up.

## Remaining Near-Final Gaps

### Highest Priority

- Make Kai responses more context-aware after a tool is opened. Tool completions now write back into chat memory, but the generated reply itself does not yet deeply reason over every saved rep.
- Evaluate the quality of Worker personalization with real teen-like conversations and tune the prompt/summary shape as needed.
- Do a real-device visual QA pass on iPhone Safari/Android Chrome, not only 390px headless screenshots.

### Physical

- Food history exists, but saved meals could use a clearer review/edit flow and richer next nudges.
- Body scan stores private scans and shows recent history, but needs a stronger visual progress timeline.
- Stretch is input-driven; real-time camera-guided form correction remains future/beta.
- Sleep persists entries; multi-night trend/pattern coaching should be deeper.

### Mental

- Emotional check-ins create visible patterns, but pattern interpretation should become more personalized over time.
- Guides exist and mental chat can host mentor framing, but Kai should reference guide concepts more naturally from live conversation.
- Confidence/social/screen-time are routed actions now; each can still become a deeper dedicated flow.

### Launch Readiness

- Finalize Clerk/auth behavior for the intended staging/prod review mode.
- Confirm Worker route bindings for production API calls.
- Confirm D1/KV/R2 resources and migrations for production.
- Set `SAFETY_ALERT_EMAIL`.
- Complete legal review of Terms and Privacy.
- Complete clinical/safety review before real teen beta.
- Merge stacked PRs cleanly before production deployment.

## Operational Notes

- Staging Pages project is `kai`; staging alias is `https://staging.kai-epk.pages.dev`.
- The stable staging alias is manually updated with:

```bash
npm run build
npx wrangler pages deploy dist --project-name=kai --branch=staging --commit-hash="$(git rev-parse HEAD)"
```

- Staging smoke is:

```bash
npm run smoke:staging
```

- Full local app smoke is:

```bash
npm run typecheck
npm run worker:typecheck
npm run lint
npm run build
npm run smoke:pages
```
