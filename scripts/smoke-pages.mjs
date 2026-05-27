/* global WebSocket */
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import { execFile, execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const chromePath = process.env.CHROME_BIN || findChrome();
const viewport = { width: 390, height: 844 };
let currentSelectors = [];
let currentForbiddenSelectors = [];

const exactPhysicalCopy = [
  "Log food",
  "To fuel your workouts correctly.",
  "Body scan",
  "To keep your posture, alignment, and body composition in check — including body fat, muscle balance, recovery, and areas to improve. Kai analyzes your progress and helps guide you toward healthier, more effective ways to reach your goals safely.",
  "Stretch / move",
  "To maintain mobility and prevent injury. Prop your phone up and let Kai guide you through stretches in real time — tracking your movement, correcting your form, improving posture, and coaching your breathing as you go.",
  "Log sleep",
  "To ensure your body is actually recovering from the work."
];

const guideNames = [
  "Daniel Siegel",
  "Andrew Huberman",
  "Viktor Frankl",
  "James Clear",
  "Carl Jung",
  "Stoic philosophy",
  "Modern teen psychology principles"
];

const connectionErrorCopy = [
  "Sign in again to keep going.",
  "Kai got a weird response. Try again.",
  "Connection dropped. You can keep going offline.",
  "Kai hit a snag. Your progress is safe."
];

const cases = [
  route("/", ["Start with what is", "One next move", "Crisis support"], { actionables: ["a[href='/crisis']"] }),
  route("/welcome", ["What should KAI call you?", "wellness companion"], { actionables: ["button", "input"], onboardingHandoff: true }),
  route("/walkthrough", ["Quick tour", "How KAI works", "Win the day."], { actionables: ["button", "a[href='/home']"], walkthrough: true }),
  route("/home", ["KAI home", "What’s loud today?", "one rep"], { actionables: ["textarea", "button"], kaiChatHandoff: true }),
  route("/goal", ["Pick one thing.", "What do you want to get better at?", "Keep going"], { actionables: ["textarea", "button"] }),
  route("/goals", ["Goals", "one next rep"], { actionables: ["a[href='/goal']"], optional: true }),
  route("/loop", ["One clean loop.", "Body", "mind", "goal"], { actionables: ["button"] }),
  route("/health", ["Take care of your body", "Body moves", ...exactPhysicalCopy], {
    actionables: ["[role='tab']", "a[href='/health?module=food&action=food']", "a[href='/health?module=scan&action=scan']", "a[href='/health?module=stretch&action=stretch']", "a[href='/health?module=sleep&action=sleep']"]
  }),
  route("/health?module=food", ["Take care of your body", "Add a food photo", ...exactPhysicalCopy.slice(0, 2)], {
    actionables: ["textarea", "input[type='file'][accept='image/*']", "button"],
    forbiddenSelectors: ["input[type='file'][capture]"],
    foodPhotoUpload: true
  }),
  route("/health?module=scan", ["Body scan", "Private by default", "No body score", exactPhysicalCopy[3]], {
    actionables: ["input[type='file'][accept='image/*']", "button"],
    forbiddenSelectors: ["input[type='file'][capture]"]
  }),
  route("/health?module=stretch&action=stretch", ["Stretch / move", exactPhysicalCopy[5]], {
    actionables: ["button"]
  }),
  route("/health?module=sleep&action=sleep", ["Log sleep", exactPhysicalCopy[7]], {
    actionables: ["button"]
  }),
  route("/task/talk", ["Check-in", "Feeling patterns"], { actionables: ["button"] }),
  route("/task/food", ["Log food", "Add a food photo"], {
    actionables: ["textarea", "input[type='file'][accept='image/*']", "button"],
    forbiddenSelectors: ["input[type='file'][capture]"],
    foodPhotoUpload: true
  }),
  route("/task/sleep", ["Log sleep", exactPhysicalCopy[7]], { actionables: ["button"], sleepLog: true }),
  route("/task/stretch", ["Stretch / move", exactPhysicalCopy[5]], { actionables: ["button"] }),
  route("/task/scan", ["Body scan", "Private by default"], {
    actionables: ["input[type='file'][accept='image/*']", "button"],
    forbiddenSelectors: ["input[type='file'][capture]"]
  }),
  route("/task/goal", ["Pick one thing.", "What do you want to get better at?", "Keep going"], { actionables: ["textarea", "button"] }),
  route("/task/reset", ["Settle your body first", "Social boundaries"], { actionables: ["button"] }),
  route("/task/confidence", ["Confidence is built from evidence", "Make one next move visible"], { actionables: ["button"] }),
  route("/task/social", ["Start with the honest social version", "Feeling patterns"], { actionables: ["button"] }),
  route("/task/screen", ["attention reset", "Social boundaries"], { actionables: ["button"] }),
  route("/engine/potential", ["Potential and goals", "Make the next move visible", "strengths discovery", "Doing-things guides"], {
    actionables: ["input", "textarea", "button"]
  }),
  route("/potential", ["Potential and goals", "Make the next move visible", "strengths discovery", "Doing-things guides"], {
    actionables: ["input", "textarea", "button"]
  }),
  route("/mental", ["Talk it through", "Feelings", "confidence", "never clinical"], { actionables: ["[role='tab']"] }),
  route("/mental?module=checkin&action=social", ["Talk it through", "Start with the honest social version", "Feeling patterns"], { actionables: ["[role='tab']", "button"] }),
  route("/mental?module=reset&action=screen", ["Talk it through", "attention reset", "Social boundaries"], { actionables: ["[role='tab']", "button"] }),
  route("/mental?module=purpose&action=confidence", ["Talk it through", "Confidence is built from evidence", "Make one next move visible"], { actionables: ["[role='tab']", "button"] }),
  route("/mental?module=guides", ["Talk it through", "Daniel Siegel", "James Clear", ...guideNames], {
    actionables: ["textarea", "button"]
  }),
  route("/progress", ["Private proof", "Kai can remember", "saved rep"], { actionables: ["a"] }),
  route("/groups", ["circle", "Support circle", "Locked until it is safe"], { actionables: ["a", "button"] }),
  route("/profile", ["Profile", "Kai", "daily score", "current path", "today's path", "next unlocks"], { actionables: ["a"] }),
  route("/settings", ["Settings", "Kai"], { actionables: ["button"] }),
  route("/crisis", ["Crisis", "988"], { actionables: ["a[href^='tel:']"] }),
  route("/for-parents", ["For parents", "wellness coaching"], { actionables: ["a"] }),
  route("/privacy", ["Privacy", "Kai"], { actionables: ["a"] }),
  route("/terms", ["Terms", "Kai"], { actionables: ["a"] })
];

void main();

async function main() {
  let failures = 0;

  console.log(`Mobile page smoke against ${baseUrl}`);
  console.log(`Chrome: ${chromePath}`);
  console.log(`Viewport: ${viewport.width}x${viewport.height}`);

  for (const testCase of cases) {
    try {
      await smokeCase(testCase);
      console.log(`✓ ${testCase.path}`);
    } catch (error) {
      failures++;
      const optional = testCase.optional ? " optional" : "";
      console.error(`✗${optional} ${testCase.path}: ${error.message}`);
      if (testCase.optional) failures--;
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} mobile page smoke check${failures === 1 ? "" : "s"} failed against ${baseUrl}`);
    process.exit(1);
  }

  console.log(`\nAll mobile page smoke checks passed against ${baseUrl}`);
}

function route(pathname, expectedText, options = {}) {
  return {
    path: pathname,
    expectedText,
    actionables: options.actionables || [],
    forbiddenSelectors: options.forbiddenSelectors || [],
    optional: Boolean(options.optional),
    foodPhotoUpload: Boolean(options.foodPhotoUpload),
    sleepLog: Boolean(options.sleepLog),
    kaiChatHandoff: Boolean(options.kaiChatHandoff),
    onboardingHandoff: Boolean(options.onboardingHandoff),
    walkthrough: Boolean(options.walkthrough)
  };
}

async function smokeCase(testCase) {
  const target = `${baseUrl}${testCase.path}`;
  await assertHttpShell(target);
  currentSelectors = testCase.actionables;
  currentForbiddenSelectors = testCase.forbiddenSelectors;
  const page = await renderPage(target, testCase);

  if (!page.rootText || page.rootText.trim().length < 20) {
    throw new Error("React root rendered blank or near blank");
  }

  if (page.title.toLowerCase().includes("404") || /not found/i.test(page.rootText)) {
    throw new Error("page appears to be a not-found fallback");
  }

  for (const errorCopy of connectionErrorCopy) {
    if (page.text.includes(errorCopy)) {
      throw new Error(`app connection error visible: ${JSON.stringify(errorCopy)}`);
    }
  }

  for (const expected of testCase.expectedText) {
    if (!page.text.toLowerCase().includes(expected.toLowerCase())) {
      throw new Error(`missing rendered text ${JSON.stringify(expected)}; saw ${JSON.stringify(page.text.slice(0, 220))}`);
    }
  }

  for (const selector of testCase.actionables) {
    if (!page.selectors[selector]) {
      throw new Error(`missing expected actionable selector ${selector}`);
    }
  }

  for (const selector of testCase.forbiddenSelectors) {
    if (page.forbiddenSelectors[selector]) {
      throw new Error(`forbidden selector present ${selector}`);
    }
  }

  if (page.horizontalOverflow > 2) {
    throw new Error(`horizontal overflow ${page.horizontalOverflow}px at mobile width`);
  }

  if (page.visibleButtonsWithoutText.length > 0) {
    throw new Error(`visible button without accessible text: ${page.visibleButtonsWithoutText.slice(0, 2).join(", ")}`);
  }

  if (page.consoleErrors.length > 0) {
    throw new Error(`console error: ${page.consoleErrors[0]}`);
  }
}

async function assertHttpShell(target) {
  const response = await fetchWithRetry(target);
  if (response.status !== 200) {
    throw new Error(`HTTP status ${response.status}, expected 200`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("text/html")) {
    throw new Error(`content-type ${contentType}, expected text/html`);
  }
}

async function renderPage(target, testCase) {
  const browser = await launchChrome();
  const tab = await createTab(browser.port, target);
  const client = new CdpClient(tab.webSocketDebuggerUrl);
  try {
    await client.connect();
    await client.send("Runtime.enable");
    await client.send("Page.enable");
    await client.send("DOM.enable");
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 3,
      mobile: true
    });
    await client.send("Emulation.setUserAgentOverride", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    });
    await client.send("Page.navigate", { url: target });
    await waitForLoad(client);
    await waitForRoot(client);
    let result = await waitForExpectedSnapshot(client, testCase);
    if (testCase.foodPhotoUpload) {
      await assertFoodPhotoUpload(client);
      result = await snapshotPage(client);
    }
    if (testCase.sleepLog) {
      await assertSleepLogCounter(client);
    }
    if (testCase.kaiChatHandoff) {
      await assertKaiChatHandoff(client);
    }
    if (testCase.onboardingHandoff) {
      await assertOnboardingHandoff(client);
    }
    if (testCase.walkthrough) {
      await assertWalkthrough(client);
    }
    return { ...result, consoleErrors: client.consoleErrors };
  } finally {
    await client.close().catch(() => undefined);
    await closeTab(browser.port, tab.id).catch(() => undefined);
    await browser.close().catch(() => undefined);
  }
}

async function assertFoodPhotoUpload(client) {
  const foodPath = path.join(tmpdir(), `kai-smoke-food-${process.pid}-${Date.now()}.png`);
  await writeFile(foodPath, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=", "base64"));
  try {
    const document = await client.send("DOM.getDocument", { depth: -1, pierce: true });
    const input = await client.send("DOM.querySelector", {
      nodeId: document.root.nodeId,
      selector: "input[type='file'][accept='image/*']"
    });
    if (!input.nodeId) throw new Error("food photo input was not found");
    await client.send("DOM.setFileInputFiles", { nodeId: input.nodeId, files: [foodPath] });

    const started = Date.now();
    while (Date.now() - started < 15_000) {
      const page = await snapshotPage(client);
      if ((/Photo saved|Kai saw|Photo saved\. Add a note/i.test(page.text)) && page.text.includes("Fix what Kai saw")) return;
      if (/Could not upload|Connection dropped|Sign in again|weird response|snag/i.test(page.text)) {
        throw new Error(`food photo upload failed visibly: ${JSON.stringify(page.text.slice(0, 240))}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    throw new Error("food photo upload did not reach a processed state");
  } finally {
    await rm(foodPath, { force: true }).catch(() => undefined);
  }
}

async function assertSleepLogCounter(client) {
  const before = await client.evaluate(`(() => {
    const button = document.querySelector("[data-sleep-log-button]");
    return button ? { text: button.innerText, disabled: Boolean(button.disabled), html: button.outerHTML.slice(0, 180) } : null;
  })()`);
  if (!before || before.disabled) throw new Error(`Sleep log button unavailable: ${JSON.stringify(before)}`);
  await clickSelector(client, "[data-sleep-log-button]");
  await waitForClientCondition(
    client,
    `document.body.innerText.includes("Sleep counted toward today's score") && document.body.innerText.includes("Recovery is the base layer.")`,
    "Sleep log did not show a saved sleep signal"
  );
  await clickSelector(client, "a[href='/profile']");
  await waitForClientCondition(
    client,
    `location.pathname === "/profile" && document.body.innerText.includes("TODAY") && document.body.innerText.includes("Log sleep") && document.body.innerText.includes("Done")`,
    "Sleep log did not increment the profile score and mission counter"
  );
}

async function assertOnboardingHandoff(client) {
  await client.evaluate(`(() => {
    const inputs = Array.from(document.querySelectorAll("input"));
    const name = inputs.find((input) => input.getAttribute("placeholder") === "First name");
    const set = (input, value) => {
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      if (setter) setter.call(input, value);
      else input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    };
    return set(name, "Demo");
  })()`);
  await clickReadyButton(client, "Continue");
  await client.evaluate(`(() => {
    const age = Array.from(document.querySelectorAll("input")).find((input) => input.getAttribute("inputmode") === "numeric");
    if (!age) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(age, "18");
    else age.value = "18";
    age.dispatchEvent(new Event("input", { bubbles: true }));
    age.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);
  await clickReadyButton(client, "Continue");
  await clickButtonByText(client, "Mental clarity");
  await clickButtonByText(client, "Focus");
  await clickButtonByText(client, "Better sleep");
  await clickReadyButton(client, "Continue");
  await client.evaluate(`(() => {
    const textarea = document.querySelector("textarea");
    if (!textarea) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    if (setter) setter.call(textarea, "I keep overthinking and losing focus at night.");
    else textarea.value = "I keep overthinking and losing focus at night.";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);
  await clickReadyButton(client, "Continue");
  await clickButtonByText(client, "6-7");
  await clickButtonByText(client, "Stress");
  await clickButtonByText(client, "Homework");
  await clickReadyButton(client, "Continue");
  await clickReadyButton(client, "Continue");
  await clickButtonByText(client, "Balanced");
  await clickReadyButton(client, "Continue");
  await clickReadyButton(client, "Start");
  await waitForClientCondition(
    client,
    `(() => {
      const text = document.body.innerText.toLowerCase();
      return location.pathname === "/walkthrough" && text.includes("how kai works") && text.includes("win the day");
    })()`,
    "Onboarding did not open the post-onboarding walkthrough"
  );
}

async function clickReadyButton(client, text) {
  await waitForClientCondition(
    client,
    `Array.from(document.querySelectorAll("button")).some((item) => (item.innerText || "").includes(${JSON.stringify(text)}) && !item.disabled)`,
    `Button ${JSON.stringify(text)} was not ready`,
    5_000
  );
  await clickButtonByText(client, text);
}

async function assertWalkthrough(client) {
  for (let index = 0; index < 4; index++) {
    await clickButtonByText(client, "Next");
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  await waitForClientCondition(
    client,
    `document.body.innerText.includes("Start KAI") && document.body.innerText.includes("Proof stacks up.")`,
    "Walkthrough did not reach the final progress explanation"
  );
  await clickButtonByText(client, "Start KAI");
  await waitForClientCondition(
    client,
    `location.pathname === "/home" && document.body.innerText.includes("KAI")`,
    "Walkthrough did not open Home"
  );
}

async function assertKaiChatHandoff(client) {
  await clickSelector(client, "button[aria-label='Open KAI tasks']");
  await waitForClientCondition(client, `Boolean(document.querySelector("[role='dialog'][aria-label='Quick actions']"))`, "KAI task launcher did not open");
  await assertQuickActionLinks(client);
  await waitForClientCondition(
    client,
    `(() => {
      const dialog = document.querySelector("[role='dialog'][aria-label='Quick actions']");
      return Boolean(dialog) &&
        Array.from(dialog.querySelectorAll("a")).some((link) => (link.getAttribute("href") || "").includes("/task/food")) &&
        dialog.innerText.toLowerCase().includes("recommended");
    })()`,
    "KAI task chip did not produce a food action"
  );
  await clickFoodActionLink(client);
  await waitForClientCondition(
    client,
    `location.pathname === "/task/food" && !document.querySelector("[role='dialog'][aria-label='Quick actions']") && document.body.innerText.includes("Log food")`,
    "KAI task action did not close launcher and open Food"
  );
}

async function assertQuickActionLinks(client) {
  const expectedRoutes = [
    "/task/talk",
    "/task/food",
    "/task/sleep",
    "/task/stretch",
    "/task/scan",
    "/task/goal",
    "/task/reset",
    "/task/confidence",
    "/task/social",
    "/task/screen",
    "/progress",
    "/profile",
    "/settings"
  ];

  const routes = await client.evaluate(`(() => {
    const dialog = document.querySelector("[role='dialog'][aria-label='Quick actions']");
    if (!dialog) return [];
    return Array.from(dialog.querySelectorAll("a"))
      .map((link) => {
        const href = link.getAttribute("href") || "";
        try {
          const url = new URL(href, location.origin);
          return url.pathname + url.search;
        } catch {
          return href;
        }
      });
  })()`);

  for (const route of expectedRoutes) {
    if (!routes.includes(route)) {
      throw new Error(`KAI task launcher missing service route ${route}; saw ${routes.join(", ")}`);
    }
  }

  const expectations = {
    "/task/talk": ["Check-in", "Feeling patterns"],
    "/task/food": ["Log food", "Add a food photo"],
    "/task/sleep": ["Log sleep"],
    "/task/stretch": ["Stretch / move"],
    "/task/scan": ["Body scan"],
    "/task/goal": ["Pick one thing."],
    "/task/reset": ["Settle your body first"],
    "/task/confidence": ["Confidence is built from evidence"],
    "/task/social": ["Start with the honest social version"],
    "/task/screen": ["attention reset"],
    "/progress": ["Private proof", "Kai can remember"],
    "/profile": ["Profile", "daily score"],
    "/settings": ["Settings", "Kai"]
  };

  for (const route of expectedRoutes) {
    await client.send("Page.navigate", { url: `${baseUrl}${route}` });
    await waitForLoad(client);
    await waitForRoot(client);
    const page = await snapshotPage(client);
    if (!page.rootText || page.rootText.trim().length < 20) {
      throw new Error(`KAI task route ${route} rendered blank`);
    }
    if (page.title.toLowerCase().includes("404") || /not found/i.test(page.rootText)) {
      throw new Error(`KAI task route ${route} appears to be not found`);
    }
    for (const errorCopy of connectionErrorCopy) {
      if (page.text.includes(errorCopy)) {
        throw new Error(`KAI task route ${route} showed connection error ${JSON.stringify(errorCopy)}`);
      }
    }
    for (const expected of expectations[route]) {
      if (!page.text.toLowerCase().includes(expected.toLowerCase())) {
        throw new Error(`KAI task route ${route} missing ${JSON.stringify(expected)}; saw ${JSON.stringify(page.text.slice(0, 220))}`);
      }
    }
    if (page.horizontalOverflow > 2) {
      throw new Error(`KAI task route ${route} has horizontal overflow ${page.horizontalOverflow}px`);
    }
  }

  await client.send("Page.navigate", { url: `${baseUrl}/home` });
  await waitForLoad(client);
  await waitForRoot(client);
  await waitForExpectedSnapshot(client, { expectedText: ["KAI home", "What’s loud today?", "one rep"], actionables: ["textarea", "button"] });
  await clickSelector(client, "button[aria-label='Open KAI tasks']");
  await waitForClientCondition(client, `Boolean(document.querySelector("[role='dialog'][aria-label='Quick actions']"))`, "KAI task launcher did not reopen after route checks");
}

async function clickFoodActionLink(client) {
  const clicked = await client.evaluate(`(() => {
    const dialog = document.querySelector("[role='dialog'][aria-label='Quick actions']");
    const element = Array.from((dialog || document).querySelectorAll("a")).find((link) => {
      const href = link.getAttribute("href") || "";
      return href.includes("/task/food");
    });
    if (!element) return false;
    element.scrollIntoView({ block: "center", inline: "center" });
    element.click();
    return true;
  })()`);
  if (!clicked) throw new Error("could not click Kai food action link");
  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function clickButtonByText(client, text) {
  const clicked = await client.evaluate(`(() => {
    const target = ${JSON.stringify(text)};
    const button = Array.from(document.querySelectorAll("button")).find((item) => (item.innerText || "").includes(target));
    if (!button) return false;
    button.scrollIntoView({ block: "center", inline: "center" });
    button.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`could not click button containing ${JSON.stringify(text)}`);
  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function waitForExpectedSnapshot(client, testCase) {
  let last = null;
  const started = Date.now();
  while (Date.now() - started < 8_000) {
    last = await snapshotPage(client);
    const hasExpectedText = testCase.expectedText.every((expected) => last.text.includes(expected));
    const hasSelectors = testCase.actionables.every((selector) => last.selectors[selector]);
    if (hasExpectedText && hasSelectors) return last;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return last ?? snapshotPage(client);
}

async function clickSelector(client, selector) {
  const clicked = await client.evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    element.scrollIntoView({ block: "center", inline: "center" });
    element.click();
    return true;
  })()`);
  if (!clicked) throw new Error(`could not click ${selector}`);
  await new Promise((resolve) => setTimeout(resolve, 150));
}

async function waitForClientCondition(client, expression, failureMessage, timeoutMs = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = await client.evaluate(`(() => { try { return Boolean(${expression}); } catch { return false; } })()`);
    if (ok) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  const page = await snapshotPage(client);
  throw new Error(`${failureMessage}; saw ${JSON.stringify(page.text.slice(0, 260))}`);
}

async function snapshotPage(client) {
  return client.evaluate(`(() => {
      const root = document.getElementById("root");
      const body = document.body;
      const html = document.documentElement;
      const text = (body.innerText || "").replace(/\\s+/g, " ").trim();
      const rootText = (root?.innerText || "").replace(/\\s+/g, " ").trim();
      const selectors = {};
      for (const selector of ${JSON.stringify(currentSelectors)}) selectors[selector] = Boolean(document.querySelector(selector));
      const forbiddenSelectors = {};
      for (const selector of ${JSON.stringify(currentForbiddenSelectors)}) forbiddenSelectors[selector] = Boolean(document.querySelector(selector));
      const visibleButtonsWithoutText = Array.from(document.querySelectorAll("button,[role='button']"))
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          const visible = rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none";
          const hiddenDetails = Boolean(el.closest("details:not([open])"));
          const name = (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").trim();
          return visible && !hiddenDetails && !name;
        })
        .map((el) => el.outerHTML.slice(0, 120));
      return {
        title: document.title || "",
        text,
        rootText,
        selectors,
        forbiddenSelectors,
        horizontalOverflow: Math.max(0, body.scrollWidth - html.clientWidth),
        visibleButtonsWithoutText
      };
    })()`);
}

async function launchChrome() {
  const userDataDir = await mkdtemp(path.join(tmpdir(), "kai-smoke-chrome-"));
  const proc = spawn(chromePath, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--disable-background-networking",
    "--remote-debugging-port=0",
    `--user-data-dir=${userDataDir}`,
    `--window-size=${viewport.width},${viewport.height}`,
    "about:blank"
  ], { stdio: ["ignore", "ignore", "pipe"] });

  let stderr = "";
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Chrome did not expose a debugging port")), 10_000);
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (match) {
        clearTimeout(timer);
        resolve(Number(match[1]));
      }
    });
    proc.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    proc.on("exit", (code) => {
      if (!stderr.includes("DevTools listening")) {
        clearTimeout(timer);
        reject(new Error(`Chrome exited before startup with code ${code}`));
      }
    });
  });

  return {
    port,
    close: async () => {
      proc.kill("SIGTERM");
      await Promise.race([
        new Promise((resolve) => proc.once("exit", resolve)),
        new Promise((resolve) => setTimeout(resolve, 1500))
      ]);
      if (!proc.killed) proc.kill("SIGKILL");
      await removeDirWithRetry(userDataDir).catch(() => undefined);
    }
  };
}

async function removeDirWithRetry(target) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await rm(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      return;
    } catch (error) {
      if (attempt === 5) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 150));
    }
  }
}

async function createTab(port, target) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(target)}`, { method: "PUT" });
  if (!response.ok) throw new Error(`could not open Chrome tab: ${response.status}`);
  return response.json();
}

async function closeTab(port, id) {
  await fetch(`http://127.0.0.1:${port}/json/close/${id}`);
}

async function waitForLoad(client) {
  await Promise.race([
    client.waitFor("Page.loadEventFired"),
    new Promise((resolve) => setTimeout(resolve, 8_000))
  ]);
  await new Promise((resolve) => setTimeout(resolve, 500));
}

async function waitForRoot(client) {
  const started = Date.now();
  while (Date.now() - started < 8_000) {
    const ready = await client.evaluate(`Boolean(document.getElementById("root")?.innerText?.trim())`);
    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("React root did not render text within 8s");
}

class CdpClient {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
    this.waiters = new Map();
    this.consoleErrors = [];
  }

  async connect() {
    this.ws = new WebSocket(this.url);
    this.ws.addEventListener("message", (event) => this.onMessage(JSON.parse(event.data)));
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
  }

  onMessage(message) {
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }

    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params.exceptionDetails;
      this.consoleErrors.push(details.text || details.exception?.description || "runtime exception");
    }

    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      this.consoleErrors.push(message.params.args.map((arg) => arg.value || arg.description || "").filter(Boolean).join(" "));
    }

    const waiters = this.waiters.get(message.method);
    if (waiters) {
      this.waiters.delete(message.method);
      for (const resolve of waiters) resolve(message.params);
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout for ${method}`));
        }
      }, 10_000);
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "evaluation failed");
    return result.result.value;
  }

  waitFor(method) {
    return new Promise((resolve) => {
      const waiters = this.waiters.get(method) || [];
      waiters.push(resolve);
      this.waiters.set(method, waiters);
    });
  }

  async close() {
    this.ws.close();
  }
}

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetch(url, { redirect: "manual" });
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 250));
    }
  }
  return fetchWithCurl(url, lastError);
}

async function fetchWithCurl(url, originalError) {
  try {
    const { stdout } = await execFileAsync("curl", [
      "-sS",
      "-L",
      "-o",
      "-",
      "-w",
      "\n__KAI_SMOKE_STATUS__%{http_code}\n__KAI_SMOKE_CONTENT_TYPE__%{content_type}",
      url
    ]);
    const statusMarker = "\n__KAI_SMOKE_STATUS__";
    const typeMarker = "\n__KAI_SMOKE_CONTENT_TYPE__";
    const statusAt = stdout.lastIndexOf(statusMarker);
    const typeAt = stdout.lastIndexOf(typeMarker);
    if (statusAt === -1 || typeAt === -1 || typeAt < statusAt) throw originalError;
    const status = Number(stdout.slice(statusAt + statusMarker.length, typeAt));
    const contentType = stdout.slice(typeAt + typeMarker.length).trim();
    return {
      status,
      headers: { get: (key) => (key.toLowerCase() === "content-type" ? contentType : null) }
    };
  } catch {
    throw originalError;
  }
}

function findChrome() {
  const candidates = ["google-chrome", "chromium", "chromium-browser", "chrome"];
  for (const candidate of candidates) {
    try {
      return execFileSync("which", [candidate], { encoding: "utf8" }).trim();
    } catch {
      // Try the next browser name.
    }
  }
  throw new Error("Chrome is required for mobile page smoke. Set CHROME_BIN to a Chromium-compatible binary.");
}
