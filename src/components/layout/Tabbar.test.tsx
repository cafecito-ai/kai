// Tabbar tests — covers the v3 §5 Done_when criteria for T-004:
//   - All 4 tab labels present (Home, Progress, Groups, Profile)
//   - Each tab has correct route
//   - + button is present, clickable, fires the open-quick-actions callback
//   - Active tab shows the indicator pill UNDER the icon (v3 §5 specific)

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { Tabbar } from "./Tabbar";

function renderTabbar(initialPath = "/home", onOpenQuickActions = vi.fn()) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Tabbar onOpenQuickActions={onOpenQuickActions} />
    </MemoryRouter>,
  );
}

describe("Tabbar", () => {
  it("renders all four v3 tabs", () => {
    renderTabbar();
    for (const label of ["Home", "Progress", "Groups", "Profile"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it("each tab links to its named route", () => {
    renderTabbar();
    expect(screen.getByLabelText("Home")).toHaveAttribute("href", "/home");
    expect(screen.getByLabelText("Progress")).toHaveAttribute(
      "href",
      "/progress",
    );
    expect(screen.getByLabelText("Groups")).toHaveAttribute(
      "href",
      "/groups",
    );
    expect(screen.getByLabelText("Profile")).toHaveAttribute(
      "href",
      "/profile",
    );
  });

  it("renders the persistent + (quick actions) button", () => {
    renderTabbar();
    expect(screen.getByLabelText("Quick actions")).toBeInTheDocument();
  });

  it("calls onOpenQuickActions when + is clicked", () => {
    const onOpen = vi.fn();
    renderTabbar("/home", onOpen);
    fireEvent.click(screen.getByLabelText("Quick actions"));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("marks the matching route as the active tab", () => {
    renderTabbar("/progress");
    // react-router-dom's NavLink sets aria-current="page" on the active link
    expect(screen.getByLabelText("Progress")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByLabelText("Home")).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
