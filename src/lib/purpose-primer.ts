/**
 * Purpose + meaning primer. Meaning-making in adolescence, the difference
 * between purpose and performance, existential questions, contribution +
 * service, and the honest version of "find your passion" / "find your why."
 *
 * Voice rules (strict):
 *   - No "find your passion" / "find your why" cliches as prescriptions.
 *     Purpose research shows passion is built more often than found.
 *   - No "you can be anything you want" / "follow your dreams" toxic
 *     positivity. Some constraints are real and naming them honestly is
 *     useful.
 *   - No prescriptive meaning ("the meaning of life is X"). Teens get
 *     to figure this out for themselves.
 *   - Existential questions are treated as real and useful, not as
 *     symptoms to be solved.
 *   - Religion / spirituality referenced as one source of meaning among
 *     many, neither endorsed nor dismissed.
 *   - Persistent meaninglessness paired with anhedonia / dark thoughts →
 *     counselor (potential depression presentation).
 *   - Service / contribution research-grounded; not preachy about
 *     volunteerism.
 */

export type PurposeCategory =
  | "what_purpose_is"
  | "passion_vs_practice"
  | "existential_questions"
  | "contribution_and_service"
  | "career_and_meaning"
  | "when_meaning_falters";

export type PurposeArticle = {
  id: string;
  category: PurposeCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

export const PURPOSE_ARTICLES: ReadonlyArray<PurposeArticle> = [
  {
    id: "what-purpose-actually-is",
    category: "what_purpose_is",
    title: "Purpose: what the research actually says",
    summary: "Purpose isn't a destination you arrive at. It's a relationship between who you are, what you care about, and what you do.",
    readMinutes: 4,
    body: `"Purpose" has become a loaded word — between graduation speeches, self-help books, and Instagram influencers, it sometimes sounds like a single profound thing you're supposed to discover. The research on adolescent purpose is more practical and more useful.

**The working definition** (from researchers like William Damon):

Purpose is a stable, generalized intention to accomplish something that is at once meaningful to the self and consequential for the world beyond the self.

Three components matter:
1. **Stable + generalized.** Not "this week I want to read more." Something that holds over time.
2. **Meaningful to you.** Not what your parents / teachers / friends want for you. What pulls *you*.
3. **Consequential beyond self.** Some way it matters to other people, the world, a cause, a craft.

The third piece is what distinguishes purpose from goals. Wanting to make money is a goal. Wanting to use your skills to do work that helps people in a particular way is closer to purpose.

**What the research finds:**

- Teens with a sense of purpose report higher life satisfaction, better grades, better mental health, lower substance use, better resilience after setbacks.
- Purpose is more common in adults than in teens — most people develop it across their 20s and 30s. It's a developmental milestone, not a teenage requirement.
- About 1 in 4 teens has a clear sense of purpose. About 1 in 4 has begun to develop one ("on the way"). About half haven't really started.
- Lack of purpose isn't a problem at 16. It's information about where you are in the developmental process.

**Things people confuse with purpose:**

**A specific career.** "I want to be a doctor" is a career direction, not purpose. The purpose underneath would be "I want to use my skills to help people through hard physical times" or "I want to solve interesting problems with high stakes." The career is one way the purpose gets expressed.

**A passion.** Loving something is one of the inputs to purpose, but love alone isn't purpose. Purpose includes the contribution piece.

**A long-term goal.** Goals are specific and achievable. Purpose is more like the direction you've oriented in.

**A job title.** Many people achieve their dream job titles and feel hollow because the title was the goal, not the purpose underneath.

**A single calling.** The "one true thing you were meant to do" framing is rarely accurate. Most people who have a strong sense of purpose have a directional sense rather than a single specific calling.

**Where purpose actually comes from:**

Research on how purpose develops in adolescents identifies a few common patterns:

1. **Witnessing a need.** Seeing something in the world (in your community, your family, the news, your experience) that you feel pulled to address.
2. **Mentor or role model.** Someone whose orientation toward life sparks something in you.
3. **Skill mastery.** Becoming genuinely good at something and noticing the path it opens.
4. **Crisis or hard experience.** Going through something difficult that shapes what you care about.
5. **Direct invitation.** Someone — a teacher, a coach, a community member — invites you into something meaningful.
6. **Reflection.** Sustained thinking about what matters to you, often in conversation with others.

Notice: pure introspection ("just think about what your purpose is") rarely produces it. Purpose emerges from engagement with the world plus reflection on that engagement. You don't find purpose by sitting alone and waiting.

**What you can do at 14, 15, 16, 17:**

- **Notice what you're drawn to.** Not what you're told you should be drawn to. What conversations make you lean in? What problems do you find yourself thinking about uninvited?
- **Try things.** Volunteer, take a class outside your normal area, talk to people in different jobs, read about different fields, take on a small project. Purpose develops through exposure.
- **Notice strength + service.** When you use a skill you're developing for someone else's benefit, watch what that feels like. The combination of "I'm good at this" + "this matters to someone" is often where purpose seeds.
- **Have purpose conversations.** Ask adults you trust what they care about and why. Ask peers what they're working toward. Most people don't have these conversations and they're surprisingly available when you start.
- **Don't force it.** If nothing has crystallized yet, that's normal. The brain is still developing the capacity to hold purpose; the experiences are still accumulating; the conditions for clarity may not be present yet.

**A practical note:**

If you have a clear sense of purpose at 15, that's great. Most teens don't, and that's also fine. The teen years are mostly for building the inputs (skills, experiences, exposure, relationships) that produce purpose later. Treat this period as input-gathering, not as a deadline.`,
    takeaways: [
      "Purpose = stable + meaningful to you + consequential beyond yourself. More than a goal, more than a passion.",
      "Only about 1 in 4 teens has clear purpose. It's a developmental milestone, not a teen requirement.",
      "Purpose comes from engagement with the world plus reflection. Pure introspection rarely produces it.",
      "Teen years are mostly for building inputs (skills, experiences, exposure). Don't force the answer."
    ]
  },
  {
    id: "passion-is-built-not-found",
    category: "passion_vs_practice",
    title: "'Follow your passion' is bad advice",
    summary: "Most people who love their work didn't start by loving it. Passion is built through practice and contribution, not found in advance.",
    readMinutes: 3,
    body: `"Follow your passion" is one of the more common pieces of advice given to teens. It sounds inspiring. It's also, in much of the research, wrong in a way that hurts people.

**What the research finds:**

Studies on people who report deep engagement with their work consistently show: most of them didn't start passionate. They became passionate as they got good at something and saw its impact. The passion came from the practice, not before it.

Cal Newport's "So Good They Can't Ignore You" makes this case carefully. Angela Duckworth's grit research points in the same direction. The "match your job to your pre-existing passion" framework doesn't predict career satisfaction well; the "develop skills + see them used meaningfully" framework does.

**Why this matters:**

When teens are told to "follow their passion," they often:

1. **Search for a pre-existing passion** they don't have, conclude they don't have one, feel broken.
2. **Latch onto a current interest** as their "passion," then find it doesn't survive the boring middle of actually doing it.
3. **Quit things when the passion dips**, missing the point that passion almost always dips during the skill-acquisition middle.
4. **Compare themselves** to peers who seem certain, feeling behind because their interests are still in flux.

**The more accurate frame:**

- **Curiosity over passion.** What are you curious about? Curiosity is lower-stakes and more diagnostic. You don't have to be passionate about something to be curious about it. Most lasting passions started as curiosities.
- **Skill mastery as the path.** Pick something — almost anything that meets minimum bars (intellectually interesting, useful, accessible to you) — and get genuinely good at it. The passion often emerges after a few hundred hours of investment. People who stayed in the same field for decades usually didn't enter it passionate; they became passionate as they got good.
- **Contribution as the test.** When the skill is used for something that matters to other people, the feedback loops are real. Passion that survives long-term usually involves serving something beyond your own enjoyment.

**This applies in real teen contexts:**

- **The kid who's "passionate about music" at 13** but quits at 15 because practicing got hard. The "passion" was the early novelty. Real musicians stay through the boring middle because they value where the practice goes, not because every session is fun.
- **The kid who plays a sport "they love"** but considers quitting because it's stopped being fun. Most pros report that the work stopped being fun at some point; the meaning kept them in.
- **The student who hates math** because they were never good at it. Sometimes the dislike is the absence of mastery, not the absence of fit. People who become good at something often start liking it after they're good at it.

**What this isn't saying:**

It's not saying you should stick with everything you start. Sometimes a field truly isn't for you. The signal isn't "this is hard right now"; the signal is something more like "after years of working at this, I still feel hollow when I do well." That's a different signal than the normal practice plateau.

It's also not saying don't follow what interests you. Curiosity is the input. The point is: don't expect to feel passion before you've invested. The passion grows from the investment.

**The practical move at your age:**

1. **List your curiosities, not your passions.** "I'm curious about X" is a more accurate self-statement than "I'm passionate about X" at 16.
2. **Pick a few to invest in.** Not 10. Two or three. Real investment over time.
3. **Watch what happens after you get good.** Notice which ones still pull you when the novelty's worn off. That's data about what's likely to become passion.
4. **Hold loose plans.** Your interests at 22 may be different from your interests at 16. That's how development works. Don't lock in a "this is who I am" identity too early.

**A note on the "passion economy" framing:**

The internet has made it easier to monetize passions (creators, gig work, hobby-to-business pipelines). Some of this is real opportunity; much of it is influencer-pushed mythology that doesn't survive contact with reality. The "turn your passion into income" message has hurt many young people who built businesses around hobbies and found the business killed the hobby. See the gratitude / hedonic-adaptation article on monetizing hobbies.`,
    takeaways: [
      "Most passionate people didn't start passionate. They got good at something and saw its impact. Then it became passion.",
      "Curiosity is a more useful concept than passion at your age. Curiosity is the input.",
      "Expect the boring middle of skill acquisition. People who quit when the early novelty fades often miss what was coming.",
      "Don't lock in 'who I am' too early. Interests develop and change across the 20s."
    ]
  },
  {
    id: "existential-questions",
    category: "existential_questions",
    title: "Existential questions: not symptoms",
    summary: "'What's the point?' 'Why am I here?' 'Does anything matter?' These are normal adolescent questions, not signs of being broken.",
    readMinutes: 4,
    body: `One of the developmental milestones of adolescence is the emergence of existential thinking — questions about meaning, death, purpose, identity, time, the universe, whether anything matters. Most adults forget how intensely they thought about these questions at 14, 15, 16. From inside, it can feel like the floor disappeared. From outside, it's normal cognitive development.

**The questions that show up:**

- What's the point of any of this?
- Why am I here?
- Does it matter what I do?
- What happens when I die?
- Is there anything bigger than this?
- Why do we suffer?
- Is the world fundamentally good or bad?
- What makes a life worth living?
- How do I know what I think is right is actually right?
- Is free will real?
- What's the relationship between me and the universe?

These are not symptoms of depression (though they can be more painful during depression). They're not signs that something is wrong with you. They're the result of new cognitive capacity coming online. The teen brain is now capable of holding abstract concepts about meaning and existence at a level the child brain wasn't. The new capacity often comes with new pain.

**The history of thought on this:**

Almost every philosophical and religious tradition has wrestled with these questions for thousands of years. The fact that you have them at 16 puts you in long company. Philosophy as a field is largely an attempt to address them. Religion is largely an attempt to address them. Art, literature, music — these are largely attempts to address them.

You don't have to solve these questions to live well. Most adults haven't solved them; they've made peace with them in various ways.

**Some honest things:**

- **The universe doesn't come with built-in meaning** that you can find by looking hard. People who claim to have found it usually mean they've built a framework that makes sense for them.
- **Meaning is made, not found.** You construct it through what you do, who you love, what you build, what you choose to attend to. This isn't depressing once you sit with it; it's actually freeing.
- **Different traditions offer different answers.** Religions (varied), secular humanism, stoicism, existentialism, Buddhist philosophy, indigenous wisdom traditions — each offers a different frame. None is universally correct; each works for some people.
- **Suffering is real.** No framework eliminates it. Frameworks help you carry it.
- **Death is real.** No framework eliminates that either. Frameworks help you orient toward it without panic.

**A practical orientation that often helps:**

Existential questions are best engaged, not avoided. People who try to suppress them usually find them coming back harder. People who engage them — through reading, conversation, religious practice if that fits, philosophical exploration, art — usually come through with more peace.

Some practical entry points:
- **Read widely.** Different philosophical and spiritual traditions. You don't have to commit to any of them; you're sampling.
- **Talk to thoughtful people.** Older friends, mentors, teachers, religious leaders, philosophers (in person or in books). Most thoughtful adults are happy to talk about these questions.
- **Hold them with curiosity, not panic.** "I don't know why I'm here" can be a sentence of dread or a sentence of curiosity. The same question, different felt experience.
- **Don't expect answers in a week.** These are decade-long projects, often lifelong. The point isn't to solve them; it's to develop a relationship with them.

**When existential questions become concerning:**

The questions themselves aren't the problem. The problem is when they're paired with:
- **Anhedonia** (nothing feels good, even things that used to).
- **Persistent thoughts that life isn't worth continuing.**
- **Severe social withdrawal.**
- **Substance use to numb the questions.**
- **Catastrophic certainty** ("there's no point so nothing matters, including whether I'm alive").

When existential questions are paired with these, that's depression presenting through philosophical framing. The questions are real. The despair is the medical / psychological piece that responds to treatment.

If this is your experience: a counselor. Not because the questions are wrong, but because depression makes existential questions much harder to hold. Once the depression lifts, the questions are still there but they're livable. The Crisis page link is at the bottom of every Kai screen; 988 reaches crisis support.

**A specific reframe that often helps:**

The fact that the universe doesn't come with built-in meaning doesn't mean nothing matters. It means meaning is the thing that gets made when conscious beings care. Your caring matters precisely because you do it; it doesn't need an external source to be valid.

A person who loves their friends generates meaning. A person who creates something generates meaning. A person who helps another person generates meaning. None of this is invalidated by the universe being indifferent.

You're allowed to make meaning. That's not a consolation prize; that's the actual game.`,
    takeaways: [
      "Existential questions ('what's the point', 'why am I here') are normal adolescent cognitive development, not symptoms.",
      "Meaning is made, not found. The universe doesn't come with built-in meaning to discover.",
      "Engage these questions with curiosity, not panic. Reading widely + thoughtful conversation helps over years.",
      "Existential questions + anhedonia / persistent dark thoughts / withdrawal = depression presenting philosophically. Counselor."
    ]
  },
  {
    id: "contribution-and-service",
    category: "contribution_and_service",
    title: "Why contributing to something matters",
    summary: "Acts of service and contribution change your sense of self in ways that achievement doesn't. The research is consistent across decades.",
    readMinutes: 3,
    body: `One of the more consistent findings across happiness and meaning research: people who contribute regularly to something larger than themselves report higher life satisfaction, more meaning, better mental health, even better physical health over time. This is true across cultures, religions, and economic levels.

This isn't moralizing about volunteerism. It's a pattern in the data.

**Why it works:**

- **Connection.** Contributing to something brings you into contact with other humans in ways scrolling and individual achievement don't.
- **Perspective.** Being engaged with problems outside your own loosens the grip of your own problems.
- **Identity.** "I'm someone who helps with X" is an identity statement that supports wellbeing. Achievement identities ("I'm successful," "I'm smart") are more fragile because they depend on continued performance.
- **Skill use with stakes.** Using a skill you have to address a problem that matters to someone else creates a different felt experience than using the skill for personal achievement alone.
- **Tribal belonging.** Working alongside others on something matters to humans biologically. The "we" of a contributing group is one of the more reliable sources of belonging.

**What counts as contribution:**

Pretty much anything where you're giving time, energy, or skill to something beyond your own immediate benefit:

- Volunteering (homeless shelters, food banks, tutoring younger kids, environmental work, animal shelters, hospitals, community gardens, religious community service, etc.)
- Caregiving (siblings, elderly relatives, neighbors)
- Mentoring younger kids
- Activism on causes you care about
- Tutoring or peer support at school
- Creative work that's shared (music, art, writing, performances)
- Building things others use (open-source code, community projects)
- Coaching or assistant-coaching
- Religious community participation if that fits for you

**For teens specifically:**

A few things worth knowing:

- **You don't have to wait until you have skills.** Most volunteer roles are designed for people without specific expertise. Showing up matters more than expert capability.
- **Small commitments work better than dramatic ones.** Two hours a week sustained over a year beats one big intense weekend.
- **Match the work to your interests.** Generic service doesn't always create the same effects. Service in an area you care about does.
- **You don't have to volunteer for "good causes" alone.** Building something useful (a website for a small organization, a tool that helps people in your school) is contribution too.

**The "do it for college applications" caveat:**

College admissions offices have signaled that "service for service hours" doesn't impress them; sustained engagement with something does. This has shifted teen volunteerism patterns somewhat. But beyond admissions, the research on what produces meaning is consistent: contribution works, and authenticity of motivation correlates with the benefit you get from it. Doing service genuinely you care about works; doing service performatively doesn't produce the same effects.

**Service vs self-care:**

A pattern in current teen culture: a strong focus on "self-care" as the primary mental health practice. Self-care is real and matters. But research suggests that for many people, contribution and self-care are complementary, not competing:

- Self-care alone often doesn't produce a strong sense of meaning.
- Contribution alone leads to burnout if not balanced with self-care.
- The combination produces both wellbeing and meaning.

This isn't to dismiss self-care. It's to suggest that "I'm taking time for myself" works better when paired with "I'm contributing to something beyond myself" than either alone.

**When contribution is tied to your future career:**

If you're considering a career in helping (medicine, education, social work, nonprofit, etc.), volunteering in that area is genuinely useful — both as an input to your decision and as practice. You'll learn whether the day-to-day reality of the field matches what you imagined.

If you're not considering a helping career, contribution still matters. Most people with strong purpose contribute in ways outside their primary career — civic engagement, community involvement, parenting, mentorship.

**What to do this month:**

If you're not currently contributing anywhere:

1. **Pick a cause / population you care about** (younger kids, animals, environment, elderly, a specific community).
2. **Find one organization** in your area working on it.
3. **Reach out** about volunteer opportunities. School counselor often has lists.
4. **Commit to a small regular slot** (an hour a week or every two weeks). Sustained > dramatic.
5. **Notice what changes** over a few months. Most people report feeling different about themselves and their lives.

If you already contribute somewhere, notice what you get from it. Is it the connection? The skill use? The sense of being part of something? That information can guide your future choices.`,
    takeaways: [
      "Sustained contribution → higher life satisfaction, more meaning, better mental health. Consistent across cultures.",
      "Mechanism: connection, perspective, identity, skill-use-with-stakes, tribal belonging — not moral virtue.",
      "Small sustained commitment > dramatic one-time. Authenticity of motivation matters more than hours.",
      "Self-care + contribution complement each other. Either alone is incomplete."
    ]
  },
  {
    id: "career-and-meaning",
    category: "career_and_meaning",
    title: "What about career? The honest version",
    summary: "Career choice gets a lot of pressure in adolescence. Most adults' careers don't look like what they planned at 18. Here's a more useful frame.",
    readMinutes: 4,
    body: `By 17 or 18, most teens in industrialized contexts face significant pressure to "decide what they want to do." College major, vocational program, gap year choice, work path. The expectation is often that this should connect to a clear long-term career.

The honest version: most adults' careers don't look like what they planned at 18. The path of a meaningful work life is typically far less linear than the discourse implies, and that's not failure; it's how things actually go.

**Some statistics worth knowing:**

- Most college students change their major at least once.
- Median job tenure in the US is around 4 years.
- The average person changes careers (not just jobs) multiple times in a working life.
- The majority of people aged 30+ are working in something different from what they planned at 18.
- New jobs are constantly emerging (data science, prompt engineering, AI ethics, climate adaptation, telehealth, etc.) that didn't exist when their current holders were 18.

This means: locking in at 18 is mostly performative. The actual path is iterative, exploratory, and reactive to the world as it changes.

**What's actually useful at your age:**

**1. General-purpose skills.** Some skills are useful across many careers:
- Writing clearly
- Speaking persuasively
- Working with numbers and basic data
- Thinking carefully about problems
- Working with people from different backgrounds
- Learning new tools quickly
- Managing time and projects
- Reading carefully and synthesizing

Investing in these in your teens pays for decades. They're rarely about "passion" — they're infrastructure.

**2. One area of meaningful skill.** Pick something — a specific subject, a specific craft, a specific technical area — and get genuinely good. The specifics matter less than the experience of going from beginner to competent in something hard. That experience is transferable to whatever else you do.

**3. Exposure to different work.** Internships, jobs, shadowing, conversations with people in different fields. You can't choose well between options you haven't experienced.

**4. Self-knowledge.** What kinds of work environments energize you? What kinds drain you? Indoor / outdoor, alone / team, structured / variable, customer-facing / behind-the-scenes, high-stakes / low-stakes. Different fields have wildly different daily textures; figuring out yours is a real project.

**5. Honest information about fields.** Most teens have romantic images of various careers. Asking real people who do that work what their actual days look like, what they hate about it, what surprised them — this is the corrective.

**Common myths about career at 18:**

**"You need to know your career path by college application time."**
False. Most undecided students do fine. Many universities don't require you to declare a major until sophomore year. Some explicitly value students who haven't pre-decided.

**"Your major determines your career."**
Mostly false. Most adults work in fields unrelated to their college major. The major matters less than what you learn / who you meet / how you grow. Exceptions: pre-professional tracks (pre-med, engineering, nursing) have specific course sequences.

**"Some careers are more 'real' than others."**
Plumbers, electricians, mechanics, hair stylists, accountants, teachers, retail managers, social workers — these are real careers with real impact, real income, and real meaning for many people. The cultural pressure toward white-collar / prestigious careers has hidden many genuinely good paths from teens.

**"You should make a lot of money."**
A specific cultural framing that's heavily pushed but not actually correlated with most people's life satisfaction over their first $80-100k of income. Income matters in some ways. It's not the primary predictor of work satisfaction.

**"You'll know when it's right."**
Often not. Many people start jobs that turn into careers without dramatic "this is it" feelings. The work shapes you over time; the meaning emerges as you commit.

**What career counselors actually recommend (the underrated version):**

- **Take career assessments** (CliftonStrengths, MBTI with caveats, RIASEC / Holland codes). Useful as conversation starters, not as verdicts.
- **Informational interviews.** Ask people in jobs you're curious about for 30 minutes to talk about their work. Most people say yes.
- **Try things in low-stakes ways.** Summer internships, weekend jobs, volunteer roles in fields you're curious about.
- **Take a class outside your declared interest.** You may find you're drawn to something unexpected.
- **Pay attention to what energizes you in school.** Not what you're best at — what makes you lose track of time. That's a clue.

**When pressure from parents is high:**

In some families, career pressure is intense. The parent imagines a specific path (medicine, law, engineering, family business). The teen is meant to follow.

Some honest options:

- **Try to understand what the parent really wants.** Often the underlying wish is "you'll be financially secure" or "you'll have respect." The specific career may be more flexible than they realize.
- **Have honest conversations early.** "I'm considering X. Can we talk about it?" works better than waiting until you've already committed somewhere.
- **Build alliances with other adults** who can speak to alternative paths — a counselor, an aunt, a teacher.
- **Sometimes the right move is to follow your own path knowing it'll cause friction.** Parents disappointed in your career choice often come around in years, especially when you build a good life on your terms.

**The longer arc:**

A meaningful work life is usually a sequence of careful bets:

- Build general skills.
- Develop one specialty.
- Get good enough to be useful.
- Get curious about what's adjacent.
- Move when the work no longer fits you.
- Repeat through your life.

Most people who have meaningful careers got there through iteration, not by picking right at 18. The point of your teens isn't to lock in. It's to gather information, build skills, and stay curious.`,
    takeaways: [
      "Most adults' careers don't look like what they planned at 18. Iteration is the norm, not the exception.",
      "Build general-purpose skills + one area of meaningful skill + self-knowledge + honest information about fields.",
      "Most majors don't determine careers. Many genuinely good paths are non-prestigious (trades, services, public sector).",
      "Income matters but isn't the primary predictor of work satisfaction above modest levels."
    ]
  },
  {
    id: "when-meaning-falters",
    category: "when_meaning_falters",
    title: "When nothing feels meaningful",
    summary: "Loss of meaning happens in adolescence sometimes. Knowing what to do is more useful than trying to think your way out.",
    readMinutes: 3,
    body: `Sometimes nothing feels meaningful. The activities you used to like don't pull you. The future feels blank. The questions about purpose generate dread, not curiosity. School feels pointless; friendships feel like obligation; the things people seem to care about seem absurd.

This is sometimes a moment of existential transition (the brain reorganizing how you understand the world); it's sometimes a symptom of depression or burnout; it's sometimes the result of specific life circumstances (loss, exhaustion, isolation). Knowing which it is takes some looking.

**The differential:**

**Existential transition.**
- The questions feel intense but the body is okay.
- Sleep, appetite, energy roughly normal.
- You can still engage with friends and small pleasures even if the bigger things feel hollow.
- You can articulate what you're working through.
- Reading, conversations, time, and engagement tend to move things along.
- This often passes within weeks to months as new meaning structures take shape.

**Depression presenting as meaninglessness.**
- The questions feel heavy and unmoving.
- Sleep often disrupted, appetite affected, energy chronically low.
- Withdrawal from friends and pleasures, even small ones.
- Difficulty articulating beyond "everything feels pointless."
- Hopelessness about the future as a baseline.
- Doesn't shift with reading, conversation, or time alone.
- Persistent for 2+ weeks.

**Burnout meaninglessness.**
- Specific to a context or role (school, sport, job, relationship).
- Body exhausted, often somatic symptoms.
- Time off and recovery shifts the feeling.
- Other parts of life still have some pull.

**Circumstantial meaninglessness.**
- Connected to specific event (loss, change, situation).
- Improves as circumstance shifts or as you process the event.

**What to do depending on which:**

For **existential transition**: see the existential-questions article. Engage with curiosity. Read widely. Talk with thoughtful people. Time matters. This isn't a problem to solve but a chapter to move through.

For **depression**: this is medical. Not a character flaw. Talk to a counselor or doctor — sooner is better. Persistent loss of meaning paired with the other signs above is one of the most recognizable depression presentations in adolescents. It's also one of the most treatable.

For **burnout**: subtraction matters more than addition. Drop the activity, the role, the situation that's draining you. Recovery isn't optional. Some teens are running so many things that they're burnt out by 16; the answer isn't to "find their purpose," it's to take significant load off.

For **circumstantial**: process the event. A counselor can help. Time matters. The meaning will reorganize once the underlying situation shifts.

**The thing many teens get wrong:**

When meaning falters, the instinct is often to "find more meaning" — try harder, search harder, set more ambitious goals, find your passion, find your purpose. This often makes things worse because:

- More activity on a depleted system depletes it further.
- The search for "the right thing" can become its own anxious project.
- Comparing yourself to peers who seem to have purpose makes you feel further behind.

The better moves are usually:
- **Take care of the body first.** Sleep, food, water, movement, time outside.
- **Subtract before adding.** What's currently overloading you?
- **Engage in small, low-stakes ways** rather than searching for the right grand thing.
- **Talk to a real person.** Not for answers; for company.
- **Be patient.** Meaning often reorganizes itself once the body and basic conditions are stable.

**When to escalate:**

If meaninglessness is paired with:
- Persistent thoughts of not being here
- Active substance use as the main coping
- Severe social withdrawal
- Significant impairment at school / work / basic functioning
- Plans, means, or intent regarding self-harm

This is medical / crisis territory. Counselor, pediatrician, or 988 (Crisis Lifeline). The Crisis page link at the bottom of every Kai screen has resources.

This isn't to pathologize the feeling. Meaninglessness happens. But it has different sources, and the sources lead to different responses. Knowing which version you have is useful information for what to do next.`,
    takeaways: [
      "Loss of meaning has multiple sources: existential transition, depression, burnout, circumstantial. Each needs different response.",
      "Existential transition: engage with curiosity, time helps. Depression: medical, treatable, counselor sooner not later.",
      "Burnout: subtract, recover. Searching for 'more meaning' on a depleted system makes it worse.",
      "Meaninglessness + dark thoughts / withdrawal / substance use / impairment = crisis territory. 988."
    ]
  },
  {
    id: "the-honest-version-of-meaning",
    category: "what_purpose_is",
    title: "Some honest things about meaning",
    summary: "Meaning isn't grand. Most days. The honest version is more practical, more available, and more sustainable than the dramatic version.",
    readMinutes: 3,
    body: `Modern teen content about meaning often defaults to dramatic framings: "find your why," "discover your purpose," "live with intention," "design your dream life." These can be inspiring; they can also be exhausting and inaccessible. Most adults who report meaningful lives don't describe them in dramatic terms.

**The quieter version:**

People who report meaningful lives tend to share some common features that aren't all that dramatic:

- They have **a few people they really love** and stay in regular touch with them.
- They have **work they're decently good at** that someone else benefits from. Sometimes that work is a career; sometimes it's parenting; sometimes it's caregiving; sometimes it's a craft outside paid work.
- They have **at least one thing they're genuinely curious about** and engage with regularly. Reading, building, making music, learning languages, gardening, woodworking, writing, sports.
- They have **a relationship with the body** — they move, eat, sleep, take care of themselves at a basic level.
- They have **some practice that helps them be present** — could be religious, secular meditation, time outside, art, exercise.
- They have **some contact with the natural world** — sky, water, plants, weather.
- They have **a sense of being connected to something** larger than themselves. For some it's religious. For some it's communal / civic. For some it's intellectual lineage. For some it's family. For some it's craft tradition.

That's roughly it. Not dramatic. Available to most people across most income levels. Sustainable.

**What dramatic frames get wrong:**

- They imply meaning is rare and hard to find. It's actually pretty common in the quiet form.
- They imply meaning is one big thing. It's actually usually several small things stacked.
- They imply you have to do something extraordinary. Most meaningful lives are extraordinary in their accumulation, not in any single act.
- They imply you can buy it (the right job, the right relationship, the right experience). You can't.

**The teen version:**

You're at the start of building this. Some of it's already there:
- The friends you genuinely care about.
- The things you're curious about (whatever they are).
- The relationship with your body (still being negotiated).
- Time spent outside or with nature (often less than would help).
- Connection to family, community, religious tradition if relevant.

You can build it deliberately:
- Tend to the friendships that matter. Don't let them quietly fade.
- Get good at something you find interesting. Doesn't have to be impressive to others.
- Help with something, somewhere, somehow. Doesn't have to be heroic.
- Be in the natural world regularly. Even just walking.
- Read widely. People long-dead are very good companions.
- Have practices that help you be present (not just on phone). Could be anything.

**A reframe that helps a lot of teens:**

"What's my purpose?" is a big question that often produces anxiety. "What did I do this week that mattered to someone?" is a smaller question that often produces useful answers.

Some weeks you'll struggle to answer it. Some weeks you'll have multiple answers. Over years, the pattern of weekly answers becomes a life you can recognize as meaningful, without ever having had to "find" anything dramatic.

**A final note:**

Meaning often gets confused with happiness. They overlap but they're different. People with meaningful lives sometimes have hard weeks, are sometimes sad, are sometimes scared. The meaning doesn't make those feelings go away. It makes them survivable. The framing isn't "if I find purpose, I'll be happy"; it's "if I build a meaningful life, I'll have something to hold onto when things are hard."

You don't have to be happy all the time. You don't have to know your purpose at 16. You can build a meaningful life gradually, in conversation with the world, in connection with people who matter to you, in service of things you care about. That's available to almost everyone. It's available to you.`,
    takeaways: [
      "Most meaningful lives aren't dramatic. A few people, decent work, real curiosities, body care, contact with nature, sense of being part of something.",
      "Dramatic 'find your purpose' framings often produce anxiety. 'What did I do this week that mattered to someone?' is more useful.",
      "Meaning is built gradually, not found. The teen years are about input-gathering, not deciding.",
      "Meaning ≠ happiness. Meaning gives you something to hold onto when life is hard."
    ]
  }
];

export const PURPOSE_CATEGORY_LABEL: Record<PurposeCategory, string> = {
  what_purpose_is: "What purpose is",
  passion_vs_practice: "Passion vs practice",
  existential_questions: "Existential questions",
  contribution_and_service: "Contribution + service",
  career_and_meaning: "Career + meaning",
  when_meaning_falters: "When meaning falters"
};
