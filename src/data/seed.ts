import { useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import type { Supplier, Produto, Fornecedor, OfertaFornecedor } from "@/types/domain";

export const seedProdutos: Produto[] = [
  {
    id: "prod-1",
    descricao: "Arroz Tipo 1 5kg",
    ncm: "1006.30.11",
    unidadePadrao: "kg",
    categoria: "Alimentos",
    cest: "03.001.00",
    codigoInterno: "ARZ-5KG",
    ativo: true,
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
  {
    id: "prod-2",
    descricao: "Feijao Carioca 1kg",
    ncm: "0713.33.29",
    unidadePadrao: "kg",
    categoria: "Alimentos",
    cest: "03.002.00",
    codigoInterno: "FEJ-1KG",
    ativo: true,
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
  {
    id: "prod-3",
    descricao: "Acucar Cristal 1kg",
    ncm: "1701.99.00",
    unidadePadrao: "kg",
    categoria: "Alimentos",
    cest: "07.001.00",
    codigoInterno: "ACU-1KG",
    ativo: true,
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
  {
    id: "prod-4",
    descricao: "Oleo de Soja 900ml",
    ncm: "1507.90.10",
    unidadePadrao: "l",
    categoria: "Alimentos",
    cest: "05.001.00",
    codigoInterno: "OLE-900",
    ativo: true,
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
  {
    id: "prod-5",
    descricao: "Cafe Torrado e Moido 500g",
    ncm: "0901.21.00",
    unidadePadrao: "kg",
    categoria: "Bebidas e Cafes",
    cest: "03.005.00",
    codigoInterno: "CAF-500",
    ativo: true,
    flags: { refeicao: true, cesta: true, reducao: true, is: false },
  },
  {
    id: "prod-6",
    descricao: "Macarrao Espaguete 500g",
    ncm: "1902.19.00",
    unidadePadrao: "kg",
    categoria: "Alimentos",
    cest: "03.004.00",
    codigoInterno: "MAC-500",
    ativo: true,
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
];

// ============================================
// DADOS CADASTRAIS DE FORNECEDORES
// ============================================
export const seedFornecedoresCadastro: Fornecedor[] = [
  {
    id: "forn-1",
    nome: "Alimentos Alpha",
    cnpj: "12.345.678/0001-90",
    tipo: "industria",
    regime: "normal",
    uf: "SP",
    municipio: "3550308",
    contato: {
      nome: "Ana Souza",
      email: "ana.souza@alpha.com.br",
      telefone: "(11) 3333-1000",
    },
    ativo: true,
  },
  {
    id: "forn-2",
    nome: "Distribuidora Beta",
    cnpj: "23.456.789/0001-10",
    tipo: "distribuidor",
    regime: "presumido",
    uf: "RJ",
    municipio: "3304557",
    contato: {
      nome: "Bruno Lima",
      email: "bruno.lima@betadistribuidora.com",
      telefone: "(21) 3777-2200",
    },
    ativo: true,
  },
  {
    id: "forn-3",
    nome: "Comercial Gama",
    cnpj: "34.567.890/0001-80",
    tipo: "atacado",
    regime: "simples",
    uf: "MG",
    municipio: "3106200",
    contato: {
      nome: "Camila Ribeiro",
      email: "camila.ribeiro@gamacomercial.com",
      telefone: "(31) 2999-8800",
    },
    ativo: true,
  },
  {
    id: "forn-4",
    nome: "Fornecedor Delta",
    cnpj: "45.678.901/0001-55",
    tipo: "industria",
    regime: "normal",
    uf: "PR",
    municipio: "4106902",
    contato: {
      nome: "Daniela Torres",
      email: "daniela.torres@deltaglobal.com",
      telefone: "(41) 3111-4400",
    },
    ativo: true,
  },
];

// ============================================
// OFERTAS DOS FORNECEDORES
// ============================================
export const seedOfertas: OfertaFornecedor[] = [
  {
    id: "oferta-1",
    fornecedorId: "forn-1",
    produtoId: "prod-1",
    produtoDescricao: "Arroz Tipo 1 5kg",
    unidadeNegociada: "kg",
    pedidoMinimo: 100,
    prazoEntregaDias: 5,
    prazoPagamentoDias: 30,
    preco: 100,
    ibs: 5,
    cbs: 2,
    is: 0,
    frete: 10,
    flagsItem: { ncm: "1006.30.11", cesta: true, reducao: false },
    cadeia: ["Produtor", "Processador", "Distribuidor", "Varejo"],
    ativa: true,
  },
  {
    id: "oferta-2",
    fornecedorId: "forn-2",
    produtoId: "prod-2",
    produtoDescricao: "Feijao Carioca 1kg",
    unidadeNegociada: "kg",
    pedidoMinimo: 80,
    prazoEntregaDias: 4,
    prazoPagamentoDias: 21,
    preco: 95,
    ibs: 4,
    cbs: 1.5,
    is: 0,
    frete: 12,
    flagsItem: { ncm: "0713.33.29", cesta: true, reducao: false },
    cadeia: ["Importador", "Distribuidor", "Atacadista", "Varejo"],
    ativa: true,
  },
  {
    id: "oferta-3",
    fornecedorId: "forn-3",
    produtoId: "prod-4",
    produtoDescricao: "Oleo de Soja 900ml",
    unidadeNegociada: "l",
    pedidoMinimo: 60,
    prazoEntregaDias: 6,
    prazoPagamentoDias: 28,
    preco: 102,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 8,
    flagsItem: { ncm: "1507.90.10", cesta: true, reducao: false },
    cadeia: ["Cooperativa", "Armazenagem", "Atacadista", "Varejo"],
    ativa: true,
  },
  {
    id: "oferta-4",
    fornecedorId: "forn-4",
    produtoId: "prod-5",
    produtoDescricao: "Cafe Torrado e Moido 500g",
    unidadeNegociada: "kg",
    pedidoMinimo: 50,
    prazoEntregaDias: 9,
    prazoPagamentoDias: 45,
    preco: 110,
    ibs: 6,
    cbs: 3,
    is: 1,
    frete: 15,
    flagsItem: { ncm: "0901.21.00", cesta: true, reducao: true },
    cadeia: ["Fabricante Exterior", "Importador", "Distribuidor", "Varejo"],
    ativa: true,
  },
];

// ============================================
// LEGADO: Manter para compatibilidade
// ============================================
/** @deprecated Use seedFornecedoresCadastro + seedOfertas */
export const seedFornecedores: Supplier[] = [
  {
    id: "forn-1",
    nome: "Alimentos Alpha",
    cnpj: "12.345.678/0001-90",
    tipo: "industria",
    regime: "normal",
    uf: "SP",
    municipio: "3550308",
    contato: {
      nome: "Ana Souza",
      email: "ana.souza@alpha.com.br",
      telefone: "(11) 3333-1000",
    },
    ativo: true,
    produtoId: "prod-1",
    produtoDescricao: "Arroz Tipo 1 5kg",
    unidadeNegociada: "kg",
    pedidoMinimo: 100,
    prazoEntregaDias: 5,
    prazoPagamentoDias: 30,
    preco: 100,
    ibs: 5,
    cbs: 2,
    is: 0,
    frete: 10,
    flagsItem: { ncm: "1006.30.11", cesta: true, reducao: false },
    cadeia: ["Produtor", "Processador", "Distribuidor", "Varejo"],
  },
  {
    id: "forn-2",
    nome: "Distribuidora Beta",
    cnpj: "23.456.789/0001-10",
    tipo: "distribuidor",
    regime: "presumido",
    uf: "RJ",
    municipio: "3304557",
    contato: {
      nome: "Bruno Lima",
      email: "bruno.lima@betadistribuidora.com",
      telefone: "(21) 3777-2200",
    },
    ativo: true,
    produtoId: "prod-2",
    produtoDescricao: "Feijao Carioca 1kg",
    unidadeNegociada: "kg",
    pedidoMinimo: 80,
    prazoEntregaDias: 4,
    prazoPagamentoDias: 21,
    preco: 95,
    ibs: 4,
    cbs: 1.5,
    is: 0,
    frete: 12,
    flagsItem: { ncm: "0713.33.29", cesta: true, reducao: false },
    cadeia: ["Importador", "Distribuidor", "Atacadista", "Varejo"],
  },
  {
    id: "forn-3",
    nome: "Comercial Gama",
    cnpj: "34.567.890/0001-80",
    tipo: "atacado",
    regime: "simples",
    uf: "MG",
    municipio: "3106200",
    contato: {
      nome: "Camila Ribeiro",
      email: "camila.ribeiro@gamacomercial.com",
      telefone: "(31) 2999-8800",
    },
    ativo: true,
    produtoId: "prod-4",
    produtoDescricao: "Oleo de Soja 900ml",
    unidadeNegociada: "l",
    pedidoMinimo: 60,
    prazoEntregaDias: 6,
    prazoPagamentoDias: 28,
    preco: 102,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 8,
    flagsItem: { ncm: "1507.90.10", cesta: true, reducao: false },
    cadeia: ["Cooperativa", "Armazenagem", "Atacadista", "Varejo"],
  },
  {
    id: "forn-4",
    nome: "Fornecedor Delta",
    cnpj: "45.678.901/0001-55",
    tipo: "industria",
    regime: "normal",
    uf: "PR",
    municipio: "4106902",
    contato: {
      nome: "Daniela Torres",
      email: "daniela.torres@deltaglobal.com",
      telefone: "(41) 3111-4400",
    },
    ativo: true,
    produtoId: "prod-5",
    produtoDescricao: "Cafe Torrado e Moido 500g",
    unidadeNegociada: "kg",
    pedidoMinimo: 50,
    prazoEntregaDias: 9,
    prazoPagamentoDias: 45,
    preco: 110,
    ibs: 6,
    cbs: 3,
    is: 1,
    frete: 15,
    flagsItem: { ncm: "0901.21.00", cesta: true, reducao: true },
    cadeia: ["Fabricante Exterior", "Importador", "Distribuidor", "Varejo"],
  },
];

export function loadSeedData() {
  if (typeof window !== "undefined") {
    const skip = window.localStorage?.getItem("cmx_skip_seed");
    if (skip === "true") {
      return;
    }
  }

  const catalogo = useCatalogoStore.getState();
  if (catalogo.produtos.length === 0) {
    useCatalogoStore.setState({ produtos: seedProdutos });
  }

  const cotacao = useCotacaoStore.getState();
  // Carrega usando a nova estrutura separada
  if (cotacao.fornecedoresCadastro.length === 0 && cotacao.ofertas.length === 0) {
    useCotacaoStore.setState({
      fornecedoresCadastro: seedFornecedoresCadastro,
      ofertas: seedOfertas,
    });
    useCotacaoStore.getState().calcular();
  }
}
