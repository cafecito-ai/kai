# Kai Handoff

## Lev / Offy Review Build — 2026-05-28

Preview: `https://kai-pr143-chat-engine.kai-epk.pages.dev`

Fresh onboarding start: `https://kai-pr143-chat-engine.kai-epk.pages.dev/onboarding?fresh=1`

Use the fresh-start URL first. It clears only KAI's local app state, keeps auth state alone, and opens the first-run onboarding flow. After onboarding, review:

- Home: personalized evolving goal, daily goals, daily score, KAI entry, Day 0 card.
- Chat: safe coaching responses, readable formatting, teen-friendly tone.
- `+` button: Check in, Log workout, Log food, Log sleep, Journal, Energy, Mobility, Goals, Body scan, Voice.
- Profile: level, XP, streak, badges, growth path.
- Journey: Day 0 plus Day 30 / Day 90 / Day 365 private reflection timeline. KAI's read generates mission, identity, friction, habits, and priorities from the Day 0 caption plus onboarding context.
- Settings: adaptive reminder style and copy generated from onboarding context.
- Groups: trusted-circle progress sharing, rough score buckets, reactions.
- Progress: 7-day analytics and proof-of-showing-up view.

Final smoke pass on `390x844` mobile viewport loaded onboarding, Home, Journey, Settings, Groups, Progress, Chat, Profile, Food, Sleep, Check-in, and Workout with no console errors.

## What Is Built

- React/Vite mobile-first app with all v1 public routes.
- Cloudflare Worker API with the specified chat, onboarding, progress, goals, meals, friends, safety, and parent-consent endpoints.
- Cloudflare-first runtime: Workers AI for model calls and Cloudflare Email Service for transactional/alert email.
- D1 initial migration matching the product spec tables.
- Safety-first chat pipeline: inbound user text is classified before Claude is called.
- Local fallback behavior for development when external service keys are not set.

## Production Setup

1. Create Cloudflare D1, KV namespaces, R2 bucket, Pages project, and Worker.
2. Replace placeholder IDs in `wrangler.worker.toml` (D1 / KV / R2 bindings) and ensure the Cloudflare Pages project name in `wrangler.toml` matches the actual project.
3. Configure Clerk and set `VITE_CLERK_PUBLISHABLE_KEY` plus Worker `CLERK_SECRET_KEY`.
4. Configure Workers AI, Cloudflare Email Service, `EMAIL_FROM`, `USDA_API_KEY`, and `SAFETY_ALERT_EMAIL`.
5. Run D1 migration `workers/migrations/0001_initial.sql`.
6. Deploy production to `kai.boostaisearch.ai`; use a staging Pages project or preview branch for staging.

## Source Materials Still Needed

Lev and Offy still need to choose source materials for the physical, potential, and mental engines. Until those are chosen, the prompts use conservative generic wellness guidance.

## Safety Notes

Kai is not therapy. Crisis categories must stay intercepted before any main model response. The default resources cover U.S. and Canada; add region-specific resources before wider launch.
