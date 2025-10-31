import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, Target, Heart } from 'lucide-react';

// Mock data - em produção viria de uma API/banco de dados
const stats = {
  totalDonors: 42,
  monthlyGoal: 2000,
  currentAmount: 500,
  totalDonations: 156,
};

export const DonationStats = () => {
  const goalPercentage = (stats.currentAmount / stats.monthlyGoal) * 100;

  return (
    <div className="bg-secondary/50 p-4 rounded-lg space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Meta do mês
          </span>
          <span className="text-muted-foreground">
            R$ {stats.currentAmount} / R$ {stats.monthlyGoal}
          </span>
        </div>
        <Progress value={goalPercentage} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          {goalPercentage.toFixed(0)}% alcançado
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 bg-background/50">
          <CardContent className="p-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Apoiadores</p>
              <p className="text-lg font-bold">{stats.totalDonors}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-background/50">
          <CardContent className="p-3 flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Doações</p>
              <p className="text-lg font-bold">{stats.totalDonations}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
