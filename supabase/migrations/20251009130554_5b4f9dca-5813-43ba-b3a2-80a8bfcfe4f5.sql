-- Criar tabela fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  cnpj text,
  tipo supplier_tipo NOT NULL,
  regime supplier_regime NOT NULL,
  uf text NOT NULL,
  municipio text,
  ativo boolean NOT NULL DEFAULT true,
  contato_nome text,
  contato_email text,
  contato_telefone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own fornecedores"
ON public.fornecedores
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fornecedores"
ON public.fornecedores
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fornecedores"
ON public.fornecedores
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fornecedores"
ON public.fornecedores
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_fornecedores_updated_at
BEFORE UPDATE ON public.fornecedores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();