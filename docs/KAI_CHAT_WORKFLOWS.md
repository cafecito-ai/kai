# KAI Chat Workflows

KAI answers in layers:

1. `preSafety`: harmless instant replies that can safely skip safety latency, currently only simple greetings.
2. safety classifier: crisis, self-harm, unsafe restriction, abuse, violence, and substance risk.
3. `physical-workflow`: prepared sports, food, recovery, and body-support replies.
4. `kai-workflow`: prepared teen life, school, confidence, social, mood, habit, and routine replies.
5. `model`: fallback for nuanced messages that do not match a prepared workflow.

The live response includes `responseSource` and `workflow` when a prepared workflow answers.

## Adding A Workflow

Edit [chat-workflows.ts](../workers/src/lib/chat-workflows.ts).

Use this checklist:

- Put specific workflows above broad workflows.
- Keep replies to 1-2 short paragraphs when possible.
- Sound like a calm older friend, not a worksheet.
- Give one useful move, not a long plan.
- Avoid banned phrases from `scripts/chat-sim.mjs`.
- Add or update a `chat:sim` case with `expectWorkflow`.
- Add a focused unit test if the workflow covers a recurring user complaint.

## Common Routing Mistakes

- A broad friendship workflow can steal apology or breakup messages.
- A broad anger workflow can steal sports practice messages.
- Food workflows should require food words, not just `make`, or they will steal planning asks.
- Short follow-ups like `photos`, `people`, or `shot reps` need continuation workflows because the current message alone is ambiguous.

## Validation

Run:

```bash
npm run test -- workers/test/chat-fast-path.test.ts workers/test/chat-format.test.ts workers/test/chat-workflows.test.ts workers/test/safety.test.ts workers/test/agent-router.test.ts
npm run worker:typecheck
npm run worker:deploy:staging
npm run chat:sim
```

Before calling a loop done, `npm run chat:sim` should pass and the new case should show the intended `responseSource:workflow`.
