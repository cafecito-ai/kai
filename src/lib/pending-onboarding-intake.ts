import { api } from "./api";

const KEY = "kai_pending_onboarding_intake_v1";

type PendingIntake = {
  responses: Record<string, string>;
  attempts: number;
  queuedAt: string;
  lastAttemptAt?: string;
};

type SubmitIntake = (responses: Record<string, string>) => Promise<unknown>;

function readPending(): PendingIntake | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingIntake>;
    if (!parsed.responses || typeof parsed.responses !== "object") return null;
    return {
      responses: parsed.responses as Record<string, string>,
      attempts: typeof parsed.attempts === "number" ? parsed.attempts : 0,
      queuedAt: typeof parsed.queuedAt === "string" ? parsed.queuedAt : new Date().toISOString(),
      lastAttemptAt: typeof parsed.lastAttemptAt === "string" ? parsed.lastAttemptAt : undefined,
    };
  } catch {
    return null;
  }
}

function writePending(pending: PendingIntake): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(pending));
  } catch {
    /* localStorage can fail in private/quota-constrained contexts. */
  }
}

export function queueOnboardingIntake(responses: Record<string, string>): void {
  writePending({
    responses,
    attempts: 0,
    queuedAt: new Date().toISOString(),
  });
}

export function hasPendingOnboardingIntake(): boolean {
  return !!readPending();
}

export async function flushPendingOnboardingIntake(
  submit: SubmitIntake = api.submitIntake,
): Promise<"idle" | "flushed" | "pending"> {
  const pending = readPending();
  if (!pending) return "idle";
  const attempted: PendingIntake = {
    ...pending,
    attempts: pending.attempts + 1,
    lastAttemptAt: new Date().toISOString(),
  };
  writePending(attempted);
  try {
    await submit(pending.responses);
    if (typeof localStorage !== "undefined") localStorage.removeItem(KEY);
    return "flushed";
  } catch {
    return "pending";
  }
}

