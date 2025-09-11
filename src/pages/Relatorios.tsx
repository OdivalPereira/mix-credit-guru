import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, BarChart3, PieChart } from "lucide-react";

const reportTypes = [
  {
    id: 1,
    title: "Comparação Completa de Fornecedores",
    description: "Relatório detalhado com todos os fornecedores, custos efetivos e análise de créditos",
    format: "PDF/Excel",
    status: "ready"
  },
  {
    id: 2,
    title: "Análise de Economia Tributária",
    description: "Comparativo de economia gerada pela otimização de créditos tributários",
    format: "PDF",
    status: "ready"
  },
  {
    id: 3,
    title: "Relatório por Categoria NCM",
    description: "Agrupamento de produtos por classificação NCM com análise tributária",
    format: "Excel",
    status: "ready"
  },
  {
    id: 4,
    title: "Dashboard Executivo",
    description: "Visão gerencial com indicadores-chave e gráficos de performance",
    format: "PDF",
    status: "processing"
  }
];

const quickStats = [
  { label: "Fornecedores Analisados", value: "12", trend: "up" },
  { label: "Economia Potencial", value: "R$ 15.420", trend: "up" },
  { label: "Produtos Catalogados", value: "156", trend: "neutral" },
  { label: "Créditos Identificados", value: "R$ 8.760", trend: "up" }
];

export default function Relatorios() {
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ready':
        return <Badge variant="success">Disponível</Badge>;
      case 'processing':
        return <Badge variant="warning">Processando</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
        <p className="text-muted-foreground">
          Exporte análises detalhadas e comparações de fornecedores
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className="flex items-center">
                  {stat.trend === 'up' && <BarChart3 className="h-4 w-4 text-success" />}
                  {stat.trend === 'down' && <BarChart3 className="h-4 w-4 text-destructive" />}
                  {stat.trend === 'neutral' && <PieChart className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Available Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Relatórios Disponíveis
          </CardTitle>
          <CardDescription>
            Gere e exporte relatórios baseados nas análises atuais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportTypes.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{report.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{report.format}</Badge>
                    {getStatusBadge(report.status)}
                  </div>
                </div>
                <div className="ml-4">
                  <Button 
                    variant={report.status === 'ready' ? 'default' : 'secondary'} 
                    size="sm"
                    disabled={report.status !== 'ready'}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {report.status === 'ready' ? 'Baixar' : 'Aguardar'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Opções de Exportação</CardTitle>
          <CardDescription>
            Configure parâmetros para relatórios personalizados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <FileText className="h-6 w-6 mb-2" />
              <span>Exportar Cotação Atual</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>Gráfico de Comparação</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex-col">
              <PieChart className="h-6 w-6 mb-2" />
              <span>Análise de Créditos</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}