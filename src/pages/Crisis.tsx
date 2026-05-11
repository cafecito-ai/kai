export function Crisis() {
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-kai border border-danger/20 bg-white p-5 shadow-sm sm:p-7">
        <p className="eyebrow text-danger">Crisis resources</p>
        <h1 className="mt-3 font-display text-5xl font-black leading-none tracking-normal">If this is immediate, get a human now</h1>
      </section>
      <section className="rounded-kai border border-danger/20 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl font-black tracking-normal">U.S. and Canada</h2>
        <p className="mt-2">Call or text <strong>988</strong> for the Suicide & Crisis Lifeline.</p>
        <p>Text <strong>HOME</strong> to <strong>741741</strong> for Crisis Text Line.</p>
        <p>If someone is in immediate danger, call emergency services now.</p>
      </section>
      <p className="text-muted">Kai can stay present, but Kai is not a crisis service and cannot replace a trusted adult, clinician, counselor, or emergency support.</p>
    </article>
  );
}
