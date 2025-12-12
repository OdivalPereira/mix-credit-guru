import { Link } from "react-router-dom";
import { Calculator, Package, Users, FileText, ArrowRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DemoDataLoader } from "./DemoDataLoader";

interface QuickStartAction {
  icon: React.ElementType;
  title: string;
  description: string;
  route: string;
  variant: "default" | "outline";
}

const quickStartActions: QuickStartAction[] = [
  {
    icon: Package,
    title: "Cadastrar Produtos",
    description: "Adicione produtos com NCM e flags tributárias",
    route: "/cadastros",
    variant: "default",
  },
  {
    icon: Users,
    title: "Adicionar Fornecedores",
    description: "Cadastre fornecedores e seus regimes",
    route: "/fornecedores-contratos",
    variant: "outline",
  },
  {
    icon: Calculator,
    title: "Fazer Cotação",
    description: "Compare e otimize seus custos",
    route: "/cotacao",
    variant: "outline",
  },
  {
    icon: FileText,
    title: "Ver Relatórios",
    description: "Analise resultados e tendências",
    route: "/relatorios",
    variant: "outline",
  },
];

export function EmptyDashboardState() {
  return (
    <Card className="relative overflow-hidden border-dashed border-2 border-muted-foreground/20" data-tour="empty-state">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

      <CardHeader className="relative text-center pb-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <Rocket className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Bem-vindo ao Mix Credit Guru!</CardTitle>
        <CardDescription className="text-base max-w-md mx-auto">
          Comece configurando seus dados ou explore com dados de demonstração para
          entender como otimizar seus créditos tributários.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-6">
        {/* Demo Data Loader */}
        <div className="flex justify-center">
          <DemoDataLoader />
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou comece do zero</span>
          </div>
        </div>

        {/* Quick Start Actions */}
        <div className="grid gap-3 sm:grid-cols-2">
          {quickStartActions.map((action) => (
            <Link key={action.route} to={action.route} className="block">
              <Button
                variant={action.variant}
                className="w-full h-auto py-4 px-4 justify-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground font-normal">
                    {action.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
