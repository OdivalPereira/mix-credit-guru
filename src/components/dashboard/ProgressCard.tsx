import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useContractsStore } from "@/store/useContractsStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { cn } from "@/lib/utils";

/**
 * @description Card que mostra o progresso do usuário no cadastro de dados
 */
export function ProgressCard() {
  const produtos = useCatalogoStore((state) => state.produtos);
  const contratos = useContractsStore((state) => state.contratos);
  const fornecedores = useCotacaoStore((state) => state.fornecedores);
  const cotacoes = []; // TODO: Implementar histórico de cotações

  const steps = [
    { label: "Produtos cadastrados", current: produtos.length, minimum: 1 },
    { label: "Fornecedores adicionados", current: fornecedores.length, minimum: 2 },
    { label: "Contratos configurados", current: contratos.length, minimum: 1 },
    { label: "Cotações realizadas", current: cotacoes.length, minimum: 1 },
  ];

  const completedSteps = steps.filter((step) => step.current >= step.minimum).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-chart-2/10 rounded-full blur-2xl -z-10" />
      <CardHeader>
        <CardTitle className="text-xl">Progresso de Cadastro</CardTitle>
        <CardDescription className="text-base">Complete todos os passos para usar o sistema</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-muted-foreground">Progresso Geral</span>
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => {
            const isComplete = step.current >= step.minimum;
            return (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg transition-all duration-200",
                  isComplete 
                    ? "bg-success/5 border border-success/20 hover:border-success/30" 
                    : "bg-muted/30 border border-border/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <div className="p-1 rounded-full bg-success/10">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  ) : (
                    <div className="p-1 rounded-full bg-muted">
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{step.label}</span>
                </div>
                <Badge 
                  variant={isComplete ? "default" : "secondary"} 
                  className={cn(
                    "min-w-[3rem] justify-center font-semibold",
                    isComplete && "bg-success hover:bg-success/90"
                  )}
                >
                  {step.current}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
