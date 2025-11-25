import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Package, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * @description Card com ações rápidas para o usuário
 */
export function QuickActions() {
  const actions = [
    {
      title: "Nova Cotação",
      description: "Compare fornecedores e custos",
      icon: Calculator,
      href: "/cotacao",
      variant: "default" as const,
    },
    {
      title: "Adicionar Produto",
      description: "Cadastre um novo produto",
      icon: Package,
      href: "/meus-dados",
      variant: "outline" as const,
    },
    {
      title: "Adicionar Fornecedor",
      description: "Cadastre um novo fornecedor",
      icon: Users,
      href: "/meus-dados",
      variant: "outline" as const,
    },
    {
      title: "Ver Análises",
      description: "Impacto e cenários",
      icon: TrendingUp,
      href: "/analise",
      variant: "outline" as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>O que você gostaria de fazer?</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link key={action.title} to={action.href}>
            <Button
              variant={action.variant}
              className="w-full justify-start h-auto py-4"
            >
              <div className="flex items-start gap-3 text-left">
                <action.icon className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs opacity-80 font-normal">
                    {action.description}
                  </div>
                </div>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
