import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useContractsStore } from "@/store/useContractsStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";

/**
 * @description Card que mostra o progresso do usuário no cadastro de dados
 */
export function ProgressCard() {
  const produtos = useCatalogoStore((state) => state.produtos);
  const contratos = useContractsStore((state) => state.contratos);
  const fornecedores = useCotacaoStore((state) => state.fornecedores);
  const cotacoes = []; // TODO: Implementar histórico de cotações

  const steps = [
    { label: "Produtos cadastrados", count: produtos.length, min: 1 },
    { label: "Fornecedores adicionados", count: fornecedores.length, min: 2 },
    { label: "Contratos configurados", count: contratos.length, min: 1 },
    { label: "Cotações realizadas", count: cotacoes.length, min: 1 },
  ];

  const completedSteps = steps.filter((step) => step.count >= step.min).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seu Progresso</CardTitle>
        <CardDescription>
          Complete estas etapas para aproveitar ao máximo o sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedSteps} de {steps.length} concluídas
            </span>
            <span className="font-semibold text-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isComplete = step.count >= step.min;
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={isComplete ? "text-foreground" : "text-muted-foreground"}>
                    {step.label}
                  </span>
                </div>
                <Badge variant={isComplete ? "success" : "outline"}>
                  {step.count}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
