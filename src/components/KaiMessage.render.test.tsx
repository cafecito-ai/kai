// Bucket 1 — scannable message rendering (driving the real component).
//
// The bubble used to dump a reply into one node, collapsing line breaks and
// lists into a wall. This renders the real KaiMessage and asserts a multi-part
// reply comes out as separate paragraphs + a real list — and that a single
// flowing reply stays one paragraph (no invented structure).

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KaiMessage } from "./KaiMessage";

describe("KaiMessage — scannable rendering", () => {
  it("renders distinct thoughts as separate paragraphs and a numbered list", () => {
    const reply =
      "Can't sleep tonight, got it.\n\nLet's aim this right:\n1) Phone across the room\n2) Lights low for ten minutes";
    const { container } = render(<KaiMessage>{reply}</KaiMessage>);

    const paragraphs = container.querySelectorAll("p");
    // The two prose lines become two paragraphs (KaiMessage has no timestamp <p>).
    expect(paragraphs.length).toBe(2);

    const list = container.querySelector("ol");
    expect(list).not.toBeNull();
    expect(list!.querySelectorAll("li").length).toBe(2);
  });

  it("renders a dashed list as a real unordered list", () => {
    const { container } = render(
      <KaiMessage>{"- eggs and toast\n- a rice bowl\n- yogurt and fruit"}</KaiMessage>,
    );
    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    expect(ul!.querySelectorAll("li").length).toBe(3);
  });

  it("keeps a single flowing reply as one paragraph (no wall, no invented structure)", () => {
    const { container } = render(
      <KaiMessage>{"Off days happen — easiest reset is a ten-minute walk."}</KaiMessage>,
    );
    expect(container.querySelectorAll("p").length).toBe(1);
    expect(container.querySelector("ol")).toBeNull();
    expect(container.querySelector("ul")).toBeNull();
  });
});
