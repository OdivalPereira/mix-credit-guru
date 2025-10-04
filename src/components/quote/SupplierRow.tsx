import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Copy, Trash } from "lucide-react";
import type { MixResultadoItem, Supplier } from "@/types/domain";

interface SupplierRowProps {
  supplier: MixResultadoItem;
  formatCurrency: (value: number) => string;
  onFieldChange: (id: string, field: keyof Supplier, value: string) => void;
  onFlagChange: (id: string, flag: "cesta" | "reducao" | "refeicao", value: boolean) => void;
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
      <TableCell className="font-medium">
        {supplier.ranking === 1 && (
          <Badge variant="success" className="mr-2">
            1º
          </Badge>
        )}
        {supplier.ranking}
      </TableCell>
      
      <TableCell className="font-medium">
        <Input
          data-testid="supplier-name"
          value={supplier.nome}
          onChange={(e) => onFieldChange(supplier.id, "nome", e.target.value)}
        />
      </TableCell>
      
      <TableCell>
        <Input
          data-testid="supplier-tipo"
          value={supplier.tipo}
          onChange={(e) => onFieldChange(supplier.id, "tipo", e.target.value)}
        />
      </TableCell>
      
      <TableCell>
        <Input
          data-testid="supplier-regime"
          value={supplier.regime}
          onChange={(e) => onFieldChange(supplier.id, "regime", e.target.value)}
        />
      </TableCell>
      
      <TableCell className="text-right">
        <Input
          data-testid="supplier-preco"
          type="number"
          step="0.01"
          value={supplier.preco}
          onChange={(e) => onFieldChange(supplier.id, "preco", e.target.value)}
        />
      </TableCell>
      
      <TableCell className="text-right">{supplier.ibs.toFixed(2)}%</TableCell>
      <TableCell className="text-right">{supplier.cbs.toFixed(2)}%</TableCell>
      <TableCell className="text-right">{supplier.is.toFixed(2)}%</TableCell>
      
      <TableCell className="text-right">
        <Input
          data-testid="supplier-frete"
          type="number"
          step="0.01"
          value={supplier.frete}
          onChange={(e) => onFieldChange(supplier.id, "frete", e.target.value)}
        />
      </TableCell>
      
      <TableCell>
        <Checkbox
          checked={supplier.flagsItem?.cesta ?? false}
          onCheckedChange={(v) => onFlagChange(supplier.id, "cesta", v as boolean)}
          aria-label="Cesta básica"
        />
      </TableCell>
      
      <TableCell>
        <Checkbox
          checked={supplier.flagsItem?.reducao ?? false}
          onCheckedChange={(v) => onFlagChange(supplier.id, "reducao", v as boolean)}
          aria-label="Redução"
        />
      </TableCell>
      
      <TableCell>
        <Checkbox
          checked={supplier.isRefeicaoPronta ?? false}
          onCheckedChange={(v) => onFlagChange(supplier.id, "refeicao", v as boolean)}
          aria-label="Refeição pronta"
        />
      </TableCell>
      
      <TableCell>{getCreditBadge(supplier.creditavel, supplier.credito)}</TableCell>
      <TableCell className="text-right">{formatCurrency(supplier.credito)}</TableCell>
      <TableCell className="text-right font-bold">
        {formatCurrency(supplier.custoEfetivo)}
      </TableCell>
      
      <TableCell className="text-right">
        {supplier.custoNormalizado
          ? formatCurrency(supplier.custoNormalizado)
          : "-"}
      </TableCell>
      
      <TableCell>
        {supplier.degrauAplicado ? (
          <Badge variant="outline">{supplier.degrauAplicado}</Badge>
        ) : (
          "-"
        )}
      </TableCell>
      
      <TableCell>
        {supplier.restricoes?.length ? (
          <div className="space-y-1">
            {supplier.restricoes.map((r, i) => (
              <Badge key={i} variant="warning" className="mr-1">
                {r}
              </Badge>
            ))}
          </div>
        ) : (
          "-"
        )}
      </TableCell>
      
      <TableCell>
        <div className="flex space-x-1">
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
