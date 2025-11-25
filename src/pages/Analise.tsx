import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calendar, FileText } from "lucide-react";

/**
 * @description Página unificada para análises: Impacto, Cenários e Relatórios
 * TODO: Migrar conteúdo das páginas ImpactoReforma, Cenarios e Relatorios
 */
const Analise = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Análise</h1>
        <p className="text-muted-foreground">
          Visualize o impacto da reforma, compare cenários e gere relatórios
        </p>
      </div>

      <Tabs defaultValue="impacto" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="impacto" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Impacto</span>
          </TabsTrigger>
          <TabsTrigger value="cenarios" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Cenários</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="impacto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Impacto da Reforma Tributária</CardTitle>
              <CardDescription>
                Compare custos antes e depois da reforma tributária
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Cenários</CardTitle>
              <CardDescription>
                Compare diferentes anos da transição tributária
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Consolidados</CardTitle>
              <CardDescription>
                Gere relatórios para exportação e impressão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analise;
