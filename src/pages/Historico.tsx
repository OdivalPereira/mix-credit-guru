import { useState, useMemo, useEffect } from 'react';
import { format, formatDistanceToNow, parseISO, subDays, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Package,
  Users,
  FileText,
  ShoppingCart,
  Settings,
  LogIn,
  LogOut,
  BookOpen,
  Database,
  Search,
  Filter,
  Calendar,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useActivityLogStore, ActivityType, activityTypeLabels, ActivityLog } from '@/store/useActivityLogStore';

const activityTypeIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  produto_criado: Package,
  produto_atualizado: Package,
  produto_excluido: Package,
  fornecedor_criado: Users,
  fornecedor_atualizado: Users,
  fornecedor_excluido: Users,
  contrato_criado: FileText,
  contrato_atualizado: FileText,
  contrato_excluido: FileText,
  cotacao_criada: ShoppingCart,
  cotacao_atualizada: ShoppingCart,
  cotacao_excluida: ShoppingCart,
  regra_criada: BookOpen,
  regra_atualizada: BookOpen,
  regra_excluida: BookOpen,
  login: LogIn,
  logout: LogOut,
  perfil_atualizado: Settings,
  demo_carregado: Database,
  configuracao_alterada: Settings,
};

const activityTypeColors: Record<string, string> = {
  criado: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  criada: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  atualizado: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  atualizada: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  excluido: 'bg-red-500/10 text-red-600 dark:text-red-400',
  excluida: 'bg-red-500/10 text-red-600 dark:text-red-400',
  login: 'bg-primary/10 text-primary',
  logout: 'bg-muted text-muted-foreground',
  carregado: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  alterada: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
};

const entityTypeOptions = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'produto', label: 'Produtos' },
  { value: 'fornecedor', label: 'Fornecedores' },
  { value: 'contrato', label: 'Contratos' },
  { value: 'cotacao', label: 'Cotações' },
  { value: 'regra', label: 'Regras' },
  { value: 'auth', label: 'Autenticação' },
  { value: 'config', label: 'Configurações' },
];

const dateRangeOptions = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'all', label: 'Todo o período' },
];

const ITEMS_PER_PAGE = 20;

function getActivityColor(type: string): string {
  for (const [key, color] of Object.entries(activityTypeColors)) {
    if (type.includes(key)) return color;
  }
  return 'bg-muted text-muted-foreground';
}

function ActivityRow({ log }: { log: ActivityLog }) {
  const Icon = activityTypeIcons[log.activity_type] || Settings;
  const color = getActivityColor(log.activity_type);
  const createdAt = parseISO(log.created_at);
  
  return (
    <div className="flex items-start gap-4 p-4 border-b border-border/50 hover:bg-muted/30 transition-colors">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">
            {activityTypeLabels[log.activity_type]}
          </span>
          {log.entity_name && (
            <Badge variant="outline" className="text-xs font-normal">
              {log.entity_name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span>{formatDistanceToNow(createdAt, { addSuffix: true, locale: ptBR })}</span>
          <span>•</span>
          <span>{format(createdAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {Object.entries(log.metadata).map(([key, value]) => (
              <span key={key} className="mr-3">
                <span className="font-medium">{key}:</span> {String(value)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Historico() {
  const { logs, isLoading, fetchLogs } = useActivityLogStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLogs(500);
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter by date range
    if (dateRange !== 'all') {
      const daysAgo = subDays(new Date(), parseInt(dateRange));
      result = result.filter(log => isAfter(parseISO(log.created_at), daysAgo));
    }

    // Filter by entity type
    if (entityFilter !== 'all') {
      if (entityFilter === 'auth') {
        result = result.filter(log => 
          log.activity_type === 'login' || log.activity_type === 'logout'
        );
      } else if (entityFilter === 'config') {
        result = result.filter(log => 
          log.activity_type === 'configuracao_alterada' || 
          log.activity_type === 'perfil_atualizado' ||
          log.activity_type === 'demo_carregado'
        );
      } else {
        result = result.filter(log => log.entity_type === entityFilter);
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.entity_name?.toLowerCase().includes(term) ||
        activityTypeLabels[log.activity_type].toLowerCase().includes(term) ||
        log.entity_type?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [logs, searchTerm, entityFilter, dateRange]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleRefresh = () => {
    fetchLogs(500);
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, entityFilter, dateRange]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={History}
        title="Histórico de Atividades"
        description="Visualize todas as ações realizadas no sistema"
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Registro de Atividades</CardTitle>
              <CardDescription>
                {filteredLogs.length} atividades encontradas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar tipo" />
              </SelectTrigger>
              <SelectContent>
                {entityTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activity List */}
          <div className="border border-border rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="space-y-0">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 border-b border-border/50">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Nenhuma atividade encontrada</p>
                <p className="text-sm">Tente ajustar os filtros ou período</p>
              </div>
            ) : (
              paginatedLogs.map(log => (
                <ActivityRow key={log.id} log={log} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
