import { KaiChat } from "../components/kai/KaiChat";
import { AppPage, KaiAvatar } from "../components/ui/AppPrimitives";

export function Home() {
  return (
    <AppPage className="flex min-h-[calc(100svh-5rem)] max-w-2xl flex-col gap-3 pb-28">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#090A0F] px-4 py-4 text-white shadow-[0_18px_54px_rgba(9,10,15,0.20)] sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <KaiAvatar size={44} label="KAI logo" pulse />
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/38">KAI home</p>
              <h1 className="truncate text-2xl font-black leading-none tracking-normal text-white">What’s loud today?</h1>
            </div>
          </div>
          <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-right">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white/36">proof</p>
            <p className="text-xs font-black text-white">one rep</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["mind", "body", "goals"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.055] px-3 py-2 text-center text-xs font-black text-white/68">
              {item}
            </div>
          ))}
        </div>
      </section>
      <KaiChat embedded />
    </AppPage>
  );
}
