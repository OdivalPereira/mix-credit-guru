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
import type { Produto, Fornecedor, OfertaFornecedor, SupplierRegime, SupplierTipo, Unit, PriceBreak, FreightBreak, YieldConfig } from "@/types/domain";
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
  fornecedor: Fornecedor;
  oferta: OfertaFornecedor;
  produtos: Produto[];
  open: boolean;
  onClose: () => void;
  onUpdateFornecedor: (id: string, patch: Partial<Fornecedor>) => void;
  onUpdateOferta: (id: string, patch: Partial<OfertaFornecedor>) => void;
}

export const SupplierDetailsSheet = ({
  fornecedor,
  oferta,
  produtos,
  open,
  onClose,
  onUpdateFornecedor,
  onUpdateOferta,
}: SupplierDetailsSheetProps) => {
  const [isMunicipioOpen, setIsMunicipioOpen] = useState(false);
  const municipios = useMemo(
    () => getMunicipiosByUF(fornecedor.uf?.toUpperCase() ?? ""),
    [fornecedor.uf],
  );
  const selectedMunicipio = useMemo(
    () => municipios.find((item) => item.codigo === (fornecedor.municipio ?? "")),
    [municipios, fornecedor.municipio],
  );

  const handleUpdateFornecedor = (patch: Partial<Fornecedor>) => {
    onUpdateFornecedor(fornecedor.id, patch);
  };

  const handleUpdateOferta = (patch: Partial<OfertaFornecedor>) => {
    onUpdateOferta(oferta.id, patch);
  };

  const handleProductChange = (produtoId: string | undefined) => {
    if (!produtoId) {
      handleUpdateOferta({
        produtoId: undefined as unknown as string,
        produtoDescricao: undefined,
        unidadeNegociada: oferta.unidadeNegociada,
        flagsItem: oferta.flagsItem ? { ...oferta.flagsItem, ncm: undefined } : oferta.flagsItem,
      });
      return;
    }
    const produto = produtos.find((item) => item.id === produtoId);
    handleUpdateOferta({
      produtoId,
      produtoDescricao: produto?.descricao ?? oferta.produtoDescricao,
      unidadeNegociada: produto?.unidadePadrao ?? oferta.unidadeNegociada,
      flagsItem: {
        ...(oferta.flagsItem ?? {}),
        ncm: produto?.ncm,
      },
    });
  };

  const handleContatoChange = (field: "nome" | "email" | "telefone", value: string) => {
    handleUpdateFornecedor({
      contato: {
        ...fornecedor.contato,
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
          {/* Seção: Dados Cadastrais do Fornecedor */}
          <section className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fornecedor-cnpj">CNPJ</Label>
                <Input
                  id="fornecedor-cnpj"
                  placeholder="00.000.000/0000-00"
                  value={fornecedor.cnpj ?? ""}
                  onChange={(event) => handleUpdateFornecedor({ cnpj: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-tipo">Tipo</Label>
                <Select
                  value={fornecedor.tipo}
                  onValueChange={(value) => handleUpdateFornecedor({ tipo: value as SupplierTipo })}
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
                  value={fornecedor.regime}
                  onValueChange={(value) => handleUpdateFornecedor({ regime: value as SupplierRegime })}
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
                    {fornecedor.ativo ? "Fornecedor ativo" : "Fornecedor inativo"}
                  </span>
                  <Switch
                    id="fornecedor-ativo"
                    checked={fornecedor.ativo}
                    onCheckedChange={(checked) => handleUpdateFornecedor({ ativo: Boolean(checked) })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Seção: Localização */}
          <section className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Localizacao
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fornecedor-uf">Estado (UF)</Label>
                <Select
                  value={fornecedor.uf ?? ""}
                  onValueChange={(value) => {
                    handleUpdateFornecedor({ uf: value, municipio: undefined });
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
                      disabled={!fornecedor.uf}
                      className={cn(
                        "w-full justify-between",
                        !fornecedor.municipio && "text-muted-foreground",
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
                                handleUpdateFornecedor({ municipio: municipio.codigo });
                                setIsMunicipioOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  municipio.codigo === fornecedor.municipio ? "opacity-100" : "opacity-0",
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

          {/* Seção: Produto vinculado (dados da oferta) */}
          <section className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Produto vinculado
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fornecedor-produto">Produto</Label>
                <Select
                  value={oferta.produtoId ? oferta.produtoId : EMPTY_SELECT_VALUE}
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
                  value={oferta.unidadeNegociada ?? ""}
                  onValueChange={(value) =>
                    handleUpdateOferta({ unidadeNegociada: value as Unit })
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
                  value={oferta.pedidoMinimo ?? 0}
                  onChange={(event) =>
                    handleUpdateOferta({ pedidoMinimo: Number(event.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-prazo-entrega">Prazo de entrega (dias)</Label>
                <Input
                  id="fornecedor-prazo-entrega"
                  type="number"
                  value={oferta.prazoEntregaDias ?? 0}
                  onChange={(event) =>
                    handleUpdateOferta({ prazoEntregaDias: Number(event.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-prazo-pagamento">Prazo de pagamento (dias)</Label>
                <Input
                  id="fornecedor-prazo-pagamento"
                  type="number"
                  value={oferta.prazoPagamentoDias ?? 0}
                  onChange={(event) =>
                    handleUpdateOferta({ prazoPagamentoDias: Number(event.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </section>

          {/* Seção: Contato (dados do fornecedor) */}
          <section className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Contato
            </Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="fornecedor-contato-nome">Responsavel</Label>
                <Input
                  id="fornecedor-contato-nome"
                  value={fornecedor.contato?.nome ?? ""}
                  onChange={(event) => handleContatoChange("nome", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-contato-email">Email</Label>
                <Input
                  id="fornecedor-contato-email"
                  type="email"
                  value={fornecedor.contato?.email ?? ""}
                  onChange={(event) => handleContatoChange("email", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fornecedor-contato-telefone">Telefone</Label>
                <Input
                  id="fornecedor-contato-telefone"
                  value={fornecedor.contato?.telefone ?? ""}
                  onChange={(event) => handleContatoChange("telefone", event.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Supply Chain Section (dados da oferta) */}
          <section className="space-y-3 border-t pt-4">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Etapas da cadeia de fornecimento
            </Label>
            <SupplyChainEditor
              cadeia={oferta.cadeia ?? []}
              supplierTipo={fornecedor.tipo}
              onChange={(newCadeia) => handleUpdateOferta({ cadeia: newCadeia })}
              stagesCount={SUPPLY_CHAIN_STAGES}
            />
          </section>

          {/* Commercial Conditions Section (dados da oferta) */}
          <section className="space-y-3 border-t pt-4">
            <CommercialConditionsSection
              priceBreaks={oferta.priceBreaks}
              freightBreaks={oferta.freightBreaks}
              yieldConfig={oferta.yield}
              onPriceBreaksChange={(breaks: PriceBreak[]) => handleUpdateOferta({ priceBreaks: breaks })}
              onFreightBreaksChange={(breaks: FreightBreak[]) => handleUpdateOferta({ freightBreaks: breaks })}
              onYieldChange={(config: YieldConfig | undefined) => handleUpdateOferta({ yield: config })}
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
