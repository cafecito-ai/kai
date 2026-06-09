/* global WebSocket */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const baseUrl = (process.env.KAI_BROWSER_SMOKE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const url = new URL(baseUrl);
const isProd = url.hostname === "kai.boostaisearch.ai";
const allowProdWrites = process.env.KAI_BROWSER_SMOKE_ALLOW_PROD_WRITES === "1";
const runOnboarding = !isProd || allowProdWrites;
const chromeBin = process.env.CHROME_BIN || findChrome();
const port = Number(process.env.KAI_BROWSER_SMOKE_PORT || 9331);

if (!chromeBin) {
  console.error("No Chrome executable found. Set CHROME_BIN to run browser smoke.");
  process.exit(1);
}

const profile = await mkdtemp(path.join(tmpdir(), "kai-browser-smoke-"));
const chrome = spawn(chromeBin, [
  "--headless=new",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-gpu",
  "about:blank",
], { stdio: "ignore" });

let failed = 0;
try {
  await waitForChrome();
  await checkAssets();
  if (runOnboarding) await checkFreshOnboarding();
  else {
    console.log("○ fresh onboarding skipped on production (set KAI_BROWSER_SMOKE_ALLOW_PROD_WRITES=1 to allow writes)");
    await checkPublicShell();
  }
  if (runOnboarding) await checkRoutes();
} finally {
  chrome.kill("SIGTERM");
  await waitForExit(chrome, 2000);
  await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
}

if (failed > 0) {
  console.error(`\n${failed} browser smoke check${failed === 1 ? "" : "s"} failed against ${baseUrl}`);
  process.exit(1);
}

console.log(`\nBrowser smoke passed against ${baseUrl}`);

async function checkAssets() {
  const favicon = await fetch(`${baseUrl}/favicon.ico`);
  assert(favicon.ok, "favicon.ico reachable");
  assert((favicon.headers.get("content-type") || "").startsWith("image/"), "favicon.ico serves an image content-type");

  const manifest = await (await fetch(`${baseUrl}/manifest.webmanifest`)).json();
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 3, "manifest has install icons");
}

async function checkRoutes() {
  const checks = [
    ["/sleep", "/sleep/log", "SLEEP LOG"],
    ["/workout", "/workout/log", "WORKOUT LOG"],
    ["/food", "/food/log", "FOOD LOG"],
    ["/home", "/home", "TODAY"],
    ["/chat", "/chat", "KAI"],
    ["/schedule", "/schedule", "YOUR SYSTEM"],
    ["/progress", "/progress", "PROGRESS"],
    ["/groups", "/groups", "GROUPS"],
    ["/profile", "/profile", "Profile"],
  ];
  for (const [pathName, finalPath, text] of checks) {
    const page = await newPage();
    await setupPage(page);
    await navigate(page, `${baseUrl}${pathName}`);
    await sleep(1400);
    const gotPath = await evaluate(page, "location.pathname");
    const body = await evaluate(page, "document.body.innerText");
    assert(gotPath === finalPath, `${pathName} lands on ${finalPath}`);
    assert(body.includes(text), `${pathName} renders ${text}`);
    assert(noBadEvents(page), `${pathName} has no browser errors`);
    page.close();
  }
}

async function checkPublicShell() {
  const page = await newPage();
  await setupPage(page);
  await navigate(page, `${baseUrl}/`);
  await sleep(1400);
  const body = await evaluate(page, "document.body.innerText");
  assert(body.includes("KAI") || body.includes("Start Becoming"), "public shell renders");
  assert(noBadEvents(page), "public shell has no browser errors");
  page.close();
}

async function checkFreshOnboarding() {
  const page = await newPage();
  await setupPage(page);
  await navigate(page, `${baseUrl}/onboarding`);
  await sleep(1600);
  await fillFirst(page, "Smoke");
  await clickText(page, "Continue");
  await sleep(250);
  await fillFirst(page, "16");
  await clickText(page, "Continue");
  await sleep(250);
  await clickText(page, "Confidence");
  await clickText(page, "Better sleep");
  await clickText(page, "Continue");
  await sleep(250);
  for (let i = 0; i < 4; i += 1) {
    await clickText(page, "Continue");
    await sleep(250);
  }
  await fillFirst(page, "Sleep better and make varsity");
  await clickText(page, "Continue");
  await sleep(250);
  await clickText(page, "No schedule");
  await sleep(250);
  const started = Date.now();
  await clickText(page, "Start");
  let landed = false;
  for (let i = 0; i < 40; i += 1) {
    await sleep(250);
    if ((await evaluate(page, "location.pathname")) === "/home") {
      landed = true;
      break;
    }
  }
  const elapsed = Date.now() - started;
  console.log(`○ fresh onboarding Home transition: ${elapsed}ms`);
  if (!landed) {
    console.error(`onboarding remained at ${await evaluate(page, "location.pathname")}: ${(await evaluate(page, "document.body.innerText")).slice(0, 400).replace(/\n/g, " / ")}`);
  }
  assert(landed, "fresh onboarding lands on Home");
  assert(elapsed < 8000, "fresh onboarding Home transition stays fast");
  assert(noBadEvents(page), "fresh onboarding has no browser errors");
  page.close();
}

async function setupPage(page) {
  await page.send("Page.enable");
  await page.send("Runtime.enable");
  await page.send("Network.enable");
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
}

async function navigate(page, target) {
  await page.send("Page.navigate", { url: target });
}

async function fillFirst(page, value) {
  return evaluate(page, `(() => {
    const el = document.querySelector("input,textarea");
    if (!el) return false;
    const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, "value")?.set;
    setter ? setter.call(el, ${JSON.stringify(value)}) : el.value = ${JSON.stringify(value)};
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`);
}

async function clickText(page, text) {
  const clicked = await evaluate(page, `(() => {
    const needle = ${JSON.stringify(text.toLowerCase())};
    const el = [...document.querySelectorAll("button,a,[role=button]")]
      .find((node) => (node.innerText || node.getAttribute("aria-label") || "").toLowerCase().includes(needle));
    if (!el) return false;
    el.click();
    return true;
  })()`);
  assert(clicked, `clicked ${text}`);
}

function noBadEvents(page) {
  return !page.events.some((event) => {
    if (event.method === "Network.loadingFailed") return true;
    if (event.method === "Runtime.exceptionThrown") return true;
    return event.method === "Runtime.consoleAPICalled" && event.params.type === "error";
  });
}

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
  } else {
    console.error(`✗ ${message}`);
    failed += 1;
  }
}

async function newPage() {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
  const info = await res.json();
  return connect(info.webSocketDebuggerUrl);
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (raw) => {
    const msg = JSON.parse(raw.data);
    if (msg.id && pending.has(msg.id)) {
      const pair = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? pair.reject(new Error(JSON.stringify(msg.error))) : pair.resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  };
  const ready = new Promise((resolve) => { ws.onopen = resolve; });
  return {
    events,
    async send(method, params = {}) {
      await ready;
      const callId = ++id;
      ws.send(JSON.stringify({ id: callId, method, params }));
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }));
    },
    close() {
      ws.close();
    },
  };
}

async function evaluate(page, expression) {
  const result = await page.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result.value;
}

async function waitForChrome() {
  for (let i = 0; i < 80; i += 1) {
    try {
      await fetch(`http://127.0.0.1:${port}/json/version`);
      return;
    } catch {
      await sleep(100);
    }
  }
  throw new Error("Chrome DevTools endpoint did not become available");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, timeoutMs);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function findChrome() {
  return process.env.CHROME_BIN ||
    ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"]
      .find((candidate) => existsSync(candidate));
}
