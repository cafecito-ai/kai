import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CinematicGeneration } from "./CinematicGeneration";

const STEPS = ["Understanding you…", "Building your personalized system…", "Personalizing Kai…"];

describe("CinematicGeneration", () => {
  it("renders the current step's status line", () => {
    render(<CinematicGeneration stepIndex={1} steps={STEPS} />);
    expect(screen.getByText("Building your personalized system…")).toBeInTheDocument();
  });

  it("clamps an out-of-range step to the last line", () => {
    render(<CinematicGeneration stepIndex={99} steps={STEPS} />);
    expect(screen.getByText("Personalizing Kai…")).toBeInTheDocument();
  });
});
