import { describe, it, expect, beforeEach } from 'vitest';
import { useCotacaoStore, createEmptyFornecedor } from '@/store/useCotacaoStore';

describe('Business Limits Enforcement', () => {

    beforeEach(() => {
        useCotacaoStore.getState().limpar();
    });

    it('should prevent adding more than 50 suppliers', () => {
        // 1. Fill up to limit directly (Direct State Manipulation)
        const mockSuppliers = Array.from({ length: 50 }, (_, i) => {
            const sup = createEmptyFornecedor();
            sup.id = `sup-${i}`;
            sup.nome = `Supplier ${i}`;
            return sup;
        });

        useCotacaoStore.setState({
            fornecedoresCadastro: mockSuppliers
        });

        const store = useCotacaoStore.getState();
        expect(store.fornecedoresCadastro.length).toBe(50);

        // 2. Try to add 51st using the action
        const overflowSup = createEmptyFornecedor();
        overflowSup.id = 'sup-overflow';

        expect(() => {
            store.upsertFornecedorCadastro(overflowSup);
        }).toThrowError(/Limite de fornecedores atingido/);

        // 3. Verify state remains at 50
        expect(useCotacaoStore.getState().fornecedoresCadastro.length).toBe(50);
    });
});
