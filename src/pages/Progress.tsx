import { FriendCompare } from "../components/tracker/FriendCompare";
import { NextLoopCard } from "../components/tracker/NextLoopCard";
import { ProgressSummary } from "../components/tracker/ProgressSummary";
import { AppPage, KaiPageHero } from "../components/ui/AppPrimitives";

export function Progress() {
  return (
    <AppPage className="utility-page-shell pb-28 sm:pb-12">
      <KaiPageHero eyebrow="Kai · memory" title="Private proof, not a scoreboard.">
        Every saved rep gives Kai a better read. Mind, body, and goal work stays private and turns into smarter next moves.
      </KaiPageHero>
      <NextLoopCard />
      <ProgressSummary />
      <FriendCompare />
    </AppPage>
  );
}
