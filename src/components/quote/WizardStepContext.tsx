import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { QuoteForm } from "./QuoteForm";
import { QuoteContextSummary } from "./QuoteContextSummary";
import { ArrowRight } from "lucide-react";
import { SectionAlert } from "@/components/shared/SectionAlert";
import { CompletionBadge } from "@/components/shared/CompletionBadge";
import { GlossaryTerm, glossaryTerms } from "@/components/shared/GlossaryTerm";
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

  const filledFields = [
    contexto.data,
    contexto.uf,
    contexto.destino,
    contexto.regime,
    contexto.produto,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Contexto da cotação</h3>
          <CompletionBadge completed={filledFields} total={5} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os parâmetros que serão usados para calcular{" "}
          <GlossaryTerm {...glossaryTerms.ibs}>IBS</GlossaryTerm>,{" "}
          <GlossaryTerm {...glossaryTerms.cbs}>CBS</GlossaryTerm> e{" "}
          <GlossaryTerm {...glossaryTerms.creditoTributario}>
            créditos tributários
          </GlossaryTerm>
          .
        </p>
      </div>

      {/* Context Form */}
      <QuoteForm contexto={contexto} onContextoChange={onContextoChange} />

      {/* Context Summary */}
      {isContextComplete && <QuoteContextSummary contexto={contexto} />}

      {/* Validation Alert */}
      {!isContextComplete && missingFields.length > 0 && (
        <SectionAlert
          type="warning"
          title="Campos obrigatórios pendentes"
          description={`Complete os seguintes campos: ${missingFields.join(", ")}`}
        />
      )}

      {isContextComplete && (
        <SectionAlert
          type="success"
          title="Contexto configurado com sucesso!"
          description="Você pode avançar para selecionar os fornecedores."
        />
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
