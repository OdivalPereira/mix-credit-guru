import type { Supplier, PriceBreak, FreightBreak } from "@/types/domain";

interface PriceSource {
  precoBase: number;
  priceBreaks?: PriceBreak[];
  freightBreaks?: FreightBreak[];
}

/**
 * @description Resolve o preço unitário e o frete para uma determinada quantidade com base nas regras de preço.
 * Seleciona a maior quebra de preço e quebra de frete aplicável.
 * @param qtdDesejada A quantidade desejada para o cálculo do preço.
 * @param source Fonte dos preços (Supplier ou objeto com priceBreaks/freightBreaks).
 * @returns Um objeto com o preço e frete resolvidos.
 */
export function resolveUnitPrice(
  qtdDesejada: number,
  source: PriceSource
): { preco: number; frete: number } {
  let preco = source.precoBase;
  let bestQtd = 0;
  for (const pb of source.priceBreaks ?? []) {
    if (qtdDesejada >= pb.quantidade && pb.quantidade >= bestQtd) {
      preco = pb.preco;
      bestQtd = pb.quantidade;
    }
  }

  let frete = 0;
  let bestFreteQtd = 0;
  for (const fb of source.freightBreaks ?? []) {
    if (qtdDesejada >= fb.quantidade && fb.quantidade >= bestFreteQtd) {
      frete = fb.frete;
      bestFreteQtd = fb.quantidade;
    }
  }

  return { preco, frete };
}

/**
 * @description Resolve preço e frete diretamente de um Supplier com condições comerciais.
 */
export function resolveSupplierPrice(
  qtdDesejada: number,
  supplier: Supplier
): { preco: number; frete: number } {
  const hasPriceBreaks = supplier.priceBreaks && supplier.priceBreaks.length > 0;
  const hasFreightBreaks = supplier.freightBreaks && supplier.freightBreaks.length > 0;

  if (!hasPriceBreaks && !hasFreightBreaks) {
    return { preco: supplier.preco, frete: supplier.frete };
  }

  return resolveUnitPrice(qtdDesejada, {
    precoBase: supplier.preco,
    priceBreaks: supplier.priceBreaks,
    freightBreaks: supplier.freightBreaks,
  });
}

