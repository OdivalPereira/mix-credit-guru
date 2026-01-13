import type { Supplier, MixResultadoItem, AliquotasConfig } from "@/types/domain";
import { computeCredit } from "./credit";
import { computeRates } from "./rates";
import { memoize } from "./memoize";
import {
  ClassificacaoProduto,
  RegimeTributario,
  PRESUMIDO_ALIQUOTAS,
  REAL_ALIQUOTAS,
  ALIQUOTA_IBS_CBS_PADRAO
} from "./strategies/tax-2033-item";

/**
 * @description Arredonda um número para um número especificado de casas decimais.
 * @param value O número a ser arredondado.
 * @param digits O número de casas decimais para manter.
 * @returns O número arredondado.
 */
export function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

/**
 * @description Calcula os impostos totais (IBS, CBS, IS) para um determinado preço e alíquotas.
 * @param preco O preço do item.
 * @param aliquotas As alíquotas de imposto a serem aplicadas.
 * @returns O valor total do imposto.
 */
const computeTaxesInternal = (preco: number, aliquotas: AliquotasConfig): number => {
  const { ibs, cbs, is } = aliquotas;
  return preco * (ibs + cbs + is) / 100;
};

/**
 * @description Versão memoizada de `computeTaxesInternal` para otimizar os cálculos de impostos.
 */
export const computeTaxes = memoize(computeTaxesInternal, {
  getKey: (preco, aliquotas) =>
    `${preco}|${aliquotas.ibs}|${aliquotas.cbs}|${aliquotas.is}`,
  maxSize: 200,
});

/**
 * @description Calcula o custo efetivo de um item, incluindo preço, frete, impostos e créditos.
 * @param preco O preço do item.
 * @param frete O custo do frete.
 * @param aliquotas As alíquotas de imposto a serem aplicadas.
 * @param credito O valor do crédito fiscal.
 * @returns O custo efetivo calculado.
 */
const computeEffectiveCostInternal = (
  preco: number,
  frete: number,
  aliquotas: AliquotasConfig,
  credito: number,
): number => {
  const taxes = computeTaxes(preco, aliquotas);
  return round(preco + frete + taxes - credito);
};

/**
 * @description Versão memoizada de `computeEffectiveCostInternal` para otimizar o cálculo do custo efetivo.
 */
export const computeEffectiveCost = memoize(computeEffectiveCostInternal, {
  getKey: (preco, frete, aliquotas, credito) =>
    `${preco}|${frete}|${aliquotas.ibs}|${aliquotas.cbs}|${aliquotas.is}|${credito}`,
  maxSize: 200,
});

interface RankContext {
  destino: string;
  regime: string;
  scenario: string;
  date: string | Date;
  uf: string;
  municipio?: string;
}

/**
 * @description Classifica os fornecedores com base em seu custo efetivo, calculando impostos e créditos.
 * @param suppliers A lista de fornecedores a ser classificada.
 * @param ctx O contexto tributário e de cenário para o cálculo.
 * @returns Uma lista de fornecedores classificados com informações detalhadas sobre custos e impostos.
 */
const rankSuppliersInternal = (
  suppliers: Supplier[],
  ctx: RankContext,
): MixResultadoItem[] => {
  const calculated = suppliers.map((s) => {
    const rates = computeRates(ctx.scenario, ctx.date, {
      uf: ctx.uf,
      municipio: ctx.municipio,
      itemId: s.id,
      flagsItem: s.flagsItem,
    });

    // Use pre-calculated rates if available (from backend), otherwise use local calculation
    const effectiveRates = s.explanation
      ? { ibs: s.ibs, cbs: s.cbs, is: s.is }
      : rates;

    const credit = computeCredit(ctx.destino, ctx.regime, s.preco, effectiveRates.ibs, effectiveRates.cbs, {
      scenario: ctx.scenario,
      isRefeicaoPronta: s.isRefeicaoPronta,
    });
    const custoEfetivo = computeEffectiveCost(
      s.preco,
      s.frete,
      effectiveRates,
      credit.credito
    );

    return {
      ...s,
      ibs: effectiveRates.ibs,
      cbs: effectiveRates.cbs,
      is: effectiveRates.is,
      creditavel: credit.creditavel,
      credito: credit.credito,
      custoEfetivo,
    };
  });

  calculated.sort((a, b) => a.custoEfetivo - b.custoEfetivo);

  return calculated.map((s, index) => ({ ...s, ranking: index + 1 }));
};

export const rankSuppliers = memoize(rankSuppliersInternal, {
  getKey: (suppliers, ctx) => JSON.stringify({ suppliers, ctx }),
  maxSize: 20,
});

/**
 * @description Calcula os créditos tributários na entrada (compra) de um produto.
 */
export function calculateTaxCredits(
  purchaseValue: number,
  regime: RegimeTributario,
  classificacao?: ClassificacaoProduto
): { icms: number; pis: number; cofins: number; ibs: number; cbs: number; total: number } {
  let icms = 0;
  let pis = 0;
  let cofins = 0;
  let ibs = 0;
  let cbs = 0;

  const reducao = classificacao?.reducao_reforma ?? 0;
  const isMonofasico = classificacao?.setor === 'combustiveis' || classificacao?.setor === 'bebidas'; // Exemplo simplificado

  if (regime === 'reforma2033') {
    const aliquotaEfetiva = ALIQUOTA_IBS_CBS_PADRAO * (1 - reducao);
    // IBS é aprox 2/3 e CBS 1/3 do total de 25.5% (IBS 17 + CBS 8.5)
    ibs = purchaseValue * (aliquotaEfetiva * (17 / 25.5));
    cbs = purchaseValue * (aliquotaEfetiva * (8.5 / 25.5));
  } else if (regime === 'real') {
    icms = purchaseValue * REAL_ALIQUOTAS.icms_medio;
    if (!isMonofasico) {
      pis = purchaseValue * REAL_ALIQUOTAS.pis;
      cofins = purchaseValue * REAL_ALIQUOTAS.cofins;
    }
  } else if (regime === 'presumido') {
    icms = purchaseValue * PRESUMIDO_ALIQUOTAS.icms_medio;
    // No presumido geralmente não há crédito de PIS/COFINS (regime cumulativo)
  }

  return {
    icms: round(icms),
    pis: round(pis),
    cofins: round(cofins),
    ibs: round(ibs),
    cbs: round(cbs),
    total: round(icms + pis + cofins + ibs + cbs)
  };
}

/**
 * @description Calcula o preço de venda sugerido a partir de uma margem alvo sobre o custo líquido.
 */
export function calculatePriceFromMargin(
  netCost: number,
  targetMargin: number,
  regime: RegimeTributario,
  taxRules: {
    aliquotaVenda: number; // Somatória das alíquotas de saída (IBS+CBS ou Simples Efetiva)
  }
): { basePrice: number; taxes: number; finalPrice: number } {
  // Base de Preço = Custo Líquido / (1 - Margem%)
  const marginFactor = 1 - (targetMargin / 100);
  const basePrice = marginFactor > 0 ? netCost / marginFactor : netCost;

  // Impostos de Venda = Base de Preço * Alíquota
  const taxes = basePrice * taxRules.aliquotaVenda;

  // Preço Final = Base de Preço + Impostos
  const finalPrice = basePrice + taxes;

  return {
    basePrice: round(basePrice),
    taxes: round(taxes),
    finalPrice: round(finalPrice)
  };
}

