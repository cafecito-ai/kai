import { Activity, Brain, GalleryHorizontal, Home, Settings, Shield, Target } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/engine/physical", label: "Body", icon: Activity },
  { to: "/engine/potential", label: "Goals", icon: Target },
  { to: "/engine/mental", label: "Reset", icon: Brain },
  { to: "/progress", label: "Progress", icon: Shield },
  { to: "/design", label: "Design", icon: GalleryHorizontal },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-paper/88 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-black tracking-normal">
          <span className="grid size-9 place-items-center rounded-full bg-ink font-serif text-xl italic text-paper">k</span>
          <span className="font-display text-xl">Kai</span>
        </NavLink>
        <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
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
        </nav>
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 gap-1 rounded-full border border-line bg-white/95 p-1 shadow-soft backdrop-blur md:hidden">
        {links.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            className={({ isActive }) =>
              `focus-ring flex h-12 flex-col items-center justify-center rounded-kai text-[11px] font-bold ${
                isActive ? "bg-ink text-paper" : "text-muted"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
