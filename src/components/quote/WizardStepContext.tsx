import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuoteForm } from "./QuoteForm";
import { QuoteContextSummary } from "./QuoteContextSummary";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import type { Contexto } from "@/store/useCotacaoStore";

interface WizardStepContextProps {
  contexto: Contexto;
  onContextoChange: (key: keyof Contexto, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WizardStepContext({
  contexto,
  onContextoChange,
  onNext,
  onBack,
}: WizardStepContextProps) {
  const isContextComplete = useMemo(() => {
    return Boolean(
      contexto.data &&
        contexto.uf &&
        contexto.destino &&
        contexto.regime &&
        contexto.produto
    );
  }, [contexto]);

  const missingFields = useMemo(() => {
    const fields = [];
    if (!contexto.data) fields.push("Data da cotação");
    if (!contexto.uf) fields.push("Estado (UF)");
    if (!contexto.destino) fields.push("Destinação");
    if (!contexto.regime) fields.push("Regime tributário");
    if (!contexto.produto) fields.push("Produto");
    return fields;
  }, [contexto]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Contexto da cotação</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os parâmetros que serão usados para calcular impostos e
          créditos tributários.
        </p>
      </div>

      {/* Context Form */}
      <QuoteForm contexto={contexto} onContextoChange={onContextoChange} />

      {/* Context Summary */}
      {isContextComplete && <QuoteContextSummary contexto={contexto} />}

      {/* Validation Alert */}
      {!isContextComplete && missingFields.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Campos obrigatórios pendentes:</strong>
            <ul className="list-disc list-inside mt-2 text-sm">
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {isContextComplete && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Contexto configurado com sucesso! Você pode avançar para selecionar
            os fornecedores.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!isContextComplete} size="lg">
          Continuar para Fornecedores
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
