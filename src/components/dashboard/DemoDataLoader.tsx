import { useState } from "react";
import { Database, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { comboXTudo, suppliers as demoSuppliers } from "@/data/combo-x-tudo";
import { generateId } from "@/lib/utils";

const DEMO_LOADED_KEY = "mix-credit-guru-demo-loaded";

export function DemoDataLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const addProduto = useCatalogoStore((state) => state.addProduto);
  const upsertFornecedor = useCotacaoStore((state) => state.upsertFornecedor);
  const setContexto = useCotacaoStore((state) => state.setContexto);
  const produtos = useCatalogoStore((state) => state.produtos);
  const fornecedores = useCotacaoStore((state) => state.fornecedores);

  // Check if demo data was already loaded or user already has data
  const hasData = produtos.length > 0 || fornecedores.length > 0;
  const demoAlreadyLoaded = localStorage.getItem(DEMO_LOADED_KEY) === "true";

  if (hasData || demoAlreadyLoaded) return null;

  const handleLoadDemoData = async () => {
    setIsLoading(true);

    try {
      // Add demo products
      for (const produto of comboXTudo) {
        addProduto({
          ...produto,
          id: generateId("produto"),
        });
      }

      // Add demo suppliers with sample prices
      const supplierPrices = [
        { preco: 25.5, frete: 2.0 },
        { preco: 28.0, frete: 1.5 },
        { preco: 23.0, frete: 3.0 },
      ];

      for (let i = 0; i < demoSuppliers.length; i++) {
        const supplier = demoSuppliers[i];
        const prices = supplierPrices[i] || { preco: 25.0, frete: 2.0 };
        
        upsertFornecedor({
          ...supplier,
          id: generateId("fornecedor"),
          preco: prices.preco,
          frete: prices.frete,
          produtoDescricao: "X-Tudo",
          flagsItem: { cesta: false, reducao: false },
        });
      }

      // Set initial context
      setContexto({
        data: new Date().toISOString().slice(0, 10),
        uf: "SP",
        destino: "C",
        regime: "normal",
        produto: "X-Tudo",
      });

      localStorage.setItem(DEMO_LOADED_KEY, "true");

      toast({
        title: "Dados de demonstração carregados!",
        description: `${comboXTudo.length} produtos e ${demoSuppliers.length} fornecedores foram adicionados.`,
      });
    } catch (error) {
      console.error("Erro ao carregar dados de demonstração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de demonstração.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
        >
          <Database className="h-4 w-4" />
          <span>Carregar Dados de Demonstração</span>
          <Sparkles className="h-3 w-3 text-primary" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Carregar Dados de Demonstração
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Isso adicionará dados de exemplo para você explorar a ferramenta:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>{comboXTudo.length} produtos</strong> com NCM e flags tributárias</li>
              <li><strong>{demoSuppliers.length} fornecedores</strong> de diferentes regimes</li>
              <li>Preços e fretes de exemplo para comparação</li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Você pode editar ou remover esses dados a qualquer momento.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleLoadDemoData} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              "Carregar Dados"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
