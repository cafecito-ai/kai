import { Lock, MessageCircle, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { FriendCompare } from "../components/tracker/FriendCompare";
import { AppHero, AppPage, AppSurface } from "../components/ui/AppPrimitives";

export function Groups() {
  return (
    <AppPage className="max-w-5xl">
      <AppHero
        eyebrow="groups"
        title={
          <>
            Social support, without turning growth into a <span className="font-serif font-normal italic text-plum">contest.</span>
          </>
        }
      >
        Groups stay inside Kai: small circles, shared wins, check-ins, and privacy-first progress. No public body metrics. No shame boards.
      </AppHero>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <AppSurface className="p-5 sm:p-6">
          <div className="grid size-12 place-items-center rounded-full bg-careWash text-care">
            <UsersRound aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-black tracking-normal">Beta circle</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted">
            Invite-only circles will let teens share streaks, habits, and encouragement while keeping sensitive answers private.
          </p>
          <div className="mt-5 grid gap-3">
            {[
              { icon: ShieldCheck, title: "Private by default", copy: "Mental notes, food photos, scans, and chats never appear in group feeds." },
              { icon: MessageCircle, title: "Encouragement only", copy: "The feed is built around check-ins, support, and small wins." },
              { icon: Lock, title: "Parent-safe controls", copy: "Invites, reporting, and safety boundaries are part of the production path." }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-3 rounded-kai border border-line bg-paper p-3">
                  <Icon size={18} className="mt-0.5 shrink-0 text-care" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-black text-ink">{item.title}</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-muted">{item.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/progress" className="focus-ring mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-black text-paper">
            See progress room
          </Link>
        </AppSurface>

        <FriendCompare />
      </div>
    </AppPage>
  );
}
