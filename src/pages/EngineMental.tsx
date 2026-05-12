import { Brain, PenLine, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { EnginePanel } from "../components/engines/EnginePanel";
import { BreathingPlayer } from "../components/mental/BreathingPlayer";
import { ClinicalReviewBanner } from "../components/mental/ClinicalReviewBanner";
import { DisclosureBanner } from "../components/safety/DisclosureBanner";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import type { EngineEntry } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

export function EngineMental() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [entries, setEntries] = useState<EngineEntry[]>([]);
  const [feeling, setFeeling] = useState("Stressed, but not sure why yet");
  const [thought, setThought] = useState("If I mess this up, everyone will notice.");
  const [boundary, setBoundary] = useState("Mute one app until tomorrow morning");
  const [letter, setLetter] = useState("You got through the loud part. Do the next tiny thing.");
  const actions = [
    { icon: RefreshCw, title: "Social media reset", copy: "Pick one boundary that makes the next hour less loud.", eventType: "social_reset" },
    { icon: PenLine, title: "Future self letter", copy: "Write to the version of you that has a little more room.", eventType: "letter_written" }
  ];

  useEffect(() => {
    void api.getEngineEntries("mental").then((result) => setEntries(result.entries)).catch(() => undefined);
  }, []);

  async function completeReset(input: { eventType: string; title: string; payload?: unknown; eventValue?: number }) {
    const optimistic: EngineEntry = {
      id: crypto.randomUUID(),
      engine: "mental",
      entryType: input.eventType,
      title: input.title,
      payload: input.payload ?? { completed: true },
      completedAt: new Date().toISOString()
    };
    setEntries((items) => [optimistic, ...items].slice(0, 8));
    addEvent({ engine: "mental", eventType: input.eventType, eventValue: input.eventValue ?? 24, payload: input.payload ?? { completed: true } });
    try {
      const result = await api.createEngineEntry("mental", {
        entryType: input.eventType,
        title: input.title,
        payload: input.payload ?? { completed: true },
        completed: true
      });
      setEntries((items) => items.map((item) => (item.id === optimistic.id ? result.entry : item)));
    } catch {
      // Keep the optimistic entry in demo mode.
    }
  }

  return (
    <EnginePanel title="Mental wellness" label="Reset" accent="text-coral" intro="Self-esteem, pressure, emotions, and resets. Always wellness. Never diagnosis.">
      <ClinicalReviewBanner />
      <DisclosureBanner />
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
          <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
            <Brain />
          </div>
          <p className="eyebrow">feelings check-in</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Name it without diagnosing it.</h2>
          <textarea className="field mt-4 min-h-24" value={feeling} onChange={(event) => setFeeling(event.target.value)} />
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => completeReset({ eventType: "feelings_check_in", title: "Feelings check-in", payload: { feeling }, eventValue: 24 })}
          >
            Save check-in
          </Button>
        </section>
        <section className="rounded-kai border border-line bg-ink p-5 text-paper shadow-sm">
          <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
            <RefreshCw />
          </div>
          <p className="eyebrow text-soft">thought reframe</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Take one scary thought down a notch.</h2>
          <textarea className="field mt-4 min-h-24 border-white/10 bg-white/10 text-paper placeholder:text-paper/50" value={thought} onChange={(event) => setThought(event.target.value)} />
          <Button
            className="mt-4"
            onClick={() =>
              completeReset({
                eventType: "thought_reframe",
                title: "Thought reframe",
                payload: { thought, reframe: "What is one boring, realistic next step?" },
                eventValue: 28
              })
            }
          >
            Save reframe
          </Button>
        </section>
      </div>
      <BreathingPlayer
        onSessionComplete={({ patternId, seconds }) =>
          completeReset({
            eventType: "mental_breathing",
            title: `Breathing — ${patternId}`,
            payload: { patternId, seconds },
            eventValue: Math.min(40, 8 + Math.round(seconds / 10))
          })
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map(({ icon: Icon, title, copy, eventType }) => (
          <section key={eventType} className="rounded-kai border border-line bg-white p-5 shadow-sm">
            <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
              <Icon />
            </div>
            <h2 className="font-display text-2xl font-black tracking-normal">{title}</h2>
            <p className="my-3 text-sm leading-6 text-muted">{copy}</p>
            {eventType === "social_reset" && <input className="field mb-3" value={boundary} onChange={(event) => setBoundary(event.target.value)} />}
            {eventType === "letter_written" && <textarea className="field mb-3 min-h-20" value={letter} onChange={(event) => setLetter(event.target.value)} />}
            <Button
              variant="secondary"
              onClick={() =>
                completeReset({
                  eventType,
                  title,
                  payload:
                    eventType === "social_reset"
                      ? { boundary }
                      : eventType === "letter_written"
                        ? { letter }
                        : { completed: true }
                })
              }
            >
              Complete
            </Button>
          </section>
        ))}
      </div>
      <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">reset history</p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-normal">Recent reset work</h2>
          </div>
          <span className="rounded-full bg-[#FFE8DD] px-3 py-1 text-xs font-black text-coral">{entries.length} saved</span>
        </div>
        <div className="space-y-2">
          {entries.length === 0 && <p className="rounded-kai border border-line bg-paper p-3 text-sm text-muted">No Reset entries yet. Complete one check-in, breathing session, or letter.</p>}
          {entries.slice(0, 6).map((entry) => (
            <div key={entry.id} className="flex items-center gap-3 rounded-kai border border-line bg-paper p-3">
              <Brain className="text-coral" size={18} />
              <div>
                <p className="text-sm font-black">{entry.title || labelForEntry(entry.entryType)}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{labelForEntry(entry.entryType)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </EnginePanel>
  );
}

function labelForEntry(entryType: string) {
  return entryType.replace(/_/g, " ");
}
