import React, { useMemo } from 'react';
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Minus, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";

export function ScenarioComparisonView() {
    const computeResultado = useCotacaoStore(state => state.computeResultado);

    // We compare Current (2026) vs Future (2033)
    // Assuming '2026' and '2033' are the scenario keys used in the app logic
    const currentScenario = useMemo(() => computeResultado('2026'), [computeResultado]);
    const futureScenario = useMemo(() => computeResultado('2033'), [computeResultado]);

    const getTotalCost = (resultado: any) => {
        if (!resultado.itens.length) return 0;
        const sorted = [...resultado.itens].sort((a: any, b: any) => a.custoEfetivo - b.custoEfetivo);
        return sorted[0]?.custoEfetivo || 0;
    };

    const getBestSupplierName = (resultado: any) => {
        if (!resultado.itens.length) return "-";
        const sorted = [...resultado.itens].sort((a: any, b: any) => a.custoEfetivo - b.custoEfetivo);
        return sorted[0]?.nome || "-";
    };

    const currentCost = getTotalCost(currentScenario);
    const futureCost = getTotalCost(futureScenario);
    const delta = futureCost - currentCost;
    const percentChange = currentCost > 0 ? (delta / currentCost) * 100 : 0;

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Current */}
                <Card className="border-blue-200 bg-blue-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Cenário Atual (2026)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-900">
                            {formatCurrency(currentCost)}
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                            Melhor: {getBestSupplierName(currentScenario)}
                        </div>
                    </CardContent>
                </Card>

                {/* Delta */}
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${delta < 0 ? 'bg-green-100 text-green-600' : delta > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                        {delta < 0 ? <TrendingDown className="h-6 w-6" /> : delta > 0 ? <TrendingUp className="h-6 w-6" /> : <Minus className="h-6 w-6" />}
                    </div>
                    <div className="text-center">
                        <div className={`text-lg font-bold ${delta < 0 ? 'text-green-600' : delta > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {delta > 0 ? '+' : ''}{formatCurrency(delta)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {percentChange.toFixed(1)}% de impacto
                        </div>
                    </div>
                </div>

                {/* Future */}
                <Card className="border-purple-200 bg-purple-50/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Reforma Total (2033)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-900">
                            {formatCurrency(futureCost)}
                        </div>
                        <div className="text-xs text-purple-700 mt-1">
                            Melhor: {getBestSupplierName(futureScenario)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                <p>
                    <strong>Nota:</strong> A simulação de 2033 considera a implementação total do IBS/CBS e a extinção do PIS/COFINS/ICMS/ISS.
                    Os valores podem variar dependendo da regulamentação final da Lei Complementar.
                </p>
            </div>
        </div>
    );
}

export function ScenarioComparisonModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Scale className="h-4 w-4" />
                    Comparar Cenários
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Comparativo de Cenários Tributários</DialogTitle>
                    <DialogDescription>
                        Analise o impacto da Reforma Tributária nas suas cotações atuais (2026 vs 2033).
                    </DialogDescription>
                </DialogHeader>
                <ScenarioComparisonView />
            </DialogContent>
        </Dialog>
    );
}
