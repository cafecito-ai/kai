import { Activity, Home, Settings, Shield, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/engine/physical", label: "Body", icon: Activity },
  { to: "/engine/potential", label: "Goals", icon: Sparkles },
  { to: "/progress", label: "Progress", icon: Shield },
  { to: "/settings", label: "Settings", icon: Settings }
];

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="text-lg font-black tracking-normal">
          Kai
        </NavLink>
        <nav className="flex items-center gap-1 overflow-x-auto">
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
    </header>
  );
}
