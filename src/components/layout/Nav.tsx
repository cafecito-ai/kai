import { Activity, GalleryHorizontal, Home, MessageCircle, Settings, Shield, Target } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/engine/physical", label: "Body", icon: Activity },
  { to: "/engine/potential", label: "Goals", icon: Target },
  { to: "/progress", label: "Progress", icon: Shield },
  { to: "/design", label: "Design", icon: GalleryHorizontal },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-black tracking-normal">
          <span className="grid size-9 place-items-center rounded-kai bg-ink text-paper">kai</span>
          <span>Kai</span>
        </NavLink>
        <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `focus-ring inline-flex h-10 items-center gap-2 rounded-kai px-3 text-sm font-semibold ${
                  isActive ? "bg-ink text-paper" : "text-ink/75 hover:bg-white"
                }`
              }
            >
              <Icon size={17} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-5 gap-1 rounded-kai border border-ink/10 bg-white/95 p-1 shadow-soft backdrop-blur md:hidden">
        {[{ to: "/home", label: "Home", icon: Home }, { to: "/home", label: "Kai", icon: MessageCircle }, ...links.slice(1, 4)].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={`${to}-${label}`}
            to={to}
            className={({ isActive }) =>
              `focus-ring flex h-12 flex-col items-center justify-center rounded-kai text-[11px] font-bold ${
                isActive ? "bg-ink text-paper" : "text-ink/70"
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
