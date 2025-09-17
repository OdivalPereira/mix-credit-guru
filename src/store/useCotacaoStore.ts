import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  readFornecedoresCSV,
  writeFornecedoresCSV,
} from "../lib/csv";
import type {
  Supplier,
  MixResultado,
  SupplierConstraints,
  OptimizePrefs,
} from "@/types/domain";
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
  constraints: SupplierConstraints[];
  prefs: OptimizePrefs;
  setContexto: (contexto: Partial<Contexto>) => void;
  upsertFornecedor: (fornecedor: Omit<Supplier, "id"> & { id?: string }) => void;
  removeFornecedor: (id: string) => void;
  setConstraints: (constraints: SupplierConstraints[]) => void;
  setPrefs: (prefs: OptimizePrefs) => void;
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

const initialPrefs: OptimizePrefs = { objetivo: "custo", constraints: [] };

export const useCotacaoStore = create<CotacaoStore>()(
  persist(
    (set, get) => ({
      contexto: initialContexto,
      fornecedores: [],
      resultado: { itens: [] },
      constraints: [],
      prefs: initialPrefs,

      setContexto: (ctx) =>
        set((state) => ({ contexto: { ...state.contexto, ...ctx } })),

      setConstraints: (constraints) =>
        set((state) => ({
          constraints,
          prefs: { ...state.prefs, constraints },
        })),

      setPrefs: (prefs) =>
        set((state) => ({ prefs: { ...state.prefs, ...prefs, constraints: state.constraints } })),

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
          constraints: [],
          prefs: initialPrefs,
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
          constraints: SupplierConstraints[];
          prefs: OptimizePrefs;
        }>;
        set({
          contexto: data.contexto ?? initialContexto,
          fornecedores: data.fornecedores ?? [],
          resultado: data.resultado ?? { itens: [] },
          constraints: data.constraints ?? [],
          prefs: data.prefs ?? { ...initialPrefs, constraints: data.constraints ?? [] },
        });
        get().calcular();
      },

      exportarJSON: () => {
        const { contexto, fornecedores, resultado, constraints, prefs } = get();
        return JSON.stringify({ contexto, fornecedores, resultado, constraints, prefs });
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
      name: "cmx_v04_cotacao",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        contexto: state.contexto,
        fornecedores: state.fornecedores,
        constraints: state.constraints,
        prefs: state.prefs,
      }),
    },
  ),
);

