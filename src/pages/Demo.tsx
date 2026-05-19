import { ArrowRight, Bell, CalendarDays, Camera, Check, ChevronDown, Flame, Images, Loader2, Mail, MessageCircle, Mic, Music, Phone, RefreshCw, Send, Share2, Sparkles, Trophy, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { KaiAvatar } from "../components/ui/AppPrimitives";
import { api } from "../lib/api";

/**
 * /demo — 5-act guided experience that lets Lev (or any teen) feel Kai land
 * in their hands in ~3 minutes. Saves nothing to a backend except the
 * existing scope/demo feedback rows at the end. Real Kai chat in Act 3
 * hits /api/demo-kai which calls the safety classifier + Claude.
 *
 * Acts: 1) Meet  2) Read  3) Chat  4) Build  5) Ship
 */

type Act = 1 | 2 | 3 | 4 | 5 | 6;

type ArtStyle = "chibi" | "silhouette" | "pixel" | "minimal";
type KaiTone = "warm" | "balanced" | "direct";
type FirstMove = "fuel" | "pressure" | "win" | "breath";
type TriedKey = "fuel" | "feelings" | "win";

type ChatTurn = { role: "user" | "assistant"; content: string };

type Build = {
  firstName: string;
  vibes: string[];
  art: ArtStyle;
  kaiName: string;
  kaiTone: KaiTone;
  firstMove: FirstMove;
  mustHave: string;
  hardNo: string;
  tester: string;
  // Act-4 "Try" results — what the user actually did in the demo, not just chose.
  // tried[] tracks which mini-flows completed; other fields hold their output.
  tried: TriedKey[];
  goalText: string;
  feelingsSummary: string;
  mealSummary: string;
  // Optional self-ID on Act 5 Ship — lets ops tell whose session is whose
  // (especially Lev's) without coupling the demo to Clerk auth.
  reviewerName: string;
  reviewerEmail: string;
};

const VIBE_CHIPS: { id: string; label: string; emoji: string }[] = [
  { id: "tired",     label: "Tired",     emoji: "😴" },
  { id: "hyped",     label: "Hyped",     emoji: "⚡" },
  { id: "stuck",     label: "Stuck",     emoji: "🪨" },
  { id: "curious",   label: "Curious",   emoji: "👀" },
  { id: "hungry",    label: "Hungry",    emoji: "🍜" },
  { id: "locked-in", label: "Locked-in", emoji: "🎯" },
  { id: "anxious",   label: "Anxious",   emoji: "🌀" },
  { id: "bored",     label: "Bored",     emoji: "🥱" },
  { id: "funny",     label: "Funny",     emoji: "😂" },
  { id: "quiet",     label: "Quiet",     emoji: "🌙" },
  { id: "plotting",  label: "Plotting",  emoji: "🧠" },
  { id: "moving",    label: "Moving",    emoji: "🏃" }
];

const ART_STYLES: { id: ArtStyle; label: string; desc: string }[] = [
  { id: "chibi",      label: "Chibi",      desc: "Big head, soft edges, color pop" },
  { id: "pixel",      label: "Pixel",      desc: "16-bit, blocky, game-feel" },
  { id: "minimal",    label: "Minimal",    desc: "One line, mostly white" },
  { id: "silhouette", label: "Silhouette", desc: "Mystery cut-out, all attitude" }
];

const TONES: { id: KaiTone; label: string; sample: string }[] = [
  { id: "warm",     label: "Warm",     sample: "Hey. That sounds heavy. I'm not going anywhere — what's actually loud right now?" },
  { id: "balanced", label: "Balanced", sample: "Got it. Couple options — talk it through, or try one quick reset. Pick what fits." },
  { id: "direct",   label: "Direct",   sample: "OK. 60-second move: name the one thing pulling on you, then we cut it in half." }
];

const FIRST_MOVES: { id: FirstMove; label: string; desc: string; teaser: string }[] = [
  { id: "fuel",     label: "Fuel snap",     desc: "Quick photo read, no calorie lecture",   teaser: "Snap lunch, get a real read" },
  { id: "pressure", label: "Pressure check", desc: "Name what's loud, get one reset move",   teaser: "Name the pressure" },
  { id: "win",      label: "One win",       desc: "Log one thing that went right today",   teaser: "Name one thing that went right" },
  { id: "breath",   label: "60-sec reset",  desc: "One short guided breath",                teaser: "60 seconds. Reset." }
];

const STORAGE_KEY = "kai_demo_build_v1";

export function Demo() {
  const [act, setAct] = useState<Act>(1);
  const [build, setBuild] = useState<Build>(() => loadSeedOrSaved());
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [seenHomeCard, setSeenHomeCard] = useState(false);
  // Try-act detail blobs lifted out of the Minis so the autosave hook below
  // can ship them to the server. NOT persisted to localStorage — they're
  // verbose, and refresh resets the Try act anyway.
  const [feelingsTranscript, setFeelingsTranscript] = useState<ChatTurn[] | null>(null);
  const [mealResult, setMealResult] = useState<unknown>(null);

  // Lock title + noindex
  useEffect(() => {
    document.title = "Kai — meet your coach";
    const meta = document.createElement("meta");
    meta.name = "robots"; meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  // Persist build (so refresh + share links work)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(build)); } catch { /* ignore */ }
  }, [build]);

  // Server-side autosave. Debounced 800ms so a burst of typing or rapid act
  // navigation collapses into one POST. Skips the first "just landed" state
  // (act === 1 with empty vibes) so we don't pollute the table with every
  // page view; the first real save fires after the user advances past Meet.
  useEffect(() => {
    const meaningful = act > 1 || build.vibes.length > 0 || build.firstName.length > 0;
    if (!meaningful) return;
    const timer = window.setTimeout(() => {
      void api.saveDemoSession({
        sessionId: getOrMakeSession(),
        reviewerName: build.reviewerName.trim() || undefined,
        reviewerEmail: build.reviewerEmail.trim() || undefined,
        build,
        chat,
        feelings: feelingsTranscript ? { transcript: feelingsTranscript, summary: build.feelingsSummary } : undefined,
        meal: mealResult ?? undefined,
        tried: build.tried,
        lastAct: act,
        completed: act === 6
      }).catch(() => {
        // Silent failure — autosave is best-effort. Don't block the demo on a save retry.
      });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [act, build, chat, feelingsTranscript, mealResult]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [act]);

  const update = (patch: Partial<Build>) => setBuild((b) => ({ ...b, ...patch }));

  const sendKaiTurn = async (text: string) => {
    if (!text.trim() || thinking) return;
    const userTurn: ChatTurn = { role: "user", content: text.trim() };
    const nextChat = [...chat, userTurn];
    setChat(nextChat);
    setChatInput("");
    setThinking(true);
    setChatError(null);
    try {
      const result = await withDemoKaiFallback(
        api.demoKai({
          message: userTurn.content,
          history: chat,
          vibes: build.vibes,
          kaiName: build.kaiName,
          kaiTone: build.kaiTone,
          firstName: build.firstName || undefined
        }),
        build,
        userTurn.content
      );
      setChat([...nextChat, { role: "assistant", content: result.reply }]);
      // After 2 user turns, reveal the "home card" moment
      if (nextChat.filter((m) => m.role === "user").length >= 2) {
        setTimeout(() => setSeenHomeCard(true), 350);
      }
    } catch {
      setChat([...nextChat, { role: "assistant", content: fallbackKaiReply(build, userTurn.content) }]);
    } finally {
      setThinking(false);
    }
  };

  const goAct = (a: Act) => setAct(a);

  const shareLink = useMemo(() => buildShareLink(build), [build]);

  const saveBuildBrief = useCallback(async () => {
    await api.submitScopeFeedback({
      sessionId: getOrMakeSession(),
      answers: {
        vibes: build.vibes.join(", "),
        art: build.art,
        kaiName: build.kaiName,
        kaiTone: build.kaiTone,
        firstMove: build.firstMove,
        mustHave: build.mustHave,
        hardNo: build.hardNo,
        tester: build.tester,
        chatSnippet: chat.map((t) => `${t.role}: ${t.content}`).join(" | ").slice(0, 600)
      },
      completedMissions: 5,
      summary: `Demo build by ${build.firstName || "anon"}: ${build.kaiName} (${build.kaiTone}), art=${build.art}, first move=${build.firstMove}, vibes=[${build.vibes.join(", ")}], mustHave=${build.mustHave}, hardNo=${build.hardNo}, tester=${build.tester}`
    });
  }, [build, chat]);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1800);
    } catch { /* ignore */ }
  };

  return (
    <main className="min-h-[100svh] bg-gradient-to-b from-[#0B1419] via-[#0F1419] to-[#0C1218] text-white">
      <ProgressDots act={act} />
      <div className="mx-auto flex max-w-[460px] flex-col gap-5 px-4 pb-14 pt-3 sm:max-w-[520px]">
        {act === 1 && <ActMeet onNext={() => goAct(2)} />}
        {act === 2 && (
          <ActRead
            build={build}
            update={update}
            onNext={() => {
              if (chat.length === 0) {
                // Seed an opening Kai line so Act 3 lands warm — generated from vibes
                const intro = openingFromVibes(build);
                setChat([{ role: "assistant", content: intro }]);
              }
              goAct(3);
            }}
          />
        )}
        {act === 3 && (
          <ActChat
            build={build}
            chat={chat}
            chatInput={chatInput}
            setChatInput={setChatInput}
            send={sendKaiTurn}
            thinking={thinking}
            error={chatError}
            seenHomeCard={seenHomeCard}
            onNext={() => goAct(4)}
          />
        )}
        {act === 4 && (
          <ActTry
            build={build}
            update={update}
            onNext={() => goAct(5)}
            onFeelingsDetail={setFeelingsTranscript}
            onMealDetail={setMealResult}
          />
        )}
        {act === 5 && <ActBuild build={build} update={update} onNext={() => goAct(6)} />}
        {act === 6 && (
          <ActShip
            build={build}
            update={update}
            shareLink={shareLink}
            shareCopied={shareCopied}
            onShare={copyShare}
            onSave={saveBuildBrief}
            onRestart={() => {
              setAct(1);
              setChat([]);
              setSeenHomeCard(false);
              setBuild((b) => ({ ...b, tried: [], goalText: "", feelingsSummary: "", mealSummary: "" }));
            }}
          />
        )}
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Layout chrome                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function ProgressDots({ act }: { act: Act }) {
  const labels = ["meet", "read", "chat", "try", "build", "ship"];
  const xp = Math.round((act / labels.length) * 100);
  return (
    <div className="sticky top-0 z-10 w-full border-b border-white/8 bg-[#0B1419]/85 px-4 py-3 backdrop-blur">
      <div className="mx-auto max-w-[520px]">
        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em]">
          <span className="inline-flex items-center gap-1 text-[#A3FF12]"><Flame size={12} /> co-builder xp</span>
          <span className="text-white/55">{xp}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#A3FF12] to-[#4FC3F7] transition-all duration-500" style={{ width: `${xp}%` }} />
        </div>
        {/* Label row: drops the inline marker character (✓/•) since with 6
            labels at 375px every pixel matters. Color encodes state. */}
        <div className="mt-2 flex items-center justify-between text-[9.5px] font-black uppercase tracking-[0.12em]">
          {labels.map((label, i) => {
            const n = (i + 1) as Act;
            const done = act > n;
            const here = act === n;
            return (
              <span
                key={label}
                aria-current={here ? "step" : undefined}
                className={`truncate ${done ? "text-[#A3FF12]" : here ? "text-white" : "text-white/35"}`}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ACT 1 — Meet Kai                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

function ActMeet({ onNext }: { onNext: () => void }) {
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowCta(true), 450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="flex flex-col gap-6 pt-4">
      <header className="flex items-center gap-3">
        <KaiOrb size={42} />
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">live demo</p>
          <h1 className="text-xl font-black leading-tight">Build Kai with us.</h1>
        </div>
      </header>

      <div className="rounded-[22px] border border-[#A3FF12]/25 bg-[#A3FF12]/8 p-4">
        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#A3FF12]">
          <Trophy size={13} /> Lev mode
        </p>
        <p className="mt-2 text-[17px] font-black leading-6">This is not a deck. Every tap changes the prototype and saves the build brief.</p>
      </div>

      <VoiceHomePreview ready={showCta} />

      <button
        type="button"
        onClick={onNext}
        disabled={!showCta}
        className={`focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#4FC3F7] px-6 text-base font-black text-[#0B1419] shadow-[0_14px_44px_rgba(79,195,247,0.45)] transition disabled:opacity-30 ${
          showCta ? "opacity-100" : "opacity-30"
        }`}
      >
        Start the build <ArrowRight size={18} strokeWidth={3} />
      </button>
      <p className="text-center text-[11px] font-bold text-white/40">~3 minutes · no signup · skip anytime</p>
    </section>
  );
}

function VoiceHomePreview({ ready }: { ready: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[370px] overflow-hidden rounded-[34px] border border-white/12 bg-[#101725] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.48)]">
      <div className="relative min-h-[650px] overflow-hidden rounded-[28px] border border-white/10 bg-[#151B2A] px-4 pb-4 pt-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(117,75,255,0.35),transparent_28%),radial-gradient(circle_at_75%_28%,rgba(79,195,247,0.26),transparent_30%),linear-gradient(160deg,#293247_0%,#15192A_42%,#32263B_68%,#F5A35B_100%)]" />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

        <div className="relative z-[1] mb-4 flex items-center justify-between px-1 text-white">
          <span className="text-[16px] font-black">9:41</span>
          <div className="flex items-center gap-1.5 text-white/85">
            <span className="h-3 w-4 rounded-[3px] border border-white/70" />
            <span className="h-3 w-4 rounded-full border-t-2 border-white/80" />
            <span className="h-3 w-6 rounded-[4px] border border-white/75">
              <span className="ml-0.5 mt-0.5 block h-2 w-4 rounded-[2px] bg-white/85" />
            </span>
          </div>
        </div>

        <VoiceAssistantWidget />

        <div className="relative z-[1] mt-5 grid grid-cols-4 gap-x-4 gap-y-4">
          <AppIcon icon={MessageCircle} label="Kai" tone="from-[#A855F7] to-[#22D3EE]" />
          <AppIcon icon={Camera} label="Fuel" tone="from-[#F97316] to-[#FDE047]" />
          <AppIcon icon={Trophy} label="Wins" tone="from-[#A3FF12] to-[#22C55E]" />
          <AppIcon icon={Sparkles} label="Reset" tone="from-[#7C3AED] to-[#EC4899]" />
          <AppIcon icon={CalendarDays} label="Plan" tone="from-[#F8FAFC] to-[#CBD5E1]" dark />
          <AppIcon icon={Images} label="Photos" tone="from-[#F43F5E] to-[#FACC15]" />
          <AppIcon icon={Mail} label="Inbox" tone="from-[#38BDF8] to-[#2563EB]" />
          <AppIcon icon={Bell} label="Nudges" tone="from-[#FDE68A] to-[#FB7185]" dark />
        </div>

        <div className="relative z-[1] mx-auto mt-5 flex w-max items-center gap-1.5 rounded-full bg-white/18 px-4 py-1.5 text-[13px] font-bold text-white/80 backdrop-blur">
          <Sparkles size={14} /> Search Kai
        </div>

        <div className="relative z-[1] mt-4 grid grid-cols-4 gap-3 rounded-[26px] border border-white/10 bg-white/14 p-3 backdrop-blur-xl">
          <DockIcon icon={Phone} tone="from-[#22C55E] to-[#84CC16]" />
          <DockIcon icon={MessageCircle} tone="from-[#22C55E] to-[#A3FF12]" />
          <DockIcon icon={Music} tone="from-[#FB7185] to-[#EF4444]" />
          <DockIcon icon={Camera} tone="from-[#E5E7EB] to-[#94A3B8]" dark />
        </div>

        <div
          className={`relative z-[1] mt-5 rounded-[22px] border px-4 py-3 text-center text-[12px] font-black uppercase tracking-[0.14em] transition ${
            ready ? "border-[#A3FF12]/40 bg-[#A3FF12]/12 text-[#A3FF12]" : "border-white/10 bg-white/8 text-white/50"
          }`}
        >
          {ready ? "voice preview ready" : "loading voice preview"}
        </div>
      </div>
    </div>
  );
}

function VoiceAssistantWidget() {
  return (
    <div className="relative z-[1] rounded-[28px] border border-white/18 bg-[#14182C]/58 p-3 shadow-[0_24px_80px_rgba(4,7,20,0.42)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-11 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
            <Sparkles size={21} className="text-white" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="whitespace-nowrap text-[14px] font-black text-white">Kai Assistant</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[12px] font-bold text-white/62">
              <span className="size-2 rounded-full bg-[#39F776] shadow-[0_0_12px_rgba(57,247,118,0.8)]" />
              Listening...
            </p>
          </div>
        </div>
        <div className="w-[112px] shrink-0 rounded-[20px] border border-white/10 bg-white/10 px-3 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
          <p className="text-[13px] font-bold leading-5 text-white/86">I can help with food, pressure, or one next move.</p>
          <p className="mt-2 text-[11px] font-bold text-white/42">just now</p>
        </div>
      </div>

      <div className="relative mx-auto mt-6 grid h-[184px] place-items-center overflow-hidden">
        <Waveform />
        <div className="voice-orb relative z-[1] grid size-40 place-items-center rounded-full border border-white/25 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.55),rgba(147,51,234,0.26)_28%,rgba(6,182,212,0.24)_56%,rgba(14,18,38,0.9)_100%)] shadow-[0_0_54px_rgba(168,85,247,0.7)]">
          <div className="absolute h-12 w-24 rounded-[50%] bg-[linear-gradient(90deg,rgba(168,85,247,0.1),rgba(255,255,255,0.8),rgba(34,211,238,0.12))] blur-md" />
          <KaiAvatar size={112} label="Kai Assistant" className="relative z-[1]" />
        </div>
      </div>

      <p className="mt-1 text-center text-[29px] font-black leading-none text-white/88">Tap to talk</p>
      <div className="mt-5 flex items-center justify-center gap-12">
        <button type="button" className="focus-ring grid size-[66px] place-items-center rounded-full border border-white/20 bg-[#7C3AED]/70 text-white shadow-[0_0_36px_rgba(124,58,237,0.58)]">
          <Mic size={34} strokeWidth={2.8} />
        </button>
        <button type="button" className="focus-ring grid size-12 place-items-center rounded-full border border-white/14 bg-white/8 text-white/70">
          <WaveIcon />
        </button>
      </div>
    </div>
  );
}

function Waveform() {
  const bars = [12, 22, 34, 48, 30, 42, 62, 78, 44, 28, 18, 26, 36, 58, 72, 46, 32, 20, 16];
  return (
    <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-1 opacity-80">
      {bars.map((height, index) => (
        <span
          key={`${height}-${index}`}
          className="voice-wave-bar w-[3px] rounded-full bg-[linear-gradient(180deg,#A78BFA,#F0F9FF,#22D3EE)]"
          style={{ height, animationDelay: `${index * 42}ms` }}
        />
      ))}
    </div>
  );
}

function WaveIcon() {
  return (
    <span className="flex h-5 items-center gap-1">
      {[10, 16, 22, 14].map((height, index) => (
        <span key={`wave-icon-${index}`} className="w-[2px] rounded-full bg-current" style={{ height }} />
      ))}
    </span>
  );
}

function AppIcon(props: { icon: typeof Sparkles; label: string; tone: string; dark?: boolean }) {
  const Icon = props.icon;
  const color = props.dark ? "text-[#111827]" : "text-white";
  return (
    <div className="grid justify-items-center gap-1.5">
      <div className={`grid size-[58px] place-items-center rounded-[16px] bg-gradient-to-br ${props.tone} ${color} shadow-[0_8px_22px_rgba(0,0,0,0.24)]`}>
        <Icon size={29} strokeWidth={2.5} />
      </div>
      <p className="max-w-[68px] truncate text-center text-[11px] font-bold text-white/90">{props.label}</p>
    </div>
  );
}

function DockIcon(props: { icon: typeof Sparkles; tone: string; dark?: boolean }) {
  const Icon = props.icon;
  const color = props.dark ? "text-[#111827]" : "text-white";
  return (
    <div className={`grid size-[54px] place-items-center rounded-[16px] bg-gradient-to-br ${props.tone} ${color} shadow-[0_8px_22px_rgba(0,0,0,0.26)]`}>
      <Icon size={28} strokeWidth={2.6} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ACT 2 — Read the vibe                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function ActRead({ build, update, onNext }: { build: Build; update: (p: Partial<Build>) => void; onNext: () => void }) {
  const [name, setName] = useState(build.firstName);
  const canGo = build.vibes.length >= 2 && build.vibes.length <= 4;

  const toggle = (id: string) => {
    const has = build.vibes.includes(id);
    if (has) update({ vibes: build.vibes.filter((v) => v !== id) });
    else if (build.vibes.length < 4) update({ vibes: [...build.vibes, id] });
  };

  return (
    <section className="flex flex-col gap-5">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">unlock 1 of 5</p>
        <h2 className="mt-1 text-3xl font-black leading-none">Pick your loadout.</h2>
        <p className="mt-2 text-[14px] font-medium leading-6 text-white/65">
          Tap 2-4 that fit today. Kai uses this to change the first message.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {VIBE_CHIPS.map((v) => {
          const on = build.vibes.includes(v.id);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => toggle(v.id)}
              className={`focus-ring flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 text-[12px] font-black transition ${
                on
                  ? "border-[#4FC3F7] bg-[#4FC3F7]/15 text-white shadow-[0_8px_28px_rgba(79,195,247,0.22)]"
                  : "border-white/12 bg-white/4 text-white/70 hover:bg-white/8"
              }`}
            >
              <span className="text-xl leading-none">{v.emoji}</span>
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>

      <label className="block">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">what should I call you? (optional)</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 24))}
          onBlur={() => update({ firstName: name.trim() })}
          placeholder="your name or a nickname"
          className="mt-2 w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-base font-black text-[#0B1419] outline-none placeholder:text-[#52616B] focus:border-[#4FC3F7] focus:ring-2 focus:ring-[#4FC3F7]/30"
        />
      </label>

      <button
        type="button"
        onClick={() => { update({ firstName: name.trim() }); onNext(); }}
        disabled={!canGo}
        className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#4FC3F7] px-6 text-base font-black text-[#0B1419] shadow-[0_14px_44px_rgba(79,195,247,0.45)] disabled:cursor-not-allowed disabled:opacity-30"
      >
        Unlock live chat <ArrowRight size={18} strokeWidth={3} />
      </button>
      {!canGo && <p className="text-center text-[11px] font-bold text-white/45">pick at least 2</p>}
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ACT 3 — Live Kai chat                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function ActChat(props: {
  build: Build;
  chat: ChatTurn[];
  chatInput: string;
  setChatInput: (s: string) => void;
  send: (text: string) => Promise<void>;
  thinking: boolean;
  error: string | null;
  seenHomeCard: boolean;
  onNext: () => void;
}) {
  const { build, chat, chatInput, setChatInput, send, thinking, error, seenHomeCard, onNext } = props;
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, thinking]);

  const userTurns = chat.filter((m) => m.role === "user").length;

  return (
    <section className="flex flex-col gap-4">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">unlock 2 of 5 · live</p>
        <h2 className="mt-1 text-3xl font-black leading-none">Talk to Kai.</h2>
        <p className="mt-2 text-[14px] font-medium leading-6 text-white/65">
          Type literally anything. {build.firstName ? `Kai knows your name is ${build.firstName} and ` : "Kai knows "}your vibes are{" "}
          <span className="text-white">{build.vibes.join(", ") || "open"}</span>.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {["school is loud", "food feels weird", "need a reset"].map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void send(prompt)}
            disabled={thinking || userTurns >= 3}
            className="focus-ring min-h-10 rounded-full border border-white/12 bg-white/5 px-3 text-[11px] font-black text-white/70 disabled:opacity-30"
          >
            {prompt}
          </button>
        ))}
      </div>

      <PhoneFrame>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
            <KaiOrb size={26} />
            <div className="flex-1">
              <p className="text-[13px] font-black leading-none">{build.kaiName}</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#4FC3F7]">live · {Math.max(0, 3 - userTurns)} turns left</p>
            </div>
            <MessageCircle size={16} className="text-white/40" />
          </div>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {chat.map((turn, i) => (
              <ChatBubble key={i} role={turn.role} content={turn.content} />
            ))}
            {thinking && <ChatBubble role="assistant" content="…" typing />}
            {error && (
              <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] font-bold text-red-300">{error}</div>
            )}
            {seenHomeCard && <HomeCard build={build} />}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); if (userTurns < 3 && !thinking) void send(chatInput); }}
            className="flex items-center gap-2 border-t border-white/8 px-3 py-3"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={userTurns >= 3 ? "demo chat full — hit continue" : "say something real"}
              disabled={userTurns >= 3 || thinking}
              className="flex-1 rounded-full border border-white/20 bg-white px-4 py-3 text-[14px] font-black text-[#0B1419] outline-none placeholder:text-[#52616B] focus:border-[#4FC3F7] focus:ring-2 focus:ring-[#4FC3F7]/30 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || thinking || userTurns >= 3}
              className="focus-ring grid size-11 shrink-0 place-items-center rounded-full bg-[#4FC3F7] text-[#0B1419] disabled:opacity-30"
            >
              {thinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} strokeWidth={3} />}
            </button>
          </form>
        </div>
      </PhoneFrame>

      <button
        type="button"
        onClick={onNext}
        disabled={chat.filter((m) => m.role === "user").length < 1}
        className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#4FC3F7] px-6 text-base font-black text-[#0B1419] shadow-[0_14px_44px_rgba(79,195,247,0.45)] disabled:opacity-30"
      >
        {seenHomeCard ? "Make Kai mine →" : "Continue → make Kai mine"}
      </button>
      {chat.filter((m) => m.role === "user").length < 1 && (
        <p className="text-center text-[11px] font-bold text-white/45">say one thing first</p>
      )}
    </section>
  );
}

function ChatBubble({ role, content, typing }: { role: "user" | "assistant"; content: string; typing?: boolean }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-[18px] rounded-br-[6px] bg-[#4FC3F7] px-3.5 py-2 text-[14px] font-bold leading-5 text-[#0B1419]">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex max-w-[88%] gap-2">
      <KaiOrb size={22} className="mt-1 shrink-0" />
      <div className="rounded-[18px] rounded-bl-[6px] bg-white/8 px-3.5 py-2.5 text-[14px] leading-5">
        {typing ? <span className="inline-flex items-center gap-1 text-white/60">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-white/70" />
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-white/70 [animation-delay:120ms]" />
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-white/70 [animation-delay:240ms]" />
        </span> : content}
      </div>
    </div>
  );
}

/** The wow moment — a faked Home card animates in after a couple turns. */
function HomeCard({ build }: { build: Build }) {
  const first = FIRST_MOVES.find((m) => m.id === build.firstMove) || FIRST_MOVES[1];
  return (
    <div className="mt-4 animate-[fadeUp_500ms_ease-out_forwards] rounded-[20px] border border-[#4FC3F7]/35 bg-gradient-to-b from-[#4FC3F7]/12 to-transparent p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4FC3F7]">your home, in 1 minute</p>
      <div className="mt-3 flex items-start gap-3">
        <Avatar style={build.art} size={56} level={1} />
        <div className="flex-1">
          <p className="text-[13px] font-black">{build.firstName || "you"} · level 1</p>
          <p className="mt-0.5 text-[11px] font-bold text-white/55">{build.vibes.join(" · ") || "no vibes yet"}</p>
        </div>
      </div>
      <div className="mt-3 rounded-[14px] border border-white/12 bg-white/4 p-3">
        <p className="text-[10px] font-black uppercase tracking-wider text-white/45">tomorrow, kai will ask</p>
        <p className="mt-1 text-[14px] font-black">{first.teaser}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ACT 4 — Try Kai (one win, feelings, fuel snap)                            */
/* ────────────────────────────────────────────────────────────────────────── */

type MiniKey = TriedKey | null;

const TRY_TILES: {
  key: TriedKey;
  label: string;
  teaser: string;
  tagline: string;
  firstMove: FirstMove;
}[] = [
  {
    key: "win",
    label: "One win",
    teaser: "Lock in one thing that went right today — or one thing you want to make happen.",
    tagline: "30 sec · type one line",
    firstMove: "win"
  },
  {
    key: "feelings",
    label: "Feelings check",
    teaser: "Three turns with Kai. Body, head, one reframe. No diagnosis, no lecture.",
    tagline: "90 sec · live Kai",
    firstMove: "pressure"
  },
  {
    key: "fuel",
    label: "Fuel snap",
    teaser: "Snap your meal. Kai reads it descriptively — no calorie lecture.",
    tagline: "20 sec · one photo",
    firstMove: "fuel"
  }
];

// Short post-completion line shown on a locked tile.
function summarizeTry(build: Build, key: TriedKey): string {
  if (key === "win") return build.goalText ? `"${build.goalText.slice(0, 64)}${build.goalText.length > 64 ? "…" : ""}"` : "saved";
  if (key === "feelings") return "kept private · 3 turns done";
  if (key === "fuel") return build.mealSummary ? build.mealSummary.replace(/^snapped:\s*/, "").slice(0, 56) : "logged";
  return "done";
}

function ActTry({
  build,
  update,
  onNext,
  onFeelingsDetail,
  onMealDetail
}: {
  build: Build;
  update: (p: Partial<Build>) => void;
  onNext: () => void;
  onFeelingsDetail: (transcript: ChatTurn[]) => void;
  onMealDetail: (result: unknown) => void;
}) {
  const [openMini, setOpenMini] = useState<MiniKey>(null);
  const canContinue = build.tried.length >= 1;

  // After any successful try, auto-set firstMove to match — so Act 5 (Build)
  // feels like a confirmation instead of asking what they just demonstrated.
  // Only fires when tried[] grows; doesn't override a manual pick afterwards.
  const triedCount = build.tried.length;
  useEffect(() => {
    if (triedCount === 0) return;
    const lastTried = build.tried[triedCount - 1];
    const tile = TRY_TILES.find((t) => t.key === lastTried);
    if (tile && build.firstMove !== tile.firstMove) update({ firstMove: tile.firstMove });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triedCount]);

  const markTried = (key: TriedKey) => {
    if (!build.tried.includes(key)) update({ tried: [...build.tried, key] });
  };

  return (
    <section className="flex flex-col gap-5">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">unlock 3 of 5 · live</p>
        <h2 className="mt-1 text-3xl font-black leading-none">Try one thing.</h2>
        <p className="mt-2 text-[14px] font-medium leading-6 text-white/65">
          Tap a card. Each takes under a minute. Skip the rest.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {TRY_TILES.map((tile) => {
          const done = build.tried.includes(tile.key);
          const isOpen = openMini === tile.key;
          const lockedSummary = done ? summarizeTry(build, tile.key) : "";
          return (
            <div
              key={tile.key}
              className={`overflow-hidden rounded-[22px] border transition-colors ${
                done
                  ? "border-[#A3FF12]/40 bg-[#A3FF12]/8"
                  : isOpen
                  ? "border-[#4FC3F7]/50 bg-[#4FC3F7]/8"
                  : "border-white/12 bg-white/4 hover:border-white/20 hover:bg-white/6"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  // Locked tiles stay collapsed — re-opening a completed sub-flow
                  // would silently lose the saved result, which is worse than locking it.
                  if (done) return;
                  setOpenMini(isOpen ? null : tile.key);
                }}
                disabled={done}
                aria-expanded={isOpen}
                className="focus-ring flex w-full items-start gap-3 p-4 text-left disabled:cursor-default"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-full transition-colors ${
                    done ? "bg-[#A3FF12] text-[#0B1419]" : "bg-[#4FC3F7] text-[#0B1419]"
                  }`}
                >
                  {done ? (
                    <Check size={18} strokeWidth={3.5} />
                  ) : tile.key === "win" ? (
                    <Trophy size={18} strokeWidth={2.5} />
                  ) : tile.key === "feelings" ? (
                    <MessageCircle size={18} strokeWidth={2.5} />
                  ) : (
                    <Camera size={18} strokeWidth={2.5} />
                  )}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[15px] font-black leading-tight">{tile.label}</p>
                    {done && (
                      <span className="rounded-full bg-[#A3FF12]/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#A3FF12]">
                        locked in
                      </span>
                    )}
                  </div>
                  {done ? (
                    <p className="mt-1 text-[12.5px] font-bold leading-5 text-white/75">{lockedSummary}</p>
                  ) : (
                    <p className="mt-1 text-[12.5px] font-medium leading-5 text-white/65">{tile.teaser}</p>
                  )}
                  <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-white/40">{tile.tagline}</p>
                </div>
                {!done && (
                  <ChevronDown
                    size={18}
                    strokeWidth={2.5}
                    className={`mt-0.5 shrink-0 text-white/45 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>
              {isOpen && (
                <div className="border-t border-white/10 p-4 animate-[fadeUp_240ms_ease-out]">
                  {tile.key === "win" && (
                    <OneWinMini
                      build={build}
                      onLock={(text) => {
                        update({ goalText: text });
                        markTried("win");
                        window.setTimeout(() => setOpenMini(null), 1500);
                      }}
                    />
                  )}
                  {tile.key === "feelings" && (
                    <FeelingsCheckMini
                      build={build}
                      onComplete={(summary, transcript) => {
                        update({ feelingsSummary: summary });
                        onFeelingsDetail(transcript);
                        markTried("feelings");
                        window.setTimeout(() => setOpenMini(null), 1800);
                      }}
                    />
                  )}
                  {tile.key === "fuel" && (
                    <FuelSnapMini
                      onComplete={(summary, result) => {
                        update({ mealSummary: summary });
                        onMealDetail(result);
                        markTried("fuel");
                        window.setTimeout(() => setOpenMini(null), 1800);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canContinue}
        className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#4FC3F7] px-6 text-base font-black text-[#0B1419] shadow-[0_14px_44px_rgba(79,195,247,0.45)] disabled:opacity-30"
      >
        Build the brief <ArrowRight size={18} strokeWidth={3} />
      </button>
      {!canContinue && (
        <button
          type="button"
          onClick={onNext}
          className="focus-ring mx-auto text-[11px] font-black uppercase tracking-wider text-white/45 hover:text-white/70"
        >
          skip — straight to build
        </button>
      )}
    </section>
  );
}

function OneWinMini({ build, onLock }: { build: Build; onLock: (text: string) => void }) {
  const [text, setText] = useState(build.goalText);
  const [locked, setLocked] = useState(Boolean(build.goalText));

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    setLocked(true);
    onLock(v);
  };

  if (locked) {
    return (
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="relative grid size-14 place-items-center rounded-full bg-[#A3FF12] text-[#0B1419] animate-[pop_700ms_ease-out]">
          <Trophy size={26} strokeWidth={2.5} />
          {/* 8-dot burst: 4 cardinal + 4 diagonal for a confetti feel */}
          <span className="pointer-events-none absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 animate-[burst-up_700ms_ease-out_forwards] rounded-full bg-[#A3FF12]" />
          <span className="pointer-events-none absolute -right-1 top-1/2 size-1.5 -translate-y-1/2 animate-[burst-right_700ms_ease-out_forwards] rounded-full bg-[#4FC3F7]" />
          <span className="pointer-events-none absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 animate-[burst-down_700ms_ease-out_forwards] rounded-full bg-[#A3FF12]" />
          <span className="pointer-events-none absolute -left-1 top-1/2 size-1.5 -translate-y-1/2 animate-[burst-left_700ms_ease-out_forwards] rounded-full bg-[#4FC3F7]" />
          <span className="pointer-events-none absolute right-0 top-0 size-1 animate-[burst-up-right_700ms_ease-out_forwards] rounded-full bg-white" />
          <span className="pointer-events-none absolute left-0 top-0 size-1 animate-[burst-up-left_700ms_ease-out_forwards] rounded-full bg-white" />
          <span className="pointer-events-none absolute bottom-0 right-0 size-1 animate-[burst-down-right_700ms_ease-out_forwards] rounded-full bg-[#A3FF12]" />
          <span className="pointer-events-none absolute bottom-0 left-0 size-1 animate-[burst-down-left_700ms_ease-out_forwards] rounded-full bg-[#4FC3F7]" />
        </div>
        <p className="text-[12px] font-black uppercase tracking-wider text-[#A3FF12]">one win locked</p>
        <p className="max-w-[280px] text-center text-[12.5px] font-bold leading-5 text-white/75">"{text.trim()}"</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="block">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">one thing</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 120))}
          rows={2}
          autoFocus
          placeholder="one thing that went right today — or one thing you want to make happen"
          className="mt-1 w-full resize-none rounded-2xl border border-white/12 bg-[#0B1419]/75 px-3 py-2 text-[13.5px] font-bold leading-5 text-white outline-none placeholder:text-white/30 focus:border-[#A3FF12]"
        />
        <p className="mt-1 text-right text-[10px] font-bold text-white/55">{text.length}/120</p>
      </label>
      <button
        type="button"
        onClick={submit}
        disabled={!text.trim()}
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#A3FF12] px-5 text-[13px] font-black text-[#0B1419] disabled:opacity-40"
      >
        <Trophy size={15} strokeWidth={3} /> Lock it in
      </button>
    </div>
  );
}

type FuelSnapResult = Awaited<ReturnType<typeof api.demoFoodPhoto>>;

function FuelSnapMini({ onComplete }: { onComplete: (summary: string, result: FuelSnapResult) => void }) {
  const [result, setResult] = useState<FuelSnapResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setThinking(true);
    setError(null);
    setRateLimited(false);
    try {
      const res = await api.demoFoodPhoto(file, getOrMakeSession());
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("429")) {
        setRateLimited(true);
        setError("Hold up — too many snaps in a row. Wait a minute and try again.");
      } else {
        setError("Photo didn't go through. Try another angle.");
      }
    } finally {
      setThinking(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setRateLimited(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const confidenceIsReal = result && (result.confidence === "high" || result.confidence === "medium");
  const showStubFallback = result && (result.confidence === "photo_stub" || result.confidence === "manual_stub");

  // Initial / loading / error states
  if (!result) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        {thinking ? (
          <>
            <div className="grid size-14 place-items-center rounded-full bg-[#4FC3F7]/15">
              <Loader2 size={26} className="animate-spin text-[#4FC3F7]" strokeWidth={2.5} />
            </div>
            <p className="text-[12px] font-black uppercase tracking-wider text-[#4FC3F7]">looking at your plate</p>
            <p className="max-w-[240px] text-[11.5px] font-medium leading-5 text-white/55">
              this takes ~5 seconds — vision model + nutrition lookup
            </p>
          </>
        ) : (
          <>
            <div className="grid size-14 place-items-center rounded-full bg-white/8">
              <Camera size={24} className="text-white/70" strokeWidth={2} />
            </div>
            <p className="max-w-[280px] text-[12.5px] font-medium leading-5 text-white/65">
              Snap or upload your meal. Kai reads it descriptively — no scoring, no lecture.
            </p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={rateLimited}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#4FC3F7] px-5 text-[13px] font-black text-[#0B1419] shadow-[0_8px_24px_rgba(79,195,247,0.32)] disabled:opacity-40 disabled:shadow-none"
            >
              <Camera size={16} strokeWidth={2.5} /> Take photo
            </button>
            <p className="max-w-[240px] text-[10px] font-bold leading-4 text-white/40">
              demo photos auto-delete in 24h.
            </p>
            {error && (
              <p className="text-[11.5px] font-bold text-red-300">{error}</p>
            )}
          </>
        )}
      </div>
    );
  }

  // Result state — show items
  return (
    <div className="flex flex-col gap-3">
      {confidenceIsReal && (
        <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A3FF12]">what kai sees</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-white/45">
              confidence: {result.confidence}
            </p>
          </div>
          <ul className="mt-2 grid gap-1.5">
            {result.items.map((item, i) => (
              <li key={i} className="flex items-baseline justify-between gap-2">
                <span className="text-[13px] font-bold text-white/90">{item.name}</span>
                <span className="text-[11px] font-bold text-white/55">
                  {item.estimatedGrams ? `~${item.estimatedGrams}g` : ""}
                  {item.nutrition?.calories ? ` · ~${Math.round(item.nutrition.calories)} kcal` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10.5px] font-medium leading-4 text-white/45">
            Descriptive only. Kai never scores meals or shows daily targets.
          </p>
        </div>
      )}

      {showStubFallback && (
        <div className="rounded-2xl border border-white/12 bg-white/4 p-3 text-center">
          <p className="text-[12.5px] font-bold leading-5 text-white/75">
            Hmm — couldn't read that one clearly. Want to try another angle, or skip?
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={reset}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-[12px] font-black text-white/85"
        >
          <RefreshCw size={14} strokeWidth={2.5} /> Try another
        </button>
        <button
          type="button"
          onClick={() => {
            const names = result.items.map((i) => i.name).filter(Boolean).slice(0, 5).join(", ");
            onComplete(names ? `snapped: ${names}` : "fuel snap completed", result);
          }}
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#A3FF12] px-4 text-[12px] font-black text-[#0B1419]"
        >
          <Check size={14} strokeWidth={3} /> {confidenceIsReal ? "Looks right" : "Log anyway"}
        </button>
      </div>
    </div>
  );
}

function feelingsOpener(firstName: string): string {
  const hi = firstName ? `Hey ${firstName}. ` : "";
  return `${hi}Quick check-in. Where in your body do you notice something right now — tight jaw, heavy chest, buzzing hands? One sentence works.`;
}

function FeelingsCheckMini({ build, onComplete }: { build: Build; onComplete: (summary: string, transcript: ChatTurn[]) => void }) {
  // Local chat state — feelings flow doesn't share with the Act 3 free chat
  const [chat, setChat] = useState<ChatTurn[]>(() => [
    { role: "assistant", content: feelingsOpener(build.firstName.trim()) }
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safety, setSafety] = useState<{ category?: string; severity?: string } | null>(null);
  const [done, setDone] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the input when the mini opens so the user can just type
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const userTurns = chat.filter((m) => m.role === "user").length;
  const maxUserTurns = 2; // 2 user msgs + 3 Kai msgs (opener + reframe + close)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, thinking]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking || done) return;
    const userTurn: ChatTurn = { role: "user", content: trimmed };
    const nextChat = [...chat, userTurn];
    setChat(nextChat);
    setInput("");
    setThinking(true);
    setError(null);
    try {
      const result = await api.demoKai({
        message: trimmed,
        history: chat,
        vibes: build.vibes,
        kaiName: build.kaiName,
        kaiTone: build.kaiTone,
        firstName: build.firstName || undefined,
        mode: "feelings"
      });
      if (result.safetyEvent) {
        setSafety(result.safetyEvent);
        setChat([...nextChat, { role: "assistant", content: result.reply }]);
        return; // Hold position — don't auto-advance past a safety response
      }
      const finalChat: ChatTurn[] = [...nextChat, { role: "assistant", content: result.reply }];
      setChat(finalChat);

      const nextUserTurns = nextChat.filter((m) => m.role === "user").length;
      const capped = Boolean(result.capped);
      if (nextUserTurns >= maxUserTurns || capped) {
        // Build a compact summary: what they shared, joined.
        const userText = finalChat.filter((m) => m.role === "user").map((m) => m.content).join(" | ").slice(0, 240);
        setDone(true);
        window.setTimeout(() => onComplete(userText || "feelings check-in completed", finalChat), 1200);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("429")) {
        setError("Hold up — too many turns in a row. Wait a minute and try again.");
      } else {
        setError("That didn't go through. Try once more.");
      }
    } finally {
      setThinking(false);
    }
  }, [chat, thinking, done, build, onComplete]);

  const inputDisabled = thinking || done || Boolean(safety);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={scroller}
        className="max-h-[260px] space-y-2.5 overflow-y-auto rounded-2xl border border-white/10 bg-[#0B1419]/55 p-3"
      >
        {chat.map((turn, i) => (
          <ChatBubble key={i} role={turn.role} content={turn.content} />
        ))}
        {thinking && <ChatBubble role="assistant" content="…" typing />}
        {safety && (
          <div className="mt-2 rounded-[14px] border border-red-400/35 bg-red-500/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-red-300">crisis resources</p>
            <p className="mt-1 text-[12.5px] font-bold leading-5 text-white/90">
              What you just said is bigger than this demo. Real people, fast:
            </p>
            <ul className="mt-2 grid gap-1 text-[12.5px] font-bold text-white/85">
              <li>· <a className="underline" href="tel:988">Call or text 988</a> — Suicide & Crisis Lifeline (US/Canada)</li>
              <li>· <a className="underline" href="sms:741741?&body=HOME">Text HOME to 741741</a> — Crisis Text Line</li>
              <li>· <a className="underline" href="/crisis">More resources</a></li>
            </ul>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] font-bold text-red-300">
          {error}
        </div>
      )}

      {done && !safety && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#A3FF12]/30 bg-[#A3FF12]/10 px-3 py-2 text-[12px] font-black uppercase tracking-wider text-[#A3FF12]">
          <Check size={14} strokeWidth={3.5} /> kept between us
        </div>
      )}

      {!done && !safety && (
        <form
          onSubmit={(e) => { e.preventDefault(); void send(input); }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, DEMO_INPUT_CHARS))}
            placeholder={userTurns === 0 ? "where you notice it" : "what you'd tell a friend"}
            disabled={inputDisabled}
            className="flex-1 rounded-full border border-white/20 bg-white px-4 py-2.5 text-[13.5px] font-black text-[#0B1419] outline-none placeholder:text-[#52616B] focus:border-[#4FC3F7] focus:ring-2 focus:ring-[#4FC3F7]/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || inputDisabled}
            className="focus-ring grid size-10 shrink-0 place-items-center rounded-full bg-[#4FC3F7] text-[#0B1419] disabled:opacity-30"
          >
            {thinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={3} />}
          </button>
        </form>
      )}
      <p className="text-center text-[10px] font-black uppercase tracking-wider text-white/35">
        {safety ? "demo paused for safety" : done ? "3 turns done" : `turn ${Math.min(userTurns + 1, maxUserTurns)} of ${maxUserTurns} · kai chooses what to ask next`}
      </p>
    </div>
  );
}

const DEMO_INPUT_CHARS = 260;

/* ────────────────────────────────────────────────────────────────────────── */
/* ACT 5 — Make it yours                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function ActBuild({ build, update, onNext }: { build: Build; update: (p: Partial<Build>) => void; onNext: () => void }) {
  const tone = TONES.find((t) => t.id === build.kaiTone) || TONES[1];
  return (
    <section className="flex flex-col gap-5">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">unlock 4 of 5</p>
        <h2 className="mt-1 text-3xl font-black leading-none">Direct the build.</h2>
        <p className="mt-2 text-[14px] font-medium leading-6 text-white/65">
          Pick the look, voice, first feature, and the stuff we should absolutely fix.
        </p>
      </header>

      <PhoneFrame compact>
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar style={build.art} size={56} level={1} />
            <div className="flex-1">
              <p className="text-[12px] font-black">{build.firstName || "you"}</p>
              <p className="mt-0.5 text-[10px] font-bold text-white/55">level 1 · {build.vibes.slice(0, 3).join(" · ") || "open"}</p>
            </div>
          </div>
          <div className="mt-3 rounded-[14px] border border-white/12 bg-white/4 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#4FC3F7]">{build.kaiName} · {build.kaiTone}</p>
            <p className="mt-1 text-[13px] font-medium leading-5 text-white/85">{tone.sample}</p>
          </div>
          <div className="mt-2 rounded-[14px] border border-white/12 bg-white/4 px-3 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-wider text-white/45">first daily move</p>
            <p className="mt-1 text-[13px] font-black">{FIRST_MOVES.find((m) => m.id === build.firstMove)?.teaser}</p>
          </div>
        </div>
      </PhoneFrame>

      {/* Art style */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">character art</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {ART_STYLES.map((a) => {
            const on = build.art === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => update({ art: a.id })}
                className={`focus-ring flex flex-col items-center gap-1.5 rounded-2xl border p-2 transition ${
                  on ? "border-[#4FC3F7] bg-[#4FC3F7]/10" : "border-white/12 bg-white/4 hover:bg-white/8"
                }`}
              >
                <Avatar style={a.id} size={40} level={1} />
                <span className="text-[10px] font-black">{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kai name + tone */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">name your coach</span>
          <input
            type="text"
            value={build.kaiName}
            onChange={(e) => update({ kaiName: e.target.value.slice(0, 18) })}
            className="mt-2 w-full rounded-2xl border border-white/20 bg-white px-4 py-3 text-base font-black text-[#0B1419] outline-none placeholder:text-[#52616B] focus:border-[#4FC3F7] focus:ring-2 focus:ring-[#4FC3F7]/30"
          />
        </label>
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">tone</span>
          <div className="mt-2 flex h-12 items-center overflow-hidden rounded-2xl border border-white/12 bg-white/4">
            {TONES.map((t) => {
              const on = build.kaiTone === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update({ kaiTone: t.id })}
                  className={`focus-ring h-full px-3 text-[11px] font-black transition ${on ? "bg-[#4FC3F7] text-[#0B1419]" : "text-white/70"}`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* First move */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">tomorrow's first move</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {FIRST_MOVES.map((m) => {
            const on = build.firstMove === m.id;
            // Was this move auto-pre-filled because the user did the matching
            // mini in Act 4? If so, surface that — otherwise this picker
            // feels like "Kai asks the same question twice."
            const tile = TRY_TILES.find((t) => t.firstMove === m.id);
            const fromTry = Boolean(tile && build.tried.includes(tile.key));
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => update({ firstMove: m.id })}
                className={`focus-ring flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${
                  on ? "border-[#4FC3F7] bg-[#4FC3F7]/10" : "border-white/12 bg-white/4 hover:bg-white/8"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-1.5">
                  <span className="text-[13px] font-black">{m.label}</span>
                  {fromTry && (
                    <span className="rounded-full bg-[#A3FF12]/20 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-[#A3FF12]">
                      tried
                    </span>
                  )}
                </div>
                <span className="text-[10.5px] font-medium leading-4 text-white/55">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[22px] border border-[#A3FF12]/25 bg-[#A3FF12]/8 p-4">
        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#A3FF12]">
          <Trophy size={13} /> co-dev notes
        </p>
        <div className="mt-3 grid gap-3">
          <NoteField
            label="must have"
            value={build.mustHave}
            placeholder="ex: quests, streak freeze, food camera, character upgrades..."
            onChange={(mustHave) => update({ mustHave })}
          />
          <NoteField
            label="hard no"
            value={build.hardNo}
            placeholder="ex: calorie shame, fake therapy voice, too many parent alerts..."
            onChange={(hardNo) => update({ hardNo })}
          />
          <NoteField
            label="who should test first?"
            value={build.tester}
            placeholder="ex: athletes, gamers, stressed juniors, my group chat..."
            onChange={(tester) => update({ tester })}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="focus-ring inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#4FC3F7] px-6 text-base font-black text-[#0B1419] shadow-[0_14px_44px_rgba(79,195,247,0.45)]"
      >
        Build the brief <ArrowRight size={18} strokeWidth={3} />
      </button>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* ACT 5 — Ship to a friend                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

function ActShip(props: {
  build: Build;
  update: (p: Partial<Build>) => void;
  shareLink: string;
  shareCopied: boolean;
  onShare: () => void;
  onSave: () => Promise<void>;
  onRestart: () => void;
}) {
  const { build, update, shareLink, shareCopied, onShare, onSave, onRestart } = props;
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const savedOnce = useRef(false);

  const save = useCallback(async () => {
    setSaveState("saving");
    try {
      await onSave();
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, [onSave]);

  useEffect(() => {
    if (savedOnce.current) return;
    savedOnce.current = true;
    void save();
  }, [save]);

  const smsText = `${build.firstName ? build.firstName + " " : ""}made a Kai for you. take a look — ${shareLink}`;
  const smsHref = `sms:?&body=${encodeURIComponent(smsText)}`;

  return (
    <section className="flex flex-col gap-5">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">unlock 5 of 5 · ship it</p>
        <h2 className="mt-1 text-3xl font-black leading-none">Build brief ready.</h2>
        <p className="mt-2 text-[14px] font-medium leading-6 text-white/65">
          This saves your decisions for the team and gives you a link to send around.
        </p>
      </header>

      <div className="rounded-[22px] border border-[#4FC3F7]/30 bg-gradient-to-b from-[#4FC3F7]/10 to-transparent p-4">
        <div className="flex items-center gap-3">
          <Avatar style={build.art} size={60} level={1} />
          <div className="flex-1">
            <p className="text-[12px] font-black">{build.firstName || "your"} Kai</p>
            <p className="mt-0.5 text-[11px] font-bold text-white/55">
              {build.kaiName} · {build.kaiTone}
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-white/55">first move: {FIRST_MOVES.find((m) => m.id === build.firstMove)?.label}</p>
          </div>
          {saveState === "saved" && <span className="rounded-full bg-[#A3FF12]/15 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#A3FF12]">saved</span>}
        </div>
      </div>

      {/* Optional self-ID so the build team knows whose session this is.
          Lev (and anyone else doing a real review) can drop their name here
          instead of doing a separate sync call. Anonymous teens skip it. */}
      <div className="rounded-[22px] border border-white/12 bg-white/4 p-4">
        <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#4FC3F7]">
          <UserPlus size={12} /> who's reviewing?
        </p>
        <p className="mt-1 text-[12px] font-medium leading-5 text-white/65">
          Optional. Lets the team tag your feedback to you instead of guessing.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">name</span>
            <input
              type="text"
              value={build.reviewerName}
              onChange={(e) => update({ reviewerName: e.target.value.slice(0, 60) })}
              placeholder="e.g. Lev"
              className="mt-1 w-full rounded-2xl border border-white/12 bg-[#0B1419]/75 px-3 py-2 text-[13px] font-bold text-white outline-none placeholder:text-white/30 focus:border-[#4FC3F7]"
            />
          </label>
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">email</span>
            <input
              type="email"
              value={build.reviewerEmail}
              onChange={(e) => update({ reviewerEmail: e.target.value.slice(0, 80) })}
              placeholder="optional"
              className="mt-1 w-full rounded-2xl border border-white/12 bg-[#0B1419]/75 px-3 py-2 text-[13px] font-bold text-white outline-none placeholder:text-white/30 focus:border-[#4FC3F7]"
            />
          </label>
        </div>
      </div>

      <div className="rounded-[22px] border border-white/12 bg-white/4 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">what the team gets</p>
        <div className="mt-3 grid gap-2 text-[13px] font-bold leading-5 text-white/80">
          <p><span className="text-[#A3FF12]">Must have:</span> {build.mustHave || "not picked yet"}</p>
          <p><span className="text-[#A3FF12]">Hard no:</span> {build.hardNo || "not picked yet"}</p>
          <p><span className="text-[#A3FF12]">First testers:</span> {build.tester || "not picked yet"}</p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saveState === "saving"}
          className="focus-ring mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#A3FF12] px-4 text-[13px] font-black text-[#0B1419] disabled:opacity-50"
        >
          {saveState === "saving" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3.5} />}
          {saveState === "saved" ? "Brief saved" : saveState === "error" ? "Try saving again" : "Save latest brief"}
        </button>
        {saveState === "error" && <p className="mt-2 text-center text-[11px] font-black text-red-300">Save did not reach the server. Try again before sending.</p>}
      </div>

      <div className="rounded-[22px] border border-white/12 bg-white/4 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">your share link</p>
        <p className="mt-2 break-all rounded-[12px] border border-white/12 bg-[#0B1419] px-3 py-2 font-mono text-[11px] text-white/80">
          {shareLink}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={smsHref}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#A3FF12] px-4 text-[13px] font-black text-[#0B1419]"
          >
            <Share2 size={15} strokeWidth={3} /> iMessage
          </a>
          <button
            type="button"
            onClick={onShare}
            className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/6 px-4 text-[13px] font-black text-white"
          >
            {shareCopied ? <Check size={15} strokeWidth={3.5} /> : <Sparkles size={15} />}
            {shareCopied ? "copied" : "copy link"}
          </button>
        </div>
      </div>

      <QRCard text={shareLink} />

      <div className="mt-2 rounded-[18px] border border-white/10 bg-white/4 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">what happens next</p>
        <ul className="mt-2 grid gap-1.5 text-[13px] font-medium text-white/75">
          <li>· Your friend opens the link and lands on Kai with your name on the welcome line.</li>
          <li>· They make their own choices from your starting point.</li>
          <li>· Sign up to save THIS Kai and keep going for real.</li>
        </ul>
      </div>

      <SignupNudge build={build} />

      <button
        type="button"
        onClick={onRestart}
        className="focus-ring mx-auto inline-flex items-center gap-1 rounded-full px-4 py-2 text-[12px] font-black text-white/55 hover:text-white"
      >
        <X size={13} /> restart demo
      </button>
    </section>
  );
}

function SignupNudge({ build }: { build: Build }) {
  const triedLabels: Record<TriedKey, string> = {
    win: "one win",
    feelings: "feelings check",
    fuel: "fuel snap"
  };
  const tried = build.tried.map((k) => triedLabels[k]).join(" · ");
  const carryOver = [
    build.kaiName !== "Kai" ? `name: ${build.kaiName}` : null,
    `tone: ${build.kaiTone}`,
    build.vibes.length ? `vibes: ${build.vibes.slice(0, 3).join(", ")}` : null,
    tried ? `tried: ${tried}` : null
  ].filter(Boolean).join(" · ");

  return (
    <div className="rounded-[22px] border border-[#4FC3F7]/40 bg-gradient-to-b from-[#4FC3F7]/12 to-transparent p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#4FC3F7] text-[#0B1419]">
          <UserPlus size={18} strokeWidth={2.5} />
        </span>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#4FC3F7]">save your kai</p>
          <p className="mt-1 text-[15px] font-black leading-tight">Keep this Kai. Don't lose the build.</p>
          <p className="mt-1.5 text-[12px] font-medium leading-5 text-white/65">
            We'll carry it into your real account — no re-typing.
          </p>
        </div>
      </div>
      {carryOver && (
        <p className="mt-3 rounded-2xl border border-white/10 bg-[#0B1419]/45 px-3 py-2 text-[11px] font-bold leading-5 text-white/65">
          carries over → <span className="text-white/85">{carryOver}</span>
        </p>
      )}
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <Link
          to="/sign-up"
          className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#4FC3F7] px-4 text-[13px] font-black text-[#0B1419] shadow-[0_8px_24px_rgba(79,195,247,0.35)]"
        >
          Save my Kai <ArrowRight size={15} strokeWidth={3} />
        </Link>
        <Link
          to="/sign-in"
          className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 text-[12px] font-black text-white/80"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Reusable bits                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function PhoneFrame({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="rounded-[36px] border border-white/12 bg-[#070C11] p-2 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <div className={`relative overflow-hidden rounded-[28px] bg-[#0B1419] ${compact ? "min-h-[260px]" : "min-h-[420px]"}`}>
          <div className="pointer-events-none absolute left-1/2 top-1.5 h-1 w-16 -translate-x-1/2 rounded-full bg-white/15" />
          <div className="h-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

function KaiOrb({ size = 32, className = "" }: { size?: number; className?: string }) {
  return <KaiAvatar size={size} className={className} />;
}

function Avatar({ style, size, level }: { style: ArtStyle; size: number; level: number }) {
  // Inline SVG variants so the character changes immediately on style swap.
  const grad = {
    chibi: ["#FFD9C0", "#FF8FA3"],
    pixel: ["#A3FF12", "#22D3EE"],
    minimal: ["#FFFFFF", "#CBD5E1"],
    silhouette: ["#1F2937", "#0F172A"]
  }[style];
  return (
    <div className="grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        <defs>
          <linearGradient id={`g-${style}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={grad[0]} />
            <stop offset="100%" stopColor={grad[1]} />
          </linearGradient>
        </defs>
        {style === "chibi" && (
          <g>
            <circle cx="32" cy="26" r="18" fill={`url(#g-${style})`} />
            <circle cx="26" cy="26" r="2.4" fill="#0B1419" />
            <circle cx="38" cy="26" r="2.4" fill="#0B1419" />
            <path d="M26 32 Q32 36 38 32" stroke="#0B1419" strokeWidth="2" strokeLinecap="round" fill="none" />
            <rect x="20" y="44" width="24" height="14" rx="6" fill={`url(#g-${style})`} opacity="0.85" />
          </g>
        )}
        {style === "pixel" && (
          <g shapeRendering="crispEdges">
            <rect x="20" y="12" width="24" height="24" fill={`url(#g-${style})`} />
            <rect x="24" y="20" width="4" height="4" fill="#0B1419" />
            <rect x="36" y="20" width="4" height="4" fill="#0B1419" />
            <rect x="26" y="30" width="12" height="2" fill="#0B1419" />
            <rect x="22" y="40" width="20" height="14" fill={`url(#g-${style})`} />
            <rect x="20" y="46" width="6" height="6" fill={grad[1]} />
            <rect x="38" y="46" width="6" height="6" fill={grad[1]} />
          </g>
        )}
        {style === "minimal" && (
          <g fill="none" stroke="#F5F7FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="32" cy="24" r="11" />
            <path d="M16 56 q16 -18 32 0" />
            <circle cx="28" cy="23" r="1.2" fill="#F5F7FA" />
            <circle cx="36" cy="23" r="1.2" fill="#F5F7FA" />
            <path d="M28 28 q4 3 8 0" />
          </g>
        )}
        {style === "silhouette" && (
          <g>
            <circle cx="32" cy="24" r="13" fill={grad[1]} />
            <path d="M14 60 Q14 40 32 40 Q50 40 50 60 Z" fill={grad[1]} />
            <circle cx="32" cy="22" r="3" fill={"#4FC3F7"} />
          </g>
        )}
      </svg>
      <p className="mt-1 text-[8px] font-black uppercase tracking-wider text-white/40">lv {level}</p>
    </div>
  );
}

function QRCard({ text }: { text: string }) {
  // Use Google Charts public QR endpoint as a tiny zero-dep generator.
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&color=0B1419&bgcolor=F5F7FA&data=${encodeURIComponent(text)}`;
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-[22px] border border-white/12 bg-white/4 p-3">
      <img src={src} alt="QR to share" className="size-[88px] rounded-xl" />
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">scan with another phone</p>
        <p className="mt-1 text-[12px] font-bold text-white/75">Hand your phone to Sam, Mateo, anyone — they're in the same flow in 5 seconds.</p>
      </div>
    </div>
  );
}

function NoteField(props: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">{props.label}</span>
      <textarea
        value={props.value}
        onChange={(e) => props.onChange(e.target.value.slice(0, 180))}
        rows={2}
        placeholder={props.placeholder}
        className="mt-1 w-full resize-none rounded-2xl border border-white/12 bg-[#0B1419]/75 px-3 py-2 text-[13px] font-bold leading-5 text-white outline-none placeholder:text-white/30 focus:border-[#A3FF12]"
      />
    </label>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Pure helpers                                                              */
/* ────────────────────────────────────────────────────────────────────────── */

function defaultBuild(): Build {
  return {
    firstName: "",
    vibes: [],
    art: "chibi",
    kaiName: "Kai",
    kaiTone: "balanced",
    firstMove: "pressure",
    mustHave: "",
    hardNo: "",
    tester: "",
    tried: [],
    goalText: "",
    feelingsSummary: "",
    mealSummary: "",
    reviewerName: "",
    reviewerEmail: ""
  };
}

function loadSeedOrSaved(): Build {
  if (typeof window === "undefined") return defaultBuild();
  // First check ?seed= for a shared build
  try {
    const params = new URLSearchParams(window.location.search);
    const seed = params.get("seed");
    if (seed) {
      const decoded = JSON.parse(atob(seed.replace(/-/g, "+").replace(/_/g, "/")));
      if (decoded && typeof decoded === "object") {
        return { ...defaultBuild(), ...decoded };
      }
    }
  } catch { /* ignore */ }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultBuild(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultBuild();
}

function buildShareLink(build: Build) {
  if (typeof window === "undefined") return "";
  // Strip session-specific fields AND reviewer PII — sharing is about the
  // character build, not what the original user typed into their One Win or
  // who they identified themselves as. Recipients start their Try act fresh.
  const {
    tried: _t,
    goalText: _g,
    feelingsSummary: _f,
    mealSummary: _m,
    reviewerName: _rn,
    reviewerEmail: _re,
    ...shareable
  } = build;
  void _t; void _g; void _f; void _m; void _rn; void _re;
  const seed = btoa(JSON.stringify(shareable)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${window.location.origin}/demo?seed=${seed}`;
}

function openingFromVibes(build: Build) {
  const name = build.firstName ? `${build.firstName}, ` : "";
  if (!build.vibes.length) return `${name}what's actually going on right now?`;
  const v = build.vibes;
  if (v.includes("tired") && v.includes("stuck"))     return `${name}tired AND stuck is a brutal combo. what's pulling on you most?`;
  if (v.includes("anxious"))                          return `${name}anxious mode noted. what's the loudest thing in your head right now?`;
  if (v.includes("hyped") && v.includes("locked-in")) return `${name}you're firing — what are you actually trying to do today?`;
  if (v.includes("bored"))                            return `${name}bored is a signal, not a verdict. what would you do if no one was watching?`;
  return `${name}${v.slice(0, 2).join(" + ")} energy. say more — what's behind it?`;
}

async function withDemoKaiFallback(
  request: Promise<{ reply: string; capped?: boolean; turnsRemaining?: number; safetyEvent?: { category?: string; severity?: string } }>,
  build: Build,
  message: string
) {
  let timedOut = false;
  const timeout = new Promise<{ reply: string }>((resolve) => {
    window.setTimeout(() => {
      timedOut = true;
      resolve({ reply: fallbackKaiReply(build, message) });
    }, 3600);
  });
  const result = await Promise.race([request, timeout]);
  if (timedOut) request.catch(() => undefined);
  return result;
}

function fallbackKaiReply(build: Build, message: string) {
  const lower = message.toLowerCase();
  const name = build.firstName ? `${build.firstName}, ` : "";
  if (/(kill myself|suicide|self harm|hurt myself|end it)/i.test(message)) {
    return `${name}that sounds serious. This demo is not enough for that moment. If you might hurt yourself, call or text 988 now, and tell a real person near you.`;
  }
  if (lower.includes("food") || lower.includes("eat") || lower.includes("calorie")) {
    return `${name}food stuff can get loaded fast. I would keep this simple: what did you eat, and did it help your energy or make you feel worse?`;
  }
  if (lower.includes("school") || lower.includes("homework") || lower.includes("test")) {
    return `${name}school being loud makes sense. Pick one piece of it: the deadline, the people, or the pressure. Which one is actually hitting hardest?`;
  }
  if (lower.includes("reset") || lower.includes("stress") || lower.includes("anxious")) {
    return `${name}quick reset: unclench your jaw, drop your shoulders, and name the one thing you can do in the next 10 minutes.`;
  }
  if (build.kaiTone === "direct") {
    return `${name}got it. Give me the real version in one sentence: what is the problem, and what would make the next 10 minutes easier?`;
  }
  return `${name}I hear you. Say the part you would normally skip over. That is usually where the useful answer starts.`;
}

function getOrMakeSession(): string {
  try {
    const existing = localStorage.getItem("kai_demo_session");
    if (existing) return existing;
    const fresh = crypto?.randomUUID?.() || `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem("kai_demo_session", fresh);
    return fresh;
  } catch {
    return `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
