import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionAlert } from "@/components/shared/SectionAlert";
import { CompletionBadge } from "@/components/shared/CompletionBadge";
import { GlossaryTerm, glossaryTerms } from "@/components/shared/GlossaryTerm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trophy,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Info,
} from "lucide-react";
import type { MixResultadoItem, Supplier } from "@/types/domain";
import { ScenarioComparisonModal } from "@/components/ScenarioComparisonView";

interface WizardStepResultsProps {
  resultados: MixResultadoItem[];
  fornecedores: Supplier[];
  onOptimize: () => void;
  onBack: () => void;
  optimizing: boolean;
  optProgress: number;
}

export function WizardStepResults({
  resultados,
  fornecedores,
  onOptimize,
  onBack,
  optimizing,
  optProgress,
}: WizardStepResultsProps) {
  const hasResults = resultados.length > 0;

  const analysis = useMemo(() => {
    if (!hasResults) {
      return {
        bestSupplier: null,
        worstSupplier: null,
        avgCost: 0,
        costSpread: 0,
        creditableCount: 0,
        alertCount: 0,
      };
    }

    const sorted = [...resultados].sort(
      (a, b) => a.custoEfetivo - b.custoEfetivo
    );
    const bestSupplier = sorted[0];
    const worstSupplier = sorted[sorted.length - 1];
    const avgCost =
      resultados.reduce((sum, r) => sum + r.custoEfetivo, 0) /
      resultados.length;
    const costSpread = worstSupplier.custoEfetivo - bestSupplier.custoEfetivo;
    const creditableCount = resultados.filter((r) => r.creditavel).length;
    const alertCount = resultados.filter(
      (r) => r.restricoes && r.restricoes.length > 0
    ).length;

    return {
      bestSupplier,
      worstSupplier,
      avgCost,
      costSpread,
      creditableCount,
      alertCount,
    };
  }, [resultados, hasResults]);

  const savingsBreakdown = useMemo(() => {
    if (!analysis.bestSupplier || !analysis.worstSupplier) return null;
    const best = analysis.bestSupplier;
    const worst = analysis.worstSupplier;

    const freightSave = worst.frete - best.frete;
    const priceSave = worst.preco - best.preco;
    const creditGain = best.credito - worst.credito;

    return { freightSave, priceSave, creditGain };
  }, [analysis]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Resultados da cotação</h3>
          {hasResults && (
            <CompletionBadge
              completed={resultados.length}
              total={fornecedores.length}
              variant="compact"
            />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Análise dos{" "}
          <GlossaryTerm {...glossaryTerms.custoEfetivo}>
            custos efetivos
          </GlossaryTerm>{" "}
          calculados para cada fornecedor, considerando impostos e{" "}
          <GlossaryTerm {...glossaryTerms.creditoTributario}>
            créditos tributários
          </GlossaryTerm>
          .
        </p>
      </div>

      {!hasResults && (
        <SectionAlert
          type="info"
          title="Aguardando cálculo"
          description="Volte ao passo anterior e verifique se todos os dados estão corretos."
        />
      )}

      {hasResults && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Melhor custo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analysis.bestSupplier?.custoEfetivo || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.bestSupplier?.nome}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Variação de custos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(analysis.costSpread)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Entre melhor e pior
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Fornecedores com crédito</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {analysis.creditableCount} de {resultados.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(
                        (analysis.creditableCount / resultados.length) * 100
                      )}
                      % do total
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Savings Breakdown */}
          {savingsBreakdown && (
            <Card className="bg-emerald-50/50 border-emerald-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Entenda sua economia
                </CardTitle>
                <CardDescription>
                  Você economizou <span className="font-bold text-emerald-700">{formatCurrency(analysis.costSpread)}</span> escolhendo o melhor fornecedor. Veja como:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center divide-x divide-emerald-200/50">
                  <div className="px-2">
                    <div className={`text-sm font-bold ${savingsBreakdown.priceSave >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatCurrency(savingsBreakdown.priceSave)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">no Preço do Produto</div>
                  </div>
                  <div className="px-2">
                    <div className={`text-sm font-bold ${savingsBreakdown.freightSave >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatCurrency(savingsBreakdown.freightSave)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">no Frete</div>
                  </div>
                  <div className="px-2">
                    <div className={`text-sm font-bold ${savingsBreakdown.creditGain >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {formatCurrency(savingsBreakdown.creditGain)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">em Créditos Tributários</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Opportunity Alerts */}
          <SectionAlert
            type="info"
            title="Oportunidade de Planejamento"
            description="Se sua empresa estivesse no Lucro Real, você poderia aproveitar R$ 1.250,00 adicionais em créditos de PIS/COFINS nesta compra."
          />

          {/* Alerts */}
          {analysis.alertCount > 0 && (
            <SectionAlert
              type="warning"
              title={`${analysis.alertCount} fornecedor(es) com restrições`}
              description="Revise as informações antes de finalizar. Verifique limites contratuais e configurações tributárias."
            />
          )}

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Ranking de fornecedores
              </CardTitle>
              <CardDescription>
                Ordenados por custo efetivo (menor para maior)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...resultados]
                  .sort((a, b) => a.custoEfetivo - b.custoEfetivo)
                  .map((resultado, index) => (
                    <div
                      key={resultado.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${index === 0
                        ? "border-yellow-300 bg-yellow-50/50"
                        : "bg-card"
                        }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{resultado.nome}</span>
                          {resultado.creditavel ? (
                            <Badge variant="creditYes" className="text-xs">
                              Creditável
                            </Badge>
                          ) : (
                            <Badge variant="creditNo" className="text-xs">
                              Não creditável
                            </Badge>
                          )}
                          {resultado.restricoes &&
                            resultado.restricoes.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {resultado.restricoes.length} alerta(s)
                              </Badge>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <span>
                            Preço: {formatCurrency(resultado.preco)} | Frete:{" "}
                            {formatCurrency(resultado.frete)}
                          </span>
                          {resultado.credito > 0 && (
                            <span className="text-green-600">
                              {" "}
                              | Crédito: {formatCurrency(resultado.credito)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(resultado.custoEfetivo)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Custo efetivo
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Optimization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Otimização avançada
              </CardTitle>
              <CardDescription>
                Execute algoritmos de otimização para encontrar a melhor
                combinação de fornecedores respeitando restrições contratuais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {optimizing && (
                <div className="space-y-2">
                  <Progress value={optProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Otimizando... {Math.round(optProgress)}%
                  </p>
                </div>
              )}
              <Button
                onClick={onOptimize}
                disabled={optimizing}
                size="lg"
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {optimizing ? "Otimizando..." : "Executar Otimização"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <div className="flex gap-2">
          <ScenarioComparisonModal />
          <Button variant="outline" disabled={!hasResults}>
            Exportar Relatório
          </Button>
        </div>
      </div>
    </div>
  );
}
