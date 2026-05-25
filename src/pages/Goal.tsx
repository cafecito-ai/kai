import { ArrowRight, Brain, CheckCircle2, Dumbbell, Flame, HeartPulse, Plus, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppHero, AppPage, AppSurface, MetricPill } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import type { Goal as GoalRecord } from "../lib/types";
import { useProgressStore } from "../stores/progressStore";

const goalTemplates: Array<{
  title: string;
  category: GoalRecord["category"];
  description: string;
  route: string;
  icon: typeof Brain;
}> = [
  {
    title: "Feel steady before school or practice",
    category: "custom",
    description: "Use one guide lens, one reset, and one small next step when pressure spikes.",
    route: "/mental?module=guides",
    icon: Brain
  },
  {
    title: "Fuel and recover correctly",
    category: "sport",
    description: "Log food, stretch / move, and log sleep so the body loop supports training.",
    route: "/health?module=food",
    icon: Dumbbell
  },
  {
    title: "Build one identity habit",
    category: "custom",
    description: "Make the rep small enough to repeat without fake motivation.",
    route: "/mental?module=purpose",
    icon: Flame
  }
];

export function Goal() {
  const addEvent = useProgressStore((state) => state.addEvent);
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [title, setTitle] = useState("Feel steady before practice");
  const [description, setDescription] = useState("Use one guide lens, one reset, and one next rep.");
  const [category, setCategory] = useState<GoalRecord["category"]>(goalTemplates[0].category);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void api.getGoals().then((result) => setGoals(result.goals)).catch(() => undefined);
  }, []);

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === "active"), [goals]);
  const achievedGoals = useMemo(() => goals.filter((goal) => goal.status === "achieved"), [goals]);
  const primaryGoal = activeGoals[0];

  function applyTemplate(template: (typeof goalTemplates)[number]) {
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setMessage("");
  }

  async function createGoal() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setMessage("Add a clear goal first.");
      return;
    }
    setSaving(true);
    setMessage("");
    const optimistic: GoalRecord = {
      id: crypto.randomUUID(),
      category,
      title: cleanTitle,
      description: description.trim(),
      status: "active"
    };
    setGoals((items) => [optimistic, ...items]);
    addEvent({ engine: "mental", eventType: "goal_committed", eventValue: 24, payload: { title: cleanTitle, source: "goal_route" } });
    try {
      const result = await api.createGoal({ category, title: cleanTitle, description: description.trim() });
      setGoals((items) => items.map((goal) => (goal.id === optimistic.id ? result.goal : goal)));
      setMessage("Goal saved. Take it into the loop.");
    } catch {
      setMessage("Goal saved locally for this demo session.");
    } finally {
      setSaving(false);
    }
  }

  async function markAchieved(goal: GoalRecord) {
    setGoals((items) => items.map((item) => (item.id === goal.id ? { ...item, status: "achieved" } : item)));
    addEvent({ engine: "mental", eventType: "goal_achieved", eventValue: 38, payload: { goalId: goal.id, title: goal.title, source: "goal_route" } });
    await api.updateGoal(goal.id, { status: "achieved" }).catch(() => undefined);
  }

  return (
    <AppPage className="max-w-6xl">
      <AppHero
        eyebrow="app section · goal"
        title={
          <>
            Pick one goal small enough to <span className="font-serif font-normal italic text-plum">start.</span>
          </>
        }
        action={
          <Link to="/loop" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
            Open loop
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        }
      >
        Set one clear direction, then run one next rep.
      </AppHero>

      <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <AppSurface className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">goal builder</p>
              <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal">Make the commitment concrete.</h2>
            </div>
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-goalsWash text-goals">
              <Target aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            <label className="block text-sm font-black">
              Goal
              <input className="field mt-2" value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="block text-sm font-black">
              Why this matters
              <textarea className="field mt-2 min-h-28" value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className="block text-sm font-black">
              Lane
              <select className="field mt-2" value={category} onChange={(event) => setCategory(event.target.value as GoalRecord["category"])}>
                <option value="custom">Custom</option>
                <option value="school">School</option>
                <option value="instrument">Instrument</option>
                <option value="sport">Sport</option>
                <option value="business">Business</option>
                <option value="charity">Charity</option>
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void createGoal()} disabled={saving}>
                <Plus size={17} aria-hidden="true" />
                {saving ? "Saving" : "Save goal"}
              </Button>
              {message && <span className="text-sm font-semibold text-muted">{message}</span>}
            </div>
          </div>
        </AppSurface>

        <div className="grid gap-4">
          <AppSurface className="p-5 sm:p-6">
            <p className="eyebrow">starter options</p>
            <div className="mt-4 grid gap-3">
              {goalTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.title}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="focus-ring rounded-[22px] border border-line bg-white p-4 text-left transition hover:border-ink/35"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-resetWash text-reset">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-black leading-tight text-ink">{template.title}</span>
                        <span className="mt-1 block text-sm font-semibold leading-5 text-muted">{template.description}</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </AppSurface>

          <AppSurface className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <MetricPill label="Active" value={String(activeGoals.length)} tone="goals" />
              <MetricPill label="Finished" value={String(achievedGoals.length)} tone="care" />
              <MetricPill label="Next" value={primaryGoal ? "Loop" : "Set"} tone="body" />
            </div>
            <div className="mt-5 space-y-2">
              {activeGoals.length === 0 && <p className="rounded-kai border border-line bg-paper p-3 text-sm font-semibold text-muted">No active goals yet. Save one goal, then run it through the loop.</p>}
              {activeGoals.slice(0, 4).map((goal) => (
                <div key={goal.id} className="rounded-kai border border-line bg-paper p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-ink">{goal.title}</p>
                      {goal.description && <p className="mt-1 text-sm font-semibold leading-5 text-muted">{goal.description}</p>}
                    </div>
                    <button type="button" onClick={() => void markAchieved(goal)} className="focus-ring grid size-10 shrink-0 place-items-center rounded-full bg-white text-sage" aria-label={`Mark ${goal.title} achieved`}>
                      <CheckCircle2 size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AppSurface>
        </div>
      </div>

      <AppSurface className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div className="min-w-0">
          <p className="eyebrow">demo path</p>
          <h2 className="mt-2 font-display text-2xl font-black tracking-normal">A goal is not done until it enters the daily loop.</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-muted">Use the loop to connect the goal to a mental signal, a body signal, and one visible rep.</p>
        </div>
        <Link to="/loop" className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-black text-paper">
          Run loop
          <HeartPulse size={17} aria-hidden="true" />
        </Link>
      </AppSurface>
    </AppPage>
  );
}
