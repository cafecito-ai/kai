import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 pb-24 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pb-6 lg:px-8">
        <p>Kai is wellness coaching, not therapy or medical care.</p>
        <div className="flex flex-wrap gap-4 font-semibold">
          <Link to="/crisis" className="text-danger">
            Crisis resources
          </Link>
          <Link to="/for-parents">For parents</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}
