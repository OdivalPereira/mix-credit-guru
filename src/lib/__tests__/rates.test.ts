import { describe, it, expect } from 'vitest';
import { computeRates } from '@/lib/rates';

describe('computeRates', () => {
  it('aplica alíquotas da Cesta Zero', () => {
    const rates = computeRates('cesta', 'SP');
    expect(rates).toEqual({ ibs: 7, cbs: 3, is: 1 });
  });

  it('aplica redução de 60% quando item marcado', () => {
    const rates = computeRates('default', 'SP', { reducao: true });
    expect(rates).toEqual({ ibs: 4, cbs: 2, is: 0 });
  });

  it('retorna alíquotas padrão para anos 2026–2033', () => {
    const years = Array.from({ length: 8 }, (_, i) => (2026 + i).toString());
    for (const year of years) {
      const rates = computeRates(year, 'SP');
      expect(rates).toEqual({ ibs: 12, cbs: 5, is: 2 });
    }
  });
});
