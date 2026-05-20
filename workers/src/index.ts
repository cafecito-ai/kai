import { Hono } from "hono";
import { cors } from "hono/cors";
import { chatRoutes } from "./routes/chat";
import { checkInRoutes } from "./routes/check-in";
import { demoRoutes } from "./routes/demo";
import { journalRoutes } from "./routes/journal";
import { sleepRoutes } from "./routes/sleep";
import { foodRoutes } from "./routes/food";
import { entriesRoutes } from "./routes/entries";
import { friendsRoutes } from "./routes/friends";
import { goalsRoutes } from "./routes/goals";
import { opsRoutes } from "./routes/ops";
import { progressRoutes } from "./routes/progress";
import { scanRoutes } from "./routes/scan";
import { scoreRoutes } from "./routes/score";
import { strengthsRoutes } from "./routes/strengths";
import { userRoutes } from "./routes/user";
import { workoutsRoutes } from "./routes/workouts";
import { requireAuth } from "./lib/auth";
import { consumeConsentToken } from "./lib/consent";
import { recomputeAllUsersPatterns } from "./lib/patterns-store";
import { recomputeAllProgressSummaries } from "./lib/progress";
import type { AppVariables, Env } from "./types";

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use("*", cors());
app.use("/api/*", requireAuth);

app.get("/health", (c) => c.json({ ok: true, service: "kai" }));
app.get("/api/health", (c) => c.json({ ok: true, service: "kai-api" }));
app.route("/api", chatRoutes);
app.route("/api", checkInRoutes);
app.route("/api", demoRoutes);
app.route("/api", journalRoutes);
app.route("/api", sleepRoutes);
app.route("/api", userRoutes);
app.route("/api", progressRoutes);
app.route("/api", scoreRoutes);
app.route("/api", goalsRoutes);
app.route("/api", opsRoutes);
app.route("/api", entriesRoutes);
app.route("/api", foodRoutes);
app.route("/api", friendsRoutes);
app.route("/api", strengthsRoutes);
app.route("/api", workoutsRoutes);
app.route("/api", scanRoutes);
app.post("/api/safety/log", async (c) => c.json({ event: await c.req.json() }));
app.get("/api/parent/consent", async (c) => {
  const token = c.req.query("token");
  if (!token) return c.html(consentHtml("Kai consent link is missing a token."));
  const result = await consumeConsentToken(c.env.DB, token);
  if (!result.ok) return c.html(consentHtml(result.reason === "expired" ? "This Kai consent link expired." : "This Kai consent link is no longer valid."));
  return c.html(consentHtml("Parent consent is complete. Your teen can keep using Kai."));
});

function consentHtml(message: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kai parent consent</title><style>body{margin:0;font-family:Inter,ui-sans-serif,system-ui;background:#f7f3ea;color:#161616;display:grid;min-height:100vh;place-items:center;padding:24px}.card{max-width:460px;background:white;border:1px solid rgba(0,0,0,.12);border-radius:8px;padding:24px;box-shadow:0 14px 45px rgba(0,0,0,.08)}p{line-height:1.5}</style></head><body><main class="card"><p style="font-weight:800;text-transform:uppercase;font-size:12px;color:#e35d4f">Kai</p><h1>Parent consent</h1><p>${message}</p></main></body></html>`;
}

/**
 * Cron-driven nightly recompute of progress summaries. Without this, a
 * teen's streak only refreshes when they open the app — meaning a stale
 * streak count can persist in KV (and in the Kai system prompt context)
 * for inactive users. Running at 07:00 UTC means most teens see correct
 * numbers by the time they wake up locally; the choice is arbitrary —
 * the only requirement is "once per day."
 *
 * Spec hook: P1-4 nightly streak recompute from
 * `/home/eratner/.claude/plans/lets-review-kai-boostaisearch-ai-and-imperative-dove.md`.
 */
/**
 * Sweep stale anonymous demo food photos out of R2. Anything under the
 * `demo-food-photos/` prefix older than 24h is deleted. The /demo flow
 * shows users "demo photos auto-delete in 24h" — this is what makes that true.
 */
async function cleanupDemoFoodPhotos(env: Env): Promise<{ scanned: number; deleted: number }> {
  if (!env.UPLOADS) return { scanned: 0, deleted: 0 };
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  let scanned = 0;
  let deleted = 0;
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) { // hard cap to avoid runaway
    const listing = await env.UPLOADS.list({ prefix: "demo-food-photos/", cursor, limit: 1000 });
    scanned += listing.objects.length;
    const stale = listing.objects.filter((obj) => {
      const ts = Number(obj.customMetadata?.uploadedAt);
      const uploadedAt = Number.isFinite(ts) ? ts : obj.uploaded?.getTime() ?? 0;
      return uploadedAt > 0 && uploadedAt < cutoff;
    });
    if (stale.length) {
      await env.UPLOADS.delete(stale.map((o) => o.key));
      deleted += stale.length;
    }
    if (!listing.truncated) break;
    cursor = listing.cursor;
  }
  return { scanned, deleted };
}

export default {
  fetch: app.fetch.bind(app),
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        try {
          const report = await recomputeAllProgressSummaries(env);
          console.log("nightly progress recompute", report);
        } catch (err) {
          console.error("nightly progress recompute fatal", err);
        }
        try {
          const cleanup = await cleanupDemoFoodPhotos(env);
          console.log("demo food photo cleanup", cleanup);
        } catch (err) {
          console.error("demo food photo cleanup fatal", err);
        }
        // T-021 — daily refresh of Mental Health pattern observations.
        // Spec calls for "user's local 6am" but Cloudflare crons are
        // single-region; one daily run at 07:00 UTC catches everyone
        // before most US teens are awake. Patterns expire 14 days out.
        try {
          const patterns = await recomputeAllUsersPatterns(env.DB);
          console.log("daily mental patterns recompute", patterns);
        } catch (err) {
          console.error("daily mental patterns recompute fatal", err);
        }
      })()
    );
  }
} satisfies ExportedHandler<Env>;
