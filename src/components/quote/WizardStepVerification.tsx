import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Package,
  Factory,
  FileText,
  Scale,
} from "lucide-react";
import { SectionAlert } from "@/components/shared/SectionAlert";
import { CompletionBadge } from "@/components/shared/CompletionBadge";
import { GlossaryTerm, glossaryTerms } from "@/components/shared/GlossaryTerm";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useUnidadesStore } from "@/store/useUnidadesStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface WizardStepVerificationProps {
  onNext: () => void;
}

export function WizardStepVerification({
  onNext,
}: WizardStepVerificationProps) {
  const navigate = useNavigate();
  const produtos = useCatalogoStore((state) => state.produtos);
  const conversoes = useUnidadesStore((state) => state.conversoes);
  const fornecedoresCotacao = useCotacaoStore((state) => state.fornecedores);

  // Query global suppliers from database
  const { data: fornecedoresGlobais = [] } = useQuery({
    queryKey: ["fornecedores-globais"],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .eq("ativo", true);
      if (error) {
        console.error("Error fetching suppliers:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!supabase,
  });

  const fornecedoresComCondicoes = fornecedoresGlobais.filter(
    (f: any) => (f.price_breaks && f.price_breaks.length > 0) || (f.freight_breaks && f.freight_breaks.length > 0)
  ).length;

  const checks = useMemo(
    () => [
      {
        id: "produtos",
        label: "Produtos cadastrados",
        description: "Catálogo de produtos com NCM e classificações fiscais",
        count: produtos.length,
        required: true,
        icon: Package,
        action: () => navigate("/meus-dados?tab=produtos"),
      },
      {
        id: "fornecedores",
        label: "Fornecedores globais",
        description: "Base de fornecedores com dados cadastrais",
        count: fornecedoresGlobais.length,
        required: false,
        icon: Factory,
        action: () => navigate("/meus-dados?tab=fornecedores"),
      },
      {
        id: "condicoes",
        label: "Condições comerciais",
        description: "Fornecedores com preços escalonados ou frete configurado",
        count: fornecedoresComCondicoes,
        required: false,
        icon: FileText,
        action: () => navigate("/meus-dados?tab=fornecedores"),
      },
      {
        id: "conversoes",
        label: "Conversões de unidades",
        description: "Fatores de conversão entre unidades de medida",
        count: conversoes.length,
        required: false,
        icon: Scale,
        action: () => navigate("/meus-dados?tab=unidades"),
      },
    ],
    [produtos, fornecedoresGlobais, fornecedoresComCondicoes, conversoes, navigate]
  );

  const requiredChecks = checks.filter((c) => c.required);
  const optionalChecks = checks.filter((c) => !c.required);
  const requiredPassed = requiredChecks.every((c) => c.count > 0);
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.count > 0).length;
  const completionPercentage = Math.round((passedChecks / totalChecks) * 100);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Verificação de dados</h3>
          <CompletionBadge completed={passedChecks} total={totalChecks} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Antes de iniciar a cotação, vamos verificar se todos os dados
          necessários estão cadastrados. Configure seu{" "}
          <GlossaryTerm {...glossaryTerms.ncm}>NCM</GlossaryTerm>,{" "}
          <GlossaryTerm {...glossaryTerms.aliquota}>alíquotas</GlossaryTerm> e
          fornecedores.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progresso de cadastro</span>
          <span className="font-medium">{completionPercentage}%</span>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Required Checks */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          Dados obrigatórios
        </h4>
        {requiredChecks.map((check) => (
          <div
            key={check.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
          >
            <div className="mt-0.5">
              {check.count > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <check.icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{check.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    check.count > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {check.count} cadastrado{check.count !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {check.description}
              </p>
              {check.count === 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={check.action}
                >
                  Cadastrar agora
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Optional Checks */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          Dados opcionais (recomendados)
        </h4>
        {optionalChecks.map((check) => (
          <div
            key={check.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card"
          >
            <div className="mt-0.5">
              {check.count > 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <check.icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{check.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    check.count > 0
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {check.count} cadastrado{check.count !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {check.description}
              </p>
              {check.count === 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={check.action}
                >
                  Cadastrar agora
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Status Alert */}
      {!requiredPassed && (
        <SectionAlert
          type="error"
          title="Dados obrigatórios pendentes"
          description="É necessário cadastrar pelo menos 1 produto para continuar. Acesse a página Meus Dados para configurar."
          action={{
            label: "Ir para Meus Dados",
            onClick: () => navigate("/meus-dados?tab=produtos"),
          }}
        />
      )}

      {requiredPassed && fornecedoresCotacao.length === 0 && (
        <SectionAlert
          type="warning"
          title="Nenhum fornecedor adicionado"
          description="Você ainda não adicionou fornecedores nesta cotação. Será possível adicionar no próximo passo."
        />
      )}

      {requiredPassed && (
        <SectionAlert
          type="success"
          title="Tudo pronto!"
          description="Você pode avançar para configurar o contexto da cotação."
        />
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!requiredPassed} size="lg">
          Continuar para Contexto
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
