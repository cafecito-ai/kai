# Kai App Finalization Master Plan

## Product Mission

Kai is a teen wellness app for ages 13-19. It is not therapy. It is a structured coaching environment that helps teens check in, take small body and mind actions, set meaningful goals, build progress without shame, and return daily through a simple loop.

Kai should feel like a calm, sharp older sibling: warm, direct, teen-native, modern, mobile-first, and safe. It should not feel like corporate wellness software, a hospital portal, a productivity app, a generic habit tracker, or disconnected demo pages.

## Current App Inventory

- Frontend: React, Vite, TypeScript, Tailwind, React Router, Zustand.
- Backend: Cloudflare Worker, Hono, D1, KV, R2, Clerk auth, existing goals and progress APIs.
- Existing safety surface: public `/crisis`, crisis link components, service worker offline cache, safety classifier in model flows.
- Existing app shell routes: Home, onboarding, physical/mental engines, progress, groups, profile, settings, crisis, demo, ops.
- Finalization focus: converge Home, goals, progress, and engines around one daily loop.

## Route Map

- `/` and `/home`: protected app home with real loop and goal summary.
- `/loop`: protected daily five-step loop.
- `/goal`: protected guided goal composer.
- `/goals`: protected goal dashboard.
- `/goals/:goalId`: protected goal detail and status actions.
- `/crisis`: public crisis resources, always reachable.

## Demo Path

1. Open staging Home.
2. Start today’s loop.
3. Complete check-in as Stressed.
4. Complete body action: Drink water.
5. Complete mind action: Name the feeling.
6. See the no-goal prompt.
7. Start a goal.
8. Create Get stronger for basketball.
9. Return to the loop.
10. Complete goal action.
11. Finish reflection.
12. See completion and momentum state.
13. Open `/goals`.
14. Open goal detail.
15. Open `/crisis`.
16. Confirm mobile viewport is polished.

## Build Phases

1. Domain foundation: reconcile types, deterministic goal helpers, deterministic loop helpers, tests.
2. API and stores: harden API client, add goal store, add loop store, preserve offline progress.
3. Goal experience: composer, dashboard, detail, safe unsafe-text fallback.
4. Loop experience: five-step mobile flow, offline/error/loading states, goal handoff.
5. Backend persistence: daily loop D1 table and loop endpoints if missing.
6. Home and shell: remove fake data, route into loop/goal, keep crisis reachable.
7. QA and staging: local checks, deploy, staging deep-link smoke, mobile demo path.

## File Checklist

- Create/finalize `src/pages/Goal.tsx`, `src/pages/Goals.tsx`, `src/pages/GoalDetail.tsx`, `src/pages/Loop.tsx`.
- Create/finalize goal components under `src/components/goals`.
- Create/finalize loop components under `src/components/loop`.
- Create `src/stores/goalStore.ts`, `src/stores/loopStore.ts`.
- Create/finalize `src/lib/goals.ts`, `src/lib/loop.ts`.
- Modify `src/App.tsx`, `src/pages/Home.tsx`, `src/lib/api.ts`, `src/lib/types.ts`.
- Add worker loop route and migration when persistence is absent.

## API Checklist

- Preserve Clerk bearer token handling and FormData handling.
- Use staging API base for `staging.kai-epk.pages.dev`.
- Do not use a dev user on production-like hosts unless explicitly enabled.
- Add typed `KaiApiError` user-facing failures.
- Add `GET /api/loop/today`, `POST /api/loop/step`, and `POST /api/loop/sync`.
- Validate malformed, empty, non-JSON, network, auth, not-found, validation, rate-limit, and server responses.

## State Management Checklist

- Goal state starts with `goals: []` and never becomes undefined.
- Loop state can continue offline with local deterministic defaults.
- Hydration validates API/local data before rendering.
- Stores preserve user input and existing state on failed network calls.
- Async saves disable CTAs and guard duplicate submissions.
- Pending loop events never store raw teen free text.

## Safety And Privacy Checklist

- Kai never diagnoses or presents itself as therapy.
- Kai never recommends medication, drugs, dosages, supplements, or weight-loss aids.
- Unsafe goal text is not saved as a normal goal.
- Crisis text routes to a calm crisis support card and `/crisis`.
- Every app route has direct or shell-level crisis access.
- Progress payloads avoid raw sensitive free text.
- User data stays scoped to the authenticated user.

## UI/UX Polish Checklist

- Mobile-first layout at 375px.
- No raw JSON, blank screens, dead buttons, undefined/null leaks, or fake health data.
- Loading, empty, error, offline, and retry states on network-bound pages.
- Clear “Momentum” language; never call it a mental health score.
- Home clearly points into “Start today’s loop” and “Set a goal.”
- Goal cards and loop cards handle partial/malformed data safely.

## QA Checklist

- Unit tests for goal normalization, derivation, starter actions, and unsafe text.
- Unit tests for loop normalization, scoring, completion, skipping, and date rollover.
- Local checks: `npm run typecheck`, `npm run build`, `npm run worker:typecheck`, `npm run check`, `npm run test`.
- Staging deep links: `/`, `/loop`, `/goal`, `/goals`, `/crisis`.
- Manual demo path on mobile.
- Failure scenarios: API load fails, goal save fails, malformed API response, double submit.

## Definition Of Done

- This file exists and matches the shipped behavior.
- `/goal` works from empty state to saved goal.
- `/goals` safely renders empty, active, paused, and achieved states.
- `/goals/:goalId` works and handles bad params.
- `/loop` works with and without active goals.
- Home naturally routes into `/loop` and `/goal`.
- Staging deep links work for `/`, `/loop`, `/goal`, `/goals`, `/crisis`.
- Failed network calls do not blank the app.
- Malformed API responses do not crash pages.
- Inputs are preserved on failed saves.
- Save buttons cannot double-submit.
- Crisis resources are reachable.
- No fake health activity is shown as real.
- Typecheck, build, worker typecheck, and tests pass.
