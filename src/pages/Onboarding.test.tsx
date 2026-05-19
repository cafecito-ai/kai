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
    expect(screen.getByText("1 of 7")).toBeInTheDocument();
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

  it("walks through step order: name → age → focus → hardest → meet → tone → confirm", async () => {
    renderOnboarding();

    // Step 1: name
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    await clickContinue();

    // Step 2: age (16 → minor, requires parent email)
    expect(await screen.findByText("2 of 7")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/^age$/i), {
      target: { value: "16" },
    });
    fireEvent.change(
      await screen.findByPlaceholderText(/parent@example\.com/i),
      { target: { value: "p@example.com" } },
    );
    await clickContinue();

    // Step 3: focus areas — multi-select, must pick at least one
    expect(await screen.findByText("3 of 7")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /confidence/i }));
    fireEvent.click(screen.getByRole("button", { name: /better sleep/i }));
    await clickContinue();

    // Step 4: hardest lately — optional, can skip
    expect(await screen.findByText("4 of 7")).toBeInTheDocument();
    expect(screen.getByText(/hardest lately/i)).toBeInTheDocument();
    await clickContinue();

    // Step 5: meet KAI — informational
    expect(await screen.findByText(/meet kai/i)).toBeInTheDocument();
    expect(screen.getByText("Mind")).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    await clickContinue();

    // Step 6: tone
    expect(await screen.findByText("6 of 7")).toBeInTheDocument();
    expect(screen.getByText("Warm")).toBeInTheDocument();
    expect(screen.getByText("Balanced")).toBeInTheDocument();
    expect(screen.getByText("Direct")).toBeInTheDocument();
    await clickContinue();

    // Step 7: confirm — final, button reads "Start"
    expect(await screen.findByText("7 of 7")).toBeInTheDocument();
    expect(screen.getByText(/you're set/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^start$/i }),
    ).toBeInTheDocument();
  });

  it("requires parent email when under 18, allows skip when adult", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "A" },
    });
    await clickContinue();

    // Under-18 path
    fireEvent.change(screen.getByPlaceholderText(/^age$/i), {
      target: { value: "15" },
    });
    expect(
      await screen.findByPlaceholderText(/parent@example\.com/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    // Switch to adult age — parent email field disappears
    fireEvent.change(screen.getByPlaceholderText(/^age$/i), {
      target: { value: "19" },
    });
    expect(
      screen.queryByPlaceholderText(/parent@example\.com/i),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).not.toBeDisabled();
  });

  it("sends parental consent on finish for minors", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "Lev" },
    });
    await clickContinue();
    fireEvent.change(screen.getByPlaceholderText(/^age$/i), {
      target: { value: "16" },
    });
    fireEvent.change(
      await screen.findByPlaceholderText(/parent@example\.com/i),
      { target: { value: "p@example.com" } },
    );
    await clickContinue();
    fireEvent.click(screen.getByRole("button", { name: /confidence/i }));
    await clickContinue(); // focus → hardest
    await clickContinue(); // hardest → meet
    await clickContinue(); // meet → tone
    await clickContinue(); // tone → confirm

    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));

    await waitFor(() => {
      expect(api.submitIntake).toHaveBeenCalledOnce();
      expect(api.updateUser).toHaveBeenCalledOnce();
      expect(api.sendParentConsent).toHaveBeenCalledWith({
        parentEmail: "p@example.com",
        teenName: "Lev",
      });
    });
  });

  it("does NOT call sendParentConsent for adults", async () => {
    renderOnboarding();
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: "A" },
    });
    await clickContinue();
    fireEvent.change(screen.getByPlaceholderText(/^age$/i), {
      target: { value: "21" },
    });
    await clickContinue();
    fireEvent.click(screen.getByRole("button", { name: /confidence/i }));
    await clickContinue();
    await clickContinue();
    await clickContinue();
    await clickContinue();
    fireEvent.click(screen.getByRole("button", { name: /^start$/i }));
    await waitFor(() => {
      expect(api.submitIntake).toHaveBeenCalledOnce();
      expect(api.updateUser).toHaveBeenCalledOnce();
    });
    expect(api.sendParentConsent).not.toHaveBeenCalled();
  });
});
