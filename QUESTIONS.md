# QUESTIONS.md — Open questions

Agent writes ambiguities here, tagged `for_lev`, `for_evan_ratner`, or `for_evan_seder`. Picks the most conservative interpretation and moves on per AGENT_PLAN §2.7.

---

## Q-001 — Repo source of truth `for_evan_ratner` ✅ RESOLVED 2026-05-19
**Opened:** 2026-05-19 (T-001)
**Resolution:** Repo is `cafecito-ai/kai`. See BLOCKERS B-001 (resolved) and DECISIONS D-002.

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
