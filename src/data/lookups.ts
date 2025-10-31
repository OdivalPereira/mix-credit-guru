import type { SupplierRegime, SupplierTipo, Unit, DestinoTipo } from "@/types/domain";

export type LookupOption<T extends string> = Readonly<{
  value: T;
  label: string;
  description?: string;
}>;

export const UNIT_OPTIONS: ReadonlyArray<Unit> = ["un", "kg", "g", "l", "ml", "ton"] as const;

export const UNIT_LABELS: Readonly<Record<Unit, string>> = Object.freeze({
  un: "UN",
  kg: "KG",
  g: "G",
  l: "L",
  ml: "ML",
  ton: "TON",
});

export const SUPPLIER_TIPO_OPTIONS: ReadonlyArray<LookupOption<SupplierTipo>> = [
  { value: "industria", label: "Indústria" },
  { value: "distribuidor", label: "Distribuidor" },
  { value: "produtor", label: "Produtor" },
  { value: "atacado", label: "Atacado" },
  { value: "varejo", label: "Varejo" },
] as const;

export const SUPPLIER_TIPO_LABELS: Readonly<Record<SupplierTipo, string>> = SUPPLIER_TIPO_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<SupplierTipo, string>,
);

export const REGIME_OPTIONS: ReadonlyArray<LookupOption<SupplierRegime>> = [
  { value: "normal", label: "Regime Normal" },
  { value: "simples", label: "Simples Nacional" },
  { value: "presumido", label: "Lucro Presumido" },
] as const;

export const REGIME_LABELS: Readonly<Record<SupplierRegime, string>> = REGIME_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<SupplierRegime, string>,
);

export const DESTINO_OPTIONS: ReadonlyArray<LookupOption<DestinoTipo>> = [
  {
    value: "A",
    label: "Refeição / Benefícios",
    description: "Fornecimento destinado a programas de alimentação ou refeições corporativas.",
  },
  {
    value: "B",
    label: "Revenda",
    description: "Mercadorias destinadas à revenda direta sem transformação.",
  },
  {
    value: "C",
    label: "Uso e Consumo",
    description: "Bens para uso próprio da empresa (ex.: materiais de escritório).",
  },
  {
    value: "D",
    label: "Ativo Imobilizado",
    description: "Aquisições que serão incorporadas ao ativo imobilizado.",
  },
  {
    value: "E",
    label: "Produção / Comercialização",
    description: "Matérias-primas ou insumos utilizados em processos produtivos.",
  },
] as const;

export const DESTINO_LABELS: Readonly<Record<DestinoTipo, string>> = DESTINO_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<DestinoTipo, string>,
);
