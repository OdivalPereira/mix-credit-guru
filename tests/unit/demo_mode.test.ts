import { describe, it, expect, beforeEach } from 'vitest';
import { useCotacaoStore } from '@/store/useCotacaoStore';

describe('Demo Mode Logic', () => {
    beforeEach(() => {
        useCotacaoStore.getState().limpar();
    });

    it('loadDemoData should populate store with sample data', () => {
        const store = useCotacaoStore.getState();

        // Initial state check
        expect(store.fornecedoresCadastro).toHaveLength(0);
        expect(store.ofertas).toHaveLength(0);

        // Act
        store.loadDemoData();

        // Assert
        const updatedStore = useCotacaoStore.getState();
        expect(updatedStore.fornecedoresCadastro).toHaveLength(5);
        expect(updatedStore.ofertas).toHaveLength(5);
        expect(updatedStore.fornecedores).toHaveLength(5);

        // Verify content
        const f1 = updatedStore.fornecedoresCadastro.find(f => f.id === 'demo-f1');
        expect(f1).toBeDefined();
        expect(f1?.nome).toContain('Indústria de Alimentos (Lucro Real)');

        // Check context update
        expect(updatedStore.contexto.produto).toBe('Item de Exemplo');
        expect(updatedStore.contexto.destino).toBe('B');
    });
});
