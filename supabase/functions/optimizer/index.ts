import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface Offer {
    id: string;
    price: number;
    moq?: number;
    step?: number;
    capacity?: number;
    share?: number; // fraction 0-1
}

interface OptimizePerItemInput {
    quantity: number;
    offers: Offer[];
    budget?: number;
}

interface OptimizePerItemResult {
    allocation: Record<string, number>;
    cost: number;
    violations: string[];
}

const optimizePerItemInternal = (
    { quantity, offers, budget }: OptimizePerItemInput
): OptimizePerItemResult => {
    const totalQty = quantity;
    let remainingQty = quantity;
    let remainingBudget = budget ?? Infinity;
    const allocation: Record<string, number> = {};
    const violations: string[] = [];
    let cost = 0;

    const sorted = [...offers].sort((a, b) => a.price - b.price);

    sorted.forEach((offer) => {
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
                // Only report violation if we still need quantity but can't take from this supplier due to constraints
                // Actually, the original logic reported violation if max=0 but remainingQty > 0. 
                // But maybe we just skip? Let's keep original logic.
                violations.push(`degrau nao atendido para fornecedor ${id}`);
            }
            return;
        }

        if (max < moq) {
            violations.push(`MOQ nao atendido para fornecedor ${id}`);
            return;
        }

        allocation[id] = max;
        remainingQty -= max;
        remainingBudget -= max * price;
        cost += max * price;
    });

    if (remainingQty > 0) {
        const totalCap = offers.reduce(
            (sum, o) => sum + (o.capacity ?? totalQty),
            0,
        );
        if (totalCap < totalQty) {
            violations.push("Capacidade insuficiente");
        }
        if (
            budget !== undefined &&
            remainingBudget < Math.min(...offers.map((o) => o.price))
        ) {
            violations.push("Orcamento insuficiente");
        }
        const totalShare = offers.reduce(
            (sum, o) => sum + (o.share != null ? o.share * totalQty : totalQty),
            0,
        );
        if (totalShare < totalQty) {
            violations.push("Participacao insuficiente");
        }
    }

    return { allocation, cost, violations };
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const input: OptimizePerItemInput = await req.json();

        if (input.quantity === undefined || !input.offers) {
            throw new Error("Missing required fields: quantity, offers");
        }

        const result = optimizePerItemInternal(input);

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
