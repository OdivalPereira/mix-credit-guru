import { useState, useMemo, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Loader2, FileText, Calculator, Sparkles, TrendingUp, Receipt, Info, Trash2, HelpCircle, Package2, CheckCircle2, AlertCircle, PlusCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { TaxClassificationService } from '@/services/TaxClassificationService';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';


interface ItemAnalise extends TaxResultItem {
    status: 'pendente' | 'analisado';
    source?: 'governo' | 'ia';
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
    // Estados para entrada manual
    const [manualDescricao, setManualDescricao] = useState('');
    const [manualNcm, setManualNcm] = useState('');
    const [manualValor, setManualValor] = useState<number>(0);
    const [isSearchingManual, setIsSearchingManual] = useState(false);
    const [manualPreview, setManualPreview] = useState<ClassificacaoProduto | null>(null);
    const debouncedManualDesc = useDebounce(manualDescricao, 800);
    const [loading, setLoading] = useState(false);
    const [regimeSelecionado, setRegimeSelecionado] = useState<RegimeTributario>('simples');
    const [faturamentoAnual, setFaturamentoAnual] = useState<number>(360000);
    const [anexoSimples, setAnexoSimples] = useState<keyof typeof SIMPLES_ALIQUOTAS>('I');
    // Novas estados para conversão de unidade
    const [pendingConversion, setPendingConversion] = useState<ItemAnalise | null>(null);
    const [showConversionDialog, setShowConversionDialog] = useState(false);
    const [margemLucro, setMargemLucro] = useState<number>(50);

    useEffect(() => {
        const searchCache = async () => {
            if (debouncedManualDesc.length < 5) {
                setManualPreview(null);
                return;
            }

            setIsSearchingManual(true);
            try {
                const ncmLimpo = manualNcm?.replace(/\D/g, '');

                // Busca Textual (Full Text Search 'lite' com ilike)
                const { data } = await supabase
                    .from('silver_tax_layer')
                    .select('classificacao')
                    .ilike('descricao', `%${debouncedManualDesc}%`)
                    .maybeSingle();

                if (data) {
                    setManualPreview(data.classificacao as unknown as ClassificacaoProduto);
                } else {
                    setManualPreview(null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearchingManual(false);
            }
        };

        searchCache();
    }, [debouncedManualDesc, manualNcm]);

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
            const payloadProdutos = itens.map(i => ({
                id: i.id,
                descricao: i.descricao,
                ncm: i.ncm
            }));

            // Usando o novo serviço com Silver Layer First
            const results = await TaxClassificationService.classifyProducts(payloadProdutos);

            setItens(prev => {
                const updated = prev.map(item => {
                    const resultIA = results.find(r => r.id === item.id);
                    if (resultIA) {
                        const itemRecalculado = calcularImpostosItem(
                            item.id,
                            item.descricao,
                            item.ncm,
                            item.valorCompra,
                            faturamentoAnual,
                            item.margemLucro,
                            item.quantidade,
                            resultIA.classificacao,
                            false
                        );

                        // Se houver fator de conversão > 1 e ainda não foi confirmado/processado
                        if (resultIA.classificacao.conversion_factor && resultIA.classificacao.conversion_factor > 1 && !item.classificacao?.conversion_factor) {
                            // Marcaremos para abrir o dialog depois do loop ou apenas no primeiro encontrado
                        }

                        return {
                            ...itemRecalculado,
                            status: 'analisado' as const,
                            source: resultIA.source
                        };
                    }
                    return { ...item, status: 'analisado' as const };
                });

                // Trigger dialog para o primeiro item com conversão pendente
                const itemWithConversion = updated.find(i =>
                    i.classificacao?.conversion_factor &&
                    i.classificacao.conversion_factor > 1
                );
                if (itemWithConversion) {
                    setPendingConversion(itemWithConversion as ItemAnalise);
                    setShowConversionDialog(true);
                }

                return updated;
            });

            toast.success('Classificação tributária concluída (via Silver Layer/IA)!');

        } catch (error) {
            console.error(error);
            toast.error('Erro na análise: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    const handleMarginChange = (id: string, newMargin: number) => {
        setItens(prev => prev.map(item => {
            if (item.id === id) {
                return calcularImpostosItem(
                    item.id,
                    item.descricao,
                    item.ncm,
                    item.valorCompra,
                    faturamentoAnual,
                    newMargin,
                    item.quantidade,
                    item.classificacao,
                    false
                ) as ItemAnalise;
            }
            return item;
        }));
    };

    const handleConfirmConversion = () => {
        if (!pendingConversion) return;

        const factor = pendingConversion.classificacao?.conversion_factor || 1;
        setItens(prev => prev.map(item => {
            if (item.id === pendingConversion.id) {
                const novoValorCompra = item.valorCompra / factor;
                const novaQuantidade = item.quantidade * factor;

                return calcularImpostosItem(
                    item.id,
                    item.descricao,
                    item.ncm,
                    novoValorCompra,
                    faturamentoAnual,
                    item.margemLucro,
                    novaQuantidade,
                    { ...item.classificacao!, conversion_factor: 1 }, // Reseta fator após converter
                    false
                ) as ItemAnalise;
            }
            return item;
        }));

        setShowConversionDialog(false);
        setPendingConversion(null);
        toast.success(`Conversão aplicada: Custo rateado por ${factor} unidades.`);
    };

    const handleAddManual = async () => {
        if (!manualDescricao) return;

        const newItemBase = {
            id: crypto.randomUUID(),
            descricao: manualDescricao,
            ncm: manualNcm || '00000000',
            quantidade: 1,
            valorCompra: manualValor || 0,
            margemLucro: margemLucro,
            status: 'pendente' as const
        };

        setItens(prev => [...prev, newItemBase as ItemAnalise]);

        // Limpa campos
        setManualDescricao('');
        setManualNcm('');
        setManualValor(0);

        // Dispara análise automática para o novo item
        toast.info('Analisando produto adicionado...');
        try {
            const results = await TaxClassificationService.classifyProducts([{
                id: newItemBase.id,
                descricao: newItemBase.descricao,
                ncm: newItemBase.ncm
            }]);

            if (results.length > 0) {
                const res = results[0];
                setItens(prev => prev.map(item => {
                    if (item.id === newItemBase.id) {
                        return {
                            ...calcularImpostosItem(
                                item.id,
                                item.descricao,
                                item.ncm,
                                item.valorCompra,
                                faturamentoAnual,
                                item.margemLucro,
                                item.quantidade,
                                res.classificacao,
                                false
                            ),
                            status: 'analisado' as const,
                            source: res.source
                        } as ItemAnalise;
                    }
                    return item;
                }));
                toast.success('Produto classificado com sucesso!');
            }
        } catch (err) {
            console.error(err);
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
                    item.margemLucro,
                    item.quantidade,
                    classificacaoAjustada,
                    false
                ) as ItemAnalise,
                status: item.status,
                source: item.source
            };
        });
    }, [itens, faturamentoAnual, anexoSimples]);

    const totais = useMemo(() =>
        calcularTotaisRegime(itensRecalculados, regimeSelecionado),
        [itensRecalculados, regimeSelecionado]
    );

    const getImpostoItem = (item: TaxResultItem): string => {
        const regime = regimeSelecionado;
        const res = item.regimes[regime as keyof typeof item.regimes];

        if (regime === 'reforma2033' && 'impostoLiquido' in res) {
            return `R$ ${(res as any).impostoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }

        return `R$ ${res.imposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    };

    const getAliquotaItem = (item: TaxResultItem): string => {
        const regime = regimeSelecionado;
        const res = item.regimes[regime as keyof typeof item.regimes];

        if (regime === 'simples') {
            return `${((res as any).aliquotaEfetiva * 100).toFixed(1)}%`;
        }

        if (regime === 'reforma2033') {
            return `${((res as any).aliquotaEfetiva * 100).toFixed(1)}%`;
        }

        if (regime === 'presumido' || regime === 'real') {
            const p = res as any;
            return `${((p.aliquotaPisCofins + p.aliquotaIcmsIss) * 100).toFixed(1)}%`;
        }

        return '0.0%';
    };

    const getClassificacaoBadge = (item: TaxResultItem, status: string) => {
        if (status !== 'analisado' || !item.classificacao) return <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter bg-muted/30 px-1.5 py-0.5 rounded italic">Pendente IA</span>;

        // Se for fonte GOVERNO
        if ((item as ItemAnalise).source === 'governo') {
            return (
                <div className="flex gap-1 items-center">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold uppercase tracking-tight py-0 px-1.5 gap-1">
                        Gov <span className="text-[8px] opacity-70">✓</span>
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">{item.classificacao.setor}</span>
                </div>
            );
        }

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
                            <Input
                                type="number"
                                defaultValue={margemLucro}
                                onBlur={(e) => setMargemLucro(Number(e.target.value) || 50)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50 transition-colors"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* New Card for Manual Product Entry */}
                <Card className="border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3 pt-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <PlusCircle className="h-4 w-4 text-blue-500" />
                            Entrada Manual
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-12 gap-2 pb-4 px-4">
                        <div className="col-span-12 md:col-span-5 space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Descrição</Label>
                            <Input
                                placeholder="Ex: Cerveja Heineken..."
                                value={manualDescricao}
                                onChange={(e) => setManualDescricao(e.target.value)}
                                className="h-8 text-xs"
                            />
                            {manualPreview && (
                                <div className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Item já classificado
                                </div>
                            )}
                            {isSearchingManual && (
                                <div className="text-[9px] text-muted-foreground flex items-center gap-1 animate-pulse">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Buscando...
                                </div>
                            )}
                        </div>
                        <div className="col-span-6 md:col-span-2 space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">NCM</Label>
                            <Input
                                placeholder="Opcional"
                                value={manualNcm}
                                onChange={(e) => setManualNcm(e.target.value)}
                                className="h-8 text-xs font-mono"
                            />
                        </div>
                        <div className="col-span-6 md:col-span-2 space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Custo (R$)</Label>
                            <Input
                                type="number"
                                placeholder="0,00"
                                value={manualValor || ''}
                                onChange={(e) => setManualValor(Number(e.target.value))}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="col-span-12 md:col-span-3 flex items-end">
                            <Button
                                onClick={handleAddManual}
                                className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs font-bold"
                                disabled={!manualDescricao}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Adicionar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* New Card for XML Import */}
                <Card className="border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm overflow-hidden border-l-4 border-l-emerald-500">
                    <CardHeader className="pb-3 pt-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Upload className="h-4 w-4 text-emerald-500" />
                            Importar XML
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4 px-4">
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all border-emerald-500/20 hover:border-emerald-500/40">
                                    <div className="flex items-center justify-center gap-2">
                                        <Upload className="w-4 h-4 text-emerald-500" />
                                        <span className="text-xs text-slate-600 font-medium">Clique para selecionar XML</span>
                                    </div>
                                    <input type="file" className="hidden" accept=".xml" onChange={handleFileUpload} />
                                </label>
                            </div>

                            <div>
                                <Button
                                    variant="outline"
                                    onClick={handleAnaliseIA}
                                    disabled={itens.length === 0 || loading}
                                    className="h-16 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold px-4 flex flex-col gap-1 w-[120px]"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                    <span className="text-[10px]">Classificar Tudo</span>
                                </Button>
                            </div>
                            {itens.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleClear}
                                    className="h-16 w-8 text-slate-400 hover:text-destructive transition-colors shrink-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {
                itens.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Total Bruto NFe
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-slate-900 dark:text-slate-50">
                                    <span className="text-sm font-medium mr-1 opacity-50">R$</span>
                                    {itens.reduce((acc, i) => acc + i.valorCompra, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10 border-emerald-200 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                    Créditos Recuperáveis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-emerald-900 dark:text-emerald-50">
                                    <span className="text-sm font-medium mr-1 opacity-50">R$</span>
                                    {itens.reduce((acc, i) => acc + (i.creditosEntrada?.total || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <p className="text-[9px] text-emerald-600 mt-1 font-bold italic">DINHEIRO DE VOLTA</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                    Faturamento Projetado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-blue-900 dark:text-blue-50">
                                    <span className="text-sm font-medium mr-1 opacity-50">R$</span>
                                    {totais.valorTotalVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 border-purple-200 shadow-sm overflow-hidden group">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                                    Margem Líquida Real
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-purple-900 dark:text-purple-50">
                                    <span className="text-sm font-medium mr-1 opacity-50">R$</span>
                                    {(totais.valorTotalVenda - totais.impostoTotal - (itens.reduce((acc, i) => acc + i.valorCompra, 0) - itens.reduce((acc, i) => acc + (i.creditosEntrada?.total || 0), 0))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                )
            }

            {/* Análise de Inteligência */}
            {
                itens.some(i => i.status === 'analisado' && i.classificacao?.sugestao_economia) && (
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
                )
            }

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
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 py-4">Produto / Classificação</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 text-right">Qtd</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 text-right">Compra (R$)</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-emerald-600 text-right">Créditos (R$)</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Custo Líq.</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700 dark:text-slate-300">Margem (%)</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300 w-[100px]">Impostos Venda</TableHead>
                                    <TableHead className="text-right font-black text-primary">Preço Sugerido</TableHead>
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
                                        const impostoTotal = regimeSelecionado === 'reforma2033'
                                            ? item.regimes.reforma2033.impostoLiquido
                                            : item.regimes[regimeSelecionado as keyof typeof item.regimes].imposto;

                                        const impostoUnitario = item.quantidade > 0 ? impostoTotal / item.quantidade : impostoTotal;

                                        const impostoTotalStr = `R$ ${impostoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                                        const impostoUnitarioStr = `R$ ${impostoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

                                        return (
                                            <TableRow key={item.id} className="hover:bg-primary/[0.02] transition-colors border-b last:border-0">
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-sm text-foreground leading-tight truncate max-w-[200px]" title={item.descricao}>
                                                            {item.descricao}
                                                        </span>
                                                        <div className="flex gap-1 items-center mt-1">
                                                            <span className="text-[9px] text-muted-foreground font-mono bg-muted px-1 rounded">
                                                                NCM {item.ncm}
                                                            </span>
                                                            {getClassificacaoBadge(item, originalItem?.status || 'pendente')}
                                                        </div>
                                                        {item.classificacao?.sugestao_economia && (
                                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 leading-tight">
                                                                {item.classificacao.sugestao_economia}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-semibold text-muted-foreground">{item.quantidade}</TableCell>
                                                <TableCell className="text-right font-medium text-sm">
                                                    {item.valorCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600 text-sm bg-emerald-50/30">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                {item.creditosEntrada.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-[10px] space-y-1">
                                                                    <p>IBS: R$ {item.creditosEntrada.ibs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                    <p>CBS: R$ {item.creditosEntrada.cbs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>
                                                <TableCell className="text-right font-black text-slate-700 dark:text-slate-300 text-sm">
                                                    {item.custoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-center p-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Input
                                                            type="number"
                                                            value={item.margemLucro}
                                                            onBlur={(e) => handleMarginChange(item.id, Number(e.target.value))}
                                                            className="h-8 w-16 text-center text-xs font-bold border-primary/20 focus:border-primary"
                                                        />
                                                        <span className="text-[10px] font-bold text-muted-foreground">%</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-sm text-slate-600 dark:text-slate-400">
                                                    R$ {item.regimes.reforma2033.debito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </TableCell>
                                                <TableCell className="text-right font-black text-primary text-sm bg-primary/5">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger className="text-right w-full">
                                                                R$ {item.valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-[10px] space-y-1">
                                                                    <p>Base p/ Margem: R$ {item.baseCalculoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                    <p>Imposto Venda: R$ {item.regimes.reforma2033.debito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
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
            {/* Dialog de Conversão de Unidade */}
            <Dialog open={showConversionDialog} onOpenChange={setShowConversionDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                            <Package2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <DialogTitle className="text-center">Conversão Detectada</DialogTitle>
                        <DialogDescription className="text-center">
                            O sistema detectou que o produto <strong>{pendingConversion?.descricao}</strong> é vendido em embalagem coletiva ({pendingConversion?.classificacao?.unit_type} com {pendingConversion?.classificacao?.conversion_factor} unidades).
                            <br /><br />
                            Deseja converter o custo para o valor <strong>unitário</strong> para precificação?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 my-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Custo Atual (Total):</span>
                            <span className="font-bold">R$ {pendingConversion?.valorCompra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm text-emerald-600 font-black">
                            <span>Novo Custo Unitário:</span>
                            <span>R$ {((pendingConversion?.valorCompra || 0) / (pendingConversion?.classificacao?.conversion_factor || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button variant="outline" onClick={() => setShowConversionDialog(false)} className="flex-1">
                            Manter Original
                        </Button>
                        <Button onClick={handleConfirmConversion} className="flex-1 bg-blue-600 hover:bg-blue-700">
                            Confirmar Conversão
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
