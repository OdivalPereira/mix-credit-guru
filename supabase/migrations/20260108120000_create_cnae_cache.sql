-- Tabela de Cache para CNAEs consultados via IA
-- Evita chamadas repetidas à API para o mesmo CNAE
-- Execute esta migração via Supabase Dashboard ou CLI

CREATE TABLE IF NOT EXISTS cnae_cache (
  cnae TEXT PRIMARY KEY,
  info JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_cnae_cache_cnae ON cnae_cache(cnae);

-- Comentário
COMMENT ON TABLE cnae_cache IS 'Cache de informações tributárias de CNAEs consultados via IA (Gemini). Evita chamadas repetidas e reduz custos.';
COMMENT ON COLUMN cnae_cache.info IS 'Informações do CNAE: setor, anexo Simples, presunção LP, redução reforma';

-- RLS (opcional para segurança)
ALTER TABLE cnae_cache ENABLE ROW LEVEL SECURITY;

-- Policy para leitura pública (cache é global)
CREATE POLICY "CNAE cache is publicly readable"
  ON cnae_cache FOR SELECT
  USING (true);

-- Policy para escrita via service role apenas
CREATE POLICY "Only service role can write to cnae_cache"
  ON cnae_cache FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update cnae_cache"
  ON cnae_cache FOR UPDATE
  USING (auth.role() = 'service_role');
