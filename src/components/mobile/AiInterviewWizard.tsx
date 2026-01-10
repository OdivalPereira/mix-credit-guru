import { useState, useRef } from "react";
import { InterviewStep } from "./InterviewStep";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Mic, Keyboard, Upload, Play, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { TaxProfile } from "@/types/tax-planning";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AudioRecorder } from "@/components/AudioRecorder"; // Assuming we reuse or adapt this

interface StepConfig {
    id: string;
    field: string;
    question: string;
    description?: string;
    suggestions?: string[];
    type: "currency" | "number" | "text";
}

interface AiInterviewWizardProps {
    profile: TaxProfile;
    onUpdateProfile: (field: string, value: any) => void;
    onComplete: () => void;
    isProcessing: boolean;
}

const STEPS: StepConfig[] = [
    {
        id: "faturamento",
        field: "faturamento_mensal",
        question: "Qual é o seu Faturamento Mensal Médio?",
        description: "Considere a média dos últimos 12 meses.",
        type: "currency"
    },
    {
        id: "folha",
        field: "despesas_sem_credito.folha_pagamento",
        question: "Qual o valor aproximado da Folha de Pagamento?",
        description: "Inclua salários, encargos e pró-labore.",
        type: "currency"
    },
    {
        id: "custos_fixos",
        field: "despesas_com_credito.aluguel", // Simplification: we might need to distribute or ask separate
        question: "Quanto você gasta com Aluguel e Energia?",
        description: "Some aluguel, luz, água e internet.",
        suggestions: ["+ Aluguel", "+ Energia", "+ Internet"],
        type: "currency"
    },
    {
        id: "fornecedores",
        field: "percentual_fornecedores_simples",
        question: "Qual % das suas compras vem do Simples Nacional?",
        description: "Uma estimativa aproximada (0 a 100%).",
        suggestions: ["10%", "30%", "50%", "80%"],
        type: "number"
    },
    {
        id: "uso_consumo",
        field: "percentual_compras_creditaveis",
        question: "Quantos % das compras geram crédito?",
        description: "Geralmente insumos e mercadorias para revenda.",
        suggestions: ["100% (Tudo)", "90%", "70%"],
        type: "number"
    }
];

export function AiInterviewWizard({ profile, onUpdateProfile, onComplete, isProcessing }: AiInterviewWizardProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<"voice" | "type" | "import">("voice");
    const [manualInput, setManualInput] = useState("");
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState<{ value: any, text: string } | null>(null);

    const currentStep = STEPS[currentStepIndex];

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
            setManualInput("");
            setShowConfirmation(null);
        } else {
            onComplete();
        }
    };

    const processTextToValue = async (text: string) => {
        setIsAiProcessing(true);
        try {
            // Quick parser for demo/simple cases (avoiding AI latency for simple numbers)
            let extractedValue: number | null = null;
            const cleanText = text.replace(/[^0-9,.]/g, '').replace(',', '.');
            const numInfo = parseFloat(cleanText);

            if (!isNaN(numInfo)) {
                extractedValue = numInfo;
            } else {
                // Fallback to AI for complex sentences "Cerca de 50 mil"
                const { data, error } = await supabase.functions.invoke('tax-planner-extract', {
                    body: { text: `O valor para ${currentStep.question} é ${text}`, json_data: {} }
                });
                if (!error && data?.profile) {
                    // Extract generic mapping logic here would be complex, simplifying for now
                    // Assuming the AI returns a partially filled profile, we'd need to map it.
                    // For this specific purpose, let's trust the number parser mostly or handle specific fields
                    // This is a placeholder for the "Engine" logic.
                }
            }

            if (extractedValue !== null) {
                setShowConfirmation({ value: extractedValue, text: text });
            } else {
                toast({ title: "Não entendi o valor.", description: "Tente dizer apenas o número.", variant: "destructive" });
            }

        } catch (e) {
            console.error(e);
            toast({ title: "Erro ao processar", variant: "destructive" });
        } finally {
            setIsAiProcessing(false);
        }
    };

    const confirmValue = () => {
        if (showConfirmation) {
            onUpdateProfile(currentStep.field, showConfirmation.value);
            handleNext();
        }
    };

    const handleAudioStop = async (blob: Blob) => {
        // Reuse logic from PlanejamentoTributario but simplified
        // Send to Whisper -> Text -> ProcessTextToValue
        // For now, mocking the transcribing part or using the existing function if it handles audio
        // The existing function handles audio file uploads.
        const formData = new FormData();
        formData.append('file', blob, 'audio.webm');
        formData.append('text', `Campo: ${currentStep.field}`); // Context hint

        setIsAiProcessing(true);
        try {
            const { data, error } = await supabase.functions.invoke('tax-planner-extract', {
                body: formData
            });

            if (!error && data) {
                // In a real scenario, we'd pluck the specific field value
                // For now let's assume the AI updates the profile and we just confirm.
                // This is tricky without a specific single-field extraction endpoint.
                // Let's use the returned profile to effectively "diff" or just take the explicit field.
                // Since tax-planner-extract returns a full profile, we might need to be careful.

                // Simplification: We'll assume the text extraction worked and mapped to a field.
                // Or we just show a "Entendi: R$ X" based on what the AI parsed.

                // If the AI returns a populated profile, find our field.
                const keys = currentStep.field.split('.');
                let val = data.profile;
                for (const key of keys) {
                    val = val ? val[key] : undefined;
                }

                if (val !== undefined) {
                    setShowConfirmation({ value: val, text: "via Voz" });
                } else {
                    toast({ title: "Não consegui identificar o valor.", variant: "destructive" });
                }
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Erro no processamento de voz", variant: "destructive" });
        } finally {
            setIsAiProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex-1 flex flex-col justify-center">
                <InterviewStep
                    question={currentStep.question}
                    description={currentStep.description}
                >
                    {showConfirmation ? (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-primary/10 p-6 rounded-2xl border-2 border-primary space-y-4"
                        >
                            <p className="text-sm font-medium text-muted-foreground">Entendi:</p>
                            <p className="text-4xl font-bold text-primary">
                                {currentStep.type === 'currency'
                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(showConfirmation.value)
                                    : showConfirmation.value + (currentStep.type === 'number' ? '%' : '')}
                            </p>
                            <div className="flex gap-3 justify-center pt-2">
                                <Button variant="outline" onClick={() => setShowConfirmation(null)} className="h-12 w-12 rounded-full p-0">
                                    <span className="sr-only">Corrigir</span>
                                    <span className="text-xl">✕</span>
                                </Button>
                                <Button onClick={confirmValue} className="h-12 px-8 rounded-full gap-2">
                                    <Check className="h-5 w-5" />
                                    Confirmar
                                </Button>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-32 flex items-center justify-center">
                            {/* Placeholder for visual feedback during idle/recording */}
                            {isAiProcessing ? (
                                <div className="flex flex-col items-center gap-2">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                        className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                                    />
                                    <span className="text-xs text-muted-foreground animate-pulse">Processando...</span>
                                </div>
                            ) : (
                                <div className="text-6xl text-muted-foreground/20">
                                    {activeTab === 'voice' && <Mic className="h-24 w-24" />}
                                    {activeTab === 'type' && <Keyboard className="h-24 w-24" />}
                                    {activeTab === 'import' && <Upload className="h-24 w-24" />}
                                </div>
                            )}
                        </div>
                    )}
                </InterviewStep>
            </div>

            <div className="pb-6 px-4">
                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 h-14 bg-muted/50 rounded-2xl p-1">
                        <TabsTrigger value="voice" className="rounded-xl h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Mic className="h-5 w-5 mr-2" />
                            Falar
                        </TabsTrigger>
                        <TabsTrigger value="type" className="rounded-xl h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Keyboard className="h-5 w-5 mr-2" />
                            Digitar
                        </TabsTrigger>
                        <TabsTrigger value="import" className="rounded-xl h-full data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Upload className="h-5 w-5 mr-2" />
                            PDF
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="voice" className="mt-0">
                        <div className="flex justify-center">
                            {/* Simulated Hold-to-Talk or Toggle Button */}
                            <div className="relative">
                                {/* We can use the existing AudioRecorder but custom styled? 
                             Or build a custom trigger that uses the AudioRecorder logic internally.
                             For now, let's use a big button that simulates the interaction.
                         */}
                                <Button
                                    size="lg"
                                    className="h-20 w-20 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Mic className="h-8 w-8 text-white" />
                                </Button>
                                <p className="text-center text-xs text-muted-foreground mt-3">Toque para gravar</p>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="type" className="mt-0 space-y-4">
                        {currentStep.suggestions && (
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                {currentStep.suggestions.map(s => (
                                    <Badge
                                        key={s}
                                        variant="secondary"
                                        className="h-8 px-3 text-sm cursor-pointer whitespace-nowrap active:scale-95 transition-transform"
                                        onClick={() => setManualInput(prev => `${prev} ${s}`)}
                                    >
                                        {s}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Input
                                value={manualInput}
                                onChange={e => setManualInput(e.target.value)}
                                placeholder="Digite o valor..."
                                className="h-14 text-lg rounded-2xl bg-background border-muted-foreground/20"
                                type={currentStep.type === 'text' ? 'text' : 'tel'}
                            />
                            <Button
                                size="icon"
                                className="h-14 w-14 rounded-2xl shrink-0"
                                onClick={() => processTextToValue(manualInput)}
                            >
                                <Play className="h-6 w-6 ml-1" />
                            </Button>
                        </div>
                    </TabsContent>

                    <TabsContent value="import" className="mt-0">
                        <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl h-32 flex flex-col items-center justify-center p-4 bg-muted/10">
                            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-xs text-muted-foreground text-center">
                                Toque para selecionar um arquivo PDF ou Excel
                            </p>
                            {/* Hidden input would go here */}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
