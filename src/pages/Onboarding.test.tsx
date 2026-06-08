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
    expect(screen.getByText("1 of 8")).toBeInTheDocument();
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

  it("walks through step order: name → age → focus → goal → follow-ups → meet → tone → confirm", async () => {
    renderOnboarding();

    // Step 1: name
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    await clickContinue();

    // Step 2: age — optional, NO parent email (any age continues)
    expect(await screen.findByText("2 of 8")).toBeInTheDocument();
    expect(screen.getByText(/built for you/i)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/parent@example\.com/i),
    ).not.toBeInTheDocument();
    await clickContinue();

    // Step 3: focus areas — multi-select, must pick at least one
    expect(await screen.findByText("3 of 8")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confidence/i }));
    fireEvent.click(screen.getByRole("button", { name: /better sleep/i }));
    await clickContinue();

    // Step 4: goal — the user's big goal, optional
    expect(await screen.findByText("4 of 8")).toBeInTheDocument();
    expect(screen.getByText(/working toward, Lev/i)).toBeInTheDocument();
    await clickContinue();

    // Step 5: Rawz/5 adaptive follow-ups — skippable, all answers optional
    expect(await screen.findByText("5 of 8")).toBeInTheDocument();
    await clickContinue();

    // Step 6: meet KAI — informational
    expect(await screen.findByText(/meet kai/i)).toBeInTheDocument();
    expect(screen.getByText("Mind")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    await clickContinue();

    // Step 7: tone
    expect(await screen.findByText("7 of 8")).toBeInTheDocument();
    expect(screen.getByText("Warm")).toBeInTheDocument();
    await clickContinue();

    // Step 8: confirm — final, button reads "Start"
    expect(await screen.findByText("8 of 8")).toBeInTheDocument();
    expect(screen.getByText(/you're set/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^start$/i }),
    ).toBeInTheDocument();
  });

  it("any age can continue without a parent email", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "A" },
    });
    await clickContinue();

    // A young age does NOT surface a parent-email field and does NOT block.
    fireEvent.change(screen.getByPlaceholderText(/age/i), {
      target: { value: "12" },
    });
    expect(
      screen.queryByPlaceholderText(/parent@example\.com/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).not.toBeDisabled();
  });

  it("saves the typed goal as the North Star and never calls sendParentConsent", async () => {
    const { getNorthStar } = await import("../lib/local-northstar");
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    await clickContinue();
    await clickContinue(); // age (skipped)
    fireEvent.click(screen.getByRole("button", { name: /confidence/i }));
    await clickContinue(); // focus → goal
    fireEvent.change(await screen.findByPlaceholderText(/build muscle/i), {
      target: { value: "Make the varsity team" },
    });
    await clickContinue(); // goal → follow-ups
    await clickContinue(); // follow-ups → meet
    await clickContinue(); // meet → tone
    await clickContinue(); // tone → confirm

    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));

    await waitFor(() => {
      expect(api.submitIntake).toHaveBeenCalledOnce();
      expect(api.updateUser).toHaveBeenCalledOnce();
    });
    expect(api.sendParentConsent).not.toHaveBeenCalled();
    expect(getNorthStar()?.goal).toBe("Make the varsity team");
  });
});
