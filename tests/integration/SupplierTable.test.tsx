import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupplierTable } from '../../src/components/quote/SupplierTable';
import { TooltipProvider } from '../../src/components/ui/tooltip';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth()
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('SupplierTable Demo Restrictions', () => {
    const defaultProps = {
        resultados: [],
        fornecedoresCadastro: [],
        ofertas: [],
        produtos: [],
        contextProductKey: 'test',
        formatCurrency: (val: number) => `R$ ${val}`,
        onAddSupplier: vi.fn(),
        onDuplicate: vi.fn(),
        onRemove: vi.fn(),
        onImportCSV: vi.fn(),
        onExportCSV: vi.fn(),
        onImportJSON: vi.fn(),
        onExportJSON: vi.fn(),
        onClear: vi.fn(),
        onToggleChart: vi.fn(),
        onOptimize: vi.fn(),
        getCreditBadge: () => <span>Badge</span>,
        onUpdateFornecedor: vi.fn(),
        onUpdateOferta: vi.fn(),
        showChart: false,
        optimizing: false,
        optProgress: 0,
        optStatusMessage: null,
        containerRef: { current: null } as any
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call onAddSupplier when NOT in demo mode', () => {
        mockUseAuth.mockReturnValue({ isDemo: false });

        render(
            <BrowserRouter>
                <TooltipProvider>
                    <SupplierTable {...defaultProps} />
                </TooltipProvider>
            </BrowserRouter>
        );

        const addButton = screen.getByTestId('add-fornecedor');
        fireEvent.click(addButton);

        expect(defaultProps.onAddSupplier).toHaveBeenCalled();
        expect(screen.queryByText('Modo Demonstração')).not.toBeInTheDocument();
    });

    it('should show alert dialog when in demo mode', () => {
        mockUseAuth.mockReturnValue({ isDemo: true });

        render(
            <BrowserRouter>
                <TooltipProvider>
                    <SupplierTable {...defaultProps} />
                </TooltipProvider>
            </BrowserRouter>
        );

        const addButton = screen.getByTestId('add-fornecedor');
        fireEvent.click(addButton);

        expect(defaultProps.onAddSupplier).not.toHaveBeenCalled();
        expect(screen.getByText('Modo Demonstração')).toBeInTheDocument();
        expect(screen.getByText(/necessário criar uma conta/i)).toBeInTheDocument();
    });
});
