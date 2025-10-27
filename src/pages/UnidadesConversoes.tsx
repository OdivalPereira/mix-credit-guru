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
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { UNIT_OPTIONS, UNIT_LABELS } from "@/data/lookups";

export default function UnidadesConversoes() {
  const conversoes = useUnidadesStore((state) => state.conversoes);
  const yieldConfigs = useUnidadesStore((state) => state.yields);
  const updateConversoes = useUnidadesStore((state) => state.updateConversoes);
  const updateYields = useUnidadesStore((state) => state.updateYields);
  const resetDefaults = useUnidadesStore((state) => state.reset);
  const produtos = useCatalogoStore((state) => state.produtos);

  const conversoesTableRef = useRef<HTMLDivElement>(null);
  const yieldTableRef = useRef<HTMLDivElement>(null);

  const shouldVirtualizeConversoes = conversoes.length >= 200;
  const shouldVirtualizeYield = yieldConfigs.length >= 200;

  const produtosById = useMemo(() => {
    return new Map(produtos.map((produto) => [produto.id, produto.descricao]));
  }, [produtos]);

  const totalYields = yieldConfigs.length;
  const yieldsPorProduto = yieldConfigs.reduce(
    (acc, config) => (config.produtoId ? acc + 1 : acc),
    0,
  );
  const yieldsGlobais = totalYields - yieldsPorProduto;

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

  const handleYieldProdutoChange = (index: number, value: string) => {
    const trimmed = value.trim();
    updateYields((prev) =>
      prev.map((config, i) =>
        i === index
          ? {
              ...config,
              produtoId: trimmed ? trimmed : undefined,
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
    updateYields((prev) => [
      ...prev,
      { entrada: "kg", saida: "un", rendimento: 1 },
    ]);
  };

  const removeYield = (index: number) => {
    updateYields((prev) => prev.filter((_, i) => i !== index));
  };

  const unidadesCobertas = useMemo(() => {
    const valid = new Set<Unit>(UNIT_OPTIONS);
    const result = new Set<Unit>();
    for (const conv of conversoes) {
      if (valid.has(conv.de)) {
        result.add(conv.de);
      }
      if (valid.has(conv.para)) {
        result.add(conv.para);
      }
    }
    for (const y of yieldConfigs) {
      if (valid.has(y.entrada)) {
        result.add(y.entrada);
      }
      if (valid.has(y.saida)) {
        result.add(y.saida);
      }
    }
    return Array.from(result);
  }, [conversoes, yieldConfigs]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Unidades, conversoes e yield</h2>
        <p className="text-muted-foreground">
          Cadastre conversoes e rendimentos globais ou específicos por produto para padronizar calculos de custo.
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
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={`de-${u}`} value={u}>
                            {UNIT_LABELS[u]}
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
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={`para-${u}`} value={u}>
                            {UNIT_LABELS[u]}
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
          <CardTitle>Configurações de yield</CardTitle>
          <CardDescription>
            Vincule opcionalmente um produto para aplicar um rendimento dedicado; deixe em branco para usar um yield global.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table
            containerRef={yieldTableRef}
            containerClassName={shouldVirtualizeYield ? "max-h-[480px]" : undefined}
          >
          <TableHeader>
            <TableRow>
              <TableHead>Produto / SKU</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Saida</TableHead>
              <TableHead className="text-right">Rendimento (%)</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <VirtualizedTableBody
            data={yieldConfigs}
            colSpan={5}
            scrollElement={() => yieldTableRef.current}
            estimateSize={() => 64}
            emptyRow={
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Nenhuma configuracao de yield cadastrada.
                </TableCell>
              </TableRow>
            }
            renderRow={(config, index) => {
              const produtoDescricao = config.produtoId
                ? produtosById.get(config.produtoId)
                : undefined;
              return (
                <TableRow key={`${config.produtoId ?? "sem-prod"}-${config.entrada}-${config.saida}-${index}`}>
                  <TableCell>
                    <div className="space-y-1">
                      <Input
                        value={config.produtoId ?? ""}
                        onChange={(event) =>
                          handleYieldProdutoChange(index, event.target.value)
                        }
                        placeholder="ID do produto (opcional)"
                        list={`yield-produto-${index}`}
                      />
                      <datalist id={`yield-produto-${index}`}>
                        {produtos.map((produto) => (
                          <option key={produto.id} value={produto.id}>
                            {produto.descricao}
                          </option>
                        ))}
                      </datalist>
                      <span className="block text-xs text-muted-foreground">
                        {produtoDescricao
                          ? `Vinculado a: ${produtoDescricao}`
                          : "Em branco = rendimento global"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={config.entrada}
                      onValueChange={(value) => handleYieldChange(index, "entrada", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={`entrada-${u}`} value={u}>
                            {UNIT_LABELS[u]}
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
                        {UNIT_OPTIONS.map((u) => (
                          <SelectItem key={`saida-${u}`} value={u}>
                            {UNIT_LABELS[u]}
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
              );
            }}
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
              unidadesCobertas.map((unidade) => {
                const label = UNIT_LABELS[unidade] ?? unidade.toUpperCase();
                return (
                  <Badge key={`covered-${unidade}`} variant="secondary">
                    {label}
                  </Badge>
                );
              })
            ) : (
              <span className="text-sm text-muted-foreground">
                Nenhuma unidade coberta.
              </span>
            )}
          </div>
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Conversoes</Label>
              <span className="block text-base text-foreground">{conversoes.length}</span>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Yield cadastrados</Label>
              <span className="block text-base text-foreground">{totalYields}</span>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Yield por produto</Label>
              <span className="block text-base text-foreground">{yieldsPorProduto}</span>
            </div>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Yield globais</Label>
              <span className="block text-base text-foreground">{yieldsGlobais}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
