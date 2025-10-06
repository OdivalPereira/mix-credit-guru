import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SupplierRow } from '../SupplierRow';
import { Badge } from '@/components/ui/badge';
import type { MixResultadoItem } from '@/types/domain';

const mockSupplier: MixResultadoItem = {
  id: 'forn-1',
  nome: 'Fornecedor Teste',
  tipo: 'estadual',
  regime: 'normal',
  preco: 100,
  frete: 10,
  ibs: 10,
  cbs: 5,
  is: 1,
  creditavel: true,
  credito: 15,
  custoEfetivo: 101,
  ranking: 1,
};

describe('SupplierRow', () => {
  it('renderiza dados do fornecedor', () => {
    const onFieldChange = vi.fn();
    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(v) => `R$ ${v.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={onFieldChange}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Fornecedor Teste')).toBeInTheDocument();
    expect(screen.getByText('R$ 100.00')).toBeInTheDocument();
    expect(screen.getByText('R$ 10.00')).toBeInTheDocument();
  });

  it('exibe ranking corretamente', () => {
    const onFieldChange = vi.fn();
    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={{ ...mockSupplier, ranking: 3 }}
            formatCurrency={(v) => `R$ ${v.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={onFieldChange}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('3º')).toBeInTheDocument();
  });

  it('chama onFieldChange quando campo é alterado', async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    
    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(v) => `R$ ${v.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={onFieldChange}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>
    );

    const nomeInput = screen.getByDisplayValue('Fornecedor Teste');
    await user.clear(nomeInput);
    await user.type(nomeInput, 'Novo Nome');

    expect(onFieldChange).toHaveBeenCalled();
  });

  it('chama onDuplicate quando botão duplicar é clicado', async () => {
    const user = userEvent.setup();
    const onDuplicate = vi.fn();
    
    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(v) => `R$ ${v.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={vi.fn()}
            onFlagChange={vi.fn()}
            onDuplicate={onDuplicate}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>
    );

    const duplicateButton = screen.getByTitle(/duplicar/i);
    await user.click(duplicateButton);

    expect(onDuplicate).toHaveBeenCalledWith(mockSupplier);
  });

  it('chama onRemove quando botão remover é clicado', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    
    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(v) => `R$ ${v.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={vi.fn()}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={onRemove}
          />
        </tbody>
      </table>
    );

    const removeButton = screen.getByTitle(/remover/i);
    await user.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('forn-1');
  });

  it('exibe badge de crédito', () => {
    const onFieldChange = vi.fn();
    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(v) => `R$ ${v.toFixed(2)}`}
            getCreditBadge={() => <Badge variant="secondary">Creditável</Badge>}
            onFieldChange={onFieldChange}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText('Creditável')).toBeInTheDocument();
  });
});
