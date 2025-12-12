import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronRight, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useContractsStore } from "@/store/useContractsStore";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  route: string;
  isComplete: () => boolean;
}

const CHECKLIST_DISMISSED_KEY = "mix-credit-guru-checklist-dismissed";

export function OnboardingChecklist() {
  const [isDismissed, setIsDismissed] = useState(false);
  const produtos = useCatalogoStore((state) => state.produtos);
  const fornecedores = useCotacaoStore((state) => state.fornecedores);
  const contratos = useContractsStore((state) => state.contratos);
  const resultadoItens = useCotacaoStore((state) => state.resultado.itens);

  useEffect(() => {
    const dismissed = localStorage.getItem(CHECKLIST_DISMISSED_KEY);
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const checklistItems: ChecklistItem[] = [
    {
      id: "produtos",
      title: "Cadastrar produtos",
      description: "Adicione seus produtos com NCM e flags tributárias",
      route: "/cadastros",
      isComplete: () => produtos.length > 0,
    },
    {
      id: "fornecedores",
      title: "Adicionar fornecedores",
      description: "Cadastre fornecedores com regime tributário e localização",
      route: "/fornecedores-contratos",
      isComplete: () => fornecedores.length > 0,
    },
    {
      id: "contratos",
      title: "Configurar contratos",
      description: "Defina preços e condições comerciais",
      route: "/fornecedores-contratos",
      isComplete: () => contratos.length > 0,
    },
    {
      id: "cotacao",
      title: "Fazer primeira cotação",
      description: "Compare fornecedores e otimize seus créditos",
      route: "/cotacao",
      isComplete: () => resultadoItens.length > 0,
    },
  ];

  const completedItems = checklistItems.filter((item) => item.isComplete());
  const progress = (completedItems.length / checklistItems.length) * 100;
  const allComplete = completedItems.length === checklistItems.length;

  const handleDismiss = () => {
    localStorage.setItem(CHECKLIST_DISMISSED_KEY, "true");
    setIsDismissed(true);
  };

  if (isDismissed || allComplete) return null;

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" data-tour="onboarding-checklist">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
      
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 p-1 rounded-md hover:bg-muted/50 transition-colors"
        aria-label="Dispensar checklist"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Primeiros Passos
        </CardTitle>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{completedItems.length}/{checklistItems.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {checklistItems.map((item) => {
          const isComplete = item.isComplete();
          return (
            <Link
              key={item.id}
              to={item.route}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all group",
                isComplete
                  ? "bg-success/10 border border-success/20"
                  : "bg-muted/30 hover:bg-muted/50 border border-transparent"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center h-6 w-6 rounded-full flex-shrink-0 transition-colors",
                  isComplete
                    ? "bg-success text-success-foreground"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                )}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-xs font-medium">
                    {checklistItems.indexOf(item) + 1}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  isComplete && "text-success"
                )}>
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.description}
                </p>
              </div>
              {!isComplete && (
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
