import { describe, it, expect } from 'vitest';
import { computeEffectiveCost, rankSuppliers } from '@/lib/calcs';
import type { Supplier } from '@/types/domain';

describe('computeEffectiveCost', () => {
  it('soma preço, frete e impostos e subtrai crédito', () => {
    const custo = computeEffectiveCost(100, 10, { ibs: 10, cbs: 5, is: 2 }, 15);
    expect(custo).toBe(112);
  });
});

describe('rankSuppliers', () => {
  it('ordena fornecedores pelo menor custo efetivo', () => {
    const suppliers: Supplier[] = [
      {
        id: '1',
        nome: 'A',
        tipo: 'x',
        regime: 'normal',
        preco: 100,
        ibs: 10,
        cbs: 5,
        is: 0,
        frete: 10,
      },
      {
        id: '2',
        nome: 'B',
        tipo: 'x',
        regime: 'normal',
        preco: 110,
        ibs: 5,
        cbs: 5,
        is: 0,
        frete: 5,
      }
    ];

    const ranked = rankSuppliers(suppliers, { destino: 'A', regime: 'normal', scenario: 'default', uf: 'SP' });

    expect(ranked.map(s => s.ranking)).toEqual([1, 2]);
    expect(ranked[0].custoEfetivo).toBeLessThan(ranked[1].custoEfetivo);
    expect(ranked[0].credito).toBe(17);
    expect(ranked[1].credito).toBeCloseTo(18.7);
  });
});
