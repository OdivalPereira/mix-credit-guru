import { useState, useMemo, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
  Printer,
  Download,
  ArrowLeft,
  Settings,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
  ResponsiveContainer,
  Line,
  LineChart,
  Scatter,
  ScatterChart
} from "recharts";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useAppStore } from "@/store/useAppStore";
import { useContractsStore } from "@/store/useContractsStore";
import { useUnidadesStore } from "@/store/useUnidadesStore";
import { analisarImpactoProduto, calcularTotais, type ProdutoAnalise } from "@/lib/impacto";
import { scenarioTimeline } from "@/data/scenarios";
import type { MixResultadoItem, Scenario } from "@/types/domain";
import { toast } from "@/hooks/use-toast";

interface ProdutoSelecionado {
  produtoId: string;
  quantidade: number;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

const getEffectiveCost = (item: MixResultadoItem) =>
  item.custoNormalizado ?? item.custoEfetivo;

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

const calcularMix = (vencedores: MixResultadoItem[], totalQuantidade: number) => {
  const totalCusto = vencedores.reduce((sum, item) => sum + item.custoEfetivo, 0);
  return vencedores.map(item => ({
    ...item,
    mix: totalCusto > 0 ? (item.custoEfetivo / totalCusto) * 100 : 0,
    custoPorPorcao: totalQuantidade > 0 ? item.custoEfetivo / totalQuantidade : 0,
  }));
};

/**
 * @description Página unificada para análises: Impacto, Cenários e Relatórios
 */
const Analise = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("impacto");

  // Stores
  const { produtos: catalogo } = useCatalogoStore();
  const { contexto, fornecedores, resultado, ultimaOtimizacao } = useCotacaoStore();
  const scenario = useAppStore((state) => state.scenario);
  const setScenario = useAppStore((state) => state.setScenario);
  const contratos = useContractsStore((state) => state.contratos);
  const conversoes = useUnidadesStore((state) => state.conversoes);
  const yields = useUnidadesStore((state) => state.yields);

  // Estado para Impacto
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([]);
  const [novoProdutoId, setNovoProdutoId] = useState<string>("");

  // Estado para Cenários
  const [compareYear, setCompareYear] = useState(
    () => scenarioTimeline[1]?.year ?? scenarioTimeline[0]?.year ?? "",
  );

  // === IMPACTO: Análises ===
  const analises = useMemo<ProdutoAnalise[]>(() => {
    if (!contexto.uf || !contexto.regime) return [];

    return produtosSelecionados
      .map((sel) => {
        const produto = catalogo.find((p) => p.id === sel.produtoId);
        if (!produto) return null;

        return analisarImpactoProduto(produto, sel.quantidade, {
          uf: contexto.uf,
          municipio: contexto.municipio,
          regime: contexto.regime,
          destino: contexto.destino,
          date: contexto.data,
          precoMedio: 100,
        });
      })
      .filter(Boolean) as ProdutoAnalise[];
  }, [produtosSelecionados, catalogo, contexto]);

  const totais = useMemo(() => calcularTotais(analises), [analises]);

  const chartDataImpacto = useMemo(() => {
    return analises.map((a) => ({
      nome: a.descricao.slice(0, 20),
      Antes: a.custoAntes,
      Depois: a.custoDepois,
    }));
  }, [analises]);

  // === CENÁRIOS: Comparação ===
  const baseOption = useMemo(() => {
    return (
      scenarioTimeline.find((option) => option.scenarioKey === scenario) ??
      scenarioTimeline[0]
    );
  }, [scenario]);

  const compareOption = useMemo(() => {
    return (
      scenarioTimeline.find((option) => option.year === compareYear) ??
      baseOption
    );
  }, [compareYear, baseOption]);

  const hasDados = fornecedores.length > 0;

  const baseResultado = useMemo(() => {
    if (!hasDados) return { itens: [] as MixResultadoItem[] };
    return useCotacaoStore.getState().computeResultado(baseOption.scenarioKey);
  }, [baseOption.scenarioKey, fornecedores, contexto, contratos, conversoes, yields, hasDados]);

  const compareResultado = useMemo(() => {
    if (!hasDados) return { itens: [] as MixResultadoItem[] };
    return useCotacaoStore.getState().computeResultado(compareOption.scenarioKey);
  }, [compareOption.scenarioKey, fornecedores, contexto, contratos, conversoes, yields, hasDados]);

  const allItemIds = useMemo(() => {
    const ids = new Set<string>();
    baseResultado.itens.forEach((item) => ids.add(item.id));
    compareResultado.itens.forEach((item) => ids.add(item.id));
    return Array.from(ids);
  }, [baseResultado.itens, compareResultado.itens]);

  const resumoComparacao = useMemo(() => {
    if (!hasDados) return null;
    const somaBase = baseResultado.itens.reduce((acc, item) => acc + getEffectiveCost(item), 0);
    const somaComparado = compareResultado.itens.reduce((acc, item) => acc + getEffectiveCost(item), 0);
    const variacao = somaComparado - somaBase;
    const percentual = somaBase > 0 ? (variacao / somaBase) * 100 : 0;
    return { somaBase, somaComparado, variacao, percentual };
  }, [baseResultado.itens, compareResultado.itens, hasDados]);

  // === RELATÓRIOS: Dados ===
  const vencedores = resultado.itens.slice(0, 3);
  const mixData = calcularMix(vencedores, 1);

  const impactoDataRelatorio = useMemo(() => {
    if (!contexto.uf || !contexto.regime || fornecedores.length === 0) return null;

    const analisesRel = fornecedores
      .filter(f => f.ativo && f.produtoId)
      .map(f => {
        const produto = catalogo.find(p => p.id === f.produtoId);
        if (!produto) return null;

        return analisarImpactoProduto(produto, 1, {
          uf: contexto.uf,
          municipio: contexto.municipio,
          regime: contexto.regime,
          destino: contexto.destino,
          date: contexto.data || new Date().toISOString(),
          precoMedio: f.preco || 100,
        });
      })
      .filter(Boolean);

    if (analisesRel.length === 0) return null;

    const totaisRel = calcularTotais(analisesRel);
    return { analises: analisesRel, totais: totaisRel };
  }, [fornecedores, catalogo, contexto]);

  const comparacaoCenarios = useMemo(() => {
    if (fornecedores.length === 0) return null;

    const computeResultado = useCotacaoStore.getState().computeResultado;
    const resultados = scenarioTimeline.map(s => ({
      ano: s.year,
      titulo: s.data.title,
      scenarioKey: s.scenarioKey,
      resultado: computeResultado(s.scenarioKey),
    }));

    return resultados;
  }, [fornecedores, contexto]);

  // === HANDLERS: Impacto ===
  const handleAdicionarProduto = () => {
    if (!novoProdutoId) return;
    if (produtosSelecionados.some((p) => p.produtoId === novoProdutoId)) return;
    setProdutosSelecionados([...produtosSelecionados, { produtoId: novoProdutoId, quantidade: 1 }]);
    setNovoProdutoId("");
  };

  const handleRemoverProduto = (produtoId: string) => {
    setProdutosSelecionados(produtosSelecionados.filter((p) => p.produtoId !== produtoId));
  };

  const handleQuantidadeChange = (produtoId: string, quantidade: number) => {
    setProdutosSelecionados(
      produtosSelecionados.map((p) =>
        p.produtoId === produtoId ? { ...p, quantidade: Math.max(1, quantidade) } : p
      )
    );
  };

  const handleCotarFornecedores = () => {
    const produtosIds = produtosSelecionados.map(p => p.produtoId);
    sessionStorage.setItem("impacto-produtos", JSON.stringify(produtosIds));
    navigate("/cotacao");
    toast({
      title: "Redirecionando para Cotação",
      description: `${produtosSelecionados.length} produto(s) selecionado(s) para cotação`,
    });
  };

  // === HANDLERS: Cenários ===
  const handleBaseYearChange = (year: string) => {
    const option = scenarioTimeline.find((item) => item.year === year);
    if (option) {
      setScenario(option.scenarioKey);
    }
  };

  // === HANDLERS: Relatórios ===
  const handlePrint = () => window.print();

  const handleExportPDF = () => {
    window.print();
    toast({ title: "Exportar PDF", description: "Use a função de impressão do navegador para salvar como PDF" });
  };

  const handleExportExcel = () => {
    const csvData = useCotacaoStore.getState().exportarCSV();
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `relatorio_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: "Relatório exportado em formato CSV" });
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

        {/* TAB 1: IMPACTO */}
        <TabsContent value="impacto" className="space-y-6 mt-0">
          {needsContext && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Configure o contexto na página de <a href="/cotacao" className="underline">Cotação</a> (Estado, Regime
                Tributário) antes de fazer a análise.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Produtos para Análise
              </CardTitle>
              <CardDescription>
                Compare o custo ANTES (ICMS + PIS/COFINS) e DEPOIS (IBS + CBS) da reforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Produto</Label>
                  <Select value={novoProdutoId} onValueChange={setNovoProdutoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto do catálogo" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalogo.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={produtosSelecionados.some((sel) => sel.produtoId === p.id)}
                        >
                          {p.descricao} ({p.ncm})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAdicionarProduto} disabled={!novoProdutoId || needsContext}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {produtosSelecionados.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>NCM</TableHead>
                        <TableHead className="w-32">Quantidade</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosSelecionados.map((sel) => {
                        const produto = catalogo.find((p) => p.id === sel.produtoId);
                        if (!produto) return null;
                        return (
                          <TableRow key={sel.produtoId}>
                            <TableCell className="font-medium">{produto.descricao}</TableCell>
                            <TableCell className="text-muted-foreground">{produto.ncm}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={sel.quantidade}
                                onChange={(e) =>
                                  handleQuantidadeChange(sel.produtoId, Number(e.target.value))
                                }
                                className="w-24"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoverProduto(sel.produtoId)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {analises.length > 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Comparação de Custos</CardTitle>
                  <CardDescription>Impacto da reforma em cada produto</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Antes</TableHead>
                        <TableHead className="text-right">Depois</TableHead>
                        <TableHead className="text-right">Diferença</TableHead>
                        <TableHead className="text-right">Impacto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analises.map((a) => (
                        <TableRow key={a.produtoId}>
                          <TableCell className="font-medium">
                            {a.descricao}
                            <div className="text-xs text-muted-foreground">
                              {a.quantidade} {a.unidade}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(a.custoAntes)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(a.custoDepois)}</TableCell>
                          <TableCell className="text-right">
                            <span className={a.diferenca < 0 ? "text-green-600" : "text-orange-600"}>
                              {formatCurrency(a.diferenca)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={a.diferenca < 0 ? "default" : "secondary"}>
                              {a.diferenca < 0 ? (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              )}
                              {formatPercent(a.percentual)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Custo Total ANTES</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totais.totalAntes)}</div>
                    <p className="text-xs text-muted-foreground mt-1">ICMS + PIS/COFINS</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Custo Total DEPOIS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totais.totalDepois)}</div>
                    <p className="text-xs text-muted-foreground mt-1">IBS + CBS - Crédito</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Diferença</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        totais.diferenca < 0 ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {formatCurrency(totais.diferenca)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totais.diferenca < 0 ? "Economia" : "Aumento"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Impacto %</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        totais.percentual < 0 ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {formatPercent(totais.percentual)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Variação relativa</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Visualização Comparativa</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartDataImpacto}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="nome" className="text-xs" />
                      <YAxis />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  {payload.map((entry, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-sm font-medium">{entry.name}:</span>
                                      <span className="text-sm">{formatCurrency(Number(entry.value))}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="Antes" fill="hsl(var(--primary))" name="Antes (ICMS + PIS/COFINS)" />
                      <Bar dataKey="Depois" fill="hsl(var(--chart-2))" name="Depois (IBS + CBS)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Próximos Passos
                  </CardTitle>
                  <CardDescription>
                    Use esta análise para buscar os melhores fornecedores no mercado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleCotarFornecedores} size="lg" className="w-full md:w-auto">
                    Cotar Fornecedores para estes Produtos
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-sm text-muted-foreground mt-3">
                    Esta lista será usada como base para adicionar e comparar fornecedores na página de Cotação.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB 2: CENÁRIOS */}
        <TabsContent value="cenarios" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Configuração dos cenários
              </CardTitle>
              <CardDescription>
                O cenário base é aplicado em Cotação, Relatórios e regras fiscais. Use a comparação para testar alternativas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cenário base (ativo)</label>
                  <Select value={baseOption.year} onValueChange={handleBaseYearChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarioTimeline.map((option) => (
                        <SelectItem key={`base-${option.year}`} value={option.year}>
                          {option.year} - {option.data.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comparar com</label>
                  <Select value={compareOption.year} onValueChange={setCompareYear}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarioTimeline.map((option) => (
                        <SelectItem key={`compare-${option.year}`} value={option.year}>
                          {option.year} - {option.data.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Ano: {baseOption.year}</Badge>
                <Badge variant="secondary">{baseOption.data.title}</Badge>
                {getImpactBadge(baseOption.data.impact)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{baseOption.data.title}</CardTitle>
                {getImpactBadge(baseOption.data.impact)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 text-lg font-semibold">Principais mudanças</h3>
                <p className="text-muted-foreground">{baseOption.data.changes}</p>
              </div>
            </CardContent>
          </Card>

          {!hasDados ? (
            <Card>
              <CardHeader>
                <CardTitle>Comparar cenários</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Cadastre fornecedores e execute uma cotação para habilitar o comparador de cenários.
              </CardContent>
            </Card>
          ) : (
            <>
              {resumoComparacao && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo financeiro</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Cenário base</p>
                      <p className="text-2xl font-semibold">
                        {formatCurrency(resumoComparacao.somaBase)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cenário comparado</p>
                      <p className="text-2xl font-semibold">
                        {formatCurrency(resumoComparacao.somaComparado)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Variação</p>
                      <p
                        className={`text-2xl font-semibold ${
                          resumoComparacao.variacao >= 0 ? "text-destructive" : "text-success"
                        }`}
                      >
                        {formatCurrency(resumoComparacao.variacao)}
                      </p>
                      <Badge
                        variant={resumoComparacao.percentual >= 0 ? "destructive" : "success"}
                        className="mt-2"
                      >
                        {resumoComparacao.percentual >= 0 ? "+" : ""}
                        {resumoComparacao.percentual.toFixed(2)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Resumo por item</CardTitle>
                  <CardDescription>
                    Custos consideram contratos, conversões e rendimentos globais ou específicos por produto.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">{baseOption.data.title}</TableHead>
                        <TableHead className="text-right">{compareOption.data.title}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allItemIds.map((itemId) => {
                        const baseItem = baseResultado.itens.find((item) => item.id === itemId);
                        const compareItem = compareResultado.itens.find((item) => item.id === itemId);
                        const descricao = baseItem?.nome ?? compareItem?.nome ?? itemId;
                        return (
                          <TableRow key={`row-${itemId}`}>
                            <TableCell>{descricao}</TableCell>
                            <TableCell className="text-right">
                              {baseItem ? formatCurrency(getEffectiveCost(baseItem)) : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {compareItem ? formatCurrency(getEffectiveCost(compareItem)) : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB 3: RELATÓRIOS */}
        <TabsContent value="relatorios" className="space-y-6 mt-0">
          <Tabs defaultValue="fornecedores" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
              <TabsTrigger value="impacto">Impacto Reforma</TabsTrigger>
              <TabsTrigger value="cenarios">Cenários</TabsTrigger>
            </TabsList>

            <TabsContent value="fornecedores" className="space-y-6">
              {mixData.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Fornecedores Vencedores
                      </CardTitle>
                      <CardDescription>Top 3 com base na cotação atual</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fornecedor</TableHead>
                            <TableHead className="text-right">Mix %</TableHead>
                            <TableHead className="text-right">Crédito</TableHead>
                            <TableHead className="text-right">Custo Efetivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mixData.map((f) => (
                            <TableRow key={f.id}>
                              <TableCell className="font-medium">{f.nome}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary">{f.mix.toFixed(1)}%</Badge>
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(f.credito)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(f.custoEfetivo)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Comparativo de Custos Efetivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={mixData} layout="vertical">
                          <CartesianGrid vertical={false} />
                          <XAxis type="number" dataKey="custoEfetivo" hide />
                          <YAxis
                            dataKey="nome"
                            type="category"
                            width={150}
                            tick={{ fontSize: 12 }}
                          />
                          <ChartTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <p className="text-sm font-medium">{payload[0].payload.nome}</p>
                                    <p className="text-sm">{formatCurrency(Number(payload[0].value))}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="custoEfetivo"
                            fill="hsl(var(--chart-1))"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">
                      Nenhum fornecedor cadastrado. Acesse a página de Cotação para adicionar fornecedores.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="impacto" className="space-y-6">
              {impactoDataRelatorio ? (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Custo Total ANTES</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(impactoDataRelatorio.totais.totalAntes)}</div>
                        <p className="text-xs text-muted-foreground mt-1">ICMS + PIS/COFINS</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Custo Total DEPOIS</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(impactoDataRelatorio.totais.totalDepois)}</div>
                        <p className="text-xs text-muted-foreground mt-1">IBS + CBS - Crédito</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Diferença</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold ${
                            impactoDataRelatorio.totais.diferenca < 0 ? "text-green-600" : "text-orange-600"
                          }`}
                        >
                          {formatCurrency(impactoDataRelatorio.totais.diferenca)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {impactoDataRelatorio.totais.diferenca < 0 ? "Economia" : "Aumento"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Impacto %</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold flex items-center gap-2 ${
                            impactoDataRelatorio.totais.percentual < 0 ? "text-green-600" : "text-orange-600"
                          }`}
                        >
                          {impactoDataRelatorio.totais.percentual < 0 ? (
                            <TrendingDown className="h-5 w-5" />
                          ) : (
                            <TrendingUp className="h-5 w-5" />
                          )}
                          {formatPercent(impactoDataRelatorio.totais.percentual)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Variação relativa</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Comparação Detalhada por Produto</CardTitle>
                      <CardDescription>Análise ANTES vs DEPOIS da reforma</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Antes</TableHead>
                            <TableHead className="text-right">Depois</TableHead>
                            <TableHead className="text-right">Diferença</TableHead>
                            <TableHead className="text-right">Impacto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {impactoDataRelatorio.analises.map((a) => (
                            <TableRow key={a.produtoId}>
                              <TableCell className="font-medium">{a.descricao}</TableCell>
                              <TableCell className="text-right">{formatCurrency(a.custoAntes)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(a.custoDepois)}</TableCell>
                              <TableCell className="text-right">
                                <span className={a.diferenca < 0 ? "text-green-600" : "text-orange-600"}>
                                  {formatCurrency(a.diferenca)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={a.diferenca < 0 ? "default" : "secondary"}>
                                  {formatPercent(a.percentual)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">
                      Configure o contexto (UF, Regime) e adicione fornecedores para ver a análise de impacto.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cenarios" className="space-y-6">
              {comparacaoCenarios && comparacaoCenarios.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparação de Custos por Cenário</CardTitle>
                    <CardDescription>
                      Evolução dos custos nos diferentes marcos da reforma tributária
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ano</TableHead>
                          <TableHead>Cenário</TableHead>
                          <TableHead className="text-right">Custo Total</TableHead>
                          <TableHead className="text-right">Nº Itens</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparacaoCenarios.map((c) => {
                          const total = c.resultado.itens.reduce((sum, i) => sum + i.custoEfetivo, 0);
                          return (
                            <TableRow key={c.scenarioKey}>
                              <TableCell className="font-medium">{c.ano}</TableCell>
                              <TableCell>{c.titulo}</TableCell>
                              <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                              <TableCell className="text-right">{c.resultado.itens.length}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-40">
                    <p className="text-muted-foreground">
                      Cadastre fornecedores para ver a comparação entre cenários.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analise;
