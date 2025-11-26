-- Seed data for ncm_rules table
-- Cesta básica and common products with tax rules

-- Get the first user ID (or use a specific one)
DO $$
DECLARE
  first_user_id UUID;
BEGIN
  -- Get first user or create a system user
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;
  
  IF first_user_id IS NULL THEN
    -- If no users exist, we'll skip this seed
    RAISE NOTICE 'No users found, skipping seed';
    RETURN;
  END IF;

  -- Cesta Básica - Alíquotas reduzidas (7% IBS + 7% CBS) durante transição
  INSERT INTO public.ncm_rules (ncm, uf, date_start, date_end, aliquota_ibs, aliquota_cbs, aliquota_is, explanation_markdown, user_id) VALUES
  -- Lácteos
  ('0401.10.10', 'SP', '2026-01-01', '2033-12-31', 7.0, 7.0, 0.0, 
   '**Leite in natura pasteurizado** faz parte da **cesta básica nacional**. Durante o período de transição (2026-2033), possui alíquota reduzida de **40% das alíquotas-padrão** de IBS e CBS (7% cada, vs 12% padrão). Após 2033, terá **isenção total de IBS e CBS**.', 
   first_user_id),
  
  ('0401.20.10', 'SP', '2026-01-01', '2033-12-31', 7.0, 7.0, 0.0, 
   '**Leite UHT** é produto da cesta básica com alíquota reduzida durante a transição. A redução de 40% representa economia significativa comparada aos 24% de tributos padrão (12% IBS + 12% CBS).', 
   first_user_id),
  
  -- Cereais
  ('1001.99.00', 'SP', '2026-01-01', '2033-12-31', 7.0, 7.0, 0.0, 
   '**Trigo em grãos** - produto essencial da cesta básica. As alíquotas reduzidas (7%+7%) facilitam a cadeia produtiva de pães e massas, beneficiando consumidores finais.', 
   first_user_id),
  
  ('1006.30.21', 'SP', '2026-01-01', '2033-12-31', 7.0, 7.0, 0.0, 
   '**Arroz beneficiado** - alimento fundamental na dieta brasileira. Alíquota reduzida de 40% garante preço acessível à população.', 
   first_user_id),
  
  -- Leguminosas
  ('0713.33.19', 'SP', '2026-01-01', '2033-12-31', 7.0, 7.0, 0.0, 
   '**Feijão comum (Phaseolus vulgaris)** - proteína vegetal essencial. Redução tributária de 14% para 7%+7% durante transição.', 
   first_user_id),
  
  -- Açúcar e Óleos
  ('1701.14.00', 'SP', '2026-01-01', '2033-12-31', 7.0, 7.0, 0.0, 
   '**Açúcar refinado** - item da cesta básica com alíquota reduzida, sem incidência de Imposto Seletivo.', 
   first_user_id),
  
  ('1507.90.11', 'SP', '2026-01-01', '2033-12-31', 7.0, 7.0, 0.0, 
   '**Óleo de soja refinado** - gordura vegetal essencial. Beneficiado pela redução de alíquota durante toda a transição.', 
   first_user_id),
  
  -- Farinha
  ('1101.00.10', 'SP', '2026-01-01', '2033-12-31', 7.0, 7.0, 0.0, 
   '**Farinha de trigo** - produto básico derivado do trigo. Mantém alíquota reduzida para garantir acesso a pães e massas.', 
   first_user_id),
  
  -- Produtos fora da cesta básica (alíquotas padrão)
  ('1704.90.10', 'SP', '2026-01-01', '2033-12-31', 12.0, 12.0, 1.0, 
   '**Chocolate e preparações** - **NÃO fazem parte da cesta básica**. Alíquotas padrão de 12%+12% + Imposto Seletivo de 1% por conter açúcares adicionados.', 
   first_user_id),
  
  -- Bebidas alcoólicas (IS elevado)
  ('2203.00.00', 'SP', '2026-01-01', '2033-12-31', 12.0, 12.0, 25.0, 
   '**Cerveja de malte** - produto com **Imposto Seletivo elevado (25%)** por ser considerado nocivo à saúde. Além das alíquotas padrão de IBS+CBS (24%), paga IS adicional de 25%.', 
   first_user_id),
  
  -- Produtos de tabaco (IS máximo)
  ('2402.20.00', 'SP', '2026-01-01', '2033-12-31', 12.0, 12.0, 100.0, 
   '**Cigarros contendo tabaco** - **maior alíquota de IS (100%)**. Produto sujeito à maior carga tributária da reforma por impacto à saúde pública.', 
   first_user_id);

  RAISE NOTICE 'Successfully seeded ncm_rules with % rows', 11;
END $$;
