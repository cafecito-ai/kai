import { KaiChat } from "../components/kai/KaiChat";
import { AppPage, KaiAvatar } from "../components/ui/AppPrimitives";

export function Home() {
  return (
    <AppPage className="max-w-2xl pb-28">
      <section className="overflow-hidden rounded-[32px] bg-[#090A0F] px-5 py-6 text-white shadow-[0_24px_70px_rgba(9,10,15,0.22)] sm:px-7 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <KaiAvatar size={54} label="KAI logo" pulse />
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-white/42">Home</p>
              <h1 className="text-4xl font-black leading-none tracking-normal text-white">KAI</h1>
            </div>
          </div>
          <div className="hidden rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white/56 sm:block">one move</div>
        </div>

        <div className="mt-7 max-w-md">
          <p className="text-4xl font-black leading-[0.95] tracking-normal sm:text-5xl">Lock in without the noise.</p>
          <p className="mt-4 max-w-sm text-sm font-semibold leading-6 text-white/58">
            Talk it out. Pick the next move. Build proof every day.
          </p>
        </div>
      </section>
      <KaiChat embedded />
    </AppPage>
  );
}
