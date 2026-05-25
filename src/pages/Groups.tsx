import { Lock, MessageCircle, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { FriendCompare } from "../components/tracker/FriendCompare";
import { NextLoopCard } from "../components/tracker/NextLoopCard";
import { AppPage, AppSurface, KaiPageHero } from "../components/ui/AppPrimitives";

export function Groups() {
  return (
    <AppPage className="utility-page-shell pb-28 sm:pb-12">
      <KaiPageHero eyebrow="Kai · circle" title="Support without oversharing.">
        A circle should feel like backup, not surveillance. Kai keeps chats, meals, scans, and private answers out of the feed.
      </KaiPageHero>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <AppSurface className="p-5 sm:p-6">
          <div className="grid size-12 place-items-center rounded-full bg-careWash text-care">
            <UsersRound aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-3xl font-black leading-none tracking-normal">Support circle</h2>
          <p className="mt-3 max-w-full break-words text-sm font-semibold leading-6 text-muted">
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
                    <p className="mt-1 break-words text-sm font-semibold leading-5 text-muted">{item.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/progress" className="focus-ring mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-black text-paper">
            See progress
          </Link>
        </AppSurface>

        <div className="grid gap-4">
          <NextLoopCard context="compact" />
          <FriendCompare />
        </div>
      </div>
    </AppPage>
  );
}
