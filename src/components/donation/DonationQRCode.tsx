import { useState } from 'react';
import QRCodeSVG from 'react-qr-code';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DonationQRCodeProps {
  amount: number;
}

export const DonationQRCode = ({ amount }: DonationQRCodeProps) => {
  const [copied, setCopied] = useState(false);
  
  // Mock PIX code - em produção seria gerado dinamicamente via API
  const pixCode = `00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540${amount.toFixed(2)}5802BR5925Mix Credit Guru6009SAO PAULO62070503***6304`;

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast({
        title: "Código PIX copiado!",
        description: "Cole no seu aplicativo de pagamento",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-background p-4 rounded-lg border flex justify-center">
        <QRCodeSVG 
          value={pixCode}
          size={200}
          level="M"
          className="w-full max-w-[200px] h-auto"
        />
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-center">
          Escaneie o QR Code ou copie o código PIX
        </p>
        
        <div className="bg-muted p-3 rounded-md">
          <p className="text-xs font-mono break-all text-muted-foreground">
            {pixCode}
          </p>
        </div>
        
        <Button 
          className="w-full" 
          onClick={handleCopyPix}
          variant={copied ? "secondary" : "default"}
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copiar Código PIX
            </>
          )}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        O pagamento é processado instantaneamente após a confirmação
      </p>
    </div>
  );
};
