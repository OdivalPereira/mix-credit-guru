import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useAppStore } from "@/store/useAppStore";
import type { MixResultadoItem } from "@/types/domain";

export default function Relatorios() {
  const resultado = useCotacaoStore((s) => s.resultado);
  const vencedores = resultado.itens.slice(0, 3);
  const mixData = calcularMix(vencedores, 1);
  const receitas = useAppStore((s) => s.receitas);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatório</h2>
          <p className="text-muted-foreground">
            Resumo de fornecedores vencedores e custos
          </p>
        </div>
        <Button onClick={handlePrint} className="no-print">
          <Printer className="mr-2 h-4 w-4" /> Imprimir/Salvar PDF
        </Button>
      </div>

      {mixData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fornecedores Vencedores</CardTitle>
            <CardDescription>Com base na cotação atual</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Mix %</TableHead>
                  <TableHead className="text-right">Crédito (R$)</TableHead>
                  <TableHead className="text-right">Custo Efetivo (R$)</TableHead>
                  <TableHead className="text-right">Custo por Porção (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mixData.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell>{f.nome}</TableCell>
                    <TableCell className="text-right">
                      {f.mix.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {f.credito.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {f.custoEfetivo.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {f.custoPorPorcao.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {mixData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Custos</CardTitle>
            <CardDescription>Custos efetivos dos vencedores</CardDescription>
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
      )}

      {receitas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Receitas</CardTitle>
            <CardDescription>Receitas cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receitas.map((r) => (
                  <TableRow key={r.codigo}>
                    <TableCell>{r.codigo}</TableCell>
                    <TableCell>{r.descricao}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

