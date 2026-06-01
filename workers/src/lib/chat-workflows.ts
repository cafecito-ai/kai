export type WorkflowMode = "general" | "body";

export type WorkflowReply = {
  reply: string;
  mode: WorkflowMode;
  source: "preSafety" | "kai-workflow" | "physical-workflow";
  workflow: string;
};

type Workflow = {
  id: string;
  matches: (text: string, raw: string) => boolean;
  reply: string[];
};

export type WorkflowCatalogItem = {
  id: string;
  source: WorkflowReply["source"];
};

export function safePreSafetyFastReply(message: string): WorkflowReply | null {
  if (!isBenignGreeting(message)) return null;
  return {
    reply: greetingReply.join("\n\n"),
    mode: "general",
    source: "preSafety",
    workflow: "casual-greeting",
  };
}

export function matchKaiWorkflow(message: string): WorkflowReply | null {
  const text = message.toLowerCase();
  const workflow = kaiWorkflows.find((item) => item.matches(text, message));
  if (!workflow) return null;
  return {
    reply: workflow.reply.join("\n\n"),
    mode: "general",
    source: "kai-workflow",
    workflow: workflow.id,
  };
}

export function matchPhysicalWorkflow(message: string): WorkflowReply | null {
  const text = message.toLowerCase();
  const workflow = physicalWorkflows.find((item) => item.matches(text, message));
  if (!workflow) return null;
  return {
    reply: workflow.reply.join("\n\n"),
    mode: "body",
    source: "physical-workflow",
    workflow: workflow.id,
  };
}

export function matchContinuationWorkflow(
  message: string,
  recentMessages: Array<{ role: unknown; content: string }>,
): WorkflowReply | null {
  const text = message.toLowerCase().trim();
  const previousAssistant = [...recentMessages]
    .reverse()
    .find((item) => item.role === "assistant" && item.content.trim().length > 0)
    ?.content.toLowerCase() ?? "";

  if (/\b(photos?|pictures?|pics?)\b/.test(text) && previousAssistant.includes("photos")) {
    return kaiContinuation("confidence-photos-followup", [
      "Yeah, photos can mess with your head fast.",
      "Don’t inspect the picture like it’s evidence against you. Pick one thing you can control today: posture, outfit, haircut, lighting, or just not staring at it for ten minutes.",
    ]);
  }

  if (/\b(people|friends|friend|classmates|everyone)\b/.test(text) && previousAssistant.includes("people")) {
    return kaiContinuation("sad-people-followup", [
      "Got it. People stuff can make sadness feel personal.",
      "Was it something someone said, being left out, or just feeling like nobody really sees you today?",
    ]);
  }

  if (/\b(eggs?|bread|toast)\b/.test(text) && previousAssistant.includes("what do you actually have")) {
    return kaiContinuation("lunch-eggs-followup", [
      "Perfect. Make eggs and toast.",
      "If you want it better: scramble the eggs, toast the bread, add fruit or water if you have it. That’s a real lunch.",
    ]);
  }

  if (/\b(shot reps?|shooting|form shots?)\b/.test(text) && previousAssistant.includes("shot reps")) {
    return physicalContinuation("shot-reps-followup", [
      "Good. Keep it boring and repeatable.",
      "Do 25 close form shots, 25 free throws, then 25 game-speed makes from one spot. Don’t chase everything at once.",
    ]);
  }

  return null;
}

export function fastKaiReply(message: string): string | null {
  return matchKaiWorkflow(message)?.reply ?? null;
}

export function fastPhysicalReply(message: string): string | null {
  return matchPhysicalWorkflow(message)?.reply ?? null;
}

export function getWorkflowCatalog(): WorkflowCatalogItem[] {
  return [
    { id: "casual-greeting", source: "preSafety" },
    ...kaiWorkflows.map((workflow) => ({ id: workflow.id, source: "kai-workflow" as const })),
    ...physicalWorkflows.map((workflow) => ({ id: workflow.id, source: "physical-workflow" as const })),
  ];
}

export function isBenignGreeting(message: string): boolean {
  return /^\s*(yo|hey|hi|hello|sup|what'?s up|wassup|wyd)\s*(kai|coach)?[\s?.!]*$/i.test(message);
}

function kaiContinuation(workflow: string, reply: string[]): WorkflowReply {
  return {
    reply: reply.join("\n\n"),
    mode: "general",
    source: "kai-workflow",
    workflow,
  };
}

function physicalContinuation(workflow: string, reply: string[]): WorkflowReply {
  return {
    reply: reply.join("\n\n"),
    mode: "body",
    source: "physical-workflow",
    workflow,
  };
}

const greetingReply = [
  "I’m here.",
  "What’s the vibe today: mind, body, school, sleep, or confidence?",
];

const kaiWorkflows: Workflow[] = [
  {
    id: "casual-greeting-post-safety",
    matches: (_text, raw) => isBenignGreeting(raw),
    reply: greetingReply,
  },
  {
    id: "lonely-open",
    matches: (text) =>
      /\b(lonely|alone|feel alone|so alone|no friends|dont have friends|don't have friends|no one cares|nobody cares)\b/.test(text),
    reply: [
      "Yeah. That feeling is heavier than people make it sound.",
      "Lonely is not just “I need someone to text me.” A lot of the time it’s more like: I’m around people, but I don’t feel chosen. I don’t feel seen. I don’t know who I can be fully honest with.",
      "First thing: don’t turn this into a verdict on you. Loneliness is a signal, not a sentence. It means your connection system is asking for something real.",
      "For tonight, we make it small: pick one person who feels even 5% safe and send something low-pressure like “yo how’s your day been?” or “wanna do something this week?” Not a huge confession. Just a door cracked open.",
      "And tell me the real version: are you lonely because you don’t have people, because your people don’t really get you, or because you got left out recently?",
    ],
  },
  {
    id: "sad-vague",
    matches: (text) => /\b(sad|depressed|delressed|empty|numb|down bad|rough day)\b/.test(text),
    reply: [
      "Damn. I’m here with you.",
      "Sad can be annoying because sometimes there’s a clear reason, and sometimes it just lands on you and makes everything feel heavier.",
      "Don’t judge the feeling yet. Do a quick scan: did something happen with people, are you under pressure, did you sleep badly, or has your phone been feeding you too much comparison today?",
      "For the next ten minutes, make the day less sharp: drink water, sit somewhere with light, put the phone face down, and name the feeling in one honest sentence.",
      "What made it hit today: people, pressure, sleep, or just one of those waves?",
    ],
  },
  {
    id: "off-day",
    matches: (text) =>
      /\b(feels off|feel off|off today|weird today|not myself|out of it)\b/.test(text),
    reply: [
      "Yeah, some days just feel off before you even know why.",
      "That doesn’t mean the day is ruined. It usually means one part of your system is asking for attention before your brain has words for it.",
      "Check the basics first: sleep, food, people, pressure, or too much phone. Those five explain a lot more than we want them to.",
      "Do one small stabilizer before you analyze your whole life: eat something real, step outside, clear one surface, or take a five-minute shower.",
      "Which one is most likely today?",
    ],
  },
  {
    id: "school-pressure",
    matches: (text) =>
      /\b(test|quiz|exam|homework|study|studying|school|grades?|class|assignment|finals?)\b/.test(text) &&
      /\b(can'?t focus|focus|pressure|stressed|tomorrow|behind|overwhelmed|locked|lock in)\b/.test(text),
    reply: [
      "Yeah, test stress can make your brain just freeze.",
      "The move is not to “lock in forever.” That’s too big. The move is to make starting so small your brain stops fighting it.",
      "Do 12 minutes on one topic with your phone away. No notes rewrite, no perfect setup. Just one problem set, one section, or one page.",
      "After that, take a two-minute break and write the exact thing that still feels confusing. Confusion gets weaker when it has a name.",
      "What class is this for?",
    ],
  },
  {
    id: "teacher-conflict",
    matches: (text) =>
      /\b(teacher|class|coach)\b/.test(text) &&
      /\b(hates me|doesn'?t like me|doesnt like me|no point trying|unfair|picks on me)\b/.test(text),
    reply: [
      "That feeling can make a class feel pointless fast. Still, don’t let one adult’s vibe decide your effort.",
      "There are two things here: what actually happened, and the story your brain is building from it. Both matter, but they are not the same.",
      "Separate the facts from the story: write one thing they actually did, then choose one repair move: ask what would improve your grade, turn in one missing thing, or talk after class for two minutes.",
      "Use a calm line if you talk to them: “I want to do better in this class. What’s one thing I should focus on first?”",
      "What did they do that made you feel like they hate you?",
    ],
  },
  {
    id: "parent-grade-pressure",
    matches: (text) =>
      /\b(parents?|mom|dad|family)\b/.test(text) &&
      /\b(straight a|all a|grades?|never enough|expect|pressure|disappointed)\b/.test(text),
    reply: [
      "That kind of grade pressure can make love feel conditional, even if they don’t mean it that way.",
      "It can turn school into this constant proof-of-worth game, where even a good grade just buys you a few hours of peace.",
      "For tonight, separate your worth from the scoreboard. Pick one class that actually needs attention and do one visible repair move: submit one thing, email one teacher, or study one weak topic.",
      "If you talk to them, keep it simple: “I’m working on a plan, but pressure is making it harder to think.” That is not an excuse. It is useful information.",
      "Are they pressuring you because you’re slipping, or has it always felt like nothing is enough?",
    ],
  },
  {
    id: "presentation-anxiety",
    matches: (text) =>
      /\b(presentation|presenting|present in class|speech|public speaking)\b/.test(text) &&
      /\b(nervous|anxious|scared|tomorrow|panic|embarrassed|freeze)\b/.test(text),
    reply: [
      "Presentations feel huge because everyone is looking at you. No wonder your body reacts.",
      "The trick is not becoming fearless. The trick is giving your body a script so it knows what to do while the fear is there.",
      "Practice the first two sentences three times. Say them out loud, not just in your head. If the start is solid, your brain has somewhere to land.",
      "When you’re up there, aim for steady, not perfect: feet planted, slow first sentence, look at the back wall if eye contact feels like too much.",
      "What part scares you most: forgetting, being judged, or your voice/body reacting?",
    ],
  },
  {
    id: "pregame-nerves",
    matches: (text) =>
      /\b(game|games|match|meet|tryout|performance)\b/.test(text) &&
      /\b(nervous|anxious|scared|worse than practice|play worse|freeze|choke)\b/.test(text),
    reply: [
      "Pregame nerves are your body trying to give you energy, not proof you’re about to fold.",
      "A lot of athletes think confidence means calm. Not really. Confidence is knowing what your first job is even while your body is loud.",
      "Before the game, pick a tiny routine: slow exhale twice, name your first simple job, then do that job hard for the first two minutes.",
      "Don’t chase a perfect game; chase the first useful rep. Sprint back, make the simple pass, box out, communicate, take the open look.",
      "What sport or event is this?",
    ],
  },
  {
    id: "college-pressure",
    matches: (text) =>
      /\b(college|application|applications|major|future|career|sat|act)\b/.test(text) &&
      /\b(behind|pressure|everyone|asking|stressed|overwhelmed|dont know|don't know)\b/.test(text),
    reply: [
      "College pressure gets loud because adults ask giant questions like you’re supposed to already be finished becoming a person.",
      "You’re not behind because you don’t have your whole life mapped. Most people are guessing more than they admit.",
      "Shrink it: make one list with three columns: what you might like, what you’re decent at, and what you’re curious enough to try.",
      "You don’t need your whole future today. You need the next honest option: one school to research, one major to compare, one adult to ask, one application step to finish.",
      "What part feels loudest right now: picking a school, picking a major, money, or feeling behind everyone else?",
    ],
  },
  {
    id: "bad-grade",
    matches: (text) =>
      /\b(failed my test|failed a test|failed the test|bombed (my )?(test|quiz|exam)|bad grade|got an f|got a d|grade dropped)\b/.test(text),
    reply: [
      "That sucks. Let it sting for a second, but one grade doesn’t get to name you.",
      "The dangerous part is when your brain turns “I did badly” into “I am stupid.” That’s not truth. That’s pain trying to sound official.",
      "Tonight, do one repair move: look at the missed questions, ask what can be corrected, or send the teacher one message.",
      "Then stop. You’re not trying to punish yourself into being better. You’re trying to get useful information and move.",
      "Was it because you didn’t understand it, didn’t study, froze during the test, or ran out of time?",
    ],
  },
  {
    id: "gym-anxiety",
    matches: (text) =>
      /\b(gym|lifting|lift|weights|workout)\b/.test(text) &&
      /\b(embarrassed|nervous|anxious|awkward|dont know what to do|don't know what to do|new|first time)\b/.test(text),
    reply: [
      "That’s normal. The gym feels way less scary when you know exactly what you’re doing.",
      "Most people at the gym are thinking about themselves, but I get why it feels like a spotlight when you’re new.",
      "Keep the first day simple: walk in, do one machine or dumbbell move, and leave. That still counts because the real win is proving you can enter the room.",
      "A clean first session: five-minute walk, goblet squat or leg press, dumbbell row, pushups or chest press, then leave before you overthink it.",
      "Do you have a gym available, or are you trying to start at home?",
    ],
  },
  {
    id: "confidence-school",
    matches: (text) =>
      /\b(ugly|awkward|low confidence|no confidence|insecure|embarrassed|hate how i look|feel weird)\b/.test(text) &&
      !/\b(girlfriend|gf|boyfriend|bf|relationship|date|dating|crush|photo|photos|picture|pictures|pics|posted|post me|tagged|tag me)\b/.test(text),
    reply: [
      "That feeling gets loud fast at school.",
      "School can make it feel like everyone is constantly ranking you, even when most people are just trying to survive their own day.",
      "Don’t try to become a totally different person by tomorrow. Pick one confidence rep: stand a little taller walking in, say hi first once, wear one thing you actually like, or stop checking your reflection/photo for ten minutes.",
      "Confidence is built from tiny pieces of evidence. Every small rep says, “I can handle being seen.”",
      "Where does it hit the most: walking in, talking to people, photos, or comparing yourself?",
    ],
  },
  {
    id: "photo-boundary",
    matches: (text) =>
      /\b(photo|photos|picture|pictures|pics|posted|post me|tagged|tag me)\b/.test(text) &&
      /\b(hate how i look|ugly|awkward|dont want|don't want|embarrassed|insecure)\b/.test(text),
    reply: [
      "Photos can make your brain act like one frame is the whole truth. It isn’t.",
      "One bad angle is not your identity. But when you already feel insecure, your brain will use that photo like a courtroom exhibit.",
      "Use a simple boundary: “Don’t post that one, I don’t like it.” You don’t need a whole speech.",
      "Then get your attention off the picture before you start inspecting yourself like evidence. Shower, walk, clean one thing, text someone normal. Anything that puts you back in real life.",
      "Is this about a photo that already got posted, or being scared someone will post one?",
    ],
  },
  {
    id: "dating-confidence",
    matches: (text) =>
      /\b(girlfriend|gf|boyfriend|bf|relationship|date|dating|crush|get a girl|get girls|pull girls|talk to girls|ask (her|him|them) out)\b/.test(text) &&
      /\b(want|wish|need|never had|can't get|cant get|how do i|get|find|meet|talk to|like me|confidence)\b/.test(text) &&
      !/\b(ask (a )?(girl|boy|someone|her|him|them) out|ask out|ask her out|ask him out|ask them out)\b/.test(text),
    reply: [
      "Wanting that kind of connection makes sense. I’m not going to frame it as “getting a girl” like someone is a prize, but I can absolutely help you become better at confidence, communication, flirting respectfully, and building real connection.",
      "The deeper version is this: people are usually drawn to someone who feels comfortable in themselves, listens well, has their own life, and doesn’t make every interaction feel like a high-stakes audition.",
      "- Confidence: build evidence by doing small social reps, not by waiting until you magically feel smooth.\n- Communication: ask normal questions, listen to the answer, and add something real instead of trying to perform.\n- Respect: if someone is not interested, stay kind and normal. That actually makes you more mature, not less.\n- Self-improvement: take care of your body, clothes, hygiene, interests, and friendships so dating is part of your life, not the whole mission.",
      "A simple first-week plan: say hi first to three people, ask one follow-up question in a conversation, make one low-pressure plan with a friend or group, and practice not overthinking every response.",
      "If you want, tell me your actual situation: are you trying to talk to one specific person, or do you mostly want more confidence around girls in general?",
    ],
  },
  {
    id: "ask-out-respectfully",
    matches: (text) =>
      /\b(ask (a )?(girl|boy|someone|her|him|them) out|ask out|ask her out|ask him out|ask them out)\b/.test(text) &&
      /\b(weird|awkward|how|what do i say|nervous|scared)\b/.test(text),
    reply: [
      "Keep it low-pressure and respectful. Don’t make it a dramatic confession.",
      "You’re not trying to trap them into an answer. You’re giving them an easy door to say yes or no.",
      "Say something like: “I like talking to you. Want to hang out sometime, just us?” Short, clear, no huge speech.",
      "If they hesitate or say no, you stay normal and kind. That’s what makes it not weird. Respect is part of confidence.",
      "Is this someone you already talk to, or someone you barely know?",
    ],
  },
  {
    id: "social-life-growth",
    matches: (text) =>
      /\b(social life|more outgoing|outgoing|social skills|talk to people|start conversations?|conversation skills|fit in|make plans|meet new people)\b/.test(text),
    reply: [
      "That’s a real thing to work on, and it’s buildable.",
      "Social confidence is mostly reps, not some magic personality trait people are born with.",
      "For this week, don’t aim for a whole new personality. Aim for three small reps: greet someone first, ask one follow-up question, and say yes to one normal hangout or group moment.",
      "The goal is not to be loud. The goal is to be a little more reachable, a little more present, and a little less trapped in your head.",
      "Which part is hardest: starting conversations, keeping them going, or making plans?",
    ],
  },
  {
    id: "new-school-friends",
    matches: (text) =>
      /\b(new school|moved schools|switched schools|transfer|transferred)\b/.test(text) &&
      /\b(friend|friends|make friends|meet people|fit in|alone|lonely)\b/.test(text),
    reply: [
      "New school is awkward because everyone else already has patterns. That doesn’t mean you’re behind socially.",
      "The first few weeks can feel like walking into a movie where everyone else already knows the plot.",
      "Pick one repeatable place: lunch table, club, sport, class partner, or after-school spot.",
      "Your first goal is not “best friends.” It’s seeing the same people enough times that talking stops feeling random. Familiarity does a lot of the heavy lifting.",
      "What repeatable place do you have access to this week?",
    ],
  },
  {
    id: "party-pressure",
    matches: (text) =>
      /\b(party|parties|drink|drinking|alcohol|weed|smoke)\b/.test(text) &&
      /\b(friends|people|everyone|pressure|want me to|feel lame|left out|fit in)\b/.test(text),
    reply: [
      "Not drinking doesn’t make you lame. It means you know one boundary before you walk in.",
      "People respect calm boundaries more than long explanations, even if they act annoying in the moment.",
      "Use a boring line and don’t over-explain: “I’m good tonight.” Hold a water or soda, stay near one person you trust, and leave if the vibe gets stupid.",
      "Also decide your exit before you go. Confidence is easier when you already know how you’ll leave.",
      "Are you worried about being pressured, or about feeling left out if you don’t go?",
    ],
  },
  {
    id: "social-comparison",
    matches: (text) =>
      /\b(compare|comparing|jealous|everyone looks better|everyone is better|instagram|tiktok)\b/.test(text) &&
      /\b(myself|body|life|looks|popular|confidence|feel bad)\b/.test(text),
    reply: [
      "Yeah, comparison apps are basically built to make you feel behind.",
      "They show you everyone else’s highlights while you’re sitting there with your full behind-the-scenes life. That math is rigged.",
      "Close it for 20 minutes and do something real: shower, walk, school task, workout, or text someone normal.",
      "The point is not “never compare.” The point is to stop feeding the loop when it starts eating your confidence.",
      "What are you comparing most right now: looks, friends, body, money, relationship, or popularity?",
    ],
  },
  {
    id: "jealous-friend",
    matches: (text) =>
      /\b(friend|teammate|classmate|someone)\b/.test(text) &&
      /\b(better than me|better at everything|jealous|envy|hate that im jealous|hate that i.?m jealous)\b/.test(text),
    reply: [
      "Jealousy feels ugly, but it usually points at something you care about.",
      "The mature move is not pretending you don’t feel it. It’s translating it.",
      "Don’t attack yourself for it. Name the exact thing you admire, then turn it into one rep you can practice this week.",
      "Their strength can become information, not evidence against you. If they’re disciplined, practice one disciplined rep. If they’re social, practice one social rep.",
      "What are they better at that bothers you the most?",
    ],
  },
  {
    id: "no-one-texts",
    matches: (text) =>
      /\b(no one|nobody|none of my friends|people don'?t|people dont)\b/.test(text) &&
      /\b(texts? me first|checks on me|invites? me|reaches out|makes plans|unwanted|forgotten)\b/.test(text),
    reply: [
      "Not being reached for first can hit like proof you don’t matter. It isn’t proof, but it does hurt.",
      "The hard part is your brain starts collecting silence like evidence. But silence can mean lazy, busy, distracted, awkward, or careless. It does not automatically mean unwanted.",
      "Try one clean test instead of reading everyone’s mind: text one person something specific like “Want to do something after school this week?”",
      "Their response gives you data; silence is not your identity. If they don’t meet you halfway, that tells us where to put your energy next.",
      "Is there one person you actually wish would reach out?",
    ],
  },
  {
    id: "lonely-weekend",
    matches: (text) =>
      /\b(invisible|lonely|alone|no one cares|left out)\b/.test(text) &&
      /\b(weekend|weekends|school|today|lately|feel)\b/.test(text),
    reply: [
      "That invisible feeling is brutal, especially on weekends.",
      "Weekends can make loneliness louder because school at least gives the day some structure. Then the quiet hits and it feels like everyone else has a life you weren’t invited into.",
      "Don’t let it turn into the whole day. Text one person, get outside for a few minutes, or tell me what happened.",
      "If texting feels too big, make it smaller: send a meme, ask “what are you doing later,” or reply to one story without trying to be impressive.",
      "Did something happen today, or is this a pattern lately?",
    ],
  },
  {
    id: "apology-repair",
    matches: (text) =>
      /\b(apologize|apology|say sorry|make it right|fix it)\b/.test(text) &&
      /\b(friend|mom|dad|parent|teacher|coach|them|her|him)\b/.test(text),
    reply: [
      "Keep it short. Big apology speeches usually make it weirder.",
      "A good apology does three things: names what happened, owns your part, and doesn’t pressure them to instantly make you feel better.",
      "Say: “I’m sorry for how I handled that. You didn’t deserve it. I’ll do better next time.” Then stop talking and let them respond.",
      "If they’re still mad, don’t argue with the consequence. Give it time and back it up with behavior.",
      "What happened between you two?",
    ],
  },
  {
    id: "social-rejection",
    matches: (text) => /\b(friend|friends|group chat|left me out|lonely|crush|delivered|rejected|ignored|social)\b/.test(text),
    reply: [
      "Oof. That actually hurts.",
      "Social pain is weird because it looks small from the outside, but inside it can feel like your whole place in the world is being voted on.",
      "Before you decide what it means, separate signal from spiral. Signal is what actually happened. Spiral is the story your brain writes when it’s scared.",
      "If it was clearly on purpose, we can plan a calm response. If it’s unclear, we don’t hand your whole mood to silence yet.",
      "Was it clearly on purpose, or is the silence making your brain run?",
    ],
  },
  {
    id: "breakup",
    matches: (text) => /\b(broke up|breakup|dumped|ex broke|ex texted|heartbroken)\b/.test(text),
    reply: [
      "That’s a heavy one. Don’t try to be instantly fine.",
      "Breakups mess with your body because the person who felt like comfort can suddenly become the trigger.",
      "For today, don’t chase closure. Eat something, get off the phone for a bit, and do not reread everything like there’s a secret answer hidden in the texts.",
      "One clean move: write the message you want to send in notes, but don’t send it for 24 hours. Let the wave pass before you make a permanent move from a temporary spike.",
      "What part hurts most right now: missing them, feeling rejected, being embarrassed, or not knowing what happened?",
    ],
  },
  {
    id: "parent-fighting",
    matches: (text) =>
      /\b(parents?|mom|dad|home)\b/.test(text) &&
      /\b(fighting|fight|yelling|arguing|cant relax|can't relax|unsafe|stressed)\b/.test(text),
    reply: [
      "When your parents are fighting, it makes sense that you can’t relax.",
      "Your body hears conflict at home as danger, even if the fight is not about you. That’s why it can feel impossible to focus or chill.",
      "Get somewhere that feels safe if you can: your room, headphones, a walk, a sibling’s room, or near another trusted adult.",
      "Then do one small thing to calm your body for five minutes: slow breathing, cold water on your face, music, or texting someone grounded.",
      "Are you physically safe right now, or is it just emotionally loud?",
    ],
  },
  {
    id: "vape-pressure",
    matches: (text) =>
      /\b(vape|vaping|nic|weed|smoke|smoking)\b/.test(text) &&
      /\b(stop|quit|pressure|friends|school|again|keep|want to)\b/.test(text),
    reply: [
      "No lecture. That stuff is sticky because it turns into a habit plus a social thing.",
      "The urge usually has a pattern: certain people, certain bathrooms/cars/rooms, certain times, certain moods.",
      "For the next urge, change the scene: leave the spot, drink water, chew gum, or text someone “distract me for 5.”",
      "Don’t build your entire self-image around quitting perfectly. Build a delay muscle first. Five minutes delayed is a rep.",
      "When does it hit hardest: school, after school, with friends, or late at night?",
    ],
  },
  {
    id: "messy-room",
    matches: (text) =>
      /\b(room|desk|closet|laundry|space)\b/.test(text) &&
      /\b(messy|mess|dirty|clean|cleaning|overwhelming|overwhelmed)\b/.test(text),
    reply: [
      "Don’t clean the whole room. That’s how it turns into a whole thing.",
      "A messy room can start feeling like a messy brain, and then you avoid it because looking at it feels like getting yelled at by your own space.",
      "Set a 7-minute timer and only do trash or laundry. Stop when the timer ends.",
      "If you still have energy, do one more category: dishes, floor, desk, or clothes. Categories beat chaos.",
      "Which category is the biggest problem right now?",
    ],
  },
  {
    id: "morning-routine",
    matches: (text) =>
      /\b(morning|wake up|waking up|before school|routine)\b/.test(text) &&
      /\b(routine|start|better|tired|late|school|what should)\b/.test(text),
    reply: [
      "Make the morning stupid simple.",
      "A good morning routine is not aesthetic. It’s a launch sequence that keeps you from starting the day already behind.",
      "Phone stays away for 10 minutes, water first, clothes on, then one tiny win before school. Don’t add ten habits yet.",
      "Set it up the night before: clothes visible, bag packed, charger away from bed if you can. Morning discipline is mostly evening setup.",
      "What usually ruins your morning: phone, tiredness, not knowing what to wear, or running late?",
    ],
  },
  {
    id: "bored-weekend",
    matches: (text) =>
      /\b(bored|nothing to do|weekend|saturday|sunday)\b/.test(text) &&
      /\b(bored|nothing|what should|idk|don'?t know)\b/.test(text),
    reply: [
      "Bored can turn into scrolling so fast.",
      "Your brain wants stimulation, and the phone is the easiest button. Easy does not always mean satisfying.",
      "Pick one lane for the next hour: move, make food, clean one thing, text someone, or go outside.",
      "Make it feel less random: choose the lane that gives you the kind of day you won’t regret tonight.",
      "Do you want the next hour to feel social, productive, calm, or fun?",
    ],
  },
  {
    id: "low-motivation",
    matches: (text) => /\b(unmotivated|no motivation|lazy|stuck|can't start|cant start|procrastinat|doomscroll|phone addiction)\b/.test(text),
    reply: [
      "Yeah, that stuck feeling is real.",
      "But I’m not going to call you lazy. Most of the time, stuck means the task feels too big, too boring, too scary, or too unclear.",
      "Don’t try to fix everything right now. Pick the smallest visible rep: open the assignment, put shoes on, clear one item, write the first bad sentence, or set a 10-minute timer.",
      "Motivation usually comes after motion, not before. We just need enough motion to break the freeze.",
      "Give me one thing you’ve been avoiding and I’ll make it a 10-minute start.",
    ],
  },
  {
    id: "missed-day",
    matches: (text) => /\b(skipped everything|missed everything|broke my streak|failed today|already failed|ruined today)\b/.test(text),
    reply: [
      "You didn’t fail. You had a bad day.",
      "The trap is turning one missed day into a new identity. That’s how streaks become pressure instead of support.",
      "Pick one small save: drink water, log your mood, clean for five minutes, or set up sleep tonight.",
      "A day can still count if you stop the slide. Not perfect. Just not abandoned.",
      "Which small save feels easiest right now?",
    ],
  },
  {
    id: "sleep-scroll",
    matches: (text) =>
      /\b(sleep|3am|2am|late|tired|exhausted|can'?t sleep|cant sleep)\b/.test(text) &&
      /\b(scroll|phone|staying up|up until|late|tired|exhausted|can'?t sleep|cant sleep|thinking|tomorrow|anxious|worry)\b/.test(text),
    reply: [
      "No perfect routine needed tonight.",
      "Late-night brain loves opening every tab at once. The goal is not to solve your whole life at midnight.",
      "Just make the next hour easier: write the tomorrow-thoughts on paper, pick the first thing you’ll do in the morning, dim the screen, and do one boring thing.",
      "Your brain needs somewhere to park the tabs. Paper works better than arguing with your thoughts in bed.",
      "Is this mostly phone scrolling, anxiety, or not feeling tired?",
    ],
  },
  {
    id: "snap-drama",
    matches: (text) =>
      /\b(snap|snapchat|screenshot|screenshotted|posted|story|dm|text screenshot)\b/.test(text) &&
      /\b(people are talking|everyone knows|exposed|embarrassed|spread|sharing|drama)\b/.test(text),
    reply: [
      "That feels violating because it is: someone took something private-ish and turned it into social currency.",
      "Don’t spiral in the group chat. Screenshot what happened, ask one trusted person what’s actually being said, and if it’s explicit, threatening, or being spread around school, bring in an adult fast.",
    ],
  },
  {
    id: "first-job-interview",
    matches: (text) =>
      /\b(job interview|interview|first job|hiring|application)\b/.test(text) &&
      /\b(nervous|scared|anxious|what do i say|prepare|tomorrow)\b/.test(text),
    reply: [
      "First interview nerves are normal because you’re walking into a script you haven’t practiced yet.",
      "Prepare three answers: why you want the job, one time you were responsible, and when you’re available. Wear something clean, show up 10 minutes early, and ask one question at the end: “What would make someone good at this role?”",
    ],
  },
  {
    id: "doomscrolling",
    matches: (text) => /\b(tiktok|instagram|youtube|scroll|scrolling|doomscroll|phone|screen time|social media)\b/.test(text),
    reply: [
      "Okay, the phone won that round. Day’s not over.",
      "These apps are designed to make stopping feel weird. So we don’t rely on willpower only; we change the setup.",
      "Put it across the room for 15 minutes and pick one replacement: shower, walk, homework sprint, food, or sleep setup.",
      "If 15 minutes feels too much, do five. The win is proving you can interrupt the loop.",
      "Which app is taking the most time right now?",
    ],
  },
  {
    id: "lunch-ideas",
    matches: (text) =>
      /\b(hungry|lunch|lunc|food|eat|cook)\b/.test(text) &&
      /\b(what should|what do|should i|can i|make|cook|eat|lunch|lunc)\b/.test(text),
    reply: [
      "I got you. Make lunch simple: protein + carb + something fresh.",
      "You don’t need a perfect meal. You need something that gives your brain and body enough fuel to stop feeling desperate.",
      "Easy moves: eggs and toast, a turkey/rice bowl, a tuna sandwich, Greek yogurt with fruit, pasta with chicken, beans and rice, or leftovers with water.",
      "If you’re low energy, choose the fastest real option. If you’re training later, add more carbs. If you haven’t eaten much today, make it bigger.",
      "What do you actually have?",
    ],
  },
  {
    id: "anger-repair",
    matches: (text) =>
      /\b(mad|angry|rage|yelled|fight|fighting|mom|dad|parent|parents)\b/.test(text) &&
      /\b(feel bad|guilty|regret|sorry|mad|angry|yelled|fight)\b/.test(text),
    reply: [
      "Feeling bad after means you probably care more than you showed in the moment.",
      "Don’t try to repair while your body is still in fight mode. That usually turns into round two.",
      "Cool down first: water, walk, music, shower, or ten minutes without texting. Then say one honest sentence about what you wish you handled differently.",
      "A clean repair sounds like: “I was mad, but I shouldn’t have said it like that. I’m sorry.” No essay, no excuse pile.",
      "Who was it with?",
    ],
  },
  {
    id: "purpose-quit",
    matches: (text) => /\b(point of trying|always quit|why try|i always fail|nothing works|keep quitting|what's the point|whats the point)\b/.test(text),
    reply: [
      "Quitting before doesn’t mean you’re cooked forever.",
      "It probably means the plan was too big, too vague, or built for some imaginary version of you with unlimited discipline.",
      "Real growth is less dramatic than people make it look. It’s repeatable proof: one tiny thing, done enough times that you start trusting yourself again.",
      "Pick a three-day promise so small it almost feels embarrassing: five pushups, one paragraph, ten minutes of study, one check-in, one walk.",
      "What’s one tiny thing you could actually do for three days?",
    ],
  },
  {
    id: "cooked-slang",
    matches: (text) =>
      /\b(cooked|fried|drained|burnt out|burned out|overwhelmed)\b/.test(text) &&
      /\b(what do i do|what should i do|help|start|fix)\b/.test(text),
    reply: [
      "You’re probably overloaded, not doomed.",
      "When everything stacks up, your brain starts treating every task like the same emergency. That’s why even simple stuff feels impossible.",
      "Do the quick reset: water, stand up, clear one thing, then tell me what you’ve been avoiding.",
      "After that, we choose the first domino. Not the whole life plan. Just the one thing that makes the next thing easier.",
      "What’s the biggest thing sitting on you right now?",
    ],
  },
  {
    id: "overthinking",
    matches: (text) => /\b(overthinking|spiraling|anxious|anxiety|stress|stressed|panic)\b/.test(text),
    reply: [
      "Your brain is doing the too-many-tabs thing.",
      "Overthinking feels productive because it keeps moving, but a lot of the time it’s just fear wearing a thinking costume.",
      "Get it out of your head first: write the loop in one sentence, then write the next controllable action under it.",
      "If there is no action, the move is regulation: breathe slow, walk, shower, or talk to someone real. Your brain can’t think its way out of every body state.",
      "What’s the main loop: school, people, future, or your own self-talk?",
    ],
  },
  {
    id: "lock-in-week",
    matches: (text) =>
      /\b(what should i do|what do i do|help me|where do i start|start today|lock in|locked in|make me a plan)\b/.test(text) &&
      /\b(week|this week|plan)\b/.test(text),
    reply: [
      "Here’s the simple version: one body thing, one school/work thing, one sleep thing each day.",
      "That gives you a floor without turning the week into a military operation.",
      "Body thing: workout, walk, stretch, or solid meal. School/work thing: one focused sprint. Sleep thing: protect the last 30 minutes.",
      "Track wins, not perfection. If you hit two out of three, the day is still moving.",
      "Want it focused on basketball, confidence, school, or sleep?",
    ],
  },
  {
    id: "general-start",
    matches: (text) => /\b(what should i do|what do i do|help me|where do i start|start today|lock in|locked in)\b/.test(text),
    reply: [
      "Let’s not make it huge.",
      "When you don’t know where to start, the wrong move is trying to fix every category at once.",
      "Pick one lane for the next 20 minutes: reset your mind, move your body, handle school, clean your space, eat something, or protect sleep.",
      "Once you choose the lane, I’ll turn it into the smallest possible first rep.",
      "Which lane needs you most right now?",
    ],
  },
];

const physicalWorkflows: Workflow[] = [
  {
    id: "cheap-school-protein",
    matches: (text) =>
      /\b(cheap|budget|affordable|easy|bring to school|school)\b/.test(text) &&
      /\b(protein|high protein|muscle|snack|foods?|lunch)\b/.test(text),
    reply: [
      "Good school protein does not need to be fancy.",
      "The goal is fuel you’ll actually eat, not some influencer grocery haul.",
      "Cheap options: Greek yogurt, string cheese, tuna packets, turkey or chicken sandwich, eggs, beans and rice, peanut butter sandwich, cottage cheese if you like it, roasted chickpeas, or leftovers in a container.",
      "Pair it with carbs and water so it actually fuels you, not just “hits protein.” Protein plus no energy is still a bad school day.",
      "Do you need stuff you can bring in a bag, or stuff you can eat at home after school?",
    ],
  },
  {
    id: "pre-practice-food",
    matches: (text) =>
      /\b(before practice|before a game|pre practice|pre-game|pregame|practice later|game later)\b/.test(text) &&
      /\b(eat|food|snack|meal|hungry|what should)\b/.test(text),
    reply: [
      "Keep it easy before practice: carbs for energy, a little protein, water.",
      "You want food that helps you move, not food that sits in your stomach like a brick.",
      "Good options: banana and yogurt, peanut butter toast, rice and eggs, a turkey sandwich, chocolate milk, or leftovers if they sit well.",
      "If practice is soon, keep it lighter. If you have two or three hours, eat a fuller meal.",
      "How long until practice or the game?",
    ],
  },
  {
    id: "sore-recovery",
    matches: (text) =>
      /\b(sore|tight|aching|ache|recovery|legs hurt|shoulder hurts|knee hurts)\b/.test(text) &&
      /\b(workout|practice|training|gym|after|from)\b/.test(text),
    reply: [
      "Sore after training usually means your body needs the basics, not panic.",
      "There’s a difference between normal soreness and pain that’s trying to warn you. Dull and general is one thing; sharp, swollen, or changing how you move is different.",
      "Go light today: water, food, easy walk, gentle stretching, and sleep. Don’t punish soreness with more intensity just to prove you’re tough.",
      "If it’s sharp pain, swelling, numbness, or you can’t move normally, don’t push through it. Tell a parent, coach, trainer, or clinician.",
      "Where is it sore, and does it feel dull or sharp?",
    ],
  },
  {
    id: "basketball-consistency",
    matches: (text) =>
      /\b(basketball|hoop|shooting|handles|workout|training)\b/.test(text) &&
      /\b(skip|skipping|better|improve|get better|workouts?|practice)\b/.test(text),
    reply: [
      "Don’t make it a whole production.",
      "Basketball improvement comes from repeatable boring reps more than random heroic workouts.",
      "Do 20 minutes: 5 handles, 10 form shots or wall reps, 5 stretching. Log it after so it counts.",
      "If you have a hoop, make the shooting clean and close before you drift out. If you don’t, handles and footwork still count.",
      "What are you trying to improve most: shooting, handles, defense, conditioning, or confidence in games?",
    ],
  },
  {
    id: "bad-practice",
    matches: (text) =>
      /\b(bad practice|played bad|played terrible|coach yelled|coach was mad|missed every shot|missed shots)\b/.test(text),
    reply: [
      "Bad practices mess with your head, but they also show you what to fix.",
      "Don’t let one bad session become a verdict on who you are. Every serious athlete has days where the ball feels weird and the body feels late.",
      "Pick one thing to clean up next time: effort, handles, shot reps, defense, or sleep.",
      "Then do a short reset workout, not revenge training: ten minutes of your cleanest fundamentals so your brain remembers you can still play.",
      "What went wrong: missed shots, turnovers, effort, coach reaction, or nerves?",
    ],
  },
  {
    id: "team-cut",
    matches: (text) =>
      /\b(got cut|cut from the team|didn'?t make the team|didnt make the team|benched)\b/.test(text) &&
      !/\b(coach|ask|why|what do i say|talk to)\b/.test(text),
    reply: [
      "That one hurts. Let it hurt without making it the full story.",
      "Getting cut can feel like public proof you’re not enough. It’s not proof. It’s feedback plus pain.",
      "If you still want it, ask what to improve, then pick one thing to train for 14 days. Comeback starts boring.",
      "The next version of you is built in quiet reps: conditioning, handles, shooting form, strength, film, whatever the gap actually was.",
      "Do you want help writing the message to ask what to improve?",
    ],
  },
  {
    id: "coach-bench-conversation",
    matches: (text) =>
      /\b(coach|benched|bench|playing time|minutes)\b/.test(text) &&
      /\b(scared|nervous|ask|why|what do i say|talk to)\b/.test(text),
    reply: [
      "That’s a hard ask, but it’s a useful one if you keep it calm.",
      "The goal is not to convince them you deserve more minutes in that conversation. The goal is to get clear targets.",
      "Say: “Coach, what are one or two things I need to improve to earn more minutes?”",
      "Don’t argue in the moment. Write down the answer, train that for two weeks, then check back. Coaches respect specific follow-through more than emotional speeches.",
      "Are you benched because of skill, effort, mistakes, or you genuinely don’t know?",
    ],
  },
  {
    id: "muscle-building-meal-plan",
    matches: (text) =>
      /\b(bulk|bulking|gain muscle|muscle gain|muscle-building|meal plan|diet)\b/.test(text) &&
      /\b(summer|muscle|bulk|bulking|diet|meal|food|eat|training|workout)\b/.test(text),
    reply: [
      "I’d frame bulking as a safe muscle-building phase: eat enough consistently, train with structure, recover hard, and don’t turn it into obsessing over your body.",
      "School-day template: breakfast with protein and carbs like eggs with toast, Greek yogurt with granola, oatmeal with milk, or leftovers; lunch with a real base like chicken, tofu, turkey, beans, rice, pasta, potatoes, fruit, and water; after school or pre-workout, do banana and peanut butter, yogurt and granola, a sandwich, or chocolate milk; dinner should repeat protein + carb + vegetable, then add a bedtime snack if you’re still hungry.",
      "Training side: lift or train 3-4 days a week, warm up, use controlled reps, add a little difficulty over time, and sleep 8-10 hours when you can.",
      "For the next 7 days: breakfast, lunch, dinner, one workout-adjacent snack, water, and a simple training log. Don’t weigh yourself all day. Judge the week by consistency, energy, lifts, and recovery.",
      "Tell me your equipment, practice schedule, and what you usually eat in a normal school day, and I’ll make it more exact.",
    ],
  },
];
