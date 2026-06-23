// PR 2 — System Health redesign, driven through the real System page.
// Seeds a one-action system, completes the action, and asserts the rewarding
// "+8 Body / System health increased / 0% → N%" feedback renders — and that the
// old "X/Y this week" weekly-% framing is gone.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../lib/api", () => ({ api: { scheduleGenerate: vi.fn() } }));

import { Schedule } from "./Schedule";

const SCHEDULE_KEY = "kai_schedule_v1";

function seedOneAction() {
  localStorage.setItem(
    SCHEDULE_KEY,
    JSON.stringify([
      {
        id: "w1",
        section: "training",
        title: "Upper Body Workout",
        detail: "",
        days: [],
        time: null,
        createdAt: new Date(0).toISOString(),
      },
    ]),
  );
}

beforeEach(() => {
  localStorage.clear();
  seedOneAction();
});
afterEach(() => localStorage.clear());

function renderSchedule() {
  return render(
    <MemoryRouter initialEntries={["/schedule"]}>
      <Schedule />
    </MemoryRouter>,
  );
}

describe("System Health page", () => {
  it("shows the System Health panel and drops the weekly-% framing", () => {
    renderSchedule();
    expect(screen.getByText(/system health/i)).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
    // The action advertises what it strengthens, not a weekly counter.
    expect(screen.getByText(/\+8 Body/i)).toBeInTheDocument();
    expect(screen.queryByText(/this week/i)).not.toBeInTheDocument();
  });

  it("rewards completing an action with a System Health bump", async () => {
    renderSchedule();
    fireEvent.click(screen.getByRole("button", { name: /mark "Upper Body Workout" done today/i }));

    // Reward toast: the attribute points + an increase + the before→after %.
    expect(await screen.findByText(/\+8 Body/i, { selector: "p" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/system health increased|system strengthened/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/0%\s*→\s*\d+%/)).toBeInTheDocument();
  });
});
