// QuickActionSheet tests — covers the working + action set.

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { QuickActionSheet } from "./QuickActionSheet";

function renderSheet(open: boolean, onClose = vi.fn()) {
  return render(
    <MemoryRouter>
      <QuickActionSheet open={open} onClose={onClose} />
    </MemoryRouter>,
  );
}

describe("QuickActionSheet", () => {
  it("renders nothing when closed", () => {
    renderSheet(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders all v3 quick actions when open", () => {
    renderSheet(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    for (const label of [
      "Check in",
      "Log workout",
      "Log food",
      "Journal",
      "Energy check",
      "Log sleep",
      "Set a goal",
      "Stretch / move",
      "Body scan",
      "Call KAI",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("closes when the explicit close button is clicked", () => {
    const onClose = vi.fn();
    renderSheet(true, onClose);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes when the scrim is clicked", () => {
    const onClose = vi.fn();
    renderSheet(true, onClose);
    fireEvent.click(screen.getByLabelText("Close quick actions"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes when Escape is pressed", () => {
    const onClose = vi.fn();
    renderSheet(true, onClose);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
