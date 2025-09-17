import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, ArrowDown, ArrowUp, RefreshCcw } from "lucide-react";

interface ScenarioItem {
  id: string;
  descricao: string;
  custo: number;
  custoNormalizado: number;
}

interface ScenarioData {
  id: string;
  nome: string;
  fornecedorVencedor: string;
  itens: ScenarioItem[];
}

const defaultScenarios: ScenarioData[] = [
  {
    id: "atual",
    nome: "Cenário Atual",
    fornecedorVencedor: "Fornecedor A",
    itens: [
      { id: "arroz", descricao: "Arroz 5kg", custo: 18.5, custoNormalizado: 18.5 },
      { id: "feijao", descricao: "Feijão 1kg", custo: 8.2, custoNormalizado: 8.2 },
      { id: "oleo", descricao: "Óleo 900ml", custo: 6.4, custoNormalizado: 6.4 },
    ],
  },
  {
    id: "contrato",
    nome: "Contrato Degrau",
    fornecedorVencedor: "Fornecedor B",
    itens: [
      { id: "arroz", descricao: "Arroz 5kg", custo: 17.9, custoNormalizado: 17.1 },
      { id: "feijao", descricao: "Feijão 1kg", custo: 8.5, custoNormalizado: 8.0 },
      { id: "oleo", descricao: "Óleo 900ml", custo: 6.1, custoNormalizado: 6.1 },
    ],
  },
  {
    id: "otimizado",
    nome: "Mix Otimizado",
    fornecedorVencedor: "Fornecedor C",
    itens: [
      { id: "arroz", descricao: "Arroz 5kg", custo: 18.1, custoNormalizado: 16.8 },
      { id: "feijao", descricao: "Feijão 1kg", custo: 7.9, custoNormalizado: 7.9 },
      { id: "oleo", descricao: "Óleo 900ml", custo: 6.0, custoNormalizado: 6.0 },
    ],
  },
];

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CompararCenarios() {
  const [cenarios, setCenarios] = useState<ScenarioData[]>(defaultScenarios);
  const [cenarioBase, setCenarioBase] = useState<string>(defaultScenarios[0].id);
  const [cenarioComparado, setCenarioComparado] = useState<string>(defaultScenarios[1].id);

  const base = useMemo(() => cenarios.find((c) => c.id === cenarioBase) ?? cenarios[0], [cenarios, cenarioBase]);
  const comparado = useMemo(
    () => cenarios.find((c) => c.id === cenarioComparado) ?? cenarios[1] ?? cenarios[0],
    [cenarios, cenarioComparado],
  );

  const itensUnificados = useMemo(() => {
    const mapa = new Map<string, ScenarioItem & { descricao: string }>();
    cenarios.forEach((cenario) => {
      cenario.itens.forEach((item) => {
        if (!mapa.has(item.id)) {
          mapa.set(item.id, { ...item });
        }
      });
    });
    return Array.from(mapa.values());
  }, [cenarios]);

  const rankingVencedores = useMemo(() => {
    return itensUnificados.map((item) => {
      const custos = cenarios.map((cenario) => ({
        cenario: cenario.id,
        custo: cenario.itens.find((i) => i.id === item.id)?.custoNormalizado ?? Number.POSITIVE_INFINITY,
      }));
      const vencedor = custos.reduce((prev, current) => (current.custo < prev.custo ? current : prev));
      return { itemId: item.id, vencedor: vencedor.cenario };
    });
  }, [cenarios, itensUnificados]);

  const resumoComparacao = useMemo(() => {
    if (!base || !comparado) return null;
    const somaBase = base.itens.reduce((acc, item) => acc + item.custoNormalizado, 0);
    const somaComparado = comparado.itens.reduce((acc, item) => acc + item.custoNormalizado, 0);
    const variacao = somaComparado - somaBase;
    const percentual = somaBase ? (variacao / somaBase) * 100 : 0;
    return {
      somaBase,
      somaComparado,
      variacao,
      percentual,
    };
  }, [base, comparado]);

  const recomputarMix = () => {
    setCenarios((prev) =>
      prev.map((cenario) => ({
        ...cenario,
        itens: cenario.itens.map((item) => ({
          ...item,
          custoNormalizado: Number((item.custoNormalizado * 0.995).toFixed(2)),
        })),
      })),
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Comparação de Cenários</h2>
        <p className="text-muted-foreground">
          Analise lado a lado os impactos de contratos, mix otimizado e condições especiais
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Selecione cenários para comparar e recalcular rendimentos</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Cenário base</Label>
            <Select value={cenarioBase} onValueChange={setCenarioBase}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cenarios.map((cenario) => (
                  <SelectItem key={`base-${cenario.id}`} value={cenario.id}>
                    {cenario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Cenário comparação</Label>
            <Select value={cenarioComparado} onValueChange={setCenarioComparado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cenarios
                  .filter((cenario) => cenario.id !== cenarioBase)
                  .map((cenario) => (
                    <SelectItem key={`comp-${cenario.id}`} value={cenario.id}>
                      {cenario.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Normalização</Label>
            <Button variant="outline" className="w-full" onClick={recomputarMix}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Recalcular custo normalizado
            </Button>
            <p className="text-xs text-muted-foreground">
              Atualiza todos os cenários aplicando ajustes de rendimento e conversões.
            </p>
          </div>
        </CardContent>
      </Card>

      {base && comparado && resumoComparacao && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo financeiro</CardTitle>
            <CardDescription>Variação total considerando custos normalizados</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total base</span>
                <span className="text-xl font-semibold">{formatCurrency(resumoComparacao.somaBase)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total comparado</span>
                <span className="text-xl font-semibold">{formatCurrency(resumoComparacao.somaComparado)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Variação absoluta</span>
                <span
                  className={`flex items-center gap-1 text-lg font-semibold ${
                    resumoComparacao.variacao >= 0 ? "text-destructive" : "text-success"
                  }`}
                >
                  {resumoComparacao.variacao >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {formatCurrency(Math.abs(resumoComparacao.variacao))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Variação percentual</span>
                <Badge variant={resumoComparacao.percentual >= 0 ? "destructive" : "success"}>
                  {resumoComparacao.percentual >= 0 ? "+" : ""}
                  {resumoComparacao.percentual.toFixed(2)}%
                </Badge>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Vencedores por item</h4>
                <p className="text-sm text-muted-foreground">
                  O mapa indica qual cenário possui o menor custo normalizado para cada item.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {rankingVencedores.map((info) => {
                  const vencedor = cenarios.find((c) => c.id === info.vencedor);
                  const item = itensUnificados.find((i) => i.id === info.itemId);
                  return (
                    <Card key={`winner-${info.itemId}`} className="border border-primary/30">
                      <CardContent className="p-3">
                        <div className="text-xs text-muted-foreground">{item?.descricao}</div>
                        <div className="text-sm font-semibold">{vencedor?.nome}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue={cenarioBase} className="space-y-4">
        <TabsList>
          {cenarios.map((cenario) => (
            <TabsTrigger key={`tab-${cenario.id}`} value={cenario.id}>
              {cenario.nome}
            </TabsTrigger>
          ))}
        </TabsList>
        {cenarios.map((cenario) => {
          const total = cenario.itens.reduce((acc, item) => acc + item.custoNormalizado, 0);
          return (
            <TabsContent key={`content-${cenario.id}`} value={cenario.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{cenario.nome}</CardTitle>
                  <CardDescription>Fornecedor líder: {cenario.fornecedorVencedor}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Custo</TableHead>
                        <TableHead className="text-right">Custo normalizado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cenario.itens.map((item) => (
                        <TableRow key={`${cenario.id}-${item.id}`}>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.custo)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.custoNormalizado)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-semibold">Total</TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Itens: {cenario.itens.length}</Badge>
                    <Badge variant="outline">Fornecedor destaque: {cenario.fornecedorVencedor}</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Alertas de restrição</CardTitle>
          <CardDescription>Identifique limitações aplicadas ao comparar cenários</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <span>Valores normalizados simulados consideram degraus e yield cadastrados na tela de contratos.</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Ajuste os parâmetros nas telas de contratos e unidades para refinar o comportamento deste comparativo.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
