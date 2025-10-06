import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

// Component que lança erro
const ThrowError = () => {
  throw new Error('Test error');
};

// Component que funciona
const WorkingComponent = () => <div>Working</div>;

describe('ErrorBoundary', () => {
  // Suprimir console.error durante os testes
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renderiza children quando não há erro', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Working')).toBeInTheDocument();
  });

  it('renderiza UI de erro quando child lança exceção', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    expect(screen.getByText(/Algo deu errado/i)).toBeInTheDocument();
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('exibe botão para recarregar a página', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /recarregar/i });
    expect(reloadButton).toBeInTheDocument();
  });
});
