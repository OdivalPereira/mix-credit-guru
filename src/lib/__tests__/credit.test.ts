import { describe, it, expect } from 'vitest';
import { computeCredit } from '@/lib/credit';

describe('computeCredit', () => {
  it('calcula credito total quando regime normal e destino A', () => {
    const result = computeCredit('A', 'normal', 100, 10, 5);
    expect(result).toEqual({ status: 'yes', creditavel: true, credito: 15 });
  });

  it('retorna sem credito para regime simples', () => {
    const result = computeCredit('A', 'simples', 100, 10, 5);
    expect(result).toEqual({ status: 'no', creditavel: false, credito: 0 });
  });

  it('aplica credito limitado para regime presumido', () => {
    const result = computeCredit('A', 'presumido', 100, 10, 5);
    expect(result).toEqual({ status: 'limited', creditavel: true, credito: 7.5 });
  });

  it('nao gera credito para refeicao pronta', () => {
    const result = computeCredit('A', 'normal', 100, 10, 5, { isRefeicaoPronta: true });
    expect(result).toEqual({ status: 'no', creditavel: false, credito: 0 });
  });

  it('ajusta credito para cenarios positivos', () => {
    const result = computeCredit('A', 'normal', 100, 10, 5, { scenario: 'positive' });
    expect(result).toEqual({ status: 'yes', creditavel: true, credito: 16.5 });
  });
});
