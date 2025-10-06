import { describe, it, expect } from 'vitest';
import { resolveUnitPrice } from '@/lib/contracts';
import type { ContractFornecedor } from '@/types/domain';

describe('resolveUnitPrice', () => {
  const contract: ContractFornecedor = {
    fornecedorId: 'f1',
    produtoId: 'p1',
    unidade: 'un',
    precoBase: 10,
    priceBreaks: [
      { quantidade: 20, preco: 8 },
      { quantidade: 10, preco: 9 },
    ],
    freightBreaks: [
      { quantidade: 20, frete: 1 },
      { quantidade: 5, frete: 2 },
    ],
  };

  it('usa preco base e frete zero abaixo do primeiro degrau', () => {
    const res = resolveUnitPrice(3, contract);
    expect(res.preco).toBe(10);
    expect(res.frete).toBe(0);
  });

  it('seleciona degraus corretos para quantidade intermediaria', () => {
    const res = resolveUnitPrice(15, contract);
    expect(res.preco).toBe(9);
    expect(res.frete).toBe(2);
  });

  it('seleciona maiores degraus aplicaveis', () => {
    const res = resolveUnitPrice(25, contract);
    expect(res.preco).toBe(8);
    expect(res.frete).toBe(1);
  });
});

