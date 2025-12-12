import { RefObject, memo, useMemo, useState } from "react";
import {
  BarChart3,
  Database,
  FileDown,
  FileJson,
  FileUp,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VirtualizedTableBody } from "@/components/ui/virtualized-table-body";
import type { MixResultadoItem, Produto, Supplier } from "@/types/domain";

import { OptimizationProgress } from "./OptimizationProgress";
import { SupplierRow } from "./SupplierRow";
import { SupplierDetailsSheet } from "./SupplierDetailsSheet";

interface SupplierTableProps {
  resultados: MixResultadoItem[];
  fornecedoresOriginais: Supplier[];
  produtos: Produto[];
  contextProductKey: string;
  formatCurrency: (value: number) => string;
  onAddSupplier: () => void;
  onDuplicate: (supplier: MixResultadoItem) => void;
  onRemove: (id: string) => void;
  onImportCSV: () => void;
  onExportCSV: () => void;
  onImportJSON: () => void;
  onExportJSON: () => void;
  onClear: () => void;
  onToggleChart: () => void;
  onOptimize: () => void;
  getCreditBadge: (creditavel: boolean, credito: number) => JSX.Element;
  onPatchSupplier: (id: string, data: Partial<Supplier>) => void;
  showChart: boolean;
  optimizing: boolean;
  optProgress: number;
  optStatusMessage: string | null;
  containerRef: RefObject<HTMLDivElement>;
}

const SupplierTableComponent = ({
  resultados,
  fornecedoresOriginais,
  produtos,
  contextProductKey,
  formatCurrency,
  onAddSupplier,
  onDuplicate,
  onRemove,
  onImportCSV,
  onExportCSV,
  onImportJSON,
  onExportJSON,
  onClear,
  onToggleChart,
  onOptimize,
  getCreditBadge,
  onPatchSupplier,
  showChart,
  optimizing,
  optProgress,
  optStatusMessage,
  containerRef,
}: SupplierTableProps) => {
  const shouldVirtualize = resultados.length >= 200;
  const [detailsSupplierId, setDetailsSupplierId] = useState<string | null>(null);
  const supplierIndex = useMemo(
    () => new Map(fornecedoresOriginais.map((item) => [item.id, item])),
    [fornecedoresOriginais],
  );
  const detailsSupplier = useMemo(() => {
    if (!detailsSupplierId) {
      return null;
    }
    return fornecedoresOriginais.find((item) => item.id === detailsSupplierId) ?? null;
  }, [detailsSupplierId, fornecedoresOriginais]);

  const renderSupplierRow = (supplier: MixResultadoItem) => {
    const sourceSupplier = supplierIndex.get(supplier.id);
    const hasConditions = !!(
      sourceSupplier?.priceBreaks?.length ||
      sourceSupplier?.freightBreaks?.length ||
      sourceSupplier?.yield
    );
    return (
      <SupplierRow
        key={supplier.id}
        supplier={supplier}
        sourceSupplier={sourceSupplier}
        hasCommercialConditions={hasConditions}
        formatCurrency={formatCurrency}
        getCreditBadge={getCreditBadge}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
        onOpenDetails={() => setDetailsSupplierId(supplier.id)}
      />
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Comparacao de fornecedores</CardTitle>
          <CardDescription>
            Resultados refletem condições comerciais, tributos configurados e otimizacoes recentes.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Button
            variant="outline"
            size="sm"
            data-testid="add-fornecedor"
            onClick={onAddSupplier}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Database className="mr-2 h-4 w-4" />
                Dados
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Importar</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onImportCSV()}>
                <FileUp className="mr-2 h-4 w-4" />
                CSV (planilha)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onImportJSON()}>
                <FileJson className="mr-2 h-4 w-4" />
                JSON (projeto)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Exportar</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => onExportCSV()}>
                <FileDown className="mr-2 h-4 w-4" />
                CSV (planilha)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExportJSON()}>
                <FileJson className="mr-2 h-4 w-4" />
                JSON (projeto)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showChart ? "secondary" : "ghost"}
                size="icon"
                aria-label={
                  showChart
                    ? "Ocultar grafico comparativo"
                    : "Mostrar grafico comparativo"
                }
                onClick={onToggleChart}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {showChart
                  ? "Ocultar grafico comparativo"
                  : "Mostrar grafico comparativo"}
              </p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Limpar cotação atual"
                onClick={onClear}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Limpar fornecedores e restaurar contexto padrao</p>
            </TooltipContent>
          </Tooltip>

          <Button
            variant="default"
            size="sm"
            onClick={onOptimize}
            disabled={optimizing}
            className="shadow-sm"
          >
            {optimizing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {optimizing ? "Calculando..." : "Otimizar mix"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {optimizing && (
          <OptimizationProgress progress={optProgress} message={optStatusMessage} />
        )}

        <div className="rounded-md border">
          <Table
            containerRef={containerRef}
            containerClassName={shouldVirtualize ? "max-h-[600px]" : undefined}
          >
            <TableHeader>
              <TableRow className="whitespace-nowrap">
                <TableHead className="w-16 text-center">#</TableHead>
                <TableHead className="min-w-[260px]">Fornecedor</TableHead>
                <TableHead className="min-w-[220px]">Condições comerciais</TableHead>
                <TableHead className="min-w-[140px] text-right">Preco</TableHead>
                <TableHead className="min-w-[140px] text-right">Frete</TableHead>
                <TableHead className="min-w-[160px] text-center">Tributos</TableHead>
                <TableHead className="min-w-[160px]">Flags</TableHead>
                <TableHead className="min-w-[160px] text-center">Credito</TableHead>
                <TableHead className="min-w-[180px] text-right">Custos</TableHead>
                <TableHead className="min-w-[200px]">Restricoes</TableHead>
                <TableHead className="w-[120px] text-center">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <VirtualizedTableBody
              data={resultados}
              colSpan={11}
              scrollElement={() => containerRef.current}
              estimateSize={() => 88}
              emptyRow={
                <TableRow>
                  <TableCell colSpan={11}>
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
                      <p>Nenhum fornecedor cadastrado para esta cotação.</p>
                      <p className="text-xs">
                        Use Adicionar ou importe um arquivo CSV/JSON para iniciar.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              }
              renderRow={renderSupplierRow}
            />
          </Table>
        </div>
      </CardContent>
      {detailsSupplier ? (
        <SupplierDetailsSheet
          open
          supplier={detailsSupplier}
          produtos={produtos}
          onClose={() => setDetailsSupplierId(null)}
          onUpdate={onPatchSupplier}
        />
      ) : null}
    </Card>
  );
};

export const SupplierTable = memo(SupplierTableComponent);