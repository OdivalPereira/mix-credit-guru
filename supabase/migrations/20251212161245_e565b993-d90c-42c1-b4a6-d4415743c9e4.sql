-- Adicionar campos opcionais de condições comerciais na tabela fornecedores
-- Isso simplifica a arquitetura, removendo a necessidade de uma entidade separada "contratos"

ALTER TABLE public.fornecedores
ADD COLUMN IF NOT EXISTS price_breaks jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS freight_breaks jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS yield_config jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS conversoes jsonb DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.fornecedores.price_breaks IS 'Array de degraus de preço: [{quantidade: number, preco: number}]';
COMMENT ON COLUMN public.fornecedores.freight_breaks IS 'Array de degraus de frete: [{quantidade: number, frete: number}]';
COMMENT ON COLUMN public.fornecedores.yield_config IS 'Configuração de rendimento: {entrada: Unit, saida: Unit, rendimento: number, produtoId?: string}';
COMMENT ON COLUMN public.fornecedores.conversoes IS 'Array de conversões específicas: [{de: Unit, para: Unit, fator: number}]';