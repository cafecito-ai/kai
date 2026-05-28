// Onboarding tests — covers the v3 §4 flow plus Day 0.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { Onboarding } from "./Onboarding";
import { api } from "../lib/api";

// The Onboarding page calls api.submitIntake / updateUser on finish.
// Stub them so the test doesn't hit a real backend.
vi.mock("../lib/api", () => ({
  api: {
    submitIntake: vi.fn().mockResolvedValue({}),
    updateUser: vi.fn().mockResolvedValue({}),
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
  it("shows the welcome opener on first render", () => {
    renderOnboarding();
    expect(
      screen.getByText(/let's build your personalized system/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^start$/i })).toBeEnabled();
  });

  it("keeps the name step optional", async () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    expect(await screen.findByText("1 of 8")).toBeInTheDocument();
    expect(screen.getByText(/what should kai call you/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("walks through step order: welcome → name → focus → hardest → follow-ups → meet → tone → day 0 → confirm", async () => {
    renderOnboarding();

    // Welcome
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));

    // Step 1: name
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    await clickContinue();

    // Step 2: focus areas — multi-select, must pick at least one
    expect(await screen.findByText("2 of 8")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confidence/i }));
    fireEvent.click(screen.getByRole("button", { name: /better sleep/i }));
    await clickContinue();

    // Step 3: hardest lately — optional, can skip
    expect(await screen.findByText("3 of 8")).toBeInTheDocument();
    expect(screen.getByText(/hardest lately/i)).toBeInTheDocument();
    await clickContinue();

    // Step 4: adaptive follow-ups — skippable, all answers optional
    expect(await screen.findByText("4 of 8")).toBeInTheDocument();
    await clickContinue();

    // Step 5: meet KAI — informational
    expect(await screen.findByText(/meet kai/i)).toBeInTheDocument();
    expect(screen.getByText("Mind")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    await clickContinue();

    // Step 6: tone
    expect(await screen.findByText("6 of 8")).toBeInTheDocument();
    expect(screen.getByText("Warm")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Direct")).toBeInTheDocument();
    await clickContinue();

    // Step 7: Day 0 — optional
    expect(await screen.findByText("7 of 8")).toBeInTheDocument();
    expect(screen.getByText(/record day 0/i)).toBeInTheDocument();
    await clickContinue();

    // Step 8: confirm — final, button reads "Start"
    expect(await screen.findByText("8 of 8")).toBeInTheDocument();
    expect(screen.getByText(/you're set/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^start$/i }),
    ).toBeInTheDocument();
  });

  it("does not ask for age or parent email", async () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "A" },
    });
    await clickContinue();

    expect(screen.queryByPlaceholderText(/^age$/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/parent@example\.com/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeDisabled();
  });

  it("saves onboarding without parent consent", async () => {
    renderOnboarding();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    await clickContinue();
    fireEvent.click(screen.getByRole("button", { name: /confidence/i }));
    await clickContinue(); // focus → hardest
    await clickContinue(); // hardest → follow-ups
    await clickContinue(); // follow-ups → meet
    await clickContinue(); // meet → tone
    await clickContinue(); // tone → day 0
    await clickContinue(); // day 0 → confirm

    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));

    await waitFor(() => {
      expect(api.submitIntake).toHaveBeenCalledOnce();
      expect(api.updateUser).toHaveBeenCalledOnce();
      expect(api.updateUser).toHaveBeenCalledWith(
        expect.not.objectContaining({
          age: expect.anything(),
          parentEmail: expect.anything(),
        }),
      );
    });
  });
});
