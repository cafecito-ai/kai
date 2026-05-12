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

## Routing strategy

`kai.boostaisearch.ai` serves both static SPA assets and `/api/*` from the same hostname:

- **Pages project `kai`** serves everything except `/api/*` (the SPA, `/design/*`, `/crisis`, etc.).
- **Worker `kai`** is bound to the route `kai.boostaisearch.ai/api/*` via `wrangler.worker.toml`. Worker routes take precedence over Pages on path matches, so `/api/*` hits the Worker and the SPA stays untouched.

This requires `boostaisearch.ai` to be a Cloudflare-managed zone — path-pattern routes only work on CF zones. Worker route binding is in `wrangler.worker.toml` and takes effect the next time `npm run worker:deploy` runs against the prod environment.

For staging, the Worker (`kai-staging`) is reachable directly at `kai-staging.evan-ratner.workers.dev`. No custom hostname binding yet — see open items below.

## Open Setup Items

- [x] D1/KV/R2 resources for staging and production created and wired into `wrangler.toml` + `wrangler.worker.toml`.
- [ ] Enable Cloudflare Email Service for `boostaisearch.ai` and verify the three allowed sender addresses listed in `wrangler.worker.toml`. Without this, parent-consent and safety-alert emails silently no-op (`env.EMAIL.send` returns `{ skipped: true }`).
- [ ] Verify `kai.boostaisearch.ai` CNAME to `kai-epk.pages.dev` is in place. The site currently loads, so DNS may already be wired — confirm via `dig +short kai.boostaisearch.ai` before deploy.
- [ ] First production deploy of the Worker with the route binding registered: `npm run worker:deploy`. Verification: `curl https://kai.boostaisearch.ai/api/health` returns `{"ok":true,"service":"kai-api"}`.
- [ ] Decide whether staging should be branch-preview only or use a custom hostname (`staging.kai.boostaisearch.ai`). Tracked as D8 in the project plan.
- [ ] Set production secrets: `CLERK_SECRET_KEY`, `CLERK_JWT_KEY`, `SAFETY_ALERT_EMAIL`. See `docs/DEPLOY.md` prereq 3.

See [DEPLOY.md](./DEPLOY.md) for the step-by-step.
