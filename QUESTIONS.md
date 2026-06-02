# QUESTIONS.md — Open questions

Agent writes ambiguities here, tagged `for_lev`, `for_evan_ratner`, or `for_evan_seder`. Picks the most conservative interpretation and moves on per AGENT_PLAN §2.7.

---

## Q-001 — Repo source of truth `for_evan_ratner` ✅ RESOLVED 2026-05-19
**Opened:** 2026-05-19 (T-001)
**Resolution:** Repo is `cafecito-ai/kai`. See BLOCKERS B-001 (resolved) and DECISIONS D-002.

---

## Q-004 — Lev voice review: Mind agent sample responses `for_lev`
**Opened:** 2026-05-19 (T-007)
Per AGENT_PLAN T-007 Done_when: Lev reviews 5 sample Mind agent responses for voice fit. The prompt is wired (`workers/src/lib/prompts/mental-health-prompt.ts` → `renderMindPrompt`). To produce real samples we need either a staging deploy or a curl against the Worker AI binding.

**Suggested 5 inputs to send Mind agent for Lev's review:**
1. "I've been feeling really anxious lately"
2. "Mornings have been rough"
3. "I don't know what I'm doing with my life"
4. "My friends ditched me again"
5. "I'm so tired of school"

Open in `/_design-tokens` Home mockup demo: yes/no — does this voice sound like a real older sibling, or a wellness app?

---

## Q-005 — Lev voice review: Body agent sample responses `for_lev`
**Opened:** 2026-05-19 (T-008)
Per AGENT_PLAN T-008 Done_when: Lev reviews 5 sample Body agent responses. The prompt is wired (`workers/src/lib/prompts/physical-health-prompt.ts` → `renderBodyPrompt`), and every Body output is post-filtered through `workers/src/lib/body-language-filter.ts` (regen up to 3x on forbidden-language hits, then fall back to a safe canned response).

**Suggested 5 inputs to send Body agent for Lev's review:**
1. "Just finished a workout — what should I eat?"
2. "I've been training hard for 2 weeks and my back hurts"
3. "How do I get stronger without a gym?"
4. "I want to look better"  (tests the forbidden-language filter)
5. "Rest day — feel guilty for skipping"

Yes/no — right energy? Specific without being preachy?

---

## Q-006 — Routing classifier 30-message accuracy sweep `for_evan_ratner` (staging)
**Opened:** 2026-05-19 (T-006)
AGENT_PLAN T-006 Done_when calls for "test set of 30 messages, 90%+ accuracy" on routing. The unit suite covers the router contract (13 tests passing) but accuracy is a deployed-LLM claim. Need a staging run that sends 30 fixture messages through `pickAgent(env, msg)` and reports the confusion matrix (mental vs physical correctness). Tracked for the Gate 1 review.

---

## Q-003 — Light mode override of v2 §7 "Dark mode only" `for_lev`
**Opened:** 2026-05-19 (T-003 revision)
Visual direction is Lev's call per CLAUDE.md §9. Evan Seder made a working decision today to flip KAI to light mode against v2 §7's "Dark mode only" mandate (see DECISIONS D-005). Reasoning: parent trust, "real wellness app" credibility (Apple Health / Calm / Headspace school), teens are comfortable with light. Three new signature elements added: KaiOrb (KAI's face — breathing gradient orb), gradient ScoreRing (color tells the day's story), iMessage-style KaiMessage bubbles (see D-006).

**For Lev to review:** Visit `/_design-tokens` once the branch is pushed/deployed. Specifically look at the iPhone-width Home mockup. Two yes/no calls:
1. Light vs dark — keep light?
2. The three signature elements — do they feel like KAI or like "another wellness app"?

The build agent is proceeding with light + signature elements pending Lev. If Lev flips on either, the changes are bounded: tailwind.config.js for colors, three component files for signature elements.

---

## Q-002 — Design token names: AGENT_PLAN vs CLAUDE.md v2 §7 `for_evan_ratner`
**Opened:** 2026-05-19 (T-003 prep)
The two source-of-truth docs name the same colors differently:

| AGENT_PLAN.md T-003 description | CLAUDE.md v2 §7 (echoed in KAI_BUILD_PLAN Step 3) |
|---|---|
| `bg`, `bg-glass`, `surface`, `ink`, `ink-2`, `ink-muted`, `ink-soft`, `line` | `background`, `surface`, `surfaceElevated`, `border`, `textPrimary`, `textSecondary`, `textMuted` |
| Domain colors: `mental`, `physical`, `sleep`, `mood`, `goal` (no hex given) | Accents: `accent` #7B6EF6, `accentWarm` #F0A868, `accentCool` #68C5B8 |
| Font tokens: SF Pro Display, fallback Inter | Fraunces (display), DM Sans (body), JetBrains Mono (numbers) |

These are clearly two different design system iterations. Both can't be authoritative. **Agent's interpretation** (per §2.7 "do less"): treat CLAUDE.md v2 §7 + CLAUDE_v3_PATCH as authoritative, because (a) v3 patch's own header says it overrides v2 — implying v2 is the base, not AGENT_PLAN; (b) KAI_BUILD_PLAN.md Step 3 (the kickoff prompt the user pasted today) explicitly enumerated the v2 §7 names; (c) AGENT_PLAN.md text describes an older "Apple-glass" token iteration that pre-dates the planning meeting's design lock-in.

Domain colors for sub-scores (mental/sleep/mood) are not in v2 §7. Tentative mapping per v3 thresholds + Lev's onboarding card colors:
- mental → accentCool `#68C5B8` (Mind card per v3 §4)
- physical → accentWarm `#F0A868` (Body card per v3 §4)
- sleep → accent `#7B6EF6` (calm violet — also the 41–70 score-ring color)
- mood → `#F0A868` (warm) or a fresh hue?
- goal → tba

**Decision pending Ratner.** Building T-003 with v2 §7 names + the three sub-score colors tentatively mapped above. Flag if any of these are wrong.

---
