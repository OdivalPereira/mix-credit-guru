import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { readFornecedoresCSV, writeFornecedoresCSV } from "../lib/csv";
import type {
  Supplier,
  Fornecedor,
  OfertaFornecedor,
  MixResultado,
  SupplierConstraints,
  OptimizePrefs,
  DestinoTipo,
  SupplierRegime,
  SupplierTipo,
} from "@/types/domain";
import { rankSuppliers } from "@/lib/calcs";
import { useAppStore } from "./useAppStore";
import type { OptimizePerItemResult } from "@/lib/opt";
import { generateId } from "@/lib/utils";
import { resolveSupplierPrice } from "@/lib/contracts";
import { normalizeOffer } from "@/lib/units";
import { useUnidadesStore } from "./useUnidadesStore";
import { TaxApiClient } from "@/services/TaxApiClient";

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
  /** Dados cadastrais dos fornecedores */
  fornecedoresCadastro: Fornecedor[];
  /** Ofertas específicas por produto */
  ofertas: OfertaFornecedor[];
  /** @deprecated Computado a partir de fornecedoresCadastro + ofertas para compatibilidade */
  fornecedores: Supplier[];
  resultado: MixResultado;
  constraints: SupplierConstraints[];
  prefs: OptimizePrefs;
  ultimaOtimizacao: OptimizePerItemResult | null;

  setContexto: (contexto: Partial<Contexto>) => void;

  // Métodos para Fornecedor (cadastro)
  upsertFornecedorCadastro: (fornecedor: Omit<Fornecedor, "id"> & { id?: string }) => string;
  removeFornecedorCadastro: (id: string) => void;

  // Métodos para Oferta
  upsertOferta: (oferta: Omit<OfertaFornecedor, "id"> & { id?: string }) => string;
  removeOferta: (id: string) => void;
  getOfertasByFornecedor: (fornecedorId: string) => OfertaFornecedor[];

  /** @deprecated Use upsertFornecedorCadastro + upsertOferta */
  upsertFornecedor: (fornecedor: Omit<Supplier, "id"> & { id?: string }) => void;
  /** @deprecated Use removeFornecedorCadastro ou removeOferta */
  removeFornecedor: (id: string) => void;

  setConstraints: (constraints: SupplierConstraints[]) => void;
  setPrefs: (prefs: OptimizePrefs) => void;
  limpar: () => void;
  importarCSV: (csv: string) => void;
  exportarCSV: () => string;
  importarJSON: (json: string) => void;
  exportarJSON: () => string;
  calcular: () => Promise<void>;
  registrarOtimizacao: (resultado: OptimizePerItemResult) => void;
  computeResultado: (scenario?: string, contextOverride?: Partial<Contexto>) => MixResultado;
  enrichSuppliersWithTaxes: () => Promise<void>;
  isCalculating: boolean;
}

const initialContexto: Contexto = {
  data: "",
  uf: "SP",
  municipio: "",
  destino: "A",
  regime: "normal",
  produto: "",
};

const initialPrefs: OptimizePrefs = { objetivo: "custo", constraints: [] };
const supplyChainLength = 4;
export const SUPPLY_CHAIN_STAGES = supplyChainLength;

// ============= Helper Functions =============

function applyFornecedorCadastroDefaults(f: Partial<Fornecedor> & { id: string }): Fornecedor {
  return {
    id: f.id,
    nome: f.nome ?? "",
    cnpj: f.cnpj ?? "",
    tipo: f.tipo ?? "distribuidor",
    regime: f.regime ?? "normal",
    uf: f.uf?.toUpperCase() ?? "",
    municipio: f.municipio ?? "",
    contato: f.contato,
    ativo: f.ativo ?? true,
  };
}

function applyOfertaDefaults(o: Partial<OfertaFornecedor> & { id: string; fornecedorId: string; produtoId: string }): OfertaFornecedor {
  const cadeia = Array.isArray(o.cadeia)
    ? o.cadeia.map((etapa) => etapa ?? "")
    : [];
  if (cadeia.length < supplyChainLength) {
    cadeia.push(...Array.from({ length: supplyChainLength - cadeia.length }, () => ""));
  }

  return {
    id: o.id,
    fornecedorId: o.fornecedorId,
    produtoId: o.produtoId,
    produtoDescricao: o.produtoDescricao ?? "",
    unidadeNegociada: o.unidadeNegociada,
    pedidoMinimo: o.pedidoMinimo ?? 0,
    prazoEntregaDias: o.prazoEntregaDias ?? 0,
    prazoPagamentoDias: o.prazoPagamentoDias ?? 0,
    preco: o.preco ?? 0,
    ibs: o.ibs ?? 0,
    cbs: o.cbs ?? 0,
    is: o.is ?? 0,
    frete: o.frete ?? 0,
    cadeia,
    flagsItem: o.flagsItem ?? { cesta: false, reducao: false },
    isRefeicaoPronta: o.isRefeicaoPronta ?? false,
    explanation: o.explanation,
    priceBreaks: o.priceBreaks,
    freightBreaks: o.freightBreaks,
    yield: o.yield,
    conversoes: o.conversoes,
    ativa: o.ativa ?? true,
  };
}

/** 
 * Junta fornecedoresCadastro + ofertas para criar Supplier[] (compatibilidade)
 * Cada oferta gera um Supplier com os dados do fornecedor + dados da oferta
 */
function joinFornecedoresOfertas(
  fornecedoresCadastro: Fornecedor[],
  ofertas: OfertaFornecedor[]
): Supplier[] {
  const fornecedorMap = new Map(fornecedoresCadastro.map(f => [f.id, f]));

  return ofertas.map(oferta => {
    const fornecedor = fornecedorMap.get(oferta.fornecedorId);
    if (!fornecedor) {
      // Oferta órfã - criar supplier mínimo
      return {
        id: oferta.id,
        nome: `[Fornecedor não encontrado]`,
        tipo: "distribuidor" as SupplierTipo,
        regime: "normal" as SupplierRegime,
        uf: "",
        ativo: false,
        produtoId: oferta.produtoId,
        produtoDescricao: oferta.produtoDescricao,
        unidadeNegociada: oferta.unidadeNegociada,
        pedidoMinimo: oferta.pedidoMinimo,
        prazoEntregaDias: oferta.prazoEntregaDias,
        prazoPagamentoDias: oferta.prazoPagamentoDias,
        preco: oferta.preco,
        ibs: oferta.ibs,
        cbs: oferta.cbs,
        is: oferta.is,
        frete: oferta.frete,
        cadeia: oferta.cadeia,
        flagsItem: oferta.flagsItem,
        isRefeicaoPronta: oferta.isRefeicaoPronta,
        explanation: oferta.explanation,
        priceBreaks: oferta.priceBreaks,
        freightBreaks: oferta.freightBreaks,
        yield: oferta.yield,
        conversoes: oferta.conversoes,
      };
    }

    return {
      // ID da oferta (para identificação única no resultado)
      id: oferta.id,
      // Dados cadastrais do fornecedor
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj,
      tipo: fornecedor.tipo,
      regime: fornecedor.regime,
      uf: fornecedor.uf,
      municipio: fornecedor.municipio,
      contato: fornecedor.contato,
      ativo: fornecedor.ativo && oferta.ativa,
      // Dados da oferta
      produtoId: oferta.produtoId,
      produtoDescricao: oferta.produtoDescricao,
      unidadeNegociada: oferta.unidadeNegociada,
      pedidoMinimo: oferta.pedidoMinimo,
      prazoEntregaDias: oferta.prazoEntregaDias,
      prazoPagamentoDias: oferta.prazoPagamentoDias,
      preco: oferta.preco,
      ibs: oferta.ibs,
      cbs: oferta.cbs,
      is: oferta.is,
      frete: oferta.frete,
      cadeia: oferta.cadeia,
      flagsItem: oferta.flagsItem,
      isRefeicaoPronta: oferta.isRefeicaoPronta,
      explanation: oferta.explanation,
      priceBreaks: oferta.priceBreaks,
      freightBreaks: oferta.freightBreaks,
      yield: oferta.yield,
      conversoes: oferta.conversoes,
    };
  });
}

/**
 * Migra um Supplier legado para Fornecedor + OfertaFornecedor
 */
function migrateSupplierToNewFormat(supplier: Supplier): { fornecedor: Fornecedor; oferta: OfertaFornecedor } {
  const fornecedorId = generateId("fornecedor");
  const ofertaId = supplier.id; // Manter ID original na oferta para compatibilidade

  const fornecedor: Fornecedor = {
    id: fornecedorId,
    nome: supplier.nome,
    cnpj: supplier.cnpj,
    tipo: supplier.tipo,
    regime: supplier.regime,
    uf: supplier.uf,
    municipio: supplier.municipio,
    contato: supplier.contato,
    ativo: supplier.ativo,
  };

  const oferta: OfertaFornecedor = {
    id: ofertaId,
    fornecedorId,
    produtoId: supplier.produtoId ?? "",
    produtoDescricao: supplier.produtoDescricao,
    unidadeNegociada: supplier.unidadeNegociada,
    pedidoMinimo: supplier.pedidoMinimo,
    prazoEntregaDias: supplier.prazoEntregaDias,
    prazoPagamentoDias: supplier.prazoPagamentoDias,
    preco: supplier.preco,
    ibs: supplier.ibs,
    cbs: supplier.cbs,
    is: supplier.is,
    frete: supplier.frete,
    cadeia: supplier.cadeia,
    flagsItem: supplier.flagsItem,
    isRefeicaoPronta: supplier.isRefeicaoPronta,
    explanation: supplier.explanation,
    priceBreaks: supplier.priceBreaks,
    freightBreaks: supplier.freightBreaks,
    yield: supplier.yield,
    conversoes: supplier.conversoes,
    ativa: supplier.ativo,
  };

  return { fornecedor, oferta };
}

export const createEmptySupplier = (context?: Partial<Contexto>): Supplier => ({
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

export const createEmptyFornecedor = (context?: Partial<Contexto>): Fornecedor => ({
  id: generateId("fornecedor"),
  nome: "",
  cnpj: "",
  tipo: "distribuidor",
  regime: context?.regime ?? "normal",
  uf: (context?.uf ?? "").toUpperCase(),
  municipio: context?.municipio ?? "",
  contato: undefined,
  ativo: true,
});

export const createEmptyOferta = (fornecedorId: string, context?: Partial<Contexto>): OfertaFornecedor => ({
  id: generateId("oferta"),
  fornecedorId,
  produtoId: "",
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
  cadeia: Array.from({ length: supplyChainLength }, () => ""),
  flagsItem: { cesta: false, reducao: false },
  isRefeicaoPronta: false,
  ativa: true,
});

// ============= Build Resultado =============

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

  const unidadesState = useUnidadesStore.getState();

  const ajustes = new Map<
    string,
    { preco: number; frete: number; custoNormalizado?: number }
  >();

  for (const fornecedor of ativos) {
    const { preco, frete } = resolveSupplierPrice(1, fornecedor);
    let custoNormalizado: number | undefined;

    const hasPriceBreaks = fornecedor.priceBreaks && fornecedor.priceBreaks.length > 0;
    const hasYield = fornecedor.yield;
    const hasConversoes = fornecedor.conversoes && fornecedor.conversoes.length > 0;

    if (hasPriceBreaks || hasYield || hasConversoes) {
      const conversoesCombinadas = [
        ...unidadesState.conversoes,
        ...(fornecedor.conversoes ?? []),
      ];

      const unidadeFornecedor = fornecedor.unidadeNegociada ?? 'un';
      const yieldConfig = fornecedor.yield ??
        unidadesState.findYield(fornecedor.produtoId, unidadeFornecedor);

      if (preco > 0) {
        try {
          const normalizado = normalizeOffer(
            preco,
            [1],
            unidadeFornecedor,
            yieldConfig?.saida ?? unidadeFornecedor,
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

/** @deprecated Use applyFornecedorCadastroDefaults + applyOfertaDefaults */
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

// ============= Store =============

export const useCotacaoStore = create<CotacaoStore>()(
  persist(
    (set, get) => ({
      contexto: initialContexto,
      fornecedoresCadastro: [],
      ofertas: [],
      fornecedores: [], // Computado
      resultado: { itens: [] },
      constraints: [],
      prefs: initialPrefs,
      ultimaOtimizacao: null,
      isCalculating: false,

      setContexto: (ctx) =>
        set((state) => {
          const next = { ...state.contexto, ...ctx };
          if (next.uf) {
            next.uf = next.uf.toUpperCase();
          }
          return { contexto: next };
        }),

      setConstraints: (constraints) =>
        set((state) => ({
          constraints,
          prefs: { ...state.prefs, constraints },
        })),

      setPrefs: (prefs) =>
        set((state) => ({ prefs: { ...state.prefs, ...prefs, constraints: state.constraints } })),

      // ============= Novos métodos =============

      upsertFornecedorCadastro: (fornecedor) => {
        const id = fornecedor.id ?? generateId("fornecedor");
        set((state) => {
          const exists = state.fornecedoresCadastro.some((f) => f.id === id);
          const fornecedoresCadastro = exists
            ? state.fornecedoresCadastro.map((f) =>
              f.id === id ? applyFornecedorCadastroDefaults({ ...f, ...fornecedor, id }) : f
            )
            : [...state.fornecedoresCadastro, applyFornecedorCadastroDefaults({ ...fornecedor, id })];

          const fornecedores = joinFornecedoresOfertas(fornecedoresCadastro, state.ofertas);
          return { fornecedoresCadastro, fornecedores };
        });
        return id;
      },

      removeFornecedorCadastro: (id) =>
        set((state) => {
          const fornecedoresCadastro = state.fornecedoresCadastro.filter((f) => f.id !== id);
          // Também remove ofertas órfãs
          const ofertas = state.ofertas.filter((o) => o.fornecedorId !== id);
          const fornecedores = joinFornecedoresOfertas(fornecedoresCadastro, ofertas);
          return { fornecedoresCadastro, ofertas, fornecedores };
        }),

      upsertOferta: (oferta) => {
        const id = oferta.id ?? generateId("oferta");
        set((state) => {
          const exists = state.ofertas.some((o) => o.id === id);
          const ofertas = exists
            ? state.ofertas.map((o) =>
              o.id === id
                ? applyOfertaDefaults({ ...o, ...oferta, id, fornecedorId: oferta.fornecedorId, produtoId: oferta.produtoId })
                : o
            )
            : [...state.ofertas, applyOfertaDefaults({ ...oferta, id, fornecedorId: oferta.fornecedorId, produtoId: oferta.produtoId })];

          const fornecedores = joinFornecedoresOfertas(state.fornecedoresCadastro, ofertas);
          return { ofertas, fornecedores };
        });
        return id;
      },

      removeOferta: (id) =>
        set((state) => {
          const ofertas = state.ofertas.filter((o) => o.id !== id);
          const fornecedores = joinFornecedoresOfertas(state.fornecedoresCadastro, ofertas);
          return { ofertas, fornecedores };
        }),

      getOfertasByFornecedor: (fornecedorId) => {
        return get().ofertas.filter((o) => o.fornecedorId === fornecedorId);
      },

      // ============= Métodos legados (compatibilidade) =============
      // Estes métodos atualizam as estruturas novas (fornecedoresCadastro + ofertas)
      // e recomputam fornecedores para manter compatibilidade

      upsertFornecedor: (supplierData) =>
        set((state) => {
          const supplierId = supplierData.id ?? generateId("oferta");

          // Procura oferta existente pelo ID
          const existingOferta = state.ofertas.find((o) => o.id === supplierId);

          if (existingOferta) {
            // Atualiza oferta existente
            const fornecedor = state.fornecedoresCadastro.find(f => f.id === existingOferta.fornecedorId);

            // Atualiza dados do fornecedor se houver campos cadastrais
            let fornecedoresCadastro = state.fornecedoresCadastro;
            if (fornecedor && (supplierData.nome || supplierData.cnpj || supplierData.tipo ||
              supplierData.regime || supplierData.uf || supplierData.municipio || supplierData.contato)) {
              fornecedoresCadastro = state.fornecedoresCadastro.map(f =>
                f.id === fornecedor.id
                  ? applyFornecedorCadastroDefaults({
                    ...f,
                    nome: supplierData.nome ?? f.nome,
                    cnpj: supplierData.cnpj ?? f.cnpj,
                    tipo: supplierData.tipo ?? f.tipo,
                    regime: supplierData.regime ?? f.regime,
                    uf: supplierData.uf ?? f.uf,
                    municipio: supplierData.municipio ?? f.municipio,
                    contato: supplierData.contato ?? f.contato,
                    ativo: supplierData.ativo ?? f.ativo,
                  })
                  : f
              );
            }

            // Atualiza oferta
            const ofertas = state.ofertas.map(o =>
              o.id === supplierId
                ? applyOfertaDefaults({
                  ...o,
                  produtoId: supplierData.produtoId ?? o.produtoId,
                  produtoDescricao: supplierData.produtoDescricao ?? o.produtoDescricao,
                  unidadeNegociada: supplierData.unidadeNegociada ?? o.unidadeNegociada,
                  pedidoMinimo: supplierData.pedidoMinimo ?? o.pedidoMinimo,
                  prazoEntregaDias: supplierData.prazoEntregaDias ?? o.prazoEntregaDias,
                  prazoPagamentoDias: supplierData.prazoPagamentoDias ?? o.prazoPagamentoDias,
                  preco: supplierData.preco ?? o.preco,
                  ibs: supplierData.ibs ?? o.ibs,
                  cbs: supplierData.cbs ?? o.cbs,
                  is: supplierData.is ?? o.is,
                  frete: supplierData.frete ?? o.frete,
                  cadeia: supplierData.cadeia ?? o.cadeia,
                  flagsItem: supplierData.flagsItem ?? o.flagsItem,
                  isRefeicaoPronta: supplierData.isRefeicaoPronta ?? o.isRefeicaoPronta,
                  explanation: supplierData.explanation ?? o.explanation,
                  priceBreaks: supplierData.priceBreaks ?? o.priceBreaks,
                  freightBreaks: supplierData.freightBreaks ?? o.freightBreaks,
                  yield: supplierData.yield ?? o.yield,
                  conversoes: supplierData.conversoes ?? o.conversoes,
                  ativa: supplierData.ativo ?? o.ativa,
                })
                : o
            );

            const fornecedores = joinFornecedoresOfertas(fornecedoresCadastro, ofertas);
            return { fornecedoresCadastro, ofertas, fornecedores };
          } else {
            // Cria novo fornecedor + oferta
            const fornecedorId = generateId("fornecedor");

            const novoFornecedor = applyFornecedorCadastroDefaults({
              id: fornecedorId,
              nome: supplierData.nome ?? "",
              cnpj: supplierData.cnpj,
              tipo: supplierData.tipo ?? "distribuidor",
              regime: supplierData.regime ?? "normal",
              uf: supplierData.uf ?? "",
              municipio: supplierData.municipio,
              contato: supplierData.contato,
              ativo: supplierData.ativo ?? true,
            });

            const novaOferta = applyOfertaDefaults({
              id: supplierId,
              fornecedorId,
              produtoId: supplierData.produtoId ?? "",
              produtoDescricao: supplierData.produtoDescricao,
              unidadeNegociada: supplierData.unidadeNegociada,
              pedidoMinimo: supplierData.pedidoMinimo,
              prazoEntregaDias: supplierData.prazoEntregaDias,
              prazoPagamentoDias: supplierData.prazoPagamentoDias,
              preco: supplierData.preco ?? 0,
              ibs: supplierData.ibs ?? 0,
              cbs: supplierData.cbs ?? 0,
              is: supplierData.is ?? 0,
              frete: supplierData.frete ?? 0,
              cadeia: supplierData.cadeia,
              flagsItem: supplierData.flagsItem,
              isRefeicaoPronta: supplierData.isRefeicaoPronta,
              explanation: supplierData.explanation,
              priceBreaks: supplierData.priceBreaks,
              freightBreaks: supplierData.freightBreaks,
              yield: supplierData.yield,
              conversoes: supplierData.conversoes,
              ativa: supplierData.ativo ?? true,
            });

            const fornecedoresCadastro = [...state.fornecedoresCadastro, novoFornecedor];
            const ofertas = [...state.ofertas, novaOferta];
            const fornecedores = joinFornecedoresOfertas(fornecedoresCadastro, ofertas);

            return { fornecedoresCadastro, ofertas, fornecedores };
          }
        }),

      removeFornecedor: (id) =>
        set((state) => {
          // Remove a oferta com o ID especificado
          const ofertaToRemove = state.ofertas.find(o => o.id === id);
          const ofertas = state.ofertas.filter((o) => o.id !== id);

          // Se o fornecedor não tem mais ofertas, remove ele também
          let fornecedoresCadastro = state.fornecedoresCadastro;
          if (ofertaToRemove) {
            const hasOtherOfertas = ofertas.some(o => o.fornecedorId === ofertaToRemove.fornecedorId);
            if (!hasOtherOfertas) {
              fornecedoresCadastro = state.fornecedoresCadastro.filter(
                f => f.id !== ofertaToRemove.fornecedorId
              );
            }
          }

          const fornecedores = joinFornecedoresOfertas(fornecedoresCadastro, ofertas);
          return { fornecedoresCadastro, ofertas, fornecedores };
        }),

      limpar: () =>
        set({
          contexto: initialContexto,
          fornecedoresCadastro: [],
          ofertas: [],
          fornecedores: [],
          resultado: { itens: [] },
          constraints: [],
          prefs: initialPrefs,
          ultimaOtimizacao: null,
        }),

      importarCSV: (csv) => {
        const fornecedoresImportados = readFornecedoresCSV(csv);
        if (fornecedoresImportados.length === 0) {
          console.warn("[cotacao] Nenhum fornecedor valido encontrado no CSV.");
          return;
        }

        set((state) => {
          const fornecedoresCadastro = [...state.fornecedoresCadastro];
          const ofertas = [...state.ofertas];

          // Mapa para agrupar por nome+tipo+regime (encontrar fornecedor existente)
          const fornecedorMap = new Map(
            fornecedoresCadastro.map(f => [`${f.nome.toLowerCase()}|${f.tipo}|${f.regime}`, f])
          );

          for (const supplierImportado of fornecedoresImportados) {
            const key = `${supplierImportado.nome.toLowerCase()}|${supplierImportado.tipo}|${supplierImportado.regime}`;
            let fornecedorExistente = fornecedorMap.get(key);

            if (!fornecedorExistente) {
              // Criar novo fornecedor
              const novoFornecedor = applyFornecedorCadastroDefaults({
                id: generateId("fornecedor"),
                nome: supplierImportado.nome,
                cnpj: supplierImportado.cnpj,
                tipo: supplierImportado.tipo,
                regime: supplierImportado.regime,
                uf: supplierImportado.uf,
                municipio: supplierImportado.municipio,
                contato: supplierImportado.contato,
                ativo: supplierImportado.ativo,
              });
              fornecedoresCadastro.push(novoFornecedor);
              fornecedorMap.set(key, novoFornecedor);
              fornecedorExistente = novoFornecedor;
            }

            // Criar oferta
            const novaOferta = applyOfertaDefaults({
              id: supplierImportado.id ?? generateId("oferta"),
              fornecedorId: fornecedorExistente.id,
              produtoId: supplierImportado.produtoId ?? "",
              produtoDescricao: supplierImportado.produtoDescricao,
              unidadeNegociada: supplierImportado.unidadeNegociada,
              pedidoMinimo: supplierImportado.pedidoMinimo,
              prazoEntregaDias: supplierImportado.prazoEntregaDias,
              prazoPagamentoDias: supplierImportado.prazoPagamentoDias,
              preco: supplierImportado.preco,
              ibs: supplierImportado.ibs,
              cbs: supplierImportado.cbs,
              is: supplierImportado.is,
              frete: supplierImportado.frete,
              cadeia: supplierImportado.cadeia,
              flagsItem: supplierImportado.flagsItem,
              isRefeicaoPronta: supplierImportado.isRefeicaoPronta,
              priceBreaks: supplierImportado.priceBreaks,
              freightBreaks: supplierImportado.freightBreaks,
              yield: supplierImportado.yield,
              conversoes: supplierImportado.conversoes,
              ativa: supplierImportado.ativo ?? true,
            });
            ofertas.push(novaOferta);
          }

          const fornecedores = joinFornecedoresOfertas(fornecedoresCadastro, ofertas);
          return { fornecedoresCadastro, ofertas, fornecedores };
        });
        get().calcular();
      },

      exportarCSV: () => writeFornecedoresCSV(get().fornecedores),

      importarJSON: (json) => {
        const data = JSON.parse(json) as Partial<{
          contexto: Contexto;
          fornecedores: Supplier[];
          fornecedoresCadastro: Fornecedor[];
          ofertas: OfertaFornecedor[];
          resultado: MixResultado;
          constraints: SupplierConstraints[];
          prefs: OptimizePrefs;
        }>;

        set((state) => {
          // Se tiver dados no novo formato, usa direto
          if (data.fornecedoresCadastro && data.ofertas) {
            const fornecedoresCadastro = data.fornecedoresCadastro.map(f =>
              applyFornecedorCadastroDefaults({ ...f, id: f.id ?? generateId("fornecedor") })
            );
            const ofertas = data.ofertas.map(o =>
              applyOfertaDefaults({ ...o, id: o.id ?? generateId("oferta"), fornecedorId: o.fornecedorId, produtoId: o.produtoId })
            );
            const fornecedores = joinFornecedoresOfertas(fornecedoresCadastro, ofertas);

            return {
              contexto: data.contexto
                ? { ...initialContexto, ...data.contexto, uf: (data.contexto.uf ?? "").toUpperCase() }
                : initialContexto,
              fornecedoresCadastro,
              ofertas,
              fornecedores,
              resultado: data.resultado ?? { itens: [] },
              ultimaOtimizacao: null,
              constraints: data.constraints ?? [],
              prefs: data.prefs ?? { ...initialPrefs, constraints: data.constraints ?? [] },
            };
          }

          // Fallback: formato legado
          const fornecedoresLegacy = data.fornecedores
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
            : state.fornecedores;

          return {
            contexto: data.contexto
              ? { ...initialContexto, ...data.contexto, uf: (data.contexto.uf ?? "").toUpperCase() }
              : initialContexto,
            fornecedores: fornecedoresLegacy,
            resultado: data.resultado ?? { itens: [] },
            ultimaOtimizacao: null,
            constraints: data.constraints ?? [],
            prefs: data.prefs ?? { ...initialPrefs, constraints: data.constraints ?? [] },
          };
        });
        get().calcular();
      },

      exportarJSON: () => {
        const { contexto, fornecedoresCadastro, ofertas, fornecedores, resultado, constraints, prefs } = get();
        return JSON.stringify({
          contexto,
          fornecedoresCadastro,
          ofertas,
          fornecedores, // Inclui para compatibilidade
          resultado,
          constraints,
          prefs
        });
      },

      calcular: async () => {
        set({ isCalculating: true });
        try {
          await get().enrichSuppliersWithTaxes();
          set((state) => {
            const scenario = useAppStore.getState().scenario;
            const resultado = buildResultado({
              fornecedores: state.fornecedores,
              contexto: state.contexto,
              scenario,
            });
            return { resultado, ultimaOtimizacao: null };
          });
        } finally {
          set({ isCalculating: false });
        }
      },

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

      computeResultado: (scenarioOverride, contextOverride) => {
        const scenario = scenarioOverride ?? useAppStore.getState().scenario;
        const contexto = contextOverride ? { ...get().contexto, ...contextOverride } : get().contexto;
        return buildResultado({
          fornecedores: get().fornecedores,
          contexto,
          scenario,
        });
      },

      enrichSuppliersWithTaxes: async () => {
        const { ofertas, fornecedoresCadastro, contexto } = get();

        // Atualiza as ofertas com dados de impostos
        const updatedOfertas = await Promise.all(
          ofertas.map(async (oferta) => {
            if (!oferta.ativa) return oferta;

            // Check if tax is already calculated (cache hit)
            // We assume cost 0 is not valid, but if taxes are 0 it might be valid (isencao).
            // Better check: if we have IBS/CBS/IS data (or if they are explicitly 0 from a previous calc).
            // Simple heuristic: if explanation is present, it was likely calculated.
            if (oferta.explanation && (oferta.ibs !== 0 || oferta.cbs !== 0 || oferta.is !== 0)) {
              return oferta;
            }

            // Encontra o fornecedor para pegar a UF
            const fornecedor = fornecedoresCadastro.find(f => f.id === oferta.fornecedorId);
            if (!fornecedor) return oferta;

            const result = await TaxApiClient.calculateTax(
              oferta.flagsItem?.ncm || "0000.00.00",
              fornecedor.uf,
              contexto.uf,
              oferta.preco
            );

            if (result) {
              return {
                ...oferta,
                ibs: result.rates.ibs,
                cbs: result.rates.cbs,
                is: result.rates.is,
                explanation: result.explanation
              };
            }
            return oferta;
          })
        );

        const fornecedores = joinFornecedoresOfertas(fornecedoresCadastro, updatedOfertas);
        set({ ofertas: updatedOfertas, fornecedores });
      },
    }),
    {
      name: "cmx_v05_cotacao",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        contexto: state.contexto,
        fornecedoresCadastro: state.fornecedoresCadastro,
        ofertas: state.ofertas,
        fornecedores: state.fornecedores, // Manter para compatibilidade
        constraints: state.constraints,
        prefs: state.prefs,
      }),
      version: 2,
      migrate: (persistedState, version) => {
        if (!persistedState) {
          return persistedState;
        }

        const state = persistedState as {
          contexto?: Partial<Contexto>;
          fornecedores?: Supplier[];
          fornecedoresCadastro?: Fornecedor[];
          ofertas?: OfertaFornecedor[];
          constraints?: SupplierConstraints[];
          prefs?: OptimizePrefs;
        };

        // Migração v0/v1 -> v2: converter fornecedores legado para novo formato
        if (version < 2) {
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

          // Se já tem novo formato, usar
          if (state.fornecedoresCadastro && state.ofertas) {
            return {
              contexto: contextoMigrado,
              fornecedoresCadastro: state.fornecedoresCadastro,
              ofertas: state.ofertas,
              fornecedores: joinFornecedoresOfertas(state.fornecedoresCadastro, state.ofertas),
              constraints: state.constraints ?? [],
              prefs: state.prefs ?? initialPrefs,
            };
          }

          // Migrar formato legado
          const fornecedoresLegado = state.fornecedores ?? [];
          const fornecedoresCadastro: Fornecedor[] = [];
          const ofertas: OfertaFornecedor[] = [];

          // Agrupar por nome+cnpj para evitar duplicatas de fornecedor
          const fornecedorMap = new Map<string, Fornecedor>();

          for (const supplier of fornecedoresLegado) {
            const key = `${supplier.nome.toLowerCase()}|${supplier.cnpj ?? ""}`;

            if (!fornecedorMap.has(key)) {
              const { fornecedor, oferta } = migrateSupplierToNewFormat(supplier);
              fornecedorMap.set(key, fornecedor);
              ofertas.push(oferta);
            } else {
              // Fornecedor já existe, criar só a oferta
              const fornecedorExistente = fornecedorMap.get(key)!;
              const oferta: OfertaFornecedor = {
                id: supplier.id,
                fornecedorId: fornecedorExistente.id,
                produtoId: supplier.produtoId ?? "",
                produtoDescricao: supplier.produtoDescricao,
                unidadeNegociada: supplier.unidadeNegociada,
                pedidoMinimo: supplier.pedidoMinimo,
                prazoEntregaDias: supplier.prazoEntregaDias,
                prazoPagamentoDias: supplier.prazoPagamentoDias,
                preco: supplier.preco,
                ibs: supplier.ibs,
                cbs: supplier.cbs,
                is: supplier.is,
                frete: supplier.frete,
                cadeia: supplier.cadeia,
                flagsItem: supplier.flagsItem,
                isRefeicaoPronta: supplier.isRefeicaoPronta,
                explanation: supplier.explanation,
                priceBreaks: supplier.priceBreaks,
                freightBreaks: supplier.freightBreaks,
                yield: supplier.yield,
                conversoes: supplier.conversoes,
                ativa: supplier.ativo,
              };
              ofertas.push(oferta);
            }
          }

          fornecedoresCadastro.push(...fornecedorMap.values());

          return {
            contexto: contextoMigrado,
            fornecedoresCadastro,
            ofertas,
            fornecedores: joinFornecedoresOfertas(fornecedoresCadastro, ofertas),
            constraints: state.constraints ?? [],
            prefs: state.prefs ?? initialPrefs,
          };
        }

        return persistedState;
      },
    },
  ),
);
