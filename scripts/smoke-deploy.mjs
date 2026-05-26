import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Slim post-deploy smoke. Verifies the Worker is bound to the prod hostname
// and that auth is doing its job. Does NOT exercise DB writes (full
// scripts/smoke-api.mjs does that; running it against prod would create
// junk rows on every push).
//
// Usage:
//   KAI_PROD_URL=https://kai.boostaisearch.ai node scripts/smoke-deploy.mjs
//
// Fails fast on any non-expected status so a bad deploy turns the GH
// Actions job red.

const baseUrl = (process.env.KAI_PROD_URL || "https://kai.boostaisearch.ai").replace(/\/$/, "");

const cases = [
  {
    name: "health endpoint reachable through the bound route",
    path: "/api/health",
    expectStatus: 200,
    expectJsonField: { ok: true }
  },
  {
    name: "unauthenticated API rejected",
    path: "/api/user/me",
    expectStatus: 401
  },
  {
    name: "SPA still served on /",
    path: "/",
    expectStatus: 200,
    expectContentTypeStartsWith: "text/html"
  },
  {
    // /scope is an SPA route added in PR #69. Including it here means any
    // future Pages deploy that doesn't pick up the latest bundle will fail
    // the smoke and turn the deploy red — exactly the gap that let the
    // 2026-05-13 stale deploy land silently.
    name: "/scope SPA route reachable",
    path: "/scope",
    expectStatus: 200,
    expectContentTypeStartsWith: "text/html"
  },
  {
    name: "/demo SPA route reachable",
    path: "/demo",
    expectStatus: 200,
    expectContentTypeStartsWith: "text/html"
  },
  {
    name: "public demo feedback route validates payloads",
    path: "/api/demo-feedback",
    method: "POST",
    body: JSON.stringify({}),
    expectStatus: 400
  }
];

let failed = 0;
for (const test of cases) {
  const url = `${baseUrl}${test.path}`;
  let res;
  try {
    res = await fetchWithRetry(url, test);
  } catch (err) {
    console.error(`✗ ${test.name} (${test.path}): fetch threw — ${err.message}`);
    failed++;
    continue;
  }

  if (res.status !== test.expectStatus) {
    console.error(`✗ ${test.name} (${test.path}): got ${res.status}, expected ${test.expectStatus}`);
    failed++;
    continue;
  }

  if (test.expectContentTypeStartsWith) {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith(test.expectContentTypeStartsWith)) {
      console.error(`✗ ${test.name} (${test.path}): content-type ${contentType} did not start with ${test.expectContentTypeStartsWith}`);
      failed++;
      continue;
    }
  }

  if (test.expectJsonField) {
    let body;
    try {
      body = await res.json();
    } catch {
      console.error(`✗ ${test.name} (${test.path}): expected JSON response`);
      failed++;
      continue;
    }
    let jsonFailed = false;
    for (const [key, value] of Object.entries(test.expectJsonField)) {
      if (body?.[key] !== value) {
        console.error(`✗ ${test.name} (${test.path}): body.${key} = ${JSON.stringify(body?.[key])}, expected ${JSON.stringify(value)}`);
        failed++;
        jsonFailed = true;
      }
    }
    if (jsonFailed) continue;
  }

  console.log(`✓ ${test.name}`);
}

// Bundle integrity check — after the per-route status checks pass,
// pull the / HTML, extract the script tag's src, and assert the
// bundle URL itself 200s. Catches the class of bug where a Pages
// deploy serves the HTML shell but the JS bundle isn't actually
// present (cache miss / aborted deploy / stale dist). The SPA
// would white-screen for users while every route check above
// reported "200 text/html".
await assertBundleReachable(baseUrl).catch((err) => {
  console.error(`✗ bundle integrity check failed: ${err.message}`);
  failed++;
});

if (failed > 0) {
  console.error(`\n${failed} smoke check${failed === 1 ? "" : "s"} failed against ${baseUrl}`);
  process.exit(1);
}

console.log(`\nAll smoke checks passed against ${baseUrl}`);

async function assertBundleReachable(origin) {
  const homeRes = await fetchWithRetry(`${origin}/`);
  if (homeRes.status !== 200) {
    throw new Error(`/ returned ${homeRes.status}, can't check bundle`);
  }
  const html = await homeRes.text();
  // Vite emits one entry script tag of the form:
  //   <script type="module" crossorigin src="/assets/index-<hash>.js"></script>
  // We grab any `src="/assets/...js"` and verify each 200s.
  const sources = Array.from(html.matchAll(/<script[^>]+src="(\/assets\/[^"]+\.js)"/g)).map(
    (match) => match[1]
  );
  if (sources.length === 0) {
    throw new Error("no /assets/*.js script tags found in /; SPA bundle wiring is broken");
  }
  for (const src of sources) {
    const url = `${origin}${src}`;
    const res = await fetchWithRetry(url);
    if (res.status !== 200) {
      throw new Error(`${src} returned ${res.status} (expected 200 from the Pages bundle)`);
    }
  }
  console.log(`✓ bundle integrity (${sources.length} script tag${sources.length === 1 ? "" : "s"} verified)`);
}

async function fetchWithRetry(url, test = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fetch(url, {
        method: test.method ?? "GET",
        body: test.body,
        headers: test.body ? { "content-type": "application/json" } : undefined,
        redirect: "manual"
      });
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      }
    }
  }
  return fetchWithCurl(url, lastError, test);
}

async function fetchWithCurl(url, originalError, test = {}) {
  try {
    const args = [
      "-sS",
      "-L",
      "-o",
      "-",
      "-w",
      "\n__KAI_SMOKE_STATUS__%{http_code}\n__KAI_SMOKE_CONTENT_TYPE__%{content_type}",
      url
    ];
    if (test.method) args.unshift("-X", test.method);
    if (test.body) args.unshift("-H", "content-type: application/json", "--data", test.body);
    const { stdout } = await execFileAsync("curl", args);
    const statusMarker = "\n__KAI_SMOKE_STATUS__";
    const typeMarker = "\n__KAI_SMOKE_CONTENT_TYPE__";
    const statusAt = stdout.lastIndexOf(statusMarker);
    const typeAt = stdout.lastIndexOf(typeMarker);
    if (statusAt === -1 || typeAt === -1 || typeAt < statusAt) throw originalError;
    const body = stdout.slice(0, statusAt);
    const status = Number(stdout.slice(statusAt + statusMarker.length, typeAt));
    const contentType = stdout.slice(typeAt + typeMarker.length).trim();
    return {
      status,
      headers: { get: (key) => (key.toLowerCase() === "content-type" ? contentType : null) },
      json: async () => JSON.parse(body),
      text: async () => body
    };
  } catch {
    throw originalError;
  }
}
