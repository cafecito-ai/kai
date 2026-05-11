# Cloudflare Scope

## Environments

- Production app: `kai.boostaisearch.ai`
- Production Pages project: `kai`
- Current production Pages deployment: `https://e6cfea60.kai-epk.pages.dev`
- Staging app: `staging-kai.pages.dev` or a later `staging.kai.boostaisearch.ai` custom hostname
- Worker names: `kai` for production, `kai-staging` for staging

## Cloudflare Products

- Pages for the teen-facing web shell.
- Workers + Hono for `/api/*`.
- D1 for users, intake, conversations, meals, goals, progress, friendships, and safety events.
- KV for session/progress caches.
- R2 for food photos and avatar assets.
- Workers AI for Kai and engine model calls, plus vision for food-photo interpretation.
- Cloudflare Email Service for parent consent and safety alerts.
- Cloudflare Web Analytics plus D1 event tables for product/ops telemetry.

## Open Setup Items

- D1/KV/R2 resources for staging and production have been created and wired into `wrangler.toml`.
- Enable Email Service for `boostaisearch.ai` and verify allowed sender addresses.
- `kai.boostaisearch.ai` is attached to the production Pages project, but DNS still needs a CNAME to `kai-epk.pages.dev`. The current token can read zones but cannot write DNS records.
- Decide whether staging should be branch-preview only or use a custom hostname.
