export function PolicyPage({ kind }: { kind: "terms" | "privacy" }) {
  return (
    <article className="mx-auto max-w-3xl space-y-4 rounded-kai border border-line bg-white p-5 shadow-sm sm:p-7">
      <p className="eyebrow">Kai policy</p>
      <h1 className="font-display text-5xl font-black leading-none tracking-normal">{kind === "terms" ? "Terms of Service" : "Privacy Policy"}</h1>
      <p className="leading-7 text-muted">
        Kai is a wellness coaching product. It does not provide medical care, mental health treatment, diagnosis, medication guidance, or emergency support.
      </p>
      <p className="leading-7 text-muted">
        User data is used to operate the product, personalize Kai, protect users through safety systems, and show progress. Friend comparison is opt-in and never shares private messages or journal content.
      </p>
    </article>
  );
}
