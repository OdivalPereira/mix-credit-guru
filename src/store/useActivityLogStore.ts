import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type ActivityType = 
  | 'produto_criado'
  | 'produto_atualizado'
  | 'produto_excluido'
  | 'fornecedor_criado'
  | 'fornecedor_atualizado'
  | 'fornecedor_excluido'
  | 'contrato_criado'
  | 'contrato_atualizado'
  | 'contrato_excluido'
  | 'cotacao_criada'
  | 'cotacao_atualizada'
  | 'cotacao_excluida'
  | 'regra_criada'
  | 'regra_atualizada'
  | 'regra_excluida'
  | 'login'
  | 'logout'
  | 'perfil_atualizado'
  | 'demo_carregado'
  | 'configuracao_alterada';

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  entity_type?: string | null;
  entity_id?: string | null;
  entity_name?: string | null;
  metadata?: Json | null;
  created_at: string;
}

interface LogActivityParams {
  activity_type: ActivityType;
  entity_type?: string;
  entity_id?: string;
  entity_name?: string;
  metadata?: Json;
}

interface ActivityLogState {
  logs: ActivityLog[];
  isLoading: boolean;
  error: string | null;
  fetchLogs: (limit?: number) => Promise<void>;
  logActivity: (params: LogActivityParams) => Promise<void>;
}

export const useActivityLogStore = create<ActivityLogState>((set, get) => ({
  logs: [],
  isLoading: false,
  error: null,

  fetchLogs: async (limit = 50) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ logs: [], isLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      set({ 
        logs: (data || []) as ActivityLog[], 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar logs', 
        isLoading: false 
      });
    }
  },

  logActivity: async ({ activity_type, entity_type, entity_id, entity_name, metadata }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Cannot log activity: user not authenticated');
        return;
      }

      const { error } = await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          activity_type,
          entity_type: entity_type || null,
          entity_id: entity_id || null,
          entity_name: entity_name || null,
          metadata: metadata || null,
        }]);

      if (error) {
        console.error('Error logging activity:', error);
        return;
      }

      // Optionally refresh the logs after inserting
      const currentLogs = get().logs;
      if (currentLogs.length > 0) {
        get().fetchLogs();
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },
}));

// Activity type labels in Portuguese
export const activityTypeLabels: Record<ActivityType, string> = {
  produto_criado: 'Produto criado',
  produto_atualizado: 'Produto atualizado',
  produto_excluido: 'Produto excluído',
  fornecedor_criado: 'Fornecedor criado',
  fornecedor_atualizado: 'Fornecedor atualizado',
  fornecedor_excluido: 'Fornecedor excluído',
  contrato_criado: 'Contrato criado',
  contrato_atualizado: 'Contrato atualizado',
  contrato_excluido: 'Contrato excluído',
  cotacao_criada: 'Cotação criada',
  cotacao_atualizada: 'Cotação atualizada',
  cotacao_excluida: 'Cotação excluída',
  regra_criada: 'Regra criada',
  regra_atualizada: 'Regra atualizada',
  regra_excluida: 'Regra excluída',
  login: 'Login realizado',
  logout: 'Logout realizado',
  perfil_atualizado: 'Perfil atualizado',
  demo_carregado: 'Dados demo carregados',
  configuracao_alterada: 'Configuração alterada',
};
