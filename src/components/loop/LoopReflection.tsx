import { LoopActionPicker } from "./LoopActionPicker";

const REFLECTIONS = [
  "I feel clearer.",
  "I did the thing.",
  "Still messy, but less stuck.",
  "I need a different plan.",
  "Nothing yet."
];

export function LoopReflection({ saving, onComplete }: { saving: boolean; onComplete: (payload: Record<string, unknown>) => void }) {
  return (
    <LoopActionPicker
      options={REFLECTIONS}
      cta="Close the loop"
      saving={saving}
      onComplete={(reflectionType) => onComplete({ reflectionType, source: "loop" })}
    />
  );
}
