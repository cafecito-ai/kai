import { Hono } from "hono";
import { cors } from "hono/cors";
import { chatRoutes } from "./routes/chat";
import { foodRoutes } from "./routes/food";
import { entriesRoutes } from "./routes/entries";
import { friendsRoutes } from "./routes/friends";
import { goalsRoutes } from "./routes/goals";
import { progressRoutes } from "./routes/progress";
import { userRoutes } from "./routes/user";
import { requireAuth } from "./lib/auth";
import { consumeConsentToken } from "./lib/consent";
import type { AppVariables, Env } from "./types";

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

app.use("*", cors());
app.use("/api/*", requireAuth);

app.get("/health", (c) => c.json({ ok: true, service: "kai" }));
app.route("/api", chatRoutes);
app.route("/api", userRoutes);
app.route("/api", progressRoutes);
app.route("/api", goalsRoutes);
app.route("/api", entriesRoutes);
app.route("/api", foodRoutes);
app.route("/api", friendsRoutes);
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

export default app;
