# KAI Client Review — Facilitator Note
**Monday, June 15, 2026 · 12:00 PM · 60 minutes**
Attendees: Boost AI (Evan), Lev (product owner), Offy (funder)

---

## The one thing to get right
Lev has been adding feature ideas instead of testing what exists. This meeting flips that.
**Rule, stated out loud in the first 2 minutes:** *"No new scope until the review quest is done. New ideas are welcome — they go on the change-request list, and we pick them up after we know the current build works."*

Say it once, point at it on screen, and hold it for 60 minutes.

---

## Before the call (15 min, required)
- [ ] **Deploy the changes.** The improvements are local-only right now. Push and deploy so the live URLs match. Then verify both load (HTTP 200, content rendered):
  - `https://kai.boostaisearch.ai/meeting-deck`
  - `https://kai.boostaisearch.ai/client-review`
- [ ] **Reset the quest** so Lev starts clean: open `/client-review`, scroll to Final boss → **Reset** (clears saved progress on this browser).
- [ ] **Open three tabs in order:** meeting deck · review quest · live app (`/home`).
- [ ] Have the invoice link handy but closed: `/review/invoice-2026-002-kai-next-steps`.

---

## Run of show

| Time | Phase | What you do | What you say |
|---|---|---|---|
| 0–5 | **Frame** | Share the **meeting deck**. Read the meeting rule card. | "Today is review and testing, not a brainstorm." |
| 5–12 | **Show** | Scroll the deck: what's built, the gates. | "Here's the whole surface area. It's broad enough to test now." |
| 12–42 | **Quest** | Hand Lev the **review quest**. He drives. One mission at a time: open the screen, use it, score it, one sentence, claim XP, next. | "You play. I'll take notes. Tell me what's good, broken, boring, or confusing." |
| 42–52 | **Scope** | Three buckets out loud for everything raised: **accepted / we fix / new scope.** Anything new → change-request list. | "That's a great idea — it's a change request. Noted for after acceptance." |
| 52–60 | **Close** | If required missions are done, fill the Final boss sign-off and **Copy summary**. Assign next owners. | "What's our decision: approved, approved with fixes, or not yet?" |

---

## Holding the scope line (say these verbatim)
- New feature pitched → *"Love it. That's new scope — it goes on the change-request list, not into this build."*
- "Can you also handle marketing / launch / school partnerships?" → *"That's the client's to own. We build and harden the app; you own the business and growth."* (This is the Walk/Jog/Run "Run" line — point to it.)
- "Is the safety/legal stuff done?" → *"Engineering is there. Final sign-off needs a clinical reviewer, a legal reviewer, and real-user testing — those are Offy's to name. We can't mark them complete for you."*

---

## What "done" looks like at 12:00
1. **Completed review quest** — required missions scored, each with one sentence.
2. **A clean bug list** — only things that actually broke during testing. Ideas are on a separate change-request list.
3. **A sign-off position** — approved / approved with listed fixes / not yet (with specific blockers).
4. **Named next owners** — Lev (testing), Offy (legal + clinical reviewer, safety-alert recipient), Boost AI (confirmed-bug fixes).

If you leave with those four, the meeting worked.

---

## After the call
- Paste the copied quest summary into the follow-up email.
- Send Lev the review-quest link to finish any missions not covered live: `https://kai.boostaisearch.ai/client-review`
- Turn the change-request list into a scoped estimate (separate from Invoice 2026-002 closeout).

---

## Asset map (what's what)
- **`/meeting-deck`** — the screen-share / share-ahead deck. Clean, confident, the story.
- **`/client-review`** — the review quest Lev actually plays. Linear: open → try → score → sentence → claim → next. Sign-off unlocks after required missions.
- **`docs/KAI_CLIENT_REVIEW_60_MIN_2026_06_15.html`** — offline backup packet (same content), if the network dies.
- **Invoice 2026-002** — kept low and neutral; bring it up only in the 42–52 scope block.
