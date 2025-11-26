const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KnowledgeEntry {
  term: string;
  definition: string;
  example?: string;
}

const KNOWLEDGE_BASE: Record<string, KnowledgeEntry> = {
  ibs: {
    term: 'IBS',
    definition: 'Imposto sobre Bens e Serviços. Substitui o ICMS, PIS e COFINS na reforma tributária.',
    example: 'Uma alíquota de 12% de IBS significa que R$ 12,00 de cada R$ 100,00 serão destinados aos estados.',
  },
  cbs: {
    term: 'CBS',
    definition: 'Contribuição sobre Bens e Serviços. Substitui o PIS e COFINS na esfera federal.',
    example: 'Uma alíquota de 12% de CBS significa que R$ 12,00 de cada R$ 100,00 serão destinados à União.',
  },
  is: {
    term: 'IS',
    definition: 'Imposto Seletivo. Incide sobre produtos nocivos à saúde ou ao meio ambiente.',
    example: 'Bebidas alcoólicas e cigarros terão alíquotas de IS mais elevadas.',
  },
  'custo-efetivo': {
    term: 'Custo Efetivo',
    definition: 'Custo total considerando preço, frete, impostos e créditos tributários.',
    example: 'Um produto de R$ 100,00 com R$ 10,00 de frete e R$ 20,00 de impostos, menos R$ 15,00 de créditos, tem custo efetivo de R$ 115,00.',
  },
  credito: {
    term: 'Crédito Tributário',
    definition: 'Valor de impostos pagos na compra que pode ser abatido dos impostos devidos na venda.',
    example: 'Se você pagou R$ 24,00 de IBS+CBS na compra e deve R$ 30,00 na venda, pode abater os R$ 24,00, pagando apenas R$ 6,00.',
  },
  moq: {
    term: 'MOQ',
    definition: 'Minimum Order Quantity. Quantidade mínima de compra exigida pelo fornecedor.',
    example: 'Um fornecedor com MOQ de 100 unidades não aceita pedidos menores que isso.',
  },
  'cesta-basica': {
    term: 'Cesta Básica',
    definition: 'Produtos essenciais com alíquota reduzida de 40% (2026-2033) para IBS+CBS.',
    example: 'Arroz, feijão e leite fazem parte da cesta básica e têm alíquota reduzida.',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const term = url.searchParams.get('term')?.toLowerCase();

    if (term) {
      const entry = KNOWLEDGE_BASE[term];
      if (entry) {
        return new Response(JSON.stringify(entry), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(
          JSON.stringify({ error: 'Term not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Return all terms if no specific term requested
    return new Response(JSON.stringify(KNOWLEDGE_BASE), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[knowledge-base] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
