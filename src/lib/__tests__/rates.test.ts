import { describe, it, expect } from 'vitest';
import { computeRates } from '@/lib/rates';

const baseDate = '2026-06-01';

describe('computeRates', () => {
  it('aplica aliquotas da Cesta Zero dentro do periodo vigente', () => {
    const rates = computeRates('cesta', baseDate, { uf: 'SP' });
    expect(rates).toEqual({ ibs: 7, cbs: 3, is: 1 });
  });

  it('aplica reducao de 60% quando item marcado', () => {
    const rates = computeRates('default', baseDate, {
      uf: 'SP',
      flagsItem: { reducao: true },
    });
    expect(rates).toEqual({ ibs: 4, cbs: 2, is: 0 });
  });

  it('respeita vigencia e overrides estaduais', () => {
    const rates = computeRates('default', '2028-03-01', { uf: 'SP' });
    expect(rates).toEqual({ ibs: 10.5, cbs: 4.5, is: 1.5 });
  });

  it('prioriza regra especifica de item sobre NCM e globais', () => {
    const rates = computeRates('default', baseDate, {
      uf: 'SP',
      municipio: '3550308',
      itemId: 'forn-3',
      flagsItem: { ncm: '1507.90.10' },
    });
    expect(rates).toEqual({ ibs: 6.5, cbs: 2.2, is: 1 });
  });
});
