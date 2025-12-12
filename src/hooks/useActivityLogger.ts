import { useCallback } from 'react';
import { useCatalogoStore } from '@/store/useCatalogoStore';
import { useCotacaoStore, Contexto } from '@/store/useCotacaoStore';
import { useContractsStore } from '@/store/useContractsStore';
import { useActivityLogStore, ActivityType } from '@/store/useActivityLogStore';
import type { Produto, Supplier, ContractFornecedor } from '@/types/domain';

/**
 * Hook that wraps CRUD operations with activity logging
 */
export function useActivityLogger() {
  const logActivity = useActivityLogStore((state) => state.logActivity);
  
  // Produto operations
  const addProduto = useCatalogoStore((state) => state.addProduto);
  const updateProduto = useCatalogoStore((state) => state.updateProduto);
  const removeProduto = useCatalogoStore((state) => state.removeProduto);
  
  // Fornecedor operations
  const upsertFornecedor = useCotacaoStore((state) => state.upsertFornecedor);
  const removeFornecedor = useCotacaoStore((state) => state.removeFornecedor);
  const fornecedores = useCotacaoStore((state) => state.fornecedores);
  
  // Cotação operations
  const setContexto = useCotacaoStore((state) => state.setContexto);
  const limpar = useCotacaoStore((state) => state.limpar);
  const importarCSV = useCotacaoStore((state) => state.importarCSV);
  const importarJSON = useCotacaoStore((state) => state.importarJSON);
  
  // Contract operations
  const updateContracts = useContractsStore((state) => state.updateContracts);
  const contratos = useContractsStore((state) => state.contratos);

  // Wrapped Produto operations
  const loggedAddProduto = useCallback((produto: Produto) => {
    addProduto(produto);
    logActivity({
      activity_type: 'produto_criado',
      entity_type: 'produto',
      entity_id: produto.id,
      entity_name: produto.descricao,
      metadata: { ncm: produto.ncm },
    });
  }, [addProduto, logActivity]);

  const loggedUpdateProduto = useCallback((id: string, data: Partial<Produto>, name?: string) => {
    updateProduto(id, data);
    logActivity({
      activity_type: 'produto_atualizado',
      entity_type: 'produto',
      entity_id: id,
      entity_name: name || data.descricao,
    });
  }, [updateProduto, logActivity]);

  const loggedRemoveProduto = useCallback((id: string, name?: string) => {
    removeProduto(id);
    logActivity({
      activity_type: 'produto_excluido',
      entity_type: 'produto',
      entity_id: id,
      entity_name: name,
    });
  }, [removeProduto, logActivity]);

  // Wrapped Fornecedor operations
  const loggedUpsertFornecedor = useCallback((fornecedor: Omit<Supplier, "id"> & { id?: string }) => {
    const isNew = !fornecedor.id || !fornecedores.some(f => f.id === fornecedor.id);
    upsertFornecedor(fornecedor);
    
    logActivity({
      activity_type: isNew ? 'fornecedor_criado' : 'fornecedor_atualizado',
      entity_type: 'fornecedor',
      entity_id: fornecedor.id,
      entity_name: fornecedor.nome,
      metadata: { 
        tipo: fornecedor.tipo,
        regime: fornecedor.regime,
        uf: fornecedor.uf,
      },
    });
  }, [upsertFornecedor, fornecedores, logActivity]);

  const loggedRemoveFornecedor = useCallback((id: string, name?: string) => {
    removeFornecedor(id);
    logActivity({
      activity_type: 'fornecedor_excluido',
      entity_type: 'fornecedor',
      entity_id: id,
      entity_name: name,
    });
  }, [removeFornecedor, logActivity]);

  // Wrapped Contract operations
  const loggedAddContract = useCallback((contract: ContractFornecedor) => {
    updateContracts((prev) => [...prev, contract]);
    logActivity({
      activity_type: 'contrato_criado',
      entity_type: 'contrato',
      entity_id: contract.id,
      entity_name: contract.produtoId || 'Novo contrato',
      metadata: {
        supplierId: contract.supplierId,
        unidade: contract.unidade,
        precoBase: contract.precoBase,
      },
    });
  }, [updateContracts, logActivity]);

  const loggedUpdateContract = useCallback((id: string, updates: Partial<ContractFornecedor>) => {
    updateContracts((prev) => 
      prev.map((c) => c.id === id ? { ...c, ...updates } : c)
    );
    logActivity({
      activity_type: 'contrato_atualizado',
      entity_type: 'contrato',
      entity_id: id,
      entity_name: updates.produtoId,
    });
  }, [updateContracts, logActivity]);

  const loggedRemoveContract = useCallback((id: string, name?: string) => {
    updateContracts((prev) => prev.filter((c) => c.id !== id));
    logActivity({
      activity_type: 'contrato_excluido',
      entity_type: 'contrato',
      entity_id: id,
      entity_name: name,
    });
  }, [updateContracts, logActivity]);

  // Wrapped Cotação operations
  const loggedSetContexto = useCallback((ctx: Partial<Contexto>, cotacaoName?: string) => {
    setContexto(ctx);
    logActivity({
      activity_type: 'cotacao_atualizada',
      entity_type: 'cotacao',
      entity_name: cotacaoName || ctx.produto || 'Cotação',
      metadata: {
        uf: ctx.uf,
        destino: ctx.destino,
        regime: ctx.regime,
      },
    });
  }, [setContexto, logActivity]);

  const loggedLimparCotacao = useCallback((cotacaoName?: string) => {
    limpar();
    logActivity({
      activity_type: 'cotacao_excluida',
      entity_type: 'cotacao',
      entity_name: cotacaoName || 'Cotação',
    });
  }, [limpar, logActivity]);

  const loggedImportarCSV = useCallback((csv: string, fileName?: string) => {
    importarCSV(csv);
    logActivity({
      activity_type: 'cotacao_criada',
      entity_type: 'cotacao',
      entity_name: fileName || 'Importação CSV',
      metadata: { source: 'csv' },
    });
  }, [importarCSV, logActivity]);

  const loggedImportarJSON = useCallback((json: string, fileName?: string) => {
    importarJSON(json);
    logActivity({
      activity_type: 'cotacao_criada',
      entity_type: 'cotacao',
      entity_name: fileName || 'Importação JSON',
      metadata: { source: 'json' },
    });
  }, [importarJSON, logActivity]);

  return {
    // Produtos
    addProduto: loggedAddProduto,
    updateProduto: loggedUpdateProduto,
    removeProduto: loggedRemoveProduto,
    
    // Fornecedores
    upsertFornecedor: loggedUpsertFornecedor,
    removeFornecedor: loggedRemoveFornecedor,
    
    // Contratos
    addContract: loggedAddContract,
    updateContract: loggedUpdateContract,
    removeContract: loggedRemoveContract,
    
    // Cotações
    setContexto: loggedSetContexto,
    limparCotacao: loggedLimparCotacao,
    importarCSV: loggedImportarCSV,
    importarJSON: loggedImportarJSON,
    
    // Direct log access for custom logging
    logActivity,
  };
}
