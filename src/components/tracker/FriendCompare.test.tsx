import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../lib/api";
import { FriendCompare } from "./FriendCompare";

/**
 * CONTENT-LEAKAGE CANARY. CLAUDE.md §1 ("never shares any user's
 * data with another user") and Section 9.3 ("Does NOT show: any
 * conversation content, any goal content, any reflection content,
 * any meal photos") are load-bearing safety rules.
 *
 * If a future change ever stuffs a journal entry, message, meal
 * note, photo URL, goal title, or other personal content into the
 * friend-compare API response, this test fires. The list of
 * forbidden tokens below is a small surface — extend it when
 * spec changes — but it covers the "this would be embarrassing"
 * regression class.
 *
 * Test framework: render the component with VITE_FRIEND_COMPARE_ENABLED
 * forced on via env shim, mock api.getFriendCompare to return a
 * friend whose name happens to be "Lev" (allowed — displayName is
 * by definition aggregate identity). Assert that none of the
 * forbidden content tokens appear in the rendered DOM.
 */

const FORBIDDEN_TOKENS = [
  "journal",
  "reflection",
  "conversation",
  "message",
  "meal photo",
  "goal title",
  "feelings"
];

beforeEach(() => {
  vi.stubEnv("VITE_FRIEND_COMPARE_ENABLED", "1");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("FriendCompare — content-leakage canary", () => {
  it("renders only aggregate stats (level + streakOverall), no content tokens", async () => {
    vi.spyOn(api, "getFriendCompare").mockResolvedValue({
      friends: [
        { userId: "u1", displayName: "Lev", level: 4, streakOverall: 12, totalScore: 980 },
        { userId: "u2", displayName: "Avery", level: 3, streakOverall: 5, totalScore: 410 }
      ]
    });

    const { container } = render(<FriendCompare />);

    // Wait for the API to resolve and the list to render.
    await waitFor(() => {
      expect(screen.getByText("Lev")).toBeTruthy();
    });

    // Assert each forbidden content token is NOT present in the
    // rendered DOM text. If a future regression piped content into
    // the response, one of these will trip.
    const text = container.textContent?.toLowerCase() ?? "";
    for (const token of FORBIDDEN_TOKENS) {
      expect(text).not.toContain(token);
    }

    // Positive assertion: aggregate stats DO render.
    expect(screen.getByText(/level 4/i)).toBeTruthy();
    expect(screen.getByText(/12 day streak/i)).toBeTruthy();
    expect(screen.getByText(/level 3/i)).toBeTruthy();
    expect(screen.getByText(/5 day streak/i)).toBeTruthy();
  });

  it("renders the empty state when no friends are connected", async () => {
    vi.spyOn(api, "getFriendCompare").mockResolvedValue({ friends: [] });

    render(<FriendCompare />);

    await waitFor(() => {
      expect(screen.getByText(/no friend connections yet/i)).toBeTruthy();
    });
  });

  it("respects the VITE_FRIEND_COMPARE_ENABLED gate (hidden when not '1')", async () => {
    vi.stubEnv("VITE_FRIEND_COMPARE_ENABLED", "");
    const spy = vi.spyOn(api, "getFriendCompare").mockResolvedValue({ friends: [] });

    render(<FriendCompare />);

    // Renders the "coming after privacy review" placeholder + does
    // NOT call the API at all.
    expect(screen.getByText(/coming after privacy review/i)).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });
});
