import { useState } from "react";
import { Plus, Trash2, ChevronDown, TrendingDown, Truck, Percent } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PriceBreak, FreightBreak, YieldConfig, Unit } from "@/types/domain";
import { UNIT_OPTIONS, UNIT_LABELS } from "@/data/lookups";

interface CommercialConditionsSectionProps {
  priceBreaks?: PriceBreak[];
  freightBreaks?: FreightBreak[];
  yieldConfig?: YieldConfig;
  onPriceBreaksChange: (breaks: PriceBreak[]) => void;
  onFreightBreaksChange: (breaks: FreightBreak[]) => void;
  onYieldChange: (config: YieldConfig | undefined) => void;
}

export const CommercialConditionsSection = ({
  priceBreaks = [],
  freightBreaks = [],
  yieldConfig,
  onPriceBreaksChange,
  onFreightBreaksChange,
  onYieldChange,
}: CommercialConditionsSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasConditions = priceBreaks.length > 0 || freightBreaks.length > 0 || yieldConfig;

  const handleAddPriceBreak = () => {
    onPriceBreaksChange([...priceBreaks, { quantidade: 0, preco: 0 }]);
  };

  const handleRemovePriceBreak = (index: number) => {
    onPriceBreaksChange(priceBreaks.filter((_, i) => i !== index));
  };

  const handlePriceBreakChange = (index: number, field: keyof PriceBreak, value: number) => {
    const updated = priceBreaks.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onPriceBreaksChange(updated);
  };

  const handleAddFreightBreak = () => {
    onFreightBreaksChange([...freightBreaks, { quantidade: 0, frete: 0 }]);
  };

  const handleRemoveFreightBreak = (index: number) => {
    onFreightBreaksChange(freightBreaks.filter((_, i) => i !== index));
  };

  const handleFreightBreakChange = (index: number, field: keyof FreightBreak, value: number) => {
    const updated = freightBreaks.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onFreightBreaksChange(updated);
  };

  const handleYieldChange = (field: keyof YieldConfig, value: string | number) => {
    const current = yieldConfig ?? { entrada: "kg" as Unit, saida: "kg" as Unit, rendimento: 100 };
    onYieldChange({ ...current, [field]: value });
  };

  const handleRemoveYield = () => {
    onYieldChange(undefined);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between px-0 hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-muted-foreground cursor-pointer">
              Condições comerciais
            </Label>
            {hasConditions && (
              <Badge variant="secondary" className="text-xs">
                {[
                  priceBreaks.length > 0 && `${priceBreaks.length} degraus`,
                  freightBreaks.length > 0 && `${freightBreaks.length} faixas frete`,
                  yieldConfig && "yield",
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Badge>
            )}
          </div>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 pt-3">
        {/* Price Breaks */}
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Degraus de preço</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddPriceBreak}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>

            {priceBreaks.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum degrau de preço configurado.
              </p>
            ) : (
              <div className="space-y-2">
                {priceBreaks.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">A partir de (qtd)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.quantidade}
                          onChange={(e) =>
                            handlePriceBreakChange(index, "quantidade", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Preço (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.preco}
                          onChange={(e) =>
                            handlePriceBreakChange(index, "preco", Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive mt-5"
                      onClick={() => handleRemovePriceBreak(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Freight Breaks */}
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Faixas de frete</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddFreightBreak}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>

            {freightBreaks.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma faixa de frete configurada.
              </p>
            ) : (
              <div className="space-y-2">
                {freightBreaks.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">A partir de (qtd)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.quantidade}
                          onChange={(e) =>
                            handleFreightBreakChange(index, "quantidade", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Frete (R$)</Label>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.frete}
                          onChange={(e) =>
                            handleFreightBreakChange(index, "frete", Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive mt-5"
                      onClick={() => handleRemoveFreightBreak(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Yield Config */}
        <Card className="border-dashed">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Configuração de rendimento</span>
              </div>
              {!yieldConfig ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onYieldChange({ entrada: "kg", saida: "kg", rendimento: 100 })
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Configurar
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={handleRemoveYield}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {!yieldConfig ? (
              <p className="text-xs text-muted-foreground">
                Nenhuma configuração de rendimento.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Unidade entrada</Label>
                  <Select
                    value={yieldConfig.entrada}
                    onValueChange={(value) => handleYieldChange("entrada", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {UNIT_LABELS[unit]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unidade saída</Label>
                  <Select
                    value={yieldConfig.saida}
                    onValueChange={(value) => handleYieldChange("saida", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {UNIT_LABELS[unit]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rendimento (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={yieldConfig.rendimento}
                    onChange={(e) =>
                      handleYieldChange("rendimento", Number(e.target.value))
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};
