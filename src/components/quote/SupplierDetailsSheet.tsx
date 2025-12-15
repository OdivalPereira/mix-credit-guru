import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ESTADOS, getMunicipiosByUF } from "@/data/locations";
import type { Produto, Supplier, SupplierRegime, SupplierTipo, Unit, PriceBreak, FreightBreak, YieldConfig } from "@/types/domain";
import { cn } from "@/lib/utils";
import {
  UNIT_OPTIONS,
  UNIT_LABELS,
  SUPPLIER_TIPO_OPTIONS,
  SUPPLIER_TIPO_LABELS,
  REGIME_OPTIONS,
} from "@/data/lookups";
import { CommercialConditionsSection } from "@/components/cadastros/CommercialConditionsSection";
import { SupplyChainEditor } from "@/components/cadastros/SupplyChainEditor";
import { SUPPLY_CHAIN_STAGES } from "@/store/useCotacaoStore";

const EMPTY_SELECT_VALUE = "__empty__";

interface SupplierDetailsSheetProps {
  supplier: Supplier;
  produtos: Produto[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Supplier>) => void;
}

export const SupplierDetailsSheet = ({
  supplier,
  produtos,
  open,
  onClose,
  onUpdate,
}: SupplierDetailsSheetProps) => {
  const [isMunicipioOpen, setIsMunicipioOpen] = useState(false);
  const municipios = useMemo(
    () => getMunicipiosByUF(supplier.uf?.toUpperCase() ?? ""),
    [supplier.uf],
  );
  const selectedMunicipio = useMemo(
    () => municipios.find((item) => item.codigo === (supplier.municipio ?? "")),
    [municipios, supplier.municipio],
  );
  const handleUpdate = (patch: Partial<Supplier>) => {
    onUpdate(supplier.id, patch);
  };

  const handleProductChange = (produtoId: string | undefined) => {
    if (!produtoId) {
      handleUpdate({
        produtoId: undefined,
        produtoDescricao: undefined,
        unidadeNegociada: supplier.unidadeNegociada,
        flagsItem: supplier.flagsItem ? { ...supplier.flagsItem, ncm: undefined } : supplier.flagsItem,
      });
      return;
    }
    const produto = produtos.find((item) => item.id === produtoId);
    handleUpdate({
      produtoId,
      produtoDescricao: produto?.descricao ?? supplier.produtoDescricao,
      unidadeNegociada: produto?.unidadePadrao ?? supplier.unidadeNegociada,
      flagsItem: {
        ...(supplier.flagsItem ?? {}),
        ncm: produto?.ncm,
      },
    });
  };

  const handleContatoChange = (field: "nome" | "email" | "telefone", value: string) => {
    handleUpdate({
      contato: {
        ...supplier.contato,
        [field]: value,
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={(value) => (!value ? onClose() : undefined)}>
      <SheetContent className="flex w-full flex-col gap-6 overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Detalhes do fornecedor</SheetTitle>
          <SheetDescription>
            Complete informacoes cadastrais, localizacao e vinculo de produto para melhorar a comparacao.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
                  <section className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fornecedor-cnpj">CNPJ</Label>
                <Input
                  id="fornecedor-cnpj"
                  placeholder="00.000.000/0000-00"
                  value={supplier.cnpj ?? ""}
                  onChange={(event) => handleUpdate({ cnpj: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-tipo">Tipo</Label>
                <Select
                  value={supplier.tipo}
                  onValueChange={(value) => handleUpdate({ tipo: value as SupplierTipo })}
                >
                  <SelectTrigger id="fornecedor-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLIER_TIPO_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {SUPPLIER_TIPO_LABELS[option.value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-regime">Regime tributario</Label>
                <Select
                  value={supplier.regime}
                  onValueChange={(value) => handleUpdate({ regime: value as SupplierRegime })}
                >
                  <SelectTrigger id="fornecedor-regime">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-ativo">Status</Label>
                <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2">
                  <span className="text-sm text-muted-foreground">
                    {supplier.ativo ? "Fornecedor ativo" : "Fornecedor inativo"}
                  </span>
                  <Switch
                    id="fornecedor-ativo"
                    checked={supplier.ativo}
                    onCheckedChange={(checked) => handleUpdate({ ativo: Boolean(checked) })}
                  />
                </div>
              </div>
            </div>
          </section>

                  <section className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Localizacao
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fornecedor-uf">Estado (UF)</Label>
                <Select
                  value={supplier.uf ?? ""}
                  onValueChange={(value) => {
                    handleUpdate({ uf: value, municipio: undefined });
                    setIsMunicipioOpen(false);
                  }}
                >
                  <SelectTrigger id="fornecedor-uf">
                    <SelectValue placeholder="Selecione a UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((estado) => (
                      <SelectItem key={estado.sigla} value={estado.sigla}>
                        {estado.sigla} - {estado.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-municipio">Municipio</Label>
                <Popover open={isMunicipioOpen} onOpenChange={setIsMunicipioOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="fornecedor-municipio"
                      variant="outline"
                      role="combobox"
                      disabled={!supplier.uf}
                      className={cn(
                        "w-full justify-between",
                        !supplier.municipio && "text-muted-foreground",
                      )}
                    >
                      {selectedMunicipio ? selectedMunicipio.nome : "Selecione o municipio"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar municipio..." />
                      <CommandEmpty>Nenhum municipio encontrado.</CommandEmpty>
                      <CommandList className="max-h-64">
                        <CommandGroup>
                          {municipios.map((municipio) => (
                            <CommandItem
                              key={municipio.codigo}
                              value={`${municipio.codigo} ${municipio.nome}`}
                              onSelect={() => {
                                handleUpdate({ municipio: municipio.codigo });
                                setIsMunicipioOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  municipio.codigo === supplier.municipio ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {municipio.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Produto vinculado
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fornecedor-produto">Produto</Label>
                <Select
                  value={supplier.produtoId ? supplier.produtoId : EMPTY_SELECT_VALUE}
                  onValueChange={(value) =>
                    handleProductChange(value === EMPTY_SELECT_VALUE ? undefined : value)
                  }
                >
                  <SelectTrigger id="fornecedor-produto">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_SELECT_VALUE}>Sem vinculo</SelectItem>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.descricao} ({produto.ncm})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-unidade">Unidade negociada</Label>
                <Select
                  value={supplier.unidadeNegociada ?? ""}
                  onValueChange={(value) =>
                    handleUpdate({ unidadeNegociada: value as Unit })
                  }
                >
                  <SelectTrigger id="fornecedor-unidade">
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((unidade) => (
                      <SelectItem key={unidade} value={unidade}>
                        {UNIT_LABELS[unidade]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-pedido">Pedido minimo</Label>
                <Input
                  id="fornecedor-pedido"
                  type="number"
                  value={supplier.pedidoMinimo ?? 0}
                  onChange={(event) =>
                    handleUpdate({ pedidoMinimo: Number(event.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-prazo-entrega">Prazo de entrega (dias)</Label>
                <Input
                  id="fornecedor-prazo-entrega"
                  type="number"
                  value={supplier.prazoEntregaDias ?? 0}
                  onChange={(event) =>
                    handleUpdate({ prazoEntregaDias: Number(event.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-prazo-pagamento">Prazo de pagamento (dias)</Label>
                <Input
                  id="fornecedor-prazo-pagamento"
                  type="number"
                  value={supplier.prazoPagamentoDias ?? 0}
                  onChange={(event) =>
                    handleUpdate({ prazoPagamentoDias: Number(event.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Contato
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="fornecedor-contato-nome">Responsavel</Label>
                <Input
                  id="fornecedor-contato-nome"
                  value={supplier.contato?.nome ?? ""}
                  onChange={(event) => handleContatoChange("nome", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-contato-email">Email</Label>
                <Input
                  id="fornecedor-contato-email"
                  type="email"
                  value={supplier.contato?.email ?? ""}
                  onChange={(event) => handleContatoChange("email", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-contato-telefone">Telefone</Label>
                <Input
                  id="fornecedor-contato-telefone"
                  value={supplier.contato?.telefone ?? ""}
                  onChange={(event) => handleContatoChange("telefone", event.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Supply Chain Section */}
          <section className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Etapas da cadeia de fornecimento
            </Label>
            <SupplyChainEditor
              cadeia={supplier.cadeia ?? []}
              supplierTipo={supplier.tipo}
              onChange={(newCadeia) => handleUpdate({ cadeia: newCadeia })}
              stagesCount={SUPPLY_CHAIN_STAGES}
            />
          </section>

          {/* Commercial Conditions Section */}
          <section className="space-y-3 border-t pt-4">
            <CommercialConditionsSection
              priceBreaks={supplier.priceBreaks}
              freightBreaks={supplier.freightBreaks}
              yieldConfig={supplier.yield}
              onPriceBreaksChange={(breaks: PriceBreak[]) => handleUpdate({ priceBreaks: breaks })}
              onFreightBreaksChange={(breaks: FreightBreak[]) => handleUpdate({ freightBreaks: breaks })}
              onYieldChange={(config: YieldConfig | undefined) => handleUpdate({ yield: config })}
            />
          </section>
        </div>

        <SheetFooter className="gap-2">
          <SheetClose asChild>
            <Button variant="outline">Fechar</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
