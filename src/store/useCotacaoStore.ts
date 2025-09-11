import { create } from "zustand";

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

  importarCSV: (csv) =>
    set(() => {
      const lines = csv.trim().split("\n");
      const [header, ...rows] = lines;
      const headers = header.split(",").map((h) => h.trim());
      const fornecedores: Fornecedor[] = rows.map((row) => {
        const cols = row.split(",");
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => (obj[h] = cols[i]?.trim() ?? ""));
        return {
          id: crypto.randomUUID(),
          nome: obj.nome ?? "",
          tipo: obj.tipo ?? "",
          regime: obj.regime ?? "",
          preco: parseFloat(obj.preco) || 0,
          ibs: parseFloat(obj.ibs) || 0,
          cbs: parseFloat(obj.cbs) || 0,
          is: parseFloat(obj.is) || 0,
          frete: parseFloat(obj.frete) || 0,
        };
      });
      return { fornecedores };
    }),

  exportarCSV: () => {
    const { fornecedores } = get();
    const header = "nome,tipo,regime,preco,ibs,cbs,is,frete";
    const rows = fornecedores.map((f) =>
      [f.nome, f.tipo, f.regime, f.preco, f.ibs, f.cbs, f.is, f.frete].join(",")
    );
    return [header, ...rows].join("\n");
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

