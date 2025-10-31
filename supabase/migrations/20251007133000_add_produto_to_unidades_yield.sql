-- Relaciona configuracoes de yield a produtos especificos

ALTER TABLE public.unidades_yield
  ADD COLUMN IF NOT EXISTS produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE;

ALTER TABLE public.unidades_yield
  DROP CONSTRAINT IF EXISTS unidades_yield_user_id_entrada_saida_key;

CREATE UNIQUE INDEX IF NOT EXISTS unidades_yield_unique_global
  ON public.unidades_yield(user_id, entrada, saida)
  WHERE produto_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unidades_yield_unique_por_produto
  ON public.unidades_yield(user_id, produto_id, entrada, saida)
  WHERE produto_id IS NOT NULL;
