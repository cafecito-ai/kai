import { Activity, Brain, HeartPulse, Home, Settings, ShieldAlert, UsersRound, UserRound } from "lucide-react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useProgressStore } from "../../stores/progressStore";
import { useUserStore } from "../../stores/userStore";
import { KaiAvatar } from "../ui/AppPrimitives";

export function AppShell() {
  const { pathname } = useLocation();
  const immersiveRoute = pathname === "/demo" || pathname === "/scope";
  const standaloneAppRoute = pathname === "/home" || pathname === "/";
  const unifiedAppRoute = isUnifiedAppRoute(pathname);

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

  if (standaloneAppRoute) {
    return (
      <div className="min-h-screen bg-paper text-ink">
        <a
          href="#main"
          className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-kai focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-paper"
        >
          Skip to content
        </a>
        <main id="main">
          <Outlet />
        </main>
      </div>
    );
  }

  if (unifiedAppRoute) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] text-[#1A1A1F]">
        <a
          href="#main"
          className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-kai focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-paper"
        >
          Skip to content
        </a>
        <AppContextBar />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <AppDock />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#1A1A1F]">
      <a
        href="#main"
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-kai focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-paper"
      >
        Skip to content
      </a>
      <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function AppContextBar() {
  const { pathname } = useLocation();
  const { primaryEngine } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const streak = useProgressStore((state) => state.streak());
  const todayCount = events.filter((event) => event.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const activeEngine = engineFromPath(pathname) ?? primaryEngine;
  const lane = laneMeta(activeEngine);
  const ActiveIcon = lane.icon;

  return (
    <aside className="sticky top-0 z-30 border-b border-[#0A0A0A0F] bg-[#FAFAF7]/88 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/home" className="focus-ring grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_28px_rgba(10,10,10,0.08)]" aria-label="Kai home">
            <KaiAvatar size={34} label="Kai" pulse />
          </Link>
          <span className={`grid size-8 shrink-0 place-items-center rounded-full ${lane.tone}`}>
            <ActiveIcon size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">{sectionLabel(pathname)}</p>
            <p className="truncate text-sm font-black text-[#1A1A1F]">Mental and Physical stay in one loop.</p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 text-xs font-black sm:grid-cols-[1fr_1fr_auto]">
          <span className="min-w-0 truncate rounded-full border border-[#0A0A0A0F] bg-white px-2 py-2 text-center text-[#8A8A8F] sm:px-3">{todayCount} reps</span>
          <span className="min-w-0 truncate rounded-full border border-[#0A0A0A0F] bg-white px-2 py-2 text-center text-[#8A8A8F] sm:px-3">{streak} day streak</span>
          <Link to="/home" className="focus-ring hidden rounded-full bg-[#1A1A1F] px-4 py-2 text-white sm:inline-flex">
            Today
          </Link>
        </div>
      </div>
    </aside>
  );
}

function AppDock() {
  const links = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/progress", label: "Progress", icon: HeartPulse },
    { to: "/groups", label: "Groups", icon: UsersRound },
    { to: "/profile", label: "Profile", icon: UserRound },
    { to: "/settings", label: "Settings", icon: Settings }
  ];

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[24px] border border-[#0A0A0A0F] bg-white/95 p-1 shadow-[0_12px_40px_rgba(10,10,10,0.14)] backdrop-blur-xl"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary app navigation"
    >
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `focus-ring flex h-12 flex-col items-center justify-center rounded-[18px] text-[10px] font-bold transition ${
              isActive ? "bg-[#1A1A1F] text-white" : "text-[#5E5E64] hover:bg-[#F4F1EB] hover:text-[#1A1A1F]"
            }`
          }
        >
          <Icon size={17} aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{label === "Progress" ? "Track" : label}</span>
        </NavLink>
      ))}
      <Link to="/crisis" className="focus-ring absolute -top-11 right-0 hidden min-h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-danger shadow-sm sm:inline-flex">
        <ShieldAlert size={14} aria-hidden="true" />
        Crisis
      </Link>
    </nav>
  );
}

function isUnifiedAppRoute(pathname: string) {
  return (
    pathname.startsWith("/engine") ||
    pathname === "/health" ||
    pathname === "/mental" ||
    pathname === "/progress" ||
    pathname === "/groups" ||
    pathname === "/profile" ||
    pathname === "/settings"
  );
}

function sectionLabel(pathname: string) {
  if (pathname === "/health" || pathname.startsWith("/engine/physical")) return "Health unit";
  if (pathname === "/mental" || pathname.startsWith("/engine/mental")) return "Mental unit";
  if (pathname === "/progress") return "Progress";
  if (pathname === "/groups") return "Circle";
  if (pathname === "/profile") return "Profile";
  if (pathname === "/settings") return "Settings";
  return "Kai app";
}

function engineFromPath(pathname: string): "physical" | "potential" | "mental" | null {
  if (pathname === "/health") return "physical";
  if (pathname === "/mental") return "mental";
  if (pathname.startsWith("/engine/potential")) return "mental";
  if (pathname.startsWith("/engine/mental")) return "mental";
  if (pathname.startsWith("/engine/physical")) return "physical";
  return null;
}

function laneMeta(engine: "physical" | "potential" | "mental") {
  if (engine === "potential") return { label: "Mind", icon: Brain, tone: "bg-resetWash text-reset" };
  if (engine === "mental") return { label: "Mind", icon: Brain, tone: "bg-resetWash text-reset" };
  return { label: "Body", icon: Activity, tone: "bg-bodyWash text-body" };
}
