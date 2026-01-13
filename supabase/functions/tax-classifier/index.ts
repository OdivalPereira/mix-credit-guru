/**
 * Tax Classifier Edge Function
 * 
 * Classifica produtos tributariamente usando:
 * 1. Tabela NCM oficial (determinística)
 * 2. IA Gemini como fallback (para NCMs desconhecidos)
 * 3. Validação pós-IA (para evitar classificações incorretas)
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

// ============================================================================
// TABELA NCM (INLINE - Deno Edge Functions não suportam imports externos)
// ============================================================================

interface NCMRule {
  ncmPattern: string;
  setor: string;
  cesta_basica: boolean;
  reducao_reforma: number;
  anexo_simples_sugerido: string;
  descricao: string;
}

const NCM_CESTA_BASICA: NCMRule[] = [
  { ncmPattern: '0201', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Carnes bovinas frescas/refrigeradas' },
  { ncmPattern: '0202', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Carnes bovinas congeladas' },
  { ncmPattern: '0203', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Carnes suínas' },
  { ncmPattern: '0207', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Carnes de aves' },
  { ncmPattern: '0302', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Peixes frescos' },
  { ncmPattern: '0303', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Peixes congelados' },
  { ncmPattern: '0401', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Leite e creme de leite' },
  { ncmPattern: '0405', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Manteiga' },
  { ncmPattern: '0407', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Ovos' },
  { ncmPattern: '07', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Hortícolas' },
  { ncmPattern: '08', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Frutas' },
  { ncmPattern: '1006', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Arroz' },
  { ncmPattern: '0713', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Feijão' },
  { ncmPattern: '0901', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Café' },
  { ncmPattern: '1101', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Farinha de trigo' },
  { ncmPattern: '1102', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Farinhas de cereais' },
  { ncmPattern: '1106', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Farinha de mandioca' },
  { ncmPattern: '1507', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Óleo de soja' },
  { ncmPattern: '1517', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Margarina' },
  { ncmPattern: '1701', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Açúcar' },
  { ncmPattern: '2501', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Sal' },
  { ncmPattern: '1905', setor: 'alimentos_basicos', cesta_basica: true, reducao_reforma: 1, anexo_simples_sugerido: 'I', descricao: 'Pães' },
];

const NCM_REDUCAO_60: NCMRule[] = [
  { ncmPattern: '3003', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Medicamentos' },
  { ncmPattern: '3004', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Medicamentos dosados' },
  { ncmPattern: '3005', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Curativos' },
  { ncmPattern: '9018', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Instrumentos médicos' },
  { ncmPattern: '9021', setor: 'saude', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Próteses' },
  { ncmPattern: '4820', setor: 'educacao', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Material escolar' },
  { ncmPattern: '4901', setor: 'educacao', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Livros' },
  { ncmPattern: '31', setor: 'agropecuaria', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Adubos' },
  { ncmPattern: '3808', setor: 'agropecuaria', cesta_basica: false, reducao_reforma: 0.6, anexo_simples_sugerido: 'I', descricao: 'Defensivos agrícolas' },
];

const NCM_EXCLUSOES = ['22', '24', '33', '64', '71', '84', '85', '87', '88', '89', '91', '93', '95', '97'];

function buscarRegraNCM(ncm: string): NCMRule | null {
  const ncmLimpo = ncm.replace(/\D/g, '');
  const todasRegras = [...NCM_CESTA_BASICA, ...NCM_REDUCAO_60];
  let melhorMatch: NCMRule | null = null;
  let maiorComprimento = 0;

  for (const regra of todasRegras) {
    if (ncmLimpo.startsWith(regra.ncmPattern) && regra.ncmPattern.length > maiorComprimento) {
      melhorMatch = regra;
      maiorComprimento = regra.ncmPattern.length;
    }
  }
  return melhorMatch;
}

function ncmEstaExcluido(ncm: string): boolean {
  const ncmLimpo = ncm.replace(/\D/g, '');
  return NCM_EXCLUSOES.some(prefixo => ncmLimpo.startsWith(prefixo));
}

// ============================================================================
// PROMPT DA IA (MELHORADO)
// ============================================================================

const SYSTEM_PROMPT = `Você é um classificador tributário especializado na legislação brasileira e na Reforma Tributária 2033 (IBS/CBS).

## REGRAS CRÍTICAS DE EXCLUSÃO (NUNCA podem ser Cesta Básica ou ter isenção)
NCMs que começam com os seguintes prefixos NUNCA podem ter reducao_reforma = 1:
- 22 (Bebidas)
- 24 (Tabaco)
- 33 (Cosméticos e perfumaria)
- 64 (Calçados)
- 71 (Joias)
- 84 (Máquinas)
- 85 (Eletrônicos)
- 87 (Veículos)

## Regras de Classificação
- Cesta Básica (reducao_reforma = 1): APENAS alimentos básicos (NCM 01-21)
- Redução 60% (reducao_reforma = 0.6): Medicamentos, material escolar, insumos agrícolas
- Padrão (reducao_reforma = 0): Todos os outros

## Formato de Saída
Retorne APENAS um JSON array válido:
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
      "sugestao_economia": "Insight (opcional)"
    },
    "motivo": "Justificativa baseada no NCM"
  }
]`;

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

    // CAMADA 1: Classificar usando tabela NCM
    for (const produto of produtosLimitados) {
      const ncm = produto.ncm || '';
      const regra = buscarRegraNCM(ncm);

      if (regra) {
        classificacoes.push({
          id: produto.id,
          classificacao: {
            setor: regra.setor,
            cesta_basica: regra.cesta_basica,
            reducao_reforma: regra.reducao_reforma,
            icms_substituicao: false,
            anexo_simples_sugerido: regra.anexo_simples_sugerido,
            unidade_venda_sugerida: 'UN',
            sugestao_economia: ''
          },
          motivo: `NCM ${ncm} - ${regra.descricao} (classificação via tabela)`
        });
      } else {
        produtosParaIA.push(produto);
      }
    }

    // CAMADA 2: Chamar IA para produtos não encontrados na tabela
    if (produtosParaIA.length > 0) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
      });

      const prompt = `${SYSTEM_PROMPT}\n\n## Produtos para Classificar:\n${JSON.stringify(produtosParaIA, null, 2)}\n\nClassifique cada produto. Retorne APENAS o JSON array.`;
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

      // CAMADA 3: Validação pós-IA
      for (const item of iaClassificacoes) {
        const produtoOriginal = produtosParaIA.find(p => p.id === item.id);
        const ncm = produtoOriginal?.ncm || '';

        // Se NCM está na lista de exclusão e IA retornou isento, corrigir
        if (ncmEstaExcluido(ncm) && item.classificacao?.reducao_reforma > 0) {
          item.classificacao.reducao_reforma = 0;
          item.classificacao.cesta_basica = false;
          item.classificacao.setor = 'comercio';
          item.motivo = `NCM ${ncm} - Corrigido: Este NCM não pode ter benefícios fiscais (via validação)`;
        }

        classificacoes.push(item);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: classificacoes,
        metadata: {
          modelo: 'gemini-2.0-flash',
          timestamp: new Date().toISOString(),
          produtos_classificados: classificacoes.length,
          classificados_tabela: produtosLimitados.length - produtosParaIA.length,
          classificados_ia: produtosParaIA.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Tax Classifier Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        hint: 'Verifique se a API key está configurada e os produtos são válidos'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
