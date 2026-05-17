import { ArrowRight, Check, Flame, Loader2, MessageCircle, Send, Share2, Sparkles, Trophy, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

/**
 * /demo — 5-act guided experience that lets Lev (or any teen) feel Kai land
 * in their hands in ~3 minutes. Saves nothing to a backend except the
 * existing scope/demo feedback rows at the end. Real Kai chat in Act 3
 * hits /api/demo-kai which calls the safety classifier + Claude.
 *
 * Acts: 1) Meet  2) Read  3) Chat  4) Build  5) Ship
 */

type Act = 1 | 2 | 3 | 4 | 5;

type ArtStyle = "chibi" | "silhouette" | "pixel" | "minimal";
type KaiTone = "warm" | "balanced" | "direct";
type FirstMove = "fuel" | "pressure" | "win" | "breath";

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
      const result = await api.demoKai({
        message: userTurn.content,
        history: chat,
        vibes: build.vibes,
        kaiName: build.kaiName,
        kaiTone: build.kaiTone,
        firstName: build.firstName || undefined
      });
      setChat([...nextChat, { role: "assistant", content: result.reply }]);
      // After 2 user turns, reveal the "home card" moment
      if (nextChat.filter((m) => m.role === "user").length >= 2) {
        setTimeout(() => setSeenHomeCard(true), 350);
      }
    } catch {
      setChatError("Kai stalled. Try again in a sec.");
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
        {act === 4 && <ActBuild build={build} update={update} onNext={() => goAct(5)} />}
        {act === 5 && (
          <ActShip
            build={build}
            shareLink={shareLink}
            shareCopied={shareCopied}
            onShare={copyShare}
            onSave={saveBuildBrief}
            onRestart={() => { setAct(1); setChat([]); setSeenHomeCard(false); }}
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
  const labels = ["meet", "read", "chat", "build", "ship"];
  const xp = act * 20;
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
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
          {labels.map((label, i) => {
            const n = (i + 1) as Act;
            const done = act > n;
            const here = act === n;
            return (
              <span key={label} className={`truncate ${done ? "text-[#A3FF12]" : here ? "text-white" : "text-white/35"}`}>
                {done ? "✓ " : here ? "• " : ""}{label}
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
  const [showBubble, setShowBubble] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const a = setTimeout(() => setShowBubble(true), 300);
    const b = setTimeout(() => setShowCta(true), 650);
    return () => { clearTimeout(a); clearTimeout(b); };
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

      <PhoneFrame>
        <div className="flex h-full flex-col justify-between px-4 py-6">
          <div className="flex items-center gap-2">
            <KaiOrb size={28} />
            <p className="text-[11px] font-bold text-white/55">Kai · just now</p>
          </div>
          <div
            className={`mt-6 transition-all duration-700 ${showBubble ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
          >
            <div className="rounded-[20px] rounded-bl-[6px] bg-white/8 px-4 py-3 text-[15px] leading-6">
              Hey. I'm Kai. I'm a coach you can text when teen life gets loud — school, friends, food, pressure, your head, your body, all of it.
            </div>
            <div
              className={`mt-3 transition-all duration-700 delay-300 ${showBubble ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
            >
              <div className="rounded-[20px] rounded-bl-[6px] bg-white/8 px-4 py-3 text-[15px] leading-6">
                I won't diagnose you. I won't lecture you. And if I sound cringe, you get to tell us exactly what to fix.
              </div>
            </div>
          </div>
          <div className="h-12" />
        </div>
      </PhoneFrame>

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
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">unlock 1 of 4</p>
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
          className="mt-2 w-full rounded-2xl border border-white/12 bg-white/4 px-4 py-3 text-base font-bold text-white outline-none placeholder:text-white/35 focus:border-[#4FC3F7]"
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
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">unlock 2 of 4 · live</p>
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
              className="flex-1 rounded-full border border-white/12 bg-white/6 px-4 py-3 text-[14px] font-medium text-white outline-none placeholder:text-white/35 focus:border-[#4FC3F7] disabled:opacity-50"
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
/* ACT 4 — Make it yours                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

function ActBuild({ build, update, onNext }: { build: Build; update: (p: Partial<Build>) => void; onNext: () => void }) {
  const tone = TONES.find((t) => t.id === build.kaiTone) || TONES[1];
  return (
    <section className="flex flex-col gap-5">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">unlock 3 of 4</p>
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
            className="mt-2 w-full rounded-2xl border border-white/12 bg-white/4 px-4 py-3 text-base font-bold text-white outline-none focus:border-[#4FC3F7]"
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
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => update({ firstMove: m.id })}
                className={`focus-ring flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${
                  on ? "border-[#4FC3F7] bg-[#4FC3F7]/10" : "border-white/12 bg-white/4 hover:bg-white/8"
                }`}
              >
                <span className="text-[13px] font-black">{m.label}</span>
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
  shareLink: string;
  shareCopied: boolean;
  onShare: () => void;
  onSave: () => Promise<void>;
  onRestart: () => void;
}) {
  const { build, shareLink, shareCopied, onShare, onSave, onRestart } = props;
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
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#4FC3F7]">unlock 4 of 4 · ship it</p>
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
          <li>· You can sign up to keep building when the real app drops.</li>
        </ul>
      </div>

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
  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#4FC3F7] to-[#29B6F6] font-black text-[#0B1419] ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      k
      <span className="absolute inset-0 rounded-full ring-1 ring-white/20" />
    </span>
  );
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
    tester: ""
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
  const seed = btoa(JSON.stringify(build)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
