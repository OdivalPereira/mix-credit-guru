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
        expect(updatedStore.fornecedoresCadastro).toHaveLength(3);
        expect(updatedStore.ofertas).toHaveLength(3);
        expect(updatedStore.fornecedores).toHaveLength(3);

        // Verify content
        const f1 = updatedStore.fornecedoresCadastro.find(f => f.id === 'demo-f1');
        expect(f1).toBeDefined();
        expect(f1?.nome).toContain('Distribuidora Exemplo');

        // Check context update
        expect(updatedStore.contexto.produto).toBe('Arroz Branco 5kg');
    });
});
