import type { ReactNode } from "react";

export function EnginePanel({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="space-y-6">
      <section className="rounded-kai bg-ink p-6 text-paper">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider text-amber">Engine</p>
        <h1 className="text-3xl font-black sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-paper/80">{intro}</p>
      </section>
      {children}
    </div>
  );
}
