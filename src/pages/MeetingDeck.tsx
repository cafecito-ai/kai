import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Flag,
  Lock,
  Play,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import type { ReactNode } from "react";

const LIVE_ORIGIN = "https://kai.boostaisearch.ai";

const agenda = [
  ["0-5", "Frame", "This is acceptance review, not a brainstorm."],
  ["5-12", "Show", "Walk through what has been built."],
  ["12-42", "Quest", "Lev opens live screens and scores them."],
  ["42-52", "Scope", "Confirm what is accepted, what needs fixes, and what is new scope."],
  ["52-60", "Close", "Copy the summary and agree on next owner."],
];

const missionScreens = [
  ["Create your KAI", "/review/screenshots-real/02-onboarding.png", "/onboarding"],
  ["Find the first move", "/review/screenshots-real/03-home.png", "/home"],
  ["Try daily actions", "/review/screenshots-real/04-check-in.png", "/check-in"],
  ["Pressure-test chat", "/review/screenshots-real/05-chat.png", "/chat"],
  ["Safety-check scan", "/review/screenshots-real/06-scan.png", "/scan"],
  ["Build a goal streak", "/review/screenshots-real/07-goals.png", "/goals"],
  ["Check safety pages", "/review/screenshots-real/09-parents.png", "/for-parents"],
];

const built = [
  "Onboarding, personalization, tone, and first-run setup",
  "Home dashboard, daily score, missions, XP, badges, and progress",
  "KAI chat with teen-coach tone and safety-first routing",
  "Check-in, journal, sleep, food, workout, mobility, and energy loops",
  "Goals, strengths, challenges, groups, profile, settings, parent, privacy, and crisis pages",
  "Body scan flow with posture/alignment framing and safety gate",
  "Review quest, invoice links, handoff docs, QA docs, and gate confirmation",
];

const gates = [
  ["G1", "Complete", "Kickoff, repo, app shell, Cloudflare baseline, review materials."],
  ["G2", "Ready", "Kai live, onboarding, customization, progress tracker, route structure."],
  ["G3", "Ready", "Physical wellness: food, sleep, exercise, mobility, breathing/stretching direction."],
  ["G4", "Ready", "Potential and goals: strengths, goals, check-ins, encouragement/gamification."],
  ["G5", "Client-dependent", "Needs clinical/safety reviewer, legal comfort, and Lev testing evidence."],
  ["G6", "Client-dependent", "Needs real-user testing, bug triage, accessibility/performance pass."],
];

function liveRoute(route: string) {
  return `${LIVE_ORIGIN}${route}`;
}

export function MeetingDeck() {
  return (
    <main className="min-h-[100svh] bg-[#f6f3ec] text-[#171717]">
      <section className="mx-auto grid min-h-[92svh] max-w-6xl content-center gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b4f2f]">KAI Monday review</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-semibold leading-[0.98] tracking-normal sm:text-7xl">
            Walk the product. Then decide.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#4c4c4c]">
            A 60-minute review for June 15 at noon: show what is built, make Lev test the real app,
            capture evidence, and separate fixes from new feature requests.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/client-review" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#171717] px-5 text-sm font-black text-white">
              Open review quest <Play size={16} />
            </a>
            <a href="/review/invoice-2026-002-kai-next-steps" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-black text-[#171717]">
              Invoice 2026-002 <FileText size={16} />
            </a>
          </div>
        </div>
        <div className="rounded-[2rem] border border-black/10 bg-[#17201d] p-6 text-white shadow-[0_24px_80px_rgba(23,23,23,0.12)] sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Meeting rule</p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-tight">No new scope until the quest is complete.</h2>
          <div className="mt-6 grid gap-3">
            <Rule icon={<Trophy size={18} />} title="Lev tests" body="He opens each required screen and gives a score." />
            <Rule icon={<ClipboardCheck size={18} />} title="Evidence wins" body="Feedback goes into the review summary, not memory." />
            <Rule icon={<Flag size={18} />} title="Bugs vs ideas" body="Bugs get fixed. New ideas become change requests." />
          </div>
        </div>
      </section>

      <DeckSection eyebrow="Run of show" title="60 minutes, one path.">
        <div className="grid gap-3 md:grid-cols-5">
          {agenda.map(([time, label, detail]) => (
            <div key={time} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-sm font-black text-[#8b4f2f]">{time} min</p>
              <p className="mt-2 text-lg font-black">{label}</p>
              <p className="mt-2 text-sm leading-6 text-[#666]">{detail}</p>
            </div>
          ))}
        </div>
      </DeckSection>

      <DeckSection eyebrow="What is built" title="The app is broad enough to test now.">
        <div className="grid gap-3 md:grid-cols-2">
          {built.map((item) => (
            <div key={item} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[#1f7a4d]" size={20} />
                <p className="text-sm font-bold leading-6 text-[#333]">{item}</p>
              </div>
            </div>
          ))}
        </div>
      </DeckSection>

      <DeckSection eyebrow="Review quest" title="Lev's job is simple: open, try, score, claim XP.">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          {missionScreens.map(([title, image, route]) => (
            <a key={title} href={liveRoute(route)} target="_blank" rel="noreferrer" className="group rounded-3xl border border-black/10 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <img src={image} alt={`${title} screen`} className="aspect-[390/844] w-full rounded-2xl object-cover object-top" />
              <span className="mt-3 flex items-center justify-between gap-2 text-sm font-black">
                {title}
                <ExternalLink className="shrink-0 opacity-50 group-hover:opacity-100" size={15} />
              </span>
            </a>
          ))}
        </div>
        <div className="mt-5 rounded-2xl border border-[#e2be79] bg-[#fff8ed] p-4">
          <p className="text-sm font-black text-[#70420d]">Send this review link after the call:</p>
          <a href="/client-review" className="mt-2 inline-flex text-sm font-black text-[#70420d] underline underline-offset-4">https://kai.boostaisearch.ai/client-review</a>
        </div>
      </DeckSection>

      <DeckSection eyebrow="Original gates" title="What we can prove against the original scope.">
        <div className="grid gap-3">
          {gates.map(([gate, status, note]) => (
            <div key={gate} className="grid gap-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm md:grid-cols-[72px_150px_1fr]">
              <p className="font-display text-3xl font-semibold">{gate}</p>
              <p className="text-sm font-black text-[#335c67]">{status}</p>
              <p className="text-sm leading-6 text-[#555]">{note}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="/review/boost-ai-invoice-2026-001-gating.docx" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-black">
            Original gate doc <FileText size={15} />
          </a>
          <a href="/review/invoice-2026-002-kai-next-steps" target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-sm font-black">
            Current invoice <FileText size={15} />
          </a>
        </div>
      </DeckSection>

      <DeckSection eyebrow="Go-to-market pacing" title="Help them walk, then run.">
        <div className="grid gap-4 md:grid-cols-3">
          <Pace icon={<ShieldCheck size={22} />} title="Walk" body="Complete the review quest, fix confirmed bugs, and agree what is accepted." />
          <Pace icon={<ClipboardCheck size={22} />} title="Jog" body="Invite 15-20 teens, collect usage notes, and triage once per week." />
          <Pace icon={<Lock size={22} />} title="Run" body="Client owns launch, legal, safety review, pricing, support, and growth channels." />
        </div>
      </DeckSection>

      <DeckSection eyebrow="Close" title="What we need by the end of Monday.">
        <div className="grid gap-4 md:grid-cols-2">
          <CloseItem title="A completed review quest" body="Required missions marked complete, with ratings and one-sentence feedback." />
          <CloseItem title="A clean bug list" body="Only tested problems count as bugs. Ideas wait until after acceptance evidence." />
          <CloseItem title="A sign-off position" body="Approved, approved with listed fixes, or not approved yet with specific blockers." />
          <CloseItem title="A next owner" body="Lev testing, Offy/legal/safety review, Boost AI fixes, or client launch planning." />
        </div>
        <a href="/client-review" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#171717] px-6 text-sm font-black text-white">
          Start the review quest <ArrowRight size={16} />
        </a>
      </DeckSection>
    </main>
  );
}

function DeckSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8b4f2f]">{eyebrow}</p>
      <h2 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Rule({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
      <div className="flex gap-3">
        <div className="text-[#f2d27c]">{icon}</div>
        <div>
          <p className="font-black">{title}</p>
          <p className="mt-1 text-sm leading-6 text-white/70">{body}</p>
        </div>
      </div>
    </div>
  );
}

function Pace({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
      <div className="text-[#335c67]">{icon}</div>
      <p className="mt-4 font-display text-3xl font-semibold">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#555]">{body}</p>
    </div>
  );
}

function CloseItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
      <p className="text-lg font-black">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#555]">{body}</p>
    </div>
  );
}
