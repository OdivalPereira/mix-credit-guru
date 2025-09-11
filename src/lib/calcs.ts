import type { Supplier } from "@/types/domain";
import { computeCredit } from "./credit";

export function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

export function computeTaxes(
  preco: number,
  ibs: number,
  cbs: number,
  is: number
): number {
  return preco * (ibs + cbs + is) / 100;
}

export function computeEffectiveCost(
  preco: number,
  frete: number,
  ibs: number,
  cbs: number,
  is: number,
  credito: number
): number {
  const taxes = computeTaxes(preco, ibs, cbs, is);
  return round(preco + frete + taxes - credito);
}

interface RankContext {
  destino: string;
  regime: string;
}

export function rankSuppliers(
  suppliers: Supplier[],
  ctx: RankContext
): Supplier[] {
  const calculated = suppliers.map((s) => {
    const credit = computeCredit(ctx.destino, ctx.regime, s.preco, s.ibs, s.cbs);
    const custoEfetivo = computeEffectiveCost(
      s.preco,
      s.frete,
      s.ibs,
      s.cbs,
      s.is,
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

