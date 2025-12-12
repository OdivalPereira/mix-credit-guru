import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calculator, ArrowRight, TrendingUp, DollarSign, Package, Award, PlayCircle } from "lucide-react";
import { useInteractiveTour } from "@/components/InteractiveTour";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { KPICard } from "@/components/dashboard/KPICard";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { EmptyDashboardState } from "@/components/dashboard/EmptyDashboardState";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useContractsStore } from "@/store/useContractsStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";

export default function Index() {
  const { startTour } = useInteractiveTour({ autoStart: true });
  const produtos = useCatalogoStore((state) => state.produtos);
  const fornecedores = useCotacaoStore((state) => state.fornecedores);
  const contratos = useContractsStore((state) => state.contratos);
  const resultadoItens = useCotacaoStore((state) => state.resultado.itens);

  // Calculate some basic KPIs
  const totalProdutos = produtos.length;
  const totalFornecedores = fornecedores.length;
  const totalContratos = contratos.length;
  const totalCotacoes = resultadoItens.length;

  // Check if user has any data
  const hasData = totalProdutos > 0 || totalFornecedores > 0 || totalContratos > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/50">
      <div className="space-y-8 pb-8">

        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

          <div className="relative z-10 p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
                <Calculator className="w-8 h-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Mix Credit Guru
                </h1>
                <p className="text-muted-foreground mt-1">Dashboard de Otimização Tributária</p>
              </div>
            </div>
            <div className="absolute top-8 right-8 hidden lg:block">
              <Button variant="outline" onClick={startTour} className="gap-2 bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/10">
                <PlayCircle className="w-4 h-4" />
                Iniciar Tour
              </Button>
            </div>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              Maximize seus créditos fiscais com análises inteligentes e comparações detalhadas de fornecedores.
              A ferramenta definitiva para navegar pela Reforma Tributária.
            </p>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/cadastros">
            <KPICard
              title="Total de Produtos"
              value={totalProdutos.toString()}
              change={totalProdutos > 0 ? "+12%" : "0%"}
              changeType={totalProdutos > 0 ? "positive" : "neutral"}
              icon={Package}
              gradient="bg-gradient-to-br from-chart-1/20 to-chart-1/5"
              iconColor="hsl(var(--chart-1))"
            />
          </Link>
          <Link to="/fornecedores-contratos">
            <KPICard
              title="Fornecedores Ativos"
              value={totalFornecedores.toString()}
              change={totalFornecedores > 0 ? "+8%" : "0%"}
              changeType={totalFornecedores > 0 ? "positive" : "neutral"}
              icon={TrendingUp}
              gradient="bg-gradient-to-br from-success/20 to-success/5"
              iconColor="hsl(var(--success))"
            />
          </Link>
          <Link to="/fornecedores-contratos">
            <KPICard
              title="Contratos"
              value={totalContratos.toString()}
              change={totalContratos > 0 ? "+15%" : "0%"}
              changeType={totalContratos > 0 ? "positive" : "neutral"}
              icon={Award}
              gradient="bg-gradient-to-br from-warning/20 to-warning/5"
              iconColor="hsl(var(--warning))"
            />
          </Link>
          <Link to="/cotacao">
            <KPICard
              title="Cotações"
              value={totalCotacoes.toString()}
              change={totalCotacoes > 0 ? "+23%" : "0%"}
              changeType={totalCotacoes > 0 ? "positive" : "neutral"}
              icon={DollarSign}
              gradient="bg-gradient-to-br from-accent/20 to-accent/5"
              iconColor="hsl(var(--accent))"
            />
          </Link>
        </div>

        {/* Onboarding Checklist - shows until all steps complete */}
        <OnboardingChecklist />

        {/* Show empty state or progress card based on data */}
        {!hasData ? (
          <EmptyDashboardState />
        ) : (
          <ProgressCard />
        )}

        {/* Info Card - Reforma Tributária */}
        <Card className="relative overflow-hidden border-border/50 backdrop-blur-sm">
          <div className="absolute -bottom-24 right-0 w-64 h-64 bg-success/10 rounded-full blur-3xl" />

          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calculator className="w-6 h-6 text-primary" />
              Reforma Tributária e Créditos
            </CardTitle>
            <CardDescription className="text-base">
              Entenda como a reforma tributária impacta seus créditos fiscais
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              A Reforma Tributária traz mudanças significativas no sistema de tributação brasileiro,
              com destaque para o novo sistema de créditos fiscais. O Mix Credit Guru ajuda você a:
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <h3 className="font-bold text-foreground mb-2">Transição Gradual</h3>
                <p className="text-sm text-muted-foreground">
                  Compreender como migrar do sistema atual para o novo modelo sem perder benefícios
                </p>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20">
                <h3 className="font-bold text-foreground mb-2">Créditos Tributários</h3>
                <p className="text-sm text-muted-foreground">
                  Identificar e maximizar oportunidades de créditos nas operações com fornecedores
                </p>
              </div>

              <div className="p-5 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                <h3 className="font-bold text-foreground mb-2">Análise Completa</h3>
                <p className="text-sm text-muted-foreground">
                  Comparar diferentes cenários e escolher a estratégia mais vantajosa
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button asChild className="shadow-elegant hover:shadow-glow transition-all">
                <Link to="/cotacao">
                  Começar Cotação
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/analise">Ver Análises</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
