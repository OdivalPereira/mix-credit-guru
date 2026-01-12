
import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';
import { exportToPDF } from '@/lib/pdf-export';
import { TaxProfile, TaxComparisonResult } from '@/types/tax-planning';

interface UseTaxReportReturn {
    isGenerating: boolean;
    reportContent: string | null;
    generateReport: (profile: TaxProfile, results: TaxComparisonResult, isDemo?: boolean) => Promise<void>;
    downloadPDF: (companyName?: string) => Promise<void>;
    setReportContent: (content: string | null) => void;
}

export function useTaxReport(): UseTaxReportReturn {
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportContent, setReportContent] = useState<string | null>(null);
    const supabase = useSupabaseClient();
    const { toast } = useToast();

    // Helper to render currency inside the demo report string
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const generateReport = async (profile: TaxProfile, results: TaxComparisonResult, isDemo: boolean = false) => {
        setIsGenerating(true);
        try {
            let report: string;

            if (isDemo) {
                // Simulate delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                report = `
# Relatório Consultivo Tributário (DEMO)

Baseado nos dados da empresa **${profile.razao_social || 'Empresa Modelo'}**, realizamos uma análise profunda da carga tributária atual e o impacto da Reforma Tributária.

## 1. Sumário Executivo
Este relatório apresenta estratégias para redução da carga tributária e maximização de créditos.
[OK] Regime Recomendado: **${results.melhor_atual.toUpperCase()}**

## 2. Diagnóstico Atual
Considerando o faturamento anual de ${formatCurrency(profile.faturamento_anual || 0)}, a carga efetiva atual é de aproximadamente ${(results.cenarios[results.melhor_atual].carga_efetiva_percentual || 0).toFixed(2)}%.

## 3. Impacto da Reforma Tributária
A transição para o IBS e CBS trará uma simplificação significativa. O aproveitamento de créditos será de aproximadamente ${formatCurrency(results.cenarios.reforma_plena.creditos_aproveitados)} por ano.

## 4. Recomendações
[!] Revisar cadastro de NCMs para garantir créditos coretos.
[OK] Iniciar mapeamento de fornecedores que geram crédito integral.
                `.trim();
            } else {
                const { data, error } = await supabase.functions.invoke('tax-planner-report', {
                    body: {
                        profile,
                        comparison_results: results
                    }
                });

                if (error) throw error;
                if (!data?.success) throw new Error(data?.error || 'Erro ao gerar relatório');
                report = data.report;
            }

            setReportContent(report);
            toast({ title: "Relatório gerado com sucesso!", description: "Pronto para exportação." });

        } catch (error: any) {
            console.error('Erro na geração do relatório:', error);
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
            // Create a temporary container for valid HTML conversion inside exportToPDF logic
            // We pass the RAW markdown content; exportToPDF handles the conversion to HTML/PDF container
            // We actually need to import { createPDFContainer, convertMarkdownToHTML } or just pass the container.
            // Looking at src/lib/pdf-export.ts exportToPDF accepts an HTMLElement.
            // We should use a helper to render it off-screen first.

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
        reportContent,
        generateReport,
        downloadPDF,
        setReportContent
    };
}
