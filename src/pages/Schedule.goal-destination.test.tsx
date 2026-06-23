// PR 3 — goal-as-destination block on the System page: visual target, AI
// timeline (cached), and consistency-driven progress + projected finish.

import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

vi.mock("../lib/api", () => ({
  api: {
    scheduleGenerate: vi.fn(),
    estimateGoalTimeline: vi
      .fn()
      .mockResolvedValue({ estimate: { weeks: 10, rationale: "Steady reps get you there.", factors: [] } }),
  },
}));

import { Schedule } from "./Schedule";
import { saveCachedTimeline } from "../lib/local-goal";
import { localDateKey, addDays } from "./../lib/dates";

const SCHEDULE_KEY = "kai_schedule_v1";
const SYSTEM_GOAL_KEY = "kai_system_goal_v1";
const DONE_KEY = "kai_system_done_v1";
const STARTED_KEY = "kai_identity_started_v1";
const OLD = new Date(0).toISOString();

beforeEach(() => {
  localStorage.clear();
  // A one-action system.
  localStorage.setItem(
    SCHEDULE_KEY,
    JSON.stringify([
      { id: "d1", section: "daily", title: "Move", detail: "", days: [], time: null, createdAt: OLD },
    ]),
  );
  localStorage.setItem(SYSTEM_GOAL_KEY, JSON.stringify("Get stronger"));
  // Started 5 weeks ago, and consistent (done every day in the window) so
  // progress is clearly > 0.
  const now = new Date();
  localStorage.setItem(STARTED_KEY, localDateKey(addDays(now, -35)));
  const map: Record<string, string[]> = {};
  for (let d = 0; d < 14; d += 1) map[localDateKey(addDays(now, -d))] = ["d1"];
  localStorage.setItem(DONE_KEY, JSON.stringify(map));
  // Pre-seed the AI timeline estimate so the block has data without the network.
  saveCachedTimeline("Get stronger", { weeks: 10, rationale: "Steady reps get you there.", factors: [] });
});

afterEach(() => localStorage.clear());

describe("Goal as destination", () => {
  it("shows the goal, a progress bar toward it, and a projected pace", async () => {
    render(
      <MemoryRouter initialEntries={["/schedule"]}>
        <Schedule />
      </MemoryRouter>,
    );

    expect(screen.getByText("Your goal")).toBeInTheDocument();
    // Title shows in the page header and the destination block.
    expect(screen.getAllByText("Get Stronger").length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByText(/% there/)).toBeInTheDocument());
    expect(screen.getByText(/on this pace/i)).toBeInTheDocument();
    expect(screen.getByText(/steady reps get you there/i)).toBeInTheDocument();
  });
});
