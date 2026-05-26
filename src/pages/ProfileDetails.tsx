import { Activity, Brain, Flag, HeartPulse, Settings as SettingsIcon, UsersRound, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { EvolvingCharacter } from "../components/tracker/EvolvingCharacter";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { AppHero, AppPage, AppSurface, MetricPill } from "../components/ui/AppPrimitives";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

export function ProfileDetails() {
  const { kaiName, kaiTone, primaryEngine, consentStatus } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const level = useProgressStore((state) => state.level());
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());

  return (
    <AppPage className="max-w-5xl">
      <AppHero
        eyebrow="app section · profile"
        title={
          <>
            The companion, privacy, and growth model in one <span className="font-serif font-normal italic text-plum">place.</span>
          </>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/progress" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-black text-ink">
              <Activity size={16} aria-hidden="true" />
              Progress
            </Link>
            <Link to="/groups" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-black text-ink">
              <UsersRound size={16} aria-hidden="true" />
              Groups
            </Link>
            <Link to="/missions" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-black text-ink">
              <Flag size={16} aria-hidden="true" />
              Missions
            </Link>
            <Link to="/settings" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-black text-paper">
              <SettingsIcon size={16} aria-hidden="true" />
              Settings
            </Link>
          </div>
        }
      >
        Profile keeps Kai's voice, primary unit, consent state, and progress identity together.
      </AppHero>

      <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <AppSurface className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <EvolvingCharacter level={level} />
            <div className="min-w-0">
              <p className="eyebrow">companion</p>
              <h2 className="mt-1 truncate font-display text-3xl font-black tracking-normal">{kaiName}</h2>
              <p className="mt-1 text-sm font-semibold capitalize text-muted">{kaiTone} voice</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MetricPill label="Level" value={String(level)} tone="goals" />
            <MetricPill label="Streak" value={String(streak)} tone="care" />
            <MetricPill label="Belt" value={belt} tone="body" />
          </div>
          <div className="mt-5 grid gap-3">
            <ProfileRow icon={Brain} label="Primary unit" value={primaryEngine === "physical" ? "Health" : "Mental"} />
            <ProfileRow icon={HeartPulse} label="Saved reps" value={String(events.length)} />
            <ProfileRow icon={UserRound} label="Consent" value={consentStatus.replace(/_/g, " ")} />
          </div>
        </AppSurface>

        <ProgressSummary />
      </div>
    </AppPage>
  );
}

function ProfileRow({ icon: Icon, label, value }: { icon: typeof Brain; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-kai border border-line bg-paper p-3">
      <span className="flex min-w-0 items-center gap-2 text-sm font-black text-ink">
        <Icon size={17} aria-hidden="true" />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black capitalize text-muted">{value}</span>
    </div>
  );
}
