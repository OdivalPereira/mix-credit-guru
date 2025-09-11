import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Download,
  Search,
  Plus,
  ShoppingCart,
  Package,
} from "lucide-react";
import {
  useCatalogoStore,
  Produto,
} from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";

export default function Catalogo() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    produtos,
    addProduto,
    updateProduto,
    removeProduto,
    importarCSV,
    exportarCSV,
  } = useCatalogoStore();
  const setContexto = useCotacaoStore((s) => s.setContexto);

  const filteredProducts = produtos.filter(
    (product) =>
      product.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.ncm.includes(searchTerm),
  );

  const handleImport = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    importarCSV(text);
    e.target.value = "";
  };

  const handleExport = () => {
    const csv = exportarCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "produtos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdd = () => {
    const id = crypto.randomUUID();
    addProduto({
      id,
      descricao: "",
      ncm: "",
      flags: { refeicao: false, cesta: false, reducao: false, is: false },
    });
    setEditingId(id);
  };

  const handleUsar = (product: Produto) => {
    setContexto({ produto: `${product.ncm} - ${product.descricao}` });
  };

  const getFlagBadge = (flag: keyof Produto["flags"], active: boolean) => {
    if (!active) return null;

    const variants: Record<keyof Produto["flags"], { variant: string; label: string }> = {
      refeicao: { variant: "success", label: "Refeição" },
      cesta: { variant: "default", label: "Cesta Básica" },
      reducao: { variant: "warning", label: "Redução" },
      is: { variant: "destructive", label: "IS" },
    };

    const config = variants[flag];
    return (
      <Badge variant={config.variant} className="mr-1 mb-1">
        {config.label}
      </Badge>
    );
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Importar CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={handleAdd}>
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
              {editingId === product.id ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Descrição"
                    value={product.descricao}
                    onChange={(e) =>
                      updateProduto(product.id, { descricao: e.target.value })
                    }
                  />
                  <Input
                    placeholder="NCM"
                    value={product.ncm}
                    onChange={(e) =>
                      updateProduto(product.id, { ncm: e.target.value })
                    }
                  />
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {product.descricao}
                    </CardTitle>
                    <CardDescription>NCM: {product.ncm}</CardDescription>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Flags */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Características
                  </h4>
                  {editingId === product.id ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`refeicao-${product.id}`}
                          checked={product.flags.refeicao}
                          onCheckedChange={(v) =>
                            updateProduto(product.id, {
                              flags: { ...product.flags, refeicao: v as boolean },
                            })
                          }
                        />
                        <Label htmlFor={`refeicao-${product.id}`}>Refeição</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`cesta-${product.id}`}
                          checked={product.flags.cesta}
                          onCheckedChange={(v) =>
                            updateProduto(product.id, {
                              flags: { ...product.flags, cesta: v as boolean },
                            })
                          }
                        />
                        <Label htmlFor={`cesta-${product.id}`}>Cesta Básica</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`reducao-${product.id}`}
                          checked={product.flags.reducao}
                          onCheckedChange={(v) =>
                            updateProduto(product.id, {
                              flags: { ...product.flags, reducao: v as boolean },
                            })
                          }
                        />
                        <Label htmlFor={`reducao-${product.id}`}>Redução</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`is-${product.id}`}
                          checked={product.flags.is}
                          onCheckedChange={(v) =>
                            updateProduto(product.id, {
                              flags: { ...product.flags, is: v as boolean },
                            })
                          }
                        />
                        <Label htmlFor={`is-${product.id}`}>IS</Label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap">
                      {getFlagBadge("refeicao", product.flags.refeicao)}
                      {getFlagBadge("cesta", product.flags.cesta)}
                      {getFlagBadge("reducao", product.flags.reducao)}
                      {getFlagBadge("is", product.flags.is)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {editingId === product.id ? (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingId(null)}
                    >
                      Concluir
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      onClick={() => removeProduto(product.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setEditingId(product.id)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleUsar(product)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Usar na Cotação
                    </Button>
                  </div>
                )}
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