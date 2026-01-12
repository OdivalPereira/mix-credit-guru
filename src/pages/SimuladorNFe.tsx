import { useState, useMemo } from 'react';
import { parseNFeXML, NFeProduto } from '@/lib/parsers/nfe-parser';
import {
    calcularImpostosItem,
    calcularTotaisRegime,
    TaxResultItem,
    RegimeTributario,
    ClassificacaoProduto,
    SIMPLES_ALIQUOTAS
} from '@/lib/strategies/tax-2033-item';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Upload, Loader2, FileText, Calculator, Sparkles, TrendingUp, Receipt, Info, Trash2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ItemAnalise extends TaxResultItem {
    status: 'pendente' | 'analisado';
}

const FAIXAS_FATURAMENTO = [
    { label: 'Até R$ 180.000', value: 180000 },
    { label: 'Até R$ 360.000', value: 360000 },
    { label: 'Até R$ 720.000', value: 720000 },
    { label: 'Até R$ 1.800.000', value: 1800000 },
    { label: 'Até R$ 3.600.000', value: 3600000 },
    { label: 'Até R$ 4.800.000', value: 4800000 },
];

const REGIMES_OPTIONS: { label: string; value: RegimeTributario; description: string }[] = [
    { label: 'Simples Nacional', value: 'simples', description: 'Guia única (DAS)' },
    { label: 'Lucro Presumido', value: 'presumido', description: 'PIS/COFINS cumulativo' },
    { label: 'Lucro Real', value: 'real', description: 'PIS/COFINS não-cumulativo' },
    { label: 'Reforma 2033', value: 'reforma2033', description: 'IBS + CBS' },
];

export default function SimuladorNFe() {
    const [itens, setItens] = useState<ItemAnalise[]>([]);
    const [loading, setLoading] = useState(false);
    const [regimeSelecionado, setRegimeSelecionado] = useState<RegimeTributario>('simples');
    const [faturamentoAnual, setFaturamentoAnual] = useState<number>(360000);
    const [anexoSimples, setAnexoSimples] = useState<keyof typeof SIMPLES_ALIQUOTAS>('I');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const result = parseNFeXML(text);

            if (!result.success || !result.data) {
                toast.error('Erro ao ler XML: ' + result.error);
                return;
            }

            // Mapeia produtos usando o parser existente
            const novosItens: ItemAnalise[] = result.data.produtos.map((prod: NFeProduto) => {
                const valorTotal = prod.vUnCom * prod.qCom;
                const itemCalculado = calcularImpostosItem(
                    prod.cProd,
                    prod.xProd,
                    prod.NCM,
                    valorTotal,
                    faturamentoAnual,
                    undefined, // Classificação será preenchida pela IA
                    false
                );

                return {
                    ...itemCalculado,
                    status: 'pendente' as const
                };
            });

            setItens(novosItens);
            toast.success(`${novosItens.length} produtos extraídos com sucesso!`);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao processar arquivo');
        }
    };

    const handleAnaliseIA = async () => {
        if (itens.length === 0) return;
        setLoading(true);

        try {
            // Prepara payload reduzido
            const payloadProdutos = itens.map(i => ({
                id: i.id,
                descricao: i.descricao,
                ncm: i.ncm
            }));

            // Chama a Edge Function
            const { data, error } = await supabase.functions.invoke('tax-classifier', {
                body: { produtos: payloadProdutos, regrasExternas: [] }
            });

            if (error) throw error;

            if (!data.success) {
                throw new Error(data.error || 'Erro na classificação');
            }

            // Atualiza itens com classificação e recalcula
            setItens(prev => prev.map(item => {
                const classificacaoIA = data.data.find((d: { id: string; classificacao: ClassificacaoProduto; motivo: string }) => d.id === item.id);
                if (classificacaoIA) {
                    const classificacao: ClassificacaoProduto = classificacaoIA.classificacao;
                    const itemRecalculado = calcularImpostosItem(
                        item.id,
                        item.descricao,
                        item.ncm,
                        item.valorProduto,
                        faturamentoAnual,
                        classificacao,
                        false
                    );
                    return {
                        ...itemRecalculado,
                        status: 'analisado' as const
                    };
                }
                return { ...item, status: 'analisado' as const };
            }));

            toast.success('Classificação tributária concluída!');

        } catch (error) {
            console.error(error);
            toast.error('Erro na análise com IA: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setItens([]);
        toast.info('Simulador limpo');
    };

    // Recalcular quando mudar regime/faturamento/anexo
    const itensRecalculados = useMemo(() => {
        return itens.map(item => {
            // Atualizar o anexo sugerido se estiver no Simples
            const classificacaoAjustada = item.classificacao
                ? { ...item.classificacao, anexo_simples_sugerido: anexoSimples }
                : { setor: 'comercio', cesta_basica: false, reducao_reforma: 0, icms_substituicao: false, anexo_simples_sugerido: anexoSimples };

            return {
                ...calcularImpostosItem(
                    item.id,
                    item.descricao,
                    item.ncm,
                    item.valorProduto,
                    faturamentoAnual,
                    classificacaoAjustada,
                    false
                ),
                status: item.status,
                classificacao: item.classificacao
            };
        });
    }, [itens, faturamentoAnual, anexoSimples]);

    const totais = useMemo(() =>
        calcularTotaisRegime(itensRecalculados, regimeSelecionado),
        [itensRecalculados, regimeSelecionado]
    );

    const getImpostoItem = (item: ItemAnalise): number => {
        const itemCalc = itensRecalculados.find(i => i.id === item.id);
        if (!itemCalc) return 0;

        switch (regimeSelecionado) {
            case 'simples': return itemCalc.regimes.simples.imposto;
            case 'presumido': return itemCalc.regimes.presumido.imposto;
            case 'real': return itemCalc.regimes.real.imposto;
            case 'reforma2033': return itemCalc.regimes.reforma2033.imposto;
            default: return 0;
        }
    };

    const getAliquotaItem = (item: ItemAnalise): string => {
        const itemCalc = itensRecalculados.find(i => i.id === item.id);
        if (!itemCalc) return '-';

        switch (regimeSelecionado) {
            case 'simples':
                return `${(itemCalc.regimes.simples.aliquotaEfetiva * 100).toFixed(2)}%`;
            case 'presumido':
                return `${((itemCalc.regimes.presumido.aliquotaPisCofins + itemCalc.regimes.presumido.aliquotaIcmsIss) * 100).toFixed(2)}%`;
            case 'real':
                return `${((itemCalc.regimes.real.aliquotaPisCofins + itemCalc.regimes.real.aliquotaIcmsIss) * 100).toFixed(2)}%`;
            case 'reforma2033':
                return `${(itemCalc.regimes.reforma2033.aliquotaEfetiva * 100).toFixed(2)}%`;
            default: return '-';
        }
    };

    const getClassificacaoBadge = (item: ItemAnalise) => {
        if (item.status !== 'analisado' || !item.classificacao) return <span className="text-muted-foreground">-</span>;

        if (regimeSelecionado === 'reforma2033') {
            const itemCalc = itensRecalculados.find(i => i.id === item.id);
            const classificacao = itemCalc?.regimes.reforma2033.classificacao || 'Padrão';
            const variant = classificacao.includes('Isento') ? 'outline'
                : classificacao.includes('Reduzida') ? 'secondary'
                    : 'default';
            return <Badge variant={variant}>{classificacao}</Badge>;
        }

        if (regimeSelecionado === 'simples') {
            const itemCalc = itensRecalculados.find(i => i.id === item.id);
            return <Badge variant="secondary">{itemCalc?.regimes.simples.anexo}</Badge>;
        }

        return <Badge variant="outline">{item.classificacao.setor}</Badge>;
    };

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Simulador NFe 2033
                        </h1>
                        <Badge variant="outline" className="text-xs">Beta</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Analise o impacto tributário de cada item da NF-e em diferentes regimes
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {itens.length > 0 && (
                        <Button variant="outline" onClick={handleClear} className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50">
                            <Trash2 className="h-4 w-4" />
                            Limpar
                        </Button>
                    )}
                    <div className="relative">
                        <input
                            type="file"
                            accept=".xml"
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            id="xml-upload"
                        />
                        <Button variant="outline" className="gap-2">
                            <Upload className="h-4 w-4" /> Importar XML
                        </Button>
                    </div>
                    <Button
                        onClick={handleAnaliseIA}
                        disabled={itens.length === 0 || loading}
                        className="gap-2"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        Classificar com IA
                    </Button>
                </div>
            </div>

            {/* Configurações */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Regime Tributário
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={regimeSelecionado} onValueChange={(v) => setRegimeSelecionado(v as RegimeTributario)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {REGIMES_OPTIONS.map(regime => (
                                    <SelectItem key={regime.value} value={regime.value}>
                                        <div className="flex flex-col">
                                            <span>{regime.label}</span>
                                            <span className="text-xs text-muted-foreground">{regime.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {regimeSelecionado === 'simples' && (
                    <>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    Faturamento Anual
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={String(faturamentoAnual)} onValueChange={(v) => setFaturamentoAnual(Number(v))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FAIXAS_FATURAMENTO.map(faixa => (
                                            <SelectItem key={faixa.value} value={String(faixa.value)}>
                                                {faixa.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Anexo Simples
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={anexoSimples} onValueChange={(v) => setAnexoSimples(v as keyof typeof SIMPLES_ALIQUOTAS)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SIMPLES_ALIQUOTAS).map(([anexo, data]) => (
                                            <SelectItem key={anexo} value={anexo}>
                                                Anexo {anexo} - {data.descricao}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Cards de Resumo */}
            {itens.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                Valor Total dos Produtos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                R$ {totais.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/30 border-red-200 dark:border-red-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                                Imposto Estimado ({REGIMES_OPTIONS.find(r => r.value === regimeSelecionado)?.label})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                                R$ {totais.impostoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                Carga Tributária Média
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {totais.cargaEfetiva.toFixed(2)}%
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tabela de Itens */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Produtos da NFe</CardTitle>
                            <CardDescription>
                                {itens.length > 0
                                    ? `${itens.length} itens • ${itens.filter(i => i.status === 'analisado').length} classificados`
                                    : 'Importe um XML para começar'
                                }
                            </CardDescription>
                        </div>
                        {itens.some(i => i.status === 'analisado') && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Info className="h-3 w-3" />
                                Classificação via IA
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="min-w-[200px]">Produto</TableHead>
                                    <TableHead className="w-[100px]">NCM</TableHead>
                                    <TableHead className="text-right w-[120px]">Valor</TableHead>
                                    <TableHead className="w-[150px]">
                                        <div className="flex items-center gap-1">
                                            Classificação
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="text-xs max-w-[250px] space-y-1">
                                                            <p className="font-semibold">Classificação Tributária</p>
                                                            <p>Identifica setor, benefícios fiscais e alíquotas aplicáveis.</p>
                                                            <p>No Simples Nacional, sugere o Anexo.</p>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </TableHead>
                                    <TableHead className="text-right w-[100px]">Alíquota</TableHead>
                                    <TableHead className="text-right w-[120px]">Imposto</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itens.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-40">
                                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                <FileText className="h-10 w-10 opacity-20" />
                                                <div>
                                                    <p className="font-medium">Nenhum produto carregado</p>
                                                    <p className="text-sm">Faça upload de uma NFe (XML) para começar a simulação</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    itensRecalculados.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm truncate max-w-[250px]" title={item.descricao}>
                                                        {item.descricao}
                                                    </span>
                                                    {item.classificacao?.motivo && (
                                                        <span className="text-xs text-muted-foreground truncate max-w-[250px]" title={item.classificacao.motivo}>
                                                            {item.classificacao.motivo}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{item.ncm}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                R$ {item.valorProduto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                            <TableCell>
                                                {getClassificacaoBadge(itens.find(i => i.id === item.id)!)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-sm">
                                                {getAliquotaItem(itens.find(i => i.id === item.id)!)}
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-destructive">
                                                R$ {getImpostoItem(itens.find(i => i.id === item.id)!).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
