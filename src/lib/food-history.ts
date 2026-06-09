// Food log history — a local, on-device record of logged meals.
//
// Unlike body scans (which are encrypted, see scan-storage.ts), food photos
// aren't sensitive, so this keeps it simple: a downscaled thumbnail + a
// timestamp + what KAI saw, stored as plain JSON in localStorage.
//
// Calorie / macro estimates are intentionally NOT part of the history — that
// side is owned by the backend (Ratner). This is just the picture + a time
// stamp, so the user can look back at what they ate and when.

export type FoodHistoryEntry = {
  id: string;
  /** ISO timestamp of when the meal was logged. */
  loggedAt: string;
  /** Downscaled JPEG data URL of the meal photo. Absent for note-only logs. */
  photoDataUrl?: string;
  /** What KAI saw — the item names (no grams). */
  items: string[];
  /** The user's optional one-liner note. */
  note?: string;
};

const STORAGE_KEY = "kai_food_history_v1";
const MAX_ENTRIES = 60;

// ─────────────────────────────────────────────────────────────────────
// Persistence
// ─────────────────────────────────────────────────────────────────────

function readAll(): FoodHistoryEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as FoodHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: FoodHistoryEntry[]): void {
  if (typeof localStorage === "undefined") return;
  // Trim to the newest MAX_ENTRIES so the photo thumbnails can't grow the
  // localStorage payload without bound.
  const trimmed = [...entries]
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
    .slice(0, MAX_ENTRIES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota hit (too many photos). Drop the oldest half and retry once.
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(trimmed.slice(0, Math.ceil(trimmed.length / 2))),
      );
    } catch {
      /* still over quota — give up silently */
    }
  }
}

/** Save a meal to the history. Newest entries sort first. */
export function saveFoodEntry(entry: Omit<FoodHistoryEntry, "id">): void {
  const all = readAll();
  all.push({ id: `food_${crypto.randomUUID()}`, ...entry });
  writeAll(all);
}

/** All logged meals, newest first. */
export function listFoodEntries(): FoodHistoryEntry[] {
  return [...readAll()].sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
}

/** Delete a single meal from the history. */
export function deleteFoodEntry(id: string): void {
  writeAll(readAll().filter((e) => e.id !== id));
}

// ─────────────────────────────────────────────────────────────────────
// Photo downscaling
// ─────────────────────────────────────────────────────────────────────

/**
 * Shrink a meal photo to a small JPEG data URL before we store it. Full
 * camera photos are multiple MB — localStorage caps out around 5MB total —
 * so we cap the longest edge and re-encode at modest quality. A thumbnail
 * is all the history view needs.
 */
export async function fileToThumbnailDataUrl(
  file: File,
  maxEdge = 720,
  quality = 0.7,
): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    // Some browsers / file types can't be decoded — skip the thumbnail
    // rather than failing the whole log.
    return undefined;
  }
}
