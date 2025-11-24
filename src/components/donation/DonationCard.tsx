import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DonationOption } from './donationData';

interface DonationCardProps {
  option: DonationOption;
  onClick: () => void;
  variant?: 'default' | 'special';
}

export const DonationCard = ({ option, onClick, variant = 'default' }: DonationCardProps) => {
  const IconComponent = option.icon;
  
  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105",
        variant === 'special' && "border-dashed border-2 border-primary bg-primary/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6 text-center space-y-3">
        <div className="flex justify-center">
          <div className={cn(
            "p-3 rounded-full",
            variant === 'special' ? "bg-primary/10" : "bg-secondary"
          )}>
            <IconComponent className={cn(
              "h-6 w-6",
              variant === 'special' ? "text-primary" : "text-primary"
            )} />
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground">{option.title}</h3>
          <p className="text-sm text-muted-foreground">{option.description}</p>
        </div>
        
        {option.amount && (
          <Badge 
            variant={variant === 'special' ? 'outline' : 'secondary'}
            className="text-base font-bold"
          >
            {option.amount}
          </Badge>
        )}
        
        {variant === 'special' && (
          <Badge variant="outline" className="mt-2 border-primary text-primary">
            Pessoal
          </Badge>
        )}
      </CardContent>
    </Card>
  );
};
