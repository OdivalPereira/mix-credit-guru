import type { Scenario } from "@/types/domain";

export interface ScenarioOption {
  year: string;
  scenarioKey: string;
  data: Scenario;
}

export const scenarioTimeline: ScenarioOption[] = [
  {
    year: "2025",
    scenarioKey: "default",
    data: {
      title: "Reforma tributaria - fase 1",
      changes: "Introducao de IBS e CBS mantendo ICMS e IPI em transicao",
      impact: "neutral",
    },
  },
  {
    year: "2026",
    scenarioKey: "cesta",
    data: {
      title: "Periodo de transicao",
      changes: "Reducoes alinhadas a cesta basica para suavizar a transicao",
      impact: "positive",
    },
  },
  {
    year: "2027",
    scenarioKey: "positive",
    data: {
      title: "Implementacao completa",
      changes: "IBS e CBS substituem totalmente ICMS, ISS, PIS e COFINS",
      impact: "positive",
    },
  },
  {
    year: "2029",
    scenarioKey: "positive",
    data: {
      title: "Regime de maturidade",
      changes: "Aliquotas estabilizadas e ajustes finos de creditos",
      impact: "positive",
    },
  },
  {
    year: "2033",
    scenarioKey: "default",
    data: {
      title: "Cenario de longo prazo",
      changes: "Monitoramento e calibragem pontual do sistema",
      impact: "neutral",
    },
  },
];
