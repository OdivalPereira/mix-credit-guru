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
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary-glow/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl">Sobre a Reforma Tributária</CardTitle>
            </div>
            <CardDescription className="text-base">
              Entenda como a mudança de ICMS, ISS, PIS e COFINS para IBS, CBS e IS pode impactar seus custos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
                <div className="font-semibold text-foreground mb-2 text-lg">Transição Gradual</div>
                <p className="text-muted-foreground text-sm">2026 a 2033, mudança progressiva</p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:border-success/30 transition-colors">
                <div className="font-semibold text-foreground mb-2 text-lg">Créditos Tributários</div>
                <p className="text-muted-foreground text-sm">Escolha melhor seus fornecedores</p>
              </div>
              <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/50 hover:border-chart-3/30 transition-colors">
                <div className="font-semibold text-foreground mb-2 text-lg">Análise Completa</div>
                <p className="text-muted-foreground text-sm">Compare cenários e custos</p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Link to="/cotacao" className="flex-1">
                <Button size="lg" className="w-full gap-2 shadow-elegant">
                  <Calculator className="h-4 w-4" />
                  Começar Cotação
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/analise">
                <Button size="lg" variant="outline" className="hover:bg-primary/5">
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
