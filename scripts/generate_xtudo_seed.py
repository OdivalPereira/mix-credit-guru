#!/usr/bin/env python3
"""Gera instruções SQL do combo X-Tudo para o Supabase."""
from __future__ import annotations

import json
import uuid
from datetime import date
from pathlib import Path


def make_id(scope: str, key: str) -> str:
    namespace = uuid.NAMESPACE_DNS
    value = f"mix-credit-guru:{scope}:{key}"
    return str(uuid.uuid5(namespace, value))


def sql_escape(value: str) -> str:
    return value.replace("'", "''")


USER_ID = "a625392e-48cd-40c0-bf50-2a91ad5f288b"
USER_ROLE_ID = make_id("user-role", "xtudo-admin")

cotacao = {
    "id": make_id("cotacao", "xtudo-20251008"),
    "nome": "Cotação Combo X-Tudo Outubro 2025",
    "data_cotacao": date(2025, 10, 8),
    "uf": "SP",
    "municipio": "3550308",
    "destino": "B",
    "regime": "normal",
    "produto": "Combo X-Tudo completo",
    "scenario": "transicao",
}

products_raw = """
pao_brioche|Pão Brioche de Hambúrguer 60g (cx 40 un)|1905.90.90|17.059.00|un|Panificados|XT-PAO-BRIOCHE|1|1|0|0|0
blend_bovino|Blend Bovino 180g Congelado (cx 30 un)|1602.50.00|17.061.00|kg|Proteínas|XT-BLEND-180|1|0|0|0|0
bacon_fatiado|Bacon Defumado Fatiado 1kg|0210.12.00|17.042.00|kg|Proteínas|XT-BACON-1KG|1|0|0|0|0
presunto_fatiado|Presunto Cozido Fatiado 1kg|1601.00.00|17.074.00|kg|Proteínas|XT-PRES-1KG|1|0|0|0|0
queijo_prato|Queijo Prato Fatiado 1kg|0406.90.90|17.028.00|kg|Laticínios|XT-QUEIJO-PRATO|1|1|0|0|0
ovos_caipira|Ovo Caipira Grande (bandeja 30 un)|0407.21.00|17.045.00|un|Granjeiros|XT-OVO-CAIPIRA|1|1|1|0|0
alface_americana|Alface Americana Higienizada 1kg|0705.11.00|17.078.00|kg|Hortifruti|XT-ALFACE-AM|1|1|1|0|0
tomate_italiano|Tomate Italiano Extra 1kg|0702.00.90|17.079.00|kg|Hortifruti|XT-TOM-ITAL|1|1|1|0|0
milho_enlatado|Milho Verde Enlatado 170g|2005.80.00|17.105.00|un|Conservas|XT-MILHO-LATA|1|1|0|0|0
batata_palha|Batata Palha Premium 1kg|2005.20.00|17.100.00|kg|Snacks|XT-BATATA-PALHA|1|0|0|0|0
maionese_profissional|Maionese Profissional 3kg (balde)|2103.90.21|17.110.00|kg|Condimentos|XT-MAIO-3KG|1|0|0|0|0
ketchup_gourmet|Ketchup Gourmet 1,01L|2103.20.10|17.110.00|l|Condimentos|XT-KETCHUP-1L|1|0|0|0|0
mostarda_amarela|Mostarda Amarela 1,01L|2103.30.10|17.110.00|l|Condimentos|XT-MOSTARDA-1L|1|0|0|0|0
refrigerante_cola|Refrigerante Cola 2L|2202.10.00|03.003.00|l|Bebidas|XT-REFRI-COLA|1|0|0|1|1
sorvete_creme|Sorvete Creme Premium 1,5L|2105.00.10|03.004.00|l|Sobremesas|XT-SORVETE-15|1|0|0|1|1
"""

suppliers_raw = """
pao_brioche|aurora-panificados|Padaria Industrial Aurora|04.512.879/0001-65|industria|normal|SP|3509502|Marina Alves|marina@aurorapanificados.com.br|(19) 3322-8700|80|3|21|58.40|4.85|2.10|0.00|6.50|Moinho Regional>Panificação Industrial>Distribuidor Regional>Rede de Lanchonetes|1|0
pao_brioche|bom-pao-distribuidora|Distribuidora Bom Pão|12.345.908/0001-02|distribuidor|presumido|RJ|3304557|Rogério Nunes|rogerio@bompao.com.br|(21) 2455-4410|60|5|28|62.30|5.20|2.40|0.00|9.80|Panificação Regional>Centro de Distribuição>Atacado Food Service>Rede de Lanchonetes|1|0
pao_brioche|cooperativa-paulistas|Cooperativa de Padeiros Paulistas|28.907.114/0001-48|produtor|simples|SP|3543402|Helena Prado|helena@coopadaria.org.br|(16) 3233-6120|100|6|14|54.70|3.50|1.20|0.00|12.40|Cooperados Agrícolas>Panificadora Comunitária>Central de Distribuição>Rede de Hamburguerias|1|1
blend_bovino|prime-beef-industria|Prime Beef Indústria de Carnes|03.667.210/0001-11|industria|normal|SP|3552205|Leonardo Farias|leonardo@primebeef.com.br|(15) 3022-4400|54|4|28|49.80|7.20|3.30|0.00|14.50|Frigorífico>Processamento>Distribuidor Refrigerado>Rede de Hamburguerias|0|0
blend_bovino|megafood-frio|MegaFood Distribuição Fria|21.908.677/0001-55|distribuidor|presumido|MG|3118601|Patrícia Guedes|patricia@megafood.com.br|(31) 3477-9090|36|5|21|52.10|6.10|2.90|0.00|18.30|Frigorífico Regional>Cross-docking>Distribuidor Atacado>Restaurantes e Lanchonetes|0|0
blend_bovino|rancho-goiano|Rancho Goiano Atacado de Carnes|09.334.820/0001-04|atacado|simples|GO|5208707|Eduardo Campos|eduardo@ranchogoiano.com.br|(62) 4012-3000|60|6|14|47.30|2.80|0.80|0.00|21.00|Cooperativa Pecuarista>Processadora Local>Transporte Frigorificado>Hamburgueria Final|0|1
bacon_fatiado|serra-sul-carnes|Serra Sul Carnes Defumadas|18.720.990/0001-33|industria|normal|RS|4314902|Bianca Martins|bianca@serrasul.com.br|(51) 3344-8877|40|5|28|39.50|6.40|3.10|0.00|11.90|Frigorífico>Processamento Defumado>Distribuidor Frio>Food Service|0|0
bacon_fatiado|atlantic-proteinas|Atlantic Proteínas Distribuição|10.998.200/0001-90|distribuidor|presumido|RJ|3301702|Gustavo Pereira|gustavo@atlanticproteinas.com|(21) 3651-5544|30|4|21|42.70|5.80|2.70|0.50|13.40|Frigorífico Regional>Logística Refrigerada>Distribuidor Estadual>Lanchonetes|0|0
bacon_fatiado|agroparana-frios|AgroParaná Frios Atacadista|05.770.642/0001-07|atacado|simples|PR|4106902|Tatiane Muller|tatiane@agroparana.com.br|(41) 3771-8800|35|6|14|37.80|2.50|0.90|0.00|9.60|Produtores Integrados>Abatedouro Local>Atacado Refrigerado>Rede de Lanchonetes|0|1
presunto_fatiado|vale-presuntos|Vale Presuntos Premium|14.203.771/0001-43|industria|normal|SP|3525904|Rafael Coelho|rafael@valepresuntos.com.br|(15) 3453-2211|45|4|28|32.40|5.90|2.60|0.00|10.40|Frigorífico>Cozimento e Fatiamento>Distribuidor Regional>Rede Food Service|0|0
presunto_fatiado|rede-frigor-br|Rede Frigor BR|01.998.277/0001-12|distribuidor|presumido|BA|2927408|Silvia Lemos|silvia@redefrigor.com|(71) 3021-4770|36|6|21|33.80|4.60|2.10|0.00|16.30|Frigorífico Nordeste>Distribuidor Estadual>Atacado Food Service>Hamburguerias Turísticas|0|0
presunto_fatiado|frio-minas|FrioMinas Atacado|07.651.884/0001-06|atacado|simples|MG|3106200|João Batista|joao@friominas.com.br|(31) 3212-4200|30|5|14|30.70|2.40|0.80|0.00|12.80|Cooperativa Suína>Unidade de Fatiamento>Atacado Regional>Lojas Fast Food|0|1
queijo_prato|latte-brasil|Latte Brasil Laticínios|02.770.982/0001-20|industria|normal|SC|4205407|Fernanda Lopes|fernanda@lattebrasil.com|(48) 3333-4411|50|6|30|38.90|4.70|2.20|0.00|15.80|Cooperativa Leiteira>Queijaria>Distribuidor Frio>Rede de Hamburguerias|1|0
queijo_prato|serralacteos|Serra Lácteos Distribuidora|13.450.780/0001-58|distribuidor|presumido|PR|4113700|Mateus Xavier|mateus@serralacteos.com|(44) 3020-6600|40|5|21|36.80|3.90|1.80|0.00|13.10|Queijarias do Sul>Cross-docking Refrigerado>Distribuidor Atacado>Lanchonetes Urbanas|1|0
queijo_prato|cooperqueijo|CooperQueijo Artesanal|19.881.540/0001-09|produtor|simples|MG|3167202|Tereza Azevedo|tereza@cooperqueijo.coop.br|(38) 3541-1122|32|7|14|34.60|2.40|0.90|0.00|18.50|Produtores Rurais>Maturação Artesanal>Transportador Refrigerado>Rede Gourmet|1|1
ovos_caipira|granja-solar|Granja Solar Paulista|06.871.220/0001-30|produtor|simples|SP|3522306|Paula Mendes|paula@granjasolar.com.br|(19) 3933-8800|120|3|14|22.50|1.90|0.60|0.00|5.80|Produção Caipira>Classificação>Distribuição Própria>Rede Local|1|1
ovos_caipira|ovos-prime|Ovos Prime Distribuidora|11.405.332/0001-75|distribuidor|presumido|RJ|3303302|Juliana Teles|juliana@ovosprime.com|(21) 2763-5505|90|4|21|24.20|2.40|0.80|0.00|8.70|Granjas Certificadas>Centro de Classificação>Distribuidor Food Service>Hamburguerias Premium|1|1
ovos_caipira|agroserra|AgroSerra Atacado de Granjeiros|17.100.455/0001-01|atacado|normal|MG|3127701|Ricardo Meireles|ricardo@agroserra.com.br|(35) 3821-7788|150|5|28|21.40|1.20|0.40|0.00|12.60|Granjas Integradas>Centro de Distribuição>Atacado Alimentício>Rede Popular|1|1
alface_americana|horta-urbana|Horta Urbana São Paulo|08.771.466/0001-27|produtor|simples|SP|3548708|Michele Costa|michele@hortaurbana.com|(11) 4744-5566|70|2|7|12.80|0.80|0.30|0.00|4.50|Cultivo Controlado>Processamento Higienizado>Distribuição Própria>Lanchonete|1|1
alface_americana|verde-vivo|Verde Vivo Distribuição|22.104.780/0001-79|distribuidor|presumido|RJ|3303500|Flávia Ramalho|flavia@verdevivo.com.br|(21) 3777-9900|60|3|14|13.90|1.10|0.40|0.00|7.60|Cooperativa Hortícola>Centro de Distribuição>Logística Refrigerada>Rede Fast Food|1|1
alface_americana|ceasa-goias|CEASA Goiás Atacado|20.550.443/0001-66|atacado|normal|GO|5208707|Cláudio Peixoto|claudio@ceasagoias.com.br|(62) 3622-4455|80|4|21|11.50|0.50|0.20|0.00|9.20|Agricultores Familiares>Central de Abastecimento>Transporte Refrigerado>Rede Popular|1|1
tomate_italiano|fazenda-sol|Fazenda Sol Nascente|00.888.120/0001-98|produtor|simples|MG|3170206|Sérgio Andrade|sergio@fazendasol.com|(34) 3234-7788|90|3|10|9.80|0.90|0.30|0.00|6.40|Cultivo Protegido>Classificação>Distribuição Própria>Rede de Lanches|1|1
tomate_italiano|hortifruti-litoranea|Hortifruti Litorânea|26.550.998/0001-52|distribuidor|presumido|SP|3550308|Camila Porto|camila@hortilitoranea.com.br|(11) 3891-2300|70|2|14|11.20|1.20|0.40|0.00|8.10|Produtores do Sudeste>Armazenagem Refrigerada>Distribuidor Regional>Rede Gourmet|1|1
tomate_italiano|ceagesp-campinas|CEAGESP Campinas Varejo Pro|30.441.270/0001-45|atacado|normal|SP|3509502|Daniel Fagundes|daniel@ceagesp-pro.com.br|(19) 3746-8899|100|3|21|8.90|0.40|0.10|0.00|9.70|Produtores Rurais>Central de Abastecimento>Transporte Refrigerado>Rede Popular|1|1
milho_enlatado|agroamazon|AgroAmazon Conservas|05.612.773/0001-01|industria|normal|PA|1501402|Lorena Dias|lorena@agroamazon.com.br|(91) 3344-2290|240|7|30|5.80|4.50|2.00|0.00|18.60|Cultivo Regional>Processamento e Enlatamento>Distribuição Rodoviária>Rede de Food Service|1|0
milho_enlatado|latafacil|LataFácil Distribuidora|24.901.887/0001-73|distribuidor|presumido|SP|3534401|Henrique Vidal|henrique@latafacil.com.br|(11) 4799-5500|180|4|21|6.20|4.80|2.10|0.00|15.20|Indústria Parceira>Centro de Distribuição>Atacado Alimentício>Rede de Hamburguerias|1|0
milho_enlatado|atacado-go|Atacado GO Conservas|16.332.880/0001-44|atacado|simples|GO|5211909|Rita Cunha|rita@atacadogo.com.br|(62) 3311-9090|200|5|14|5.40|3.20|1.50|0.00|17.40|Produtores Integrados>Enlatadora Regional>Atacado Alimentar>Food Service Popular|1|1
batata_palha|crocante-alimentos|Crocante Alimentos Ltda|03.622.761/0001-06|industria|normal|PR|4119151|Rodrigo Paiva|rodrigo@crocante.com.br|(41) 3666-4455|90|5|28|24.90|5.50|2.60|0.00|13.30|Agricultores de Batata>Processamento Industrial>Distribuidor Nacional>Rede Food Service|0|0
batata_palha|snack-master|Snack Master Distribuidora|12.540.223/0001-64|distribuidor|presumido|SP|3548708|Aline Rocha|aline@snackmaster.com.br|(11) 4748-3344|80|4|21|26.40|5.80|2.90|0.00|14.80|Indústrias Conveniadas>Centro de Distribuição>Atacado Alimentar>Hamburguerias Urbanas|0|0
batata_palha|emporio-festa|Empório Festa Varejista|27.917.502/0001-88|varejo|simples|RJ|3300456|Carolina Prado|carolina@emporiofesta.com.br|(21) 2605-7711|50|2|7|23.80|3.60|1.40|0.00|7.90|Indústria Local>Varejo Atacadista>Last Mile>Hamburgueria de Bairro|0|1
maionese_profissional|condini-industria|Condini Indústria de Molhos|15.228.900/0001-05|industria|normal|SP|3526902|Viviane Ramos|viviane@condini.com.br|(11) 4789-3200|45|4|30|11.50|5.20|2.50|0.00|9.60|Refino de Óleos>Mistura Industrial>Distribuidor Food Service>Rede de Lanches|0|0
maionese_profissional|foodservice-br|FoodService BR Distribuição|18.775.604/0001-41|distribuidor|presumido|MG|3132404|Nelson Diniz|nelson@foodservicebr.com|(31) 3689-6500|36|5|21|12.30|4.90|2.30|0.00|13.70|Indústria Nacional>Centro de Distribuição>Atacado Food Service>Hamburguerias|0|0
maionese_profissional|atacarejo-sabor|Atacarejo Sabor Nordeste|29.677.880/0001-54|atacado|simples|PE|2611606|Ítalo Moura|italo@atacarejosabor.com.br|(81) 4042-7788|40|6|14|11.10|3.40|1.20|0.00|16.40|Indústria Parcialmente Terceirizada>Distribuidor Regional>Atacarejo>Rede Popular|0|1
ketchup_gourmet|molhos-legend|Molhos Legend Indústria|00.455.712/0001-61|industria|normal|SP|3505708|Andréia Teixeira|andreia@molhoslegend.com.br|(11) 4199-4400|96|4|30|9.70|5.00|2.40|0.00|10.20|Processamento Industrial>Envase>Distribuidor Nacional>Rede Food Service|0|0
ketchup_gourmet|condistrib|Condistrib Molhos & Serviços|04.990.337/0001-19|distribuidor|presumido|RS|4314902|Felipe Moraes|felipe@condistrib.com.br|(51) 3301-2200|72|5|21|10.40|5.40|2.50|0.00|12.80|Indústria Parceira>Centro de Distribuição>Atacado Alimentar>Hamburguerias Artesanais|0|0
ketchup_gourmet|varejaonorte|Varejão Norte Express|09.450.882/0001-91|varejo|simples|AM|1302603|Maicon Almeida|maicon@varejaonorte.com|(92) 3311-7755|60|6|14|9.20|3.20|1.30|0.00|22.40|Importador>Centro de Distribuição>Varejo Atacadista>Hamburguerias Regionais|0|1
mostarda_amarela|mostardas-real|Mostardas Real Indústria|08.234.655/0001-88|industria|normal|RJ|3303500|Rodrigo Sales|rodrigo@mostardasreal.com.br|(21) 3755-4400|80|4|30|8.60|4.70|2.20|0.00|9.90|Processamento Industrial>Envase>Distribuição Nacional>Rede Food Service|0|0
mostarda_amarela|gourmet-condimentos|Gourmet Condimentos Distribuidora|19.887.301/0001-46|distribuidor|presumido|RS|4320008|Silmara Dutra|silmara@gourmetcondimentos.com|(55) 3027-1199|70|5|21|9.10|4.90|2.40|0.00|12.30|Indústria Parceira>Centro de Distribuição>Atacado Alimentar>Rede Gourmet|0|0
mostarda_amarela|varejao-centro|Varejão Centro Oeste|13.411.778/0001-23|varejo|simples|SP|3503208|Bruna Watanabe|bruna@varejaocentro.com.br|(18) 3621-7070|55|3|14|8.20|3.10|1.20|0.00|8.60|Importador>Atacado Regional>Varejo Híbrido>Hamburguerias Independentes|0|1
refrigerante_cola|bebidas-top|Bebidas Top Brasil|02.330.900/0001-31|industria|normal|SP|3529401|Marcelo Azevedo|marcelo@bebidastop.com.br|(19) 3704-8899|200|4|28|3.95|7.10|3.90|8.00|12.40|Produção de Xaropes>Envase>Distribuição Nacional>Rede Food Service|0|0
refrigerante_cola|superrefri-distribuidora|SuperRefri Distribuidora|06.880.733/0001-47|distribuidor|presumido|DF|5300108|Patrícia Borges|patricia@superrefri.com.br|(61) 3550-2290|160|5|21|4.40|6.90|3.70|8.50|18.10|Indústria Parceira>Centro de Distribuição>Atacado Bebidas>Food Service|0|0
refrigerante_cola|atacarejo-pop|Atacarejo Pop Bebidas|21.440.980/0001-70|atacado|simples|BA|2927408|Renata Guimarães|renata@atacarejopop.com.br|(71) 4009-6600|220|6|14|3.70|5.60|2.90|7.50|22.60|Engarrafadora>Atacado Regional>Transporte Rodoviário>Rede Popular|0|1
sorvete_creme|gelato-brasil|Gelato Brasil Indústria|03.210.455/0001-02|industria|normal|SP|3550308|Helder Fonseca|helder@gelatobrasil.com.br|(11) 3222-9900|90|4|28|12.60|5.80|2.70|4.50|15.60|Produção Láctea>Mistura e Congelamento>Distribuição Frigorificada>Rede Food Service|0|0
sorvete_creme|friosnorte|FriosNorte Distribuições|09.688.410/0001-69|distribuidor|presumido|CE|2304400|Larissa Campos|larissa@friosnorte.com.br|(85) 3233-7700|70|6|21|13.10|5.40|2.40|5.00|19.80|Indústria Parceira>Armazenagem Frigorificada>Distribuidor Nordeste>Sorveterias e Lanchonetes|0|0
sorvete_creme|atacado-nevado|Atacado Nevado Frio & Logística|12.440.003/0001-10|atacado|simples|PR|4106902|Sandro Klos|sandro@atacadonedevado.com.br|(41) 3770-1122|75|5|14|11.90|4.20|1.90|3.80|17.20|Cooperativa Láctea>Planta de Produção>Atacado Frigorificado>Rede Popular|0|1
"""

def parse_products(raw: str):
    items = []
    for raw_line in raw.strip().splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#'):
            continue
        (
            key,
            descricao,
            ncm,
            cest,
            unidade,
            categoria,
            codigo,
            flag_refeicao,
            flag_cesta,
            flag_reducao,
            flag_is,
            is_refeicao_pronta,
        ) = line.split('|')
        item = {
            'key': key,
            'descricao': descricao,
            'ncm': ncm,
            'cest': cest,
            'unidade': unidade,
            'categoria': categoria,
            'codigo': codigo,
            'flags': {
                'refeicao': bool(int(flag_refeicao)),
                'cesta': bool(int(flag_cesta)),
                'reducao': bool(int(flag_reducao)),
                'is': bool(int(flag_is)),
            },
            'is_refeicao_pronta': bool(int(is_refeicao_pronta)),
            'suppliers': [],
        }
        item['id'] = make_id('produto', key)
        items.append(item)
    return items


def parse_suppliers(raw: str):
    items = []
    for raw_line in raw.strip().splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#'):
            continue
        (
            product_key,
            slug,
            nome,
            cnpj,
            tipo,
            regime,
            uf,
            municipio,
            contato_nome,
            contato_email,
            contato_telefone,
            pedido_minimo,
            prazo_entrega,
            prazo_pagamento,
            preco,
            ibs,
            cbs,
            is_aliquota,
            frete,
            cadeia_str,
            flag_cesta_item,
            flag_reducao_item,
        ) = line.split('|')
        supplier = {
            'product_key': product_key,
            'slug': slug,
            'nome': nome,
            'cnpj': cnpj,
            'tipo': tipo,
            'regime': regime,
            'uf': uf,
            'municipio': municipio,
            'contato': {
                'nome': contato_nome,
                'email': contato_email,
                'telefone': contato_telefone,
            },
            'pedido_minimo': float(pedido_minimo),
            'prazo_entrega': int(prazo_entrega),
            'prazo_pagamento': int(prazo_pagamento),
            'preco': float(preco),
            'ibs': float(ibs),
            'cbs': float(cbs),
            'is': float(is_aliquota),
            'frete': float(frete),
            'cadeia': cadeia_str.split('>'),
            'flags_item': {
                'cesta': bool(int(flag_cesta_item)),
                'reducao': bool(int(flag_reducao_item)),
            },
        }
        supplier['id'] = make_id('fornecedor', f"{product_key}:{slug}")
        supplier['cotacao_item_id'] = make_id('cotacao-item', f"{product_key}:{slug}")
        items.append(supplier)
    return items


products = parse_products(products_raw)
product_index = {p['key']: p for p in products}
suppliers = parse_suppliers(suppliers_raw)

for supplier in suppliers:
    product = product_index[supplier.pop('product_key')]
    product['suppliers'].append(supplier)

for product in products:
    if len(product['suppliers']) != 3:
        raise ValueError(
            f"Produto {product['key']} deveria ter 3 fornecedores, recebeu {len(product['suppliers'])}"
        )


def build_produtos_sql() -> str:
    rows = []
    for product in products:
        row = (
            f"('{product['id']}', '{USER_ID}', '{sql_escape(product['descricao'])}', "
            f"'{product['ncm']}', '{product['unidade']}', '{sql_escape(product['categoria'])}', "
            f"'{product['cest']}', '{product['codigo']}', true, "
            f"{str(product['flags']['refeicao']).lower()}, "
            f"{str(product['flags']['cesta']).lower()}, "
            f"{str(product['flags']['reducao']).lower()}, "
            f"{str(product['flags']['is']).lower()})"
        )
        rows.append(row)
    return (
        "INSERT INTO public.produtos "
        "(id, user_id, descricao, ncm, unidade_padrao, categoria, cest, codigo_interno, "
        "ativo, flag_refeicao, flag_cesta, flag_reducao, flag_is)\n  VALUES\n    "
        + ",\n    ".join(rows)
        + ";\n"
    )


def build_fornecedores_sql() -> str:
    rows = []
    for product in products:
        for supplier in product['suppliers']:
            contato = supplier['contato']
            row = (
                f"('{supplier['id']}', '{USER_ID}', '{sql_escape(supplier['nome'])}', "
                f"'{supplier['cnpj']}', '{supplier['tipo']}', '{supplier['regime']}', "
                f"'{supplier['uf']}', '{supplier['municipio']}', true, "
                f"'{sql_escape(contato['nome'])}', '{contato['email']}', "
                f"'{contato['telefone']}')"
            )
            rows.append(row)
    return (
        "INSERT INTO public.fornecedores "
        "(id, user_id, nome, cnpj, tipo, regime, uf, municipio, ativo, "
        "contato_nome, contato_email, contato_telefone)\n  VALUES\n    "
        + ",\n    ".join(rows)
        + ";\n"
    )


def build_cotacao_sql() -> str:
    return (
        "INSERT INTO public.cotacoes "
        "(id, user_id, nome, data_cotacao, uf, municipio, destino, regime, produto, scenario)\n"
        f"  VALUES ('{cotacao['id']}', '{USER_ID}', '{cotacao['nome']}', "
        f"'{cotacao['data_cotacao'].isoformat()}', '{cotacao['uf']}', '{cotacao['municipio']}', "
        f"'{cotacao['destino']}', '{cotacao['regime']}', '{cotacao['produto']}', "
        f"'{cotacao['scenario']}');\n"
    )


def build_cotacao_fornecedores_sql() -> str:
    rows = []
    for product in products:
        for supplier in product['suppliers']:
            flags_item = supplier['flags_item'].copy()
            flags_item['ncm'] = product['ncm']
            flags_json = json.dumps(flags_item, ensure_ascii=False)
            cadeia_json = json.dumps(supplier['cadeia'], ensure_ascii=False)
            row = (
                f"('{supplier['cotacao_item_id']}', '{cotacao['id']}', '{supplier['id']}', "
                f"'{sql_escape(supplier['nome'])}', '{supplier['cnpj']}', "
                f"'{supplier['tipo']}', '{supplier['regime']}', '{supplier['uf']}', "
                f"'{supplier['municipio']}', '{product['id']}', "
                f"'{sql_escape(product['descricao'])}', '{product['unidade']}', "
                f"{supplier['pedido_minimo']:.2f}, {supplier['prazo_entrega']}, "
                f"{supplier['prazo_pagamento']}, {supplier['preco']:.2f}, "
                f"{supplier['ibs']:.2f}, {supplier['cbs']:.2f}, {supplier['is']:.2f}, "
                f"{supplier['frete']:.2f}, '{sql_escape(cadeia_json)}', "
                f"'{sql_escape(flags_json)}', "
                f"{str(product['is_refeicao_pronta']).lower()}, true, "
                f"'{sql_escape(supplier['contato']['nome'])}', "
                f"'{supplier['contato']['email']}', "
                f"'{supplier['contato']['telefone']}')"
            )
            rows.append(row)
    return (
        "INSERT INTO public.cotacao_fornecedores "
        "(id, cotacao_id, fornecedor_id, nome, cnpj, tipo, regime, uf, municipio, "
        "produto_id, produto_descricao, unidade_negociada, pedido_minimo, "
        "prazo_entrega_dias, prazo_pagamento_dias, preco, ibs, cbs, is_aliquota, frete, "
        "cadeia, flags_item, is_refeicao_pronta, ativo, contato_nome, contato_email, contato_telefone)\n  VALUES\n    "
        + ",\n    ".join(rows)
        + ";\n"
    )


def build_user_role_sql() -> str:
    return (
        "INSERT INTO public.user_roles (id, user_id, role)\n"
        f"  VALUES ('{USER_ROLE_ID}', '{USER_ID}', 'admin')\n"
        "  ON CONFLICT (user_id, role) DO NOTHING;\n"
    )


sql_output = (
    "-- Seed gerado automaticamente para o combo X-Tudo (08/10/2025)\n"
    f"-- Usuário responsável pelos dados: {USER_ID}\n\n"
    + build_user_role_sql()
    + build_produtos_sql()
    + build_fornecedores_sql()
    + build_cotacao_sql()
    + build_cotacao_fornecedores_sql()
)

output_path = Path('supabase/seeds/20251008_xtudo_combo.sql')
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(sql_output, encoding='utf-8')
print(f"Seed SQL gerado em {output_path}")
