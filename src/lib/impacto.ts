import type { Produto, AliquotasConfig } from "@/types/domain";
import { computeRates } from "./rates";
import { computeCredit } from "./credit";
import { computeTaxes } from "./calcs";

export interface ProdutoAnalise {
  produtoId: string;
  descricao: string;
  ncm: string;
  quantidade: number;
  unidade: string;
  precoMedio: number;
  custoAntes: number;
  custoDepois: number;
  diferenca: number;
  percentual: number;
  detalhesAntes: {
    icms: number;
    pisCofins: number;
    totalImpostos: number;
  };
  detalhesDepois: {
    ibs: number;
    cbs: number;
    is: number;
    credito: number;
    totalImpostos: number;
  };
}

interface ImpactoContext {
  uf: string;
  municipio?: string;
  regime: string;
  destino: string;
  date: string | Date;
  precoMedio?: number;
}

/**
 * Calcula custo no sistema ANTES da reforma (ICMS + PIS/COFINS)
 */
export function computeCustoAntes(
  preco: number,
  uf: string,
  regime: string
): { custo: number; icms: number; pisCofins: number } {
  // Alíquotas médias do sistema atual (2024/2025)
  const aliquotasICMS: Record<string, number> = {
    AC: 17, AL: 18, AM: 18, AP: 18, BA: 18, CE: 18,
    DF: 18, ES: 17, GO: 17, MA: 18, MG: 18, MS: 17,
    MT: 17, PA: 17, PB: 18, PE: 18, PI: 18, PR: 18,
    RJ: 18, RN: 18, RO: 17.5, RR: 17, RS: 18, SC: 17,
    SE: 18, SP: 18, TO: 18,
  };

  const icmsRate = aliquotasICMS[uf] || 17;
  const pisCofinsRate = regime === "simples" ? 3.65 : 9.25;

  const icms = (preco * icmsRate) / 100;
  const pisCofins = (preco * pisCofinsRate) / 100;
  const custo = preco + icms + pisCofins;

  return { custo, icms, pisCofins };
}

/**
 * Calcula custo no sistema DEPOIS da reforma (IBS + CBS - crédito)
 */
export function computeCustoDepois(
  preco: number,
  rates: AliquotasConfig,
  credito: number
): { custo: number; impostos: number } {
  const impostos = computeTaxes(preco, rates);
  const custo = preco + impostos - credito;
  return { custo, impostos };
}

/**
 * Analisa o impacto da reforma para um produto
 */
export function analisarImpactoProduto(
  produto: Produto,
  quantidade: number,
  ctx: ImpactoContext
): ProdutoAnalise {
  const precoMedio = ctx.precoMedio || 100;
  
  // Calcular ANTES
  const { custo: custoUnitAntes, icms, pisCofins } = computeCustoAntes(
    precoMedio,
    ctx.uf,
    ctx.regime
  );

  // Calcular DEPOIS - usando scenario padrão "default"
  const rates = computeRates("default", ctx.date, {
    uf: ctx.uf,
    municipio: ctx.municipio,
    itemId: produto.id,
    flagsItem: {
      ncm: produto.ncm,
      reducao: produto.flags?.reducao,
      cesta: produto.flags?.cesta,
    },
  });

  const credit = computeCredit(
    ctx.destino,
    ctx.regime,
    precoMedio,
    rates.ibs,
    rates.cbs,
    {
      isRefeicaoPronta: produto.flags?.refeicao,
    }
  );

  const { custo: custoUnitDepois, impostos: totalImpostosDepois } =
    computeCustoDepois(precoMedio, rates, credit.credito);

  // Totais considerando quantidade
  const custoAntes = custoUnitAntes * quantidade;
  const custoDepois = custoUnitDepois * quantidade;
  const diferenca = custoDepois - custoAntes;
  const percentual = custoAntes > 0 ? (diferenca / custoAntes) * 100 : 0;

  return {
    produtoId: produto.id,
    descricao: produto.descricao,
    ncm: produto.ncm,
    quantidade,
    unidade: produto.unidadePadrao,
    precoMedio,
    custoAntes,
    custoDepois,
    diferenca,
    percentual,
    detalhesAntes: {
      icms,
      pisCofins,
      totalImpostos: icms + pisCofins,
    },
    detalhesDepois: {
      ibs: rates.ibs,
      cbs: rates.cbs,
      is: rates.is,
      credito: credit.credito,
      totalImpostos: totalImpostosDepois,
    },
  };
}

/**
 * Calcula totalizadores para uma lista de análises
 */
export function calcularTotais(analises: ProdutoAnalise[]) {
  const totalAntes = analises.reduce((sum, a) => sum + a.custoAntes, 0);
  const totalDepois = analises.reduce((sum, a) => sum + a.custoDepois, 0);
  const diferenca = totalDepois - totalAntes;
  const percentual = totalAntes > 0 ? (diferenca / totalAntes) * 100 : 0;

  return { totalAntes, totalDepois, diferenca, percentual };
}
