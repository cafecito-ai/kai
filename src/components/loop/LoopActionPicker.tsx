import { useState } from "react";
import { Button } from "../ui/Button";

export function LoopActionPicker({
  options,
  cta,
  saving,
  onComplete
}: {
  options: string[];
  cta: string;
  saving: boolean;
  onComplete: (action: string) => void;
}) {
  const [action, setAction] = useState(options[0] ?? "");
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button key={option} type="button" aria-pressed={action === option} onClick={() => setAction(option)} className={`focus-ring min-h-12 rounded-[18px] border px-3 text-left text-sm font-black ${action === option ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink"}`}>
            {option}
          </button>
        ))}
      </div>
      <Button onClick={() => onComplete(action)} disabled={saving || !action}>
        {cta}
      </Button>
    </div>
  );
}
