import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, Check, Building2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { AiInterviewWizard } from "./AiInterviewWizard";
import { TaxProfile } from "@/types/tax-planning";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";

interface MobileTaxWizardProps {
    profile: TaxProfile;
    setProfile: (profile: TaxProfile) => void; // Simplified setter for full profile updates or we can wrap the partial update
    updateProfile: (field: string, value: any) => void;
    onSearchCnpj: () => void;
    onCalculate: () => void;
    loadingCnpj: boolean;
    isProcessing: boolean;
}

export function MobileTaxWizard({
    profile,
    setProfile,
    updateProfile,
    onSearchCnpj,
    onCalculate,
    loadingCnpj,
    isProcessing
}: MobileTaxWizardProps) {

    const [wizardPhase, setWizardPhase] = useState<"search" | "interview" | "results">("search");
    const [isHeaderOpen, setIsHeaderOpen] = useState(false);
    const [showIdentificationDrawer, setShowIdentificationDrawer] = useState(false);

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
        <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden">
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
                <CollapsibleContent className="px-4 pb-4 space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Versão Mobile 2.0 • Entrevista Guiada por IA
                    </p>
                    <div className="flex gap-2">
                        <Badge variant="outline">Fase: {wizardPhase === 'search' ? 'Identificação' : wizardPhase === 'interview' ? 'Diagnóstico' : 'Resultados'}</Badge>
                        {profile.razao_social && <Badge variant="secondary" className="truncate max-w-[150px]">{profile.razao_social}</Badge>}
                    </div>
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
                                <h2 className="text-2xl font-bold">Vamos começar?</h2>
                                <p className="text-muted-foreground">Informe o CNPJ da empresa para iniciarmos o diagnóstico.</p>
                            </div>

                            <div className="w-full max-w-sm space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="00.000.000/0000-00"
                                        className="pl-10 h-14 text-lg rounded-2xl shadow-sm"
                                        value={profile.cnpj || ''}
                                        onChange={(e) => updateProfile('cnpj', e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full h-14 rounded-2xl text-lg hover:scale-[1.02] transition-transform active:scale-[0.98]"
                                    size="lg"
                                    onClick={handleCnpjSearch}
                                    disabled={loadingCnpj}
                                >
                                    {loadingCnpj ? "Consultando..." : "Consultar"}
                                </Button>
                            </div>
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
                            className="flex items-center justify-center h-full p-8 text-center"
                        >
                            <div>
                                <h2 className="text-xl font-bold mb-2">Processando Análise...</h2>
                                <p className="text-muted-foreground">Estamos gerando seus insights estratégicos.</p>
                            </div>
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
