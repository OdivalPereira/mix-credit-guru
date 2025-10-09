-- Continuando fornecedores (parte 2)
INSERT INTO public.fornecedores (id, user_id, nome, cnpj, tipo, regime, uf, municipio, ativo, contato_nome, contato_email, contato_telefone)
  VALUES
    ('ef442cdf-4677-5816-ab91-7863c611e107', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Condini Indústria de Molhos', '15.228.900/0001-05', 'industria', 'normal', 'SP', '3526902', true, 'Viviane Ramos', 'viviane@condini.com.br', '(11) 4789-3200'),
    ('b747de16-f96c-5708-953d-abc502bacdaf', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'FoodService BR Distribuição', '18.775.604/0001-41', 'distribuidor', 'presumido', 'MG', '3132404', true, 'Nelson Diniz', 'nelson@foodservicebr.com', '(31) 3689-6500'),
    ('ba2ab29c-15e6-5742-bfbd-8dc4fb8a127a', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Atacarejo Sabor Nordeste', '29.677.880/0001-54', 'atacado', 'simples', 'PE', '2611606', true, 'Ítalo Moura', 'italo@atacarejosabor.com.br', '(81) 4042-7788'),
    ('5327cae4-4913-56f5-a668-887ffb78e958', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Molhos Legend Indústria', '00.455.712/0001-61', 'industria', 'normal', 'SP', '3505708', true, 'Andréia Teixeira', 'andreia@molhoslegend.com.br', '(11) 4199-4400'),
    ('1bef7d0c-dbc5-5667-8545-9f8399c5c8ed', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Condistrib Molhos & Serviços', '04.990.337/0001-19', 'distribuidor', 'presumido', 'RS', '4314902', true, 'Felipe Moraes', 'felipe@condistrib.com.br', '(51) 3301-2200'),
    ('60e85d43-a4e2-5b2a-a734-4c049d08dd1d', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Varejão Norte Express', '09.450.882/0001-91', 'varejo', 'simples', 'AM', '1302603', true, 'Maicon Almeida', 'maicon@varejaonorte.com', '(92) 3311-7755'),
    ('147ff690-96be-51ce-bb18-fa7973a9a49c', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Mostardas Real Indústria', '08.234.655/0001-88', 'industria', 'normal', 'RJ', '3303500', true, 'Rodrigo Sales', 'rodrigo@mostardasreal.com.br', '(21) 3755-4400'),
    ('fc1449d7-6344-56f4-be94-f486c642f9a3', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Gourmet Condimentos Distribuidora', '19.887.301/0001-46', 'distribuidor', 'presumido', 'RS', '4320008', true, 'Silmara Dutra', 'silmara@gourmetcondimentos.com', '(55) 3027-1199'),
    ('eb862e28-5795-5d98-80ca-1df9dbfde483', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Varejão Centro Oeste', '13.411.778/0001-23', 'varejo', 'simples', 'SP', '3503208', true, 'Bruna Watanabe', 'bruna@varejaocentro.com.br', '(18) 3621-7070'),
    ('d08e2911-64c6-530a-9c81-d07da8cddfa1', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Bebidas Top Brasil', '02.330.900/0001-31', 'industria', 'normal', 'SP', '3529401', true, 'Marcelo Azevedo', 'marcelo@bebidastop.com.br', '(19) 3704-8899'),
    ('a48cab57-bbf2-5a5f-a3f2-879a9132545f', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'SuperRefri Distribuidora', '06.880.733/0001-47', 'distribuidor', 'presumido', 'DF', '5300108', true, 'Patrícia Borges', 'patricia@superrefri.com.br', '(61) 3550-2290'),
    ('5718627f-743d-5785-93ff-c207401f1055', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Atacarejo Pop Bebidas', '21.440.980/0001-70', 'atacado', 'simples', 'BA', '2927408', true, 'Renata Guimarães', 'renata@atacarejopop.com.br', '(71) 4009-6600'),
    ('24f9f226-5822-5750-805c-4eb2cfac71bd', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Gelato Brasil Indústria', '03.210.455/0001-02', 'industria', 'normal', 'SP', '3550308', true, 'Helder Fonseca', 'helder@gelatobrasil.com.br', '(11) 3222-9900'),
    ('f781a8b0-c8ff-5a4a-9e8f-583deb24f9c5', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'FriosNorte Distribuições', '09.688.410/0001-69', 'distribuidor', 'presumido', 'CE', '2304400', true, 'Larissa Campos', 'larissa@friosnorte.com.br', '(85) 3233-7700'),
    ('16a637c6-58e4-5827-8125-50dddc9eddfe', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Atacado Nevado Frio & Logística', '12.440.003/0001-10', 'atacado', 'simples', 'PR', '4106902', true, 'Sandro Klos', 'sandro@atacadonedevado.com.br', '(41) 3770-1122')
  ON CONFLICT (id) DO NOTHING;

-- Criar cotação
INSERT INTO public.cotacoes (id, user_id, nome, data_cotacao, uf, municipio, destino, regime, produto, scenario)
  VALUES ('07e30f90-af5a-5e83-bd12-226366c57ee4', 'a625392e-48cd-40c0-bf50-2a91ad5f288b', 'Cotação Combo X-Tudo Outubro 2025', '2025-10-08', 'SP', '3550308', 'B', 'normal', 'Combo X-Tudo completo', 'transicao')
  ON CONFLICT (id) DO NOTHING;