import { FriendCompare } from "../components/tracker/FriendCompare";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { AppHero, AppPage } from "../components/ui/AppPrimitives";

export function Progress() {
  return (
    <AppPage>
      <AppHero
        eyebrow="progress"
        title={
          <>
            Proof you are showing up, without getting weird about <span className="font-serif font-normal italic text-plum">progress.</span>
          </>
        }
      >
        Streaks, belts, and character growth reward reps across Body, Goals, and Reset without turning wellness into a scoreboard.
      </AppHero>
      <ProgressSummary />
      <FriendCompare />
    </AppPage>
  );
}
