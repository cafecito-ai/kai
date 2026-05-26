import { Camera, Home, MessageCircle, Moon, Plus, ShieldAlert, Sparkles, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { KaiChat } from "../kai/KaiChat";
import { useProgressStore } from "../../stores/progressStore";
import { useUserStore } from "../../stores/userStore";
import { KaiAvatar } from "../ui/AppPrimitives";
import { Footer } from "./Footer";

export function AppShell() {
  const { pathname } = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
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
      <div className="min-h-screen bg-paper text-inkDark">
        <a
          href="#main"
          className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-kai focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-paper"
        >
          Skip to content
        </a>
        <AppContextBar onTalk={() => setChatOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <AppComposer
          chatOpen={chatOpen}
          quickOpen={quickOpen}
          onOpenChat={() => setChatOpen(true)}
          onCloseChat={() => setChatOpen(false)}
          onToggleQuick={() => setQuickOpen((open) => !open)}
          onCloseQuick={() => setQuickOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper text-inkDark">
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

function AppContextBar({ onTalk }: { onTalk: () => void }) {
  const { kaiName } = useUserStore();
  const events = useProgressStore((state) => state.events);
  const streak = useProgressStore((state) => state.streak());
  const todayCount = events.filter((event) => event.occurredAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;

  return (
    <aside className="sticky top-0 z-30 border-b border-[#0A0A0A0F] bg-paper/88 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-2 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/home" className="focus-ring grid size-9 shrink-0 place-items-center rounded-full bg-white shadow-[0_8px_28px_rgba(10,10,10,0.08)]" aria-label={`${kaiName} home`}>
            <KaiAvatar size={34} label={kaiName} pulse />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.26em] text-inkMute">Kai</p>
            <p className="truncate text-sm font-black text-inkDark">{kaiName} is here.</p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 text-xs font-black sm:grid-cols-[1fr_1fr_auto_auto]">
          <span className="min-w-0 truncate rounded-full border border-[#0A0A0A0F] bg-white px-2 py-2 text-center text-inkMute sm:px-3">{todayCount} reps</span>
          <span className="min-w-0 truncate rounded-full border border-[#0A0A0A0F] bg-white px-2 py-2 text-center text-inkMute sm:px-3">{streak} day streak</span>
          {/* Spec §1 + §7 Level 3: always-on crisis access. Must be visible on mobile. */}
          <Link
            to="/crisis"
            aria-label="Crisis resources"
            className="focus-ring inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-danger/30 bg-white px-3 text-danger"
          >
            <ShieldAlert size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Crisis</span>
          </Link>
          <button type="button" onClick={onTalk} className="focus-ring hidden items-center gap-2 rounded-full bg-inkDark px-4 py-2 text-white sm:inline-flex">
            <KaiAvatar size={22} label={kaiName} />
            Talk to {kaiName}
          </button>
        </div>
      </div>
    </aside>
  );
}

function AppComposer({
  chatOpen,
  quickOpen,
  onOpenChat,
  onCloseChat,
  onToggleQuick,
  onCloseQuick
}: {
  chatOpen: boolean;
  quickOpen: boolean;
  onOpenChat: () => void;
  onCloseChat: () => void;
  onToggleQuick: () => void;
  onCloseQuick: () => void;
}) {
  const kaiName = useUserStore((state) => state.kaiName);

  return (
    <>
      {chatOpen && <GlobalChatSheet onClose={onCloseChat} />}
      {quickOpen && <GlobalQuickSheet onClose={onCloseQuick} onTalk={onOpenChat} />}
      <button
        type="button"
        onClick={onOpenChat}
        className="focus-ring fixed bottom-5 left-5 z-40 grid size-10 place-items-center rounded-full bg-white shadow-[0_12px_40px_rgba(10,10,10,0.14)] sm:bottom-6 sm:left-[calc(50%-18rem)]"
        aria-label={`Talk to ${kaiName}`}
      >
        <KaiAvatar size={34} label={`${kaiName} companion`} pulse />
      </button>
      <AppDock quickOpen={quickOpen} onToggleQuick={onToggleQuick} />
    </>
  );
}

function AppDock({ quickOpen, onToggleQuick }: { quickOpen: boolean; onToggleQuick: () => void }) {
  // Kai-only shell: dock stays Home + Profile with the center "+"
  // surfacing Kai-launchable tools. Engine pages remain reachable by
  // URL and by tool suggestions, but they are not named in navigation.
  const links = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/profile", label: "Profile", icon: UserRound }
  ];

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_3.25rem_minmax(0,1fr)] gap-1 rounded-[24px] border border-[#0A0A0A0F] bg-white/95 p-1 shadow-[0_12px_40px_rgba(10,10,10,0.14)] backdrop-blur-xl"
      style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary app navigation"
    >
      <DockLink {...links[0]} icon={links[0].icon} />
      <button
        type="button"
        onClick={onToggleQuick}
        className="focus-ring flex h-12 items-center justify-center rounded-[19px] bg-inkDark text-white shadow-sm"
        aria-label="Quick app actions"
        aria-expanded={quickOpen}
      >
        <Plus size={24} className={quickOpen ? "rotate-45 transition" : "transition"} aria-hidden="true" />
      </button>
      <DockLink {...links[1]} icon={links[1].icon} />
    </nav>
  );
}

function DockLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `focus-ring flex h-12 flex-col items-center justify-center rounded-[18px] text-[10px] font-bold transition ${
          isActive ? "bg-inkDark text-white" : "text-inkSoft hover:bg-warmPaper hover:text-inkDark"
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
  const kaiName = useUserStore((state) => state.kaiName);
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-inkDeep/24 px-3 pb-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Chat with ${kaiName}`}>
      <div className="mx-auto w-full max-w-md rounded-[28px] bg-white p-2 shadow-[0_28px_80px_rgba(10,10,10,0.28)]">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <KaiAvatar size={34} label={kaiName} pulse />
            <div>
              <p className="text-sm font-black text-inkDeep">{kaiName}</p>
              <p className="text-xs font-semibold text-inkMute">One companion across the whole app</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="focus-ring grid size-10 place-items-center rounded-full bg-warmPaper text-inkDark" aria-label="Close chat">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <KaiChat embedded />
      </div>
    </div>
  );
}

function GlobalQuickSheet({ onClose, onTalk }: { onClose: () => void; onTalk: () => void }) {
  const kaiName = useUserStore((state) => state.kaiName);
  const actions = [
    { to: "/health?module=food", label: "Log a meal", icon: Camera, tone: "bg-[#FFF0EC] text-[#C86B31]" },
    { to: "/mental?module=reset", label: "Take a breath", icon: Sparkles, tone: "bg-[#EEEAFF] text-[#7B6EF6]" },
    { to: "/health?module=sleep", label: "Log sleep", icon: Moon, tone: "bg-warmPaper text-inkDark" }
  ];

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 px-5" role="dialog" aria-label="Quick actions">
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#0A0A0A0F] bg-white/95 p-3 shadow-[0_18px_60px_rgba(10,10,10,0.18)] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.26em] text-inkMute">Quick rep</p>
          <button type="button" onClick={onClose} className="focus-ring grid size-8 place-items-center rounded-full bg-warmPaper text-inkDark" aria-label="Close quick actions">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onTalk();
            }}
            className="focus-ring flex min-h-14 items-center gap-3 rounded-[18px] bg-paper px-3 text-left text-sm font-black text-inkDark"
          >
            <span className="grid size-9 place-items-center rounded-full bg-white text-inkDark">
              <MessageCircle size={17} aria-hidden="true" />
            </span>
            Talk to {kaiName}
          </button>
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.to} onClick={onClose} className="focus-ring flex min-h-14 items-center gap-3 rounded-[18px] bg-paper px-3 text-left text-sm font-black text-inkDark">
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
    pathname === "/missions" ||
    pathname === "/settings"
  );
}
