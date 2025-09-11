import type { AliquotasConfig, FlagsItem } from "@/types/domain";
import baseAliquotas from "@/data/rules/aliquotas.json";
import overridesUF from "@/data/rules/overrides_uf.json";

/**
 * Computes tax rates for a given scenario, UF and item flags.
 * Base rates are loaded from the aliquotas rules file and may be overridden
 * by state specific overrides or reduction flags.
 */
export function computeRates(
  scenario: string,
  uf: string,
  flagsItem: FlagsItem = {}
): AliquotasConfig {
  const aliquotasMap = baseAliquotas as Record<string, AliquotasConfig>;
  const base = aliquotasMap[scenario] ?? aliquotasMap.default;

  // Start with base rates for the scenario
  const rates: AliquotasConfig = { ...base };

  // Apply state overrides if available and the item has an NCM code
  const override = (overridesUF as Record<string, Record<string, AliquotasConfig>>)[uf]?.[
    flagsItem.ncm ?? ""
  ];
  if (override) {
    Object.assign(rates, override);
  }

  // Apply reduction if the item is flagged for it
  if (flagsItem.reducao) {
    const reducao = aliquotasMap.reducao;
    if (reducao) {
      Object.assign(rates, reducao);
    }
  }

  return rates;
}
