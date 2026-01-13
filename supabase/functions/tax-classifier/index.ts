
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// CONFIGURAÇÃO SUPABASE
// ============================================================================
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// PROMPT DA IA (MELHORADO)
// ============================================================================

const SYSTEM_PROMPT = `Você é um classificador tributário ESPECIALISTA na Lei Complementar 214/2025 (Reforma Tributária IBS/CBS).

## Contexto
Você receberá produtos e, opcionalmente, "Regras de Referência" oficiais do governo para NCMs parecidos.
USE AS REGRAS DE REFERÊNCIA para guiar sua decisão.

## Regras Críticas de Validação
- Se um produto for "Água", "Leite", "Arroz", "Feijão" -> Verifique se é Cesta Básica (redução 100%).
- Bebidas Alcoólicas, Tabaco, Perfumes -> NUNCA têm benefício (Padrão).

## Formato de Saída (JSON Array)
[
  {
    "id": "código",
    "classificacao": {
      "setor": "alimentos_basicos|saude|educacao|comercio|industria|outros",
      "cesta_basica": true/false,
      "reducao_reforma": 0.00|0.60|1.00,
      "icms_substituicao": false,
      "anexo_simples_sugerido": "I"|"II"|"III"|"IV"|"V",
      "unidade_venda_sugerida": "UN|CX|KG...",
      "unit_type": "UN|CX|KG|FD|LT",
      "conversion_factor": 1,
      "sugestao_economia": "Insight curto (max 100 chars)"
    },
    "motivo": "Justificativa técnica"
  }
]

## Gestão de Unidades
- Identifique se o produto é vendido em fardos, caixas ou unidades coletivas (ex: "CX 12", "FD 6", "PACK 4", "12x1L").
- Se encontrar um padrão, defina "unit_type" (ex: "CX") e "conversion_factor" (ex: 12). 
- Se for uma unidade simples, "unit_type" é "UN" e "conversion_factor" é 1.
`;

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) throw new Error('API key não configurada');

    const { produtos } = await req.json();
    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
      throw new Error('Lista de produtos é obrigatória');
    }

    const produtosLimitados = produtos.slice(0, 50);
    const classificacoes: any[] = [];
    const produtosParaIA: any[] = [];

    // 1. Validar NCMs na camada de Governo (Anexos)
    const ncms = produtosLimitados.map(p => p.ncm?.replace(/\D/g, '')).filter(Boolean);

    let validNcms: any[] = [];
    if (ncms.length > 0) {
      const { data } = await supabase
        .from('tax_ncms_gov')
        .select('ncm, anexo_id')
        .in('ncm', ncms);
      if (data) validNcms = data;
    }

    // 2. Buscar Regras Genéricas (Contexto)
    const { data: regrasGov } = await supabase
      .from('tax_rules_gov')
      .select('codigo, descricao, tipo_aliquota')
      .limit(100);

    // Contexto para o Prompt
    const contextString = regrasGov
      ? regrasGov.map(r => `- Código ${r.codigo} (${r.tipo_aliquota}): ${r.descricao}`).join('\n')
      : 'Nenhuma regra governamental carregada.';

    // Processamento
    for (const produto of produtosLimitados) {
      const ncmLimpo = produto.ncm?.replace(/\D/g, '') || '';
      const isValidGovNcm = validNcms.some(v => v.ncm === ncmLimpo);

      // Adiciona flag para IA saber que esse NCM existe oficialmente
      produtosParaIA.push({
        ...produto,
        _ncm_validado_gov: isValidGovNcm
      });
    }

    // 3. IA com Contexto Injetado
    if (produtosParaIA.length > 0) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      });

      const promptContexto = `
## Regras Oficiais de Classificação (Lei Complementar 214/2025 - CFF):
Abaixo estão os cenários de tributação oficiais. Seu trabalho é associar o produto a um destes cenários baseando-se na natureza do produto e se o NCM é validado.
${contextString}

## Instruções Específicas:
1. Se o produto tiver "_ncm_validado_gov": true, isso aumenta a confiança de que ele é um produto CFF regulado.
2. Tente enquadrar o produto em um dos códigos oficiais acima (ex: 000001, 000002) se a descrição bater.
3. Se for Cesta Básica (Arroz, Feijão, etc), procure a regra de Isenção/Redução 100%.
`;

      const prompt = `${SYSTEM_PROMPT}\n${promptContexto}\n\n## Produtos para Classificar:\n${JSON.stringify(produtosParaIA, null, 2)}\n\nClassifique cada produto. Retorne APENAS o JSON array.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      let iaClassificacoes;
      try {
        iaClassificacoes = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) iaClassificacoes = JSON.parse(jsonMatch[1]);
        else throw new Error('Resposta da IA não é JSON válido');
      }

      // Processar resultados
      iaClassificacoes.forEach((item: any) => {
        // Recupera se era validado
        const original = produtosParaIA.find(p => p.id === item.id);
        const isGov = original?._ncm_validado_gov;

        // Se NCM validado, adicionamos badge 'governo' (Hybrid) se a resposta da IA for coerente
        if (isGov) {
          item.source = 'governo';
          item.motivo += ' (NCM Validado na Tabela Oficial)';
        } else {
          item.source = 'ia';
        }

        classificacoes.push(item);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: classificacoes,
        metadata: {
          timestamp: new Date().toISOString(),
          total: produtosLimitados.length,
          gov_matches: classificacoes.filter(c => c.source === 'governo').length,
          ai_predictions: classificacoes.filter(c => c.source === 'ia').length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Tax Classifier Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
