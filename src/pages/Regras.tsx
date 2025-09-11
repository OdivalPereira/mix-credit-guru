import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

const creditMatrix = [
  {
    destino: "Refeição (A)",
    regimeNormal: { credito: "Total", status: "yes" },
    simples: { credito: "Não", status: "no" },
    presumido: { credito: "Limitado", status: "limited" }
  },
  {
    destino: "Revenda (B)",
    regimeNormal: { credito: "Total", status: "yes" },
    simples: { credito: "Não", status: "no" },
    presumido: { credito: "Total", status: "yes" }
  }
];

const taxTerms = [
  { term: "IBS", definition: "Imposto sobre Bens e Serviços - substitui ICMS, ISS, IPI" },
  { term: "CBS", definition: "Contribuição sobre Bens e Serviços - substitui PIS e COFINS" },
  { term: "IS", definition: "Imposto Seletivo - incide sobre produtos específicos" },
  { term: "NCM", definition: "Nomenclatura Comum do Mercosul - código de classificação de mercadorias" }
];

export default function Regras() {
  const getCreditBadge = (status: string) => {
    switch(status) {
      case 'yes':
        return <Badge variant="success">✓ Total</Badge>;
      case 'no':
        return <Badge variant="destructive">ɸ Não</Badge>;
      case 'limited':
        return <Badge variant="warning">! Limitado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Regras de Crédito</h2>
        <p className="text-muted-foreground">
          Matriz de creditabilidade tributária por regime e destinação
        </p>
      </div>

      {/* Credit Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Crédito Tributário</CardTitle>
          <CardDescription>
            Regras de creditabilidade baseadas no regime do comprador e destinação da mercadoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinação</TableHead>
                  <TableHead className="text-center">Regime Normal</TableHead>
                  <TableHead className="text-center">Simples Nacional</TableHead>
                  <TableHead className="text-center">Lucro Presumido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditMatrix.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.destino}</TableCell>
                    <TableCell className="text-center">
                      {getCreditBadge(row.regimeNormal.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getCreditBadge(row.simples.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getCreditBadge(row.presumido.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Tax Terms Glossary */}
      <Card>
        <CardHeader>
          <CardTitle>Glossário de Termos Tributários</CardTitle>
          <CardDescription>
            Definições dos principais termos utilizados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {taxTerms.map((item, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{item.term}</Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{item.definition}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground flex-1">{item.definition}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Regras Especiais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-success/20 bg-success/5 rounded-lg">
            <h4 className="font-medium text-success mb-2">Cesta Básica</h4>
            <p className="text-sm text-muted-foreground">
              Produtos da cesta básica possuem alíquota reduzida e regras especiais de creditabilidade
            </p>
          </div>
          
          <div className="p-4 border border-warning/20 bg-warning/5 rounded-lg">
            <h4 className="font-medium text-warning mb-2">Imposto Seletivo</h4>
            <p className="text-sm text-muted-foreground">
              Produtos sujeitos ao IS (bebidas, cigarros, etc.) têm tributação adicional
            </p>
          </div>
          
          <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
            <h4 className="font-medium text-primary mb-2">Transição 2025-2027</h4>
            <p className="text-sm text-muted-foreground">
              Durante o período de transição, coexistirão regras antigas e novas
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}