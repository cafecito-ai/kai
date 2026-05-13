/**
 * Money + financial-pressure primer. The basics of money skills for teens
 * plus an honest look at the family-financial-stress dimension that often
 * goes unnamed.
 *
 * Voice rules (strict):
 *   - No "wealth mindset" / "law of attraction" / "manifest money" / FIRE-bro
 *     hustle culture. Real money skills, not influencer pseudo-finance.
 *   - No specific stock picks, crypto recommendations, or "get rich" pitches.
 *   - No moralizing about how money should be spent. Teens get to decide
 *     what their money is for.
 *   - Family financial stress is real and often invisible to teens; the
 *     primer names this honestly without prescribing a teen response.
 *   - College-cost framing is honest about the trade-offs without making
 *     teens feel like a specific path is the right one.
 *   - Predatory patterns (BNPL, payday loans, sports betting, crypto pumps)
 *     are named for what they are.
 *   - When money stress is overwhelming → school counselor / trusted adult /
 *     211 (US benefits-information helpline). Money problems are sometimes
 *     life-safety problems.
 */

export type MoneyCategory =
  | "first_money_skills"
  | "job_and_earning"
  | "spending_and_saving"
  | "family_stress"
  | "college_costs"
  | "predatory_patterns";

export type MoneyArticle = {
  id: string;
  category: MoneyCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

/** US benefits-information helpline. Not crisis-only; routes families to
 * food assistance, rent help, utility assistance, etc. */
export const HELPLINE_211 = "Dial 2-1-1 (US/Canada)";

export const MONEY_ARTICLES: ReadonlyArray<MoneyArticle> = [
  {
    id: "money-basics-that-school-skips",
    category: "first_money_skills",
    title: "The basics most schools skip",
    summary: "A short list of money skills that compound across decades. Most teens never see them written down.",
    readMinutes: 4,
    body: `Most schools teach algebra but not how a credit score works. Most teens learn money from osmosis at home, which means some learn carefully and many learn nothing or learn wrong. This article is the version of "money basics" that would be useful to know before age 18.

These are not investment tips. They are the small set of facts that, if you know them by 18, dramatically reduce the chances of bad outcomes in your 20s.

**1. Compound interest is the most important concept, in both directions.**

Money saved early compounds. Money borrowed at high interest compounds. Both are real and the math is uncaring.

- $5/week invested from age 16 to 65 in a basic index fund (~7% real return) is roughly $90,000 at retirement. The amount you put in is about $13,000. The rest is compounding.
- $1,000 of credit-card debt at 24% APR, making only the minimum payment, takes ~5 years to pay off and costs ~$700 in interest. Same math, working against you.

The lesson: time matters more than amount. Starting earlier with small amounts beats starting later with big amounts.

**2. Credit scores exist and are real.**

A credit score is a number between 300 and 850 that estimates how likely you are to repay debt. It's calculated by three companies (Experian, Equifax, TransUnion) and it controls a lot of adult life: getting an apartment, a car loan, sometimes a job.

What matters:
- **Payment history (35%):** pay on time, every time. Even one 30-day-late payment hurts for years.
- **Credit utilization (30%):** the percent of available credit you're using. Keep under 30%.
- **Length of credit history (15%):** older accounts help.
- **Mix of credit and new accounts (~20% total):** less important early.

For teens: you can usually become an "authorized user" on a parent's credit card to start building history without taking on debt. Worth asking about, in families where it makes sense.

**3. Banks vs. credit unions vs. cash apps.**

- **Banks (Chase, Wells Fargo, etc.):** convenient, lots of branches, often higher fees, lower interest on savings.
- **Credit unions:** member-owned nonprofits, usually lower fees, higher savings interest, sometimes less convenient.
- **Cash apps (Venmo, Cash App, Zelle):** great for transfers, not great as the primary place your money lives. Limited consumer protections, not FDIC insured the same way.

A standard setup that works: a checking account at a credit union for everyday spending, a savings account at the same credit union for money you're not touching, a cash app for paying friends. Don't keep large balances on Venmo/Cash App.

**4. The "pay yourself first" rule.**

When money comes in (job, allowance, gift), set aside a percentage for savings BEFORE you do anything else. Even 10%. The trick is doing it automatically — money you don't see in your spending balance is much easier to leave alone.

**5. Emergency fund > spending fund > investing fund.**

Order matters. Before you invest a dollar, make sure you have enough cash on hand to deal with a car problem, a phone breaking, a medical bill. Adults often skip this step and end up putting emergencies on high-interest credit cards.

For teens: even $200-500 saved is meaningful. Most teen "emergencies" are smaller than adult ones.

**6. Taxes are part of having a job.**

Your first paycheck will be smaller than you expect because of payroll withholding (federal income, Social Security, Medicare, state). This is normal. Most teens get most of the federal withholding back as a refund when they file the next spring, if their income is low enough. You file taxes once a year and it takes about 30 minutes for a simple return (free with software like FreeTaxUSA).

A note: if you make less than the standard deduction (~$14,000 in 2025), you may not owe federal income tax. You still might need to file to get withheld money back.

**7. Identity matters in money.**

- Don't share your Social Security Number with anyone who doesn't have a clear, legitimate reason (job applications, government, financial institutions). It's not asked for routinely.
- Don't give bank account numbers, debit card numbers, or PIN codes to "verify" anything for an online or phone caller. Real institutions don't ask that way.
- Free annual credit reports: AnnualCreditReport.com (the official site).

That's enough to start. Most adult money problems come from violating one of these in their 20s — not from sophisticated mistakes.`,
    takeaways: [
      "Compound interest matters more than any single decision. Start early with small amounts.",
      "Credit scores are real — pay on time, keep utilization low, become an authorized user if you can.",
      "Pay yourself first: a percentage to savings automatically before anything else.",
      "Don't share SSN / bank details to verify anything by phone or email. Real institutions don't ask that way."
    ]
  },
  {
    id: "first-job-realities",
    category: "job_and_earning",
    title: "Your first job: what it pays, what it costs, what it teaches",
    summary: "Money is one of the rewards of a job. It's not always the biggest one.",
    readMinutes: 3,
    body: `A first job in your teens is one of the better moves you can make — not primarily for the money, but for what it teaches you about systems, time, and your own preferences. The money is a bonus. The skills and the self-knowledge are the main thing.

Honest tradeoffs:

**Time cost.** A 15-hour-per-week job takes 15 hours per week. That's hours not spent on sleep, school, sports, friends, family. For most teens, the right number of hours is 0 (during in-season sports / heavy school terms) or 5-15 (during normal terms). 20+ hours per week starts to cost academic performance in most studies.

**Energy cost.** Customer-facing jobs (food service, retail) are draining in a specific way. Coming home from a 5-hour shift at 9pm and trying to do homework is hard. Plan for energy, not just time.

**Skill gain.** Specific skills you actually learn:
- Showing up on time, reliably. This is a real skill and you only learn it by doing it.
- Managing money you earned (different from money given).
- Talking to adults you didn't choose (customers, bosses, coworkers).
- Handling difficult people without crumbling.
- Being part of a system where you're not the main character.

These show up on college applications, on later job applications, and in how grown-up you feel by the time you leave for college.

**Self-knowledge.** You learn what kind of work drains vs. energizes you. Indoor vs. outdoor, alone vs. team, repetitive vs. variable, customer-facing vs. behind-the-scenes. Most adults never figure this out clearly; teens who've worked a few different kinds of jobs have a real advantage.

Common starter jobs and what they're like:

- **Food service (fast food, sit-down restaurants, coffee).** High volume, fast pace, lots of customer interaction, often weekend-heavy, sometimes tip-pooled. Teaches resilience and speed.
- **Retail.** Less intense than food, more "presence" work (standing for hours, dealing with awkward customers), pay often barely above minimum.
- **Lifeguarding / camp counselor / tutoring / babysitting.** Better pay-per-hour usually, more responsibility, often requires certification. Builds different skills (safety, leadership, instruction).
- **Office / admin internships.** Less common at 16, more common at 18. Resume-builders, lower pay typically, exposure to professional environments.
- **Trade apprenticeships.** Increasingly available and often well-paid. Worth investigating if any of the trades pull you.
- **Online work (tutoring, content moderation, surveys, gig).** Mixed bag — some legitimate, some scams. Be careful.

What to negotiate / ask about:

- **Hourly rate** — yes, you can ask. Most teens accept the offered rate. Sometimes you can get $1-2 more by simply asking, especially if you have any relevant experience.
- **Hours and scheduling flexibility** — especially around school, sports, finals.
- **Pay frequency** — weekly vs. bi-weekly affects your cash flow.
- **What's expected on the first day** — uniform, food handler's permit, ID requirements.

Red flags in a first job:

- Asks you to pay upfront (training fees, "starter kits"). Legitimate jobs don't.
- Pay structure that depends on recruiting other people (MLM / pyramid scheme).
- Promises unrealistic earnings.
- Wage that's clearly below your state's minimum.
- Asks you to work off-the-clock or won't pay overtime.

Your rights:

In the US, there are laws specifically protecting teen workers:
- Federal minimum wage applies (state minimum is often higher; whichever is higher wins).
- Hours restrictions for under-18 workers (school nights, total hours per week).
- No hazardous work for under-18.
- You have the right to a safe workplace.

If a job is violating these: your state's labor department, your school counselor, or the federal DOL (Department of Labor) can help. Retaliation against teens reporting violations is also illegal.

What to do with the first paycheck:

- **Open a real account** if you don't have one. Credit union > big bank, see the basics article.
- **Pay yourself first** — even 10% to savings, automatic if possible.
- **Spend some on something you actually want.** You earned it; the joy of earned money is part of the value.
- **Notice how it feels** to spend money you earned versus money you were given. Different.`,
    takeaways: [
      "First job teaches systems, time, and self-knowledge more than it provides money.",
      "20+ hours/week in school often costs academic performance. 5-15 is usually right during normal terms.",
      "MLMs / pyramid schemes / unpaid 'training fees' / off-the-clock work — all red flags. Walk away.",
      "Teen workers have specific federal protections. State labor department or DOL handles violations."
    ]
  },
  {
    id: "spending-vs-saving",
    category: "spending_and_saving",
    title: "Spending without shame, saving without anxiety",
    summary: "Money is for use. Spending it on things that bring you joy is fine. Saving it for the future is also fine. The skill is balance, not virtue.",
    readMinutes: 3,
    body: `Two failure modes about money show up early:

**The spender:** money in = money out. Whatever's in the account by Friday is gone by Sunday. The future isn't real; the next thing you want is.

**The hoarder:** money is for emergencies, not for use. Spending feels anxious. You're 17 with $3000 saved and you've never bought yourself anything nice with it. Future self isn't real here either; you're saving for a "someday" that doesn't have a date.

Most teens trend toward one or the other based on family modeling. The skill is balance — money is for use across time, including the present.

A practical frame:

**The 50/30/20 frame** (often used as adult advice; adapts to teen money too):
- **50% for needs / responsibilities** (food, transportation, school costs, things you've agreed to pay for).
- **30% for wants** (the things that bring you joy: food, music, clothes, experiences, gifts for people).
- **20% for savings / future** (emergency fund first, then bigger goals: car, college, post-college fund).

For teens, the "needs" category is often smaller because parents cover most basics, so the math shifts: more like 10/60/30 or even 0/70/30. That's fine. The point is to have all three categories.

The "wants" category is not bad. Spending money on things you genuinely enjoy is part of why money exists. The trap is when "wants" is everything and "future" is nothing.

**Money for experiences vs things.**

Research on happiness and spending consistently finds:
- **Experiences (concerts, trips, dinners, classes, events) produce more lasting happiness** than equivalent-cost things. They become memory + identity. Things become normal.
- **Things that enable experiences** (a bike that gets used, a camera that gets used) are exceptions — these blur into experience over time.
- **Status purchases** (the watch, the bag, the brand specifically because of who wears it) tend to age the worst. The status doesn't last; the cost did.

This isn't a rule, just data. Your money, your choices.

**The 24-hour test.**

For non-trivial purchases (anything more than a casual snack-level amount), wait 24 hours. If you still want it the next day, buy it. About 60% of "I have to have this" moments fade in 24 hours. The 40% that survive are usually the ones worth buying. Saves significant money without being austere.

**Subscriptions and recurring costs.**

Streaming, app subscriptions, gym, premium-tier apps, in-game currencies. These accumulate quietly. Once a year (a birthday, New Year's), audit them. Cancel anything you haven't used in 60 days. Most adults are spending $50-200/month on subscriptions they don't actively use.

**Saving without anxiety.**

If saving feels like deprivation, you'll either fail at it or be miserable doing it. The trick is making the savings feel like an asset, not a punishment:

- **Name the savings.** "Car fund." "Move-out fund." "Travel fund." Named savings are easier to defend.
- **Automate it.** Money that moves to savings before you see it is much easier to leave alone.
- **Visualize the timeline.** "By age 18, I'll have X" with simple math is motivating. Vague "saving for the future" rarely is.

**For teens in families where money is tight:**

The advice above assumes you have discretionary money. Some teens don't — what they earn goes to family expenses, school stuff, or just survival. That's real, common, and not your fault. A few notes:

- **Contributing to a struggling family isn't a moral failure to "save for yourself."** It's a real choice with real meaning.
- **211 helpline (${HELPLINE_211})** routes families to food, rent, utility help. Telling your parents about it sometimes opens conversations they didn't think were available.
- **School counselors can connect to school-funded supports** for things like fees, clothing, college applications, sometimes food.
- **If you can save even small amounts secretly, do.** Money of your own provides options. It's not selfish; it's foundation.`,
    takeaways: [
      "Money is for use across time — including the present. Spending on what you enjoy is part of why money exists.",
      "Experiences > things, for sustained happiness. Status purchases age the worst.",
      "24-hour test on non-trivial purchases. Audit subscriptions yearly.",
      "If family is tight: 211 helpline, school counselor support, and saving even small amounts secretly builds foundation."
    ]
  },
  {
    id: "family-money-stress",
    category: "family_stress",
    title: "When your family is stressed about money",
    summary: "Family money stress is one of the most common invisible weights teens carry. Naming what's happening (and what's yours to carry) matters.",
    readMinutes: 4,
    body: `A lot of teens are quietly absorbing family financial stress that nobody has explicitly told them about. They notice tightness around bills, the parent who got laid off, the dinner conversations that go quiet when money comes up, the family vacation that didn't happen this year. Sometimes they're explicitly told. Sometimes they're not. Either way, the stress comes through.

A few honest things:

**You probably know more than your parents think you do.** Teens are good at reading family dynamics. The parent who thinks they're "protecting" you by not discussing money usually isn't fooling you; you've just been processing it without the explanation.

**Family money stress is one of the most common silent weights in adolescence.** It correlates with adolescent anxiety, sleep problems, school performance issues, and identity stuff (especially in cultures where family financial status is talked about a lot). You're not unusual for carrying it. You're also not unusual for it being heavy.

**Some of it is yours to carry. Most of it isn't.**

What's reasonably yours:
- Being part of family conversations about money (when they happen).
- Adjusting expectations about specific things (a trip, a new car, a particular school).
- Helping in concrete, age-appropriate ways (chores, working a job, contributing some earnings if it makes sense).
- Awareness of the constraint when making choices.

What's not yours:
- Solving the family's financial problems.
- Hiding from family that you need things (medical care, school supplies, basic needs).
- Feeling guilty for the cost of being a teenager.
- Carrying anxiety about scenarios you can't control.

When the stress is acute (lost job, eviction risk, medical bills, etc.):

**Your parents need their version of support, which is mostly: another adult to talk to.** A school counselor, a relative, a financial counselor through a nonprofit, an extension worker. You can mention this exists; you can't be that for them.

**211 (${HELPLINE_211})** routes families to:
- Food banks and food assistance.
- Rent and utility assistance.
- Health care access.
- Job training programs.
- Family counseling.
- Many more. It's free, anonymous, and 24/7. Most parents don't know it exists; many find out from their teen.

**School counselors can quietly handle a lot of teen-specific needs** that parents in tight situations don't have bandwidth for:
- Reduced or waived school fees.
- Clothing closets.
- College application fee waivers.
- Free SAT/ACT testing.
- Free meals (often anonymous to peers).

**Crisis-level scenarios** (no food, no place to sleep, no medication for a family member with a serious condition): 911 isn't usually the right call unless there's immediate danger. The school counselor, 211, or local emergency family services are.

**When family stress is showing up in you:**

Family money stress often metastasizes into other things: heightened anxiety, difficulty focusing on school, conflict at home, "compensating" through over-achievement, or substance use. If you're noticing any of these AND you're aware family money is part of the picture, talking to a school counselor is the move. Not for them to fix the family money — for them to help you handle what you're handling.

**Specific patterns to notice in yourself:**

- Lying about your family's situation to peers (out of shame, embarrassment, or to fit in).
- Refusing things you need (school supplies, doctor visits, food) to "not be a burden."
- Working more hours than is good for you to contribute, when nobody asked you to.
- Performing financial okay-ness while internally exhausted.
- Postponing your own future plans because the family situation seems endless.

These are very common patterns. They're worth recognizing because each of them has real costs over time, and each has a different response than just continuing to absorb.

**Some longer-term reframes:**

- **Your family's financial situation now is not necessarily your future.** Many people from financially stressed families build different financial futures. Education, skills, network, and choices matter; outcomes are not predetermined.
- **You will probably know more about money in adulthood than your parents do**, if you actively learn. The articles in this section + free resources (Khan Academy on personal finance, library books, etc.) build real skill.
- **Asking for help is not a moral failure.** Families with money sometimes ask for help; families without money sometimes refuse to. The asking is a skill more than a shame.

If money stress is acute enough that you or your family is in crisis (no food, no shelter, life-affecting medical need): ${HELPLINE_211}. School counselor. Trusted adult. There are systems built for this; they help; using them is the move.`,
    takeaways: [
      "Family money stress is one of the most common silent weights in adolescence. You're not unusual for carrying it.",
      "Some of it is yours (awareness, age-appropriate help). Most of it isn't (solving the problem, hiding from needs, guilt for existing).",
      "211 helpline routes families to food/rent/utility/health resources. Free, anonymous. Many parents don't know it exists.",
      "School counselors quietly handle teen-specific needs (fee waivers, clothing, free meals, application help). Use them."
    ]
  },
  {
    id: "college-cost-honesty",
    category: "college_costs",
    title: "College costs: an honest look",
    summary: "College is one of the largest financial decisions of your life and often the least transparent. Here's what's worth knowing before you commit.",
    readMinutes: 5,
    body: `College pricing in the US is one of the strangest financial systems in modern adult life. Sticker prices are large and mostly fictional. Actual costs vary by family income, school, scholarship strategy. The system doesn't make sense by default. Worth understanding before you commit.

A few things that are true:

**The sticker price ≠ what you'll pay.** Private colleges in particular discount heavily off the published cost-of-attendance through financial aid, merit scholarships, and need-based grants. A school that lists $90,000/year may cost a family $20,000/year after aid. Or it may cost the full amount, depending on the family.

**Public in-state schools are often the highest-value option.** State universities in your home state typically cost $10-30k/year all-in, which is often half or less of what out-of-state or private costs (even after aid). For many students, in-state public is the financially smart choice and the educational difference is much smaller than the cost difference.

**FAFSA matters, even if you think you won't qualify.** The Free Application for Federal Student Aid is what unlocks most need-based aid AND some merit aid. File it (it's free) even if your family is high-income — some scholarships require it regardless. fafsa.gov.

**Community college → 4-year transfer is an underrated path.** Two years at community college ($3-8k/year) plus two years at a 4-year school, with credits transferred, can cut total college cost by half. The diploma at the end is from the 4-year school. Many community colleges have specific transfer agreements with state universities.

**Federal student loans have limits that prevent the worst outcomes.** Federal undergraduate loans cap at ~$31,000 across all four years for dependent students. This is a meaningful debt but not a crushing one. PRIVATE student loans (Sallie Mae, SoFi, others) have no such cap and have caused most of the catastrophic student loan stories. Avoid private student loans if at all possible.

**The schools that don't require loans for low/middle-income students:** A growing number of elite private colleges (Harvard, Princeton, Stanford, MIT, Yale, Williams, Amherst, Bowdoin, Pomona, Vanderbilt, others) commit to meeting full demonstrated need without loans for families under specific income thresholds (often $100K-150K). For families that qualify, these can be cheaper than state schools.

**Your major affects ROI a lot.** Engineering, computer science, nursing, and skilled trades have high direct ROI. Humanities, arts, education — often lower direct ROI but real long-term value. Picking a major you'll hate to maximize ROI is a known way to be miserable and drop out. Picking a major you love at the most expensive school you can find, funded with private loans, is a known way to suffer financially for a decade.

**Trade school / 2-year programs are real options.** Plumbing, electrical, HVAC, dental hygiene, radiology tech, paralegal — many of these are 1-2 year programs with strong job placement and good wages. The cultural pressure toward 4-year college has hidden these from a lot of teens. They're often the right answer for some.

**Gap year is allowed.** Many students benefit from a year between high school and college. Working, traveling cheap, figuring out what they actually want to study. Colleges generally honor admission with a deferral if asked. Not a failure path.

A few myths worth dispelling:

- **"You have to go to college right after high school."** Not true. Statistically, students who start at 19-20 don't have worse outcomes than 18-year-olds.
- **"Your major determines your career."** Mostly false. Most adults work in fields unrelated to their college major. The major matters less than what you learn / who you meet / how you grow.
- **"You should go to the most prestigious school you got into."** False. Fit, cost, and what you'll actually engage with matter much more than name.
- **"Student loans are normal and necessary."** Federally capped loans for state school: defensible. $100k+ in private loans: usually a financial catastrophe in waiting.

What to ask of colleges:

- **Net price calculator.** Every school has one on its website. Use it before you fall in love with any school.
- **What percent of admitted students get merit aid?** And how much, on average?
- **What's the four-year graduation rate?** (Schools that graduate students in 5-6 years cost a lot more.)
- **What's the average debt of graduates?** (Public information.)

When you're being recruited (sports, music, academic merit):

- **Get the financial offer in writing before committing.** Verbal promises aren't enough.
- **Compare offers across schools.** Recruited athletes especially can sometimes negotiate.
- **Don't commit early without a financial path that works.** Early Decision is binding; only do it if the school is affordable.

When family money is part of the equation:

- **Talk to your parents honestly about what's affordable.** This is the hardest conversation in many families and the most important one. Sticker price aspirations are sometimes blocking better conversations.
- **Be specific about loan limits.** "I'm not taking more than $X in loans" should be a number, not a vague intention.
- **Don't take on debt to maintain a family appearance.** Lots of teens go to expensive schools because the family wanted to be able to say they did. The teen carries the debt for decades.

If college is genuinely unaffordable in your family situation:

- **Free college options exist.** Service academies (West Point, Naval Academy, etc.) — free, but require military service after. ROTC — pays for college in exchange for service. Posse Foundation, QuestBridge — full-ride programs for high-achieving students from underserved backgrounds.
- **Community college + work is a real path.** Many adults complete bachelor's degrees while working full-time later. Slower but sustainable.
- **Some employers pay for college.** Starbucks, Amazon, Walmart, McDonald's — all have programs paying for online undergraduate degrees while you work for them. Worth investigating.

The single most important thing:

**Don't sign loan documents you don't understand.** Read every line. Calculate the monthly payment on the actual loan amount you'd take, at the actual interest rate, after graduation. If that number scares you, that's information.`,
    takeaways: [
      "Sticker price ≠ what you'll pay. File FAFSA. Use net price calculators before falling in love with a school.",
      "Federal student loans cap at ~$31k for dependent undergrads. Avoid private student loans if possible.",
      "Community college transfer + state schools + free college options (service academies, ROTC, QuestBridge) are real paths.",
      "Don't sign loan documents you don't understand. Calculate the actual monthly post-graduation payment first."
    ]
  },
  {
    id: "predatory-patterns",
    category: "predatory_patterns",
    title: "Patterns designed to take your money",
    summary: "Buy-now-pay-later, sports betting, crypto pumps, MLMs, paycheck advances. Some of the financial products targeting teens are predatory by design.",
    readMinutes: 4,
    body: `Some financial products are designed to take advantage of people who don't fully understand the math. Several of these specifically target teens and young adults. Recognizing them ahead of time is one of the highest-leverage things you can do.

**Buy-now-pay-later (Klarna, Afterpay, Affirm, Sezzle, etc.).**

What it looks like: "Split this $80 purchase into 4 payments of $20."
What it actually does: makes you more likely to buy things you wouldn't have bought, by shrinking the felt cost of each purchase. People with BNPL accounts spend significantly more than people without, according to research from the apps themselves.

Risks:
- Multiple simultaneous BNPL accounts add up to real debt fast.
- Missed payments can hit credit scores and add fees.
- The "interest-free" framing is misleading — late fees and missed-payment penalties are real.
- It trains habituation to impulse purchases.

The honest version: BNPL is essentially a credit-without-the-credit-check, designed to lower the cost of saying yes. The fact that BNPL apps are valued in the billions tells you who's making money.

**Sports betting / sportsbooks.**

Newly aggressive in marketing to young adults since US legalization in 2018. DraftKings, FanDuel, BetMGM, Caesars Sportsbook.

What it actually is: gambling. The math is designed so the house wins over time. Individual wins are real but bounded by structural losses.

Risks specifically for teens / young adults:
- Adolescent and young-adult brains are especially vulnerable to gambling addiction. The dopamine response is stronger; the impulse control is weaker.
- Apps deliberately exploit this. The push notifications, the small-bet structure, the integration with sports you already watch — all designed to maximize engagement.
- Problem gambling rates in young adults have spiked since legalization. This is documented.

If sports betting is something you do: at minimum, treat it as entertainment with a budget (the way you'd budget for a concert ticket), not as an investment. Bet amounts that don't sting if lost. Notice if frequency or amount is creeping. If you can't reduce or stop when you decide to, that's the line. National Council on Problem Gambling: 1-800-GAMBLER (1-800-426-2537).

**Crypto pumps and meme-coin schemes.**

Real cryptocurrency exists and has legitimate use cases. The hyped meme coins and "guaranteed" returns marketed to teens on social media are almost entirely scams.

The pattern:
- Influencer promotes a coin to followers.
- Followers buy in, driving price up.
- Influencer sells their large position at the top.
- Coin crashes; followers are left with the loss.

This is called a "pump and dump" and is illegal in conventional securities. It is rampant in crypto because of weaker enforcement.

The rule: if you'd genuinely want to invest in crypto, do it with a small percentage of long-term savings, in well-established cryptocurrencies (BTC, ETH), through reputable platforms (Coinbase, Fidelity Crypto), and assume the position could lose 50%+ in a year. Don't follow "crypto influencer" picks.

**Multi-level marketing (MLMs).**

Brands that target teens and young adults: LuLaRoe, Beachbody, Plexus, Younique, doTERRA, Mary Kay, Amway. The pitch is "be your own boss." The reality is most participants lose money or earn far below minimum wage.

The structure:
- You buy product to sell.
- Most of your "income" actually comes from recruiting other people to also buy product.
- Recruitment-based income is the structural feature of a pyramid scheme.

Research consistently shows: 99% of MLM participants lose money. The top 1% earn from recruitment, not product sales.

If approached: do not buy in. The friend who recruited you is also losing money; you can love them and still say no to the business.

**Payday loans / paycheck advances (Earnin, Dave, Brigit, FloatMe).**

These look like helpful apps that "advance" you part of your paycheck before payday. The actual structure:
- You take a small advance ($100, $200).
- They charge a "tip" or "membership fee" that effectively works out to annualized interest rates of 100-400%+.
- Repaying eats into the next paycheck, so you advance again. Now you're in a cycle.

The Consumer Financial Protection Bureau (CFPB) calls these structurally similar to payday loans. Teens with their first jobs are an explicit target market.

If you need money before payday: a parent loan (with clear repayment plan), a 0% APR credit card (used carefully), or even a small personal loan from a credit union (low rates) are all dramatically better.

**"Investment" pitches that promise guaranteed returns.**

Anyone promising guaranteed returns, especially through DMs / TikTok / forum posts: scam. Real investment doesn't work that way. SEC and FINRA have zero tolerance for guaranteed-return claims for a reason.

Common patterns:
- "$500 turns into $5000 in a week with this trading bot."
- "Forex / options trading signals subscription."
- "AI-driven crypto trading."
- "Real estate seminars" that ask for thousands up front.

Rule: any pitch where the recruiter benefits from you signing up is a pitch, not advice.

**Free trials that become recurring charges.**

Common pattern: sign up for "$0 free trial," charge starts after 14/30 days, hard to cancel. Subscription services do this routinely.

Defense:
- Use a debit card or prepaid card for free trials, not your main credit card.
- Set a calendar reminder to cancel before the trial ends.
- If it's hard to find the cancel button: that's by design. Persist.

The general rule:

**If something is free, you're often the product.** Especially in tech and finance. The platform / app / service is monetizing something — your attention, your data, your eventual paid subscription, or a transaction.

This isn't paranoia; it's how the industry works. Knowing it doesn't mean refusing all free services — it means making the trade consciously. The free social media app gets your attention; the "free trial" gets your card on file; the "free" investment app makes money on your trades.

Resources:

- **Consumer Financial Protection Bureau (CFPB):** consumerfinance.gov. Files complaints against predatory lenders, BNPL, payday loans.
- **FTC scam reporting:** reportfraud.ftc.gov.
- **National Council on Problem Gambling:** 1-800-GAMBLER.
- **FINRA BrokerCheck:** brokercheck.finra.org. Check if any "advisor" is actually licensed.`,
    takeaways: [
      "BNPL, sports betting, crypto pumps, MLMs, payday-advance apps — all designed to extract from young adults.",
      "Anyone promising guaranteed returns is running a scam. SEC enforcement exists for this reason.",
      "99% of MLM participants lose money. Top 1% earn from recruitment.",
      "Defense: read terms, cancel free trials on calendar, file complaints (CFPB / FTC), call 1-800-GAMBLER if betting is creeping."
    ]
  },
  {
    id: "money-and-friendships",
    category: "spending_and_saving",
    title: "Money and friendships: the awkward parts",
    summary: "Different financial situations in a friend group are normal and uncomfortable. Knowing how to navigate it without resentment or shame is a real skill.",
    readMinutes: 3,
    body: `Most friend groups eventually have a money awkwardness. Different families have different incomes. Different teens have different access. The friend whose family pays for everything has different default plans than the friend who's saving every dollar for college. The friend who got a credit card for graduation does things differently than the friend whose parents won't let them have one.

This shows up in specific situations:

**Plans you can't afford.**

The trip, the restaurant, the concert, the road trip, the spring break — and you can't swing it.

Options that work:
- **Honest "I can't afford that this time." Without explanation, without apology.** Most teens accept this without making it weird. The ones who push back are showing you something about themselves.
- **Suggest a cheaper alternative.** "What if we did [thing] instead?" Friend groups often default to expensive options because no one suggests cheaper ones.
- **Skip without resentment.** Sometimes the right answer is "not this one." Friendships survive missing one trip.
- **Don't go and stew about it.** That's worse than skipping.

Don't:
- Go and get in debt to keep up.
- Lie about why you can't go.
- Resent your friends for being able to afford things.

**Splitting bills.**

Three friends order. Two get $15 meals; one gets a $25 meal. The check comes; "should we just split it?"

The fair approach: split the check by what each person ordered, not equally. Splitting equally subsidizes the person who ordered more, which is fine occasionally but builds resentment if it's always the same person.

The "just split it" friend who always orders more knows what they're doing, usually. You can name it ("Hey, can we just pay for what we got tonight?") without making it ugly. Most people get it once it's said.

**Friends with very different access.**

Some friends have parents who pay for everything. Some friends have to work to have anything. This is real and the friendship can survive if both people are aware of it.

The thing to watch for:
- **The wealthier friend who keeps proposing expensive things and is hurt when you can't always do them.** Sometimes they don't know; once they know, they should adjust.
- **The wealthier friend who consistently picks up the tab "no worries."** Generous; also imbalanced over time. Both friends should think about this.
- **Resentment building on either side.** Both directions. The "you don't get it because you have money" resentment is real. The "you make me feel bad for what my family can afford" resentment is also real.

The honest version: friendships across income lines work, but they require both people to be aware. Not to constantly discuss it, but to know it's there.

**Lending money to friends.**

A friend asks for $40. You have it. Should you?

The rule that works for most adult friendships: "If you can give it and not need it back, give it. If you can't give it without needing it back, don't lend it."

Why: lent money creates a debt relationship that often poisons the friendship. The friend who borrows can avoid you out of shame; the friend who lent gets resentful that it's not paid back. The clean version is a gift (if you can) or a no (if you can't).

If you do lend, name a specific repayment timeline up front: "Pay me back by [date]." Vague "whenever you can" is what causes problems.

**Group costs and the silent count.**

A trip is being planned. Costs are discussed casually. You realize this trip is $400 for you, $400 for everyone else, but $400 is a different fraction of your discretionary money than theirs.

You're allowed to be honest: "This is a stretch for me. I'm trying to figure out if I can swing it." That sentence is hard to say but usually changes the conversation. Most groups adjust. The ones that don't are giving you information.

**Gifts and giving.**

The friend group does birthday gifts and the math is unspoken; the typical gift is $40. You don't have $40 to spend on every friend's birthday.

A few moves:
- **A homemade gift counts.** Cookies, a hand-written letter, a playlist, a drawing. These are sometimes more meaningful than the $40 thing.
- **Pool gifts.** Three people split one gift; everyone's contribution is smaller; the gift is bigger.
- **Time as a gift.** Going to the friend's thing, showing up, being present.

Don't:
- Stretch to match group spending on gifts you can't afford.
- Avoid friends' birthdays out of shame.

**The honest version:**

Money differences in friend groups are normal. The friendships that survive them are the ones where both sides can be honest about it without it becoming a fight. The friendships that don't survive are usually the ones where neither side could be honest, and the imbalance built into resentment over time.

You don't owe anyone an explanation for what you can or can't afford. You also don't have to perform poverty or wealth. Just be honest about what works for you.`,
    takeaways: [
      "'I can't afford that this time' is a complete sentence. No explanation owed.",
      "Split by what each person ordered, not equally. Equal-split rewards the person who orders more.",
      "Lend money only if you can afford to not get it back. Otherwise: gift if you can, no if you can't.",
      "Friendships across income lines work if both sides can be honest about the imbalance."
    ]
  }
];

export const MONEY_CATEGORY_LABEL: Record<MoneyCategory, string> = {
  first_money_skills: "First money skills",
  job_and_earning: "Job + earning",
  spending_and_saving: "Spending + saving",
  family_stress: "Family stress",
  college_costs: "College costs",
  predatory_patterns: "Predatory patterns"
};
