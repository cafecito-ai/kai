import { ArrowRight, CheckCircle2, Dumbbell, Flame, MessageCircle, ShieldCheck, Target, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function Landing() {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-kai bg-night text-paper shadow-soft">
        <div className="grid min-h-[74vh] gap-5 p-4 sm:p-6 lg:grid-cols-[0.82fr_1.18fr] lg:p-8">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-kai bg-paper/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-lime">
                <Flame size={15} />
                private beta shell
              </div>
              <h1 className="max-w-2xl text-5xl font-black leading-[0.96] sm:text-6xl">Check in. Pick a lane. Do one thing.</h1>
              <p className="mt-5 max-w-xl text-base text-paper/72 sm:text-lg">
                Kai is a low-pressure wellness app for teens: body, goals, and reset tools in one place.
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
          <div className="grid content-center">
            <div className="mx-auto w-full max-w-[430px] rounded-[28px] border border-paper/15 bg-graphite p-2 shadow-soft">
              <div className="rounded-[22px] bg-paper p-3 text-ink">
                <div className="mb-3 flex items-center justify-between border-b border-ink/10 pb-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-sage">4:18 PM</p>
                    <p className="text-2xl font-black">What’s loud?</p>
                  </div>
                  <div className="grid size-11 place-items-center rounded-kai bg-ink text-paper text-sm font-black">
                    kai
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="rounded-kai bg-white p-3 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wider text-sky">Kai</p>
                    <p className="mt-1 text-sm">Don’t solve your whole life. Pick the tab that matches right now.</p>
                  </div>
                  <ModeRow icon={<Dumbbell />} title="Body" copy="sleep, food, movement" accent="bg-sage" />
                  <ModeRow icon={<Target />} title="Goals" copy="school, sport, music, money" accent="bg-amber" />
                  <ModeRow icon={<Wind />} title="Reset" copy="pressure, social, overthinking" accent="bg-sky" />
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <Stat label="streak" value="3" />
                    <Stat label="belt" value="green" />
                    <Stat label="next" value="8m" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="grid gap-3 sm:grid-cols-3">
        <Info icon={<MessageCircle />} title="Short chat" copy="Kai asks one useful question at a time." />
        <Info icon={<CheckCircle2 />} title="Tiny reps" copy="The app turns vague stress into one action." />
        <Info icon={<ShieldCheck />} title="Safety layer" copy="Crisis language routes out of coaching immediately." />
      </section>
    </div>
  );
}

function ModeRow({ icon, title, copy, accent }: { icon: React.ReactNode; title: string; copy: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-kai border border-ink/10 bg-white p-3">
      <div className={`${accent} grid size-10 shrink-0 place-items-center rounded-kai text-paper`}>{icon}</div>
      <div className="min-w-0">
        <p className="font-black">{title}</p>
        <p className="truncate text-xs text-ink/62">{copy}</p>
      </div>
      <ArrowRight className="ml-auto text-ink/35" size={17} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-kai bg-mist p-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-ink/45">{label}</p>
      <p className="text-sm font-black">{value}</p>
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
