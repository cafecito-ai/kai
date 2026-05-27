import { ArrowRight, Check, ChevronLeft, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { KAI_ACTIONS, type KaiAction } from "../lib/kai-actions";
import type { EngineId, KaiTone } from "../lib/types";
import { useKaiStore } from "../stores/kaiStore";
import { useUserStore } from "../stores/userStore";

type AnswerId = "goal" | "habits" | "sleep" | "fitness" | "mind" | "schedule" | "motivation";
type Answers = Partial<Record<AnswerId, string>>;

type Question = {
  id: AnswerId;
  eyebrow: string;
  prompt: (answers: Answers) => string;
  helper: string;
  placeholder: string;
  chips: string[];
};

const questions: Question[] = [
  {
    id: "goal",
    eyebrow: "Goals + interests",
    prompt: () => "What are you trying to improve right now?",
    helper: "Could be body, school, confidence, discipline, sport, sleep, friends, anything.",
    placeholder: "I want to get better at...",
    chips: ["more discipline", "better body", "confidence", "school", "sports", "less scrolling"]
  },
  {
    id: "habits",
    eyebrow: "Habits + lifestyle",
    prompt: (answers) => goalAwareQuestion(answers.goal, "What does a normal day look like for you?"),
    helper: "KAI needs the actual routine, not the ideal one.",
    placeholder: "School, practice, phone, food, homework...",
    chips: ["school heavy", "practice after school", "phone at night", "skip breakfast", "busy weekends", "no routine"]
  },
  {
    id: "sleep",
    eyebrow: "Sleep + energy",
    prompt: () => "How has your sleep and energy been lately?",
    helper: "Recovery changes everything: mood, focus, motivation, workouts.",
    placeholder: "I sleep around... and wake up feeling...",
    chips: ["tired", "wired at night", "solid sleep", "random schedule", "wake up drained", "late phone"]
  },
  {
    id: "fitness",
    eyebrow: "Body + fitness",
    prompt: () => "Where is your body at right now?",
    helper: "No body judgment. This is for movement, recovery, food, posture, and health habits.",
    placeholder: "Training, not training, sore, hungry, trying to build...",
    chips: ["active", "starting over", "sore/tight", "want muscle", "need food help", "not moving much"]
  },
  {
    id: "mind",
    eyebrow: "Mental state + struggles",
    prompt: (answers) => struggleAwareQuestion(answers.goal, "What has been getting in the way?"),
    helper: "Stress, comparison, loneliness, procrastination, confidence, family, pressure. Say the real version.",
    placeholder: "The thing that keeps messing me up is...",
    chips: ["overthinking", "procrastination", "comparison", "social pressure", "low confidence", "stress"]
  },
  {
    id: "schedule",
    eyebrow: "Schedule",
    prompt: () => "When can KAI realistically help you during the day?",
    helper: "Tiny windows count. The point is consistency, not a perfect routine.",
    placeholder: "Before school, after practice, late night, weekends...",
    chips: ["morning", "after school", "after practice", "night", "weekends", "random pockets"]
  },
  {
    id: "motivation",
    eyebrow: "Motivation",
    prompt: () => "What kind of push works on you?",
    helper: "KAI should feel like a coach/friend, not a parent or a lecture.",
    placeholder: "I need direct accountability / calm reminders / proof I am improving...",
    chips: ["direct", "calm", "competitive", "gentle", "accountability", "no corny hype"]
  }
];

export function Onboarding() {
  const navigate = useNavigate();
  const { setKai, setPrimaryEngine, setConsentPending, markOnboardingComplete } = useUserStore();
  const hydrateKaiChat = useKaiStore((state) => state.hydrate);
  const [name, setName] = useState("");
  const [age, setAge] = useState("16");
  const [parentEmail, setParentEmail] = useState("");
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Answers>({});
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const normalizedAge = Number(age) || undefined;
  const needsParentConsent = Boolean(normalizedAge && normalizedAge < 13);
  const currentQuestion = step >= 0 ? questions[step] : null;
  const isLastQuestion = step === questions.length - 1;
  const progress = step < 0 ? 8 : Math.round(((step + 1) / questions.length) * 100);
  const canContinue = step < 0 ? Boolean(name.trim()) && (!needsParentConsent || Boolean(parentEmail.trim())) : Boolean(draft.trim() || answers[currentQuestion?.id ?? "goal"]);
  const firstMove = useMemo(() => inferFirstMove(answers), [answers]);
  const kaiTone = inferTone(answers.motivation);

  function start() {
    setError("");
    if (!name.trim()) {
      setError("Tell KAI what to call you first.");
      return;
    }
    if (needsParentConsent && !parentEmail.trim()) {
      setError("Parent email is required for users under 13.");
      return;
    }
    setStep(0);
  }

  function selectChip(value: string) {
    setDraft(value);
  }

  function saveCurrentAnswer() {
    if (!currentQuestion) return;
    const value = draft.trim() || answers[currentQuestion.id]?.trim();
    if (!value) return;
    setAnswers((items) => ({ ...items, [currentQuestion.id]: value }));
    setDraft("");
    if (isLastQuestion) {
      void finish({ ...answers, [currentQuestion.id]: value });
      return;
    }
    setStep((value) => value + 1);
  }

  async function finish(finalAnswers: Answers) {
    setSaving(true);
    setError("");
    const action = inferFirstMove(finalAnswers);
    const engine = action.engine;
    try {
      await api.submitIntake(buildIntakeAnswers(finalAnswers, action));
      await api.updateUser({
        kaiName: "KAI",
        kaiTone,
        primaryEngine: engine,
        age: normalizedAge,
        parentEmail: parentEmail.trim() || undefined,
        onboardingCompleted: true
      });
      if (needsParentConsent && parentEmail.trim()) {
        await api.sendParentConsent({ parentEmail: parentEmail.trim(), teenName: name.trim() });
        setConsentPending(parentEmail.trim());
      }
    } catch {
      setError("KAI could not sync setup yet, but your local setup is ready.");
    } finally {
      setKai("KAI", kaiTone);
      setPrimaryEngine(engine);
      markOnboardingComplete();
      hydrateKaiChat("kai", {
        conversationId: null,
        messages: [
          {
            id: "onboarding-kai-first-message",
            role: "assistant",
            content: buildFirstMessage(name.trim(), finalAnswers, action)
          }
        ],
        nextAction: action.action
      });
      setSaving(false);
      navigate("/walkthrough");
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-2xl flex-col justify-center px-3 py-4 text-[#111116] sm:px-4">
      <section className="overflow-hidden rounded-[34px] border border-[#0A0A0A0F] bg-[#FAFAF7] shadow-[0_24px_90px_rgba(10,10,10,0.12)]">
        <header className="border-b border-[#0A0A0A0F] bg-white/76 px-4 py-4 backdrop-blur-xl sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <KaiAvatar size={44} label="KAI" pulse />
              <div>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-[#8A8A8F]">Meet KAI</p>
                <h1 className="text-xl font-black leading-tight">First coach chat</h1>
              </div>
            </div>
            <Link to="/crisis" className="text-xs font-black text-[#C4473E]">
              Crisis
            </Link>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F0EFEC]">
            <div className="h-full rounded-full bg-[#111116] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <div className="max-h-[calc(100svh-14rem)] min-h-[32rem] overflow-y-auto px-4 py-4 sm:px-5">
          <CoachBubble>
            {step < 0 ? (
              <>
                I’m KAI. Think coach, friend, and mirror. I’ll ask a few real questions so I can help without guessing.
              </>
            ) : (
              <>
                <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-[#8A8A8F]">{currentQuestion?.eyebrow}</span>
                <span className="mt-1 block">{currentQuestion?.prompt(answers)}</span>
                <span className="mt-2 block text-sm font-semibold leading-6 text-[#5E5E64]">{currentQuestion?.helper}</span>
              </>
            )}
          </CoachBubble>

          {step < 0 ? (
            <section className="mt-4 space-y-3 rounded-[26px] border border-[#0A0A0A0F] bg-white p-4">
              <label className="block text-sm font-black">
                What should KAI call you?
                <input className="field mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="First name" />
              </label>
              <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
                <label className="block text-sm font-black">
                  Age
                  <input className="field mt-2" inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value)} />
                </label>
                <label className="block text-sm font-black">
                  Parent email {needsParentConsent ? "(required)" : "(optional)"}
                  <input className="field mt-2" type="email" value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} placeholder="parent@example.com" />
                </label>
              </div>
              <p className="text-sm font-semibold leading-6 text-[#5E5E64]">
                Parent email is only required for users under 13. Private answers and chats stay private by default.
              </p>
            </section>
          ) : (
            <QuestionInput question={currentQuestion} draft={draft} setDraft={setDraft} onSelectChip={selectChip} />
          )}

          {Object.entries(answers).map(([id, value]) => (
            <UserBubble key={id}>{value}</UserBubble>
          ))}

          {step >= 0 && currentQuestion && answers[currentQuestion.id] && <CoachBubble>{followUpFor(currentQuestion.id)}</CoachBubble>}
        </div>

        {error && <p className="mx-4 mb-3 rounded-[18px] border border-[#E35D4F]/25 bg-[#FFF0EC] p-3 text-sm font-black text-[#C4473E] sm:mx-5">{error}</p>}

        <footer className="grid gap-2 border-t border-[#0A0A0A0F] bg-white/76 p-3 backdrop-blur-xl sm:grid-cols-[auto_1fr] sm:p-4">
          {step > -1 && (
            <Button type="button" variant="secondary" onClick={() => setStep((value) => value - 1)} className="w-full sm:w-auto">
              <ChevronLeft size={18} aria-hidden="true" />
              Back
            </Button>
          )}
          {step < 0 ? (
            <Button type="button" onClick={start} disabled={!canContinue} className="min-h-12 w-full">
              Start
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          ) : (
            <Button type="button" onClick={saveCurrentAnswer} disabled={!canContinue || saving} className="min-h-12 w-full">
              {saving ? "Saving" : isLastQuestion ? `Open Home with ${firstMove.action.label}` : "Send"}
              {isLastQuestion ? <ArrowRight size={18} aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
            </Button>
          )}
        </footer>
      </section>
    </main>
  );
}

function CoachBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <KaiAvatar size={38} label="KAI" pulse />
      <div className="max-w-[88%] rounded-[24px] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#111116] shadow-sm">{children}</div>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 ml-auto max-w-[82%] rounded-[24px] bg-[#111116] px-4 py-3 text-sm font-semibold leading-6 text-white">
      {children}
    </div>
  );
}

function QuestionInput({
  question,
  draft,
  setDraft,
  onSelectChip
}: {
  question: Question | null;
  draft: string;
  setDraft: (value: string) => void;
  onSelectChip: (value: string) => void;
}) {
  if (!question) return null;
  return (
    <section className="mt-4 rounded-[26px] border border-[#0A0A0A0F] bg-white p-4">
      <div className="flex flex-wrap gap-2">
        {question.chips.map((chip) => {
          const active = draft === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => onSelectChip(chip)}
              className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm font-black transition ${
                active ? "border-[#111116] bg-[#111116] text-white" : "border-[#0A0A0A0F] bg-[#F4F1EB] text-[#5E5E64] hover:bg-white hover:text-[#111116]"
              }`}
            >
              {active && <Check size={14} aria-hidden="true" />}
              {chip}
            </button>
          );
        })}
      </div>
      <textarea
        className="field mt-4 min-h-28 resize-none"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={question.placeholder}
      />
    </section>
  );
}

function goalAwareQuestion(goal: string | undefined, fallback: string) {
  if (!goal) return fallback;
  return `If ${goal} is the goal, what does a normal day look like right now?`;
}

function struggleAwareQuestion(goal: string | undefined, fallback: string) {
  if (!goal) return fallback;
  return `What usually gets in the way of ${goal}?`;
}

function followUpFor(id: AnswerId) {
  if (id === "goal") return "Good. I’ll use that as the north star, but we’ll keep the first move small.";
  if (id === "habits") return "That routine matters. Systems beat motivation when life gets loud.";
  if (id === "sleep") return "Sleep is usually the hidden lever. I’ll keep recovery in the read.";
  if (id === "fitness") return "Got it. No body judgment. Just useful signals and healthier reps.";
  if (id === "mind") return "That’s the honest part. KAI works better when the obstacle is named.";
  if (id === "schedule") return "Perfect. Tiny windows are enough if they repeat.";
  return "That tells me how to push without being annoying.";
}

function inferTone(motivation: string | undefined): KaiTone {
  const text = motivation?.toLowerCase() ?? "";
  if (/gentle|calm|soft/.test(text)) return "warm";
  if (/direct|competitive|accountability/.test(text)) return "direct";
  return "balanced";
}

function inferFirstMove(answers: Answers): { action: KaiAction; engine: EngineId } {
  const text = Object.values(answers).join(" ").toLowerCase();
  if (/sleep|tired|wired|drained|recovery/.test(text)) return { action: KAI_ACTIONS.sleep, engine: "physical" };
  if (/food|eat|breakfast|hungry|meal|fuel|muscle/.test(text)) return { action: KAI_ACTIONS.food, engine: "physical" };
  if (/fitness|sport|practice|body|sore|tight|moving|workout/.test(text)) return { action: KAI_ACTIONS.stretch, engine: "physical" };
  if (/phone|scroll|tiktok|instagram|comparison/.test(text)) return { action: KAI_ACTIONS.screen, engine: "mental" };
  if (/friend|social|lonely|pressure/.test(text)) return { action: KAI_ACTIONS.social, engine: "mental" };
  if (/confidence|insecure/.test(text)) return { action: KAI_ACTIONS.confidence, engine: "mental" };
  if (/school|goal|discipline|procrastination|homework|schedule/.test(text)) return { action: KAI_ACTIONS.goal, engine: "potential" };
  return { action: KAI_ACTIONS.talk, engine: "mental" };
}

function buildIntakeAnswers(answers: Answers, firstMove: { action: KaiAction; engine: EngineId }) {
  return {
    q1: `Goals and interests: ${answers.goal ?? "not answered"}`,
    q2: `Habits, lifestyle, and schedule: ${answers.habits ?? "not answered"} Schedule: ${answers.schedule ?? "not answered"}`,
    q3: `Sleep patterns, energy, and fitness level: ${answers.sleep ?? "not answered"} Fitness/body: ${answers.fitness ?? "not answered"}`,
    q4: `Mental state, struggles, and blockers: ${answers.mind ?? "not answered"}`,
    q5: `Motivation and coaching style: ${answers.motivation ?? "not answered"}`,
    q6: `First recommended move: ${firstMove.action.label}. Engine: ${firstMove.engine}. Route: ${firstMove.action.route}.`
  };
}

function buildFirstMessage(name: string, answers: Answers, firstMove: { action: KaiAction; engine: EngineId }) {
  const goal = answers.goal ? `You said you want ${answers.goal}.` : "I’ve got enough to start.";
  const obstacle = answers.mind ? ` The thing in the way: ${answers.mind}.` : "";
  const schedule = answers.schedule ? ` We’ll work around ${answers.schedule}.` : "";
  return `Good to meet you${name ? `, ${name}` : ""}. ${goal}${obstacle}${schedule} First move: ${firstMove.action.label.toLowerCase()}. Tell me what is going on today, and I’ll help you choose the next rep.`;
}
