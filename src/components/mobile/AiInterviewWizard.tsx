import { useState, useRef } from "react";
import { InterviewStep } from "./InterviewStep";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Mic, Keyboard, Upload, Play, Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { TaxProfile } from "@/types/tax-planning";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
// Removed unused AudioRecorder import

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
    onUpdateProfile: (field: string, value: string | number | boolean | null) => void;
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
    const [isRecording, setIsRecording] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState<{ value: number, text: string } | null>(null);
    const [aiQuestion, setAiQuestion] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

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
                if (!error && data) {
                    // Update profile with extracted data
                    if (data.profile) {
                        Object.entries(data.profile).forEach(([key, value]) => {
                            if (value !== null && value !== undefined) {
                                onUpdateProfile(key, value);
                            }
                        });
                    }

                    if (data.next_question) {
                        setAiQuestion(data.next_question);
                        setManualInput(""); // Clear input
                        toast({ title: "Nova pergunta da IA" });
                    } else {
                        // Success via text, maybe confirm first?
                        // For flow simplicity, if next_question is null, we assume done or proceed.
                        setAiQuestion(null);
                        onComplete();
                    }
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

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                handleAudioStop(audioBlob);
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast({
                title: "Acesso ao microfone negado",
                description: "Verifique as permissões do seu navegador para usar a voz.",
                variant: "destructive"
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
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
                // Update profile with whatever the AI extracted
                if (data.profile) {
                    // Update full profile using the helper or one-by-one
                    // Since we don't have a bulk update, we might need to rely on the parent or do it manually.
                    // Ideally updateProfile handles key/value.
                    // But here we might have multiple fields.
                    // For now, let's just use the setProfile from props if available? 
                    // Wait, we only have updateProfile (single field).
                    // We should probably expose setProfile or iterate.
                    // Let's iterate over non-null keys in data.profile
                    Object.entries(data.profile).forEach(([key, value]) => {
                        if (value !== null && value !== undefined) {
                            onUpdateProfile(key, value);
                        }
                    });
                }

                // Handle Adaptive Flow
                if (data.next_question) {
                    setAiQuestion(data.next_question);
                    // Clear confirmation logic, we are continuing the interview
                    setShowConfirmation(null);
                    toast({ title: "Nova pergunta da IA", description: "Perfis atualizado." });
                } else {
                    // No more questions, we can finish or show a summary
                    setAiQuestion(null);
                    toast({ title: "Entrevista concluída!", description: "Gerando análise..." });
                    onComplete(); // Go to next phase
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
                    question={aiQuestion || currentStep.question}
                    description={aiQuestion ? "A IA precisa deste dado para continuar." : currentStep.description}
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
                {aiQuestion && (
                    <div className="px-6 pb-2 text-center">
                        <Button variant="ghost" size="sm" onClick={() => onComplete()} className="text-muted-foreground text-xs">
                            Pular para Análise <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="pb-6 px-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "voice" | "type" | "import")} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 h-14 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-1">
                        <TabsTrigger value="voice" className="rounded-xl h-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                            <Mic className="h-5 w-5 mr-2" />
                            Falar
                        </TabsTrigger>
                        <TabsTrigger value="type" className="rounded-xl h-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                            <Keyboard className="h-5 w-5 mr-2" />
                            Digitar
                        </TabsTrigger>
                        <TabsTrigger value="import" className="rounded-xl h-full data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300">
                            <Upload className="h-5 w-5 mr-2" />
                            PDF
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="voice" className="mt-0">
                        <div className="flex justify-center">
                            <div className="relative">
                                {isRecording && (
                                    <motion.div
                                        initial={{ scale: 1, opacity: 0.5 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="absolute inset-0 bg-primary rounded-full"
                                    />
                                )}
                                <Button
                                    size="lg"
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`h-20 w-20 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 ${isRecording ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'
                                        }`}
                                >
                                    {isRecording ? <div className="h-6 w-6 bg-white rounded-sm" /> : <Mic className="h-8 w-8 text-white" />}
                                </Button>
                                <p className="text-center text-xs text-muted-foreground mt-3 uppercase font-semibold tracking-wider">
                                    {isRecording ? "Toque para parar" : "Toque para falar"}
                                </p>
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
                                className="h-14 text-lg rounded-2xl bg-white/5 border-white/10 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground/50"
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
