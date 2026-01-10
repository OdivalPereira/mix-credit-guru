import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Check, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { AiInterviewWizard } from "./AiInterviewWizard";
import { Skeleton } from "@/components/ui/skeleton";
import { TaxProfile, TaxComparisonResult, TaxInsight } from "@/types/tax-planning";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Target, Lightbulb, ArrowRight, RotateCcw, Home, FolderOpen, Calculator, BarChart3, Settings, History as HistoryIcon } from "lucide-react";

interface MobileTaxWizardProps {
    profile: TaxProfile;
    setProfile: (profile: TaxProfile) => void;
    updateProfile: (field: string, value: any) => void;
    onSearchCnpj: () => void;
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
        await onSearchCnpj();
        // Assume success if profile has razao_social after search
        // Ideally onSearchCnpj would return status or we verify profile.
        // For now, we open drawer regardless to show result or ask confirmation
        setShowIdentificationDrawer(true);
    };

    const confirmIdentification = (regime: 'simples' | 'presumido' | 'real') => {
        updateProfile('regime_atual', regime);
        setShowIdentificationDrawer(false);
        setWizardPhase('interview');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col overflow-hidden">
            {/* 1. Header Retrátil */}
            <Collapsible open={isHeaderOpen} onOpenChange={setIsHeaderOpen} className="bg-card border-b shadow-sm z-10 w-full shrink-0">
                <div className="flex items-center justify-between p-4 h-16">
                    <h1 className="font-semibold text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        Planejamento Tributário
                    </h1>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-9 p-0">
                            <ChevronDown className={`h-4 w-4 transition-transform ${isHeaderOpen ? 'rotate-180' : ''}`} />
                            <span className="sr-only">Toggle Header</span>
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="px-4 pb-4 space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Versão Mobile 2.0 • Entrevista Guiada por IA
                        </p>
                        <div className="flex gap-2">
                            <Badge variant="outline">Fase: {wizardPhase === 'search' ? 'Identificação' : wizardPhase === 'interview' ? 'Diagnóstico' : 'Resultados'}</Badge>
                            {profile.razao_social && <Badge variant="secondary" className="truncate max-w-[150px]">{profile.razao_social}</Badge>}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-muted/50">
                        {navigationItems.map((item) => {
                            const isActive = item.href === "/"
                                ? location.pathname === item.href
                                : location.pathname.startsWith(item.href);

                            return (
                                <Button
                                    key={item.href}
                                    variant="ghost"
                                    className={cn(
                                        "flex flex-col items-center justify-center h-20 gap-2 transition-all rounded-xl",
                                        isActive
                                            ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-card"
                                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                    )}
                                    onClick={() => navigate(item.href)}
                                >
                                    <item.icon className={cn("h-6 w-6", isActive ? "text-primary-foreground" : "text-primary")} />
                                    <span className={cn("text-[10px] font-medium", isActive ? "text-primary-foreground" : "")}>{item.name}</span>
                                </Button>
                            );
                        })}
                    </div>

                    <Button variant="outline" size="sm" className="w-full justify-start" onClick={onOpenHistory}>
                        <Search className="h-4 w-4 mr-2" />
                        Histórico de Simulações
                    </Button>
                </CollapsibleContent>
            </Collapsible>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-y-auto">
                <AnimatePresence mode="wait">
                    {wizardPhase === 'search' && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center justify-center h-full p-6 space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight">Qual o CNPJ da empresa?</h2>
                                <p className="text-muted-foreground text-sm">
                                    O ponto de partida para recuperar créditos tributários.
                                </p>
                            </div>

                            {loadingCnpj ? (
                                <div className="w-full space-y-4">
                                    <Skeleton className="h-14 w-full rounded-2xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-3/4 mx-auto" />
                                        <Skeleton className="h-4 w-1/2 mx-auto" />
                                    </div>
                                </div>
                            ) : (

                                <div className="w-full space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            placeholder="00.000.000/0000-00"
                                            className="pl-12 h-14 text-lg rounded-2xl bg-white/5 border-white/10 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20 transition-all shadow-lg"
                                            value={profile.cnpj || ''}
                                            onChange={(e) => {
                                                // Simple mask logic or use helper
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
                                    <Button
                                        size="lg"
                                        className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-primary/80 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        onClick={handleCnpjSearch}
                                        disabled={!profile.cnpj || profile.cnpj.length < 14}
                                    >
                                        Consultar CNPJ
                                    </Button>
                                </div>
                            )}

                            {!loadingCnpj && (
                                <div className="space-y-4 w-full">
                                    <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-semibold">Ou selecione o regime diretamente</p>
                                    <div className="flex gap-2 justify-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 glass-card border-white/10 text-[10px]"
                                            onClick={() => confirmIdentification('simples')}
                                        >
                                            Simples Nacional
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 glass-card border-white/10 text-[10px]"
                                            onClick={() => confirmIdentification('presumido')}
                                        >
                                            Lucro Presumido
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 glass-card border-white/10 text-[10px]"
                                            onClick={() => confirmIdentification('real')}
                                        >
                                            Lucro Real
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {wizardPhase === 'interview' && (
                        <motion.div
                            key="interview"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="h-full"
                        >
                            <AiInterviewWizard
                                profile={profile}
                                onUpdateProfile={updateProfile}
                                isProcessing={isProcessing}
                                onComplete={() => {
                                    onCalculate();
                                    setWizardPhase('results');
                                }}
                            />
                        </motion.div>
                    )}

                    {wizardPhase === 'results' && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col h-full overflow-y-auto"
                        >
                            {isProcessing || !results ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                                    <div className="relative">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full opacity-50"
                                        />
                                        <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary animate-pulse" />
                                    </div>
                                    <div className="space-y-4 w-full max-w-xs">
                                        <div className="space-y-2">
                                            <Skeleton className="h-6 w-3/4 mx-auto" />
                                            <Skeleton className="h-4 w-1/2 mx-auto" />
                                        </div>
                                        <div className="space-y-2 pt-4">
                                            <Skeleton className="h-20 w-full rounded-xl" />
                                            <Skeleton className="h-20 w-full rounded-xl" />
                                        </div>
                                        <p className="text-muted-foreground text-xs pt-4 animate-pulse">
                                            Analisando regime tributário e oportunidades de crédito...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 space-y-8">
                                    {/* 1. Card de Recomendação Condensado */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Card className="col-span-2 border-primary/20 bg-primary/5 shadow-sm">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/20 rounded-lg">
                                                        <Target className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Melhor Regime Atual</p>
                                                        <h3 className="text-xl font-black text-primary uppercase">{results.melhor_atual}</h3>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-green-600 uppercase">Economia Anual</p>
                                                    <p className="text-sm font-bold text-green-600">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(results.economia_atual)}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-muted bg-muted/20">
                                            <CardContent className="p-3 text-center">
                                                <p className="text-[9px] font-medium text-muted-foreground uppercase mb-1">Pós-Reforma</p>
                                                <p className="text-sm font-bold text-foreground uppercase">{results.melhor_pos_reforma}</p>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-muted bg-muted/20">
                                            <CardContent className="p-3 text-center">
                                                <p className="text-[9px] font-medium text-muted-foreground uppercase mb-1">Carga c/ Reforma</p>
                                                <p className="text-sm font-bold text-destructive">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(results.economia_com_reforma)}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* 2. Carrossel de Insights */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h4 className="font-semibold flex items-center gap-2 text-sm">
                                                <Lightbulb className="h-4 w-4 text-yellow-500" />
                                                Insights da Análise
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

                                        <div className="relative overflow-hidden min-h-[160px]">
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
                                                            <div className="space-y-3">
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${insight.tipo === 'positivo' ? 'bg-green-500' :
                                                                        insight.tipo === 'alerta' ? 'bg-amber-500' : 'bg-blue-500'
                                                                        }`} />
                                                                    <h5 className="font-bold text-sm leading-tight">{insight.titulo}</h5>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                                                                    {insight.descricao}
                                                                </p>
                                                                {insight.impacto_financeiro !== undefined && (
                                                                    <div className="pt-2 flex items-center justify-between border-t border-muted/50 mt-auto">
                                                                        <span className="text-[10px] text-muted-foreground uppercase font-medium">Impacto Estimado</span>
                                                                        <span className={`text-xs font-bold ${insight.impacto_financeiro >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(insight.impacto_financeiro)}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </motion.div>
                                            </AnimatePresence>
                                            <p className="text-[10px] text-muted-foreground text-center mt-2 animate-pulse italic">Toque no card para o próximo insight</p>
                                        </div>
                                    </div>

                                    {/* 3. Visualização de Comparação Mobile (Barras Horizontais) */}
                                    <div className="space-y-4">
                                        <h4 className="font-semibold flex items-center gap-2 text-sm px-1">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            Comparativo de Carga Tributária
                                        </h4>
                                        <div className="space-y-5 bg-muted/10 p-4 rounded-2xl border border-muted/50">
                                            {[
                                                { label: 'Lucro Presumido', val: results.cenarios.presumido },
                                                { label: 'Lucro Real', val: results.cenarios.real },
                                                { label: 'Reforma (2033)', val: results.cenarios.reforma_plena }
                                            ].map((item, i) => {
                                                const maxVal = Math.max(
                                                    results.cenarios.presumido.imposto_liquido_anual,
                                                    results.cenarios.real.imposto_liquido_anual,
                                                    results.cenarios.reforma_plena.imposto_liquido_anual
                                                );
                                                const percentage = (item.val.imposto_liquido_anual / maxVal) * 100;
                                                const isBest = item.label.toLowerCase().includes(results.melhor_atual.toLowerCase()) ||
                                                    (item.label.includes('Reforma') && results.melhor_pos_reforma === 'reforma');

                                                return (
                                                    <div key={i} className="space-y-1.5">
                                                        <div className="flex justify-between text-[11px] font-medium">
                                                            <span className="flex items-center gap-1.5">
                                                                {item.label}
                                                                {isBest && <Check className="h-3 w-3 text-green-500" />}
                                                            </span>
                                                            <span className={isBest ? 'text-green-600 font-bold' : ''}>
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(item.val.imposto_liquido_anual)}
                                                            </span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden flex">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${percentage}%` }}
                                                                transition={{ delay: 0.5 + (i * 0.1), duration: 0.8 }}
                                                                className={`h-full rounded-full ${isBest ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Botões de Ação */}
                                    <div className="space-y-3 pt-4">
                                        <Button
                                            variant="outline"
                                            className="w-full h-12 rounded-2xl gap-2 text-sm"
                                            onClick={onReset}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            Nova Simulação
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Drawer de Identificação (Hero Search Result) */}
            <Drawer open={showIdentificationDrawer} onOpenChange={setShowIdentificationDrawer}>
                <DrawerContent className="pb-8">
                    <DrawerHeader className="text-center">
                        <DrawerTitle className="text-2xl">{profile.razao_social || 'Empresa Encontrada'}</DrawerTitle>
                        <DrawerDescription>{profile.municipio} - {profile.uf}</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4 space-y-6">
                        <div className="bg-muted/30 p-4 rounded-xl text-sm text-center">
                            <p className="font-medium text-muted-foreground mb-1">CNAE Principal</p>
                            <p className="font-semibold text-foreground">{profile.cnae_principal}</p>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-center font-medium">Qual seu Regime Tributário Atual?</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <Button variant="outline" className="h-12 text-lg justify-between px-6 hover:border-primary hover:bg-primary/5 hover:text-primary" onClick={() => confirmIdentification('simples')}>
                                    Simples Nacional
                                    <Check className="h-4 w-4 opacity-0 hover:opacity-100" />
                                </Button>
                                <Button variant="outline" className="h-12 text-lg justify-between px-6 hover:border-primary hover:bg-primary/5 hover:text-primary" onClick={() => confirmIdentification('presumido')}>
                                    Lucro Presumido
                                    <Check className="h-4 w-4 opacity-0 hover:opacity-100" />
                                </Button>
                                <Button variant="outline" className="h-12 text-lg justify-between px-6 hover:border-primary hover:bg-primary/5 hover:text-primary" onClick={() => confirmIdentification('real')}>
                                    Lucro Real
                                    <Check className="h-4 w-4 opacity-0 hover:opacity-100" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
