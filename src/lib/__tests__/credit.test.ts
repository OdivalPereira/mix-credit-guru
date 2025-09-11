import { describe, it, expect } from 'vitest';
import { computeCredit } from '@/lib/credit';

describe('computeCredit', () => {
  it('calcula crédito total quando regime normal e destino A', () => {
    const result = computeCredit('A', 'normal', 100, 10, 5);
    expect(result).toEqual({ status: 'yes', creditavel: true, credito: 15 });
  });

  it('retorna sem crédito para regime simples', () => {
    const result = computeCredit('A', 'simples', 100, 10, 5);
    expect(result).toEqual({ status: 'no', creditavel: false, credito: 0 });
  });

  it('aplica crédito limitado para regime presumido', () => {
    const result = computeCredit('A', 'presumido', 100, 10, 5);
    expect(result).toEqual({ status: 'limited', creditavel: true, credito: 7.5 });
  });
});
