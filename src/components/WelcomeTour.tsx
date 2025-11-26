import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  ClipboardList,
  TrendingUp,
  FileText,
  CheckCircle2,
  ArrowRight,
  X
} from "lucide-react";

interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
  action?: {
    label: string;
    route: string;
  };
}

const tourSteps: TourStep[] = [
  {
    title: "Bem-vindo ao Mix Credit Guru!",
    description: "Esta ferramenta ajuda você a entender o impacto da Reforma Tributária no seu negócio e encontrar os melhores fornecedores.",
    icon: CheckCircle2,
  },
  {
    title: "1. Configure seus dados",
    description: "Comece cadastrando seus produtos, fornecedores e contratos na seção de Cadastros. Você pode importar dados via CSV ou adicionar manualmente.",
    icon: ClipboardList,
    action: {
      label: "Ir para Cadastros",
      route: "/cadastros",
    },
  },
  {
    title: "2. Faça uma Cotação",
    description: "Compare custos entre fornecedores considerando os novos impostos (IBS, CBS) e créditos tributários. O sistema calcula automaticamente o melhor mix.",
    icon: Calculator,
    action: {
      label: "Fazer Cotação",
      route: "/cotacao",
    },
  },
  {
    title: "3. Analise o Impacto",
    description: "Veja como a reforma afetará seus custos comparando o sistema ANTES (ICMS + PIS/COFINS) e DEPOIS (IBS + CBS - Crédito).",
    icon: TrendingUp,
    action: {
      label: "Ver Impacto",
      route: "/impacto-reforma",
    },
  },
  {
    title: "4. Visualize Relatórios",
    description: "Acesse relatórios consolidados com gráficos avançados, comparação de cenários e histórico de otimizações.",
    icon: FileText,
    action: {
      label: "Ver Relatórios",
      route: "/relatorios",
    },
  },
];

const TOUR_STORAGE_KEY = "mix-credit-guru-tour-completed";

/**
 * @description Um componente de tour de boas-vindas que guia os novos usuários através das principais características da aplicação.
 * @returns O componente de tour de boas-vindas.
 */
export interface WelcomeTourProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WelcomeTour({ open: controlledOpen, onOpenChange }: WelcomeTourProps) {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    setInternalOpen(newOpen);
  };

  useEffect(() => {
    // Only check localStorage if not controlled
    if (controlledOpen === undefined) {
      const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY);
      if (!tourCompleted) {
        setInternalOpen(true);
      }
    }
  }, [controlledOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    handleOpenChange(false);
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    handleOpenChange(false);
  };

  const handleAction = (route: string) => {
    handleComplete();
    navigate(route);
  };

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;
  const Icon = step.icon;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <button
          onClick={handleSkip}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>

        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{step.title}</DialogTitle>
          <DialogDescription className="text-center">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Passo {currentStep + 1} de {tourSteps.length}
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              size="sm"
            >
              Anterior
            </Button>
            <Button variant="ghost" onClick={handleSkip} size="sm">
              Pular Tour
            </Button>
          </div>

          <div className="flex gap-2">
            {step.action ? (
              <Button
                onClick={() => handleAction(step.action!.route)}
                className="gap-2"
                size="sm"
              >
                {step.action.label}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null}
            <Button onClick={handleNext} size="sm">
              {currentStep === tourSteps.length - 1 ? "Concluir" : "Próximo"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
