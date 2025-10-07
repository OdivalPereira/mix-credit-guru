import { memo, useMemo } from "react";
import { Copy, Info, Trash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import type { MixResultadoItem, Supplier } from "@/types/domain";
import { getMunicipiosByUF } from "@/data/locations";

interface SupplierRowProps {
  supplier: MixResultadoItem;
  formatCurrency: (value: number) => string;
  onFieldChange: (id: string, field: keyof Supplier, value: string) => void;
  onFlagChange: (
    id: string,
    flag: "cesta" | "reducao" | "refeicao",
    value: boolean,
  ) => void;
  onDuplicate: (supplier: MixResultadoItem) => void;
  onRemove: (id: string) => void;
  getCreditBadge: (creditavel: boolean, credito: number) => JSX.Element;
  onOpenDetails: () => void;
}

const tipoOptions = ["industria", "distribuidor", "produtor", "atacado", "varejo"] as const;
const regimeOptions = ["normal", "simples", "presumido"] as const;

const SupplierRowComponent = ({
  supplier,
  formatCurrency,
  onFieldChange,
  onFlagChange,
  onDuplicate,
  onRemove,
  getCreditBadge,
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

  return (
    <TableRow
      data-testid="supplier-row"
      data-supplier-id={supplier.id}
      className={supplier.ranking === 1 ? "bg-success/5" : ""}
    >
      <TableCell className="w-16 text-center font-medium">
        {supplier.ranking === 1 && (
          <Badge variant="success" className="mr-2">
            1o
          </Badge>
        )}
        {supplier.ranking}
      </TableCell>

      <TableCell className="min-w-[260px] font-medium">
        <div className="space-y-1">
          <Input
            data-testid="supplier-name"
            value={supplier.nome}
            onChange={(event) =>
              onFieldChange(supplier.id, "nome", event.target.value)
            }
          />
          <div className="text-xs text-muted-foreground">
            {supplier.cnpj ? `CNPJ: ${supplier.cnpj}` : "CNPJ nao informado"}
          </div>
          <div className="text-xs text-muted-foreground">
            {supplier.produtoDescricao && supplier.produtoDescricao.length > 0
              ? `Produto: ${supplier.produtoDescricao}`
              : "Produto nao vinculado"}
          </div>
          <div className="text-xs text-muted-foreground">
            {locationSummary}
          </div>
        </div>
      </TableCell>

      <TableCell className="min-w-[160px]">
        <Select
          value={supplier.tipo}
          onValueChange={(value) => onFieldChange(supplier.id, "tipo", value)}
        >
          <SelectTrigger data-testid="supplier-tipo" aria-label="Tipo de fornecedor">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {tipoOptions.map((tipo) => (
              <SelectItem key={tipo} value={tipo}>
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className="min-w-[160px]">
        <Select
          value={supplier.regime}
          onValueChange={(value) => onFieldChange(supplier.id, "regime", value)}
        >
          <SelectTrigger
            data-testid="supplier-regime"
            aria-label="Regime tributario do fornecedor"
          >
            <SelectValue placeholder="Regime" />
          </SelectTrigger>
          <SelectContent>
            {regimeOptions.map((regime) => (
              <SelectItem key={regime} value={regime}>
                {regime.charAt(0).toUpperCase() + regime.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className="min-w-[140px] text-right">
        <Input
          data-testid="supplier-price"
          type="number"
          step="0.01"
          value={supplier.preco}
          onChange={(event) =>
            onFieldChange(supplier.id, "preco", event.target.value)
          }
        />
      </TableCell>

      <TableCell className="w-24 text-right">
        {supplier.ibs.toFixed(2)}%
      </TableCell>
      <TableCell className="w-24 text-right">
        {supplier.cbs.toFixed(2)}%
      </TableCell>
      <TableCell className="w-24 text-right">
        {supplier.is.toFixed(2)}%
      </TableCell>

      <TableCell className="min-w-[140px] text-right">
        <Input
          data-testid="supplier-frete"
          type="number"
          step="0.01"
          value={supplier.frete}
          onChange={(event) =>
            onFieldChange(supplier.id, "frete", event.target.value)
          }
        />
      </TableCell>

      <TableCell className="w-24 text-center">
        <Checkbox
          checked={supplier.flagsItem?.cesta ?? false}
          onCheckedChange={(value) =>
            onFlagChange(supplier.id, "cesta", Boolean(value))
          }
          aria-label="Cesta basica"
        />
      </TableCell>

      <TableCell className="w-28 text-center">
        <Checkbox
          checked={supplier.flagsItem?.reducao ?? false}
          onCheckedChange={(value) =>
            onFlagChange(supplier.id, "reducao", Boolean(value))
          }
          aria-label="Reducao"
        />
      </TableCell>

      <TableCell className="w-28 text-center">
        <Checkbox
          checked={supplier.isRefeicaoPronta ?? false}
          onCheckedChange={(value) =>
            onFlagChange(supplier.id, "refeicao", Boolean(value))
          }
          aria-label="Refeicao pronta"
        />
      </TableCell>

      <TableCell className="min-w-[160px] text-center">
        {getCreditBadge(supplier.creditavel, supplier.credito)}
      </TableCell>
      <TableCell className="min-w-[140px] text-right">
        {formatCurrency(supplier.credito)}
      </TableCell>
      <TableCell className="min-w-[160px] text-right font-bold">
        {formatCurrency(supplier.custoEfetivo)}
      </TableCell>
      <TableCell className="min-w-[160px] text-right">
        {supplier.custoNormalizado ? formatCurrency(supplier.custoNormalizado) : "-"}
      </TableCell>

      <TableCell className="min-w-[140px]">
        {supplier.degrauAplicado ? (
          <Badge variant="outline">{supplier.degrauAplicado}</Badge>
        ) : (
          "-"
        )}
      </TableCell>

      <TableCell className="min-w-[160px]">
        {supplier.restricoes?.length ? (
          <div className="space-y-1">
            {supplier.restricoes.map((restriction) => (
              <Badge key={restriction} variant="warning" className="mr-1">
                {restriction}
              </Badge>
            ))}
          </div>
        ) : (
          "-"
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
