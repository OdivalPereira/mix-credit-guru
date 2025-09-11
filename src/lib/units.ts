import { z } from "zod";
import type { Unit, UnitConv, YieldConfig } from "@/types/domain";

const UnitEnum = z.enum(["un", "kg", "g", "l", "ml", "ton"]);

const ConvSchema = z.object({
  de: UnitEnum,
  para: UnitEnum,
  fator: z.number().positive(),
});

const YieldSchema = z.object({
  entrada: UnitEnum,
  saida: UnitEnum,
  rendimento: z.number().positive().max(100),
});

const NormalizeSchema = z.object({
  preco: z.number().positive(),
  packInfo: z.array(z.number().positive()).default([]),
  fromUnit: UnitEnum,
  toUnit: UnitEnum,
  convs: z.array(ConvSchema),
  yieldCfg: YieldSchema.optional(),
});

function findFactor(
  from: Unit,
  to: Unit,
  convs: UnitConv[],
  visited: Set<Unit> = new Set()
): number | null {
  if (from === to) return 1;
  visited.add(from);
  for (const conv of convs) {
    if (conv.de === from && !visited.has(conv.para)) {
      const res = findFactor(conv.para, to, convs, visited);
      if (res !== null) return conv.fator * res;
    }
    if (conv.para === from && !visited.has(conv.de)) {
      const res = findFactor(conv.de, to, convs, visited);
      if (res !== null) return res / conv.fator;
    }
  }
  return null;
}

export function normalizeOffer(
  preco: number,
  packInfo: number[],
  fromUnit: Unit,
  toUnit: Unit,
  convs: UnitConv[],
  yieldCfg?: YieldConfig
): number {
  const {
    preco: p,
    packInfo: pack,
    fromUnit: from,
    toUnit: to,
    convs: conversions,
    yieldCfg: y,
  } = NormalizeSchema.parse({ preco, packInfo, fromUnit, toUnit, convs, yieldCfg });

  let qty = pack.reduce((acc, n) => acc * n, 1);

  if (y) {
    const toEntrada = findFactor(from, y.entrada, conversions);
    if (toEntrada === null) throw new Error("Conversão inválida");
    qty *= toEntrada;

    const entradaToSaida = findFactor(y.entrada, y.saida, conversions);
    if (entradaToSaida === null) throw new Error("Conversão inválida");
    qty = qty * (y.rendimento / 100) * entradaToSaida;

    const saidaToTarget = findFactor(y.saida, to, conversions);
    if (saidaToTarget === null) throw new Error("Conversão inválida");
    qty *= saidaToTarget;
  } else {
    const factor = findFactor(from, to, conversions);
    if (factor === null) throw new Error("Conversão inválida");
    qty *= factor;
  }

  return p / qty;
}

