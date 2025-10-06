import { useMemo } from "react";
import { Calendar, TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import type { Scenario } from "@/types/domain";

type ScenarioOption = {
  year: string;
  scenarioKey: string;
  data: Scenario;
};

const scenarioTimeline: ScenarioOption[] = [
  {
    year: "2025",
    scenarioKey: "default",
    data: {
      title: "Reforma tributaria - fase 1",
      changes: "Introducao de IBS e CBS com ICMS e IPI em transicao",
      impact: "neutral",
    },
  },
  {
    year: "2026",
    scenarioKey: "cesta",
    data: {
      title: "Periodo de transicao",
      changes: "Reducoes alinhadas a cesta basica para suavizar o periodo inicial",
      impact: "positive",
    },
  },
  {
    year: "2027",
    scenarioKey: "positive",
    data: {
      title: "Implementacao completa",
      changes: "IBS e CBS substituem ICMS, ISS, PIS e COFINS com bonus de credito",
      impact: "positive",
    },
  },
  {
    year: "2029",
    scenarioKey: "positive",
    data: {
      title: "Regime de maturidade",
      changes: "Aliquotas estabilizadas e ajustes finos em creditos",
      impact: "positive",
    },
  },
  {
    year: "2033",
    scenarioKey: "default",
    data: {
      title: "Cenario de longo prazo",
      changes: "Monitoramento e eventuais calibragens na legislacao",
      impact: "neutral",
    },
  },
];

export default function Cenarios() {
  const scenarioKey = useAppStore((state) => state.scenario);
  const setScenario = useAppStore((state) => state.setScenario);

  const selectedOption = useMemo(() => {
    return (
      scenarioTimeline.find((option) => option.scenarioKey === scenarioKey) ??
      scenarioTimeline[0]
    );
  }, [scenarioKey]);

  const handleChange = (year: string) => {
    const option = scenarioTimeline.find((item) => item.year === year);
    if (option) {
      setScenario(option.scenarioKey);
    }
  };

  const getImpactBadge = (impact: Scenario["impact"]) => {
    switch (impact) {
      case "positive":
        return <Badge variant="success">Impacto positivo</Badge>;
      case "negative":
        return <Badge variant="destructive">Impacto negativo</Badge>;
      default:
        return <Badge variant="secondary">Impacto neutro</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cenarios tributarios</h2>
        <p className="text-muted-foreground">
          Analise a evolucao da reforma tributaria ao longo dos proximos anos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Selecione o periodo
          </CardTitle>
          <CardDescription>
            Cada periodo aplica regras especificas ao calculo de aliquotas e creditos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedOption.year}
            onValueChange={handleChange}
          >
            <SelectTrigger className="w-full max-w-xs" data-testid="scenario-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {scenarioTimeline.map((option) => (
                <SelectItem key={option.year} value={option.year}>
                  {option.year} - {option.data.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do cenario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Ano: {selectedOption.year}</Badge>
            <Badge variant="secondary">{selectedOption.data.title}</Badge>
            {getImpactBadge(selectedOption.data.impact)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{selectedOption.data.title}</CardTitle>
            {getImpactBadge(selectedOption.data.impact)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold">Principais mudancas</h3>
            <p className="text-muted-foreground">{selectedOption.data.changes}</p>
          </div>

          {selectedOption.year === "2025" && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-success" />
                    <h4 className="font-medium">Beneficios esperados</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>Simplificacao do sistema tributario</li>
                    <li>Reducao de burocracia operacional</li>
                    <li>Melhor transpariencia nos custos ao longo da cadeia</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center">
                    <TrendingDown className="mr-2 h-4 w-4 text-warning" />
                    <h4 className="font-medium">Pontos de atencao</h4>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>Periodo de adaptacao aos novos sistemas</li>
                    <li>Coexistencia temporaria de tributos antigos e novos</li>
                    <li>Necessidade de ajustes em contratos e cadastros</li>
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
