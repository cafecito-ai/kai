import { Award, Flame, Sprout } from "lucide-react";
import { useProgressStore } from "../../stores/progressStore";

export function ProgressSummary() {
  const level = useProgressStore((state) => state.level());
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());
  const events = useProgressStore((state) => state.events);

  return (
    <section className="grid gap-3 sm:grid-cols-3">
      <Metric icon={<Sprout />} label="Character level" value={String(level)} />
      <Metric icon={<Flame />} label="Current streak" value={`${streak} days`} />
      <Metric icon={<Award />} label="Belt" value={belt} />
      <div className="sm:col-span-3 rounded-kai border border-ink/10 bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span>Growth chart</span>
          <span>{events.length} events</span>
        </div>
        <div className="flex h-28 items-end gap-2">
          {Array.from({ length: 14 }).map((_, index) => {
            const value = events[index % Math.max(events.length, 1)]?.eventValue ?? 8 + index * 3;
            return <div key={index} className="flex-1 rounded-t bg-sage" style={{ height: `${Math.min(100, value)}%` }} />;
          })}
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-kai border border-ink/10 bg-white p-4">
      <div className="mb-3 text-sage">{icon}</div>
      <p className="text-sm text-ink/60">{label}</p>
      <p className="text-2xl font-black capitalize">{value}</p>
    </div>
  );
}
