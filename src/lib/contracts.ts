import type { ContractFornecedor } from "@/types/domain";

/**
 * @description Resolve o preço unitário e o frete para uma determinada quantidade com base nas regras do contrato.
 * Seleciona a maior quebra de preço e quebra de frete aplicável.
 * @param qtdDesejada A quantidade desejada para o cálculo do preço.
 * @param contract O contrato do fornecedor contendo as regras de preços.
 * @returns Um objeto com o preço e frete resolvidos.
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

