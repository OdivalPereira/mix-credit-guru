import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  readFornecedoresCSV,
  writeFornecedoresCSV,
} from "../lib/csv";
import type { Supplier, MixResultado } from "@/types/domain";
import { rankSuppliers } from "@/lib/calcs";
import { useAppStore } from "./useAppStore";

export interface Contexto {
  data: string;
  uf: string;
  destino: string;
  regime: string;
  produto: string;
}


export interface CotacaoStore {
  contexto: Contexto;
  fornecedores: Supplier[];
  resultado: MixResultado;
  setContexto: (contexto: Partial<Contexto>) => void;
  upsertFornecedor: (fornecedor: Omit<Supplier, "id"> & { id?: string }) => void;
  removeFornecedor: (id: string) => void;
  limpar: () => void;
  importarCSV: (csv: string) => void;
  exportarCSV: () => string;
  importarJSON: (json: string) => void;
  exportarJSON: () => string;
  calcular: () => void;
}

const initialContexto: Contexto = {
  data: "",
  uf: "",
  destino: "",
  regime: "",
  produto: "",
};

export const useCotacaoStore = create<CotacaoStore>()(
  persist(
    (set, get) => ({
      contexto: initialContexto,
      fornecedores: [],
      resultado: { itens: [] },

      setContexto: (ctx) =>
        set((state) => ({ contexto: { ...state.contexto, ...ctx } })),

      upsertFornecedor: (fornecedor) =>
        set((state) => {
          const id = fornecedor.id ?? crypto.randomUUID();
          const exists = state.fornecedores.some((f) => f.id === id);
          const fornecedores = exists
            ? state.fornecedores.map((f) =>
                f.id === id ? { ...f, ...fornecedor, id } : f
              )
            : [...state.fornecedores, { ...fornecedor, id }];
          return { fornecedores };
        }),

      removeFornecedor: (id) =>
        set((state) => ({
          fornecedores: state.fornecedores.filter((f) => f.id !== id),
        })),

      limpar: () =>
        set({
          contexto: initialContexto,
          fornecedores: [],
          resultado: { itens: [] },
        }),

      importarCSV: (csv) => {
        const fornecedores = readFornecedoresCSV(csv);
        set({ fornecedores });
        get().calcular();
      },

      exportarCSV: () => writeFornecedoresCSV(get().fornecedores),

      importarJSON: (json) => {
        const data = JSON.parse(json) as Partial<{
          contexto: Contexto;
          fornecedores: Supplier[];
          resultado: MixResultado;
        }>;
        set({
          contexto: data.contexto ?? initialContexto,
          fornecedores: data.fornecedores ?? [],
          resultado: data.resultado ?? { itens: [] },
        });
        get().calcular();
      },

      exportarJSON: () => {
        const { contexto, fornecedores, resultado } = get();
        return JSON.stringify({ contexto, fornecedores, resultado });
      },

      calcular: () =>
        set((state) => {
          const { contexto, fornecedores } = state;
          const scenario = useAppStore.getState().scenario;
          const itens = rankSuppliers(fornecedores, {
            destino: contexto.destino,
            regime: contexto.regime,
            scenario,
            uf: contexto.uf,
          });
          return { resultado: { itens } };
        }),
    }),
    {
      name: "cmx_v03_cotacao",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        contexto: state.contexto,
        fornecedores: state.fornecedores,
      }),
    },
  ),
);

