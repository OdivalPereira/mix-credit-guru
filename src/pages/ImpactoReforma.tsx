import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { analisarImpactoProduto, calcularTotais, type ProdutoAnalise } from "@/lib/impacto";
import { ArrowRight, Plus, Trash2, TrendingDown, TrendingUp, AlertCircle, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ProdutoSelecionado {
  produtoId: string;
  quantidade: number;
}

export default function ImpactoReforma() {
  const navigate = useNavigate();
  const { produtos: catalogo } = useCatalogoStore();
  const { contexto } = useCotacaoStore();
  const [produtosSelecionados, setProdutosSelecionados] = useState<ProdutoSelecionado[]>([]);
  const [novoProdutoId, setNovoProdutoId] = useState<string>("");

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

  const chartData = useMemo(() => {
    return analises.map((a) => ({
      nome: a.descricao.slice(0, 20),
      Antes: a.custoAntes,
      Depois: a.custoDepois,
    }));
  }, [analises]);

  const handleAdicionarProduto = () => {
    if (!novoProdutoId) return;
    if (produtosSelecionados.some((p) => p.produtoId === novoProdutoId)) {
      return;
    }
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
    navigate("/cotacao");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatPercent = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

  const needsContext = !contexto.uf || !contexto.regime;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Impacto da Reforma Tributária</h1>
        <p className="text-muted-foreground">
          Compare o custo dos seus produtos ANTES (ICMS + PIS/COFINS) e DEPOIS (IBS + CBS) da reforma
        </p>
      </div>

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
            Meus Produtos para Análise
          </CardTitle>
          <CardDescription>Adicione produtos do catálogo para comparar os custos</CardDescription>
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
              <div className="border rounded-lg overflow-hidden">
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
              </div>
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
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="nome" className="text-xs" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ borderRadius: "8px" }}
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
    </div>
  );
}
