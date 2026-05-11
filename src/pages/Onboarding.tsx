import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DisclosureBanner } from "../components/safety/DisclosureBanner";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import type { EngineId, KaiTone } from "../lib/types";
import { useUserStore } from "../stores/userStore";

const questions = [
  "What's been taking the most space in your head lately?",
  "When do you feel most like yourself?",
  "What do you want to feel better about first?",
  "How are sleep, food, and movement going?",
  "What goal keeps coming back to you?",
  "Who do you want Kai to sound like?"
];

export function Onboarding() {
  const navigate = useNavigate();
  const { setKai, setPrimaryEngine } = useUserStore();
  const [age, setAge] = useState("16");
  const [parentEmail, setParentEmail] = useState("");
  const [kaiName, setKaiName] = useState("Kai");
  const [kaiTone, setKaiTone] = useState<KaiTone>("balanced");
  const [responses, setResponses] = useState<string[]>(Array(questions.length).fill(""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const suggestedEngine = useMemo<EngineId>(() => {
    const text = responses.join(" ").toLowerCase();
    if (/goal|school|sport|business|future|music|instrument/.test(text)) return "potential";
    if (/stress|sad|anxious|friend|social|identity|emotion/.test(text)) return "mental";
    return "physical";
  }, [responses]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const keyedResponses = Object.fromEntries(questions.map((question, index) => [`q${index + 1}`, responses[index] || question]));
      const intake = await api.submitIntake(keyedResponses);
      const engine = intake.suggestedEngine || suggestedEngine;
      await api.updateUser({
        kaiName: kaiName || "Kai",
        kaiTone,
        primaryEngine: engine,
        age: Number(age) || undefined,
        parentEmail: parentEmail || undefined
      });
      if (Number(age) < 18 && parentEmail) {
        void api.sendParentConsent({
          parentEmail,
          teenName: kaiName || "Kai user",
          consentUrl: `${window.location.origin}/for-parents`
        }).catch(() => undefined);
      }
      setKai(kaiName || "Kai", kaiTone);
      setPrimaryEngine(engine);
      navigate(`/engine/${engine}`);
    } catch {
      setError("Could not save onboarding yet. You can keep going in demo mode.");
      setKai(kaiName || "Kai", kaiTone);
      setPrimaryEngine(suggestedEngine);
      navigate(`/engine/${suggestedEngine}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-wider text-coral">Onboarding</p>
        <h1 className="mt-2 text-4xl font-black">Meet Kai</h1>
      </section>
      <DisclosureBanner />
      <section className="grid gap-4 rounded-kai border border-ink/10 bg-white p-5 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Age
          <input className="focus-ring mt-2 w-full rounded-kai border border-ink/15 px-3 py-2" value={age} onChange={(event) => setAge(event.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Parent email {Number(age) < 18 ? "" : "(optional)"}
          <input className="focus-ring mt-2 w-full rounded-kai border border-ink/15 px-3 py-2" value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Kai's name
          <input className="focus-ring mt-2 w-full rounded-kai border border-ink/15 px-3 py-2" value={kaiName} onChange={(event) => setKaiName(event.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Tone
          <select className="focus-ring mt-2 w-full rounded-kai border border-ink/15 px-3 py-2" value={kaiTone} onChange={(event) => setKaiTone(event.target.value as KaiTone)}>
            <option value="balanced">Balanced</option>
            <option value="warm">Warm</option>
            <option value="direct">Direct</option>
          </select>
        </label>
      </section>
      <section className="space-y-3">
        {questions.map((question, index) => (
          <label key={question} className="block rounded-kai border border-ink/10 bg-white p-4 text-sm font-semibold">
            {question}
            <textarea
              className="focus-ring mt-2 min-h-20 w-full rounded-kai border border-ink/15 px-3 py-2"
              value={responses[index]}
              onChange={(event) => setResponses((items) => items.map((item, i) => (i === index ? event.target.value : item)))}
            />
          </label>
        ))}
      </section>
      <div className="rounded-kai bg-sage/15 p-4 text-sm">
        Suggested start: <strong className="capitalize">{suggestedEngine}</strong>. You can switch any time.
      </div>
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
      <Button disabled={saving}>{saving ? "Saving" : "Finish onboarding"}</Button>
    </form>
  );
}
