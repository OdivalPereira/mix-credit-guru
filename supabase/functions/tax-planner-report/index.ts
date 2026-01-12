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
Gerar um RELATÓRIO CONSULTIVO ESTRATÉGICO PROFISSIONAL para uma empresa, analisando o impacto da transição do sistema tributário atual (PIS/COFINS/ICMS/ISS) para o IVA Dual (IBS/CBS).

## ESTRUTURA DO RELATÓRIO (OBRIGATÓRIO SEGUIR ESTA ORDEM)

Produza o relatório em Markdown com EXATAMENTE estas 9 seções:

### 1. Sumário Executivo
- Resumo executivo de alto nível sobre impacto financeiro total.
- Use [OK] para a recomendação principal.

### 2. Diagnóstico do Perfil Tributário
- Análise do regime atual e setor (CNAE).
- Identificação dos principais gargalos tributários.

### 3. Análise Comparativa de Regimes
- OBRIGATÓRIO: Apresentar uma TABELA Markdown comparando os regimes (Simples, Presumido, Real e Reforma).
- Colunas Sugeridas: Regime | Imposto Anual | Carga Efetiva (%) | Economia Potencial.

### 4. Impacto da Reforma Tributária
- Detalhar as despesas que passam a gerar crédito de IBS/CBS.
- Use tabelas para listar itens creditáveis e seus respectivos impactos.

### 5. Análise da Cadeia de Suprimentos
- Análise específica sobre o impacto de fornecedores do Simples Nacional vs Regime Normal.
- Use [i] para explicar o cálculo do crédito reduzido.

### 6. Timeline de Ação (2025-2033)
- Liste marcos críticos: 2026 (calibração), 2027 (CBS plena), 2029-2032 (transição IBS), 2033 (IVA pleno).

### 7. Riscos e Pontos de Atenção
- Use [!] para destacar vedações ao crédito (uso pessoal, veículos, etc).
- Alertar sobre necessidade de compliance rigoroso.

### 8. Recomendações Estratégicas
- Dividir em: Curto Prazo (imediato), Médio Prazo (2026-2027) e Longo Prazo.
- Use [DICA] para dicas estratégicas exclusivas.

### 9. Conclusão e Próximos Passos
- Fechamento consultivo reforçando a proposta de valor.

## REGRAS DE FORMATAÇÃO (ESTÉTICA PDF)
1. **Tabelas**: Use tabelas Markdown padrão (| header | header |) para todos os dados comparativos.
2. **Boxes de Destaque**: Use estes prefixos no início da linha para criar boxes coloridos no PDF:
   - [!] para Risco/Perigo (Box Vermelho)
   - [OK] para Recomendação/Sucesso (Box Verde)
   - [i] para Informação Relevante (Box Azul)
   - [DICA] para Sugestão Estratégica
   - [AVISO] para Ponto de Atenção
3. **Escrita**: Tom técnico, sênior e direto. Use números reais conforme contexto fornecido.`;

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('GEMINI_API_KEY') ||
            Deno.env.get('GOOGLE_AI_API_KEY') ||
            Deno.env.get('gemini_api_key') ||
            Deno.env.get('google_ai_api_key');

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
        console.log('Gerando relatório para:', profile.razao_social || 'Sem Nome');

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
- Faturamento Anual: R$ ${(profile.faturamento_anual || (profile.faturamento_mensal || 0) * 12).toLocaleString('pt-BR')}

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

        // Usar Gemini 2.5 Pro (Atualizado conforme solicitado - High Reasoning)
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-pro',
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
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
                    modelo: 'gemini-2.5-pro',
                    timestamp: new Date().toISOString(),
                    tokens: result.response.usageMetadata?.totalTokenCount || 0
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error details:', error);
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Erro interno desconhecido na Edge Function',
                details: error.stack,
                context: 'Acompanhamento de erro para depuração'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
