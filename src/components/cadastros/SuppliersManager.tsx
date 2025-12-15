import { useMemo, useRef, useState } from "react";
import {
  Plus,
  Upload,
  Download,
  FileJson,
  Factory,
  Trash2,
  Settings2,
  ChevronDown,
  MapPin,
  Phone,
  Mail,
  User,
  Link2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

import { SupplierDetailsSheet } from "@/components/quote/SupplierDetailsSheet";
import { SupplyChainEditor } from "@/components/cadastros/SupplyChainEditor";
import {
  useCotacaoStore,
  createEmptySupplier,
  SUPPLY_CHAIN_STAGES,
} from "@/store/useCotacaoStore";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useActivityLogStore } from "@/store/useActivityLogStore";
import type { Supplier } from "@/types/domain";
import {
  SUPPLIER_TIPO_OPTIONS,
  SUPPLIER_TIPO_LABELS,
  REGIME_OPTIONS,
  REGIME_LABELS,
} from "@/data/lookups";
import { ESTADOS } from "@/data/locations";

const EMPTY_SELECT_VALUE = "__empty__";

export const SuppliersManager = () => {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [detailsSupplierId, setDetailsSupplierId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const {
    fornecedores,
    upsertFornecedor,
    removeFornecedor,
    importarCSV,
    exportarCSV,
    importarJSON,
    exportarJSON,
  } = useCotacaoStore();
  const produtos = useCatalogoStore((state) => state.produtos);
  const logActivity = useActivityLogStore((state) => state.logActivity);

  const filteredSuppliers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return fornecedores;
    }
    return fornecedores.filter((supplier) => {
      return (
        supplier.nome.toLowerCase().includes(normalized) ||
        (supplier.cnpj ?? "").toLowerCase().includes(normalized) ||
        (supplier.contato?.email ?? "").toLowerCase().includes(normalized) ||
        (supplier.produtoDescricao ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [fornecedores, searchTerm]);

  const supplierDetails = useMemo(() => {
    if (!detailsSupplierId) {
      return null;
    }
    return fornecedores.find((item) => item.id === detailsSupplierId) ?? null;
  }, [detailsSupplierId, fornecedores]);

  const handleFieldChange = (id: string, field: keyof Supplier, value: string) => {
    const current = fornecedores.find((item) => item.id === id);
    if (!current) return;
    upsertFornecedor({
      id,
      ...current,
      [field]: value,
    });
  };

  const handleToggleAtivo = (id: string, ativo: boolean) => {
    const current = fornecedores.find((item) => item.id === id);
    if (!current) return;
    upsertFornecedor({
      id,
      ...current,
      ativo,
    });
  };

  const handleFlagChange = (id: string, flag: "cesta" | "reducao" | "refeicao", value: boolean) => {
    const current = fornecedores.find((item) => item.id === id);
    if (!current) {
      return;
    }
    if (flag === "refeicao") {
      upsertFornecedor({ id, ...current, isRefeicaoPronta: value });
      return;
    }
    upsertFornecedor({
      id,
      ...current,
      flagsItem: { ...current.flagsItem, [flag]: value },
    });
  };

  const handleContatoChange = (
    id: string,
    field: "nome" | "email" | "telefone",
    value: string,
  ) => {
    const current = fornecedores.find((item) => item.id === id);
    if (!current) return;
    upsertFornecedor({
      id,
      ...current,
      contato: {
        ...current.contato,
        [field]: value,
      },
    });
  };

  const handleCadeiaChange = (id: string, newCadeia: string[]) => {
    const current = fornecedores.find((item) => item.id === id);
    if (!current) return;
    upsertFornecedor({
      id,
      ...current,
      cadeia: newCadeia,
    });
  };

  const handleToggleCard = (id: string, open: boolean) => {
    setExpandedCards((prev) => ({ ...prev, [id]: open }));
  };

  const handleDuplicate = (supplier: Supplier) => {
    const newId = createEmptySupplier().id;
    const { id, ...rest } = supplier;
    upsertFornecedor({
      ...rest,
      id: newId,
      nome: supplier.nome ? `${supplier.nome} (copia)` : "Fornecedor (copia)",
      contato: rest.contato ? { ...rest.contato } : undefined,
      flagsItem: rest.flagsItem ? { ...rest.flagsItem } : undefined,
      cadeia: rest.cadeia ? [...rest.cadeia] : undefined,
    });
    setExpandedCards((prev) => ({ ...prev, [newId]: true }));
  };

  const handleAddSupplier = () => {
    const novo = createEmptySupplier();
    upsertFornecedor(novo);
    setExpandedCards((prev) => ({ ...prev, [novo.id]: true }));
    logActivity({
      activity_type: 'fornecedor_criado',
      entity_type: 'fornecedor',
      entity_id: novo.id,
      entity_name: 'Novo fornecedor',
    });
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    removeFornecedor(supplier.id);
    logActivity({
      activity_type: 'fornecedor_excluido',
      entity_type: 'fornecedor',
      entity_id: supplier.id,
      entity_name: supplier.nome || 'Fornecedor sem nome',
    });
  };

  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importarCSV(text);
    event.target.value = "";
  };

  const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importarJSON(text);
    event.target.value = "";
  };

  const handleExportCsv = () => {
    const csv = exportarCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fornecedores.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const json = exportarJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fornecedores.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cadastro de fornecedores</h2>
          <p className="text-muted-foreground">
            Registre dados basicos, contatos e cadeia de fornecimento. Valores e tributacao ficam na aba Contratos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCsv}
          />
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportJson}
          />
          <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => jsonInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <FileJson className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          <Button size="sm" onClick={handleAddSupplier}>
            <Plus className="mr-2 h-4 w-4" />
            Novo fornecedor
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <Input
              placeholder="Buscar por nome, CNPJ ou contato..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Total</span>
                <span className="font-semibold text-foreground">{fornecedores.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ativos</span>
                <span className="font-semibold text-foreground">
                  {fornecedores.filter((item) => item.ativo !== false).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredSuppliers.map((supplier) => {
          const ufNome = supplier.uf ? ESTADOS.find((estado) => estado.sigla === supplier.uf)?.nome : undefined;
          const cadeia = supplier.cadeia ?? Array.from({ length: SUPPLY_CHAIN_STAGES }, () => "");
          const contato = supplier.contato ?? {};
          const isOpen = expandedCards[supplier.id] ?? false;

          const locationLabel = supplier.uf
            ? `${supplier.uf.toUpperCase()}${ufNome ? ` - ${ufNome}` : ""}`
            : "Localizacao nao informada";

          const flagBadges = [
            supplier.flagsItem?.cesta
              ? { key: "cesta", label: "Cesta basica", variant: "secondary" as const }
              : null,
            supplier.flagsItem?.reducao
              ? { key: "reducao", label: "Reducao de aliquota", variant: "warning" as const }
              : null,
            supplier.isRefeicaoPronta
              ? { key: "refeicao", label: "Refeicao pronta", variant: "success" as const }
              : null,
          ].filter(Boolean) as Array<{ key: string; label: string; variant: "secondary" | "warning" | "success" }>;

          return (
            <Collapsible
              key={supplier.id}
              open={isOpen}
              onOpenChange={(open) => handleToggleCard(supplier.id, open)}
            >
              <Card className="border-muted/70">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Factory className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold text-foreground">
                          {supplier.nome.trim().length > 0 ? supplier.nome : "Fornecedor sem nome"}
                        </span>
                        <Badge variant={supplier.ativo !== false ? "secondary" : "outline"}>
                          {supplier.ativo !== false ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {supplier.cnpj && supplier.cnpj.trim().length > 0
                          ? `CNPJ: ${supplier.cnpj}`
                          : "CNPJ nao informado"}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {SUPPLIER_TIPO_LABELS[supplier.tipo]}
                        </span>
                        <span className="flex items-center gap-1">
                          {REGIME_LABELS[supplier.regime]}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {locationLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {contato.nome ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {contato.nome}
                          </span>
                        ) : null}
                        {contato.email ? (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contato.email}
                          </span>
                        ) : null}
                        {contato.telefone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {contato.telefone}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1">
                        {isOpen ? "Recolher" : "Editar"}
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  {flagBadges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {flagBadges.map((badge) => (
                        <Badge key={`${supplier.id}-${badge.key}`} variant={badge.variant} className="gap-1">
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    <section className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Identificacao</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`supplier-name-${supplier.id}`}>Nome</Label>
                          <Input
                            id={`supplier-name-${supplier.id}`}
                            value={supplier.nome}
                            onChange={(event) => handleFieldChange(supplier.id, "nome", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`supplier-cnpj-${supplier.id}`}>CNPJ</Label>
                          <Input
                            id={`supplier-cnpj-${supplier.id}`}
                            value={supplier.cnpj ?? ""}
                            onChange={(event) => handleFieldChange(supplier.id, "cnpj", event.target.value)}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Tipo</Label>
                          <Select
                            value={supplier.tipo}
                            onValueChange={(value) => handleFieldChange(supplier.id, "tipo", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPLIER_TIPO_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Regime tributario</Label>
                          <Select
                            value={supplier.regime}
                            onValueChange={(value) => handleFieldChange(supplier.id, "regime", value)}
                          >
                            <SelectTrigger>
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
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-dashed px-3 py-2">
                        <span className="text-sm text-muted-foreground">
                          {supplier.ativo !== false ? "Fornecedor ativo" : "Fornecedor inativo"}
                        </span>
                        <Switch
                          checked={supplier.ativo !== false}
                          onCheckedChange={(checked) => handleToggleAtivo(supplier.id, Boolean(checked))}
                        />
                      </div>
                    </section>

                    <section className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Localizacao</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label>UF</Label>
                          <Select
                            value={supplier.uf && supplier.uf.trim().length > 0 ? supplier.uf : EMPTY_SELECT_VALUE}
                            onValueChange={(value) =>
                              handleFieldChange(
                                supplier.id,
                                "uf",
                                value === EMPTY_SELECT_VALUE ? "" : value,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={EMPTY_SELECT_VALUE}>Nao informado</SelectItem>
                              {ESTADOS.map((estado) => (
                                <SelectItem key={estado.sigla} value={estado.sigla}>
                                  {estado.sigla} - {estado.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Municipio (IBGE)</Label>
                          <Input
                            value={supplier.municipio ?? ""}
                            onChange={(event) => handleFieldChange(supplier.id, "municipio", event.target.value)}
                            placeholder="Codigo ou nome"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Contato principal</Label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label htmlFor={`supplier-contact-name-${supplier.id}`}>Nome</Label>
                          <Input
                            id={`supplier-contact-name-${supplier.id}`}
                            value={contato.nome ?? ""}
                            onChange={(event) =>
                              handleContatoChange(supplier.id, "nome", event.target.value)
                            }
                            placeholder="Responsavel"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`supplier-contact-email-${supplier.id}`}>E-mail</Label>
                          <Input
                            id={`supplier-contact-email-${supplier.id}`}
                            type="email"
                            value={contato.email ?? ""}
                            onChange={(event) =>
                              handleContatoChange(supplier.id, "email", event.target.value)
                            }
                            placeholder="contato@empresa.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`supplier-contact-phone-${supplier.id}`}>Telefone</Label>
                          <Input
                            id={`supplier-contact-phone-${supplier.id}`}
                            value={contato.telefone ?? ""}
                            onChange={(event) =>
                              handleContatoChange(supplier.id, "telefone", event.target.value)
                            }
                            placeholder="(11) 90000-0000"
                          />
                        </div>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Classificacoes e flags</Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={supplier.flagsItem?.cesta ?? false}
                            onCheckedChange={(checked) =>
                              handleFlagChange(supplier.id, "cesta", Boolean(checked))
                            }
                          />
                          <span>Cesta basica</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={supplier.flagsItem?.reducao ?? false}
                            onCheckedChange={(checked) =>
                              handleFlagChange(supplier.id, "reducao", Boolean(checked))
                            }
                          />
                          <span>Reducao de aliquota</span>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={supplier.isRefeicaoPronta ?? false}
                            onCheckedChange={(checked) =>
                              handleFlagChange(supplier.id, "refeicao", Boolean(checked))
                            }
                          />
                          <span>Refeicao pronta / Beneficios</span>
                        </label>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Etapas da cadeia de fornecimento
                      </Label>
                      <SupplyChainEditor
                        cadeia={cadeia}
                        supplierTipo={supplier.tipo}
                        onChange={(newCadeia) => handleCadeiaChange(supplier.id, newCadeia)}
                        stagesCount={SUPPLY_CHAIN_STAGES}
                      />
                    </section>
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailsSupplierId(supplier.id)}
                    >
                      <Settings2 className="mr-2 h-4 w-4" />
                      Detalhes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(supplier)}>
                      Duplicar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSupplier(supplier)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </CardFooter>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {filteredSuppliers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Factory className="h-10 w-10" />
            <p>Nenhum fornecedor encontrado com os filtros atuais.</p>
            <Button variant="outline" size="sm" onClick={handleAddSupplier}>
              <Plus className="mr-2 h-4 w-4" />
              Criar fornecedor
            </Button>
          </CardContent>
        </Card>
      )}

      {supplierDetails ? (
        <SupplierDetailsSheet
          supplier={supplierDetails}
          produtos={produtos}
          open={Boolean(supplierDetails)}
          onClose={() => setDetailsSupplierId(null)}
          onUpdate={(id, patch) => {
            const current = fornecedores.find((item) => item.id === id);
            if (!current) return;
            upsertFornecedor({
              id,
              ...current,
              ...patch,
            });
          }}
        />
      ) : null}
    </div>
  );
};

export default SuppliersManager;
