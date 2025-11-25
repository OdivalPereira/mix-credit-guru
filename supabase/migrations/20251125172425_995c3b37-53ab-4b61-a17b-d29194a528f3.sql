-- Criar tabela ncm_rules para Tax Intelligence Engine
CREATE TABLE public.ncm_rules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ncm text NOT NULL,
    uf text NOT NULL,
    date_start date NOT NULL,
    date_end date,
    aliquota_ibs numeric NOT NULL DEFAULT 0,
    aliquota_cbs numeric NOT NULL DEFAULT 0,
    aliquota_is numeric NOT NULL DEFAULT 0,
    explanation_markdown text,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices para busca eficiente
CREATE INDEX idx_ncm_rules_ncm_uf ON public.ncm_rules(ncm, uf);
CREATE INDEX idx_ncm_rules_dates ON public.ncm_rules(date_start, date_end);
CREATE INDEX idx_ncm_rules_user ON public.ncm_rules(user_id);

-- Habilitar RLS
ALTER TABLE public.ncm_rules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para acesso por usuário
CREATE POLICY "Users can view their own ncm_rules" 
    ON public.ncm_rules FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ncm_rules" 
    ON public.ncm_rules FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ncm_rules" 
    ON public.ncm_rules FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ncm_rules" 
    ON public.ncm_rules FOR DELETE 
    USING (auth.uid() = user_id);

-- Trigger para atualização automática de updated_at
CREATE TRIGGER update_ncm_rules_updated_at
    BEFORE UPDATE ON public.ncm_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();