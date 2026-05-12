const baseUrl = (process.env.KAI_API_BASE_URL || "https://kai-staging.evan-ratner.workers.dev").replace(/\/$/, "");
const devUser = process.env.KAI_DEV_USER || `smoke-${Date.now()}`;
const token = process.env.KAI_AUTH_TOKEN || "";
const runChat = process.env.KAI_SMOKE_CHAT === "1";

const headers = {
  "content-type": "application/json",
  ...(token ? { authorization: `Bearer ${token}` } : { "x-dev-user": devUser })
};

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

async function main() {
  console.log(`Smoke API: ${baseUrl}`);
  console.log(token ? "Auth: bearer token" : `Auth: x-dev-user ${devUser}`);

  await request("/api/health", { headers: {} });
  const user = await request("/api/user/me");
  console.log(`User: ${user.kaiName} / ${user.primaryEngine}`);

  const intake = await request("/api/onboarding/intake", {
    method: "POST",
    body: JSON.stringify({
      responses: {
        q1: "school and practice",
        q2: "when I finish something",
        q3: "sleep",
        q4: "pretty normal",
        q5: "make the team",
        q6: "direct"
      }
    })
  });
  console.log(`Intake suggested: ${intake.suggestedEngine}`);

  await request("/api/user/me", {
    method: "PATCH",
    body: JSON.stringify({
      kaiName: "Kai",
      kaiTone: "balanced",
      primaryEngine: intake.suggestedEngine,
      age: 16,
      onboardingCompleted: true
    })
  });

  const goal = await request("/api/goals", {
    method: "POST",
    body: JSON.stringify({ category: "sport", title: "Smoke goal" })
  });
  console.log(`Goal: ${goal.goal.id}`);

  await request(`/api/goals/${goal.goal.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "achieved" })
  });

  const progress = await request("/api/progress/event", {
    method: "POST",
    body: JSON.stringify({ engine: "physical", eventType: "smoke_event", eventValue: 10, payload: { smoke: true } })
  });
  console.log(`Progress: ${progress.event.id}`);

  const entry = await request("/api/engines/physical/entries", {
    method: "POST",
    body: JSON.stringify({
      entryType: "meal_log",
      title: "Smoke meal",
      payload: { meal: "apple and water" },
      completed: true
    })
  });
  console.log(`Entry: ${entry.entry.id}`);

  const foodPhoto = await request("/api/food-photo", {
    method: "POST",
    body: JSON.stringify({ note: "apple, water" })
  });
  if (foodPhoto.totals !== null) {
    throw new Error("Food photo smoke expected no calorie totals by default");
  }
  console.log(`Food photo meal: ${foodPhoto.mealId}`);

  const entries = await request("/api/engines/physical/entries");
  if (!entries.entries.some((item) => item.id === entry.entry.id)) {
    throw new Error("Created engine entry was not returned by list endpoint");
  }

  const safetyEvents = await request("/api/ops/safety-events");
  console.log(`Safety events visible: ${safetyEvents.events.length}`);

  if (runChat) {
    const chat = await request("/api/kai/chat", {
      method: "POST",
      body: JSON.stringify({ message: "I want one small useful step for today." })
    });
    console.log(`Chat conversation: ${chat.conversationId}`);
  }

  console.log("Smoke API passed");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
