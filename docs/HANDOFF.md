# Kai Handoff

Last updated: 2026-05-25

## Review Links

- Stable staging: `https://staging.kai-epk.pages.dev`
- Latest verified staging deploy: `https://24c731d3.kai-epk.pages.dev`
- Pull request: `https://github.com/cafecito-ai/kai/pull/84`
- Source branch: `kai-first-home-companion`
- Base branch: `engine-scoped-chat-persistence`
- Production remains gated: `https://kai.boostaisearch.ai`

## Product State

Kai is now positioned as a mobile-first teen coaching companion, not a tabbed wellness dashboard. The first screen centers Kai, chat, the nebula mark, and one next move. Mind, Body, and Goals still exist, but they are framed as moves Kai can open instead of separate products.

The current staging build is appropriate for a Lev/client product review. It is not yet a public teen beta without final legal, safety, auth, and clinical review.

## What Is Real

- Chat-first Home with Kai as the center of gravity.
- Nebula-style Kai identity shared across Home, app chrome, onboarding, and chat.
- Simplified mobile shell with Home, Kai, and Tools.
- Kai chat persists by engine and hydrates recent conversation history.
- Kai chat returns structured next actions from the Worker.
- Frontend and Worker both route intent to:
  - Talk it out
  - Log food
  - Protect sleep
  - Stretch it out
  - Body scan
  - Move a goal
  - Reset today
- Home and chat show `Kai would open` / `Open next` action cards.
- Tools sheet is curated as `Kai can open`, with profile/settings demoted to account utilities.
- Onboarding captures age, parent email, Kai name, tone, current vibe, life signals, first focus, and freeform context.
- Onboarding marks local completion, seeds a personalized first Kai message, and lands on Home.
- Under-18 onboarding triggers the parent consent send path when configured.
- Food logging persists manual fuel notes through the real food-photo API path.
- Food photo upload path exists and can store R2-backed food photos when configured.
- Body scan upload path exists and stores private scan entries through the Worker.
- Sleep and movement capture real inputs and persist entries through the existing engine entry/progress path.
- Mental check-ins, thought reframes, breathing, social reset, future letter, strengths, and guide reads write progress/entry events.
- Goals support creation, next action planning, achievement, reframe, and release flows.
- Progress, profile, groups, settings, crisis, privacy, terms, and parent-facing pages render on mobile staging.
- Safety layer still intercepts local crisis/self-harm/eating/body-risk language before normal coaching.

## What Is Beta

- Kai is a coaching product, not therapy or medical care.
- Body scan is a private beta surface. It stores a scan entry and safe analysis framing, but it is not clinical body composition analysis.
- Food analysis is descriptive and reviewable. It should not be presented as precise nutrition, calorie targeting, or diet advice.
- Conversation memory is visible as recent context, not a full long-term personalization model yet.
- Social/community is framed as privacy-safe support and progress context, not a full production community system.
- Home-screen widget presence is represented as product direction, not a native iOS widget.
- The app is web-first. Native iOS/background presence is future work.
- Legal copy still needs counsel review before real teen testing.
- Mental health guidance still needs clinical/safety reviewer sign-off before broader beta.

## What Changed In PR #84

- Made Home chat-first and Kai-centered.
- Reworked the Kai logo toward a calming galaxy/nebula mark.
- Replaced dashboard language with teen-coach copy.
- Added deterministic chat-to-action routing on the frontend.
- Added structured Worker `nextAction` responses for Kai and engine chat.
- Made onboarding hand off to Home with a personalized first Kai message.
- Made onboarding-selected actions show immediately on Home.
- Made sleep and movement logs input-driven instead of generic buttons.
- Made chat/tools feel action-routed instead of navigation-routed.
- Surfaced recent conversation context as `Kai remembers`.
- Cleaned up high-impact `agent`, `unit`, `module`, and `app section` language on main routes.

## Verified Gates

Most recent verified PR head: `48454e2`

- `npm run typecheck`
- `npm run lint`
  - Passes with existing Fast Refresh warnings in `ArticleBody.tsx` and `main.tsx`.
- `npm run build`
- Local mobile smoke: `npm run smoke:pages`
- Staging mobile smoke: `npm run smoke:staging`
- GitHub Actions CI on PR #84: passing
- 390px local screenshots captured for:
  - Home
  - Onboarding
  - Physical movement/sleep
  - Mental check-in

## Demo Script For Lev

1. Open `https://staging.kai-epk.pages.dev`.
2. Start on Home and read the first screen as a teen.
3. Type a natural message into Kai, for example:
   - `I slept badly and feel tired but wired`
   - `I have practice later and do not know what to eat`
   - `I keep procrastinating and need one move`
4. Confirm Kai suggests the right next action.
5. Open the center Kai button and confirm the chat sheet feels like the main controller.
6. Open Tools and confirm it feels like Kai opening moves, not app tabs.
7. Open onboarding and check whether it feels like Kai learning the teen.
8. Open Body:
   - Log food.
   - Try movement minutes/focus.
   - Try sleep hours/quality.
   - Open Body scan and review the private framing.
9. Open Mind:
   - Complete a feelings check-in.
   - Try reset / thought reframe.
   - Open guides and check whether the mentor/philosophy framing feels useful.
10. Open Goals and create one concrete goal/next action.
11. Open Wins/Progress and confirm saved reps show up.

## Remaining Near-Final Gaps

### Highest priority

- Make Kai responses more context-aware after a tool is opened. Today Kai routes well, but tools do not always hand a rich completion summary back into chat.
- Add richer first-run personalization from onboarding into the ongoing prompt context, not only the first message.
- Make Home `Try this next` fully align with the latest Kai action and recent saved rep, not only loop status.

### Physical

- Food history should show saved meals with clearer next nudges.
- Body scan should show previous private scans/progress timeline.
- Stretch should move from log-only to guided real-time session polish.
- Sleep should show trend/pattern over multiple nights.

### Mental

- Emotional check-ins should create more visible patterns over time.
- Guides should be referenced by Kai based on chat context rather than discovered mostly as a content area.
- Confidence, social, and screen-time flows should be exposed more directly as Kai-routed actions.

### Design

- Continue reducing dense text on secondary routes.
- Do another visual QA pass on real devices, not only 390px headless screenshots.
- Tighten Physical and Mental tool surfaces so they feel as premium as Home.

### Launch readiness

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
npm run lint
npm run build
npm run smoke:pages
```

