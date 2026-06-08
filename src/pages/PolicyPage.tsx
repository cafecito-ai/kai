import { AppHero, AppPage, AppSurface } from "../components/ui/AppPrimitives";

export function PolicyPage({ kind }: { kind: "terms" | "privacy" }) {
  const isTerms = kind === "terms";
  return (
    <AppPage className="max-w-3xl">
      <AppHero eyebrow="Kai policy" title={isTerms ? "Terms of Service" : "Privacy Policy"}>
        Kai is a wellness coaching product. It does not provide medical care, mental health treatment, diagnosis, medication guidance, or emergency support.
      </AppHero>
      <AppSurface className="space-y-5 p-5 sm:p-7">{isTerms ? <TermsCopy /> : <PrivacyCopy />}</AppSurface>
    </AppPage>
  );
}

function TermsCopy() {
  return (
    <>
      <section className="space-y-2">
        <h2 className="font-display text-2xl font-black tracking-normal">Use Kai as support, not care.</h2>
        <p className="leading-7 text-muted">
          Kai can help with reflection, goals, food notes, movement, sleep, and reset exercises. It cannot replace a parent, clinician, coach, school counselor, crisis line, or emergency service.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-2xl font-black tracking-normal">Age helps personalize Kai.</h2>
        <p className="leading-7 text-muted">
          Kai may ask for age to tune language and safety defaults. Age is not a public profile field and does not expose private answers, goals, food logs, or chats.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-2xl font-black tracking-normal">Food tracking has guardrails.</h2>
        <p className="leading-7 text-muted">
          Kai does not score bodies, rank meals, reward restriction, or show calorie targets by default. Food photos and notes are used descriptively.
        </p>
      </section>
    </>
  );
}

function PrivacyCopy() {
  return (
    <>
      <section className="space-y-2">
        <h2 className="font-display text-2xl font-black tracking-normal">What Kai stores.</h2>
        <p className="leading-7 text-muted">
          Kai stores account settings, onboarding answers, goals, progress events, engine activity, food notes, chat messages, and safety events needed to operate the product.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-2xl font-black tracking-normal">Safety events.</h2>
        <p className="leading-7 text-muted">
          Messages that suggest crisis, self-harm, eating-disorder risk, abuse, substance danger, or violence can be logged for safety review and shown support resources.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-2xl font-black tracking-normal">Review mode.</h2>
        <p className="leading-7 text-muted">
          During review, login may be disabled so the team can test the full site. Production auth should be re-enabled before a broader beta.
        </p>
      </section>
    </>
  );
}
