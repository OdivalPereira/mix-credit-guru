import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { NcmRule, Receita } from "@/types/domain";

interface AppStore {
  scenario: string;
  regras: NcmRule[];
  receitas: Receita[];
  setScenario: (scenario: string) => void;
  setRegras: (regras: NcmRule[]) => void;
  setReceitas: (receitas: Receita[]) => void;
  addRegra: (regra: NcmRule) => void;
  updateRegra: (ncm: string, data: Partial<NcmRule>) => void;
  removeRegra: (ncm: string) => void;
  addReceita: (receita: Receita) => void;
  updateReceita: (codigo: string, data: Partial<Receita>) => void;
  removeReceita: (codigo: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      scenario: "transicao",
      regras: [],
      receitas: [],
      setScenario: (scenario) => set({ scenario }),
      setRegras: (regras) => set({ regras }),
      setReceitas: (receitas) => set({ receitas }),
      addRegra: (regra) =>
        set((state) => ({ regras: [...state.regras, regra] })),
      updateRegra: (ncm, data) =>
        set((state) => ({
          regras: state.regras.map((r) =>
            r.ncm === ncm ? { ...r, ...data } : r
          ),
        })),
      removeRegra: (ncm) =>
        set((state) => ({
          regras: state.regras.filter((r) => r.ncm !== ncm),
        })),
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
      name: "cmx_v03_app",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
