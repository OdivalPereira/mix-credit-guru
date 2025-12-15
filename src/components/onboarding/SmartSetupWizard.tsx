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
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Key,
    Loader2,
    ArrowRight,
    Building2,
    Package,
    ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useNavigate } from "react-router-dom";
import { generateId } from "@/lib/utils";

interface SmartSetupWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Step = "config" | "company" | "products" | "review" | "simulating";

export function SmartSetupWizard({ open, onOpenChange }: SmartSetupWizardProps) {
    const [step, setStep] = useState<Step>("config");
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);

    const [companyData, setCompanyData] = useState<any>(null);
    const [productsData, setProductsData] = useState<any[]>([]);

    const addProduto = useCatalogoStore((state) => state.addProduto);
    const upsertFornecedorCadastro = useCotacaoStore((state) => state.upsertFornecedorCadastro);
    const upsertOferta = useCotacaoStore((state) => state.upsertOferta);
    const enrichSuppliers = useCotacaoStore((state) => state.enrichSuppliersWithTaxes);
    const navigate = useNavigate();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Determine type based on step
            const type = step === "company" ? "cnpj" : "products";
            formData.append("type", type);

            const { data, error } = await supabase.functions.invoke("ai-setup", {
                body: formData,
                headers: {
                    "x-user-gemini-key": apiKey,
                },
            });

            if (error) throw error;

            if (step === "company") {
                setCompanyData(data.data);
                toast.success("Dados da empresa extraídos!");
            } else if (step === "products") {
                setProductsData(data.data);
                toast.success(`${data.data.length} produtos analisados!`);
            }

        } catch (error: any) {
            console.error("Error extracting data:", error);
            toast.error("Erro ao analisar arquivo: " + (error.message || "Tente novamente."));
        } finally {
            setLoading(false);
        }
    }, [apiKey, step]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: step === "company"
            ? { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] }
            : { 'text/csv': ['.csv'], 'text/plain': ['.txt'] },
        maxFiles: 1
    });

    const handleNext = () => {
        if (step === "config") setStep("company");
        else if (step === "company") setStep("products");
        else if (step === "products") setStep("review");
    };

    const handleBack = () => {
        if (step === "company") setStep("config");
        else if (step === "products") setStep("company");
        else if (step === "review") setStep("products");
    };

    const handleFinish = async () => {
        setLoading(true);
        setStep("simulating");

        try {
            // 1. Save Products
            if (productsData.length > 0) {
                productsData.forEach((item: any) => {
                    addProduto({
                        id: generateId("produto"),
                        descricao: item.nome || item.original_name,
                        ncm: item.ncm_sugerido,
                        unidadePadrao: item.unidade || "un",
                        ativo: true,
                        flags: {
                            refeicao: false,
                            cesta: false,
                            reducao: false,
                            is: false,
                        }
                    });
                });
            }

            // 2. Save Company Data (Mocked for now as we don't have a company store yet)
            if (companyData) {
                console.log("Saving company data:", companyData);
                // In a real app: useCompanyStore.setCompany(companyData);
            }

            // 3. Create Baseline Quote (Simulation)
            // Pick random products
            const randomProducts = productsData.slice(0, 5);

            // Create suppliers and offers for these products
            const supplierTemplates = [
                { nome: "Fornecedor A (Indústria)", tipo: "industria" as const },
                { nome: "Fornecedor B (Distribuidor)", tipo: "distribuidor" as const },
                { nome: "Fornecedor C (Atacado)", tipo: "distribuidor" as const }
            ];

            supplierTemplates.forEach((sup, idx) => {
                const fornecedorId = upsertFornecedorCadastro({
                    nome: sup.nome,
                    tipo: sup.tipo,
                    regime: "normal",
                    uf: companyData?.endereco?.uf || "SP",
                    ativo: true,
                });

                randomProducts.forEach((prod) => {
                    upsertOferta({
                        fornecedorId,
                        produtoId: prod.ncm_sugerido || "",
                        produtoDescricao: prod.nome || prod.original_name,
                        preco: (Number(prod.preco_medio) || 100) * (Math.random() * 0.2 + 0.9),
                        ibs: 0,
                        cbs: 0,
                        is: 0,
                        frete: 0,
                        ativa: true,
                    });
                });
            });

            // Trigger calculation/enrichment
            await enrichSuppliers();

            toast.success("Configuração concluída! Redirecionando para simulação...");

            setTimeout(() => {
                onOpenChange(false);
                navigate("/quote"); // Assuming this is the route
            }, 1500);

        } catch (error) {
            console.error("Error in simulation:", error);
            toast.error("Erro ao gerar simulação.");
            setStep("review");
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case "config":
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                            <div className="flex items-start gap-3">
                                <Key className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="space-y-1">
                                    <h4 className="font-medium">Chave da API Gemini</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Para usar o recurso gratuito, forneça sua chave. Usuários Premium usam a chave da plataforma.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">Sua API Key (Opcional para Premium)</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="Cole sua chave aqui (AIza...)"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                    </div>
                );

            case "company":
                return (
                    <div className="space-y-4">
                        {!companyData ? (
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
                                        <p className="text-sm text-muted-foreground">Extraindo dados do CNPJ...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Building2 className="h-8 w-8 text-muted-foreground" />
                                        <p className="font-medium">Arraste o Cartão CNPJ (PDF/Imagem)</p>
                                        <p className="text-xs text-muted-foreground">Identificaremos nome, endereço e regime tributário.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-medium text-primary">Dados Extraídos</h4>
                                        <Button variant="ghost" size="sm" onClick={() => setCompanyData(null)}>Alterar</Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Razão Social:</span>
                                            <p>{companyData.razao_social}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">CNPJ:</span>
                                            <p>{companyData.cnpj}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Endereço:</span>
                                            <p>{companyData.endereco?.logradouro}, {companyData.endereco?.numero} - {companyData.endereco?.uf}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                );

            case "products":
                return (
                    <div className="space-y-4">
                        {productsData.length === 0 ? (
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
                                        <p className="text-sm text-muted-foreground">Classificando produtos com IA...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Package className="h-8 w-8 text-muted-foreground" />
                                        <p className="font-medium">Arraste sua lista de produtos (CSV)</p>
                                        <p className="text-xs text-muted-foreground">Sugeriremos os NCMs corretos automaticamente.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">{productsData.length} Produtos Encontrados</h4>
                                    <Button variant="ghost" size="sm" onClick={() => setProductsData([])}>Reenviar</Button>
                                </div>
                                <Card className="max-h-[300px] overflow-auto">
                                    <CardContent className="p-0">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted sticky top-0">
                                                <tr>
                                                    <th className="p-2">Produto</th>
                                                    <th className="p-2">NCM Sugerido</th>
                                                    <th className="p-2">Confiança</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {productsData.map((item, i) => (
                                                    <tr key={i} className="border-b">
                                                        <td className="p-2">{item.nome || item.original_name}</td>
                                                        <td className="p-2 font-mono text-primary">{item.ncm_sugerido}</td>
                                                        <td className="p-2 text-xs">{item.confidence || "Alta"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                );

            case "review":
                return (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <h3 className="font-medium text-primary mb-2">Tudo pronto!</h3>
                            <p className="text-sm text-muted-foreground">
                                Revisamos seus dados. Ao clicar em finalizar, vamos:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                                <li>Cadastrar <strong>{productsData.length} produtos</strong> no catálogo.</li>
                                <li>Definir <strong>{companyData?.razao_social || "Sua Empresa"}</strong> como perfil principal.</li>
                                <li>Gerar uma <strong>Simulação Inicial</strong> com fornecedores de exemplo.</li>
                            </ul>
                        </div>
                    </div>
                );

            case "simulating":
                return (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <div>
                            <h3 className="text-lg font-medium">Gerando Simulação...</h3>
                            <p className="text-muted-foreground">A IA está calculando os impostos para o seu cenário.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Smart Setup (AI)
                    </DialogTitle>
                    <DialogDescription>
                        Passo {step === "config" ? 1 : step === "company" ? 2 : step === "products" ? 3 : 4} de 4
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {renderStepContent()}
                </div>

                {step !== "simulating" && (
                    <DialogFooter className="flex justify-between sm:justify-between">
                        <Button variant="ghost" onClick={step === "config" ? () => onOpenChange(false) : handleBack}>
                            {step === "config" ? "Cancelar" : <><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</>}
                        </Button>

                        {step === "review" ? (
                            <Button onClick={handleFinish}>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Finalizar e Simular
                            </Button>
                        ) : (
                            <Button onClick={handleNext} disabled={
                                (step === "company" && !companyData) ||
                                (step === "products" && productsData.length === 0)
                            }>
                                Próximo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
