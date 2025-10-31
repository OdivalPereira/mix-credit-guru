import { describe, it, expect } from 'vitest';
import { normalizeOffer } from '@/lib/units';
import type { UnitConv } from '@/types/domain';

describe('normalizeOffer', () => {
  const convs: UnitConv[] = [
    { de: 'kg', para: 'g', fator: 1000 },
    { de: 'l', para: 'ml', fator: 1000 },
    { de: 'ton', para: 'kg', fator: 1000 },
  ];

  it('calcula preco por unidade em multipack', () => {
    const preco = normalizeOffer(24, [12], 'un', 'un', []);
    expect(preco).toBe(2);
  });

  it('converte entre unidades', () => {
    const preco = normalizeOffer(10, [2], 'l', 'ml', convs);
    expect(preco).toBeCloseTo(10 / (2 * 1000));
  });

  it('aplica yield/perdas', () => {
    const preco = normalizeOffer(20, [1000], 'g', 'kg', convs, {
      produtoId: 'prod-1',
      entrada: 'g',
      saida: 'g',
      rendimento: 80,
    });
    expect(preco).toBeCloseTo(25);
  });

  it('lanca erro quando nao existe caminho de conversao', () => {
    expect(() => normalizeOffer(10, [1], 'kg', 'ml', convs)).toThrow('Conversao invalida');
  });
});

