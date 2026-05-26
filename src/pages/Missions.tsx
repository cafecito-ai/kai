import { Archive, Brain, HeartPulse, Sparkles, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppHero, AppPage, AppSurface } from "../components/ui/AppPrimitives";
import { Button } from "../components/ui/Button";
import { api } from "../lib/api";
import { MISSION_PILLARS, type MissionPillar } from "../lib/missions";
import type { Mission } from "../lib/types";
import { useUserStore } from "../stores/userStore";

const ICONS = {
  body: HeartPulse,
  mind: Brain,
  purpose: Sparkles,
  people: UsersRound
};

const STARTERS: Record<MissionPillar, string> = {
  body: "I am building a body that feels steady enough for my real life.",
  mind: "I am learning how to notice what I feel without getting swallowed by it.",
  purpose: "I am building the version of me that is actually mine.",
  people: "I am practicing relationships that feel honest, kind, and not performative."
};

export function Missions() {
  const kaiName = useUserStore((state) => state.kaiName);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [drafts, setDrafts] = useState<Record<MissionPillar, string>>({
    body: STARTERS.body,
    mind: STARTERS.mind,
    purpose: STARTERS.purpose,
    people: STARTERS.people
  });
  const [saving, setSaving] = useState<MissionPillar | null>(null);

  useEffect(() => {
    void api.getMissions().then((result) => setMissions(result.missions)).catch(() => undefined);
  }, []);

  const activeByPillar = useMemo(() => {
    const map = new Map<MissionPillar, Mission>();
    for (const mission of missions) {
      if (mission.status === "active") map.set(mission.pillar, mission);
    }
    return map;
  }, [missions]);

  async function saveMission(pillar: MissionPillar) {
    const statement = drafts[pillar].trim();
    if (!statement) return;
    setSaving(pillar);
    try {
      const result = await api.createMission({ pillar, statement });
      setMissions((items) => [result.mission, ...items.map((item) => (item.pillar === pillar && item.status === "active" ? { ...item, status: "archived" as const } : item))]);
    } finally {
      setSaving(null);
    }
  }

  async function archiveMission(mission: Mission) {
    setMissions((items) => items.map((item) => (item.id === mission.id ? { ...item, status: "archived" } : item)));
    await api.deleteMission(mission.id).catch(() => undefined);
  }

  return (
    <AppPage className="max-w-5xl">
      <AppHero eyebrow="missions" title="The long game, in your words.">
        Missions are the identity tracks {kaiName} can coach against over time. They stay separate from today's score.
      </AppHero>

      <div className="grid gap-4 lg:grid-cols-2">
        {MISSION_PILLARS.map((pillar) => {
          const Icon = ICONS[pillar.id];
          const active = activeByPillar.get(pillar.id);
          return (
            <AppSurface key={pillar.id} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink shadow-sm">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="eyebrow">{pillar.label}</p>
                  <h2 className="mt-1 font-display text-2xl font-black tracking-normal">{active ? "Active mission" : "Draft mission"}</h2>
                </div>
              </div>
              {active ? (
                <div className="mt-4">
                  <p className="rounded-kai border border-line bg-paper p-4 text-sm font-semibold leading-6 text-ink">{active.statement}</p>
                  <Button className="mt-3" variant="secondary" onClick={() => void archiveMission(active)}>
                    <Archive size={16} aria-hidden="true" />
                    Archive
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
                  <textarea
                    className="field min-h-28"
                    value={drafts[pillar.id]}
                    onChange={(event) => setDrafts((state) => ({ ...state, [pillar.id]: event.target.value }))}
                  />
                  <Button className="mt-3" onClick={() => void saveMission(pillar.id)} disabled={saving === pillar.id || !drafts[pillar.id].trim()}>
                    {saving === pillar.id ? "Saving" : "Save mission"}
                  </Button>
                </div>
              )}
            </AppSurface>
          );
        })}
      </div>
    </AppPage>
  );
}
