import { Award } from "lucide-react";
import { useState } from "react";
import { api } from "../../lib/api";
import { STRENGTHS_DISCOVERY_QUESTIONS } from "../../lib/strengths-questions";
import { Button } from "../ui/Button";

/**
 * Strengths-discovery flow. Originally lived inside the purpose
 * engine page; now surfaced from the Mental engine's Purpose tab
 * after the two engines were merged.
 */
export function StrengthsDiscoveryCard({ onComplete }: { onComplete: (summary: string) => void }) {
  const [mode, setMode] = useState<"idle" | "answering" | "summary">("idle");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const answeredCount = STRENGTHS_DISCOVERY_QUESTIONS.filter((q) => responses[q.id]?.trim()).length;

  function setAnswer(id: string, value: string) {
    setResponses((prev) => ({ ...prev, [id]: value }));
  }

  async function submit() {
    if (submitting || answeredCount === 0) return;
    setSubmitting(true);
    try {
      const result = await api.submitStrengthsDiscovery(responses);
      setSummary(result.summary);
      setMode("summary");
      onComplete(result.summary);
    } catch {
      const fallback = STRENGTHS_DISCOVERY_QUESTIONS
        .map((q) => responses[q.id]?.trim())
        .filter(Boolean)
        .slice(0, 3)
        .join("; ");
      setSummary(fallback ? `A few patterns to play with: ${fallback}.` : "");
      setMode("summary");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
      <div className="mb-5 grid size-12 place-items-center rounded-full bg-[#EEEAFF] text-plum">
        <Award />
      </div>
      <p className="eyebrow">strengths discovery</p>
      <h2 className="mt-2 font-display text-3xl font-black tracking-normal">Turn patterns into a first experiment.</h2>
      <p className="mt-3 text-sm leading-6 text-muted">
        Fifteen questions in five sections — energy, curiosity, feedback, repetition, courage. Takes about 15 minutes. No big life plan required.
      </p>

      {mode === "idle" && (
        <Button className="mt-4" variant="secondary" onClick={() => setMode("answering")}>
          Start strengths discovery
        </Button>
      )}

      {mode === "answering" && (
        <div className="mt-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {answeredCount} of {STRENGTHS_DISCOVERY_QUESTIONS.length} answered — skip any that don't land
          </p>
          {STRENGTHS_DISCOVERY_QUESTIONS.map((q, index) => (
            <label key={q.id} className="block">
              <span className="block text-sm font-semibold leading-snug">
                {index + 1}. {q.prompt}
              </span>
              <textarea
                className="field mt-2 min-h-20 w-full"
                value={responses[q.id] ?? ""}
                onChange={(event) => setAnswer(q.id, event.target.value)}
                placeholder="Anything you've got — even half a thought is fine."
              />
            </label>
          ))}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={submitting || answeredCount === 0}>
              {submitting ? "Generating summary…" : "See Kai's read"}
            </Button>
            <Button variant="secondary" onClick={() => setMode("idle")}>
              Close
            </Button>
          </div>
        </div>
      )}

      {mode === "summary" && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Working draft from Kai</p>
          <p className="rounded-kai border border-line bg-paper p-3 text-sm leading-6 text-ink">
            {summary || "Couldn't generate a summary this time. Save what you wrote and come back to it."}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setMode("answering")}>
              Edit answers
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setResponses({});
                setSummary("");
                setMode("idle");
              }}
            >
              Start over
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
