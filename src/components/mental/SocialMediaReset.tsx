import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";

type Props = {
  onComplete: (payload: {
    loudThing: string;
    boundary: string;
    replacement: string;
  }) => void;
};

/**
 * Social media reset per spec Section 6 (mental engine action: "Run a
 * compare-and-despair social media reset exercise") and Phase 4 Task 8.
 * Three short questions; the point is to make the next hour less loud.
 *
 * Linear with progressive disclosure. Each question stands on its own so a
 * teen who only wants to log the boundary (step 2) can still save — the
 * other fields are accepted as empty.
 *
 * No app names in the prompt copy — naming Instagram / TikTok / etc.
 * gets dated immediately and reads as adults-talking-to-teens. The teen
 * picks the app or person; we just give the frame.
 */
export function SocialMediaReset({ onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loudThing, setLoudThing] = useState("");
  const [boundary, setBoundary] = useState("");
  const [replacement, setReplacement] = useState("");

  function reset() {
    setStep(1);
    setLoudThing("");
    setBoundary("");
    setReplacement("");
  }

  function save() {
    onComplete({ loudThing, boundary, replacement });
    reset();
  }

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
        <RefreshCw />
      </div>
      <p className="eyebrow">social media reset</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Make the next hour less loud.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Not a guilt trip about screen time. Just a quick reset.</p>

      <ol className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted" aria-label="Reset steps">
        {[1, 2, 3].map((n) => (
          <li
            key={n}
            className={`rounded-full px-3 py-1 ${
              step === n ? "bg-coral text-white" : step > n ? "bg-[#FFE8DD] text-coral" : "bg-paper text-muted"
            }`}
            aria-current={step === n ? "step" : undefined}
          >
            {n}. {n === 1 ? "Loud" : n === 2 ? "Mute" : "Instead"}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="mt-4">
          <label htmlFor="reset-loud" className="block text-sm font-semibold">
            What just felt loud or hard online?
          </label>
          <textarea
            id="reset-loud"
            className="field mt-2 min-h-20 w-full"
            value={loudThing}
            onChange={(event) => setLoudThing(event.target.value)}
            placeholder="A post, a person, a vibe — whatever made you want to look away."
          />
          <div className="mt-3 flex gap-2">
            {/* loudThing is optional context — teens can skip straight to the
                boundary step without naming the loud thing if they don't want
                to. Privacy-preserving: the more-sensitive prompt is never
                forced. */}
            <Button onClick={() => setStep(2)}>
              {loudThing.trim() ? "Next" : "Skip"}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4">
          <label htmlFor="reset-boundary" className="block text-sm font-semibold">
            What's one app or person you could mute for the next hour?
          </label>
          <input
            id="reset-boundary"
            className="field mt-2 w-full"
            value={boundary}
            onChange={(event) => setBoundary(event.target.value)}
            placeholder='e.g. "Mute the group chat" or "Close the app for an hour"'
          />
          <p className="mt-2 text-xs text-muted">One hour. Not delete-forever. You can come back.</p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            {/* The boundary itself is the load-bearing step. Require it. */}
            <Button onClick={() => setStep(3)} disabled={!boundary.trim()}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4">
          <label htmlFor="reset-replacement" className="block text-sm font-semibold">
            What do you want to do with that hour instead?
          </label>
          <input
            id="reset-replacement"
            className="field mt-2 w-full"
            value={replacement}
            onChange={(event) => setReplacement(event.target.value)}
            placeholder='e.g. "Walk", "Make tea", "Stretch", "Talk to a person"'
          />
          <p className="mt-2 text-xs text-muted">Small and specific beats grand. One thing.</p>
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={save}>Save reset</Button>
          </div>
        </div>
      )}
    </section>
  );
}
