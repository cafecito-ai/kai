// On-device identity layer — the "who I'm becoming" stuff the spec wants KAI to
// hold: an identity statement, a write-once origin story, a hero image, and how
// long you've been building. All device-local (localStorage). The permanent /
// cross-device / chat-recall versions are backend (Ratner).

import { daysBetween, localDateKey, parseLocalDate } from "./dates";
import { fileToThumbnailDataUrl } from "./food-history";
import { readLocalInputs } from "./local-score";

const IDENTITY_KEY = "kai_identity_statement_v1";
const ORIGIN_KEY = "kai_origin_story_v1";
const HERO_KEY = "kai_hero_image_v1";
const STARTED_KEY = "kai_identity_started_v1";

function read(key: string): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, val: string): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(key, val);
    window.dispatchEvent(new Event("kai:state-changed"));
    return true;
  } catch {
    /* quota — fine, this is best-effort device-local state */
    return false;
  }
}

/** Stamp the day identity was first set, so "days building" has an anchor even
 *  before any activity is logged. */
function stampStartOnce(): void {
  if (!read(STARTED_KEY)) {
    try {
      localStorage.setItem(STARTED_KEY, localDateKey());
    } catch {
      /* ignore */
    }
  }
}

// ── Identity statement: "who you want to become" ──────────────────────
export function getIdentityStatement(): string | null {
  const v = read(IDENTITY_KEY);
  return v && v.trim() ? v : null;
}

export function setIdentityStatement(s: string): void {
  const clean = s.trim().slice(0, 140);
  if (clean) write(IDENTITY_KEY, clean);
  stampStartOnce();
}

/** Remove the identity statement ("why"). Used when the user clears it in the
 *  About-you editor. The write-once origin story is intentionally left intact. */
export function clearIdentityStatement(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(IDENTITY_KEY);
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

// ── Origin story: "why you're here today" — WRITE-ONCE ────────────────
// Never overwrite once set (mirrors the spec's permanence). The durable,
// cross-device, never-overwrite version is a backend write-once table.
export function getOriginStory(): string | null {
  const v = read(ORIGIN_KEY);
  return v && v.trim() ? v : null;
}

export function setOriginStory(s: string): void {
  if (getOriginStory()) return; // write-once
  const clean = s.trim().slice(0, 280);
  if (clean) write(ORIGIN_KEY, clean);
}

// ── Hero image: a downscaled data URL on-device ───────────────────────
// Cross-device hosting needs R2 (Ratner). For the demo it lives in localStorage.
// `position` is a CSS object-position (e.g. "50% 30%") so the user can reframe
// a tall photo instead of being stuck with a center crop.
export type HeroImage = { dataUrl: string; uploadedAt: string; position?: string };

const DEFAULT_HERO_POSITION = "50% 50%";

export function getHeroImage(): HeroImage | null {
  const raw = read(HERO_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as unknown;
    return p && typeof (p as HeroImage).dataUrl === "string" ? (p as HeroImage) : null;
  } catch {
    return null;
  }
}

export async function setHeroImage(file: File): Promise<boolean> {
  // Full-screen hero, so allow a larger edge than the food thumbnail.
  const dataUrl = await fileToThumbnailDataUrl(file, 1080, 0.75);
  if (!dataUrl) return false;
  // A 1080px data URL can blow the localStorage quota; report that honestly so
  // callers don't reframe (setHeroPosition) or mark the photo "set" on a miss.
  const stored = write(
    HERO_KEY,
    JSON.stringify({
      dataUrl,
      uploadedAt: new Date().toISOString(),
      position: DEFAULT_HERO_POSITION,
    }),
  );
  if (!stored) return false;
  stampStartOnce();
  return true;
}

/** Reframe the current hero photo (CSS object-position). No-op if no photo. */
export function setHeroPosition(position: string): void {
  const cur = getHeroImage();
  if (!cur) return;
  write(HERO_KEY, JSON.stringify({ ...cur, position }));
}

/** Remove the hero photo entirely. */
export function clearHeroImage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(HERO_KEY);
    window.dispatchEvent(new Event("kai:state-changed"));
  } catch {
    /* ignore */
  }
}

// ── "N days becoming…" — days since you started building ──────────────
export function daysBuilding(now: Date = new Date()): number {
  let earliest: Date | null = null;
  for (const i of readLocalInputs()) {
    const d = parseLocalDate(i.date);
    if (d && (!earliest || d < earliest)) earliest = d;
  }
  const startedKey = read(STARTED_KEY);
  const started = startedKey ? parseLocalDate(startedKey) : null;
  if (started && (!earliest || started < earliest)) earliest = started;
  if (!earliest) return 1;
  return Math.max(1, daysBetween(earliest, now) + 1);
}
