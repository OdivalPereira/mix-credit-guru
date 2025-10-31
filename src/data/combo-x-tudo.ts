import type { Product, Supplier } from "@/types/domain";

export const suppliers: Supplier[] = [
  {
    id: "fornecedor-simples",
    name: "Fornecedor Simples Nacional",
    taxRegime: "Simples Nacional",
    state: "SP",
  },
  {
    id: "fornecedor-presumido",
    name: "Fornecedor Lucro Presumido",
    taxRegime: "Lucro Presumido",
    state: "RJ",
  },
  {
    id: "fornecedor-real",
    name: "Fornecedor Lucro Real",
    taxRegime: "Lucro Real",
    state: "MG",
  },
];

export const comboXTudo: Product[] = [
  {
    id: "combo-x-tudo",
    name: "Combo X-Tudo",
    description: "Um delicioso combo com X-Tudo, fritas, refrigerante e sorvete.",
    unitPrice: 52.00,
    category: "Alimentação",
    ncm: "2106.90.90",
    supplier: suppliers[0],
    quantity: 1,
  },
  {
    id: "x-tudo",
    name: "X-Tudo",
    description: "O clássico X-Tudo com tudo que você tem direito.",
    unitPrice: 22.00,
    category: "Alimentação",
    ncm: "1602.50.00",
    supplier: suppliers[0],
    quantity: 1,
  },
  {
    id: "refrigerante",
    name: "Refrigerante",
    description: "Lata de 350ml.",
    unitPrice: 4.00,
    category: "Bebidas",
    ncm: "2202.10.00",
    supplier: suppliers[1],
    quantity: 1,
  },
  {
    id: "batata-frita",
    name: "Porção de Batata Frita",
    description: "Porção média de 300g.",
    unitPrice: 18.00,
    category: "Alimentação",
    ncm: "2004.10.00",
    supplier: suppliers[2],
    quantity: 1,
  },
  {
    id: "sorvete",
    name: "Sorvete",
    description: "Uma bola de sorvete de creme.",
    unitPrice: 8.00,
    category: "Sobremesa",
    ncm: "2105.00.10",
    supplier: suppliers[0],
    quantity: 1,
  },
];
