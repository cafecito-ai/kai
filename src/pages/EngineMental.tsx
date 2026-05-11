import { Brain, PenLine, RefreshCw, Wind } from "lucide-react";
import { EnginePanel } from "../components/engines/EnginePanel";
import { DisclosureBanner } from "../components/safety/DisclosureBanner";
import { Button } from "../components/ui/Button";
import { useProgressStore } from "../stores/progressStore";

export function EngineMental() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const actions = [
    { icon: Brain, title: "Feelings check-in", eventType: "feelings_check_in" },
    { icon: Wind, title: "Contextual breathing", eventType: "mental_breathing" },
    { icon: RefreshCw, title: "Social media reset", eventType: "social_reset" },
    { icon: PenLine, title: "Future self letter", eventType: "letter_written" }
  ];
  return (
    <EnginePanel title="Mental Wellness" intro="Self-esteem, pressure, emotions, and resets. Always wellness. Never diagnosis.">
      <DisclosureBanner />
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map(({ icon: Icon, title, eventType }) => (
          <section key={eventType} className="rounded-kai border border-ink/10 bg-white p-5">
            <Icon className="mb-3 text-coral" />
            <h2 className="text-xl font-black">{title}</h2>
            <p className="my-3 text-sm text-ink/70">A short guided flow with safety screening before any AI response.</p>
            <Button variant="secondary" onClick={() => addEvent({ engine: "mental", eventType, eventValue: 24, payload: { completed: true } })}>Complete</Button>
          </section>
        ))}
      </div>
    </EnginePanel>
  );
}
