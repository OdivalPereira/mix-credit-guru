import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { QuoteContextSummary } from "@/components/quote/QuoteContextSummary";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { SupplierTable } from "@/components/quote/SupplierTable";
import { toast } from "@/components/ui/use-toast";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { AlertTriangle, Factory, PiggyBank, Sparkles, Trophy } from "lucide-react";

import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useContractsStore } from "@/store/useContractsStore";
import { useUnidadesStore } from "@/store/useUnidadesStore";
import type { MixResultadoItem, Supplier } from "@/types/domain";
import type { OptimizePerItemResult } from "@/lib/opt";

const SUPPLY_CHAIN_STAGES = 4;

export default function Cotacao() {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);

  const [showChart, setShowChart] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optProgress, setOptProgress] = useState(0);
  const [optStatusMessage, setOptStatusMessage] = useState<string | null>(null);

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
  const contratos = useContractsStore((state) => state.contratos);
  const conversoesGlobais = useUnidadesStore((state) => state.conversoes);
  const yieldGlobais = useUnidadesStore((state) => state.yields);
  const produtosCatalogo = useCatalogoStore((state) => state.produtos);

  const resultados = useMemo(() => resultado.itens, [resultado.itens]);

  useEffect(() => {
    calcular();
  }, [contexto, fornecedores, contratos, conversoesGlobais, yieldGlobais, calcular]);

  useEffect(() => () => workerRef.current?.terminate(), []);

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

  const numericFields = useMemo<Array<keyof Supplier>>(
    () => ["preco", "frete", "pedidoMinimo", "prazoEntregaDias", "prazoPagamentoDias"],
    [],
  );

  const isNumericField = useCallback(
    (field: keyof Supplier): field is (typeof numericFields)[number] =>
      numericFields.includes(field),
    [numericFields],
  );

  const handleFornecedorChange = useCallback(
    (id: string, field: keyof Supplier, value: string) => {
      const current = fornecedores.find((item) => item.id === id);
      if (!current) return;
      upsertFornecedor({
        id,
        ...current,
        [field]: isNumericField(field) ? parseFloat(value) || 0 : value,
      });
    },
    [fornecedores, isNumericField, upsertFornecedor],
  );

  const handleFlagChange = useCallback(
    (id: string, flag: "cesta" | "reducao" | "refeicao", value: boolean) => {
      const current = fornecedores.find((item) => item.id === id);
      if (!current) {
        return;
      }
      if (flag === "refeicao") {
        upsertFornecedor({ id, ...current, isRefeicaoPronta: value });
        return;
      }
      upsertFornecedor({
        id,
        ...current,
        flagsItem: { ...current.flagsItem, [flag]: value },
      });
    },
    [fornecedores, upsertFornecedor],
  );

  const handleDuplicate = useCallback(
    (supplier: MixResultadoItem) => {
      const { id, ...payload } = supplier;
      upsertFornecedor(payload);
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
    upsertFornecedor({
      nome: "",
      cnpj: "",
      tipo: "distribuidor",
      regime: "normal",
      uf: contexto.uf ?? "",
      municipio: contexto.municipio ?? "",
      contato: undefined,
      ativo: true,
      produtoId: undefined,
      produtoDescricao: contexto.produto || "",
      unidadeNegociada: undefined,
      pedidoMinimo: 0,
      prazoEntregaDias: 0,
      prazoPagamentoDias: 0,
      preco: 0,
      frete: 0,
      ibs: 0,
      cbs: 0,
      is: 0,
      flagsItem: { cesta: false, reducao: false },
      isRefeicaoPronta: false,
    });
  }, [contexto.municipio, contexto.produto, contexto.uf, upsertFornecedor]);

  const handleImportCSV = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      importarCSV(text);
      event.target.value = "";
    },
    [importarCSV],
  );

  const handleImportJSON = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      importarJSON(text);
      event.target.value = "";
    },
    [importarJSON],
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
  }, [exportarJSON]);

  const handleOptimize = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(
      new URL("../workers/optWorker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    workerRef.current = worker;
    setOptimizing(true);
    setOptProgress(0);
    setOptStatusMessage("Processando combinacoes otimizadas...");

    worker.postMessage({
      quantity: 100,
      offers: fornecedores.map((supplier) => ({
        id: supplier.id,
        price: supplier.preco,
      })),
    });

    worker.onmessage = (event) => {
      type WorkerMessage =
        | { type: "progress"; value: number }
        | { type: "result"; result: OptimizePerItemResult }
        | { type: "error"; message: string };

      const message = event.data as WorkerMessage;

      if (message.type === "progress") {
        setOptProgress(message.value);
        if (message.value >= 1) {
          setOptStatusMessage(
            `Otimizando fornecedores... ${Math.round(message.value)}% concluido.`,
          );
        }
        return;
      }

      if (message.type === "result") {
        setOptProgress(100);
        setOptimizing(false);
        registrarOtimizacao(message.result);
        const total = formatCurrency(message.result.cost);
        const alerts =
          message.result.violations.length > 0
            ? ` Alertas: ${message.result.violations.join(", ")}.`
            : " Nenhum alerta encontrado.";
        const summary = `Custo total ${total}.${alerts}`;
        setOptStatusMessage(`Otimizacao concluida. ${summary}`);
        toast({ title: "Otimizacao concluida", description: summary });
        workerRef.current?.terminate();
        workerRef.current = null;
        return;
      }

      setOptimizing(false);
      setOptProgress(0);
      setOptStatusMessage("Falha ao otimizar fornecedores.");
      toast({
        variant: "destructive",
        title: "Erro na otimizacao",
        description:
          message.message || "Nao foi possivel concluir a otimizacao.",
      });
      workerRef.current?.terminate();
      workerRef.current = null;
    };

    worker.onerror = (error) => {
      setOptimizing(false);
      setOptProgress(0);
      setOptStatusMessage("Falha ao otimizar fornecedores.");
      toast({
        variant: "destructive",
        title: "Erro na otimizacao",
        description: error.message || "Nao foi possivel concluir a otimizacao.",
      });
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [fornecedores, formatCurrency, registrarOtimizacao]);

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
      : "Sem violacoes registradas."
    : "Execute a otimizacao para gerar um mix sugerido.";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Cotacao de fornecedores
        </h2>
        <p className="text-muted-foreground">
          Compare custos efetivos e creditos tributarios por fornecedor.
        </p>
      </div>

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

      <QuoteForm contexto={contexto} onContextoChange={handleContextoChange} />

      <QuoteContextSummary contexto={contexto} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">
              Fornecedores avaliados
            </span>
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
            <span className="font-medium text-muted-foreground">
              Melhor custo efetivo
            </span>
            <Trophy className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {bestSupplierCost}
          </p>
          <p className="text-xs text-muted-foreground">{bestSupplierName}</p>
        </div>

        <div className="rounded-lg border bg-card/60 p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">
              Credito medio
            </span>
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
            <span className="font-medium text-muted-foreground">
              Ultima otimizacao
            </span>
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">
            {optimizationCost}
          </p>
          <p className="text-xs text-muted-foreground">{optimizationMessage}</p>
        </div>
      </div>

      {quoteInsights.alertSuppliers > 0 && (
        <div className="rounded-lg border border-dashed bg-yellow-50/40 p-4 text-sm text-yellow-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            <span className="font-semibold">
              {quoteInsights.alertSuppliers} fornecedor(es) com restricoes
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Revise limites contratuais e configuracoes tributarias antes de
            confirmar a cotacao final.
          </p>
        </div>
      )}

      <SupplierTable
        resultados={resultados}
        fornecedoresOriginais={fornecedores}
        produtos={produtosCatalogo}
        formatCurrency={formatCurrency}
        onAddSupplier={handleAddSupplier}
        onFieldChange={handleFornecedorChange}
        onFlagChange={handleFlagChange}
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
            <CardTitle>Resultado da ultima otimizacao</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>
              Custo total:{" "}
              <span className="font-medium text-foreground">
                {formatCurrency(ultimaOtimizacao.cost)}
              </span>
            </div>
            <div>
              Violacoes:{" "}
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
