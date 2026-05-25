import { describe, expect, it } from "vitest";
import { useKaiStore } from "./kaiStore";

describe("kaiStore", () => {
  it("keeps persisted conversations scoped by engine", () => {
    useKaiStore.getState().hydrate("kai", {
      conversationId: "kai-conv",
      messages: [{ id: "k1", role: "assistant", content: "general kai" }]
    });
    useKaiStore.getState().hydrate("mental", {
      conversationId: "mental-conv",
      messages: [{ id: "m1", role: "assistant", content: "mental guide" }]
    });

    const state = useKaiStore.getState();
    expect(state.chats.kai.conversationId).toBe("kai-conv");
    expect(state.chats.kai.messages[0]?.content).toBe("general kai");
    expect(state.chats.mental.conversationId).toBe("mental-conv");
    expect(state.chats.mental.messages[0]?.content).toBe("mental guide");
  });

  it("cleans stale assistant copy that exposes old system language", () => {
    useKaiStore.getState().hydrate("kai", {
      conversationId: "old-copy",
      messages: [{ id: "old", role: "assistant", content: "You are in the mental agent right now." }]
    });

    expect(useKaiStore.getState().chats.kai.messages[0]?.content).toBe("Say it messy. We’ll make it simple.");
  });
});
