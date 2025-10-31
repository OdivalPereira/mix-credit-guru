import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { NcmRule, Receita } from "@/types/domain";

interface EffectiveRule extends NcmRule {
  validFrom: string;
  validTo?: string;
}

interface AppStore {
  scenario: string;
  /** Rules for the currently selected scenario */
  regras: EffectiveRule[];
  /** All scenario rules keyed by scenario name */
  scenarios: Record<string, EffectiveRule[]>;
  receitas: Receita[];
  setScenario: (scenario: string) => void;
  setRegras: (regras: EffectiveRule[]) => void;
  setReceitas: (receitas: Receita[]) => void;
  addRegra: (regra: EffectiveRule) => void;
  updateRegra: (
    ncm: string,
    validFrom: string,
    data: Partial<EffectiveRule>
  ) => void;
  removeRegra: (ncm: string, validFrom: string) => void;
  addReceita: (receita: Receita) => void;
  updateReceita: (codigo: string, data: Partial<Receita>) => void;
  removeReceita: (codigo: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      scenario: "default",
    (set) => ({
      scenario: "transicao",
      regras: [],
      scenarios: { default: [] },
      receitas: [],
      setScenario: (scenario) =>
        set((state) => ({
          scenario,
          regras: state.scenarios[scenario] ?? [],
        })),
      setRegras: (regras) =>
        set((state) => ({
          regras,
          scenarios: { ...state.scenarios, [state.scenario]: regras },
        })),
      setReceitas: (receitas) => set({ receitas }),
      addRegra: (regra) =>
        set((state) => {
          const regras = [...state.regras, regra];
          return {
            regras,
            scenarios: { ...state.scenarios, [state.scenario]: regras },
          };
        }),
      updateRegra: (ncm, validFrom, data) =>
        set((state) => {
          const regras = state.regras.map((r) =>
            r.ncm === ncm && r.validFrom === validFrom ? { ...r, ...data } : r
          );
          return {
            regras,
            scenarios: { ...state.scenarios, [state.scenario]: regras },
          };
        }),
      removeRegra: (ncm, validFrom) =>
        set((state) => {
          const regras = state.regras.filter(
            (r) => !(r.ncm === ncm && r.validFrom === validFrom)
          );
          return {
            regras,
            scenarios: { ...state.scenarios, [state.scenario]: regras },
          };
        }),
      addReceita: (receita) =>
        set((state) => ({ receitas: [...state.receitas, receita] })),
      updateReceita: (codigo, data) =>
        set((state) => ({
          receitas: state.receitas.map((r) =>
            r.codigo === codigo ? { ...r, ...data } : r
          ),
        })),
      removeReceita: (codigo) =>
        set((state) => ({
          receitas: state.receitas.filter((r) => r.codigo !== codigo),
        })),
    }),
    {
      name: "cmx_v04_app",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
