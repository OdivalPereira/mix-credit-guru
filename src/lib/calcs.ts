import type { Supplier, MixResultadoItem, AliquotasConfig } from "@/types/domain";
import { computeCredit } from "./credit";

export function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

export function computeTaxes(preco: number, aliquotas: AliquotasConfig): number {
  const { ibs, cbs, is } = aliquotas;
  return preco * (ibs + cbs + is) / 100;
}

export function computeEffectiveCost(
  preco: number,
  frete: number,
  aliquotas: AliquotasConfig,
  credito: number
): number {
  const taxes = computeTaxes(preco, aliquotas);
  return round(preco + frete + taxes - credito);
}

interface RankContext {
  destino: string;
  regime: string;
}

export function rankSuppliers(
  suppliers: Supplier[],
  ctx: RankContext
): MixResultadoItem[] {
  const calculated = suppliers.map((s) => {
    const credit = computeCredit(ctx.destino, ctx.regime, s.preco, s.ibs, s.cbs);
    const custoEfetivo = computeEffectiveCost(
      s.preco,
      s.frete,
      { ibs: s.ibs, cbs: s.cbs, is: s.is },
      credit.credito
    );

    return {
      ...s,
      creditavel: credit.creditavel,
      credito: credit.credito,
      custoEfetivo
    };
  });

  calculated.sort((a, b) => a.custoEfetivo - b.custoEfetivo);

  return calculated.map((s, index) => ({ ...s, ranking: index + 1 }));
}

