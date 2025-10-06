import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import type { Supplier } from "@/types/domain";
import { toast } from "@/components/ui/use-toast";
import { QuoteForm } from "@/components/quote/QuoteForm";
import { SupplierTable } from "@/components/quote/SupplierTable";

export default function Cotacao() {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const supplierTableContainerRef = useRef<HTMLDivElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const [mostrarGrafico, setMostrarGrafico] = useState(false);
  const [optProgress, setOptProgress] = useState(0);
  const [optimizing, setOptimizing] = useState(false);
  const [optStatusMessage, setOptStatusMessage] = useState<string | null>(null);

  const formatCurrency = useCallback(
    (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );

  const {
    contexto,
    setContexto,
    fornecedores,
    resultado,
    upsertFornecedor,
    removeFornecedor,
    importarCSV,
    exportarCSV,
    importarJSON,
    exportarJSON,
    limpar,
    calcular,
  } = useCotacaoStore();

  const resultados = useMemo(() => resultado.itens, [resultado.itens]);

  useEffect(() => {
    calcular();
  }, [contexto, fornecedores, calcular]);

  const handleContextoChange = useCallback((key: keyof typeof contexto, value: string) => {
    setContexto({ [key]: value });
  }, [setContexto]);

  const numericFields = useMemo<Array<keyof Supplier>>(() => ["preco", "frete"], []);

  const isNumericField = (
    f: keyof Supplier,
  ): f is (typeof numericFields)[number] => numericFields.includes(f);

  const handleFornecedorChange = useCallback((
    id: string,
    field: keyof Supplier,
    value: string,
  ) => {
    const original = fornecedores.find((f) => f.id === id) as Supplier;
    upsertFornecedor({
      id,
      ...original,
      [field]: isNumericField(field) ? parseFloat(value) || 0 : value,
    });
  }, [fornecedores, upsertFornecedor]);

  const handleDuplicate = useCallback((f: Supplier) => {
    const { id, ...rest } = f;
    upsertFornecedor({ ...rest });
  }, [upsertFornecedor]);

  const handleImportCSV = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importarCSV(text);
    e.target.value = "";
  }, [importarCSV]);

  const handleExportCSV = useCallback(() => {
    const csv = exportarCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fornecedores.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportarCSV]);

  const handleImportJSON = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importarJSON(text);
    e.target.value = "";
  }, [importarJSON]);

  const handleExportJSON = useCallback(() => {
    const json = exportarJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cotacao.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [exportarJSON]);

  const handleOptimize = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(
      new URL("../workers/optWorker.ts", import.meta.url),
      { type: "module" }
    );
    workerRef.current = worker;
    setOptimizing(true);
    setOptProgress(0);
    setOptStatusMessage("Estamos preparando a otimização dos fornecedores...");
    worker.postMessage({
      quantity: 100,
      offers: fornecedores.map((f) => ({ id: f.id, price: f.preco })),
    });
    worker.onmessage = (e) => {
      type WorkerMessage =
        | { type: "progress"; value: number }
        | { type: "result" }
        | { type: "error"; message: string };

      const msg = e.data as WorkerMessage;

      if (msg.type === "progress") {
        setOptProgress(msg.value);
        if (msg.value >= 1) {
          setOptStatusMessage(
            `Otimizando cotação... ${Math.round(msg.value)}% concluído.`,
          );
        }
      } else if (msg.type === "result") {
        setOptProgress(100);
        setOptimizing(false);
        setOptStatusMessage(null);
        workerRef.current?.terminate();
        workerRef.current = null;
      } else if (msg.type === "error") {
        setOptimizing(false);
        setOptStatusMessage(null);
        setOptProgress(0);
        toast({
          variant: "destructive",
          title: "Erro na otimização",
          description:
            msg.message || "Não foi possível concluir a otimização.",
        });
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    };
    worker.onerror = (event) => {
      setOptimizing(false);
      setOptStatusMessage(null);
      setOptProgress(0);
      toast({
        variant: "destructive",
        title: "Erro na otimização",
        description:
          event.message || "Não foi possível concluir a otimização.",
      });
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [fornecedores]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFlagChange = useCallback((
    id: string,
    flag: "cesta" | "reducao" | "refeicao",
    value: boolean,
  ) => {
    const original = fornecedores.find((f) => f.id === id) as Supplier;
    if (flag === "refeicao") {
      upsertFornecedor({ id, ...original, isRefeicaoPronta: value });
    } else {
      upsertFornecedor({
        id,
        ...original,
        flagsItem: { ...original.flagsItem, [flag]: value },
      });
    }
  }, [fornecedores, upsertFornecedor]);

  const getCreditBadge = useCallback((creditavel: boolean, credito: number) => {
    if (!creditavel) return <Badge variant="creditNo">ɸ Não creditável</Badge>;
    if (credito > 15) return <Badge variant="creditYes">✓ Crédito total</Badge>;
    return <Badge variant="creditLimited">! Crédito limitado</Badge>;
  }, []);

  const handleAddSupplier = useCallback(() => {
    upsertFornecedor({
      nome: "",
      tipo: "",
      regime: "",
      preco: 0,
      ibs: 0,
      cbs: 0,
      is: 0,
      frete: 0,
      flagsItem: { cesta: false, reducao: false },
      isRefeicaoPronta: false,
    });
  }, [upsertFornecedor]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cotação de Fornecedores</h2>
        <p className="text-muted-foreground">
          Compare fornecedores considerando créditos tributários e custos efetivos
        </p>
      </div>

      {/* Hidden file inputs */}
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

      {/* Quote Form */}
      <QuoteForm 
        contexto={contexto} 
        onContextoChange={handleContextoChange} 
      />

      {/* Supplier Table */}
      <SupplierTable
        resultados={resultados}
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
        onToggleChart={() => setMostrarGrafico((v) => !v)}
        onOptimize={handleOptimize}
        getCreditBadge={getCreditBadge}
        showChart={mostrarGrafico}
        optimizing={optimizing}
        optProgress={optProgress}
        optStatusMessage={optStatusMessage}
        containerRef={supplierTableContainerRef}
      />

      {/* Chart */}
      {mostrarGrafico && resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custos Efetivos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ custoEfetivo: { label: "Custo Efetivo", color: "hsl(var(--chart-1))" } }}
              className="h-[300px]"
            >
              <BarChart data={resultados} layout="vertical">
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

      {/* Supply Chain */}
      {resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cadeia de Fornecimento</CardTitle>
            <CardDescription>
              Painel de cadeia com até quatro estágios por fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {resultados.map((r) => (
                <AccordionItem key={r.id} value={r.id}>
                  <AccordionTrigger>{r.nome}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded border p-2 text-center text-sm"
                        >
                          Estágio {i + 1}
                        </div>
                      ))}
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
