import { useEffect, useCallback } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useNavigate, useLocation } from 'react-router-dom';

const TOUR_STORAGE_KEY = 'mix-credit-guru-interactive-tour-completed';

const tourSteps: DriveStep[] = [
  {
    element: '[data-tour="logo"]',
    popover: {
      title: '👋 Bem-vindo ao Mix Credit Guru!',
      description: 'Esta plataforma ajuda você a otimizar custos tributários e encontrar os melhores fornecedores considerando a Reforma Tributária.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="kpi-cards"]',
    popover: {
      title: '📊 Indicadores Rápidos (KPIs)',
      description: 'Visualize rapidamente seus dados: produtos cadastrados, fornecedores ativos, contratos e cotações realizadas. Clique em qualquer card para ir à página correspondente.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="nav-cadastros"]',
    popover: {
      title: '📋 1. Cadastre seus dados',
      description: 'Comece cadastrando produtos, fornecedores e contratos. Você pode importar via CSV ou adicionar manualmente.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="nav-cotacao"]',
    popover: {
      title: '🧮 2. Faça Cotações',
      description: 'Compare custos entre fornecedores considerando IBS, CBS e créditos tributários. O sistema calcula o melhor mix automaticamente.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="nav-analise"]',
    popover: {
      title: '📊 3. Analise Resultados',
      description: 'Visualize o impacto da reforma nos seus custos comparando cenários ANTES e DEPOIS.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="quick-actions"]',
    popover: {
      title: '⚡ Ações Rápidas',
      description: 'Use os atalhos para acessar rapidamente as principais funcionalidades do sistema.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="onboarding-checklist"]',
    popover: {
      title: '✅ Checklist de Início',
      description: 'Acompanhe seu progresso inicial. Complete todas as tarefas para aproveitar ao máximo a plataforma!',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '[data-tour="progress-card"]',
    popover: {
      title: '📈 Progresso de Configuração',
      description: 'Veja quantos produtos, fornecedores e contratos você já cadastrou. Complete os mínimos recomendados para usar todo o potencial do sistema.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="empty-state"]',
    popover: {
      title: '🚀 Comece Aqui!',
      description: 'Ainda não tem dados? Use o botão "Carregar Dados Demo" para explorar o sistema ou cadastre seus próprios produtos e fornecedores.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="info-card"]',
    popover: {
      title: '💡 Saiba Mais',
      description: 'Entenda como a Reforma Tributária impacta seus créditos fiscais e como o sistema pode ajudá-lo a economizar.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="info-card"]',
    popover: {
      title: '💡 Saiba Mais',
      description: 'Entenda como a Reforma Tributária impacta seus créditos fiscais e como o sistema pode ajudá-lo a economizar.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="theme-toggle"]',
    popover: {
      title: '🌓 Personalize',
      description: 'Alterne entre tema claro e escuro conforme sua preferência.',
      side: 'bottom',
      align: 'end',
    },
  },
];

export interface InteractiveTourProps {
  autoStart?: boolean;
  forceStart?: boolean;
  onComplete?: () => void;
}

export function useInteractiveTour({ autoStart = true, forceStart = false, onComplete }: InteractiveTourProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Próximo',
      prevBtnText: 'Anterior',
      doneBtnText: 'Concluir',
      progressText: '{{current}} de {{total}}',
      popoverClass: 'driver-popover-custom',
      overlayColor: 'hsl(var(--background) / 0.8)',
      stagePadding: 8,
      stageRadius: 12,
      animate: true,
      allowClose: true,
      steps: tourSteps.filter(step => {
        // Only include steps whose elements exist on the page
        if (!step.element) return true;
        return document.querySelector(step.element as string) !== null;
      }),
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        driverObj.destroy();
        onComplete?.();
      },
    });

    driverObj.drive();
  }, [onComplete]);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
  }, []);

  const isTourCompleted = useCallback(() => {
    return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
  }, []);

  useEffect(() => {
    // Only auto-start on the home page
    if (location.pathname !== '/') return;
    
    if (forceStart) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(startTour, 500);
      return () => clearTimeout(timer);
    }

    if (autoStart && !isTourCompleted()) {
      const timer = setTimeout(startTour, 800);
      return () => clearTimeout(timer);
    }
  }, [autoStart, forceStart, startTour, isTourCompleted, location.pathname]);

  return { startTour, resetTour, isTourCompleted };
}

export function InteractiveTourTrigger() {
  const { startTour } = useInteractiveTour({ autoStart: false });

  return (
    <button
      onClick={startTour}
      className="text-sm text-muted-foreground hover:text-primary transition-colors"
    >
      Ver tour novamente
    </button>
  );
}
