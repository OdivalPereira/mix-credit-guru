/**
 * Tax Classifier Edge Function
 * 
 * Classifica produtos tributariamente usando IA para identificar:
 * - Setor (alimentos, saúde, educação, etc.)
 * - Cesta Básica Nacional
 * - Redução de alíquota na Reforma 2033
 * - Anexo sugerido para Simples Nacional
 * 
 * Endpoint: POST /functions/v1/tax-classifier
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `Você é um classificador tributário especializado na legislação brasileira e na Reforma Tributária 2033 (IBS/CBS).

## Sua Tarefa
Analise cada produto e retorne sua classificação tributária para o sistema calcular os impostos.

## Regras de Classificação

### Cesta Básica Nacional (100% isenção IBS/CBS)
Produtos da Lei 194/2022 e regulamentação da Reforma:
- Arroz, feijão, leite, manteiga, margarina
- Pão francês, café, óleo de soja
- Açúcar, sal, farinha de trigo/mandioca
- Ovos, frutas, legumes, verduras
- Carnes (bovina, suína, frango, peixe)

### Redução 60% (Saúde, Educação, etc.)
- Medicamentos (NCM 3003, 3004)
- Material escolar e livros didáticos
- Produtos de higiene pessoal básica
- Insumos agropecuários
- Transporte público

### Alíquota Padrão (sem redução)
- Eletrônicos, eletrodomésticos
- Cosméticos, perfumaria
- Bebidas alcoólicas
- Produtos de luxo

### Anexos Simples Nacional
- Anexo I: Comércio em geral
- Anexo II: Indústria (código NCM indica fabricação)
- Anexo III: Serviços diversos
- Anexo V: Serviços (tecnologia, consultoria)

## Formato de Saída
Retorne APENAS um JSON array válido:

[
  {
    "id": "código do produto",
    "classificacao": {
      "setor": "alimentos_basicos|saude|educacao|agropecuaria|comercio|industria|servicos|outros",
      "cesta_basica": true/false,
      "reducao_reforma": 0.00|0.60|1.00,
      "icms_substituicao": true/false,
      "anexo_simples_sugerido": "I"|"II"|"III"|"IV"|"V",
      "unidade_venda_sugerida": "UN|CX|KG|LT|ML|PC...",
      "sugestao_economia": "Insight estratégico (ex: 'Verificar créditos de entrada', 'Otimização de preço por volume')."
    },
    "motivo": "Explicação curta da classificação"
  }
]`;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('API key não configurada');
    }

    const { produtos, regrasExternas } = await req.json();

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
      throw new Error('Lista de produtos é obrigatória');
    }

    // Limitar para evitar tokens excessivos
    const produtosLimitados = produtos.slice(0, 50);

    // Preparar contexto com regras externas (se houver)
    const regrasContext = regrasExternas?.length > 0
      ? `\n\n## Regras Adicionais da Empresa:\n${JSON.stringify(regrasExternas, null, 2)}`
      : '';

    const prompt = `${SYSTEM_PROMPT}${regrasContext}

## Produtos para Classificar:
${JSON.stringify(produtosLimitados, null, 2)}

Classifique cada produto. Retorne APENAS o JSON array, sem markdown.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.1, // Baixa para consistência
        responseMimeType: 'application/json'
      }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse e validar resposta
    let classificacoes;
    try {
      classificacoes = JSON.parse(responseText);
    } catch {
      // Tentar extrair JSON de resposta com markdown
      const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        classificacoes = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Resposta da IA não é JSON válido');
      }
    }

    // Validar estrutura básica
    if (!Array.isArray(classificacoes)) {
      throw new Error('Resposta deve ser um array');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: classificacoes,
        metadata: {
          modelo: 'gemini-2.0-flash',
          timestamp: new Date().toISOString(),
          produtos_classificados: classificacoes.length,
          tokens_usados: result.response.usageMetadata?.totalTokenCount || 0
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Tax Classifier Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        hint: 'Verifique se a API key está configurada e os produtos são válidos'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
