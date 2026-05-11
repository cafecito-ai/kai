import { Link } from "react-router-dom";

export function DisclosureBanner() {
  return (
    <div className="rounded-kai border border-danger/20 bg-danger/5 p-4 text-sm">
      Kai is not therapy, medical care, or a crisis service. If something feels immediately unsafe, use{" "}
      <Link to="/crisis" className="font-bold text-danger">
        crisis resources
      </Link>
      .
    </div>
  );
}
