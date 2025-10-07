import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Produto } from "@/types/domain";
import { readProdutosCSV, writeProdutosCSV } from "@/lib/csv";
import { generateId } from "@/lib/utils";

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
        const produtosImportados = readProdutosCSV(csv);
        if (produtosImportados.length === 0) {
          console.warn("[catalogo] Nenhum produto valido encontrado no CSV.");
          return;
        }
        set((state) => {
          const byNcm = new Map(state.produtos.map((produto) => [produto.ncm, produto]));
          for (const produto of produtosImportados) {
            const current = byNcm.get(produto.ncm);
            if (current) {
              byNcm.set(produto.ncm, {
                ...current,
                ...produto,
                id: current.id,
              });
            } else {
              byNcm.set(produto.ncm, produto);
            }
          }
          return { produtos: Array.from(byNcm.values()) };
        });
      },
      exportarCSV: () => writeProdutosCSV(get().produtos),
    }),
    {
      name: "cmx_v03_catalogo",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

