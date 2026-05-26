# Kai Stages 4-7 Goal

Date: 2026-05-26

## Objective

Ship the next Kai-only product loop in small, reviewable slices:

1. Kai suggests tools from chat and renders safe tap targets.
2. Kai gets a private rolling memory summary.
3. Users can build and manage missions.
4. Profile becomes the gamified daily dashboard.

## Current State

- Home, Kai-only shell, and internal `superpower` routing are merged and deployed.
- Engine pages remain hidden destinations for Kai.
- `potential` production data has been migrated to `superpower`.

## Implementation Slices

### Stage 4: Tool Suggestions

- Add a shared tool registry.
- Teach Kai prompts to emit fenced `kai-tools` JSON suggestions.
- Parse tool fences client-side so raw JSON never appears in chat.
- Render tool chips under assistant replies.
- Support page tools first; inline modals can follow as component extractions.

### Stage 5: Rolling Memory

- Add `kai_memory` storage and KV cache.
- Refresh memory from recent messages, progress events, intake, and existing memory.
- Inject memory into Kai and engine prompts.
- Add a settings view and delete route so users can see and forget memory.

### Stage 6: Missions

- Add `missions` schema and API routes.
- Add pillar mapping helpers for Body, Mind, Purpose, and People.
- Add mission list/edit UI and Kai-led save surface.
- Keep missions separate from the daily dashboard.

### Stage 7: Profile Dashboard

- Add score derivations and hydration event handling.
- Replace `/profile` with the mobile-first daily dashboard.
- Move old profile details one tap deeper.
- Add Kai daily card route and component.

## Verification Bar

- `npm run typecheck`
- `npm run worker:typecheck`
- Focused Vitest suites for new helpers and touched stores/routes
- `npm run build`
- Local D1 migration apply for any schema changes
- CI green before merge

## First PR

Start with Stage 4 page-tool support because it is the routing mechanism every later stage depends on.
