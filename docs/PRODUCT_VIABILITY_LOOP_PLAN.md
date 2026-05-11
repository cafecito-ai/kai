# Kai Product Viability Loop Plan

This plan is meant to be run repeatedly by Codex or another implementation agent. The loop is:

1. Pick the highest-priority unfinished milestone.
2. Implement the smallest complete slice that moves that milestone forward.
3. Run build, tests, smoke checks, and route checks.
4. Deploy to staging or production when appropriate.
5. Commit and push a clean, reviewable change.
6. Update this plan or linked TODO docs with what remains.
7. Repeat.

The goal is not to make Kai look complete. The goal is to make Kai usable, safe, persistent, and testable enough for Lev, Offy, and a small teen beta group.

## Current Product State

Kai currently has:

- Cloudflare Pages app shell live at `https://kai.boostaisearch.ai`.
- Direction 3 Calm Teen design applied across the main app shell.
- Public routes:
  - `/`
  - `/design`
  - `/crisis`
  - `/for-parents`
  - `/terms`
  - `/privacy`
- Demo-mode app routes:
  - `/home`
  - `/onboarding`
  - `/engine/physical`
  - `/engine/potential`
  - `/engine/mental`
  - `/progress`
  - `/settings`
- Cloudflare Worker API scaffold for:
  - users
  - onboarding
  - chat
  - goals
  - progress
  - food placeholders
  - friends
  - safety
  - parent consent
- Cloudflare direction:
  - Pages for frontend
  - Workers for API
  - D1 for persistent product data
  - KV for lightweight cache/session support
  - R2 for uploads
  - Workers AI for text and vision
  - Cloudflare Email for parent consent and safety alerts

## Non-Negotiable Product Principles

Kai is a teen wellness product. Every implementation decision should follow these rules:

- Kai is not therapy, medical care, diagnosis, crisis support, or nutrition treatment.
- Teen safety beats engagement, retention, or model cleverness.
- Food tracking must never become dieting, body scoring, weight-loss optimization, calorie obsession, or restriction reward.
- Progress should reward consistency, reflection, and completion, not intensity or perfection.
- Parent trust matters, but teen privacy also matters. The product must be clear about what is visible and what is not.
- Public pages must always work without auth.
- App writes in production must belong to verified users.
- Staging and production data must stay separate.
- Every phase must leave behind a buildable, deployable repo.

## Definition Of Viable Beta

Kai is viable for a small beta when all of this is true:

- A teen can sign up or sign in.
- A teen can complete onboarding.
- Under-18 onboarding can trigger parent consent.
- App routes are protected in production.
- User settings, goals, progress, and engine activity survive refresh.
- Kai chat works and persists conversations.
- Safety-sensitive messages are routed before normal AI response.
- Each engine has at least three useful persisted workflows.
- The Body engine has teen-safe food tracking and movement/sleep/recovery flows.
- Staging can be used by testers without developer intervention.
- Production can be deployed repeatedly with a known checklist.
- There is at least a basic ops view or query path for safety events and product events.

## Execution Loop

Use this loop for every coding pass:

1. Read `git status --short --branch`.
2. Identify whether there are unrelated uncommitted files.
3. Avoid mixing unrelated backend, frontend, docs, and deployment work unless one depends on the other.
4. Pick one milestone below.
5. Implement a complete vertical slice.
6. Run:
   - `npm run build`
   - relevant tests if present
   - route checks for changed pages
   - API smoke checks for changed endpoints
7. If deployed, verify the live domain.
8. Commit with a narrow message.
9. Push to GitHub.
10. Record remaining work.

Do not leave the app in a state where public routes are broken, production build fails, or the live shell cannot be navigated.

## Milestone 0: Stabilize The Current Worktree

Goal: cleanly separate the in-progress backend product-build files from frontend design work.

Current uncommitted backend work includes:

- `migrations/0002_product_buildout.sql`
- `workers/migrations/0002_product_buildout.sql`
- `workers/src/lib/auth.ts`
- `workers/src/lib/consent.ts`
- `workers/src/lib/conversations.ts`
- `workers/src/lib/events.ts`
- `workers/src/routes/entries.ts`
- modifications under `workers/src/*`

Tasks:

- Review all uncommitted backend changes.
- Confirm the migration matches current D1 schema.
- Ensure Worker TypeScript compiles.
- Confirm auth middleware does not break public consent route or CORS preflight.
- Commit backend foundation separately from frontend work.

Acceptance:

- `git status` only shows intentional uncommitted work, or is clean.
- `npm run build` passes.
- Backend foundation is committed and pushed.
- No frontend visual changes are mixed into the backend foundation commit.

## Milestone 1: Auth And Identity

Goal: production app writes must belong to real authenticated users.

Tasks:

- Configure Clerk production app.
- Configure Clerk staging app.
- Add `VITE_CLERK_PUBLISHABLE_KEY` to Cloudflare Pages production.
- Add staging publishable key to Pages preview/staging environment.
- Add `CLERK_SECRET_KEY` to production Worker secrets.
- Add staging `CLERK_SECRET_KEY` to staging Worker secrets.
- Add `CLERK_JWT_KEY` if using networkless verification.
- Finish frontend auth token bridge.
- Finish Worker token verification.
- Remove production demo identity behavior.
- Keep local and preview demo behavior only where explicitly allowed.
- Protect:
  - `/home`
  - `/onboarding`
  - `/engine/physical`
  - `/engine/potential`
  - `/engine/mental`
  - `/progress`
  - `/settings`
- Keep public:
  - `/`
  - `/design`
  - `/crisis`
  - `/for-parents`
  - `/terms`
  - `/privacy`

Implementation notes:

- Frontend API requests should send `Authorization: Bearer <Clerk token>` when signed in.
- Worker should derive `userId` from the verified Clerk token subject.
- `x-dev-user` should never work in production.
- CORS preflight must not require auth.
- Parent consent verification endpoint should remain public.

Acceptance:

- Signed-out user can view public routes.
- Signed-out user cannot write to production API.
- Signed-out user attempting app route gets sign-in flow once Clerk is configured.
- Signed-in user can refresh and remain mapped to the same D1 user.
- Production Worker returns `401` for unauthenticated protected API calls.

Verification:

- Build passes.
- Live public routes return `200`.
- Authenticated API smoke test can call `/api/user/me`.
- Unauthenticated protected API call returns `401`.

## Milestone 2: Onboarding And Parent Consent

Goal: onboarding becomes the real account setup and teen consent flow.

Data to persist:

- age
- email
- display name
- parent email
- Kai name
- Kai tone
- primary engine
- raw intake responses
- intake summary
- onboarding completion timestamp
- parent consent status
- parent consent timestamp

Tasks:

- Add D1 fields for onboarding completion and consent status.
- Add parent consent token table.
- Add token expiration.
- Add consent-token consume endpoint.
- Send parent consent email through Cloudflare Email.
- Add resend parent consent endpoint.
- Add frontend pending consent state.
- Add frontend consent complete state.
- Add user-facing copy for what parent consent means.
- Redirect users who have not completed onboarding back to `/onboarding`.
- Do not block public safety resources behind consent.

Acceptance:

- New user can complete onboarding.
- Intake is stored in D1.
- User record has primary engine, Kai name, tone, age, and parent email.
- Under-18 user can trigger parent consent email.
- Parent link marks consent complete.
- Returning onboarded user lands on `/home`.
- Returning incomplete user lands on `/onboarding`.

Verification:

- D1 row exists for user.
- D1 row exists for intake.
- D1 row exists for consent token.
- Consent token updates user on consume.
- Build passes.

## Milestone 3: Persistent App State

Goal: the app should not reset when the page refreshes.

Tasks:

- Fetch `/api/user/me` after app load.
- Hydrate user store from API.
- Fetch `/api/progress`.
- Hydrate progress store from API.
- Fetch `/api/goals`.
- Hydrate goals or page state from API.
- Normalize all Worker response payloads to frontend camelCase.
- Add loading states for:
  - home
  - progress
  - goals
  - settings
  - engine histories
- Add empty states for:
  - no goals
  - no progress
  - no meals
  - no conversations
- Add error states that do not crash the app.
- Keep optimistic UI updates for fast interaction.

Acceptance:

- Settings persist after refresh.
- Goals persist after refresh.
- Progress events persist after refresh.
- Engine actions appear in progress after refresh.
- App routes do not throw if API is temporarily unavailable.

Verification:

- Create goal, refresh, goal remains.
- Log progress, refresh, progress remains.
- Change Kai name, refresh, name remains.
- Network/API error shows graceful fallback.

## Milestone 4: Conversation Persistence And Safety Foundation

Goal: every Kai and engine chat should be persisted and safety-screened.

Tasks:

- Create conversation rows in D1.
- Create message rows in D1.
- Store user messages.
- Store assistant messages.
- Store conversation engine:
  - `kai`
  - `physical`
  - `potential`
  - `mental`
- Add conversation IDs to frontend chat state.
- Return conversation ID from chat endpoints.
- Add route to list conversations.
- Add route to fetch conversation messages.
- Log safety events with:
  - user ID
  - conversation ID
  - message ID
  - trigger category
  - severity
  - raw text or redacted text depending safety policy
  - resources shown

Safety classifier stages:

- Stage 1: local deterministic keyword and phrase screen.
- Stage 2: Workers AI structured classifier.
- Stage 3: normal prompt only if safe.

Categories:

- suicide ideation
- self harm
- eating disorder
- abuse disclosure
- substance danger
- violence to others
- immediate danger

Acceptance:

- Normal messages persist.
- Safety-triggering messages persist as safety events.
- Safety-triggering messages do not go to the normal AI prompt first.
- User sees crisis/support copy immediately when appropriate.
- Ops can query safety events.

Verification:

- Chat normal message creates conversation and two messages.
- Safety message creates safety event.
- High/critical safety event can trigger email when configured.

## Milestone 5: Prompt And AI Productization

Goal: AI responses should feel like Kai, not generic AI.

Prompt files:

- Kai general check-in prompt.
- Body engine prompt.
- Goals engine prompt.
- Reset engine prompt.
- Safety redirect prompt/copy.
- Food vision interpretation prompt.

Response style rules:

- Short.
- Calm.
- Teen-readable.
- One useful question or one useful next action.
- No diagnosis.
- No therapy claims.
- No medical nutrition advice.
- No calorie targets for teens.
- No body scoring.
- No shame or guilt.

Tasks:

- Write prompt files with explicit voice and boundaries.
- Use Workers AI models configured through environment variables.
- Add model fallback behavior.
- Add timeout handling.
- Add response shape validation.
- Add prompt tests where possible.

Acceptance:

- Kai chat responses are concise and on-brand.
- Each engine response reflects that engine.
- Food-related responses stay teen-safe.
- Model failures produce graceful fallback copy.

Verification:

- Run prompt smoke examples.
- Test safety examples.
- Test food examples.
- Test normal check-ins.

## Milestone 6: Body Engine V1

Goal: make Physical Health the first truly useful engine.

Modules:

- Meal log.
- Food photo upload.
- Food photo interpretation.
- Hunger/fullness check.
- Energy/mood after meal.
- Movement log.
- Sleep check-in.
- Recovery/breathing flow.
- Physical history.

Meal log fields:

- meal title or description
- meal time
- optional photo ID
- hunger before
- fullness after
- energy after
- mood/context
- notes
- created timestamp

Food photo flow:

- Upload image to R2.
- Store object key in D1.
- Send image to Workers AI vision model.
- Return soft labels.
- Let user edit the interpretation.
- Save final meal entry.

Food safety guardrails:

- Do not count calories by default.
- Do not assign moral value to food.
- Do not recommend weight loss.
- Do not reward restriction.
- Detect:
  - starving
  - purging
  - bingeing with distress
  - body hatred
  - obsessive calorie tracking
  - fear of eating
- Route risky language to support copy.

Acceptance:

- User can log a meal manually.
- User can attach or stub a food photo.
- User can log movement.
- User can log sleep.
- User can complete recovery/breathing.
- All actions persist.
- Body history shows recent entries.

Verification:

- Log meal, refresh, meal remains.
- Log movement, refresh, movement remains.
- Log sleep, refresh, sleep remains.
- Risky food language triggers safety flow.

## Milestone 7: Goals Engine V1

Goal: make Potential useful for teen ambition without becoming overwhelming.

Modules:

- Strengths discovery.
- Goal creation.
- Next-step planner.
- Goal progress updates.
- Goal completion.
- Goal release/reframe.
- Goals history.

Goal fields:

- category
- title
- description
- target date
- status
- next step
- confidence
- created timestamp
- achieved timestamp

Categories:

- school
- sport
- instrument
- business
- charity
- creative
- social
- custom

Acceptance:

- User can create a goal.
- User can add a next step.
- User can mark progress.
- User can complete or pause a goal.
- User can release/reframe a goal without shame.
- Goals survive refresh.

Verification:

- Create goal, refresh, remains.
- Complete goal, progress event appears.
- Pause/release goal, status updates.

## Milestone 8: Reset Engine V1

Goal: make Mental Wellness useful while staying clearly outside therapy.

Modules:

- Feelings check-in.
- Breathing practice.
- Social media reset.
- Thought reframe.
- Future self letter.
- Reset history.

Rules:

- Use wellness framing.
- Do not diagnose.
- Do not claim treatment.
- Do not create dependency loops.
- Route crisis language immediately.
- Encourage trusted adults when appropriate.

Acceptance:

- User can complete feelings check-in.
- User can complete breathing flow.
- User can complete social reset.
- User can save a letter.
- Progress events persist.
- Safety-triggering inputs route correctly.

Verification:

- Complete each reset workflow.
- Refresh and confirm history/progress.
- Test crisis copy.

## Milestone 9: Progress, Rewards, And History

Goal: make progress meaningful without pressure.

Tasks:

- Normalize event types.
- Add event scoring rules.
- Add streak calculation.
- Add belt/level calculation.
- Add per-engine totals.
- Add history list.
- Add week summary.
- Add privacy-safe friend compare placeholder or real opt-in model.

Progress principles:

- Reward showing up.
- Reward reflection.
- Reward completion.
- Do not reward restriction.
- Do not reward unhealthy intensity.
- Do not shame gaps.

Acceptance:

- Progress page reflects real persisted events.
- User sees recent actions.
- User sees engine breakdown.
- Refresh does not reset progress.

Verification:

- Log events in each engine.
- Confirm progress page updates.
- Refresh and confirm same state.

## Milestone 10: Parent, Policy, And Trust Surfaces

Goal: make the product understandable and defensible for adults.

Tasks:

- Expand `/for-parents`.
- Update Terms.
- Update Privacy.
- Add teen safety explanation.
- Add data collection explanation.
- Add what parents can and cannot see.
- Add parent consent explanation.
- Add crisis limitation.
- Add contact/support path.

Acceptance:

- Parent can understand what Kai is.
- Parent can understand what Kai is not.
- Parent can understand consent.
- Teen privacy boundaries are clear.
- Safety escalation is clear.

Verification:

- Legal/policy review pass.
- Product copy review pass.

## Milestone 11: Analytics And Ops

Goal: know what is happening without invading teen privacy.

Tasks:

- Add `app_events` table.
- Log product events:
  - signup started
  - onboarding completed
  - engine opened
  - workflow completed
  - goal created
  - meal logged
  - safety event triggered
- Add Cloudflare Web Analytics.
- Add ops-only endpoints for aggregate counts.
- Add safety event query endpoint.
- Add basic admin/ops page or documented D1 queries.

Privacy rules:

- Do not log private message content into generic analytics.
- Keep safety content in safety-specific tables with restricted access.
- Avoid exposing teen private writing in dashboards.

Acceptance:

- We can answer:
  - how many testers signed up
  - how many completed onboarding
  - which engines are used
  - which workflows are completed
  - whether safety events occurred
- Ops can review safety events.

Verification:

- Trigger product event.
- Confirm D1 row.
- Query aggregate endpoint.

## Milestone 12: Staging And Production Discipline

Goal: make deploys repeatable.

Tasks:

- Confirm production Pages project.
- Confirm staging strategy:
  - branch previews, or
  - custom staging domain
- Confirm production Worker.
- Confirm staging Worker.
- Confirm production D1.
- Confirm staging D1.
- Confirm production KV/R2.
- Confirm staging KV/R2.
- Add environment variable inventory.
- Add secret setup checklist.
- Add deploy commands.
- Add rollback notes.

Acceptance:

- Staging deploy is repeatable.
- Production deploy is repeatable.
- Environment drift is documented.
- `.ai` and `.com` domain decision is made.

Current domain note:

- `https://kai.boostaisearch.ai` works.
- `kai.boostaisearch.com` did not resolve from the current environment at last check.
- If `.com` is required, add it as a Cloudflare Pages custom domain and configure DNS.

## Milestone 13: QA And Teen Beta

Goal: prepare for 5 teen testers.

Tasks:

- Create `docs/QA.md`.
- Add smoke test checklist.
- Add mobile checklist.
- Add accessibility checklist.
- Add teen tester script.
- Add parent review script.
- Add bug report template.
- Add feedback questions.
- Add known limitations list.

Teen tester prompts:

- What felt useful?
- What felt fake?
- What felt too adult?
- What felt too childish?
- Which tab would you actually open after school?
- What would make you delete this?
- Did anything feel unsafe or uncomfortable?
- Did food tracking feel supportive or weird?

Acceptance:

- Tester can complete onboarding.
- Tester can use each engine.
- Tester can give feedback without developer help.
- Feedback maps to clear product changes.

## Parallel Workstreams

Run these in parallel only if each branch owns separate files.

### Workstream A: Auth And Onboarding

Owns:

- `src/App.tsx`
- `src/main.tsx`
- `src/components/auth/*`
- `src/lib/api.ts`
- `workers/src/lib/auth.ts`
- `workers/src/routes/user.ts`
- consent-related migrations and libs

Goal:

- Real user identity and parent consent.

### Workstream B: Persistence And API Shape

Owns:

- `workers/src/routes/progress.ts`
- `workers/src/routes/goals.ts`
- `workers/src/routes/entries.ts`
- `workers/src/lib/events.ts`
- frontend stores

Goal:

- Refresh-safe state and normalized response shapes.

### Workstream C: Body Engine

Owns:

- `src/pages/EnginePhysical.tsx`
- food API routes
- R2 upload route
- food/meal D1 tables

Goal:

- Teen-safe food, movement, sleep, recovery workflows.

### Workstream D: Goals And Reset Engines

Owns:

- `src/pages/EnginePotential.tsx`
- `src/pages/EngineMental.tsx`
- goal route improvements
- reset workflow persistence

Goal:

- Real workflows beyond button logging.

### Workstream E: Safety And AI

Owns:

- `workers/src/routes/chat.ts`
- `workers/src/lib/safety.ts`
- prompt files
- conversation/message persistence

Goal:

- Persisted AI chat with safety-first routing.

### Workstream F: QA, Docs, Ops

Owns:

- `docs/*`
- smoke test scripts
- deployment checklist
- analytics/ops docs

Goal:

- Beta readiness and repeatable operations.

## Suggested Next 10 Codex Loops

Loop 1:

- Finish backend foundation already in the worktree.
- Commit auth/consent/conversation/events/entries/migration foundation.

Loop 2:

- Apply D1 migration to staging and production.
- Verify Worker build and deploy staging Worker.

Loop 3:

- Configure Clerk envs and Worker secrets.
- Verify auth in staging.

Loop 4:

- Implement app hydration from `/api/user/me`, `/api/progress`, `/api/goals`.
- Add loading/empty/error states.

Loop 5:

- Build Body meal log D1 route and frontend manual meal form.

Loop 6:

- Build Body movement, sleep, and recovery persistence.

Loop 7:

- Build conversation/message persistence and return conversation IDs.

Loop 8:

- Add structured safety classifier and safety event ops endpoint.

Loop 9:

- Deepen Goals and Reset workflows with persisted histories.

Loop 10:

- Add QA docs, smoke scripts, analytics events, and beta tester guide.

## Final Viability Checklist

Before calling Kai viable, confirm:

- `npm run build` passes.
- Public routes work.
- Protected routes work with real auth.
- API rejects unauthenticated protected writes.
- Onboarding persists.
- Parent consent works.
- Settings persist.
- Goals persist.
- Progress persists.
- Body engine has persisted food, movement, sleep, recovery.
- Goals engine has persisted goals and next steps.
- Reset engine has persisted reset flows.
- Chat persists.
- Safety routing works.
- Safety events are reviewable.
- Staging is separate from production.
- Production deploy is documented.
- QA script exists.
- Teen beta feedback process exists.
