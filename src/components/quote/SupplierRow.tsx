import { memo, useMemo } from "react";
import { Copy, Info, Trash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ContractFornecedor, MixResultadoItem, Supplier } from "@/types/domain";
import { getMunicipiosByUF } from "@/data/locations";
import { REGIME_LABELS, SUPPLIER_TIPO_LABELS } from "@/data/lookups";

interface SupplierRowProps {
  supplier: MixResultadoItem;
  sourceSupplier?: Supplier;
  contract?: ContractFornecedor;
  formatCurrency: (value: number) => string;
  getCreditBadge: (creditavel: boolean, credito: number) => JSX.Element;
  onDuplicate: (supplier: MixResultadoItem) => void;
  onRemove: (id: string) => void;
  onOpenDetails: () => void;
}

const SupplierRowComponent = ({
  supplier,
  sourceSupplier,
  contract,
  formatCurrency,
  getCreditBadge,
  onDuplicate,
  onRemove,
  onOpenDetails,
}: SupplierRowProps) => {
  const municipioNome = useMemo(() => {
    if (!supplier.uf || !supplier.municipio) {
      return undefined;
    }
    const municipios = getMunicipiosByUF(supplier.uf.toUpperCase());
    return municipios.find((item) => item.codigo === supplier.municipio)?.nome;
  }, [supplier.municipio, supplier.uf]);

  const locationSummary = useMemo(() => {
    if (!supplier.uf && !municipioNome) {
      return "Localizacao nao informada";
    }
    const parts: string[] = [];
    if (supplier.uf) {
      parts.push(supplier.uf.toUpperCase());
    }
    if (municipioNome) {
      parts.push(municipioNome);
    }
    return parts.join(" - ") || "Localizacao nao informada";
  }, [municipioNome, supplier.uf]);

  const flagBadges = [
    supplier.flagsItem?.cesta ? { key: "cesta", label: "Cesta basica", variant: "secondary" as const } : null,
    supplier.flagsItem?.reducao ? { key: "reducao", label: "Reducao", variant: "warning" as const } : null,
    supplier.isRefeicaoPronta ? { key: "refeicao", label: "Refeicao pronta", variant: "success" as const } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; variant: "secondary" | "warning" | "success" }>;

  const priceChanged =
    sourceSupplier && Number.isFinite(sourceSupplier.preco)
      ? sourceSupplier.preco !== supplier.preco
      : false;
  const freightChanged =
    sourceSupplier && Number.isFinite(sourceSupplier.frete)
      ? sourceSupplier.frete !== supplier.frete
      : false;

  const restrictions = supplier.restricoes ?? [];

  return (
    <TableRow
      data-testid="supplier-row"
      data-supplier-id={supplier.id}
      className={supplier.ranking === 1 ? "bg-success/5" : ""}
    >
      <TableCell className="w-16 text-center font-medium">
        {supplier.ranking === 1 ? (
          <Badge variant="success" className="mr-2">
            1o
          </Badge>
        ) : null}
        {supplier.ranking}
      </TableCell>

      <TableCell className="min-w-[260px]">
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground">
            {supplier.nome.trim().length > 0 ? supplier.nome : "Fornecedor sem nome"}
          </div>
          <div className="text-xs text-muted-foreground">
            {supplier.cnpj ? `CNPJ: ${supplier.cnpj}` : "CNPJ nao informado"}
          </div>
          <div className="text-xs text-muted-foreground">{locationSummary}</div>
          {supplier.contato?.email ? (
            <div className="text-xs text-muted-foreground">{supplier.contato.email}</div>
          ) : null}
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="border-dashed">
              {SUPPLIER_TIPO_LABELS[supplier.tipo]}
            </Badge>
            <Badge variant="outline" className="border-dashed">
              {REGIME_LABELS[supplier.regime]}
            </Badge>
          </div>
        </div>
      </TableCell>

      <TableCell className="min-w-[220px]">
        {contract ? (
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">
              {contract.produtoId?.trim() ? contract.produtoId : "Contrato sem produto"}
            </div>
            {contract.unidade ? (
              <div className="text-xs text-muted-foreground">
                Unidade: {contract.unidade.toUpperCase()}
              </div>
            ) : null}
            <div className="text-xs text-muted-foreground">
              Preco base: {formatCurrency(contract.precoBase)}
            </div>
            {supplier.degrauAplicado ? (
              <div className="text-xs text-muted-foreground">Degrau: {supplier.degrauAplicado}</div>
            ) : null}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">Nenhum contrato vinculado</div>
        )}
      </TableCell>

      <TableCell className="min-w-[140px] text-right">
        <div className="font-medium">{formatCurrency(supplier.preco)}</div>
        <div className="text-[11px] text-muted-foreground">
          {priceChanged ? "Ajustado pelo contrato" : "Valor informado"}
        </div>
      </TableCell>

      <TableCell className="min-w-[140px] text-right">
        <div className="font-medium">{formatCurrency(supplier.frete)}</div>
        <div className="text-[11px] text-muted-foreground">
          {freightChanged ? "Ajustado pelo contrato" : "Valor informado"}
        </div>
      </TableCell>

      <TableCell className="min-w-[160px] text-center">
        <div className="font-mono text-sm">{supplier.ibs.toFixed(2)}%</div>
        <div className="font-mono text-xs text-muted-foreground">
          CBS {supplier.cbs.toFixed(2)}% | IS {supplier.is.toFixed(2)}%
        </div>
      </TableCell>

      <TableCell className="min-w-[160px]">
        {flagBadges.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {flagBadges.map((flag) => (
              <Badge key={`${supplier.id}-${flag.key}`} variant={flag.variant} className="gap-1">
                {flag.label}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sem flags</span>
        )}
      </TableCell>

      <TableCell className="min-w-[160px] text-center">
        <div className="flex flex-col items-center gap-1">
          {getCreditBadge(supplier.creditavel, supplier.credito)}
          <span className="text-xs text-muted-foreground">
            {formatCurrency(supplier.credito)}
          </span>
        </div>
      </TableCell>

      <TableCell className="min-w-[180px] text-right">
        <div className="font-bold text-foreground">{formatCurrency(supplier.custoEfetivo)}</div>
        <div className="text-xs text-muted-foreground">
          {supplier.custoNormalizado
            ? `Normalizado: ${formatCurrency(supplier.custoNormalizado)}`
            : "Sem normalizacao"}
        </div>
      </TableCell>

      <TableCell className="min-w-[200px]">
        {restrictions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {restrictions.map((restriction) => (
              <Badge key={restriction} variant="warning" className="gap-1 text-[11px]">
                {restriction}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Sem restricoes</span>
        )}
      </TableCell>

      <TableCell className="w-[120px] text-center">
        <div className="flex justify-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDetails}
            aria-label="Detalhes do fornecedor"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(supplier)}
            aria-label="Duplicar fornecedor"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(supplier.id)}
            aria-label="Remover fornecedor"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export const SupplierRow = memo(SupplierRowComponent);
