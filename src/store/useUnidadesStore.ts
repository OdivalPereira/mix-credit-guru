import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { Unit, UnitConv, YieldConfig } from "@/types/domain";

const defaultConversoes: UnitConv[] = [
  { de: "kg", para: "g", fator: 1000 },
  { de: "l", para: "ml", fator: 1000 },
];

const defaultYields: YieldConfig[] = [];

/**
 * @description Zustand store para gerenciar conversões de unidades e configurações de rendimento.
 * @property {UnitConv[]} conversoes - A lista de conversões de unidades.
 * @property {YieldConfig[]} yields - A lista de configurações de rendimento.
 * @property {(updater: (prev: UnitConv[]) => UnitConv[]) => void} updateConversoes - Atualiza a lista de conversões de unidades.
 * @property {(updater: (prev: YieldConfig[]) => YieldConfig[]) => void} updateYields - Atualiza a lista de configurações de rendimento.
 * @property {() => void} reset - Redefine as conversões e rendimentos para os padrões.
 * @property {(produtoId: string | undefined, entrada: Unit, saida?: Unit) => YieldConfig | undefined} findYield - Encontra uma configuração de rendimento com base no ID do produto e nas unidades de entrada/saída.
 */
interface UnidadesStore {
  conversoes: UnitConv[];
  yields: YieldConfig[];
  updateConversoes: (updater: (prev: UnitConv[]) => UnitConv[]) => void;
  updateYields: (updater: (prev: YieldConfig[]) => YieldConfig[]) => void;
  reset: () => void;
  findYield: (produtoId: string | undefined, entrada: Unit, saida?: Unit) => YieldConfig | undefined;
}

export const useUnidadesStore = create<UnidadesStore>()(
  persist(
    (set, get) => ({
      conversoes: defaultConversoes,
      yields: defaultYields,
      updateConversoes: (updater) =>
        set((state) => ({ conversoes: updater(state.conversoes) })),
      updateYields: (updater) =>
        set((state) => ({
          yields: updater(state.yields).map((config) => {
            const produtoId = config.produtoId?.trim();
            return {
              ...config,
              produtoId: produtoId ? produtoId : undefined,
            };
          }),
        })),
      reset: () =>
        set({
          conversoes: defaultConversoes,
          yields: defaultYields,
        }),
      findYield: (produtoId, entrada, saida) => {
        const normalizado = produtoId?.trim().toLowerCase();
        const yields = get().yields;

        if (normalizado) {
          const matchEstrito = yields.find((item) => {
            if (!item.produtoId) {
              return false;
            }
            if (item.produtoId.trim().toLowerCase() !== normalizado) {
              return false;
            }
            if (item.entrada !== entrada) {
              return false;
            }
            if (saida && item.saida !== saida) {
              return false;
            }
            return true;
          });
          if (matchEstrito) {
            return matchEstrito;
          }

          const matchEntrada = yields.find((item) => {
            if (!item.produtoId) {
              return false;
            }
            return (
              item.produtoId.trim().toLowerCase() === normalizado &&
              item.entrada === entrada
            );
          });
          if (matchEntrada) {
            return matchEntrada;
          }
        }

        if (saida) {
          const globalEstrito = yields.find(
            (item) =>
              !item.produtoId &&
              item.entrada === entrada &&
              item.saida === saida,
          );
          if (globalEstrito) {
            return globalEstrito;
          }
        }

        return yields.find(
          (item) => !item.produtoId && item.entrada === entrada,
        );
      },
    }),
    {
      name: "cmx_v03_unidades",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState, persistedVersion) => {
        if (!persistedState) {
          return persistedState as UnidadesStore;
        }
        const state = persistedState as UnidadesStore;
        if (persistedVersion >= 1) {
          return state;
        }
        const sanitizedYields = Array.isArray(state.yields)
          ? state.yields.map((config) => {
              const produtoId =
                typeof config.produtoId === "string"
                  ? config.produtoId.trim()
                  : undefined;
              return {
                ...config,
                produtoId: produtoId ? produtoId : undefined,
              };
            })
          : defaultYields;
        return {
          ...state,
          yields: sanitizedYields,
        };
      },
    },
  ),
);
