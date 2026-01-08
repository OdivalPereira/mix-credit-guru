/**
 * Tax Planner Report Edge Function
 * 
 * Geração de Relatório Consultivo Estratégico com Gemini Pro.
 * Produz análise detalhada de impacto da Reforma Tributária.
 * 
 * Endpoint: POST /functions/v1/tax-planner-report
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// SYSTEM PROMPT - CONSULTOR TRIBUTÁRIO SÊNIOR
// ============================================================================

const SYSTEM_PROMPT = `Você é um Consultor Tributário Sênior especializado na Reforma Tributária Brasileira (EC 132/2023, PLP 68/2024, LC 214/2025).

## SUA MISSÃO
Gerar um RELATÓRIO CONSULTIVO ESTRATÉGICO para uma empresa, analisando o impacto da transição do sistema tributário atual (PIS/COFINS/ICMS/ISS) para o IVA Dual (IBS/CBS).

## PRINCÍPIOS FUNDAMENTAIS DA REFORMA

### Diferenças por Regime Atual:
- **Lucro Real**: Não-cumulatividade integral de PIS/COFINS e ICMS.
- **Lucro Presumido**: Geralmente cumulativo para PIS/COFINS, mas NÃO-CUMULATIVO para ICMS (gera crédito sobre entradas).
- **Simples Nacional**: Híbrido se faturamento > R$ 3,6M (sublimite), com ICMS/ISS recolhidos por fora e gerando créditos/débitos.

### O que GERA crédito de IBS/CBS (Reforma):
- Material administrativo (escritório, copa, expediente)
- Limpeza, segurança, zeladoria
- TI (SaaS, Cloud, ERP, suporte)
- Marketing (Google Ads, agências, mídia)
- Energia elétrica (escritórios, lojas - NÃO só indústria)
- Telecomunicações
- Aluguéis comerciais
- Serviços profissionais (advocacia, contabilidade, consultoria)
- CMV e fretes

### O que NÃO GERA crédito:
- Folha de pagamento (salários, encargos)
- Pró-labore
- Juros e spread bancário (atenção: TARIFAS geram crédito!)
- Tributos
- Uso pessoal

### Impacto por Tipo de Fornecedor:
- Regime Regular: Crédito integral (26,5%)
- Simples Nacional: Crédito reduzido (~3%)
- Pessoa Física: Sem crédito

### Timeline da Transição:
- 2026: Calibração (CBS 0,9%, IBS 0,1%)
- 2027: Extinção PIS/COFINS, CBS plena
- 2029-2032: Transição ICMS/ISS → IBS
- 2033: IVA Dual pleno

## ESTRUTURA DO RELATÓRIO

Produza um relatório em Markdown com as seguintes seções:

### 1. Sumário Executivo
- Resumo do impacto financeiro
- Recomendação principal

### 2. Diagnóstico do Perfil Tributário
- Regime atual e características
- Principais despesas identificadas

### 3. Análise Comparativa de Regimes
- Tabela comparando carga tributária
- Destaque do regime mais vantajoso

### 4. Impacto da Reforma Tributária
- Despesas que passam a gerar crédito
- Quantificação do benefício
- Alerta sobre despesas sem crédito

### 5. Análise da Cadeia de Suprimentos
- Impacto de fornecedores Simples Nacional
- Recomendações de negociação

### 6. Timeline de Ação
- O que fazer em cada fase (2026-2033)

### 7. Riscos e Pontos de Atenção
- Vedações (uso pessoal, veículos)
- Segregação de despesas financeiras

### 8. Recomendações Estratégicas
- Ações imediatas
- Ações de médio prazo

## REGRAS DE ESCRITA
- Use linguagem PROFISSIONAL mas ACESSÍVEL
- Inclua NÚMEROS concretos sempre que possível
- Use emojis estratégicos para destacar insights (✅ ⚠️ 💡 📊)
- Formatação em Markdown válido
- Máximo 2000 palavras`;

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
        if (!apiKey) throw new Error('API Key não configurada');

        const body = await req.json();
        const { profile, comparison_results, cnae_info } = body;

        if (!profile) {
            return new Response(
                JSON.stringify({ error: 'Perfil da empresa é obrigatório' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Preparar contexto para a IA
        const contexto = `
## DADOS DA EMPRESA

### Identificação
- Razão Social: ${profile.razao_social || 'Não informada'}
- CNPJ: ${profile.cnpj || 'Não informado'}
- CNAE Principal: ${profile.cnae_principal || 'Não informado'}
- UF: ${profile.uf || 'Não informada'}
- Regime Atual: ${profile.regime_atual?.toUpperCase() || 'Não informado'}

### Receita
- Faturamento Mensal: R$ ${(profile.faturamento_mensal || 0).toLocaleString('pt-BR')}
- Faturamento Anual: R$ ${(profile.faturamento_anual || profile.faturamento_mensal * 12 || 0).toLocaleString('pt-BR')}

### Despesas que GERAM Crédito (IBS/CBS) - Valores Mensais
- Perfil de Fornecedores: ${(profile.percentual_fornecedores_simples || 0)}% compras via Simples Nacional (Crédito reduzido)
- CMV: R$ ${(profile.despesas_com_credito?.cmv || 0).toLocaleString('pt-BR')}
- Aluguel: R$ ${(profile.despesas_com_credito?.aluguel || 0).toLocaleString('pt-BR')}
- Energia/Telecom: R$ ${(profile.despesas_com_credito?.energia_telecom || 0).toLocaleString('pt-BR')}
- Serviços PJ: R$ ${(profile.despesas_com_credito?.servicos_pj || 0).toLocaleString('pt-BR')}
- Marketing/TI: R$ ${(profile.despesas_com_credito?.marketing || 0).toLocaleString('pt-BR')}
- Transporte/Frete: R$ ${(profile.despesas_com_credito?.transporte_frete || 0).toLocaleString('pt-BR')}
- Manutenção: R$ ${(profile.despesas_com_credito?.manutencao || 0).toLocaleString('pt-BR')}
- Tarifas Bancárias (Fees/Cartão): R$ ${(profile.despesas_com_credito?.tarifas_bancarias || 0).toLocaleString('pt-BR')}
- Outros Insumos: R$ ${(profile.despesas_com_credito?.outros_insumos || 0).toLocaleString('pt-BR')}

### Despesas SEM Crédito - Valores Mensais
- Folha de Pagamento: R$ ${(profile.despesas_sem_credito?.folha_pagamento || 0).toLocaleString('pt-BR')}
- Pró-labore: R$ ${(profile.despesas_sem_credito?.pro_labore || 0).toLocaleString('pt-BR')}
- Despesas Financeiras (Juros/Spread): R$ ${(profile.despesas_sem_credito?.despesas_financeiras || 0).toLocaleString('pt-BR')}
- Tributos Atuais: R$ ${(profile.despesas_sem_credito?.tributos || 0).toLocaleString('pt-BR')}

### Saldos Credores Legados (Ativos Fiscais)
- PIS/COFINS acumulado: R$ ${(profile.saldo_credor_pis_cofins || 0).toLocaleString('pt-BR')} (Compensável com CBS)
- ICMS acumulado: R$ ${(profile.saldo_credor_icms || 0).toLocaleString('pt-BR')} (Uso em 240 meses a partir de 2033)

${comparison_results ? `
### Resultados do Cálculo Comparativo
- Melhor Regime Atual: ${comparison_results.melhor_atual?.toUpperCase()}
- Economia Atual: R$ ${(comparison_results.economia_atual || 0).toLocaleString('pt-BR')}/ano
- Melhor Pós-Reforma: ${comparison_results.melhor_pos_reforma?.toUpperCase()}
- Economia com Reforma: R$ ${(comparison_results.economia_com_reforma || 0).toLocaleString('pt-BR')}/ano

#### Impostos por Cenário (Anual)
- Simples Nacional: R$ ${(comparison_results.cenarios?.simples?.imposto_liquido_anual || 0).toLocaleString('pt-BR')} (${(comparison_results.cenarios?.simples?.carga_efetiva_percentual || 0).toFixed(1)}%)
- Lucro Presumido: R$ ${(comparison_results.cenarios?.presumido?.imposto_liquido_anual || 0).toLocaleString('pt-BR')} (${(comparison_results.cenarios?.presumido?.carga_efetiva_percentual || 0).toFixed(1)}%)
- Lucro Real: R$ ${(comparison_results.cenarios?.real?.imposto_liquido_anual || 0).toLocaleString('pt-BR')} (${(comparison_results.cenarios?.real?.carga_efetiva_percentual || 0).toFixed(1)}%)
- Reforma 2033: R$ ${(comparison_results.cenarios?.reforma_plena?.imposto_liquido_anual || 0).toLocaleString('pt-BR')} (${(comparison_results.cenarios?.reforma_plena?.carga_efetiva_percentual || 0).toFixed(1)}%)

#### Créditos Gerados
- Lucro Real (PIS/COFINS atual): R$ ${(comparison_results.cenarios?.real?.creditos_aproveitados || 0).toLocaleString('pt-BR')}
- Reforma 2033 (IBS/CBS): R$ ${(comparison_results.cenarios?.reforma_plena?.creditos_aproveitados || 0).toLocaleString('pt-BR')}
` : ''}

${cnae_info ? `
### Informações do CNAE
- Descrição: ${cnae_info.descricao}
- Setor: ${cnae_info.setor}
- Anexo Simples: ${cnae_info.simples?.anexo}
- Presunção IRPJ: ${((cnae_info.lucro_presumido?.presuncao_irpj || 0) * 100).toFixed(0)}%
- Redução Reforma: ${((cnae_info.reforma?.reducao_aliquota || 0) * 100).toFixed(0)}%
` : ''}
`;

        // Usar Gemini Pro para relatório detalhado
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
            }
        });

        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: `Gere o relatório consultivo para a seguinte empresa:\n\n${contexto}` }
        ]);

        const reportContent = result.response.text();

        return new Response(
            JSON.stringify({
                success: true,
                report: reportContent,
                metadata: {
                    modelo: 'gemini-1.5-pro',
                    timestamp: new Date().toISOString(),
                    tokens: result.response.usageMetadata?.totalTokenCount || 0
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Erro interno'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
