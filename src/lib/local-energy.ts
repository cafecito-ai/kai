// T-027 — Energy / fatigue check-in helpers.
//
// Energy check-ins live in the same local-score store as everything else
// (source = "energy_check_in"). This file adds two things on top:
//   - submitEnergy(value, note) — append a local input + (best-effort)
//     POST to /api/score/input so it shows up on the home recent feed
//   - detectLowEnergyStreak — pattern check the spec calls for: if energy
//     ≤2 for 2 consecutive days, the Body agent surfaces a recommendation

import { appendLocalInput, readLocalInputs, type LocalInput } from "./local-score";

export type EnergyValue = 1 | 2 | 3 | 4 | 5;

const ENERGY_LABELS: Record<EnergyValue, string> = {
  1: "Wiped",
  2: "Low",
  3: "Okay",
  4: "Steady",
  5: "Sharp",
};

export function energyLabel(v: EnergyValue): string {
  return ENERGY_LABELS[v];
}

/** Append an energy check-in to the local store. Returns the inserted row. */
export function submitLocalEnergy(value: EnergyValue, note?: string): LocalInput {
  return appendLocalInput({
    date: new Date().toISOString().slice(0, 10),
    source: "energy_check_in",
    value: { energy: value, note: note || undefined },
  });
}

/**
 * Returns true if today AND yesterday have at least one energy check-in
 * with value ≤ 2 (the AGENT_PLAN T-027 trigger for a Body agent
 * recovery-focused recommendation).
 */
export function detectLowEnergyStreak(
  inputs: LocalInput[] = readLocalInputs(),
  now: Date = new Date(),
): boolean {
  const today = new Date(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayKey = today.toISOString().slice(0, 10);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  const energyInputs = inputs.filter((i) => i.source === "energy_check_in");
  const todayLow = energyInputs.some(
    (i) =>
      i.date === todayKey &&
      typeof (i.value as { energy?: number })?.energy === "number" &&
      (i.value as { energy: number }).energy <= 2,
  );
  const yesterdayLow = energyInputs.some(
    (i) =>
      i.date === yesterdayKey &&
      typeof (i.value as { energy?: number })?.energy === "number" &&
      (i.value as { energy: number }).energy <= 2,
  );
  return todayLow && yesterdayLow;
}

/**
 * A short, observational Body-agent-shaped recovery suggestion shown
 * after an energy check-in when the low-energy streak fires. Static
 * text per the AGENT_PLAN guardrail ("default frame is 'your body needs
 * something'"); the LLM-generated version of this lives in /chat when
 * the user asks why.
 */
export function lowEnergyRecoveryNote(): string {
  return "Two days low — your body is asking for something. Eat regularly, hydrate, and trade hard training for a walk or mobility today. Tomorrow notice if a real night of sleep changes the read.";
}
