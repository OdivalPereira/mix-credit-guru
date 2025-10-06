import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ContractFornecedor } from "@/types/domain";
import { generateId } from "@/lib/utils";

const defaultContracts: ContractFornecedor[] = [
  {
    fornecedorId: generateId("contract"),
    produtoId: "",
    unidade: "un",
    precoBase: 0,
    priceBreaks: [],
    freightBreaks: [],
    yield: undefined,
    conversoes: [],
  },
];

export const createEmptyContract = (): ContractFornecedor => ({
  fornecedorId: generateId("contract"),
  produtoId: "",
  unidade: "un",
  precoBase: 0,
  priceBreaks: [],
  freightBreaks: [],
  yield: undefined,
  conversoes: [],
});

interface ContractsStore {
  contratos: ContractFornecedor[];
  updateContracts: (
    updater: (prev: ContractFornecedor[]) => ContractFornecedor[],
  ) => void;
  reset: () => void;
  findContract: (fornecedorId: string, produtoKey?: string) => ContractFornecedor | undefined;
}

export const useContractsStore = create<ContractsStore>()(
  persist(
    (set, get) => ({
      contratos: defaultContracts,
      updateContracts: (updater) =>
        set((state) => ({ contratos: updater(state.contratos) })),
      reset: () => set({ contratos: defaultContracts }),
      findContract: (fornecedorId: string, produtoKey?: string) => {
        const lowerProduto = produtoKey?.toLowerCase().trim();
        const matches = get().contratos.filter(
          (contract) => contract.fornecedorId === fornecedorId,
        );
        if (matches.length === 0) {
          return undefined;
        }
        if (!lowerProduto) {
          return matches[0];
        }
        return (
          matches.find((contract) => {
            if (!contract.produtoId) {
              return false;
            }
            return lowerProduto.includes(contract.produtoId.toLowerCase());
          }) ?? matches[0]
        );
      },
    }),
    {
      name: "cmx_v03_contracts",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
