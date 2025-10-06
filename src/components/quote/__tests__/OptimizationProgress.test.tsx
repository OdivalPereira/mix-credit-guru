import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OptimizationProgress } from '../OptimizationProgress';

describe('OptimizationProgress', () => {
  it('exibe mensagem customizada quando fornecida', () => {
    render(<OptimizationProgress progress={50} message="Processando..." />);
    expect(screen.getByText('Processando...')).toBeInTheDocument();
  });

  it('exibe mensagem padrão quando message é null', () => {
    render(<OptimizationProgress progress={75} message={null} />);
    expect(screen.getByText(/Estamos analisando as melhores combinações/i)).toBeInTheDocument();
  });

  it('renderiza barra de progresso com valor correto', () => {
    const { container } = render(<OptimizationProgress progress={60} message="Otimizando" />);
    const progressBar = container.querySelector('[aria-label="Progresso da otimização"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('exibe componente de loading', () => {
    render(<OptimizationProgress progress={0} message="Iniciando..." />);
    expect(screen.getByText('Otimizando cotação')).toBeInTheDocument();
  });

  it('renderiza com progress de 100%', () => {
    render(<OptimizationProgress progress={100} message="Concluído!" />);
    expect(screen.getByText('Concluído!')).toBeInTheDocument();
  });
});
