import type { CreditStatus } from "@/types/domain";

// Regras simplificadas de creditabilidade por destinação e regime tributário
const creditRules: Record<string, Record<string, CreditStatus>> = {
  A: { normal: "yes", simples: "no", presumido: "limited" },
  B: { normal: "yes", simples: "no", presumido: "yes" }
};

export interface CreditResult {
  status: CreditStatus;
  creditavel: boolean;
  credito: number;
}

/**
 * Calcula o crédito tributário conforme a destinação da mercadoria e o regime
 * tributário do comprador. Valores de IBS e CBS são utilizados como base para o
 * cálculo do crédito potencial.
 */
export function computeCredit(
  destino: string,
  regime: string,
  preco: number,
  ibs: number,
  cbs: number
): CreditResult {
  const destinoKey = destino.toUpperCase();
  const regimeKey = regime.toLowerCase();
  const status: CreditStatus =
    creditRules[destinoKey]?.[regimeKey] ?? "no";

  const baseRate = (ibs + cbs) / 100;
  let credito = 0;
  if (status === "yes") {
    credito = preco * baseRate;
  } else if (status === "limited") {
    // crédito limitado assume 50% do potencial
    credito = preco * baseRate * 0.5;
  }

  return {
    status,
    creditavel: status !== "no",
    credito: Number(credito.toFixed(2))
  };
}

