import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const contentMap: Record<string, any> = {
    "regime_lucro_real": {
        title: "Lucro Real",
        content_markdown: "O **Lucro Real** é um regime tributário onde o imposto é calculado sobre o lucro líquido do período de apuração. \n\n**Vantagens:**\n- Possibilidade de creditamento de PIS e COFINS (regime não-cumulativo).\n- Prejuízos fiscais podem ser compensados.\n\n**Desvantagens:**\n- Maior complexidade contábil e obrigações acessórias.",
        related_links: [
            { label: "Receita Federal - Lucro Real", url: "https://www.gov.br/receitafederal" }
        ]
    },
    "regime_lucro_presumido": {
        title: "Lucro Presumido",
        content_markdown: "O **Lucro Presumido** é uma forma de tributação simplificada para determinação da base de cálculo do IRPJ e da CSLL. \n\n**Características:**\n- Margens de lucro pré-fixadas pela lei.\n- PIS e COFINS cumulativos (sem crédito, mas alíquotas menores).",
        related_links: []
    },
    "ibs_cbs": {
        title: "IBS e CBS (Reforma Tributária)",
        content_markdown: "A Reforma Tributária substitui 5 tributos (PIS, COFINS, IPI, ICMS, ISS) por um IVA Dual:\n\n- **CBS (Contribuição sobre Bens e Serviços)**: Federal, substitui PIS/COFINS/IPI.\n- **IBS (Imposto sobre Bens e Serviços)**: Estadual/Municipal, substitui ICMS/ISS.\n\nAmbos são não-cumulativos plenos.",
        related_links: []
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const context_key = url.searchParams.get('context_key');

        if (!context_key) {
            throw new Error("Missing required parameter: context_key");
        }

        const data = contentMap[context_key];

        if (!data) {
            return new Response(JSON.stringify({ error: "Content not found" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404,
            });
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
