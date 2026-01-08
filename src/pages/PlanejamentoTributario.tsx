/**
 * Planejamento Tributário
 * 
 * Página principal do módulo de análise de regimes tributários.
 * Wizard de 3 etapas: Entrada de Dados → Validação → Dashboard
 */

import { useState, useMemo, useCallback } from "react";
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
import {
    FileText,
    Mic,
    Upload,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,
    Building2,
    Calculator,
    TrendingUp,
    Users,
    DollarSign,
    Loader2,
    X,
    Eye,
    Edit2,
    Info,
    BarChart3,
    PieChart,
    Target,
    Lightbulb,
    AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    Cell
} from "recharts";

import {
    CompanyData,
    ComparisonResult,
    compareRegimes,
    getCnaeInfo,
    formatRegimeName,
    getRegimeColor
} from "@/lib/tax-planning-engine";
import { parseSpedFile, isSpedFile, getSpedSummary, SpedData } from "@/lib/sped-parser";
import { parseExcelFile, getExcelSummary, ExcelParseResult } from "@/lib/excel-parser";

// ============================================================================
// TYPES
// ============================================================================

type WizardStep = 'input' | 'validation' | 'dashboard';
type InputMode = 'text' | 'audio' | 'files';

interface ExtractedData {
    razao_social?: string;
    cnpj?: string;
    cnae_principal?: string;
    uf?: string;
    municipio?: string;
    faturamento_anual?: number;
    folha_pagamento_anual?: number;
    numero_funcionarios?: number;
    despesas_operacionais?: number;
    despesas_por_categoria?: Record<string, number>;
    confianca?: 'high' | 'medium' | 'low';
    fonte?: string;
}

interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    status: 'pending' | 'processing' | 'success' | 'error';
    data?: SpedData | ExcelParseResult | any;
    summary?: string;
    error?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PlanejamentoTributario() {
    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('input');
    const [inputMode, setInputMode] = useState<InputMode>('text');

    // Input state
    const [descricaoTexto, setDescricaoTexto] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Extracted/validated data
    const [extractedData, setExtractedData] = useState<ExtractedData>({});
    const [validatedData, setValidatedData] = useState<CompanyData | null>(null);

    // Results
    const [results, setResults] = useState<ComparisonResult | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);

    // ============================================================================
    // FILE HANDLING
    // ============================================================================

    const handleFileUpload = useCallback(async (files: FileList | null) => {
        if (!files) return;

        const newFiles: UploadedFile[] = [];

        for (const file of Array.from(files)) {
            const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            newFiles.push({
                id,
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                status: 'pending'
            });
        }

        setUploadedFiles(prev => [...prev, ...newFiles]);

        // Process files
        for (let i = 0; i < newFiles.length; i++) {
            const file = files[i];
            const uploadedFile = newFiles[i];

            setUploadedFiles(prev => prev.map(f =>
                f.id === uploadedFile.id ? { ...f, status: 'processing' } : f
            ));

            try {
                let result: any;
                let summary: string;

                // Check file type and process accordingly
                if (file.name.endsWith('.txt') || file.type === 'text/plain') {
                    const content = await file.text();

                    if (isSpedFile(content)) {
                        result = parseSpedFile(content);
                        summary = getSpedSummary(result);

                        // Extract data from SPED
                        if (result.empresa?.cnpj) {
                            setExtractedData(prev => ({
                                ...prev,
                                cnpj: result.empresa.cnpj,
                                razao_social: result.empresa.razao_social,
                                cnae_principal: result.empresa.cnae_principal,
                                uf: result.empresa.uf,
                                faturamento_anual: result.dre?.receita_bruta,
                                folha_pagamento_anual: result.folha_pagamento,
                                despesas_operacionais: result.dre?.despesas_operacionais,
                                fonte: 'SPED'
                            }));
                        }
                    } else {
                        // Plain text - treat as description
                        setDescricaoTexto(prev => prev + '\n' + content);
                        result = { type: 'text', content: content.substring(0, 200) + '...' };
                        summary = 'Texto adicionado à descrição';
                    }
                } else if (file.name.match(/\.(xlsx|xls)$/i)) {
                    result = await parseExcelFile(file, file.name);
                    summary = getExcelSummary(result);

                    // Extract data from Excel
                    if (result.sucesso && result.total > 0) {
                        setExtractedData(prev => ({
                            ...prev,
                            despesas_operacionais: result.total,
                            despesas_por_categoria: result.totaisPorCategoria,
                            fonte: 'Excel'
                        }));
                    }
                } else if (file.type === 'application/pdf') {
                    // PDF will be processed by AI
                    result = { type: 'pdf', needsAI: true };
                    summary = 'PDF pronto para análise com IA';
                } else {
                    throw new Error('Formato de arquivo não suportado');
                }

                setUploadedFiles(prev => prev.map(f =>
                    f.id === uploadedFile.id
                        ? { ...f, status: 'success', data: result, summary }
                        : f
                ));

            } catch (error) {
                setUploadedFiles(prev => prev.map(f =>
                    f.id === uploadedFile.id
                        ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Erro desconhecido' }
                        : f
                ));
            }
        }
    }, []);

    const removeFile = useCallback((id: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    // ============================================================================
    // ANALYSIS
    // ============================================================================

    const handleAnalyze = useCallback(async () => {
        setIsProcessing(true);

        try {
            // For now, use extracted data or mock data
            // In production, this would call the AI Edge Functions

            const mockExtracted: ExtractedData = {
                ...extractedData,
                razao_social: extractedData.razao_social || 'Empresa Exemplo Ltda',
                cnae_principal: extractedData.cnae_principal || '6201-5/00',
                faturamento_anual: extractedData.faturamento_anual || 2000000,
                folha_pagamento_anual: extractedData.folha_pagamento_anual || 400000,
                numero_funcionarios: extractedData.numero_funcionarios || 12,
                uf: extractedData.uf || 'SP',
                confianca: 'high',
                fonte: extractedData.fonte || 'Manual'
            };

            // If there's text description, extract more data
            if (descricaoTexto.trim()) {
                // Parse numbers from text
                const faturamentoMatch = descricaoTexto.match(/faturamento?\s*(?:de\s*)?r?\$?\s*([\d.,]+)\s*(mil|milhao|milhões|m|k)?/i);
                if (faturamentoMatch) {
                    let valor = parseFloat(faturamentoMatch[1].replace(/\./g, '').replace(',', '.'));
                    const multiplicador = faturamentoMatch[2];
                    if (multiplicador?.match(/mil|k/i)) valor *= 1000;
                    if (multiplicador?.match(/milh|m$/i)) valor *= 1000000;
                    mockExtracted.faturamento_anual = valor;
                }

                const funcionariosMatch = descricaoTexto.match(/(\d+)\s*funcion[aá]rios?/i);
                if (funcionariosMatch) {
                    mockExtracted.numero_funcionarios = parseInt(funcionariosMatch[1]);
                }

                const cnaeMatch = descricaoTexto.match(/cnae\s*[:=]?\s*([\d.-/]+)/i);
                if (cnaeMatch) {
                    mockExtracted.cnae_principal = cnaeMatch[1];
                }
            }

            setExtractedData(mockExtracted);
            setCurrentStep('validation');

            toast({
                title: "Dados extraídos",
                description: "Revise e confirme as informações antes de prosseguir."
            });

        } catch (error) {
            toast({
                title: "Erro na análise",
                description: error instanceof Error ? error.message : "Erro desconhecido",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    }, [extractedData, descricaoTexto]);

    const handleValidationComplete = useCallback(() => {
        // Convert extracted data to CompanyData
        const companyData: CompanyData = {
            razao_social: extractedData.razao_social,
            cnpj: extractedData.cnpj,
            cnae_principal: extractedData.cnae_principal || '6201-5/00',
            faturamento_anual: extractedData.faturamento_anual || 0,
            folha_pagamento_anual: extractedData.folha_pagamento_anual || 0,
            numero_funcionarios: extractedData.numero_funcionarios,
            despesas_operacionais: extractedData.despesas_operacionais,
            uf: extractedData.uf,
            municipio: extractedData.municipio
        };

        setValidatedData(companyData);

        // Calculate results
        const comparison = compareRegimes(companyData);
        setResults(comparison);

        setCurrentStep('dashboard');

        toast({
            title: "Análise concluída",
            description: `Regime recomendado: ${formatRegimeName(comparison.regime_mais_vantajoso)}`
        });
    }, [extractedData]);

    // ============================================================================
    // RENDER HELPERS
    // ============================================================================

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${(value * 100).toFixed(1)}%`;
    };

    const getStepIndex = (step: WizardStep): number => {
        const steps: WizardStep[] = ['input', 'validation', 'dashboard'];
        return steps.indexOf(step);
    };

    const getConfidenceBadge = (confidence?: 'high' | 'medium' | 'low') => {
        const variants = {
            high: { color: 'bg-green-500/20 text-green-400', label: 'Alta confiança' },
            medium: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Média confiança' },
            low: { color: 'bg-red-500/20 text-red-400', label: 'Baixa confiança' }
        };
        const v = variants[confidence || 'medium'];
        return <Badge className={v.color}>{v.label}</Badge>;
    };

    // ============================================================================
    // CHART DATA
    // ============================================================================

    const chartDataComparison = useMemo(() => {
        if (!results) return [];

        return [
            {
                name: 'Simples Nacional',
                imposto: results.simples_nacional.elegivel ? results.simples_nacional.imposto_anual : 0,
                elegivel: results.simples_nacional.elegivel,
                color: getRegimeColor('simples_nacional')
            },
            {
                name: 'Lucro Presumido',
                imposto: results.lucro_presumido.elegivel ? results.lucro_presumido.imposto_anual : 0,
                elegivel: results.lucro_presumido.elegivel,
                color: getRegimeColor('lucro_presumido')
            },
            {
                name: 'Lucro Real',
                imposto: results.lucro_real.imposto_anual,
                elegivel: true,
                color: getRegimeColor('lucro_real')
            }
        ].filter(d => d.elegivel && d.imposto > 0);
    }, [results]);

    const chartDataReforma = useMemo(() => {
        if (!results?.pos_reforma?.timeline) return [];

        return results.pos_reforma.timeline.map(year => ({
            ano: year.ano.toString(),
            'Tributos Atuais': year.tributos_atuais_reduzidos,
            'IBS/CBS': year.ibs_cbs_total,
            total: year.total
        }));
    }, [results]);

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
                        Análise inteligente de regimes tributários com projeções da reforma
                    </p>
                </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className={currentStep === 'input' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        1. Entrada de Dados
                    </span>
                    <span className={currentStep === 'validation' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        2. Validação
                    </span>
                    <span className={currentStep === 'dashboard' ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        3. Dashboard
                    </span>
                </div>
                <Progress value={(getStepIndex(currentStep) + 1) * 33.33} className="h-2" />
            </div>

            {/* Step 1: Input */}
            {currentStep === 'input' && (
                <div className="space-y-6">
                    {/* Input Mode Selection */}
                    <div className="flex gap-4">
                        <Button
                            variant={inputMode === 'text' ? 'default' : 'outline'}
                            onClick={() => setInputMode('text')}
                            className="flex-1"
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Texto
                        </Button>
                        <Button
                            variant={inputMode === 'audio' ? 'default' : 'outline'}
                            onClick={() => setInputMode('audio')}
                            className="flex-1"
                        >
                            <Mic className="mr-2 h-4 w-4" />
                            Áudio
                        </Button>
                        <Button
                            variant={inputMode === 'files' ? 'default' : 'outline'}
                            onClick={() => setInputMode('files')}
                            className="flex-1"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Arquivos
                        </Button>
                    </div>

                    {/* Text Input */}
                    {inputMode === 'text' && (
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Descreva sua empresa
                                </CardTitle>
                                <CardDescription>
                                    Descreva livremente as informações da empresa. A IA irá extrair os dados relevantes.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea
                                    placeholder="Ex: Somos uma software house de Dourados-MS, CNAE 6201-5/00. Faturamos R$ 2 milhões ano passado, temos 12 funcionários com folha de R$ 400 mil anual..."
                                    value={descricaoTexto}
                                    onChange={(e) => setDescricaoTexto(e.target.value)}
                                    className="min-h-[200px] resize-none"
                                />

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                    <span>Você também pode arrastar arquivos aqui (PDF, Excel, SPED)</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Audio Input */}
                    {inputMode === 'audio' && (
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mic className="h-5 w-5" />
                                    Gravação de Áudio
                                </CardTitle>
                                <CardDescription>
                                    Grave uma descrição falada da sua empresa (máx. 2 minutos)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Mic className="h-10 w-10 text-primary" />
                                </div>
                                <Button size="lg">
                                    <Mic className="mr-2 h-4 w-4" />
                                    Iniciar Gravação
                                </Button>
                                <p className="text-sm text-muted-foreground">
                                    Funcionalidade em desenvolvimento
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* File Upload */}
                    {inputMode === 'files' && (
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileSpreadsheet className="h-5 w-5" />
                                    Upload de Arquivos
                                </CardTitle>
                                <CardDescription>
                                    Arraste arquivos ou clique para selecionar (PDF, Excel, SPED ECD/ECF)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div
                                    className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        handleFileUpload(e.dataTransfer.files);
                                    }}
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.multiple = true;
                                        input.accept = '.pdf,.xlsx,.xls,.txt';
                                        input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
                                        input.click();
                                    }}
                                >
                                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium">Arraste arquivos aqui</p>
                                    <p className="text-sm text-muted-foreground">
                                        PDF, Excel (.xlsx, .xls), SPED (.txt)
                                    </p>
                                </div>

                                {/* Uploaded Files List */}
                                {uploadedFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Arquivos carregados ({uploadedFiles.length})</Label>
                                        {uploadedFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <p className="font-medium text-sm">{file.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {file.summary || `${(file.size / 1024).toFixed(1)} KB`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {file.status === 'processing' && (
                                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                    )}
                                                    {file.status === 'success' && (
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    )}
                                                    {file.status === 'error' && (
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeFile(file.id)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Manual Quick Input */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Dados Rápidos (opcional)
                            </CardTitle>
                            <CardDescription>
                                Preencha diretamente se já tiver os valores principais
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="faturamento">Faturamento Anual</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="faturamento"
                                            type="text"
                                            placeholder="2.000.000"
                                            className="pl-9"
                                            value={extractedData.faturamento_anual?.toLocaleString('pt-BR') || ''}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value.replace(/\D/g, ''));
                                                setExtractedData(prev => ({ ...prev, faturamento_anual: value || undefined }));
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="folha">Folha de Pagamento Anual</Label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="folha"
                                            type="text"
                                            placeholder="400.000"
                                            className="pl-9"
                                            value={extractedData.folha_pagamento_anual?.toLocaleString('pt-BR') || ''}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value.replace(/\D/g, ''));
                                                setExtractedData(prev => ({ ...prev, folha_pagamento_anual: value || undefined }));
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cnae">CNAE Principal</Label>
                                    <Input
                                        id="cnae"
                                        type="text"
                                        placeholder="6201-5/00"
                                        value={extractedData.cnae_principal || ''}
                                        onChange={(e) => setExtractedData(prev => ({ ...prev, cnae_principal: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Button */}
                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            onClick={handleAnalyze}
                            disabled={isProcessing || (!descricaoTexto.trim() && uploadedFiles.length === 0 && !extractedData.faturamento_anual)}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Analisando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Analisar com IA
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Validation */}
            {currentStep === 'validation' && (
                <div className="space-y-6">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Revise os dados extraídos</AlertTitle>
                        <AlertDescription>
                            Confirme ou corrija as informações antes de prosseguir com o cálculo.
                        </AlertDescription>
                    </Alert>

                    <Card className="glass-card">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Dados da Empresa</CardTitle>
                                    <CardDescription>
                                        Fonte: {extractedData.fonte || 'Manual'}
                                    </CardDescription>
                                </div>
                                {getConfidenceBadge(extractedData.confianca)}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Company Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Razão Social</Label>
                                    <Input
                                        value={extractedData.razao_social || ''}
                                        onChange={(e) => setExtractedData(prev => ({ ...prev, razao_social: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>CNPJ</Label>
                                    <Input
                                        value={extractedData.cnpj || ''}
                                        onChange={(e) => setExtractedData(prev => ({ ...prev, cnpj: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Financial Data */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>CNAE Principal *</Label>
                                    <Input
                                        value={extractedData.cnae_principal || ''}
                                        onChange={(e) => setExtractedData(prev => ({ ...prev, cnae_principal: e.target.value }))}
                                        required
                                    />
                                    {extractedData.cnae_principal && getCnaeInfo(extractedData.cnae_principal) && (
                                        <p className="text-xs text-muted-foreground">
                                            {getCnaeInfo(extractedData.cnae_principal)?.descricao}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>UF</Label>
                                    <Input
                                        value={extractedData.uf || ''}
                                        onChange={(e) => setExtractedData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                                        maxLength={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Município</Label>
                                    <Input
                                        value={extractedData.municipio || ''}
                                        onChange={(e) => setExtractedData(prev => ({ ...prev, municipio: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Faturamento Anual *</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                        <Input
                                            type="text"
                                            className="pl-10"
                                            value={extractedData.faturamento_anual?.toLocaleString('pt-BR') || ''}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value.replace(/\D/g, ''));
                                                setExtractedData(prev => ({ ...prev, faturamento_anual: value || undefined }));
                                            }}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Folha de Pagamento Anual *</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                        <Input
                                            type="text"
                                            className="pl-10"
                                            value={extractedData.folha_pagamento_anual?.toLocaleString('pt-BR') || ''}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value.replace(/\D/g, ''));
                                                setExtractedData(prev => ({ ...prev, folha_pagamento_anual: value || undefined }));
                                            }}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Nº Funcionários</Label>
                                    <Input
                                        type="number"
                                        value={extractedData.numero_funcionarios || ''}
                                        onChange={(e) => setExtractedData(prev => ({
                                            ...prev,
                                            numero_funcionarios: parseInt(e.target.value) || undefined
                                        }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Despesas Operacionais Anuais</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                                        <Input
                                            type="text"
                                            className="pl-10"
                                            value={extractedData.despesas_operacionais?.toLocaleString('pt-BR') || ''}
                                            onChange={(e) => {
                                                const value = parseFloat(e.target.value.replace(/\D/g, ''));
                                                setExtractedData(prev => ({ ...prev, despesas_operacionais: value || undefined }));
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Usado para cálculo do Lucro Real
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Navigation */}
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep('input')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                        <Button
                            onClick={handleValidationComplete}
                            disabled={!extractedData.faturamento_anual || !extractedData.folha_pagamento_anual}
                        >
                            Calcular Regimes
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Dashboard */}
            {currentStep === 'dashboard' && results && (
                <div className="space-y-6">
                    {/* Recommendation Card */}
                    <Card className="glass-card border-primary/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-full bg-primary/20">
                                        <Target className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle>Regime Recomendado</CardTitle>
                                        <CardDescription>Baseado nos dados fornecidos</CardDescription>
                                    </div>
                                </div>
                                <Badge className="text-lg px-4 py-1 bg-primary text-primary-foreground">
                                    {formatRegimeName(results.regime_mais_vantajoso)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 rounded-lg bg-green-500/10">
                                    <p className="text-sm text-muted-foreground">Economia Anual</p>
                                    <p className="text-2xl font-bold text-green-500">
                                        {formatCurrency(results.economia_anual)}
                                    </p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-primary/10">
                                    <p className="text-sm text-muted-foreground">Economia %</p>
                                    <p className="text-2xl font-bold text-primary">
                                        {results.economia_percentual.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/30">
                                    <p className="text-sm text-muted-foreground">Imposto Anual</p>
                                    <p className="text-2xl font-bold">
                                        {formatCurrency(
                                            results.regime_mais_vantajoso === 'simples_nacional'
                                                ? results.simples_nacional.imposto_anual
                                                : results.regime_mais_vantajoso === 'lucro_presumido'
                                                    ? results.lucro_presumido.imposto_anual
                                                    : results.lucro_real.imposto_anual
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comparison Chart */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Comparação de Regimes
                            </CardTitle>
                            <CardDescription>
                                Imposto anual em cada regime tributário
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartDataComparison}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar dataKey="imposto" name="Imposto Anual" radius={[4, 4, 0, 0]}>
                                        {chartDataComparison.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.name === formatRegimeName(results.regime_mais_vantajoso)
                                                    ? 'hsl(var(--primary))'
                                                    : 'hsl(var(--muted-foreground))'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Regime Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Simples Nacional */}
                        <Card className={`glass-card ${!results.simples_nacional.elegivel ? 'opacity-60' : ''}`}>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    Simples Nacional
                                    {results.regime_mais_vantajoso === 'simples_nacional' && (
                                        <Badge className="bg-primary">Recomendado</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {results.simples_nacional.elegivel ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Anexo</span>
                                            <span className="font-medium">{results.simples_nacional.anexo}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Alíquota Efetiva</span>
                                            <span className="font-medium">{formatPercent(results.simples_nacional.aliquota_efetiva)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Fator R</span>
                                            <span className="font-medium">{formatPercent(results.simples_nacional.fator_r)}</span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-bold">
                                            <span>Imposto Anual</span>
                                            <span>{formatCurrency(results.simples_nacional.imposto_anual)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            {results.simples_nacional.motivo_inelegibilidade}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Lucro Presumido */}
                        <Card className={`glass-card ${!results.lucro_presumido.elegivel ? 'opacity-60' : ''}`}>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    Lucro Presumido
                                    {results.regime_mais_vantajoso === 'lucro_presumido' && (
                                        <Badge className="bg-primary">Recomendado</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {results.lucro_presumido.elegivel ? (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Presunção</span>
                                            <span className="font-medium">{formatPercent(results.lucro_presumido.base_presuncao_irpj)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">IRPJ + Adicional</span>
                                            <span className="font-medium">
                                                {formatCurrency(results.lucro_presumido.irpj + results.lucro_presumido.irpj_adicional)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">CSLL</span>
                                            <span className="font-medium">{formatCurrency(results.lucro_presumido.csll)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">PIS/COFINS</span>
                                            <span className="font-medium">
                                                {formatCurrency(results.lucro_presumido.pis + results.lucro_presumido.cofins)}
                                            </span>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between font-bold">
                                            <span>Imposto Anual</span>
                                            <span>{formatCurrency(results.lucro_presumido.imposto_anual)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground">
                                            {results.lucro_presumido.motivo_inelegibilidade}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Lucro Real */}
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center justify-between">
                                    Lucro Real
                                    {results.regime_mais_vantajoso === 'lucro_real' && (
                                        <Badge className="bg-primary">Recomendado</Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Lucro Tributável</span>
                                    <span className="font-medium">{formatCurrency(results.lucro_real.lucro_tributavel)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">IRPJ + Adicional</span>
                                    <span className="font-medium">
                                        {formatCurrency(results.lucro_real.irpj + results.lucro_real.irpj_adicional)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Créditos PIS/COFINS</span>
                                    <span className="font-medium text-green-500">
                                        -{formatCurrency(results.lucro_real.creditos_pis_cofins)}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Imposto Anual</span>
                                    <span>{formatCurrency(results.lucro_real.imposto_anual)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tax Reform Timeline */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Impacto da Reforma Tributária
                            </CardTitle>
                            <CardDescription>
                                Projeção da transição para IBS/CBS (2026-2033)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartDataReforma}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis dataKey="ano" />
                                    <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="Tributos Atuais"
                                        stackId="1"
                                        stroke="hsl(var(--muted-foreground))"
                                        fill="hsl(var(--muted))"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="IBS/CBS"
                                        stackId="1"
                                        stroke="hsl(var(--primary))"
                                        fill="hsl(var(--primary) / 0.5)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                <div className="p-4 rounded-lg bg-muted/30 text-center">
                                    <p className="text-sm text-muted-foreground">Imposto Atual</p>
                                    <p className="text-xl font-bold">
                                        {formatCurrency(results.pos_reforma.timeline[0]?.tributos_atuais || 0)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/30 text-center">
                                    <p className="text-sm text-muted-foreground">Imposto 2033</p>
                                    <p className="text-xl font-bold">
                                        {formatCurrency(results.pos_reforma.imposto_2033)}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-lg text-center ${results.pos_reforma.variacao_vs_atual > 0
                                    ? 'bg-red-500/10'
                                    : 'bg-green-500/10'
                                    }`}>
                                    <p className="text-sm text-muted-foreground">Variação</p>
                                    <p className={`text-xl font-bold ${results.pos_reforma.variacao_vs_atual > 0
                                        ? 'text-red-500'
                                        : 'text-green-500'
                                        }`}>
                                        {results.pos_reforma.variacao_vs_atual > 0 ? '+' : ''}
                                        {results.pos_reforma.variacao_percentual.toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            {results.pos_reforma.reducao_setorial && results.pos_reforma.reducao_setorial > 0 && (
                                <Alert className="mt-4">
                                    <Lightbulb className="h-4 w-4" />
                                    <AlertTitle>Redução Setorial</AlertTitle>
                                    <AlertDescription>
                                        O setor {results.pos_reforma.setor} tem redução de {(results.pos_reforma.reducao_setorial * 100).toFixed(0)}%
                                        na alíquota do IBS/CBS pela reforma tributária.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Observations */}
                    {(results.simples_nacional.observacoes.length > 0 ||
                        results.lucro_presumido.observacoes.length > 0 ||
                        results.lucro_real.observacoes.length > 0) && (
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Info className="h-5 w-5" />
                                        Observações
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {[
                                            ...results.simples_nacional.observacoes.map(o => ({ regime: 'Simples', obs: o })),
                                            ...results.lucro_presumido.observacoes.map(o => ({ regime: 'LP', obs: o })),
                                            ...results.lucro_real.observacoes.map(o => ({ regime: 'LR', obs: o })),
                                            ...results.pos_reforma.observacoes.map(o => ({ regime: 'Reforma', obs: o }))
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm">
                                                <Badge variant="outline" className="shrink-0">{item.regime}</Badge>
                                                <span className="text-muted-foreground">{item.obs}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                    {/* Navigation */}
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep('validation')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Exportar PDF
                            </Button>
                            <Button onClick={() => {
                                setCurrentStep('input');
                                setExtractedData({});
                                setValidatedData(null);
                                setResults(null);
                                setUploadedFiles([]);
                                setDescricaoTexto('');
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
