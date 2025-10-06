import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteForm } from '../QuoteForm';
import type { Contexto } from '@/store/useCotacaoStore';

const mockContexto: Contexto = {
  data: '2026-06-01',
  uf: 'SP',
  municipio: '3550308',
  destino: 'A',
  regime: 'normal',
  produto: 'Produto Teste',
};

const mockOnContextoChange = vi.fn();

describe('QuoteForm', () => {
  it('renderiza todos os campos do formulário', () => {
    render(<QuoteForm contexto={mockContexto} onContextoChange={mockOnContextoChange} />);

    expect(screen.getByLabelText(/data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/município/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destinação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/regime/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/produto/i)).toBeInTheDocument();
  });

  it('preenche campos com valores iniciais do contexto', () => {
    render(<QuoteForm contexto={mockContexto} onContextoChange={mockOnContextoChange} />);

    expect(screen.getByDisplayValue('Produto Teste')).toBeInTheDocument();
    expect(screen.getByDisplayValue('SP')).toBeInTheDocument();
  });

  it('valida campo obrigatório produto', async () => {
    const user = userEvent.setup();
    render(<QuoteForm contexto={mockContexto} onContextoChange={mockOnContextoChange} />);

    const produtoInput = screen.getByLabelText(/produto/i);
    await user.clear(produtoInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/produto é obrigatório/i)).toBeInTheDocument();
    });
  });

  it('valida comprimento máximo do produto', async () => {
    const user = userEvent.setup();
    render(<QuoteForm contexto={mockContexto} onContextoChange={mockOnContextoChange} />);

    const produtoInput = screen.getByLabelText(/produto/i);
    await user.clear(produtoInput);
    await user.type(produtoInput, 'a'.repeat(101));
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/produto deve ter no máximo 100 caracteres/i)).toBeInTheDocument();
    });
  });

  it('chama onContextoChange quando produto é alterado', async () => {
    const user = userEvent.setup();
    const onContextoChange = vi.fn();
    render(<QuoteForm contexto={mockContexto} onContextoChange={onContextoChange} />);

    const produtoInput = screen.getByLabelText(/produto/i);
    await user.clear(produtoInput);
    await user.type(produtoInput, 'Novo Produto');

    // Aguardar debounce
    await waitFor(
      () => {
        expect(onContextoChange).toHaveBeenCalledWith('produto', 'Novo Produto');
      },
      { timeout: 1000 }
    );
  });
});
