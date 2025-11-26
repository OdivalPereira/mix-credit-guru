import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Package, Users, FileText, ArrowLeftRight, Search, Settings2, CheckCircle2, AlertCircle, FolderOpen } from "lucide-react";
import { CompletionBadge } from "@/components/shared/CompletionBadge";
import { GlossaryTerm, glossaryTerms } from "@/components/shared/GlossaryTerm";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import SuppliersManager from "@/components/cadastros/SuppliersManager";
import ContractsManager from "@/components/cadastros/ContractsManager";
import Catalogo from "./Catalogo";
import UnidadesConversoes from "./UnidadesConversoes";
import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import { useContractsStore } from "@/store/useContractsStore";
import { useUnidadesStore } from "@/store/useUnidadesStore";
import { MeusDadosProvider } from "@/contexts/MeusDadosContext";
import { SmartSetupWizard } from "@/components/onboarding/SmartSetupWizard";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

/**
 * @description Página unificada para gerenciar todos os dados: produtos, fornecedores, contratos e conversões
 */
function MeusDadosContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);

  const [activeTab, setActiveTab] = useState("produtos");
  const [wizardOpen, setWizardOpen] = useState(false);

  const produtos = useCatalogoStore((state) => state.produtos);
  const fornecedores = useCotacaoStore((state) => state.fornecedores);
  const contratos = useContractsStore((state) => state.contratos);
  const conversoes = useUnidadesStore((state) => state.conversoes);
  const yields = useUnidadesStore((state) => state.yields);

  const produtosAtivos = useMemo(() => produtos.filter((p) => p.ativo !== false).length, [produtos]);
  const fornecedoresAtivos = useMemo(() => fornecedores.filter((f) => f.ativo !== false).length, [fornecedores]);

  // Cálculo de progresso
  const completionScore = useMemo(() => {
    let score = 0;
    let maxScore = 4;

    if (produtos.length > 0) score += 1;
    if (fornecedores.length >= 2) score += 1;
    if (contratos.length > 0) score += 1;
    if (conversoes.length >= 2) score += 1;

    return { score, maxScore, percentage: (score / maxScore) * 100 };
  }, [produtos, fornecedores, contratos, conversoes]);

  const stats = [
    {
      label: "Produtos",
      value: produtos.length,
      active: produtosAtivos,
      icon: Package,
      color: "text-primary",
      hasData: produtos.length > 0,
      tab: "produtos"
    },
    {
      label: "Fornecedores",
      value: fornecedores.length,
      active: fornecedoresAtivos,
      icon: Users,
      color: "text-success",
      hasData: fornecedores.length > 0,
      tab: "fornecedores"
    },
    {
      label: "Contratos",
      value: contratos.length,
      icon: FileText,
      color: "text-warning",
      hasData: contratos.length > 0,
      tab: "contratos"
    },
    {
      label: "Unidades",
      value: conversoes.length + yields.length,
      icon: ArrowLeftRight,
      color: "text-accent",
      hasData: conversoes.length > 0,
      tab: "unidades"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={FolderOpen}
        iconColor="primary"
        title="Meus Dados"
        description={
          <>
            Você possui <strong>{produtos.length} produtos</strong> e <strong>{fornecedores.length} fornecedores</strong> cadastrados.
            Centralize e gerencie seus dados para otimização tributária.
          </>
        }
        badge={{
          label: `${completionScore.score}/${completionScore.maxScore} (${Math.round(completionScore.percentage)}%)`,
          variant: completionScore.percentage === 100 ? "success" : "secondary",
        }}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
              onClick={() => setWizardOpen(true)}
            >
              <Sparkles className="h-4 w-4" />
              Smart Setup (AI)
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="advanced-mode" className="text-sm cursor-pointer">
              Modo avançado
            </Label>
            <Switch
              id="advanced-mode"
              checked={advancedMode}
              onCheckedChange={setAdvancedMode}
            />
          </>
        }
      />

      <SmartSetupWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* Progress Card */}
      {completionScore.percentage < 100 && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Complete sua configuração</CardTitle>
                <CardDescription>
                  {completionScore.score} de {completionScore.maxScore} etapas concluídas
                </CardDescription>
              </div>
              <Badge variant={completionScore.percentage === 100 ? "success" : "secondary"}>
                {Math.round(completionScore.percentage)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={completionScore.percentage} className="h-2 mb-4" />
            <div className="grid gap-2 text-sm">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stat.hasData ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={stat.hasData ? "text-foreground" : "text-muted-foreground"}>
                      {stat.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab(stat.tab)}
                    className="text-xs text-primary hover:underline"
                  >
                    {stat.hasData ? "Ver" : "Adicionar"}
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            iconColor={stat.color.replace("text-", "") as any}
            badge={
              stat.active !== undefined && stat.value > 0
                ? { label: `${stat.active} ativos`, variant: "secondary" }
                : undefined
            }
            onClick={() => setActiveTab(stat.tab)}
          />
        ))}
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em todos os dados (produtos, fornecedores, contratos)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <p className="mt-2 text-xs text-muted-foreground">
              💡 Dica: A busca será aplicada na seção ativa abaixo
            </p>
          )}
        </CardContent>
      </Card>

      {/* Tabs with Data Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="produtos" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Produtos</span>
            <CompletionBadge completed={produtosAtivos} total={produtos.length} variant="compact" size="sm" showPercentage={false} />
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Fornecedores</span>
            <CompletionBadge completed={fornecedoresAtivos} total={fornecedores.length} variant="compact" size="sm" showPercentage={false} />
          </TabsTrigger>
          <TabsTrigger value="contratos" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contratos</span>
            <Badge variant="outline" className="text-xs px-1.5 py-0">{contratos.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unidades" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Unidades</span>
            <Badge variant="outline" className="text-xs px-1.5 py-0">{conversoes.length + yields.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="space-y-6 mt-0">
          <Catalogo />
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-6 mt-0">
          <SuppliersManager />
        </TabsContent>

        <TabsContent value="contratos" className="space-y-6 mt-0">
          <ContractsManager />
        </TabsContent>

        <TabsContent value="unidades" className="space-y-6 mt-0">
          <UnidadesConversoes />
        </TabsContent>
      </Tabs>

      {/* Advanced Mode Info */}
      {advancedMode && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Settings2 className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Modo avançado ativado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Campos técnicos e opções avançadas estão visíveis. Desative para uma experiência simplificada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const MeusDados = () => {
  return (
    <MeusDadosProvider>
      <MeusDadosContent />
    </MeusDadosProvider>
  );
};

export default MeusDados;
