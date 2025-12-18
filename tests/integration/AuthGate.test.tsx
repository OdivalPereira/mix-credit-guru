import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthGate } from '../../src/components/auth/AuthGate';
import { Button } from '../../src/components/ui/button';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth()
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

const renderWithRouter = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('AuthGate Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('When NOT in demo mode', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({ isDemo: false });
        });

        it('should render children directly', () => {
            renderWithRouter(
                <AuthGate>
                    <Button>Test Button</Button>
                </AuthGate>
            );

            expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
        });

        it('should allow button clicks to work normally', () => {
            const handleClick = vi.fn();

            renderWithRouter(
                <AuthGate>
                    <Button onClick={handleClick}>Clickable</Button>
                </AuthGate>
            );

            fireEvent.click(screen.getByRole('button', { name: 'Clickable' }));
            expect(handleClick).toHaveBeenCalledTimes(1);
        });

        it('should not show demo dialog', () => {
            renderWithRouter(
                <AuthGate>
                    <Button>Test</Button>
                </AuthGate>
            );

            fireEvent.click(screen.getByRole('button', { name: 'Test' }));
            expect(screen.queryByText('Modo Demonstração')).not.toBeInTheDocument();
        });
    });

    describe('When in demo mode', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({ isDemo: true });
        });

        it('should render children wrapped in trigger', () => {
            renderWithRouter(
                <AuthGate>
                    <Button>Demo Button</Button>
                </AuthGate>
            );

            expect(screen.getByRole('button', { name: 'Demo Button' })).toBeInTheDocument();
        });

        it('should show demo dialog on click', () => {
            renderWithRouter(
                <AuthGate>
                    <Button>Click Me</Button>
                </AuthGate>
            );

            fireEvent.click(screen.getByRole('button', { name: 'Click Me' }));

            expect(screen.getByText('Modo Demonstração')).toBeInTheDocument();
            expect(screen.getByText(/necessário criar uma conta/i)).toBeInTheDocument();
        });

        it('should show custom feature description', () => {
            renderWithRouter(
                <AuthGate feature="adicionar fornecedores">
                    <Button>Add</Button>
                </AuthGate>
            );

            fireEvent.click(screen.getByRole('button', { name: 'Add' }));

            expect(screen.getByText(/adicionar fornecedores/)).toBeInTheDocument();
        });

        it('should have cancel option to continue testing', () => {
            renderWithRouter(
                <AuthGate>
                    <Button>Test</Button>
                </AuthGate>
            );

            fireEvent.click(screen.getByRole('button', { name: 'Test' }));

            expect(screen.getByText('Continuar testando')).toBeInTheDocument();
        });

        it('should have option to create account', () => {
            renderWithRouter(
                <AuthGate>
                    <Button>Test</Button>
                </AuthGate>
            );

            fireEvent.click(screen.getByRole('button', { name: 'Test' }));

            expect(screen.getByText('Criar Conta')).toBeInTheDocument();
        });

        it('should navigate to signup when clicking create account', () => {
            renderWithRouter(
                <AuthGate>
                    <Button>Test</Button>
                </AuthGate>
            );

            fireEvent.click(screen.getByRole('button', { name: 'Test' }));
            fireEvent.click(screen.getByText('Criar Conta'));

            expect(mockNavigate).toHaveBeenCalledWith('/auth?view=signup');
        });
    });

    describe('When restricted is false', () => {
        it('should allow access even in demo mode', () => {
            mockUseAuth.mockReturnValue({ isDemo: true });
            const handleClick = vi.fn();

            renderWithRouter(
                <AuthGate restricted={false}>
                    <Button onClick={handleClick}>Unrestricted</Button>
                </AuthGate>
            );

            fireEvent.click(screen.getByRole('button', { name: 'Unrestricted' }));

            expect(handleClick).toHaveBeenCalled();
            expect(screen.queryByText('Modo Demonstração')).not.toBeInTheDocument();
        });
    });
});

describe('AuthGate with different children', () => {
    beforeEach(() => {
        mockUseAuth.mockReturnValue({ isDemo: true });
    });

    it('should work with div elements', () => {
        renderWithRouter(
            <AuthGate>
                <div data-testid="clickable-div">Click me</div>
            </AuthGate>
        );

        fireEvent.click(screen.getByTestId('clickable-div'));
        expect(screen.getByText('Modo Demonstração')).toBeInTheDocument();
    });

    it('should work with spans', () => {
        renderWithRouter(
            <AuthGate>
                <span data-testid="clickable-span">Click me</span>
            </AuthGate>
        );

        fireEvent.click(screen.getByTestId('clickable-span'));
        expect(screen.getByText('Modo Demonstração')).toBeInTheDocument();
    });
});
