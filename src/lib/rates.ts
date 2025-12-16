import type { AliquotasConfig, FlagsItem } from "@/types/domain";
import baseAliquotas from "@/data/rules/aliquotas.json";
import overridesUF from "@/data/rules/overrides_uf.json";

const WILDCARD_SCENARIO = "*";

type DateInput = string | Date;

interface RateRule {
  rates: Partial<AliquotasConfig>;
  validFrom?: string;
  validTo?: string;
  scenarios?: string[];
}

type ScenarioRules = Record<string, RateRule[]>;

interface RateSource {
  global?: ScenarioRules;
  ncm?: Record<string, ScenarioRules>;
  items?: Record<string, ScenarioRules>;
  municipios?: Record<string, RateSource>;
}

interface RateLookupContext {
  scenario: string;
  date: Date;
  ncm?: string;
  itemId?: string;
}

export interface ComputeRatesContext {
  uf: string;
  municipio?: string;
  itemId?: string;
  flagsItem?: FlagsItem;
}

import type { HydrationRule } from "@/services/HydrationService";

let baseSource = normalizeSource(baseAliquotas);
let overridesByUF = mapRecord(overridesUF as Record<string, unknown>, normalizeSource);

/**
 * Updates the internal rules engine with data fetched from the backend.
 */
export function hydrateRules(rules: HydrationRule[]) {
  if (!rules || rules.length === 0) return;

  const newSource: RateSource = {
    global: {},
    ncm: {},
    items: {},
    municipios: {},
  };

  // Helper to check if value is a wildcard (null, undefined, or '*')
  const isWildcard = (val?: string | null) => !val || val === '*';

  // Helper to get or create nested structure
  const getScenarioRules = (target: Record<string, ScenarioRules>, key: string) => {
    if (!target[key]) target[key] = {};
    return target[key];
  };

  for (const r of rules) {
    const rule: RateRule = {
      rates: r.rates,
      validFrom: r.validFrom,
      validTo: r.validTo,
      scenarios: [r.scenario]
    };

    const ncmIsWildcard = isWildcard(r.ncm);
    const ufIsWildcard = isWildcard(r.uf);

    // Global rule (both NCM and UF are wildcards)
    if (ncmIsWildcard && ufIsWildcard) {
      if (!newSource.global![r.scenario]) newSource.global![r.scenario] = [];
      newSource.global![r.scenario].push(rule);
      continue;
    }

    // NCM Specific (UF is wildcard = federal rule)
    if (!ncmIsWildcard && ufIsWildcard) {
      const ncmRules = getScenarioRules(newSource.ncm!, r.ncm!);
      if (!ncmRules[r.scenario]) ncmRules[r.scenario] = [];
      ncmRules[r.scenario].push(rule);
      continue;
    }

    // UF Specific (NCM is wildcard) - future implementation
    if (ncmIsWildcard && !ufIsWildcard) {
      continue;
    }

    // NCM + UF Specific (most specific)
    if (!ncmIsWildcard && !ufIsWildcard) {
      const ncmRules = getScenarioRules(newSource.ncm!, r.ncm!);
      if (!ncmRules[r.scenario]) ncmRules[r.scenario] = [];
      ncmRules[r.scenario].push(rule);
    }
  }

  // Update the singleton
  if (Object.keys(newSource.global || {}).length > 0 || Object.keys(newSource.ncm || {}).length > 0) {
    console.log("[Rates] Applying hydrated rules:", {
      globalScenarios: Object.keys(newSource.global || {}),
      ncmKeys: Object.keys(newSource.ncm || {})
    });

    if (newSource.global) {
      baseSource.global = { ...baseSource.global, ...newSource.global };
    }
    if (newSource.ncm) {
      baseSource.ncm = { ...baseSource.ncm, ...newSource.ncm };
    }
    if (newSource.items) {
      baseSource.items = { ...baseSource.items, ...newSource.items };
    }
  }
}


/**
 * @description Calcula as alíquotas de imposto (IBS, CBS, IS) com base no cenário, data e contexto fornecidos.
 * @param scenario O cenário tributário a ser usado para o cálculo.
 * @param dateInput A data para a qual as alíquotas devem ser calculadas.
 * @param ctx O contexto para o cálculo das alíquotas, incluindo UF, município e informações do item.
 * @returns Um objeto contendo as alíquotas de IBS, CBS e IS calculadas.
 */
export function computeRates(
  scenario: string,
  dateInput: DateInput,
  ctx: ComputeRatesContext,
): AliquotasConfig {
  const date = coerceDate(dateInput);
  const lookup: RateLookupContext = {
    scenario,
    date,
    ncm: ctx.flagsItem?.ncm,
    itemId: ctx.itemId,
  };

  const result: AliquotasConfig = { ibs: 0, cbs: 0, is: 0 };

  applyScenarioLayers(result, baseSource.global, "default", lookup);
  if (scenario !== "default") {
    applyScenarioLayers(result, baseSource.global, scenario, lookup, {
      includeDefaultFallback: false,
    });
  }

  applyHierarchy(result, baseSource, lookup, { includeGlobal: false });
  applyMunicipalHierarchy(result, baseSource, lookup, ctx.municipio);

  const stateOverrides = overridesByUF[ctx.uf];
  applyHierarchy(result, stateOverrides, lookup);
  if (stateOverrides) {
    applyMunicipalHierarchy(result, stateOverrides, lookup, ctx.municipio);
  }

  if (ctx.flagsItem?.reducao) {
    applyScenarioLayers(result, baseSource.global, "reducao", lookup, {
      includeDefaultFallback: false,
    });
  }

  return result;
}

function coerceDate(input: DateInput): Date {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function applyMunicipalHierarchy(
  target: AliquotasConfig,
  source: RateSource | undefined,
  ctx: RateLookupContext,
  municipio?: string,
) {
  if (!source || !municipio) {
    return;
  }
  const municipal = source.municipios?.[municipio];
  if (!municipal) {
    return;
  }
  applyHierarchy(target, municipal, ctx);
}

function applyHierarchy(
  target: AliquotasConfig,
  source: RateSource | undefined,
  ctx: RateLookupContext,
  options: { includeGlobal?: boolean } = {},
) {
  if (!source) {
    return;
  }
  const includeGlobal = options.includeGlobal ?? true;
  if (includeGlobal) {
    applyScenarioLayers(target, source.global, ctx.scenario, ctx, {
      includeDefaultFallback: true,
    });
  }
  if (ctx.ncm) {
    const rules = findScenarioRules(source.ncm, ctx.ncm);
    applyScenarioLayers(target, rules, ctx.scenario, ctx);
  }
  if (ctx.itemId) {
    const rules = findScenarioRules(source.items, ctx.itemId);
    applyScenarioLayers(target, rules, ctx.scenario, ctx);
  }
}

function applyScenarioLayers(
  target: AliquotasConfig,
  rulesMap: ScenarioRules | undefined,
  scenario: string,
  ctx: RateLookupContext,
  options: { includeDefaultFallback?: boolean } = {},
) {
  if (!rulesMap) {
    return;
  }
  const includeDefaultFallback = options.includeDefaultFallback ?? true;
  if (includeDefaultFallback && scenario !== "default") {
    const baseRule = pickActiveRule(rulesMap.default ?? [], ctx, scenario);
    if (baseRule) {
      Object.assign(target, baseRule.rates);
    }
  }

  const wildcardRule = pickActiveRule(rulesMap[WILDCARD_SCENARIO] ?? [], ctx, scenario);
  if (wildcardRule) {
    Object.assign(target, wildcardRule.rates);
  }

  const specificRule = pickActiveRule(rulesMap[scenario] ?? [], ctx, scenario);
  if (specificRule) {
    Object.assign(target, specificRule.rates);
  } else if (scenario === "default" && includeDefaultFallback) {
    const fallback = pickActiveRule(rulesMap.default ?? [], ctx, scenario);
    if (fallback) {
      Object.assign(target, fallback.rates);
    }
  }
}

function pickActiveRule(
  rules: RateRule[],
  ctx: RateLookupContext,
  scenario: string,
): RateRule | undefined {
  let selected: RateRule | undefined;
  for (const rule of rules) {
    if (!isRuleActive(rule, ctx.date, scenario)) {
      continue;
    }
    if (!selected || compareRuleStart(rule, selected) >= 0) {
      selected = rule;
    }
  }
  return selected;
}

function compareRuleStart(a: RateRule, b: RateRule): number {
  const aStart = a.validFrom ? Date.parse(a.validFrom) : Number.NEGATIVE_INFINITY;
  const bStart = b.validFrom ? Date.parse(b.validFrom) : Number.NEGATIVE_INFINITY;
  if (aStart === bStart) {
    const aEnd = a.validTo ? Date.parse(a.validTo) : Number.POSITIVE_INFINITY;
    const bEnd = b.validTo ? Date.parse(b.validTo) : Number.POSITIVE_INFINITY;
    return aEnd - bEnd;
  }
  return aStart - bStart;
}

function isRuleActive(rule: RateRule, date: Date, scenario: string): boolean {
  if (rule.scenarios && rule.scenarios.length && !rule.scenarios.includes(scenario)) {
    return false;
  }
  if (rule.validFrom && date < new Date(rule.validFrom)) {
    return false;
  }
  if (rule.validTo && date > new Date(rule.validTo)) {
    return false;
  }
  return true;
}

function findScenarioRules(
  collection: Record<string, ScenarioRules> | undefined,
  key: string,
): ScenarioRules | undefined {
  if (!collection) {
    return undefined;
  }
  const direct = collection[key];
  if (direct) {
    return direct;
  }
  const upperKey = typeof key === "string" ? key.toUpperCase() : key;
  if (upperKey !== key) {
    const upper = collection[upperKey];
    if (upper) {
      return upper;
    }
  }
  return collection["*"];
}

function normalizeSource(raw: unknown): RateSource {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const obj = raw as Record<string, unknown>;
  const source: RateSource = {};

  if ("global" in obj || "ncm" in obj || "items" in obj || "municipios" in obj) {
    if ("global" in obj) {
      source.global = normalizeScenarioRules(obj.global);
    }
    if ("ncm" in obj) {
      source.ncm = normalizeNested(obj.ncm);
    }
    if ("items" in obj) {
      source.items = normalizeNested(obj.items);
    }
    if ("municipios" in obj && obj.municipios && typeof obj.municipios === "object") {
      source.municipios = mapRecord(obj.municipios as Record<string, unknown>, normalizeSource);
    }
    return source;
  }

  if (looksLikeNcmMap(obj)) {
    source.ncm = normalizeNested(obj);
    return source;
  }

  const scenarioRules = normalizeScenarioRules(obj);
  if (Object.keys(scenarioRules).length) {
    source.global = scenarioRules;
  }

  return source;
}

function normalizeNested(raw: unknown): Record<string, ScenarioRules> | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const result: Record<string, ScenarioRules> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const rules = normalizeScenarioRules(value);
    if (Object.keys(rules).length) {
      result[key] = rules;
    }
  }
  return Object.keys(result).length ? result : undefined;
}

function normalizeScenarioRules(raw: unknown): ScenarioRules {
  const result: ScenarioRules = {};
  if (!raw) {
    return result;
  }

  if (Array.isArray(raw)) {
    const rules = raw.map(normalizeRule).filter(Boolean) as RateRule[];
    if (rules.length) {
      result[WILDCARD_SCENARIO] = rules;
    }
    return result;
  }

  if (typeof raw !== "object") {
    return result;
  }

  if (isRuleLike(raw)) {
    const rule = normalizeRule(raw);
    if (rule) {
      result[WILDCARD_SCENARIO] = [rule];
    }
    return result;
  }

  for (const [scenario, value] of Object.entries(raw as Record<string, unknown>)) {
    const normalized = Array.isArray(value)
      ? (value.map(normalizeRule).filter(Boolean) as RateRule[])
      : (() => {
        const rule = normalizeRule(value);
        return rule ? [rule] : [];
      })();
    if (normalized.length) {
      result[scenario] = normalized;
    }
  }

  return result;
}

function normalizeRule(raw: unknown): RateRule | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const obj = raw as Record<string, unknown>;
  const ratesSource = (obj.rates && typeof obj.rates === "object") ? obj.rates : obj;
  const rates: Partial<AliquotasConfig> = {};
  for (const key of ["ibs", "cbs", "is"] as const) {
    const value = (ratesSource as Record<string, unknown>)[key];
    if (typeof value === "number") {
      rates[key] = value;
    }
  }
  if (Object.keys(rates).length === 0) {
    return null;
  }
  const rule: RateRule = { rates };
  if (typeof obj.validFrom === "string") {
    rule.validFrom = obj.validFrom;
  }
  if (typeof obj.validTo === "string") {
    rule.validTo = obj.validTo;
  }
  if (Array.isArray(obj.scenarios)) {
    rule.scenarios = obj.scenarios.filter((s): s is string => typeof s === "string");
  } else if (typeof obj.scenario === "string") {
    rule.scenarios = [obj.scenario];
  }
  return rule;
}

function looksLikeNcmMap(obj: Record<string, unknown>): boolean {
  const entries = Object.entries(obj);
  if (entries.length === 0) {
    return false;
  }
  return entries.every(([key, value]) =>
    /\d/.test(key) &&
    (Array.isArray(value) || isRuleLike(value) || looksLikeAliquotas(value)),
  );
}

function isRuleLike(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    "validFrom" in obj ||
    "validTo" in obj ||
    "rates" in obj ||
    looksLikeAliquotas(obj)
  );
}

function looksLikeAliquotas(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return ("ibs" in obj || "cbs" in obj || "is" in obj);
}

function mapRecord<T>(
  record: Record<string, unknown>,
  mapper: (value: unknown) => T,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, mapper(value)]),
  );
}
