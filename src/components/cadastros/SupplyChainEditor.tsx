import { ArrowRight, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  SUPPLIER_TIPO_OPTIONS,
  SUPPLIER_TIPO_LABELS,
  DEFAULT_CHAIN_BY_TIPO,
} from "@/data/lookups";
import type { SupplierTipo } from "@/types/domain";

const EMPTY_VALUE = "__empty__";

interface SupplyChainEditorProps {
  cadeia: string[];
  supplierTipo: SupplierTipo;
  onChange: (cadeia: string[]) => void;
  stagesCount?: number;
}

export const SupplyChainEditor = ({
  cadeia,
  supplierTipo,
  onChange,
  stagesCount = 4,
}: SupplyChainEditorProps) => {
  const stages = Array.from({ length: stagesCount }, (_, i) => cadeia[i] ?? "");
  const filledStages = stages.filter((s) => s.length > 0);
  const supplierLabel = SUPPLIER_TIPO_LABELS[supplierTipo];

  const handleStageChange = (index: number, value: string) => {
    const newCadeia = [...stages];
    newCadeia[index] = value === EMPTY_VALUE ? "" : value;
    onChange(newCadeia);
  };

  const handleSuggestChain = () => {
    const suggestedChain = DEFAULT_CHAIN_BY_TIPO[supplierTipo] ?? [];
    const newCadeia = Array.from({ length: stagesCount }, (_, i) => suggestedChain[i] ?? "");
    onChange(newCadeia);
  };

  const hasSuggestion = (DEFAULT_CHAIN_BY_TIPO[supplierTipo] ?? []).length > 0;

  return (
    <div className="space-y-4">
      {/* Visual flow preview */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/30 p-3">
        {filledStages.length > 0 ? (
          <>
            {filledStages.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-medium">
                  {stage}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            ))}
          </>
        ) : null}
        <Badge variant="default" className="text-xs font-semibold">
          {supplierLabel}
        </Badge>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <Badge variant="secondary" className="text-xs">
          Você
        </Badge>
      </div>

      {/* Auto-suggest button */}
      {hasSuggestion && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSuggestChain}
          className="gap-2"
        >
          <Sparkles className="h-3 w-3" />
          Sugerir cadeia típica para {supplierLabel}
        </Button>
      )}

      {/* Stage selectors */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Etapas anteriores ao fornecedor (opcional):
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {stages.map((value, index) => {
            const stageNumber = index + 1;
            const hasValue = value.length > 0;

            return (
              <div key={index} className="relative">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      hasValue
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {stageNumber}
                  </div>
                  <Select
                    value={hasValue ? value : EMPTY_VALUE}
                    onValueChange={(newValue) => handleStageChange(index, newValue)}
                  >
                    <SelectTrigger
                      className={cn(
                        "flex-1",
                        !hasValue && "text-muted-foreground"
                      )}
                    >
                      <SelectValue placeholder={`Etapa ${stageNumber}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EMPTY_VALUE}>
                        <span className="text-muted-foreground">Não configurada</span>
                      </SelectItem>
                      {SUPPLIER_TIPO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.label}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            {option.description && (
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasValue && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleStageChange(index, "")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
