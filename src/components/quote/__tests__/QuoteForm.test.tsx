import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { QuoteForm } from "../QuoteForm";
import type { Contexto } from "@/store/useCotacaoStore";

const baseContexto: Contexto = {
  data: "2026-06-01",
  uf: "SP",
  municipio: "3550308",
  destino: "A",
  regime: "normal",
  produto: "Produto Teste",
};

describe("QuoteForm", () => {
  it("renderiza todos os campos basicos", () => {
    render(
      <QuoteForm contexto={baseContexto} onContextoChange={vi.fn()} />,
    );

    expect(screen.getByLabelText(/data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/municipio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destinacao/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/regime/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/produto/i)).toBeInTheDocument();
  });

  it("preenche valores iniciais", () => {
    render(
      <QuoteForm contexto={baseContexto} onContextoChange={vi.fn()} />,
    );

    expect(screen.getByDisplayValue("Produto Teste")).toBeInTheDocument();
    const estadoSelect = screen.getByRole("combobox", { name: /estado/i });
    expect(estadoSelect).toHaveTextContent(/SP - Sao Paulo/i);
    expect(screen.getByDisplayValue("3550308")).toBeInTheDocument();
  });

  it("valida campo produto obrigatorio", async () => {
    const user = userEvent.setup();
    render(
      <QuoteForm contexto={baseContexto} onContextoChange={vi.fn()} />,
    );

    const input = screen.getByLabelText(/produto/i);
    await user.clear(input);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/produto obrigatorio/i)).toBeInTheDocument();
    });
  });

  it("valida limite maximo de caracteres", async () => {
    const user = userEvent.setup();
    render(
      <QuoteForm contexto={baseContexto} onContextoChange={vi.fn()} />,
    );

    const input = screen.getByLabelText(/produto/i);
    await user.clear(input);
    await user.type(input, "a".repeat(101));
    await user.tab();

    await waitFor(() => {
      expect(
        screen.getByText(/produto deve ter no maximo 100 caracteres/i),
      ).toBeInTheDocument();
    });
  });

  it("propaga mudancas ao contexto", async () => {
    const user = userEvent.setup();
    const onContextoChange = vi.fn();
    render(
      <QuoteForm contexto={baseContexto} onContextoChange={onContextoChange} />,
    );

    const input = screen.getByLabelText(/produto/i);
    await user.clear(input);
    await user.type(input, "Novo Produto");

    await waitFor(() => {
      expect(onContextoChange).toHaveBeenCalledWith(
        "produto",
        "Novo Produto",
      );
    });
  });
});
