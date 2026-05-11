import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

export function AppShell() {
  return (
    <div className="noise min-h-screen bg-paper text-ink">
      <Nav />
      <main className="mx-auto w-full max-w-6xl px-3 pb-24 pt-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
