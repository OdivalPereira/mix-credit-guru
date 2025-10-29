import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Printer, 
  Download, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  History,
  FileText
} from "lucide-react";
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
  Scatter,
  ScatterChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Legend,
  ResponsiveContainer
} from "recharts";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useAppStore } from "@/store/useAppStore";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { analisarImpactoProduto, calcularTotais } from "@/lib/impacto";
import { scenarioTimeline } from "@/data/scenarios";
import type { MixResultadoItem } from "@/types/domain";
import { toast } from "@/hooks/use-toast";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function Relatorios() {
  const resultado = useCotacaoStore((s) => s.resultado);
  const contexto = useCotacaoStore((s) => s.contexto);
  const fornecedores = useCotacaoStore((s) => s.fornecedores);
  const ultimaOtimizacao = useCotacaoStore((s) => s.ultimaOtimizacao);
  const scenario = useAppStore((s) => s.scenario);
  const { produtos: catalogo } = useCatalogoStore();

  const vencedores = resultado.itens.slice(0, 3);
  const mixData = calcularMix(vencedores, 1);

  // === SEÇÃO 2: Análise de Impacto da Reforma ===
  const impactoData = useMemo(() => {
    if (!contexto.uf || !contexto.regime || fornecedores.length === 0) return null;

    const analises = fornecedores
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

    if (analises.length === 0) return null;

    const totais = calcularTotais(analises);
    return { analises, totais };
  }, [fornecedores, catalogo, contexto]);

  // === SEÇÃO 3: Comparação entre Cenários ===
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

  // === GRÁFICOS AVANÇADOS ===
  
  // Gráfico de dispersão: Crédito vs Custo Efetivo
  const scatterData = useMemo(() => {
    return resultado.itens.map(item => ({
      nome: item.nome,
      credito: item.credito,
      custoEfetivo: item.custoEfetivo,
    }));
  }, [resultado.itens]);

  // Gráfico de pizza: Distribuição de mix otimizado
  const pieData = useMemo(() => {
    const total = mixData.reduce((sum, i) => sum + i.custoEfetivo, 0);
    return mixData.map((item, idx) => ({
      name: item.nome,
      value: total > 0 ? (item.custoEfetivo / total) * 100 : 0,
      color: CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }, [mixData]);

  // Gráfico de linha: Evolução de custos por cenário
  const lineData = useMemo(() => {
    if (!comparacaoCenarios) return [];

    return comparacaoCenarios.map(c => {
      const totalCusto = c.resultado.itens.reduce((sum, item) => sum + item.custoEfetivo, 0);
      return {
        ano: c.ano,
        custo: totalCusto,
        cenario: c.titulo,
      };
    });
  }, [comparacaoCenarios]);

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

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatório Consolidado</h2>
          <p className="text-muted-foreground">
            Hub analítico com fornecedores vencedores, impacto da reforma e comparação de cenários
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          <Button onClick={handleExportPDF} variant="outline">
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button onClick={handleExportExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Excel/CSV
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fornecedores" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="impacto">Impacto Reforma</TabsTrigger>
          <TabsTrigger value="cenarios">Cenários</TabsTrigger>
          <TabsTrigger value="otimizacao">Otimização</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        </TabsList>

        {/* SEÇÃO 1: Resumo de Fornecedores Vencedores */}
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
                        <TableHead className="text-right">Crédito (R$)</TableHead>
                        <TableHead className="text-right">Custo Efetivo (R$)</TableHead>
                        <TableHead className="text-right">Custo/Porção (R$)</TableHead>
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
                          <TableCell className="text-right">{formatCurrency(f.custoPorPorcao)}</TableCell>
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
                  <ChartContainer
                    config={{
                      custoEfetivo: {
                        label: "Custo Efetivo",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <BarChart data={mixData} layout="vertical">
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
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Nenhum fornecedor cadastrado. Acesse a página de Cotação para adicionar fornecedores.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SEÇÃO 2: Análise de Impacto da Reforma */}
        <TabsContent value="impacto" className="space-y-6">
          {impactoData ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Custo Total ANTES</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(impactoData.totais.totalAntes)}</div>
                    <p className="text-xs text-muted-foreground mt-1">ICMS + PIS/COFINS</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Custo Total DEPOIS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(impactoData.totais.totalDepois)}</div>
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
                        impactoData.totais.diferenca < 0 ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {formatCurrency(impactoData.totais.diferenca)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {impactoData.totais.diferenca < 0 ? "Economia" : "Aumento"}
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
                        impactoData.totais.percentual < 0 ? "text-green-600" : "text-orange-600"
                      }`}
                    >
                      {impactoData.totais.percentual < 0 ? (
                        <TrendingDown className="h-5 w-5" />
                      ) : (
                        <TrendingUp className="h-5 w-5" />
                      )}
                      {formatPercent(impactoData.totais.percentual)}
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
                      {impactoData.analises.map((a) => (
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

        {/* SEÇÃO 3: Comparação entre Cenários */}
        <TabsContent value="cenarios" className="space-y-6">
          {comparacaoCenarios && comparacaoCenarios.length > 0 ? (
            <>
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
                            <TableCell>
                              <Badge variant={c.scenarioKey === scenario ? "default" : "outline"}>
                                {c.ano}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{c.titulo}</TableCell>
                            <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                            <TableCell className="text-right">{c.resultado.itens.length}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gráfico de Linha: Evolução de Custos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      custo: {
                        label: "Custo Total",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="custo"
                        stroke="var(--color-custo)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Adicione fornecedores para comparar cenários.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SEÇÃO 4: Histórico de Otimizações */}
        <TabsContent value="otimizacao" className="space-y-6">
          {ultimaOtimizacao ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Última Otimização Executada
                  </CardTitle>
                  <CardDescription>
                    Resultado da última execução do algoritmo de otimização
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Otimizado</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(ultimaOtimizacao.cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Alocações</p>
                      <p className="text-2xl font-bold">
                        {Object.keys(ultimaOtimizacao.allocation).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={ultimaOtimizacao.violations.length === 0 ? "default" : "destructive"} className="mt-2">
                        {ultimaOtimizacao.violations.length === 0 ? "Otimização OK" : "Com Violações"}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-3">Alocação Otimizada</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fornecedor ID</TableHead>
                          <TableHead className="text-right">Quantidade Alocada</TableHead>
                          <TableHead>Nome</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(ultimaOtimizacao.allocation).map(([supplierId, qty]) => {
                          const supplier = fornecedores.find(f => f.id === supplierId);
                          return (
                            <TableRow key={supplierId}>
                              <TableCell className="font-medium">{supplierId}</TableCell>
                              <TableCell className="text-right">{qty}</TableCell>
                              <TableCell>{supplier?.nome || "N/A"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {ultimaOtimizacao.violations.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2 text-destructive">Violações Detectadas</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {ultimaOtimizacao.violations.map((v, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">{v}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">
                  Execute uma otimização na página de Cotação para ver os resultados aqui.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SEÇÃO 5: Gráficos Avançados */}
        <TabsContent value="graficos" className="space-y-6">
          {resultado.itens.length > 0 ? (
            <>
              {/* Gráfico de Dispersão: Crédito vs Custo Efetivo */}
              <Card>
                <CardHeader>
                  <CardTitle>Gráfico de Dispersão: Crédito vs Custo Efetivo</CardTitle>
                  <CardDescription>
                    Relação entre crédito fiscal e custo efetivo dos fornecedores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      credito: {
                        label: "Crédito",
                        color: "hsl(var(--chart-2))",
                      },
                      custoEfetivo: {
                        label: "Custo Efetivo",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="credito" name="Crédito" />
                      <YAxis type="number" dataKey="custoEfetivo" name="Custo Efetivo" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Scatter
                        name="Fornecedores"
                        data={scatterData}
                        fill="hsl(var(--chart-1))"
                      />
                    </ScatterChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Pizza: Distribuição de Mix */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Gráfico de Pizza: Distribuição de Mix Otimizado
                  </CardTitle>
                  <CardDescription>
                    Participação percentual de cada fornecedor no mix total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">
                  Adicione fornecedores e execute uma cotação para visualizar os gráficos.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function calcularMix(
  itens: MixResultadoItem[],
  porcoes: number,
): Array<MixResultadoItem & { mix: number; custoPorPorcao: number }> {
  const total = itens.reduce((sum, i) => sum + i.custoEfetivo, 0);
  return itens.map((i) => ({
    ...i,
    mix: total ? (i.custoEfetivo / total) * 100 : 0,
    custoPorPorcao: i.custoEfetivo / porcoes,
  }));
}
