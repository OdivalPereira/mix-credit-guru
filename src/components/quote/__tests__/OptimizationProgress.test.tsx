import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { OptimizationProgress } from "../OptimizationProgress";

describe("OptimizationProgress", () => {
  it("exibe mensagem customizada quando fornecida", () => {
    render(<OptimizationProgress progress={50} message="Processando..." />);
    expect(screen.getByText("Processando...")).toBeInTheDocument();
  });

  it("usa mensagem padrao quando message eh null", () => {
    render(<OptimizationProgress progress={75} message={null} />);
    expect(
      screen.getByText(/Calculando combinacoes possiveis/i),
    ).toBeInTheDocument();
  });

  it("renderiza barra de progresso com rotulo acessivel", () => {
    const { container } = render(
      <OptimizationProgress progress={60} message="Otimizando" />,
    );
    const progressBar = container.querySelector(
      '[aria-label="Progresso da otimizacao"]',
    );
    expect(progressBar).toBeInTheDocument();
  });

  it("exibe texto de cabecalho padrao", () => {
    render(<OptimizationProgress progress={0} message="Iniciando..." />);
    expect(screen.getByText("Otimizando cotacao")).toBeInTheDocument();
  });

  it("permite mensagem final customizada", () => {
    render(<OptimizationProgress progress={100} message="Concluido!" />);
    expect(screen.getByText("Concluido!")).toBeInTheDocument();
  });
});
