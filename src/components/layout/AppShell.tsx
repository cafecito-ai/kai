import { Activity, MessageCircle, Plus, Settings, ShieldAlert, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { KAI_ACTIONS, type KaiAction } from "../../lib/kai-actions";
import { useKaiStore } from "../../stores/kaiStore";
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

  return (
    <aside className="sticky top-0 z-30 border-b border-[#0A0A0A0F] bg-[#FAFAF7]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 overflow-hidden px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/home" className="focus-ring grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_28px_rgba(10,10,10,0.08)]" aria-label="Kai home">
            <KaiAvatar size={34} label="Kai" pulse />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">{sectionLabel(pathname)}</p>
            <p className="truncate text-sm font-black text-[#1A1A1F]">KAI</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AppComposer() {
  const [quickOpen, setQuickOpen] = useState(false);

  return (
    <>
      {quickOpen && <GlobalQuickSheet onClose={() => setQuickOpen(false)} />}
      <AppDock
        quickOpen={quickOpen}
        onToggleQuick={() => setQuickOpen((open) => !open)}
      />
    </>
  );
}

function AppDock({
  quickOpen,
  onToggleQuick
}: {
  quickOpen: boolean;
  onToggleQuick: () => void;
}) {
  return (
    <>
      <nav
        className="fixed inset-x-4 bottom-3 z-40 mx-auto grid max-w-sm grid-cols-[1fr_4rem_1fr] gap-1 rounded-[26px] border border-[#0A0A0A0F] bg-white/95 p-1.5 shadow-[0_12px_40px_rgba(10,10,10,0.14)] backdrop-blur-xl"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
        aria-label="Primary app navigation"
      >
        <DockLink to="/home" label="Home" icon={MessageCircle} />
        <button
          type="button"
          onClick={onToggleQuick}
          className={`focus-ring grid h-14 place-items-center rounded-[21px] text-white shadow-sm transition ${
            quickOpen ? "scale-[0.98] bg-[#2B2B31]" : "bg-[#111116] hover:-translate-y-0.5"
          }`}
          aria-label="Open KAI tasks"
          aria-expanded={quickOpen}
        >
          <Plus size={24} className={quickOpen ? "rotate-45 transition" : "transition"} aria-hidden="true" />
        </button>
        <DockLink to="/profile" label="Profile" icon={UserRound} />
        <Link to="/crisis" className="focus-ring absolute -top-11 right-0 hidden min-h-9 items-center gap-2 rounded-full bg-white px-3 text-xs font-black text-danger shadow-sm sm:inline-flex">
          <ShieldAlert size={14} aria-hidden="true" />
          Crisis
        </Link>
      </nav>
    </>
  );
}

function DockLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof MessageCircle }) {
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
      <span>{label}</span>
    </NavLink>
  );
}

function GlobalQuickSheet({ onClose }: { onClose: () => void }) {
  const nextAction = useKaiStore((state) => state.chats.kai.nextAction);
  const recommended = nextAction ?? KAI_ACTIONS.talk;
  const bodyActions = [KAI_ACTIONS.food, KAI_ACTIONS.sleep, KAI_ACTIONS.stretch, KAI_ACTIONS.scan];
  const mindActions = [KAI_ACTIONS.talk, KAI_ACTIONS.confidence, KAI_ACTIONS.social, KAI_ACTIONS.screen, KAI_ACTIONS.reset, KAI_ACTIONS.goal];
  const accountActions = [
    { id: "wins", route: "/progress", label: "Your wins", icon: Activity, tone: "bg-[#F4F1EB] text-[#1A1A1F]" },
    { id: "you", route: "/profile", label: "You", icon: UserRound, tone: "bg-[#F4F1EB] text-[#1A1A1F]" },
    { id: "settings", route: "/settings", label: "Settings", icon: Settings, tone: "bg-[#F4F1EB] text-[#1A1A1F]" }
  ];

  return (
    <div className="fixed inset-x-0 bottom-28 z-40 px-4" role="dialog" aria-label="Quick actions">
      <div className="mx-auto max-h-[calc(100svh-9rem)] w-full max-w-md overflow-y-auto rounded-[28px] border border-[#0A0A0A0F] bg-white/95 p-3 shadow-[0_18px_60px_rgba(10,10,10,0.18)] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between px-1">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-[#8A8A8F]">Log a move</p>
            <p className="mt-1 text-sm font-black text-[#111116]">Pick the task that helps today.</p>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid size-8 place-items-center rounded-full bg-[#F4F1EB] text-[#1A1A1F]" aria-label="Close quick actions">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <KaiActionLink action={recommended} onClose={onClose} variant="primary" eyebrow="Recommended" />
        <ActionGroup title="Body" actions={bodyActions.filter((action) => action.id !== recommended.id)} onClose={onClose} />
        <ActionGroup title="Mind + goals" actions={mindActions.filter((action) => action.id !== recommended.id)} onClose={onClose} />
        <div className="mt-3 border-t border-[#0A0A0A0F] pt-3">
          <p className="px-2 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-[#8A8A8F]">Progress</p>
          <div className="grid grid-cols-3 gap-2">
            {accountActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.id} to={action.route} onClick={onClose} className="focus-ring grid min-h-16 place-items-center rounded-[18px] bg-[#FAFAF7] px-2 text-center text-xs font-black text-[#1A1A1F]">
                  <span className={`grid size-8 place-items-center rounded-full ${action.tone}`}>
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionGroup({ title, actions, onClose }: { title: string; actions: KaiAction[]; onClose: () => void }) {
  if (actions.length === 0) return null;
  return (
    <section className="mt-3">
      <p className="px-1 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-[#8A8A8F]">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <KaiActionLink key={action.id} action={action} onClose={onClose} />
        ))}
      </div>
    </section>
  );
}

function KaiActionLink({
  action,
  onClose,
  variant = "secondary",
  eyebrow
}: {
  action: KaiAction;
  onClose: () => void;
  variant?: "primary" | "secondary";
  eyebrow?: string;
}) {
  const Icon = action.icon;
  if (variant === "primary") {
    return (
      <Link to={action.route} onClick={onClose} data-kai-action={action.id} className="focus-ring mt-2 flex min-h-[4.75rem] items-start gap-3 rounded-[22px] bg-[#111116] px-3 py-3 text-left text-white shadow-sm transition hover:-translate-y-0.5">
        <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${action.tone}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
        <span className="min-w-0">
          {eyebrow && <span className="block text-[10px] font-black uppercase tracking-wider text-white/40">{eyebrow}</span>}
          <span className="mt-1 block text-[15px] font-black leading-tight text-white">{action.label}</span>
          <span className="mt-1 block text-sm font-semibold leading-5 text-white/64">{action.reason}</span>
        </span>
      </Link>
    );
  }
  return (
    <Link to={action.route} onClick={onClose} data-kai-action={action.id} title={action.reason} className="focus-ring grid min-h-[4.35rem] min-w-0 content-between rounded-[18px] bg-[#FAFAF7] px-3 py-2.5 text-left text-sm font-black text-[#1A1A1F]">
      <span className={`grid size-8 place-items-center rounded-full ${action.tone}`}>
        <Icon size={16} aria-hidden="true" />
      </span>
      <span className="mt-1.5 block min-w-0 break-words text-[13px] leading-tight">{action.label}</span>
    </Link>
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
    pathname.startsWith("/task/") ||
    pathname === "/walkthrough" ||
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
  if (pathname.startsWith("/task/")) return "Task";
  if (pathname === "/walkthrough") return "Tour";
  if (pathname === "/progress") return "Progress";
  if (pathname === "/groups") return "Circle";
  if (pathname === "/profile") return "Profile";
  if (pathname === "/settings") return "Settings";
  return "Kai app";
}
