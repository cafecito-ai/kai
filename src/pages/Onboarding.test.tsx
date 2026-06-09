// Onboarding tests — covers the v3 §4 7-step flow.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { Onboarding } from "./Onboarding";
import { api } from "../lib/api";

// The Onboarding page calls api.submitIntake / updateUser / sendParentConsent
// on finish. Stub them so the test doesn't hit a real backend.
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

async function clickContinue() {
  const continueBtn = await screen.findByRole("button", { name: /continue/i });
  fireEvent.click(continueBtn);
}

beforeEach(() => {
  vi.clearAllMocks();
  // Remove the demo-carryover key in case a prior test (or jsdom warm-cache)
  // left it. Not using `clear()` because jsdom's Storage impl in this version
  // lacks it.
  try {
    localStorage.removeItem("kai_demo_build_v1");
  } catch {
    /* localStorage unavailable in this env — fine */
  }
});
afterEach(() => {
  try {
    localStorage.removeItem("kai_demo_build_v1");
  } catch {
    /* noop */
  }
});

describe("Onboarding (v3 §4)", () => {
  it("shows step 1 (name) on first render", () => {
    renderOnboarding();
    expect(screen.getByText("1 of 10")).toBeInTheDocument();
    expect(
      screen.getByText(/what should kai call you/i),
    ).toBeInTheDocument();
  });

  it("blocks Continue until a name is entered", () => {
    renderOnboarding();
    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    expect(continueBtn).not.toBeDisabled();
  });

  it("walks through step order incl. schedule step → confirm", async () => {
    renderOnboarding();

    // Step 1: name
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    await clickContinue();

    // Step 2: age — optional, no parent verification
    expect(await screen.findByText("2 of 10")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/^age$/i), {
      target: { value: "16" },
    });
    await clickContinue();

    // Step 3: focus areas — multi-select, must pick at least one
    expect(await screen.findByText("3 of 10")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confidence/i }));
    fireEvent.click(screen.getByRole("button", { name: /better sleep/i }));
    await clickContinue();

    // Step 4: hardest lately
    expect(await screen.findByText("4 of 10")).toBeInTheDocument();
    await clickContinue();

    // Step 5: adaptive follow-ups
    expect(await screen.findByText("5 of 10")).toBeInTheDocument();
    await clickContinue();

    // Step 6: meet KAI
    expect(await screen.findByText(/meet kai/i)).toBeInTheDocument();
    await clickContinue();

    // Step 7: tone
    expect(await screen.findByText("7 of 10")).toBeInTheDocument();
    await clickContinue();

    // Step 8: big goal
    expect(await screen.findByText("8 of 10")).toBeInTheDocument();
    expect(screen.getByText(/what are you working toward/i)).toBeInTheDocument();
    await clickContinue();

    // Step 9: schedule — optional yes/no
    expect(await screen.findByText("9 of 10")).toBeInTheDocument();
    expect(screen.getByText(/build your system/i)).toBeInTheDocument();
    await clickContinue();

    // Step 10: confirm — final, button reads "Start"
    expect(await screen.findByText("10 of 10")).toBeInTheDocument();
    expect(screen.getByText(/you're set/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^start$/i }),
    ).toBeInTheDocument();
  });

  it("no longer asks for a parent email, and never gates the age step", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "A" },
    });
    await clickContinue();

    // Any age can continue — no parent-email field, no verification gate.
    fireEvent.change(screen.getByPlaceholderText(/^age$/i), {
      target: { value: "15" },
    });
    expect(
      screen.queryByPlaceholderText(/parent@example\.com/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).not.toBeDisabled();
  });

  it("never sends parental consent (consent flow removed)", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    await clickContinue();
    fireEvent.change(screen.getByPlaceholderText(/^age$/i), {
      target: { value: "16" },
    });
    await clickContinue();
    fireEvent.click(screen.getByRole("button", { name: /confidence/i }));
    await clickContinue(); // focus → hardest
    await clickContinue(); // hardest → follow-ups (Rawz/5)
    await clickContinue(); // follow-ups → meet
    await clickContinue(); // meet → tone
    await clickContinue(); // tone → big goal
    await clickContinue(); // big goal → schedule
    await clickContinue(); // schedule → confirm
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    await waitFor(() => {
      expect(api.submitIntake).toHaveBeenCalledOnce();
      expect(api.updateUser).toHaveBeenCalledOnce();
    });
    expect(api.sendParentConsent).not.toHaveBeenCalled();
  });
});
