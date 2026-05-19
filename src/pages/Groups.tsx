// Groups — placeholder page. The real implementation lands in Phase G
// (T-036–T-040). For T-004 this just needs to render so the tabbar's
// Groups tab has somewhere to go.

import { Users } from "lucide-react";

export function Groups() {
  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft">
        <Users size={24} className="text-accent" />
      </div>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
        Groups
      </h1>
      <p className="mt-3 text-text-secondary">
        Create a group and invite people you actually trust.
      </p>
      <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
        Coming in Phase G
      </p>
    </div>
  );
}
