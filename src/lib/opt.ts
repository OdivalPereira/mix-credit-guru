import { memoize } from "./memoize";

export interface Offer {
  id: string;
  price: number;
  moq?: number;
  step?: number;
  capacity?: number;
  share?: number; // fraction 0-1
}

export interface OptimizePerItemInput {
  quantity: number;
  offers: Offer[];
  budget?: number;
}

export interface OptimizePerItemResult {
  allocation: Record<string, number>;
  cost: number;
  violations: string[];
}

/**
 * Greedy optimization allocating quantity across offers while
 * respecting MOQ, step, capacity, budget and share constraints.
 */
const optimizePerItemInternal = (
  { quantity, offers, budget }: OptimizePerItemInput,
  onProgress?: (percent: number) => void,
): OptimizePerItemResult => {
  const totalQty = quantity;
  let remainingQty = quantity;
  let remainingBudget = budget ?? Infinity;
  const allocation: Record<string, number> = {};
  const violations: string[] = [];
  let cost = 0;

  const sorted = [...offers].sort((a, b) => a.price - b.price);

  sorted.forEach((offer, idx) => {
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
        violations.push(`degrau não atendido para fornecedor ${id}`);
      }
      if (onProgress) onProgress(((idx + 1) / sorted.length) * 100);
      return;
    }
    if (max < moq) {
      violations.push(`MOQ não atendido para fornecedor ${id}`);
      if (onProgress) onProgress(((idx + 1) / sorted.length) * 100);
      return;
    }
    allocation[id] = max;
    remainingQty -= max;
    remainingBudget -= max * price;
    cost += max * price;
    if (onProgress) onProgress(((idx + 1) / sorted.length) * 100);
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
      violations.push("Orçamento insuficiente");
    }
    const totalShare = offers.reduce(
      (sum, o) => sum + (o.share != null ? o.share * totalQty : totalQty),
      0,
    );
    if (totalShare < totalQty) {
      violations.push("Participação insuficiente");
    }
  }

  return { allocation, cost, violations };
};

export const optimizePerItem = memoize(optimizePerItemInternal, {
  getKey: (input) => JSON.stringify(input),
  maxSize: 50,
  onCacheHit: (_input, onProgress) => {
    if (typeof onProgress === "function") {
      onProgress(100);
    }
  },
});

