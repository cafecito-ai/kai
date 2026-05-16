import { ArrowLeft, ArrowRight, CheckCircle2, Clipboard, Flame, Gamepad2, LockKeyhole, Rocket, ShieldCheck, Sparkles, Target, Trophy, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { DemoFeedbackChoices } from "../lib/types";

type MissionId = "vibe" | "firstLoop" | "comeback" | "voice" | "parents" | "sources" | "safety" | "testers" | "review";

type Mission = {
  id: MissionId;
  kind: "choice" | "text" | "review";
  level: string;
  title: string;
  prompt: string;
  blocker?: string;
  options?: Array<{ value: string; title: string; copy: string }>;
  placeholder?: string;
};

const missions: Mission[] = [
  {
    id: "vibe",
    kind: "choice",
    level: "Level 1",
    title: "Choose the world.",
    prompt: "If Kai opens on your phone, what lane makes you not instantly close it?",
    blocker: "Unblocks D1 design direction.",
    options: [
      { value: "Quest Mode", title: "Quest Mode", copy: "XP, belts, unlocks, character growth." },
      { value: "Lifestyle Feed", title: "Lifestyle Feed", copy: "Photos, wins, identity, friend energy." },
      { value: "Calm Coach", title: "Calm Coach", copy: "Clean, trusted, private, less noisy." }
    ]
  },
  {
    id: "firstLoop",
    kind: "choice",
    level: "Level 2",
    title: "Pick the first daily loop.",
    prompt: "What should a teen do first that feels useful in under 30 seconds?",
    blocker: "Unblocks the first daily habit we polish.",
    options: [
      { value: "Food Camera", title: "Food Camera", copy: "Snap food and get a useful read, not a calorie lecture." },
      { value: "Streaks + Belts", title: "Streaks + Belts", copy: "Turn small wins into visible progress." },
      { value: "Emotional Check-in", title: "Pressure Check", copy: "Name the pressure and get one reset move." },
      { value: "Home-screen Character", title: "Character Buddy", copy: "A companion that changes because you came back." }
    ]
  },
  {
    id: "comeback",
    kind: "text",
    level: "Level 3",
    title: "Design tomorrow.",
    prompt: "What would make you come back tomorrow without an adult reminding you?",
    blocker: "Unblocks the retention loop.",
    placeholder: "Example: streak freeze, friend challenge, Kai remembers my goal, funny daily mission..."
  },
  {
    id: "voice",
    kind: "text",
    level: "Level 4",
    title: "Kill the cringe.",
    prompt: "What should Kai never say or do because it would feel fake, corny, school-ish, or annoying?",
    blocker: "Unblocks voice review for the open content PRs.",
    placeholder: "Write the exact stuff that would make a 16-year-old roll their eyes."
  },
  {
    id: "parents",
    kind: "choice",
    level: "Level 5",
    title: "Set parent visibility.",
    prompt: "What parent mode would feel safe without making the app feel like surveillance?",
    blocker: "Unblocks parent-safety defaults.",
    options: [
      { value: "Safety-only", title: "Safety-only", copy: "Parents only get notified for serious safety boundaries." },
      { value: "Weekly Summary", title: "Weekly Summary", copy: "Light recap: reps, streaks, no private journal details." },
      { value: "Shared Wins", title: "Shared Wins", copy: "Teen chooses wins to share when they want." }
    ]
  },
  {
    id: "sources",
    kind: "text",
    level: "Boss 1",
    title: "Pick Kai's brain.",
    prompt: "Who or what should Kai learn from so it sounds legit to you?",
    blocker: "Unblocks D4 source materials.",
    placeholder: "Books, creators, coaches, athletes, therapists, apps, YouTube channels, podcasts, anything."
  },
  {
    id: "safety",
    kind: "text",
    level: "Boss 2",
    title: "Draw the red lines.",
    prompt: "Which topics need an adult expert before friends test this?",
    blocker: "Unblocks D5 clinical/safety review.",
    placeholder: "Example: body image, substances, trauma, sex ed, eating, self-harm, anxiety..."
  },
  {
    id: "testers",
    kind: "text",
    level: "Boss 3",
    title: "Build the test squad.",
    prompt: "Who are 3-5 types of teens who should test Kai first, and what would they honestly care about?",
    blocker: "Unblocks friend-test cohort plan.",
    placeholder: "Example: athlete, honors student, gamer, someone anxious, someone trying to eat better..."
  },
  {
    id: "review",
    kind: "review",
    level: "Final",
    title: "Ship Lev's build brief.",
    prompt: "This turns your answers into the next sprint list.",
    blocker: "Saves the full co-builder brief for the team."
  }
];

const defaultAnswers: Record<string, string> = {};
const buildMissionCount = missions.filter((mission) => mission.kind !== "review").length;

export function Demo() {
  const [missionIndex, setMissionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(defaultAnswers);
  const [sessionId] = useState(() => makeSessionId());
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const mission = missions[missionIndex];
  const liveMission = useMemo(() => missionForAnswers(mission, answers), [mission, answers]);
  const skin = useMemo(() => skinForVibe(answers.vibe), [answers.vibe]);
  const completed = useMemo(() => missions.filter((item) => item.kind !== "review" && answers[item.id]?.trim()).length, [answers]);
  const summary = useMemo(() => buildScopeSummary(answers), [answers]);
  const canGoBack = missionIndex > 0;
  const canGoNext = missionIndex < missions.length - 1;

  useEffect(() => {
    const tag = document.createElement("meta");
    tag.name = "robots";
    tag.content = "noindex, nofollow";
    document.head.appendChild(tag);
    const prevTitle = document.title;
    document.title = "Kai Co-Builder Quest";
    return () => {
      tag.remove();
      document.title = prevTitle;
    };
  }, []);

  const save = async (nextAnswers = answers) => {
    const answerCount = Object.values(nextAnswers).filter(Boolean).length;
    if (!answerCount) return;
    setSaveState("saving");
    try {
      await api.submitScopeFeedback({ sessionId, answers: nextAnswers, completedMissions: answerCount, summary: buildScopeSummary(nextAnswers) });
      await api.submitDemoFeedback({
        sessionId,
        choices: choicesFromAnswers(nextAnswers),
        summary: buildScopeSummary(nextAnswers),
        stepId: mission.id,
        stepIndex: missionIndex,
        source: "auto"
      });
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const answerMission = (value: string) => {
    const nextAnswers = { ...answers, [mission.id]: value };
    setAnswers(nextAnswers);
    void save(nextAnswers);
  };

  const next = () => {
    void save(answers);
    setMissionIndex((current) => Math.min(missions.length - 1, current + 1));
  };

  const back = () => setMissionIndex((current) => Math.max(0, current - 1));

  const copySummary = async () => {
    try {
      await navigator.clipboard?.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className={`min-h-screen text-paper ${skin.page}`}>
      <section className="mx-auto grid w-full max-w-[calc(100vw-1rem)] gap-3 py-2 sm:max-w-6xl sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-5">
        <div className="min-w-0">
          <Hero completed={completed} saveState={saveState} answers={answers} skin={skin} />
          <MissionRail missionIndex={missionIndex} onJump={setMissionIndex} answers={answers} skin={skin} />
          <section className={`mt-3 overflow-hidden rounded-[1.35rem] border ${skin.panelBorder} ${skin.panel} shadow-[0_24px_90px_rgba(0,0,0,0.5)]`}>
            <div className={`border-b border-white/10 ${skin.header} p-4 sm:p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${skin.accentText}`}>{liveMission.level}</p>
                <StatusPill saveState={saveState} />
              </div>
              <h1 className="mt-3 max-w-3xl font-display text-[2.15rem] font-black leading-none tracking-normal sm:text-6xl">{liveMission.title}</h1>
              <p className="mt-3 max-w-2xl text-base font-bold leading-7 text-paper/72">{liveMission.prompt}</p>
              {liveMission.blocker && <p className={`mt-4 inline-flex rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wider ${skin.blocker}`}>{liveMission.blocker}</p>}
            </div>

            <div className="p-4 sm:p-6">
              {liveMission.kind === "choice" && <ChoiceMission mission={liveMission} value={answers[liveMission.id] ?? ""} onChoose={answerMission} skin={skin} />}
              {liveMission.kind === "text" && <TextMission mission={liveMission} value={answers[liveMission.id] ?? ""} onChange={answerMission} skin={skin} />}
              {liveMission.kind === "review" && <ReviewMission answers={answers} summary={summary} copied={copied} onCopy={copySummary} onSave={() => save(answers)} saveState={saveState} skin={skin} />}
              <ImpactPreview answers={answers} mission={liveMission} skin={skin} />

              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <button type="button" onClick={back} disabled={!canGoBack} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 text-sm font-black text-paper disabled:cursor-not-allowed disabled:opacity-40">
                  <ArrowLeft size={17} />
                  Back
                </button>
                <p className="hidden text-center text-xs font-black uppercase tracking-wider text-paper/45 sm:block">{missionIndex + 1} of {missions.length}</p>
                {canGoNext ? (
                  <button type="button" onClick={next} className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full ${skin.cta} px-5 text-sm font-black shadow-[0_12px_36px_rgba(34,211,238,0.28)]`}>
                    Next mission
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button type="button" onClick={() => save(answers)} className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full ${skin.cta} px-5 text-sm font-black`}>
                    Save brief
                    <ShieldCheck size={17} />
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6">
          <BuildConsole answers={answers} completed={completed} skin={skin} />
        </aside>
      </section>
    </main>
  );
}

type Skin = ReturnType<typeof skinForVibe>;

function Hero({ completed, saveState, answers, skin }: { completed: number; saveState: "idle" | "saving" | "saved" | "error"; answers: Record<string, string>; skin: Skin }) {
  return (
    <section className={`relative overflow-hidden rounded-[1.35rem] border ${skin.panelBorder} ${skin.panel} p-4 shadow-[0_18px_70px_rgba(0,0,0,0.48)] sm:p-7`}>
      <div className={`absolute -right-12 -top-16 size-40 rounded-full ${skin.glowA} blur-2xl`} />
      <div className={`absolute -bottom-20 left-8 size-36 rounded-full ${skin.glowB} blur-2xl`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${skin.accentText}`}>Kai co-builder quest</p>
          <h1 className="mt-2 font-display text-[2rem] font-black leading-none tracking-normal sm:text-6xl">{skin.heroTitle}</h1>
          <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-paper/70 sm:text-base">{skin.heroCopy}</p>
          {answers.vibe && <p className={`mt-3 inline-flex rounded-full border px-3 py-2 text-xs font-black uppercase tracking-wider ${skin.blocker}`}>{answers.vibe} skin active</p>}
        </div>
        <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-paper font-serif text-2xl italic text-[#050505] shadow-[0_0_36px_rgba(163,255,18,0.35)]">k</span>
      </div>
      <div className="relative mt-4 grid grid-cols-2 gap-2 text-xs font-black sm:grid-cols-4">
        <Stat icon={Trophy} label="missions" value={`${completed}/${buildMissionCount}`} skin={skin} />
        <Stat icon={Flame} label="mode" value={answers.vibe ? railLabelFromText(answers.vibe) : "open"} skin={skin} />
        <Stat icon={LockKeyhole} label="loop" value={answers.firstLoop ? railLabelFromText(answers.firstLoop) : "open"} skin={skin} />
        <Stat icon={saveState === "saved" ? CheckCircle2 : Rocket} label="save" value={saveState === "saved" ? "synced" : "auto"} skin={skin} />
      </div>
    </section>
  );
}

function MissionRail({ missionIndex, onJump, answers, skin }: { missionIndex: number; onJump: (index: number) => void; answers: Record<string, string>; skin: Skin }) {
  return (
    <nav className="mt-3 grid grid-cols-5 gap-1 sm:grid-cols-9" aria-label="Co-builder missions">
      {missions.map((mission, index) => {
        const done = Boolean(answers[mission.id]?.trim());
        const active = index === missionIndex;
        return (
          <button key={mission.id} type="button" onClick={() => onJump(index)} className={`focus-ring min-h-14 rounded-[14px] border px-2 py-2 text-center transition ${active ? skin.railActive : "border-white/12 bg-white/8 text-paper"}`}>
            <span className={`block text-[8px] font-black uppercase tracking-wider ${active ? "text-[#050505]/55" : "text-paper/48"}`}>{done ? "done" : mission.level}</span>
            <span className="mt-1 block truncate text-[11px] font-black">{railLabel(mission.id)}</span>
          </button>
        );
      })}
    </nav>
  );
}

function ChoiceMission({ mission, value, onChoose, skin }: { mission: Mission; value: string; onChoose: (value: string) => void; skin: Skin }) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {mission.options?.map((option) => {
        const selected = value === option.value;
        return (
          <button key={option.value} type="button" onClick={() => onChoose(option.value)} className={`focus-ring min-h-28 rounded-[22px] border p-4 text-left transition hover:-translate-y-0.5 ${selected ? `border-transparent ${skin.choiceSelected} text-paper shadow-[0_20px_54px_rgba(0,0,0,0.32)]` : "border-white/12 bg-white text-ink"}`}>
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${selected ? "bg-white/18 text-paper" : "bg-[#050505]/8 text-muted"}`}>{selected ? "locked" : "pick"}</span>
            <span className="mt-4 block font-display text-2xl font-black leading-none">{option.title}</span>
            <span className={`mt-2 block text-sm font-bold leading-5 ${selected ? "text-paper/75" : "text-muted"}`}>{option.copy}</span>
          </button>
        );
      })}
    </div>
  );
}

function TextMission({ mission, value, onChange, skin }: { mission: Mission; value: string; onChange: (value: string) => void; skin: Skin }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white p-4 text-ink shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={mission.placeholder}
        className={`min-h-44 w-full resize-none rounded-[18px] border border-line bg-paper p-4 text-base font-bold leading-7 text-ink outline-none placeholder:text-muted ${skin.focusBorder}`}
      />
      <p className="mt-3 text-xs font-black uppercase tracking-wider text-muted">{value.trim() ? "Autosaving this blocker answer" : "Write like you are texting the build team"}</p>
    </div>
  );
}

function ReviewMission({ answers, summary, copied, onCopy, onSave, saveState, skin }: { answers: Record<string, string>; summary: string; copied: boolean; onCopy: () => void; onSave: () => void; saveState: "idle" | "saving" | "saved" | "error"; skin: Skin }) {
  return (
    <div className="grid gap-3">
      <div className={`rounded-[24px] border p-4 ${skin.reviewBox}`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.22em] ${skin.accentText}`}>Lev's build brief</p>
        <p className="mt-3 text-base font-black leading-7 text-paper">{summary}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {missions.filter((mission) => mission.kind !== "review").map((mission) => (
          <div key={mission.id} className="rounded-[18px] border border-white/12 bg-white/8 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-paper/45">{mission.title}</p>
            <p className="mt-1 text-sm font-black text-paper">{answers[mission.id] || "Not answered yet"}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={onSave} disabled={saveState === "saving"} className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full ${skin.cta} px-4 text-sm font-black disabled:opacity-60`}>
          <ShieldCheck size={17} />
          {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : "Save brief"}
        </button>
        <button type="button" onClick={onCopy} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-4 text-sm font-black text-paper hover:bg-white/10">
          <Clipboard size={17} />
          {copied ? "Copied" : "Copy for WhatsApp"}
        </button>
      </div>
    </div>
  );
}

function ImpactPreview({ answers, mission, skin }: { answers: Record<string, string>; mission: Mission; skin: Skin }) {
  if (!answers.vibe && !answers.firstLoop && !answers.parents && mission.id === "vibe") return null;
  return (
    <section className={`mt-4 rounded-[22px] border p-4 ${skin.preview}`}>
      <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${skin.accentText}`}>prototype changed</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-black leading-none">{previewTitle(answers)}</h2>
          <p className="mt-2 text-sm font-bold leading-6 text-paper/70">{previewCopy(answers, mission.id)}</p>
        </div>
        <div className={`min-w-28 rounded-[20px] border border-white/12 p-3 text-center ${skin.previewBadge}`}>
          <p className="text-[9px] font-black uppercase tracking-wider text-paper/50">next screen</p>
          <p className="mt-1 text-sm font-black">{nextScreenLabel(answers)}</p>
        </div>
      </div>
    </section>
  );
}

function BuildConsole({ answers, completed, skin }: { answers: Record<string, string>; completed: number; skin: Skin }) {
  return (
    <section className={`rounded-[2rem] border ${skin.panelBorder} ${skin.panel} p-4 shadow-[0_24px_90px_rgba(0,0,0,0.42)]`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${skin.accentText}`}>build console</p>
          <h2 className="mt-1 font-display text-2xl font-black">{skin.consoleTitle}</h2>
        </div>
        <Gamepad2 className={skin.accentText} size={26} />
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${skin.progress}`} style={{ width: `${Math.round((completed / buildMissionCount) * 100)}%` }} />
      </div>
      <div className="mt-4 grid gap-2">
        <ConsoleRow icon={Sparkles} label="Vibe" value={answers.vibe || "open"} />
        <ConsoleRow icon={Target} label="First loop" value={answers.firstLoop || "open"} />
        <ConsoleRow icon={Rocket} label="Comeback" value={answers.comeback || comebackNudge(answers)} />
        <ConsoleRow icon={Flame} label="Voice rule" value={answers.voice || voiceNudge(answers)} />
        <ConsoleRow icon={UsersRound} label="Testers" value={answers.testers || "open"} />
        <ConsoleRow icon={ShieldCheck} label="Safety lines" value={answers.safety || "open"} />
      </div>
    </section>
  );
}

function ConsoleRow({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/6 p-3">
      <div className="flex items-center gap-2">
        <Icon size={16} className="shrink-0 text-[#22D3EE]" />
        <p className="text-[10px] font-black uppercase tracking-wider text-paper/45">{label}</p>
      </div>
      <p className="mt-1 max-h-16 overflow-hidden text-sm font-black text-paper">{value}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value, skin }: { icon: typeof Trophy; label: string; value: string; skin: Skin }) {
  return (
    <div className="rounded-[16px] border border-white/12 bg-white/8 p-3">
      <Icon size={16} className={skin.accentText} />
      <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-paper/45">{label}</p>
      <p className="text-sm font-black text-paper">{value}</p>
    </div>
  );
}

function StatusPill({ saveState }: { saveState: "idle" | "saving" | "saved" | "error" }) {
  const label = saveState === "saving" ? "saving" : saveState === "saved" ? "answers saved" : saveState === "error" ? "save failed" : "autosave on";
  const tone = saveState === "error" ? "bg-dangerWash text-danger" : saveState === "saved" ? "bg-[#A3FF12] text-[#050505]" : "bg-white/10 text-paper/70";
  return <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${tone}`}>{label}</span>;
}

function missionForAnswers(mission: Mission, answers: Record<string, string>): Mission {
  const vibe = answers.vibe || "Kai";
  const loop = answers.firstLoop || "the first loop";
  if (mission.id === "firstLoop" && answers.vibe) {
    return {
      ...mission,
      title: `Pick the first ${railLabelFromText(vibe)} loop.`,
      prompt: firstLoopPrompt(answers.vibe),
      blocker: `Turns ${vibe} from a visual idea into the first daily action.`
    };
  }
  if (mission.id === "comeback") {
    return {
      ...mission,
      prompt: answers.firstLoop
        ? `After someone uses ${loop}, what would make them want to open Kai again tomorrow?`
        : mission.prompt,
      placeholder: comebackNudge(answers)
    };
  }
  if (mission.id === "voice") {
    return {
      ...mission,
      prompt: `In ${vibe} mode, what should Kai never say because it would feel fake, corny, school-ish, or annoying?`,
      placeholder: voiceNudge(answers)
    };
  }
  if (mission.id === "parents") {
    return {
      ...mission,
      prompt: answers.firstLoop
        ? `If the first habit is ${loop}, what should parents see without making the app feel watched?`
        : mission.prompt
    };
  }
  if (mission.id === "sources") {
    return {
      ...mission,
      prompt: `Who should Kai learn from to make ${vibe} + ${loop} feel legit?`,
      placeholder: sourceNudge(answers)
    };
  }
  if (mission.id === "safety") {
    return {
      ...mission,
      prompt: `What needs an adult expert before we let friends test the ${vibe} version?`,
      placeholder: safetyNudge(answers)
    };
  }
  if (mission.id === "testers") {
    return {
      ...mission,
      prompt: `Who should test the ${vibe} version first, and what would they honestly care about?`,
      placeholder: testerNudge(answers)
    };
  }
  if (mission.id === "review") {
    return {
      ...mission,
      title: `Ship the ${vibe} build brief.`
    };
  }
  return mission;
}

function skinForVibe(vibe?: string) {
  if (vibe === "Lifestyle Feed") {
    return {
      page: "bg-[#07120D]",
      panel: "bg-[#0D1B14]",
      panelBorder: "border-[#34D399]/22",
      header: "bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.26),transparent_38%),#0D1B14]",
      glowA: "bg-[#34D399]/35",
      glowB: "bg-[#F472B6]/24",
      accentText: "text-[#34D399]",
      blocker: "border-[#34D399]/35 bg-[#34D399]/12 text-[#34D399]",
      cta: "bg-[linear-gradient(135deg,#34D399,#F472B6)] text-[#05100B]",
      railActive: "border-[#34D399] bg-[#34D399] text-[#05100B]",
      choiceSelected: "bg-[linear-gradient(135deg,#10B981,#F472B6)]",
      progress: "bg-[linear-gradient(90deg,#34D399,#F472B6)]",
      focusBorder: "focus:border-[#34D399]",
      preview: "border-[#34D399]/20 bg-[#34D399]/8",
      previewBadge: "bg-[#34D399]/16",
      reviewBox: "border-[#34D399]/45 bg-[#34D399]/10",
      heroTitle: "Build the version teens would post about.",
      heroCopy: "Lifestyle mode changes missions toward identity, photos, shareable wins, and friend testing.",
      consoleTitle: "Feed Draft"
    };
  }
  if (vibe === "Calm Coach") {
    return {
      page: "bg-[#101010]",
      panel: "bg-[#171717]",
      panelBorder: "border-white/14",
      header: "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_38%),#171717]",
      glowA: "bg-white/20",
      glowB: "bg-[#93C5FD]/18",
      accentText: "text-[#F8FAFC]",
      blocker: "border-white/25 bg-white/10 text-paper",
      cta: "bg-white text-[#080808]",
      railActive: "border-white bg-white text-[#080808]",
      choiceSelected: "bg-[linear-gradient(135deg,#111111,#555555)]",
      progress: "bg-[linear-gradient(90deg,#F8FAFC,#93C5FD)]",
      focusBorder: "focus:border-[#111111]",
      preview: "border-white/14 bg-white/8",
      previewBadge: "bg-white/10",
      reviewBox: "border-white/25 bg-white/8",
      heroTitle: "Build the version teens trust privately.",
      heroCopy: "Calm Coach mode changes missions toward privacy, low-noise prompts, and parent trust.",
      consoleTitle: "Coach Draft"
    };
  }
  return {
    page: "bg-[#050505]",
    panel: "bg-[#101010]",
    panelBorder: "border-white/12",
    header: "bg-[radial-gradient(circle_at_top_right,rgba(163,255,18,0.18),transparent_38%),#111]",
    glowA: "bg-[#A3FF12]/35",
    glowB: "bg-[#22D3EE]/24",
    accentText: "text-[#A3FF12]",
    blocker: "border-[#A3FF12]/30 bg-[#A3FF12]/10 text-[#A3FF12]",
    cta: "bg-[linear-gradient(135deg,#A3FF12,#22D3EE)] text-[#050505]",
    railActive: "border-[#A3FF12] bg-[#A3FF12] text-[#050505]",
    choiceSelected: "bg-[linear-gradient(135deg,#6D5DF6,#22D3EE)]",
    progress: "bg-[linear-gradient(90deg,#A3FF12,#22D3EE)]",
    focusBorder: "focus:border-[#6D5DF6]",
    preview: "border-[#A3FF12]/20 bg-[#A3FF12]/8",
    previewBadge: "bg-[#A3FF12]/12",
    reviewBox: "border-[#A3FF12]/45 bg-[#A3FF12]/10",
    heroTitle: vibe ? "Build the game loop." : "Help build the app.",
    heroCopy: vibe
      ? "Quest mode changes missions toward XP, levels, unlocks, and daily comeback mechanics."
      : "Every answer fills a real blocker: design, voice, sources, safety review, and first testers.",
    consoleTitle: "Quest Draft"
  };
}

function railLabel(id: MissionId) {
  if (id === "vibe") return "Vibe";
  if (id === "firstLoop") return "Loop";
  if (id === "comeback") return "Return";
  if (id === "voice") return "Voice";
  if (id === "parents") return "Parent";
  if (id === "sources") return "Brain";
  if (id === "safety") return "Safety";
  if (id === "testers") return "Squad";
  return "Brief";
}

function railLabelFromText(value: string) {
  if (value === "Lifestyle Feed") return "Lifestyle";
  if (value === "Calm Coach") return "Coach";
  if (value === "Quest Mode") return "Quest";
  return value.replace("Home-screen ", "").split(/\s+/).slice(0, 2).join(" ");
}

function firstLoopPrompt(vibe: string) {
  if (vibe === "Lifestyle Feed") return "What should someone capture first so Kai feels personal, visual, and not like homework?";
  if (vibe === "Calm Coach") return "What is the smallest private action that would make Kai feel useful immediately?";
  return "What should a teen do first that creates XP, progress, or a visible unlock in under 30 seconds?";
}

function comebackNudge(answers: Record<string, string>) {
  if (answers.vibe === "Lifestyle Feed") return "Example: a daily photo prompt, private recap, friend reaction, streak album, shareable win...";
  if (answers.vibe === "Calm Coach") return "Example: Kai remembers what I said, one quiet next step, no spam, a useful morning check-in...";
  if (answers.firstLoop === "Streaks + Belts") return "Example: streak freeze, boss challenge, belt progress, weekly unlock, friend duel...";
  return "Example: streak freeze, friend challenge, Kai remembers my goal, funny daily mission...";
}

function voiceNudge(answers: Record<string, string>) {
  if (answers.vibe === "Lifestyle Feed") return "Write captions, phrases, emojis, or fake influencer energy Kai should avoid.";
  if (answers.vibe === "Calm Coach") return "Write anything that would feel too therapist-y, too parental, or too dramatic.";
  return "Write the exact stuff that would make a 16-year-old roll their eyes.";
}

function sourceNudge(answers: Record<string, string>) {
  if (answers.firstLoop === "Food Camera") return "Food creators, trainers, nutrition voices, athletes, apps, or books that do not feel diet-y.";
  if (answers.vibe === "Quest Mode") return "Games, leveling systems, creators, coaches, athletes, books, or apps Kai should learn from.";
  return "Books, creators, coaches, athletes, therapists, apps, YouTube channels, podcasts, anything.";
}

function safetyNudge(answers: Record<string, string>) {
  if (answers.firstLoop === "Food Camera") return "Example: body image, eating, calories, weight, substances, self-harm, medical advice...";
  if (answers.vibe === "Lifestyle Feed") return "Example: sharing, photos, body image, comparison, bullying, DMs, privacy, AI images...";
  return "Example: body image, substances, trauma, sex ed, eating, self-harm, anxiety...";
}

function testerNudge(answers: Record<string, string>) {
  if (answers.vibe === "Quest Mode") return "Example: athlete, gamer, competitive student, friend group captain, someone who loves streaks...";
  if (answers.vibe === "Lifestyle Feed") return "Example: creator, athlete, social teen, private teen, someone who tracks outfits/food/wins...";
  return "Example: athlete, honors student, gamer, someone anxious, someone trying to eat better...";
}

function previewTitle(answers: Record<string, string>) {
  if (!answers.vibe) return "Pick a world to change the build.";
  if (!answers.firstLoop) return `${answers.vibe} shell loaded.`;
  return `${answers.vibe} + ${answers.firstLoop}`;
}

function previewCopy(answers: Record<string, string>, missionId: MissionId) {
  if (missionId === "vibe" && answers.vibe) return `The rest of the quest now uses ${answers.vibe} language, colors, and blocker framing.`;
  if (missionId === "firstLoop" && answers.firstLoop) return `Next missions ask how ${answers.firstLoop} gets someone to come back, what voice ruins it, and what safety lines apply.`;
  if (missionId === "parents" && answers.parents) return `Parent decisions now attach to ${answers.parents}, not a generic safety model.`;
  if (missionId === "sources" && answers.sources) return "Kai's prompt grounding can now point at source material Lev actually respects.";
  if (missionId === "safety" && answers.safety) return "The clinical review list is now shaped by Lev's red lines.";
  if (missionId === "testers" && answers.testers) return "The first friend-test plan can now be built around the teens Lev names.";
  return "Your current answers are changing the build console and the next mission prompts.";
}

function nextScreenLabel(answers: Record<string, string>) {
  if (answers.vibe === "Lifestyle Feed") return "Feed card";
  if (answers.vibe === "Calm Coach") return "Quiet prompt";
  if (answers.firstLoop === "Streaks + Belts") return "XP unlock";
  return "Mission card";
}

function choicesFromAnswers(answers: Record<string, string>): DemoFeedbackChoices {
  return {
    ui: normalizeChoice(answers.vibe, ["Calm Coach", "Quest Mode", "Lifestyle Feed"], "Quest Mode") as DemoFeedbackChoices["ui"],
    habit: normalizeChoice(answers.firstLoop, ["Food Camera", "Emotional Check-in", "Streaks + Belts", "Home-screen Character"], "Food Camera") as DemoFeedbackChoices["habit"],
    onboarding: "Goal Setup",
    parent: normalizeChoice(answers.parents, ["Safety-only", "Weekly Summary", "Shared Wins"], "Safety-only") as DemoFeedbackChoices["parent"]
  };
}

function normalizeChoice(value: string | undefined, allowed: string[], fallback: string) {
  return allowed.includes(value ?? "") ? value ?? fallback : fallback;
}

function buildScopeSummary(answers: Record<string, string>) {
  return [
    `Vibe: ${answers.vibe || "open"}`,
    `First loop: ${answers.firstLoop || "open"}`,
    `Comeback hook: ${answers.comeback || "open"}`,
    `Cringe rules: ${answers.voice || "open"}`,
    `Parent mode: ${answers.parents || "open"}`,
    `Sources: ${answers.sources || "open"}`,
    `Safety review lines: ${answers.safety || "open"}`,
    `First testers: ${answers.testers || "open"}`
  ].join("\n");
}

function makeSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `scope-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
