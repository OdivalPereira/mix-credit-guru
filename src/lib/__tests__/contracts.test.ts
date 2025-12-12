import { describe, it, expect } from 'vitest';
import { resolveUnitPrice, resolveSupplierPrice } from '@/lib/contracts';
import type { Supplier } from '@/types/domain';

describe('resolveUnitPrice', () => {
  const priceSource = {
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
    const res = resolveUnitPrice(3, priceSource);
    expect(res.preco).toBe(10);
    expect(res.frete).toBe(0);
  });

  it('seleciona degraus corretos para quantidade intermediaria', () => {
    const res = resolveUnitPrice(15, priceSource);
    expect(res.preco).toBe(9);
    expect(res.frete).toBe(2);
  });

  it('seleciona maiores degraus aplicaveis', () => {
    const res = resolveUnitPrice(25, priceSource);
    expect(res.preco).toBe(8);
    expect(res.frete).toBe(1);
  });
});

describe('resolveSupplierPrice', () => {
  const baseSupplier: Supplier = {
    id: 'forn-1',
    nome: 'Fornecedor 1',
    tipo: 'distribuidor',
    regime: 'normal',
    uf: 'SP',
    ativo: true,
    preco: 10,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 5,
  };

  it('usa preco e frete do supplier quando nao ha price breaks', () => {
    const res = resolveSupplierPrice(100, baseSupplier);
    expect(res.preco).toBe(10);
    expect(res.frete).toBe(5);
  });

  it('aplica price breaks quando disponivel', () => {
    const supplierWithBreaks: Supplier = {
      ...baseSupplier,
      priceBreaks: [
        { quantidade: 10, preco: 9 },
        { quantidade: 20, preco: 8 },
      ],
      freightBreaks: [
        { quantidade: 15, frete: 3 },
      ],
    };
    const res = resolveSupplierPrice(25, supplierWithBreaks);
    expect(res.preco).toBe(8);
    expect(res.frete).toBe(3);
  });
});

