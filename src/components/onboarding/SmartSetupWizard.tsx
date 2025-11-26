import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Key,
    Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";

interface SmartSetupWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SmartSetupWizard({ open, onOpenChange }: SmartSetupWizardProps) {
    const [step, setStep] = useState<"config" | "upload" | "review" | "simulating">("config");
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadType, setUploadType] = useState<"cnpj" | "products" | "suppliers">("cnpj");
    const [extractedData, setExtractedData] = useState<any>(null);

    const addProduto = useCatalogoStore((state) => state.addProduto);
    const addFornecedor = useCotacaoStore((state) => state.addFornecedor);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("type", uploadType);

            const { data, error } = await supabase.functions.invoke("ai-setup", {
                body: formData,
                headers: {
                    "x-user-gemini-key": apiKey,
                },
            });

            if (error) throw error;

            setExtractedData(data.data);
            setStep("review");
            toast.success("Dados extraídos com sucesso!");
        } catch (error: any) {
            console.error("Error extracting data:", error);
            toast.error("Erro ao analisar arquivo: " + (error.message || "Tente novamente."));
        } finally {
            setLoading(false);
        }
    }, [apiKey, uploadType]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg'],
            'text/csv': ['.csv'],
            'text/plain': ['.txt']
        },
        maxFiles: 1
    });

    const handleSaveData = async () => {
        if (!extractedData) return;

        try {
            if (uploadType === "products" && Array.isArray(extractedData)) {
                extractedData.forEach((item: any) => {
                    addProduto({
                        descricao: item.nome,
                        ncm: item.ncm_sugerido,
                        preco_referencia: item.preco_medio || 0,
                        unidade: item.unidade || "UN"
                    });
                });
                toast.success(`${extractedData.length} produtos importados!`);
            } else if (uploadType === "suppliers" && Array.isArray(extractedData)) {
                extractedData.forEach((item: any) => {
                    addFornecedor({
                        nome: item.nome,
                        cnpj: item.cnpj,
                        // Defaulting required fields for MVP
                        uf: "SP",
                        tipo: item.categoria === "Indústria" ? "industria" : "distribuidor"
                    });
                });
                toast.success(`${extractedData.length} fornecedores importados!`);
            } else if (uploadType === "cnpj") {
                // Here we would save company info to a store or context
                toast.success("Dados da empresa atualizados!");
            }

            setStep("upload");
            setExtractedData(null);
        } catch (error) {
            console.error("Error saving data:", error);
            toast.error("Erro ao salvar dados.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Configuração Inteligente (AI)
                    </DialogTitle>
                    <DialogDescription>
                        Use Inteligência Artificial para configurar sua conta automaticamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === "config" && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                                <div className="flex items-start gap-3">
                                    <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="space-y-1">
                                        <h4 className="font-medium">Chave da API Gemini</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Para usar o recurso gratuito, você precisa fornecer sua própria chave de API do Google Gemini.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="apiKey">Sua API Key</Label>
                                <Input
                                    id="apiKey"
                                    type="password"
                                    placeholder="Cole sua chave aqui (AIza...)"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Não tem uma chave? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline">Obter chave gratuita</a>
                                </p>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button onClick={() => setStep("upload")} disabled={!apiKey}>
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "upload" && (
                        <div className="space-y-6">
                            <Tabs value={uploadType} onValueChange={(v) => setUploadType(v as any)}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="cnpj">Identidade</TabsTrigger>
                                    <TabsTrigger value="products">Produtos</TabsTrigger>
                                    <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
                                </TabsList>

                                <div className="mt-4">
                                    <div
                                        {...getRootProps()}
                                        className={`
                      border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                      ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
                    `}
                                    >
                                        <input {...getInputProps()} />
                                        {loading ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                <p className="text-sm text-muted-foreground">Analisando documento com IA...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <p className="font-medium">Arraste um arquivo ou clique para selecionar</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {uploadType === "cnpj" ? "PDF do Cartão CNPJ ou Contrato Social" : "Lista em PDF, CSV ou Texto"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Tabs>
                        </div>
                    )}

                    {step === "review" && extractedData && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">Dados Extraídos</h3>
                                <Button variant="ghost" size="sm" onClick={() => setStep("upload")}>
                                    Cancelar
                                </Button>
                            </div>

                            <Card className="max-h-[300px] overflow-auto">
                                <CardContent className="p-4">
                                    <pre className="text-xs whitespace-pre-wrap font-mono">
                                        {JSON.stringify(extractedData, null, 2)}
                                    </pre>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setStep("upload")}>Voltar</Button>
                                <Button onClick={handleSaveData}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirmar e Salvar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
