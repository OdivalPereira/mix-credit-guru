import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Contexto } from "@/store/useCotacaoStore";

interface QuoteFormProps {
  contexto: Contexto;
  onContextoChange: (key: keyof Contexto, value: string) => void;
}

export function QuoteForm({ contexto, onContextoChange }: QuoteFormProps) {
  return (
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
              onChange={(e) => onContextoChange("data", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="uf">UF</Label>
            <Select
              value={contexto.uf}
              onValueChange={(v) => onContextoChange("uf", v)}
            >
              <SelectTrigger aria-label="UF" data-testid="select-uf">
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
              onValueChange={(v) => onContextoChange("destino", v)}
            >
              <SelectTrigger aria-label="Destino" data-testid="select-destino">
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
              onValueChange={(v) => onContextoChange("regime", v)}
            >
              <SelectTrigger aria-label="Regime" data-testid="select-regime">
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
              onChange={(e) => onContextoChange("produto", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
