import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

export function AppShell() {
  return (
    <div className="noise min-h-screen bg-paper text-ink">
      {/* WCAG SC 2.4.1 Bypass Blocks: keyboard-only users skip the nav. */}
      <a
        href="#main"
        className="focus-ring sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-kai focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-paper"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
