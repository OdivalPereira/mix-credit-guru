import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Package, Building2, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * @description Card com ações rápidas para o usuário
 */
export function QuickActions() {
  const actions = [
    {
      title: "Nova Cotação",
      description: "Iniciar processo de cotação",
      icon: Calculator,
      href: "/cotacao",
      variant: "default" as const,
      gradient: "from-primary/10 to-primary-glow/10",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Ver Análises",
      description: "Consultar análises anteriores",
      icon: BarChart3,
      href: "/analise",
      variant: "outline" as const,
      gradient: "from-chart-2/10 to-success/10",
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
    },
    {
      title: "Cadastrar Produto",
      description: "Adicionar novo produto",
      icon: Package,
      href: "/cadastros",
      variant: "outline" as const,
      gradient: "from-chart-3/10 to-chart-3/5",
      iconBg: "bg-chart-3/10",
      iconColor: "text-chart-3",
    },
    {
      title: "Fornecedores",
      description: "Gerenciar fornecedores",
      icon: Building2,
      href: "/fornecedores-contratos",
      variant: "outline" as const,
      gradient: "from-chart-4/10 to-warning/10",
      iconBg: "bg-chart-4/10",
      iconColor: "text-chart-4",
    },
  ];

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10" />
      <CardHeader>
        <CardTitle className="text-xl">Ações Rápidas</CardTitle>
        <CardDescription className="text-base">Acesse rapidamente as funcionalidades principais</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => (
            <Link key={action.href} to={action.href}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-lg border p-4 transition-all duration-200",
                  "hover:shadow-lg hover:scale-[1.02] hover:border-primary/30",
                  "bg-gradient-to-br",
                  action.gradient
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", action.iconBg)}>
                    <action.icon className={cn("h-5 w-5", action.iconColor)} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground mb-1">{action.title}</div>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
