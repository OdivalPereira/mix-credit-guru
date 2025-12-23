import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCotacaoStore } from '@/store/useCotacaoStore';
import { useCatalogoStore } from '@/store/useCatalogoStore';
import { useAppStore } from '@/store/useAppStore';

describe('Demo Mode Logic', () => {
    beforeEach(() => {
        useCotacaoStore.getState().limpar();
        useCatalogoStore.getState().limpar();
        useAppStore.getState().limpar();
    });

    describe('useCotacaoStore.loadDemoData', () => {
        it('should populate store with sample suppliers', async () => {
            useCotacaoStore.getState().loadDemoData();

            await vi.waitFor(() => {
                return useCotacaoStore.getState().fornecedoresCadastro.length > 0;
            }, { timeout: 2000 });

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
