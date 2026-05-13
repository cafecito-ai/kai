/**
 * Conflict + repair primer. Focused depth on hard conversations, the apology
 * shape, repair after harm, conflict de-escalation, when to walk away,
 * mediation paths, and online conflict specifically.
 *
 * Voice rules (strict):
 *   - No "avoid conflict" framing. Avoidance has its own cost.
 *   - No "stand up for yourself" framing as universal advice. Sometimes
 *     stepping back is wisdom, sometimes it's avoidance.
 *   - No moralizing who's "right" in conflicts. Most conflicts involve
 *     legitimate concerns on both sides + some misunderstanding.
 *   - Repair is treated as a learnable skill, not a moral test.
 *   - For conflict that involves abuse / harassment / coercion → trusted
 *     adult / school counselor / specific resources, NOT relationship
 *     repair techniques.
 *   - Online conflict named specifically — the patterns differ from in-person.
 */

export type ConflictCategory =
  | "hard_conversations"
  | "the_apology_shape"
  | "repair_after_harm"
  | "de_escalation"
  | "when_to_walk_away"
  | "online_conflict";

export type ConflictArticle = {
  id: string;
  category: ConflictCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const CONFLICT_ARTICLES: ReadonlyArray<ConflictArticle> = [
  {
    id: "having-a-hard-conversation",
    category: "hard_conversations",
    title: "How to have a hard conversation",
    summary: "Hard conversations are a learnable skill. Most teens have never seen one done well; that doesn't mean it can't be done.",
    readMinutes: 4,
    body: `Hard conversations get avoided more than almost any other useful adult skill. Most teens watch the adults around them either explode or shut down, rarely modeling a third option. The third option exists and is learnable.

**The pre-conversation work:**

Before the conversation, do these:

**1. Get clear on what you actually want from this conversation.**
Not vague: "I want them to understand me." Specific: "I want to tell them that the comment last week hurt, and ask them to not do that again." Or: "I want to know whether they want to keep being friends, and tell them I want to."

If you don't know what you want, you're not ready for the conversation. Either figure it out alone first or with a journal or a trusted person.

**2. Pick the time and place.**
Not in front of others. Not during another activity. Not at a moment when either of you is at low capacity (tired, hungry, drunk, stressed). Plan for a moment when you're both in decent shape.

**3. Calm your body first.**
Stress responses make hard conversations worse. Take a walk before. Breathe. Cool water on the face. The body needs to be in a tolerable range, or you'll react instead of respond.

**4. Pre-commit to staying.**
A common pattern: hard conversation starts, you get uncomfortable, you leave (literal or emotional). The conversation never finishes. Decide in advance that you'll stay through the discomfort, within reasonable limits.

**The conversation itself:**

**Opening matters.** A good opening sets up the rest of the conversation.

Good openings:
- "I want to talk about something. Is now okay?"
- "There's been something on my mind I want to bring up."
- "I want us to figure something out together."

Bad openings:
- "We need to talk." (Triggers defensiveness in most people.)
- "I'm just going to say it: you're [accusation]." (Starts in attack.)
- "Why did you...?" (Starts in interrogation.)

**Frame: describe what happened, name your experience, ask for their view.**

The structure that often works:

1. **The thing.** "Last weekend, you said X." Specific, factual, not interpreted. Just what happened.
2. **Your experience of it.** "When you said that, I felt [feeling]. I've been thinking about it since." Not "you made me feel" (which puts them on defense) but "I felt" (your experience, which they can't argue with).
3. **The ask.** "I want to understand what happened. Can you tell me your side?"

This invites them in instead of cornering them.

**Listen for what surprises you.**

The most useful thing in a hard conversation is hearing what you didn't expect. Their experience of the same event is often different from yours. Listen for the parts that don't match your version. That's where the actual conversation is.

People listen to defend, but a hard conversation only goes anywhere if at least one person is listening to understand.

**Stay with the topic.**

Hard conversations tend to drift. Old grievances surface. The original topic gets buried. If you started about one specific thing, stay with it. "Let's stay with what we were talking about — we can come back to that later."

If they drift to attack you, you can name it without joining the spiral: "I want to come back to what I was saying. I hear that you have things to bring up too. Can we finish this thread first?"

**Allow space for repair, not just resolution.**

Some hard conversations end with "I understand what you meant" — no fix needed. Some end with "I owe you an apology" (see apology article). Some end with "We see this differently and we're both okay with that." All of these are real endings.

**The endings that aren't endings:**

- "Let's just forget about it." (Sweeps it under the rug; it'll come back.)
- "Whatever, fine." (Capitulation, not agreement; resentment-producing.)
- "You always do this." (Escalation away from the topic.)
- Walking out without saying you're done. (Leaves it open and worse.)

**Closing the conversation:**

When the hard part is done, name what just happened. "Thanks for talking through that with me." "I'm glad we did this." "I feel better now." This isn't performance; it's marking that you both did something hard together.

If the conversation didn't resolve fully: "I think we still have more to work out, but I'm tired. Can we come back to it in a few days?" Naming the unfinished business is more respectful than just dropping it.

**A note on conversations with parents specifically:**

Parent conversations have specific dynamics:

- They often feel less collaborative than peer conversations (power dynamic).
- Parents may move into protection mode quickly ("you don't know what you're doing").
- Old patterns activate fast.

What helps:
- Pick the right parent for the specific topic (often one is more available for a given subject).
- Schedule explicitly. "Can we talk Saturday morning? I want to bring something up."
- Lower stakes when possible. "I want to talk about a feeling I've been having, not an emergency."
- If conversations consistently go badly: family therapy is a real option. School counselor can refer.

**A note on conversations with romantic partners:**

The hard-conversation skill correlates strongly with relationship longevity. Couples who can have hard conversations (and repair after them) tend to last; couples who can't tend not to.

If you're in a romantic relationship: practice the skill now. The early relationships are reps.

**When hard conversations aren't enough:**

Some conflicts go past what direct conversation can fix:
- Abuse, harassment, coercion (see relationships primer for warning signs).
- Power imbalances that prevent honest dialogue (teacher, coach, employer, much older person).
- Mental health issues making conversation difficult (severe anger, persistent dissociation, untreated trauma).

In these cases: a trusted adult, a counselor, a mediator. Not all conflicts are repairable through better technique.`,
    takeaways: [
      "Hard conversation skill: know what you want, pick the time/place, calm your body first, pre-commit to staying.",
      "Opening matters. Frame: specific what-happened + your experience + invite their view. Listen for what surprises.",
      "Some endings: understanding, apology, agreement to disagree. NOT endings: 'whatever fine', walking out silent.",
      "Conflicts involving abuse / coercion / serious power imbalance: trusted adult / counselor, not just better technique."
    ]
  },
  {
    id: "the-apology-shape",
    category: "the_apology_shape",
    title: "Apologies that actually repair",
    summary: "Most teen (and adult) apologies don't repair anything. The components of a real apology are specific and learnable.",
    readMinutes: 3,
    body: `Most apologies are bad at the thing apologies are supposed to do. "Sorry" alone doesn't restore much. The standard "if I hurt you, I'm sorry you feel that way" actively makes things worse.

The components of a real apology are well-documented (psychologist Aaron Lazare's work, Janis Abrahms Spring, others). Knowing the structure helps you apologize when needed AND recognize when you're being given a non-apology.

**The components of a real apology:**

**1. Specific acknowledgment of what you did.**

"I'm sorry for what I did" is too vague. The named thing matters: "I'm sorry I told [friend] about what you said to me in confidence."

Specificity does two things: it shows you actually understand what you did, and it prevents the apology from being applied to a different (smaller) version of events.

**2. Acknowledgment of the impact on the other person.**

"I know that hurt you" — not as your assessment but as recognition that they experienced harm. "I can see why that felt like betrayal to you."

This is the part most people skip. The apology has to demonstrate that you understand what the action did, not just that you regret it.

**3. Accepting responsibility without excuse.**

"I shouldn't have done that. There's no excuse." Not "I shouldn't have done that, BUT [list of justifications]." The "but" cancels the apology.

This is the hardest part. Most apologies fail here because the apologizer rushes to explain themselves. The right time to explain context (if any) is later, after the apology has landed — not woven into it.

**4. A commitment to do differently.**

"I won't share things you tell me in confidence going forward. If something feels like you'd want others to know, I'll ask first."

Specific, behavior-level, future-facing. Not "I'll try to be a better friend" (too vague) but a particular thing you'll do or not do.

**5. (Sometimes) An offer of repair.**

"Is there anything I can do?" Some hurts have specific repairs available; some don't. Asking what would help isn't required for every apology, but it's often appropriate.

**What a real apology looks like in full:**

"I'm sorry I told [other friend] about what you said about your family. I shared something you told me in confidence, and I can see why that feels like betrayal. There's no excuse. I won't share things you tell me in confidence going forward, and if I'm not sure whether something's confidential, I'll ask. Is there anything else I can do?"

That's the shape. Specific + impact + responsibility + future + repair offer.

**What apologies often look like instead:**

**Non-apologies (avoid these AND watch for them):**

- **"I'm sorry you feel that way."** This isn't an apology; it's a verdict on the other person's feelings.
- **"I'm sorry if I hurt you."** Conditional. Doesn't acknowledge harm; suggests it might not be real.
- **"I'm sorry, but..."** The "but" cancels the apology.
- **"I'm sorry you took it that way."** Blames the receiver for the harm.
- **"It wasn't a big deal."** Minimizes the impact.
- **"I'm sorry for everything."** Too vague to mean anything.
- **"You were wrong too."** Shifts to whataboutism.
- **"You're too sensitive."** Hostile.
- **"Forgive me."** Demands forgiveness; the apologizer isn't entitled to it.

If you receive any of these, what you got isn't an apology. You're under no obligation to accept it as one.

**Why this is hard:**

A real apology costs something psychologically. It requires:
- Admitting fault.
- Sitting with the discomfort of having harmed someone.
- Not defending yourself.
- Not knowing if it'll be accepted.

Most people instinctively defend themselves to avoid this discomfort. The defenses are the apology-killers.

**What the apologizer doesn't get to control:**

- Whether the other person forgives you.
- How quickly they "get over it."
- Whether they want to keep the relationship.
- Whether they bring it up again.

You apologize; they decide what to do with it. The apology isn't transactional. If you're apologizing to extract forgiveness, that's a different transaction and people can feel it.

**Apologies you may need to give that are hard:**

To friends — for betraying confidence, talking behind their back, ghosting, prioritizing someone else.

To family — for the way you spoke to a parent / sibling in a fight; for not being honest about something significant.

To people you bullied or excluded — even years later, an apology can repair more than expected, both for them and for you. Even if the friendship is gone.

To people you hurt through past actions in adolescence — the version of you that did the thing isn't who you are now. Owning it is the path forward; pretending it didn't happen is the trap.

**For receiving apologies:**

If someone gives you a real apology:
- You don't have to accept it immediately. "Thank you for saying that. I need to think about it."
- You can name what you still need. "I appreciate the apology. I'd also want X."
- You don't have to forgive them right away (or ever). The apology and your forgiveness are separate.
- Forgiveness is for you, not for them. It's something you give yourself eventually, sometimes years later, sometimes never.

**A note on self-apology:**

People often need to apologize to themselves for past decisions. The structure is the same: specific acknowledgment, recognition of impact (on yourself), accepting responsibility without excuse, commitment to do differently.

This isn't fluff. People who can apologize to themselves cleanly move past their past more effectively than people who can only self-blame or only deflect.`,
    takeaways: [
      "Real apology = specific + acknowledges impact + accepts responsibility without excuse + commits to different + (sometimes) offers repair.",
      "Non-apologies to avoid AND watch for: 'sorry if', 'sorry you feel', 'sorry but', 'sorry you took it that way', 'forgive me'.",
      "You apologize; they decide what to do with it. Apology isn't transactional; can't extract forgiveness.",
      "Receiving: you can take time, name what you still need, choose whether to forgive. Forgiveness is yours, not theirs to extract."
    ]
  },
  {
    id: "repair-after-harm",
    category: "repair_after_harm",
    title: "Repair after you've hurt someone",
    summary: "When you've done real harm — not just hurt feelings — repair is a longer process than one apology. Here's the structure.",
    readMinutes: 4,
    body: `Sometimes you do something that's not just "we had a misunderstanding" — it's actual harm. Spread a rumor that hurt someone. Cheated on a partner. Stole from a friend. Betrayed a confidence in a way that had consequences. Said something cruel and meant it. Did something that genuinely hurt someone you care about.

Repair in those situations is more than apology. The apology is the entry point; the actual repair is what follows.

**The components of real repair:**

**1. Full acknowledgment.**
Specific and complete. Not "I did some things that weren't great" but "I did X, Y, and Z." Without minimizing. The hurt person already knows what you did; pretending you don't see it fully insults them.

**2. Apology that meets the standard.**
See the apology article. Real apology has specific components; "I'm sorry" alone isn't enough for real harm.

**3. Listening to the impact.**
The hurt person often needs to be heard. Sometimes multiple times. Sometimes for a long time. They get to tell you what your action did to them, in their words, for as long as it takes.

This is hard because hearing it produces shame. The shame is your work to manage; it's not theirs to soften.

**4. Changed behavior — visibly.**
The most important component. People can apologize anytime; only changed behavior over time shows it was real.

If you cheated, fidelity from now forward (or honest re-negotiation of the relationship). If you betrayed a confidence, demonstrated trustworthiness with smaller information for months. If you stole, paying back AND demonstrating you understand what was stolen wasn't just the object.

Changed behavior doesn't have a timeline. It's how long the hurt person needs to see the change before they trust it.

**5. Accepting the consequences.**
You don't get to apologize and have the relationship be the same. Some relationships end after harm. Some change permanently. Some recover but never to where they were.

Accepting the consequences without resentment is part of repair. "I deserve worse" is also wrong (excessive self-flagellation isn't repair, it's avoidance dressed up as morality). Just accepting what is.

**6. Sometimes: amends beyond the apology.**

For some harms, there are specific reparative actions. Returning what was taken. Apologizing publicly if the harm was public. Making it right materially in some way.

For other harms there are no specific amends — only changed behavior over time.

**What the hurt person decides, not you:**

- Whether to forgive you.
- Whether to stay in the relationship.
- When they're ready to talk again.
- What level of trust to extend.
- Whether your apology was sufficient.
- Whether they want to hear from you at all.

You can want all of those things. You can't have any of them on your timeline.

**The wait:**

Real repair often takes time. The hurt person may need:
- Days before they want to talk.
- Weeks before they can have a real conversation about it.
- Months of seeing your changed behavior before they trust you again.
- Years to fully recover, if ever.

Pressing for forgiveness or "moving past it" before they're ready is its own harm.

**What's not repair:**

- "I said I was sorry, why can't you let it go?" (Treats your apology as a transaction.)
- "It wasn't that big a deal." (Minimization.)
- "You're holding it over my head." (Reframes the consequences of your action as their flaw.)
- "I'm not the same person who did that." (Maybe true; doesn't undo the harm.)
- Apologies to multiple people / public displays without the actual private repair work.
- Apologies you make to feel better about yourself.

**A note on self-flagellation:**

After significant harm, there's often a phase of intense shame. Some people get stuck there and start performing badness — punishing themselves visibly to demonstrate they understand what they did.

This isn't repair. It often centers the harm-doer's pain in a way that further burdens the hurt person.

The work is: acknowledge, apologize, listen, change, accept consequences. Not punish yourself indefinitely. Real repair eventually includes putting it down — after the work — and not continuing to make the harm about you.

**When the relationship doesn't survive:**

Sometimes you do everything right and the relationship still ends. The harm was too much, or the trust was too damaged, or they just don't want to be in relationship with you anymore.

This is real. It's also a consequence you accept. The repair was still real even if the relationship doesn't continue. The work changes you for future relationships.

**When you can't reach the person:**

Sometimes the person you harmed is unreachable: estranged, moved away, doesn't want contact, has died.

In these cases, the repair shifts:
- Doing the inner work of acknowledgment, even without a recipient.
- Sometimes a letter you write but don't send.
- Sometimes living differently as a kind of repayment — being to others what you wish you'd been to them.
- Sometimes a therapist or counselor to process what can't be processed alone.

The repair isn't fake just because the recipient isn't there. It's real, just different.

**Specific cases worth knowing:**

**If you bullied someone in middle school:**
Even years later, an unprompted apology can repair more than expected — both for them and for you. "I've been thinking about [thing I did]. It was cruel. I'm sorry. I don't expect anything from you; I just wanted to say it." Some people respond gratefully. Some don't respond. Either is fine.

**If you cheated on a partner:**
Real repair often requires couples' work (or relationship counseling), full disclosure (not slow drips of truth over time), specific behavior changes, and acceptance that the relationship may not survive.

**If you said something hostile in a public moment:**
The apology often needs to be where the harm happened. Public action sometimes requires public acknowledgment.

**If you broke trust in a friend group:**
Repair often involves multiple conversations, sometimes with multiple people, and demonstrated trustworthiness over months. Friend groups have collective memory.

**When you need help with this:**

If you're carrying significant past harm and don't know how to repair it, a counselor can help. They can help you:
- Distinguish what's actually yours to own from what isn't.
- Plan apologies and conversations.
- Process the shame so it doesn't paralyze the repair work.
- Decide whether reaching out is the right move (sometimes it isn't, depending on the situation).

This isn't weakness. It's adult work, available to teens too.`,
    takeaways: [
      "Real repair = full acknowledgment + meeting-the-standard apology + listening to impact + changed behavior over time + accepting consequences.",
      "What the hurt person decides, not you: forgiveness, timing, whether the relationship continues, level of trust to extend.",
      "Self-flagellation isn't repair. After doing the work, eventually you put it down — repair isn't lifelong punishment.",
      "Significant past harm carried without resolution → counselor. Adult work; available to teens; isn't weakness."
    ]
  },
  {
    id: "de-escalation",
    category: "de_escalation",
    title: "When a conflict is escalating in the moment",
    summary: "Most fights get worse not because of what's said but because of how they're said. De-escalation is a specific skill.",
    readMinutes: 3,
    body: `Sometimes you find yourself in a conflict that's heating up in real time. Voices raise. Bodies tense. The thing you wanted to talk about is gone; you're fighting about how you're fighting. De-escalation is the skill of cooling these moments before damage is done.

**Recognize escalation early:**

The signs:
- Your voice is louder than the situation warrants.
- Your heart rate is up.
- You're interrupting them; they're interrupting you.
- Old grievances are coming up.
- You're making faces, eye-rolls, sighs.
- They are.
- One of you said something cutting.
- You're starting sentences with "You always..." or "You never..."

These are escalation signals. The conflict is moving away from problem-solving and toward damage.

**The de-escalation moves:**

**1. Slow your body down.**

The body controls the conflict more than the words. If your nervous system is in fight mode, you'll fight regardless of what you intend.

- Lower your voice (not louder; quieter).
- Slow down your speaking pace.
- Take a breath before responding.
- Drop your shoulders.
- Unclench your jaw.

Your body shifts first; the words follow.

**2. Lower the stakes verbally.**

Move from absolutes to specifics:
- "You never listen" → "I felt unheard in that moment."
- "You always do this" → "When this came up last time, it went badly. I'm worried we're doing it again."
- "I hate you" → "I'm really angry right now."

Absolutes invite defense. Specifics invite conversation.

**3. Name what's happening.**

"We're escalating. Can we slow down?" Said calmly, this often works. The other person almost always knows you're escalating; naming it together gives you both an exit.

**4. Take a break before damage is done.**

"I'm getting upset. Can we pause for 10 minutes and come back?" This isn't avoidance — it's a deliberate cool-down. Walk around the block. Drink water. Splash cold water on your face. Then return.

The key: actually return. A "break" that doesn't end is avoidance.

**5. Identify the actual disagreement.**

Many fights are about something different than what they appear to be. The fight about who took out the trash is often about feeling unsupported. The fight about plans is often about feeling unimportant.

If you can name the underlying thing — "I don't think this is actually about the trash; I think I've been feeling like I'm doing more around the house lately" — the conversation often shifts.

**6. Concede points that don't matter.**

You don't have to win every sub-argument. If they say "you said you'd be here at 8 and you were 20 minutes late" and you actually were — yeah, you were. Don't defend it. "You're right, I was late. I'm sorry about that." Then the rest of the conversation can proceed.

Trying to win every point produces fights you can't win.

**7. Use repair attempts.**

In healthy fights, both people use repair attempts — small moments of connection that signal "I'm still on your side." A small joke. Catching their eye. A hand on the arm. Saying "I know we're fighting but I love you."

Repair attempts work even mid-conflict. They signal that the relationship is bigger than this fight.

The skill: making repair attempts when angry. The complementary skill: noticing your partner / friend / family member's repair attempts and accepting them rather than batting them away.

**What NOT to do:**

- **Stonewall.** Going silent and unresponsive. Makes the other person more upset, not less. ("Silent treatment" is its own kind of damage.)
- **Walk out without coming back.** Leaves the conflict open and gets worse over time.
- **Bring in third parties mid-fight.** Texting a friend about how unreasonable they are while you're fighting them. Makes it worse.
- **Bring up old grievances.** Stay on the topic. Old hurts deserve their own conversation, not this one.
- **Below-the-belt attacks.** Things you know hurt them, used because you want to hurt them. These get remembered.
- **Threats** ("if you do that I'll leave") used to win.
- **"You're crazy" / "you're irrational."** Dismissive; escalates fast.

**When fights are physical:**

If physical violence happens (one person hits, shoves, throws something), the conversation is over. Repair starts from the physical violence first, not from the original disagreement.

Physical violence in a relationship — once — is information. Usually the pattern continues, not improves. This is the territory of the warning-signs article in the relationships primer, not a de-escalation skill issue.

If you're on the receiving end: this is not your fault, regardless of what was said. RAINN (1-800-656-4673) and Love is Respect (text LOVEIS to 22522) are real resources. School counselor can also help.

If you're the one being physical: this is a stop-and-get-help moment. Not "we got carried away." Anger management, counselor, sometimes specific programs. The pattern doesn't fix itself.

**For conflicts with parents specifically:**

The de-escalation skills work with parents too, though the power dynamic is harder. Some specific moves:

- "I want to keep talking about this, but I'm getting upset and I'll say things I don't mean. Can I take 15 minutes?" — usually honored.
- Writing instead of talking, sometimes. Some hard things land better in a letter or text.
- Bringing a third party — a sibling, a counselor, another adult — when the conflict has become locked.

For parents whose anger crosses into abuse or coercion: see the warning-signs article. Different territory.

**The practice:**

De-escalation is a muscle. The first few attempts feel awkward and don't always work. People who get good at it almost universally describe a few failed attempts before they internalize it. It builds with reps.

Most adults haven't learned this. Teens who do build it now have a real advantage in every relationship for the rest of their lives.`,
    takeaways: [
      "Notice escalation early: voice, heart rate, absolutes, interruptions, old grievances surfacing.",
      "De-escalation moves: slow body down, swap absolutes for specifics, name what's happening, take real break (and return), concede unimportant points.",
      "Repair attempts mid-conflict (small connection signals) keep the relationship bigger than the fight.",
      "Physical violence ends the conversation — repair starts there, not at the original topic. RAINN / Love is Respect."
    ]
  },
  {
    id: "when-to-walk-away",
    category: "when_to_walk_away",
    title: "Some conflicts shouldn't be repaired",
    summary: "Not every conflict needs resolution and not every relationship deserves repair. Walking away well is also a skill.",
    readMinutes: 3,
    body: `Most teen conflict content focuses on repair and reconciliation. Sometimes the right move isn't repair — it's leaving. Knowing which situations warrant which is its own skill.

**Conflicts where walking away is the right move:**

**1. Patterns of abuse or coercion.**

If a relationship involves repeated controlling behavior, threats, isolation, intimidation, manipulation, or physical violence — see the warning-signs article. These don't get fixed by better conflict skills. The pattern is the problem, not the fight.

Walking away from these is the skill, not a failure of repair.

**2. Relationships where you're consistently more invested.**

If you're always the one initiating, repairing, apologizing, organizing — and the other person consistently shows up less — that's information. Some friendships are simply less reciprocal than they appear. Sometimes the answer is to stop carrying the relationship and see what happens. Usually, it ends naturally.

**3. People who repeatedly violate your no.**

Once is a mistake. Twice is a pattern. Three times is who they are. If someone keeps doing something you've asked them not to do — a friend who keeps making jokes about something painful to you, a partner who keeps pushing past stated limits — the issue is character, not communication.

**4. Relationships you've outgrown.**

Some friendships made sense at 12 and don't at 16. The interests diverge, the values diverge, the maturity level diverges. Walking away from a former-best-friendship that no longer fits isn't a failure; it's recognition.

**5. People who consistently bring out worse versions of you.**

Some people you become worse around. More gossipy, meaner, less kind, harsher, more reckless. The relationship trains patterns in you that you don't want. Even if they're not "doing" anything specifically wrong, the dynamic might not be good for who you want to be.

**6. After repeated genuine repair attempts have failed.**

You've apologized, listened, changed behavior, given time — and the same conflicts keep happening. Sometimes that means the relationship has structural issues that no repair fixes. People are sometimes incompatible despite good intentions on both sides.

**Walking away well:**

Some patterns make walking-away cleaner:

**Be clear with yourself first.** What are you actually doing? "Taking a break"? "Stepping back"? "Ending the relationship"? The clearer you are with yourself, the cleaner the action.

**Don't dramatize the exit.** Most friendships and relationships end gradually, with less contact, until they're just... over. You don't have to make a speech. You don't have to post about it.

**Some exits do warrant a conversation.** Long, important relationships. Romantic relationships where the other person doesn't know it's ending. Family relationships you're stepping back from. These benefit from named clarity — "I'm not able to be in this relationship anymore" or "I need to step back for a while" — even if it's hard.

**Don't badmouth on the way out.** Telling everyone who'll listen about what was wrong with them is its own kind of harm. You can leave without needing to be vindicated by others.

**Allow for grief.** Walking away from relationships you cared about hurts even when it's the right move. The hurt isn't a sign you should go back; it's the cost of the loss.

**Don't expect closure.** Sometimes you walk away and never know how they took it, what they thought, whether they understood. Closure is mostly self-given. Don't wait for the other person to provide it.

**On parents and family:**

Walking away from family is more complicated and rarely an immediate option for teens. But:

- You can reduce contact with specific family members without "cutting them off."
- You can change what topics you discuss with them.
- You can decline to spend specific time with them.
- You can plan for adult life that has different proximity.

For teens in genuinely harmful family situations: school counselor, trusted adults, possibly child protective services depending on what's happening. Childhelp (1-800-422-4453) for active abuse. The trauma primer has more.

**On romantic relationships:**

Breakups are walking-away in the romantic context. They're hard. They're also normal. Most teen relationships end, and that's not a failure.

A few honest things:
- "We grew apart" is a real reason.
- "I don't want to be in this anymore" doesn't require a list of justifications.
- You can leave a relationship that isn't terrible just because it isn't working for you.
- Lingering in relationships out of guilt rarely helps either person.

How to break up:
- In person if possible (not by text for serious relationships).
- Clear, not cruel.
- Don't list grievances unless it's relevant.
- Don't promise to be friends if you're not sure (which is usually).
- Allow them their reaction without needing to manage it.

**A specific note on online cut-offs:**

The modern teen breakup includes blocking, unfollowing, muting. These are real tools and sometimes the right ones:

- Blocking someone harassing you is appropriate.
- Unfollowing after a breakup is normal and self-protective.
- Muting friends you need a break from (without cutting off entirely) is reasonable.

The flip side: blocking everyone who annoys you mildly is its own pattern worth noticing.

**The hardest version: leaving good people:**

Sometimes you walk away from people who haven't done anything wrong. They're fine. The relationship just isn't right for you, or isn't right for who you're becoming. This is harder than leaving people who hurt you because there's no clear "they're at fault" story.

You're allowed to do this. People grow. Relationships sometimes don't grow with them. The kind way to leave good people is to be honest with yourself about what's happening, do it with care, and let them have their feelings without trying to talk them out of those feelings.

**The longer arc:**

The teens who do well in adult relationships have learned both repair and walking-away. Pure repair-focus produces people who stay in bad relationships too long. Pure walking-away-focus produces people who can't sustain any relationship through difficulty.

The balance is the work.`,
    takeaways: [
      "Walking away is the right move for: abuse/coercion patterns, chronic one-sided investment, repeated boundary violations, outgrown relationships, repeated failed repair.",
      "Walking away well: clear with yourself first, don't dramatize, allow for grief, don't expect closure, don't badmouth.",
      "Breakups: in person for serious relationships, clear-not-cruel, no required list of justifications, allow their reaction.",
      "Both repair and walking-away skills matter. Pure repair = staying in bad relationships; pure walking-away = unable to sustain anything."
    ]
  },
  {
    id: "online-conflict",
    category: "online_conflict",
    title: "Online conflict has its own physics",
    summary: "The patterns of conflict in DMs, group chats, and comments are different. Most teen conflict happens here now. Specific moves work better.",
    readMinutes: 4,
    body: `Most teen conflict in 2026 happens online — group chats, DMs, comments, posts. The patterns are different from in-person conflict, and the moves that work in-person don't always work online.

**What's different about online conflict:**

**1. No tone. No body language. No real-time co-regulation.**

Most of what makes hard conversations workable in person — the way someone's face softens when they get it, the breath you take together, the hand on the arm — doesn't exist online. The brain fills in the gaps, usually badly. Most online conflict is partly about reading too much into messages, or not reading enough.

**2. Permanence.**

What you say in a fight in person fades from memory imperfectly. What you say in a fight on text is in writing, screenshottable, forwardable, archived. Every word is a potential exhibit later.

**3. Time delay.**

Replies aren't immediate. The waiting time between messages produces more anxiety than face-to-face exchange. The brain has time to spiral.

**4. Audience.**

Group chats have witnesses. Posts have publics. Conflicts that would stay private in person sometimes become semi-public online, which changes what's at stake.

**5. The pile-on dynamic.**

Online conflict can escalate when other people join — sometimes piling on one side, sometimes both. Quickly, what was a two-person disagreement becomes a many-person incident.

**6. The screenshot.**

Anything sent can be screenshotted and recirculated. Conversations that felt private can become public. Mistakes are durable in a way they weren't a generation ago.

**De-escalation moves that work online:**

**1. Pause before responding.**

You don't have to reply immediately. The expectation of instant response is one of the more harmful features of modern communication. "I'll respond when I've thought about it" is a real option.

For high-stakes messages: wait at least 10 minutes before sending. Often longer. The draft you wrote angry isn't the message you'll wish you'd sent.

**2. Move the conversation off text.**

If a conflict is escalating in messages: "I think we should talk about this in person/on the phone. Texting isn't working." Often the right move. Hard conversations almost always go better with voice and especially face-to-face.

**3. Don't fight in group chats.**

If a conflict is happening with one person in a group setting, DM them instead. The audience makes everyone perform; performance makes conflict worse. "Can we talk privately about this?"

**4. Use voice memos for high-stakes content.**

When tone matters, voice memos carry it. Reading "I'm not mad" comes across cold; hearing "I'm not mad" in your voice carries the actual content. For sensitive things, especially.

**5. Avoid sending mid-fight.**

The moment you're angriest is the moment you'll write the message you regret. Several practices help:
- Type the message, save as draft, sleep on it.
- Type the message in a different app where you can't send it (notes app), then re-type into messages if you still want to.
- Send the message to yourself first to see how it reads.

**6. Resist the screenshot impulse.**

When someone says something annoying or hurtful in messages, there's an instinct to screenshot and send to friends for validation. This often:
- Makes the conflict bigger.
- Prevents you from really thinking about what they meant.
- Creates a permanent record someone may regret.

Sometimes you do need a friend's read on a message — that's reasonable. But screenshotting to build a case is different.

**7. Avoid the public callout.**

Posting about a conflict, subtweeting, vague-posting — these almost never improve the conflict. They:
- Don't actually communicate to the person you're upset with.
- Bring in audience who shouldn't be involved.
- Create a public record of your worst moment.
- Make repair harder.

If you have something to say to a specific person, say it to them, privately. Not to "the algorithm."

**8. Recognize when you're being dragged.**

Sometimes you're not having a real conflict — you're being engagement-baited or trolled. Someone is provoking responses for their own reasons. Replying often makes it worse. Blocking, muting, or simply not engaging is sometimes the right move.

You don't owe everyone a response.

**What's different about online conflict with strangers:**

If you find yourself in conflict with random people on the internet (comments, Twitter/X, Reddit, etc.):

- Most online strangers aren't acting in good faith. They're not engaging to understand; they're engaging for engagement.
- You're rarely going to convince them of anything; nobody changes their mind from comment-section fights.
- The cost of engaging often exceeds the benefit.
- Blocking and walking away is the default reasonable move for most stranger-conflict.

This is different from conflict with people you actually know, where repair has real value.

**The specific patterns to watch for:**

**Friend ghosting.**

Someone you were close to stops responding. Days. Weeks. The temptation is to escalate ("are you mad at me??" "you're really not going to answer me?") which usually makes it worse.

Better: one message, calm. "I've noticed you've been quiet — I'm here if you want to talk. No pressure either way." Then wait. The ball is in their court.

**Group chat drama.**

Several people fighting in real time. Most of the time, the best move is to stay out of it, or DM whoever you care about most to talk one-on-one. Don't get sucked in.

**Subtweets / vague posts.**

If someone's vague-posting about you: usually the move isn't to engage publicly. Either talk to them privately or let it pass. Engaging publicly amplifies and entrenches.

**The "we need to talk" message.**

The "we need to talk" text triggers worst-case-scenario thinking in the recipient. If you have something to talk about, say what it is briefly: "I want to talk about [topic]. Can we?" Saves them hours of dread.

**The angry essay.**

The long message detailing everything wrong with the other person. These feel righteous to write. They almost never produce the desired effect. They make repair harder.

If you wrote one: don't send it tonight. Re-read in the morning. Decide if any of it actually serves the purpose. Usually shorter is better.

**The block-and-unblock cycle.**

If you're blocking someone, unblocking, refighting, blocking again — that's a pattern, not a resolution. Either the relationship is over (block and stay blocked) or it's not (don't block). The cycle is destructive.

**For online harassment:**

If you're being seriously harassed online (sustained targeting, threats, hate, sexual content, doxxing): see the online safety primer. This is different from conflict and has its own response (block, document, report to platform, sometimes report to police, tell a trusted adult). RAINN, NCMEC, CyberTipline are real resources.

**The longer arc:**

Modern relationships are increasingly online-mediated. The people who do well in them have learned to move hard things off text, to pause before reacting, to resist the pile-on dynamic, and to use voice for high-stakes content.

These skills aren't intuitive; they're learned. The teens who learn them now have an advantage in every adult relationship.`,
    takeaways: [
      "Online conflict differs from in-person: no tone, permanence, time delay, audience, pile-on dynamic, screenshots.",
      "Move hard conversations off text. Pause before sending. Avoid public callouts. Resist screenshotting to build a case.",
      "Stranger-conflict online: blocking and walking away is the default. You don't owe everyone a response.",
      "Online harassment (sustained targeting, threats, sexual content, doxxing) is different from conflict — see online safety primer."
    ]
  },
  {
    id: "mediation-and-help",
    category: "hard_conversations",
    title: "When you need someone else to help",
    summary: "Some conflicts you can't fix on your own. Mediators, counselors, school resources exist for exactly these situations.",
    readMinutes: 3,
    body: `Sometimes conflicts get stuck. You've tried direct conversation. You've tried repair. You've tried walking away and coming back. Nothing's moving. The relationship matters enough that you don't want to just leave it broken. This is when third-party help comes in.

**Kinds of help:**

**1. School counselors.**

For conflicts between students: school counselors often handle this. They can:
- Mediate a conversation between you and another student.
- Provide a confidential place for you to talk through a conflict.
- Refer to other resources (therapy, family support, peer mediation).
- Sometimes intervene in bullying situations.

In most US schools, counselors are bound by confidentiality except for immediate danger situations.

**2. Family therapists.**

For conflicts within families: family therapists are specifically trained for this. They can:
- Help family members understand each other better.
- Mediate ongoing recurring conflicts.
- Identify patterns that family members don't see from inside.
- Help parents and teens improve communication.

Many insurance plans cover family therapy. Sliding-scale options exist. Most teens have never used this and don't know it's an option.

**3. Individual therapists for relationship work.**

You can see a therapist about a relationship problem even if the other person isn't involved. Sometimes the work is yours — what you bring, what you avoid, what patterns you've inherited. Doing this alone can change a relationship without the other person changing.

**4. Couples therapists / relationship counselors.**

For older teens in serious relationships, couples therapy is a real thing and increasingly used by Gen Z. Don't wait until the relationship is in crisis. Many couples who do it preventatively report it's useful.

**5. Peer mediation programs.**

Many high schools have these. Trained student mediators help peers work through conflicts in structured ways. Often more accessible than counselor mediation; sometimes faster.

**6. Cultural / religious community elders.**

In some communities, conflicts get worked through with help from respected community members — religious leaders, family elders, community counselors. This depends heavily on the community; can be powerful when it works.

**7. Professional mediators (rare for teens).**

Trained mediators specialize in helping parties reach agreements. More common for adult / legal situations, but worth knowing exists.

**When to seek help:**

- Conflicts that keep recurring despite direct conversation.
- Patterns in your relationships (always the same kind of conflict) that you can't break.
- Family conflicts that have been ongoing for years.
- Friend-group dynamics that you can't see your way out of.
- Conflicts that have escalated past what you can handle alone.
- After significant harm in a relationship you want to repair.
- When you're feeling stuck and can't articulate why.

You don't need to be in crisis. Preventative use is often the most useful.

**The friction:**

A lot of teens have never used these resources because of:

- Not knowing they exist.
- Embarrassment / stigma.
- "We can handle it ourselves" family culture.
- Fear of parents finding out (most school resources are confidential).
- Past bad experience with one counselor / therapist (the wrong one).
- Cost concerns (many resources are free or sliding-scale).

These are real friction. Some of them are worth navigating around.

**How to actually find these:**

**School counselor:**
- Walk in or email the counseling office. "Can I make an appointment to talk through something?" Most schools have a system. Most counselors are happy to meet with students.

**Family therapist:**
- Psychology Today therapist finder (psychologytoday.com). Filter by "family" and your insurance. Many therapists list specifically that they work with adolescents.
- Ask your pediatrician for a referral.
- Some communities have family counseling centers with sliding scale.

**Individual therapist:**
- Same Psychology Today route.
- School counselor can often refer.
- Many universities have free clinics where supervised graduate students see clients at low cost.

**Peer mediation:**
- Ask the school counseling office whether your school has a program.

**For LGBTQ+ teens specifically:**
- The Trevor Project (1-866-488-7386) has counseling resources.
- Many gender-affirming therapists work specifically with teen relationship issues.

**For teens in genuinely harmful family situations:**
- Childhelp (1-800-422-4453) for ongoing abuse.
- A trusted adult outside the family (relative, teacher, coach).
- School counselor (mandated reporter, but they can also be a confidential resource for many situations).

**For low-cost or free options:**
- School-based health clinics (where available).
- Community mental health centers (sliding scale).
- Open Path Collective (openpathcollective.org) — sliding-scale therapy directory.
- Many universities have free or low-cost clinics.
- Some employers offer family / dependent counseling.

**Things to know about mediation specifically:**

- Mediation works best when both parties want it. If one person doesn't want to engage, mediation is hard.
- A good mediator doesn't take sides. They help both parties be heard.
- Mediation isn't always about resolution. Sometimes it's about understanding.
- It can take multiple sessions. Stuck conflicts often took time to build; they take time to address.

**Things mediation can't fix:**

- Abuse / coercion / power imbalances that prevent honest dialogue.
- One party who refuses to engage in good faith.
- Conflicts where the issue is about safety (these need different responses — see relationships primer, online safety primer, trauma primer).
- Mental health issues making conversation impossible without prior individual work.

**The bigger frame:**

Asking for help with relationships isn't weakness. Most adults don't do this and pay for it in their relationships. The teens who learn to use professional help now have a real advantage.

Some of the highest-leverage support you can ask for in your teens is help with relationships. Most schools, most communities, most insurance plans cover it. Many teens never use it because they don't know it exists or feel embarrassed to ask.

This isn't an emergency-only resource. It's available for the ongoing work of being in relationships well.`,
    takeaways: [
      "Multiple kinds of help exist: school counselors, family therapists, individual therapists for relationship work, peer mediation, community elders.",
      "School counselors are confidential in most situations except immediate danger. Free, available, underused.",
      "Psychology Today therapist finder + Open Path Collective + university clinics = real low-cost paths to therapy.",
      "Mediation works when both parties engage in good faith. Doesn't fix abuse/coercion situations — different response needed."
    ]
  }
];

export const CONFLICT_CATEGORY_LABEL: Record<ConflictCategory, string> = {
  hard_conversations: "Hard conversations",
  the_apology_shape: "Apologies that repair",
  repair_after_harm: "Repair after harm",
  de_escalation: "De-escalation",
  when_to_walk_away: "When to walk away",
  online_conflict: "Online conflict"
};
