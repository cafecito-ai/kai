import { Check, ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { KaiToolSuggestion } from "../../lib/kai-tools";
import { useProgressStore } from "../../stores/progressStore";
import { BreathingPlayer } from "../mental/BreathingPlayer";
import { FutureSelfLetter } from "../mental/FutureSelfLetter";
import { MeditationPlayer } from "../mental/MeditationPlayer";
import { SocialMediaReset } from "../mental/SocialMediaReset";
import { ThoughtReframe } from "../mental/ThoughtReframe";
import { SleepWidget } from "../physical/SleepWidget";
import { Button } from "../ui/Button";

type InlineComplete = (input: { engine: "physical" | "mental" | "superpower"; eventType: string; eventValue: number; payload?: unknown }) => void;

export function ToolCard({ tool }: { tool: KaiToolSuggestion }) {
  const [open, setOpen] = useState(false);
  const tone =
    tool.engine === "physical"
      ? "bg-[#FFF0EC] text-[#C86B31]"
      : tool.engine === "superpower"
        ? "bg-[#EEEAFF] text-[#5B47F0]"
        : "bg-[#E4F7F4] text-[#218A7D]";

  if (tool.surface === "page" && tool.route) {
    return (
      <Link to={tool.route} className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-black ${tone}`}>
        {tool.label}
        <ExternalLink size={13} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-xs font-black ${tone}`}>
        {tool.label}
      </button>
      {open && <InlineToolModal tool={tool} onClose={() => setOpen(false)} />}
    </>
  );
}

function InlineToolModal({ tool, onClose }: { tool: KaiToolSuggestion; onClose: () => void }) {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [goalTitle, setGoalTitle] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);

  const complete: InlineComplete = (input) => {
    addEvent(input);
    onClose();
  };

  async function saveGoal() {
    const title = goalTitle.trim();
    if (!title || savingGoal) return;
    setSavingGoal(true);
    addEvent({ engine: "superpower", eventType: "goal_created", eventValue: 22, payload: { title, source: "kai_tool_card" } });
    try {
      await api.createGoal({ category: "custom", title, description: "Created from Kai chat." });
    } catch {
      // Review mode can still keep the local progress event.
    } finally {
      setSavingGoal(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-inkDeep/28 p-3 backdrop-blur-sm sm:place-items-center" role="dialog" aria-modal="true" aria-label={tool.label}>
      <div className="max-h-[86vh] w-full max-w-xl overflow-y-auto rounded-[28px] bg-paper p-3 shadow-[0_28px_80px_rgba(10,10,10,0.28)]">
        <div className="mb-3 flex items-center justify-between gap-3 px-2 pt-1">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-inkMute">Kai tool</p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-normal text-inkDark">{tool.label}</h2>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid size-10 shrink-0 place-items-center rounded-full bg-white text-inkDark" aria-label="Close tool">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {renderInlineTool(tool.id, complete, goalTitle, setGoalTitle, saveGoal, savingGoal)}
      </div>
    </div>
  );
}

function renderInlineTool(
  id: string,
  complete: InlineComplete,
  goalTitle: string,
  setGoalTitle: (value: string) => void,
  saveGoal: () => void,
  savingGoal: boolean
) {
  if (id.startsWith("breathing.")) {
    return (
      <BreathingPlayer
        onSessionComplete={({ patternId, seconds }) =>
          complete({ engine: "mental", eventType: "mental_breathing", eventValue: Math.min(40, 8 + Math.round(seconds / 10)), payload: { patternId, seconds, source: "kai_tool_card" } })
        }
      />
    );
  }
  if (id === "thought.reframe") {
    return <ThoughtReframe onComplete={(payload) => complete({ engine: "mental", eventType: "thought_reframe", eventValue: 22, payload: { ...payload, source: "kai_tool_card" } })} />;
  }
  if (id === "social.reset") {
    return <SocialMediaReset onComplete={(payload) => complete({ engine: "mental", eventType: "social_reset", eventValue: 22, payload: { ...payload, source: "kai_tool_card" } })} />;
  }
  if (id === "letter.future") {
    return <FutureSelfLetter onComplete={(payload) => complete({ engine: "mental", eventType: "letter_written", eventValue: 24, payload: { ...payload, source: "kai_tool_card" } })} />;
  }
  if (id === "meditation.short") {
    return (
      <MeditationPlayer
        onSessionComplete={(payload) => complete({ engine: "mental", eventType: "meditation", eventValue: Math.min(45, 10 + Math.round(payload.elapsedSeconds / 12)), payload: { ...payload, source: "kai_tool_card" } })}
      />
    );
  }
  if (id === "sleep.log") {
    return (
      <SleepWidget
        onSleepStart={(session) => complete({ engine: "physical", eventType: "sleep_started", eventValue: 5, payload: { ...session, source: "kai_tool_card" } })}
        onWokeUp={(result) => complete({ engine: "physical", eventType: "sleep_log", eventValue: Math.min(40, 10 + Math.round(result.durationMinutes / 30)), payload: { ...result, source: "kai_tool_card" } })}
      />
    );
  }
  if (id === "goal.create") {
    return (
      <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
        <p className="eyebrow">one concrete move</p>
        <h3 className="mt-2 font-display text-3xl font-black tracking-normal">Name the thing worth building.</h3>
        <input className="field mt-4" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="One goal, messy is fine" />
        <Button className="mt-3" disabled={!goalTitle.trim() || savingGoal} onClick={() => void saveGoal()}>
          <Check size={17} aria-hidden="true" />
          {savingGoal ? "Saving" : "Save goal"}
        </Button>
      </section>
    );
  }
  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-muted">This tool is being wired up. Try one of the page tools for now.</p>
    </section>
  );
}
