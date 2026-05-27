// AppShell — the wrapper rendered around every authenticated route.
//
// Per CLAUDE_v3_PATCH §5: the primary navigation is a floating glass
// Tabbar at the bottom of the screen, with a persistent + button. The v0
// top-of-page Nav header and TodayBar were retired in T-004 — they relied
// on a different IA (three engines, app-path strip) that the v3 patch has
// replaced. Old code remains in src/components/layout/{Nav,Footer}.tsx for
// reference but is no longer rendered.
//
// Immersive routes (`/demo`, `/scope`, `/_design-tokens`, `/crisis`,
// `/onboarding`, sign-in pages) opt out of the chrome and render edge-to-edge.

import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";

import { QuickActionSheet } from "./QuickActionSheet";
import { Tabbar } from "./Tabbar";

// Routes that should render edge-to-edge (no tabbar, no chrome).
// Use prefix matching for routes that have sub-paths.
const IMMERSIVE_PREFIXES = [
  "/_design-tokens",
  "/demo",
  "/scope",
  "/crisis",
  "/onboarding",
  "/welcome",
  "/sign-in",
  "/sign-up",
  "/for-parents",
  "/terms",
  "/privacy",
  // Chat is its own focused surface — own back button, no competing chrome
  "/chat",
  "/check-in",
  "/journal",
  "/sleep",
  "/goals",
  "/workout",
  "/mobility",
  "/energy",
  "/scan",
  "/settings",
  "/voice",
  "/food",
  "/strengths",
  "/badges",
  "/challenges",
];

// Routes that show the tabbar.
const TABBAR_PREFIXES = [
  "/home",
  "/progress",
  "/groups",
  "/profile",
  "/engine",
  "/settings",
  "/check-in",
  "/journal",
  "/workout",
  "/food",
  "/sleep",
];

function matchesAnyPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const immersive = matchesAnyPrefix(pathname, IMMERSIVE_PREFIXES);
  const showTabbar = !immersive && matchesAnyPrefix(pathname, TABBAR_PREFIXES);

  if (immersive) {
    return (
      <div className="min-h-screen bg-background text-text-primary">
        <SkipLink />
        <div id="main">
          <Outlet />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <SkipLink />
      <main
        id="main"
        className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8"
        // Leave generous space for the floating tabbar so trailing content
        // never sits under the chrome. Tabbar + button is ~72px tall and
        // sits 16px from the bottom edge — pad 9rem to leave breathing room.
        style={{
          paddingBottom: showTabbar
            ? "calc(env(safe-area-inset-bottom) + 9rem)"
            : undefined,
        }}
      >
        <Outlet />
      </main>

      {showTabbar ? (
        <>
          <Tabbar onOpenQuickActions={() => setQuickActionsOpen(true)} />
          <QuickActionSheet
            open={quickActionsOpen}
            onClose={() => setQuickActionsOpen(false)}
          />
        </>
      ) : null}
    </div>
  );
}

// WCAG SC 2.4.1 Bypass Blocks: keyboard-only users skip ahead to main.
function SkipLink() {
  return (
    <a
      href="#main"
      className="
        focus-ring
        sr-only
        focus:not-sr-only
        focus:absolute focus:left-3 focus:top-3 focus:z-50
        focus:rounded-md focus:bg-text-primary focus:px-4 focus:py-2
        focus:text-sm focus:font-medium focus:text-background
      "
    >
      Skip to content
    </a>
  );
}
