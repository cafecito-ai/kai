// KAI animation presets — CLAUDE.md v2 §7
// Spring physics live here as runtime constants because Tailwind only handles
// CSS keyframes. The keyframe-based presets (fade-slide-up, scale-press) are
// in tailwind.config.js and reachable via `animate-fade-slide-up`.
//
// Springs are shaped for Framer Motion's `transition={...}` API. If/when
// Framer Motion is installed (next task that needs spring physics), import
// these directly:
//
//   import { springSnappy } from "@/lib/animation";
//   <motion.div transition={springSnappy} ... />

export const springSnappy = {
  type: "spring" as const,
  damping: 18,
  stiffness: 300,
};

export const springGentle = {
  type: "spring" as const,
  damping: 22,
  stiffness: 180,
};
