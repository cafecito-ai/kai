export function LoopSkeleton() {
  return (
    <div className="grid gap-3" aria-label="Loading today’s loop">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-[24px] border border-line bg-white/70" />
      ))}
    </div>
  );
}
