-- Create enum for activity types
CREATE TYPE public.activity_type AS ENUM (
  'produto_criado',
  'produto_atualizado',
  'produto_excluido',
  'fornecedor_criado',
  'fornecedor_atualizado',
  'fornecedor_excluido',
  'contrato_criado',
  'contrato_atualizado',
  'contrato_excluido',
  'cotacao_criada',
  'cotacao_atualizada',
  'cotacao_excluida',
  'regra_criada',
  'regra_atualizada',
  'regra_excluida',
  'login',
  'logout',
  'perfil_atualizado',
  'demo_carregado',
  'configuracao_alterada'
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type activity_type NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_activity_type ON public.activity_logs(activity_type);