import type { EngineEntry } from "./types";

export type MentalPatternKind = "checkin" | "reframe" | "reset" | "social" | "identity" | "goal" | "other";

export type MentalPatternItem = {
  id: string;
  kind: MentalPatternKind;
  title: string;
  body: string;
  meta: string;
};

export function mentalPatternKind(entryType: string): MentalPatternKind {
  if (entryType.includes("feelings") || entryType.includes("check_in")) return "checkin";
  if (entryType.includes("reframe")) return "reframe";
  if (entryType.includes("social")) return "social";
  if (entryType.includes("letter") || entryType.includes("strengths")) return "identity";
  if (entryType.includes("goal") || entryType.includes("next_step")) return "goal";
  if (entryType.includes("breathing") || entryType.includes("meditation")) return "reset";
  return "other";
}

export function getMentalPatternItems(entries: EngineEntry[], kind: MentalPatternKind, limit = 3): MentalPatternItem[] {
  return entries
    .filter((entry) => mentalPatternKind(entry.entryType) === kind)
    .slice(0, limit)
    .map(summarizeMentalEntry);
}

export function summarizeMentalEntry(entry: EngineEntry): MentalPatternItem {
  const payload = readPayload(entry.payload);
  const kind = mentalPatternKind(entry.entryType);
  return {
    id: entry.id,
    kind,
    title: entry.title || labelForEntry(entry.entryType),
    body: bodyForEntry(kind, payload),
    meta: formatEntryTime(entry.completedAt || entry.createdAt) || labelForEntry(entry.entryType)
  };
}

export function mentalNextNudge(kind: MentalPatternKind, latest?: MentalPatternItem) {
  if (kind === "checkin") return latest ? "Next: name the loudest feeling before trying to solve your whole life." : "Start with one check-in. Naming it is already a rep.";
  if (kind === "reframe") return latest ? "Next: keep the truer sentence nearby for the next hard moment." : "Catch one harsh thought and make it smaller, not fake-positive.";
  if (kind === "reset") return latest ? "Next: repeat the reset that made your body even 5% steadier." : "Use a short breath or meditation when your system feels loud.";
  if (kind === "social") return latest ? "Next: protect the next hour. You do not need a dramatic life change." : "Pick one social boundary for one hour. Small counts.";
  if (kind === "identity") return latest ? "Next: treat this as identity evidence. You are building a pattern." : "Write one honest line to future or past you.";
  if (kind === "goal") return latest ? "Next: move one visible step, not the whole goal." : "Make one next move visible enough to start.";
  return "Next: keep the mental rep small enough to repeat.";
}

function bodyForEntry(kind: MentalPatternKind, payload: Record<string, unknown>) {
  if (kind === "checkin") {
    const loudest = loudestEmotion(payload);
    const bodyArea = typeof payload.bodyArea === "string" ? payload.bodyArea.replace(/_/g, " ") : "";
    if (loudest) return `${loudest.label} was loudest${bodyArea ? `, mostly in ${bodyArea}` : ""}.`;
    if (typeof payload.note === "string" && payload.note.trim()) return clamp(payload.note);
    return "Check-in saved. Kai has more context for what feels loud.";
  }
  if (kind === "reframe") {
    if (typeof payload.reframe === "string" && payload.reframe.trim()) return clamp(payload.reframe);
    if (typeof payload.thought === "string" && payload.thought.trim()) return `Caught thought: ${clamp(payload.thought)}`;
    return "Reframe saved. Keep the kinder version close.";
  }
  if (kind === "social") {
    const boundary = typeof payload.boundary === "string" ? payload.boundary.trim() : "";
    const replacement = typeof payload.replacement === "string" ? payload.replacement.trim() : "";
    if (boundary && replacement) return `${boundary}. Instead: ${replacement}.`;
    if (boundary) return `Boundary saved: ${boundary}.`;
    return "Social reset saved. Protect attention without making it dramatic.";
  }
  if (kind === "identity") {
    if (typeof payload.summary === "string") return clamp(payload.summary);
    if (typeof payload.body === "string") return clamp(payload.body);
    return "Identity rep saved. This is more than journaling.";
  }
  if (kind === "goal") {
    if (typeof payload.nextStep === "string") return clamp(payload.nextStep);
    if (typeof payload.reframe === "string") return clamp(payload.reframe);
    if (typeof payload.title === "string") return `Goal saved: ${payload.title}.`;
    return "Goal rep saved. One smaller next move beats more pressure.";
  }
  if (kind === "reset") {
    const seconds = typeof payload.seconds === "number" ? payload.seconds : typeof payload.elapsedSeconds === "number" ? payload.elapsedSeconds : null;
    const pattern = typeof payload.patternId === "string" ? payload.patternId.replace(/_/g, " ") : "reset";
    return seconds ? `${pattern} for ${Math.round(seconds / 60)} min.` : "Reset saved. Notice if your body feels even 5% steadier.";
  }
  return "Mind rep saved. Kai can use it for the next suggestion.";
}

function loudestEmotion(payload: Record<string, unknown>) {
  const emotions = readPayload(payload.emotions);
  let best: { label: string; value: number } | null = null;
  for (const [key, value] of Object.entries(emotions)) {
    if (typeof value !== "number") continue;
    if (!best || value > best.value) best = { label: key.replace(/_/g, " "), value };
  }
  return best && best.value > 0 ? best : null;
}

function readPayload(payload: unknown): Record<string, unknown> {
  return payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
}

function labelForEntry(entryType: string) {
  return entryType.replace(/_/g, " ");
}

function clamp(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= 110) return trimmed;
  return `${trimmed.slice(0, 107).trimEnd()}...`;
}

function formatEntryTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
