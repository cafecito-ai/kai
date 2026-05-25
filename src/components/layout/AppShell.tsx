import { Activity, Brain, Camera, HeartPulse, Home, Plus, Settings, ShieldAlert, Sparkles, UsersRound, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { KaiChat } from "../kai/KaiChat";
import { useProgressStore } from "../../stores/progressStore";
import { useUserStore } from "../../stores/userStore";
import { KaiAvatar } from "../ui/AppPrimitives";
import { Footer } from "./Footer";

export function AppShell() {
  const { pathname } = useLocation();
  const immersiveRoute = pathname === "/demo" || pathname === "/scope";
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
        <Footer />
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
        <AppComposer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFAF7] text-[#1A1A1F]">
      <a
        href="#main"
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-kai focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-paper"
      >
        Skip to content
      </a>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
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
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 text-xs font-black sm:grid-cols-[1fr_1fr_auto_auto]">
          <span className="min-w-0 truncate rounded-full border border-[#0A0A0A0F] bg-white px-2 py-2 text-center text-[#8A8A8F] sm:px-3">{todayCount} reps</span>
          <span className="min-w-0 truncate rounded-full border border-[#0A0A0A0F] bg-white px-2 py-2 text-center text-[#8A8A8F] sm:px-3">{streak} day streak</span>
          {/* Spec §1 + §7 Level 3: always-on crisis access. Must be visible on mobile. */}
          <Link
            to="/crisis"
            aria-label="Crisis resources"
            className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-danger/30 bg-white px-3 text-danger"
          >
            <ShieldAlert size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Crisis</span>
          </Link>
          <Link to="/home" className="focus-ring hidden rounded-full bg-[#1A1A1F] px-4 py-2 text-white sm:inline-flex">
            Today
          </Link>
        </div>
      </div>
    </aside>
  );
}

function AppComposer() {
  const [chatOpen, setChatOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <>
      {chatOpen && <GlobalChatSheet onClose={() => setChatOpen(false)} />}
      {quickOpen && <GlobalQuickSheet onClose={() => setQuickOpen(false)} />}
      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="focus-ring fixed bottom-5 left-5 z-40 grid size-10 place-items-center rounded-full bg-white shadow-[0_12px_40px_rgba(10,10,10,0.14)] sm:bottom-6 sm:left-[calc(50%-18rem)]"
        aria-label="Talk to Kai"
      >
        <KaiAvatar size={34} label="Kai companion" pulse />
      </button>
      <AppDock quickOpen={quickOpen} onToggleQuick={() => setQuickOpen((open) => !open)} />
    </>
  );
}

function AppDock({ quickOpen, onToggleQuick }: { quickOpen: boolean; onToggleQuick: () => void }) {
  const links = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/progress", label: "Progress", icon: HeartPulse },
    { to: "/groups", label: "Groups", icon: UsersRound },
    { to: "/profile", label: "Profile", icon: UserRound },
    { to: "/settings", label: "Settings", icon: Settings }
  ];

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 mx-auto grid max-w-md grid-cols-[repeat(2,minmax(0,1fr))_3.25rem_repeat(3,minmax(0,1fr))] gap-1 rounded-[24px] border border-[#0A0A0A0F] bg-white/95 p-1 shadow-[0_12px_40px_rgba(10,10,10,0.14)] backdrop-blur-xl"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary app navigation"
    >
      {links.slice(0, 2).map(({ to, label, icon: Icon }) => (
        <DockLink key={to} to={to} label={label} icon={Icon} />
      ))}
      <button
        type="button"
        onClick={onToggleQuick}
        className="focus-ring flex h-12 items-center justify-center rounded-[19px] bg-[#1A1A1F] text-white shadow-sm"
        aria-label="Quick app actions"
        aria-expanded={quickOpen}
      >
        <Plus size={24} className={quickOpen ? "rotate-45 transition" : "transition"} aria-hidden="true" />
      </button>
      {links.slice(2).map(({ to, label, icon: Icon }) => (
        <DockLink key={to} to={to} label={label} icon={Icon} />
      ))}
    </nav>
  );
}

function DockLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <NavLink
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
  );
}

function GlobalChatSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#111116]/24 px-3 pb-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Chat with KAI">
      <div className="mx-auto w-full max-w-md rounded-[28px] bg-white p-2 shadow-[0_28px_80px_rgba(10,10,10,0.28)]">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <KaiAvatar size={34} label="KAI" pulse />
            <div>
              <p className="text-sm font-black text-[#111116]">KAI</p>
              <p className="text-xs font-semibold text-[#8A8A8F]">One companion across the whole app</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid size-10 place-items-center rounded-full bg-[#F4F1EB] text-[#1A1A1F]" aria-label="Close chat">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <KaiChat embedded />
        <div className="grid grid-cols-2 gap-2 p-2 pt-3">
          <Link to="/mental?module=checkin" onClick={onClose} className="focus-ring rounded-full bg-[#E4F7F4] px-4 py-3 text-center text-sm font-black text-[#218A7D]">
            Mental unit
          </Link>
          <Link to="/health?module=food" onClick={onClose} className="focus-ring rounded-full bg-[#FFF0EC] px-4 py-3 text-center text-sm font-black text-[#C86B31]">
            Health unit
          </Link>
        </div>
      </div>
    </div>
  );
}

function GlobalQuickSheet({ onClose }: { onClose: () => void }) {
  const actions = [
    { to: "/health?module=food", label: "Food photo", icon: Camera, tone: "bg-[#FFF0EC] text-[#C86B31]" },
    { to: "/mental?module=checkin", label: "Mental check-in", icon: Brain, tone: "bg-[#E4F7F4] text-[#218A7D]" },
    { to: "/mental?module=reset", label: "Breath reset", icon: Sparkles, tone: "bg-[#EEEAFF] text-[#7B6EF6]" },
    { to: "/health?module=scan", label: "Body scan", icon: Activity, tone: "bg-[#F4F1EB] text-[#1A1A1F]" }
  ];

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-5" role="dialog" aria-label="Quick actions">
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#0A0A0A0F] bg-white/95 p-3 shadow-[0_18px_60px_rgba(10,10,10,0.18)] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">Quick rep</p>
          <button type="button" onClick={onClose} className="focus-ring grid size-8 place-items-center rounded-full bg-[#F4F1EB] text-[#1A1A1F]" aria-label="Close quick actions">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.to} onClick={onClose} className="focus-ring flex min-h-14 items-center gap-3 rounded-[18px] bg-[#FAFAF7] px-3 text-left text-sm font-black text-[#1A1A1F]">
                <span className={`grid size-9 place-items-center rounded-full ${action.tone}`}>
                  <Icon size={17} aria-hidden="true" />
                </span>
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function isUnifiedAppRoute(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/home" ||
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
