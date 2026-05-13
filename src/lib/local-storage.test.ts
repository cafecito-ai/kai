import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearKey,
  loadJSON,
  namespacedKey,
  saveJSON
} from "./local-storage";

const memory = new Map<string, string>();
const memoryStorage = {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => {
    memory.set(k, v);
  },
  removeItem: (k: string) => {
    memory.delete(k);
  },
  clear: () => memory.clear(),
  key: (i: number) => Array.from(memory.keys())[i] ?? null,
  get length() {
    return memory.size;
  }
};

beforeEach(() => {
  memory.clear();
  // @ts-expect-error - shim for non-jsdom envs
  globalThis.localStorage = memoryStorage;
});

afterEach(() => {
  memory.clear();
});

describe("namespacedKey", () => {
  it("returns the plain key when no userId is given", () => {
    expect(namespacedKey("kai_mood_log_v1")).toBe("kai_mood_log_v1");
    expect(namespacedKey("kai_mood_log_v1", null)).toBe("kai_mood_log_v1");
    expect(namespacedKey("kai_mood_log_v1", undefined)).toBe("kai_mood_log_v1");
    expect(namespacedKey("kai_mood_log_v1", "")).toBe("kai_mood_log_v1");
  });

  it("prefixes the key with the user id when present", () => {
    expect(namespacedKey("kai_mood_log_v1", "user_abc123")).toBe(
      "u_user_abc123__kai_mood_log_v1"
    );
  });

  it("yields different keys for different users on the same base key", () => {
    expect(namespacedKey("kai_cycle_v1", "alice")).not.toBe(
      namespacedKey("kai_cycle_v1", "bob")
    );
  });
});

describe("loadJSON / saveJSON / clearKey", () => {
  it("round-trips data namespaced by user", () => {
    saveJSON("kai_x", "alice", { entries: [1, 2, 3] });
    expect(loadJSON("kai_x", "alice", { entries: [] })).toEqual({ entries: [1, 2, 3] });
  });

  it("does NOT leak data between users", () => {
    saveJSON("kai_x", "alice", { entries: ["A"] });
    saveJSON("kai_x", "bob", { entries: ["B"] });
    expect(loadJSON("kai_x", "alice", { entries: [] })).toEqual({ entries: ["A"] });
    expect(loadJSON("kai_x", "bob", { entries: [] })).toEqual({ entries: ["B"] });
  });

  it("anonymous reads don't see signed-in data", () => {
    saveJSON("kai_x", "alice", { entries: ["A"] });
    expect(loadJSON("kai_x", null, { entries: [] })).toEqual({ entries: [] });
  });

  it("returns the fallback on parse error", () => {
    memoryStorage.setItem(namespacedKey("kai_x", "alice"), "{not valid json");
    expect(loadJSON("kai_x", "alice", { entries: [] })).toEqual({ entries: [] });
  });

  it("returns the fallback when nothing is stored", () => {
    expect(loadJSON("kai_x", "alice", { entries: [] })).toEqual({ entries: [] });
  });

  it("clearKey only removes that user's data", () => {
    saveJSON("kai_x", "alice", { entries: ["A"] });
    saveJSON("kai_x", "bob", { entries: ["B"] });
    clearKey("kai_x", "alice");
    expect(loadJSON("kai_x", "alice", { entries: [] })).toEqual({ entries: [] });
    expect(loadJSON("kai_x", "bob", { entries: [] })).toEqual({ entries: ["B"] });
  });
});
