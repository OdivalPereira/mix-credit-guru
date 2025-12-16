import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        );

        // Fetch all rules. 
        // In a real scenario with strict limits, we might want pagination or 'updated_since' filter.
        // For now, we fetch all to ensure full hydration.
        const { data: rules, error } = await supabase
            .from('ncm_rules')
            .select('*');

        if (error) {
            throw error;
        }

        // Transform to HydrationPayload schema
        const payload = rules.map((r: any) => ({
            id: r.id,
            ncm: r.ncm,
            uf: r.uf,
            municipio: r.municipio || null,
            scenario: r.scenario || 'default',
            validFrom: r.date_start,
            validTo: r.date_end,
            rates: {
                ibs: Number(r.aliquota_ibs) || 0,
                cbs: Number(r.aliquota_cbs) || 0,
                is: Number(r.aliquota_is) || 0,
            }
        }));

        return new Response(
            JSON.stringify(payload),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new Response(
            JSON.stringify({ error: message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});
