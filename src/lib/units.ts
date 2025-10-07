import { z } from "zod";
import type { Unit, UnitConv, YieldConfig } from "@/types/domain";

const UnitEnum = z.enum(["un", "kg", "g", "l", "ml", "ton"]);

const ConvSchema = z.object({
  de: UnitEnum,
  para: UnitEnum,
  fator: z.number().positive(),
});

const YieldSchema = z.object({
  produtoId: z.string().trim().min(1).optional(),
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

  // Type assertion to ensure TypeScript understands the parsed types
  const validConversions = conversions as UnitConv[];
  const validYield = y as YieldConfig | undefined;

  let qty = pack.reduce((acc, n) => acc * n, 1);

  if (validYield) {
    const toEntrada = findFactor(from, validYield.entrada, validConversions);
    if (toEntrada === null) throw new Error("Conversao invalida");
    qty *= toEntrada;

    const entradaToSaida = findFactor(validYield.entrada, validYield.saida, validConversions);
    if (entradaToSaida === null) throw new Error("Conversao invalida");
    qty = qty * (validYield.rendimento / 100) * entradaToSaida;

    const saidaToTarget = findFactor(validYield.saida, to, validConversions);
    if (saidaToTarget === null) throw new Error("Conversao invalida");
    qty *= saidaToTarget;
  } else {
    const factor = findFactor(from, to, validConversions);
    if (factor === null) throw new Error("Conversao invalida");
    qty *= factor;
  }

  return p / qty;
}

