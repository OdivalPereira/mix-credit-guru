import { RefObject, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VirtualizedTableBody } from "@/components/ui/virtualized-table-body";
import {
  Download,
  Plus,
  Upload,
  BarChartHorizontal,
  Loader2,
} from "lucide-react";
import { SupplierRow } from "./SupplierRow";
import { OptimizationProgress } from "./OptimizationProgress";
import type { MixResultadoItem, Supplier } from "@/types/domain";

interface SupplierTableProps {
  resultados: MixResultadoItem[];
  formatCurrency: (value: number) => string;
  onAddSupplier: () => void;
  onFieldChange: (id: string, field: keyof Supplier, value: string) => void;
  onFlagChange: (id: string, flag: "cesta" | "reducao" | "refeicao", value: boolean) => void;
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
  showChart: boolean;
  optimizing: boolean;
  optProgress: number;
  optStatusMessage: string | null;
  containerRef: RefObject<HTMLDivElement>;
}

const SupplierTableComponent = ({
  resultados,
  formatCurrency,
  onAddSupplier,
  onFieldChange,
  onFlagChange,
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
  showChart,
  optimizing,
  optProgress,
  optStatusMessage,
  containerRef,
}: SupplierTableProps) => {
  const shouldVirtualize = resultados.length >= 200;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Comparação de Fornecedores</CardTitle>
          <CardDescription>
            Análise de custos efetivos considerando tributação e créditos
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            data-testid="add-fornecedor"
            onClick={onAddSupplier}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
          <Button variant="outline" size="sm" onClick={onImportCSV}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onImportJSON}>
            <Upload className="mr-2 h-4 w-4" />
            Importar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={onExportJSON}>
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          <Button variant="outline" size="sm" onClick={onClear}>
            Limpar
          </Button>
          <Button variant="outline" size="sm" onClick={onToggleChart}>
            <BarChartHorizontal className="mr-2 h-4 w-4" />
            {showChart ? "Ocultar" : "Gráfico"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOptimize}
            disabled={optimizing}
          >
            {optimizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Otimizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {optimizing && (
          <OptimizationProgress 
            progress={optProgress} 
            message={optStatusMessage} 
          />
        )}
        <div className="rounded-md border">
          <Table
            containerRef={containerRef}
            containerClassName={shouldVirtualize ? "max-h-[600px]" : undefined}
          >
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Regime</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">IBS%</TableHead>
                <TableHead className="text-right">CBS%</TableHead>
                <TableHead className="text-right">IS%</TableHead>
                <TableHead className="text-right">Frete</TableHead>
                <TableHead>Cesta</TableHead>
                <TableHead>Redução</TableHead>
                <TableHead>Refeição</TableHead>
                <TableHead>Creditável</TableHead>
                <TableHead className="text-right">Crédito</TableHead>
                <TableHead className="text-right font-bold">Custo Efetivo</TableHead>
                <TableHead className="text-right">Custo Normalizado</TableHead>
                <TableHead>Degrau</TableHead>
                <TableHead>Restrições</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <VirtualizedTableBody
              data={resultados}
              colSpan={19}
              scrollElement={() => containerRef.current}
              estimateSize={() => 72}
              renderRow={(supplier) => (
                <SupplierRow
                  key={supplier.id}
                  supplier={supplier}
                  formatCurrency={formatCurrency}
                  onFieldChange={onFieldChange}
                  onFlagChange={onFlagChange}
                  onDuplicate={onDuplicate}
                  onRemove={onRemove}
                  getCreditBadge={getCreditBadge}
                />
              )}
            />
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export const SupplierTable = memo(SupplierTableComponent);
