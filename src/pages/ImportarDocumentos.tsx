import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    FileText,
    Building2,
    Table2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X,
    Download,
    Eye,
    Save,
    ArrowRight,
    Calculator
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
    parseCNPJCard,
    parseBalancete,
    parsePlanoContas,
    validateCNPJ,
    formatCNPJ,
    filterContasSinteticas,
    balanceteToTaxProfile,
    saveProfileToLocalStorage,
    CNPJData,
    BalanceteData,
    PlanoContasData,
    ParseResult,
} from '@/lib/parsers';

// Função utilitária para leitura de arquivos de texto
async function readFileAsText(file: File, encoding: string = 'latin1'): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file, encoding);
    });
}

// Função para extrair texto de PDF usando pdf.js via CDN
async function extractTextFromPDF(file: File): Promise<string> {
    // @ts-ignore - pdfjs carregado via CDN
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
        throw new Error('PDF.js não está carregado. Recarregue a página.');
    }

    console.log('[PDF Parser] Iniciando extração do PDF:', file.name);

    try {
        const arrayBuffer = await file.arrayBuffer();
        console.log('[PDF Parser] ArrayBuffer obtido, tamanho:', arrayBuffer.byteLength);

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        console.log('[PDF Parser] PDF carregado, páginas:', pdf.numPages);

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
            console.log(`[PDF Parser] Página ${i} processada, caracteres:`, pageText.length);
        }

        console.log('[PDF Parser] Extração completa, total de caracteres:', fullText.length);
        return fullText;
    } catch (error) {
        console.error('[PDF Parser] Erro ao extrair PDF:', error);
        throw new Error(`Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
}

// Tipos para estado do componente
type DocumentType = 'cnpj' | 'balancete' | 'plano_contas';

interface ParsedDocument {
    type: DocumentType;
    fileName: string;
    data: CNPJData | BalanceteData | PlanoContasData;
    warnings?: string[];
}

interface UploadState {
    isLoading: boolean;
    error: string | null;
    result: ParsedDocument | null;
}

// Componente para zona de drop
const DropZone: React.FC<{
    onFileDrop: (file: File) => void;
    isLoading: boolean;
    accept: string;
    description: string;
}> = ({ onFileDrop, isLoading, accept, description }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onFileDrop(files[0]);
        }
    }, [onFileDrop]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileDrop(files[0]);
        }
    }, [onFileDrop]);

    return (
        <div
            className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
        ${isDragging
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }
        ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
      `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
        >
            <input
                id="file-input"
                type="file"
                accept={accept}
                onChange={handleFileInput}
                className="hidden"
            />

            {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <p className="text-muted-foreground">Processando documento...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-primary/10">
                        <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">
                            Arraste um arquivo ou clique para selecionar
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {description}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente para exibir dados do CNPJ
const CNPJPreview: React.FC<{ data: CNPJData }> = ({ data }) => {
    const isValid = validateCNPJ(data.cnpj);

    return (
        <div className="space-y-6">
            {/* Header com CNPJ */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="text-2xl font-bold font-mono">{formatCNPJ(data.cnpj)}</p>
                </div>
                <Badge variant={isValid ? 'default' : 'destructive'} className="gap-1">
                    {isValid ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    {isValid ? 'Válido' : 'Inválido'}
                </Badge>
            </div>

            <Separator />

            {/* Informações principais */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Razão Social</p>
                    <p className="font-medium">{data.razaoSocial || '-'}</p>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                    <p className="font-medium">{data.nomeFantasia || '-'}</p>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Porte</p>
                    <Badge variant="outline">{data.porte}</Badge>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Data de Abertura</p>
                    <p className="font-medium">{data.dataAbertura || '-'}</p>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Natureza Jurídica</p>
                    <p className="font-medium">
                        {data.naturezaJuridica.codigo} - {data.naturezaJuridica.descricao}
                    </p>
                </div>

                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Situação</p>
                    <Badge
                        variant={data.situacaoCadastral.status === 'ATIVA' ? 'default' : 'destructive'}
                        className="gap-1"
                    >
                        {data.situacaoCadastral.status}
                    </Badge>
                </div>
            </div>

            <Separator />

            {/* CNAE */}
            <div className="space-y-3">
                <h4 className="font-semibold">Atividade Econômica Principal</h4>
                <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-mono text-sm text-primary">{data.cnaePrincipal.codigo}</p>
                    <p className="text-sm mt-1">{data.cnaePrincipal.descricao}</p>
                </div>

                {data.cnaesSecundarios.length > 0 && (
                    <>
                        <h4 className="font-semibold mt-4">Atividades Secundárias</h4>
                        <div className="space-y-2">
                            {data.cnaesSecundarios.map((cnae, i) => (
                                <div key={i} className="p-2 rounded bg-muted/30 text-sm">
                                    <span className="font-mono text-primary">{cnae.codigo}</span>
                                    <span className="mx-2">-</span>
                                    <span className="text-muted-foreground">{cnae.descricao}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <Separator />

            {/* Endereço e Contato */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <h4 className="font-semibold">Endereço</h4>
                    <p className="text-sm text-muted-foreground">
                        {data.endereco.logradouro}, {data.endereco.numero}
                        {data.endereco.complemento && ` - ${data.endereco.complemento}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {data.endereco.bairro} - {data.endereco.municipio}/{data.endereco.uf}
                    </p>
                    <p className="text-sm font-mono">{data.endereco.cep}</p>
                </div>

                <div className="space-y-2">
                    <h4 className="font-semibold">Contato</h4>
                    <p className="text-sm text-muted-foreground">{data.contato.email || '-'}</p>
                    <p className="text-sm text-muted-foreground">{data.contato.telefone || '-'}</p>
                </div>
            </div>
        </div>
    );
};

// Componente para exibir dados do Balancete
const BalancetePreview: React.FC<{ data: BalanceteData }> = ({ data }) => {
    const contasSinteticas = useMemo(() => filterContasSinteticas(data.contas), [data.contas]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">Empresa</p>
                    <p className="text-xl font-bold">{data.empresa}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                    {data.periodo.inicio} a {data.periodo.fim}
                </Badge>
            </div>

            <Separator />

            {/* Resumo DRE */}
            <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                    <Table2 className="h-4 w-4" />
                    Resumo DRE (Média Mensal)
                </h4>

                <div className="grid gap-3">
                    {/* Receita Bruta */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-success/10 border border-success/20">
                        <span className="font-medium">Receita Bruta</span>
                        <span className="text-success font-bold">{formatCurrency(data.resumoDRE.receitaBruta)}</span>
                    </div>

                    {/* Deduções */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">(-) Deduções</span>
                        <span className="text-destructive">{formatCurrency(-data.resumoDRE.deducoes)}</span>
                    </div>

                    {/* Receita Líquida */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                        <span className="font-medium">(=) Receita Líquida</span>
                        <span className="font-bold">{formatCurrency(data.resumoDRE.receitaLiquida)}</span>
                    </div>

                    {/* CMV */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">(-) CMV</span>
                        <span className="text-destructive">{formatCurrency(-data.resumoDRE.cmv)}</span>
                    </div>

                    {/* Lucro Bruto */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="font-medium">(=) Lucro Bruto</span>
                        <span className="text-primary font-bold">{formatCurrency(data.resumoDRE.lucroBruto)}</span>
                    </div>

                    {/* Despesas */}
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">(-) Despesas Operacionais</span>
                        <span className="text-destructive">{formatCurrency(-data.resumoDRE.despesasOperacionais)}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">(-) Despesas Tributárias</span>
                        <span className="text-destructive">{formatCurrency(-data.resumoDRE.despesasTributarias)}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">(-) Despesas Financeiras</span>
                        <span className="text-destructive">{formatCurrency(-data.resumoDRE.despesasFinanceiras)}</span>
                    </div>

                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                        <span className="text-muted-foreground">(+) Receitas Financeiras</span>
                        <span className="text-success">{formatCurrency(data.resumoDRE.receitasFinanceiras)}</span>
                    </div>

                    {/* Resultado */}
                    <div className={`flex justify-between items-center p-4 rounded-lg border-2 ${data.resumoDRE.resultadoOperacional >= 0
                        ? 'bg-success/10 border-success'
                        : 'bg-destructive/10 border-destructive'
                        }`}>
                        <span className="font-bold">(=) Resultado Operacional</span>
                        <span className={`text-xl font-bold ${data.resumoDRE.resultadoOperacional >= 0 ? 'text-success' : 'text-destructive'
                            }`}>
                            {formatCurrency(data.resumoDRE.resultadoOperacional)}
                        </span>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Tabela de contas */}
            <div className="space-y-3">
                <h4 className="font-semibold">Contas Sintéticas ({contasSinteticas.length})</h4>
                <ScrollArea className="h-[300px] rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Código</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead className="text-right">Média</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contasSinteticas.slice(0, 50).map((conta) => (
                                <TableRow key={conta.codigo}>
                                    <TableCell className="font-mono text-sm">{conta.codigo}</TableCell>
                                    <TableCell className="text-sm">{conta.nome}</TableCell>
                                    <TableCell className={`text-right font-medium ${conta.natureza === 'C' ? 'text-success' : ''
                                        }`}>
                                        {formatCurrency(conta.media)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>
        </div>
    );
};

// Componente para exibir Plano de Contas
const PlanoContasPreview: React.FC<{ data: PlanoContasData }> = ({ data }) => {
    const [filterTipo, setFilterTipo] = useState<string>('all');

    const contasFiltradas = useMemo(() => {
        if (filterTipo === 'all') return data.contas.slice(0, 100);
        return data.contas.filter(c => c.tipo === filterTipo).slice(0, 100);
    }, [data.contas, filterTipo]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">Plano de Contas</p>
                    <p className="text-xl font-bold">{data.empresa}</p>
                </div>
                <Badge variant="outline">{data.contas.length} contas</Badge>
            </div>

            <Separator />

            {/* Filtros */}
            <div className="flex gap-2 flex-wrap">
                {['all', 'ATIVO', 'PASSIVO', 'RECEITA', 'CUSTO', 'DESPESA'].map((tipo) => (
                    <Button
                        key={tipo}
                        size="sm"
                        variant={filterTipo === tipo ? 'default' : 'outline'}
                        onClick={() => setFilterTipo(tipo)}
                    >
                        {tipo === 'all' ? 'Todas' : tipo}
                    </Button>
                ))}
            </div>

            {/* Tabela */}
            <ScrollArea className="h-[400px] rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Código</TableHead>
                            <TableHead className="w-[120px]">Classificação</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead className="w-[80px]">Tipo</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contasFiltradas.map((conta) => (
                            <TableRow key={conta.codigo}>
                                <TableCell className="font-mono text-sm">{conta.codigo}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {conta.classificacao}
                                </TableCell>
                                <TableCell
                                    className="text-sm"
                                    style={{ paddingLeft: `${conta.nivel * 16}px` }}
                                >
                                    {conta.nome}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                        {conta.tipo}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
};

// Página principal
export default function ImportarDocumentos() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<DocumentType>('cnpj');
    const [uploadStates, setUploadStates] = useState<Record<DocumentType, UploadState>>({
        cnpj: { isLoading: false, error: null, result: null },
        balancete: { isLoading: false, error: null, result: null },
        plano_contas: { isLoading: false, error: null, result: null },
    });

    // Handler para enviar dados do balancete para o Planejamento Tributário
    const handleSendToTaxPlanning = useCallback((balanceteData: BalanceteData) => {
        // Verifica se temos dados do CNPJ também
        const cnpjData = uploadStates.cnpj.result?.data as CNPJData | undefined;

        // Converte balancete para TaxProfile
        const taxProfile = balanceteToTaxProfile(balanceteData, cnpjData);

        // Salva no localStorage para o Planejamento Tributário carregar
        saveProfileToLocalStorage(taxProfile);

        toast({
            title: 'Dados enviados!',
            description: 'Os dados do balancete foram preparados para o Planejamento Tributário.',
        });

        // Navega para o Planejamento Tributário
        navigate('/planejamento');
    }, [uploadStates.cnpj.result, toast, navigate]);

    // Handler para processar arquivo
    const handleFileDrop = useCallback(async (file: File, type: DocumentType) => {
        console.log(`[Upload] Iniciando processamento: ${file.name}, tipo: ${type}`);

        setUploadStates(prev => ({
            ...prev,
            [type]: { isLoading: true, error: null, result: null }
        }));

        try {
            let content: string;

            // Lê o arquivo
            if (type === 'cnpj' && file.name.toLowerCase().endsWith('.pdf')) {
                // Para PDF, usar extração de texto via pdf.js
                console.log('[Upload] Extraindo texto de PDF...');
                content = await extractTextFromPDF(file);
            } else {
                // Para TXT/CSV, leitura direta
                console.log('[Upload] Lendo arquivo de texto...');
                content = await readFileAsText(file, 'latin1');
            }

            console.log(`[Upload] Conteúdo lido, tamanho: ${content.length} caracteres`);
            console.log('[Upload] Primeiros 200 caracteres:', content.substring(0, 200));

            // Parse conforme o tipo
            let result: ParsedDocument;

            switch (type) {
                case 'cnpj': {
                    const parsed = parseCNPJCard(content);
                    if (!parsed.success) {
                        const errorResult = parsed as { success: false; error: string; details?: string };
                        throw new Error(errorResult.error + (errorResult.details ? `: ${errorResult.details}` : ''));
                    }
                    const successResult = parsed as { success: true; data: CNPJData; warnings?: string[] };
                    result = {
                        type: 'cnpj',
                        fileName: file.name,
                        data: successResult.data,
                        warnings: successResult.warnings,
                    };
                    break;
                }

                case 'balancete': {
                    const parsed = parseBalancete(content);
                    if (!parsed.success) {
                        const errorResult = parsed as { success: false; error: string; details?: string };
                        throw new Error(errorResult.error + (errorResult.details ? `: ${errorResult.details}` : ''));
                    }
                    const successResult = parsed as { success: true; data: BalanceteData; warnings?: string[] };
                    result = {
                        type: 'balancete',
                        fileName: file.name,
                        data: successResult.data,
                        warnings: successResult.warnings,
                    };
                    break;
                }

                case 'plano_contas': {
                    const parsed = parsePlanoContas(content);
                    if (!parsed.success) {
                        const errorResult = parsed as { success: false; error: string; details?: string };
                        throw new Error(errorResult.error + (errorResult.details ? `: ${errorResult.details}` : ''));
                    }
                    const successResult = parsed as { success: true; data: PlanoContasData; warnings?: string[] };
                    result = {
                        type: 'plano_contas',
                        fileName: file.name,
                        data: successResult.data,
                        warnings: successResult.warnings,
                    };
                    break;
                }
            }

            setUploadStates(prev => ({
                ...prev,
                [type]: { isLoading: false, error: null, result }
            }));

            toast({
                title: 'Documento processado!',
                description: `${file.name} foi processado com sucesso.`,
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao processar arquivo';

            setUploadStates(prev => ({
                ...prev,
                [type]: { isLoading: false, error: errorMessage, result: null }
            }));

            toast({
                title: 'Erro ao processar',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    }, [toast]);

    // Limpar resultado
    const clearResult = useCallback((type: DocumentType) => {
        setUploadStates(prev => ({
            ...prev,
            [type]: { isLoading: false, error: null, result: null }
        }));
    }, []);

    // Configurações por tipo de documento
    const documentConfigs = {
        cnpj: {
            icon: Building2,
            title: 'Cartão CNPJ',
            description: 'PDF do cartão CNPJ emitido pela Receita Federal',
            accept: '.pdf',
            acceptDescription: 'Aceita arquivos PDF',
        },
        balancete: {
            icon: Table2,
            title: 'Balancete Comparativo',
            description: 'Arquivo TXT exportado do SCI Sucessor',
            accept: '.txt',
            acceptDescription: 'Aceita arquivos TXT (formato SCI Sucessor)',
        },
        plano_contas: {
            icon: FileText,
            title: 'Plano de Contas',
            description: 'Arquivo CSV com estrutura do plano de contas',
            accept: '.csv',
            acceptDescription: 'Aceita arquivos CSV',
        },
    };

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-5xl">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Importar Documentos</h1>
                <p className="text-muted-foreground">
                    Faça upload de documentos contábeis para extração automática de dados.
                    Todo o processamento ocorre localmente no seu navegador.
                </p>
            </div>

            {/* Tabs de tipos de documento */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocumentType)}>
                <TabsList className="grid w-full grid-cols-3">
                    {Object.entries(documentConfigs).map(([key, config]) => {
                        const Icon = config.icon;
                        const state = uploadStates[key as DocumentType];
                        return (
                            <TabsTrigger key={key} value={key} className="gap-2">
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{config.title}</span>
                                {state.result && (
                                    <CheckCircle2 className="h-3 w-3 text-success" />
                                )}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {Object.entries(documentConfigs).map(([key, config]) => {
                    const type = key as DocumentType;
                    const state = uploadStates[type];

                    return (
                        <TabsContent key={key} value={key} className="space-y-4">
                            <Card className="glass-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <config.icon className="h-5 w-5 text-primary" />
                                        {config.title}
                                    </CardTitle>
                                    <CardDescription>
                                        {config.description}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Zona de upload ou preview */}
                                    {!state.result ? (
                                        <>
                                            <DropZone
                                                onFileDrop={(file) => handleFileDrop(file, type)}
                                                isLoading={state.isLoading}
                                                accept={config.accept}
                                                description={config.acceptDescription}
                                            />

                                            {state.error && (
                                                <Alert variant="destructive">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Erro</AlertTitle>
                                                    <AlertDescription>{state.error}</AlertDescription>
                                                </Alert>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* Header do resultado */}
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                                    <span className="font-medium">{state.result.fileName}</span>
                                                </div>
                                                <div className="flex gap-2 flex-wrap">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => clearResult(type)}
                                                    >
                                                        <X className="h-4 w-4 mr-1" />
                                                        Limpar
                                                    </Button>
                                                    {type === 'balancete' && (
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            className="bg-primary"
                                                            onClick={() => handleSendToTaxPlanning(state.result?.data as BalanceteData)}
                                                        >
                                                            <Calculator className="h-4 w-4 mr-1" />
                                                            Enviar p/ Planejamento
                                                            <ArrowRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="outline">
                                                        <Save className="h-4 w-4 mr-1" />
                                                        Salvar
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Warnings */}
                                            {state.result.warnings && state.result.warnings.length > 0 && (
                                                <Alert>
                                                    <AlertCircle className="h-4 w-4" />
                                                    <AlertTitle>Avisos</AlertTitle>
                                                    <AlertDescription>
                                                        <ul className="list-disc list-inside">
                                                            {state.result.warnings.map((w, i) => (
                                                                <li key={i}>{w}</li>
                                                            ))}
                                                        </ul>
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            {/* Preview dos dados */}
                                            <Card>
                                                <CardContent className="pt-6">
                                                    {type === 'cnpj' && (
                                                        <CNPJPreview data={state.result.data as CNPJData} />
                                                    )}
                                                    {type === 'balancete' && (
                                                        <BalancetePreview data={state.result.data as BalanceteData} />
                                                    )}
                                                    {type === 'plano_contas' && (
                                                        <PlanoContasPreview data={state.result.data as PlanoContasData} />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    );
                })}
            </Tabs>

            {/* Informações */}
            <Card className="bg-muted/30 border-dashed">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Eye className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-semibold">Processamento Local</h4>
                            <p className="text-sm text-muted-foreground">
                                Seus documentos são processados inteiramente no navegador.
                                Nenhum dado é enviado para servidores externos durante a extração.
                                Após a validação, você pode optar por salvar os dados no sistema.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
