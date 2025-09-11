import { describe, it, expect } from 'vitest';
import { computeRecipeMix } from '@/lib/bom';
import type { Supplier } from '@/types/domain';

// Estrutura básica de receita para os testes
interface TestRecipeItem {
  id: string;
  suppliers: Supplier[];
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
});

