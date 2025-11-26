import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaxRequest {
  ncm: string;
  uf: string;
  date: string;
}

interface TaxResponse {
  ibs: number;
  cbs: number;
  is: number;
  explanation: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ncm, uf, date }: TaxRequest = await req.json();

    if (!ncm || !uf || !date) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: ncm, uf, date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[tax-engine] Fetching rule for NCM: ${ncm}, UF: ${uf}, Date: ${date}`);

    // Query ncm_rules table for matching rule
    const { data: rule, error } = await supabase
      .from('ncm_rules')
      .select('*')
      .eq('ncm', ncm)
      .eq('uf', uf)
      .lte('date_start', date)
      .or(`date_end.is.null,date_end.gte.${date}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[tax-engine] Error fetching rule:', error);
    }

    // Default rates (transition period 2026)
    const DEFAULT_IBS = 12;
    const DEFAULT_CBS = 12;
    const DEFAULT_IS = 0;

    const response: TaxResponse = {
      ibs: rule?.aliquota_ibs ?? DEFAULT_IBS,
      cbs: rule?.aliquota_cbs ?? DEFAULT_CBS,
      is: rule?.aliquota_is ?? DEFAULT_IS,
      explanation: rule?.explanation_markdown ?? null,
    };

    console.log(`[tax-engine] Response:`, response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[tax-engine] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
