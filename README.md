# Kai

Kai is the Project North Star v1 wellness platform: a mobile-first web app where teens meet a safety-aware AI mentor, complete onboarding, route into wellness engines, and track progress over time.

The product spec lives in [CLAUDE.md](./CLAUDE.md). The original proposal/build-plan artifacts from the handoff ZIP are preserved in [docs/](./docs).

## Local Development

```bash
npm install
npm run dev
```

Worker development:

```bash
npm run worker:dev
```

## Checks

```bash
npm run typecheck
npm run test
npm run build
```

## Required Environment

Copy `.env.example` into local environment files for your deployment target. Do not commit real secrets.
