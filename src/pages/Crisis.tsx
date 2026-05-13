import { useMemo, useState } from "react";
import { CRISIS_RESOURCES, detectRegion, type CrisisRegion } from "../lib/crisis-resources";

const ALWAYS_FIRST_BLOCK = {
  label: "If someone is in immediate danger",
  body: "Call local emergency services right now. In the U.S./Canada: 911. UK/IE: 999. AU: 000. NZ: 111."
};

export function Crisis() {
  const initialRegion = useMemo<CrisisRegion>(() => {
    if (typeof navigator === "undefined") return "us_ca";
    return detectRegion(navigator.language);
  }, []);
  const [region, setRegion] = useState<CrisisRegion>(initialRegion);
  const block = CRISIS_RESOURCES[region];

  return (
    <article className="mx-auto max-w-xl space-y-4">
      <section className="rounded-kai border border-danger/25 bg-white p-5 shadow-sm sm:p-7">
        <p className="eyebrow text-danger">Crisis resources</p>
        <h1 className="mt-3 font-display text-4xl font-black leading-none tracking-normal sm:text-5xl">If this is immediate, get a human now</h1>
      </section>

      <section className="rounded-kai border border-danger/40 bg-[#FFE8DD] p-5 shadow-sm">
        <h2 className="font-display text-xl font-black tracking-normal">{ALWAYS_FIRST_BLOCK.label}</h2>
        <p className="mt-2 leading-6">{ALWAYS_FIRST_BLOCK.body}</p>
      </section>

      <section className="rounded-kai border border-line bg-white p-5 shadow-sm">
        <label htmlFor="crisis-region" className="block text-xs font-bold uppercase tracking-wider text-muted">
          Your region
        </label>
        <select
          id="crisis-region"
          className="field mt-2 w-full"
          value={region}
          onChange={(event) => setRegion(event.target.value as CrisisRegion)}
        >
          {(Object.keys(CRISIS_RESOURCES) as CrisisRegion[]).map((key) => (
            <option key={key} value={key}>
              {CRISIS_RESOURCES[key].label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-muted">
          {region === initialRegion
            ? "Auto-picked from your browser language. Override if it's wrong."
            : "You picked this region. Refresh to reset to the auto-pick."}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-black tracking-normal">{block.label}</h2>
        {block.resources.map((resource) => (
          <article key={resource.name} className="rounded-kai border border-danger/20 bg-white p-5 shadow-sm">
            <h3 className="font-display text-lg font-black tracking-normal">{resource.name}</h3>
            <p className="mt-1 text-sm leading-6 text-muted">{resource.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
              {resource.phone && (
                <a className="focus-ring inline-flex min-h-12 items-center rounded-full bg-danger px-4 py-2 text-white" href={`tel:${resource.phone.replace(/\s+/g, "")}`}>
                  Call {resource.phone}
                </a>
              )}
              {resource.text && <span className="inline-flex min-h-12 items-center rounded-full bg-paper px-4 py-2 text-ink">Text {resource.text}</span>}
              {resource.url && (
                <a className="focus-ring inline-flex min-h-12 items-center rounded-full bg-paper px-4 py-2 text-ink underline" href={resource.url} target="_blank" rel="noreferrer">
                  Visit site
                </a>
              )}
            </div>
          </article>
        ))}
      </section>

      <p className="text-muted">Kai can stay present, but Kai is not a crisis service and cannot replace a trusted adult, clinician, counselor, or emergency support.</p>
    </article>
  );
}
