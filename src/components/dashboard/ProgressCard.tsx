import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useContractsStore } from "@/store/useContractsStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { ProgressRing } from "./ProgressRing";
import { CheckCircle2, Circle, Package, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProgressCard() {
  const produtos = useCatalogoStore((state) => state.produtos);
  const fornecedores = useCotacaoStore((state) => state.fornecedores);
  const contratos = useContractsStore((state) => state.contratos);

  const steps = [
    { 
      label: "Produtos cadastrados", 
      current: produtos.length, 
      minimum: 5,
      icon: Package,
      color: "hsl(var(--chart-1))"
    },
    { 
      label: "Fornecedores cadastrados", 
      current: fornecedores.length, 
      minimum: 3,
      icon: Users,
      color: "hsl(var(--chart-2))"
    },
    { 
      label: "Contratos configurados", 
      current: contratos.length, 
      minimum: 3,
      icon: FileText,
      color: "hsl(var(--chart-3))"
    },
  ];

  const totalSteps = steps.length;
  const completedSteps = steps.filter((step) => step.current >= step.minimum).length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <Card className="relative overflow-hidden border-border/50 backdrop-blur-sm">
      {/* Decorative blur effect */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
      
      <CardHeader className="relative">
        <CardTitle className="text-2xl">Progresso de Configuração</CardTitle>
        <CardDescription>Complete todos os passos para usar o sistema</CardDescription>
      </CardHeader>
      
      <CardContent className="relative">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Progress Ring */}
          <div className="flex-shrink-0">
            <ProgressRing 
              percentage={progressPercentage}
              size={180}
              strokeWidth={14}
              label="Concluído"
            />
          </div>

          {/* Steps List */}
          <div className="flex-1 w-full space-y-3">
            {steps.map((step, index) => {
              const isComplete = step.current >= step.minimum;
              const Icon = step.icon;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                    "hover:shadow-lg hover:scale-[1.01]",
                    isComplete 
                      ? "bg-success/5 border-success/30 shadow-glow-success" 
                      : "bg-card/50 border-border/50 backdrop-blur-sm"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-xl backdrop-blur-sm",
                    isComplete && "shadow-lg"
                  )} style={{ 
                    backgroundColor: isComplete ? `${step.color}20` : 'hsl(var(--muted))',
                    color: isComplete ? step.color : 'hsl(var(--muted-foreground))'
                  }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {step.current} de {step.minimum} {isComplete ? "✓" : ""}
                    </p>
                  </div>
                  
                  <div className={cn(
                    "p-1.5 rounded-full",
                    isComplete ? "bg-success/20" : "bg-muted/50"
                  )}>
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-success drop-shadow-[0_0_8px_hsl(var(--success))]" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
