import type { EngineId } from "./types";

export type KaiToolSurface = "inline" | "page";

export type KaiTool = {
  id: string;
  label: string;
  engine: EngineId;
  surface: KaiToolSurface;
  route?: string;
};

export type KaiToolSuggestion = KaiTool & {
  reason?: string;
};

export const KAI_TOOL_REGISTRY: Record<string, KaiTool> = {
  "food.photo": { id: "food.photo", label: "Snap a meal", engine: "physical", surface: "page", route: "/health?module=food&from=kai" },
  "food.manual": { id: "food.manual", label: "Log a meal", engine: "physical", surface: "page", route: "/health?module=food&from=kai" },
  "sleep.log": { id: "sleep.log", label: "Log sleep", engine: "physical", surface: "inline" },
  "body.scan": { id: "body.scan", label: "Try a body scan", engine: "physical", surface: "page", route: "/health?module=scan&from=kai" },
  "movement.flow": { id: "movement.flow", label: "Start a movement flow", engine: "physical", surface: "page", route: "/health?module=movement&from=kai" },
  "feelings.checkin": { id: "feelings.checkin", label: "Do a check-in", engine: "mental", surface: "page", route: "/mental?module=checkin&from=kai" },
  "breathing.478": { id: "breathing.478", label: "Try a 4-7-8 breath", engine: "mental", surface: "inline" },
  "breathing.box": { id: "breathing.box", label: "Try box breathing", engine: "mental", surface: "inline" },
  "breathing.calm": { id: "breathing.calm", label: "Try a calming breath", engine: "mental", surface: "inline" },
  "breathing.energize": { id: "breathing.energize", label: "Try an energizing breath", engine: "mental", surface: "inline" },
  "thought.reframe": { id: "thought.reframe", label: "Reframe the thought", engine: "mental", surface: "inline" },
  "social.reset": { id: "social.reset", label: "Reset the next hour", engine: "mental", surface: "inline" },
  "letter.future": { id: "letter.future", label: "Write future-you a note", engine: "mental", surface: "inline" },
  "strengths.discover": { id: "strengths.discover", label: "Discover strengths", engine: "superpower", surface: "page", route: "/mental?module=purpose&from=kai" },
  "goal.create": { id: "goal.create", label: "Create a goal", engine: "superpower", surface: "inline" },
  "meditation.short": { id: "meditation.short", label: "Try a short meditation", engine: "mental", surface: "inline" }
};

type RawSuggestion = {
  id?: unknown;
  reason?: unknown;
};

const TOOL_FENCE_RE = /```kai-tools\s*([\s\S]*?)```/gi;

export function parseToolCards(content: string): { text: string; tools: KaiToolSuggestion[] } {
  const tools: KaiToolSuggestion[] = [];
  const text = content.replace(TOOL_FENCE_RE, (_match, rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson.trim()) as RawSuggestion[];
      if (!Array.isArray(parsed)) return "";
      for (const item of parsed.slice(0, 3)) {
        const id = typeof item.id === "string" ? item.id : "";
        const tool = KAI_TOOL_REGISTRY[id];
        if (!tool) continue;
        const reason = typeof item.reason === "string" ? item.reason.trim().slice(0, 120) : undefined;
        tools.push({ ...tool, reason });
      }
    } catch {
      return "";
    }
    return "";
  });

  return { text: text.trim(), tools };
}
