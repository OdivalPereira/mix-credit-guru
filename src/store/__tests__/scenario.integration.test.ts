import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { useCotacaoStore } from '@/store/useCotacaoStore';
import type { MixResultadoItem } from '@/types/domain';

function calcularMix(itens: MixResultadoItem[], porcoes: number) {
  const total = itens.reduce((sum, i) => sum + i.custoEfetivo, 0);
  return itens.map((i) => ({
    ...i,
    mix: total ? (i.custoEfetivo / total) * 100 : 0,
    custoPorPorcao: i.custoEfetivo / porcoes,
  }));
}

describe('mudança de cenário', () => {
  beforeEach(() => {
    useAppStore.setState({ scenario: 'default', regras: [], receitas: [] });
    useCotacaoStore.setState({
      contexto: {
        data: '2026-06-01',
        uf: 'SP',
        municipio: '',
        destino: 'A',
        regime: 'normal',
        produto: '',
      },
      fornecedores: [],
      resultado: { itens: [] },
    });
  });

  it('atualiza Cotacao e Receitas quando cenário muda', () => {
    const cotacao = useCotacaoStore.getState();
    cotacao.upsertFornecedor({
      id: 'f1',
      nome: 'Fornecedor',
      tipo: 'fabricante',
      regime: 'normal',
      preco: 100,
      ibs: 0,
      cbs: 0,
      is: 0,
      frete: 10,
    });

    cotacao.calcular();
    const itemDefault = useCotacaoStore.getState().resultado.itens[0];
    const mixDefault = calcularMix([itemDefault], 1)[0].custoPorPorcao;

    useAppStore.getState().setScenario('cesta');
    cotacao.calcular();
    const itemCesta = useCotacaoStore.getState().resultado.itens[0];
    const mixCesta = calcularMix([itemCesta], 1)[0].custoPorPorcao;

    expect(itemDefault.ibs).toBe(12);
    expect(itemCesta.ibs).toBe(7);
    expect(mixCesta).not.toBe(mixDefault);
  });
});
