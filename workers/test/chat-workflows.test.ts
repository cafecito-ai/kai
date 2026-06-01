import { describe, expect, it } from "vitest";
import { getWorkflowCatalog, matchKaiWorkflow } from "../src/lib/chat-workflows";

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

  it("gives loneliness its own deeper response instead of the generic sad check-in", () => {
    const reply = matchKaiWorkflow("im lonely");

    expect(reply?.workflow).toBe("lonely-open");
    expect(reply?.reply).toMatch(/signal, not a sentence/i);
    expect(reply?.reply).toMatch(/5% safe/i);
  });
});
