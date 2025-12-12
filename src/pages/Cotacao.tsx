import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { QuoteContextSummary } from "@/components/quote/QuoteContextSummary";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { QuoteWizard } from "@/components/quote/QuoteWizard";
import { SupplierTable } from "@/components/quote/SupplierTable";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AlertTriangle, Factory, PiggyBank, Sparkles, Trophy, HelpCircle, FileText, ArrowRight, Wand2, Calculator } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

import { useCotacaoStore, createEmptySupplier, SUPPLY_CHAIN_STAGES } from "@/store/useCotacaoStore";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useUnidadesStore } from "@/store/useUnidadesStore";
import { useConfigStore } from "@/store/useConfigStore";
import { useActivityLogStore } from "@/store/useActivityLogStore";
import { validateEssentialData } from "@/lib/validation";
import { NextStepButton } from "@/components/quote/NextStepButton";
import type { MixResultadoItem, Supplier } from "@/types/domain";
import type { OptimizePerItemResult } from "@/lib/opt";
import { OptimizerApiClient } from "@/services/OptimizerApiClient";

/**
 * @description Um componente de página abrangente para gerenciar cotações de fornecedores, permitindo que os usuários configurem o contexto, gerenciem fornecedores, visualizem resultados e otimizem custos.
 * @returns O componente da página de cotação.
 */
export default function Cotacao() {
  const navigate = useNavigate();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  // Worker ref removed as we use API client now

  const [showChart, setShowChart] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optProgress, setOptProgress] = useState(0);
  const [optStatusMessage, setOptStatusMessage] = useState<string | null>(null);
  const [wizardMode, setWizardMode] = useState(true);

  const {
    contexto,
    setContexto,
    fornecedores,
    resultado,
    ultimaOtimizacao,
    upsertFornecedor,
    removeFornecedor,
    importarCSV,
    exportarCSV,
    importarJSON,
    exportarJSON,
    limpar,
    calcular,
    registrarOtimizacao,
  } = useCotacaoStore();
  const conversoesGlobais = useUnidadesStore((state) => state.conversoes);
  const yieldGlobais = useUnidadesStore((state) => state.yields);
  const produtosCatalogo = useCatalogoStore((state) => state.produtos);
  const config = useConfigStore();
  const logActivity = useActivityLogStore((state) => state.logActivity);

  const resultados = useMemo(() => resultado.itens, [resultado.itens]);

  // Validate essential data and show warnings
  useEffect(() => {
    const validation = validateEssentialData({
      hasProdutos: produtosCatalogo.length > 0,
      hasFornecedores: fornecedores.length > 0,
      hasContratos: contratos.length > 0,
      contextoUf: contexto.uf,
      contextoRegime: contexto.regime,
    });

    if (!validation.isValid && fornecedores.length > 0) {
      // Only show warnings if user has started adding data
      validation.warnings.forEach((warning) => {
        toast({
          title: "Aviso",
          description: warning,
        });
      });
    }
  }, [produtosCatalogo.length, fornecedores.length, contratos.length, contexto.uf, contexto.regime]);

  // Apply default config values on mount
  useEffect(() => {
    const hasEmptyContext = !contexto.uf || !contexto.regime || !contexto.destino;
    if (hasEmptyContext && (config.defaultUf || config.defaultRegime || config.defaultDestino)) {
      setContexto({
        ...(config.defaultUf && !contexto.uf ? { uf: config.defaultUf } : {}),
        ...(config.defaultRegime && !contexto.regime ? { regime: config.defaultRegime } : {}),
        ...(config.defaultDestino && !contexto.destino ? { destino: config.defaultDestino } : {}),
      });
    }
  }, [config.defaultUf, config.defaultRegime, config.defaultDestino, contexto, setContexto]);

  useEffect(() => {
    if (config.autoCalculate) {
      calcular();
    }
  }, [contexto, fornecedores, contratos, conversoesGlobais, yieldGlobais, calcular, config.autoCalculate]);

  // Worker cleanup removed

  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    [],
  );

  const handleContextoChange = useCallback(
    (key: keyof typeof contexto, value: string) => {
      setContexto({ [key]: value });
    },
    [setContexto],
  );

  const handleDuplicate = useCallback(
    (supplier: MixResultadoItem) => {
      const { id, ...payload } = supplier;
      upsertFornecedor(payload);
      toast({
        title: "Fornecedor duplicado",
        description: `${supplier.nome} foi duplicado com sucesso`,
      });
    },
    [upsertFornecedor],
  );

  const handlePatchFornecedor = useCallback(
    (id: string, patch: Partial<Supplier>) => {
      const current = fornecedores.find((item) => item.id === id);
      if (!current) return;
      upsertFornecedor({
        id,
        ...current,
        ...patch,
      });
    },
    [fornecedores, upsertFornecedor],
  );

  const handleAddSupplier = useCallback(() => {
    const supplier = createEmptySupplier(contexto);
    upsertFornecedor(supplier);
    logActivity({
      activity_type: 'fornecedor_criado',
      entity_type: 'fornecedor',
      entity_id: supplier.id,
      entity_name: 'Novo fornecedor',
      metadata: { source: 'cotacao' },
    });
    toast({
      title: "Fornecedor adicionado",
      description: "Preencha os dados do novo fornecedor para incluí-lo na cotação",
    });
  }, [contexto, upsertFornecedor, logActivity]);

  const handleImportCSV = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      const count = text.split('\n').length - 1;
      importarCSV(text);
      event.target.value = "";
      logActivity({
        activity_type: 'cotacao_criada',
        entity_type: 'cotacao',
        entity_name: file.name,
        metadata: { source: 'csv', count },
      });
      toast({
        title: "Fornecedores importados com sucesso",
        description: `${count} fornecedores foram adicionados à cotação`,
      });
    },
    [importarCSV, logActivity],
  );

  const handleImportJSON = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      importarJSON(text);
      event.target.value = "";
      logActivity({
        activity_type: 'cotacao_criada',
        entity_type: 'cotacao',
        entity_name: file.name,
        metadata: { source: 'json' },
      });
      toast({
        title: "Cotação importada com sucesso",
        description: "Todos os dados da cotação foram restaurados",
      });
    },
    [importarJSON, logActivity],
  );

  const handleExportCSV = useCallback(() => {
    const csv = exportarCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = url;
    element.download = "fornecedores.csv";
    element.click();
    URL.revokeObjectURL(url);
    toast({
      title: "CSV exportado com sucesso",
      description: "Arquivo fornecedores.csv baixado",
    });
  }, [exportarCSV]);

  const handleExportJSON = useCallback(() => {
    const json = exportarJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = url;
    element.download = "cotacao.json";
    element.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Cotação exportada com sucesso",
      description: "Arquivo cotacao.json baixado com todos os dados da cotação",
    });
  }, [exportarJSON]);

  const handleOptimize = useCallback(() => {
    // Validate essential data before optimization
    if (fornecedores.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Adicione pelo menos um fornecedor antes de otimizar",
        variant: "destructive",
      });
      return;
    }

    if (!contexto.uf || !contexto.regime) {
      toast({
        title: "Erro de validação",
        description: "Configure UF e Regime Tributário antes de otimizar",
        variant: "destructive",
      });
      return;
    }

    if (produtosCatalogo.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum produto cadastrado no catálogo. Isso pode afetar os cálculos.",
      });
    }

    setOptimizing(true);
    setOptProgress(0);
    setOptStatusMessage("Processando combinações otimizadas via nuvem...");

    // Simulate progress for UX since API is request/response
    const progressInterval = setInterval(() => {
      setOptProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 200);

    OptimizerApiClient.optimize({
      quantity: 100,
      offers: fornecedores.map((supplier) => ({
        id: supplier.id,
        price: supplier.preco,
      })),
    })
      .then((result) => {
        clearInterval(progressInterval);
        setOptProgress(100);
        setOptimizing(false);

        if (result) {
          registrarOtimizacao(result);
          const total = formatCurrency(result.cost);
          const alerts =
            result.violations.length > 0
              ? ` Alertas: ${result.violations.join(", ")}.`
              : " Nenhum alerta encontrado.";
          const summary = `Custo total ${total}.${alerts}`;
          setOptStatusMessage(`Otimização concluída. ${summary}`);
          logActivity({
            activity_type: 'cotacao_atualizada',
            entity_type: 'cotacao',
            entity_name: contexto.produto || 'Cotação',
            metadata: { 
              action: 'otimizacao',
              cost: result.cost,
              fornecedores: fornecedores.length,
            },
          });
          toast({
            title: "Otimização concluída com sucesso",
            description: summary,
          });
        } else {
          throw new Error("Nenhum resultado retornado.");
        }
      })
      .catch((error) => {
        clearInterval(progressInterval);
        setOptimizing(false);
        setOptProgress(0);
        setOptStatusMessage("Falha ao otimizar fornecedores.");
        toast({
          variant: "destructive",
          title: "Erro na otimização",
          description: error.message || "Não foi possível concluir a otimização.",
        });
      });
  }, [fornecedores, formatCurrency, registrarOtimizacao, contexto.uf, contexto.regime, contexto.produto, produtosCatalogo.length, logActivity]);

  const getCreditBadge = useCallback(
    (creditavel: boolean, credito: number) => {
      if (!creditavel) {
        return <Badge variant="creditNo">Nao creditavel</Badge>;
      }
      if (credito > 15) {
        return <Badge variant="creditYes">Credito total</Badge>;
      }
      return <Badge variant="creditLimited">Credito limitado</Badge>;
    },
    [],
  );

  const chartData = useMemo(
    () =>
      resultados.map((item) => ({
        id: item.id,
        nome: item.nome,
        custoEfetivo: item.custoEfetivo,
      })),
    [resultados],
  );

  const quoteInsights = useMemo(() => {
    if (resultados.length === 0) {
      return {
        totalSuppliers: 0,
        creditavelCount: 0,
        creditavelPercent: 0,
        avgCredit: 0,
        bestSupplier: null as MixResultadoItem | null,
        alertSuppliers: 0,
      };
    }

    let bestSupplier: MixResultadoItem | null = null;
    for (const item of resultados) {
      if (!bestSupplier || item.ranking < bestSupplier.ranking) {
        bestSupplier = item;
      }
    }

    const creditavelCount = resultados.filter((item) => item.creditavel).length;
    const totalCredit = resultados.reduce(
      (accumulator, item) => accumulator + (item.credito ?? 0),
      0,
    );
    const alertSuppliers = resultados.filter(
      (item) => (item.restricoes?.length ?? 0) > 0,
    ).length;

    return {
      totalSuppliers: resultados.length,
      creditavelCount,
      creditavelPercent: Math.round(
        (creditavelCount / resultados.length) * 100,
      ),
      avgCredit: totalCredit / resultados.length,
      bestSupplier,
      alertSuppliers,
    };
  }, [resultados]);

  const bestSupplierCost = quoteInsights.bestSupplier
    ? formatCurrency(quoteInsights.bestSupplier.custoEfetivo)
    : "--";
  const bestSupplierName = quoteInsights.bestSupplier?.nome ?? "Sem fornecedor";
  const averageCreditDisplay =
    quoteInsights.totalSuppliers > 0
      ? formatCurrency(quoteInsights.avgCredit)
      : "--";
  const optimizationCost = ultimaOtimizacao
    ? formatCurrency(ultimaOtimizacao.cost)
    : "--";
  const optimizationMessage = ultimaOtimizacao
    ? ultimaOtimizacao.violations.length > 0
      ? `${ultimaOtimizacao.violations.length} alerta(s) registrados.`
      : "Sem violações registradas."
    : "Execute a otimização para gerar um mix sugerido.";

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Calculator}
        iconColor="primary"
        title="Cotação de fornecedores"
        description="Compare custos efetivos e créditos tributários por fornecedor."
        actions={
          <Button
            variant={wizardMode ? "default" : "outline"}
            onClick={() => setWizardMode(!wizardMode)}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            {wizardMode ? "Modo Avançado" : "Modo Wizard"}
          </Button>
        }
      />

      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportCSV}
      />
      <input
        ref={jsonInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJSON}
      />

      {wizardMode ? (
        <QuoteWizard
          contexto={contexto}
          fornecedores={fornecedores}
          resultados={resultados}
          onContextoChange={handleContextoChange}
          onAddSupplier={handleAddSupplier}
          onPatchSupplier={handlePatchFornecedor}
          onRemoveSupplier={removeFornecedor}
          onCalculate={calcular}
          onOptimize={handleOptimize}
          optimizing={optimizing}
          optProgress={optProgress}
        />
      ) : (
        <>
          <QuoteForm contexto={contexto} onContextoChange={handleContextoChange} />

          <QuoteContextSummary contexto={contexto} />

          <TooltipProvider>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg border bg-card/60 p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-muted-foreground">
                      Fornecedores avaliados
                    </span>
                    {config.showTooltips && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Total de fornecedores cadastrados e percentual com crédito tributário disponível</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <Factory className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {quoteInsights.totalSuppliers}
                </p>
                <p className="text-xs text-muted-foreground">
                  {quoteInsights.creditavelCount} creditaveis (
                  {quoteInsights.creditavelPercent}
                  %)
                </p>
              </div>

              <div className="rounded-lg border bg-card/60 p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-muted-foreground">
                      Melhor custo efetivo
                    </span>
                    {config.showTooltips && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Menor custo após aplicar impostos e descontar créditos tributários disponíveis</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <Trophy className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {bestSupplierCost}
                </p>
                <p className="text-xs text-muted-foreground">{bestSupplierName}</p>
              </div>

              <div className="rounded-lg border bg-card/60 p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-muted-foreground">
                      Crédito médio
                    </span>
                    {config.showTooltips && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Média dos créditos de ICMS e PIS/COFINS que podem ser aproveitados na compra</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <PiggyBank className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {averageCreditDisplay}
                </p>
                <p className="text-xs text-muted-foreground">
                  Considera fornecedores creditaveis e nao creditaveis.
                </p>
              </div>

              <div className="rounded-lg border bg-card/60 p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-muted-foreground">
                      Última otimização
                    </span>
                    {config.showTooltips && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Combinação otimizada de fornecedores respeitando limites contratuais e minimizando custos</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {optimizationCost}
                </p>
                <p className="text-xs text-muted-foreground">{optimizationMessage}</p>
              </div>
            </div>
          </TooltipProvider>

          {quoteInsights.alertSuppliers > 0 && (
            <div className="rounded-lg border border-dashed bg-yellow-50/40 p-4 text-sm text-yellow-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" aria-hidden />
                <span className="font-semibold">
                  {quoteInsights.alertSuppliers} fornecedor(es) com restrições
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Revise limites contratuais e configurações tributárias antes de
                confirmar a cotação final.
              </p>
            </div>
          )}

          <SupplierTable
            resultados={resultados}
            fornecedoresOriginais={fornecedores}
            produtos={produtosCatalogo}
            contextProductKey={contexto.produto}
            findContract={findContract}
            formatCurrency={formatCurrency}
            onAddSupplier={handleAddSupplier}
            onDuplicate={handleDuplicate}
            onRemove={removeFornecedor}
            onImportCSV={() => csvInputRef.current?.click()}
            onExportCSV={handleExportCSV}
            onImportJSON={() => jsonInputRef.current?.click()}
            onExportJSON={handleExportJSON}
            onClear={limpar}
            onToggleChart={() => setShowChart((previous) => !previous)}
            onOptimize={handleOptimize}
            getCreditBadge={getCreditBadge}
            onPatchSupplier={handlePatchFornecedor}
            showChart={showChart}
            optimizing={optimizing}
            optProgress={optProgress}
            optStatusMessage={optStatusMessage}
            containerRef={tableScrollRef}
          />

          {ultimaOtimizacao && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Resultado da última otimização</CardTitle>
                  <Button onClick={() => navigate("/relatorios")} size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Ver Relatório Completo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>
                  Custo total:{" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(ultimaOtimizacao.cost)}
                  </span>
                </div>
                <div>
                  Violações:{" "}
                  {ultimaOtimizacao.violations.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {ultimaOtimizacao.violations.map((violation) => (
                        <li key={violation}>{violation}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>Nenhuma</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {showChart && chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Custos efetivos por fornecedor</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    custoEfetivo: {
                      label: "Custo efetivo",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px]"
                >
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid vertical={false} />
                    <XAxis type="number" dataKey="custoEfetivo" hide />
                    <YAxis
                      dataKey="nome"
                      type="category"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="custoEfetivo"
                      fill="var(--color-custoEfetivo)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Etapas da cadeia de fornecimento</CardTitle>
            <CardDescription>
              Visualize ate quatro estagios configurados para cada fornecedor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {resultados.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger>{item.nome}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                      {Array.from({ length: SUPPLY_CHAIN_STAGES }).map(
                        (_, index) => {
                          const etapa = item.cadeia?.[index];
                          return (
                            <div
                              key={`${item.id}-stage-${index}`}
                              className="rounded border p-2 text-center text-sm"
                            >
                              {etapa ?? `Estagio ${index + 1}`}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
