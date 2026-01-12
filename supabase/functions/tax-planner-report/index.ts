/**
 * Tax Planner Report Edge Function (ESCRIBA)
 * 
 * Geração de Relatório Consultivo com Gemini 2.0 Flash.
 * Foca em estrutura, tom de voz e formatação, consumindo insights pré-processados.
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
// SYSTEM PROMPT - REDATOR TÉCNICO SÊNIOR (ESCRIBA)
// ============================================================================

const SYSTEM_PROMPT = `Você é um Redator Técnico Sênior especializado em Relatórios Tributários de Alta Performance.
Sua função NÃO É ANALISAR dados brutos, mas sim ESTRUTURAR e REDIGIR insights estratégicos já processados pelo "Cérebro" (Analista Estratégico).

## SUA MISSÃO
Transformar o JSON de "Strategic Insights" e os dados da empresa em um RELATÓRIO PDF (Markdown) impecável, profissional e direto ao ponto.

## INPUT RECEBIDO
Você receberá:
1. Dados da Empresa (Profile)
2. Resultados Numéricos (Comparison Results)
3. INSIGHTS ESTRATÉGICOS (O "Cérebro" já analisou e gerou estes pontos chave)

## ESTRUTURA DO RELATÓRIO (MANTENHA RIGOROSAMENTE)

### 1. Sumário Executivo
- Sintetize a recomendação principal baseada nos insights.
- Use [OK] para indicar o melhor regime.

### 2. Diagnóstico do Perfil
- Breve descritivo da empresa (Faturamento, Setor, Regime Atual).
- Cite os "Gargalos" identificados nos insights (se houver).

### 3. Comparativo Financeiro (A Prova Numérica)
- OBRIGATÓRIO: Tabela Markdown clara comparando os regimes.
- Colunas: Regime | Imposto Anual | Carga Real (%) | Economia/Prejuízo.

### 4. Estratégia & Oportunidades (O Coração do Relatório)
- Utilize os dados de 'strategic_insights' para preencher esta seção.
- Agrupe por temas: "Otimização Imediata", "Impacto da Reforma", "Gestão de Fornecedores".
- Use [DICA] ou [!] conforme o 'tipo' do insight (positivo/alerta).

### 5. Plano de Ação (Próximos Passos)
- Converta as 'acao_sugerida' dos insights em um checklist prático.

## TOM DE VOZ
- Profissional, Seguro e Objetivo.
- Evite juridiquês excessivo.
- Use formatação Markdown (Negrito, Listas) para facilitar leitura.

## FORMATAÇÃO PDF
- Use boxes coloridos (simulados com prefixos):
  - [!] Vermelho (Risco)
  - [OK] Verde (Sucesso/Recomendação)
  - [i] Azul (Info)
  - [DICA] Amarelo (Estratégia)
`;

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
        const { profile, comparison_results, cnae_info, strategic_insights } = body;

        if (!profile) {
            return new Response(
                JSON.stringify({ error: 'Perfil da empresa é obrigatório' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('Gerando relatório (Escriba) para:', profile.razao_social || 'Sem Nome');

        // Contexto enriquecido com os INSIGHTS PRÉ-PROCESSADOS
        const contexto = `
## 1. DADOS CADASTRAIS
- Empresa: ${profile.razao_social || 'N/A'}
- Faturamento Anual: R$ ${(profile.faturamento_anual || (profile.faturamento_mensal || 0) * 12).toLocaleString('pt-BR')}
- Regime Atual: ${profile.regime_atual?.toUpperCase()}
- Setor: ${cnae_info?.setor || 'N/A'} (CNAE: ${profile.cnae_principal})

## 2. RESULTADOS DO CÁLCULO (NUMÉRICOS)
- Melhor Regime Hoje: ${comparison_results?.melhor_atual?.toUpperCase()} (Economia: R$ ${(comparison_results?.economia_atual || 0).toLocaleString('pt-BR')})
- Simples Nacional: R$ ${(comparison_results?.cenarios?.simples?.imposto_liquido_anual || 0).toLocaleString('pt-BR')}
- Lucro Presumido: R$ ${(comparison_results?.cenarios?.presumido?.imposto_liquido_anual || 0).toLocaleString('pt-BR')}
- Lucro Real: R$ ${(comparison_results?.cenarios?.real?.imposto_liquido_anual || 0).toLocaleString('pt-BR')}
- Reforma 2033: R$ ${(comparison_results?.cenarios?.reforma_plena?.imposto_liquido_anual || 0).toLocaleString('pt-BR')}

## 3. INSIGHTS ESTRATÉGICOS ("O CÉREBRO" ANALISOU ISTO)
Use estes pontos para construir a narrativa do relatório. NÃO INVENTE DADOS, apenas formate e explique estes pontos:

${strategic_insights ? JSON.stringify(strategic_insights, null, 2) : 'Nenhum insight estratégico foi fornecido. Use os dados numéricos acima para gerar recomendações básicas.'}
`;

        // Usar Gemini 2.0 Flash (O Escriba - Rápido e Eficiente)
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.3, // Baixa temperatura para fidelidade aos insights
                maxOutputTokens: 8192,
            }
        });

        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: `Redija o Relatório Consultivo Final com base nestes dados:\n\n${contexto}` }
        ]);

        const reportContent = result.response.text();

        return new Response(
            JSON.stringify({
                success: true,
                report: reportContent,
                metadata: {
                    modelo: 'gemini-2.0-flash',
                    role: 'scribe',
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
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
