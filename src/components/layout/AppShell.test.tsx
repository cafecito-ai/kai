// AppShell tests — verifies the chrome-vs-immersive routing logic
// per T-004 Done_when ("AppShell renders on every page; tabbar visible
// at the bottom of every screen on mobile").

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "./AppShell";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/home" element={<div>HOME CONTENT</div>} />
          <Route path="/groups" element={<div>GROUPS CONTENT</div>} />
          <Route path="/_design-tokens" element={<div>DT CONTENT</div>} />
          <Route path="/onboarding" element={<div>ONBOARDING</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  it("renders Outlet content at /home", () => {
    renderAt("/home");
    expect(screen.getByText("HOME CONTENT")).toBeInTheDocument();
  });

  it("shows the tabbar on tabbed routes", () => {
    renderAt("/home");
    expect(screen.getByLabelText("Primary navigation")).toBeInTheDocument();
    expect(screen.getByLabelText("Quick actions")).toBeInTheDocument();
  });

  it("shows the tabbar on /groups (Phase G placeholder)", () => {
    renderAt("/groups");
    expect(screen.getByLabelText("Primary navigation")).toBeInTheDocument();
  });

  it("hides the tabbar on immersive routes like /_design-tokens", () => {
    renderAt("/_design-tokens");
    expect(
      screen.queryByLabelText("Primary navigation"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("DT CONTENT")).toBeInTheDocument();
  });

  it("hides the tabbar on /onboarding (no chrome during signup)", () => {
    renderAt("/onboarding");
    expect(
      screen.queryByLabelText("Primary navigation"),
    ).not.toBeInTheDocument();
  });

  it("provides a skip-to-content link for keyboard users (WCAG 2.4.1)", () => {
    renderAt("/home");
    expect(
      screen.getByRole("link", { name: /skip to content/i }),
    ).toBeInTheDocument();
  });
});
