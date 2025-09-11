import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default function Receitas() {
  const receitas = useAppStore((s) => s.receitas);
  const addReceita = useAppStore((s) => s.addReceita);
  const updateReceita = useAppStore((s) => s.updateReceita);
  const removeReceita = useAppStore((s) => s.removeReceita);

  const resultado = useCotacaoStore((s) => s.resultado);
  const vencedores = resultado.itens.slice(0, 3);

  const [porcoes, setPorcoes] = useState(1);

  const mixData = calcularMix(vencedores, porcoes);

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
          Gerencie receitas e visualize o mix de custo por porção
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receitas.map((r) => (
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
                      ✕
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {vencedores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custos por Porção</CardTitle>
            <CardDescription>
              Baseado nos fornecedores com menor custo efetivo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="porcoes">Porções</Label>
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
              config={{ custo: { label: "Custo por porção", color: "hsl(var(--chart-1))" } }}
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
                      <div>Custo efetivo: R$ {f.custoEfetivo.toFixed(2)}</div>
                      <div>Crédito: R$ {f.credito.toFixed(2)}</div>
                      <div>Frete: R$ {f.frete.toFixed(2)}</div>
                      <div>Ranking: {f.ranking}</div>
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
