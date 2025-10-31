-- Corrigir search_path da função update_updated_at_column para ser imutável

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar todos os triggers
CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_receitas_updated_at
  BEFORE UPDATE ON public.receitas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regras_ncm_updated_at
  BEFORE UPDATE ON public.regras_ncm
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cotacoes_updated_at
  BEFORE UPDATE ON public.cotacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unidades_conversao_updated_at
  BEFORE UPDATE ON public.unidades_conversao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unidades_yield_updated_at
  BEFORE UPDATE ON public.unidades_yield
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();