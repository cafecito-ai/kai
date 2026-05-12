import { ArrowUpRight, Bolt, Circle, Heart } from "lucide-react";
import { api } from "../lib/api";

const directions = [
  {
    key: "A",
    title: "Bold & Electric",
    href: "/design/a.html",
    reference: "Linear x Discord x After Effects",
    reads: "premium, kinetic, slightly cocky",
    bestFor: "Teens who want the product to feel sharp, current, and high-energy.",
    risk: "Can feel overstimulating if motion and glow are not controlled.",
    icon: Bolt,
    className: "bg-[#07080C] text-[#F5F7FA] border-[#2A3145]",
    accent: "text-[#6EE7FF]"
  },
  {
    key: "B",
    title: "Y2K Soft",
    href: "/design/b.html",
    reference: "Cash App x BeReal x Glossier",
    reads: "friendly, handmade, playful",
    bestFor: "Teens who like softer creator aesthetics and a friend-energy product.",
    risk: "Mascot energy may not fit heavier safety moments.",
    icon: Heart,
    className: "bg-[#FFF8EE] text-[#1F1A2E] border-[#1F1A2E]",
    accent: "text-[#6B4FBB]"
  },
  {
    key: "C",
    title: "Calm Teen",
    href: "/design/c.html",
    reference: "Headspace redesigned for 2026 teens",
    reads: "editorial, refined, serious but still teen",
    bestFor: "A product that needs teens to trust it and parents to respect it.",
    risk: "May feel too restrained if Lev wants more visible energy.",
    icon: Circle,
    className: "bg-[#FAFAF7] text-[#0A0A0A] border-[#E5E2D9]",
    accent: "text-[#5B47F0]"
  }
];

export function DesignPicker() {
  return (
    <div className="space-y-5">
      <section className="rounded-kai bg-night p-5 text-paper shadow-soft sm:p-7">
        <p className="text-xs font-black uppercase tracking-wider text-lime">design decision</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-6xl">Pick the lane before we build deeper.</h1>
            <p className="mt-3 max-w-2xl text-paper/70">
              These are three complete visual systems for Kai. Lev should open each on a phone and pick the one that feels like something teens would actually use.
            </p>
          </div>
          <a href="/design/index.html" className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-kai bg-paper px-4 py-2 text-sm font-black text-ink">
            Open original picker <ArrowUpRight size={17} />
          </a>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {directions.map((direction) => (
          <a
            key={direction.key}
            href={direction.href}
            onClick={() => {
              // Fire-and-forget: log which direction this teen previewed so
              // Lev can correlate tester feedback with what they actually saw.
              // Failures are silent — this is analytics, not a hard gate.
              api.updateUser({ designPreference: direction.key }).catch(() => {});
            }}
            className={`focus-ring flex min-h-[430px] flex-col justify-between rounded-kai border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft ${direction.className}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-5xl font-black ${direction.accent}`}>{direction.key}</span>
                <direction.icon className={direction.accent} size={30} />
              </div>
              <h2 className="mt-6 text-3xl font-black">{direction.title}</h2>
              <p className="mt-2 text-sm opacity-65">{direction.reference}</p>
              <div className="mt-6 space-y-4 text-sm">
                <Block label="Reads as" value={direction.reads} />
                <Block label="Best for" value={direction.bestFor} />
                <Block label="Risk" value={direction.risk} />
              </div>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 text-sm font-black">
              View full prototype <ArrowUpRight size={17} />
            </div>
          </a>
        ))}
      </section>

      <section className="app-panel p-5">
        <h2 className="text-xl font-black">How to choose</h2>
        <div className="mt-3 grid gap-3 text-sm text-ink/70 md:grid-cols-4">
          <p>1. Open each direction on a phone.</p>
          <p>2. Send all three to one trusted teen friend.</p>
          <p>3. Pick the one that gets a genuine yes, not the most impressive one.</p>
          <p>4. Once picked, we lock tokens and archive the other two.</p>
        </div>
      </section>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-wider opacity-45">{label}</p>
      <p className="mt-1 font-semibold leading-snug">{value}</p>
    </div>
  );
}
