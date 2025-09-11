import { Produto, useCatalogoStore } from "@/store/useCatalogoStore";
import { useCotacaoStore } from "@/store/useCotacaoStore";
import type { Supplier } from "@/types/domain";

export const seedProdutos: Produto[] = [
  {
    id: "prod-1",
    descricao: "Arroz Tipo 1 5kg",
    ncm: "1006.30.11",
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
  {
    id: "prod-2",
    descricao: "Feijão Carioca 1kg",
    ncm: "0713.33.29",
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
  {
    id: "prod-3",
    descricao: "Açúcar Cristal 1kg",
    ncm: "1701.99.00",
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
  {
    id: "prod-4",
    descricao: "Óleo de Soja 900ml",
    ncm: "1507.90.10",
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
  {
    id: "prod-5",
    descricao: "Café Torrado e Moído 500g",
    ncm: "0901.21.00",
    flags: { refeicao: true, cesta: true, reducao: true, is: false },
  },
  {
    id: "prod-6",
    descricao: "Macarrão Espaguete 500g",
    ncm: "1902.19.00",
    flags: { refeicao: true, cesta: true, reducao: false, is: false },
  },
];

export const seedFornecedores: Supplier[] = [
  {
    id: "forn-1",
    nome: "Alimentos Alpha",
    tipo: "fabricante",
    regime: "lucro-real",
    preco: 100,
    ibs: 5,
    cbs: 2,
    is: 0,
    frete: 10,
    cadeia: ["Produtor", "Processador", "Distribuidor", "Varejo"],
  },
  {
    id: "forn-2",
    nome: "Distribuidora Beta",
    tipo: "distribuidor",
    regime: "lucro-presumido",
    preco: 95,
    ibs: 4,
    cbs: 1.5,
    is: 0,
    frete: 12,
    cadeia: ["Importador", "Distribuidor", "Atacadista", "Varejo"],
  },
  {
    id: "forn-3",
    nome: "Comercial Gama",
    tipo: "atacadista",
    regime: "simples",
    preco: 102,
    ibs: 0,
    cbs: 0,
    is: 0,
    frete: 8,
    cadeia: ["Cooperativa", "Armazenagem", "Atacadista", "Varejo"],
  },
  {
    id: "forn-4",
    nome: "Fornecedor Delta",
    tipo: "importador",
    regime: "lucro-real",
    preco: 110,
    ibs: 6,
    cbs: 3,
    is: 1,
    frete: 15,
    cadeia: ["Fabricante Exterior", "Importador", "Distribuidor", "Varejo"],
  },
];

export function loadSeedData() {
  const catalogo = useCatalogoStore.getState();
  if (catalogo.produtos.length === 0) {
    useCatalogoStore.setState({ produtos: seedProdutos });
  }

  const cotacao = useCotacaoStore.getState();
  if (cotacao.fornecedores.length === 0) {
    useCotacaoStore.setState({ fornecedores: seedFornecedores });
    useCotacaoStore.getState().calcular();
  }
}
