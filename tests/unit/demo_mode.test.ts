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
            // Act
            useCotacaoStore.getState().loadDemoData();

            // Wait for async import and state update
            await vi.waitFor(() => {
                const state = useCotacaoStore.getState();
                return state.fornecedoresCadastro.length > 0 && state.ofertas.length > 0;
            }, { timeout: 3000 });

            // Assert
            const updatedStore = useCotacaoStore.getState();
            expect(updatedStore.fornecedoresCadastro).toHaveLength(3);
            expect(updatedStore.ofertas).toHaveLength(3);
            expect(updatedStore.fornecedores).toHaveLength(3);

            // Verify content
            const f1 = updatedStore.fornecedoresCadastro.find((f: any) => f.id === 'demo-f1');
            expect(f1).toBeDefined();
            expect(f1?.nome).toContain('Distribuidora Exemplo');

            // Check context update
            expect(updatedStore.contexto.produto).toBe('Arroz Branco 5kg');
        });
    });
});
