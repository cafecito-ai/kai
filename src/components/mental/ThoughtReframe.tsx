import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";

type Props = {
  onComplete: (payload: { thought: string; evidenceFor: string; evidenceAgainst: string; reframe: string }) => void;
};

const PLACEHOLDER_THOUGHT = "If I mess this up, everyone will notice.";

/**
 * Structured thought reframe per spec Phase 4 Task 9. Three small steps:
 *
 *   1. Catch the thought (textarea, free text)
 *   2. Notice what's actually true (evidence for / evidence against, both
 *      visible at once — the contrast IS the work)
 *   3. Write a more honest version (textarea, free text)
 *
 * Light CBT scaffold without using the words "cognitive" or "distortion"
 * because spec voice rules: plain language, no clinical jargon, no
 * diagnosis. The teen leaves with a sentence in their own words; they
 * don't get a label.
 *
 * Linear — back-button to revise earlier steps. Save fires only on the
 * third step, so a teen who bails on step 1 doesn't accidentally save
 * an empty entry.
 */
export function ThoughtReframe({ onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [thought, setThought] = useState("");
  const [evidenceFor, setEvidenceFor] = useState("");
  const [evidenceAgainst, setEvidenceAgainst] = useState("");
  const [reframe, setReframe] = useState("");

  function reset() {
    setStep(1);
    setThought("");
    setEvidenceFor("");
    setEvidenceAgainst("");
    setReframe("");
  }

  function save() {
    onComplete({ thought, evidenceFor, evidenceAgainst, reframe });
    reset();
  }

  return (
    <section className="rounded-kai border border-line bg-ink p-5 text-paper shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#FFE8DD] text-coral">
        <RefreshCw />
      </div>
      <p className="eyebrow text-soft">thought reframe</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Take one scary thought down a notch.</h2>
      <p className="mt-2 text-sm leading-6 text-paper/70">Three small steps. You can go back. Nothing here is graded.</p>

      <ol className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-paper/50" aria-label="Reframe steps">
        {[1, 2, 3].map((n) => (
          <li
            key={n}
            className={`flex items-center gap-2 rounded-full px-3 py-1 ${
              step === n ? "bg-coral text-white" : step > n ? "bg-paper/15 text-paper/80" : "bg-paper/5"
            }`}
            aria-current={step === n ? "step" : undefined}
          >
            {n}.{" "}
            {n === 1 ? "Catch it" : n === 2 ? "What's true" : "Honest version"}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="mt-4">
          <label htmlFor="reframe-thought" className="block text-sm font-semibold">
            What's the thought, in your own words?
          </label>
          <textarea
            id="reframe-thought"
            className="field mt-2 min-h-24 w-full border-white/10 bg-white/10 text-paper placeholder:text-paper/50"
            value={thought}
            onChange={(event) => setThought(event.target.value)}
            placeholder={PLACEHOLDER_THOUGHT}
          />
          <div className="mt-3 flex gap-2">
            <Button onClick={() => setStep(2)} disabled={!thought.trim()}>
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 space-y-4">
          <p className="rounded-kai bg-paper/10 px-3 py-2 text-sm italic text-paper/80">"{thought}"</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Things that could make it feel true</span>
              <textarea
                className="field mt-2 min-h-20 w-full border-white/10 bg-white/10 text-paper placeholder:text-paper/50"
                value={evidenceFor}
                onChange={(event) => setEvidenceFor(event.target.value)}
                placeholder="It's not about being wrong. Notice what your brain is pointing at."
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Things that don't match it</span>
              <textarea
                className="field mt-2 min-h-20 w-full border-white/10 bg-white/10 text-paper placeholder:text-paper/50"
                value={evidenceAgainst}
                onChange={(event) => setEvidenceAgainst(event.target.value)}
                placeholder="Counter-examples, exceptions, times this wasn't true."
              />
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button onClick={() => setStep(3)}>Next</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4">
          <p className="rounded-kai bg-paper/10 px-3 py-2 text-sm italic text-paper/80">"{thought}"</p>
          <label htmlFor="reframe-version" className="mt-4 block text-sm font-semibold">
            A more honest version
          </label>
          <p className="text-xs leading-5 text-paper/60">
            Not a pep talk. Something you could actually say out loud and mean. Smaller and truer beats louder and shinier.
          </p>
          <textarea
            id="reframe-version"
            className="field mt-2 min-h-24 w-full border-white/10 bg-white/10 text-paper placeholder:text-paper/50"
            value={reframe}
            onChange={(event) => setReframe(event.target.value)}
            placeholder="Some people might notice. Some won't. Either way I get to keep going."
          />
          <div className="mt-3 flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={save} disabled={!reframe.trim()}>
              Save reframe
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
