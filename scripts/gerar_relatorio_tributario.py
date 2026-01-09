#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador de Relatorio de Planejamento Tributario
Modelo profissional para analise de impacto da Reforma Tributaria (IBS/CBS)

Execute: python scripts/gerar_relatorio_tributario.py
"""

from fpdf import FPDF
from datetime import datetime
import os

# ============================================================================
# DADOS DA EMPRESA (MODELO - SUBSTITUA PELOS DADOS REAIS)
# ============================================================================

DADOS_EMPRESA = {
    "razao_social": "EMPRESA MODELO LTDA",
    "cnpj": "12.345.678/0001-90",
    "cnae_principal": "4711-3/02 - Comercio varejista de mercadorias em geral",
    "uf": "SP",
    "municipio": "Sao Paulo",
    "regime_atual": "Lucro Presumido",
    
    # Receitas
    "faturamento_mensal": 350000.00,
    "faturamento_anual": 4200000.00,
    
    # Despesas que GERAM credito (mensal)
    "despesas_com_credito": {
        "cmv": 180000.00,
        "aluguel": 8500.00,
        "energia_telecom": 4200.00,
        "servicos_pj": 12000.00,
        "transporte_frete": 15000.00,
        "manutencao": 3500.00,
        "tarifas_bancarias": 2800.00,
        "outros_insumos": 5000.00,
    },
    
    # Despesas SEM credito (mensal)
    "despesas_sem_credito": {
        "folha_pagamento": 65000.00,
        "pro_labore": 15000.00,
        "despesas_financeiras": 4500.00,
        "tributos": 42000.00,
        "uso_pessoal": 1500.00,
        "outras": 3000.00,
    },
    
    # Contexto
    "percentual_fornecedores_simples": 35,  # % de compras do Simples
    "numero_funcionarios": 28,
}

# Resultados do calculo (valores modelo)
RESULTADOS = {
    "simples": {
        "elegivel": False,
        "motivo": "Faturamento acima do sublimite de R$ 3,6M",
        "imposto_anual": None,
        "carga_efetiva": None,
    },
    "presumido": {
        "elegivel": True,
        "imposto_anual": 381276.00,
        "carga_efetiva": 9.08,
        "creditos": 0,
    },
    "real": {
        "elegivel": True,
        "imposto_anual": 298450.00,
        "carga_efetiva": 7.11,
        "creditos": 156780.00,
    },
    "reforma_2027": {
        "imposto_anual": 285600.00,
        "carga_efetiva": 6.80,
        "creditos": 172340.00,
    },
    "reforma_2033": {
        "imposto_anual": 248900.00,
        "carga_efetiva": 5.93,
        "creditos": 215640.00,
    },
    "melhor_atual": "Lucro Real",
    "economia_atual": 82826.00,  # L. Presumido - L. Real
    "economia_reforma": 132376.00,  # L. Presumido - Reforma 2033
}


# ============================================================================
# CLASSE DO PDF
# ============================================================================

class RelatorioPlanejamentoTributario(FPDF):
    def __init__(self):
        super().__init__()
        self.add_page()
        self.set_auto_page_break(auto=True, margin=25)
        
    def header(self):
        # Cabecalho com logo/marca
        self.set_fill_color(30, 64, 175)  # Azul escuro
        self.rect(0, 0, 210, 35, 'F')
        
        self.set_font('Helvetica', 'B', 22)
        self.set_text_color(255, 255, 255)
        self.set_xy(15, 10)
        self.cell(0, 10, 'RELATORIO CONSULTIVO', align='C')
        
        self.set_font('Helvetica', '', 12)
        self.set_xy(15, 22)
        self.cell(0, 8, 'Planejamento Tributario - Reforma IBS/CBS', align='C')
        
        self.set_text_color(0, 0, 0)
        self.ln(30)
        
    def footer(self):
        self.set_y(-20)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 5, 'Este relatorio foi gerado com auxilio de Inteligencia Artificial.', align='C', ln=True)
        self.cell(0, 5, f'Gerado em: {datetime.now().strftime("%d/%m/%Y as %H:%M")} | Pagina {self.page_no()}/{{nb}}', align='C')
        
    def titulo_secao(self, texto, icone=""):
        self.ln(8)
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(30, 64, 175)
        if icone:
            self.cell(0, 10, f'{icone} {texto}', ln=True)
        else:
            self.cell(0, 10, texto, ln=True)
        self.set_draw_color(30, 64, 175)
        self.line(15, self.get_y(), 195, self.get_y())
        self.ln(4)
        self.set_text_color(0, 0, 0)
        
    def subtitulo(self, texto):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(55, 65, 81)
        self.cell(0, 7, texto, ln=True)
        self.set_text_color(0, 0, 0)
        
    def paragrafo(self, texto):
        self.set_font('Helvetica', '', 10)
        self.multi_cell(0, 5, texto)
        self.ln(2)
        
    def item_lista(self, texto, nivel=0):
        self.set_font('Helvetica', '', 10)
        marcador = "-" if nivel == 0 else "  *"
        indent = 20 + (nivel * 10)
        self.set_x(indent)
        self.multi_cell(0, 5, f'{marcador} {texto}')
        
    def caixa_destaque(self, titulo, valor, cor_fundo=(240, 249, 255), cor_borda=(30, 64, 175)):
        self.set_fill_color(*cor_fundo)
        self.set_draw_color(*cor_borda)
        self.rect(15, self.get_y(), 180, 25, 'DF')
        
        self.set_xy(20, self.get_y() + 3)
        self.set_font('Helvetica', '', 10)
        self.set_text_color(100, 100, 100)
        self.cell(0, 5, titulo)
        
        self.set_xy(20, self.get_y() + 6)
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(30, 64, 175)
        self.cell(0, 10, valor)
        
        self.set_text_color(0, 0, 0)
        self.ln(22)
        
    def tabela_comparativa(self, dados):
        """Cria tabela comparativa de regimes"""
        self.set_font('Helvetica', 'B', 9)
        
        # Cabecalho
        self.set_fill_color(243, 244, 246)
        self.set_draw_color(200, 200, 200)
        
        colunas = [45, 30, 35, 30, 40]
        cabecalhos = ['Regime', 'Elegivel', 'Imposto/Ano', 'Carga %', 'Creditos']
        
        for i, (cab, larg) in enumerate(zip(cabecalhos, colunas)):
            self.cell(larg, 8, cab, 1, 0, 'C', True)
        self.ln()
        
        # Linhas
        self.set_font('Helvetica', '', 9)
        for linha in dados:
            for i, (cel, larg) in enumerate(zip(linha, colunas)):
                alinhamento = 'L' if i == 0 else 'R'
                self.cell(larg, 7, str(cel), 1, 0, alinhamento)
            self.ln()
        self.ln(5)
        
    def alerta(self, texto, tipo="info"):
        cores = {
            "info": ((219, 234, 254), (30, 64, 175)),     # Azul
            "sucesso": ((220, 252, 231), (34, 197, 94)),  # Verde
            "alerta": ((254, 249, 195), (202, 138, 4)),   # Amarelo
            "perigo": ((254, 226, 226), (220, 38, 38)),   # Vermelho
        }
        fundo, borda = cores.get(tipo, cores["info"])
        
        self.set_fill_color(*fundo)
        self.set_draw_color(*borda)
        
        self.set_font('Helvetica', '', 9)
        
        altura = self.get_string_width(texto) / 165 * 5 + 12
        y_inicio = self.get_y()
        
        self.rect(15, y_inicio, 180, max(altura, 12), 'DF')
        self.set_xy(20, y_inicio + 3)
        self.multi_cell(170, 5, texto)
        self.set_y(y_inicio + max(altura, 12) + 2)


def formatar_moeda(valor):
    """Formata numero como moeda brasileira"""
    if valor is None:
        return "-"
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def gerar_relatorio():
    """Gera o relatorio PDF completo"""
    
    pdf = RelatorioPlanejamentoTributario()
    pdf.alias_nb_pages()
    
    dados = DADOS_EMPRESA
    resultados = RESULTADOS
    
    # =========================================================================
    # 1. SUMARIO EXECUTIVO
    # =========================================================================
    pdf.titulo_secao("1. SUMARIO EXECUTIVO")
    
    pdf.paragrafo(
        f"Este relatorio apresenta a analise tributaria da empresa {dados['razao_social']}, "
        f"CNPJ {dados['cnpj']}, atualmente enquadrada no regime de {dados['regime_atual']}. "
        f"A analise considera o cenario atual e os impactos da Reforma Tributaria "
        f"(EC 132/2023, LC 214/2025) que introduz o IVA Dual (IBS/CBS)."
    )
    
    # Destaques
    pdf.ln(3)
    pdf.caixa_destaque(
        "[$$] ECONOMIA POTENCIAL IMEDIATA",
        f"{formatar_moeda(resultados['economia_atual'])}/ano",
        (220, 252, 231), (34, 197, 94)
    )
    
    pdf.caixa_destaque(
        "[>>] ECONOMIA COM REFORMA (2033)",
        f"{formatar_moeda(resultados['economia_reforma'])}/ano",
        (219, 234, 254), (30, 64, 175)
    )
    
    pdf.subtitulo("Recomendacao Principal:")
    pdf.alerta(
        f"[OK] Migrar para {resultados['melhor_atual']} pode gerar economia de "
        f"{formatar_moeda(resultados['economia_atual'])}/ano, com aproveitamento de "
        f"creditos de PIS/COFINS/ICMS. Com a Reforma Tributaria em 2033, "
        f"a empresa podera ter carga tributaria ainda menor aproveitando a "
        f"nao-cumulatividade plena do IBS/CBS.",
        "sucesso"
    )
    
    # =========================================================================
    # 2. DIAGNOSTICO DO PERFIL
    # =========================================================================
    pdf.add_page()
    pdf.titulo_secao("2. DIAGNOSTICO DO PERFIL TRIBUTARIO")
    
    pdf.subtitulo("Identificacao da Empresa")
    pdf.item_lista(f"Razao Social: {dados['razao_social']}")
    pdf.item_lista(f"CNPJ: {dados['cnpj']}")
    pdf.item_lista(f"CNAE Principal: {dados['cnae_principal']}")
    pdf.item_lista(f"UF/Municipio: {dados['municipio']}/{dados['uf']}")
    pdf.item_lista(f"Regime Atual: {dados['regime_atual']}")
    pdf.item_lista(f"Numero de Funcionarios: {dados['numero_funcionarios']}")
    pdf.ln(3)
    
    pdf.subtitulo("Informacoes Financeiras (valores mensais)")
    pdf.item_lista(f"Faturamento Mensal: {formatar_moeda(dados['faturamento_mensal'])}")
    pdf.item_lista(f"Faturamento Anual: {formatar_moeda(dados['faturamento_anual'])}")
    pdf.ln(3)
    
    # Despesas com credito
    total_com_credito = sum(dados['despesas_com_credito'].values())
    pdf.subtitulo("Despesas que GERAM Credito (IBS/CBS)")
    for chave, valor in dados['despesas_com_credito'].items():
        nome = chave.replace('_', ' ').title()
        pdf.item_lista(f"{nome}: {formatar_moeda(valor)}")
    pdf.item_lista(f"TOTAL COM CREDITO: {formatar_moeda(total_com_credito)}", 0)
    pdf.ln(2)
    
    # Despesas sem credito
    total_sem_credito = sum(dados['despesas_sem_credito'].values())
    pdf.subtitulo("Despesas SEM Credito")
    for chave, valor in dados['despesas_sem_credito'].items():
        nome = chave.replace('_', ' ').title()
        pdf.item_lista(f"{nome}: {formatar_moeda(valor)}")
    pdf.item_lista(f"TOTAL SEM CREDITO: {formatar_moeda(total_sem_credito)}", 0)
    
    # =========================================================================
    # 3. ANALISE COMPARATIVA
    # =========================================================================
    pdf.add_page()
    pdf.titulo_secao("3. ANALISE COMPARATIVA DE REGIMES")
    
    pdf.paragrafo(
        "A tabela a seguir compara os regimes tributarios disponiveis para a empresa, "
        "considerando elegibilidade, carga tributaria efetiva e aproveitamento de creditos."
    )
    
    # Tabela
    dados_tabela = [
        ["Simples Nacional", "NAO", "-", "-", "-"],
        ["Lucro Presumido", "SIM", formatar_moeda(resultados['presumido']['imposto_anual']), 
         f"{resultados['presumido']['carga_efetiva']:.2f}%", formatar_moeda(0)],
        ["Lucro Real", "SIM", formatar_moeda(resultados['real']['imposto_anual']), 
         f"{resultados['real']['carga_efetiva']:.2f}%", formatar_moeda(resultados['real']['creditos'])],
        ["Reforma 2027", "N/A", formatar_moeda(resultados['reforma_2027']['imposto_anual']), 
         f"{resultados['reforma_2027']['carga_efetiva']:.2f}%", formatar_moeda(resultados['reforma_2027']['creditos'])],
        ["Reforma 2033", "N/A", formatar_moeda(resultados['reforma_2033']['imposto_anual']), 
         f"{resultados['reforma_2033']['carga_efetiva']:.2f}%", formatar_moeda(resultados['reforma_2033']['creditos'])],
    ]
    
    pdf.tabela_comparativa(dados_tabela)
    
    pdf.alerta(
        f"[!] Simples Nacional: {resultados['simples']['motivo']}. "
        f"Mesmo se fosse elegivel, o Lucro Real seria mais vantajoso para esta empresa.",
        "alerta"
    )
    
    pdf.ln(3)
    pdf.subtitulo("Por que Lucro Real e mais vantajoso?")
    pdf.item_lista("Aproveitamento de creditos de PIS (1,65%) e COFINS (7,6%) sobre insumos")
    pdf.item_lista("Aproveitamento de creditos de ICMS sobre mercadorias")
    pdf.item_lista(f"Alto volume de compras creditaveis: {formatar_moeda(total_com_credito * 12)}/ano")
    pdf.item_lista("Estrutura de custos favorece apuracao pelo lucro efetivo")
    
    # =========================================================================
    # 4. IMPACTO DA REFORMA TRIBUTARIA
    # =========================================================================
    pdf.add_page()
    pdf.titulo_secao("4. IMPACTO DA REFORMA TRIBUTARIA")
    
    pdf.paragrafo(
        "A Reforma Tributaria (EC 132/2023) introduz o IVA Dual brasileiro composto por "
        "IBS (estadual/municipal) e CBS (federal), substituindo PIS, COFINS, ICMS, ISS e IPI. "
        "A principal vantagem e a NAO-CUMULATIVIDADE PLENA, onde praticamente todas as "
        "despesas operacionais geram credito tributario."
    )
    
    pdf.subtitulo("Despesas que passam a gerar credito com IBS/CBS:")
    pdf.item_lista("Material de escritorio e expediente")
    pdf.item_lista("Limpeza, seguranca e zeladoria")
    pdf.item_lista("Sistema de TI (SaaS, Cloud, ERP)")
    pdf.item_lista("Marketing digital e publicidade")
    pdf.item_lista("Energia eletrica (inclui lojas e escritorios)")
    pdf.item_lista("Telecomunicacoes")
    pdf.item_lista("Alugueis comerciais")
    pdf.item_lista("Servicos profissionais (advocacia, contabilidade)")
    pdf.ln(3)
    
    creditos_reforma = resultados['reforma_2033']['creditos']
    creditos_atual = resultados['real']['creditos']
    aumento_creditos = creditos_reforma - creditos_atual
    
    pdf.caixa_destaque(
        "[+] AUMENTO DE CREDITOS COM A REFORMA",
        f"+{formatar_moeda(aumento_creditos)}/ano",
        (220, 252, 231), (34, 197, 94)
    )
    
    pdf.subtitulo("Alerta: Despesas que NAO geram credito")
    pdf.alerta(
        "[X] Folha de pagamento, pro-labore, juros bancarios (spread), tributos e consumo "
        "pessoal continuam SEM direito a credito no novo sistema. "
        f"Sua empresa tem {formatar_moeda(total_sem_credito * 12)}/ano nessa categoria.",
        "alerta"
    )
    
    # =========================================================================
    # 5. ANALISE DA CADEIA DE SUPRIMENTOS
    # =========================================================================
    pdf.titulo_secao("5. ANALISE DA CADEIA DE SUPRIMENTOS")
    
    perc_simples = dados['percentual_fornecedores_simples']
    
    pdf.paragrafo(
        f"Atualmente, {perc_simples}% das suas compras vem de fornecedores do Simples Nacional. "
        f"Isso impacta diretamente o aproveitamento de creditos tributarios."
    )
    
    pdf.subtitulo("Impacto por tipo de fornecedor:")
    pdf.item_lista("Fornecedor Regime Regular: Credito INTEGRAL de 26,5% (aliquota padrao)")
    pdf.item_lista("Fornecedor Simples Nacional: Credito REDUZIDO (~3% efetivo)")
    pdf.item_lista("Fornecedor Pessoa Fisica: SEM CREDITO")
    
    if perc_simples > 30:
        pdf.ln(2)
        perda_estimada = total_com_credito * 12 * (perc_simples / 100) * 0.23  # Diferenca de aliquota
        pdf.alerta(
            f"[!] ATENCAO: Alto percentual de fornecedores Simples ({perc_simples}%) "
            f"pode resultar em perda de creditos estimada em {formatar_moeda(perda_estimada)}/ano. "
            f"Considere renegociar contratos ou buscar fornecedores alternativos.",
            "alerta"
        )
    
    # =========================================================================
    # 6. TIMELINE DE ACAO
    # =========================================================================
    pdf.add_page()
    pdf.titulo_secao("6. TIMELINE DE ACAO")
    
    pdf.subtitulo("2025-2026: Preparacao")
    pdf.item_lista("Avaliar migracao para Lucro Real (se ainda nao optou)")
    pdf.item_lista("Mapear despesas por categoria de creditabilidade")
    pdf.item_lista("Revisar contratos com fornecedores Simples Nacional")
    pdf.item_lista("Capacitar equipe fiscal para novo sistema")
    pdf.ln(3)
    
    pdf.subtitulo("2026: Calibracao")
    pdf.item_lista("CBS entra em vigor com aliquota 0,9% (compensavel)")
    pdf.item_lista("IBS inicia com aliquota 0,1%")
    pdf.item_lista("Manter apuracoes paralelas para adaptacao")
    pdf.ln(3)
    
    pdf.subtitulo("2027: Extincao PIS/COFINS")
    pdf.item_lista("CBS assume aliquota plena (8,5%)")
    pdf.item_lista("Fim definitivo de PIS e COFINS")
    pdf.item_lista("Verificar aproveitamento de saldos credores legados")
    pdf.ln(3)
    
    pdf.subtitulo("2029-2032: Transicao ICMS/ISS")
    pdf.item_lista("Reducao gradual de ICMS e ISS")
    pdf.item_lista("IBS assume progressivamente")
    pdf.item_lista("Unificacao das obrigacoes acessorias")
    pdf.ln(3)
    
    pdf.subtitulo("2033: IVA Dual Pleno")
    pdf.item_lista("Extincao total de ICMS e ISS")
    pdf.item_lista("IBS/CBS em vigor com aliquota cheia (~26,5%)")
    pdf.item_lista("Nao-cumulatividade plena operacional")
    
    # =========================================================================
    # 7. RISCOS E PONTOS DE ATENCAO
    # =========================================================================
    pdf.add_page()
    pdf.titulo_secao("7. RISCOS E PONTOS DE ATENCAO")
    
    pdf.subtitulo("Vedacoes ao credito (mesmo no novo sistema):")
    pdf.item_lista("Veiculos para uso pessoal de socios/diretores")
    pdf.item_lista("Brindes e presentes para clientes")
    pdf.item_lista("Despesas de uso e consumo pessoal")
    pdf.item_lista("Alimentacao de socios (exceto Vale-Refeicao CLT)")
    pdf.ln(3)
    
    pdf.subtitulo("Cuidados com despesas financeiras:")
    pdf.item_lista("Juros de emprestimos/financiamentos: SEM CREDITO")
    pdf.item_lista("Spread bancario: SEM CREDITO")
    pdf.item_lista("Tarifas de servicos (DOC, TED, boleto): GERAM CREDITO")
    pdf.item_lista("Taxas de cartao de credito (MDR): GERAM CREDITO")
    pdf.ln(3)
    
    pdf.alerta(
        "[*] DICA: Segregue na contabilidade as 'despesas financeiras' entre juros/spread "
        "(sem credito) e tarifas/taxas de servico (com credito). Isso pode aumentar "
        "significativamente seus creditos tributarios.",
        "info"
    )
    
    # =========================================================================
    # 8. RECOMENDACOES ESTRATEGICAS
    # =========================================================================
    pdf.titulo_secao("8. RECOMENDACOES ESTRATEGICAS")
    
    pdf.subtitulo("Acoes Imediatas (proximos 6 meses):")
    pdf.item_lista("Simular migracao para Lucro Real no proximo exercicio fiscal")
    pdf.item_lista("Mapear todas as despesas que podem gerar credito")
    pdf.item_lista("Renegociar com top 10 fornecedores Simples Nacional")
    pdf.item_lista("Atualizar plano de contas para segregacao adequada")
    pdf.ln(3)
    
    pdf.subtitulo("Acoes de Medio Prazo (6-18 meses):")
    pdf.item_lista("Implementar sistema de gestao tributaria automatizado")
    pdf.item_lista("Treinar equipe fiscal sobre IBS/CBS")
    pdf.item_lista("Revisar politica de escolha de fornecedores")
    pdf.item_lista("Avaliar impacto em precificacao de produtos/servicos")
    pdf.ln(3)
    
    pdf.subtitulo("Acoes de Longo Prazo (1-3 anos):")
    pdf.item_lista("Adaptar ERP para nova apuracao unificada")
    pdf.item_lista("Reavaliar localizacao de filiais (aliquota por destino)")
    pdf.item_lista("Planejar aproveitamento de creditos acumulados ICMS (240 meses)")
    
    # =========================================================================
    # CONCLUSAO
    # =========================================================================
    pdf.add_page()
    pdf.titulo_secao("9. CONCLUSAO")
    
    pdf.paragrafo(
        f"A analise indica que a migracao para {resultados['melhor_atual']} e a opcao "
        f"mais vantajosa no cenario atual, proporcionando economia de "
        f"{formatar_moeda(resultados['economia_atual'])} por ano. "
    )
    
    pdf.paragrafo(
        f"Com a implementacao plena da Reforma Tributaria em 2033, a empresa podera "
        f"se beneficiar ainda mais da nao-cumulatividade plena, com potencial de "
        f"economia adicional de {formatar_moeda(resultados['economia_reforma'] - resultados['economia_atual'])} por ano "
        f"em relacao ao cenario atual."
    )
    
    pdf.paragrafo(
        "Recomenda-se iniciar imediatamente o planejamento da transicao, com foco na "
        "adequacao dos processos internos, capacitacao da equipe e renegociacao "
        "estrategica com fornecedores para maximizar o aproveitamento de creditos tributarios."
    )
    
    pdf.ln(5)
    pdf.alerta(
        "[TEL] Para duvidas ou aprofundamento desta analise, entre em contato com nossa "
        "equipe de consultoria tributaria. Este relatorio e uma ferramenta de apoio "
        "a decisao e nao substitui parecer formal.",
        "info"
    )
    
    # =========================================================================
    # SALVAR PDF
    # =========================================================================
    
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, f"relatorio_tributario_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
    
    pdf.output(output_path)
    print(f"Relatorio gerado com sucesso!")
    print(f"Arquivo: {output_path}")
    
    return output_path


if __name__ == "__main__":
    gerar_relatorio()
