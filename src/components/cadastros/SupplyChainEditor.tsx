import { ArrowRight, X } from "lucide-react";
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

const EMPTY_VALUE = "__empty__";

// Predefined supply chain stage options
export const SUPPLY_CHAIN_OPTIONS = [
  { value: "Produtor", label: "Produtor", description: "Origem primária" },
  { value: "Industria", label: "Indústria", description: "Transformação" },
  { value: "Processador", label: "Processador", description: "Beneficiamento" },
  { value: "Importador", label: "Importador", description: "Entrada no país" },
  { value: "Atacado", label: "Atacado", description: "Distribuição em larga escala" },
  { value: "Distribuidor", label: "Distribuidor", description: "Logística regional" },
  { value: "Varejo", label: "Varejo", description: "Venda ao consumidor" },
  { value: "Cooperativa", label: "Cooperativa", description: "Associação de produtores" },
] as const;

interface SupplyChainEditorProps {
  cadeia: string[];
  onChange: (index: number, value: string) => void;
  stagesCount?: number;
}

export const SupplyChainEditor = ({
  cadeia,
  onChange,
  stagesCount = 4,
}: SupplyChainEditorProps) => {
  const stages = Array.from({ length: stagesCount }, (_, i) => cadeia[i] ?? "");
  const filledStages = stages.filter((s) => s.length > 0);

  return (
    <div className="space-y-4">
      {/* Visual flow preview */}
      {filledStages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed bg-muted/30 p-3">
          {filledStages.map((stage, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {idx + 1}. {stage}
              </Badge>
              {idx < filledStages.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stage selectors */}
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
                  onValueChange={(newValue) =>
                    onChange(index, newValue === EMPTY_VALUE ? "" : newValue)
                  }
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
                    {SUPPLY_CHAIN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
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
                    onClick={() => onChange(index, "")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filledStages.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Selecione as etapas para mapear a cadeia de fornecimento deste fornecedor.
        </p>
      )}
    </div>
  );
};
