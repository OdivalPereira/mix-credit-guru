import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Search, Plus, ShoppingCart, Package } from "lucide-react";

const mockProducts = [
  {
    id: 1,
    descricao: "Arroz Branco Tipo 1",
    ncm: "10063021",
    flags: {
      refeicao: true,
      cesta: true,
      reducao: false,
      is: true
    }
  },
  {
    id: 2,
    descricao: "Feijão Preto",
    ncm: "07133100",
    flags: {
      refeicao: true,
      cesta: true,
      reducao: true,
      is: false
    }
  },
  {
    id: 3,
    descricao: "Óleo de Soja Refinado",
    ncm: "15071000",
    flags: {
      refeicao: true,
      cesta: true,
      reducao: false,
      is: true
    }
  },
  {
    id: 4,
    descricao: "Açúcar Cristal",
    ncm: "17019900",
    flags: {
      refeicao: true,
      cesta: false,
      reducao: false,
      is: true
    }
  }
];

export default function Catalogo() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredProducts = mockProducts.filter(product =>
    product.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.ncm.includes(searchTerm)
  );

  const getFlagBadge = (flag: string, active: boolean) => {
    if (!active) return null;
    
    const variants: Record<string, any> = {
      refeicao: { variant: "success", label: "Refeição" },
      cesta: { variant: "default", label: "Cesta Básica" },
      reducao: { variant: "warning", label: "Redução" },
      is: { variant: "destructive", label: "IS" }
    };
    
    const config = variants[flag];
    return <Badge variant={config.variant} className="mr-1 mb-1">{config.label}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Catálogo de Produtos</h2>
          <p className="text-muted-foreground">
            Gerencie produtos com classificação NCM e características tributárias
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por descrição ou NCM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{product.descricao}</CardTitle>
                  <CardDescription>NCM: {product.ncm}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Flags */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Características</h4>
                  <div className="flex flex-wrap">
                    {getFlagBadge('refeicao', product.flags.refeicao)}
                    {getFlagBadge('cesta', product.flags.cesta)}
                    {getFlagBadge('reducao', product.flags.reducao)}
                    {getFlagBadge('is', product.flags.is)}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Editar
                  </Button>
                  <Button size="sm" className="flex-1">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Usar na Cotação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mt-1">
              Tente ajustar os critérios de busca ou adicione novos produtos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}