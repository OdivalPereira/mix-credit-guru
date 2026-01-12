import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Produto } from "@/types/domain";
import { readProdutosCSV, writeProdutosCSV } from "@/lib/csv";
import { generateId } from "@/lib/utils";
import { parseNFeXML, nfeProdutosToCatalogo } from "@/lib/parsers/nfe-parser";

/**
 * @description Zustand store para gerenciar o catálogo de produtos.
 * @property {Produto[]} produtos - A lista de produtos no catálogo.
 * @property {(produto: Produto) => void} addProduto - Adiciona um novo produto ao catálogo.
 * @property {(id: string, data: Partial<Produto>) => void} updateProduto - Atualiza um produto existente no catálogo.
 * @property {(id: string) => void} removeProduto - Remove um produto do catálogo.
 * @property {(csv: string) => void} importarCSV - Importa produtos de uma string CSV.
 * @property {() => string} exportarCSV - Exporta os produtos para uma string CSV.
 * @property {(xml: string) => { success: boolean; count: number; error?: string }} importarXML - Importa produtos de um XML de NF-e.
 */
interface CatalogoStore {
  produtos: Produto[];
  addProduto: (produto: Produto) => void;
  updateProduto: (id: string, data: Partial<Produto>) => void;
  removeProduto: (id: string) => void;
  importarCSV: (csv: string) => void;
  exportarCSV: () => string;
  importarXML: (xml: string) => { success: boolean; count: number; error?: string };
  loadDemoData: () => void;
  limpar: () => void;
}

export const useCatalogoStore = create<CatalogoStore>()(
  persist(
    (set, get) => ({
      produtos: [],
      addProduto: (produto) =>
        set((state) => ({
          produtos: [
            ...state.produtos,
            {
              ...produto,
              componentes: produto.componentes ?? [],
            },
          ],
        })),
      updateProduto: (id, data) =>
        set((state) => ({
          produtos: state.produtos.map((p) =>
            p.id === id
              ? {
                ...p,
                ...data,
                flags: { ...p.flags, ...(data.flags ?? {}) },
                componentes:
                  data.componentes !== undefined ? data.componentes : p.componentes ?? [],
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
                componentes: produto.componentes ?? current.componentes ?? [],
              });
            } else {
              byNcm.set(produto.ncm, {
                ...produto,
                componentes: produto.componentes ?? [],
              });
            }
          }
          return { produtos: Array.from(byNcm.values()) };
        });
      },
      exportarCSV: () => writeProdutosCSV(get().produtos),
      importarXML: (xml: string) => {
        const result = parseNFeXML(xml);
        if (!result.success || !result.data) {
          console.error("[catalogo] Erro ao parsear XML:", result.error);
          return { success: false, count: 0, error: result.error };
        }

        const produtosNfe = nfeProdutosToCatalogo(result.data.produtos);
        if (produtosNfe.length === 0) {
          return { success: false, count: 0, error: "Nenhum produto encontrado no XML" };
        }

        set((state) => {
          const byNcm = new Map(state.produtos.map((produto) => [produto.ncm, produto]));
          for (const produto of produtosNfe) {
            const current = byNcm.get(produto.ncm);
            if (current) {
              // Merge: atualiza dados mas mantém ID existente
              byNcm.set(produto.ncm, {
                ...current,
                ...produto,
                id: current.id,
                componentes: current.componentes ?? [],
              });
            } else {
              byNcm.set(produto.ncm, produto);
            }
          }
          return { produtos: Array.from(byNcm.values()) };
        });

        return { success: true, count: produtosNfe.length };
      },
      loadDemoData: () => {
        import("@/data/demoData").then(({ demoProdutos }) => {
          set({ produtos: demoProdutos });
        });
      },
      limpar: () => set({ produtos: [] }),
    }),
    {
      name: "cmx_v04_catalogo",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

