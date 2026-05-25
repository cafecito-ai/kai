import { Activity, Brain, Camera, HeartPulse, Home, Plus, Settings, ShieldAlert, Sparkles, Target, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { KaiChat } from "../kai/KaiChat";
import { useProgressStore } from "../../stores/progressStore";
import { useUserStore } from "../../stores/userStore";
import { KaiAvatar } from "../ui/AppPrimitives";

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
        <main id="main" className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 pb-28 pt-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <AppComposer />
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
      <div className="mx-auto grid max-w-6xl gap-2 overflow-hidden px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/home" className="focus-ring grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_28px_rgba(10,10,10,0.08)]" aria-label="Kai home">
            <KaiAvatar size={34} label="Kai" pulse />
          </Link>
          <span className={`hidden size-8 shrink-0 place-items-center rounded-full sm:grid ${lane.tone}`}>
            <ActiveIcon size={16} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">{sectionLabel(pathname)}</p>
            <p className="truncate text-sm font-black text-[#1A1A1F] sm:hidden">Ask Kai.</p>
            <p className="hidden truncate text-sm font-black text-[#1A1A1F] sm:block">Tell Kai what is going on. Kai opens the right tool.</p>
          </div>
        </div>
        <div className="hidden min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 overflow-hidden text-xs font-black sm:grid sm:grid-cols-[1fr_1fr_auto]">
          <span className="min-w-0 truncate rounded-full border border-[#0A0A0A0F] bg-white px-2 py-2 text-center text-[#8A8A8F] sm:px-3">{todayCount} moves</span>
          <span className="min-w-0 truncate rounded-full border border-[#0A0A0A0F] bg-white px-2 py-2 text-center text-[#8A8A8F] sm:px-3">{streak} days in</span>
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
      <AppDock
        chatOpen={chatOpen}
        quickOpen={quickOpen}
        onOpenChat={() => setChatOpen(true)}
        onToggleQuick={() => setQuickOpen((open) => !open)}
      />
    </>
  );
}

function AppDock({
  chatOpen,
  quickOpen,
  onOpenChat,
  onToggleQuick
}: {
  chatOpen: boolean;
  quickOpen: boolean;
  onOpenChat: () => void;
  onToggleQuick: () => void;
}) {
  return (
    <>
      <nav
        className="fixed inset-x-4 bottom-3 z-40 mx-auto grid max-w-sm grid-cols-[1fr_4rem_1fr] gap-1 rounded-[26px] border border-[#0A0A0A0F] bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(10,10,10,0.14)] backdrop-blur-xl"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
        aria-label="Primary app navigation"
      >
        <DockLink to="/home" label="Home" icon={Home} />
        <button
          type="button"
          onClick={onOpenChat}
          className={`focus-ring grid h-14 place-items-center rounded-[21px] bg-[#111116] text-white shadow-sm transition ${chatOpen ? "scale-[0.98]" : "hover:-translate-y-0.5"}`}
          aria-label="Talk to Kai"
          aria-expanded={chatOpen}
        >
          <KaiAvatar size={40} label="Kai companion" pulse />
        </button>
        <button
          type="button"
          onClick={onToggleQuick}
          className={`focus-ring flex h-14 flex-col items-center justify-center rounded-[21px] text-[11px] font-black transition ${
            quickOpen ? "bg-[#111116] text-white" : "text-[#5E5E64] hover:bg-[#F4F1EB] hover:text-[#1A1A1F]"
          }`}
          aria-label="Open Kai tools"
          aria-expanded={quickOpen}
        >
          <Plus size={19} className={quickOpen ? "rotate-45 transition" : "transition"} aria-hidden="true" />
          Tools
        </button>
        <Link to="/crisis" className="focus-ring absolute -top-11 right-0 hidden min-h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-danger shadow-sm sm:inline-flex">
          <ShieldAlert size={14} aria-hidden="true" />
          Crisis
        </Link>
      </nav>
    </>
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
              <p className="text-sm font-black text-[#111116]">Kai</p>
              <p className="text-xs font-semibold text-[#8A8A8F]">Say it straight. We’ll sort it out.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid size-10 place-items-center rounded-full bg-[#F4F1EB] text-[#1A1A1F]" aria-label="Close chat">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <KaiChat embedded />
        <div className="grid grid-cols-2 gap-2 p-2 pt-3">
          <Link to="/mental?module=checkin" onClick={onClose} className="focus-ring rounded-full bg-[#E4F7F4] px-4 py-3 text-center text-sm font-black text-[#218A7D]">
            Mind
          </Link>
          <Link to="/engine/potential" onClick={onClose} className="focus-ring rounded-full bg-goalsWash px-4 py-3 text-center text-sm font-black text-goals">
            Goals
          </Link>
          <Link to="/health?module=food" onClick={onClose} className="focus-ring rounded-full bg-[#FFF0EC] px-4 py-3 text-center text-sm font-black text-[#C86B31] sm:col-span-2">
            Body
          </Link>
        </div>
      </div>
    </div>
  );
}

function GlobalQuickSheet({ onClose }: { onClose: () => void }) {
  const actions = [
    { to: "/mental?module=checkin", label: "Talk it out", icon: Brain, tone: "bg-[#E4F7F4] text-[#218A7D]" },
    { to: "/health?module=food", label: "Log food", icon: Camera, tone: "bg-[#FFF0EC] text-[#C86B31]" },
    { to: "/engine/potential", label: "Move a goal", icon: Target, tone: "bg-goalsWash text-goals" },
    { to: "/loop", label: "Reset today", icon: HeartPulse, tone: "bg-[#EEEAFF] text-[#7B6EF6]" },
    { to: "/health?module=scan", label: "Body scan", icon: Activity, tone: "bg-[#F4F1EB] text-[#1A1A1F]" },
    { to: "/mental?module=reset", label: "Breathe", icon: Sparkles, tone: "bg-[#EEEAFF] text-[#7B6EF6]" },
    { to: "/progress", label: "Your wins", icon: Activity, tone: "bg-[#F4F1EB] text-[#1A1A1F]" },
    { to: "/profile", label: "You", icon: UserRound, tone: "bg-[#F4F1EB] text-[#1A1A1F]" },
    { to: "/settings", label: "Settings", icon: Settings, tone: "bg-[#F4F1EB] text-[#1A1A1F]" }
  ];

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-5" role="dialog" aria-label="Quick actions">
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#0A0A0A0F] bg-white/95 p-3 shadow-[0_18px_60px_rgba(10,10,10,0.18)] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">Kai tools</p>
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
    pathname === "/potential" ||
    pathname === "/goal" ||
    pathname === "/goals" ||
    pathname.startsWith("/goals/") ||
    pathname === "/loop" ||
    pathname === "/progress" ||
    pathname === "/groups" ||
    pathname === "/profile" ||
    pathname === "/settings"
  );
}

function sectionLabel(pathname: string) {
  if (pathname === "/health" || pathname.startsWith("/engine/physical")) return "Body";
  if (pathname === "/mental" || pathname.startsWith("/engine/mental")) return "Mind";
  if (pathname === "/potential" || pathname.startsWith("/engine/potential")) return "Goals";
  if (pathname === "/goal") return "Goal";
  if (pathname === "/goals" || pathname.startsWith("/goals/")) return "Goals";
  if (pathname === "/loop") return "Loop";
  if (pathname === "/progress") return "Progress";
  if (pathname === "/groups") return "Circle";
  if (pathname === "/profile") return "Profile";
  if (pathname === "/settings") return "Settings";
  return "Kai app";
}

function engineFromPath(pathname: string): "physical" | "potential" | "mental" | null {
  if (pathname === "/health") return "physical";
  if (pathname === "/mental") return "mental";
  if (pathname === "/potential") return "potential";
  if (pathname.startsWith("/engine/potential")) return "potential";
  if (pathname.startsWith("/engine/mental")) return "mental";
  if (pathname.startsWith("/engine/physical")) return "physical";
  return null;
}

function laneMeta(engine: "physical" | "potential" | "mental") {
  if (engine === "potential") return { label: "Goals", icon: Target, tone: "bg-goalsWash text-goals" };
  if (engine === "mental") return { label: "Mind", icon: Brain, tone: "bg-resetWash text-reset" };
  return { label: "Body", icon: Activity, tone: "bg-bodyWash text-body" };
}
