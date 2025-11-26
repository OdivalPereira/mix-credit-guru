const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Offer {
  id: string;
  price: number;
  moq?: number;
  step?: number;
  capacity?: number;
  share?: number;
}

interface OptimizeRequest {
  quantity: number;
  offers: Offer[];
  budget?: number;
}

interface OptimizeResponse {
  allocation: Record<string, number>;
  cost: number;
  violations: string[];
}

function optimizeGreedy(
  quantity: number,
  offers: Offer[],
  budget?: number
): OptimizeResponse {
  const totalQty = quantity;
  let remainingQty = quantity;
  let remainingBudget = budget ?? Infinity;
  const allocation: Record<string, number> = {};
  const violations: string[] = [];
  let cost = 0;

  const sorted = [...offers].sort((a, b) => a.price - b.price);

  for (const offer of sorted) {
    const { id, price, moq = 0, step = 1, capacity = Infinity, share } = offer;
    let max = Math.min(remainingQty, capacity);

    if (share != null) {
      max = Math.min(max, Math.floor(totalQty * share));
    }

    if (budget !== undefined) {
      const afford = Math.floor(remainingBudget / price);
      max = Math.min(max, afford);
    }

    max = Math.floor(max / step) * step;

    if (max === 0) {
      if (remainingQty > 0) {
        violations.push(`Degrau não atendido para fornecedor ${id}`);
      }
      continue;
    }

    if (max < moq) {
      violations.push(`MOQ não atendido para fornecedor ${id}`);
      continue;
    }

    allocation[id] = max;
    remainingQty -= max;
    remainingBudget -= max * price;
    cost += max * price;
  }

  if (remainingQty > 0) {
    const totalCap = offers.reduce((sum, o) => sum + (o.capacity ?? totalQty), 0);
    if (totalCap < totalQty) {
      violations.push('Capacidade insuficiente');
    }
    if (budget !== undefined && remainingBudget < Math.min(...offers.map((o) => o.price))) {
      violations.push('Orçamento insuficiente');
    }
    const totalShare = offers.reduce(
      (sum, o) => sum + (o.share != null ? o.share * totalQty : totalQty),
      0
    );
    if (totalShare < totalQty) {
      violations.push('Participação insuficiente');
    }
  }

  return { allocation, cost, violations };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quantity, offers, budget }: OptimizeRequest = await req.json();

    if (!quantity || !offers || !Array.isArray(offers)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: quantity, offers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[optimizer] Optimizing for quantity: ${quantity}, offers: ${offers.length}`);

    const result = optimizeGreedy(quantity, offers, budget);

    console.log(`[optimizer] Result:`, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[optimizer] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
