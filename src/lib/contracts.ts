import type { ContractFornecedor } from "@/types/domain";

/**
 * Resolve unit price and freight for a given quantity based on contract rules.
 * Selects the highest applicable price break and freight break.
 */
export function resolveUnitPrice(
  qtdDesejada: number,
  contract: ContractFornecedor
): { preco: number; frete: number } {
  let preco = contract.precoBase;
  let bestQtd = 0;
  for (const pb of contract.priceBreaks ?? []) {
    if (qtdDesejada >= pb.quantidade && pb.quantidade >= bestQtd) {
      preco = pb.preco;
      bestQtd = pb.quantidade;
    }
  }

  let frete = 0;
  let bestFreteQtd = 0;
  for (const fb of contract.freightBreaks ?? []) {
    if (qtdDesejada >= fb.quantidade && fb.quantidade >= bestFreteQtd) {
      frete = fb.frete;
      bestFreteQtd = fb.quantidade;
    }
  }

  return { preco, frete };
}

