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
import { useActivityLogStore } from "@/store/useActivityLogStore";
import { comboXTudo, fornecedoresCadastro, ofertasTemplate } from "@/data/combo-x-tudo";
import { generateId } from "@/lib/utils";

const DEMO_LOADED_KEY = "mix-credit-guru-demo-loaded";

export function DemoDataLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const addProduto = useCatalogoStore((state) => state.addProduto);
  const upsertFornecedorCadastro = useCotacaoStore((state) => state.upsertFornecedorCadastro);
  const upsertOferta = useCotacaoStore((state) => state.upsertOferta);
  const setContexto = useCotacaoStore((state) => state.setContexto);
  const produtos = useCatalogoStore((state) => state.produtos);
  const fornecedoresCadastroStore = useCotacaoStore((state) => state.fornecedoresCadastro);
  const logActivity = useActivityLogStore((state) => state.logActivity);

  // Check if demo data was already loaded or user already has data
  const hasData = produtos.length > 0 || fornecedoresCadastroStore.length > 0;
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

      // Add demo suppliers (cadastro)
      const fornecedorIdMap = new Map<string, string>();
      for (const fornecedor of fornecedoresCadastro) {
        const newId = generateId("fornecedor");
        fornecedorIdMap.set(fornecedor.id, newId);
        upsertFornecedorCadastro({
          ...fornecedor,
          id: newId,
        });
      }

      // Add demo offers with sample prices
      const offerPrices = [
        { preco: 25.5, frete: 2.0 },
        { preco: 28.0, frete: 1.5 },
        { preco: 23.0, frete: 3.0 },
      ];

      for (let i = 0; i < ofertasTemplate.length; i++) {
        const template = ofertasTemplate[i];
        const prices = offerPrices[i] || { preco: 25.0, frete: 2.0 };
        const newFornecedorId = fornecedorIdMap.get(template.fornecedorId) || template.fornecedorId;

        upsertOferta({
          ...template,
          id: generateId("oferta"),
          fornecedorId: newFornecedorId,
          produtoId: "x-tudo",
          produtoDescricao: "X-Tudo",
          preco: prices.preco,
          frete: prices.frete,
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

      // Log activity
      logActivity({
        activity_type: 'demo_carregado',
        entity_type: 'demo',
        entity_name: `${comboXTudo.length} produtos, ${fornecedoresCadastro.length} fornecedores`,
        metadata: {
          produtos_count: comboXTudo.length,
          fornecedores_count: fornecedoresCadastro.length,
        },
      });

      toast({
        title: "Dados de demonstração carregados!",
        description: `${comboXTudo.length} produtos e ${fornecedoresCadastro.length} fornecedores foram adicionados.`,
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
              <li><strong>{fornecedoresCadastro.length} fornecedores</strong> de diferentes regimes</li>
              <li>Preços e fretes de exemplo para comparação</li>
              <li><strong>Condições comerciais</strong>: degraus de preço, faixas de frete e rendimento</li>
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
