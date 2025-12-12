import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Link2, Plus, Trash2 } from "lucide-react";

import { UNIT_OPTIONS, UNIT_LABELS } from "@/data/lookups";
import { useContractsStore, createEmptyContract } from "@/store/useContractsStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useActivityLogStore } from "@/store/useActivityLogStore";
import type { ContractFornecedor, FreightBreak, PriceBreak, Unit, YieldConfig } from "@/types/domain";

type ContractUpdate = Partial<ContractFornecedor>;

const MAX_BREAK_ITEMS = 50;
const EMPTY_SELECT_VALUE = "__empty__";

export const ContractsManager = () => {
  const contracts = useContractsStore((state) => state.contratos);
  const updateContracts = useContractsStore((state) => state.updateContracts);

  const fornecedores = useCotacaoStore((state) => state.fornecedores);
  const produtos = useCatalogoStore((state) => state.produtos);
  const logActivity = useActivityLogStore((state) => state.logActivity);

  const fornecedoresMap = useMemo(
    () => new Map(fornecedores.map((supplier) => [supplier.id, supplier])),
    [fornecedores],
  );
  const produtosPorNcm = useMemo(
    () => new Map(produtos.map((produto) => [produto.ncm, produto])),
    [produtos],
  );

  const produtoOptions = useMemo(
    () =>
      produtos.map((produto) => ({
        value: produto.ncm,
        label: `${produto.descricao} (${produto.ncm})`,
      })),
    [produtos],
  );

  const updateContract = (id: string, data: ContractUpdate) => {
    updateContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== id) {
          return contract;
        }
        const next: ContractFornecedor = {
          ...contract,
          ...data,
        };
        if (data.produtoId !== undefined) {
          const trimmed = data.produtoId.trim();
          next.produtoId = trimmed;
          next.yield = contract.yield
            ? {
                ...contract.yield,
                produtoId: trimmed || undefined,
              }
            : trimmed
              ? {
                  produtoId: trimmed,
                  entrada: contract.unidade,
                  saida: contract.unidade,
                  rendimento: 1,
                }
              : contract.yield;
        } else if (next.yield && !next.yield.produtoId && next.produtoId) {
          const trimmed = next.produtoId.trim();
          next.yield = {
            ...next.yield,
            produtoId: trimmed || undefined,
          };
        }
        return next;
      }),
    );
  };

  const handleSupplierChange = (contract: ContractFornecedor, supplierId: string) => {
    const supplier = fornecedoresMap.get(supplierId);
    const changes: ContractUpdate = {
      supplierId,
    };
    if (supplier?.unidadeNegociada) {
      changes.unidade = supplier.unidadeNegociada;
    }
    if (supplier?.produtoId) {
      const produto = produtos.find((item) => item.id === supplier.produtoId);
      if (produto) {
        changes.produtoId = produto.ncm;
      } else if (supplier.flagsItem?.ncm) {
        changes.produtoId = supplier.flagsItem.ncm;
      }
    }
    updateContract(contract.id, changes);
  };

  const handleProdutoCatalogoChange = (contract: ContractFornecedor, produtoNcm: string) => {
    updateContract(contract.id, { produtoId: produtoNcm });
  };

  const handlePriceBreakChange = (id: string, index: number, field: keyof PriceBreak, value: string) => {
    updateContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== id) return contract;
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
        if (contract.id !== id) return contract;
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
    field: "entrada" | "saida" | "rendimento",
    value: string,
  ) => {
    updateContracts((prev) =>
      prev.map((contract) => {
        if (contract.id !== id) return contract;
        const produtoId = contract.produtoId?.trim();
        const baseYield: YieldConfig = contract.yield ?? {
          produtoId: produtoId || undefined,
          entrada: contract.unidade ?? "kg",
          saida: "un",
          rendimento: 1,
        };
        const nextYield: YieldConfig = {
          ...baseYield,
          produtoId: produtoId || baseYield.produtoId,
          [field]:
            field === "rendimento"
              ? Number(value) || 0
              : (value as Unit),
        };
        return {
          ...contract,
          yield: nextYield,
        };
      }),
    );
  };

  const addContract = () => {
    const newContract = createEmptyContract();
    updateContracts((prev) => [...prev, newContract]);
    logActivity({
      activity_type: 'contrato_criado',
      entity_type: 'contrato',
      entity_id: newContract.id,
      entity_name: 'Novo contrato',
    });
  };

  const removeContract = (id: string, name?: string) => {
    updateContracts((prev) => prev.filter((contract) => contract.id !== id));
    logActivity({
      activity_type: 'contrato_excluido',
      entity_type: 'contrato',
      entity_id: id,
      entity_name: name || 'Contrato',
    });
  };

  const addPriceBreak = (id: string) => {
    updateContracts((prev) =>
      prev.map((contract) =>
        contract.id === id
          ? {
              ...contract,
              priceBreaks:
                contract.priceBreaks && contract.priceBreaks.length >= MAX_BREAK_ITEMS
                  ? contract.priceBreaks
                  : [...(contract.priceBreaks ?? []), { quantidade: 0, preco: 0 }],
            }
          : contract,
      ),
    );
  };

  const removePriceBreak = (id: string, index: number) => {
    updateContracts((prev) =>
      prev.map((contract) =>
        contract.id === id
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
        contract.id === id
          ? {
              ...contract,
              freightBreaks:
                contract.freightBreaks && contract.freightBreaks.length >= MAX_BREAK_ITEMS
                  ? contract.freightBreaks
                  : [...(contract.freightBreaks ?? []), { quantidade: 0, frete: 0 }],
            }
          : contract,
      ),
    );
  };

  const removeFreightBreak = (id: string, index: number) => {
    updateContracts((prev) =>
      prev.map((contract) =>
        contract.id === id
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
          Cadastre acordos por fornecedor com degraus de preço, frete escalonado e yield por produto.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={addContract}>
          <Plus className="mr-2 h-4 w-4" />
          Novo contrato
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {contracts.map((contract, idx) => {
          const supplier = contract.supplierId
            ? fornecedoresMap.get(contract.supplierId)
            : undefined;
          const produto = contract.produtoId ? produtosPorNcm.get(contract.produtoId) : undefined;
          const title =
            supplier?.nome ??
            (contract.produtoId ? `Produto ${contract.produtoId}` : `Contrato ${idx + 1}`);
          const subtitle =
            supplier && supplier.uf
              ? `${supplier.uf.toUpperCase()}${supplier.municipio ? ` - ${supplier.municipio}` : ""}`
              : contract.produtoId
                ? `Chave ${contract.produtoId}`
                : "Defina fornecedor e produto";

          return (
            <AccordionItem key={contract.id} value={contract.id}>
              <AccordionTrigger>
                <div className="flex flex-1 flex-col items-start text-left">
                  <span className="font-medium flex items-center gap-2">
                    {supplier ? (
                      <Badge variant="secondary">Fornecedor</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                    {title}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {subtitle}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Vínculos principais</CardTitle>
                      <CardDescription>
                        Defina fornecedor responsável, chave do produto e unidade de negociação.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`supplier-${contract.id}`}>Fornecedor</Label>
                        <Select
                          value={contract.supplierId && contract.supplierId.trim() !== "" ? contract.supplierId : EMPTY_SELECT_VALUE}
                          onValueChange={(value) =>
                            handleSupplierChange(
                              contract,
                              value === EMPTY_SELECT_VALUE ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger id={`supplier-${contract.id}`}>
                            <SelectValue placeholder="Selecione o fornecedor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EMPTY_SELECT_VALUE}>Sem vínculo</SelectItem>
                            {fornecedores.map((supplierOption) => (
                              <SelectItem key={supplierOption.id} value={supplierOption.id}>
                                {supplierOption.nome}
                                {supplierOption.uf ? ` (${supplierOption.uf})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`product-${contract.id}`}>Produto do catálogo</Label>
                        <Select
                          value={
                            contract.produtoId && contract.produtoId.trim() !== "" && produtosPorNcm.has(contract.produtoId)
                              ? contract.produtoId
                              : EMPTY_SELECT_VALUE
                          }
                          onValueChange={(value) =>
                            handleProdutoCatalogoChange(
                              contract,
                              value === EMPTY_SELECT_VALUE ? "" : value,
                            )
                          }
                        >
                          <SelectTrigger id={`product-${contract.id}`}>
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            <SelectItem value={EMPTY_SELECT_VALUE}>Não utilizar catálogo</SelectItem>
                            {produtoOptions.map((option) => (
                              <SelectItem key={`${contract.id}-${option.value}`} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Ao selecionar um item do catálogo, usaremos o NCM como chave do contrato.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`produto-chave-${contract.id}`}>Chave do produto / SKU</Label>
                        <Input
                          id={`produto-chave-${contract.id}`}
                          value={contract.produtoId}
                          onChange={(event) =>
                            updateContract(contract.id, { produtoId: event.target.value })
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          Use NCM, código interno ou SKU que identifique o produto para cruzar com cotações.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`unidade-${contract.id}`}>Unidade</Label>
                        <Select
                          value={contract.unidade}
                          onValueChange={(value) => updateContract(contract.id, { unidade: value as Unit })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((u) => (
                              <SelectItem key={`unit-${contract.id}-${u}`} value={u}>
                                {UNIT_LABELS[u]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`preco-${contract.id}`}>Preço base (R$)</Label>
                        <Input
                          id={`preco-${contract.id}`}
                          type="number"
                          step="0.01"
                          value={contract.precoBase}
                          onChange={(event) =>
                            updateContract(contract.id, {
                              precoBase: Number(event.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Yield aplicado</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Select
                            value={contract.yield?.entrada ?? contract.unidade ?? "kg"}
                            onValueChange={(value) => handleYieldChange(contract.id, "entrada", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Entrada" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map((u) => (
                                <SelectItem key={`entrada-${contract.id}-${u}`} value={u}>
                                  {UNIT_LABELS[u]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={contract.yield?.saida ?? "un"}
                            onValueChange={(value) => handleYieldChange(contract.id, "saida", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Saída" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_OPTIONS.map((u) => (
                                <SelectItem key={`saida-${contract.id}-${u}`} value={u}>
                                  {UNIT_LABELS[u]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step="0.01"
                            value={contract.yield?.rendimento ?? 1}
                            onChange={(event) =>
                              handleYieldChange(contract.id, "rendimento", event.target.value)
                            }
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ajuste unidades de entrada e saída para normalizar custos (ex.: kg → bandeja).
                        </p>
                      </div>
                      {produto ? (
                        <div className="sm:col-span-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                          Produto selecionado: <span className="font-medium">{produto.descricao}</span> — NCM{" "}
                          {produto.ncm}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Degraus de preço</CardTitle>
                      <CardDescription>Configure faixas de quantidade negociadas com valores diferenciados.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          Faixas cadastradas {contract.priceBreaks?.length ?? 0}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addPriceBreak(contract.id)}
                          disabled={(contract.priceBreaks?.length ?? 0) >= MAX_BREAK_ITEMS}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar degrau
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quantidade mínima</TableHead>
                            <TableHead className="text-right">Preço (R$)</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(contract.priceBreaks ?? []).map((breakItem, index) => (
                            <TableRow key={`price-${contract.id}-${index}`}>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={breakItem.quantidade}
                                  onChange={(event) =>
                                    handlePriceBreakChange(contract.id, index, "quantidade", event.target.value)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={breakItem.preco}
                                  onChange={(event) =>
                                    handlePriceBreakChange(contract.id, index, "preco", event.target.value)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePriceBreak(contract.id, index)}
                                  aria-label="Remover degrau de preço"
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
                      <CardDescription>Configure faixas de frete vinculadas à quantidade negociada.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          Faixas cadastradas {contract.freightBreaks?.length ?? 0}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addFreightBreak(contract.id)}
                          disabled={(contract.freightBreaks?.length ?? 0) >= MAX_BREAK_ITEMS}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar faixa
                        </Button>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quantidade mínima</TableHead>
                            <TableHead className="text-right">Frete (R$)</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(contract.freightBreaks ?? []).map((breakItem, index) => (
                            <TableRow key={`freight-${contract.id}-${index}`}>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={breakItem.quantidade}
                                  onChange={(event) =>
                                    handleFreightBreakChange(contract.id, index, "quantidade", event.target.value)
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={breakItem.frete}
                                  onChange={(event) =>
                                    handleFreightBreakChange(contract.id, index, "frete", event.target.value)
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeFreightBreak(contract.id, index)}
                                  aria-label="Remover degrau de frete"
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
                    <Button variant="destructive" onClick={() => removeContract(contract.id, title)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir contrato
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Card>
        <CardHeader>
          <CardTitle>Indicadores de contratos</CardTitle>
          <CardDescription>Acompanhe a complexidade de manutenção dos acordos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Contratos ativos</Label>
            <span className="text-2xl font-semibold">{contracts.length}</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Degraus de preço</Label>
            <span className="text-2xl font-semibold">{totalDegraus}</span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs uppercase text-muted-foreground">Alertas</Label>
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {contracts.filter((c) => (c.priceBreaks?.length ?? 0) === 0).length} contratos sem degrau
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractsManager;
