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

            const state = useCotacaoStore.getState();
            expect(state.fornecedoresCadastro.length).toBeGreaterThan(0);
            expect(state.ofertas.length).toBeGreaterThan(0);
        });

        it('should create demo suppliers with correct IDs', async () => {
            useCotacaoStore.getState().loadDemoData();

            await vi.waitFor(() => {
                return useCotacaoStore.getState().fornecedoresCadastro.length > 0;
            }, { timeout: 2000 });

            const { fornecedoresCadastro } = useCotacaoStore.getState();
            expect(fornecedoresCadastro.find(f => f.id === 'demo-f1')).toBeDefined();
        });

        it('should set context with demo product name', async () => {
            useCotacaoStore.getState().loadDemoData();

            await vi.waitFor(() => {
                return useCotacaoStore.getState().contexto.produto !== '';
            }, { timeout: 2000 });

            const { contexto } = useCotacaoStore.getState();
            expect(contexto.produto).toContain('Arroz');
            expect(contexto.uf).toBe('SP');
        });

        it('should have varied supplier regimes and types', async () => {
            useCotacaoStore.getState().loadDemoData();

            await vi.waitFor(() => {
                return useCotacaoStore.getState().fornecedoresCadastro.length > 0;
            }, { timeout: 2000 });

            const { fornecedoresCadastro } = useCotacaoStore.getState();
            const regimes = fornecedoresCadastro.map(f => f.regime);
            const tipos = fornecedoresCadastro.map(f => f.tipo);

            expect(regimes).toContain('normal');
            expect(tipos).toContain('distribuidor');
        });
    });

    describe('useCatalogoStore.loadDemoData', () => {
        it('should load demo products', async () => {
            useCatalogoStore.getState().loadDemoData();

            await vi.waitFor(() => {
                return useCatalogoStore.getState().produtos.length > 0;
            }, { timeout: 2000 });

            const state = useCatalogoStore.getState();
            expect(state.produtos.length).toBeGreaterThan(0);
            expect(state.produtos.some(p => p.ncm === '1006.30.11')).toBe(true);
        });
    });

    describe('useAppStore.loadDemoData', () => {
        it('should load demo rules and recipes', async () => {
            useAppStore.getState().loadDemoData();

            await vi.waitFor(() => {
                return useAppStore.getState().regras.length > 0;
            }, { timeout: 2000 });

            const state = useAppStore.getState();
            expect(state.regras.length).toBeGreaterThan(0);
            expect(state.receitas.length).toBeGreaterThan(0);
        });
    });
});
