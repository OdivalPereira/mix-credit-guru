import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { ContractFornecedor } from "@/types/domain";
import { generateId } from "@/lib/utils";

const createContractDefaults = (): ContractFornecedor => ({
  id: generateId("contract"),
  supplierId: undefined,
  produtoId: "",
  unidade: "un",
  precoBase: 0,
  priceBreaks: [],
  freightBreaks: [],
  yield: undefined,
  conversoes: [],
});

const normalizeContract = (contract: ContractFornecedor): ContractFornecedor => ({
  id: contract.id ?? contract.fornecedorId ?? generateId("contract"),
  supplierId: contract.supplierId,
  produtoId: contract.produtoId ?? "",
  unidade: contract.unidade ?? "un",
  precoBase: contract.precoBase ?? 0,
  priceBreaks: contract.priceBreaks ?? [],
  freightBreaks: contract.freightBreaks ?? [],
  yield: contract.yield,
  conversoes: contract.conversoes ?? [],
  fornecedorId: contract.fornecedorId,
});

const defaultContracts: ContractFornecedor[] = [createContractDefaults()];

export const createEmptyContract = (): ContractFornecedor =>
  normalizeContract(createContractDefaults());

/**
 * @description Zustand store para gerenciar contratos de fornecedores.
 * @property {ContractFornecedor[]} contratos - A lista de contratos.
 * @property {(updater: (prev: ContractFornecedor[]) => ContractFornecedor[]) => void} updateContracts - Atualiza a lista de contratos usando uma função de atualização.
 * @property {() => void} reset - Redefine a lista de contratos para o padrão.
 * @property {(supplierId: string, produtoKey?: string) => ContractFornecedor | undefined} findContract - Encontra um contrato com base no ID do fornecedor e na chave do produto.
 */
interface ContractsStore {
  contratos: ContractFornecedor[];
  updateContracts: (
    updater: (prev: ContractFornecedor[]) => ContractFornecedor[],
  ) => void;
  reset: () => void;
  findContract: (supplierId: string, produtoKey?: string) => ContractFornecedor | undefined;
}

export const useContractsStore = create<ContractsStore>()(
  persist(
    (set, get) => ({
      contratos: defaultContracts,
      updateContracts: (updater) =>
        set((state) => ({
          contratos: updater(state.contratos).map(normalizeContract),
        })),
      reset: () => set({ contratos: [createContractDefaults()] }),
      findContract: (supplierId: string, produtoKey?: string) => {
        const lowerProduto = produtoKey?.toLowerCase().trim();
        const contratos = get().contratos.map(normalizeContract);

        const directMatches = contratos.filter((contract) => {
          if (!supplierId) {
            return false;
          }
          if (contract.supplierId && contract.supplierId === supplierId) {
            return true;
          }
          if (contract.fornecedorId && contract.fornecedorId === supplierId) {
            return true;
          }
          return false;
        });

        const fallbackMatches =
          directMatches.length > 0
            ? directMatches
            : contratos.filter(
                (contract) => !contract.supplierId && !contract.fornecedorId,
              );

        if (fallbackMatches.length === 0) {
          return undefined;
        }
        if (!lowerProduto) {
          return fallbackMatches[0];
        }
        return (
          fallbackMatches.find((contract) => {
            if (!contract.produtoId) {
              return false;
            }
            return lowerProduto.includes(contract.produtoId.toLowerCase());
          }) ?? fallbackMatches[0]
        );
      },
    }),
    {
      name: "cmx_v03_contracts",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState, version) => {
        if (!persistedState || version >= 1) {
          return persistedState;
        }
        const state = persistedState as {
          contratos?: ContractFornecedor[];
        };
        if (!state.contratos) {
          return {
            contratos: [createContractDefaults()],
          };
        }
        return {
          ...state,
          contratos: state.contratos.map((contract) =>
            normalizeContract({
              ...contract,
              supplierId: contract.supplierId ?? undefined,
            }),
          ),
        };
      },
    },
  ),
);
