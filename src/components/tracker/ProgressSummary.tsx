import { Activity, Award, Brain, Flame } from "lucide-react";
import { eventDisplayName, engineTotals, lastNDays } from "../../lib/tracker";
import { useProgressStore } from "../../stores/progressStore";
import { EvolvingCharacter } from "./EvolvingCharacter";

export function ProgressSummary() {
  const level = useProgressStore((state) => state.level());
  const streak = useProgressStore((state) => state.streak());
  const belt = useProgressStore((state) => state.belt());
  const events = useProgressStore((state) => state.events);
  const totals = engineTotals(events);
  const days = lastNDays(events, 14);
  const maxDay = Math.max(...days.map((day) => day.value), 1);

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_1fr]">
        <div className="app-panel flex items-center gap-4 p-4">
          <EvolvingCharacter level={level} />
          <div>
            <p className="eyebrow">Character level</p>
            <p className="mt-1 font-display text-2xl font-black capitalize tracking-normal">{level}</p>
          </div>
        </div>
        <Metric icon={<Flame />} label="Current streak" value={`${streak} days`} />
        <Metric icon={<Award />} label="Belt" value={belt} />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="app-panel p-4">
          <div className="mb-2 flex items-center justify-between text-sm font-semibold">
            <span>Growth chart</span>
            <span className="text-muted">{events.length} events</span>
          </div>
          {events.length === 0 ? (
            <div className="grid min-h-32 place-items-center rounded-kai border border-line bg-paper p-4 text-center text-sm font-semibold leading-6 text-muted">
              Complete one Mental or Physical action to start the chart.
            </div>
          ) : (
            <div className="flex h-32 items-end gap-2 rounded-kai border border-line bg-paper p-3">
              {days.map((day) => (
                <div key={day.day} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className="min-h-1 rounded-t-full bg-ink transition-all"
                    style={{ height: `${Math.max(4, (day.value / maxDay) * 100)}%` }}
                    title={`${day.day}: ${day.value} pts`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="app-panel p-4">
          <p className="eyebrow">engine balance</p>
          <div className="mt-3 space-y-2">
            <EngineTotal icon={<Activity />} label="Body" value={totals.physical} tone="text-sage" />
            <EngineTotal icon={<Brain />} label="Mental" value={totals.mental + totals.potential} tone="text-coral" />
          </div>
        </div>
      </div>

      <div className="app-panel p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">recent activity</p>
            <h2 className="mt-1 font-display text-2xl font-black tracking-normal">What counted</h2>
          </div>
          <span className="rounded-full bg-paper px-3 py-1 text-xs font-black text-muted">{events.length} total</span>
        </div>
        <div className="space-y-2">
          {events.length === 0 && <p className="rounded-kai border border-line bg-paper p-3 text-sm text-muted">No saved progress yet.</p>}
          {events.slice(0, 8).map((event) => (
            <div key={event.id} className="flex items-center justify-between gap-3 rounded-kai border border-line bg-paper p-3">
              <div>
                <p className="text-sm font-black capitalize">{eventDisplayName(event)}</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{new Date(event.occurredAt).toLocaleDateString()}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-ink">{event.eventValue} pts</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="app-panel p-4">
      <div className="mb-3 text-plum">{icon}</div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-display text-2xl font-black capitalize tracking-normal">{value}</p>
    </div>
  );
}

function EngineTotal({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-kai border border-line bg-paper p-3">
      <div className={`flex items-center gap-2 text-sm font-black ${tone}`}>
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-black text-ink">{value}</span>
    </div>
  );
}
