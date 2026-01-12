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

const SYSTEM_PROMPT = `Você é um Consultor Tributário Sênior (Ex-Big4) atuando como "Redator Final" (Scribe).
Sua missão é transformar insights estratégicos e dados brutos em um RELATÓRIO DE CONSULTORIA TRIBUTÁRIA IMPECÁVEL (Padrão Big4/Premium).
O relatório será lido por Diretoria/C-Level. Deve ser sóbrio, direto, técnico mas acessível, e focado em RESULTADO FINANCEIRO.

## ESTRUTURA PADRÃO DO RELATÓRIO (USAR EXATAMENTE ESTES HEADERS H3 ###)

O relatório deve ser gerado em Markdown completo, contendo EXATAMENTE estas 8 seções:

### 1. Sumário Executivo
- **Decisão**: Em uma frase, qual o melhor caminho?
- **Impacto Financeiro**: Qual a economia anual projetada (R$)?
- Use um box de destaque [OK] com a recomendação final.

### 2. Diagnóstico Tributário
- Breve perfil: Setor, Regime Atual, Faturamento (analise se está saudável ou crítico).
- Gargalos: Liste em bullets os principais problemas identificados (ex: excesso de folha sem Fator R, compra de fornecedor Simples, etc).

### 3. Cenários Comparativos (A Prova Numérica)
- Apresente uma Tabela Markdown comparando os regimes.
| Cenário | Imposto Anual | Carga Efetiva | Econ./Prejuízo |
|---------|---------------|---------------|----------------|
| Simples | ... | ... | ... |
| Presumido| ... | ... | ... |
| Real | ... | ... | ... |
| Reforma | ... | ... | ... |

### 4. Impacto da Reforma Tributária (2026-2033)
- Explique o impacto do IBS/CBS para este perfil específico.
- **Créditos**: Detalhe o potencial de créditos financeiros e de insumos.
- **Transição**: Mencione brevemente a curva de transição.

### 5. Estratégias & Oportunidades
- Utilize os 'strategic_insights' fornecidos pelo Cérebro.
- Para cada insight, crie um subtítulo ou bullet detalhado.
- Use [DICA] para oportunidades de curto prazo.

### 6. Riscos & Compliance
- Liste pontos de atenção (compliance, vedações de crédito, obrigações acessórias).
- Use [!] para riscos altos.

### 7. Plano de Ação (Checklist)
- Transforme as ações sugeridas em um Checklist prático:
- [ ] Ação 1...
- [ ] Ação 2...

### 8. Considerações Finais
- Fechamento institucional e profissional, reforçando a segurança da análise.

## REGRAS DE REDAÇÃO E FORMATAÇÃO
1. **Headers**: Use sempre ### para as seções principais (1 a 8).
2. **Tom de Voz**: Autoridade técnica, foco em "Elisão Fiscal Lícita" e "Eficiência Tributária".
3. **Formatação PDF**:
   - Use **Negrito** para valores monetários e termos chave.
   - Use boxes simulados para destaques:
     - [OK] para Recomendação Principal (será verde no PDF).
     - [!] para Risco/Alerta (será vermelho no PDF).
     - [DICA] para Estratégia (será amarelo no PDF).
     - [i] para Informação (será azul no PDF).
4. **Fidelidade**: NÃO alucine dados. Use estritamente os números fornecidos no comparativo e os insights do Cérebro.`;

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
