/**
 * Tax Planner Strategic Analysis Edge Function
 * 
 * Análise Estratégica Profunda com Gemini 1.5 Pro.
 * Fornece insights que vão além das regras básicas, focando em estratégia de negócio e riscos.
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

const SYSTEM_PROMPT = `Você é um Estrategista Tributário de Elite (Ex-Big4).
Sua missão é extrair insights ESTRATÉGICOS de um perfil de empresa e seus resultados de cálculo tributário.

## NUANCES IMPORTANTES (SISTEMA ATUAL):
1. **Lucro Presumido & ICMS**: Considere que o ICMS é não-cumulativo (gera crédito sobre CMV), enquanto PIS/COFINS são cumulativos (sem crédito).
2. **Simples Nacional Híbrido**: Acima de R$ 3,6M de faturamento anual (sublimite), a empresa entra em regime híbrido: ICMS/ISS são calculados por fora e podem gerar créditos/débitos reais.
3. **PIS/COFINS Não-Cumulativo**: Apenas no Lucro Real.

## IMPACTO DA REFORMA (IBS/CBS):
- Todos os regimes (Real, Presumido, Simples abaixo/acima do sublimite) serão impactados pela não-cumulatividade plena do IBS/CBS.
- O crédito financeiro amplo é o "divisor de águas".

## O QUE BUSCAMOS:
1. **Riscos Ocultos**: O faturamento está próximo de limites? A folha está muito baixa para o setor?
2. **Eficiência na Cadeia**: Como a proporção de fornecedores do Simples afeta a competitividade?
3. **Planejamento Real vs Presumido**: Qual o gatilho de lucro que tornaria o Real imbatível?
4. **Impacto da Reforma**: Além dos números, qual a mudança cultural necessária (ex: trocar fornecedores PF por PJ)?

## FORMATO DE SAÍDA (JSON):
Deve retornar uma lista de insights no formato:
[
  {
    "tipo": "positivo" | "negativo" | "alerta" | "neutro",
    "titulo": "string curta",
    "descricao": "string explicativa",
    "impacto_financeiro": number | null,
    "acao_sugerida": "string direta"
  }
]

## REGRAS:
- Seja agudo e executivo. 
- Evite obviedades que o motor de cálculo já cobre.
- Foque em GESTÃO e ESTRATÉGIA.
- Responda APENAS o JSON.`;

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
        if (!apiKey) throw new Error('API Key não configurada');

        const { profile, results } = await req.json();

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-pro',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `Analise estrategicamente este cenário:
        
        PERFIL: ${JSON.stringify(profile)}
        RESULTADOS: ${JSON.stringify(results)}
        
        Gere 3 a 5 insights estratégicos de alto impacto.`;

        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: prompt }
        ]);

        return new Response(result.response.text(), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
