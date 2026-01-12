import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { exportToPDF } from '@/lib/pdf-export';
import { TaxProfile, TaxComparisonResult } from '@/types/tax-planning';

interface UseTaxReportReturn {
    isGenerating: boolean;
    loadingStage: 'idle' | 'analyzing' | 'writing' | 'error' | 'done';
    reportContent: string | null;
    generateReport: (profile: TaxProfile, results: TaxComparisonResult, isDemo?: boolean, cnaeInfo?: any) => Promise<void>;
    downloadPDF: (companyName?: string) => Promise<void>;
    setReportContent: (content: string | null) => void;
}

export function useTaxReport(): UseTaxReportReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStage, setLoadingStage] = useState<'idle' | 'analyzing' | 'writing' | 'error' | 'done'>('idle');
    const [reportContent, setReportContent] = useState<string | null>(null);
    const supabase = useSupabaseClient();
    const { toast } = useToast();

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const generateReport = async (profile: TaxProfile, results: TaxComparisonResult, isDemo: boolean = false, cnaeInfo: any = null) => {
        setIsGenerating(true);
        setLoadingStage('analyzing');
        setReportContent(null);

        try {
            let report: string;

            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                setLoadingStage('writing');
                await new Promise(resolve => setTimeout(resolve, 1500));

                report = `
# Relatório Consultivo Tributário (DEMO)

Baseado nos dados da empresa **${profile.razao_social || 'Empresa Modelo'}**, realizamos uma análise profunda da carga tributária atual e o impacto da Reforma Tributária.

## 1. Sumário Executivo
Este relatório apresenta estratégias para redução da carga tributária e maximização de créditos.
[OK] Regime Recomendado: **${results.melhor_atual.toUpperCase()}**

## 2. Diagnóstico Atual
Considerando o faturamento anual de ${formatCurrency(profile.faturamento_anual || 0)}, a carga efetiva atual é de aproximadamente ${(results.cenarios[results.melhor_atual]?.carga_efetiva_percentual || 0).toFixed(2)}%.

## 3. Impacto da Reforma Tributária
A transição para o IBS e CBS trará uma simplificação significativa. O aproveitamento de créditos será de aproximadamente ${formatCurrency(results.cenarios.reforma_plena?.creditos_aproveitados || 0)} por ano.

## 4. Recomendações
[!] Revisar cadastro de NCMs para garantir créditos corretos.
[OK] Iniciar mapeamento de fornecedores que geram crédito integral.
                `.trim();
            } else {
                // 1. O CÉREBRO: Análise Estratégica (Gemini 2.5 Pro)
                console.log('Iniciando análise estratégica (The Brain)...');
                const { data: analysisData, error: analysisError } = await supabase.functions.invoke('tax-planner-strategic-analysis', {
                    body: { profile, results }
                });

                if (analysisError) throw analysisError;
                if (!analysisData?.success) throw new Error(analysisData?.error || 'Erro na análise estratégica');

                const strategicInsights = analysisData.insights;
                console.log('Insights recebidos do Cérebro:', strategicInsights?.length || 0);

                // 2. O ESCRIBA: Geração do Relatório (Gemini 2.0 Flash)
                setLoadingStage('writing');
                console.log('Gerando relatório final (The Scribe)...');

                const { data: reportData, error: reportError } = await supabase.functions.invoke('tax-planner-report', {
                    body: {
                        profile,
                        comparison_results: results,
                        cnae_info: cnaeInfo,
                        strategic_insights: strategicInsights
                    }
                });

                if (reportError) throw reportError;
                if (!reportData?.success) throw new Error(reportData?.error || 'Erro na geração do relatório');

                report = reportData.report;
            }

            setReportContent(report);
            setLoadingStage('done');
            toast({ title: "Relatório gerado com sucesso!", description: "Pronto para exportação." });

        } catch (error: any) {
            console.error('Erro na geração do relatório:', error);
            setLoadingStage('error');
            toast({
                title: "Erro ao gerar relatório",
                description: error.message || "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadPDF = async (companyName?: string) => {
        if (!reportContent) {
            toast({ title: "Gere o relatório primeiro", variant: "destructive" });
            return;
        }

        try {
            const { createPDFContainer } = await import('@/lib/pdf-export');
            const container = createPDFContainer(reportContent, companyName);

            document.body.appendChild(container);
            await exportToPDF(container, {
                filename: `Relatorio_Tributario_${companyName || 'Empresa'}`.replace(/[^a-z0-9]/gi, '_'),
                title: `Planejamento - ${companyName}`
            });
            document.body.removeChild(container);

            toast({ title: "Download iniciado!" });
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao exportar PDF", variant: "destructive" });
        }
    };

    return {
        isGenerating,
        loadingStage,
        reportContent,
        generateReport,
        downloadPDF,
        setReportContent
    };
}
