// Tabbar — KAI's primary navigation per CLAUDE_v3_PATCH §5.
//
//   - 4 tabs: Home, Progress, Groups, Profile
//   - Floating glass surface, sits 16px above the bottom edge
//   - Active tab indicator: small filled pill UNDER the icon
//     (NOT a background color change — v3 §5 explicitly forbids that)
//   - Persistent + action button to the right, never auto-hides on scroll
//   - Respects safe-area-inset-bottom for iOS

import {
  Activity,
  Home as HomeIcon,
  Plus,
  User,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/home", label: "Home", icon: HomeIcon },
  { to: "/progress", label: "Progress", icon: Activity },
  { to: "/groups", label: "Groups", icon: Users },
  { to: "/profile", label: "Profile", icon: User },
] as const;

type TabbarProps = {
  onOpenQuickActions: () => void;
};

export function Tabbar({ onOpenQuickActions }: TabbarProps) {
  return (
    <div
      className="
        pointer-events-none
        fixed inset-x-0 bottom-0 z-30
        flex items-end justify-center
        px-4 pb-4
      "
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
      aria-label="Bottom navigation"
    >
      <nav
        className="
          pointer-events-auto
          flex items-center gap-1
          rounded-full
          border border-glass-border
          bg-surface-glass
          px-2 py-1.5
          shadow-glass-lg
          backdrop-blur-glass-lg
        "
        aria-label="Primary navigation"
      >
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `
                focus-ring
                relative
                flex flex-col items-center justify-center
                rounded-full
                h-11 w-12
                transition
                ${
                  isActive
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }
              `
            }
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <Icon size={20} aria-hidden="true" />
                {/* The v3 §5 indicator: small filled pill UNDER the icon */}
                <span
                  aria-hidden="true"
                  className={`
                    mt-1 h-1 rounded-full transition-all duration-200
                    ${
                      isActive
                        ? "w-4 bg-text-primary"
                        : "w-0 bg-transparent"
                    }
                  `}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Persistent + button — opens quick-action sheet per v3 §5 */}
      <button
        type="button"
        onClick={onOpenQuickActions}
        aria-label="Quick actions"
        className="
          pointer-events-auto
          ml-3
          flex h-14 w-14
          items-center justify-center
          rounded-full
          bg-text-primary text-background
          shadow-glass
          transition
          active:scale-95
          focus-ring
        "
      >
        <Plus size={22} aria-hidden="true" />
      </button>
    </div>
  );
}
