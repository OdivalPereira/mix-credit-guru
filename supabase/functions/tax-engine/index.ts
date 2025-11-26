import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { ncm, uf_origem, uf_destino, valor } = await req.json();

        if (!ncm || !uf_destino || !valor) {
            throw new Error("Missing required fields: ncm, uf_destino, valor");
        }

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const date = new Date().toISOString().split('T')[0];

        // Fetch rule
        const { data: rule, error } = await supabase
            .from('ncm_rules')
            .select('*')
            .eq('ncm', ncm)
            .eq('uf', uf_destino) // Assuming rule is based on destination UF
            .lte('date_start', date)
            .or(`date_end.is.null,date_end.gte.${date}`)
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        let ibs_rate = 0;
        let cbs_rate = 0;
        let is_rate = 0;
        let explanation = "No specific rule found. Using standard rates.";

        if (rule) {
            ibs_rate = Number(rule.aliquota_ibs);
            cbs_rate = Number(rule.aliquota_cbs);
            is_rate = Number(rule.aliquota_is);
            explanation = rule.explanation_md || explanation;
        } else {
            // Fallback or standard rates (could be fetched from a default rule)
            // For now, let's assume 0 if not found, or maybe standard 26.5% split?
            // Let's keep 0 and explanation indicating no rule.
            explanation = `No tax rule found for NCM ${ncm} in ${uf_destino}.`;
        }

        const ibs_value = valor * (ibs_rate / 100);
        const cbs_value = valor * (cbs_rate / 100);
        const is_value = valor * (is_rate / 100);
        const total_tax = ibs_value + cbs_value + is_value;
        const credit_amount = ibs_value + cbs_value; // Assuming IS is not creditable usually, but IBS/CBS are.

        const data = {
            ncm,
            uf_destino,
            valor,
            rates: {
                ibs: ibs_rate,
                cbs: cbs_rate,
                is: is_rate
            },
            values: {
                ibs: Number(ibs_value.toFixed(2)),
                cbs: Number(cbs_value.toFixed(2)),
                is: Number(is_value.toFixed(2)),
                total: Number(total_tax.toFixed(2))
            },
            credit_amount: Number(credit_amount.toFixed(2)),
            explanation
        };

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
