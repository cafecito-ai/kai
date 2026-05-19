# KICKOFF.md — How Evan starts the loop

This is the prompt Evan pastes into Claude Code (in Cursor, or the `claude` CLI) to start the build. Paste exactly this. Don't customize. The plan does the customizing.

---

## The kickoff prompt (copy/paste into Claude Code)

```
You are the build agent for Project North Star / Kai — an AI wellness companion for teenagers being built by Boost AI.

Your operating instructions are in /AGENT_PLAN.md in the repo root. Read that file end-to-end before doing anything else. It contains:
- Project context and stack
- Universal guardrails that apply to every task
- A 47-task graph organized in 9 phases with 6 mandatory gates
- The loop you'll execute

After reading AGENT_PLAN.md, also read:
- /CLAUDE.md (v2 base spec)
- /CLAUDE_v3_PATCH.md (v3 patch over the base spec — patch wins where they conflict)

Then begin task T-001.

Operating mode:
- Work the task graph in dependency order
- Self-verify each task against its Done_when criteria before committing
- Update STATUS.md, BLOCKERS.md, QUESTIONS.md, DECISIONS.md as you go
- Use the branch pattern kai/T-NNN-description for each feature task
- Post a Slack update via the webhook in .env every 10 tasks or at each Gate
- HALT at every 🛑 GATE marker and wait for explicit approval in STATUS.md
- For tasks marked `requires_safety_review`: stop and wait for Evan Ratner approval
- For tasks marked `requires_lev_input`: write the question to QUESTIONS.md and continue with other work

When in doubt, do less. Pick the more conservative interpretation. Privacy beats features. Safety beats speed.

Your supervisor is Evan Seder (intern). Evan Ratner has final approval on safety-critical decisions. Lev (16, product owner) has final approval on voice and visual direction.

Begin.
```

---

## What happens next

Once you paste that prompt:

1. **The agent reads AGENT_PLAN.md, CLAUDE.md, and CLAUDE_v3_PATCH.md** — that's about 8000 lines of context loaded into its working memory.
2. **The agent starts T-001** (branch setup) and works down the task graph.
3. **The agent commits regularly** with task IDs in the message: `[T-014] description`.
4. **The agent updates STATUS.md** as it completes each task.
5. **The agent halts at Gate 1** (after T-008) and waits for your approval.
6. **You review what was done** by checking the branch, reading STATUS.md, looking at the PRs.
7. **You post `gate-1-approved` in STATUS.md** when ready to proceed.
8. **The agent continues** through Phase B, halts at Gate 2, etc.

The whole graph runs to completion this way. Some phases will take a day. Some will take a week. The agent doesn't care. It just works the loop.

---

## What you (Evan Seder) actually do

Day-to-day, your job is to:

1. **Check the agent's work** — read the commits, run the staging deploy, click around in the UI
2. **Approve gates** — once a phase is done, review it carefully, post the approval marker
3. **Answer questions** — Lev questions get forwarded to Lev, ambiguity questions get forwarded to Evan Ratner, everything else you answer yourself
4. **Unblock the agent** — if it's stuck in BLOCKERS.md, figure out what it needs and provide it
5. **Demo on Fridays** — show what shipped this week, even if a gate hasn't closed
6. **Tuesdays at 4pm** — teach-up with Evan Ratner (Token-Maxxing Operator Manual)

You do **not** code. Or you code very little. The agent codes. You orchestrate, supervise, and verify.

---

## When to override the agent

You override the agent in these situations:

1. **It generated something that looks wrong.** Don't just merge. Ask why. If it can't explain, regenerate with a clearer prompt.
2. **It skipped a step in Done_when.** Send it back with "T-XXX missing [thing]. Iterate."
3. **It tried to touch a safety-critical file.** Block immediately, escalate to Evan Ratner.
4. **Lev says "this isn't right."** Stop, gather the specific feedback, send the agent to iterate.
5. **You're not sure what the agent did.** Pause the loop. Read the diff. Understand it before approving.

If you find yourself rubber-stamping commits without reading them, **stop**. That's the worst possible mode. Either the agent is doing well enough that it deserves real review, or it's doing poorly enough that you need to catch the problems before they compound.

---

## Things that will go wrong

I'll be honest about what to expect:

- **The agent will misread the spec sometimes.** Catch it early.
- **The agent will hallucinate file paths or APIs.** Read the diff before committing.
- **The agent will skip tests.** Force it back: "Tests are part of Done_when. Add them."
- **The agent will sometimes produce 800 lines of code where 50 would do.** Push back: "Simplify. Half the lines, same outcome."
- **The agent will sometimes get stuck in a loop.** If 3 iterations fail, you intervene. Don't let it spin forever.
- **Body scan will produce sketchy outputs in early testing.** That's why Phase E is gated. Trust the gate.
- **Voice mode will have weird latency.** That's a known limit. Don't let the agent over-engineer fixing it for v1.

The plan accounts for all of this. The gates exist for these reasons. Use them.

---

## When the build is done

Final gate (after T-047) is shipped to production. Evan Ratner pushes the deploy. Demo to Offy. Champagne if you're old enough; cafecito if you're not.

Then we start v1.1: iOS native app, Spanish, wearable integrations, all the stuff that didn't make v1.

That's the whole plan. Start the loop. Trust the structure.

— Evan R.
