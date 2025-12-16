import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Plus,
  Search,
  Trash2,
  Edit,
} from "lucide-react";
import { SectionAlert } from "@/components/shared/SectionAlert";
import { CompletionBadge } from "@/components/shared/CompletionBadge";
import { GlossaryTerm, glossaryTerms } from "@/components/shared/GlossaryTerm";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Supplier } from "@/types/domain";

interface WizardStepSuppliersProps {
  fornecedores: Supplier[];
  onAddSupplier: () => void;
  onPatchSupplier: (id: string, patch: Partial<Supplier>) => void;
  onRemoveSupplier: (id: string) => void;
  onNext: () => void;
  onBack: () => void;
  isCalculating: boolean;
}

export function WizardStepSuppliers({
  fornecedores,
  onAddSupplier,
  onPatchSupplier,
  onRemoveSupplier,
  onNext,
  onBack,
  isCalculating,
}: WizardStepSuppliersProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredFornecedores = useMemo(() => {
    if (!searchTerm) return fornecedores;
    const term = searchTerm.toLowerCase();
    return fornecedores.filter((f) => f.nome.toLowerCase().includes(term));
  }, [fornecedores, searchTerm]);

  const hasFornecedores = fornecedores.length > 0;

  const handleQuickEdit = (supplier: Supplier, field: keyof Supplier) => {
    setEditingId(supplier.id);
    toast({
      title: "Edição rápida",
      description: `Clique no fornecedor ${supplier.nome} para editar ${field}`,
    });
  };

  const handleRemove = (id: string) => {
    onRemoveSupplier(id);
    toast({
      title: "Fornecedor removido",
      description: "O fornecedor foi removido da cotação",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Fornecedores da cotação</h3>
          <CompletionBadge
            completed={fornecedores.length}
            total={fornecedores.length + 1}
            variant="compact"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione e configure os fornecedores que participarão desta cotação.
          Você pode editar preços, frete,{" "}
          <GlossaryTerm {...glossaryTerms.ibs}>IBS</GlossaryTerm> e{" "}
          <GlossaryTerm {...glossaryTerms.cbs}>CBS</GlossaryTerm>.
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fornecedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={onAddSupplier} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Fornecedor
        </Button>
      </div>

      {/* Suppliers List */}
      {hasFornecedores ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Fornecedores selecionados ({filteredFornecedores.length})
            </CardTitle>
            <CardDescription>
              Configure preços, frete e informações tributárias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {filteredFornecedores.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{supplier.nome}</span>
                        <Badge variant="outline" className="text-xs">
                          {supplier.tipo}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {supplier.regime}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Preço:</span>
                          <span className="ml-2 font-medium">
                            R$ {supplier.preco.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Frete:</span>
                          <span className="ml-2 font-medium">
                            R$ {supplier.frete.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">IBS:</span>
                          <span className="ml-2 font-medium">
                            {supplier.ibs}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CBS:</span>
                          <span className="ml-2 font-medium">
                            {supplier.cbs}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleQuickEdit(supplier, "preco")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <SectionAlert
          type="info"
          title="Nenhum fornecedor adicionado"
          description='Clique em "Adicionar Fornecedor" para começar a configurar sua cotação.'
        />
      )}

      {/* Status Alert */}
      {hasFornecedores && (
        <SectionAlert
          type="success"
          title={`${fornecedores.length} fornecedor(es) configurado(s)`}
          description="Você pode avançar para ver os resultados calculados."
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!hasFornecedores || isCalculating} size="lg">
          {isCalculating ? (
            <>
              Calculando...
              {/* Add spinner here if desired, or relying on text context */}
            </>
          ) : (
            <>
              Calcular e Ver Resultados
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
