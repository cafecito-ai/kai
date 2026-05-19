# CLAUDE_v3_PATCH.md — KAI v3 Patch
## Overrides and additions to CLAUDE.md (v2 base spec)
## Where this file conflicts with CLAUDE.md, this file wins.

---

## §1 — Agent Voice Updates (v3)

### Mind Agent — v3 voice refinements

The Mind Agent in v3 is slightly more grounded and less "wellness-app" in tone compared to v2. Specific changes:

- Shorter default responses. Target 2–3 sentences, not 2–4. Less is more.
- More comfortable with silence and brevity. If the user says "ok" or "thanks", a short acknowledgment is fine — don't over-respond.
- Slightly more humor is permitted when the context is light. Read the room.
- When a user deflects or gives a one-word answer, don't push. Acknowledge and leave the door open.
- Never open with a question unless you have something real to say first.

Forbidden phrases added in v3 (in addition to v2 list):
- "That makes a lot of sense"
- "It's okay to feel that way"
- "You're not alone in this"
- "I'm here for you"
- "How does that make you feel"
- Any variation of "What I'm hearing is..."

### Body Agent — v3 voice refinements

- More direct. Less warm-up. Get to the specific advice faster.
- Food logging responses capped at 2 sentences in v3 (was 3 in v2).
- When user logs a rest day, affirm it in one sentence max. Recovery is part of training — don't make it a lecture.
- Breathing protocol responses: give the actual protocol first, context second.

---

## §2 — Daily Score Updates (v3)

Score formula is unchanged from v2. Visual updates in v3:

- The score ring is now 8px stroke weight (was 6px in v2 mockups)
- Ring animates from the top (12 o'clock position) clockwise
- Score number uses JetBrains Mono weight 700, size 72px on mobile
- Sub-score cards are horizontal scroll on mobile (not a grid)
- Sub-score card tap opens a bottom sheet, not a full-screen panel
- Suggestions in the detail panel: max 2, each under 10 words, each links to the relevant feature

Score color thresholds updated in v3:
- 0–40: #F0C568 (warning amber — never red)
- 41–70: #7B6EF6 (accent violet)
- 71–100: #5EBF8A (success green)

---

## §3 — Body Scan Updates (v3)

Privacy language on the welcome screen updated in v3. Use exactly this copy:

"Your scans are private. They're stored on your device and only sent to our AI for analysis — never shared, never used for training, never seen by anyone else. You can delete any scan at any time."

Silhouette overlay guides: use a simple white outline at 40% opacity. No filled shapes. No gender-specific silhouettes — use a neutral outline.

Analysis output format updated in v3: observations and actions are now displayed as separate cards in the UI (not plain text). Each observation card has a colored left border (accentWarm). Each action card has a checkmark icon.

Maximum 3 scan sessions per week enforced in v3. If user tries to scan more than 3 times in 7 days, show: "You've scanned a lot this week. Take a few days and come back — the changes worth seeing take time."

---

## §4 — Onboarding Updates (v3)

Step order updated in v3:
1. Name input
2. Age input
3. "What do you want to work on?" — multi-select: mental clarity, confidence, getting stronger, better sleep, social life, finding purpose
4. "What's been hardest lately?" — free text, optional, skippable
5. Meet KAI — introduce both agents with two cards (Mind card in accentCool, Body card in accentWarm)
6. Tone picker — warm / balanced / direct (shown as three cards with brief descriptions)
7. Parental consent (fires automatically for under-18, cannot be skipped)

New in v3: after onboarding completes, KAI sends a personalized first message based on what the user selected. If they chose "confidence" and "social life", the opening message references those specifically. Never generic.

---

## §5 — Navigation Updates (v3)

Tab bar in v3 has 4 tabs: Home, Progress, Groups, Profile
The floating + action button opens a quick-action sheet with: Check in, Log workout, Log food, Journal, Log sleep
The + button is always visible — never hidden on scroll

Active tab indicator in v3: a small filled pill under the icon (not a top border or color change)

---

## §6 — Groups Updates (v3)

Group invite links expire after 48 hours in v3 (were permanent in v2).
Group names: max 24 characters, no profanity filter needed at v1 (add in v1.1).
Encouragement messages in v3 are sent as push notifications, not just in-app.
The "Hide my score" toggle is now per-group, not global.

---

## §7 — Voice Mode Updates (v3)

Voice opening line updated in v3:
"Hey, this is KAI. Mental or physical today — or just want to talk?"

Voice session cap updated: 10 minutes hard cap (was 15 in v2 plans).
After 9 minutes, agent says: "We're almost at our time — want to wrap up or keep going in the app?"

Voice safety: if safety classifier fires during a call, the agent says:
"Hey, I want to make sure you're okay. I'm going to ask you to reach out to someone who can really help — you can call or text 988 right now. Take care of yourself." Then the call ends.

---

## §8 — Empty State Copy (v3)

Use these exact empty state messages:

- No check-ins yet: "Want to start with a quick check-in? Takes 30 seconds."
- No workouts logged: "Log your first session — even a walk counts."
- No journal entries: "Write anything. No one's reading this but you."
- No food logs: "Take a photo of your next meal and KAI will break it down."
- No body scans: "Try your first scan — takes about 2 minutes."
- No goals set: "What's one thing you want to work on this month?"
- No groups: "Create a group and invite people you actually trust."
- No sleep logged: "How'd you sleep last night? Tap to log it."

---

## §9 — Error State Copy (v3)

Use these exact error messages:

- Network failure: "Can't connect right now. Check your connection and try again."
- AI timeout: "KAI's thinking slow today — tap to try again."
- Upload failed: "That didn't go through. Try again?"
- Camera permission denied: "KAI needs camera access for this. You can enable it in Settings."
- Auth error: "Something went wrong with your session. Try signing in again."

Never show status codes. Never show stack traces. Never blame the user.

---

## §10 — What Does Not Change From v2

These things are unchanged and v2 spec is authoritative:

- Safety architecture and protected files (§6 of CLAUDE.md)
- Forbidden language lists for Body Agent (§3 of CLAUDE.md)
- Crisis protocol (§3 of CLAUDE.md)
- Tech stack (§8 of CLAUDE.md)
- People and approval hierarchy (§9 of CLAUDE.md)
- Body scan privacy promises and encryption requirements
- Parental consent flow
- Adult blocking from teen groups
- Leaderboard opt-in default
