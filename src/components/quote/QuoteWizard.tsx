import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft } from "lucide-react";
import { WizardStepVerification } from "./WizardStepVerification";
import { WizardStepContext } from "./WizardStepContext";
import { WizardStepSuppliers } from "./WizardStepSuppliers";
import { WizardStepResults } from "./WizardStepResults";
import type { Contexto } from "@/store/useCotacaoStore";
import type { Supplier, MixResultadoItem } from "@/types/domain";

interface QuoteWizardProps {
  contexto: Contexto;
  fornecedores: Supplier[];
  resultados: MixResultadoItem[];
  onContextoChange: (key: keyof Contexto, value: string) => void;
  onAddSupplier: () => void;
  onPatchSupplier: (id: string, patch: Partial<Supplier>) => void;
  onRemoveSupplier: (id: string) => void;
  onCalculate: () => void;
  onOptimize: () => void;
  optimizing: boolean;
  optProgress: number;
  isCalculating: boolean;
}

const WIZARD_STEPS = [
  { id: 1, title: "Verificação", description: "Validar dados cadastrados" },
  { id: 2, title: "Contexto", description: "Definir parâmetros da cotação" },
  { id: 3, title: "Fornecedores", description: "Selecionar e configurar" },
  { id: 4, title: "Resultados", description: "Análise e otimização" },
];

export function QuoteWizard({
  contexto,
  fornecedores,
  resultados,
  onContextoChange,
  onAddSupplier,
  onPatchSupplier,
  onRemoveSupplier,
  onCalculate,
  onOptimize,
  optimizing,
  optProgress,
  isCalculating,
}: QuoteWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const goToNextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <div className="space-y-6">
      {/* Stepper Header */}
      <div className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <button
              onClick={() => goToStep(step.id)}
              className="flex items-center gap-3 group"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${currentStep === step.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : currentStep > step.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                  }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <div className="text-left">
                <div
                  className={`text-sm font-medium ${currentStep === step.id
                    ? "text-foreground"
                    : "text-muted-foreground"
                    }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </div>
              </div>
            </button>
            {index < WIZARD_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-4 ${currentStep > step.id ? "bg-primary" : "bg-border"
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 1 && (
            <WizardStepVerification onNext={goToNextStep} />
          )}
          {currentStep === 2 && (
            <WizardStepContext
              contexto={contexto}
              onContextoChange={onContextoChange}
              onNext={goToNextStep}
              onBack={goToPreviousStep}
            />
          )}
          {currentStep === 3 && (
            <WizardStepSuppliers
              fornecedores={fornecedores}
              onAddSupplier={onAddSupplier}
              onPatchSupplier={onPatchSupplier}
              onRemoveSupplier={onRemoveSupplier}
              onNext={() => {
                onCalculate();
                goToNextStep();
              }}
              onBack={goToPreviousStep}
              isCalculating={isCalculating}
            />
          )}
          {currentStep === 4 && (
            <WizardStepResults
              resultados={resultados}
              fornecedores={fornecedores}
              onOptimize={onOptimize}
              onBack={goToPreviousStep}
              optimizing={optimizing}
              optProgress={optProgress}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={goToNextStep}
          disabled={currentStep === WIZARD_STEPS.length}
        >
          Próximo
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
