import type { ReactNode } from "react";

export function EnginePanel({ title, intro, label = "Engine", accent = "text-plum", children }: { title: string; intro: string; label?: string; accent?: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <section className="rounded-kai border border-line bg-white p-5 shadow-sm sm:p-7">
        <p className="eyebrow">{label}</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-none tracking-normal sm:text-6xl">
          {title} <span className={`font-serif font-normal italic ${accent}`}>engine</span>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{intro}</p>
      </section>
      {children}
    </div>
  );
}
