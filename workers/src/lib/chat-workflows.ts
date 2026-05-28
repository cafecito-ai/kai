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

export function fastKaiReply(message: string): string | null {
  return matchKaiWorkflow(message)?.reply ?? null;
}

export function fastPhysicalReply(message: string): string | null {
  return matchPhysicalWorkflow(message)?.reply ?? null;
}

export function isBenignGreeting(message: string): boolean {
  return /^\s*(yo|hey|hi|hello|sup|what'?s up|wassup|wyd)\s*(kai|coach)?[\s?.!]*$/i.test(message);
}

const greetingReply = [
  "I’m here.",
  "What’s the vibe today: mind, body, school, sleep, or confidence?",
];

const kaiWorkflows: Workflow[] = [
  {
    id: "casual-greeting",
    matches: (_text, raw) => isBenignGreeting(raw),
    reply: greetingReply,
  },
  {
    id: "sad-vague",
    matches: (text) => /\b(sad|depressed|delressed|lonely|empty|numb|down bad|rough day)\b/.test(text),
    reply: [
      "Damn. I’m here with you.",
      "What made it hit today: people, pressure, sleep, or just one of those waves?",
    ],
  },
  {
    id: "school-pressure",
    matches: (text) =>
      /\b(test|quiz|exam|homework|study|studying|school|grades?|class|assignment|finals?)\b/.test(text) &&
      /\b(can'?t focus|focus|pressure|stressed|tomorrow|behind|overwhelmed|locked|lock in)\b/.test(text),
    reply: [
      "Yeah, test stress can make your brain just freeze.",
      "Do 12 minutes on one topic with your phone away. After that, tell me what still feels confusing.",
    ],
  },
  {
    id: "presentation-anxiety",
    matches: (text) =>
      /\b(presentation|presenting|present in class|speech|public speaking)\b/.test(text) &&
      /\b(nervous|anxious|scared|tomorrow|panic|embarrassed|freeze)\b/.test(text),
    reply: [
      "Presentations feel huge because everyone is looking at you. That part is real.",
      "Practice the first two sentences three times. If the start is solid, your brain has somewhere to land.",
    ],
  },
  {
    id: "bad-grade",
    matches: (text) =>
      /\b(failed my test|failed a test|failed the test|bombed (my )?(test|quiz|exam)|bad grade|got an f|got a d|grade dropped)\b/.test(text),
    reply: [
      "That sucks. Let it sting for a second, but don’t turn one grade into your whole identity.",
      "Send the teacher one message or look at the missed questions tonight. One repair move is enough.",
    ],
  },
  {
    id: "gym-anxiety",
    matches: (text) =>
      /\b(gym|lifting|lift|weights|workout)\b/.test(text) &&
      /\b(embarrassed|nervous|anxious|awkward|dont know what to do|don't know what to do|new|first time)\b/.test(text),
    reply: [
      "That’s normal. The gym feels way less scary when you know exactly what you’re doing.",
      "Keep the first day simple: walk in, do one machine or dumbbell move, and leave. That still counts.",
    ],
  },
  {
    id: "confidence-school",
    matches: (text) => /\b(ugly|awkward|low confidence|no confidence|insecure|embarrassed|hate how i look|feel weird)\b/.test(text),
    reply: [
      "That feeling gets loud fast at school.",
      "Where does it hit the most: walking in, talking to people, photos, or comparing yourself?",
    ],
  },
  {
    id: "social-comparison",
    matches: (text) =>
      /\b(compare|comparing|jealous|everyone looks better|everyone is better|instagram|tiktok)\b/.test(text) &&
      /\b(myself|body|life|looks|popular|confidence|feel bad)\b/.test(text),
    reply: [
      "Yeah, comparison apps are basically built to make you feel behind.",
      "Close it for 20 minutes and do one thing that gives you real evidence: shower, walk, school task, workout, or text someone normal.",
    ],
  },
  {
    id: "lonely-weekend",
    matches: (text) =>
      /\b(invisible|lonely|alone|no one cares|left out)\b/.test(text) &&
      /\b(weekend|weekends|school|today|lately|feel)\b/.test(text),
    reply: [
      "That invisible feeling is brutal, especially on weekends.",
      "Don’t let it turn into the whole day. Text one person, get outside for a few minutes, or tell me what happened.",
    ],
  },
  {
    id: "apology-repair",
    matches: (text) =>
      /\b(apologize|apology|say sorry|make it right|fix it)\b/.test(text) &&
      /\b(friend|mom|dad|parent|teacher|coach|them|her|him)\b/.test(text),
    reply: [
      "Keep it short. Big apology speeches usually make it weirder.",
      "Say: “I’m sorry for how I handled that. You didn’t deserve it. I’ll do better next time.” Then stop talking and let them respond.",
    ],
  },
  {
    id: "social-rejection",
    matches: (text) => /\b(friend|friends|group chat|left me out|lonely|crush|delivered|rejected|ignored|social)\b/.test(text),
    reply: [
      "Oof. That actually hurts.",
      "Was it clearly on purpose, or is the silence making your brain run?",
    ],
  },
  {
    id: "breakup",
    matches: (text) => /\b(broke up|breakup|dumped|ex broke|ex texted|heartbroken)\b/.test(text),
    reply: [
      "That’s a heavy one. Don’t try to be instantly fine.",
      "For today, don’t chase closure. Eat something, get off the phone for a bit, and tell me what part hurts most.",
    ],
  },
  {
    id: "parent-fighting",
    matches: (text) =>
      /\b(parents?|mom|dad|home)\b/.test(text) &&
      /\b(fighting|fight|yelling|arguing|cant relax|can't relax|unsafe|stressed)\b/.test(text),
    reply: [
      "When your parents are fighting, it makes sense that you can’t relax.",
      "Get somewhere that feels safe if you can. Then do one small thing to calm your body for five minutes.",
    ],
  },
  {
    id: "vape-pressure",
    matches: (text) =>
      /\b(vape|vaping|nic|weed|smoke|smoking)\b/.test(text) &&
      /\b(stop|quit|pressure|friends|school|again|keep|want to)\b/.test(text),
    reply: [
      "No lecture. That stuff is sticky because it turns into a habit plus a social thing.",
      "For the next urge, make it physical: leave the spot, drink water, chew gum, or text someone “distract me for 5.”",
    ],
  },
  {
    id: "messy-room",
    matches: (text) =>
      /\b(room|desk|closet|laundry|space)\b/.test(text) &&
      /\b(messy|mess|dirty|clean|cleaning|overwhelming|overwhelmed)\b/.test(text),
    reply: [
      "Don’t clean the whole room. That’s how it turns into a whole thing.",
      "Set a 7-minute timer and only do trash or laundry. Stop when the timer ends.",
    ],
  },
  {
    id: "morning-routine",
    matches: (text) =>
      /\b(morning|wake up|waking up|before school|routine)\b/.test(text) &&
      /\b(routine|start|better|tired|late|school|what should)\b/.test(text),
    reply: [
      "Make the morning stupid simple.",
      "Phone stays away for 10 minutes, water first, clothes on, then one tiny win before school. Don’t add ten habits yet.",
    ],
  },
  {
    id: "bored-weekend",
    matches: (text) =>
      /\b(bored|nothing to do|weekend|saturday|sunday)\b/.test(text) &&
      /\b(bored|nothing|what should|idk|don'?t know)\b/.test(text),
    reply: [
      "Bored can turn into scrolling so fast.",
      "Pick one lane for the next hour: move, make food, clean one thing, text someone, or go outside.",
    ],
  },
  {
    id: "low-motivation",
    matches: (text) => /\b(unmotivated|no motivation|lazy|stuck|can't start|cant start|procrastinat|doomscroll|phone addiction)\b/.test(text),
    reply: [
      "Yeah, that stuck feeling is real.",
      "Don’t solve your whole life right now. Give me one thing you’ve been avoiding and I’ll make it a 10-minute start.",
    ],
  },
  {
    id: "missed-day",
    matches: (text) => /\b(skipped everything|missed everything|broke my streak|failed today|already failed|ruined today)\b/.test(text),
    reply: [
      "You didn’t fail. You had a bad day.",
      "Pick one small save: drink water, log your mood, clean for five minutes, or set up sleep tonight.",
    ],
  },
  {
    id: "sleep-scroll",
    matches: (text) =>
      /\b(sleep|3am|2am|late|tired|exhausted|can'?t sleep|cant sleep)\b/.test(text) &&
      /\b(scroll|phone|staying up|up until|late|tired|exhausted|can'?t sleep|cant sleep)\b/.test(text),
    reply: [
      "No perfect routine needed tonight.",
      "Just make the next hour easier: dim the screen, plug your phone in away from bed, and do one boring thing.",
    ],
  },
  {
    id: "doomscrolling",
    matches: (text) => /\b(tiktok|instagram|youtube|scroll|scrolling|doomscroll|phone|screen time|social media)\b/.test(text),
    reply: [
      "Okay, the phone won that round. Day’s not over.",
      "Put it across the room for 15 minutes and pick one replacement: shower, walk, homework sprint, or sleep setup.",
    ],
  },
  {
    id: "lunch-ideas",
    matches: (text) =>
      /\b(hungry|lunch|lunc|food|eat|cook)\b/.test(text) &&
      /\b(what should|what do|should i|can i|make|cook|eat|lunch|lunc)\b/.test(text),
    reply: [
      "I got you. Make lunch simple: protein + carb + something fresh.",
      "Easy moves: eggs and toast, a turkey/rice bowl, a tuna sandwich, Greek yogurt with fruit, or leftovers with water. What do you actually have?",
    ],
  },
  {
    id: "anger-repair",
    matches: (text) =>
      /\b(mad|angry|rage|yelled|fight|fighting|mom|dad|parent|parents)\b/.test(text) &&
      /\b(feel bad|guilty|regret|sorry|mad|angry|yelled|fight)\b/.test(text),
    reply: [
      "Feeling bad after means you probably care more than you showed in the moment.",
      "Cool down first. Then say one honest sentence about what you wish you handled differently.",
    ],
  },
  {
    id: "purpose-quit",
    matches: (text) => /\b(point of trying|always quit|why try|i always fail|nothing works|keep quitting|what's the point|whats the point)\b/.test(text),
    reply: [
      "Quitting before doesn’t mean you’re cooked forever.",
      "It probably means the plan was too big. What’s one tiny thing you could actually do for three days?",
    ],
  },
  {
    id: "cooked-slang",
    matches: (text) =>
      /\b(cooked|fried|drained|burnt out|burned out|overwhelmed)\b/.test(text) &&
      /\b(what do i do|what should i do|help|start|fix)\b/.test(text),
    reply: [
      "You’re probably overloaded, not doomed.",
      "Do the quick reset: water, stand up, clear one thing, then tell me what you’ve been avoiding.",
    ],
  },
  {
    id: "overthinking",
    matches: (text) => /\b(overthinking|spiraling|anxious|anxiety|stress|stressed|panic)\b/.test(text),
    reply: [
      "Your brain is doing the too-many-tabs thing.",
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
      "Want it focused on basketball, confidence, school, or sleep?",
    ],
  },
  {
    id: "general-start",
    matches: (text) => /\b(what should i do|what do i do|help me|where do i start|start today|lock in|locked in)\b/.test(text),
    reply: [
      "Let’s not make it huge.",
      "Pick one: reset your mind, move your body, handle school, or protect sleep.",
    ],
  },
];

const physicalWorkflows: Workflow[] = [
  {
    id: "pre-practice-food",
    matches: (text) =>
      /\b(before practice|before a game|pre practice|pre-game|pregame|practice later|game later)\b/.test(text) &&
      /\b(eat|food|snack|meal|hungry|what should)\b/.test(text),
    reply: [
      "Keep it easy before practice: carbs for energy, a little protein, water.",
      "Good options: banana and yogurt, peanut butter toast, rice and eggs, a turkey sandwich, or leftovers if they sit well.",
    ],
  },
  {
    id: "sore-recovery",
    matches: (text) =>
      /\b(sore|tight|aching|ache|recovery|legs hurt|shoulder hurts|knee hurts)\b/.test(text) &&
      /\b(workout|practice|training|gym|after|from)\b/.test(text),
    reply: [
      "Sore after training usually means your body needs the basics, not panic.",
      "Go light today: water, food, easy walk, gentle stretching. If it’s sharp pain or swelling, don’t push through it.",
    ],
  },
  {
    id: "basketball-consistency",
    matches: (text) =>
      /\b(basketball|hoop|shooting|handles|workout|training)\b/.test(text) &&
      /\b(skip|skipping|better|improve|get better|workouts?|practice)\b/.test(text),
    reply: [
      "Don’t make it a whole production.",
      "Do 20 minutes: 5 handles, 10 form shots or wall reps, 5 stretching. Log it after so it counts.",
    ],
  },
  {
    id: "bad-practice",
    matches: (text) =>
      /\b(bad practice|played bad|played terrible|coach yelled|coach was mad|missed every shot|missed shots)\b/.test(text),
    reply: [
      "Bad practices mess with your head, but they also show you what to fix.",
      "Pick one thing to clean up next time: effort, handles, shot reps, defense, or sleep.",
    ],
  },
  {
    id: "team-cut",
    matches: (text) => /\b(got cut|cut from the team|didn'?t make the team|didnt make the team|benched)\b/.test(text),
    reply: [
      "That one hurts. Let it hurt without making it your whole story.",
      "If you still want it, ask what to improve, then pick one thing to train for 14 days. Comeback starts boring.",
    ],
  },
  {
    id: "muscle-building-meal-plan",
    matches: (text) =>
      /\b(bulk|bulking|gain muscle|muscle gain|muscle-building|meal plan|diet)\b/.test(text) &&
      /\b(summer|muscle|bulk|bulking|diet|meal|food|eat|training|workout)\b/.test(text),
    reply: [
      "Yeah. Think muscle-building, not random eating.",
      "Each meal: protein + carb + fruit or vegetable + water. Easy examples: eggs with toast, chicken or tofu with rice, Greek yogurt with fruit, or a sandwich after training.",
      "Train three or four times a week and protect sleep. That’s where the growth actually sticks.",
    ],
  },
];
