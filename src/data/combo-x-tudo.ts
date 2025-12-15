import type { Produto, Supplier, Fornecedor, OfertaFornecedor } from "@/types/domain";

// ============================================
// DADOS CADASTRAIS DE FORNECEDORES
// ============================================
export const fornecedoresCadastro: Fornecedor[] = [
  {
    id: "fornecedor-simples",
    nome: "Fornecedor Simples Nacional",
    cnpj: "12.345.678/0001-90",
    tipo: "distribuidor",
    regime: "simples",
    uf: "SP",
    municipio: "",
    ativo: true,
  },
  {
    id: "fornecedor-presumido",
    nome: "Fornecedor Lucro Presumido",
    cnpj: "98.765.432/0001-10",
    tipo: "distribuidor",
    regime: "presumido",
    uf: "RJ",
    municipio: "",
    ativo: true,
  },
  {
    id: "fornecedor-real",
    nome: "Fornecedor Lucro Real",
    cnpj: "11.222.333/0001-44",
    tipo: "industria",
    regime: "normal",
    uf: "MG",
    municipio: "",
    ativo: true,
  },
];

// ============================================
// OFERTAS DOS FORNECEDORES (template para produtos)
// ============================================
export const ofertasTemplate: Omit<OfertaFornecedor, "id" | "produtoId" | "produtoDescricao">[] = [
  {
    fornecedorId: "fornecedor-simples",
    preco: 0,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 0,
    flagsItem: { cesta: false, reducao: false },
    isRefeicaoPronta: false,
    cadeia: ["", "", "", ""],
    priceBreaks: [
      { quantidade: 10, preco: 24.0 },
      { quantidade: 50, preco: 22.5 },
      { quantidade: 100, preco: 21.0 },
    ],
    ativa: true,
  },
  {
    fornecedorId: "fornecedor-presumido",
    preco: 0,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 0,
    flagsItem: { cesta: false, reducao: false },
    isRefeicaoPronta: false,
    cadeia: ["", "", "", ""],
    priceBreaks: [
      { quantidade: 20, preco: 26.5 },
      { quantidade: 100, preco: 24.0 },
    ],
    freightBreaks: [
      { quantidade: 50, frete: 1.0 },
      { quantidade: 200, frete: 0.5 },
    ],
    ativa: true,
  },
  {
    fornecedorId: "fornecedor-real",
    preco: 0,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 0,
    flagsItem: { cesta: false, reducao: false },
    isRefeicaoPronta: false,
    cadeia: ["", "", "", ""],
    priceBreaks: [
      { quantidade: 30, preco: 21.0 },
      { quantidade: 100, preco: 19.5 },
      { quantidade: 500, preco: 18.0 },
    ],
    freightBreaks: [
      { quantidade: 100, frete: 2.0 },
      { quantidade: 300, frete: 1.0 },
    ],
    yield: {
      entrada: "kg",
      saida: "kg",
      rendimento: 85,
    },
    ativa: true,
  },
];

// ============================================
// LEGADO: Manter para compatibilidade
// ============================================
/** @deprecated Use fornecedoresCadastro + ofertasTemplate */
export const suppliers: Supplier[] = [
  {
    id: "fornecedor-simples",
    nome: "Fornecedor Simples Nacional",
    cnpj: "12.345.678/0001-90",
    tipo: "distribuidor",
    regime: "simples",
    uf: "SP",
    municipio: "",
    ativo: true,
    produtoDescricao: "",
    preco: 0,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 0,
    flagsItem: { cesta: false, reducao: false },
    isRefeicaoPronta: false,
    cadeia: ["", "", "", ""],
    priceBreaks: [
      { quantidade: 10, preco: 24.0 },
      { quantidade: 50, preco: 22.5 },
      { quantidade: 100, preco: 21.0 },
    ],
  },
  {
    id: "fornecedor-presumido",
    nome: "Fornecedor Lucro Presumido",
    cnpj: "98.765.432/0001-10",
    tipo: "distribuidor",
    regime: "presumido",
    uf: "RJ",
    municipio: "",
    ativo: true,
    produtoDescricao: "",
    preco: 0,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 0,
    flagsItem: { cesta: false, reducao: false },
    isRefeicaoPronta: false,
    cadeia: ["", "", "", ""],
    priceBreaks: [
      { quantidade: 20, preco: 26.5 },
      { quantidade: 100, preco: 24.0 },
    ],
    freightBreaks: [
      { quantidade: 50, frete: 1.0 },
      { quantidade: 200, frete: 0.5 },
    ],
  },
  {
    id: "fornecedor-real",
    nome: "Fornecedor Lucro Real",
    cnpj: "11.222.333/0001-44",
    tipo: "industria",
    regime: "normal",
    uf: "MG",
    municipio: "",
    ativo: true,
    produtoDescricao: "",
    preco: 0,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 0,
    flagsItem: { cesta: false, reducao: false },
    isRefeicaoPronta: false,
    cadeia: ["", "", "", ""],
    priceBreaks: [
      { quantidade: 30, preco: 21.0 },
      { quantidade: 100, preco: 19.5 },
      { quantidade: 500, preco: 18.0 },
    ],
    freightBreaks: [
      { quantidade: 100, frete: 2.0 },
      { quantidade: 300, frete: 1.0 },
    ],
    yield: {
      entrada: "kg",
      saida: "kg",
      rendimento: 85,
    },
  },
];

export const comboXTudo: Produto[] = [
  {
    id: "combo-x-tudo",
    descricao: "Combo X-Tudo",
    ncm: "2106.90.90",
    unidadePadrao: "un",
    categoria: "Alimentação",
    ativo: true,
    flags: {
      refeicao: true,
      cesta: false,
      reducao: false,
      is: false,
    },
  },
  {
    id: "x-tudo",
    descricao: "X-Tudo",
    ncm: "1602.50.00",
    unidadePadrao: "un",
    categoria: "Alimentação",
    ativo: true,
    flags: {
      refeicao: true,
      cesta: false,
      reducao: false,
      is: false,
    },
  },
  {
    id: "refrigerante",
    descricao: "Refrigerante",
    ncm: "2202.10.00",
    unidadePadrao: "un",
    categoria: "Bebidas",
    ativo: true,
    flags: {
      refeicao: false,
      cesta: false,
      reducao: false,
      is: false,
    },
  },
  {
    id: "batata-frita",
    descricao: "Porção de Batata Frita",
    ncm: "2004.10.00",
    unidadePadrao: "kg",
    categoria: "Alimentação",
    ativo: true,
    flags: {
      refeicao: false,
      cesta: false,
      reducao: false,
      is: false,
    },
  },
  {
    id: "sorvete",
    descricao: "Sorvete",
    ncm: "2105.00.10",
    unidadePadrao: "un",
    categoria: "Sobremesa",
    ativo: true,
    flags: {
      refeicao: false,
      cesta: false,
      reducao: false,
      is: false,
    },
  },
];
