import { ArrowRight, Dumbbell, MessageCircle, Music2, ShieldCheck, Sparkles, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function Landing() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-kai bg-night text-paper shadow-soft">
        <div className="grid min-h-[72vh] gap-8 p-5 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div className="flex flex-col justify-between gap-10">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1 text-sm font-bold text-lime">
                <Sparkles size={16} />
                Teen wellness without the lecture
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] sm:text-7xl">Kai</h1>
              <p className="mt-5 max-w-xl text-lg text-paper/75 sm:text-xl">
                A pocket mentor for body stuff, goal stuff, and the stuff that is hard to explain out loud.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/home">
                <Button className="bg-paper text-ink hover:bg-lime">
                  Open demo <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/onboarding">
                <Button variant="secondary" className="border-paper/20 bg-paper/10 text-paper hover:border-paper/60">
                  Start onboarding
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid content-end gap-4">
            <div className="rounded-[24px] border border-paper/15 bg-paper p-3 text-ink shadow-soft">
              <div className="rounded-[18px] bg-mist p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-sage">Tonight</p>
                    <p className="text-2xl font-black">What do you need?</p>
                  </div>
                  <div className="grid size-12 place-items-center rounded-kai bg-ink text-paper">
                    <MessageCircle />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="max-w-[86%] rounded-kai bg-white p-3 text-sm shadow-sm">
                    I can help you sort the noise. Pick a lane, or just dump the thought here.
                  </div>
                  <div className="ml-auto max-w-[78%] rounded-kai bg-ink p-3 text-sm text-paper">
                    I want to feel less behind.
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <MiniTile icon={<Dumbbell />} label="Body" color="bg-sage" />
                    <MiniTile icon={<Music2 />} label="Goals" color="bg-amber" />
                    <MiniTile icon={<Wind />} label="Reset" color="bg-sky" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <Info icon={<MessageCircle />} title="Kai chat" copy="Short answers. Real options. No fake therapist energy." />
        <Info icon={<ShieldCheck />} title="Safety first" copy="Crisis paths get routed before the model gets a turn." />
        <Info icon={<Sparkles />} title="Progress that fits" copy="Streaks, belts, and a character that grows with healthy reps." />
      </section>
    </div>
  );
}

function MiniTile({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div className={`${color} rounded-kai p-3 text-center text-paper`}>
      <div className="mx-auto mb-2 grid size-8 place-items-center rounded-full bg-white/20">{icon}</div>
      <p className="text-xs font-black">{label}</p>
    </div>
  );
}

function Info({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return (
    <div className="rounded-kai border border-ink/10 bg-white p-5 shadow-sm">
      <div className="mb-4 text-sage">{icon}</div>
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm text-ink/70">{copy}</p>
    </div>
  );
}
