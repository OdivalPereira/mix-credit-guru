import type { CreditStatus } from "@/types/domain";
import { memoize } from "./memoize";

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
interface CreditOptions {
  isRefeicaoPronta?: boolean;
  scenario?: string;
}

const computeCreditInternal = (
  destino: string,
  regime: string,
  preco: number,
  ibs: number,
  cbs: number,
  options: CreditOptions = {}
): CreditResult => {
  const { isRefeicaoPronta = false, scenario } = options;

  if (isRefeicaoPronta) {
    return { status: "no", creditavel: false, credito: 0 };
  }

  const destinoKey = destino.toUpperCase();
  const regimeKey = regime.toLowerCase();
  let status: CreditStatus = creditRules[destinoKey]?.[regimeKey] ?? "no";

  const baseRate = (ibs + cbs) / 100;
  let credito = 0;
  if (status === "yes") {
    credito = preco * baseRate;
  } else if (status === "limited") {
    // crédito limitado assume 50% do potencial
    credito = preco * baseRate * 0.5;
  }

  if (scenario === "negative") {
    status = "no";
    credito = 0;
  } else if (scenario === "positive") {
    credito *= 1.1; // bônus simples para cenários positivos
  }

  return {
    status,
    creditavel: status !== "no",
    credito: Number(credito.toFixed(2))
  };
};

export const computeCredit = memoize(computeCreditInternal, {
  getKey: (destino, regime, preco, ibs, cbs, options = {}) =>
    JSON.stringify({ destino, regime, preco, ibs, cbs, options }),
  maxSize: 200,
});

