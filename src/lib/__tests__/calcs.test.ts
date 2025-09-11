import { describe, it, expect } from 'vitest';
import { computeEffectiveCost, rankSuppliers } from '@/lib/calcs';
import type { Supplier } from '@/types/domain';

describe('computeEffectiveCost', () => {
  it('soma preço, frete e impostos e subtrai crédito', () => {
    const custo = computeEffectiveCost(100, 10, 10, 5, 2, 15);
    expect(custo).toBe(112);
  });
});

describe('rankSuppliers', () => {
  it('ordena fornecedores pelo menor custo efetivo', () => {
    const suppliers: Supplier[] = [
      {
        id: 1,
        nome: 'A',
        tipo: 'x',
        regime: 'normal',
        preco: 100,
        ibs: 10,
        cbs: 5,
        is: 0,
        frete: 10,
        creditavel: false,
        credito: 0,
        custoEfetivo: 0,
        ranking: 0
      },
      {
        id: 2,
        nome: 'B',
        tipo: 'x',
        regime: 'normal',
        preco: 110,
        ibs: 5,
        cbs: 5,
        is: 0,
        frete: 5,
        creditavel: false,
        credito: 0,
        custoEfetivo: 0,
        ranking: 0
      }
    ];

    const ranked = rankSuppliers(suppliers, { destino: 'A', regime: 'normal' });

    expect(ranked.map(s => s.ranking)).toEqual([1, 2]);
    expect(ranked[0].custoEfetivo).toBeLessThan(ranked[1].custoEfetivo);
    expect(ranked[0].credito).toBe(15);
    expect(ranked[1].credito).toBe(11);
  });
});
