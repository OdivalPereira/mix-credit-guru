import { describe, it, expect } from "vitest";
import { optimizePerItem, type Offer } from "@/lib/opt";

describe("optimizePerItem", () => {
  it("aloca quantidade respeitando limite de participação", () => {
    const offers: Offer[] = [
      { id: "a", price: 8, share: 0.3 },
      { id: "b", price: 9 },
    ];
    const res = optimizePerItem({ quantity: 100, offers });
    expect(res.allocation).toEqual({ a: 30, b: 70 });
    expect(res.cost).toBe(870);
    expect(res.violations).toHaveLength(0);
  });

  it("retorna violação de MOQ quando quantidade menor que mínimo", () => {
    const offers: Offer[] = [{ id: "a", price: 10, moq: 50 }];
    const res = optimizePerItem({ quantity: 30, offers });
    expect(res.allocation["a"]).toBeUndefined();
    expect(res.violations.some((v) => v.includes("MOQ"))).toBe(true);
  });

  it("retorna violação de degrau quando step impede compra", () => {
    const offers: Offer[] = [{ id: "a", price: 10, step: 40 }];
    const res = optimizePerItem({ quantity: 30, offers });
    expect(res.violations.some((v) => v.includes("degrau"))).toBe(true);
  });

  it("sinaliza capacidade insuficiente quando soma das capacidades não atende", () => {
    const offers: Offer[] = [
      { id: "a", price: 10, capacity: 40 },
      { id: "b", price: 12, capacity: 30 },
    ];
    const res = optimizePerItem({ quantity: 100, offers });
    expect(res.violations.some((v) => v.includes("Capacidade"))).toBe(true);
  });

  it("sinaliza orçamento insuficiente quando orçamento é menor que custo mínimo", () => {
    const offers: Offer[] = [
      { id: "a", price: 10, capacity: 100 },
      { id: "b", price: 11, capacity: 100 },
    ];
    const res = optimizePerItem({ quantity: 100, offers, budget: 500 });
    expect(res.violations.some((v) => v.includes("Orçamento"))).toBe(true);
  });

  it("sinaliza participação insuficiente quando soma das participações não atinge 100%", () => {
    const offers: Offer[] = [
      { id: "a", price: 10, share: 0.4 },
      { id: "b", price: 12, share: 0.3 },
    ];
    const res = optimizePerItem({ quantity: 100, offers });
    expect(res.violations.some((v) => v.includes("Participação"))).toBe(true);
  });
});
