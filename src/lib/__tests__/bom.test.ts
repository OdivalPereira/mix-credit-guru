import { describe, it, expect } from 'vitest';
import { computeRecipeMix } from '@/lib/bom';
import type { Supplier, MixResultadoItem } from '@/types/domain';

// Estrutura básica de receita para os testes
interface TestRecipeItem {
  id: string;
  suppliers: Supplier[];
}

function calcularMix(itens: MixResultadoItem[], porcoes: number) {
  const total = itens.reduce((sum, i) => sum + i.custoEfetivo, 0);
  return itens.map((i) => ({
    ...i,
    mix: total ? (i.custoEfetivo / total) * 100 : 0,
    custoPorPorcao: i.custoEfetivo / porcoes,
  }));
}

describe('computeRecipeMix', () => {
  it('seleciona o fornecedor com menor custo efetivo para cada item', () => {
    const recipe: TestRecipeItem[] = [
      {
        id: 'arroz',
        suppliers: [
          {
            id: 'forn-1',
            nome: 'Alfa',
            tipo: 'fabricante',
            regime: 'normal',
            preco: 100,
            ibs: 0,
            cbs: 0,
            is: 0,
            frete: 10,
            flagsItem: { ncm: '1006.30.11' },
          },
          {
            id: 'forn-2',
            nome: 'Beta',
            tipo: 'distribuidor',
            regime: 'normal',
            preco: 95,
            ibs: 0,
            cbs: 0,
            is: 0,
            frete: 12,
            flagsItem: { ncm: '1006.30.11' },
          },
        ],
      },
      {
        id: 'oleo',
        suppliers: [
          {
            id: 'forn-3',
            nome: 'Gama',
            tipo: 'fabricante',
            regime: 'normal',
            preco: 50,
            ibs: 0,
            cbs: 0,
            is: 0,
            frete: 5,
            flagsItem: { ncm: '1507.90.10', reducao: true },
          },
          {
            id: 'forn-4',
            nome: 'Delta',
            tipo: 'distribuidor',
            regime: 'normal',
            preco: 55,
            ibs: 0,
            cbs: 0,
            is: 0,
            frete: 2,
            flagsItem: { ncm: '1507.90.10' },
          },
        ],
      },
    ];

    const result = computeRecipeMix(recipe, {
      destino: 'A',
      regime: 'normal',
      scenario: 'default',
      uf: 'SP',
    });

    expect(result).toHaveLength(2);
    const [arroz, oleo] = result;

    // Para o arroz, o fornecedor Beta (forn-2) deve ter menor custo
    expect(arroz.id).toBe('forn-2');
    expect(arroz.custoEfetivo).toBe(107);

    // Para o óleo, o fornecedor Gama (forn-3) deve ser o escolhido
    expect(oleo.id).toBe('forn-3');
    expect(oleo.custoEfetivo).toBe(55);
  });

  it('aplica Cesta Zero e Redução 60% conforme o cenário', () => {
    const recipe: TestRecipeItem[] = [
      {
        id: 'feijao',
        suppliers: [
          {
            id: 's1',
            nome: 'Fornecedor A',
            tipo: 'fabricante',
            regime: 'normal',
            preco: 100,
            ibs: 0,
            cbs: 0,
            is: 0,
            frete: 0,
          },
        ],
      },
      {
        id: 'acucar',
        suppliers: [
          {
            id: 's2',
            nome: 'Fornecedor B',
            tipo: 'fabricante',
            regime: 'normal',
            preco: 80,
            ibs: 0,
            cbs: 0,
            is: 0,
            frete: 0,
            flagsItem: { reducao: true },
          },
        ],
      },
    ];

    const result = computeRecipeMix(recipe, {
      destino: 'A',
      regime: 'normal',
      scenario: 'cesta',
      uf: 'SP',
    });

    expect(result[0].ibs).toBe(7);
    expect(result[0].cbs).toBe(3);
    expect(result[0].is).toBe(1);

    expect(result[1].ibs).toBe(4);
    expect(result[1].cbs).toBe(2);
    expect(result[1].is).toBe(0);
  });

  it('usa alíquotas padrão para anos 2026–2033 e calcula mix de receitas', () => {
    const recipe: TestRecipeItem[] = [
      {
        id: 'item-a',
        suppliers: [
          {
            id: 'a1',
            nome: 'A1',
            tipo: 'fabricante',
            regime: 'normal',
            preco: 50,
            ibs: 0,
            cbs: 0,
            is: 0,
            frete: 0,
          },
        ],
      },
      {
        id: 'item-b',
        suppliers: [
          {
            id: 'b1',
            nome: 'B1',
            tipo: 'fabricante',
            regime: 'normal',
            preco: 100,
            ibs: 0,
            cbs: 0,
            is: 0,
            frete: 0,
          },
        ],
      },
    ];

    const years = Array.from({ length: 8 }, (_, i) => (2026 + i).toString());
    for (const year of years) {
      const winners = computeRecipeMix(recipe, {
        destino: 'A',
        regime: 'normal',
        scenario: year,
        uf: 'SP',
      });
      expect(winners[0].ibs).toBe(12);
      expect(winners[1].ibs).toBe(12);
      const mix = calcularMix(winners, 1);
      const totalMix = mix.reduce((sum, i) => sum + i.mix, 0);
      expect(totalMix).toBeCloseTo(100);
    }
  });
});

