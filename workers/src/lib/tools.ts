import type { EngineId } from "../types";

export type KaiToolSurface = "inline" | "page";

export type KaiTool = {
  id: string;
  label: string;
  engine: EngineId;
  surface: KaiToolSurface;
  route?: string;
};

export const KAI_TOOLS: KaiTool[] = [
  { id: "food.photo", label: "Snap a meal", engine: "physical", surface: "page", route: "/health?module=food&from=kai" },
  { id: "food.manual", label: "Log a meal", engine: "physical", surface: "page", route: "/health?module=food&from=kai" },
  { id: "sleep.log", label: "Log sleep", engine: "physical", surface: "inline" },
  { id: "body.scan", label: "Try a body scan", engine: "physical", surface: "page", route: "/health?module=scan&from=kai" },
  { id: "movement.flow", label: "Start a movement flow", engine: "physical", surface: "page", route: "/health?module=movement&from=kai" },
  { id: "feelings.checkin", label: "Do a check-in", engine: "mental", surface: "page", route: "/mental?module=checkin&from=kai" },
  { id: "breathing.478", label: "Try a 4-7-8 breath", engine: "mental", surface: "inline" },
  { id: "breathing.box", label: "Try box breathing", engine: "mental", surface: "inline" },
  { id: "breathing.calm", label: "Try a calming breath", engine: "mental", surface: "inline" },
  { id: "breathing.energize", label: "Try an energizing breath", engine: "mental", surface: "inline" },
  { id: "thought.reframe", label: "Reframe the thought", engine: "mental", surface: "inline" },
  { id: "social.reset", label: "Reset the next hour", engine: "mental", surface: "inline" },
  { id: "letter.future", label: "Write future-you a note", engine: "mental", surface: "inline" },
  { id: "strengths.discover", label: "Discover strengths", engine: "superpower", surface: "page", route: "/mental?module=purpose&from=kai" },
  { id: "goal.create", label: "Create a goal", engine: "superpower", surface: "inline" },
  { id: "meditation.short", label: "Try a short meditation", engine: "mental", surface: "inline" }
];

export function renderToolCatalog(): string {
  return KAI_TOOLS
    .map((tool) => {
      const target = tool.surface === "page" && tool.route ? `, route=${tool.route}` : "";
      return `- ${tool.id}: ${tool.label} [${tool.engine}, ${tool.surface}${target}]`;
    })
    .join("\n");
}

export const TOOL_CARD_INSTRUCTIONS = `TOOL CARDS
You may suggest app tools when they fit what the teen just said. Suggestions are optional.
When useful, append exactly one fenced block at the very end of your reply:
\`\`\`kai-tools
[{"id":"breathing.478","reason":"because you said your chest feels tight"}]
\`\`\`
Rules:
- Use only IDs from the tool catalog below.
- Suggest at most 3 tools.
- Tool cards are suggestions, never auto-launched.
- Keep reasons short, concrete, and non-clinical.
- Do not mention engines or internal routes to the user.

Tool catalog:
${renderToolCatalog()}`;
