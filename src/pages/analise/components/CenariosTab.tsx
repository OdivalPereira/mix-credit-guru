
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Calendar } from "lucide-react";
import { scenarioTimeline } from "@/data/scenarios";
import { type MixResultadoItem, type Scenario } from "@/types/domain";

interface CenariosTabProps {
    baseOption: any;
    handleBaseYearChange: (year: string) => void;
    compareOption: any;
    setCompareYear: (year: string) => void;
    getImpactBadge: (impact: Scenario["impact"]) => React.ReactNode;
    hasDados: boolean;
    resumoComparacao: any;
    formatCurrency: (val: number) => string;
    allItemIds: string[];
    baseResultado: { itens: MixResultadoItem[] };
    compareResultado: { itens: MixResultadoItem[] };
    getEffectiveCost: (item: MixResultadoItem) => number;
}

export const CenariosTab = ({
    baseOption,
    handleBaseYearChange,
    compareOption,
    setCompareYear,
    getImpactBadge,
    hasDados,
    resumoComparacao,
    formatCurrency,
    allItemIds,
    baseResultado,
    compareResultado,
    getEffectiveCost
}: CenariosTabProps) => {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Calendar className="mr-2 h-5 w-5" />
                        Configuração dos cenários
                    </CardTitle>
                    <CardDescription>
                        O cenário base é aplicado em Cotação, Relatórios e regras fiscais. Use a comparação para testar alternativas.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cenário base (ativo)</label>
                            <Select value={baseOption.year} onValueChange={handleBaseYearChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {scenarioTimeline.map((option) => (
                                        <SelectItem key={`base-${option.year}`} value={option.year}>
                                            {option.year} - {option.data.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Comparar com</label>
                            <Select value={compareOption.year} onValueChange={setCompareYear}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {scenarioTimeline.map((option) => (
                                        <SelectItem key={`compare-${option.year}`} value={option.year}>
                                            {option.year} - {option.data.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">Ano: {baseOption.year}</Badge>
                        <Badge variant="secondary">{baseOption.data.title}</Badge>
                        {getImpactBadge(baseOption.data.impact)}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">{baseOption.data.title}</CardTitle>
                        {getImpactBadge(baseOption.data.impact)}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">Principais mudanças</h3>
                        <p className="text-muted-foreground">{baseOption.data.changes}</p>
                    </div>
                </CardContent>
            </Card>

            {!hasDados ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Comparar cenários</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        Cadastre fornecedores e execute uma cotação para habilitar o comparador de cenários.
                    </CardContent>
                </Card>
            ) : (
                <>
                    {resumoComparacao && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Resumo financeiro</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Cenário base</p>
                                    <p className="text-2xl font-semibold">
                                        {formatCurrency(resumoComparacao.somaBase)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Cenário comparado</p>
                                    <p className="text-2xl font-semibold">
                                        {formatCurrency(resumoComparacao.somaComparado)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Variação</p>
                                    <p
                                        className={`text-2xl font-semibold ${resumoComparacao.variacao >= 0 ? "text-destructive" : "text-success"
                                            }`}
                                    >
                                        {formatCurrency(resumoComparacao.variacao)}
                                    </p>
                                    <Badge
                                        variant={resumoComparacao.percentual >= 0 ? "destructive" : "success"}
                                        className="mt-2"
                                    >
                                        {resumoComparacao.percentual >= 0 ? "+" : ""}
                                        {resumoComparacao.percentual.toFixed(2)}%
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Resumo por item</CardTitle>
                            <CardDescription>
                                Custos consideram contratos, conversões e rendimentos globais ou específicos por produto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item</TableHead>
                                        <TableHead className="text-right">{baseOption.data.title}</TableHead>
                                        <TableHead className="text-right">{compareOption.data.title}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {allItemIds.map((itemId) => {
                                        const baseItem = baseResultado.itens.find((item) => item.id === itemId);
                                        const compareItem = compareResultado.itens.find((item) => item.id === itemId);
                                        const descricao = baseItem?.nome ?? compareItem?.nome ?? itemId;
                                        return (
                                            <TableRow key={`row-${itemId}`}>
                                                <TableCell>{descricao}</TableCell>
                                                <TableCell className="text-right">
                                                    {baseItem ? formatCurrency(getEffectiveCost(baseItem)) : "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {compareItem ? formatCurrency(getEffectiveCost(compareItem)) : "-"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};
