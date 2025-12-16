import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DestinoTipo, SupplierRegime } from "@/types/domain";

export interface ConfigStore {
  defaultUf: string;
  defaultRegime: SupplierRegime | "";
  defaultDestino: DestinoTipo | "";
  globalCompanyRegime: SupplierRegime | ""; // Regime da Empresa (Usuário)
  autoCalculate: boolean;
  showTooltips: boolean;
  setConfig: (config: Partial<Omit<ConfigStore, "setConfig" | "resetDefaults">>) => void;
  resetDefaults: () => void;
}

const defaultConfig = {
  defaultUf: "",
  defaultRegime: "" as SupplierRegime | "",
  defaultDestino: "" as DestinoTipo | "",
  globalCompanyRegime: "normal" as SupplierRegime, // Default to Normal
  autoCalculate: true,
  showTooltips: true,
};

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      ...defaultConfig,
      setConfig: (config) => set((state) => ({ ...state, ...config })),
      resetDefaults: () => set(defaultConfig),
    }),
    {
      name: "mix-credit-guru-config",
      version: 1,
    }
  )
);
