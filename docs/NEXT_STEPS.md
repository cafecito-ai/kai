# Kai Build Plan

## Current State

Kai is live at `https://kai.boostaisearch.ai` with:

- React/Vite app shell on Cloudflare Pages.
- Cloudflare Workers API for user/profile, onboarding, Kai chat, progress, goals, food-photo placeholders, friends, safety, and parent consent.
- Staging and production D1/KV/R2 resources.
- Workers AI wired for Kai chat.
- A/B/C design picker at `/design`; Lev/Offy will pick the final visual direction later.

Design is now parked as an external decision. Until a direction is chosen, keep UI changes minimal and focus on product infrastructure and real workflows.

## Decisions Owed

Several P-tasks are blocked on a decision that lives outside engineering. Surface here so we can chase them in parallel with the build. Cross-link from PR descriptions when a task waits on one.

| #  | Decision                                              | Owner             | Status   | Unblocks                                                            |
|----|-------------------------------------------------------|-------------------|----------|---------------------------------------------------------------------|
| D1 | Final design direction (A / B / C from `/design`)     | Lev               | Open     | Engine UI rebuild, Kai character visual, Phase 2+ UI work           |
| D2 | Worker route binding for `kai.boostaisearch.ai/api/*` | Evan / Boost AI   | Open     | Everything live — `/api/*` currently returns SPA HTML in prod       |
| D3 | Anthropic Claude API keys + budget approval           | Offy / Boost AI   | Deferred | Vendor swap from Cloudflare Workers AI (Llama) → Claude (Phase 4)   |
| D4 | Source materials per engine (books / voices)          | Lev + Offy        | Open     | Real engine prompts (final tone, citations) for Body, Goals, Reset  |
| D5 | Clinical / safety reviewer                            | Offy              | Open     | Mental engine launch (Phase 4 Gate G5) — required before friend-test|
| D6 | Legal copy review (Terms, Privacy)                    | Offy + counsel    | Open     | Real teen testing — placeholder copy must be replaced               |
| D7 | Ops alert email recipient (`SAFETY_ALERT_EMAIL`)      | Evan / Boost AI   | Open     | Critical safety alerts in production                                |
| D8 | Staging domain strategy                               | Evan / Boost AI   | Open     | Deploy hygiene — branch-preview only vs. `staging.kai.boostaisearch.ai`|

### Notes per decision

- **D1 (design):** Direction C ("Calm Teen", light palette + plum/sage + Instrument Serif) is what the SPA currently renders. The spec's CLAUDE.md prescribes Direction A (dark + cyan); ignore that until Lev picks. While parked, route around UI rebuild work and ship design-agnostic plumbing.
- **D2 (worker binding):** Tracked in PR #3 (P0-1 prep). Once the four prereqs in `docs/DEPLOY.md` are green (Email Service, secrets, DNS, ops recipient), one `npm run worker:deploy` finishes this. Until then, the production site can't persist anything.
- **D3 (Anthropic):** Confirmed deferred. The classifier and Kai prompts are written to swap on a model-ID env var, so this is config-only when it lands.
- **D4 (sources):** Engine prompts currently use generic guidance. Ship engine workflows with placeholder source-grounding blocks; replace the blocks in one batch once Lev/Offy lock the lists.
- **D5 (clinical reviewer):** No teen sees the Mental engine until this person has reviewed the engine prompts + safety classifier behavior + parent-notification template. Build behind a feature flag in the meantime.
- **D6 (legal):** Boost AI provides drafts of Terms and Privacy that name the safety architecture and parent-notification policy. Offy's counsel reviews. Block real teen testing until reviewed copy ships.
- **D7 (ops email):** Without this, `sendSafetyAlert` silently no-ops in prod. Pick the recipient and set `SAFETY_ALERT_EMAIL` Worker secret. See `docs/DEPLOY.md` prereq 3.
- **D8 (staging):** No blocker for engineering — staging works at `kai-staging.evan-ratner.workers.dev`. Decide whether QA needs a friendlier hostname for tester invites.

## P0 — Auth And Identity

Goal: remove demo identity behavior and make every API write belong to a real user.

- Configure Clerk production and staging apps.
- Add `VITE_CLERK_PUBLISHABLE_KEY` to Cloudflare Pages environments.
- Add `CLERK_SECRET_KEY` to Worker secrets for production and staging.
- Replace `/sign-in` and `/sign-up` redirects with real Clerk screens.
- Add a reusable auth helper on the frontend that gets the Clerk token for API requests.
- Update Worker auth middleware to verify Clerk sessions and derive `userId` from the verified subject.
- Keep `x-dev-user` only in local development, never production.
- Add route guards for `/home`, `/onboarding`, `/engine/*`, `/progress`, and `/settings`.

Acceptance:

- Signed-out users can view `/`, `/design`, `/crisis`, `/for-parents`, `/terms`, and `/privacy`.
- Signed-out users are redirected from app routes to sign-in.
- Signed-in users can refresh and keep the same D1 user record.
- Production Worker rejects unauthenticated `/api/*` calls except explicit public endpoints.

## P1 — Onboarding And Parent Consent

Goal: turn onboarding into the real account setup flow.

- Store age, parent email, Kai name, Kai tone, intake responses, intake summary, and primary engine in D1.
- Add onboarding completion state to the user record.
- Redirect users who have not completed onboarding back to `/onboarding`.
- Send parent-consent email for under-18 users through Cloudflare Email Service.
- Add a consent-token table and a real `/api/parent/consent` verification flow.
- Add user-facing states for pending consent, consent complete, and resend consent email.

Acceptance:

- A new under-18 user can sign up, complete onboarding, and trigger a parent email.
- Parent consent link marks consent on the user record.
- A returning user lands on `/home` after onboarding is complete.

## P2 — Persistent App State

Goal: make dashboard and core app screens read from Cloudflare, not local-only stores.

- Fetch `/api/user/me`, `/api/progress`, and `/api/goals` on app load.
- Hydrate Zustand from API results, then keep optimistic updates for fast UX.
- Add loading, empty, and error states for all API-backed screens.
- Normalize Worker response shapes from snake_case database rows to frontend camelCase types.
- Add an API smoke-test script for production and staging.

Acceptance:

- Dashboard, progress, settings, and goals survive refresh.
- Production writes only to production D1; staging writes only to staging D1.
- Smoke tests cover user read/update, onboarding, goal create/update, progress write, and Kai chat.

## P3 — Safety And Workers AI Hardening

Goal: make AI useful while keeping safety non-negotiable.

- Replace regex-only safety with a two-step approach: fast local keyword screen plus Workers AI structured classifier.
- Store conversations and messages in D1.
- Ensure every chat route writes messages and safety metadata.
- Add prompt files for Kai, Body, Goals, and Reset that match the product voice, not the temporary shell copy.
- Add ops-only safety event list endpoint.
- Send safety alert emails for high/critical categories once Email Service sender verification is complete.

Acceptance:

- Normal Kai chat persists in D1 and returns a short useful response.
- Crisis/self-harm/eating-disorder/abuse/violence/substance messages never reach normal prompts first.
- Safety events are queryable for ops review.

## P4 — Engine Workflows

Goal: each mode should do real work, not just log a button click.

- Body: meal log, sleep check-in, movement log, breathing timer, stretching/yoga flow, R2 food-photo upload.
- Goals: strengths discovery, goal creation, next-step planner, goal completion, goal release/reframe.
- Reset: feelings check-in, breathing practice, social reset, thought reframe, future/past self letter.
- All workflows write `progress_events` with normalized event types and payloads.
- Add per-engine history views.

Acceptance:

- Each engine has at least three persisted workflows.
- Progress events are visible on `/progress` after refresh.
- Users can switch engines without losing context.

## P5 — Beta Readiness

Goal: make staging safe for Lev/Offy and 5 teen testers.

- Update Terms and Privacy to reflect real data collection, safety event handling, parent consent, and “not therapy.”
- Add accessibility pass for mobile, keyboard, contrast, and labels.
- Add Cloudflare Web Analytics and D1 product event logging.
- Add `docs/QA.md` with demo script, staging checklist, production checklist, and teen tester feedback prompts.
- Add basic monitoring notes for Pages, Workers, D1, and safety events.

Acceptance:

- 5 teen testers can use staging without developer intervention.
- No known critical auth, safety, or data-loss bugs before production beta.

## Immediate Build Order

1. Clerk auth setup and Worker verification.
2. Onboarding completion and parent-consent persistence.
3. API hydration for dashboard/progress/goals/settings.
4. Conversation/message persistence and AI safety classifier.
5. Engine workflow depth.
6. Beta QA and monitoring docs.

## Parked Decisions

See the [Decisions Owed](#decisions-owed) table at the top of this doc. D1 (visual direction), D8 (staging hostname), and D5 (clinical reviewer) are the parked items that block specific engineering work. The others are in flight.
