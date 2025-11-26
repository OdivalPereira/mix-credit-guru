import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import SuppliersManager from "@/components/cadastros/SuppliersManager";
import ContractsManager from "@/components/cadastros/ContractsManager";
import Catalogo from "./Catalogo";
import UnidadesConversoes from "./UnidadesConversoes";

/**
 * @description Um componente de página que fornece uma interface com abas para gerenciar fornecedores, produtos, contratos e conversões de unidades.
 * @returns O componente da página de cadastros.
 */
const Cadastros = () => {
  return (
    <div className="space-y-8">
      <PageHeader
        icon={FolderOpen}
        iconColor="warning"
        title="Cadastros operacionais"
        description="Organize fornecedores, produtos, contratos e conversões em um só lugar."
      />

      <Tabs defaultValue="fornecedores" className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-2 bg-muted/50 p-1">
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
          <TabsTrigger value="unidades">Unidades & conversões</TabsTrigger>
        </TabsList>

        <TabsContent value="fornecedores" className="space-y-6">
          <SuppliersManager />
        </TabsContent>

        <TabsContent value="catalogo" className="space-y-6">
          <Catalogo />
        </TabsContent>

        <TabsContent value="contratos" className="space-y-6">
          <ContractsManager />
        </TabsContent>

        <TabsContent value="unidades" className="space-y-6">
          <UnidadesConversoes />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Cadastros;
