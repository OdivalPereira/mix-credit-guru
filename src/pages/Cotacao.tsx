import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Plus } from "lucide-react";

const mockSuppliers = [
  {
    id: 1,
    nome: "Fornecedor Alpha",
    tipo: "Cadeia",
    regime: "Regime Normal",
    preco: 15.50,
    ibs: 12.0,
    cbs: 9.25,
    is: 5.0,
    frete: 2.30,
    creditavel: true,
    credito: 21.25,
    custoEfetivo: 12.55,
    ranking: 1
  },
  {
    id: 2,
    nome: "Distribuidora Beta",
    tipo: "Independente", 
    regime: "Simples Nacional",
    preco: 14.80,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 3.20,
    creditavel: false,
    credito: 0,
    custoEfetivo: 18.00,
    ranking: 2
  }
];

export default function Cotacao() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [uf, setUf] = useState("");
  const [destino, setDestino] = useState("");
  const [regime, setRegime] = useState("");
  const [produto, setProduto] = useState("");

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
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Select value={uf} onValueChange={setUf}>
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
              <Select value={destino} onValueChange={setDestino}>
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
              <Select value={regime} onValueChange={setRegime}>
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
                value={produto}
                onChange={(e) => setProduto(e.target.value)}
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
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Fornecedor
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
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
                  <TableHead>Creditável</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                  <TableHead className="text-right font-bold">Custo Efetivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className={supplier.ranking === 1 ? "bg-success/5" : ""}>
                    <TableCell className="font-medium">
                      {supplier.ranking === 1 && <Badge variant="success" className="mr-2">1º</Badge>}
                      {supplier.ranking}
                    </TableCell>
                    <TableCell className="font-medium">{supplier.nome}</TableCell>
                    <TableCell>{supplier.tipo}</TableCell>
                    <TableCell>{supplier.regime}</TableCell>
                    <TableCell className="text-right">R$ {supplier.preco.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{supplier.ibs}%</TableCell>
                    <TableCell className="text-right">{supplier.cbs}%</TableCell>
                    <TableCell className="text-right">{supplier.is}%</TableCell>
                    <TableCell className="text-right">R$ {supplier.frete.toFixed(2)}</TableCell>
                    <TableCell>{getCreditBadge(supplier.creditavel, supplier.credito)}</TableCell>
                    <TableCell className="text-right">R$ {supplier.credito.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      R$ {supplier.custoEfetivo.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}