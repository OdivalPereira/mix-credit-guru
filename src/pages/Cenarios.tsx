import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import type { Scenario } from "@/types/domain";

const scenarios: Record<string, Scenario> = {
  "2025": {
    title: "Reforma Tributária - Fase 1",
    changes: "Introdução do IBS e CBS mantendo ICMS e IPI em transição",
    impact: "neutral"
  },
  "2026": {
    title: "Período de Transição",
    changes: "Gradual substituição dos tributos estaduais e municipais",
    impact: "positive"
  },
  "2027": {
    title: "Implementação Completa",
    changes: "IBS e CBS substituem completamente ICMS, ISS, PIS e COFINS",
    impact: "positive"
  },
  "2029": {
    title: "Regime de Maturidade",
    changes: "Alíquotas estabilizadas, sistema totalmente operacional",
    impact: "positive"
  },
  "2033": {
    title: "Cenário de Longo Prazo",
    changes: "Possíveis ajustes finos e otimizações no sistema",
    impact: "neutral"
  }
};

export default function Cenarios() {
  const [selectedYear, setSelectedYear] = useState("2025");
  
  const scenario = scenarios[selectedYear as keyof typeof scenarios];
  
  const getImpactBadge = (impact: string) => {
    switch(impact) {
      case 'positive':
        return <Badge variant="success">Impacto Positivo</Badge>;
      case 'negative':
        return <Badge variant="destructive">Impacto Negativo</Badge>;
      default:
        return <Badge variant="secondary">Neutro</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cenários Tributários</h2>
        <p className="text-muted-foreground">
          Analise o impacto da reforma tributária em diferentes períodos
        </p>
      </div>

      {/* Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Seleção de Período
          </CardTitle>
          <CardDescription>
            Escolha o ano para visualizar o cenário tributário correspondente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025 - Início da Reforma</SelectItem>
              <SelectItem value="2026">2026 - Transição</SelectItem>
              <SelectItem value="2027">2027 - Implementação Completa</SelectItem>
              <SelectItem value="2029">2029 - Maturidade</SelectItem>
              <SelectItem value="2033">2033 - Longo Prazo</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Scenario Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{scenario.title}</CardTitle>
            {getImpactBadge(scenario.impact)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Principais Mudanças</h3>
            <p className="text-muted-foreground">{scenario.changes}</p>
          </div>

          {selectedYear === "2025" && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-2">
                    <TrendingUp className="mr-2 h-4 w-4 text-success" />
                    <h4 className="font-medium">Benefícios Esperados</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Simplificação do sistema tributário</li>
                    <li>• Redução da burocracia</li>
                    <li>• Maior transparência nos custos</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center mb-2">
                    <TrendingDown className="mr-2 h-4 w-4 text-warning" />
                    <h4 className="font-medium">Desafios Iniciais</h4>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Período de adaptação aos novos sistemas</li>
                    <li>• Coexistência de tributos antigos e novos</li>
                    <li>• Necessidade de ajustes operacionais</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}