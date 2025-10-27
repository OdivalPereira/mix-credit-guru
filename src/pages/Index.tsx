import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, Calendar, BookOpen, Lightbulb, ArrowRight } from "lucide-react";
import { scenarioTimeline } from "@/data/scenarios";

const Index = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Entenda o impacto da{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Reforma Tributária
          </span>
          {" "}no seu negócio
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Simule custos, compare fornecedores e tome decisões estratégicas com base nos novos impostos IBS, CBS e IS
        </p>
      </div>

      {/* Main Feature Cards */}
      <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* O que muda */}
        <Card className="transition-all hover:shadow-lg border-border">
          <CardHeader>
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>O que muda?</CardTitle>
            <CardDescription>
              Transição gradual de 2026 a 2033, substituindo ICMS, ISS, PIS e COFINS por IBS e CBS
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Como te afeta */}
        <Card className="transition-all hover:shadow-lg border-border">
          <CardHeader>
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <CardTitle>Como isso me afeta?</CardTitle>
            <CardDescription>
              Novos créditos tributários podem reduzir custos se você escolher os fornecedores certos
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Por onde começar */}
        <Card className="transition-all hover:shadow-lg border-border sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <Lightbulb className="h-6 w-6 text-warning" />
            </div>
            <CardTitle>Por onde começar?</CardTitle>
            <CardDescription>
              Cadastre seus produtos e fornecedores, depois faça sua primeira cotação para ver o impacto real
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Timeline da Reforma */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Timeline da Reforma Tributária
          </CardTitle>
          <CardDescription>
            Entenda como a transição acontecerá nos próximos anos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scenarioTimeline.map((scenario, index) => (
              <div key={scenario.year} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {scenario.year.slice(-2)}
                  </div>
                  {index < scenarioTimeline.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <h3 className="font-semibold text-foreground mb-1">{scenario.data.title}</h3>
                  <p className="text-sm text-muted-foreground">{scenario.data.changes}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Como funciona a ferramenta */}
      <Card className="mb-12 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Como usar esta ferramenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Cadastre seus dados</h4>
                <p className="text-sm text-muted-foreground">Produtos, fornecedores e contratos</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Faça uma cotação</h4>
                <p className="text-sm text-muted-foreground">Compare custos com os novos impostos</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">Analise cenários</h4>
                <p className="text-sm text-muted-foreground">Veja o impacto em diferentes anos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Principal */}
      <div className="text-center">
        <Link to="/cotacao">
          <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
            <Calculator className="h-5 w-5" />
            Fazer minha primeira cotação
            <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Não se preocupe, você pode testar sem cadastrar nada. Temos dados de exemplo prontos!
        </p>
      </div>
    </div>
  );
};

export default Index;
