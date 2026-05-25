import { FriendCompare } from "../components/tracker/FriendCompare";
import { NextLoopCard } from "../components/tracker/NextLoopCard";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { AppHero, AppPage } from "../components/ui/AppPrimitives";

export function Progress() {
  return (
    <AppPage>
      <AppHero
        eyebrow="your wins"
        title={
          <>
            Progress for mental and physical <span className="font-serif font-normal italic text-plum">reps.</span>
          </>
        }
      >
        Kai turns check-ins, food notes, scans, breathing, sleep, movement, and goals into one private growth signal.
      </AppHero>
      <NextLoopCard />
      <ProgressSummary />
      <FriendCompare />
    </AppPage>
  );
}
