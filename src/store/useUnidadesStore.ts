import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Unit, UnitConv, YieldConfig } from "@/types/domain";

const defaultConversoes: UnitConv[] = [
  { de: "kg", para: "g", fator: 1000 },
  { de: "l", para: "ml", fator: 1000 },
];

const defaultYields: YieldConfig[] = [
  { entrada: "kg", saida: "un", rendimento: 1 },
];

interface UnidadesStore {
  conversoes: UnitConv[];
  yields: YieldConfig[];
  updateConversoes: (updater: (prev: UnitConv[]) => UnitConv[]) => void;
  updateYields: (updater: (prev: YieldConfig[]) => YieldConfig[]) => void;
  reset: () => void;
  findYield: (entrada: Unit, saida: Unit) => YieldConfig | undefined;
}

export const useUnidadesStore = create<UnidadesStore>()(
  persist(
    (set, get) => ({
      conversoes: defaultConversoes,
      yields: defaultYields,
      updateConversoes: (updater) =>
        set((state) => ({ conversoes: updater(state.conversoes) })),
      updateYields: (updater) =>
        set((state) => ({ yields: updater(state.yields) })),
      reset: () =>
        set({
          conversoes: defaultConversoes,
          yields: defaultYields,
        }),
      findYield: (entrada, saida) =>
        get().yields.find(
          (item) => item.entrada === entrada && item.saida === saida,
        ),
    }),
    {
      name: "cmx_v03_unidades",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
