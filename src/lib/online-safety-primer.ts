/**
 * Online safety + digital citizenship primer. Covers passwords / accounts,
 * phishing + scams, sextortion (high-priority rising teen threat), public-
 * vs-private posting, AI deepfake risks, and consent + messaging.
 *
 * Voice rules (strict):
 *   - Sextortion content is matter-of-fact: it's common, it's not the
 *     victim's fault, and the response is clear. No shame framing, ever.
 *   - Explicit-image distribution involving minors is a federal crime in
 *     the US. The product never moralizes the victim; it points to
 *     reporting channels.
 *   - NCMEC CyberTipline (1-800-843-5678), Take It Down (NCMEC tool), and
 *     IC3 / FBI are named as the real reporting paths.
 *   - Specific URLs: cybertipline.org, takeitdown.ncmec.org, stopncii.org
 *     (adults), ic3.gov.
 *   - No "just don't send pictures" as the only advice — that's both
 *     unrealistic and victim-blaming. Harm reduction is the stance.
 *   - AI deepfake / nudify content is named honestly; victim resources
 *     exist for AI-generated imagery too.
 *   - Privacy / data hygiene named but not in fear-based terms.
 */

export type OnlineSafetyCategory =
  | "passwords_and_accounts"
  | "phishing_and_scams"
  | "sextortion"
  | "public_vs_private"
  | "ai_and_deepfakes"
  | "consent_and_messaging";

export type OnlineSafetyArticle = {
  id: string;
  category: OnlineSafetyCategory;
  title: string;
  summary: string;
  body: string;
  takeaways: ReadonlyArray<string>;
  readMinutes: number;
};

/** National Center for Missing & Exploited Children CyberTipline.
 *  Handles all CSAM reports + child enticement + sextortion. */
export const NCMEC_CYBERTIPLINE = "1-800-843-5678 (CyberTipline)";

/** NCMEC's free service to remove or prevent the spread of online nude /
 *  partially-nude / sexually explicit images of people under 18. */
export const TAKE_IT_DOWN_URL = "takeitdown.ncmec.org";

/** Adult-age (18+) equivalent of Take It Down, run by the UK Revenge Porn
 *  Helpline; covers global platforms. */
export const STOPNCII_URL = "stopncii.org";

/** FBI Internet Crime Complaint Center. */
export const IC3_URL = "ic3.gov";

export const ONLINE_SAFETY_ARTICLES: ReadonlyArray<OnlineSafetyArticle> = [
  {
    id: "passwords-and-account-basics",
    category: "passwords_and_accounts",
    title: "Passwords, MFA, and the boring infrastructure that prevents disasters",
    summary: "Most teen account takeovers come from passwords that were reused or guessable. A few habits prevent most of it.",
    readMinutes: 3,
    body: `Most account compromises in teen life — Instagram getting hacked, Discord account stolen, Roblox / Snap / TikTok getting taken over — come from preventable password and account hygiene issues. The fixes are boring and they work.

**The single highest-impact change: a password manager.**

A password manager (Bitwarden — free, open-source, recommended; 1Password; Apple Passwords; Google Password Manager) generates and stores unique random passwords for every account, behind one master password you actually remember. The math:

- You use a 16-character random password for every site.
- You only have to remember ONE password (the master one for the manager).
- If one site gets breached, no other accounts are affected.
- You don't have to type passwords manually — the manager autofills.

This eliminates the most common compromise pattern: same password reused across sites, one site gets breached, hackers try that password on every other site you use.

**Multi-factor authentication (MFA / 2FA / "two-step verification").**

For every important account (email, social media, banking, school portals), turn this on. The pattern: even if someone steals your password, they also need a code from your phone to log in. Most account takeovers are stopped cold by MFA.

The flavors:
- **Authenticator apps (Google Authenticator, Authy, Microsoft Authenticator):** best. Codes change every 30 seconds. Hardest to bypass.
- **SMS codes (text message):** acceptable, but vulnerable to "SIM swap" attacks (a hacker tricks your phone carrier into giving them your number). Better than nothing; worse than an authenticator app.
- **Email codes:** weakest. Only useful if your email itself is secured.

Priority order for turning on MFA:
1. Email (controls password resets for everything else).
2. Social media (Instagram, TikTok, Snapchat, Discord).
3. Bank / payment apps.
4. Gaming accounts (Roblox, Xbox, PSN, Steam — yes, these get attacked).
5. School / college accounts.

**What to do if an account is already compromised:**

1. **Change the password immediately** (from a different device if possible).
2. **Turn on MFA** if it wasn't on.
3. **Check connected apps / sessions / devices** in the account settings. Remove anything unfamiliar.
4. **Check email forwarding rules** (this is how hackers maintain access after you change passwords).
5. **For social: post a message** ("I was hacked, ignore weird DMs") so friends aren't scammed via your account.
6. **For financial accounts:** call the bank's fraud line.

**What teens should be careful about:**

- **Don't share passwords with friends, even close ones.** Friendships change; access shouldn't follow.
- **Don't give login info to "boost" services, "free" Robux / V-Bucks / Nitro generators.** These are scams that steal accounts. Period.
- **Don't click "your account will be deleted, click here to verify"** emails / DMs. These are phishing.
- **Don't log in on someone else's device** unless you can fully sign out (and ideally MFA-disconnect) before leaving.

**Account recovery:**

Most platforms have an account recovery process. The success rate is much higher if you've set up:
- Recovery email
- Recovery phone number
- Backup codes (for MFA — saved somewhere safe, NOT on the same phone)
- Trusted contacts (some platforms have this)

Set these up before you need them. After your account is gone is too late.

**For parents reading over a teen's shoulder:**

You can be helpful here by NOT demanding your teen's passwords. The hygiene above works without parent access, and parent demands for passwords often push teens to secondary accounts that are worse-secured. If you want oversight, talk to them about it; don't try to surveil.`,
    takeaways: [
      "Password manager + unique passwords per site eliminates most compromise. Bitwarden is free and good.",
      "MFA on email first, then social, then financial, then gaming. Authenticator apps > SMS > email codes.",
      "Don't share passwords with friends. Don't use 'boost' / 'generator' services — they're scams.",
      "Set up recovery email/phone/backup-codes BEFORE you need them."
    ]
  },
  {
    id: "phishing-and-scams",
    category: "phishing_and_scams",
    title: "How scams are targeting teens specifically",
    summary: "Scams aimed at teens are different from scams aimed at retirees. Recognizing the patterns prevents most of them.",
    readMinutes: 4,
    body: `Scams have adapted to where teens are: DMs, gaming platforms, school emails, social media. Recognizing the specific patterns prevents most damage.

**The patterns that target teens:**

**1. Free in-game currency / cosmetics / boosts.**
- "Free Robux at this link!"
- "V-Bucks generator — no human verification needed."
- "Free Nitro for everyone — click here."
- "Counter-Strike skin giveaway — log in to claim."

These are 100% scams. There is no legitimate free Robux/V-Bucks/Nitro that requires login. The "verification" steps either install malware, steal account credentials, or sign you up for subscription scams.

**2. "Your account will be deleted / suspended / compromised" messages.**

Sent via email, DM, sometimes SMS. Designed to create urgency so you click without thinking. Often spoof real platforms (Instagram, TikTok, school emails).

Tell:
- Real platforms rarely send urgent "click now or be deleted" messages.
- Hover over the link before clicking — if the URL looks weird (instagrm.com, snapchat-login.support, etc.), it's a phishing site.
- Real platforms have you log in via the app, not via emailed links.

**3. Job scams.**

Especially around "easy money" online jobs aimed at teens needing pocket money:
- "Get paid $300/day to test apps."
- "Personal assistant — pay $5,000/month, work from home."
- "Mystery shopper — get paid to deposit checks."

Patterns to watch for:
- Pays before you've done anything ("Here's a check, deposit it and use the funds for…").
- Recruits you via DM or random message rather than through an actual application.
- Asks for personal info (SSN, bank account) before you've signed anything official.
- Pays in cryptocurrency or wire transfer.
- Vague job description but specific high pay.

If a job seems too good to be true, it is.

**4. Romance scams via Discord / Snap / IG / gaming platforms.**

"Met someone amazing" who is conveniently located far away, very interested, can't video chat, and eventually asks for money / gift cards / nudes / favor for a friend.

Patterns:
- Won't video chat or constantly has excuses for not being able to.
- Profile pic seems too professional / model-like for the situation.
- Falls hard fast.
- Eventually has a financial emergency.
- Or eventually escalates to wanting nudes (see sextortion article).

Reverse image search on profile pics catches a lot of these (Google Lens, TinEye). The same profile pic is often used in dozens of scam accounts.

**5. Crypto / "trading platform" scams.**

DMs offering "guaranteed returns," "trading mentors," "$100 in $5,000 out" pitches. All scams.

**6. Tech support scams.**

A popup says your computer is infected; "call this number" or "click here to fix." Never legitimate. Real antivirus software doesn't pop up demanding you call a phone number.

**The rule that catches most of it:**

**Urgency + a link or a phone number + a request for action = scam.**

Real institutions don't pressure you to click something right now. They have processes that work through their own apps or websites. If a message creates urgency to act outside the normal channels, slow down. Ask an adult. Search the situation. Almost every scam falls apart with 5 minutes of skepticism.

**If you've already been scammed:**

1. **Stop engaging.** Block the account/person.
2. **If money is involved:** contact the bank/payment platform immediately. Some transactions can be reversed.
3. **Report to the FBI's IC3:** ${IC3_URL}. Even if you don't recover money, reports help track and shut down operations.
4. **Report to the platform** (Discord, Instagram, etc.).
5. **Tell an adult.** This is hard because shame, but adults have more tools to help recover.
6. **Change passwords** for any compromised accounts.
7. **Don't try to "outsmart them back."** Don't engage further. Don't try to recover what you lost by sending more.

The shame of being scammed is real. It's also nothing to be ashamed of — these scams are sophisticated, run by professionals, and successful against millions of people. The shame just keeps you from getting help. Tell someone. Move forward.`,
    takeaways: [
      "Free Robux/V-Bucks/Nitro requiring login = always a scam. There's no legitimate free version.",
      "Urgency + click-this-link or call-this-number + act-now = scam. Slow down, verify in another channel.",
      "Won't-video-chat romance + asks for money/nudes = scam. Reverse image search the profile pic.",
      "Got scammed? Stop, report to IC3.gov, tell an adult. Shame keeps you from help that exists."
    ]
  },
  {
    id: "sextortion-reality",
    category: "sextortion",
    title: "Sextortion: what it is, what's not your fault, what to do",
    summary: "Sextortion is the fastest-growing online threat to teens, especially boys. The pattern is consistent. The response that works is clear.",
    readMinutes: 5,
    body: `Sextortion is when someone threatens to share sexual images of you unless you do something — usually pay money, sometimes send more images. It's been the fastest-growing online threat to teens in the US for several years running, with thousands of reports to NCMEC per month.

This article is matter-of-fact because the shame around this is the main thing keeping teens from getting help. The pattern is the same across thousands of cases. **It's not your fault. There is a clear response.**

**The pattern that targets boys (the majority of cases):**

1. A "girl" messages you on Instagram, Snapchat, or another platform. Often via a fake account that seems to know mutual friends or has photos that look real.
2. The conversation moves to a more private channel (DM, Snapchat, Telegram, Discord).
3. The conversation moves quickly to flirty / sexual content.
4. They send a "nude" of "themselves" (it's not them — these are stolen images).
5. They ask you to send one back. You do, or you do something on camera.
6. Within minutes, the tone changes. They reveal they've recorded everything, have screenshots, and may even have a list of your contacts (gleaned from your public follower list or other sources).
7. The threat: pay money (often via gift cards or crypto) or the images go to your school, your family, your friends, your sports team.

**The pattern that targets girls:**

Often similar, but the demand is more frequently more images or videos (not money). Sometimes connected to grooming / trafficking attempts. Sometimes connected to known peers or ex-partners ("revenge porn" pattern).

**Variants involving AI:**

A growing pattern is where someone creates AI-generated explicit images of you using your real face from social media photos. They threaten to share these. The images aren't real. The threat is.

**Why this article exists:**

Cases of teen suicide tied directly to sextortion have been increasing every year. The mechanism is consistent: a teen sends an image, gets caught in the trap, can't see a way out, doesn't tell an adult because of shame. Within hours of the initial trap, some teens make catastrophic decisions.

The single thing that breaks this pattern: telling someone, immediately.

**What to do if you're being sextorted:**

**1. Stop engaging. Don't pay. Don't send more.**

Paying doesn't stop the threat. They escalate. Sending more images makes it worse. The interaction needs to end immediately, mid-thread if necessary.

**2. Don't delete the messages yet.**

Screenshot everything. The account, the messages, the demands, any payment info. Save these. They're evidence. After you've documented everything, then you can block.

**3. Tell an adult. Now.**

Parent. School counselor. Teacher. Coach. Aunt or uncle. The adult you can predict will respond with help, not punishment. The adult does not have to be your parents if that's not the right starting point.

**4. Report to NCMEC's CyberTipline: ${NCMEC_CYBERTIPLINE}** or report online at cybertipline.org.

NCMEC handles teen sextortion every day. They work with platforms to remove images. They coordinate with law enforcement when needed. They will NOT get you in trouble for having sent images. The producers/distributors of CSAM are the criminals; teen victims are victims.

**5. Use Take It Down: ${TAKE_IT_DOWN_URL}**

This is NCMEC's free service that prevents nude/explicit images of anyone under 18 from spreading on major platforms (Facebook, Instagram, OnlyFans, Pornhub, TikTok, Snapchat, Reddit, others). It works on your existing images AND on potential future versions. You don't have to give up the image itself — you create a hash (a digital fingerprint) on your own device, and the platforms block matching content.

For 18+ adults: stopncii.org runs the same kind of service.

**6. Block the account and report it to the platform.**

After documenting and reporting to NCMEC, block the account and report it to Instagram / Discord / wherever it happened.

**7. Don't blame yourself, don't isolate.**

The sextortion playbook depends on you being too ashamed to tell anyone. The moment you tell one trusted person, the threat's power drops dramatically. The shame is the weapon; talking is the response.

**Common misconceptions:**

- **"They'll send it if I don't pay."** They often send it whether you pay or not. Paying just identifies you as someone who'll pay. The amount usually escalates.
- **"I'll get in trouble for having sent an image."** Federal and state laws are increasingly clear: teen victims of sextortion are not prosecuted. The producers and distributors are.
- **"It's my fault for sending it."** The trap was engineered by professionals. You're one of thousands of teens it works on every month. You didn't fail; you were targeted.
- **"My parents will kill me."** Parents who learn about sextortion overwhelmingly respond with worry, not punishment, once they understand it. Most parents who've been through this with their kid say the same thing afterward: "I just want them to be safe; I wish they'd told me sooner."

**If a friend is in this situation:**

- Tell them the resources exist (NCMEC, Take It Down).
- Tell them they're not in trouble.
- Help them tell an adult.
- If they say they're having thoughts of not being here — call 988 or 911 immediately. Sextortion-related suicide is a real risk; this is not the time to be quiet.

**Crisis:**

Sextortion + thoughts of not being here = call 988 or 911 right now. This is a real medical emergency. The shame is loud and dangerous; the response is help, immediately. The Crisis page link is at the bottom of every Kai screen.`,
    takeaways: [
      "Sextortion is the fastest-growing online threat to teens. The pattern is engineered; victims aren't at fault.",
      "Stop engaging, don't pay, screenshot everything, tell an adult, report to NCMEC (1-800-843-5678 / cybertipline.org).",
      "Take It Down (takeitdown.ncmec.org) removes/prevents spread of explicit images of minors on major platforms.",
      "Sextortion + dark thoughts = call 988 or 911 immediately. Shame is the weapon; talking is the response."
    ]
  },
  {
    id: "public-vs-private-archive",
    category: "public_vs_private",
    title: "What stays, what spreads, what gets archived",
    summary: "The internet's memory is much better than people think. A working frame for what to put where.",
    readMinutes: 3,
    body: `One of the trickier things about being a teen on modern internet is that everything is recorded. Not necessarily by the platforms (though sometimes), but by other people — screenshots, screen recordings, archive sites, search engines, the Wayback Machine. The instinctive feeling that "this disappears" rarely matches reality.

**A working frame for what to put where:**

**Public — assume it's permanent.**
- TikTok, Instagram, Twitter/X, YouTube, BlueSky, public Reddit, public Discord servers, blog posts, anything labeled "public."
- Even after deletion, content can be screenshotted, archived, or saved by anyone who saw it.
- The Wayback Machine archives a lot of public web. Tweets you deleted years ago are sometimes still findable.

**Semi-public (followers / friends only, group chats) — assume it can leave.**
- Private Instagram, Snapchat stories (within friends), close-friends-list, Discord servers with members you mostly know.
- Anyone can screenshot. Trust is friendship; trust isn't perfect security.

**Private DMs — assume the recipient can save.**
- iMessage, Discord DMs, IG DMs, Snapchat messages.
- Snapchat's "disappearing" feature does NOT prevent screenshots. (You get a notification when someone screenshots, but you can't take it back.)
- "Off the record" and "ephemeral" features make it slightly harder but don't make content unrecoverable.

**Encrypted private messages (Signal) — assume the recipient can still save.**
- Signal protects against the platform reading your messages.
- It doesn't protect against the person on the other end screenshotting or showing the screen to someone else.
- Signal's "disappearing messages" feature is real (the message deletes on both ends after a set time) but doesn't prevent screenshots.

**The rule:**

If you'd be horrified if a specific piece of content reached a wider audience — your school, your parents, a future employer, a future partner, a journalist — don't put it anywhere digital. Including in "private" channels. Including with people you trust.

The hard version: every message you send digitally has a non-zero chance of becoming public. Most don't. Some do. The math is real; risk awareness shifts what you send.

**Search engines and your name:**

- Anything posted publicly with your real name (school newspaper articles, sports recaps, social posts under your real name) often becomes Google-searchable.
- For better or worse, when someone searches your name (a coach, a college admissions officer, a future date), what comes up is what they see.
- It's worth Googling yourself sometimes. Some teens are surprised at what comes up.

**Archive sites specifically:**

- The Wayback Machine (web.archive.org) snapshots the public web.
- Some sites get crawled frequently, some rarely.
- Tweets from 10 years ago are sometimes still findable.
- "I deleted it" doesn't mean "it doesn't exist."

**The "future you" question:**

Things you post at 14 are often searchable at 24. The internet doesn't fade the way memory does. Be the kind of poster your future self can defend, or post under separate identities for things you want to experiment with.

**The pseudonymous internet:**

Many teens have a "real name" public account (LinkedIn, real social media) and a separate "private / fun / experimental" account under a pseudonym. This is reasonable and common.

Caveats:
- Pseudonymous accounts can still be linked to your real identity through email, phone number, IP address, posting patterns, mutual followers, login times.
- True anonymity online is hard.
- If you do something illegal on a pseudonymous account, law enforcement can usually subpoena the platform to reveal who you are.

But for "I want to post weird memes / vent / be honest about being a teen / experiment with identity without it being in Google forever" — pseudonyms work for that purpose.

**Cleaning up:**

If there's specific content about you you want gone:
- Old social media accounts you don't use: deactivate or delete them.
- Old photos posted by you on accounts you control: delete them.
- Old photos posted by others: ask them to take it down. Most friends comply.
- Photos / content under copyright (yours): you can file copyright takedown requests with platforms. They're usually honored.
- Embarrassing content that's been screenshotted: harder. May require talking to a parent, a school, or a lawyer if it's a serious problem.

**For sensitive personal content** (nude / sexual images, doxxing material, harassment): Take It Down (under-18), StopNCII (18+), or a digital rights organization can help.`,
    takeaways: [
      "Public = permanent. Private = can leak. Encrypted = recipient can still screenshot.",
      "If you'd be horrified for X to reach a wider audience, don't send X digitally. Anywhere.",
      "Google your name sometimes. Your public footprint is what coaches, colleges, dates see.",
      "Pseudonymous accounts are reasonable for experimentation but aren't true anonymity. Email/phone link them back."
    ]
  },
  {
    id: "ai-deepfakes-and-nudify",
    category: "ai_and_deepfakes",
    title: "AI-generated images of you: the new threat",
    summary: "AI can now create realistic explicit images of anyone from public photos. The targets are usually teen girls. The legal and emotional landscape is changing fast.",
    readMinutes: 4,
    body: `Generative AI has made it possible to create realistic-looking explicit images of real people without their consent. The most common targets are teen girls (and increasingly boys), and the most common perpetrators are male peers — classmates, ex-partners, gaming acquaintances.

This is a new threat that didn't exist 5 years ago, and the law / platform response is still catching up. The harm to victims is severe and disproportionately falls on teens.

**The technical reality (in plain language):**

- "Nudify" apps and websites can take a clothed photo of someone and generate a nude version. Quality varies but has improved rapidly.
- "Deepfake" tools can swap a person's face onto explicit existing video.
- The images can be convincing enough to be mistaken for real photos.
- Many of these tools target teens specifically and have been investigated / banned in some jurisdictions.

**What this looks like in real teen life:**

- A school where boys made AI-generated explicit images of female classmates and circulated them in group chats.
- An ex-partner creating deepfake explicit content as revenge after a breakup.
- A bully making humiliating fake content of a target.
- A scammer using AI-generated images of a fake "girlfriend" in sextortion attempts.

These cases have been documented in schools across the US (and globally) at increasing rates.

**If this happens to you:**

You are a victim of a serious crime in most US states. The federal government and many states have specific laws against non-consensual intimate imagery, including AI-generated. The Take It Down Act (federal, signed 2025) explicitly covers AI-generated explicit imagery of minors.

**1. Document everything.**

Screenshots of the images, the messages distributing them, who you know has seen them, when you found out. Don't delete the evidence even though every part of you wants to.

**2. Tell an adult immediately.**

Parent, school administrator, school counselor. This is not a "deal with it yourself" situation. The legal and social response requires adults.

**3. Report to NCMEC's CyberTipline: ${NCMEC_CYBERTIPLINE} / cybertipline.org.**

Even though the images aren't "real," NCMEC handles AI-generated CSAM of minors. They coordinate with platforms and law enforcement.

**4. Use Take It Down (${TAKE_IT_DOWN_URL}).**

This works for AI-generated images of minors too, on major platforms. The platforms have committed to honoring hash-matching for these images.

**5. File a police report.**

Many states have specific statutes against non-consensual intimate imagery, including AI-generated. The school has obligations too if it happened in a school context. A parent or trusted adult can help navigate this.

**6. File with IC3 (${IC3_URL}).**

The FBI's Internet Crime Complaint Center handles federal cybercrime reports.

**7. Get support.**

This is traumatic, and the trauma isn't "fake" just because the images were AI-generated. The shame, the violation, the panic about who has seen them — these are real and deserve real support. A counselor with experience in technology-facilitated abuse can be invaluable.

**For schools and friends:**

If this happens at your school and you weren't the target but you know:
- **Don't share the images.** Sharing them, even to show how bad it is, is illegal in many jurisdictions and re-victimizes the person.
- **Report it.** Tell a school administrator, counselor, or trusted adult.
- **Support the victim.** Don't ask them about it constantly; don't engage in gossip; treat them normally.
- **Stand up to the perpetrator if safe.** Peer disapproval is one of the most effective deterrents.

**Prevention:**

There's no way to fully prevent this — your face on social media is enough source material for AI to work with. Some lower-risk practices:

- **Set social to private if you're a teen.** Reduces who can scrape your photos.
- **Consider limiting photos that show your face clearly** in public posts.
- **Reverse image search yourself occasionally** (Google Lens) to see if your photos are being used elsewhere.
- **Don't share your face on platforms with high abuse rates** (some Discord servers, forums, gaming with strangers).

**For boys reading this:**

If anyone in your friend group brings up making or sharing AI-generated explicit content of someone, even "as a joke":
- It's illegal in most places.
- It's deeply harmful to the target. Teen girls who've been victims of this report severe and lasting trauma.
- Schools and law enforcement are increasingly investigating and prosecuting these cases.
- Being part of the group chat where it's distributed can be enough for charges.
- It's the kind of thing that follows you into adulthood (criminal record, college admissions, job background checks, future relationships).

The friend who suggests it is showing you something about themselves. The right response is to say no, leave the chat, and tell someone if it's already happened.`,
    takeaways: [
      "AI-generated explicit images of real people (especially teen girls) is a fast-growing threat. Victims are victims.",
      "Take It Down (NCMEC) covers AI-generated content of minors. cybertipline.org and ic3.gov are real reporting paths.",
      "Don't share AI-generated explicit content of anyone, even 'as a joke'. It's illegal in most places and deeply harmful.",
      "Trauma from AI-generated abuse is real even though the images are 'fake'. A counselor with tech-abuse experience can help."
    ]
  },
  {
    id: "consent-and-messaging",
    category: "consent_and_messaging",
    title: "Consent in messaging: pictures, screenshots, and what to do after",
    summary: "The 'pictures' conversation is happening among teens whether adults are honest about it or not. Here's the harm-reduction version.",
    readMinutes: 4,
    body: `Most teen safety content about explicit messaging is either fear-based ("just don't do it!") or absent (assumes it doesn't happen). Neither works. Teens send images, sometimes do so with people they trust, sometimes regret it, and sometimes get hurt. This article is the harm-reduction version.

**Some things that are true:**

- A significant percentage of teens send some form of intimate image at some point in adolescence. Estimates vary; it's not rare.
- The "don't send pictures" rule fails because adults already know it's getting ignored — and the framing tells teens they can't ask for help if they need it.
- Most pictures stay between the people they were sent to. Some don't.
- The "didn't" pictures get found, leaked, screenshotted, redistributed are the ones that hurt teens.

**If you're considering sending an intimate image (yourself):**

The harm-reduction questions, in order:

1. **Do they have your consent?** Did they ask? Are you doing this because you want to, or because you feel pressured? "If you loved me, you would" is pressure, not consent. Anyone willing to use pressure has shown you what kind of person they are.

2. **How well do you know them?** "Someone you've been chatting with for two weeks" is different from "your partner of a year." The leak risk is different. Long-term relationships fall apart too, but the math is different.

3. **What's identifying in the image?** Face. Tattoos. Birthmarks. Background (your room, your car, anything that locates you). Bra/clothing you wear at school. Identifying details make a leaked image dramatically more harmful.

4. **What's the platform?** Snapchat's disappearing feature is real but doesn't prevent screenshots (and you get notified, but you can't undo). iMessage saves to iCloud, which means images sync to other devices on their account. SMS is the worst — fully unencrypted, stored by carriers.

5. **What's your exit if things go wrong?** "I'll trust them forever" is not a plan. "If they ever threaten me with this, I'll tell my mom and call NCMEC" is a plan.

**Important: federal law on minors and explicit content.**

In the US, explicit images of anyone under 18 — even taken by the minor themselves, even consensually shared — fall under federal CSAM laws. This means:
- The image is technically illegal to create or share, even if you're the subject.
- BUT: enforcement is overwhelmingly focused on perpetrators (people pressuring teens, distributing without consent, etc.), not on victims.
- Teen victims of sextortion or leaked images are NOT being prosecuted in practice. Don't let fear of prosecution keep you from getting help.

If you've already sent an image and you're now worried:

- **Take It Down (${TAKE_IT_DOWN_URL})** can hash the image on your device and tell platforms to block matching content. You don't share the image; only the hash leaves your phone.
- **You can ask the recipient to delete it.** Most people, especially in healthy relationships, will.
- **Don't keep the image on your own phone unnecessarily.** Cloud syncing has caused leaks.

**If an image of yours has been shared without consent (a "leak"):**

This is sometimes called "revenge porn" or non-consensual intimate imagery (NCII). It's illegal in most US states.

1. **Document who has it / where it's been shared.**
2. **Tell an adult — parent, school counselor, trusted relative.**
3. **Report to NCMEC: ${NCMEC_CYBERTIPLINE}.** If under 18, they handle it as CSAM (which is in your favor — platforms move faster).
4. **Use Take It Down ${TAKE_IT_DOWN_URL}.** Removes / blocks the image on major platforms.
5. **File a police report.** Many states prosecute NCII. The person who shared without consent is the criminal.
6. **For 18+: StopNCII (${STOPNCII_URL})** is the adult-version service.
7. **Get support.** This is traumatic. A counselor who works with technology-facilitated abuse is the right kind of help.

**The hardest version — sextortion overlaps with the above:**

If you sent an image and now someone is threatening to share it unless you pay or send more — see the sextortion article. The response is identical: stop engaging, don't pay, document, tell an adult, NCMEC + Take It Down. NCMEC handles thousands of these per month.

**A note on group dynamics:**

If a friend's image has been leaked / circulated at school:
- **Don't open it.** Each opening adds a view.
- **Don't share it. Don't screenshot it.** Sharing CSAM (which is what it is if the subject is under 18) carries serious legal consequences and re-victimizes the friend.
- **Tell an adult.** A school administrator, a school counselor.
- **Support the friend** without making it the only thing about them.
- **Pushback on people who circulate it.** Most peers stop when they see disapproval from the group.

**If you've ever shared someone else's intimate image without consent — even just to one friend — and you regret it:**

This is one of the moments where adolescent behavior creates real harm and where adolescent brains are bad at predicting the consequences. The right response is:
- Stop. Delete. Tell the friend it won't happen again.
- If others have it because you shared: tell them to delete; ask them to confirm.
- If the person it's of doesn't know it was shared: this is harder, but they have a right to know.
- This is a moment to talk to a counselor — not because you're a "bad person," but because you're at a fork in the road and the path forward matters.

The point is harm reduction, including the harm you may have done to others. People do dumb things at 14, 15, 16 that they wouldn't do at 24. The response that matters is owning it, repairing what you can, and not doing it again.`,
    takeaways: [
      "Most teen safety content about intimate images is fear-based or absent — neither works. Harm reduction is the stance.",
      "Before sending: consent + how well you know them + what's identifying + what platform + what's your exit plan.",
      "Leaked image (NCII) → document, tell an adult, NCMEC/Take It Down, police report, counselor. Victims aren't prosecuted.",
      "If you've shared someone else's image without consent: stop, ask others to delete, talk to a counselor. Repair what you can."
    ]
  },
  {
    id: "data-and-digital-footprint",
    category: "public_vs_private",
    title: "Your data, your footprint, and what platforms actually know",
    summary: "Platforms collect more than most teens realize. Knowing the landscape lets you make conscious choices.",
    readMinutes: 3,
    body: `Most online services are free because you (your attention, your data) are the product. Understanding what platforms collect helps you make conscious choices about what to use, what to lock down, and what to walk away from.

**What major platforms typically know:**

- **What you've posted, liked, watched, scrolled past.** Including how long you lingered on each item.
- **Who you message** and the metadata around messages (frequency, timing, length).
- **Your location** (often more granularly than you'd expect — apps with "location permission" track much of your movement).
- **Your contacts** (if you uploaded them).
- **Your photos** (often even before you post them, if you've granted photo library access).
- **Your physical interests** (deduced from accelerometer / step data on phones).
- **Your purchasing behavior** (especially Instagram / Meta, which tracks across the web).
- **Your face** (for any platform you've used face filters or face login on).

This isn't a conspiracy theory; it's the published data-collection practices of the major platforms.

**What this enables:**

- **Targeted ads** that sometimes feel like the platform is listening. (It's not literally listening to your conversations — it's drawing inferences from data so detailed that the conclusions are uncanny.)
- **Algorithmic feed shaping** to maximize your time-on-app.
- **Resale of data** to third parties in some cases.
- **Compliance with law enforcement requests** when required.

**What this means for teens:**

The platform isn't your friend. It's a system optimizing for engagement and ad revenue. This doesn't mean don't use them; it means use them with awareness.

**Practical hygiene:**

- **Review app permissions quarterly.** Go to phone settings → permissions. Revoke anything an app doesn't need (location for a flashlight app, contacts for a game, microphone for a calculator).
- **Turn off ad tracking.** iPhone: Settings → Privacy → Tracking → Allow Apps to Request to Track (off). Android: Settings → Google → Ads → Delete advertising ID.
- **Limit photo permissions.** Apps that need to post photos don't need access to your entire photo library — most platforms now support "selected photos."
- **Consider what you're posting from a data perspective.** Geotagging your home? Showing your face every day? These accumulate.
- **Use private browsing for sensitive searches.** Not a privacy panacea, but it doesn't write to your history or save cookies between sessions.

**Browser and search:**

- Chrome / Edge / Safari send a lot of data back to their parents (Google, Microsoft, Apple).
- Brave, Firefox, DuckDuckGo browser are more privacy-respecting alternatives.
- DuckDuckGo search doesn't track you or build a profile. Search results are often comparable to Google for most queries.

**On Instagram / TikTok / Snapchat specifically:**

- All of these platforms have settings that limit how much data is used for ads (sometimes hidden several menus deep).
- "Off-Facebook activity" / "Activity off Meta technologies" in Meta settings shows you the third-party sites reporting your visits to Meta. It's eye-opening.
- TikTok: Settings → Privacy → Personalization and Data → "Personalized ads" can be turned off.

**What you can't really hide from:**

- Network-level tracking (your school's network, your home ISP).
- Linkable identifiers (email, phone number) — most "anonymous" services are still tied to these.
- Your face if you've posted photos publicly.

**The frame:**

You don't have to be paranoid. You also don't have to be naive. The platforms are designed to know a lot about you, and most teens default to maximum visibility. Pulling back to "moderate visibility" — private accounts, fewer permissions, less geotagging, ad tracking off — is a reasonable middle path.

**For specifically sensitive things:**

If you're researching something private (medical, legal, identity, sexuality) — use a privacy-respecting browser (Brave) in private mode, search via DuckDuckGo, and don't sign into Google. Your search history shouldn't follow you forever.

**The right time to think about this:**

Before you have something you wish was more private. Setting things up now is much easier than trying to clean up later.`,
    takeaways: [
      "Major platforms know more than most teens realize. Awareness > paranoia.",
      "Review app permissions quarterly. Turn off ad tracking. Limit photo library access.",
      "Brave / Firefox / DuckDuckGo are privacy-respecting alternatives to Chrome / Safari and Google search.",
      "Lock down sensitive research with private browsing + non-Google search. Saves problems later."
    ]
  }
];

export const ONLINE_SAFETY_CATEGORY_LABEL: Record<OnlineSafetyCategory, string> = {
  passwords_and_accounts: "Passwords + accounts",
  phishing_and_scams: "Phishing + scams",
  sextortion: "Sextortion",
  public_vs_private: "Public vs private",
  ai_and_deepfakes: "AI + deepfakes",
  consent_and_messaging: "Consent + messaging"
};
