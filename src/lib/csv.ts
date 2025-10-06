import type { Supplier, Produto } from "@/types/domain";
import { generateId } from "@/lib/utils";

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

export const produtoCsvHeaders = [
  "descricao",
  "ncm",
  "refeicao",
  "cesta",
  "reducao",
  "is",
] as const;

function detectDelimiter(sample: string): string {
  const comma = (sample.match(/,/g) ?? []).length;
  const semicolon = (sample.match(/;/g) ?? []).length;
  return semicolon > comma ? ";" : ",";
}

function stripQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }
  return trimmed;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      result.push(stripQuotes(current));
      current = "";
      continue;
    }

    current += char;
  }

  result.push(stripQuotes(current));
  return result;
}

function parseCsvRows(csv: string): string[][] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return [];
  }

  const delimiter = detectDelimiter(lines[0]);
  return lines.map((line) => splitCsvLine(line, delimiter));
}

function parseNumber(value: string): number {
  if (!value) {
    return 0;
  }
  const sanitized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function readFornecedoresCSV(csv: string): Supplier[] {
  const rows = parseCsvRows(csv);
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.toLowerCase());
  const dataRows = rows.slice(1);

  const indexFor = (name: string, fallback: number) => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? idx : fallback;
  };

  const idxNome = indexFor("nome", 0);
  const idxTipo = indexFor("tipo", 1);
  const idxRegime = indexFor("regime", 2);
  const idxPreco = indexFor("preco", 3);
  const idxIbs = indexFor("ibs", 4);
  const idxCbs = indexFor("cbs", 5);
  const idxIs = indexFor("is", 6);
  const idxFrete = indexFor("frete", 7);

  const fornecedores: Supplier[] = [];

  for (const cols of dataRows) {
    const nome = cols[idxNome]?.trim() ?? "";
    if (!nome) {
      continue;
    }

    fornecedores.push({
      id: generateId("fornecedor"),
      nome,
      tipo: cols[idxTipo]?.trim() ?? "",
      regime: cols[idxRegime]?.trim() ?? "",
      preco: parseNumber(cols[idxPreco]),
      ibs: parseNumber(cols[idxIbs]),
      cbs: parseNumber(cols[idxCbs]),
      is: parseNumber(cols[idxIs]),
      frete: parseNumber(cols[idxFrete]),
    });
  }

  return fornecedores;
}

export function readProdutosCSV(csv: string): Produto[] {
  const rows = parseCsvRows(csv);
  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0].map((header) => header.toLowerCase());
  const dataRows = rows.slice(1);

  const indexFor = (name: string, fallback: number) => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? idx : fallback;
  };

  const idxDescricao = indexFor("descricao", 0);
  const idxNcm = indexFor("ncm", 1);
  const idxRefeicao = indexFor("refeicao", 2);
  const idxCesta = indexFor("cesta", 3);
  const idxReducao = indexFor("reducao", 4);
  const idxIs = indexFor("is", 5);

  const produtos: Produto[] = [];

  for (const cols of dataRows) {
    const descricao = cols[idxDescricao]?.trim();
    const ncm = cols[idxNcm]?.trim();
    if (!descricao || !ncm) {
      continue;
    }

    produtos.push({
      id: generateId("prod"),
      descricao,
      ncm,
      flags: {
        refeicao: cols[idxRefeicao]?.trim() === "1",
        cesta: cols[idxCesta]?.trim() === "1",
        reducao: cols[idxReducao]?.trim() === "1",
        is: cols[idxIs]?.trim() === "1",
      },
    });
  }

  return produtos;
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
