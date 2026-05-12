# Deploy

Step-by-step for getting Kai's Worker bound to `kai.boostaisearch.ai/api/*` in production. Run from the repo root.

## Why this exists

Today, `kai.boostaisearch.ai` serves the SPA but `/api/*` returns the SPA's `index.html` because no Worker route is bound to that hostname. Nothing the user does on prod actually persists. This doc captures the exact steps to fix it — one-time setup, then `npm run worker:deploy` on every change.

## Prereqs (one-time)

### 1. Cloudflare auth

```bash
wrangler login
```

Use the Boost AI account (`f7a9b24f679e1d3952921ee5e72e677e`). The current OAuth token must have:

- Workers Scripts: Edit
- D1: Edit (for migrations)
- KV Storage: Edit
- R2: Edit
- Zone DNS: Edit (only if you also need to manage the CNAME — see step 4)

### 2. Production D1 migrations

```bash
wrangler d1 migrations apply kai-prod --remote --config wrangler.toml
```

This applies `migrations/0001_initial.sql` + `migrations/0002_product_buildout.sql` against the `kai-prod` D1 instance (id `31687ec8-ec8e-4151-86d9-ef39951474f9`). Idempotent — safe to re-run.

Sanity check the schema:

```bash
wrangler d1 execute kai-prod --remote --command "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

You should see: `app_events`, `conversations`, `engine_entries`, `friendships`, `goals`, `meals`, `messages`, `parent_consent_tokens`, `progress_events`, `safety_events`, `user_intake`, `users`.

### 3. Production secrets

Set each secret (`wrangler` will prompt for the value):

```bash
wrangler secret put CLERK_SECRET_KEY --config wrangler.worker.toml
wrangler secret put CLERK_JWT_KEY --config wrangler.worker.toml   # the JWKS public key, optional but recommended for offline verify
wrangler secret put SAFETY_ALERT_EMAIL --config wrangler.worker.toml   # ops recipient for critical safety alerts
wrangler secret put USDA_API_KEY --config wrangler.worker.toml   # Phase 2 dependency — skip if not used yet
```

Note: `EMAIL_FROM` is in `[vars]` (non-secret) so it ships in the config. The `EMAIL` send binding does not need a secret — it uses the Cloudflare Email Service routing rules set up on the domain.

Frontend (`VITE_CLERK_PUBLISHABLE_KEY`) is set in the Pages project environment variables via the Cloudflare dashboard.

### 4. DNS

Verify `kai.boostaisearch.ai` resolves to a Cloudflare edge:

```bash
dig +short kai.boostaisearch.ai
# Expect: a CNAME chain ending at *.pages.dev (or A records pointing into Cloudflare's range)
```

If the CNAME isn't there yet, add it in the Cloudflare dashboard:

- Zone: `boostaisearch.ai`
- Type: `CNAME`
- Name: `kai`
- Target: `kai-epk.pages.dev` (the Pages project deployment)
- Proxy: orange-cloud (proxied)

The Worker route in `wrangler.worker.toml` only takes effect once DNS is on Cloudflare (the zone must be CF-managed for path-pattern routes to work).

### 5. Cloudflare Email Service

Required for parent-consent emails and parent-safety alerts. From the Cloudflare dashboard → Email → Email Routing:

1. Verify the `boostaisearch.ai` zone.
2. Add the allowed sender addresses listed in `wrangler.worker.toml`:
   - `hello@kai.boostaisearch.ai`
   - `safety@kai.boostaisearch.ai`
   - `noreply@kai.boostaisearch.ai`
3. Without this, `env.EMAIL.send(...)` returns `{ skipped: true }` and emails are silently no-op'd — see `workers/src/lib/email.ts`.

## Deploy (every change)

```bash
npm run check         # vite build + typecheck + worker typecheck
npm test              # vitest run (24 tests at last count)
npm run worker:deploy # wrangler deploy --config wrangler.worker.toml
```

The Pages project auto-deploys on push to `main` via the dashboard's Git integration.

## Verify

```bash
# 1. Worker health endpoint reachable through the bound route
curl https://kai.boostaisearch.ai/api/health
# Expect: {"ok":true,"service":"kai-api"}

# 2. Unauth API rejected
curl -sI https://kai.boostaisearch.ai/api/user/me
# Expect: HTTP/2 401

# 3. SPA still served on non-/api paths
curl -sI https://kai.boostaisearch.ai/ | head -5
# Expect: HTTP/2 200 + text/html

# 4. Smoke against prod (requires a Clerk session or a non-prod env)
# Staging is reachable directly at the workers.dev URL:
KAI_API_BASE_URL=https://kai-staging.evan-ratner.workers.dev \
  KAI_DEV_USER=smoke-$(date +%s) \
  npm run smoke:api

# 5. After P0-2 (PR #1) lands, confirm x-dev-user is rejected in prod:
curl -sI -H 'x-dev-user: smoke-test' https://kai.boostaisearch.ai/api/user/me
# Expect: HTTP/2 401
```

## Rollback

```bash
wrangler rollback --config wrangler.worker.toml
```

Rolls the Worker back to the previous deployment. Pages rollbacks are done from the dashboard (Deployments → Retry deployment on an older commit).

If the rollback also needs to revert a D1 migration, prepare a down-migration file *before* deploy and run it explicitly — `wrangler d1` has no automatic rollback.

## Staging

Staging Worker (`kai-staging`) is reachable at `https://kai-staging.evan-ratner.workers.dev`. No custom hostname binding today.

```bash
npm run worker:deploy:staging
```

Staging D1 (`kai-staging`, id `03f03ca8-5194-4599-8e87-68a9abc4b9af`) is wired in `wrangler.worker.toml`. Apply migrations:

```bash
wrangler d1 migrations apply kai-staging --remote --env staging --config wrangler.worker.toml
```

The decision of whether staging gets its own custom hostname (`staging.kai.boostaisearch.ai`) is open — see `docs/CLOUDFLARE_SCOPE.md`.

## Open items (block this deploy)

These must be completed by Evan/Boost AI before the first production deploy:

- [ ] Cloudflare Email Service verified for `boostaisearch.ai` (prereq 5)
- [ ] Production secrets set: `CLERK_SECRET_KEY`, `CLERK_JWT_KEY`, `SAFETY_ALERT_EMAIL` (prereq 3)
- [ ] Verify `kai.boostaisearch.ai` CNAME is in place (prereq 4)
- [ ] Decide on `SAFETY_ALERT_EMAIL` recipient — flagged as D7 in the plan

## Troubleshooting

**`/api/health` returns SPA HTML after deploy.** The Worker route didn't register. Check the Cloudflare dashboard → Workers & Pages → `kai` Worker → Triggers → Routes. The route `kai.boostaisearch.ai/api/*` should be listed and the zone should resolve. If the zone isn't on Cloudflare, the route won't match.

**`/api/health` returns 1101 / generic error.** Worker code error — `wrangler tail --config wrangler.worker.toml` to stream logs.

**Parent consent email not sending.** Check Cloudflare Email Service verification status. The `env.EMAIL.send` binding silently returns `{ skipped: true }` if the binding is missing — by design (don't block chat turns) — but it leaves no trace in logs. Worth adding a log at the email-send site as a follow-up.

**D1 query fails with "no such table".** Migrations not applied. Re-run prereq 2.
