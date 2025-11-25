import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, FileText, ArrowLeftRight } from "lucide-react";

/**
 * @description Página unificada para gerenciar todos os dados do usuário
 * TODO: Implementar navegação por abas e formulários contextuais
 */
const MeusDados = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Meus Dados</h1>
        <p className="text-muted-foreground">
          Gerencie seus produtos, fornecedores, contratos e unidades de conversão
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-dashed">
          <CardHeader>
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Produtos</CardTitle>
            <CardDescription>Catálogo de produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Em desenvolvimento...</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed">
          <CardHeader>
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
              <Users className="h-6 w-6 text-success" />
            </div>
            <CardTitle>Fornecedores</CardTitle>
            <CardDescription>Lista de fornecedores</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Em desenvolvimento...</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed">
          <CardHeader>
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
              <FileText className="h-6 w-6 text-warning" />
            </div>
            <CardTitle>Contratos</CardTitle>
            <CardDescription>Contratos ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Em desenvolvimento...</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-dashed">
          <CardHeader>
            <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
              <ArrowLeftRight className="h-6 w-6 text-accent" />
            </div>
            <CardTitle>Conversões</CardTitle>
            <CardDescription>Unidades e conversões</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Em desenvolvimento...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MeusDados;
