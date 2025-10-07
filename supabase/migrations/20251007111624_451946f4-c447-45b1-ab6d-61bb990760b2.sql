-- Fase 4: Integração Supabase para persistência de dados

-- ============================================
-- TIPOS ENUMERADOS
-- ============================================

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.unit_type AS ENUM ('un', 'kg', 'g', 'l', 'ml', 'ton');
CREATE TYPE public.supplier_tipo AS ENUM ('industria', 'distribuidor', 'produtor', 'atacado', 'varejo');
CREATE TYPE public.supplier_regime AS ENUM ('normal', 'simples', 'presumido');
CREATE TYPE public.destinacao_tipo AS ENUM ('A', 'B', 'C', 'D', 'E');

-- ============================================
-- TABELA DE ROLES (SEGURANÇA)
-- ============================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar roles (security definer para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policies para user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- TABELA DE PRODUTOS (CATÁLOGO)
-- ============================================

CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  ncm TEXT NOT NULL,
  flag_refeicao BOOLEAN NOT NULL DEFAULT false,
  flag_cesta BOOLEAN NOT NULL DEFAULT false,
  flag_reducao BOOLEAN NOT NULL DEFAULT false,
  flag_is BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_produtos_user_id ON public.produtos(user_id);
CREATE INDEX idx_produtos_ncm ON public.produtos(ncm);

CREATE POLICY "Users can view their own produtos"
  ON public.produtos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own produtos"
  ON public.produtos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own produtos"
  ON public.produtos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own produtos"
  ON public.produtos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA DE RECEITAS
-- ============================================

CREATE TABLE public.receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, codigo)
);

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_receitas_user_id ON public.receitas(user_id);

CREATE POLICY "Users can view their own receitas"
  ON public.receitas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own receitas"
  ON public.receitas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own receitas"
  ON public.receitas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receitas"
  ON public.receitas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA DE REGRAS NCM
-- ============================================

CREATE TABLE public.regras_ncm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ncm TEXT NOT NULL,
  descricao TEXT NOT NULL,
  receita_codigo TEXT NOT NULL,
  receita_descricao TEXT NOT NULL,
  aliquota_ibs NUMERIC(5,2) NOT NULL DEFAULT 0,
  aliquota_cbs NUMERIC(5,2) NOT NULL DEFAULT 0,
  aliquota_is NUMERIC(5,2) NOT NULL DEFAULT 0,
  overrides_uf JSONB,
  vigencia_inicio DATE,
  vigencia_fim DATE,
  prioridade INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ncm)
);

ALTER TABLE public.regras_ncm ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_regras_ncm_user_id ON public.regras_ncm(user_id);
CREATE INDEX idx_regras_ncm_ncm ON public.regras_ncm(ncm);

CREATE POLICY "Users can view their own regras_ncm"
  ON public.regras_ncm FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own regras_ncm"
  ON public.regras_ncm FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own regras_ncm"
  ON public.regras_ncm FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own regras_ncm"
  ON public.regras_ncm FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA DE COTAÇÕES
-- ============================================

CREATE TABLE public.cotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  data_cotacao DATE NOT NULL,
  uf TEXT NOT NULL,
  municipio TEXT,
  destino destinacao_tipo NOT NULL,
  regime supplier_regime NOT NULL,
  produto TEXT NOT NULL,
  scenario TEXT NOT NULL DEFAULT 'transicao',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_cotacoes_user_id ON public.cotacoes(user_id);

CREATE POLICY "Users can view their own cotacoes"
  ON public.cotacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cotacoes"
  ON public.cotacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cotacoes"
  ON public.cotacoes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cotacoes"
  ON public.cotacoes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA DE FORNECEDORES DE COTAÇÃO
-- ============================================

CREATE TABLE public.cotacao_fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id UUID NOT NULL REFERENCES public.cotacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo supplier_tipo NOT NULL,
  regime supplier_regime NOT NULL,
  preco NUMERIC(12,2) NOT NULL,
  ibs NUMERIC(5,2) NOT NULL DEFAULT 0,
  cbs NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_aliquota NUMERIC(5,2) NOT NULL DEFAULT 0,
  frete NUMERIC(12,2) NOT NULL DEFAULT 0,
  cadeia JSONB,
  flags_item JSONB,
  is_refeicao_pronta BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cotacao_fornecedores ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_cotacao_fornecedores_cotacao_id ON public.cotacao_fornecedores(cotacao_id);

CREATE POLICY "Users can view fornecedores of their cotacoes"
  ON public.cotacao_fornecedores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cotacoes
      WHERE cotacoes.id = cotacao_fornecedores.cotacao_id
        AND cotacoes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert fornecedores to their cotacoes"
  ON public.cotacao_fornecedores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.cotacoes
      WHERE cotacoes.id = cotacao_fornecedores.cotacao_id
        AND cotacoes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update fornecedores of their cotacoes"
  ON public.cotacao_fornecedores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cotacoes
      WHERE cotacoes.id = cotacao_fornecedores.cotacao_id
        AND cotacoes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete fornecedores of their cotacoes"
  ON public.cotacao_fornecedores FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.cotacoes
      WHERE cotacoes.id = cotacao_fornecedores.cotacao_id
        AND cotacoes.user_id = auth.uid()
    )
  );

-- ============================================
-- TABELA DE CONTRATOS
-- ============================================

CREATE TABLE public.contratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fornecedor_id TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  unidade unit_type NOT NULL,
  preco_base NUMERIC(12,2) NOT NULL,
  price_breaks JSONB,
  freight_breaks JSONB,
  yield_config JSONB,
  conversoes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_contratos_user_id ON public.contratos(user_id);
CREATE INDEX idx_contratos_fornecedor_produto ON public.contratos(fornecedor_id, produto_id);

CREATE POLICY "Users can view their own contratos"
  ON public.contratos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contratos"
  ON public.contratos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contratos"
  ON public.contratos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contratos"
  ON public.contratos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA DE CONVERSÕES DE UNIDADES
-- ============================================

CREATE TABLE public.unidades_conversao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  de unit_type NOT NULL,
  para unit_type NOT NULL,
  fator NUMERIC(12,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, de, para)
);

ALTER TABLE public.unidades_conversao ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_unidades_conversao_user_id ON public.unidades_conversao(user_id);

CREATE POLICY "Users can view their own conversoes"
  ON public.unidades_conversao FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversoes"
  ON public.unidades_conversao FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversoes"
  ON public.unidades_conversao FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversoes"
  ON public.unidades_conversao FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABELA DE YIELD CONFIG
-- ============================================

CREATE TABLE public.unidades_yield (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entrada unit_type NOT NULL,
  saida unit_type NOT NULL,
  rendimento NUMERIC(12,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entrada, saida)
);

ALTER TABLE public.unidades_yield ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_unidades_yield_user_id ON public.unidades_yield(user_id);

CREATE POLICY "Users can view their own yields"
  ON public.unidades_yield FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own yields"
  ON public.unidades_yield FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own yields"
  ON public.unidades_yield FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own yields"
  ON public.unidades_yield FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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