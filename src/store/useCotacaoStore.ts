import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { readFornecedoresCSV, writeFornecedoresCSV } from "../lib/csv";
import type { Supplier, MixResultado, DestinoTipo, SupplierRegime } from "@/types/domain";
import { rankSuppliers } from "@/lib/calcs";
import { useAppStore } from "./useAppStore";
import type { OptimizePerItemResult } from "@/lib/opt";
import { generateId } from "@/lib/utils";
import { resolveUnitPrice } from "@/lib/contracts";
import { normalizeOffer } from "@/lib/units";
import { useContractsStore } from "./useContractsStore";
import { useUnidadesStore } from "./useUnidadesStore";

export interface Contexto {
  data: string;
  uf: string;
  municipio?: string;
  destino: DestinoTipo;
  regime: SupplierRegime;
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
  computeResultado: (scenario?: string) => MixResultado;
}

const initialContexto: Contexto = {
  data: "",
  uf: "SP",
  municipio: "",
  destino: "A",
  regime: "normal",
  produto: "",
};

const supplyChainLength = 4;
export const SUPPLY_CHAIN_STAGES = supplyChainLength;

export const createEmptySupplier = (context?: Partial<Contexto>): Supplier =>
  applyFornecedorDefaults({
    id: generateId("fornecedor"),
    nome: "",
    cnpj: "",
    tipo: "distribuidor",
    regime: context?.regime ?? "normal",
    uf: (context?.uf ?? "").toUpperCase(),
    municipio: context?.municipio ?? "",
    contato: undefined,
    ativo: true,
    produtoId: undefined,
    produtoDescricao: context?.produto ?? "",
    unidadeNegociada: undefined,
    pedidoMinimo: 0,
    prazoEntregaDias: 0,
    prazoPagamentoDias: 0,
    preco: 0,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 0,
    flagsItem: { cesta: false, reducao: false },
    isRefeicaoPronta: false,
    cadeia: Array.from({ length: supplyChainLength }, () => ""),
  });

interface BuildResultadoParams {
  fornecedores: Supplier[];
  contexto: Contexto;
  scenario: string;
}

function buildResultado({ fornecedores, contexto, scenario }: BuildResultadoParams): MixResultado {
  if (!fornecedores.length) {
    return { itens: [] };
  }

  const ativos = fornecedores.filter((fornecedor) => fornecedor.ativo !== false);
  if (!ativos.length) {
    return { itens: [] };
  }

  const contractsState = useContractsStore.getState();
  const unidadesState = useUnidadesStore.getState();

  const produtoChave = contexto.produto?.toLowerCase() ?? "";
  const ajustes = new Map<
    string,
    { preco: number; frete: number; custoNormalizado?: number }
  >();

  for (const fornecedor of ativos) {
    const contrato = contractsState.findContract(fornecedor.id, produtoChave);
    let preco = fornecedor.preco;
    let frete = fornecedor.frete;
    let custoNormalizado: number | undefined;

    if (contrato) {
      const { preco: precoContrato, frete: freteContrato } = resolveUnitPrice(1, contrato);
      preco = precoContrato;
      frete = freteContrato;

      const conversoesCombinadas = [
        ...unidadesState.conversoes,
        ...(contrato.conversoes ?? []),
      ];
      const produtoYield =
        contrato.produtoId?.trim() ||
        fornecedor.produtoId?.trim() ||
        undefined;
      const yieldConfig =
        contrato.yield ??
        unidadesState.findYield(produtoYield, contrato.unidade);

      if (precoContrato > 0) {
        try {
          const normalizado = normalizeOffer(
            precoContrato,
            [1],
            contrato.unidade,
            yieldConfig?.saida ?? contrato.unidade,
            conversoesCombinadas,
            yieldConfig,
          );
          if (Number.isFinite(normalizado)) {
            custoNormalizado = normalizado;
          }
        } catch {
          custoNormalizado = undefined;
        }
      }
    }

    ajustes.set(fornecedor.id, { preco, frete, custoNormalizado });
  }

  const fornecedoresAjustados = ativos.map((fornecedor) => {
    const ajuste = ajustes.get(fornecedor.id);
    if (!ajuste) {
      return fornecedor;
    }
    return {
      ...fornecedor,
      preco: ajuste.preco,
      frete: ajuste.frete,
    };
  });

  const ranked = rankSuppliers(fornecedoresAjustados, {
    destino: contexto.destino,
    regime: contexto.regime,
    scenario,
    date: contexto.data || new Date().toISOString().slice(0, 10),
    uf: contexto.uf,
    municipio: contexto.municipio,
  });

  const itens = ranked.map((item) => {
    const ajuste = ajustes.get(item.id);
    return {
      ...item,
      custoNormalizado:
        ajuste?.custoNormalizado !== undefined
          ? Number(ajuste.custoNormalizado.toFixed(2))
          : item.custoNormalizado,
    };
  });

  return { itens };
}

function applyFornecedorDefaults(fornecedor: Supplier): Supplier {
  const flagsItem =
    fornecedor.flagsItem !== undefined
      ? { ...fornecedor.flagsItem }
      : { cesta: false, reducao: false };
  const cadeia = Array.isArray(fornecedor.cadeia)
    ? fornecedor.cadeia.map((etapa) => etapa ?? "")
    : [];
  if (cadeia.length < supplyChainLength) {
    cadeia.push(...Array.from({ length: supplyChainLength - cadeia.length }, () => ""));
  }
  return {
    ...fornecedor,
    nome: fornecedor.nome ?? "",
    cnpj: fornecedor.cnpj ?? "",
    tipo: fornecedor.tipo ?? "distribuidor",
    regime: fornecedor.regime ?? "normal",
    uf: fornecedor.uf?.toUpperCase() ?? "",
    ativo: fornecedor.ativo ?? true,
    produtoId: fornecedor.produtoId ?? undefined,
    produtoDescricao: fornecedor.produtoDescricao ?? "",
    unidadeNegociada: fornecedor.unidadeNegociada ?? undefined,
    pedidoMinimo: fornecedor.pedidoMinimo ?? 0,
    prazoEntregaDias: fornecedor.prazoEntregaDias ?? 0,
    prazoPagamentoDias: fornecedor.prazoPagamentoDias ?? 0,
    preco: fornecedor.preco ?? 0,
    ibs: fornecedor.ibs ?? 0,
    cbs: fornecedor.cbs ?? 0,
    is: fornecedor.is ?? 0,
    frete: fornecedor.frete ?? 0,
    flagsItem,
    isRefeicaoPronta: fornecedor.isRefeicaoPronta ?? false,
    cadeia,
  };
}

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
          const id = fornecedor.id ?? generateId("fornecedor");
          const exists = state.fornecedores.some((f) => f.id === id);
          const fornecedores = exists
            ? state.fornecedores.map((f) =>
                f.id === id ? applyFornecedorDefaults({ ...f, ...fornecedor, id }) : f
              )
            : [...state.fornecedores, applyFornecedorDefaults({ ...fornecedor, id })];
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
        const fornecedoresImportados = readFornecedoresCSV(csv);
        if (fornecedoresImportados.length === 0) {
          console.warn("[cotacao] Nenhum fornecedor valido encontrado no CSV.");
          return;
        }
        set((state) => {
          const combinados = [...state.fornecedores];
          for (const fornecedorOriginal of fornecedoresImportados) {
            const fornecedor = fornecedorOriginal.id
              ? fornecedorOriginal
              : { ...fornecedorOriginal, id: generateId("fornecedor") };
            const normalizado = applyFornecedorDefaults(fornecedor);
            const idx = combinados.findIndex(
              (item) =>
                item.nome.toLowerCase() === fornecedor.nome.toLowerCase() &&
                item.tipo.toLowerCase() === fornecedor.tipo.toLowerCase() &&
                item.regime.toLowerCase() === fornecedor.regime.toLowerCase(),
            );
            if (idx >= 0) {
              combinados[idx] = applyFornecedorDefaults({
                ...combinados[idx],
                ...normalizado,
                id: combinados[idx].id,
              });
            } else {
              combinados.push(normalizado);
            }
          }
          return { fornecedores: combinados };
        });
        get().calcular();
      },

      exportarCSV: () => writeFornecedoresCSV(get().fornecedores),

      importarJSON: (json) => {
        const data = JSON.parse(json) as Partial<{
          contexto: Contexto;
          fornecedores: Supplier[];
          resultado: MixResultado;
        }>;
          set((state) => ({
            contexto: data.contexto
              ? { ...initialContexto, ...data.contexto, uf: (data.contexto.uf ?? "").toUpperCase() }
              : initialContexto,
            fornecedores: data.fornecedores
              ? (() => {
          const atual = new Map(
            state.fornecedores.map((fornecedor) => [
              `${fornecedor.nome.toLowerCase()}|${fornecedor.tipo.toLowerCase()}|${fornecedor.regime.toLowerCase()}`,
              fornecedor,
            ]),
          );
          for (const fornecedor of data.fornecedores) {
            const chave = `${fornecedor.nome.toLowerCase()}|${fornecedor.tipo.toLowerCase()}|${fornecedor.regime.toLowerCase()}`;
            const existente = atual.get(chave);
            const fornecedorComId = fornecedor.id
              ? fornecedor
              : { ...fornecedor, id: generateId("fornecedor") };
            const fornecedorFinal = existente
              ? applyFornecedorDefaults({ ...existente, ...fornecedorComId, id: existente.id })
              : applyFornecedorDefaults(fornecedorComId);
            atual.set(chave, fornecedorFinal);
          }
          return Array.from(atual.values());
        })()
              : state.fornecedores,
            resultado: data.resultado ?? { itens: [] },
            ultimaOtimizacao: null,
          }));
        get().calcular();
      },

      exportarJSON: () => {
        const { contexto, fornecedores, resultado } = get();
        return JSON.stringify({ contexto, fornecedores, resultado });
      },

      calcular: () =>
        set((state) => {
          const scenario = useAppStore.getState().scenario;
          const resultado = buildResultado({
            fornecedores: state.fornecedores,
            contexto: state.contexto,
            scenario,
          });
          return { resultado, ultimaOtimizacao: null };
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

      computeResultado: (scenarioOverride) => {
        const scenario = scenarioOverride ?? useAppStore.getState().scenario;
        return buildResultado({
          fornecedores: get().fornecedores,
          contexto: get().contexto,
          scenario,
        });
      },
    }),
    {
      name: "cmx_v03_cotacao",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        contexto: state.contexto,
        fornecedores: state.fornecedores,
      }),
      version: 1,
      migrate: (persistedState, version) => {
        if (!persistedState || version >= 1) {
          return persistedState;
        }
        const state = persistedState as {
          contexto?: Partial<Contexto>;
          fornecedores?: Supplier[];
        };
        const destinoMap: Record<string, DestinoTipo> = {
          consumo: "C",
          revenda: "B",
          imobilizado: "D",
          producao: "E",
          comercializacao: "E",
        };
        const contextoMigrado: Contexto = {
          ...initialContexto,
          ...state.contexto,
          uf: state.contexto?.uf ? state.contexto.uf.toUpperCase() : initialContexto.uf,
          destino: (() => {
            const bruto = state.contexto?.destino;
            if (!bruto) {
              return initialContexto.destino;
            }
            const normalizado = bruto.trim().toLowerCase();
            return destinoMap[normalizado] ?? (bruto.toUpperCase() as DestinoTipo);
          })(),
        };
        return {
          contexto: contextoMigrado,
          fornecedores: state.fornecedores ?? [],
        };
      },
    },
  ),
);

