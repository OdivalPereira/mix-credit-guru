/**
 * Tax Planner Extract Edge Function
 * 
 * Extração Multi-modal para Planejamento Tributário
 * Suporta: Texto, Áudio, PDF, Excel/SPED (JSON pré-processado)
 * 
 * Endpoint: POST /functions/v1/tax-planner-extract
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `Você é um Especialista em Extração de Dados Contábeis para Planejamento Tributário.

## OBJETIVO
Analisar os arquivos ou textos fornecidos e extrair um perfil estruturado da empresa para análise tributária (Reforma Tributária vs Atual).

## ESTRUTURA DE DADOS DE SAÍDA (JSON)
Você deve extrair e normalizar os dados para este formato JSON:

{
  "profile": {
    "razao_social": "string ou null",
    "cnpj": "string formatada ou null",
    "cnae_principal": "string ou null",
    "faturamento_mensal": number (média mensal),
    "faturamento_anual": number (total anual projetado),
    "uf": "UF",
    "municipio": "Nome",
    "regime_atual": "simples" | "presumido" | "real" | "mei" | null,
    
    "despesas_com_credito": {
      "cmv": number, // Custo mercadoria/insumos
      "aluguel": number, // Aluguel de imóvel/equipamentos
      "energia_telecom": number, // Energia, água, telefone, internet
      "servicos_pj": number, // Serviços tomados de outras empresas
      "outros_insumos": number,
      "transporte_frete": number,
      "manutencao": number,
      "tarifas_bancarias": number
    },
    
    "despesas_sem_credito": {
      "folha_pagamento": number, // Salários + encargos
      "pro_labore": number,
      "despesas_financeiras": number, // Juros, taxas
      "tributos": number,
      "uso_pessoal": number,
      "outras": number
    },
    
    "lucro_liquido": number
  },
  "next_question": "string | null", // Pergunta curta e natural se faltar dados críticos. Null se o perfil estiver bom o suficiente.
  "missing_fields": ["lista", "de", "campos", "faltantes"],
  "metadata": {
    "origem": "audio" | "pdf" | "texto" | "json_importado",
    "confianca": "alta" | "media" | "baixa",
    "observacoes": ["Lista de observações ou dados estimados"]
  }
}

## INSTRUÇÕES DE CONTEXTO UNIFICADO
Você pode receber "DADOS PRÉ-PROCESSADOS (JSON)" que representam o estado atual do perfil preenchido pelo usuário.
1. **Mesclar e Atualizar**: Se receber JSON pré-existente, use-o como base. Apenas altere os campos que a nova entrada (texto/arquivo/áudio) explicitamente modificar ou adicionar.
2. **Não Zerar**: Não zere campos que já estavam preenchidos, a menos que o usuário peça explicitamente (ex: "Excluir despesas financeiras").
3. **Resolver Conflitos**: Se a nova entrada contradiz o JSON, a nova entrada tem prioridade (o usuário está corrigindo).

## LÓGICA DE ENTREVISTA ADAPTATIVA (Next Question)
Seu objetivo é preencher o perfil minimamente para uma comparação tributária.
1. **Campos Críticos**: 'faturamento_mensal' (ou anual), 'regime_atual'. Se faltar um desses, PERGUNTE.
2. **Campos Secundários Importantes**: 'folha_pagamento', 'cmv' (ou 'servicos_pj'). Se faltar, PERGUNTE.
3. **Prioridade**: Pergunte UM dado por vez, o mais crítico.
4. **Estilo da Pergunta**: Curta, direta, conversacional. Ex: "Qual é o faturamento médio mensal?" ou "A empresa tem funcionários? Qual o custo da folha?".
5. **Decisão de Parada**: Se tiver Faturamento, Regime e pelo menos uma despesa relevante (Folha ou Insumos), defina "next_question": null. NÃO tente preencher tudo se o usuário não tiver.

## REGRAS DE EXTRAÇÃO
1. **Diferenciação Mensal/Anual**: 
   - Campos de despesa no JSON DEVEM ser MENSALIZADOS. Se encontrar valores anuais (DRE), divida por 12.
   - 'faturamento_anual' e 'lucro_liquido' são explicitamente TOTAIS DO ANO.
   - Se o usuário falar "Faturamento de 100k", assuma MENSAL. Se falar "Faturamento anual de 1M", divida por 12 para 'faturamento_mensal' e use o total em 'faturamento_anual'.
2. **Identificação de Regime**: Procure por termos como "Simples Nacional", "Lucro Presumido", "Lucro Real", "MEI", "Regime Normal".
3. **Prioridade de Crédito**: Identifique claramente despesas que geram crédito (Aluguel, Energia, Serviços PJ). Separe da Folha de Pagamento.
4. **Estimativa Segura**: Se um valor puder ser inferido (ex: pro-labore em empresa de um sócio), extraia. Se for incerto, deixe 0.
5. **Normalização**: Remova "R$", pontos de milhar e converta vírgulas decimais para pontos antes de gerar o número.

## FORMATO DE RESPOSTA
Apenas o JSON, sem markdown.`;


// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
        if (!apiKey) throw new Error('API Key não configurada');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash', // Multimodal capaz (audio, video, images)
            generationConfig: { responseMimeType: 'application/json' }
        });

        // 1. Processar Request (Multipart ou JSON)
        const contentType = req.headers.get('content-type') || '';

        const parts: any[] = [{ text: SYSTEM_PROMPT }];

        if (contentType.includes('multipart/form-data')) {
            // Upload de arquivo (PDF, Audio, Imagem)
            const formData = await req.formData();
            const file = formData.get('file');
            const text = formData.get('text'); // Contexto opcional
            const jsonDataString = formData.get('json_data'); // Dados pré-processados

            if (text) parts.push({ text: `CONTEXTO DO USUÁRIO: ${text}` });

            if (jsonDataString) {
                parts.push({ text: `DADOS PRÉ-PROCESSADOS (JSON): ${jsonDataString}` });
            }

            if (file && file instanceof File) {
                const arrayBuffer = await file.arrayBuffer();
                const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

                parts.push({
                    inlineData: {
                        data: base64,
                        mimeType: file.type
                    }
                });
                parts.push({ text: "Analise este arquivo e extraia os dados para o perfil tributário." });
            }

        } else {
            // JSON body (apenas texto ou dados estruturados)
            const body = await req.json();
            const { text, json_data } = body;

            if (text) parts.push({ text: `TEXTO DO USUÁRIO: ${text}` });
            if (json_data) parts.push({ text: `DADOS ESTRUTURADOS LOCAIS: ${JSON.stringify(json_data)}` });
        }

        // 2. Chamar Gemini
        const result = await model.generateContent(parts);
        const responseText = result.response.text();

        // 3. Retornar
        return new Response(responseText, {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Erro processando requisição',
                success: false
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        );
    }
});
