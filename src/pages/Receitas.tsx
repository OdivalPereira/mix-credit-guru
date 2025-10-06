import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VirtualizedTableBody } from "@/components/ui/virtualized-table-body";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useAppStore } from "@/store/useAppStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import type { MixResultadoItem } from "@/types/domain";
import { AlertTriangle } from "lucide-react";

export default function Receitas() {
  const receitas = useAppStore((s) => s.receitas);
  const addReceita = useAppStore((s) => s.addReceita);
  const updateReceita = useAppStore((s) => s.updateReceita);
  const removeReceita = useAppStore((s) => s.removeReceita);
  const receitasTableRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = receitas.length >= 200;

  const resultado = useCotacaoStore((s) => s.resultado);
  const vencedores = resultado.itens.slice(0, 3);

  const [porcoes, setPorcoes] = useState(1);

  const mixData = calcularMix(vencedores, porcoes);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const handleField = (
    codigo: string,
    field: "codigo" | "descricao",
    value: string,
  ) => {
    updateReceita(codigo, { [field]: value });
  };

  const handleAdd = () => {
    addReceita({ codigo: "", descricao: "" });
  };

  const handleRemove = (codigo: string) => {
    removeReceita(codigo);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Receitas</h2>
        <p className="text-muted-foreground">
          Gerencie receitas e visualize o mix de custo por porcao
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Receitas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button size="sm" onClick={handleAdd}>
              Adicionar receita
            </Button>
          </div>
          <Table
            containerRef={receitasTableRef}
            containerClassName={shouldVirtualize ? "max-h-[420px]" : undefined}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <VirtualizedTableBody
              data={receitas}
              colSpan={3}
              scrollElement={() => receitasTableRef.current}
              estimateSize={() => 64}
              renderRow={(r) => (
                <TableRow key={r.codigo}>
                  <TableCell>
                    <Input
                      value={r.codigo}
                      onChange={(e) => handleField(r.codigo, "codigo", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={r.descricao}
                      onChange={(e) => handleField(r.codigo, "descricao", e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(r.codigo)}
                    >
                      x
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          </Table>
        </CardContent>
      </Card>

      {vencedores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custos por Porcao</CardTitle>
            <CardDescription>
              Baseado nos fornecedores com menor custo efetivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="porcoes">Porcoes</Label>
              <Input
                id="porcoes"
                type="number"
                min={1}
                value={porcoes}
                onChange={(e) => setPorcoes(Number(e.target.value) || 1)}
                className="w-24"
              />
            </div>
            <ChartContainer
              config={{ custo: { label: "Custo normalizado por porcao", color: "hsl(var(--chart-1))" } }}
              className="h-[300px]"
            >
              <BarChart data={mixData} layout="vertical">
                <CartesianGrid vertical={false} />
                <XAxis type="number" dataKey="custoPorPorcao" hide />
                <YAxis
                  dataKey="nome"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="custoPorPorcao"
                  fill="var(--color-custo)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {vencedores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fornecedores Vencedores</CardTitle>
            <CardDescription>
              Detalhes dos fornecedores com melhor custo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {mixData.map((f) => (
                <AccordionItem key={f.id} value={f.id}>
                  <AccordionTrigger>
                    {f.nome} - {f.mix.toFixed(1)}%
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Custo efetivo: {formatCurrency(f.custoEfetivo)}</div>
                      <div>Custo normalizado: {formatCurrency(f.custoNormalizado ?? f.custoEfetivo)}</div>
                      <div>Credito: {formatCurrency(f.credito)}</div>
                      <div>Frete: {formatCurrency(f.frete)}</div>
                      <div>Ranking: {f.ranking}</div>
                      <div className="flex items-center gap-2">
                        Degrau:
                        {f.degrauAplicado ? (
                          <Badge variant="outline" className="border-primary/40 bg-primary/10">
                            {f.degrauAplicado}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Nao aplicado</span>
                        )}
                      </div>
                    </div>
                    {f.restricoes?.length ? (
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="font-medium text-amber-800">Restricoes</div>
                        {f.restricoes.map((restricao) => (
                          <Badge
                            key={restricao}
                            variant="outline"
                            className="flex w-max items-center gap-1 border-amber-300 bg-amber-50 text-amber-800"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {restricao}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
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

function calcularMix(
  itens: MixResultadoItem[],
  porcoes: number,
): Array<
  MixResultadoItem & {
    mix: number;
    custoPorPorcao: number;
  }
> {
  const totalNormalizado = itens.reduce(
    (sum, i) => sum + (i.custoNormalizado ?? i.custoEfetivo),
    0,
  );
  return itens.map((i) => {
    const custoNormalizado = i.custoNormalizado ?? i.custoEfetivo;
    return {
      ...i,
      custoNormalizado,
      mix: totalNormalizado ? (custoNormalizado / totalNormalizado) * 100 : 0,
      custoPorPorcao: custoNormalizado / porcoes,
    };
  });
}
