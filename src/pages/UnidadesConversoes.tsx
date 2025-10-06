import { useMemo, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VirtualizedTableBody } from "@/components/ui/virtualized-table-body";
import type { Unit } from "@/types/domain";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useUnidadesStore } from "@/store/useUnidadesStore";

const unidades: Unit[] = ["un", "kg", "g", "l", "ml", "ton"];

export default function UnidadesConversoes() {
  const conversoes = useUnidadesStore((state) => state.conversoes);
  const yieldConfigs = useUnidadesStore((state) => state.yields);
  const updateConversoes = useUnidadesStore((state) => state.updateConversoes);
  const updateYields = useUnidadesStore((state) => state.updateYields);
  const resetDefaults = useUnidadesStore((state) => state.reset);

  const conversoesTableRef = useRef<HTMLDivElement>(null);
  const yieldTableRef = useRef<HTMLDivElement>(null);

  const shouldVirtualizeConversoes = conversoes.length >= 200;
  const shouldVirtualizeYield = yieldConfigs.length >= 200;

  const handleConversaoChange = (
    index: number,
    field: "de" | "para" | "fator",
    value: string,
  ) => {
    updateConversoes((prev) =>
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
    field: "entrada" | "saida" | "rendimento",
    value: string,
  ) => {
    updateYields((prev) =>
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
    updateConversoes((prev) => [...prev, { de: "kg", para: "g", fator: 1 }]);
  };

  const removeConversao = (index: number) => {
    updateConversoes((prev) => prev.filter((_, i) => i !== index));
  };

  const addYield = () => {
    updateYields((prev) => [...prev, { entrada: "kg", saida: "un", rendimento: 1 }]);
  };

  const removeYield = (index: number) => {
    updateYields((prev) => prev.filter((_, i) => i !== index));
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
        <h2 className="text-3xl font-bold tracking-tight">Unidades, conversoes e yield</h2>
        <p className="text-muted-foreground">
          Cadastre conversoes e rendimentos para padronizar calculos de custo em toda a cadeia
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={addConversao}>
          <Plus className="mr-2 h-4 w-4" />
          Nova conversao
        </Button>
        <Button size="sm" variant="secondary" onClick={addYield}>
          <Plus className="mr-2 h-4 w-4" />
          Novo yield
        </Button>
        <Button size="sm" variant="outline" onClick={resetDefaults}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Restaurar padroes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversoes de unidade</CardTitle>
          <CardDescription>Informe os fatores de conversao entre as unidades cadastradas</CardDescription>
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
                    Nenhuma conversao cadastrada.
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
          <CardTitle>Configuracoes de yield</CardTitle>
          <CardDescription>Normaliza rendimento entre unidade de entrada e unidade de saida</CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            containerRef={yieldTableRef}
            containerClassName={shouldVirtualizeYield ? "max-h-[480px]" : undefined}
          >
            <TableHeader>
              <TableRow>
                <TableHead>Entrada</TableHead>
                <TableHead>Saida</TableHead>
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
                    Nenhuma configuracao de yield cadastrada.
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
          <CardTitle>Resumo de cobertura</CardTitle>
          <CardDescription>
            Verifique rapidamente as unidades mapeadas para conversoes e rendimento
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
              <span className="text-sm text-muted-foreground">
                Nenhuma unidade coberta.
              </span>
            )}
          </div>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Conversoes</Label>
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
