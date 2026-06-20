// Bucket 2 — Home quick action opens a fresh chat where KAI understands first.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const chat = vi.fn();
const getCurrentConversation = vi.fn();

vi.mock("../lib/api", () => ({
  api: {
    chat: (...args: unknown[]) => chat(...args),
    getCurrentConversation: (...args: unknown[]) => getCurrentConversation(...args),
    scheduleGenerate: vi.fn(),
  },
}));

import { Chat } from "./Chat";

function renderQuickAction(topic: string) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/chat", state: { quickAction: topic } }]}>
      <Chat />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(() => vi.restoreAllMocks());

describe("Chat — Home quick action", () => {
  it("opens a brand-new chat with KAI's understand-first opener and cause chips", async () => {
    renderQuickAction("sleep");

    // KAI opens by understanding first — not by dumping advice.
    expect(await screen.findByText(/can't sleep\?/i)).toBeInTheDocument();
    expect(screen.getByText("My mind's racing")).toBeInTheDocument();

    // It never tried to continue the previous conversation.
    expect(getCurrentConversation).not.toHaveBeenCalled();
  });

  it("sends the cause as a self-contained message into a fresh (null) conversation", async () => {
    chat.mockResolvedValue({ conversationId: "new1", reply: "Racing mind — let's slow it down." });
    renderQuickAction("sleep");

    fireEvent.click(await screen.findByText("My mind's racing"));

    await waitFor(() => expect(chat).toHaveBeenCalledTimes(1));
    const [engine, message, conversationId] = chat.mock.calls[0];
    expect(engine).toBe("kai");
    expect(message).toBe("I can't sleep — my mind won't stop racing.");
    expect(conversationId).toBeNull();
    expect(await screen.findByText(/let's slow it down/i)).toBeInTheDocument();
  });
});
