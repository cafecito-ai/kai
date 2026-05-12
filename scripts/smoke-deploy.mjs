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
  }
];

let failed = 0;
for (const test of cases) {
  const url = `${baseUrl}${test.path}`;
  let res;
  try {
    res = await fetch(url, { redirect: "manual" });
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

if (failed > 0) {
  console.error(`\n${failed} smoke check${failed === 1 ? "" : "s"} failed against ${baseUrl}`);
  process.exit(1);
}

console.log(`\nAll smoke checks passed against ${baseUrl}`);
