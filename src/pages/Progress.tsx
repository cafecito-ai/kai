import { FriendCompare } from "../components/tracker/FriendCompare";
import { NextLoopCard } from "../components/tracker/NextLoopCard";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { AppPage, KaiPageHero } from "../components/ui/AppPrimitives";

export function Progress() {
  return (
    <AppPage className="utility-page-shell pb-28 sm:pb-12">
      <KaiPageHero eyebrow="Kai · progress" title="Progress without pressure.">
        Progress is private proof: mental, physical, and goals reps Kai can use to choose the next move.
      </KaiPageHero>
      <NextLoopCard />
      <ProgressSummary />
      <FriendCompare />
    </AppPage>
  );
}
