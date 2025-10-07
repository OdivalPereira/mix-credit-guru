import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";

import { scenarioTimeline } from "@/data/scenarios";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useContractsStore } from "@/store/useContractsStore";
import { useUnidadesStore } from "@/store/useUnidadesStore";
import type { MixResultadoItem } from "@/types/domain";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getEffectiveCost = (item: MixResultadoItem) =>
  item.custoNormalizado ?? item.custoEfetivo;

export default function CompararCenarios() {
  const fornecedores = useCotacaoStore((state) => state.fornecedores);
  const contexto = useCotacaoStore((state) => state.contexto);
  const contratos = useContractsStore((state) => state.contratos);
  const conversoes = useUnidadesStore((state) => state.conversoes);
  const yields = useUnidadesStore((state) => state.yields);

  const defaultBase = scenarioTimeline[0];
  const defaultCompare = scenarioTimeline[1] ?? scenarioTimeline[0];

  const [baseYear, setBaseYear] = useState(defaultBase.year);
  const [compareYear, setCompareYear] = useState(defaultCompare.year);

  const baseOption =
    scenarioTimeline.find((option) => option.year === baseYear) ?? defaultBase;
  const compareOption =
    scenarioTimeline.find((option) => option.year === compareYear) ?? defaultCompare;

  const hasDados = fornecedores.length > 0;

  const baseResultado = useMemo(() => {
    if (!hasDados) {
      return { itens: [] as MixResultadoItem[] };
    }
    return useCotacaoStore
      .getState()
      .computeResultado(baseOption.scenarioKey);
  }, [
    baseOption.scenarioKey,
    fornecedores,
    contexto,
    contratos,
    conversoes,
    yields,
    hasDados,
  ]);

  const compareResultado = useMemo(() => {
    if (!hasDados) {
      return { itens: [] as MixResultadoItem[] };
    }
    return useCotacaoStore
      .getState()
      .computeResultado(compareOption.scenarioKey);
  }, [
    compareOption.scenarioKey,
    fornecedores,
    contexto,
    contratos,
    conversoes,
    yields,
    hasDados,
  ]);

  const allItemIds = useMemo(() => {
    const ids = new Set<string>();
    baseResultado.itens.forEach((item) => ids.add(item.id));
    compareResultado.itens.forEach((item) => ids.add(item.id));
    return Array.from(ids);
  }, [baseResultado.itens, compareResultado.itens]);

  const resumoComparacao = useMemo(() => {
    if (!hasDados) {
      return null;
    }
    const somaBase = baseResultado.itens.reduce(
      (acc, item) => acc + getEffectiveCost(item),
      0,
    );
    const somaComparado = compareResultado.itens.reduce(
      (acc, item) => acc + getEffectiveCost(item),
      0,
    );
    const variacao = somaComparado - somaBase;
    const percentual = somaBase > 0 ? (variacao / somaBase) * 100 : 0;
    return {
      somaBase,
      somaComparado,
      variacao,
      percentual,
    };
  }, [baseResultado.itens, compareResultado.itens, hasDados]);

  const rankingVencedores = useMemo(() => {
    return allItemIds.map((itemId) => {
      const baseItem = baseResultado.itens.find((item) => item.id === itemId);
      const compareItem = compareResultado.itens.find((item) => item.id === itemId);
      const custos = [
        baseItem ? { scenario: baseOption.data.title, custo: getEffectiveCost(baseItem) } : null,
        compareItem
          ? { scenario: compareOption.data.title, custo: getEffectiveCost(compareItem) }
          : null,
      ].filter(Boolean) as { scenario: string; custo: number }[];

      if (custos.length === 0) {
        return { itemId, vencedor: "Sem dados" };
      }

      const vencedor = custos.reduce((prev, current) =>
        current.custo < prev.custo ? current : prev,
      );
      return { itemId, vencedor: vencedor.scenario };
    });
  }, [allItemIds, baseResultado.itens, compareResultado.itens, baseOption.data.title, compareOption.data.title]);

  if (!hasDados) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparar cenarios</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4" />
          Cadastre fornecedores e execute uma cotacao para habilitar o comparador de cenarios.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Comparar cenarios</h2>
        <p className="text-muted-foreground">
          Gere comparativos usando o mesmo cadastro de fornecedores sob diferentes configuracoes de cenarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione os cenarios</CardTitle>
          <CardDescription>
            Os resultados sao recalculados automaticamente considerando contratos, conversoes e yield globais ou por produto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cenario base</label>
            <Select value={baseYear} onValueChange={setBaseYear}>
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
            <label className="text-sm font-medium">Cenario comparado</label>
            <Select value={compareYear} onValueChange={setCompareYear}>
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
        </CardContent>
      </Card>

      {resumoComparacao && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo financeiro</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Cenario base</p>
              <p className="text-2xl font-semibold">{formatCurrency(resumoComparacao.somaBase)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cenario comparado</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(resumoComparacao.somaComparado)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variacao</p>
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
            Custos consideram contratos, conversoes e rendimentos globais ou especificos por produto.
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

      <Tabs defaultValue={baseOption.scenarioKey} className="space-y-4">
        <TabsList>
          <TabsTrigger value={baseOption.scenarioKey}>{baseOption.data.title}</TabsTrigger>
          <TabsTrigger value={compareOption.scenarioKey}>{compareOption.data.title}</TabsTrigger>
        </TabsList>
        {[baseOption, compareOption].map((option) => {
          const resultado =
            option.scenarioKey === baseOption.scenarioKey ? baseResultado : compareResultado;
          return (
            <TabsContent key={`tab-${option.scenarioKey}`} value={option.scenarioKey}>
              <Card>
                <CardHeader>
                  <CardTitle>{option.data.title}</CardTitle>
                  <CardDescription>{option.data.changes}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Custo efetivo</TableHead>
                        <TableHead className="text-right">Custo normalizado</TableHead>
                        <TableHead className="text-right">Credito</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultado.itens.map((item) => (
                        <TableRow key={`detalhe-${option.scenarioKey}-${item.id}`}>
                          <TableCell>{item.nome}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.custoEfetivo)}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.custoNormalizado
                              ? formatCurrency(item.custoNormalizado)
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.credito)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Vencedores por item</CardTitle>
          <CardDescription>
            Indica qual cenario obteve o menor custo normalizado para cada item analisado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {rankingVencedores.map((info) => {
            const item =
              baseResultado.itens.find((res) => res.id === info.itemId) ??
              compareResultado.itens.find((res) => res.id === info.itemId);
            return (
              <Card key={`winner-${info.itemId}`} className="border border-primary/30">
                <CardContent className="p-3 text-sm">
                  <div className="text-xs text-muted-foreground">{item?.nome ?? info.itemId}</div>
                  <div className="font-semibold">{info.vencedor}</div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
