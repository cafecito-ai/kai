export function GoalNextAction({ action }: { action?: string | null }) {
  return (
    <div className="rounded-[18px] border border-line bg-paper p-4">
      <p className="text-xs font-black uppercase tracking-wider text-muted">Next tiny action</p>
      <p className="mt-2 text-base font-black leading-6 text-ink">{action?.trim() || "Do one tiny version of this for 10 minutes."}</p>
    </div>
  );
}
