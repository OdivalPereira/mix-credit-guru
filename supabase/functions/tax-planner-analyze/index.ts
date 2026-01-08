/**
 * Tax Planner Analyze Edge Function
 * 
 * Análise de CNAE com consulta local prioritária e IA como fallback.
 * Implementa cache para evitar chamadas repetidas à IA.
 * 
 * Estratégia de Custo:
 * 1. CNAE na base local → Resposta imediata (custo zero)
 * 2. CNAE não encontrado → Consulta IA (com cache)
 * 
 * Endpoint: POST /functions/v1/tax-planner-analyze
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================================================
// BASE LOCAL DE CNAEs (Custo Zero)
// ============================================================================

const CNAE_DATABASE: Record<string, CnaeInfo> = {
    // === COMÉRCIO ===
    "4711-3/01": {
        descricao: "Comércio varejista de mercadorias em geral (hipermercados)",
        setor: "comercio",
        simples: { permitido: true, anexo: "I" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0 }
    },
    "4712-1/00": {
        descricao: "Comércio varejista de mercadorias em geral (minimercados)",
        setor: "comercio",
        simples: { permitido: true, anexo: "I" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0 }
    },
    "4761-0/01": {
        descricao: "Comércio varejista de livros",
        setor: "comercio",
        simples: { permitido: true, anexo: "I" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Livros - bem cultural" }
    },

    // === TECNOLOGIA ===
    "6201-5/00": {
        descricao: "Desenvolvimento de programas de computador sob encomenda",
        setor: "tecnologia",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },
    "6202-3/00": {
        descricao: "Desenvolvimento e licenciamento de software customizável",
        setor: "tecnologia",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },
    "6203-1/00": {
        descricao: "Desenvolvimento e licenciamento de software não customizável",
        setor: "tecnologia",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },
    "6204-0/00": {
        descricao: "Consultoria em tecnologia da informação",
        setor: "tecnologia",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },
    "6209-1/00": {
        descricao: "Suporte técnico, manutenção e outros serviços em TI",
        setor: "tecnologia",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },

    // === SAÚDE ===
    "8610-1/01": {
        descricao: "Atividades de atendimento hospitalar",
        setor: "saude",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Serviços de saúde" }
    },
    "8630-5/01": {
        descricao: "Atividade médica ambulatorial com recursos para realização de procedimentos cirúrgicos",
        setor: "saude",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Serviços de saúde" }
    },
    "8630-5/02": {
        descricao: "Atividade médica ambulatorial com recursos para realização de exames complementares",
        setor: "saude",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Serviços de saúde" }
    },
    "8650-0/01": {
        descricao: "Atividades de enfermagem",
        setor: "saude",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Serviços de saúde" }
    },

    // === EDUCAÇÃO ===
    "8511-2/00": {
        descricao: "Educação infantil - creche",
        setor: "educacao",
        simples: { permitido: true, anexo: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Educação" }
    },
    "8520-1/00": {
        descricao: "Ensino fundamental",
        setor: "educacao",
        simples: { permitido: true, anexo: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Educação" }
    },
    "8531-7/00": {
        descricao: "Ensino médio",
        setor: "educacao",
        simples: { permitido: true, anexo: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Educação" }
    },
    "8599-6/04": {
        descricao: "Treinamento em desenvolvimento profissional e gerencial",
        setor: "educacao",
        simples: { permitido: true, anexo: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },

    // === CONTABILIDADE / JURÍDICO ===
    "6920-6/01": {
        descricao: "Atividades de contabilidade",
        setor: "servicos_profissionais",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },
    "6920-6/02": {
        descricao: "Atividades de consultoria e auditoria contábil e tributária",
        setor: "servicos_profissionais",
        simples: { permitido: true, anexo: "V", anexo_fator_r: "III" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },
    "6911-7/01": {
        descricao: "Serviços advocatícios",
        setor: "servicos_profissionais",
        simples: { permitido: true, anexo: "IV" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },

    // === CONSTRUÇÃO ===
    "4120-4/00": {
        descricao: "Construção de edifícios",
        setor: "construcao",
        simples: { permitido: true, anexo: "IV" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0 }
    },
    "4399-1/03": {
        descricao: "Obras de alvenaria",
        setor: "construcao",
        simples: { permitido: true, anexo: "IV" },
        lucro_presumido: { presuncao_irpj: 0.32, presuncao_csll: 0.32 },
        reforma: { reducao_aliquota: 0 }
    },

    // === TRANSPORTE ===
    "4930-2/02": {
        descricao: "Transporte rodoviário de carga",
        setor: "transporte",
        simples: { permitido: true, anexo: "III" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0 }
    },
    "4921-3/01": {
        descricao: "Transporte rodoviário coletivo de passageiros (linhas fixas, municipal)",
        setor: "transporte",
        simples: { permitido: true, anexo: "III" },
        lucro_presumido: { presuncao_irpj: 0.16, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Transporte público coletivo" }
    },

    // === ALIMENTAÇÃO / RESTAURANTES ===
    "5611-2/01": {
        descricao: "Restaurantes e similares",
        setor: "alimentacao",
        simples: { permitido: true, anexo: "I" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0 }
    },
    "5611-2/03": {
        descricao: "Lanchonetes, casas de chá, de sucos e similares",
        setor: "alimentacao",
        simples: { permitido: true, anexo: "I" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0 }
    },

    // === AGROPECUÁRIA ===
    "0111-3/01": {
        descricao: "Cultivo de arroz",
        setor: "agropecuaria",
        simples: { permitido: true, anexo: "I" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Agroindústria" }
    },
    "0151-2/01": {
        descricao: "Criação de bovinos para corte",
        setor: "agropecuaria",
        simples: { permitido: true, anexo: "I" },
        lucro_presumido: { presuncao_irpj: 0.08, presuncao_csll: 0.12 },
        reforma: { reducao_aliquota: 0.60, motivo_reducao: "Agroindústria" }
    }
};

interface CnaeInfo {
    descricao: string;
    setor: string;
    simples: {
        permitido: boolean;
        anexo: string;
        anexo_fator_r?: string;
        motivo_impedimento?: string;
    };
    lucro_presumido: {
        presuncao_irpj: number;
        presuncao_csll: number;
    };
    reforma: {
        reducao_aliquota: number;
        motivo_reducao?: string;
    };
}

interface AnalyzeRequest {
    cnae: string;
    faturamento_anual?: number;
    folha_anual?: number;
    descricao_atividade?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizeCnae(cnae: string): string {
    // Remove tudo que não for dígito
    const digits = cnae.replace(/\D/g, '');
    // Formato: 0000-0/00
    if (digits.length >= 7) {
        return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5, 7)}`;
    }
    return cnae;
}

function calcularFatorR(faturamento: number, folha: number): number {
    if (faturamento <= 0) return 0;
    return folha / faturamento;
}

function determinarAnexoComFatorR(info: CnaeInfo, fatorR: number): string {
    // Se Fator R >= 28% e o CNAE permite migração, usa anexo_fator_r
    if (fatorR >= 0.28 && info.simples.anexo_fator_r) {
        return info.simples.anexo_fator_r;
    }
    return info.simples.anexo;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const body: AnalyzeRequest = await req.json();
        const { cnae, faturamento_anual, folha_anual, descricao_atividade } = body;

        if (!cnae) {
            return new Response(
                JSON.stringify({ error: 'CNAE é obrigatório' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const cnaeNormalizado = normalizeCnae(cnae);
        const fatorR = calcularFatorR(faturamento_anual || 0, folha_anual || 0);

        // 1. TENTATIVA: Base Local (Custo Zero)
        const infoLocal = CNAE_DATABASE[cnaeNormalizado];

        if (infoLocal) {
            const anexoEfetivo = determinarAnexoComFatorR(infoLocal, fatorR);

            return new Response(
                JSON.stringify({
                    cnae: cnaeNormalizado,
                    fonte: 'local',
                    custo_ia: 0,
                    info: {
                        ...infoLocal,
                        simples: {
                            ...infoLocal.simples,
                            anexo_efetivo: anexoEfetivo,
                            fator_r: fatorR,
                            fator_r_aplicado: fatorR >= 0.28 && infoLocal.simples.anexo_fator_r ? true : false
                        }
                    }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. FALLBACK: Consulta IA (com cache no Supabase se disponível)
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        let cached = null;
        let supabase = null;

        // Tentar cache (pode falhar se tabela não existir)
        if (supabaseUrl && supabaseKey) {
            try {
                supabase = createClient(supabaseUrl, supabaseKey);
                const { data } = await supabase
                    .from('cnae_cache')
                    .select('info')
                    .eq('cnae', cnaeNormalizado)
                    .single();
                cached = data;
            } catch {
                // Tabela pode não existir, continuar sem cache
                console.log('Cache not available, proceeding to AI');
            }
        }

        if (cached?.info) {
            const infoCache = cached.info as CnaeInfo;
            const anexoEfetivo = determinarAnexoComFatorR(infoCache, fatorR);

            return new Response(
                JSON.stringify({
                    cnae: cnaeNormalizado,
                    fonte: 'cache',
                    custo_ia: 0,
                    info: {
                        ...infoCache,
                        simples: {
                            ...infoCache.simples,
                            anexo_efetivo: anexoEfetivo,
                            fator_r: fatorR,
                            fator_r_aplicado: fatorR >= 0.28 && infoCache.simples.anexo_fator_r ? true : false
                        }
                    }
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. IA: Gemini Flash para CNAEs não catalogados
        const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_AI_API_KEY');
        if (!apiKey) {
            return new Response(
                JSON.stringify({
                    cnae: cnaeNormalizado,
                    fonte: 'desconhecido',
                    error: 'CNAE não encontrado na base local e API key não configurada'
                }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { responseMimeType: 'application/json' }
        });

        const prompt = `Você é um especialista em tributação brasileira.

Analise o CNAE ${cnaeNormalizado}${descricao_atividade ? ` (${descricao_atividade})` : ''} e retorne um JSON com:

{
  "descricao": "Descrição oficial do CNAE",
  "setor": "comercio|industria|servicos|tecnologia|saude|educacao|transporte|construcao|agropecuaria|servicos_profissionais|alimentacao|outros",
  "simples": {
    "permitido": true/false,
    "anexo": "I" | "II" | "III" | "IV" | "V",
    "anexo_fator_r": "III" ou null (se Fator R >= 28% migra do V para III),
    "motivo_impedimento": "string ou null"
  },
  "lucro_presumido": {
    "presuncao_irpj": 0.08 | 0.16 | 0.32 (percentual),
    "presuncao_csll": 0.12 | 0.32 (percentual)
  },
  "reforma": {
    "reducao_aliquota": 0 | 0.30 | 0.60 (percentual de redução),
    "motivo_reducao": "string ou null"
  }
}

Regras:
- Serviços profissionais (advocacia, contabilidade, engenharia): presunção 32%
- Comércio/Indústria: presunção 8%
- Transporte de carga: presunção 8%
- Transporte de passageiros: presunção 16%
- Saúde e Educação: redução de 60% na reforma
- Transporte público coletivo: redução de 60%
- Agroindústria/Alimentos básicos: redução de 60%

Apenas o JSON, sem markdown.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        let infoIA: CnaeInfo;

        try {
            infoIA = JSON.parse(responseText);
        } catch {
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                infoIA = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error('Resposta da IA inválida');
            }
        }

        // Salvar no cache
        await supabase
            .from('cnae_cache')
            .upsert({ cnae: cnaeNormalizado, info: infoIA, updated_at: new Date().toISOString() });

        const anexoEfetivo = determinarAnexoComFatorR(infoIA, fatorR);

        return new Response(
            JSON.stringify({
                cnae: cnaeNormalizado,
                fonte: 'ia',
                custo_ia: 1, // 1 chamada de IA
                info: {
                    ...infoIA,
                    simples: {
                        ...infoIA.simples,
                        anexo_efetivo: anexoEfetivo,
                        fator_r: fatorR,
                        fator_r_aplicado: fatorR >= 0.28 && infoIA.simples.anexo_fator_r ? true : false
                    }
                }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
