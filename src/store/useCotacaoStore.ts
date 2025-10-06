import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { readFornecedoresCSV, writeFornecedoresCSV } from "../lib/csv";
import type { Supplier, MixResultado } from "@/types/domain";
import { rankSuppliers } from "@/lib/calcs";
import { useAppStore } from "./useAppStore";
import type { OptimizePerItemResult } from "@/lib/opt";

export interface Contexto {
  data: string;
  uf: string;
  municipio?: string;
  destino: string;
  regime: string;
  produto: string;
}


export interface CotacaoStore {
  contexto: Contexto;
  fornecedores: Supplier[];
  resultado: MixResultado;
  ultimaOtimizacao: OptimizePerItemResult | null;
  setContexto: (contexto: Partial<Contexto>) => void;
  upsertFornecedor: (fornecedor: Omit<Supplier, "id"> & { id?: string }) => void;
  removeFornecedor: (id: string) => void;
  limpar: () => void;
  importarCSV: (csv: string) => void;
  exportarCSV: () => string;
  importarJSON: (json: string) => void;
  exportarJSON: () => string;
  calcular: () => void;
  registrarOtimizacao: (resultado: OptimizePerItemResult) => void;
}

const initialContexto: Contexto = {
  data: "",
  uf: "SP",
  municipio: "",
  destino: "A",
  regime: "normal",
  produto: "",
};

export const useCotacaoStore = create<CotacaoStore>()(
  persist(
    (set, get) => ({
      contexto: initialContexto,
      fornecedores: [],
      resultado: { itens: [] },
      ultimaOtimizacao: null,

      setContexto: (ctx) =>
        set((state) => {
          const next = { ...state.contexto, ...ctx };
          if (next.uf) {
            next.uf = next.uf.toUpperCase();
          }
          return { contexto: next };
        }),

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
          ultimaOtimizacao: null,
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
          contexto: data.contexto
            ? { ...initialContexto, ...data.contexto, uf: (data.contexto.uf ?? "").toUpperCase() }
            : initialContexto,
          fornecedores: data.fornecedores ?? [],
          resultado: data.resultado ?? { itens: [] },
          ultimaOtimizacao: null,
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
            date: contexto.data || new Date().toISOString().slice(0, 10),
            uf: contexto.uf,
            municipio: contexto.municipio,
          });
          return { resultado: { itens }, ultimaOtimizacao: null };
        }),

      registrarOtimizacao: (resultadoOtimizacao) =>
        set((state) => {
          const itensAtualizados = state.resultado.itens.map((item) => {
            const quantidade = resultadoOtimizacao.allocation[item.id] ?? 0;
            const restricoes =
              resultadoOtimizacao.violations.length > 0
                ? resultadoOtimizacao.violations
                : item.restricoes;
            return {
              ...item,
              degrauAplicado: quantidade > 0 ? `Qtd otimizada: ${quantidade}` : item.degrauAplicado,
              restricoes,
            };
          });
          return {
            resultado: { itens: itensAtualizados },
            ultimaOtimizacao: resultadoOtimizacao,
          };
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

