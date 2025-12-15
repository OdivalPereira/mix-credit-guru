import type { Supplier, Produto, Unit, SupplierTipo, SupplierRegime, Fornecedor, OfertaFornecedor } from "@/types/domain";
import { generateId } from "@/lib/utils";
import { UNIT_OPTIONS, SUPPLIER_TIPO_OPTIONS, REGIME_OPTIONS } from "@/data/lookups";

/** @deprecated Use fornecedorCadastroCsvHeaders + ofertaCsvHeaders */
export const fornecedorCsvHeaders = [
  "nome",
  "tipo",
  "regime",
  "preco",
  "ibs",
  "cbs",
  "is",
  "frete",
  "cnpj",
  "uf",
  "municipio",
  "produto_id",
  "produto_descricao",
  "unidade",
  "pedido_minimo",
  "prazo_entrega",
  "prazo_pagamento",
  "ativo",
  "flag_cesta",
  "flag_reducao",
  "refeicao_pronta",
  "cadeia_1",
  "cadeia_2",
  "cadeia_3",
  "cadeia_4",
] as const;

/** Headers para CSV de dados cadastrais de Fornecedor */
export const fornecedorCadastroCsvHeaders = [
  "id",
  "nome",
  "cnpj",
  "tipo",
  "regime",
  "uf",
  "municipio",
  "contato_nome",
  "contato_email",
  "contato_telefone",
  "ativo",
] as const;

/** Headers para CSV de OfertaFornecedor */
export const ofertaCsvHeaders = [
  "id",
  "fornecedor_id",
  "produto_id",
  "produto_descricao",
  "unidade",
  "preco",
  "ibs",
  "cbs",
  "is",
  "frete",
  "pedido_minimo",
  "prazo_entrega",
  "prazo_pagamento",
  "flag_cesta",
  "flag_reducao",
  "refeicao_pronta",
  "ativa",
  "cadeia_1",
  "cadeia_2",
  "cadeia_3",
  "cadeia_4",
] as const;

export const produtoCsvHeaders = [
  "descricao",
  "ncm",
  "unidade",
  "categoria",
  "cest",
  "codigo_interno",
  "ativo",
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

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "sim", "ativo", "yes"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "nao", "inativo", "no"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function formatCsvValue(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return "";
  }
  const str = typeof value === "number" ? String(value) : value;
  if (str === "") {
    return "";
  }
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const unidadesValidas = new Set<Unit>(UNIT_OPTIONS);
const supplierTipoValues = new Set<SupplierTipo>(
  SUPPLIER_TIPO_OPTIONS.map((option) => option.value),
);
const regimeValues = new Set<SupplierRegime>(
  REGIME_OPTIONS.map((option) => option.value),
);

function normalizeUnit(value: string | undefined): Unit | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return unidadesValidas.has(normalized as Unit)
    ? (normalized as Unit)
    : undefined;
}

function normalizeSupplierTipo(value: string | undefined): SupplierTipo {
  const normalized = (value ?? "").trim().toLowerCase();
  if (supplierTipoValues.has(normalized as SupplierTipo)) {
    return normalized as SupplierTipo;
  }
  switch (normalized) {
    case "industrial":
    case "fabricante":
    case "importador":
      return "industria";
    case "atacadista":
      return "atacado";
    default:
      return "distribuidor";
  }
}

function normalizeSupplierRegime(value: string | undefined): SupplierRegime {
  const normalized = (value ?? "").trim().toLowerCase();
  if (regimeValues.has(normalized as SupplierRegime)) {
    return normalized as SupplierRegime;
  }
  switch (normalized) {
    case "lucro-real":
    case "real":
      return "normal";
    case "lucro-presumido":
    case "presumido":
      return "presumido";
    default:
      return "simples";
  }
}

/**
 * @description Analisa uma string CSV contendo dados de fornecedores e a converte em uma matriz de objetos de Fornecedor.
 * @param csv A string CSV a ser analisada.
 * @returns Uma matriz de objetos de Fornecedor.
 */
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
  const idxCnpj = indexFor("cnpj", -1);
  const idxUf = indexFor("uf", -1);
  const idxMunicipio = indexFor("municipio", -1);
  const idxProdutoId = indexFor("produto_id", -1);
  const idxProdutoDescricao = indexFor("produto_descricao", -1);
  const idxUnidade = indexFor("unidade", -1);
  const idxPedidoMinimo = indexFor("pedido_minimo", -1);
  const idxPrazoEntrega = indexFor("prazo_entrega", -1);
  const idxPrazoPagamento = indexFor("prazo_pagamento", -1);
  const idxAtivo = indexFor("ativo", -1);
  const idxFlagCesta = indexFor("flag_cesta", -1);
  const idxFlagReducao = indexFor("flag_reducao", -1);
  const idxRefPronta = indexFor("refeicao_pronta", -1);
  const idxCadeia1 = indexFor("cadeia_1", -1);
  const idxCadeia2 = indexFor("cadeia_2", -1);
  const idxCadeia3 = indexFor("cadeia_3", -1);
  const idxCadeia4 = indexFor("cadeia_4", -1);

  const fornecedores: Supplier[] = [];

  for (const cols of dataRows) {
    const nome = cols[idxNome]?.trim() ?? "";
    if (!nome) {
      continue;
    }

    const tipo = normalizeSupplierTipo(cols[idxTipo]);
    const regime = normalizeSupplierRegime(cols[idxRegime]);
    const uf = idxUf >= 0 ? cols[idxUf]?.trim().toUpperCase() ?? "" : "";
    const municipio = idxMunicipio >= 0 ? cols[idxMunicipio]?.trim() ?? "" : undefined;
    const unidade = normalizeUnit(idxUnidade >= 0 ? cols[idxUnidade]?.trim() : undefined);
    const pedidoMinimo = idxPedidoMinimo >= 0 ? parseNumber(cols[idxPedidoMinimo]) : 0;
    const prazoEntregaDias =
      idxPrazoEntrega >= 0 ? Math.max(0, Math.trunc(parseNumber(cols[idxPrazoEntrega]))) : 0;
    const prazoPagamentoDias =
      idxPrazoPagamento >= 0 ? Math.max(0, Math.trunc(parseNumber(cols[idxPrazoPagamento]))) : 0;
    const ativo = idxAtivo >= 0 ? parseBoolean(cols[idxAtivo], true) : true;

    const flagsItem: Supplier["flagsItem"] = {};
    if (idxFlagCesta >= 0) {
      flagsItem.cesta = parseBoolean(cols[idxFlagCesta], false);
    }
    if (idxFlagReducao >= 0) {
      flagsItem.reducao = parseBoolean(cols[idxFlagReducao], false);
    }
    if (idxProdutoId >= 0) {
      const ncmValue = cols[idxProdutoId]?.trim();
      if (ncmValue) {
        flagsItem.ncm = ncmValue;
      }
    }
    const hasFlags = Object.keys(flagsItem).length > 0;

    const cadeiaRaw = [
      idxCadeia1 >= 0 ? cols[idxCadeia1]?.trim() ?? "" : "",
      idxCadeia2 >= 0 ? cols[idxCadeia2]?.trim() ?? "" : "",
      idxCadeia3 >= 0 ? cols[idxCadeia3]?.trim() ?? "" : "",
      idxCadeia4 >= 0 ? cols[idxCadeia4]?.trim() ?? "" : "",
    ];
    const cadeia = cadeiaRaw.every((value) => value.length === 0)
      ? []
      : cadeiaRaw;

    fornecedores.push({
      id: generateId("fornecedor"),
      nome,
      cnpj: idxCnpj >= 0 ? cols[idxCnpj]?.trim() ?? "" : undefined,
      tipo,
      regime,
      uf,
      municipio,
      ativo,
      produtoId: idxProdutoId >= 0 ? cols[idxProdutoId]?.trim() ?? "" : undefined,
      produtoDescricao: idxProdutoDescricao >= 0 ? cols[idxProdutoDescricao]?.trim() ?? "" : undefined,
      unidadeNegociada: unidade,
      pedidoMinimo,
      prazoEntregaDias,
      prazoPagamentoDias,
      preco: parseNumber(cols[idxPreco]),
      ibs: parseNumber(cols[idxIbs]),
      cbs: parseNumber(cols[idxCbs]),
      is: parseNumber(cols[idxIs]),
      frete: parseNumber(cols[idxFrete]),
      isRefeicaoPronta:
        idxRefPronta >= 0 ? parseBoolean(cols[idxRefPronta], false) : false,
      flagsItem: hasFlags ? flagsItem : undefined,
      cadeia,
    });
  }

  return fornecedores;
}

/**
 * @description Analisa uma string CSV contendo dados de produtos e a converte em uma matriz de objetos de Produto.
 * @param csv A string CSV a ser analisada.
 * @returns Uma matriz de objetos de Produto.
 */
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
  const idxUnidade = indexFor("unidade", 2);
  const idxCategoria = indexFor("categoria", 3);
  const idxCest = indexFor("cest", 4);
  const idxCodigoInterno = indexFor("codigo_interno", 5);
  const idxAtivo = indexFor("ativo", 6);
  const idxRefeicao = indexFor("refeicao", 7);
  const idxCesta = indexFor("cesta", 8);
  const idxReducao = indexFor("reducao", 9);
  const idxIs = indexFor("is", 10);

  const produtos: Produto[] = [];

  for (const cols of dataRows) {
    const descricao = cols[idxDescricao]?.trim();
    const ncm = cols[idxNcm]?.trim();
    if (!descricao || !ncm) {
      continue;
    }

    const unidade = normalizeUnit(idxUnidade >= 0 ? cols[idxUnidade]?.trim() : undefined) ?? "un";

    produtos.push({
      id: generateId("prod"),
      descricao,
      ncm,
      unidadePadrao: unidade,
      categoria: idxCategoria >= 0 ? cols[idxCategoria]?.trim() ?? "" : undefined,
      cest: idxCest >= 0 ? cols[idxCest]?.trim() ?? "" : undefined,
      codigoInterno:
        idxCodigoInterno >= 0 ? cols[idxCodigoInterno]?.trim() ?? "" : undefined,
      ativo: idxAtivo >= 0 ? parseBoolean(cols[idxAtivo], true) : true,
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

/**
 * @description Converte uma matriz de objetos de Fornecedor em uma string CSV.
 * @param fornecedores A matriz de objetos de Fornecedor a ser convertida.
 * @returns Uma string formatada em CSV.
 */
export function writeFornecedoresCSV(fornecedores: Supplier[]): string {
  const header = fornecedorCsvHeaders.join(",");
  const rows = fornecedores.map((f) =>
    (() => {
      const flags = f.flagsItem ?? {};
      const cadeia = Array.isArray(f.cadeia) ? f.cadeia : [];
      const cadeiaValores = Array.from({ length: 4 }, (_, index) =>
        formatCsvValue(cadeia[index] ?? ""),
      );
      return [
        formatCsvValue(f.nome),
        formatCsvValue(f.tipo),
        formatCsvValue(f.regime),
        formatCsvValue(f.preco),
        formatCsvValue(f.ibs),
        formatCsvValue(f.cbs),
        formatCsvValue(f.is),
        formatCsvValue(f.frete),
        formatCsvValue(f.cnpj),
        formatCsvValue(f.uf),
        formatCsvValue(f.municipio),
        formatCsvValue(f.produtoId),
        formatCsvValue(f.produtoDescricao),
        formatCsvValue(f.unidadeNegociada),
        formatCsvValue(f.pedidoMinimo ?? 0),
        formatCsvValue(f.prazoEntregaDias ?? 0),
        formatCsvValue(f.prazoPagamentoDias ?? 0),
        formatCsvValue(f.ativo ? "1" : "0"),
        formatCsvValue(flags.cesta ? "1" : "0"),
        formatCsvValue(flags.reducao ? "1" : "0"),
        formatCsvValue(f.isRefeicaoPronta ? "1" : "0"),
        ...cadeiaValores,
      ].join(",");
    })(),
  );
  return [header, ...rows].join("\n");
}

/**
 * @description Converte uma matriz de objetos de Produto em uma string CSV.
 * @param produtos A matriz de objetos de Produto a ser convertida.
 * @returns Uma string formatada em CSV.
 */
export function writeProdutosCSV(produtos: Produto[]): string {
  const header = produtoCsvHeaders.join(",");
  const rows = produtos.map((p) =>
    [
      formatCsvValue(p.descricao),
      formatCsvValue(p.ncm),
      formatCsvValue(p.unidadePadrao),
      formatCsvValue(p.categoria),
      formatCsvValue(p.cest),
      formatCsvValue(p.codigoInterno),
      formatCsvValue(p.ativo ? "1" : "0"),
      formatCsvValue(p.flags.refeicao ? "1" : "0"),
      formatCsvValue(p.flags.cesta ? "1" : "0"),
      formatCsvValue(p.flags.reducao ? "1" : "0"),
      formatCsvValue(p.flags.is ? "1" : "0"),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

// ============================================
// NOVAS FUNÇÕES PARA FORNECEDOR + OFERTA
// ============================================

/**
 * Lê CSV de dados cadastrais de Fornecedor
 */
export function readFornecedoresCadastroCSV(csv: string): Fornecedor[] {
  const rows = parseCsvRows(csv);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const dataRows = rows.slice(1);

  const idx = (name: string, fallback = -1) => {
    const i = headers.indexOf(name);
    return i >= 0 ? i : fallback;
  };

  const idxId = idx("id");
  const idxNome = idx("nome", 0);
  const idxCnpj = idx("cnpj");
  const idxTipo = idx("tipo", 1);
  const idxRegime = idx("regime", 2);
  const idxUf = idx("uf");
  const idxMunicipio = idx("municipio");
  const idxContatoNome = idx("contato_nome");
  const idxContatoEmail = idx("contato_email");
  const idxContatoTelefone = idx("contato_telefone");
  const idxAtivo = idx("ativo");

  const result: Fornecedor[] = [];

  for (const cols of dataRows) {
    const nome = cols[idxNome]?.trim() ?? "";
    if (!nome) continue;

    const contato = {
      nome: idxContatoNome >= 0 ? cols[idxContatoNome]?.trim() : undefined,
      email: idxContatoEmail >= 0 ? cols[idxContatoEmail]?.trim() : undefined,
      telefone: idxContatoTelefone >= 0 ? cols[idxContatoTelefone]?.trim() : undefined,
    };
    const hasContato = contato.nome || contato.email || contato.telefone;

    result.push({
      id: idxId >= 0 && cols[idxId]?.trim() ? cols[idxId].trim() : generateId("forn"),
      nome,
      cnpj: idxCnpj >= 0 ? cols[idxCnpj]?.trim() : undefined,
      tipo: normalizeSupplierTipo(cols[idxTipo]),
      regime: normalizeSupplierRegime(cols[idxRegime]),
      uf: idxUf >= 0 ? cols[idxUf]?.trim().toUpperCase() ?? "" : "",
      municipio: idxMunicipio >= 0 ? cols[idxMunicipio]?.trim() : undefined,
      contato: hasContato ? contato : undefined,
      ativo: idxAtivo >= 0 ? parseBoolean(cols[idxAtivo], true) : true,
    });
  }

  return result;
}

/**
 * Escreve CSV de dados cadastrais de Fornecedor
 */
export function writeFornecedoresCadastroCSV(fornecedores: Fornecedor[]): string {
  const header = fornecedorCadastroCsvHeaders.join(",");
  const rows = fornecedores.map((f) =>
    [
      formatCsvValue(f.id),
      formatCsvValue(f.nome),
      formatCsvValue(f.cnpj),
      formatCsvValue(f.tipo),
      formatCsvValue(f.regime),
      formatCsvValue(f.uf),
      formatCsvValue(f.municipio),
      formatCsvValue(f.contato?.nome),
      formatCsvValue(f.contato?.email),
      formatCsvValue(f.contato?.telefone),
      formatCsvValue(f.ativo ? "1" : "0"),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

/**
 * Lê CSV de OfertaFornecedor
 */
export function readOfertasCSV(csv: string): OfertaFornecedor[] {
  const rows = parseCsvRows(csv);
  if (rows.length === 0) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const dataRows = rows.slice(1);

  const idx = (name: string, fallback = -1) => {
    const i = headers.indexOf(name);
    return i >= 0 ? i : fallback;
  };

  const idxId = idx("id");
  const idxFornecedorId = idx("fornecedor_id", 0);
  const idxProdutoId = idx("produto_id", 1);
  const idxProdutoDescricao = idx("produto_descricao");
  const idxUnidade = idx("unidade");
  const idxPreco = idx("preco", 2);
  const idxIbs = idx("ibs");
  const idxCbs = idx("cbs");
  const idxIs = idx("is");
  const idxFrete = idx("frete");
  const idxPedidoMinimo = idx("pedido_minimo");
  const idxPrazoEntrega = idx("prazo_entrega");
  const idxPrazoPagamento = idx("prazo_pagamento");
  const idxFlagCesta = idx("flag_cesta");
  const idxFlagReducao = idx("flag_reducao");
  const idxRefPronta = idx("refeicao_pronta");
  const idxAtiva = idx("ativa");
  const idxCadeia1 = idx("cadeia_1");
  const idxCadeia2 = idx("cadeia_2");
  const idxCadeia3 = idx("cadeia_3");
  const idxCadeia4 = idx("cadeia_4");

  const result: OfertaFornecedor[] = [];

  for (const cols of dataRows) {
    const fornecedorId = cols[idxFornecedorId]?.trim() ?? "";
    const produtoId = cols[idxProdutoId]?.trim() ?? "";
    if (!fornecedorId) continue;

    const flagsItem: OfertaFornecedor["flagsItem"] = {};
    if (idxFlagCesta >= 0) flagsItem.cesta = parseBoolean(cols[idxFlagCesta], false);
    if (idxFlagReducao >= 0) flagsItem.reducao = parseBoolean(cols[idxFlagReducao], false);
    const hasFlags = Object.keys(flagsItem).length > 0;

    const cadeiaRaw = [
      idxCadeia1 >= 0 ? cols[idxCadeia1]?.trim() ?? "" : "",
      idxCadeia2 >= 0 ? cols[idxCadeia2]?.trim() ?? "" : "",
      idxCadeia3 >= 0 ? cols[idxCadeia3]?.trim() ?? "" : "",
      idxCadeia4 >= 0 ? cols[idxCadeia4]?.trim() ?? "" : "",
    ];
    const cadeia = cadeiaRaw.every((v) => !v) ? [] : cadeiaRaw;

    result.push({
      id: idxId >= 0 && cols[idxId]?.trim() ? cols[idxId].trim() : generateId("oferta"),
      fornecedorId,
      produtoId,
      produtoDescricao: idxProdutoDescricao >= 0 ? cols[idxProdutoDescricao]?.trim() : undefined,
      unidadeNegociada: normalizeUnit(idxUnidade >= 0 ? cols[idxUnidade]?.trim() : undefined),
      preco: parseNumber(cols[idxPreco]),
      ibs: idxIbs >= 0 ? parseNumber(cols[idxIbs]) : 0,
      cbs: idxCbs >= 0 ? parseNumber(cols[idxCbs]) : 0,
      is: idxIs >= 0 ? parseNumber(cols[idxIs]) : 0,
      frete: idxFrete >= 0 ? parseNumber(cols[idxFrete]) : 0,
      pedidoMinimo: idxPedidoMinimo >= 0 ? parseNumber(cols[idxPedidoMinimo]) : 0,
      prazoEntregaDias: idxPrazoEntrega >= 0 ? Math.max(0, Math.trunc(parseNumber(cols[idxPrazoEntrega]))) : 0,
      prazoPagamentoDias: idxPrazoPagamento >= 0 ? Math.max(0, Math.trunc(parseNumber(cols[idxPrazoPagamento]))) : 0,
      flagsItem: hasFlags ? flagsItem : undefined,
      isRefeicaoPronta: idxRefPronta >= 0 ? parseBoolean(cols[idxRefPronta], false) : false,
      cadeia,
      ativa: idxAtiva >= 0 ? parseBoolean(cols[idxAtiva], true) : true,
    });
  }

  return result;
}

/**
 * Escreve CSV de OfertaFornecedor
 */
export function writeOfertasCSV(ofertas: OfertaFornecedor[]): string {
  const header = ofertaCsvHeaders.join(",");
  const rows = ofertas.map((o) => {
    const flags = o.flagsItem ?? {};
    const cadeia = Array.isArray(o.cadeia) ? o.cadeia : [];
    const cadeiaValores = Array.from({ length: 4 }, (_, i) => formatCsvValue(cadeia[i] ?? ""));
    return [
      formatCsvValue(o.id),
      formatCsvValue(o.fornecedorId),
      formatCsvValue(o.produtoId),
      formatCsvValue(o.produtoDescricao),
      formatCsvValue(o.unidadeNegociada),
      formatCsvValue(o.preco),
      formatCsvValue(o.ibs),
      formatCsvValue(o.cbs),
      formatCsvValue(o.is),
      formatCsvValue(o.frete),
      formatCsvValue(o.pedidoMinimo ?? 0),
      formatCsvValue(o.prazoEntregaDias ?? 0),
      formatCsvValue(o.prazoPagamentoDias ?? 0),
      formatCsvValue(flags.cesta ? "1" : "0"),
      formatCsvValue(flags.reducao ? "1" : "0"),
      formatCsvValue(o.isRefeicaoPronta ? "1" : "0"),
      formatCsvValue(o.ativa ? "1" : "0"),
      ...cadeiaValores,
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
