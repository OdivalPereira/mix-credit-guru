import { describe, it, expect } from 'vitest';
import { normalizeOffer } from '@/lib/units';
import type { UnitConv } from '@/types/domain';

describe('normalizeOffer', () => {
  const convs: UnitConv[] = [
    { de: 'kg', para: 'g', fator: 1000 },
    { de: 'l', para: 'ml', fator: 1000 },
    { de: 'ton', para: 'kg', fator: 1000 },
  ];

  it('calcula preço por unidade em multipack', () => {
    const preco = normalizeOffer(24, [12], 'un', 'un', []);
    expect(preco).toBe(2);
  });

  it('converte entre unidades', () => {
    const preco = normalizeOffer(10, [2], 'l', 'ml', convs);
    expect(preco).toBeCloseTo(10 / (2 * 1000));
  });

  it('aplica yield/perdas', () => {
    const preco = normalizeOffer(20, [1000], 'g', 'kg', convs, {
      entrada: 'g',
      saida: 'g',
      rendimento: 80,
    });
    expect(preco).toBeCloseTo(25);
  });
});

