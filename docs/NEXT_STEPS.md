# Kai Build Plan

## Current State

Kai is live at `https://kai.boostaisearch.ai` with:

- React/Vite app shell on Cloudflare Pages.
- Cloudflare Workers API for user/profile, onboarding, Kai chat, progress, goals, food-photo placeholders, friends, safety, and parent consent.
- Staging and production D1/KV/R2 resources.
- Workers AI wired for Kai chat.
- A/B/C design picker at `/design`; Lev/Offy will pick the final visual direction later.

Design is now parked as an external decision. Until a direction is chosen, keep UI changes minimal and focus on product infrastructure and real workflows.

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

- Final visual direction: Lev/Offy choose A, B, or C from `/design`.
- Final Kai character treatment follows the selected direction.
- Final production staging hostname: branch previews are acceptable until a custom staging domain is requested.
