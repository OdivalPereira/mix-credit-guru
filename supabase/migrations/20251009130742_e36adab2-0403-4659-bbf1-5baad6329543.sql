-- Seed gerado automaticamente para o combo X-Tudo (08/10/2025)
-- Usuário responsável pelos dados: a625392e-48cd-40c0-bf50-2a91ad5f288b

INSERT INTO public.user_roles (id, user_id, role)
  VALUES ('e4c7c1c2-333c-549a-b712-8edb20bdca88', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.produtos (id, user_id, descricao, ncm, unidade_padrao, flag_refeicao, flag_cesta, flag_reducao, flag_is)
  VALUES
    ('857f0387-d685-548f-95ce-75317deb0273', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Pão Brioche de Hambúrguer 60g (cx 40 un)', '1905.90.90', 'un', true, true, false, false),
    ('d168c0f2-f826-5ef3-8550-2d66969d330c', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Blend Bovino 180g Congelado (cx 30 un)', '1602.50.00', 'kg', true, false, false, false),
    ('3ea69a1f-6b5c-58aa-8c77-1174325be523', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Bacon Defumado Fatiado 1kg', '0210.12.00', 'kg', true, false, false, false),
    ('fa2e4381-e8f4-5c46-8e70-31689d71acb2', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Presunto Cozido Fatiado 1kg', '1601.00.00', 'kg', true, false, false, false),
    ('0992bf47-98aa-5129-8185-f16bd3f987ff', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Queijo Prato Fatiado 1kg', '0406.90.90', 'kg', true, true, false, false),
    ('22ecfe9f-5f5d-5baa-b225-6125a1fb9c69', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Ovo Caipira Grande (bandeja 30 un)', '0407.21.00', 'un', true, true, true, false),
    ('905a8139-927e-5c9a-9fd1-887bd24c180c', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Alface Americana Higienizada 1kg', '0705.11.00', 'kg', true, true, true, false),
    ('9eded1bd-1bf2-5e41-851f-d3594b817587', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Tomate Italiano Extra 1kg', '0702.00.90', 'kg', true, true, true, false),
    ('161f015d-afe7-58f9-b225-e52ed5c76ea1', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Milho Verde Enlatado 170g', '2005.80.00', 'un', true, true, false, false),
    ('5fe6173a-9878-5485-9fdf-065c67fbd9ad', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Batata Palha Premium 1kg', '2005.20.00', 'kg', true, false, false, false),
    ('feb1fceb-a842-5be2-94a1-9fbbc260ac9e', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Maionese Profissional 3kg (balde)', '2103.90.21', 'kg', true, false, false, false),
    ('de87fa49-39a4-5e1f-812d-05d2eb8ef1d1', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Ketchup Gourmet 1,01L', '2103.20.10', 'l', true, false, false, false),
    ('78b650e9-9a4a-5474-9d36-64829f0dbeff', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Mostarda Amarela 1,01L', '2103.30.10', 'l', true, false, false, false),
    ('f74c2c2b-4e51-5614-83da-05bfccdd7aab', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Refrigerante Cola 2L', '2202.10.00', 'l', true, false, false, true),
    ('58cced60-361d-5f98-8ec4-6be0c4f63fe0', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Sorvete Creme Premium 1,5L', '2105.00.10', 'l', true, false, false, true)
  ON CONFLICT (id) DO NOTHING;