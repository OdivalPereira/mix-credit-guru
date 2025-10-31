import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const quickAmounts = [10, 25, 50, 100, 250];

interface DonationCustomAmountProps {
  onSelect: (amount: number) => void;
}

export const DonationCustomAmount = ({ onSelect }: DonationCustomAmountProps) => {
  const [customAmount, setCustomAmount] = useState('');

  const handleQuickAmount = (amount: number) => {
    setCustomAmount(amount.toString());
    onSelect(amount);
  };

  const handleCustomSubmit = () => {
    const amount = Number(customAmount);
    if (amount >= 5) {
      onSelect(amount);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Valores rápidos</Label>
        <div className="flex gap-2 flex-wrap">
          {quickAmounts.map(amount => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => handleQuickAmount(amount)}
              className="hover-scale"
            >
              R$ {amount}
            </Button>
          ))}
        </div>
      </div>
      
      <div>
        <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">
          Ou escolha outro valor
        </Label>
        <div className="flex gap-2">
          <Input
            id="custom-amount"
            type="number"
            placeholder="Valor mínimo R$ 5"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            min="5"
            step="5"
          />
          <Button 
            onClick={handleCustomSubmit}
            disabled={!customAmount || Number(customAmount) < 5}
          >
            Confirmar
          </Button>
        </div>
        {customAmount && Number(customAmount) < 5 && (
          <p className="text-xs text-destructive mt-1">Valor mínimo: R$ 5</p>
        )}
      </div>
    </div>
  );
};
