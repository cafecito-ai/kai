import { Brain } from "lucide-react";
import { useEffect, useState } from "react";
import { EngineGuidesIndex } from "../components/engines/EngineGuidesIndex";
import { EnginePanel } from "../components/engines/EnginePanel";
import { BreathingPlayer } from "../components/mental/BreathingPlayer";
import { ClinicalReviewBanner } from "../components/mental/ClinicalReviewBanner";
import { FeelingsCheckIn } from "../components/mental/FeelingsCheckIn";
import { FutureSelfLetter } from "../components/mental/FutureSelfLetter";
import { MeditationPlayer } from "../components/mental/MeditationPlayer";
import { SocialMediaReset } from "../components/mental/SocialMediaReset";
import { ThoughtReframe } from "../components/mental/ThoughtReframe";
import { DisclosureBanner } from "../components/safety/DisclosureBanner";
import { SecondaryShelf } from "../components/ui/AppPrimitives";
import { api } from "../lib/api";
import type { EngineEntry } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

export function EngineMental() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [entries, setEntries] = useState<EngineEntry[]>([]);
  // All four flows (feelings, thought, social, letter) are now structured
  // components below. No remaining inline-action items.

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
        <FeelingsCheckIn
          onComplete={(payload) => {
            const peak = Math.max(...Object.values(payload.emotions));
            completeReset({
              eventType: "feelings_check_in",
              title: "Feelings check-in",
              payload,
              // Event value scales with engagement: a teen who moves sliders + picks
              // a body area + leaves a note earns the full bonus.
              eventValue: 18 + (payload.bodyArea ? 4 : 0) + (payload.note.trim().length > 0 ? 4 : 0) + (peak > 0 ? 2 : 0)
            });
          }}
        />
        <ThoughtReframe
          onComplete={(payload) =>
            completeReset({
              eventType: "thought_reframe",
              title: "Thought reframe",
              payload,
              // Bonus for completing both evidence sides — the contrast IS the
              // work, so engagement there gets rewarded more than a one-step
              // textarea would.
              eventValue: 22 + (payload.evidenceFor.trim() ? 4 : 0) + (payload.evidenceAgainst.trim() ? 4 : 0)
            })
          }
        />
      </div>
      <SecondaryShelf eyebrow="more reset tools" title="Breathing, meditation, social reset, letter." summary="Open these when the first check-in is not the right rep." count="4 tools">
        <div className="mt-4 grid gap-4">
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
          <MeditationPlayer
            onSessionComplete={({ durationSeconds, elapsedSeconds, completed }) =>
              completeReset({
                eventType: "meditation",
                title: `Meditation — ${Math.round(durationSeconds / 60)} min`,
                payload: { durationSeconds, elapsedSeconds, completed },
                eventValue: Math.min(45, 10 + Math.round(elapsedSeconds / 12))
              })
            }
          />
          <SocialMediaReset
            onComplete={(payload) =>
              completeReset({
                eventType: "social_reset",
                title: "Social media reset",
                payload,
                // Full three-step engagement gets the bonus; bailing after step 2
                // still saves but earns the base.
                eventValue: 18 + (payload.replacement.trim() ? 6 : 0)
              })
            }
          />
          <FutureSelfLetter
            onComplete={(payload) =>
              completeReset({
                eventType: "letter_written",
                title: `Letter to ${payload.direction} me`,
                payload,
                // Length-scaled event value: a teen who wrote >120 chars earns
                // the full bonus over a one-line save.
                eventValue: 18 + (payload.body.trim().length > 120 ? 8 : 4)
              })
            }
          />
        </div>
      </SecondaryShelf>
      <SecondaryShelf eyebrow="reset history" title="Recent reset work" count={`${entries.length} saved`}>
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
      </SecondaryShelf>
      <EngineGuidesIndex
        engine="mental"
        title="Mind + feelings guides"
        intro="Specific topics across emotion, identity, stress, grief, trauma, purpose. Each is short. Kai links here in chat when topics come up."
      />
    </EnginePanel>
  );
}

function labelForEntry(entryType: string) {
  return entryType.replace(/_/g, " ");
}
