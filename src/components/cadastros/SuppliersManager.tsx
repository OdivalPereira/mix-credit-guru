import { useMemo, useRef, useState } from "react";
import { Plus, Upload, Download, FileJson, Factory, Trash2, Settings2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { SupplierDetailsSheet } from "@/components/quote/SupplierDetailsSheet";
import { useCotacaoStore, createEmptySupplier, SUPPLY_CHAIN_STAGES } from "@/store/useCotacaoStore";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import type { Supplier } from "@/types/domain";
import { SUPPLIER_TIPO_OPTIONS, SUPPLIER_TIPO_LABELS, REGIME_OPTIONS, REGIME_LABELS } from "@/data/lookups";
import { ESTADOS } from "@/data/locations";

const numericFields: Array<keyof Supplier> = [
  "preco",
  "frete",
  "ibs",
  "cbs",
  "is",
  "pedidoMinimo",
  "prazoEntregaDias",
  "prazoPagamentoDias",
];

const isNumericField = (field: keyof Supplier): field is (typeof numericFields)[number] =>
  numericFields.includes(field);

const EMPTY_SELECT_VALUE = "__empty__";

export const SuppliersManager = () => {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [detailsSupplierId, setDetailsSupplierId] = useState<string | null>(null);

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

  const filteredSuppliers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return fornecedores;
    }
    return fornecedores.filter((supplier) => {
      return (
        supplier.nome.toLowerCase().includes(normalized) ||
        (supplier.cnpj ?? "").toLowerCase().includes(normalized) ||
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
      [field]: isNumericField(field) ? Number(value) || 0 : value,
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

  const handleCadeiaChange = (id: string, index: number, value: string) => {
    const current = fornecedores.find((item) => item.id === id);
    if (!current) return;
    const cadeia = [...(current.cadeia ?? Array.from({ length: SUPPLY_CHAIN_STAGES }, () => ""))];
    cadeia[index] = value;
    upsertFornecedor({
      id,
      ...current,
      cadeia,
    });
  };

  const handleDuplicate = (supplier: Supplier) => {
    const { id, nome, ...rest } = supplier;
    upsertFornecedor({
      id: undefined,
      nome: `${nome} (cópia)`,
      ...rest,
    });
  };

  const handleAddSupplier = () => {
    upsertFornecedor(createEmptySupplier());
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
            Centralize dados cadastrais, tributários e operacionais dos parceiros de fornecimento.
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
              placeholder="Buscar por nome, CNPJ ou produto..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Fornecedores</span>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredSuppliers.map((supplier) => {
          const ufNome = supplier.uf ? ESTADOS.find((estado) => estado.sigla === supplier.uf)?.nome : undefined;
          const cadeia = supplier.cadeia ?? Array.from({ length: SUPPLY_CHAIN_STAGES }, () => "");

          return (
            <Card key={supplier.id} className="border-muted">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2">
                    <CardTitle className="flex flex-col gap-2 text-lg">
                      <Input
                        value={supplier.nome}
                        onChange={(event) => handleFieldChange(supplier.id, "nome", event.target.value)}
                      />
                      <div className="text-xs text-muted-foreground">
                        {supplier.cnpj ? `CNPJ: ${supplier.cnpj}` : "CNPJ não informado"}
                      </div>
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Factory className="h-3 w-3" />
                        {SUPPLIER_TIPO_LABELS[supplier.tipo]}
                      </span>
                      <span>{REGIME_LABELS[supplier.regime]}</span>
                      {supplier.uf ? (
                        <Badge variant="secondary">
                          {supplier.uf.toUpperCase()}
                          {ufNome ? ` - ${ufNome}` : ""}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={supplier.ativo !== false}
                      onCheckedChange={(checked) => handleToggleAtivo(supplier.id, Boolean(checked))}
                    />
                    <span className="text-xs text-muted-foreground">
                      {supplier.ativo !== false ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <section className="grid gap-3 sm:grid-cols-2">
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
                    <Label>Regime tributário</Label>
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
                  <div className="space-y-1">
                    <Label>UF</Label>
                    <Select
                      value={supplier.uf && supplier.uf.trim() !== "" ? supplier.uf : EMPTY_SELECT_VALUE}
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
                        <SelectItem value={EMPTY_SELECT_VALUE}>Não informado</SelectItem>
                        {ESTADOS.map((estado) => (
                          <SelectItem key={estado.sigla} value={estado.sigla}>
                            {estado.sigla} - {estado.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Município</Label>
                    <Input
                      value={supplier.municipio ?? ""}
                      onChange={(event) => handleFieldChange(supplier.id, "municipio", event.target.value)}
                    />
                  </div>
                </section>

                <section className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Condições comerciais</Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={supplier.preco}
                        onChange={(event) => handleFieldChange(supplier.id, "preco", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Frete (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={supplier.frete}
                        onChange={(event) => handleFieldChange(supplier.id, "frete", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>IBS (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={supplier.ibs}
                        onChange={(event) => handleFieldChange(supplier.id, "ibs", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>CBS (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={supplier.cbs}
                        onChange={(event) => handleFieldChange(supplier.id, "cbs", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>IS (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={supplier.is}
                        onChange={(event) => handleFieldChange(supplier.id, "is", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Produto negociado</Label>
                      <Textarea
                        value={supplier.produtoDescricao ?? ""}
                        onChange={(event) =>
                          handleFieldChange(supplier.id, "produtoDescricao", event.target.value)
                        }
                        placeholder="Referência do item ou descrição comercial"
                        className="resize-none"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Pedido mínimo</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={supplier.pedidoMinimo ?? 0}
                        onChange={(event) => handleFieldChange(supplier.id, "pedidoMinimo", event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Prazo de entrega (dias)</Label>
                      <Input
                        type="number"
                        value={supplier.prazoEntregaDias ?? 0}
                        onChange={(event) =>
                          handleFieldChange(supplier.id, "prazoEntregaDias", event.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Prazo de pagamento (dias)</Label>
                      <Input
                        type="number"
                        value={supplier.prazoPagamentoDias ?? 0}
                        onChange={(event) =>
                          handleFieldChange(supplier.id, "prazoPagamentoDias", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Flags tributárias e operacionais</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={supplier.flagsItem?.cesta ?? false}
                        onCheckedChange={(checked) => handleFlagChange(supplier.id, "cesta", Boolean(checked))}
                      />
                      <span>Cesta básica</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={supplier.flagsItem?.reducao ?? false}
                        onCheckedChange={(checked) => handleFlagChange(supplier.id, "reducao", Boolean(checked))}
                      />
                      <span>Redução de alíquota</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={supplier.isRefeicaoPronta ?? false}
                        onCheckedChange={(checked) => handleFlagChange(supplier.id, "refeicao", Boolean(checked))}
                      />
                      <span>Refeição pronta / Benefícios</span>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Etapas da cadeia de fornecimento</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Array.from({ length: SUPPLY_CHAIN_STAGES }).map((_, index) => (
                      <Input
                        key={`${supplier.id}-chain-${index}`}
                        placeholder={`Etapa ${index + 1}`}
                        value={cadeia[index] ?? ""}
                        onChange={(event) => handleCadeiaChange(supplier.id, index, event.target.value)}
                      />
                    ))}
                  </div>
                </section>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  {supplier.produtoId ? (
                    <Badge variant="outline">Produto ID: {supplier.produtoId}</Badge>
                  ) : null}
                  {supplier.unidadeNegociada ? (
                    <Badge variant="outline">Unidade: {supplier.unidadeNegociada.toUpperCase()}</Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailsSupplierId(supplier.id)}
                  >
                    <Settings2 className="mr-2 h-4 w-4" />
                    Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(supplier)}
                  >
                    Duplicar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFornecedor(supplier.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </CardFooter>
            </Card>
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
