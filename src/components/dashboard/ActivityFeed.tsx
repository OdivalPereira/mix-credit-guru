import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useActivityLogStore, 
  activityTypeLabels, 
  ActivityType 
} from '@/store/useActivityLogStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Package, 
  Users, 
  FileText, 
  Calculator, 
  Scale, 
  LogIn, 
  LogOut, 
  User, 
  Database, 
  Settings,
  Activity,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ElementType> = {
  Package,
  Users,
  FileText,
  Calculator,
  Scale,
  LogIn,
  LogOut,
  User,
  Database,
  Settings,
};

const getActivityIcon = (activityType: ActivityType): React.ElementType => {
  const iconMapping: Record<ActivityType, React.ElementType> = {
    produto_criado: Package,
    produto_atualizado: Package,
    produto_excluido: Package,
    fornecedor_criado: Users,
    fornecedor_atualizado: Users,
    fornecedor_excluido: Users,
    contrato_criado: FileText,
    contrato_atualizado: FileText,
    contrato_excluido: FileText,
    cotacao_criada: Calculator,
    cotacao_atualizada: Calculator,
    cotacao_excluida: Calculator,
    regra_criada: Scale,
    regra_atualizada: Scale,
    regra_excluida: Scale,
    login: LogIn,
    logout: LogOut,
    perfil_atualizado: User,
    demo_carregado: Database,
    configuracao_alterada: Settings,
  };
  return iconMapping[activityType] || Activity;
};

const getActivityColor = (activityType: ActivityType): string => {
  if (activityType.includes('criado') || activityType.includes('criada') || activityType === 'login') {
    return 'text-success bg-success/10 border-success/20';
  }
  if (activityType.includes('excluido') || activityType.includes('excluida') || activityType === 'logout') {
    return 'text-destructive bg-destructive/10 border-destructive/20';
  }
  return 'text-primary bg-primary/10 border-primary/20';
};

export function ActivityFeed() {
  const { logs, isLoading, fetchLogs } = useActivityLogStore();

  useEffect(() => {
    fetchLogs(20);
  }, [fetchLogs]);

  return (
    <Card className="relative overflow-hidden border-border/50 backdrop-blur-sm" data-tour="activity-feed">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
      
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="w-5 h-5 text-primary" />
          Atividade Recente
        </CardTitle>
        <CardDescription>
          Histórico das últimas ações realizadas no sistema
        </CardDescription>
      </CardHeader>

      <CardContent className="relative">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              Nenhuma atividade registrada
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Suas ações aparecerão aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {logs.map((log) => {
                const Icon = getActivityIcon(log.activity_type);
                const colorClasses = getActivityColor(log.activity_type);
                
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-card/50 border border-border/30 hover:border-border/50 transition-colors"
                  >
                    <div className={cn(
                      "p-2.5 rounded-lg border shrink-0",
                      colorClasses
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activityTypeLabels[log.activity_type]}
                      </p>
                      {log.entity_name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {log.entity_name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
