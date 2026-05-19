import { Activity, Brain, HeartPulse, Home, Settings, ShieldAlert } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { KaiMark } from "../ui/AppPrimitives";

const links = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/engine/physical", label: "Body", icon: Activity },
  { to: "/engine/mental", label: "Mind", icon: Brain },
  { to: "/progress", label: "Progress", icon: HeartPulse },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function Nav() {
  const { pathname } = useLocation();
  const appRoute = pathname.startsWith("/engine") || pathname === "/home" || pathname === "/progress" || pathname === "/settings";

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/88 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-black tracking-normal" aria-label="Kai home">
            <KaiMark size="sm" />
            <span className="font-display text-xl">Kai</span>
          </NavLink>
          <nav className="hidden items-center gap-1 overflow-x-auto md:flex" aria-label="Main navigation">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `focus-ring inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${
                    isActive ? "bg-ink text-paper" : "text-muted hover:bg-white hover:text-ink"
                  }`
                }
              >
                <Icon size={17} />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
            <NavLink
              to="/crisis"
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-danger transition hover:bg-dangerWash"
            >
              <ShieldAlert size={17} />
              Crisis
            </NavLink>
          </nav>
        </div>
      </header>
      {appRoute && (
        <nav
          className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 gap-1 rounded-[24px] border border-line bg-white/95 p-1 shadow-soft backdrop-blur md:hidden"
          style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
          aria-label="Primary mobile navigation"
        >
          {links.slice(0, 5).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              className={({ isActive }) =>
                `focus-ring flex h-12 flex-col items-center justify-center rounded-[18px] text-[11px] font-bold ${
                  isActive ? "bg-ink text-paper" : "text-muted hover:bg-paper"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
