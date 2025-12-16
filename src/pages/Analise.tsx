
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Calendar,
  FileText,
  Printer,
  Download,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import type { Scenario } from "@/types/domain";

import { useAnaliseData } from "./analise/hooks/useAnaliseData";
import { ImpactoTab } from "./analise/components/ImpactoTab";
import { CenariosTab } from "./analise/components/CenariosTab";
import { RelatoriosTab } from "./analise/components/RelatoriosTab";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

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

/**
 * @description Página unificada para análises: Impacto, Cenários e Relatórios
 */
const Analise = () => {
  const [activeTab, setActiveTab] = useState("impacto");

  const {
    // Stores/Data
    catalogo,
    contexto,

    // Impacto State & Data
    produtosSelecionados,
    novoProdutoId,
    setNovoProdutoId,
    analises,
    totais,
    chartDataImpacto,

    // Cenários State & Data
    setCompareYear,
    baseOption,
    compareOption,
    hasDados,
    resumoComparacao,

    // Relatórios Data
    mixData,
    impactoDataRelatorio,
    comparacaoCenarios,

    // Handlers
    handleAdicionarProduto,
    handleRemoverProduto,
    handleQuantidadeChange,
    handleCotarFornecedores,
    handleBaseYearChange,
    handleExportExcel,

    // Helpers
    baseResultado,
    compareResultado,
    allItemIds,
    getEffectiveCost
  } = useAnaliseData();

  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    window.print();
  };

  const needsContext = !contexto.uf || !contexto.regime;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={BarChart3}
        iconColor="primary"
        title="Análise"
        description="Visualize o impacto da reforma, compare cenários e gere relatórios consolidados"
        actions={
          activeTab === "relatorios" ? (
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="mr-2 h-4 w-4" /> Imprimir
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" /> PDF
              </Button>
              <Button onClick={handleExportExcel} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> CSV
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="impacto" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Impacto</span>
          </TabsTrigger>
          <TabsTrigger value="cenarios" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Cenários</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="impacto" className="space-y-6 mt-0">
          <ImpactoTab
            needsContext={needsContext}
            novoProdutoId={novoProdutoId}
            setNovoProdutoId={setNovoProdutoId}
            catalogo={catalogo}
            produtosSelecionados={produtosSelecionados}
            handleAdicionarProduto={handleAdicionarProduto}
            handleQuantidadeChange={handleQuantidadeChange}
            handleRemoverProduto={handleRemoverProduto}
            analises={analises}
            totais={totais}
            chartDataImpacto={chartDataImpacto}
            handleCotarFornecedores={handleCotarFornecedores}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        </TabsContent>

        <TabsContent value="cenarios" className="space-y-6 mt-0">
          <CenariosTab
            baseOption={baseOption}
            handleBaseYearChange={handleBaseYearChange}
            compareOption={compareOption}
            setCompareYear={setCompareYear}
            getImpactBadge={getImpactBadge}
            hasDados={hasDados}
            resumoComparacao={resumoComparacao}
            formatCurrency={formatCurrency}
            allItemIds={allItemIds}
            baseResultado={baseResultado}
            compareResultado={compareResultado}
            getEffectiveCost={getEffectiveCost}
          />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6 mt-0">
          <RelatoriosTab
            mixData={mixData}
            formatCurrency={formatCurrency}
            impactoDataRelatorio={impactoDataRelatorio}
            formatPercent={formatPercent}
            comparacaoCenarios={comparacaoCenarios}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analise;
