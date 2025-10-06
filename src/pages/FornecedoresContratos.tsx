import { useMemo, useState } from "react";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContractFornecedor, FreightBreak, PriceBreak, Unit, YieldConfig } from "@/types/domain";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useContractsStore, createEmptyContract } from "@/store/useContractsStore";

const unidades: Unit[] = ["un", "kg", "g", "l", "ml", "ton"];

export default function FornecedoresContratos() {
  const contracts = useContractsStore((state) => state.contratos);
  const updateContracts = useContractsStore((state) => state.updateContracts);

  const updateContract = (id: string, data: Partial<ContractFornecedor>) => {
    updateContracts((prev) =>
      prev.map((contract) =>
        contract.fornecedorId === id ? { ...contract, ...data } : contract,
      ),
    );
  };

  const handlePriceBreakChange = (id: string, index: number, field: keyof PriceBreak, value: string) => {
    updateContracts((prev) =>
      prev.map((contract) => {
        if (contract.fornecedorId !== id) return contract;
        const priceBreaks = [...(contract.priceBreaks ?? [])];
        priceBreaks[index] = {
          ...priceBreaks[index],
          [field]: Number(value) || 0,
        } as PriceBreak;
        return { ...contract, priceBreaks };
      }),
    );
  };

  const handleFreightBreakChange = (
    id: string,
    index: number,
    field: keyof FreightBreak,
    value: string,
  ) => {
    updateContracts((prev) =>
      prev.map((contract) => {
        if (contract.fornecedorId !== id) return contract;
        const freightBreaks = [...(contract.freightBreaks ?? [])];
        freightBreaks[index] = {
          ...freightBreaks[index],
          [field]: Number(value) || 0,
        } as FreightBreak;
        return { ...contract, freightBreaks };
      }),
    );
  };

  const handleYieldChange = (
    id: string,
    field: keyof YieldConfig,
    value: string,
  ) => {
    updateContracts((prev) =>
      prev.map((contract) => {
        if (contract.fornecedorId !== id) return contract;
        const yieldConfig = contract.yield ?? { entrada: "kg", saida: "un", rendimento: 1 };
        return {
          ...contract,
          yield: {
            ...yieldConfig,
            [field]: field === "rendimento" ? Number(value) || 0 : (value as Unit),
          },
        };
      }),
    );
  };

  const addContract = () => {
    updateContracts((prev) => [...prev, createEmptyContract()]);
  };

  const removeContract = (id: string) => {
    updateContracts((prev) =>
      prev.filter((contract) => contract.fornecedorId !== id),
    );
  };

  const addPriceBreak = (id: string) => {
    updateContracts((prev) =>
      prev.map((contract) =>
        contract.fornecedorId === id
          ? {
              ...contract,
              priceBreaks: [...(contract.priceBreaks ?? []), { quantidade: 0, preco: 0 }],
            }
          : contract,
      ),
    );
  };

  const removePriceBreak = (id: string, index: number) => {
    updateContracts((prev) =>
      prev.map((contract) =>
        contract.fornecedorId === id
          ? {
              ...contract,
              priceBreaks: contract.priceBreaks?.filter((_, i) => i !== index) ?? [],
            }
          : contract,
      ),
    );
  };

  const addFreightBreak = (id: string) => {
    updateContracts((prev) =>
      prev.map((contract) =>
        contract.fornecedorId === id
          ? {
              ...contract,
              freightBreaks: [...(contract.freightBreaks ?? []), { quantidade: 0, frete: 0 }],
            }
          : contract,
      ),
    );
  };

  const removeFreightBreak = (id: string, index: number) => {
    updateContracts((prev) =>
      prev.map((contract) =>
        contract.fornecedorId === id
          ? {
              ...contract,
              freightBreaks: contract.freightBreaks?.filter((_, i) => i !== index) ?? [],
            }
          : contract,
      ),
    );
  };

  const totalDegraus = useMemo(
    () =>
      contracts.reduce((acc, contract) => acc + (contract.priceBreaks?.length ?? 0), 0),
    [contracts],
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Contratos de fornecimento</h2>
        <p className="text-muted-foreground">
          Cadastre contratos com degraus de preco, frete escalonado e rendimento aplicado por produto
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={addContract}>
          <Plus className="mr-2 h-4 w-4" />
          Novo contrato
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {contracts.map((contract, idx) => (
          <AccordionItem key={contract.fornecedorId} value={contract.fornecedorId}>
            <AccordionTrigger>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="font-medium">
                  {contract.produtoId ? `Produto ${contract.produtoId}` : `Contrato ${idx + 1}`}
                </span>
                <span className="text-sm text-muted-foreground">
                  Unidade {contract.unidade.toUpperCase()} - Preco base R$ {contract.precoBase.toFixed(2)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados principais</CardTitle>
                    <CardDescription>Identificacao do produto e parametros gerais</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`produto-${contract.fornecedorId}`}>Produto / SKU</Label>
                      <Input
                        id={`produto-${contract.fornecedorId}`}
                        value={contract.produtoId}
                        onChange={(event) =>
                          updateContract(contract.fornecedorId, { produtoId: event.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`unidade-${contract.fornecedorId}`}>Unidade</Label>
                      <Select
                        value={contract.unidade}
                        onValueChange={(value) => updateContract(contract.fornecedorId, { unidade: value as Unit })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {unidades.map((u) => (
                            <SelectItem key={`unit-${contract.fornecedorId}-${u}`} value={u}>
                              {u.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`preco-${contract.fornecedorId}`}>Preco base (R$)</Label>
                      <Input
                        id={`preco-${contract.fornecedorId}`}
                        type="number"
                        step="0.01"
                        value={contract.precoBase}
                        onChange={(event) =>
                          updateContract(contract.fornecedorId, {
                            precoBase: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Yield aplicado</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Select
                          value={contract.yield?.entrada ?? "kg"}
                          onValueChange={(value) => handleYieldChange(contract.fornecedorId, "entrada", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Entrada" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map((u) => (
                              <SelectItem key={`entrada-${contract.fornecedorId}-${u}`} value={u}>
                                {u.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={contract.yield?.saida ?? "un"}
                          onValueChange={(value) => handleYieldChange(contract.fornecedorId, "saida", value)}
                        >
                          <SelectTrigger>
                        <SelectValue placeholder="Saida" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map((u) => (
                              <SelectItem key={`saida-${contract.fornecedorId}-${u}`} value={u}>
                                {u.toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step="0.1"
                          value={contract.yield?.rendimento ?? 1}
                          onChange={(event) =>
                            handleYieldChange(contract.fornecedorId, "rendimento", event.target.value)
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Utilize o rendimento para calcular custo normalizado por unidade de saida.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Degraus de preco</CardTitle>
                    <CardDescription>Adicione faixas de quantidade com precos diferenciados</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        Degraus cadastrados {contract.priceBreaks?.length ?? 0}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addPriceBreak(contract.fornecedorId)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar degrau
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quantidade minima</TableHead>
                          <TableHead className="text-right">Preco (R$)</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(contract.priceBreaks ?? []).map((breakItem, index) => (
                          <TableRow key={`price-${contract.fornecedorId}-${index}`}>
                            <TableCell>
                              <Input
                                type="number"
                                value={breakItem.quantidade}
                                onChange={(event) =>
                                  handlePriceBreakChange(
                                    contract.fornecedorId,
                                    index,
                                    "quantidade",
                                    event.target.value,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={breakItem.preco}
                                onChange={(event) =>
                                  handlePriceBreakChange(
                                    contract.fornecedorId,
                                    index,
                                    "preco",
                                    event.target.value,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removePriceBreak(contract.fornecedorId, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(contract.priceBreaks ?? []).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                              Nenhum degrau configurado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Degraus de frete</CardTitle>
                    <CardDescription>Calcule impactos logisticos por faixa de pedido</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        Faixas cadastradas {contract.freightBreaks?.length ?? 0}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addFreightBreak(contract.fornecedorId)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar faixa
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quantidade minima</TableHead>
                          <TableHead className="text-right">Frete (R$)</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(contract.freightBreaks ?? []).map((breakItem, index) => (
                          <TableRow key={`freight-${contract.fornecedorId}-${index}`}>
                            <TableCell>
                              <Input
                                type="number"
                                value={breakItem.quantidade}
                                onChange={(event) =>
                                  handleFreightBreakChange(
                                    contract.fornecedorId,
                                    index,
                                    "quantidade",
                                    event.target.value,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                value={breakItem.frete}
                                onChange={(event) =>
                                  handleFreightBreakChange(
                                    contract.fornecedorId,
                                    index,
                                    "frete",
                                    event.target.value,
                                  )
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFreightBreak(contract.fornecedorId, index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(contract.freightBreaks ?? []).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                              Nenhum degrau de frete configurado.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button variant="destructive" onClick={() => removeContract(contract.fornecedorId)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir contrato
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle>Indicadores de contratos</CardTitle>
          <CardDescription>Acompanhe a complexidade de manutencao dos acordos</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Contratos ativos</Label>
            <span className="text-2xl font-semibold">{contracts.length}</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Degraus de preco</Label>
            <span className="text-2xl font-semibold">{totalDegraus}</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Alertas</Label>
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{contracts.filter((c) => (c.priceBreaks?.length ?? 0) === 0).length} contratos sem degrau</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

