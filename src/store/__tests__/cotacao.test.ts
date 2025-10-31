import { describe, it, expect, beforeEach } from 'vitest';
import { useCotacaoStore } from '../useCotacaoStore';
import type { Supplier } from '@/types/domain';

describe('useCotacaoStore', () => {
  beforeEach(() => {
    useCotacaoStore.getState().limpar();
  });

  it('inicializa com estado padrao', () => {
    const state = useCotacaoStore.getState();
    expect(state.fornecedores).toEqual([]);
    expect(state.resultado.itens).toEqual([]);
    expect(state.contexto.regime).toBe('normal');
  });

  it('atualiza contexto', () => {
    const store = useCotacaoStore.getState();
    store.setContexto({ produto: 'Teste' });
    
    const state = useCotacaoStore.getState();
    expect(state.contexto.produto).toBe('Teste');
  });

  it('adiciona fornecedor', () => {
    const store = useCotacaoStore.getState();
    const fornecedor: Supplier = {
      id: 'f1',
      nome: 'Fornecedor 1',
      tipo: 'distribuidor',
      regime: 'normal',
      uf: 'SP',
      ativo: true,
      preco: 100,
      frete: 10,
      ibs: 10,
      cbs: 5,
      is: 1,
    };
    
    store.upsertFornecedor(fornecedor);
    
    const state = useCotacaoStore.getState();
    expect(state.fornecedores).toHaveLength(1);
    expect(state.fornecedores[0].nome).toBe('Fornecedor 1');
  });

  it('atualiza fornecedor existente', () => {
    const store = useCotacaoStore.getState();
    const fornecedor: Supplier = {
      id: 'f1',
      nome: 'Fornecedor 1',
      tipo: 'distribuidor',
      regime: 'normal',
      uf: 'SP',
      ativo: true,
      preco: 100,
      frete: 10,
      ibs: 10,
      cbs: 5,
      is: 1,
    };
    
    store.upsertFornecedor(fornecedor);
    store.upsertFornecedor({ ...fornecedor, nome: 'Fornecedor Atualizado' });
    
    const state = useCotacaoStore.getState();
    expect(state.fornecedores).toHaveLength(1);
    expect(state.fornecedores[0].nome).toBe('Fornecedor Atualizado');
  });

  it('remove fornecedor', () => {
    const store = useCotacaoStore.getState();
    const fornecedor: Supplier = {
      id: 'f1',
      nome: 'Fornecedor 1',
      tipo: 'distribuidor',
      regime: 'normal',
      uf: 'SP',
      ativo: true,
      preco: 100,
      frete: 10,
      ibs: 10,
      cbs: 5,
      is: 1,
    };
    
    store.upsertFornecedor(fornecedor);
    store.removeFornecedor('f1');
    
    const state = useCotacaoStore.getState();
    expect(state.fornecedores).toHaveLength(0);
  });

  it('limpa todos os dados', () => {
    const store = useCotacaoStore.getState();
    const fornecedor: Supplier = {
      id: 'f1',
      nome: 'Fornecedor 1',
      tipo: 'distribuidor',
      regime: 'normal',
      uf: 'SP',
      ativo: true,
      preco: 100,
      frete: 10,
      ibs: 10,
      cbs: 5,
      is: 1,
    };
    
    store.upsertFornecedor(fornecedor);
    store.setContexto({ produto: 'Teste' });
    store.limpar();
    
    const state = useCotacaoStore.getState();
    expect(state.fornecedores).toEqual([]);
    expect(state.resultado.itens).toEqual([]);
    expect(state.contexto.produto).toBe('');
  });

  it('calcula resultado ordenando fornecedores por custo efetivo', () => {
    const store = useCotacaoStore.getState();
    
    const fornecedor1: Supplier = {
      id: 'f1',
      nome: 'Fornecedor Caro',
      tipo: 'distribuidor',
      regime: 'normal',
      uf: 'SP',
      ativo: true,
      preco: 150,
      frete: 10,
      ibs: 10,
      cbs: 5,
      is: 1,
    };
    
    const fornecedor2: Supplier = {
      id: 'f2',
      nome: 'Fornecedor Barato',
      tipo: 'distribuidor',
      regime: 'normal',
      uf: 'SP',
      ativo: true,
      preco: 100,
      frete: 5,
      ibs: 10,
      cbs: 5,
      is: 1,
    };
    
    store.upsertFornecedor(fornecedor1);
    store.upsertFornecedor(fornecedor2);
    store.calcular();
    
    const state = useCotacaoStore.getState();
    expect(state.resultado.itens[0].nome).toBe('Fornecedor Barato');
    expect(state.resultado.itens[0].ranking).toBe(1);
    expect(state.resultado.itens[1].ranking).toBe(2);
  });
});
