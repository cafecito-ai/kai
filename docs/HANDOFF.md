# Kai Handoff

## What Is Built

- React/Vite mobile-first app with all v1 public routes.
- Cloudflare Worker API with the specified chat, onboarding, progress, goals, meals, friends, safety, and parent-consent endpoints.
- D1 initial migration matching the product spec tables.
- Safety-first chat pipeline: inbound user text is classified before Claude is called.
- Local fallback behavior for development when external service keys are not set.

## Production Setup

1. Create Cloudflare D1, KV namespaces, R2 bucket, Pages project, and Worker.
2. Replace placeholder IDs in `wrangler.toml`.
3. Configure Clerk and set `VITE_CLERK_PUBLISHABLE_KEY` plus Worker `CLERK_SECRET_KEY`.
4. Set `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `USDA_API_KEY`, and `SAFETY_ALERT_EMAIL`.
5. Run D1 migration `workers/migrations/0001_initial.sql`.
6. Connect GitHub `main` to Cloudflare Pages.

## Source Materials Still Needed

Lev and Offy still need to choose source materials for the physical, potential, and mental engines. Until those are chosen, the prompts use conservative generic wellness guidance.

## Safety Notes

Kai is not therapy. Crisis categories must stay intercepted before any main model response. The default resources cover U.S. and Canada; add region-specific resources before wider launch.
