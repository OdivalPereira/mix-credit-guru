import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { WelcomeTour } from "@/components/WelcomeTour";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { QuickActions } from "@/components/dashboard/QuickActions";

/**
 * @description Dashboard principal com progresso do usuário e ações rápidas
 * @returns O componente da página inicial
 */
const Index = () => {
  return (
    <>
      <WelcomeTour />
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Bem-vindo ao{" "}
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Mix Credit Guru
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Simule o impacto da reforma tributária e tome decisões estratégicas sobre seus fornecedores
          </p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProgressCard />
          <QuickActions />
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>Sobre a Reforma Tributária</CardTitle>
            </div>
            <CardDescription>
              Entenda como a mudança de ICMS, ISS, PIS e COFINS para IBS, CBS e IS pode impactar seus custos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div>
                <div className="font-semibold text-foreground mb-1">Transição Gradual</div>
                <p className="text-muted-foreground">2026 a 2033, mudança progressiva</p>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-1">Créditos Tributários</div>
                <p className="text-muted-foreground">Escolha melhor seus fornecedores</p>
              </div>
              <div>
                <div className="font-semibold text-foreground mb-1">Análise Completa</div>
                <p className="text-muted-foreground">Compare cenários e custos</p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Link to="/cotacao" className="flex-1">
                <Button size="lg" className="w-full gap-2">
                  <Calculator className="h-4 w-4" />
                  Começar Cotação
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/analise">
                <Button size="lg" variant="outline">
                  Ver Análises
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Index;
