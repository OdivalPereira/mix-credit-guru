import { memo } from "react";
import { Copy, Trash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import type { MixResultadoItem, Supplier } from "@/types/domain";

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
}

const SupplierRowComponent = ({
  supplier,
  formatCurrency,
  onFieldChange,
  onFlagChange,
  onDuplicate,
  onRemove,
  getCreditBadge,
}: SupplierRowProps) => {
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

      <TableCell className="min-w-[240px] font-medium">
        <Input
          data-testid="supplier-name"
          value={supplier.nome}
          onChange={(event) =>
            onFieldChange(supplier.id, "nome", event.target.value)
          }
        />
      </TableCell>

      <TableCell className="min-w-[140px]">
        <Input
          data-testid="supplier-tipo"
          value={supplier.tipo}
          onChange={(event) =>
            onFieldChange(supplier.id, "tipo", event.target.value)
          }
        />
      </TableCell>

      <TableCell className="min-w-[140px]">
        <Input
          data-testid="supplier-regime"
          value={supplier.regime}
          onChange={(event) =>
            onFieldChange(supplier.id, "regime", event.target.value)
          }
        />
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
