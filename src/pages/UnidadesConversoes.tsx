import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VirtualizedTableBody } from "@/components/ui/virtualized-table-body";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { UnitConv, YieldConfig, Unit } from "@/types/domain";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";

const unidades: Unit[] = ["un", "kg", "g", "l", "ml", "ton"];

const defaultConversoes: UnitConv[] = [
  { de: "kg", para: "g", fator: 1000 },
  { de: "l", para: "ml", fator: 1000 },
];

const defaultYield: YieldConfig[] = [
  { entrada: "kg", saida: "un", rendimento: 12 },
];

export default function UnidadesConversoes() {
  const [conversoes, setConversoes] = useState<UnitConv[]>(defaultConversoes);
  const [yieldConfigs, setYieldConfigs] = useState<YieldConfig[]>(defaultYield);
  const conversoesTableRef = useRef<HTMLDivElement>(null);
  const yieldTableRef = useRef<HTMLDivElement>(null);
  const shouldVirtualizeConversoes = conversoes.length >= 200;
  const shouldVirtualizeYield = yieldConfigs.length >= 200;

  const handleConversaoChange = (
    index: number,
    field: keyof UnitConv,
    value: string,
  ) => {
    setConversoes((prev) =>
      prev.map((conv, i) =>
        i === index
          ? {
              ...conv,
              [field]: field === "fator" ? Number(value) || 0 : (value as Unit),
            }
          : conv,
      ),
    );
  };

  const handleYieldChange = (
    index: number,
    field: keyof YieldConfig,
    value: string,
  ) => {
    setYieldConfigs((prev) =>
      prev.map((config, i) =>
        i === index
          ? {
              ...config,
              [field]: field === "rendimento" ? Number(value) || 0 : (value as Unit),
            }
          : config,
      ),
    );
  };

  const addConversao = () => {
    setConversoes((prev) => [...prev, { de: "kg", para: "g", fator: 1 }]);
  };

  const removeConversao = (index: number) => {
    setConversoes((prev) => prev.filter((_, i) => i !== index));
  };

  const addYield = () => {
    setYieldConfigs((prev) => [...prev, { entrada: "kg", saida: "un", rendimento: 1 }]);
  };

  const removeYield = (index: number) => {
    setYieldConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const resetDefaults = () => {
    setConversoes(defaultConversoes);
    setYieldConfigs(defaultYield);
  };

  const unidadesCobertas = useMemo(
    () =>
      Array.from(
        new Set(
          conversoes.flatMap((c) => [c.de, c.para]).concat(
            yieldConfigs.flatMap((y) => [y.entrada, y.saida]),
          ),
        ),
      ),
    [conversoes, yieldConfigs],
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Unidades, Conversões e Yield</h2>
        <p className="text-muted-foreground">
          Defina fatores de conversão e rendimentos para normalizar custos em diferentes unidades
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={addConversao}>
          <Plus className="mr-2 h-4 w-4" />
          Nova conversão
        </Button>
        <Button size="sm" variant="secondary" onClick={addYield}>
          <Plus className="mr-2 h-4 w-4" />
          Novo yield
        </Button>
        <Button size="sm" variant="outline" onClick={resetDefaults}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Restaurar padrões
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversões de Unidade</CardTitle>
          <CardDescription>Informe os fatores de conversão entre unidades cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            containerRef={conversoesTableRef}
            containerClassName={shouldVirtualizeConversoes ? "max-h-[480px]" : undefined}
          >
            <TableHeader>
              <TableRow>
                <TableHead>De</TableHead>
                <TableHead>Para</TableHead>
                <TableHead className="text-right">Fator</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <VirtualizedTableBody
              data={conversoes}
              colSpan={4}
              scrollElement={() => conversoesTableRef.current}
              estimateSize={() => 64}
              emptyRow={
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Nenhuma conversão cadastrada.
                  </TableCell>
                </TableRow>
              }
              renderRow={(conv, index) => (
                <TableRow key={`${conv.de}-${conv.para}-${index}`}>
                  <TableCell>
                    <Select
                      value={conv.de}
                      onValueChange={(value) => handleConversaoChange(index, "de", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={`de-${u}`} value={u}>
                            {u.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={conv.para}
                      onValueChange={(value) => handleConversaoChange(index, "para", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={`para-${u}`} value={u}>
                            {u.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="text-right"
                      type="number"
                      step="0.01"
                      value={conv.fator}
                      onChange={(event) =>
                        handleConversaoChange(index, "fator", event.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeConversao(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Yield</CardTitle>
          <CardDescription>
            Cadastre rendimentos para normalizar custo por unidade final de produção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            containerRef={yieldTableRef}
            containerClassName={shouldVirtualizeYield ? "max-h-[480px]" : undefined}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead className="text-right">Rendimento (%)</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <VirtualizedTableBody
              data={yieldConfigs}
              colSpan={4}
              scrollElement={() => yieldTableRef.current}
              estimateSize={() => 64}
              emptyRow={
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Nenhuma configuração de yield cadastrada.
                  </TableCell>
                </TableRow>
              }
              renderRow={(config, index) => (
                <TableRow key={`${config.entrada}-${config.saida}-${index}`}>
                  <TableCell>
                    <Select
                      value={config.entrada}
                      onValueChange={(value) => handleYieldChange(index, "entrada", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={`entrada-${u}`} value={u}>
                            {u.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={config.saida}
                      onValueChange={(value) => handleYieldChange(index, "saida", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((u) => (
                          <SelectItem key={`saida-${u}`} value={u}>
                            {u.toUpperCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="text-right"
                      type="number"
                      step="0.1"
                      value={config.rendimento}
                      onChange={(event) =>
                        handleYieldChange(index, "rendimento", event.target.value)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeYield(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            />
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo de Cobertura</CardTitle>
          <CardDescription>
            Verifique rapidamente as unidades já mapeadas para conversões e rendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {unidadesCobertas.length ? (
              unidadesCobertas.map((unidade) => (
                <Badge key={`covered-${unidade}`} variant="secondary">
                  {unidade.toUpperCase()}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Nenhuma unidade coberta.</span>
            )}
          </div>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Conversões</Label>
              <span className="block text-base text-foreground">{conversoes.length}</span>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Yield cadastrados</Label>
              <span className="block text-base text-foreground">{yieldConfigs.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
