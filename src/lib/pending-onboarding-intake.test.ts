import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  flushPendingOnboardingIntake,
  hasPendingOnboardingIntake,
  queueOnboardingIntake,
} from "./pending-onboarding-intake";

const memory = new Map<string, string>();

beforeEach(() => {
  memory.clear();
  globalThis.localStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => { memory.set(k, v); },
    removeItem: (k: string) => { memory.delete(k); },
    clear: () => memory.clear(),
    key: (i: number) => Array.from(memory.keys())[i] ?? null,
    get length() { return memory.size; },
  } as unknown as Storage;
});

describe("pending onboarding intake", () => {
  it("queues intake responses for a later retry", () => {
    queueOnboardingIntake({ first_name: "Lev", focus_areas: "confidence" });

    expect(hasPendingOnboardingIntake()).toBe(true);
  });

  it("flushes and clears queued responses on success", async () => {
    const submit = vi.fn().mockResolvedValue({});
    queueOnboardingIntake({ first_name: "Lev" });

    await expect(flushPendingOnboardingIntake(submit)).resolves.toBe("flushed");

    expect(submit).toHaveBeenCalledWith({ first_name: "Lev" });
    expect(hasPendingOnboardingIntake()).toBe(false);
  });

  it("keeps queued responses if submission fails", async () => {
    const submit = vi.fn().mockRejectedValue(new Error("offline"));
    queueOnboardingIntake({ first_name: "Lev" });

    await expect(flushPendingOnboardingIntake(submit)).resolves.toBe("pending");

    expect(hasPendingOnboardingIntake()).toBe(true);
  });
});

