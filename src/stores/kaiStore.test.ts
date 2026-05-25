import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../lib/api";
import { useKaiStore } from "./kaiStore";

describe("useKaiStore.send", () => {
  beforeEach(() => {
    useKaiStore.setState({
      conversationId: null,
      sending: false,
      messages: [{ id: "welcome", role: "assistant", content: "welcome" }]
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tags the assistant message with safetyEvent when the server flags content", async () => {
    const chatSpy = vi.spyOn(api, "chat").mockResolvedValue({
      conversationId: "conv-1",
      reply: "Hey. I hear you. What you're carrying is bigger than what I can help with directly.",
      safetyEvent: { id: "evt-1", category: "suicide_ideation", severity: "critical" }
    });

    await useKaiStore.getState().send("ordinary message that the local regex misses");

    expect(chatSpy).toHaveBeenCalledTimes(1);
    const messages = useKaiStore.getState().messages;
    const last = messages[messages.length - 1];
    expect(last.role).toBe("assistant");
    expect(last.safetyEvent).toEqual({ category: "suicide_ideation", severity: "critical" });
  });

  it("tags the assistant message with safetyEvent when the local regex flags content (and skips the server)", async () => {
    const chatSpy = vi.spyOn(api, "chat").mockResolvedValue({
      conversationId: "conv-1",
      reply: "should not be called",
      safetyEvent: null
    });

    await useKaiStore.getState().send("I want to kill myself");

    expect(chatSpy).not.toHaveBeenCalled();
    const messages = useKaiStore.getState().messages;
    const last = messages[messages.length - 1];
    expect(last.role).toBe("assistant");
    expect(last.safetyEvent?.category).toBe("suicide_ideation");
  });

  it("leaves safetyEvent unset for ordinary replies", async () => {
    vi.spyOn(api, "chat").mockResolvedValue({
      conversationId: "conv-1",
      reply: "Got it — what's making sleep hard?",
      safetyEvent: null
    });

    await useKaiStore.getState().send("I had trouble sleeping");

    const messages = useKaiStore.getState().messages;
    const last = messages[messages.length - 1];
    expect(last.role).toBe("assistant");
    expect(last.safetyEvent).toBeUndefined();
  });
});
