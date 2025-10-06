import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SupplierRow } from "../SupplierRow";
import { Badge } from "@/components/ui/badge";
import type { MixResultadoItem } from "@/types/domain";

const mockSupplier: MixResultadoItem = {
  id: "forn-1",
  nome: "Fornecedor Teste",
  tipo: "estadual",
  regime: "normal",
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

describe("SupplierRow", () => {
  it("exibe dados do fornecedor", () => {
    const onFieldChange = vi.fn();

    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(value) => `R$ ${value.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={onFieldChange}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByDisplayValue("Fornecedor Teste")).toBeInTheDocument();
    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });

  it("apresenta ranking corretamente", () => {
    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={{ ...mockSupplier, ranking: 3 }}
            formatCurrency={(value) => `R$ ${value.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={vi.fn()}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("aciona onFieldChange ao editar nome", async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();

    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(value) => `R$ ${value.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={onFieldChange}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>,
    );

    const nomeInput = screen.getByDisplayValue("Fornecedor Teste");
    await user.clear(nomeInput);
    await user.type(nomeInput, "Novo Nome");

    expect(onFieldChange).toHaveBeenCalled();
  });

  it("aciona onDuplicate ao clicar no botao correspondente", async () => {
    const user = userEvent.setup();
    const onDuplicate = vi.fn();

    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(value) => `R$ ${value.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={vi.fn()}
            onFlagChange={vi.fn()}
            onDuplicate={onDuplicate}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>,
    );

    const duplicateButton = screen.getByRole("button", {
      name: /duplicar fornecedor/i,
    });
    await user.click(duplicateButton);

    expect(onDuplicate).toHaveBeenCalledWith(mockSupplier);
  });

  it("aciona onRemove ao clicar em remover", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(value) => `R$ ${value.toFixed(2)}`}
            getCreditBadge={() => <Badge>Sim</Badge>}
            onFieldChange={vi.fn()}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={onRemove}
          />
        </tbody>
      </table>,
    );

    const removeButton = screen.getByRole("button", {
      name: /remover fornecedor/i,
    });
    await user.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith("forn-1");
  });

  it("exibe badge de credito", () => {
    render(
      <table>
        <tbody>
          <SupplierRow
            supplier={mockSupplier}
            formatCurrency={(value) => `R$ ${value.toFixed(2)}`}
            getCreditBadge={() => <Badge variant="secondary">Creditavel</Badge>}
            onFieldChange={vi.fn()}
            onFlagChange={vi.fn()}
            onDuplicate={vi.fn()}
            onRemove={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("Creditavel")).toBeInTheDocument();
  });
});
