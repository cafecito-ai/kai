/**
 * Body image + appearance primer. Sensitive content; harm-reduction parallel
 * to the substances primer. Body distress is one of the highest-prevalence
 * struggles in adolescence and is structurally amplified by feed
 * environments.
 *
 * Voice rules (strict):
 *   - NO body-shaming, fat-shaming, thin-shaming, or appearance-based moralizing.
 *   - NO weight talk as advice. The product never tells teens what their
 *     body should look like or weigh.
 *   - NO calorie targets, macro targets, weight-loss strategies. This is
 *     hard-baked into the parent project (CLAUDE.md §1).
 *   - NO "love your body" toxic-positivity. Body neutrality / body respect
 *     is a more honest stance than required positivity.
 *   - Eating disorder red flags are named clinically but not as scare tactics.
 *   - Strong escalation paths: NEDA helpline (1-800-931-2237 phone-only,
 *     chatbot discontinued — noted in project spec §7), ANAD helpline
 *     (1-888-375-7767), Crisis Text Line (text HOME to 741741), trusted
 *     adult, pediatrician, therapist with ED specialization.
 *   - Body changes during puberty are honestly named as harder than adults
 *     remember and as normal — not minimized, not pathologized.
 *   - Pictures and self-image are treated as separate (the photo you see is
 *     a photo of a moment, not a verdict on your body).
 */

export type BodyImageCategory =
  | "comparison_and_feeds"
  | "body_acceptance"
  | "diet_culture"
  | "changing_body"
  | "body_checking_patterns"
  | "when_its_an_ed";

export type BodyImageArticle = {
  id: string;
  category: BodyImageCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

/** US-specific eating disorder resources. Spec §7 calls out NEDA phone line
 * specifically (chatbot is discontinued); ANAD is the active helpline most
 * commonly cited for current resource routing. */
export const NEDA_HELPLINE = "1-800-931-2237";
export const ANAD_HELPLINE = "1-888-375-7767";
export const CRISIS_TEXT = "Text HOME to 741741";

export const BODY_IMAGE_ARTICLES: ReadonlyArray<BodyImageArticle> = [
  {
    id: "comparison-feeds-and-bodies",
    category: "comparison_and_feeds",
    title: "Why every feed makes you feel worse about your body",
    summary: "The algorithm doesn't show you your friends' Tuesday afternoons. It shows you bodies optimized for engagement. The math is rigged.",
    readMinutes: 4,
    body: `Body image worsened measurably across most teen populations after smartphones became universal. This isn't speculation; it's one of the better-replicated findings in adolescent mental-health research over the past decade. The causation is debated; the correlation is not.

What the feed is actually doing to body image:

**It's showing you the top end of every category, constantly.** The algorithm rewards engagement, and bodies that score in the top 5% on conventional attractiveness produce more engagement than bodies in the middle 90%. Your default exposure is to the top 5% — for hours a day. Your brain calibrates "average" to what it sees most, and what it sees most is the top 5%.

**It's showing you bodies that don't exist as displayed.** Filters, angles, lighting, posing, surgical interventions, post-production editing, AI image enhancement — most of the bodies you compare to have been engineered. You're comparing yourself to a composite, not a person.

**It's showing you the same body in motion for 30 seconds at a time.** Static photos used to dominate; video gives the brain a stronger "this person is real and this body is real" signal. The illusion is harder to discount.

**It's serving you content that matches your worst hours.** The 11pm-on-an-anxious-night algorithm shows you different bodies than the 10am-after-a-good-conversation algorithm. The feed adapts to your worst moods, which is when comparison hits hardest.

This isn't your fault. The wiring + the environment combine to produce body distress in people who would not have had it in a different context.

Specific teen-relevant facts:

- **Studies consistently show body dissatisfaction increases with social media use, especially image-heavy platforms, especially in teens 13–18.**
- **Time-limit interventions help.** Cutting Instagram/TikTok use by 50% measurably improves body image in randomized teen studies — within weeks.
- **Curating your feed helps.** Unfollow accounts that consistently make you feel worse. Follow accounts featuring bodies that look like normal people. The feed is editable.
- **Time off the feed entirely (a day, a week) restores noticing of your own body's actual quality.** Most teens are surprised at how different a few days off feel.

What helps, practically:

- **Notice the cost in real time.** "I just spent 20 minutes on this app and I feel worse about my body." Naming it interrupts the loop.
- **Unfollow ruthlessly.** Any account that consistently makes you feel worse — gone. You owe them nothing.
- **Don't follow body-transformation content.** Even "positive" transformation content reliably worsens body image in studies. The mechanism is the comparison itself, not the framing.
- **Limit image-heavy platforms specifically.** Twitter / Discord / less-image apps are less destructive on body image than IG / TikTok / Snap.
- **Get the phone out of the bedroom.** First and last hour of the day are highest-impact comparison windows. Removing the phone from those windows is a high-leverage change.

The honest part:

Caring about your appearance is normal. Adolescent brains are wired to. The problem isn't caring — it's the input. The feed environment makes the wiring fire constantly at a population that no longer has a baseline of what real bodies look like.

You can't fix the feed environment. You can edit your feed, limit your time on it, and notice when it's hurting you. Done consistently, that's a meaningful tool for body image even without doing any inner work.

If body distress is persistent and severe — affecting your sleep, your relationships, your food choices, your willingness to be in your own life — that's a counselor conversation. Body distress at that level is not a feed problem alone; it deserves real help.`,
    takeaways: [
      "The algorithm shows you the top 5% of bodies, often engineered, often in motion. The math is rigged.",
      "Cutting image-heavy social use by 50% measurably improves body image in randomized teen studies within weeks.",
      "Unfollow ruthlessly. Phone out of the bedroom. Don't follow body-transformation accounts even when 'positive'.",
      "Severe persistent body distress affecting sleep, relationships, food → counselor."
    ]
  },
  {
    id: "body-neutrality",
    category: "body_acceptance",
    title: "Body neutrality (not body positivity)",
    summary: "Required positivity about your body is just as exhausting as required negativity. Neutrality is the more honest target.",
    readMinutes: 3,
    body: `The dominant cultural frames for teen body image are body positivity (the strong-affection-for-the-body version) and body negativity (the body-as-something-to-be-controlled version). Both ask you to have strong feelings about your body, just in opposite directions. Both are exhausting if your actual feeling is "I don't really want to think about it right now."

A third option: *body neutrality*. The body is the thing that carries you through your life. It does things. It feels things. You don't have to love it. You don't have to fight it. You can let it be there, work to keep it functional, and put your attention elsewhere.

A few principles:

**Neutrality is a more sustainable target than positivity.** Required positivity (the "you are beautiful, every body is amazing" framing) often backfires for teens whose felt experience is "I'm not sure I do." Performing love-for-the-body when you don't feel it is its own kind of pressure. Neutrality has no felt requirement — just "this is the body I have today."

**The body is for what it can do, not how it looks.** Functional framing: it walks, runs, hugs, dances, types, hears music, tastes food, holds friends. This is the framing that lasts. Bodies change. Function changes more slowly than appearance.

**You don't owe anyone a positive body image.** Strangers don't deserve your performance of body confidence. Your worth isn't contingent on how you feel about how you look. You can be a person who's working it out and not at peace with it yet.

**Body image is mostly about how you feel about yourself, not about your actual body.** Most studies on body image find people who are happy with their bodies don't have meaningfully different bodies than people who aren't — they have different feelings about themselves overall. This means the work is often less about the body and more about other things (self-worth, what you're stuck comparing yourself to, what's hard right now).

The body-image-as-mirror-of-other-things test:

When you're feeling worst about your body, ask: what else is going on? Tired? Bad week? Friend drama? Disappointed about something? Comparing? The body distress is often a screen for other distress. Address the other distress and the body distress often softens without you needing to "fix" your body.

What doesn't work:

- **Body positivity affirmations when you don't feel them.** "I love my body" said in front of the mirror when you don't believe it produces backlash, not belief.
- **Body checking / scrutinizing to "make peace" with it.** Repeated looking at the body trains the brain to look more, not to settle.
- **Comparison to "worse" bodies to feel better.** Cruel, and it doesn't last.

What helps:

- **Functional gratitude.** Once a week, name something your body did that you appreciated: "my legs handled that hike," "my hands made dinner." Functional, specific, doesn't require liking how it looks.
- **Time in the body, not looking at it.** Exercise that's fun, dancing alone, walking, swimming. Living from inside the body builds a different relationship with it than looking at it does.
- **Cover the mirror sometimes.** Especially if mirror checking is high. Less data on appearance = less rumination.

The honest version:

Most teens go through periods of really not liking their bodies. Most of them come out the other side as adults with much more peaceful relationships with their bodies. The peace usually comes from other parts of their lives getting more solid, not from the body itself changing.

If body distress is severe or persistent, talk to someone — a counselor, a therapist with body-image or ED specialization. Worth it.`,
    takeaways: [
      "Body neutrality (the body is the thing that carries you through your life) is more honest than required body positivity.",
      "Body image is mostly about how you feel about yourself overall. Address the other distress and body distress softens.",
      "Functional gratitude (what the body did) > appearance gratitude.",
      "Time IN the body (exercise, dance, walking) > time looking at it."
    ]
  },
  {
    id: "diet-culture-named",
    category: "diet_culture",
    title: "Diet culture, named",
    summary: "Diet culture is the air you breathe. Naming it lets you choose how much you want to inhale.",
    readMinutes: 3,
    body: `Diet culture is the set of cultural messages that say smaller bodies are better, thinner is healthier, weight loss is a moral pursuit, and food is something to be controlled rather than enjoyed. Most teens grow up swimming in it without naming it, which makes it harder to opt out of.

What diet culture actually says (which you may have absorbed without noticing):

- Some foods are "good," some are "bad."
- Eating less is virtuous; eating more is shameful.
- A person's weight is the most important thing about their body.
- Thinner = healthier (often wrong).
- Discipline around food makes you a better person.
- People in larger bodies are larger because they failed at discipline.
- The right diet will produce the right body.
- Weight loss is always positive; weight gain is always negative.

What the research actually shows:

- **Weight and health are correlated, but loosely.** Many medium-weight and larger-weight people are metabolically healthy; many lower-weight people aren't. Body Mass Index is a particularly bad measure of individual health.
- **Diets fail.** 90-95% of intentional weight-loss attempts result in weight regain (and sometimes more) within 1-5 years. This isn't personal failure; it's the body's well-documented response to caloric restriction.
- **Restriction often produces binge cycles.** People who restrict are more likely to binge later. The binge isn't a willpower failure; it's biology.
- **Body weight is largely genetically determined.** Twin studies put heritability at 60-80%. Body diversity in humans is real and normal.
- **Weight stigma causes worse health outcomes than weight itself in many studies.** The shame, the stress, the avoidance of medical care — these have measurable health costs separate from any body composition.

What this means for teens specifically:

- **Adolescent dieting is one of the strongest predictors of eating disorder development.** This is not "diet culture makes you sad"; it's "dieting in adolescence is associated with significantly elevated lifetime ED risk." Across many studies.
- **Most teens who try to change their bodies through restriction end up worse off** — physiologically (disrupted metabolism), psychologically (heightened body distress), and behaviorally (binge cycles, ED behaviors).
- **Bodies change in puberty in ways that don't reverse.** Gaining weight during adolescence is biologically required. The body becoming an adult body is its job. Fighting that is not health.

What "opting out" of diet culture looks like:

- **Reject good food / bad food framing.** Food is food. Some is more nutritious; some is less. None is moral or immoral.
- **Don't track calories or weight.** Especially in adolescence. The tracking itself is associated with worse body image and ED behaviors.
- **Notice the language around you.** Family, friends, coaches who talk about food and bodies in diet-culture terms — you can notice without joining in. You don't have to argue; you can just not participate.
- **Follow the "intuitive eating" frame** if you want a research-backed alternative. Eat when hungry. Stop when satisfied. Eat what sounds good. Don't moralize it.

When you've been steeped in diet culture and your relationship with food / your body is hard to untangle:

A therapist who works with body image and food (Health at Every Size-aligned, intuitive eating, or ED-specialized) can be specifically helpful. ANAD helpline (${ANAD_HELPLINE}) and NEDA (${NEDA_HELPLINE}) can route you to local resources.

Family context note:

In many families, diet culture lives in the kitchen — parents talking about their own bodies, food, weight. This is hard to opt out of when you live there. You can still build your own frame internally without fighting them on every comment. A counselor can help with this specific situation; it's common.`,
    takeaways: [
      "Diet culture is a set of cultural messages, not science. The messages don't match the research.",
      "Adolescent dieting is one of the strongest predictors of ED development. This is research, not opinion.",
      "Bodies change in puberty — gaining weight is biologically required. Fighting that is not health.",
      "Intuitive eating (hungry → eat, satisfied → stop, what sounds good) is the research-backed alternative."
    ]
  },
  {
    id: "puberty-and-changing-body",
    category: "changing_body",
    title: "Your body is supposed to be doing this",
    summary: "Puberty changes are normal, biologically necessary, and often harder than adults admit they were.",
    readMinutes: 4,
    body: `Most adults underplay how disorienting puberty is. From inside, your body is changing in ways you didn't choose, on a schedule you didn't pick. Skin, hair, body shape, voice, breasts, height, hips, fat distribution — sometimes the changes are fast, sometimes slow, sometimes mismatched (parts changing at different rates). All of it is normal. None of it is comfortable.

A few facts worth knowing:

**Adolescent fat gain is required.** Bodies designed to reach reproductive maturity need fat for hormone synthesis and sustained function. Teens lose, on average, much less weight than they gain across these years — because the gain is the point. The "leaning out" that some teens see in adulthood happens because adult bodies use fat differently. It is not available to most adolescent bodies.

**Body proportions change unevenly.** Hands and feet often grow first, then limbs, then torso. You may go through periods where everything feels disproportionate. This usually resolves within a year or two.

**Skin reacts.** Acne is common (40-50% of teens experience meaningful acne; many more experience some). Most acne is not a hygiene failure or diet failure; it's hormones.

**Body hair appears, changes, and varies.** A lot of variation among teens is normal. Cultural standards about body hair are not science.

**Periods and cycles disrupt body experience.** Bloating, water retention, breast tenderness, mood shifts — many things change across the month. Your "real body" is the average across the cycle, not the worst-cycle-day version.

**Growth happens in spurts.** You may be the shortest in your friend group and end up taller than them, or vice versa. Timing varies by years. Genetics is the bigger predictor than effort.

**Hormonal changes affect mood.** This is real and not a personal failing. Some teens cycle through significant emotional weather alongside the physical changes.

A specific frame that helps:

The version of your body you'll have at 25 is not the version of your body you have now. The version of your body you have now is not the version you'll have at 18. Trying to make peace with — or fight against — the version you have right now is fighting a temporary state. Most teens feel substantially better about their bodies once the changes settle.

What doesn't help:

- **Comparing your timeline to anyone else's.** Puberty timing is mostly genetic. Your friends developing earlier or later is not a reflection on you.
- **Trying to control or "fix" what the body is doing through restriction.** This often creates ED patterns instead of changing what's happening.
- **Performing peace with the changes you don't feel.** It's allowed to find this hard.

What does help:

- **Naming what's happening.** "My body is doing puberty. This is what it's supposed to do. I'm having a hard time with the changes." Named, it's more manageable than diffuse "I hate everything."
- **Talking to someone who's been through it.** Older sibling, parent, coach, counselor. Not for advice — for company. Most adults remember some part of this being hard.
- **Sleep and food.** The body needs both heavily during puberty. Under-sleeping and under-eating make everything (acne, mood, energy, growth) worse.
- **Movement that's about doing, not changing.** Sports, dance, walking with friends, swimming. Builds a relationship with the body that's not appearance-based.

If something about your body is genuinely worrying you (not just disliking it — actually worried something is wrong), talk to a pediatrician. Most worries are normal variation; the ones that aren't deserve real medical attention. Doctors are trained for this. It's not embarrassing to ask.

For teens whose bodies don't align with the gender they are: changes during puberty can be especially difficult. Resources exist (Trevor Project: 1-866-488-7386, Trans Lifeline: 877-565-8860, and counselors who specialize in this can be a lifeline). You're not alone, and there are people who get it.`,
    takeaways: [
      "Puberty changes are required, not failures. The body becoming an adult body is its job.",
      "The version of your body now is temporary. Most teens feel better about their bodies once changes settle.",
      "Sleep + food + movement-as-doing-not-changing supports the body through this.",
      "Body changes feel especially hard for some teens — talk to a counselor or pediatrician. It's normal."
    ]
  },
  {
    id: "body-checking-patterns",
    category: "body_checking_patterns",
    title: "Body checking: the patterns that escalate",
    summary: "Mirror checking, food rules, pinch tests, weighing — the behaviors that look like 'staying on top of it' often build the cage instead.",
    readMinutes: 4,
    body: `One of the most useful things to recognize is the difference between thinking about your body sometimes (normal teen experience) and the specific behavioral patterns that signal something is escalating into more dangerous territory.

Body checking includes any repetitive behavior aimed at monitoring, measuring, or evaluating the body. The patterns:

**Mirror checking.** Repeated looking, especially from specific angles, focusing on specific parts. The first few times in a day might feel like reassurance; by the 15th time, it's anxiety-driven scanning that doesn't settle anything.

**Pinch checking / measuring with hands.** Pinching skin, measuring waist with hands, checking if specific bones / spaces are present. These are often invisible to people around you but very telling internally.

**Frequent weighing.** Once a week is medical; multiple times a day is body checking. The number drives mood. The mood drives more checking.

**Photographing / videoing your body.** Especially from specific angles. Comparing across days, weeks, months.

**Trying clothes on to evaluate.** Constantly trying things on not to wear them but to see how they look.

**Tracking food intake.** Calorie counting, macro tracking, "logging" everything. Especially when associated with mood ups and downs.

**Body rules.** "I can't eat after X time." "I can't eat carbs on weekdays." "I have to do Y minutes of exercise after any meal over Z size." Rule-based eating, especially with consequences attached.

**Body scrutiny via touch.** Repeatedly touching specific parts of the body throughout the day. Often unconscious.

What these behaviors do:

They feel like they're keeping you safe ("staying on top of it," "knowing where I stand"). What they actually do is train the brain to perceive the body as a constant problem to monitor. The checking increases the anxiety; the anxiety drives more checking; the more checking trains more anxiety. It's a self-feeding loop.

Specifically: the research on body checking is consistent. People who check their bodies frequently have *worse* body image than people who don't, holding constant the actual body. The checking creates the distress, not the body.

What helps interrupt the loop:

- **Notice the behavior.** "I just looked in the mirror for the 8th time today." Naming it.
- **Limit access to the tools.** Cover specific mirrors. Get rid of the scale (or put it somewhere annoying to access). Delete the calorie-tracking app. Reduce the surface area for the behavior.
- **Replace the behavior.** When the urge to check comes, do something else for 5 minutes. The urge usually passes.
- **Sit with the discomfort.** Not checking, when you usually would, produces anxiety. The anxiety peaks and falls if you don't act on it. Over time, the urge weakens.

What's NOT helpful:

- **"Just stop checking" without a plan.** Doesn't work. The behavior is reinforcing itself.
- **Replacing one body-checking behavior with another.** Stopping mirror-checking by photographing more isn't progress.
- **Trying to fix this alone if it's been going on for months.** Body checking is one of the patterns that responds well to specific therapy approaches (CBT for body image, CBT-E for eating disorder territory). A counselor with this specialty can help significantly more than white-knuckling alone.

When body checking is part of a bigger picture:

If body checking is paired with food rules, fear of specific foods, weight changes, excessive exercise, or hiding food behavior — that's the territory of an eating disorder, not just body image distress. The next article covers this. ANAD helpline: ${ANAD_HELPLINE}. Crisis Text Line: ${CRISIS_TEXT}.

A note on social media body checking:

Posting selfies, checking the likes / comments, looking at old photos to compare — these can be a form of body checking too. The dopamine loop disguises it. If you're constantly checking how you "look in photos," that's worth noticing as a checking behavior, not just normal social media use.

This is one of the most useful patterns to learn to recognize in yourself in adolescence. Many adults still do these behaviors because they never named them as problems.`,
    takeaways: [
      "Body checking (mirror, pinch, weigh, food rules, scrutiny) feels like control but trains anxiety. Self-feeding loop.",
      "Studies are consistent: frequent checkers have worse body image than non-checkers, holding the body constant.",
      "Reduce surface area (cover mirrors, ditch the scale, delete tracking apps), sit with the discomfort.",
      "Months-long pattern → counselor with body-image / CBT-E specialty. Don't white-knuckle alone."
    ]
  },
  {
    id: "when-its-an-eating-disorder",
    category: "when_its_an_ed",
    title: "When body distress becomes an eating disorder",
    summary: "Eating disorders are common in teens and serious. Early recognition matters. Help works.",
    readMinutes: 4,
    body: `Eating disorders affect roughly 10% of adolescents at some point. They have one of the highest mortality rates of any mental illness — including suicide rates that are substantially higher than the teen baseline. They are also among the most successfully treatable mental illnesses when caught early and treated by specialists.

This article is for: teens who suspect something might be off, teens whose friends are showing signs, teens who already know they're in it. Reading it doesn't commit you to anything. It gives you the language and the resources.

Signs worth taking seriously:

**Around food:**
- Restricting amounts (eating less than the body needs).
- Skipping meals on purpose.
- Counting calories or macros obsessively.
- Strict food rules ("no carbs," "no eating after 7," "only safe foods").
- Eating very fast in private; eating very slowly in public.
- Feeling guilty after eating.
- Avoiding eating with other people.
- Throwing up after eating, intentionally.
- Using laxatives, diuretics, or excessive exercise to "compensate."
- Binge episodes (eating a lot, very fast, with a sense of being out of control).

**Around the body:**
- Significant weight loss in a short time.
- Significant weight gain in a short time.
- Hair thinning or hair loss.
- Always cold, even when others are warm.
- Periods stopping (or never starting on schedule, after puberty).
- Lanugo (fine hair on body), often face / arms / back.
- Dizziness, fainting, low energy.
- Constipation or other GI issues.

**Around behavior:**
- Excessive exercise that doesn't stop even when injured or sick.
- Significant time spent on body-related behaviors.
- Withdrawal from friends and family.
- Mood swings, irritability, depression.
- Inability to focus on anything besides food / body / weight.
- Hiding food, hiding eating, hiding behavior.

**Around relationships:**
- Hiding behaviors from family or friends.
- Lying about eating.
- Sneaking food.
- Defensive when food / body is brought up.

What kinds of eating disorders exist (rough version):

- **Anorexia:** restriction, fear of gaining weight, body distortion. Can occur at any weight, not just very low weight (atypical anorexia is the more common form).
- **Bulimia:** binge episodes followed by compensatory behaviors (purging, laxatives, excessive exercise).
- **Binge eating disorder:** recurring binge episodes without regular compensatory behaviors. Often associated with deep shame.
- **ARFID:** avoidance/restrictive food intake, often sensory-driven, often without body-image component.
- **OSFED:** other specified feeding/eating disorders, which captures many patterns that don't fit cleanly into the others.
- **Orthorexia:** obsessive focus on "clean" eating. Not currently a formal DSM diagnosis but a recognized pattern.

A teen can have an eating disorder at any body size. The "you have to be thin to have an ED" myth is one of the most dangerous in the field; it delays treatment for the majority of people with EDs.

What to do:

**If this article describes you (even partly):**

1. **Tell one person.** A trusted adult, a school counselor, a doctor, a coach. Don't start with the highest-stakes conversation (parents in a strict-family situation). Start with someone you can predict will respond with care.
2. **Call a helpline.** ANAD: ${ANAD_HELPLINE} (Mon-Fri). Crisis Text Line: ${CRISIS_TEXT}. NEDA: ${NEDA_HELPLINE} (phone only). All are anonymous; none will get you "in trouble."
3. **Get a medical eval.** A pediatrician or family doctor can rule out medical complications and refer to ED specialists. Important not to skip this — EDs have specific medical risks.
4. **Therapist with ED specialization.** Not just any therapist — specifically someone who treats EDs. Approaches with strong evidence: Family-Based Treatment (FBT/Maudsley) for adolescents, CBT-E, DBT for binge eating.

**If this article describes a friend:**

1. **Don't try to "fix" them.** Friends can't be the treatment. You can be a friend.
2. **Express concern privately, with care.** "I've been worried about you. I love you. I'm not going to interrogate you, but I want you to know I see it." Once. Not repeatedly.
3. **Tell a trusted adult.** A school counselor, your friend's parent (if safe), your own parent. Yes, even if your friend asked you not to. EDs in teens have significant mortality; this is more important than the friendship rule of confidentiality. If your friend gets angry, that's the disease talking; the friendship can heal once they're safer.
4. **Don't comment on their body or food.** Don't compliment weight loss. Don't ask if they ate. Just be a person.
5. **Take care of yourself.** Loving someone with an ED is hard. You can have your own counselor about it.

Treatment outcomes are good when caught early:

About 60% of people with eating disorders fully recover, and many more achieve significant improvement. Early intervention significantly improves the odds. The teens you've heard about who don't recover are mostly those who didn't get specialized treatment in time. Treatment exists; it works; reaching for it is the move.

Crisis:

If you or a friend has thoughts of not being here, or is engaging in behaviors with immediate medical risk (very low intake, severe purging, fainting, chest pain), that's an immediate-medical-attention moment. Crisis page link is at the bottom of every Kai screen. Call 988 for crisis support, or 911 if there's medical emergency.`,
    takeaways: [
      "Eating disorders affect ~10% of teens. High mortality, but also high treatability when caught early.",
      "You can have an ED at any body size. The 'must be thin' myth delays treatment for most people with EDs.",
      "Tell one person, call a helpline, get a medical eval, find a therapist with ED specialization (not just any therapist).",
      "If a friend is showing signs, tell a trusted adult — even if they asked you not to. EDs have real mortality risk."
    ]
  },
  {
    id: "compliments-and-comments",
    category: "body_acceptance",
    title: "Comments about your body — yours and other people's",
    summary: "Family, friends, coaches, strangers comment on bodies constantly. Knowing how to handle it (and not pass it on) matters.",
    readMinutes: 3,
    body: `In most cultures, commenting on each other's bodies is constant — at school, at home, at family gatherings, online. Most of it is unsolicited. Some of it is well-meaning. Some of it is harmful even when well-meaning. Knowing how to handle it matters.

The compliments that hurt:

- **"You look so good — have you lost weight?"** Equates weight loss with looking good, implies a goal you may not have, raises the stakes of weight gain.
- **"Stop, you're so skinny / so thin."** Equates thin with the right answer; can be especially hurtful to teens whose bodies have shifted recently.
- **"You're not fat — you're beautiful."** Implies fat is the opposite of beautiful.
- **"You have such a [body part] — I wish I had that."** Comparison framed as compliment.

These aren't malicious. They're cultural; many adults default to them. They still land badly.

The comments that wound:

- **From family:** "you've gained weight," "you should eat less," "watch your weight," "you have my [body part] problem."
- **From coaches:** weight-monitoring talk in sports, "lean for performance" framing, weigh-ins.
- **From friends:** body talk that you don't want but they want to do.
- **From strangers / online:** any of it.

Responses that work:

For compliments-that-hurt:

- **"Thanks, but I prefer to not focus on weight."** Or simply, "Let's talk about something else." You don't have to argue with the framing.
- **Topic-shift.** "Thanks! By the way, did you see…" — re-direct without confrontation.
- **From close people:** "I know you mean well, but I'd rather you not comment on my body." Once. Calmly. Most close people adjust.

For wounding comments:

- **From family who repeatedly comments:** "I'm not going to talk about my body. Tell me something else." Repeated as needed.
- **From a coach with body-monitoring practices:** worth a conversation with parents or another adult — this can be a real safety issue (weigh-ins in adolescent sports are a known ED trigger).
- **From a friend:** "I love you, and I can't do body talk with you. Can we just not?" Real friends adjust.
- **From a stranger / online:** mute, block, walk away. You owe them nothing.

What NOT to do:

- **Pass the comments on.** "My mom said I should lose weight, do you think I'm fat?" — that voice gets installed and then you're spreading it. Don't.
- **Engage with the framing to defend yourself.** "Actually I gained weight because…" — gives the framing more oxygen.
- **Internalize it as truth.** Other people's comments on your body are about THEM (often their own body issues, their own anxieties). You can let them land less.

What to do about your own commenting habit:

- **Stop commenting on other people's bodies, period.** Not even compliments. There's no version of "you look great, did you lose weight?" that isn't reinforcing the framing.
- **Compliments that don't comment on the body:** "I love your energy today." "You look really happy." "Your outfit is killing it." These work without reinforcing diet culture.
- **Body talk in friend groups:** if your friend group does a lot of body talk, you can be the one who doesn't. Slowly, the conversations shift.

A specific framing for hard family environments:

If you live in a family where body comments are constant and toxic, that's real and hard. You probably can't change them. You can build internal armor (the "this is about them, not me" frame), build adult allies (counselor, other family members, friends), and remember that adult life lets you choose your exposure to this. For now: don't internalize it, don't argue every instance, don't carry it as truth.

When body comments cross into mistreatment:

If a parent, sibling, or other family member's body comments include cruelty, persistent pressure to change your body, food restriction, weight monitoring, public shaming, etc. — that's emotional harm worth bringing to a trusted adult outside the family. School counselor, doctor, another relative. You don't deserve this; it's not normal even when it's familiar.`,
    takeaways: [
      "Compliments that mention weight loss reinforce diet culture even when well-meant. 'Looking great, lost weight?' wounds.",
      "Topic-shift, 'I prefer not to talk about my body,' mute / block — all are reasonable responses.",
      "Stop commenting on other people's bodies entirely. Compliment energy, vibe, outfit instead.",
      "Persistent body cruelty from family is real harm. Trusted adult outside the family can help."
    ]
  }
];

export const BODY_IMAGE_CATEGORY_LABEL: Record<BodyImageCategory, string> = {
  comparison_and_feeds: "Feeds + comparison",
  body_acceptance: "Body neutrality",
  diet_culture: "Diet culture",
  changing_body: "Changing body",
  body_checking_patterns: "Body checking",
  when_its_an_ed: "When it's an ED"
};
