const baseUrl = (process.env.KAI_API_BASE_URL || "https://kai-staging.evan-ratner.workers.dev").replace(/\/$/, "");
const devUser = process.env.KAI_DEV_USER || `chat-qa-${Date.now()}`;
const token = process.env.KAI_AUTH_TOKEN || "";

const headers = {
  "content-type": "application/json",
  ...(token ? { authorization: `Bearer ${token}` } : { "x-dev-user": devUser })
};

const scenarios = [
  {
    label: "sleep recovery",
    message: "I slept badly and feel tired but wired before school",
    action: "sleep",
    route: "/health?module=sleep&action=sleep"
  },
  {
    label: "food fuel",
    message: "I have practice later and do not know what to eat",
    action: "food",
    route: "/health?module=food&action=food"
  },
  {
    label: "posture scan",
    message: "Can Kai check my posture and alignment?",
    action: "scan",
    route: "/health?module=scan&action=scan"
  },
  {
    label: "confidence",
    message: "I feel insecure and not good enough today",
    action: "confidence",
    route: "/mental?module=purpose&action=confidence"
  },
  {
    label: "social pressure",
    message: "The group chat made me feel left out",
    action: "social",
    route: "/mental?module=checkin&action=social"
  },
  {
    label: "screen reset",
    message: "I keep doomscrolling and comparing myself",
    action: "screen",
    route: "/mental?module=reset&action=screen"
  },
  {
    label: "goal move",
    message: "I keep procrastinating on my assignment and need one move",
    action: "goal",
    route: "/goal?action=goal"
  }
];

const forbiddenReplyPatterns = [
  /\bas your therapist\b/i,
  /\bi diagnose\b/i,
  /\bdiagnosis\b/i,
  /\bi remember everything\b/i,
  /\bi'?m monitoring\b/i,
  /\bconstant monitoring\b/i,
  /\bsurveillance\b/i,
  /\bcalorie target\b/i,
  /\byou should feel\b/i,
  /\bno pain no gain\b/i,
  /\bjust toughen up\b/i,
  /\bshame\b/i
];

async function main() {
  console.log(`Chat QA: ${baseUrl}`);
  console.log(token ? "Auth: bearer token" : `Auth: x-dev-user ${devUser}`);
  await seedContext();

  let failures = 0;
  for (const scenario of scenarios) {
    try {
      const result = await request("/api/kai/chat", {
        method: "POST",
        body: JSON.stringify({ message: scenario.message })
      });
      assertScenario(scenario, result);
      console.log(`✓ ${scenario.label}: ${result.nextAction.id} -> ${preview(result.reply)}`);
    } catch (error) {
      failures += 1;
      console.error(`✗ ${scenario.label}: ${error.message}`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} chat QA scenario${failures === 1 ? "" : "s"} failed`);
    process.exit(1);
  }
  console.log("\nChat QA passed");
}

async function seedContext() {
  await request("/api/user/me", {
    method: "PATCH",
    body: JSON.stringify({
      kaiName: "Kai",
      kaiTone: "balanced",
      primaryEngine: "physical",
      age: 16,
      onboardingCompleted: true
    })
  });
  await request("/api/onboarding/intake", {
    method: "POST",
    body: JSON.stringify({
      responses: {
        q1: "I am tired but trying to lock in for school and soccer.",
        q2: "Direct coach. Do not be fake motivational.",
        q3: "Sleep, confidence, food, and social pressure are the main things.",
        q4: "School pressure, group chats, and making varsity.",
        q5: "Make varsity without burning out.",
        q6: "I want Kai to keep it real and give one move."
      }
    })
  });
  await request("/api/engines/physical/entries", {
    method: "POST",
    body: JSON.stringify({
      entryType: "sleep_log",
      title: "Log sleep",
      payload: { hours: 6, quality: "rough", insight: "Rough sleep. Keep the first move lighter and protect tonight." },
      completed: true
    })
  });
  await request("/api/engines/physical/entries", {
    method: "POST",
    body: JSON.stringify({
      entryType: "food_photo",
      title: "Food photo",
      payload: { mealContext: "before_practice", items: [{ name: "rice bowl" }, { name: "water" }] },
      completed: true
    })
  });
  await request("/api/engines/mental/entries", {
    method: "POST",
    body: JSON.stringify({
      entryType: "social_boundary",
      title: "Social boundary",
      payload: { boundary: "mute the group chat for one hour", replacement: "text one real friend" },
      completed: true
    })
  });
  await request("/api/goals", {
    method: "POST",
    body: JSON.stringify({
      category: "sport",
      title: "Make varsity",
      whyItMatters: "I want proof I can stay consistent.",
      nextAction: "Do one 12-minute footwork block."
    })
  });
}

function assertScenario(scenario, result) {
  if (!result?.conversationId) throw new Error("missing conversationId");
  if (!result?.reply || typeof result.reply !== "string") throw new Error("missing reply");
  if (result.reply.length > 900) throw new Error(`reply too long (${result.reply.length} chars)`);
  if (result.reply.split(/\s+/).length > 140) throw new Error("reply is too wordy for teen chat");
  for (const pattern of forbiddenReplyPatterns) {
    if (pattern.test(result.reply)) throw new Error(`reply matched forbidden pattern ${pattern}`);
  }
  if (result.reply.includes("Recent physical reps") || result.reply.includes("Recent mental reps") || result.reply.includes("Recent goal reps")) {
    throw new Error("reply leaked internal context labels");
  }
  if (!["talk", "reset"].includes(scenario.action) && /Want to talk it out or pick a reset\?/i.test(result.reply)) {
    throw new Error("clear routed intent fell back to generic talk/reset copy");
  }
  if (result.nextAction?.id !== scenario.action) {
    throw new Error(`expected nextAction ${scenario.action}, got ${result.nextAction?.id || "none"}`);
  }
  if (result.nextAction?.route !== scenario.route) {
    throw new Error(`expected route ${scenario.route}, got ${result.nextAction?.route || "none"}`);
  }
}

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...init.headers
    }
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(`${init.method || "GET"} ${path} failed with ${response.status}: ${text}`);
  }
  return body;
}

function preview(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, 110);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
