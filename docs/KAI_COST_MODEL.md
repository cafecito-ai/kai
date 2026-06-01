# KAI — API Cost Model (what the client should expect)

_Last updated 2026-06-01. Reflects the all-Sonnet config now on staging._

## TL;DR

- **Per active teen: ~$2–4 / month** of Anthropic spend at the current all-Sonnet
  quality setting, for a genuinely engaged user. Light users cost cents; heavy
  daily users ~$6.
- **Fleet:** ~**$230/mo per 100 active teens**, ~**$2.3k/mo per 1,000**,
  ~**$23k/mo per 10,000** (scales linearly).
- **The biggest lever is the chat model.** Dropping the reply model from Sonnet
  to Haiku cuts per-teen cost ~**3×** (to <$1/mo) at a real quality cost — see
  "Free vs paid" below.
- **QA eval runs** (the 100-teen simulation) cost ~**$8–15 per full run**, run
  on demand, not per user.

> ⚠️ **Price assumptions are explicit and must be verified.** This model assumes
> Sonnet 4.6 ≈ $3 / 1M input + $15 / 1M output, Haiku 4.5 ≈ $1 / 1M input +
> $5 / 1M output. If Anthropic's current list prices differ, every number below
> scales linearly — change the two rates and the rest follows. Confidence on the
> *structure* is high; on the *absolute dollars*, moderate (pending price confirmation).

## What costs money (per message)

Every chat message flows through up to three model calls:

| Call | Model | When | ~Input tok | ~Output tok | ~Cost |
|---|---|---|---:|---:|---:|
| Safety classifier | Haiku 4.5 | only on distress-flagged messages (~15–25%) | ~2,000 | ~50 | ~$0.0023 |
| Agent router | Haiku 4.5 | only on model-path turns | ~1,500 | ~8 | ~$0.0015 |
| Coaching reply | **Sonnet 4.6** | model-path turns (not greetings/canned) | ~2,500 | ~350 | **~$0.0128** |

- **Greeting / common-opener / continuation turns are ~free** — they're answered
  by canned fast-path workflows with no model call (the safety regex runs first
  at no cost).
- **A model-path coaching turn ≈ ~$0.015 all-in** (Sonnet reply + Haiku router +
  amortized Haiku safety).
- Token figures are measured from the live prompts: the mental-health system
  prompt alone is ~1,900 tokens; with conversation history + context a depth turn
  lands around ~2,500 input / ~350 output.

Ancillary features (check-in reflections, journal reflections, food/workout
comments) run on **Haiku** (cheap) and are occasional, not per-message.

## Per-teen monthly scenarios

Assumes ~60% of an engaged teen's messages reach the model (the rest are
greetings/short openers served free). Adjust the message count to taste.

| User type | Msgs/mo | Model-path turns | Chat cost | + ancillary | **Total/mo** |
|---|---:|---:|---:|---:|---:|
| Light | 50 | ~25 | ~$0.38 | ~$0.10 | **~$0.50** |
| Average engaged | 200 | ~120 | ~$1.80 | ~$0.50 | **~$2.30** |
| Heavy daily | 500 | ~325 | ~$4.90 | ~$1.00 | **~$5.90** |

## Fleet projection (Anthropic spend only)

Using the "average engaged" ~$2.30/teen/mo:

| Active teens | ~Monthly | ~Annual |
|---:|---:|---:|
| 100 | ~$230 | ~$2.8k |
| 1,000 | ~$2,300 | ~$28k |
| 10,000 | ~$23,000 | ~$276k |

Not all registered users are *active* — bill scales with engaged users, not
sign-ups. A realistic mix (many light, few heavy) tends to land **below** the
"all average" line.

## Free vs paid — the model lever

Currently **all-Sonnet** (one quality tier). The plumbing for a per-user plan
flag already exists (`selectChatModel` + env vars), so a future split is a small
change:

| Tier | Reply model | ~Cost/active teen/mo | Quality |
|---|---|---:|---|
| **Free (Haiku)** | Haiku 4.5 | **~$0.75** | Good for everyday coaching; weaker on layered/emotional turns |
| **Current (Sonnet)** | Sonnet 4.6 | **~$2.30** | Strong, nuanced coaching (what's deployed) |
| Premium (Opus heavy turns) | Sonnet + Opus | ~$3.50–5 | Highest ceiling on the hardest conversations |

Note from QA: the **safety classifier always runs on Haiku regardless of tier**,
so crisis detection is not degraded on a free tier. The structural quality bugs
we just fixed (canned-reply loops, safety gaps) were **model-independent** —
they affected every tier equally.

## Costs that are NOT per-message

- **Cloudflare Workers/D1/R2/KV:** negligible at this scale (well within paid-plan
  included usage; dollars/mo, not per-teen).
- **QA simulation runs** (`npm run teen:sim`): ~$8–15 per 100-persona run
  (dominated by the Sonnet judge), run on demand when validating changes.
- **Food-photo vision / body-scan analysis:** occasional per-user, Haiku-vision
  class; small unless usage is heavy. Not modeled per-message here.

## How to tighten this estimate

1. Confirm the two price rates above against Anthropic's current list.
2. Pull real usage once live: messages/teen/day and the actual model-path % (the
   60% assumption is the biggest swing factor — it's higher for power users).
3. Re-run `teen:sim` on Haiku vs Sonnet to quantify the free-tier quality gap in
   hard numbers before committing to a free/paid split.
