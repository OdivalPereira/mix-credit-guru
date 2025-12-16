-- Allow any authenticated user to read all tax rules (public government data)
CREATE POLICY "Anyone can read ncm_rules" 
    ON public.ncm_rules FOR SELECT 
    TO authenticated
    USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own ncm_rules" ON public.ncm_rules;

-- Insert initial tax rules for hydration testing
-- Using a system user ID for ownership of public rules
INSERT INTO public.ncm_rules (ncm, uf, date_start, date_end, aliquota_ibs, aliquota_cbs, aliquota_is, scenario, user_id, explanation_md) VALUES
-- Regras Globais (Reforma Tributária 2026-2033) - Transição
('*', '*', '2026-01-01', '2027-12-31', 12, 5, 2, 'default', '8e411858-20fc-47f7-b4f3-70edb38ec662', 'Alíquota padrão IBS/CBS durante transição (2026-2027)'),
('*', '*', '2028-01-01', NULL, 11, 4.5, 1.5, 'default', '8e411858-20fc-47f7-b4f3-70edb38ec662', 'Alíquota padrão IBS/CBS pós-transição (2028+)'),

-- Cesta Básica (Redução 60%)
('*', '*', '2026-01-01', NULL, 7, 3, 1, 'cesta', '8e411858-20fc-47f7-b4f3-70edb38ec662', 'Cesta básica nacional - redução de 60%'),

-- Alíquota Zero para IS (Redução 100%)
('*', '*', '2026-01-01', NULL, 4, 2, 0, 'reducao', '8e411858-20fc-47f7-b4f3-70edb38ec662', 'Produtos com redução total de IS'),

-- NCMs Específicos - Alimentos
('1006.30.11', '*', '2026-01-01', NULL, 4, 2, 0, 'default', '8e411858-20fc-47f7-b4f3-70edb38ec662', 'Arroz semibranqueado - Cesta básica'),
('1507.90.10', '*', '2026-01-01', NULL, 8, 3, 1, 'default', '8e411858-20fc-47f7-b4f3-70edb38ec662', 'Óleo de soja refinado'),
('0201.10.00', '*', '2026-01-01', NULL, 7, 3, 0, 'default', '8e411858-20fc-47f7-b4f3-70edb38ec662', 'Carne bovina - carcaças'),
('0402.10.10', '*', '2026-01-01', NULL, 4, 2, 0, 'default', '8e411858-20fc-47f7-b4f3-70edb38ec662', 'Leite em pó integral'),

-- NCM de teste para validação da hidratação
('9999.99.99', 'SP', '2025-01-01', NULL, 15, 15, 0, 'default', '8e411858-20fc-47f7-b4f3-70edb38ec662', 'NCM de teste para validar hidratação');