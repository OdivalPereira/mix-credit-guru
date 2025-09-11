import type { Supplier } from "@/types/domain";

export const fornecedorCsvHeaders = [
  "nome",
  "tipo",
  "regime",
  "preco",
  "ibs",
  "cbs",
  "is",
  "frete",
] as const;

export function readFornecedoresCSV(csv: string): Supplier[] {
  const lines = csv.trim().split(/\r?\n/);
  const [, ...rows] = lines;
  return rows.filter(Boolean).map((row) => {
    const cols = row.split(",");
    return {
      id: crypto.randomUUID(),
      nome: cols[0]?.trim() ?? "",
      tipo: cols[1]?.trim() ?? "",
      regime: cols[2]?.trim() ?? "",
      preco: parseFloat(cols[3]) || 0,
      ibs: parseFloat(cols[4]) || 0,
      cbs: parseFloat(cols[5]) || 0,
      is: parseFloat(cols[6]) || 0,
      frete: parseFloat(cols[7]) || 0,
    };
  });
}

export function writeFornecedoresCSV(fornecedores: Supplier[]): string {
  const header = fornecedorCsvHeaders.join(",");
  const rows = fornecedores.map((f) =>
    [
      f.nome,
      f.tipo,
      f.regime,
      f.preco,
      f.ibs,
      f.cbs,
      f.is,
      f.frete,
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

