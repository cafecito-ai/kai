// Onboarding tests — covers the merged cinematic, KAI-led flow.
//
// The flow is: a couple of tap-to-advance intro stages, then KAI asks the
// questions with input panels. Lines render via CSS pop (no timers), so the
// walk is deterministic in jsdom; we use async findBy* at boundaries.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { Onboarding } from "./Onboarding";
import { api } from "../lib/api";
import { getIdentityStatement, getOriginStory } from "../lib/local-identity";
import { pickFollowUps } from "../lib/onboarding-followups";

vi.mock("../lib/api", () => ({
  api: {
    submitIntake: vi.fn().mockResolvedValue({}),
    updateUser: vi.fn().mockResolvedValue({}),
    sendParentConsent: vi.fn().mockResolvedValue({}),
    scheduleGenerate: vi.fn().mockResolvedValue({ items: [] }),
  },
}));

function renderOnboarding() {
  return render(
    <MemoryRouter initialEntries={["/onboarding"]}>
      <Onboarding />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ["kai_demo_build_v1", "kai_walkthrough_seen_v1"]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* localStorage unavailable — fine */
    }
  }
});
afterEach(() => {
  for (const k of ["kai_demo_build_v1", "kai_walkthrough_seen_v1"]) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* noop */
    }
  }
});

// Tap through the Kai-led intro stages (who Kai is, what he does, how the
// Score + System work) into the first question (name).
async function passIntro() {
  fireEvent.click(await screen.findByText(/I'm KAI/i));
  fireEvent.click(await screen.findByText(/not just some chatbot/i));
  fireEvent.click(await screen.findByText(/thinking off your plate/i));
  fireEvent.click(await screen.findByText(/what moves it/i));
  fireEvent.click(await screen.findByText(/System gets stronger/i));
  fireEvent.click(await screen.findByText(/let me learn about you/i));
}

// Walk the whole flow up to (but not clicking) the finale Start.
async function walkToFinale() {
  await passIntro();
  // name
  fireEvent.change(await screen.findByPlaceholderText(/first name/i), {
    target: { value: "Lev" },
  });
  fireEvent.click(screen.getByRole("button", { name: /send/i }));
  // age — skip
  fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
  // focus — pick two, send
  fireEvent.click(await screen.findByRole("button", { name: /confidence/i }));
  fireEvent.click(screen.getByRole("button", { name: /better sleep/i }));
  fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
  // hardest + adaptive follow-ups — all skippable (blocker now comes later)
  const followCount = pickFollowUps(["confidence", "better_sleep"]).length;
  for (let i = 0; i < followCount + 1; i++) {
    fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
  }
  // tone
  fireEvent.click(await screen.findByRole("button", { name: /warm/i }));
  // goal, identity, why, photo — skip
  for (let i = 0; i < 4; i++) {
    fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
  }
  // meet (intro interstitial, after they've described themselves) — tap to advance
  fireEvent.click(await screen.findByText(/become the person you just described/i));
  // blocker — skip
  fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
  // finale
  await screen.findByRole("button", { name: /^start/i });
}

describe("Onboarding (cinematic)", () => {
  it("opens on the intro and reaches the name question after taps", async () => {
    renderOnboarding();
    expect(await screen.findByText(/I'm KAI/i)).toBeInTheDocument();
    await passIntro();
    expect(await screen.findByPlaceholderText(/first name/i)).toBeInTheDocument();
    expect(screen.getByText(/what should i call you/i)).toBeInTheDocument();
  });

  it("explains who Kai is and how the Score + System work BEFORE asking for a name", async () => {
    renderOnboarding();
    // Kai introduces himself as more than a chatbot.
    fireEvent.click(await screen.findByText(/I'm KAI/i));
    expect(await screen.findByText(/not just some chatbot/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/not just some chatbot/i));
    // What he helps with.
    expect(await screen.findByText(/thinking off your plate/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/thinking off your plate/i));
    // The Daily Score is explained.
    expect(await screen.findByText(/what moves it/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/what moves it/i));
    // The System is explained.
    expect(await screen.findByText(/System gets stronger/i)).toBeInTheDocument();
    // Still no name field yet — the explanation comes first.
    expect(screen.queryByPlaceholderText(/first name/i)).not.toBeInTheDocument();
  });

  it("blocks Send until a name is entered", async () => {
    renderOnboarding();
    await passIntro();
    const input = await screen.findByPlaceholderText(/first name/i);
    const send = screen.getByRole("button", { name: /send/i });
    expect(send).toBeDisabled();
    fireEvent.change(input, { target: { value: "Lev" } });
    expect(send).not.toBeDisabled();
  });

  it("walks the full conversation to the finale", async () => {
    renderOnboarding();
    await walkToFinale();
    expect(await screen.findByRole("button", { name: /^start/i })).toBeInTheDocument();
  });

  it("stores the identity statement and origin story as DISTINCT values", async () => {
    renderOnboarding();
    await passIntro();
    // name
    fireEvent.change(await screen.findByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    // age — skip
    fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
    // focus — pick two, send
    fireEvent.click(await screen.findByRole("button", { name: /confidence/i }));
    fireEvent.click(screen.getByRole("button", { name: /better sleep/i }));
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    // hardest + follow-ups — skip
    const followCount = pickFollowUps(["confidence", "better_sleep"]).length;
    for (let i = 0; i < followCount + 1; i++) {
      fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
    }
    // tone
    fireEvent.click(await screen.findByRole("button", { name: /warm/i }));
    // goal — skip
    fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
    // identity statement — fill it
    fireEvent.change(await screen.findByPlaceholderText(/keeps his word/i), {
      target: { value: "Someone who keeps his word" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    // origin story ("why are you downloading Rawz today") — fill it differently
    fireEvent.change(await screen.findByPlaceholderText(/wasting my potential/i), {
      target: { value: "I'm tired of wasting my potential" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    // photo — skip
    fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
    // meet — tap to advance
    fireEvent.click(await screen.findByText(/become the person you just described/i));
    // blocker — skip
    fireEvent.click(await screen.findByRole("button", { name: /^skip$/i }));
    // finale
    fireEvent.click(await screen.findByRole("button", { name: /^start/i }));

    await waitFor(() => expect(api.updateUser).toHaveBeenCalledOnce());
    expect(getIdentityStatement()).toBe("Someone who keeps his word");
    expect(getOriginStory()).toBe("I'm tired of wasting my potential");
  });

  it("never gates age and never asks for a parent email", async () => {
    renderOnboarding();
    await passIntro();
    fireEvent.change(await screen.findByPlaceholderText(/first name/i), {
      target: { value: "A" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    const ageInput = await screen.findByPlaceholderText(/^age$/i);
    expect(
      screen.queryByPlaceholderText(/parent@example\.com/i),
    ).not.toBeInTheDocument();
    fireEvent.change(ageInput, { target: { value: "15" } });
    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
  });

  it("updates the user once on finish, and never sends parental consent", async () => {
    renderOnboarding();
    await walkToFinale();
    fireEvent.click(screen.getByRole("button", { name: /^start/i }));
    await waitFor(() => {
      expect(api.updateUser).toHaveBeenCalledOnce();
    });
    // Intake is queued + flushed (api.submitIntake) via the intake-retry path,
    // which is covered by pending-onboarding-intake's own tests.
    expect(api.sendParentConsent).not.toHaveBeenCalled();
  });
});
