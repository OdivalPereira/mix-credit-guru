
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ChartTooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface RelatoriosTabProps {
    mixData: any[];
    formatCurrency: (val: number) => string;
    impactoDataRelatorio: any;
    formatPercent: (val: number) => string;
    comparacaoCenarios: any[];
}

export const RelatoriosTab = ({
    mixData,
    formatCurrency,
    impactoDataRelatorio,
    formatPercent,
    comparacaoCenarios
}: RelatoriosTabProps) => {
    return (
        <div className="space-y-6">
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
                                            className={`text-2xl font-bold ${impactoDataRelatorio.totais.diferenca < 0 ? "text-green-600" : "text-orange-600"
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
                                            className={`text-2xl font-bold flex items-center gap-2 ${impactoDataRelatorio.totais.percentual < 0 ? "text-green-600" : "text-orange-600"
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
                                            {impactoDataRelatorio.analises.map((a: any) => (
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
                                            const total = c.resultado.itens.reduce((sum: number, i: any) => sum + i.custoEfetivo, 0);
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
        </div>
    );
};
