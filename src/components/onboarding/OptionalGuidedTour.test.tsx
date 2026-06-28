import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GuidedTour } from "./GuidedTour";
import { OptionalGuidedTour } from "./OptionalGuidedTour";

describe("OptionalGuidedTour", () => {
  it("offers the tour and completes immediately when skipped", () => {
    const onComplete = vi.fn();
    render(<OptionalGuidedTour onComplete={onComplete} />);
    expect(screen.getByText(/show you around/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /figure it out/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("starts the walkthrough when accepted", () => {
    render(<OptionalGuidedTour onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /show me around/i }));
    // First tour beat is now visible.
    expect(screen.getByText(/your whole day/i)).toBeInTheDocument();
  });
});

describe("GuidedTour", () => {
  it("advances through the beats and completes on the last tap", () => {
    const onComplete = vi.fn();
    render(<GuidedTour onComplete={onComplete} />);
    const next = screen.getByRole("button", { name: /next/i });
    // 5 beats → 5 advances; the 5th (from the last beat) fires onComplete.
    for (let i = 0; i < 5; i++) fireEvent.click(next);
    expect(onComplete).toHaveBeenCalled();
  });

  it("can be skipped straight to the finish", () => {
    const onComplete = vi.fn();
    render(<GuidedTour onComplete={onComplete} />);
    fireEvent.click(screen.getByText(/^skip$/i));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
