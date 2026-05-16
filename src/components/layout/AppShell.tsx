import { Activity, Brain, Target } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useProgressStore } from "../../stores/progressStore";
import { useUserStore } from "../../stores/userStore";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

export function AppShell() {
  const { pathname } = useLocation();
  const immersiveRoute = pathname === "/demo";

  if (immersiveRoute) {
    return (
      <div className="noise min-h-screen bg-paper text-ink">
        <a
          href="#main"
          className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-kai focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-paper"
        >
          Skip to content
        </a>
        <div id="main">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="noise min-h-screen bg-paper text-ink">
      {/* WCAG SC 2.4.1 Bypass Blocks: keyboard-only users skip the nav. */}
      <a
        href="#main"
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-kai focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-paper"
      >
        Skip to content
      </a>
      <Nav />
      <TodayBar />
      <main id="main" className="mobile-safe-bottom mx-auto w-full max-w-6xl px-3 pt-3 sm:px-5 sm:pt-5 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function TodayBar() {
  const { pathname } = useLocation();
  const { primaryEngine } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const streak = useProgressStore((state) => state.streak());
  const todayCount = events.filter((event) => event.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const appRoute = pathname.startsWith("/engine") || pathname === "/progress" || pathname === "/settings";

  if (!appRoute) return null;

  const activeEngine = engineFromPath(pathname) ?? primaryEngine;
  const lane = laneMeta(activeEngine);
  const ActiveIcon = lane.icon;

  return (
    <aside className="border-b border-line bg-white/62 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-2 px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`grid size-8 shrink-0 place-items-center rounded-full ${lane.tone}`}>
            <ActiveIcon size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-[0.14em] text-muted">today's app path</p>
            <p className="truncate text-sm font-black text-ink">{lane.label} first, one rep, then progress.</p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 text-xs font-black sm:grid-cols-[1fr_1fr_auto]">
          <span className="min-w-0 truncate rounded-full border border-line bg-paper px-2 py-2 text-center text-muted sm:px-3">{todayCount} reps</span>
          <span className="min-w-0 truncate rounded-full border border-line bg-paper px-2 py-2 text-center text-muted sm:px-3">{streak} day streak</span>
          <Link to={`/engine/${activeEngine}`} className="focus-ring hidden rounded-full bg-ink px-4 py-2 text-paper sm:inline-flex">
            Continue
          </Link>
        </div>
      </div>
    </aside>
  );
}

function engineFromPath(pathname: string): "physical" | "potential" | "mental" | null {
  if (pathname.startsWith("/engine/potential")) return "potential";
  if (pathname.startsWith("/engine/mental")) return "mental";
  if (pathname.startsWith("/engine/physical")) return "physical";
  return null;
}

function laneMeta(engine: "physical" | "potential" | "mental") {
  if (engine === "potential") return { label: "Goals", icon: Target, tone: "bg-goalsWash text-goals" };
  if (engine === "mental") return { label: "Reset", icon: Brain, tone: "bg-resetWash text-reset" };
  return { label: "Body", icon: Activity, tone: "bg-bodyWash text-body" };
}
