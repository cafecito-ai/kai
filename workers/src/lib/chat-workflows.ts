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
    id: "social-rejection",
    matches: (text) => /\b(friend|friends|group chat|left me out|lonely|crush|delivered|rejected|ignored|social)\b/.test(text),
    reply: [
      "That kind of stuff stings because it hits belonging.",
      "What actually happened: left out, ignored, embarrassed, or you’re reading the silence?",
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
      "Tonight’s win is not a perfect routine.",
      "It’s making the next hour quieter: dim the screen, plug the phone away from bed, and choose one boring wind-down thing.",
    ],
  },
  {
    id: "doomscrolling",
    matches: (text) => /\b(tiktok|instagram|youtube|scroll|scrolling|doomscroll|phone|screen time|social media)\b/.test(text),
    reply: [
      "Your attention got pulled. That doesn’t mean the day is gone.",
      "Put the phone across the room for 15 minutes and pick the replacement: shower, walk, homework sprint, or sleep setup.",
    ],
  },
  {
    id: "lunch-ideas",
    matches: (text) =>
      /\b(hungry|lunch|lunc|food|eat|cook)\b/.test(text) &&
      /\b(what should|what do|should i|can i|make|cook|eat|lunch|lunc)\b/.test(text),
    reply: [
      "I got you. Make lunch simple: protein + carb + something fresh.",
      "Easy moves: eggs and toast, a turkey/rice bowl, a tuna sandwich, Greek yogurt with fruit, or leftovers with water. What do you have?",
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
    id: "basketball-consistency",
    matches: (text) =>
      /\b(basketball|hoop|shooting|handles|workout|training)\b/.test(text) &&
      /\b(skip|skipping|better|improve|get better|workouts?|practice)\b/.test(text),
    reply: [
      "Basketball improvement needs a repeatable floor, not a perfect workout.",
      "Do 20 minutes today: 5 minutes handles, 10 minutes form shots or wall reps, 5 minutes mobility. Log it so the streak has proof.",
    ],
  },
  {
    id: "muscle-building-meal-plan",
    matches: (text) =>
      /\b(bulk|bulking|gain muscle|muscle gain|muscle-building|meal plan|diet)\b/.test(text) &&
      /\b(summer|muscle|bulk|bulking|diet|meal|food|eat|training|workout)\b/.test(text),
    reply: [
      "Let's frame this as a muscle-building phase: train consistently, eat steady meals, and protect recovery.",
      "For food, build each meal around a protein, a carb, a fruit or vegetable, and water. Think eggs with toast and fruit, chicken or tofu with rice and vegetables, or Greek yogurt or a sandwich after training.",
      "For training, aim for three to four strength sessions a week, keep basketball or conditioning in if you play, and treat sleep like part of practice.",
    ],
  },
];
