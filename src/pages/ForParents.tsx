import { AppHero, AppPage, AppSurface } from "../components/ui/AppPrimitives";

export function ForParents() {
  return (
    <AppPage className="max-w-3xl">
      <AppHero eyebrow="trust and safety" title="For parents">
        Kai is a structured wellness coaching environment for teens. It is not therapy, medical treatment, diagnosis, or emergency support.
      </AppHero>
      <AppSurface className="p-4 sm:p-6">
        <h2 className="font-display text-2xl font-black tracking-normal">What Kai does</h2>
        <p className="mt-2 leading-7 text-muted">Kai helps teens take small wellness reps across food, movement, goals, emotions, and self-talk. It avoids diagnosis, diet culture, and hidden clinical claims.</p>
      </AppSurface>
      <AppSurface className="p-4 sm:p-6">
        <h2 className="font-display text-2xl font-black tracking-normal">Consent and safety</h2>
        <p className="mt-2 leading-7 text-muted">Kai asks for age to tune language and safety defaults. Severe safety categories are logged for operations review and can trigger parent-notification workflows when configured.</p>
      </AppSurface>
    </AppPage>
  );
}
