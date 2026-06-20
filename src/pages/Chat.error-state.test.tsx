// Bucket 1 — chat error state (driving the real UI in jsdom).
//
// The client's #1 ask: when KAI can't respond, the UI must show an error/retry
// state, NOT a fabricated "I lost the thread" bubble. This renders the real
// Chat page, makes the API fail, and asserts: no fake reply, an honest notice,
// a Try again button — and that retry recovers with the real reply.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const chat = vi.fn();
const getCurrentConversation = vi.fn().mockResolvedValue({ conversationId: null, messages: [] });

vi.mock("../lib/api", () => ({
  api: {
    chat: (...args: unknown[]) => chat(...args),
    getCurrentConversation: (...args: unknown[]) => getCurrentConversation(...args),
  },
}));

import { Chat } from "./Chat";

function renderChat() {
  return render(
    <MemoryRouter initialEntries={["/chat"]}>
      <Chat />
    </MemoryRouter>,
  );
}

async function sendMessage(text: string) {
  const input = await screen.findByPlaceholderText("Say it messy.");
  fireEvent.change(input, { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentConversation.mockResolvedValue({ conversationId: null, messages: [] });
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Chat — model-unavailable error state", () => {
  it("shows an honest retry state instead of a fabricated reply when the model is down", async () => {
    chat.mockRejectedValue(new Error("model_unavailable"));
    renderChat();

    await sendMessage("I can't sleep");

    // The error notice + Try again appear once retries are exhausted.
    await waitFor(
      () => expect(screen.getByText(/couldn't reach kai/i)).toBeInTheDocument(),
      { timeout: 4000 },
    );
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();

    // The user's message stays in the thread...
    expect(screen.getByText("I can't sleep")).toBeInTheDocument();
    // ...and crucially there is NO fake in-voice fallback bubble.
    expect(screen.queryByText(/lost the thread/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/say that again/i)).not.toBeInTheDocument();
  });

  it("recovers with the real reply when Try again succeeds", async () => {
    chat.mockRejectedValue(new Error("model_unavailable"));
    renderChat();
    await sendMessage("I can't sleep");
    await waitFor(
      () => expect(screen.getByText(/couldn't reach kai/i)).toBeInTheDocument(),
      { timeout: 4000 },
    );

    // Model comes back; retry should land the real reply and clear the notice.
    chat.mockResolvedValue({ conversationId: "c1", reply: "Here's the real read, and one thing to try tonight." });
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));

    await waitFor(() =>
      expect(screen.getByText(/here's the real read/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/couldn't reach kai/i)).not.toBeInTheDocument();
  });
});
