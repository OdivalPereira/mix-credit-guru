/**
 * Planejamento Tributário v2
 * 
 * Consultoria Contábil Inteligente com modelo DRE
 * Foco na não-cumulatividade plena da Reforma Tributária
 * 
 * Wizard de 3 etapas: Entrada de Dados → Validação → Dashboard
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    FileText, Mic, Upload, Sparkles, ArrowRight, ArrowLeft,
    CheckCircle2, AlertCircle, FileSpreadsheet, Building2,
    Calculator, TrendingUp, TrendingDown, Users, DollarSign,
    Loader2, X, Info, BarChart3, Target, Lightbulb,
    Home, Zap, Receipt, Truck, Wrench, Package,
    Wallet, CreditCard, Scale, AlertTriangle, FileDown, ScrollText, Map as MapIcon,
    Store, Percent, Search
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { exportToPDF, createPDFContainer, convertMarkdownToHTML } from '@/lib/pdf-export';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    Legend, ResponsiveContainer, AreaChart, Area, Cell,
    ComposedChart, ReferenceLine
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useAuth } from "@/contexts/AuthContext";

import type {
    TaxProfile, TaxComparisonResult, TaxScenarioResult,
    ChartDataComparison, ChartDataCreditos, ChartDataTimeline, TaxInsight,
    AiExtractionResult
} from "@/types/tax-planning";
import {
    compararTodosRegimes,
    gerarDadosGraficoComparacao,
    gerarDadosGraficoCreditos,
    gerarDadosTimeline,
    ALIQUOTA_IBS_CBS_PADRAO,
    getReducaoSetorial,
    getCnaeInfo
} from "@/lib/tax-planning-engine";
import { parseSpedFile, isSpedFile, getSpedSummary } from "@/lib/sped-parser";
import { parseExcelFile, getExcelSummary } from "@/lib/excel-parser";
import {
    parseBalancete,
    parseCNPJCard,
    balanceteToTaxProfile,
    extractTextFromPDF,
    CNPJData,
    BalanceteData
} from "@/lib/parsers";

// ============================================================================
// TYPES
// ============================================================================

type WizardStep = 'input' | 'validation' | 'dashboard';

interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    status: 'pending' | 'processing' | 'success' | 'error';
    summary?: string;
    error?: string;
}

interface AiAnalysisMetadata {
    premissas: string | string[];
    confianca: number;
}

// Estado inicial do perfil
const INITIAL_PROFILE: TaxProfile = {
    cnae_principal: '',
    faturamento_mensal: 0,
    faturamento_anual: 0,
    regime_atual: 'presumido',
    despesas_com_credito: {
        cmv: 0,
        aluguel: 0,
        energia_telecom: 0,
        servicos_pj: 0,
        outros_insumos: 0,
        transporte_frete: 0,
        manutencao: 0,
        tarifas_bancarias: 0
    },
    despesas_sem_credito: {
        folha_pagamento: 0,
        pro_labore: 0,
        despesas_financeiras: 0,
        tributos: 0,
        uso_pessoal: 0,
        outras: 0
    },
    saldo_credor_pis_cofins: 0,
    saldo_credor_icms: 0
};

// Mock para Demo Mode
const DEMO_AI_PROFILE: Partial<TaxProfile> = {
    razao_social: "Supermercado do Futuro Ltda",
    cnpj: "12.345.678/0001-99",
    cnae_principal: "4711-3/01",
    uf: "SP",
    municipio: "São Paulo",
    regime_atual: "presumido",
    faturamento_mensal: 250000,
    faturamento_anual: 3000000,
    despesas_com_credito: {
        cmv: 150000,
        aluguel: 12000,
        energia_telecom: 4500,
        servicos_pj: 8000,
        outros_insumos: 3000,
        transporte_frete: 5000,
        manutencao: 2000,
        tarifas_bancarias: 1500
    },
    despesas_sem_credito: {
        folha_pagamento: 45000,
        pro_labore: 10000,
        despesas_financeiras: 2000,
        tributos: 15000,
        uso_pessoal: 500,
        outras: 1000
    }
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function PlanejamentoTributario() {
    const { isDemo } = useAuth();
    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('input');
    const [inputTab, setInputTab] = useState<'manual' | 'texto' | 'arquivo'>('manual');

    // Input state
    const [descricaoTexto, setDescricaoTexto] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loadingCnpj, setLoadingCnpj] = useState(false);

    // Profile state
    const [profile, setProfile] = useState<TaxProfile>(INITIAL_PROFILE);
    const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisMetadata | null>(null);

    // Results
    const [results, setResults] = useState<TaxComparisonResult | null>(null);
    const [strategicInsights, setStrategicInsights] = useState<TaxInsight[]>([]);
    const [isAnalyzingStrategically, setIsAnalyzingStrategically] = useState(false);

    // Report state
    const [reportContent, setReportContent] = useState<string | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    // Carregar dados do localStorage (vindos do módulo de importação de documentos)
    useEffect(() => {
        const savedProfile = localStorage.getItem('tax_profile');
        const updatedAt = localStorage.getItem('tax_profile_updated_at');

        if (savedProfile && updatedAt) {
            // Verifica se foi atualizado recentemente (últimos 5 minutos)
            const updatedDate = new Date(updatedAt);
            const now = new Date();
            const diffMinutes = (now.getTime() - updatedDate.getTime()) / 1000 / 60;

            if (diffMinutes < 5) {
                try {
                    const parsed = JSON.parse(savedProfile);
                    setProfile(prev => ({
                        ...prev,
                        ...parsed,
                        despesas_com_credito: { ...prev.despesas_com_credito, ...parsed.despesas_com_credito },
                        despesas_sem_credito: { ...prev.despesas_sem_credito, ...parsed.despesas_sem_credito },
                    }));

                    // Ir direto para validação se tiver dados
                    if (parsed.faturamento_mensal > 0) {
                        setCurrentStep('validation');
                        toast({
                            title: 'Dados importados!',
                            description: 'Os dados do balancete foram carregados automaticamente.',
                        });
                    }

                    // Limpa o localStorage após usar
                    localStorage.removeItem('tax_profile');
                    localStorage.removeItem('tax_profile_updated_at');
                } catch (e) {
                    console.error('Erro ao carregar perfil do localStorage:', e);
                }
            }
        }
    }, []);

    // ============================================================================
    // HELPERS
    // ============================================================================

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value || 0);
    };

    const formatNumberForInput = (value: number) => {
        if (value === 0) return '';
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatPercent = (value: number) => `${(value || 0).toFixed(1)}%`;

    const parseCurrency = (value: string): number => {
        if (!value) return 0;
        // Remove tudo que não é dígito ou vírgula
        const clean = value.replace(/[^\d,]/g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    };

    const formatCNPJ = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18);
    };

    const formatCNAE = (value: string | number) => {
        const str = String(value).replace(/\D/g, '');
        if (str.length !== 7) return String(value);
        return str.replace(/^(\d{4})(\d{1})(\d{2})$/, '$1-$2/$3');
    };

    const handleConsultarCNPJ = async () => {
        const cnpjLimpo = profile.cnpj?.replace(/\D/g, '');

        if (!cnpjLimpo || cnpjLimpo.length !== 14) {
            toast({
                title: "CNPJ inválido",
                description: "Digite um CNPJ válido com 14 dígitos.",
                variant: "destructive"
            });
            return;
        }

        setLoadingCnpj(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);

            if (!response.ok) {
                throw new Error('Falha na consulta');
            }

            const data = await response.json();

            setProfile(prev => ({
                ...prev,
                razao_social: data.razao_social,
                cnae_principal: formatCNAE(data.cnae_fiscal),
                uf: data.uf,
                municipio: data.municipio
            }));

            toast({
                title: "CNPJ Consultado!",
                description: `${data.razao_social} encontrada com sucesso.`
            });

        } catch (error) {
            toast({
                title: "Erro na consulta",
                description: "Não foi possível buscar os dados do CNPJ. Verifique o número ou tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoadingCnpj(false);
        }
    };

    const updateProfile = useCallback((field: string, value: any) => {
        setProfile(prev => {
            const keys = field.split('.');
            if (keys.length === 1) {
                return { ...prev, [field]: value };
            } else if (keys.length === 2) {
                return {
                    ...prev,
                    [keys[0]]: {
                        ...(prev as any)[keys[0]],
                        [keys[1]]: value
                    }
                };
            }
            return prev;
        });
    }, []);

    const totalDespesasComCredito = useMemo(() => {
        const d = profile.despesas_com_credito;
        const total = (d.cmv + d.aluguel + d.energia_telecom + d.servicos_pj +
            d.outros_insumos + d.transporte_frete + d.manutencao) || 0;
        return Number(total.toFixed(2));
    }, [profile.despesas_com_credito]);

    const totalDespesasSemCredito = useMemo(() => {
        const d = profile.despesas_sem_credito;
        const total = (d.folha_pagamento + d.pro_labore + d.despesas_financeiras +
            d.tributos + d.uso_pessoal + d.outras) || 0;
        return Number(total.toFixed(2));
    }, [profile.despesas_sem_credito]);

    const cnaeInfo = useMemo(() => {
        if (!profile.cnae_principal) return null;
        return getCnaeInfo(profile.cnae_principal);
    }, [profile.cnae_principal]);

    // ============================================================================
    // FILE HANDLING
    // ============================================================================

    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files) return;

        for (const file of Array.from(files)) {
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            setUploadedFiles(prev => [...prev, {
                id, name: file.name, type: file.type, size: file.size, status: 'processing'
            }]);

            try {
                if (file.name.endsWith('.txt')) {
                    // SPED Local Parsing
                    const content = await file.text();
                    if (isSpedFile(content)) {
                        console.log('[Upload] Identificado como SPED');
                        const result = parseSpedFile(content);
                        if (result.empresa) {
                            updateProfile('razao_social', result.empresa.razao_social);
                            updateProfile('cnpj', result.empresa.cnpj);
                            updateProfile('cnae_principal', result.empresa.cnae_principal || '');
                            updateProfile('uf', result.empresa.uf);
                        }
                        if (result.dre) {
                            updateProfile('faturamento_anual', result.dre.receita_bruta || 0);
                            updateProfile('faturamento_mensal', (result.dre.receita_bruta || 0) / 12);
                        }
                        setUploadedFiles(prev => prev.map(f =>
                            f.id === id ? { ...f, status: 'success', summary: getSpedSummary(result) } : f
                        ));
                    } else {
                        // Tentar Balancete SCI Sucessor
                        console.log('[Upload] Tentando Balancete SCI Sucessor...');
                        const balanceteResult = parseBalancete(content);
                        if (balanceteResult.success && balanceteResult.data) {
                            const taxProfile = balanceteToTaxProfile(balanceteResult.data);

                            setProfile(prev => ({
                                ...prev,
                                ...taxProfile,
                                despesas_com_credito: { ...prev.despesas_com_credito, ...taxProfile.despesas_com_credito },
                                despesas_sem_credito: { ...prev.despesas_sem_credito, ...taxProfile.despesas_sem_credito },
                            }));

                            setUploadedFiles(prev => prev.map(f =>
                                f.id === id ? { ...f, status: 'success', summary: `Balancete: ${balanceteResult.data?.empresa || 'OK'}` } : f
                            ));
                        } else {
                            throw new Error('Formato TXT não reconhecido (não é SPED nem Balancete SCI)');
                        }
                    }
                } else if (file.name.match(/\.(xlsx|xls)$/i)) {
                    // Excel Local Parsing
                    const result = await parseExcelFile(file, file.name);
                    if (result.sucesso) {
                        const cat = result.totaisPorCategoria;
                        updateProfile('despesas_com_credito.aluguel', (cat.aluguel || 0) / 12);
                        updateProfile('despesas_com_credito.energia_telecom', ((cat.energia || 0) + (cat.telecomunicacoes || 0)) / 12);
                        updateProfile('despesas_com_credito.servicos_pj', (cat.servicos || 0) / 12);
                        updateProfile('despesas_com_credito.transporte_frete', (cat.transporte || 0) / 12);
                        updateProfile('despesas_sem_credito.folha_pagamento', (cat.pessoal || 0) / 12);
                        updateProfile('despesas_sem_credito.despesas_financeiras', (cat.financeiras || 0) / 12);
                    }
                    setUploadedFiles(prev => prev.map(f =>
                        f.id === id ? { ...f, status: 'success', summary: getExcelSummary(result) } : f
                    ));
                } else if (file.type === 'application/pdf' || file.type.startsWith('image/') || file.type.startsWith('audio/')) {
                    // Tentar extração local de PDF primeiro se for CNPJ
                    if (file.type === 'application/pdf') {
                        try {
                            console.log('[Upload] Tentando extração local de PDF...');
                            const text = await extractTextFromPDF(file);

                            // Verificar se parece um cartão CNPJ
                            if (text.includes('COMPROVANTE DE INSCRIÇÃO') || text.includes('CADASTRO NACIONAL DA PESSOA JURÍDICA')) {
                                console.log('[Upload] Detectado como Cartão CNPJ');
                                const cnpjResult = parseCNPJCard(text);
                                if (cnpjResult.success && cnpjResult.data) {
                                    const d = cnpjResult.data;
                                    setProfile(prev => ({
                                        ...prev,
                                        razao_social: d.razaoSocial,
                                        cnpj: d.cnpj,
                                        cnae_principal: d.cnaePrincipal.codigo,
                                        uf: d.endereco.uf,
                                        municipio: d.endereco.municipio
                                    }));

                                    setUploadedFiles(prev => prev.map(f =>
                                        f.id === id ? { ...f, status: 'success', summary: `Cartão CNPJ: ${d.razaoSocial}` } : f
                                    ));
                                    continue; // Pula para o próximo arquivo, não vai para IA
                                }
                            }
                        } catch (pdfError) {
                            console.warn('[Upload] Erro na extração local de PDF, caindo para IA:', pdfError);
                        }
                    }

                    // AI Extraction (PDF/Image/Audio) - Fallback
                    console.log('[Upload] Usando IA para extração...');
                    const formData = new FormData();
                    formData.append('file', file);

                    let extracted: any | undefined;

                    if (isDemo) {
                        // Simular atraso de IA no Demo Mode
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        extracted = DEMO_AI_PROFILE;
                    } else {
                        // Contexto unificado
                        formData.append('json_data', JSON.stringify(profile));
                        if (descricaoTexto) {
                            formData.append('text', descricaoTexto);
                        }

                        const { data, error } = await supabase.functions.invoke('tax-planner-extract', {
                            body: formData,
                        });

                        if (error) throw error;
                        extracted = data?.profile;
                    }

                    if (extracted) {
                        setProfile(prev => ({
                            ...prev,
                            razao_social: extracted.razao_social || prev.razao_social,
                            cnpj: extracted.cnpj || prev.cnpj,
                            cnae_principal: extracted.cnae_principal || prev.cnae_principal,
                            uf: extracted.uf || prev.uf,
                            municipio: extracted.municipio || prev.municipio,
                            faturamento_mensal: extracted.faturamento_mensal || prev.faturamento_mensal,
                            faturamento_anual: extracted.faturamento_anual || (extracted.faturamento_mensal * 12) || prev.faturamento_anual,
                            regime_atual: extracted.regime_atual || prev.regime_atual,
                            despesas_com_credito: { ...prev.despesas_com_credito, ...extracted.despesas_com_credito },
                            despesas_sem_credito: { ...prev.despesas_sem_credito, ...extracted.despesas_sem_credito },
                            lucro_liquido: extracted.lucro_liquido || prev.lucro_liquido
                        }));
                    }

                    setUploadedFiles(prev => prev.map(f =>
                        f.id === id ? { ...f, status: 'success', summary: 'Processado com IA' } : f
                    ));
                } else {
                    setUploadedFiles(prev => prev.map(f =>
                        f.id === id ? { ...f, status: 'error', error: 'Formato não suportado' } : f
                    ));
                }
            } catch (error) {
                setUploadedFiles(prev => prev.map(f =>
                    f.id === id ? { ...f, status: 'error', error: String(error) } : f
                ));
            }
        }
    }, [updateProfile, isDemo, descricaoTexto, profile]);

    const handleAudioRecording = useCallback(async (audioBlob: Blob) => {
        const id = `${Date.now()}-audio`;
        setUploadedFiles(prev => [...prev, {
            id, name: 'Gravacao_Voz.webm', type: 'audio/webm', size: audioBlob.size, status: 'processing'
        }]);

        try {
            const formData = new FormData();
            formData.append('file', audioBlob, 'gravacao.webm');

            let extracted;
            let metadata;

            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                extracted = DEMO_AI_PROFILE;
                metadata = { observacoes: "Transcrição simulada: 'Minha empresa fatura 250 mil por mês...'", confianca: 0.95 };
            } else {
                // Contexto unificado
                formData.append('json_data', JSON.stringify(profile));
                if (descricaoTexto) {
                    formData.append('text', descricaoTexto);
                }

                const { data, error } = await supabase.functions.invoke('tax-planner-extract', {
                    body: formData,
                });

                if (error) throw error;
                extracted = data?.profile;
                metadata = data?.metadata;
            }

            if (extracted) {
                setProfile(prev => ({
                    ...prev,
                    razao_social: extracted.razao_social || prev.razao_social,
                    cnpj: extracted.cnpj || prev.cnpj,
                    cnae_principal: extracted.cnae_principal || prev.cnae_principal,
                    uf: extracted.uf || prev.uf,
                    municipio: extracted.municipio || prev.municipio,
                    faturamento_mensal: extracted.faturamento_mensal || prev.faturamento_mensal,
                    faturamento_anual: extracted.faturamento_anual || (extracted.faturamento_mensal * 12) || prev.faturamento_anual,
                    regime_atual: extracted.regime_atual || prev.regime_atual,
                    despesas_com_credito: { ...prev.despesas_com_credito, ...extracted.despesas_com_credito },
                    despesas_sem_credito: { ...prev.despesas_sem_credito, ...extracted.despesas_sem_credito },
                    lucro_liquido: extracted.lucro_liquido || prev.lucro_liquido
                }));

                // Metadata
                if (metadata?.observacoes) {
                    setAiAnalysis({
                        premissas: metadata.observacoes,
                        confianca: metadata.confianca
                    });
                }

                setUploadedFiles(prev => prev.map(f =>
                    f.id === id ? { ...f, status: 'success', summary: 'Áudio processado' } : f
                ));

                setCurrentStep('validation');
                toast({ title: "Áudio processado com sucesso!" });
            }
        } catch (error) {
            setUploadedFiles(prev => prev.map(f =>
                f.id === id ? { ...f, status: 'error', error: String(error) } : f
            ));
            toast({ title: "Erro ao processar áudio", variant: "destructive" });
        }
    }, [setUploadedFiles, supabase.functions, setProfile, setAiAnalysis, setCurrentStep, toast]);

    // ============================================================================
    // AI ANALYSIS
    // ============================================================================

    const handleAIAnalysis = useCallback(async () => {
        if (!descricaoTexto.trim() || isProcessing) {
            if (!descricaoTexto.trim()) toast({ title: "Informe uma descrição", variant: "destructive" });
            return;
        }

        setIsProcessing(true);
        try {
            let aiProfile: AiExtractionResult | undefined;
            let responseData: any;

            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 1800));
                aiProfile = DEMO_AI_PROFILE as AiExtractionResult;
                responseData = { profile: DEMO_AI_PROFILE, metadata: { confianca: 0.95, observacoes: ["Dados simulados para o modo demonstração."] } };
            } else {
                const { data, error } = await supabase.functions.invoke('tax-planner-extract', {
                    body: {
                        text: descricaoTexto,
                        json_data: profile // Contexto unificado
                    }
                });

                if (error) throw error;
                aiProfile = data?.profile as AiExtractionResult;
                responseData = data;
            }

            if (!aiProfile) throw new Error("A IA não retornou um perfil válido.");

            // Mapear resposta da IA para o perfil
            setProfile(prev => ({
                ...prev,
                razao_social: aiProfile.razao_social || prev.razao_social,
                cnpj: aiProfile.cnpj || prev.cnpj,
                cnae_principal: aiProfile.cnae_principal || prev.cnae_principal,
                uf: aiProfile.uf || prev.uf,
                municipio: aiProfile.municipio || prev.municipio,
                faturamento_mensal: aiProfile.faturamento_mensal || prev.faturamento_mensal,
                faturamento_anual: aiProfile.faturamento_anual || (aiProfile.faturamento_mensal * 12) || prev.faturamento_anual,
                regime_atual: aiProfile.regime_atual || prev.regime_atual,
                despesas_com_credito: { ...prev.despesas_com_credito, ...aiProfile.despesas_com_credito },
                despesas_sem_credito: { ...prev.despesas_sem_credito, ...aiProfile.despesas_sem_credito },
                lucro_liquido: aiProfile.lucro_liquido || prev.lucro_liquido
            }));

            // Metadata/Observações
            if (responseData?.metadata?.observacoes) {
                setAiAnalysis({
                    premissas: responseData.metadata.observacoes,
                    confianca: responseData.metadata.confianca
                });
            }

            setCurrentStep('validation');
            toast({ title: "Dados extraídos com sucesso!" });

        } catch (error) {
            toast({
                title: "Erro na análise",
                description: error instanceof Error ? error.message : "Erro desconhecido",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    }, [descricaoTexto, supabase.functions, setProfile, setAiAnalysis, setCurrentStep, toast]);




    // ============================================================================
    // CALCULATION
    // ============================================================================

    const handleCalculate = useCallback(async () => {
        // Validar campos obrigatórios
        if (!profile.faturamento_mensal || profile.faturamento_mensal <= 0) {
            toast({ title: "Informe o faturamento mensal", variant: "destructive" });
            return;
        }

        setIsProcessing(true);

        try {
            // Garantir faturamento anual
            const profileFinal = {
                ...profile,
                faturamento_anual: profile.faturamento_anual || profile.faturamento_mensal * 12
            };

            // Cálculo determinístico local
            const resultado = compararTodosRegimes(profileFinal);
            setResults(resultado);
            setStrategicInsights(resultado.insights); // Insights locais primeiro
            setCurrentStep('dashboard');

            toast({
                title: "Análise concluída!",
                description: `Melhor regime atual: ${resultado.melhor_atual.toUpperCase()}`
            });

            // Chamada de IA Avançada para Insights Estratégicos (Background)
            setIsAnalyzingStrategically(true);
            const { data, error } = await supabase.functions.invoke('tax-planner-strategic-analysis', {
                body: { profile: profileFinal, results: resultado }
            });

            if (!error && data && Array.isArray(data)) {
                // Mesclar insights locais com os da IA (IA primeiro para destaque)
                setStrategicInsights([...data, ...resultado.insights]);
            }
        } catch (error) {
            console.error('Erro ao calcular:', error);
            toast({
                title: "Erro ao processar",
                description: "Cálculos locais concluídos, mas análise avançada falhou.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
            setIsAnalyzingStrategically(false);
        }
    }, [profile, supabase.functions, toast]);

    // ============================================================================
    // CHART DATA
    // ============================================================================

    const chartComparacao = useMemo(() => {
        if (!results) return [];
        return gerarDadosGraficoComparacao(results);
    }, [results]);

    const chartCreditos = useMemo(() => {
        return gerarDadosGraficoCreditos(profile);
    }, [profile]);

    const chartTimeline = useMemo(() => {
        return gerarDadosTimeline(profile);
    }, [profile]);

    // ============================================================================
    // REPORT GENERATION
    // ============================================================================

    const handleGenerateReport = useCallback(async () => {
        if (!results) {
            toast({ title: "Execute a análise primeiro", variant: "destructive" });
            return;
        }

        setIsGeneratingReport(true);
        try {
            let report;

            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 2500));
                report = `
# Relatório Consultivo Tributário (DEMO)

Baseado nos dados da empresa **${profile.razao_social}**, realizamos uma análise profunda da carga tributária atual e o impacto da Reforma Tributária (PEC 45/19).

## 1. Melhor Regime Atual
Considerando o faturamento anual de ${formatCurrency(profile.faturamento_anual)}, o regime **${results.melhor_atual.toUpperCase()}** apresenta a menor carga efetiva.

## 2. Impacto da Reforma Tributária
A transição para o IBS e CBS trará uma simplificação significativa. O aproveitamento de créditos será de aproximadamente ${formatCurrency(results.cenarios.reforma_plena.creditos_aproveitados)} por ano.

## 3. Recomendações
- Iniciar mapeamento de fornecedores que geram crédito integral.
- Preparar sistemas para convivência entre modelos em 2027.
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
            toast({ title: "Relatório gerado com sucesso!" });

        } catch (error) {
            toast({
                title: "Erro ao gerar relatório",
                description: error instanceof Error ? error.message : "Erro desconhecido",
                variant: "destructive"
            });
        } finally {
            setIsGeneratingReport(false);
        }
    }, [profile, results, isDemo]);

    const handleExportPDF = useCallback(async () => {
        if (!reportContent) {
            toast({
                title: "Gere o relatório primeiro",
                description: "Clique em 'Relatório IA' antes de exportar.",
                variant: "destructive"
            });
            return;
        }

        try {
            toast({ title: "Gerando PDF...", description: "Aguarde um momento." });

            // Create styled container for PDF
            const pdfContainer = createPDFContainer(
                reportContent,
                profile.razao_social || 'Empresa'
            );
            document.body.appendChild(pdfContainer);

            // Export to PDF
            await exportToPDF(pdfContainer, {
                filename: `relatorio-tributario-${profile.razao_social?.replace(/\s+/g, '-').toLowerCase() || 'empresa'}`,
                title: 'Relatório Consultivo Tributário'
            });

            // Clean up
            document.body.removeChild(pdfContainer);

            toast({ title: "PDF exportado com sucesso!" });
        } catch (error) {
            toast({
                title: "Erro ao exportar PDF",
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: "destructive"
            });
        }
    }, [reportContent, profile.razao_social]);

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Planejamento Tributário</h1>
                    <p className="text-muted-foreground">
                        Consultoria inteligente com análise de não-cumulatividade
                    </p>
                </div>
                <Badge variant="outline" className="text-xs">
                    v2.1 - Multi-Modal
                </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className={currentStep === 'input' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        1. Dados da Empresa
                    </span>
                    <span className={currentStep === 'validation' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        2. Validação
                    </span>
                    <span className={currentStep === 'dashboard' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        3. Análise Comparativa
                    </span>
                </div>
                <Progress value={currentStep === 'input' ? 33 : currentStep === 'validation' ? 66 : 100} className="h-2" />
            </div>

            {/* Step 1: Input */}
            {currentStep === 'input' && (
                <div className="space-y-6">
                    <Tabs value={inputTab} onValueChange={(v) => setInputTab(v as any)}>
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="manual">
                                <Calculator className="h-4 w-4 mr-2" />
                                Formulário
                            </TabsTrigger>
                            <TabsTrigger value="texto">
                                <Sparkles className="h-4 w-4 mr-2" />
                                Texto + IA
                            </TabsTrigger>
                            <TabsTrigger value="audio">
                                <Mic className="h-4 w-4 mr-2" />
                                Áudio
                            </TabsTrigger>
                            <TabsTrigger value="arquivo">
                                <Upload className="h-4 w-4 mr-2" />
                                Importar
                            </TabsTrigger>
                        </TabsList>

                        {/* Manual Form */}
                        <TabsContent value="manual" className="space-y-6">
                            {/* Identificação */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Identificação
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* CNPJ (Busca) */}
                                    <div className="space-y-2">
                                        <Label>CNPJ</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="00.000.000/0000-00"
                                                value={profile.cnpj || ''}
                                                maxLength={18}
                                                onChange={(e) => updateProfile('cnpj', formatCNPJ(e.target.value))}
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={handleConsultarCNPJ}
                                                disabled={loadingCnpj}
                                            >
                                                {loadingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Razão Social */}
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Razão Social</Label>
                                        <Input
                                            placeholder="Nome da Empresa"
                                            value={profile.razao_social || ''}
                                            onChange={(e) => updateProfile('razao_social', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>CNAE Principal *</Label>
                                        <Input
                                            placeholder="0000-0/00"
                                            value={profile.cnae_principal}
                                            maxLength={9}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9/-]/g, '');
                                                updateProfile('cnae_principal', val);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Regime Atual</Label>
                                        <Select
                                            value={profile.regime_atual}
                                            onValueChange={(v) => updateProfile('regime_atual', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mei">MEI</SelectItem>
                                                <SelectItem value="simples">Simples Nacional</SelectItem>
                                                <SelectItem value="presumido">Lucro Presumido</SelectItem>
                                                <SelectItem value="real">Lucro Real</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Município / UF</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Município"
                                                value={profile.municipio || ''}
                                                onChange={(e) => updateProfile('municipio', e.target.value)}
                                                className="flex-1"
                                            />
                                            <Input
                                                placeholder="UF"
                                                maxLength={2}
                                                value={profile.uf || ''}
                                                onChange={(e) => updateProfile('uf', e.target.value.toUpperCase())}
                                                className="w-16"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Receita */}
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-green-500" />
                                        Receita Bruta
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Faturamento Mensal (Média) *</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                            <Input
                                                className="pl-10"
                                                placeholder="0,00"
                                                value={formatNumberForInput(profile.faturamento_mensal)}
                                                onChange={(e) => {
                                                    const val = parseCurrency(e.target.value);
                                                    updateProfile('faturamento_mensal', val);
                                                    updateProfile('faturamento_anual', val * 12);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Faturamento Anual (Projetado)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                            <Input
                                                className="pl-10 bg-muted/50 font-medium"
                                                readOnly
                                                value={formatNumberForInput(profile.faturamento_mensal * 12)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Despesas COM Crédito */}
                            <Card className="glass-card border-green-500/30">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Receipt className="h-5 w-5 text-green-500" />
                                            Despesas que GERAM Crédito (IBS/CBS)
                                        </CardTitle>
                                        <Badge className="bg-green-500/20 text-green-600">
                                            Total: {formatCurrency(totalDespesasComCredito)}/mês
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Na Reforma Tributária, essas despesas geram crédito de 25.5%
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            CMV / Mercadorias
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_com_credito.cmv)}
                                            onChange={(e) => updateProfile('despesas_com_credito.cmv', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Home className="h-4 w-4" />
                                            Aluguel
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_com_credito.aluguel)}
                                            onChange={(e) => updateProfile('despesas_com_credito.aluguel', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            Energia / Telecom
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_com_credito.energia_telecom)}
                                            onChange={(e) => updateProfile('despesas_com_credito.energia_telecom', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Serviços de PJ
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_com_credito.servicos_pj)}
                                            onChange={(e) => updateProfile('despesas_com_credito.servicos_pj', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Truck className="h-4 w-4" />
                                            Transporte / Frete
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_com_credito.transporte_frete)}
                                            onChange={(e) => updateProfile('despesas_com_credito.transporte_frete', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Wrench className="h-4 w-4" />
                                            Manutenção
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_com_credito.manutencao)}
                                            onChange={(e) => updateProfile('despesas_com_credito.manutencao', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Wallet className="h-4 w-4" />
                                            Tarifas Bancárias (Geram Crédito)
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_com_credito.tarifas_bancarias)}
                                            onChange={(e) => updateProfile('despesas_com_credito.tarifas_bancarias', parseCurrency(e.target.value))}
                                        />
                                    </div>

                                    {/* Mix de Fornecedores */}
                                    <div className="md:col-span-2 lg:col-span-3 pt-4 border-t mt-2">
                                        <Label className="mb-4 block flex items-center gap-2">
                                            <Store className="h-4 w-4" />
                                            Perfil de Fornecedores: % compras vindas do Simples Nacional
                                        </Label>
                                        <div className="flex items-center gap-4 px-2">
                                            <Slider
                                                defaultValue={[0]}
                                                max={100}
                                                step={5}
                                                value={[profile.percentual_fornecedores_simples || 0]}
                                                onValueChange={(vals) => updateProfile('percentual_fornecedores_simples', vals[0])}
                                                className="flex-1"
                                            />
                                            <span className="w-16 text-right font-bold border rounded p-1 bg-muted">
                                                {profile.percentual_fornecedores_simples || 0}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            ⚠️ Fornecedores do Simples geram crédito reduzido (~7%). O restante (Regime Normal) gera crédito cheio (26.5%).
                                        </p>
                                    </div>

                                    {/* Percentual de Compras que Geram Crédito */}
                                    <div className="md:col-span-2 lg:col-span-3 pt-4 border-t mt-2">
                                        <Label className="mb-4 block flex items-center gap-2">
                                            <Percent className="h-4 w-4" />
                                            % das Compras que Efetivamente Geram Crédito (IBS/CBS)
                                        </Label>
                                        <div className="flex items-center gap-4 px-2">
                                            <Slider
                                                defaultValue={[100]}
                                                max={100}
                                                step={5}
                                                value={[profile.percentual_compras_creditaveis ?? 100]}
                                                onValueChange={(vals) => updateProfile('percentual_compras_creditaveis', vals[0])}
                                                className="flex-1"
                                            />
                                            <span className="w-16 text-right font-bold border rounded p-1 bg-muted">
                                                {profile.percentual_compras_creditaveis ?? 100}%
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            💡 Indique quanto das suas compras totais gera crédito. Ex: se 30% são uso pessoal/veículos, coloque 70%.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Despesas SEM Crédito */}
                            <Card className="glass-card border-red-500/30">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-red-500" />
                                            Despesas SEM Crédito de IBS/CBS
                                        </CardTitle>
                                        <Badge className="bg-red-500/20 text-red-600">
                                            Total: {formatCurrency(totalDespesasSemCredito)}/mês
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        Essas despesas NÃO geram crédito na Reforma (ex: folha de pagamento)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Folha de Pagamento
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_sem_credito.folha_pagamento)}
                                            onChange={(e) => updateProfile('despesas_sem_credito.folha_pagamento', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Pró-labore</Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_sem_credito.pro_labore)}
                                            onChange={(e) => updateProfile('despesas_sem_credito.pro_labore', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Juros e Multas (Sem Crédito)
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_sem_credito.despesas_financeiras)}
                                            onChange={(e) => updateProfile('despesas_sem_credito.despesas_financeiras', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Scale className="h-4 w-4" />
                                            Tributos Atuais
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_sem_credito.tributos)}
                                            onChange={(e) => updateProfile('despesas_sem_credito.tributos', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Outras Despesas</Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.despesas_sem_credito.outras)}
                                            onChange={(e) => updateProfile('despesas_sem_credito.outras', parseCurrency(e.target.value))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Saldos Credores Legados */}
                            <Card className="glass-card border-blue-500/30">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-blue-500" />
                                            Saldos Credores Legados
                                        </CardTitle>
                                    </div>
                                    <CardDescription>
                                        Créditos acumulados que poderão ser utilizados na transição
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            Saldo PIS/COFINS (Acumulado até 2026)
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.saldo_credor_pis_cofins)}
                                            onChange={(e) => updateProfile('saldo_credor_pis_cofins', parseCurrency(e.target.value))}
                                        />
                                        <p className="text-xs text-muted-foreground">Poderá compensar débito de CBS a partir de 2027.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <MapIcon className="h-4 w-4" />
                                            Saldo ICMS (Acumulado até 2032)
                                        </Label>
                                        <Input
                                            placeholder="0,00"
                                            value={formatNumberForInput(profile.saldo_credor_icms)}
                                            onChange={(e) => updateProfile('saldo_credor_icms', parseCurrency(e.target.value))}
                                        />
                                        <p className="text-xs text-muted-foreground">Regra de uso em 240 meses a partir de 2033.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Text + AI */}
                        <TabsContent value="texto" className="space-y-4">
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5" />
                                        Descreva sua empresa
                                    </CardTitle>
                                    <CardDescription>
                                        A IA vai extrair as informações e estimar dados faltantes com base no setor
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Textarea
                                        placeholder="Ex: Somos uma consultoria de TI em São Paulo, CNAE 6201-5/00. Faturamos R$ 150 mil/mês, temos 8 funcionários com folha de R$ 50 mil. Pagamos R$ 12 mil de aluguel, R$ 3 mil de energia e internet. Contratamos serviços de design por R$ 8 mil/mês..."
                                        value={descricaoTexto}
                                        onChange={(e) => setDescricaoTexto(e.target.value)}
                                        className="min-h-[200px] resize-none"
                                    />
                                    <Button onClick={handleAIAnalysis} disabled={isProcessing} className="w-full">
                                        {isProcessing ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analisando...</>
                                        ) : (
                                            <><Sparkles className="mr-2 h-4 w-4" />Extrair com IA</>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Audio */}
                        <TabsContent value="audio" className="space-y-4">
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mic className="h-5 w-5" />
                                        Gravação de Voz
                                    </CardTitle>
                                    <CardDescription>
                                        Descreva os dados da empresa verbalmente. A IA ouvirá e processará o áudio.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col items-center gap-6 py-8">
                                    <div className="p-6 rounded-full bg-muted/50">
                                        <Mic className="h-12 w-12 text-primary opacity-50" />
                                    </div>
                                    <div className="w-full max-w-sm">
                                        <AudioRecorder
                                            onRecordingComplete={handleAudioRecording}
                                            isProcessing={isProcessing}
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground text-center max-w-md">
                                        Dicas: Fale sobre faturamento aproximado, número de funcionários, valor da folha, aluguel, e principal atividade (CNAE ou descrição).
                                    </p>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* File Import */}
                        <TabsContent value="arquivo" className="space-y-4">
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5" />
                                        Importar Arquivos
                                    </CardTitle>
                                    <CardDescription>
                                        SPED ECD/ECF, planilhas de despesas, relatórios contábeis
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div
                                        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.multiple = true;
                                            input.accept = '.xlsx,.xls,.txt,.pdf';
                                            input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
                                            input.click();
                                        }}
                                    >
                                        <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-lg font-medium">Arraste arquivos aqui</p>
                                        <p className="text-sm text-muted-foreground">Excel, SPED (.txt), PDF</p>
                                    </div>

                                    {uploadedFiles.length > 0 && (
                                        <div className="space-y-2">
                                            {uploadedFiles.map((file) => (
                                                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5" />
                                                        <div>
                                                            <p className="font-medium text-sm">{file.name}</p>
                                                            <p className="text-xs text-muted-foreground">{file.summary || `${(file.size / 1024).toFixed(1)} KB`}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {file.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                                                        {file.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                        {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                                        <Button variant="ghost" size="icon" onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Action Button */}
                    <div className="flex justify-end">
                        <Button size="lg" onClick={() => setCurrentStep('validation')}>
                            Validar Dados
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Validation */}
            {currentStep === 'validation' && (
                <div className="space-y-6">
                    {aiAnalysis && (
                        <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>Análise da IA ({aiAnalysis.confianca})</AlertTitle>
                            <AlertDescription>
                                <ul className="mt-2 space-y-1">
                                    {(Array.isArray(aiAnalysis.premissas)
                                        ? aiAnalysis.premissas
                                        : [aiAnalysis.premissas]
                                    ).map((p: string, i: number) => (
                                        <li key={i} className="text-sm">• {p}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Resumo do Perfil - Expandido */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Resumo do Perfil
                                {profile.faturamento_mensal * 12 > 3600000 && profile.regime_atual === 'simples' && (
                                    <Badge variant="outline" className="text-amber-500 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 transition-colors">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Simples Híbrido (Sublimite)
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>Dados da empresa e valores para cálculo</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Dados da Empresa */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Razão Social</p>
                                    <p className="font-semibold text-foreground truncate">{profile.razao_social || 'Não informada'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">CNPJ</p>
                                    <p className="font-mono text-foreground">{profile.cnpj || 'Não informado'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">CNAE Principal</p>
                                    <p className="font-semibold text-foreground">{profile.cnae_principal || 'Não informado'}</p>
                                    {cnaeInfo && <p className="text-xs text-muted-foreground truncate">{cnaeInfo.descricao}</p>}
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">UF</p>
                                    <p className="font-semibold text-foreground">{profile.uf || 'Não informada'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Regime Atual</p>
                                    <Badge variant="secondary" className="mt-1">
                                        {profile.regime_atual === 'simples' ? 'Simples Nacional' :
                                            profile.regime_atual === 'presumido' ? 'Lucro Presumido' :
                                                profile.regime_atual === 'real' ? 'Lucro Real' : 'Não definido'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Fornecedores Simples</p>
                                    <p className="font-semibold text-foreground">{profile.percentual_fornecedores_simples || 0}%</p>
                                </div>
                            </div>

                            {/* Valores Financeiros */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-green-500/10 text-center">
                                    <p className="text-sm text-muted-foreground">Faturamento Anual</p>
                                    <p className="text-xl font-bold text-green-500">
                                        {formatCurrency(profile.faturamento_mensal * 12)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-blue-500/10 text-center">
                                    <p className="text-sm text-muted-foreground">Despesas c/ Crédito</p>
                                    <p className="text-xl font-bold text-blue-500">
                                        {formatCurrency(totalDespesasComCredito * 12)}/ano
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-red-500/10 text-center">
                                    <p className="text-sm text-muted-foreground">Despesas s/ Crédito</p>
                                    <p className="text-xl font-bold text-red-500">
                                        {formatCurrency(totalDespesasSemCredito * 12)}/ano
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-primary/10 text-center">
                                    <p className="text-sm text-muted-foreground">Crédito Potencial Reforma</p>
                                    <p className="text-xl font-bold text-primary">
                                        {formatCurrency(totalDespesasComCredito * 12 * ALIQUOTA_IBS_CBS_PADRAO * (1 - getReducaoSetorial(profile.cnae_principal)))}/ano
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Preview gráfico de créditos */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Potencial de Crédito por Categoria
                            </CardTitle>
                            <CardDescription>
                                Quanto cada despesa gerará de crédito na Reforma Tributária
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={chartCreditos} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis type="number" tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                                    <YAxis type="category" dataKey="categoria" width={120} />
                                    <Tooltip
                                        formatter={(v: number) => formatCurrency(v)}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="credito_gerado" name="Crédito IBS/CBS" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setCurrentStep('input')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                        <Button onClick={handleCalculate}>
                            Calcular Regimes
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Dashboard */}
            {currentStep === 'dashboard' && results && (
                <div className="space-y-6">
                    {/* Recomendação */}
                    <Card className="glass-card border-primary/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-primary/20">
                                        <Target className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>Regime Recomendado</CardTitle>
                                        <CardDescription>Baseado nos dados informados</CardDescription>
                                    </div>
                                </div>
                                <Badge className="text-lg px-4 py-1 bg-primary text-primary-foreground">
                                    {results.melhor_atual.toUpperCase()}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 rounded-lg bg-green-500/10">
                                    <p className="text-sm text-muted-foreground">Economia vs 2º melhor</p>
                                    <p className="text-2xl font-bold text-green-500">
                                        {formatCurrency(results.economia_atual)}
                                    </p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                                    <p className="text-sm text-muted-foreground">Melhor Pós-Reforma</p>
                                    <p className="text-2xl font-bold text-blue-500">
                                        {results.melhor_pos_reforma.toUpperCase()}
                                    </p>
                                </div>
                                <div className={`text-center p-4 rounded-lg ${results.economia_com_reforma > 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                    <p className="text-sm text-muted-foreground">Economia c/ Reforma</p>
                                    <p className={`text-2xl font-bold ${results.economia_com_reforma > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {results.economia_com_reforma > 0 ? '+' : ''}{formatCurrency(results.economia_com_reforma)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gráfico Débito vs Crédito (O PULO DO GATO) */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Imposto Bruto vs Créditos Recuperados
                            </CardTitle>
                            <CardDescription>
                                A barra verde mostra os créditos que você recupera - esse é o diferencial da não-cumulatividade!
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={350}>
                                <ComposedChart data={chartComparacao}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="regime" />
                                    <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(v: number) => formatCurrency(v)}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="imposto_bruto" name="Imposto Bruto" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="creditos" name="Créditos Recuperados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                    <ReferenceLine y={0} stroke="#666" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Insights */}
                    {results.insights.length > 0 && (
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5" />
                                    Insights da Análise
                                    {isAnalyzingStrategically && (
                                        <Badge variant="outline" className="ml-2 animate-pulse bg-primary/10 text-primary border-primary/20">
                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                            IA Avançada Analisando...
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {strategicInsights.length > 0 ? (
                                    strategicInsights.map((insight: TaxInsight, i: number) => (
                                        <Alert key={i} className={
                                            insight.tipo === 'positivo' ? 'border-green-500/50 bg-green-500/5' :
                                                insight.tipo === 'negativo' ? 'border-red-500/50 bg-red-500/5' :
                                                    insight.tipo === 'alerta' ? 'border-yellow-500/50 bg-yellow-500/5' : ''
                                        }>
                                            {insight.tipo === 'positivo' && <TrendingUp className="h-4 w-4 text-green-500" />}
                                            {insight.tipo === 'negativo' && <TrendingDown className="h-4 w-4 text-red-500" />}
                                            {insight.tipo === 'alerta' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                            {insight.tipo === 'neutro' && <Info className="h-4 w-4" />}
                                            <AlertTitle className="font-bold">{insight.titulo}</AlertTitle>
                                            <AlertDescription>
                                                <p>{insight.descricao}</p>
                                                {insight.impacto_financeiro && insight.impacto_financeiro !== 0 && (
                                                    <p className={`mt-1 font-medium ${insight.impacto_financeiro > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        Impacto: {insight.impacto_financeiro > 0 ? '+' : ''}{formatCurrency(insight.impacto_financeiro)}/ano
                                                    </p>
                                                )}
                                                {insight.acao_sugerida && (
                                                    <p className="mt-1 text-sm font-semibold text-primary/80">💡 {insight.acao_sugerida}</p>
                                                )}
                                            </AlertDescription>
                                        </Alert>
                                    ))
                                ) : (
                                    !isAnalyzingStrategically && <p className="text-sm text-muted-foreground text-center py-4">Nenhum insight identificado.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Timeline da Reforma */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Transição da Reforma Tributária
                            </CardTitle>
                            <CardDescription>
                                Evolução dos tributos durante a transição (2026-2033)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartTimeline}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="ano" />
                                    <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(v: number) => formatCurrency(v)}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="tributos_antigos" name="Tributos Atuais" stackId="1" stroke="#94a3b8" fill="#94a3b8" />
                                    <Area type="monotone" dataKey="ibs_cbs" name="IBS/CBS" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Relatório Consultivo IA */}
                    {reportContent && (
                        <Card className="glass-card border-primary/30">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-primary/20">
                                            <ScrollText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle>Relatório Consultivo</CardTitle>
                                            <CardDescription>Análise estratégica gerada por IA</CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReportContent(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div
                                    className="prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-[600px] report-preview"
                                    dangerouslySetInnerHTML={{
                                        __html: convertMarkdownToHTML(reportContent)
                                    }}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setCurrentStep('validation')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Ajustar Dados
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleGenerateReport}
                                disabled={isGeneratingReport}
                            >
                                {isGeneratingReport ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Gerando...</>
                                ) : (
                                    <><ScrollText className="mr-2 h-4 w-4" />Relatório IA</>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleExportPDF}
                                disabled={!reportContent}
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                Exportar PDF
                            </Button>
                            <Button onClick={() => {
                                setCurrentStep('input');
                                setProfile(INITIAL_PROFILE);
                                setResults(null);
                                setAiAnalysis(null);
                                setReportContent(null);
                            }}>
                                Nova Análise
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
