import type { CreditStatus, DestinoTipo, SupplierRegime } from "@/types/domain";
import { DESTINO_OPTIONS, REGIME_OPTIONS } from "@/data/lookups";
import { memoize } from "./memoize";

// Regras simplificadas de creditabilidade por destinacao e regime tributario
const creditRules: Partial<Record<DestinoTipo, Partial<Record<SupplierRegime, CreditStatus>>>> = {
  A: { normal: "yes", simples: "no", presumido: "limited" },
  B: { normal: "yes", simples: "no", presumido: "yes" },
};

const validDestinos = new Set<DestinoTipo>(DESTINO_OPTIONS.map((option) => option.value));
const validRegimes = new Set<SupplierRegime>(REGIME_OPTIONS.map((option) => option.value));

export interface CreditResult {
  status: CreditStatus;
  creditavel: boolean;
  credito: number;
}

/**
 * @description Calcula o crédito tributário com base na destinação do item, regime do fornecedor, preço e alíquotas de impostos.
 * @param destino A destinação do item (por exemplo, revenda, industrialização).
 * @param regime O regime tributário do fornecedor (por exemplo, normal, simples).
 * @param preco O preço do item.
 * @param ibs A alíquota do IBS.
 * @param cbs A alíquota do CBS.
 * @param options Opções adicionais, como `isRefeicaoPronta` e `scenario`.
 * @returns Um objeto contendo o status, a elegibilidade e o valor do crédito.
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

  const destinoKey = destino.toUpperCase() as DestinoTipo;
  const regimeKey = regime.toLowerCase() as SupplierRegime;
  const normalizedDestino = validDestinos.has(destinoKey) ? destinoKey : undefined;
  const normalizedRegime = validRegimes.has(regimeKey) ? regimeKey : undefined;
  let status: CreditStatus =
    (normalizedDestino && normalizedRegime
      ? creditRules[normalizedDestino]?.[normalizedRegime]
      : undefined) ?? "no";

  const baseRate = (ibs + cbs) / 100;
  let credito = 0;
  if (status === "yes") {
    credito = preco * baseRate;
  } else if (status === "limited") {
    // credito limitado assume 50% do potencial
    credito = preco * baseRate * 0.5;
  }

  if (scenario === "negative") {
    status = "no";
    credito = 0;
  } else if (scenario === "positive") {
    credito *= 1.1; // bonus simples para cenarios positivos
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

