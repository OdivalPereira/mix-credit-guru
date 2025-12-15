-- Fase 1: Criar tabela ofertas_fornecedor e migrar dados

-- 1. Criar tabela ofertas_fornecedor
CREATE TABLE public.ofertas_fornecedor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  produto_id TEXT NOT NULL,
  produto_descricao TEXT,
  unidade_negociada TEXT DEFAULT 'un',
  pedido_minimo NUMERIC,
  prazo_entrega_dias INTEGER,
  prazo_pagamento_dias INTEGER,
  preco NUMERIC NOT NULL DEFAULT 0,
  ibs NUMERIC NOT NULL DEFAULT 0,
  cbs NUMERIC NOT NULL DEFAULT 0,
  is_aliquota NUMERIC NOT NULL DEFAULT 0,
  frete NUMERIC NOT NULL DEFAULT 0,
  cadeia JSONB,
  flags_item JSONB,
  is_refeicao_pronta BOOLEAN DEFAULT false,
  explanation TEXT,
  price_breaks JSONB,
  freight_breaks JSONB,
  yield_config JSONB,
  conversoes JSONB,
  ativa BOOLEAN NOT NULL DEFAULT true,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Criar índices para performance
CREATE INDEX idx_ofertas_fornecedor_fornecedor_id ON public.ofertas_fornecedor(fornecedor_id);
CREATE INDEX idx_ofertas_fornecedor_produto_id ON public.ofertas_fornecedor(produto_id);
CREATE INDEX idx_ofertas_fornecedor_user_id ON public.ofertas_fornecedor(user_id);

-- 3. Habilitar RLS
ALTER TABLE public.ofertas_fornecedor ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
CREATE POLICY "Users can view their own ofertas"
  ON public.ofertas_fornecedor
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ofertas"
  ON public.ofertas_fornecedor
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ofertas"
  ON public.ofertas_fornecedor
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ofertas"
  ON public.ofertas_fornecedor
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Trigger para updated_at
CREATE TRIGGER update_ofertas_fornecedor_updated_at
  BEFORE UPDATE ON public.ofertas_fornecedor
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();