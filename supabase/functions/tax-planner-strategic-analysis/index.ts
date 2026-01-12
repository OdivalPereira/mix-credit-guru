/**
 * Tax Planner Strategic Analysis Edge Function (CÉREBRO)
 * 
 * Análise Estratégica Profunda com Gemini 2.5 Pro.
 * Retorna JSON estruturado de oportunidades, riscos e cenários.
 * NÃO gera texto final, apenas DADOS e INTELIGÊNCIA.
 * 
 * Endpoint: POST /functions/v1/tax-planner-strategic-analysis
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `Você é um Estrategista Tributário de Elite (Ex-Big4) - "O CÉREBRO".
Sua missão é estritamente ANALÍTICA. Você não conversa com o usuário final.
Você gera INTELIGÊNCIA ESTRUTURADA (JSON) para que um "Escriba" possa redigir o relatório depois.

## CONTEXTO DE ANÁLISE:
1. **Regimes Atuais**: Compare Simples, Presumido e Real com profundidade (margens, créditos, folha).
2. **Reforma Tributária**: Avalie impacto do IBS/CBS, créditos financeiros e não-cumulatividade plena.
3. **Cadeia de Valor**: Analise o peso dos fornecedores (Simples vs Normal) na geração de créditos.

## FORMATO DE SAÍDA (OBRIGATÓRIO JSON VÁLIDO):

Retorne um ARRAY de objetos "Insight":
[
  {
    "tipo": "positivo" | "negativo" | "alerta" | "neutro",
    "titulo": "string curta e técnica",
    "descricao": "Explicação detalhada da causa raiz e consequência",
    "impacto_financeiro": number | null,
    "acao_sugerida": "Ação prática imediata"
  }
]

## REGRAS DE OURO:
- NÃO escreva markdown, introduções ou "Aqui está a análise".
- APENAS O JSON PURO.
- Seja pessimista com riscos (compliance) e otimista com oportunidades REAIS (créditos lícitos).
- Gere entre 5 e 7 insights estratégicos.
`;

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
        if (!apiKey) throw new Error('API Key não configurada');

        const { profile, results } = await req.json();

        console.log('Análise estratégica (Cérebro) para:', profile?.razao_social || 'Sem Nome');

        const genAI = new GoogleGenerativeAI(apiKey);
        // Mantemos Gemini 2.5 Pro para alta capacidade de raciocínio
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-pro',
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2 // Baixa temperatura para precisão analítica
            }
        });

        const prompt = `Analise este cenário e retorne os insights em JSON:

## DADOS DA EMPRESA
${JSON.stringify(profile, null, 2)}

## RESULTADOS DO MOTOR DE CÁLCULO
${JSON.stringify(results, null, 2)}

Gere entre 5 e 7 insights estratégicos cobrindo:
1. Comparação de Regimes (melhor regime atual)
2. Impacto da Reforma Tributária (ganha ou perde?)
3. Cadeia de Fornecedores (impacto do Simples Nacional)
4. Folha de Pagamento (Fator R, custo trabalhista)
5. Oportunidades Imediatas
6. Riscos e Pontos de Atenção
7. Timeline de Transição 2026-2033

Responda APENAS o JSON (array de insights).`;

        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: prompt }
        ]);

        const responseText = result.response.text();

        // Validação do JSON
        let insights;
        try {
            insights = JSON.parse(responseText);
        } catch (e) {
            console.error("Erro ao fazer parse do JSON do Gemini:", responseText);
            throw new Error("Falha na estruturação da análise estratégica (JSON Inválido).");
        }

        return new Response(
            JSON.stringify({
                success: true,
                insights: insights,
                metadata: {
                    modelo: 'gemini-2.5-pro',
                    role: 'brain',
                    timestamp: new Date().toISOString(),
                    tokens: result.response.usageMetadata?.totalTokenCount || 0
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Erro desconhecido na análise estratégica'
        }), {
            status: 200, // Retornamos 200 com success:false para o frontend tratar
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
