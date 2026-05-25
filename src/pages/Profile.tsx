import { Brain, HeartPulse, Settings as SettingsIcon, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { EvolvingCharacter } from "../components/tracker/EvolvingCharacter";
import { NextLoopCard } from "../components/tracker/NextLoopCard";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { AppPage, AppSurface, KaiPageHero, MetricPill } from "../components/ui/AppPrimitives";
import { useProgressStore } from "../stores/progressStore";
import { useUserStore } from "../stores/userStore";

export function Profile() {
  const { kaiName, kaiTone, primaryEngine, consentStatus } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const level = useProgressStore((state) => state.level());
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());

  return (
    <AppPage className="utility-page-shell pb-28 sm:pb-12">
      <KaiPageHero
        eyebrow="Kai · profile"
        title="Profile is the companion setup."
        action={
          <Link to="/settings" className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-ink">
            <SettingsIcon size={16} aria-hidden="true" />
            Settings
          </Link>
        }
      >
        Kai keeps your voice, privacy status, and saved reps in one place without turning growth into a scoreboard.
      </KaiPageHero>

      <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="grid gap-4">
          <AppSurface className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <EvolvingCharacter level={level} />
              <div className="min-w-0">
                <p className="eyebrow">companion</p>
                <h2 className="mt-1 truncate font-display text-3xl font-black tracking-normal">{kaiName}</h2>
                <p className="mt-1 text-sm font-semibold capitalize text-muted">{kaiTone} voice</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <MetricPill label="Level" value={String(level)} tone="goals" />
              <MetricPill label="Streak" value={String(streak)} tone="care" />
              <MetricPill label="Belt" value={belt} tone="body" />
            </div>
            <div className="mt-5 grid gap-3">
              <ProfileRow icon={Brain} label="Default focus" value={primaryEngine === "physical" ? "Body" : primaryEngine === "potential" ? "Goals" : "Mind"} />
              <ProfileRow icon={HeartPulse} label="Saved reps" value={String(events.length)} />
              <ProfileRow icon={UserRound} label="Consent" value={consentStatus.replace(/_/g, " ")} />
            </div>
          </AppSurface>
          <NextLoopCard context="compact" />
        </div>

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
