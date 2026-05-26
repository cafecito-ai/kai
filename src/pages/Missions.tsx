import { Archive, Brain, ChevronLeft, ChevronRight, HeartPulse, PenLine, Sparkles, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppHero, AppPage, AppSurface } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { MISSION_PILLARS, type MissionPillar } from "../lib/missions";
import type { Mission, MissionDraft } from "../lib/types";
import { useUserStore } from "../stores/userStore";

const ICONS = {
  body: HeartPulse,
  mind: Brain,
  purpose: Sparkles,
  people: UsersRound
};

const STARTERS: Record<MissionPillar, string> = {
  body: "I am building a body that feels steady enough for my real life.",
  mind: "I am learning how to notice what I feel without getting swallowed by it.",
  purpose: "I am building the version of me that is actually mine.",
  people: "I am practicing relationships that feel honest, kind, and not performative."
};

const QUESTIONS: Record<MissionPillar, { prompt: string; placeholder: string }> = {
  body: {
    prompt: "When your body is actually helping your life, what feels different?",
    placeholder: "Sleep, energy, food, movement, feeling less wired..."
  },
  mind: {
    prompt: "What do you want to get better at carrying mentally?",
    placeholder: "Pressure, spirals, confidence, focus, big feelings..."
  },
  purpose: {
    prompt: "What are you building that feels like it is actually yours?",
    placeholder: "A skill, a goal, a version of you, a thing you care about..."
  },
  people: {
    prompt: "What kind of relationships do you want more of?",
    placeholder: "Less performing, more honesty, repairing conflict, better boundaries..."
  }
};

export function Missions() {
  const kaiName = useUserStore((state) => state.kaiName);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [drafts, setDrafts] = useState<Record<MissionPillar, string>>({
    body: STARTERS.body,
    mind: STARTERS.mind,
    purpose: STARTERS.purpose,
    people: STARTERS.people
  });
  const [saving, setSaving] = useState<MissionPillar | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachStep, setCoachStep] = useState(0);
  const [answers, setAnswers] = useState<Record<MissionPillar, string>>({
    body: "",
    mind: "",
    purpose: "",
    people: ""
  });
  const [reviewDrafts, setReviewDrafts] = useState<MissionDraft[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    void api.getMissions().then((result) => setMissions(result.missions)).catch(() => undefined);
  }, []);

  const activeByPillar = useMemo(() => {
    const map = new Map<MissionPillar, Mission>();
    for (const mission of missions) {
      if (mission.status === "active") map.set(mission.pillar, mission);
    }
    return map;
  }, [missions]);

  async function saveMission(pillar: MissionPillar) {
    const statement = drafts[pillar].trim();
    if (!statement) return;
    setSaving(pillar);
    try {
      const result = await api.createMission({ pillar, statement });
      setMissions((items) => [result.mission, ...items.map((item) => (item.pillar === pillar && item.status === "active" ? { ...item, status: "archived" as const } : item))]);
    } finally {
      setSaving(null);
    }
  }

  async function archiveMission(mission: Mission) {
    setMissions((items) => items.map((item) => (item.id === mission.id ? { ...item, status: "archived" } : item)));
    await api.deleteMission(mission.id).catch(() => undefined);
  }

  async function reviewWithKai() {
    setReviewing(true);
    try {
      const result = await api.reviewMissions(answers);
      setReviewDrafts(result.drafts);
    } catch {
      setReviewDrafts(
        MISSION_PILLARS.map((pillar) => ({
          pillar: pillar.id,
          statement: STARTERS[pillar.id],
          why: answers[pillar.id] || "Kai can tune this as you use the app."
        }))
      );
    } finally {
      setReviewing(false);
    }
  }

  async function saveAllDrafts() {
    const ready = reviewDrafts.filter((draft) => draft.statement.trim());
    if (!ready.length || savingAll) return;
    setSavingAll(true);
    try {
      const saved: Mission[] = [];
      for (const draft of ready) {
        const result = await api.createMission({ pillar: draft.pillar, statement: draft.statement, why: draft.why });
        saved.push(result.mission);
      }
      const replaced = new Set(saved.map((mission) => mission.pillar));
      setMissions((items) => [...saved, ...items.map((item) => (replaced.has(item.pillar) && item.status === "active" ? { ...item, status: "archived" as const } : item))]);
      setCoachOpen(false);
      setReviewDrafts([]);
      setCoachStep(0);
    } finally {
      setSavingAll(false);
    }
  }

  return (
    <AppPage className="max-w-5xl">
      <AppHero eyebrow="missions" title="The long game, in your words.">
        Missions are the identity tracks {kaiName} can coach against over time. They stay separate from today's score.
      </AppHero>

      <AppSurface className="p-5 sm:p-6" variant="dark">
        {!coachOpen ? (
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-paper/55">Build with {kaiName}</p>
              <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal text-paper">Let {kaiName} turn your answers into missions.</h2>
              <p className="mt-3 max-w-xl text-sm font-semibold leading-6 text-paper/70">
                Four quick questions. You edit everything before it saves. No parent-goal energy.
              </p>
            </div>
            <Button className="bg-paper text-ink hover:bg-paper/90" onClick={() => setCoachOpen(true)}>
              <PenLine size={17} aria-hidden="true" />
              Build missions
            </Button>
          </div>
        ) : reviewDrafts.length > 0 ? (
          <MissionReview
            drafts={reviewDrafts}
            saving={savingAll}
            onChange={setReviewDrafts}
            onBack={() => setReviewDrafts([])}
            onSave={() => void saveAllDrafts()}
          />
        ) : (
          <MissionCoach
            kaiName={kaiName}
            step={coachStep}
            answers={answers}
            reviewing={reviewing}
            onAnswer={(pillar, value) => setAnswers((state) => ({ ...state, [pillar]: value }))}
            onStep={setCoachStep}
            onClose={() => setCoachOpen(false)}
            onReview={() => void reviewWithKai()}
          />
        )}
      </AppSurface>

      <div className="grid gap-4 lg:grid-cols-2">
        {MISSION_PILLARS.map((pillar) => {
          const Icon = ICONS[pillar.id];
          const active = activeByPillar.get(pillar.id);
          return (
            <AppSurface key={pillar.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink shadow-sm">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="eyebrow">{pillar.label}</p>
                  <h2 className="mt-1 font-display text-2xl font-black tracking-normal">{active ? "Active mission" : "Draft mission"}</h2>
                </div>
              </div>
              {active ? (
                <div className="mt-4">
                  <p className="rounded-kai border border-line bg-paper p-4 text-sm font-semibold leading-6 text-ink">{active.statement}</p>
                  <Button className="mt-3" variant="secondary" onClick={() => void archiveMission(active)}>
                    <Archive size={16} aria-hidden="true" />
                    Archive
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
                  <textarea
                    className="field min-h-28"
                    value={drafts[pillar.id]}
                    onChange={(event) => setDrafts((state) => ({ ...state, [pillar.id]: event.target.value }))}
                  />
                  <Button className="mt-3" onClick={() => void saveMission(pillar.id)} disabled={saving === pillar.id || !drafts[pillar.id].trim()}>
                    {saving === pillar.id ? "Saving" : "Save mission"}
                  </Button>
                </div>
              )}
            </AppSurface>
          );
        })}
      </div>
    </AppPage>
  );
}

function MissionCoach({
  kaiName,
  step,
  answers,
  reviewing,
  onAnswer,
  onStep,
  onClose,
  onReview
}: {
  kaiName: string;
  step: number;
  answers: Record<MissionPillar, string>;
  reviewing: boolean;
  onAnswer: (pillar: MissionPillar, value: string) => void;
  onStep: (step: number) => void;
  onClose: () => void;
  onReview: () => void;
}) {
  const pillar = MISSION_PILLARS[step];
  const question = QUESTIONS[pillar.id];
  const isLast = step === MISSION_PILLARS.length - 1;

  return (
    <div className="grid gap-5 lg:grid-cols-[14rem_1fr]">
      <div>
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-paper/55">{kaiName} mission build</p>
        <div className="mt-4 grid gap-2">
          {MISSION_PILLARS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onStep(index)}
              className={`focus-ring flex min-h-11 items-center justify-between rounded-full px-3 text-left text-xs font-black ${
                index === step ? "bg-paper text-ink" : "bg-white/8 text-paper/70 hover:bg-white/12"
              }`}
            >
              {item.label}
              <span>{index + 1}/4</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-paper/55">{pillar.label}</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl font-black leading-none tracking-normal text-paper">{question.prompt}</h2>
        <textarea
          className="mt-5 min-h-36 w-full rounded-[22px] border border-white/12 bg-white/10 px-4 py-3 text-base font-semibold leading-7 text-paper placeholder:text-paper/38 focus:outline-none focus:ring-2 focus:ring-paper/70"
          value={answers[pillar.id]}
          onChange={(event) => onAnswer(pillar.id, event.target.value)}
          placeholder={question.placeholder}
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" className="border-white/15 bg-white/10 text-paper hover:bg-white/15" onClick={onClose}>
            Close
          </Button>
          {step > 0 && (
            <Button variant="secondary" className="border-white/15 bg-white/10 text-paper hover:bg-white/15" onClick={() => onStep(step - 1)}>
              <ChevronLeft size={17} aria-hidden="true" />
              Back
            </Button>
          )}
          {isLast ? (
            <Button className="bg-paper text-ink hover:bg-paper/90" disabled={reviewing} onClick={onReview}>
              <Sparkles size={17} aria-hidden="true" />
              {reviewing ? "Drafting" : "Review drafts"}
            </Button>
          ) : (
            <Button className="bg-paper text-ink hover:bg-paper/90" onClick={() => onStep(step + 1)}>
              Next
              <ChevronRight size={17} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MissionReview({
  drafts,
  saving,
  onChange,
  onBack,
  onSave
}: {
  drafts: MissionDraft[];
  saving: boolean;
  onChange: (drafts: MissionDraft[]) => void;
  onBack: () => void;
  onSave: () => void;
}) {
  function update(index: number, patch: Partial<MissionDraft>) {
    onChange(drafts.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)));
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-paper/55">mission.review</p>
          <h2 className="mt-2 font-display text-3xl font-black leading-none tracking-normal text-paper">Edit before this becomes real.</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="border-white/15 bg-white/10 text-paper hover:bg-white/15" onClick={onBack}>
            Back
          </Button>
          <Button className="bg-paper text-ink hover:bg-paper/90" disabled={saving} onClick={onSave}>
            {saving ? "Saving" : "Save all"}
          </Button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {drafts.map((draft, index) => {
          const pillar = MISSION_PILLARS.find((item) => item.id === draft.pillar);
          return (
            <section key={draft.pillar} className="rounded-[24px] border border-white/12 bg-white/10 p-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-paper/55">{pillar?.label ?? draft.pillar}</p>
              <textarea
                className="mt-3 min-h-24 w-full rounded-[18px] border border-white/10 bg-white px-3 py-2 text-sm font-black leading-6 text-ink focus:outline-none focus:ring-2 focus:ring-paper/70"
                value={draft.statement}
                onChange={(event) => update(index, { statement: event.target.value })}
              />
              <textarea
                className="mt-2 min-h-20 w-full rounded-[18px] border border-white/10 bg-white/85 px-3 py-2 text-sm font-semibold leading-6 text-ink focus:outline-none focus:ring-2 focus:ring-paper/70"
                value={draft.why}
                onChange={(event) => update(index, { why: event.target.value })}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
