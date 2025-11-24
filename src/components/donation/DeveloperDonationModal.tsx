import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { DonationCard } from './DonationCard';
import { DonationQRCode } from './DonationQRCode';
import { DonationCustomAmount } from './DonationCustomAmount';
import { developerDonationOptions, DonationOption } from './donationData';

interface DeveloperDonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

export const DeveloperDonationModal = ({ isOpen, onClose, onBack }: DeveloperDonationModalProps) => {
  const [selectedDonation, setSelectedDonation] = useState<DonationOption | null>(null);
  const [customAmount, setCustomAmount] = useState<number | null>(null);

  const handleDonationClick = (option: DonationOption) => {
    setSelectedDonation(option);
    if (option.id === 'custom-dev') {
      setCustomAmount(null);
    } else {
      setCustomAmount(option.numericValue || null);
    }
  };

  const handleCustomAmountSelect = (amount: number) => {
    setCustomAmount(amount);
  };

  const handleClosePaymentModal = () => {
    setSelectedDonation(null);
    setCustomAmount(null);
  };

  const handleBackToProject = () => {
    setSelectedDonation(null);
    setCustomAmount(null);
    onClose();
    onBack();
  };

  return (
    <>
      {/* Modal de seleção de doações do desenvolvedor */}
      <Dialog open={isOpen && !selectedDonation} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Apoie o Desenvolvedor Diretamente ☕</DialogTitle>
            <DialogDescription className="text-center text-base">
              Apoie diretamente o criador deste projeto. Sua contribuição ajuda nas necessidades pessoais e profissionais.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            {developerDonationOptions.map((option) => (
              <DonationCard
                key={option.id}
                option={option}
                onClick={() => handleDonationClick(option)}
                variant="default"
              />
            ))}
          </div>

          <div className="flex justify-center pt-4 border-t">
            <Button variant="outline" onClick={handleBackToProject} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              ❤️ Voltar para doações do projeto
            </Button>
          </div>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Apoie diretamente o criador deste projeto
          </p>
        </DialogContent>
      </Dialog>

      {/* Modal de pagamento específico */}
      <Dialog open={!!selectedDonation} onOpenChange={handleClosePaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {selectedDonation?.icon && <selectedDonation.icon className="h-5 w-5 text-primary" />}
              {selectedDonation?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedDonation?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDonation?.id === 'custom-dev' && (
              <DonationCustomAmount onSelect={handleCustomAmountSelect} />
            )}

            {customAmount && (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground">Valor selecionado</p>
                <p className="text-2xl font-bold text-primary">R$ {customAmount.toFixed(2)}</p>
              </div>
            )}

            <Tabs defaultValue="pix" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pix">PIX</TabsTrigger>
                <TabsTrigger value="card">Cartão</TabsTrigger>
              </TabsList>

              <TabsContent value="pix" className="space-y-4">
                {customAmount ? (
                  <DonationQRCode amount={customAmount} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Selecione um valor para gerar o QR Code
                  </div>
                )}
              </TabsContent>

              <TabsContent value="card" className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <CreditCard className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Integração com cartão de crédito em breve
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
