# Kai Next Steps

## Current State

Kai has a live teen-facing shell at `https://kai.boostaisearch.ai`, a private GitHub repo, Cloudflare Pages/Workers staging and production resources, D1/KV/R2 provisioned, and the first design direction captured in `design.md`.

The current product is still a polished shell, not a complete app. The next work should turn the demo into a usable beta in a strict order: product shell polish, auth/onboarding, real persistence, AI/safety, then engine depth.

## 1. Product Shell Polish

Goal: make the visible app feel credible enough to show Lev/Offy and early teen testers.

- Replace remaining generic screens: onboarding, progress, settings, crisis, and all three engine pages should match the new design direction.
- Add believable demo state across all screens: recent check-ins, today plan, streaks, body/goals/reset activity, and empty states that feel intentional.
- Add a simple app frame for mobile screenshots: bottom nav, compact page headers, and no marketing-style hero after first load.
- Tighten copy everywhere against `design.md`: short, grounded, no “AI companion,” no “journey,” no therapy-coded language.

Acceptance:
- A user can click through every visible route without hitting a generic placeholder screen.
- The app reads as “teen utility” within the first 5 seconds on mobile.

## 2. Auth And Onboarding

Goal: move from demo state to real user sessions.

- Configure Clerk production/staging keys.
- Implement real sign-up/sign-in routes instead of redirects.
- Persist user profile, age, parent email, Kai name, Kai tone, and primary engine to D1.
- Build the parental-consent request flow with Cloudflare Email Service.
- Add route guards for app pages after onboarding.

Acceptance:
- New user can sign up, complete onboarding, refresh the page, and retain Kai/profile state.
- Under-18 user can trigger a parent-consent email.

## 3. Cloudflare API Integration

Goal: wire the frontend to the deployed Workers API instead of local Zustand-only behavior.

- Add `VITE_API_BASE_URL` for staging and production.
- Route Kai chat, onboarding, goals, progress events, meals, and settings through Worker endpoints.
- Store and fetch dashboard state from D1/KV.
- Add clean loading/error states for API failures.

Acceptance:
- Production app writes progress/goals/chat metadata to production D1.
- Staging app writes only to staging D1.

## 4. Workers AI And Safety

Goal: make Kai useful while keeping safety non-negotiable.

- Replace fallback chat replies with Workers AI responses using the configured text model.
- Keep safety classification before every model call.
- Add structured safety event review view for ops.
- Add safety alert email path for high/critical events.
- Create prompt files for Kai, Body, Goals, and Reset that match `design.md`.

Acceptance:
- Normal chat gets a short useful Kai reply from Workers AI.
- Crisis/self-harm/eating-disorder/abuse/violence/substance text never reaches the normal Kai prompt first.

## 5. Engine Depth

Goal: make each mode useful beyond the shell.

- Body: meal log, sleep check-in, movement log, breathing timer, and food-photo upload to R2.
- Goals: strengths discovery, goal creation, next-step planning, goal completion, and goal release/reframe.
- Reset: feelings check-in, breathing, social reset, thought reframe, and letter tool.
- All engines write normalized `progress_events`.

Acceptance:
- Each engine has at least three real workflows with persisted data and progress impact.

## 6. Beta Readiness

Goal: make the product safe to put in front of real teen testers.

- Add privacy/terms copy that accurately reflects data collection, safety handling, and “not therapy.”
- Add accessibility pass for mobile, keyboard, contrast, and form labels.
- Add analytics events for onboarding completion, engine starts, progress events, and safety events.
- Add manual QA script for Lev/Offy demos and teen friend tests.
- Create a staging test checklist and production launch checklist.

Acceptance:
- 5 teen testers can use staging without developer intervention.
- No known critical safety, auth, or data-loss bugs before production beta.

## Immediate Order

1. Have Lev/Offy pick Direction A, B, or C at `/design`.
2. Lock the selected direction into app tokens/components and archive the other two.
3. Configure Clerk and replace auth redirects.
4. Persist onboarding/profile/progress to D1 under authenticated user IDs.
5. Deepen Body, Goals, and Reset workflows.
6. Add beta QA docs and teen testing script.
