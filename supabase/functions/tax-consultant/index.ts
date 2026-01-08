/**
 * Tax Consultant Edge Function
 * 
 * IA Contábil que analisa dados do usuário e gera perfil tributário estruturado.
 * Usa Gemini Flash para extração e análise qualitativa.
 * 
 * Endpoint: POST /functions/v1/tax-consultant
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// System prompt para o consultor tributário
const SYSTEM_PROMPT = `Você é um Consultor Tributário Sênior especializado na Reforma Tributária Brasileira (PLP 68/2024 e EC 132/2023).

## Sua Missão
Analisar os dados informados pelo usuário (texto livre, JSON parcial ou dados extraídos) e estruturar um Perfil Contábil Completo para simulação tributária.

## Regras de Análise

### 1. Estimativas Inteligentes
Se o usuário não informar valores exatos (ex: "gasto muito com aluguel"), faça uma estimativa CONSERVADORA baseada em:
- Média do setor (CNAE)
- Porte da empresa (pelo faturamento)
- Localização (UF/Município)
- Tipo de atividade (serviço vs comércio vs indústria)

### 2. Análise Crítica Obrigatória

**A) Alto Custo Intermediário (Opex/CMV)**
- Se CMV + despesas operacionais > 40% do faturamento → DESTAQUE que Lucro Real e Reforma são benéficos
- Esses custos geram CRÉDITO INTEGRAL de IBS/CBS na reforma

**B) Empresa Intensiva em Mão de Obra**
- Se Folha > 28% do faturamento → ALERTE sobre impacto negativo da Reforma
- Folha de pagamento NÃO gera crédito de IBS/CBS (exceto desoneração específica)
- Sugestão: avaliar terceirização de atividades-meio

**C) Aluguel Significativo**
- No sistema ATUAL (Cumulativo): geralmente NÃO dá crédito
- Na REFORMA: dá crédito TOTAL de 25.5%
- DESTAQUE essa diferença - é um benefício automático da reforma

**D) Energia e Telecomunicações**
- Mesmo caso do aluguel: crédito integral na reforma
- Se > 3% do faturamento, é relevante destacar

### 3. Setores com Redução de Alíquota (Reforma)
Os seguintes setores têm redução de 60% na alíquota de IBS/CBS:
- Saúde e educação
- Transporte público coletivo  
- Agropecuária e alimentos básicos
- Cultura e entretenimento

### 4. Verificação de Elegibilidade
- Simples Nacional: limite R$ 4.8 milhões/ano, CNAEs permitidos
- Lucro Presumido: limite R$ 78 milhões/ano
- Lucro Real: obrigatório para alguns setores (bancos, seguradoras)

## Formato de Saída (JSON estrito)

Responda APENAS com um JSON válido no seguinte formato:

{
  "profile": {
    "razao_social": "Nome da empresa (se informado)",
    "cnpj": "00.000.000/0000-00 (se informado)",
    "cnae_principal": "0000-0/00",
    "uf": "SP",
    "municipio": "São Paulo",
    "faturamento_mensal": 100000,
    "faturamento_anual": 1200000,
    "regime_atual": "presumido",
    "numero_funcionarios": 10,
    "despesas_com_credito": {
      "cmv": 30000,
      "aluguel": 8000,
      "energia_telecom": 2500,
      "servicos_pj": 5000,
      "outros_insumos": 3000,
      "transporte_frete": 2000,
      "manutencao": 1500
    },
    "despesas_sem_credito": {
      "folha_pagamento": 25000,
      "pro_labore": 10000,
      "despesas_financeiras": 2000,
      "tributos": 15000,
      "uso_pessoal": 1000,
      "outras": 2000
    },
    "lucro_liquido": 15000
  },
  "analysis": {
    "confianca": "alta|media|baixa",
    "premissas": [
      "Assumi CMV de 30% pois é comércio varejista",
      "Aluguel estimado com base na média de SP"
    ],
    "alertas": [
      "Folha representa 35% do faturamento - empresa intensiva em mão de obra"
    ],
    "oportunidades": [
      "Aluguel atual não gera crédito, mas gerará R$ 2.500/mês na Reforma"
    ],
    "setor_identificado": "Tecnologia - Desenvolvimento de Software",
    "reducao_setorial_reforma": 0
  },
  "raw_extraction": {
    "dados_informados": ["faturamento", "cnae", "folha"],
    "dados_estimados": ["cmv", "aluguel", "energia"],
    "dados_faltantes": ["lucro_liquido", "numero_funcionarios"]
  }
}

## IMPORTANTE
- Todos os valores monetários devem ser MENSAIS
- Use valores numéricos (não strings)
- Se não souber, ESTIME com base no setor/porte
- Seja CONSERVADOR nas estimativas (prefira subestimar benefícios)
- A análise deve ser PRÁTICA e ACIONÁVEL`;

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

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: 0.2, // Baixa para respostas mais determinísticas
                responseMimeType: 'application/json',
            }
        });

        const body = await req.json();
        const {
            input_type, // 'text' | 'extracted_data' | 'partial_profile'
            text_input,
            extracted_data,
            partial_profile,
            context = {}
        } = body;

        // Construir prompt baseado no tipo de input
        let userPrompt = '';

        if (input_type === 'text') {
            userPrompt = `Analise a seguinte descrição de empresa e extraia o perfil tributário:

---
${text_input}
---

Contexto adicional:
- Data de análise: ${new Date().toISOString().split('T')[0]}
${context.uf ? `- Estado sugerido: ${context.uf}` : ''}
${context.setor_sugerido ? `- Setor sugerido: ${context.setor_sugerido}` : ''}

Extraia todas as informações possíveis e estime o que não foi informado.`;

        } else if (input_type === 'extracted_data') {
            userPrompt = `Os seguintes dados foram extraídos de documentos (SPED, planilhas, etc):

---
${JSON.stringify(extracted_data, null, 2)}
---

Complete o perfil tributário, preenchendo campos faltantes com estimativas baseadas no setor.`;

        } else if (input_type === 'partial_profile') {
            userPrompt = `O usuário preencheu parcialmente o perfil tributário:

---
${JSON.stringify(partial_profile, null, 2)}
---

Complete os campos faltantes com estimativas e analise o perfil para oportunidades tributárias.`;
        } else {
            throw new Error('input_type inválido. Use: text, extracted_data, ou partial_profile');
        }

        // Gerar resposta
        const result = await model.generateContent([
            { text: SYSTEM_PROMPT },
            { text: userPrompt }
        ]);

        const response = result.response;
        const responseText = response.text();

        // Parse JSON response
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(responseText);
        } catch {
            // Tentar extrair JSON de resposta com markdown
            const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                parsedResponse = JSON.parse(jsonMatch[1]);
            } else {
                throw new Error('Resposta da IA não é JSON válido');
            }
        }

        // Validar estrutura básica
        if (!parsedResponse.profile || !parsedResponse.analysis) {
            throw new Error('Resposta da IA incompleta');
        }

        // Adicionar metadados
        parsedResponse.metadata = {
            modelo: 'gemini-2.0-flash',
            timestamp: new Date().toISOString(),
            input_type,
            tokens_usados: response.usageMetadata?.totalTokenCount || 0
        };

        return new Response(
            JSON.stringify({
                success: true,
                data: parsedResponse
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        );

    } catch (error) {
        console.error('Tax Consultant Error:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido',
                hint: 'Verifique se a API key está configurada e o input é válido'
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
