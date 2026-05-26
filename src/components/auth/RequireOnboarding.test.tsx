import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { useUserStore } from "../../stores/userStore";
import { RequireOnboarding } from "./RequireOnboarding";

/**
 * Regression tests for the post-#111 RequireOnboarding rewrite.
 *
 * The component is intentionally thin: it reads (hydrated,
 * onboardingCompletedAt) from useUserStore and renders one of three
 * states. Before #111 it owned its own api.getUser() fetch + a local
 * loading state, racing with AppDataHydrator. Tests below assert
 * each of the three branches so a future refactor that reintroduces
 * a fetch (or breaks the gate matrix) fails CI.
 *
 * `RequireAuth` (the inner wrapper) calls Clerk's `useAuth()`. Mock
 * the auth module here so this test doesn't need a ClerkProvider.
 */

vi.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
  useUser: () => ({ user: null })
}));

afterEach(() => {
  // Reset to the store's defaults so each test sets exactly the
  // state branch it cares about.
  useUserStore.setState({ hydrated: false, onboardingCompletedAt: null });
});

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={
            <RequireOnboarding>
              <div data-testid="protected-child">protected</div>
            </RequireOnboarding>
          }
        />
        <Route path="/onboarding" element={<div data-testid="onboarding-page">onboarding</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireOnboarding", () => {
  it("shows the loading shell while userStore hasn't hydrated", () => {
    useUserStore.setState({ hydrated: false, onboardingCompletedAt: null });
    renderAt("/");
    expect(screen.queryByTestId("protected-child")).toBeNull();
    expect(screen.queryByTestId("onboarding-page")).toBeNull();
    expect(screen.getByText(/loading kai/i)).toBeTruthy();
  });

  it("renders children when hydrated and onboarding is complete", () => {
    useUserStore.setState({ hydrated: true, onboardingCompletedAt: "2026-05-26T00:00:00Z" });
    renderAt("/");
    expect(screen.getByTestId("protected-child")).toBeTruthy();
    expect(screen.queryByTestId("onboarding-page")).toBeNull();
  });

  it("redirects to /onboarding when hydrated and onboardingCompletedAt is null", () => {
    useUserStore.setState({ hydrated: true, onboardingCompletedAt: null });
    renderAt("/");
    expect(screen.queryByTestId("protected-child")).toBeNull();
    expect(screen.getByTestId("onboarding-page")).toBeTruthy();
  });
});
