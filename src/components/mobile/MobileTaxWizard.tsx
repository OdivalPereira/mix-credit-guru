import { useState, Component, ErrorInfo, ReactNode } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Check, Building2, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { AiInterviewWizard } from "./AiInterviewWizard";
import { Skeleton } from "@/components/ui/skeleton";
import { TaxProfile, TaxComparisonResult, TaxInsight } from "@/types/tax-planning";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Lightbulb, RotateCcw, Home, FolderOpen, Calculator, BarChart3, Settings, History as HistoryIcon, FileDown, Loader2 } from "lucide-react";
import { useTaxReport } from "@/hooks/useTaxReport";

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class MobileErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("MobileTaxWizard Error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
                    <div className="bg-destructive/10 p-4 rounded-full">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold">Ops! Algo deu errado.</h3>
                    <p className="text-sm text-muted-foreground">
                        Encontramos um erro inesperado ao processar seus dados.
                    </p>
                    <div className="bg-muted p-3 rounded-lg text-xs font-mono text-left w-full overflow-auto max-h-32">
                        {this.state.error?.message}
                    </div>
                    <Button
                        onClick={() => {
                            this.setState({ hasError: false });
                            window.location.reload();
                        }}
                    >
                        Recarregar Página
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

// ============================================================================
// COMPONENT
// ============================================================================

interface MobileTaxWizardProps {
    profile: TaxProfile;
    setProfile: (profile: TaxProfile) => void;
    updateProfile: (field: string, value: any) => void;
    onSearchCnpj: () => Promise<boolean>;
    onCalculate: () => void;
    loadingCnpj: boolean;
    isProcessing: boolean;
    results?: TaxComparisonResult | null;
    strategicInsights?: TaxInsight[];
    isAnalyzingStrategically?: boolean;
    onReset: () => void;
    onOpenHistory: () => void;
}

export function MobileTaxWizard({
    profile,
    setProfile,
    updateProfile,
    onSearchCnpj,
    onCalculate,
    loadingCnpj,
    isProcessing,
    results,
    strategicInsights,
    isAnalyzingStrategically,
    onReset,
    onOpenHistory
}: MobileTaxWizardProps) {

    const [wizardPhase, setWizardPhase] = useState<"search" | "interview" | "results">("search");
    const [isHeaderOpen, setIsHeaderOpen] = useState(false);
    const [showIdentificationDrawer, setShowIdentificationDrawer] = useState(false);
    const [activeInsightIndex, setActiveInsightIndex] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const { isGenerating, generateReport, downloadPDF, reportContent } = useTaxReport();

    const handleExport = async () => {
        if (!reportContent) {
            await generateReport(profile, results!, false);
        } else {
            downloadPDF(profile.razao_social);
        }
    };

    // Navigation items mirroring Layout.tsx
    const navigationItems = [
        { name: "Início", href: "/", icon: Home },
        { name: "Cadastros", href: "/cadastros", icon: FolderOpen },
        { name: "Cotação", href: "/cotacao", icon: Calculator },
        { name: "Análise", href: "/analise", icon: BarChart3 },
        { name: "Planejamento", href: "/planejamento", icon: Target },
        { name: "Histórico", href: "/historico", icon: HistoryIcon },
        { name: "Config", href: "/config", icon: Settings },
    ];

    const handleCnpjSearch = async () => {
        try {
            // Attempt search - validation errors are handled by onSearchCnpj toast
            const success = await onSearchCnpj();

            // If API call success or we have a valid CNPJ length locally (handled by onSearchCnpj usually)
            // We open the drawer to confirm details. 
            // Even on failure, we might want to let user continue manually, but let's assume onSearchCnpj handles the 'toast' for error.
            if (profile.cnpj && profile.cnpj.length >= 14) {
                setShowIdentificationDrawer(true);
            }
        } catch (error) {
            console.error("Search Error", error);
            toast({ title: "Erro na busca", description: "Tente novamente ou preencha manualmente.", variant: "destructive" });
        }
    };

    const confirmIdentification = (regime: 'simples' | 'presumido' | 'real') => {
        updateProfile('regime_atual', regime);
        setShowIdentificationDrawer(false);
        setWizardPhase('interview');
    };

    const handleReset = () => {
        setWizardPhase('search');
        onReset();
    };

    // Helper to render currency
    const BRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

    return (
        <MobileErrorBoundary>
            <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden h-[100dvh]">
                {/* 1. Header Retrátil (Fixed Top) */}
                <Collapsible open={isHeaderOpen} onOpenChange={setIsHeaderOpen} className="bg-card border-b shadow-sm z-20 w-full shrink-0">
                    <div className="flex items-center justify-between p-4 h-16">
                        <h1 className="font-semibold text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            Plan. Tributário
                        </h1>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                <ChevronDown className={`h-4 w-4 transition-transform ${isHeaderOpen ? 'rotate-180' : ''}`} />
                                <span className="sr-only">Toggle Header</span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="px-4 pb-4 space-y-4 max-h-[80vh] overflow-y-auto">
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Consultoria Inteligente v2.0
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                <Badge variant="outline">Fase: {wizardPhase === 'search' ? 'Identificação' : wizardPhase === 'interview' ? 'Diagnóstico' : 'Resultados'}</Badge>
                                {profile.razao_social && <Badge variant="secondary" className="truncate max-w-[150px]">{profile.razao_social}</Badge>}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 py-2 border-t border-b border-muted/50">
                            {navigationItems.map((item) => {
                                const isActive = item.href === "/"
                                    ? location.pathname === item.href
                                    : location.pathname.startsWith(item.href);

                                return (
                                    <Button
                                        key={item.href}
                                        variant="ghost"
                                        className={cn(
                                            "flex flex-col items-center justify-center p-2 h-auto gap-1 transition-all rounded-xl",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                        )}
                                        onClick={() => navigate(item.href)}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="text-[9px] font-medium">{item.name}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Main Content Area (Scrollable) */}
                <main className="flex-1 relative overflow-y-auto scrollbar-hide py-4">
                    <AnimatePresence mode="wait">
                        {wizardPhase === 'search' && (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col px-6 pb-24 space-y-6"
                            >
                                <div className="text-center space-y-2 mt-8">
                                    <h2 className="text-2xl font-bold tracking-tight">Qual o CNPJ?</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Inicie a análise tributária para recuperar créditos.
                                    </p>
                                </div>

                                {loadingCnpj ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-14 w-full rounded-2xl" />
                                        <Skeleton className="h-14 w-full rounded-xl" />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <Input
                                                placeholder="00.000.000/0000-00"
                                                className="pl-12 h-16 text-lg rounded-2xl bg-muted/40 border-muted-foreground/20 text-foreground shadow-sm focus-visible:ring-primary/30 transition-all"
                                                value={profile.cnpj || ''}
                                                onChange={(e) => {
                                                    let val = e.target.value.replace(/\D/g, '');
                                                    if (val.length > 14) val = val.slice(0, 14);
                                                    val = val.replace(/^(\d{2})(\d)/, '$1.$2');
                                                    val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                                                    val = val.replace(/\.(\d{3})(\d)/, '.$1/$2');
                                                    val = val.replace(/(\d{4})(\d)/, '$1-$2');
                                                    updateProfile('cnpj', val);
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 border-t border-white/5 pt-6">
                                    <p className="text-center text-sm font-medium text-muted-foreground/80 mb-4">Selecione o regime tributário atual</p>
                                    <div className="flex gap-2 justify-center flex-wrap">
                                        <Badge variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-primary/5 active:bg-primary/10 transition-colors" onClick={() => confirmIdentification('simples')}>Simples Nacional</Badge>
                                        <Badge variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-primary/5 active:bg-primary/10 transition-colors" onClick={() => confirmIdentification('presumido')}>Lucro Presumido</Badge>
                                        <Badge variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-primary/5 active:bg-primary/10 transition-colors" onClick={() => confirmIdentification('real')}>Lucro Real</Badge>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {wizardPhase === 'interview' && (
                            <motion.div
                                key="interview"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full"
                            >
                                <AiInterviewWizard
                                    profile={profile}
                                    onUpdateProfile={updateProfile}
                                    isProcessing={isProcessing}
                                    onComplete={() => {
                                        onCalculate();
                                        setWizardPhase('results');
                                        setTimeout(() => {
                                            onCalculate();
                                        }, 500);
                                    }}
                                />
                            </motion.div>
                        )}

                        {wizardPhase === 'results' && (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="px-4 pb-32 space-y-6"
                            >
                                {isProcessing || !results ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                        <div className="relative">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full opacity-50"
                                            />
                                            <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary animate-pulse" />
                                        </div>
                                        <p className="text-sm text-muted-foreground animate-pulse">Calculando o melhor cenário...</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Result Summary Card */}
                                        <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 via-card to-card">
                                            <CardContent className="p-5">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Melhor Regime</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <h2 className="text-2xl font-black text-primary">{results.melhor_atual.toUpperCase()}</h2>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Economia Anual</h3>
                                                        <p className="text-xl font-bold text-green-600">{BRL(results.economia_atual)}</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mt-4">
                                                    <div className="bg-background/50 rounded-lg p-3 border border-muted/50">
                                                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Carga Atual</p>
                                                        <p className="font-semibold text-sm">{results.cenarios[results.melhor_atual]?.carga_efetiva_percentual.toFixed(1)}%</p>
                                                    </div>
                                                    <div className="bg-background/50 rounded-lg p-3 border border-muted/50">
                                                        <p className="text-[10px] text-muted-foreground uppercase mb-1">Pós-Reforma</p>
                                                        <p className="font-semibold text-sm text-primary">{results.melhor_pos_reforma.toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Accordion Details */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">Detalhamento Financeiro</h4>
                                            <Accordion type="single" collapsible className="w-full bg-card rounded-xl border border-muted/40 shadow-sm overflow-hidden">
                                                <AccordionItem value="atual" className="border-b last:border-0">
                                                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                            <span className="font-medium text-sm">Cenário Atual ({results.melhor_atual})</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4 bg-muted/5">
                                                        <div className="space-y-2 pt-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">Imposto Bruto</span>
                                                                <span>{BRL(results.cenarios[results.melhor_atual]?.imposto_bruto_anual || 0)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-green-600">Créditos Recuperados</span>
                                                                <span className="text-green-600">-{BRL(results.cenarios[results.melhor_atual]?.creditos_aproveitados || 0)}</span>
                                                            </div>
                                                            <div className="border-t border-dashed border-muted-foreground/20 my-2" />
                                                            <div className="flex justify-between font-bold">
                                                                <span>Total a Pagar</span>
                                                                <span>{BRL(results.cenarios[results.melhor_atual]?.imposto_liquido_anual || 0)}</span>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>

                                                <AccordionItem value="reforma" className="border-b last:border-0">
                                                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-2 w-2 rounded-full bg-purple-500" />
                                                            <span className="font-medium text-sm">Cenário Reforma (2033)</span>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="px-4 pb-4 bg-muted/5">
                                                        <div className="space-y-2 pt-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-muted-foreground">IBS + CBS (Débito)</span>
                                                                <span>{BRL(results.cenarios.reforma_plena.imposto_bruto_anual)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-green-600">Crédito (Não-Cumulativo)</span>
                                                                <span className="text-green-600">-{BRL(results.cenarios.reforma_plena.creditos_aproveitados)}</span>
                                                            </div>
                                                            <div className="border-t border-dashed border-muted-foreground/20 my-2" />
                                                            <div className="flex justify-between font-bold">
                                                                <span>Total Estimado</span>
                                                                <span className={results.economia_com_reforma > 0 ? "text-green-600" : "text-destructive"}>
                                                                    {BRL(results.cenarios.reforma_plena.imposto_liquido_anual)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        </div>

                                        {/* Insights Carousel */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                    <Lightbulb className="h-4 w-4 text-amber-500" />
                                                    Insights Estratégicos
                                                </h4>
                                                <div className="flex gap-1">
                                                    {(strategicInsights || results.insights).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`h-1.5 w-1.5 rounded-full transition-all ${i === activeInsightIndex ? 'bg-primary w-3' : 'bg-muted/50'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="relative overflow-hidden min-h-[140px]">
                                                <AnimatePresence mode="wait">
                                                    <motion.div
                                                        key={activeInsightIndex}
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        className="bg-card border rounded-2xl p-4 shadow-sm h-full"
                                                        onClick={() => {
                                                            const total = (strategicInsights || results.insights).length;
                                                            setActiveInsightIndex((activeInsightIndex + 1) % total);
                                                        }}
                                                    >
                                                        {(() => {
                                                            const insight = (strategicInsights || results.insights)[activeInsightIndex];
                                                            return (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Badge variant={insight.tipo === 'positivo' ? 'default' : insight.tipo === 'negativo' ? 'destructive' : 'secondary'} className="text-[10px] h-5">
                                                                            {insight.tipo.toUpperCase()}
                                                                        </Badge>
                                                                    </div>
                                                                    <h5 className="font-bold text-sm leading-tight">{insight.titulo}</h5>
                                                                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                                                        {insight.descricao}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })()}
                                                    </motion.div>
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* STICKY FOOTER */}
                {/* Shows mainly in Search or Results phase. In Interview, the component handles its own navigation but we could override here if needed. */}
                {/* Currently AiInterviewWizard occupies the full height in 'interview' phase so we might hide this footer or overlay.
                    Actually, it's better to hide this footer in 'interview' phase to avoid double footers,
                    OR better yet, let AiInterviewWizard use this space. For now, let's keep it for Search/Results actions. */}

                {wizardPhase !== 'interview' && (
                    <div className="bg-background/80 backdrop-blur-md border-t p-4 z-50 shrink-0 pb-8 safe-area-pb">
                        {wizardPhase === 'search' && (
                            <Button
                                size="lg"
                                className="w-full h-14 rounded-2xl text-lg shadow-xl shadow-primary/20"
                                onClick={handleCnpjSearch}
                                disabled={loadingCnpj || !profile.cnpj || profile.cnpj.length < 14}
                            >
                                {loadingCnpj ? "Consultando..." : "Iniciar Diagnóstico"}
                                {!loadingCnpj && <ArrowRight className="h-5 w-5 ml-2" />}
                            </Button>
                        )}

                        {wizardPhase === 'results' && results && !isProcessing && (
                            <div className="flex gap-3">
                                <Button variant="outline" size="lg" className="flex-1 h-12 rounded-xl" onClick={handleReset}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reiniciar
                                </Button>
                                {/* Future: 'Salvar PDF' or 'Compartilhar' */}
                                <Button
                                    size="lg"
                                    className="flex-1 h-12 rounded-xl"
                                    onClick={handleExport}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                                    {isGenerating ? "Gerando..." : reportContent ? "Baixar PDF" : "Gerar Relatório"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Drawer de Identificação */}
                <Drawer open={showIdentificationDrawer} onOpenChange={setShowIdentificationDrawer}>
                    <DrawerContent className="pb-8">
                        <DrawerHeader className="text-center">
                            <DrawerTitle className="text-xl">{profile.razao_social || 'Empresa Encontrada'}</DrawerTitle>
                            <DrawerDescription>{profile.municipio} - {profile.uf}</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 space-y-4">
                            <div className="bg-muted p-4 rounded-xl flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">CNAE Principal</span>
                                <span className="font-bold text-sm">{profile.cnae_principal}</span>
                            </div>

                            <div className="space-y-3 pt-2">
                                <h3 className="text-center font-medium text-sm">Confirme o Regime Tributário Atual</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    <Button variant="outline" className="h-12 justify-between px-4" onClick={() => confirmIdentification('simples')}>
                                        Simples Nacional
                                        <Check className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="outline" className="h-12 justify-between px-4" onClick={() => confirmIdentification('presumido')}>
                                        Lucro Presumido
                                        <Check className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="outline" className="h-12 justify-between px-4" onClick={() => confirmIdentification('real')}>
                                        Lucro Real
                                        <Check className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </MobileErrorBoundary>
    );
}
