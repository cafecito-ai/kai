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
        <p className="mt-2 leading-7 text-muted">Kai keeps onboarding simple and does not ask for age or parent email inside the first-run flow. Severe safety categories are still handled with a clear crisis path and operations review.</p>
      </AppSurface>
    </AppPage>
  );
}
