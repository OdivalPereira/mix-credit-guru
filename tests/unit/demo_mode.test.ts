import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCotacaoStore } from '@/store/useCotacaoStore';

describe('Demo Mode Logic', () => {
    beforeEach(() => {
        useCotacaoStore.getState().limpar();
    });

    describe('loadDemoData', () => {
        it('should populate store with sample suppliers', () => {
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
        });

        it('should create demo suppliers with correct IDs', () => {
            useCotacaoStore.getState().loadDemoData();
            const { fornecedoresCadastro } = useCotacaoStore.getState();

            expect(fornecedoresCadastro.find(f => f.id === 'demo-f1')).toBeDefined();
            expect(fornecedoresCadastro.find(f => f.id === 'demo-f2')).toBeDefined();
            expect(fornecedoresCadastro.find(f => f.id === 'demo-f3')).toBeDefined();
        });

        it('should create demo offers linked to correct suppliers', () => {
            useCotacaoStore.getState().loadDemoData();
            const { ofertas } = useCotacaoStore.getState();

            expect(ofertas.find(o => o.id === 'demo-o1')?.fornecedorId).toBe('demo-f1');
            expect(ofertas.find(o => o.id === 'demo-o2')?.fornecedorId).toBe('demo-f2');
            expect(ofertas.find(o => o.id === 'demo-o3')?.fornecedorId).toBe('demo-f3');
        });

        it('should set context with demo product name', () => {
            useCotacaoStore.getState().loadDemoData();
            const { contexto } = useCotacaoStore.getState();

            expect(contexto.produto).toBe('Arroz Branco 5kg');
        });

        it('should have varied supplier regimes', () => {
            useCotacaoStore.getState().loadDemoData();
            const { fornecedoresCadastro } = useCotacaoStore.getState();

            const regimes = fornecedoresCadastro.map(f => f.regime);
            expect(regimes).toContain('normal');
            expect(regimes).toContain('simples');
        });

        it('should have varied supplier types', () => {
            useCotacaoStore.getState().loadDemoData();
            const { fornecedoresCadastro } = useCotacaoStore.getState();

            const tipos = fornecedoresCadastro.map(f => f.tipo);
            expect(tipos).toContain('distribuidor');
            expect(tipos).toContain('industria');
        });

        it('should populate offers with prices', () => {
            useCotacaoStore.getState().loadDemoData();
            const { ofertas } = useCotacaoStore.getState();

            ofertas.forEach(o => {
                expect(o.preco).toBeGreaterThan(0);
            });
        });

        it('should clear previous data before loading demo', () => {
            const store = useCotacaoStore.getState();

            // Add some data first
            store.upsertFornecedorCadastro({
                nome: 'Test Supplier',
                tipo: 'distribuidor',
                regime: 'normal',
                uf: 'SP'
            });

            expect(useCotacaoStore.getState().fornecedoresCadastro.length).toBeGreaterThan(0);

            // Load demo data - should clear and replace
            store.loadDemoData();

            const updatedStore = useCotacaoStore.getState();
            // Should have exactly demo data
            expect(updatedStore.fornecedoresCadastro).toHaveLength(3);
            expect(updatedStore.fornecedoresCadastro.every(f => f.id.startsWith('demo-'))).toBe(true);
        });

        it('should trigger calculation after loading', async () => {
            // loadDemoData calls calcular() internally
            const store = useCotacaoStore.getState();
            const calcularSpy = vi.spyOn(store, 'calcular');

            store.loadDemoData();

            expect(calcularSpy).toHaveBeenCalled();
        });
    });

    describe('Demo Data Structure', () => {
        beforeEach(() => {
            useCotacaoStore.getState().loadDemoData();
        });

        it('should have suppliers from different UFs', () => {
            const { fornecedoresCadastro } = useCotacaoStore.getState();
            const ufs = fornecedoresCadastro.map(f => f.uf);

            expect(ufs).toContain('SP');
            expect(ufs).toContain('SC');
        });

        it('should have valid CNPJ format for demo suppliers', () => {
            const { fornecedoresCadastro } = useCotacaoStore.getState();

            fornecedoresCadastro.forEach(f => {
                if (f.cnpj) {
                    // Basic CNPJ format check (XX.XXX.XXX/XXXX-XX)
                    expect(f.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
                }
            });
        });

        it('should have offer descriptions', () => {
            const { ofertas } = useCotacaoStore.getState();

            ofertas.forEach(o => {
                expect(o.produtoDescricao).toBeDefined();
                expect(o.produtoDescricao?.length).toBeGreaterThan(0);
            });
        });
    });
});
