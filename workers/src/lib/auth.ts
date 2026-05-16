import { verifyToken } from "@clerk/backend";
import type { Context, Next } from "hono";
import type { AppVariables, Env } from "../types";

type AuthContext = Context<{ Bindings: Env; Variables: AppVariables }>;

export async function requireAuth(c: AuthContext, next: Next) {
  if (
    c.req.method === "OPTIONS" ||
    c.req.path === "/health" ||
    c.req.path === "/api/health" ||
    c.req.path === "/api/parent/consent" ||
    c.req.path === "/api/demo-feedback"
  ) {
    await next();
    return;
  }

  const devUser = c.req.header("x-dev-user");
  const isNonProd = c.env.APP_ENV === "development" || c.env.APP_ENV === "staging";
  if (devUser && isNonProd) {
    c.set("userId", devUser);
    c.set("isOps", true);
    await next();
    return;
  }

  const token = c.req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  if (!c.env.CLERK_SECRET_KEY) return c.json({ error: "Clerk is not configured" }, 503);

  try {
    const verified = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
      jwtKey: c.env.CLERK_JWT_KEY
    });
    if (!verified.sub) return c.json({ error: "Unauthorized" }, 401);
    const metadata = verified.metadata as { role?: string } | undefined;
    c.set("userId", verified.sub);
    c.set("isOps", Boolean(verified.org_role === "org:admin" || metadata?.role === "ops"));
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
}
