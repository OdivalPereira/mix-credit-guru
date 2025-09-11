import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Produto {
  id: string;
  descricao: string;
  ncm: string;
  flags: {
    refeicao: boolean;
    cesta: boolean;
    reducao: boolean;
    is: boolean;
  };
}

interface CatalogoStore {
  produtos: Produto[];
  addProduto: (produto: Produto) => void;
  updateProduto: (id: string, data: Partial<Produto>) => void;
  removeProduto: (id: string) => void;
  importarCSV: (csv: string) => void;
  exportarCSV: () => string;
}

export const useCatalogoStore = create<CatalogoStore>()(
  persist(
    (set, get) => ({
      produtos: [],
      addProduto: (produto) =>
        set((state) => ({ produtos: [...state.produtos, produto] })),
      updateProduto: (id, data) =>
        set((state) => ({
          produtos: state.produtos.map((p) =>
            p.id === id
              ? {
                  ...p,
                  ...data,
                  flags: { ...p.flags, ...(data.flags ?? {}) },
                }
              : p,
          ),
        })),
      removeProduto: (id) =>
        set((state) => ({
          produtos: state.produtos.filter((p) => p.id !== id),
        })),
      importarCSV: (csv) => {
        const lines = csv.trim().split(/\r?\n/);
        const [, ...rows] = lines;
        const produtos = rows.filter(Boolean).map((row) => {
          const cols = row.split(",");
          return {
            id: crypto.randomUUID(),
            descricao: cols[0]?.trim() ?? "",
            ncm: cols[1]?.trim() ?? "",
            flags: {
              refeicao: cols[2] === "1",
              cesta: cols[3] === "1",
              reducao: cols[4] === "1",
              is: cols[5] === "1",
            },
          } as Produto;
        });
        set({ produtos });
      },
      exportarCSV: () => {
        const header = ["descricao", "ncm", "refeicao", "cesta", "reducao", "is"].join(",");
        const rows = get().produtos.map((p) =>
          [
            p.descricao,
            p.ncm,
            p.flags.refeicao ? "1" : "0",
            p.flags.cesta ? "1" : "0",
            p.flags.reducao ? "1" : "0",
            p.flags.is ? "1" : "0",
          ].join(","),
        );
        return [header, ...rows].join("\n");
      },
    }),
    { name: "catalogo-storage" },
  ),
);

