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
  Package,
  ShoppingCart,
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
import { Separator } from "@/components/ui/separator";

import { SupplyChainEditor } from "@/components/cadastros/SupplyChainEditor";
import {
  useCotacaoStore,
  createEmptyFornecedor,
  createEmptyOferta,
  SUPPLY_CHAIN_STAGES,
} from "@/store/useCotacaoStore";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useActivityLogStore } from "@/store/useActivityLogStore";
import type { Fornecedor, OfertaFornecedor } from "@/types/domain";
import {
  SUPPLIER_TIPO_OPTIONS,
  SUPPLIER_TIPO_LABELS,
  REGIME_OPTIONS,
  REGIME_LABELS,
} from "@/data/lookups";
import { ESTADOS } from "@/data/locations";

const EMPTY_SELECT_VALUE = "__empty__";

// ============= Oferta Card Component =============

interface OfertaCardProps {
  oferta: OfertaFornecedor;
  fornecedorTipo: Fornecedor["tipo"];
  onUpdate: (patch: Partial<OfertaFornecedor>) => void;
  onDelete: () => void;
}

const OfertaCard = ({ oferta, fornecedorTipo, onUpdate, onDelete }: OfertaCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const produtos = useCatalogoStore((state) => state.produtos);
  const cadeia = oferta.cadeia ?? Array.from({ length: SUPPLY_CHAIN_STAGES }, () => "");

  const produtoNome = oferta.produtoDescricao || 
    produtos.find(p => p.id === oferta.produtoId)?.descricao || 
    "Produto não especificado";

  const flagBadges = [
    oferta.flagsItem?.cesta
      ? { key: "cesta", label: "Cesta básica", variant: "secondary" as const }
      : null,
    oferta.flagsItem?.reducao
      ? { key: "reducao", label: "Redução", variant: "warning" as const }
      : null,
    oferta.isRefeicaoPronta
      ? { key: "refeicao", label: "Refeição pronta", variant: "success" as const }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; variant: "secondary" | "warning" | "success" }>;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-dashed bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{produtoNome}</span>
            <Badge variant={oferta.ativa ? "secondary" : "outline"} className="shrink-0">
              {oferta.ativa ? "Ativa" : "Inativa"}
            </Badge>
            {flagBadges.map((badge) => (
              <Badge key={badge.key} variant={badge.variant} className="shrink-0">
                {badge.label}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-sm text-muted-foreground">
              R$ {oferta.preco.toFixed(2)}
            </span>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label>Produto</Label>
              <Select
                value={oferta.produtoId || EMPTY_SELECT_VALUE}
                onValueChange={(value) => {
                  const produto = produtos.find(p => p.id === value);
                  onUpdate({ 
                    produtoId: value === EMPTY_SELECT_VALUE ? "" : value,
                    produtoDescricao: produto?.descricao ?? ""
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_SELECT_VALUE}>Não especificado</SelectItem>
                  {produtos.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Descrição (livre)</Label>
              <Input
                value={oferta.produtoDescricao ?? ""}
                onChange={(e) => onUpdate({ produtoDescricao: e.target.value })}
                placeholder="Nome do produto"
              />
            </div>

            <div className="space-y-1">
              <Label>Preço unitário</Label>
              <Input
                type="number"
                step="0.01"
                value={oferta.preco}
                onChange={(e) => onUpdate({ preco: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1">
              <Label>Frete</Label>
              <Input
                type="number"
                step="0.01"
                value={oferta.frete}
                onChange={(e) => onUpdate({ frete: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1">
              <Label>Pedido mínimo</Label>
              <Input
                type="number"
                value={oferta.pedidoMinimo ?? 0}
                onChange={(e) => onUpdate({ pedidoMinimo: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-1">
              <Label>Prazo entrega (dias)</Label>
              <Input
                type="number"
                value={oferta.prazoEntregaDias ?? 0}
                onChange={(e) => onUpdate({ prazoEntregaDias: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">Classificações</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={oferta.flagsItem?.cesta ?? false}
                  onCheckedChange={(checked) =>
                    onUpdate({ flagsItem: { ...oferta.flagsItem, cesta: Boolean(checked) } })
                  }
                />
                <span>Cesta básica</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={oferta.flagsItem?.reducao ?? false}
                  onCheckedChange={(checked) =>
                    onUpdate({ flagsItem: { ...oferta.flagsItem, reducao: Boolean(checked) } })
                  }
                />
                <span>Redução de alíquota</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={oferta.isRefeicaoPronta ?? false}
                  onCheckedChange={(checked) =>
                    onUpdate({ isRefeicaoPronta: Boolean(checked) })
                  }
                />
                <span>Refeição pronta</span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Cadeia de fornecimento desta oferta
            </Label>
            <SupplyChainEditor
              cadeia={cadeia}
              supplierTipo={fornecedorTipo}
              onChange={(newCadeia) => onUpdate({ cadeia: newCadeia })}
              stagesCount={SUPPLY_CHAIN_STAGES}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Oferta ativa</span>
              <Switch
                checked={oferta.ativa}
                onCheckedChange={(checked) => onUpdate({ ativa: Boolean(checked) })}
              />
            </div>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remover oferta
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

// ============= Main Component =============

export const SuppliersManager = () => {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const {
    fornecedoresCadastro,
    ofertas,
    upsertFornecedorCadastro,
    removeFornecedorCadastro,
    upsertOferta,
    removeOferta,
    getOfertasByFornecedor,
    importarCSV,
    exportarCSV,
    importarJSON,
    exportarJSON,
    contexto,
  } = useCotacaoStore();
  const logActivity = useActivityLogStore((state) => state.logActivity);

  const filteredFornecedores = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return fornecedoresCadastro;
    }
    return fornecedoresCadastro.filter((fornecedor) => {
      const ofertasFornecedor = ofertas.filter(o => o.fornecedorId === fornecedor.id);
      const matchFornecedor = 
        fornecedor.nome.toLowerCase().includes(normalized) ||
        (fornecedor.cnpj ?? "").toLowerCase().includes(normalized) ||
        (fornecedor.contato?.email ?? "").toLowerCase().includes(normalized);
      const matchOferta = ofertasFornecedor.some(o => 
        (o.produtoDescricao ?? "").toLowerCase().includes(normalized)
      );
      return matchFornecedor || matchOferta;
    });
  }, [fornecedoresCadastro, ofertas, searchTerm]);

  const handleFornecedorFieldChange = (id: string, field: keyof Fornecedor, value: string | boolean) => {
    const current = fornecedoresCadastro.find((item) => item.id === id);
    if (!current) return;
    upsertFornecedorCadastro({
      ...current,
      [field]: value,
    });
  };

  const handleContatoChange = (
    id: string,
    field: "nome" | "email" | "telefone",
    value: string,
  ) => {
    const current = fornecedoresCadastro.find((item) => item.id === id);
    if (!current) return;
    upsertFornecedorCadastro({
      ...current,
      contato: {
        ...current.contato,
        [field]: value,
      },
    });
  };

  const handleToggleCard = (id: string, open: boolean) => {
    setExpandedCards((prev) => ({ ...prev, [id]: open }));
  };

  const handleAddFornecedor = () => {
    const novo = createEmptyFornecedor(contexto);
    const id = upsertFornecedorCadastro(novo);
    setExpandedCards((prev) => ({ ...prev, [id]: true }));
    logActivity({
      activity_type: 'fornecedor_criado',
      entity_type: 'fornecedor',
      entity_id: id,
      entity_name: 'Novo fornecedor',
    });
  };

  const handleDeleteFornecedor = (fornecedor: Fornecedor) => {
    removeFornecedorCadastro(fornecedor.id);
    logActivity({
      activity_type: 'fornecedor_excluido',
      entity_type: 'fornecedor',
      entity_id: fornecedor.id,
      entity_name: fornecedor.nome || 'Fornecedor sem nome',
    });
  };

  const handleAddOferta = (fornecedorId: string) => {
    const novaOferta = createEmptyOferta(fornecedorId, contexto);
    upsertOferta(novaOferta);
  };

  const handleUpdateOferta = (ofertaId: string, patch: Partial<OfertaFornecedor>) => {
    const current = ofertas.find(o => o.id === ofertaId);
    if (!current) return;
    upsertOferta({
      ...current,
      ...patch,
    });
  };

  const handleDeleteOferta = (ofertaId: string) => {
    removeOferta(ofertaId);
  };

  const handleDuplicateFornecedor = (fornecedor: Fornecedor) => {
    const novoFornecedor = createEmptyFornecedor(contexto);
    const newId = upsertFornecedorCadastro({
      ...fornecedor,
      id: novoFornecedor.id,
      nome: fornecedor.nome ? `${fornecedor.nome} (cópia)` : "Fornecedor (cópia)",
    });
    
    // Duplicar ofertas do fornecedor
    const ofertasOriginais = getOfertasByFornecedor(fornecedor.id);
    for (const oferta of ofertasOriginais) {
      const novaOferta = createEmptyOferta(newId, contexto);
      upsertOferta({
        ...oferta,
        id: novaOferta.id,
        fornecedorId: newId,
      });
    }
    
    setExpandedCards((prev) => ({ ...prev, [newId]: true }));
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
            Gerencie fornecedores e suas ofertas por produto. Cada oferta tem sua própria cadeia de fornecimento.
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
          <Button size="sm" onClick={handleAddFornecedor}>
            <Plus className="mr-2 h-4 w-4" />
            Novo fornecedor
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <Input
              placeholder="Buscar por nome, CNPJ, contato ou produto..."
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
                <span className="font-semibold text-foreground">{fornecedoresCadastro.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ofertas</span>
                <span className="font-semibold text-foreground">{ofertas.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Ativos</span>
                <span className="font-semibold text-foreground">
                  {fornecedoresCadastro.filter((item) => item.ativo !== false).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredFornecedores.map((fornecedor) => {
          const ufNome = fornecedor.uf ? ESTADOS.find((estado) => estado.sigla === fornecedor.uf)?.nome : undefined;
          const contato = fornecedor.contato ?? {};
          const isOpen = expandedCards[fornecedor.id] ?? false;
          const ofertasFornecedor = ofertas.filter(o => o.fornecedorId === fornecedor.id);

          const locationLabel = fornecedor.uf
            ? `${fornecedor.uf.toUpperCase()}${ufNome ? ` - ${ufNome}` : ""}`
            : "Localização não informada";

          return (
            <Collapsible
              key={fornecedor.id}
              open={isOpen}
              onOpenChange={(open) => handleToggleCard(fornecedor.id, open)}
            >
              <Card className="border-muted/70">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Factory className="h-4 w-4 text-muted-foreground" />
                        <span className="text-lg font-semibold text-foreground">
                          {fornecedor.nome.trim().length > 0 ? fornecedor.nome : "Fornecedor sem nome"}
                        </span>
                        <Badge variant={fornecedor.ativo !== false ? "secondary" : "outline"}>
                          {fornecedor.ativo !== false ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {ofertasFornecedor.length} oferta{ofertasFornecedor.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fornecedor.cnpj && fornecedor.cnpj.trim().length > 0
                          ? `CNPJ: ${fornecedor.cnpj}`
                          : "CNPJ não informado"}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {SUPPLIER_TIPO_LABELS[fornecedor.tipo]}
                        </span>
                        <span className="flex items-center gap-1">
                          {REGIME_LABELS[fornecedor.regime]}
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
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    {/* Seção: Identificação */}
                    <section className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Identificação</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label htmlFor={`fornecedor-name-${fornecedor.id}`}>Nome</Label>
                          <Input
                            id={`fornecedor-name-${fornecedor.id}`}
                            value={fornecedor.nome}
                            onChange={(event) => handleFornecedorFieldChange(fornecedor.id, "nome", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`fornecedor-cnpj-${fornecedor.id}`}>CNPJ</Label>
                          <Input
                            id={`fornecedor-cnpj-${fornecedor.id}`}
                            value={fornecedor.cnpj ?? ""}
                            onChange={(event) => handleFornecedorFieldChange(fornecedor.id, "cnpj", event.target.value)}
                            placeholder="00.000.000/0000-00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Tipo</Label>
                          <Select
                            value={fornecedor.tipo}
                            onValueChange={(value) => handleFornecedorFieldChange(fornecedor.id, "tipo", value)}
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
                            value={fornecedor.regime}
                            onValueChange={(value) => handleFornecedorFieldChange(fornecedor.id, "regime", value)}
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
                          {fornecedor.ativo !== false ? "Fornecedor ativo" : "Fornecedor inativo"}
                        </span>
                        <Switch
                          checked={fornecedor.ativo !== false}
                          onCheckedChange={(checked) => handleFornecedorFieldChange(fornecedor.id, "ativo", Boolean(checked))}
                        />
                      </div>
                    </section>

                    {/* Seção: Localização */}
                    <section className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Localização</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label>UF</Label>
                          <Select
                            value={fornecedor.uf && fornecedor.uf.trim().length > 0 ? fornecedor.uf : EMPTY_SELECT_VALUE}
                            onValueChange={(value) =>
                              handleFornecedorFieldChange(
                                fornecedor.id,
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
                          <Label>Município (IBGE)</Label>
                          <Input
                            value={fornecedor.municipio ?? ""}
                            onChange={(event) => handleFornecedorFieldChange(fornecedor.id, "municipio", event.target.value)}
                            placeholder="Código ou nome"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Seção: Contato */}
                    <section className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">Contato principal</Label>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label htmlFor={`fornecedor-contact-name-${fornecedor.id}`}>Nome</Label>
                          <Input
                            id={`fornecedor-contact-name-${fornecedor.id}`}
                            value={contato.nome ?? ""}
                            onChange={(event) =>
                              handleContatoChange(fornecedor.id, "nome", event.target.value)
                            }
                            placeholder="Responsável"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`fornecedor-contact-email-${fornecedor.id}`}>E-mail</Label>
                          <Input
                            id={`fornecedor-contact-email-${fornecedor.id}`}
                            type="email"
                            value={contato.email ?? ""}
                            onChange={(event) =>
                              handleContatoChange(fornecedor.id, "email", event.target.value)
                            }
                            placeholder="contato@empresa.com"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`fornecedor-contact-phone-${fornecedor.id}`}>Telefone</Label>
                          <Input
                            id={`fornecedor-contact-phone-${fornecedor.id}`}
                            value={contato.telefone ?? ""}
                            onChange={(event) =>
                              handleContatoChange(fornecedor.id, "telefone", event.target.value)
                            }
                            placeholder="(11) 90000-0000"
                          />
                        </div>
                      </div>
                    </section>

                    <Separator />

                    {/* Seção: Ofertas */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Ofertas por produto ({ofertasFornecedor.length})
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddOferta(fornecedor.id)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Nova oferta
                        </Button>
                      </div>

                      {ofertasFornecedor.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                          <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma oferta cadastrada.</p>
                          <p className="text-xs mt-1">Adicione ofertas para definir produtos, preços e cadeias de fornecimento.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {ofertasFornecedor.map((oferta) => (
                            <OfertaCard
                              key={oferta.id}
                              oferta={oferta}
                              fornecedorTipo={fornecedor.tipo}
                              onUpdate={(patch) => handleUpdateOferta(oferta.id, patch)}
                              onDelete={() => handleDeleteOferta(oferta.id)}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => handleDuplicateFornecedor(fornecedor)}>
                      Duplicar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteFornecedor(fornecedor)}>
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

      {filteredFornecedores.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Factory className="h-10 w-10" />
            <p>Nenhum fornecedor encontrado com os filtros atuais.</p>
            <Button variant="outline" size="sm" onClick={handleAddFornecedor}>
              <Plus className="mr-2 h-4 w-4" />
              Criar fornecedor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuppliersManager;
