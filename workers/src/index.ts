import { Hono } from "hono";
import { cors } from "hono/cors";
import { chatRoutes } from "./routes/chat";
import { foodRoutes } from "./routes/food";
import { friendsRoutes } from "./routes/friends";
import { goalsRoutes } from "./routes/goals";
import { progressRoutes } from "./routes/progress";
import { userRoutes } from "./routes/user";
import { sendParentConsentEmail } from "./lib/email";
import type { Env } from "./types";

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

app.use("*", cors());
app.use("/api/*", async (c, next) => {
  const authHeader = c.req.header("authorization");
  const devUser = c.req.header("x-dev-user");
  c.set("userId", devUser || authHeader?.replace(/^Bearer\s+/i, "") || "local-dev-user");
  await next();
});

app.get("/health", (c) => c.json({ ok: true, service: "kai" }));
app.route("/api", chatRoutes);
app.route("/api", userRoutes);
app.route("/api", progressRoutes);
app.route("/api", goalsRoutes);
app.route("/api", foodRoutes);
app.route("/api", friendsRoutes);
app.post("/api/safety/log", async (c) => c.json({ event: await c.req.json() }));
app.post("/api/parent/consent", async (c) => {
  const body = await c.req.json<{ token?: string; parentEmail?: string; consentUrl?: string; teenName?: string }>();
  if (body.parentEmail && body.consentUrl) {
    await sendParentConsentEmail(c.env, { to: body.parentEmail, consentUrl: body.consentUrl, teenName: body.teenName });
  }
  return c.json({ ok: true, token: body.token ?? null });
});

export default app;
