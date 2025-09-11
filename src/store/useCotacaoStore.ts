import { create } from "zustand";
import {
  readFornecedoresCSV,
  writeFornecedoresCSV,
} from "../lib/csv";

export interface Contexto {
  data: string;
  uf: string;
  destino: string;
  regime: string;
  produto: string;
}

export interface Fornecedor {
  id: string;
  nome: string;
  tipo: string;
  regime: string;
  preco: number;
  ibs: number;
  cbs: number;
  is: number;
  frete: number;
  cadeia?: string[];
}

export interface Resultado extends Fornecedor {
  creditavel: boolean;
  credito: number;
  custoEfetivo: number;
  ranking: number;
}

export interface CotacaoStore {
  contexto: Contexto;
  fornecedores: Fornecedor[];
  resultados: Resultado[];
  setContexto: (contexto: Partial<Contexto>) => void;
  upsertFornecedor: (fornecedor: Omit<Fornecedor, "id"> & { id?: string }) => void;
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

export const useCotacaoStore = create<CotacaoStore>((set, get) => ({
  contexto: initialContexto,
  fornecedores: [],
  resultados: [],

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

  limpar: () => set({
    contexto: initialContexto,
    fornecedores: [],
    resultados: [],
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
      fornecedores: Fornecedor[];
    }>;
    set({
      contexto: data.contexto ?? initialContexto,
      fornecedores: data.fornecedores ?? [],
    });
    get().calcular();
  },

  exportarJSON: () => {
    const { contexto, fornecedores, resultados } = get();
    return JSON.stringify({ contexto, fornecedores, resultados });
  },

  calcular: () =>
    set((state) => {
      const { contexto, fornecedores } = state;
      const resultados = fornecedores
        .map((f) => {
          const creditoPerc = (f.ibs + f.cbs + f.is) / 100;
          const creditavel = contexto.regime !== "simples" && creditoPerc > 0;
          const credito = creditavel ? f.preco * creditoPerc : 0;
          const custoEfetivo = f.preco + f.frete - credito;
          return { ...f, creditavel, credito, custoEfetivo, ranking: 0 };
        })
        .sort((a, b) => a.custoEfetivo - b.custoEfetivo)
        .map((r, idx) => ({ ...r, ranking: idx + 1 }));
      return { resultados };
    }),
}));

