import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Download,
  Plus,
  Upload,
  Copy,
  Trash,
  BarChartHorizontal,
} from "lucide-react";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import type { Supplier } from "@/types/domain";

export default function Cotacao() {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [mostrarGrafico, setMostrarGrafico] = useState(false);

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

  const resultados = resultado.itens;

  useEffect(() => {
    calcular();
  }, [contexto, fornecedores, calcular]);

  const handleContextoChange = (key: keyof typeof contexto, value: string) => {
    setContexto({ [key]: value });
  };

  const numericFields: Array<keyof Supplier> = ["preco", "frete"];

  const isNumericField = (
    f: keyof Supplier,
  ): f is (typeof numericFields)[number] => numericFields.includes(f);

  const handleFornecedorChange = (
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
  };

  const handleDuplicate = (f: Supplier) => {
    const { id, ...rest } = f;
    upsertFornecedor({ ...rest });
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importarCSV(text);
    e.target.value = "";
  };

  const handleExportCSV = () => {
    const csv = exportarCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fornecedores.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importarJSON(text);
    e.target.value = "";
  };

  const handleExportJSON = () => {
    const json = exportarJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cotacao.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFlagChange = (
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
  };

  const getCreditBadge = (creditavel: boolean, credito: number) => {
    if (!creditavel) return <Badge variant="creditNo">ɸ Não creditável</Badge>;
    if (credito > 15) return <Badge variant="creditYes">✓ Crédito total</Badge>;
    return <Badge variant="creditLimited">! Crédito limitado</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cotação de Fornecedores</h2>
        <p className="text-muted-foreground">
          Compare fornecedores considerando créditos tributários e custos efetivos
        </p>
      </div>

      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros da Cotação</CardTitle>
          <CardDescription>
            Configure os dados para análise comparativa dos fornecedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={contexto.data}
                onChange={(e) => handleContextoChange("data", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Select
                value={contexto.uf}
                onValueChange={(v) => handleContextoChange("uf", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sp">SP - São Paulo</SelectItem>
                  <SelectItem value="rj">RJ - Rio de Janeiro</SelectItem>
                  <SelectItem value="mg">MG - Minas Gerais</SelectItem>
                  <SelectItem value="pr">PR - Paraná</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destino">Destino</Label>
              <Select
                value={contexto.destino}
                onValueChange={(v) => handleContextoChange("destino", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Finalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A - Refeição</SelectItem>
                  <SelectItem value="B">B - Revenda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regime">Seu Regime</Label>
              <Select
                value={contexto.regime}
                onValueChange={(v) => handleContextoChange("regime", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Regime tributário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Regime Normal</SelectItem>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="produto">Produto</Label>
              <Input
                id="produto"
                placeholder="NCM ou descrição"
                value={contexto.produto}
                onChange={(e) => handleContextoChange("produto", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Comparison Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Comparação de Fornecedores</CardTitle>
            <CardDescription>
              Análise de custos efetivos considerando tributação e créditos
            </CardDescription>
          </div>
          <div className="flex space-x-2">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
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
                })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
            <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => jsonInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Importar JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="mr-2 h-4 w-4" />
              Exportar JSON
            </Button>
            <Button variant="outline" size="sm" onClick={limpar}>
              Limpar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMostrarGrafico((v) => !v)}
            >
              <BarChartHorizontal className="mr-2 h-4 w-4" />
              {mostrarGrafico ? "Ocultar" : "Gráfico"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Regime</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">IBS%</TableHead>
                  <TableHead className="text-right">CBS%</TableHead>
                  <TableHead className="text-right">IS%</TableHead>
                  <TableHead className="text-right">Frete</TableHead>
                  <TableHead>Cesta</TableHead>
                  <TableHead>Redução</TableHead>
                  <TableHead>Refeição</TableHead>
                  <TableHead>Creditável</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                  <TableHead className="text-right font-bold">Custo Efetivo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultados.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className={supplier.ranking === 1 ? "bg-success/5" : ""}
                  >
                    <TableCell className="font-medium">
                      {supplier.ranking === 1 && (
                        <Badge variant="success" className="mr-2">
                          1º
                        </Badge>
                      )}
                      {supplier.ranking}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Input
                        value={supplier.nome}
                        onChange={(e) =>
                          handleFornecedorChange(supplier.id, "nome", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={supplier.tipo}
                        onChange={(e) =>
                          handleFornecedorChange(supplier.id, "tipo", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={supplier.regime}
                        onChange={(e) =>
                          handleFornecedorChange(supplier.id, "regime", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        className="text-right"
                        value={supplier.preco}
                        onChange={(e) =>
                          handleFornecedorChange(supplier.id, "preco", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {supplier.ibs}
                    </TableCell>
                    <TableCell className="text-right">
                      {supplier.cbs}
                    </TableCell>
                    <TableCell className="text-right">
                      {supplier.is}
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        className="text-right"
                        value={supplier.frete}
                        onChange={(e) =>
                          handleFornecedorChange(supplier.id, "frete", e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={supplier.flagsItem?.cesta ?? false}
                        onCheckedChange={(v) =>
                          handleFlagChange(
                            supplier.id,
                            "cesta",
                            v as boolean,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={supplier.flagsItem?.reducao ?? false}
                        onCheckedChange={(v) =>
                          handleFlagChange(
                            supplier.id,
                            "reducao",
                            v as boolean,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={supplier.isRefeicaoPronta ?? false}
                        onCheckedChange={(v) =>
                          handleFlagChange(
                            supplier.id,
                            "refeicao",
                            v as boolean,
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {getCreditBadge(supplier.creditavel, supplier.credito)}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {supplier.credito.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      R$ {supplier.custoEfetivo.toFixed(2)}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicate(supplier)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFornecedor(supplier.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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