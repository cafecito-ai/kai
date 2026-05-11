import { create } from "zustand";
import type { EngineId, KaiTone } from "../lib/types";

interface UserState {
  kaiName: string;
  kaiTone: KaiTone;
  primaryEngine: EngineId;
  setKai: (kaiName: string, kaiTone: KaiTone) => void;
  setPrimaryEngine: (engine: EngineId) => void;
}

export const useUserStore = create<UserState>((set) => ({
  kaiName: "Kai",
  kaiTone: "balanced",
  primaryEngine: "physical",
  setKai: (kaiName, kaiTone) => set({ kaiName, kaiTone }),
  setPrimaryEngine: (primaryEngine) => set({ primaryEngine })
}));
