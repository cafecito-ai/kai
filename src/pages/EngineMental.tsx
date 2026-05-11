import { Brain, PenLine, RefreshCw, Wind } from "lucide-react";
import { EnginePanel } from "../components/engines/EnginePanel";
import { DisclosureBanner } from "../components/safety/DisclosureBanner";
import { Button } from "../components/ui/Button";
import { useProgressStore } from "../stores/progressStore";

export function EngineMental() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const actions = [
    { icon: Brain, title: "Feelings check-in", copy: "Name the pressure without turning it into a diagnosis.", eventType: "feelings_check_in" },
    { icon: Wind, title: "Contextual breathing", copy: "A short reset matched to the moment, not generic calm content.", eventType: "mental_breathing" },
    { icon: RefreshCw, title: "Social media reset", copy: "Pick one boundary that makes the next hour less loud.", eventType: "social_reset" },
    { icon: PenLine, title: "Future self letter", copy: "Write to the version of you that has a little more room.", eventType: "letter_written" }
  ];
  return (
    <EnginePanel title="Mental wellness" label="Reset" accent="text-coral" intro="Self-esteem, pressure, emotions, and resets. Always wellness. Never diagnosis.">
      <DisclosureBanner />
      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map(({ icon: Icon, title, copy, eventType }) => (
          <section key={eventType} className="rounded-kai border border-line bg-white p-5 shadow-sm">
            <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
              <Icon />
            </div>
            <h2 className="font-display text-2xl font-black tracking-normal">{title}</h2>
            <p className="my-3 text-sm leading-6 text-muted">{copy}</p>
            <Button variant="secondary" onClick={() => addEvent({ engine: "mental", eventType, eventValue: 24, payload: { completed: true } })}>Complete</Button>
          </section>
        ))}
      </div>
    </EnginePanel>
  );
}
