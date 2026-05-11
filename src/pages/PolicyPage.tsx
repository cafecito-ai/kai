export function PolicyPage({ kind }: { kind: "terms" | "privacy" }) {
  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-4xl font-black">{kind === "terms" ? "Terms of Service" : "Privacy Policy"}</h1>
      <p>
        Kai is a wellness coaching product. It does not provide medical care, mental health treatment, diagnosis, medication guidance, or emergency support.
      </p>
      <p>
        User data is used to operate the product, personalize Kai, protect users through safety systems, and show progress. Friend comparison is opt-in and never shares private messages or journal content.
      </p>
    </article>
  );
}
