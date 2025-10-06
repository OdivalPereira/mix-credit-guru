import { useState, useEffect } from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Coffee, Book, Code, Palette, Music, Camera, ExternalLink } from "lucide-react";

interface DonationOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  amount: string;
  color: string;
}

const donationOptions: DonationOption[] = [
  {
    id: "coffee",
    title: "Me pague um cafe",
    description: "Ajude a manter o desenvolvedor acordado",
    icon: Coffee,
    amount: "R$ 5,00",
    color: "amber"
  },
  {
    id: "book", 
    title: "Compre um livro",
    description: "Invista no aprendizado continuo",
    icon: Book,
    amount: "R$ 25,00",
    color: "blue"
  },
  {
    id: "course",
    title: "Financie um curso",
    description: "Apoie o desenvolvimento profissional",
    icon: Code,
    amount: "R$ 100,00", 
    color: "green"
  },
  {
    id: "design",
    title: "Melhore o design",
    description: "Invista em ferramentas de design",
    icon: Palette,
    amount: "R$ 50,00",
    color: "purple"
  },
  {
    id: "music",
    title: "Trilha sonora",
    description: "Apoie a playlist de trabalho",
    icon: Music,
    amount: "R$ 15,00",
    color: "pink"
  },
  {
    id: "equipment",
    title: "Novo equipamento",
    description: "Ajude com hardware e equipamentos",
    icon: Camera,
    amount: "R$ 200,00",
    color: "orange"
  },
  {
    id: "custom",
    title: "Valor personalizado",
    description: "Escolha o valor que desejar",
    icon: Heart,
    amount: "Livre",
    color: "red"
  }
];

const DonationModal = () => {
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<DonationOption | null>(null);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  const handleDonationClick = (donation: DonationOption) => {
    setSelectedDonation(donation);
    setIsMainModalOpen(false);
  };

  const handleProjectsClick = () => {
    setIsProjectsModalOpen(true);
    setIsMainModalOpen(false);
  };

  return (
    <>
      {/* Modal Principal */}
      <Dialog open={isMainModalOpen} onOpenChange={setIsMainModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Apoie este projeto
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {donationOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <Card 
                  key={option.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                  onClick={() => handleDonationClick(option)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <IconComponent className="h-8 w-8 text-primary" />
                      <Badge variant="secondary">{option.amount}</Badge>
                    </div>
                    <CardTitle className="text-sm">{option.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs">
                      {option.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Card para outros projetos */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-dashed"
              onClick={handleProjectsClick}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <ExternalLink className="h-8 w-8 text-muted-foreground" />
                  <Badge variant="outline">Explore</Badge>
                </div>
                <CardTitle className="text-sm">Outros projetos</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  Conheca outros projetos incriveis
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Doacao Especifica */}
      <Dialog open={!!selectedDonation} onOpenChange={() => setSelectedDonation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDonation && <selectedDonation.icon className="h-6 w-6" />}
              {selectedDonation?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {selectedDonation?.description}
            </p>
            
            <div className="bg-secondary p-4 rounded-lg">
              <p className="font-semibold">Valor sugerido: {selectedDonation?.amount}</p>
            </div>
            
            <div className="space-y-2">
              <Button className="w-full" size="lg">
                Doar via PIX
              </Button>
              <Button variant="outline" className="w-full">
                Cartao de Credito
              </Button>
              <Button variant="ghost" className="w-full" size="sm">
                PayPal
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              Sua doacao ajuda a manter este projeto gratuito e em constante evolucao
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Outros Projetos */}
      <Dialog open={isProjectsModalOpen} onOpenChange={setIsProjectsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-6 w-6" />
              Outros Projetos
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">Sistema de Estoque</CardTitle>
                <CardDescription>
                  Controle completo de inventario para pequenas empresas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Ver projeto
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">Calculadora Fiscal</CardTitle>
                <CardDescription>
                  Ferramenta para calculos tributarios brasileiros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Ver projeto
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">Dashboard Analytics</CardTitle>
                <CardDescription>
                  Visualizacao de dados em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Ver projeto
                </Button>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">API Gateway</CardTitle>
                <CardDescription>
                  Solucao para gerenciamento de APIs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full">
                  Ver projeto
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DonationModal;






