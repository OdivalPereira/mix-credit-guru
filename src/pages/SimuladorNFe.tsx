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
    { label: 'Simples Nacional', value: 'simples', description: 'Regime simplificado (DAS)' },
    { label: 'Regime Geral (Presumido/Real)', value: 'reforma2033', description: 'Padrão IBS + CBS (2033)' },
];

export default function SimuladorNFe() {
    const [itens, setItens] = useState<ItemAnalise[]>([]);
    const [loading, setLoading] = useState(false);
    const [regimeSelecionado, setRegimeSelecionado] = useState<RegimeTributario>('simples');
    const [faturamentoAnual, setFaturamentoAnual] = useState<number>(360000);
    const [anexoSimples, setAnexoSimples] = useState<keyof typeof SIMPLES_ALIQUOTAS>('I');
    const [margemLucro, setMargemLucro] = useState<number>(50);

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
                const valorCompra = prod.vUnCom * prod.qCom;
                const itemCalculado = calcularImpostosItem(
                    prod.cProd,
                    prod.xProd,
                    prod.NCM,
                    valorCompra,
                    faturamentoAnual,
                    margemLucro,
                    prod.qCom,
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
                        item.valorCompra,
                        faturamentoAnual,
                        margemLucro,
                        item.quantidade,
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
                    item.valorCompra,
                    faturamentoAnual,
                    margemLucro,
                    item.quantidade,
                    classificacaoAjustada,
                    false
                ),
                status: item.status,
                classificacao: item.classificacao
            };
        });
    }, [itens, faturamentoAnual, anexoSimples, margemLucro]);

    const totais = useMemo(() =>
        calcularTotaisRegime(itensRecalculados, regimeSelecionado),
        [itensRecalculados, regimeSelecionado]
    );

    const getImpostoItem = (item: TaxResultItem): string => {
        const regime = regimeSelecionado;
        const res = item.regimes[regime as keyof typeof item.regimes];

        if (regime === 'simples' && 'impostoMin' in res) {
            const s = res as any;
            return `R$ ${s.impostoMin.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${s.impostoMax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }

        if (regime === 'reforma2033' && 'impostoMaximo' in res) {
            const r = res as any;
            return `R$ ${r.imposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${r.impostoMaximo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }

        return `R$ ${res.imposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const getAliquotaItem = (item: TaxResultItem): string => {
        const regime = regimeSelecionado;
        const res = item.regimes[regime as keyof typeof item.regimes];

        if (regime === 'simples' && 'aliquotaMin' in res) {
            const s = res as any;
            return `${(s.aliquotaMin * 100).toFixed(1)}% - ${(s.aliquotaMax * 100).toFixed(1)}%`;
        }

        if (regime === 'reforma2033' && 'aliquotaMaxima' in res) {
            const r = res as any;
            return `${(r.aliquotaEsperada * 100).toFixed(1)}% - ${(r.aliquotaMaxima * 100).toFixed(1)}%`;
        }

        if (regime === 'presumido' || regime === 'real') {
            const p = res as any;
            return `${((p.aliquotaPisCofins + p.aliquotaIcmsIss) * 100).toFixed(1)}%`;
        }

        return '0.0%';
    };

    const getClassificacaoBadge = (item: TaxResultItem, status: string) => {
        if (status !== 'analisado' || !item.classificacao) return <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter bg-muted/30 px-1.5 py-0.5 rounded italic">Pendente IA</span>;

        if (regimeSelecionado === 'reforma2033') {
            const classificacao = item.regimes.reforma2033.classificacao || 'Padrão';

            if (classificacao.includes('Isento')) {
                return <Badge variant="outline" className="text-[10px] border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold uppercase tracking-tight py-0 px-2">{classificacao}</Badge>;
            }
            if (classificacao.includes('Reduzida')) {
                return <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-none font-bold uppercase tracking-tight py-0 px-2">{classificacao}</Badge>;
            }
            return <Badge variant="default" className="text-[10px] bg-slate-800 text-slate-100 font-bold uppercase tracking-tight py-0 px-2">{classificacao}</Badge>;
        }

        if (regimeSelecionado === 'simples') {
            const anexoStr = item.regimes.simples.anexo.split(' - ')[0]; // Pega só o "Anexo I"
            return <Badge variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 font-bold uppercase tracking-tight py-0 px-2">{anexoStr}</Badge>;
        }

        return <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight py-0 px-2">{item.classificacao.setor}</Badge>;
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-primary/10 shadow-sm">
                    <CardHeader className="pb-3 px-4 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary" />
                            Regime Tributário
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <Select value={regimeSelecionado} onValueChange={(v) => setRegimeSelecionado(v as RegimeTributario)}>
                            <SelectTrigger className="hover:border-primary/50 transition-colors">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {REGIMES_OPTIONS.map(regime => (
                                    <SelectItem key={regime.value} value={regime.value}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{regime.label}</span>
                                            <span className="text-[10px] text-muted-foreground leading-tight">{regime.description}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {regimeSelecionado === 'simples' && (
                    <>
                        <Card className="border-primary/10 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <CardHeader className="pb-3 px-4 pt-4">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Faturamento Anual (R$)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <Select
                                    value={faturamentoAnual.toString()}
                                    onValueChange={(v) => setFaturamentoAnual(Number(v))}
                                >
                                    <SelectTrigger className="hover:border-primary/50 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FAIXAS_FATURAMENTO.map(faixa => (
                                            <SelectItem key={faixa.value} value={faixa.value.toString()}>
                                                {faixa.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <CardHeader className="pb-3 px-4 pt-4">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Calculator className="h-4 w-4 text-primary" />
                                    Anexo Padrão
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-4">
                                <Select
                                    value={anexoSimples}
                                    onValueChange={(v) => setAnexoSimples(v as keyof typeof SIMPLES_ALIQUOTAS)}
                                >
                                    <SelectTrigger className="hover:border-primary/50 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(SIMPLES_ALIQUOTAS).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>
                                                Anexo {key} - {value.descricao}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>
                    </>
                )}

                <Card className="border-primary/10 shadow-sm">
                    <CardHeader className="pb-3 px-4 pt-4">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-primary" />
                            Margem de Lucro (%)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={margemLucro}
                                onChange={(e) => setMargemLucro(Number(e.target.value))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50 transition-colors"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cards de Resumo */}
            {/* Cards de Resumo */}
            {itens.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/60 dark:border-blue-800/50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Receipt className="h-12 w-12 text-blue-600" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                Valor Total de Venda
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-blue-900 dark:text-blue-50">
                                <span className="text-sm font-medium mr-1 text-blue-600/70">R$</span>
                                {totais.valorTotalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/20 dark:to-red-900/10 border-red-200/60 dark:border-red-800/50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Calculator className="h-12 w-12 text-red-600" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                                Imposto Estimado ({REGIMES_OPTIONS.find(r => r.value === regimeSelecionado)?.label})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-red-900 dark:text-red-50">
                                <span className="text-sm font-medium mr-1 text-red-600/70">R$</span>
                                {totais.impostoMinTotal !== undefined && totais.impostoMaxTotal !== undefined ? (
                                    <span className="text-lg">
                                        {totais.impostoMinTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        <span className="text-xs mx-1 text-red-400"> até </span>
                                        {totais.impostoMaxTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                ) : (
                                    totais.impostoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200/60 dark:border-purple-800/50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="h-12 w-12 text-purple-600" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                Carga Tributária Média
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black text-purple-900 dark:text-purple-50">
                                {totais.cargaEfetiva.toFixed(2)}
                                <span className="text-sm font-medium ml-1 text-purple-600/70">%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="border-dashed border-2 py-10">
                    <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="bg-primary/5 p-4 rounded-full">
                            <FileText className="h-10 w-10 text-primary/40" />
                        </div>
                        <div>
                            <p className="font-semibold text-lg text-foreground">Nenhum dado importado</p>
                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Importe o arquivo XML da sua NF-e para iniciar a simulação e análise tributária.</p>
                        </div>
                        <Label htmlFor="xml-upload-empty" className="cursor-pointer">
                            <Button variant="outline" className="pointer-events-none gap-2">
                                <Upload className="h-4 w-4" /> Selecionar Arquivo
                            </Button>
                            <input
                                type="file"
                                accept=".xml"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="xml-upload-empty"
                            />
                        </Label>
                    </CardContent>
                </Card>
            )}

            {/* Análise de Inteligência */}
            {itens.some(i => i.status === 'analisado' && i.classificacao?.sugestao_economia) && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 animate-fade-in mb-4">
                    <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-emerald-600 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                                Oportunidades Identificadas pela IA
                            </h3>
                            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
                                Encontramos estratégias para otimizar sua carga tributária.
                            </p>
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                onClick={() => window.open('https://wa.me/5511999999999?text=Gostaria%20de%20saber%20mais%20sobre%20as%20economias%20tributarias%20do%20Simulador', '_blank')}
                            >
                                Falar com Especialista
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabela de Itens */}
            <Card className="border-primary/10 shadow-lg overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center space-y-4 animate-in fade-in transition-all">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-lg text-primary">IA Classificando Itens...</p>
                            <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos dependendo da NFe</p>
                        </div>
                    </div>
                )}
                <CardHeader className="pb-4 border-b bg-muted/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Itens da Nota Fiscal
                            </CardTitle>
                            <CardDescription>
                                {itens.length > 0
                                    ? `${itens.length} itens detectados • Use a IA para classificar tributos`
                                    : 'Aguardando importação de arquivo XML'
                                }
                            </CardDescription>
                        </div>
                        {itens.some(i => i.status === 'analisado') && (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 gap-1.5 py-1">
                                <Sparkles className="h-3 w-3" /> IA Ativa
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 py-4">Produto</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 text-right w-[80px]">Qtd</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 text-right w-[110px]">Venda Total</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/80 text-right w-[130px]">Imposto Total</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 text-right w-[110px]">Venda Unit.</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-primary/80 text-right w-[130px]">Imposto Unit.</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 w-[140px]">
                                        Insights AI
                                    </TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 text-right w-[90px]">Efetiva</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itens.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-20 bg-muted/5">
                                            <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                                <div className="bg-muted p-4 rounded-full opacity-20">
                                                    <FileText className="h-12 w-12" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-bold text-lg text-foreground/70">Nenhum produto carregado</p>
                                                    <p className="text-sm max-w-xs mx-auto">Faça upload de uma NFe (XML) para começar a simulação e análise tributária.</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    itensRecalculados.map((item) => {
                                        const originalItem = itens.find(i => i.id === item.id);
                                        const impostoTotalStr = getImpostoItem(item);

                                        // Derivar unitário do total string (que pode ser range)
                                        let impostoUnitarioStr = impostoTotalStr;
                                        if (item.quantidade > 1) {
                                            if (impostoTotalStr.includes('-')) {
                                                const parts = impostoTotalStr.replace(/R\$ /g, '').split(' - ');
                                                const min = parseFloat(parts[0].replace(/\./g, '').replace(',', '.'));
                                                const max = parseFloat(parts[1].replace(/\./g, '').replace(',', '.'));
                                                impostoUnitarioStr = `R$ ${(min / item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${(max / item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                            } else {
                                                const valor = parseFloat(impostoTotalStr.replace(/R\$ /g, '').replace(/\./g, '').replace(',', '.'));
                                                impostoUnitarioStr = `R$ ${(valor / item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                            }
                                        }

                                        return (
                                            <TableRow key={item.id} className="hover:bg-primary/[0.02] transition-colors border-b last:border-0">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-sm text-foreground leading-tight truncate max-w-[200px]" title={item.descricao}>
                                                            {item.descricao}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            NCM {item.ncm}
                                                        </span>
                                                        {item.classificacao?.unidade_venda_sugerida && (
                                                            <span className="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-wider mt-1 bg-blue-50 dark:bg-blue-950/30 px-1.5 py-0.5 rounded-sm w-fit">
                                                                Venda Sugerida: {item.classificacao.unidade_venda_sugerida}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center text-xs font-semibold text-muted-foreground">{item.quantidade}</TableCell>
                                                <TableCell className="text-right font-bold text-sm">
                                                    <span className="text-[10px] text-muted-foreground mr-1 font-normal">R$</span>
                                                    {item.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right font-black text-destructive text-[11px] whitespace-nowrap bg-destructive/5">
                                                    {impostoTotalStr}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground text-xs">
                                                    <span className="text-[10px] opacity-50 mr-1">R$</span>
                                                    {item.valorVendaUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right text-destructive font-bold text-[11px] whitespace-nowrap opacity-90 border-r border-destructive/10">
                                                    {impostoUnitarioStr}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        {getClassificacaoBadge(item, originalItem?.status || 'pendente')}
                                                        {item.classificacao?.sugestao_economia && (
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-tight italic line-clamp-2 max-w-[140px] font-medium" title={item.classificacao.sugestao_economia}>
                                                                "{item.classificacao.sugestao_economia}"
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono font-bold text-xs text-muted-foreground/80 py-4">
                                                    {getAliquotaItem(item)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
