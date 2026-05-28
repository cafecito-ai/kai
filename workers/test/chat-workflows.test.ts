import { describe, expect, it } from "vitest";
import { getWorkflowCatalog } from "../src/lib/chat-workflows";

describe("chat workflow catalog", () => {
  it("does not expose duplicate workflow IDs", () => {
    const catalog = getWorkflowCatalog();
    const ids = catalog.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps workflows in an explicit response layer", () => {
    const validSources = new Set(["preSafety", "kai-workflow", "physical-workflow"]);
    for (const item of getWorkflowCatalog()) {
      expect(validSources.has(item.source)).toBe(true);
    }
  });
});
