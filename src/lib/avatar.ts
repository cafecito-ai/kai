/**
 * Section 9.2 evolving-character ladder. The full vision calls for ten
 * commissioned art variants per teen; until plan decision D1 (design
 * direction) lands and art is commissioned, we render a procedural
 * placeholder built from these traits.
 *
 * Each trait is monotonically non-decreasing as level rises — visible
 * progression is the point. Pure function, testable in isolation.
 */
export type AvatarTraits = {
  level: number;
  size: number; // px
  bodyColor: string;
  accentColor: string;
  mouthCurve: 0 | 0.4 | 0.8; // 0 = neutral, 0.4 = gentle smile, 0.8 = bright smile
  eyeBrightness: number; // 0..1 — controls eye radius
  hasAccessory: boolean; // small sparkle above the head
  hasBackground: boolean; // dotted ring
  hasMotion: boolean; // subtle pulse (respect prefers-reduced-motion downstream)
  hasAura: boolean; // outer glow
  /** Human-readable explanation of what changed at this level. */
  description: string;
};

const PALETTE = {
  level1: { body: "#E5E2D9", accent: "#8E8B82" },
  level2: { body: "#E8E4F4", accent: "#6B5BC4" },
  level3: { body: "#E0DAF4", accent: "#5B47F0" },
  level4: { body: "#D8CFF4", accent: "#5B47F0" },
  level5: { body: "#D1C5F4", accent: "#4A36D8" },
  level6: { body: "#C9BCF4", accent: "#4A36D8" },
  level7: { body: "#BFB0F4", accent: "#3A28C0" },
  level8: { body: "#B5A3F4", accent: "#3A28C0" },
  level9: { body: "#A998F4", accent: "#2A1AA8" },
  level10: { body: "#9C8AF4", accent: "#2A1AA8" }
} as const;

const DESCRIPTIONS: Record<number, string> = {
  1: "Starting form, neutral expression.",
  2: "Slightly more vivid, gentle smile.",
  3: "Posture improves, eyes brighten.",
  4: "More color, more energy.",
  5: "Stronger silhouette, small accessory appears.",
  6: "Background detail emerges.",
  7: "Subtle motion.",
  8: "Full vibrancy.",
  9: "Aura effect.",
  10: "Fully realized character."
};

export function avatarTraitsForLevel(rawLevel: number): AvatarTraits {
  const level = Math.min(10, Math.max(1, Math.floor(rawLevel)));
  const paletteKey = `level${level}` as keyof typeof PALETTE;
  const palette = PALETTE[paletteKey];

  return {
    level,
    size: 60 + (level - 1) * 4, // 60px at L1, 96px at L10
    bodyColor: palette.body,
    accentColor: palette.accent,
    mouthCurve: level >= 4 ? 0.8 : level >= 2 ? 0.4 : 0,
    eyeBrightness: Math.min(1, level / 6),
    hasAccessory: level >= 5,
    hasBackground: level >= 6,
    hasMotion: level >= 7,
    hasAura: level >= 9,
    description: DESCRIPTIONS[level]
  };
}
