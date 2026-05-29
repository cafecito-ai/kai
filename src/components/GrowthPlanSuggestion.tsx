import { Check, Target } from "lucide-react";
import { useState } from "react";

import { api } from "../lib/api";
import { createLocalGoal } from "../lib/local-goals";
import type { GrowthPlanSuggestion as GrowthPlanSuggestionType } from "../lib/types";

type Status = "idle" | "adding" | "added" | "error";

export function GrowthPlanSuggestion({
  suggestion,
}: {
  suggestion: GrowthPlanSuggestionType;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function addToGrowthPlan() {
    if (status === "adding" || status === "added") return;
    setStatus("adding");
    setMessage("");

    const local = createLocalGoal({
      title: suggestion.title,
      category: "growth",
    });
    if ("error" in local) {
      setStatus("error");
      setMessage(local.error);
      return;
    }

    setStatus("added");
    setMessage("Added to your Growth Plan.");
    void api
      .createGoal({
        category: "custom",
        title: suggestion.title,
        description: suggestion.description,
      })
      .catch(() => undefined);
  }

  return (
    <div className="mt-3 rounded-lg border border-glass-border bg-surface px-3 py-3 shadow-card">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-goalsWash text-goals">
          <Target size={15} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-text-primary">
            {suggestion.title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            {suggestion.description}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void addToGrowthPlan()}
        disabled={status === "adding" || status === "added"}
        className="
          mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full
          bg-text-primary px-4 text-sm font-medium text-background
          transition active:scale-[0.99] disabled:bg-success disabled:text-white
          focus-ring
        "
      >
        {status === "added" ? <Check size={15} aria-hidden="true" /> : <Target size={15} aria-hidden="true" />}
        {status === "adding" ? "Adding…" : status === "added" ? "Added" : "Add to Growth Plan"}
      </button>
      {message ? (
        <p className={`mt-2 text-center text-xs ${status === "error" ? "text-danger" : "text-text-muted"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
