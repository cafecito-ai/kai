import type { EngineEntry } from "./types";

export type PhysicalHistoryKind = "food" | "scan" | "movement" | "sleep" | "reset" | "other";

export type PhysicalHistoryItem = {
  id: string;
  kind: PhysicalHistoryKind;
  title: string;
  body: string;
  meta: string;
};

export function physicalHistoryKind(entryType: string): PhysicalHistoryKind {
  if (entryType.includes("meal") || entryType.includes("food")) return "food";
  if (entryType.includes("scan")) return "scan";
  if (entryType.includes("movement")) return "movement";
  if (entryType.includes("sleep")) return "sleep";
  if (entryType.includes("recovery")) return "reset";
  return "other";
}

export function getPhysicalHistoryItems(entries: EngineEntry[], kind: PhysicalHistoryKind, limit = 3): PhysicalHistoryItem[] {
  return entries
    .filter((entry) => physicalHistoryKind(entry.entryType) === kind)
    .slice(0, limit)
    .map(summarizePhysicalEntry);
}

export function summarizePhysicalEntry(entry: EngineEntry): PhysicalHistoryItem {
  const payload = readPayload(entry.payload);
  const kind = physicalHistoryKind(entry.entryType);
  const insight = typeof payload.insight === "string" ? payload.insight : "";
  return {
    id: entry.id,
    kind,
    title: entry.title || labelForEntry(entry.entryType),
    body: insight || bodyForEntry(kind, payload),
    meta: metaForEntry(entry, payload)
  };
}

export function physicalNextNudge(kind: PhysicalHistoryKind, latest?: PhysicalHistoryItem) {
  if (kind === "food") return latest ? "Next: use this meal pattern to pick one steady fuel move before practice." : "Start with one honest fuel note. No score, no calorie target.";
  if (kind === "scan") return latest ? "Next: compare posture and recovery patterns privately over time." : "Save a private scan when you want posture and mobility context.";
  if (kind === "movement") return latest ? "Next: repeat the smallest stretch that made your body feel even 5% better." : "Log 5-10 minutes. Small mobility counts.";
  if (kind === "sleep") return latest ? "Next: protect the first 30 minutes before bed. Recovery starts there." : "Log last night once. Kai will keep the pattern, not judge it.";
  if (kind === "reset") return latest ? "Next: keep the reset small enough to actually do again." : "Use one breathing reset when your body feels loud.";
  return "Next: keep it simple and log the body signal Kai should remember.";
}

function bodyForEntry(kind: PhysicalHistoryKind, payload: Record<string, unknown>) {
  if (kind === "food") {
    const items = readItems(payload);
    if (items.length > 0) return `Saved fuel: ${items.join(", ")}.`;
    if (typeof payload.meal === "string" && payload.meal.trim()) return `Saved fuel: ${payload.meal.trim()}.`;
    return "Fuel saved. Kai can use it without turning food into a score.";
  }
  if (kind === "scan") {
    const analysis = readPayload(payload.analysis);
    if (typeof analysis.summary === "string") return analysis.summary;
    return "Private scan saved. No body score, no comparison.";
  }
  if (kind === "movement") {
    const minutes = typeof payload.minutes === "number" ? payload.minutes : null;
    const focus = typeof payload.focus === "string" ? payload.focus : "mobility";
    return minutes ? `${minutes} minutes for ${focus}.` : `Movement saved for ${focus}.`;
  }
  if (kind === "sleep") {
    const hours = typeof payload.hours === "number" ? payload.hours : null;
    const quality = typeof payload.quality === "string" ? payload.quality : "logged";
    return hours ? `${hours} hours, ${quality} sleep.` : `Sleep saved as ${quality}.`;
  }
  if (kind === "reset") return "Recovery reset saved. Keep the next move small and steady.";
  return "Body rep saved. Kai can use it for the next suggestion.";
}

function metaForEntry(entry: EngineEntry, payload: Record<string, unknown>) {
  const context = typeof payload.mealContext === "string" ? payload.mealContext.replace(/_/g, " ") : "";
  const time = formatEntryTime(entry.completedAt || entry.createdAt);
  return [context, time].filter(Boolean).join(" · ") || labelForEntry(entry.entryType);
}

function readItems(payload: Record<string, unknown>) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  return items
    .map((item) => (item && typeof item === "object" && "name" in item ? String((item as { name?: unknown }).name ?? "") : ""))
    .filter(Boolean)
    .slice(0, 4);
}

function readPayload(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
}

function labelForEntry(entryType: string) {
  return entryType.replace(/_/g, " ");
}

function formatEntryTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
