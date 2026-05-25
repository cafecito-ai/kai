import { useState } from "react";
import { Button } from "../ui/Button";

const MOODS = ["Good", "Tired", "Wired", "Heavy", "Annoyed", "Numb", "Stressed", "Not sure"];

export function LoopCheckIn({ saving, onComplete }: { saving: boolean; onComplete: (payload: Record<string, unknown>) => void }) {
  const [mood, setMood] = useState("Stressed");
  const [note, setNote] = useState("");
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {MOODS.map((option) => (
          <button key={option} type="button" aria-pressed={mood === option} onClick={() => setMood(option)} className={`focus-ring rounded-full border px-3 py-2 text-sm font-black ${mood === option ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink"}`}>
            {option}
          </button>
        ))}
      </div>
      <textarea className="field min-h-24" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional. Kai stores length, not the raw note." />
      <Button onClick={() => onComplete({ mood, noteLength: note.trim().length, source: "loop" })} disabled={saving}>
        Check in
      </Button>
    </div>
  );
}
