import type { Produto, Fornecedor, OfertaFornecedor, NcmRule, Receita } from "@/types/domain";

// ============= Produtos Demo =============
export const demoProdutos: Produto[] = [
  {
    id: "demo-p1",
    descricao: "Arroz Branco Tipo 1 - 5kg",
    ncm: "1006.30.11",
    unidadePadrao: "un",
    categoria: "Grãos e Cereais",
    ativo: true,
    flags: { refeicao: false, cesta: true, reducao: true, is: false }
  },
  {
    id: "demo-p2",
    descricao: "Óleo de Soja Refinado - 900ml",
    ncm: "1507.90.10",
    unidadePadrao: "un",
    categoria: "Óleos e Gorduras",
    ativo: true,
    flags: { refeicao: false, cesta: true, reducao: false, is: false }
  },
  {
    id: "demo-p3",
    descricao: "Feijão Carioca Tipo 1 - 1kg",
    ncm: "0713.33.19",
    unidadePadrao: "kg",
    categoria: "Grãos e Cereais",
    ativo: true,
    flags: { refeicao: false, cesta: true, reducao: true, is: false }
  },
  {
    id: "demo-p4",
    descricao: "Açúcar Cristal - 1kg",
    ncm: "1701.99.00",
    unidadePadrao: "kg",
    categoria: "Açúcares",
    ativo: true,
    flags: { refeicao: false, cesta: true, reducao: false, is: true }
  },
  {
    id: "demo-p5",
    descricao: "Café Torrado e Moído - 500g",
    ncm: "0901.21.00",
    unidadePadrao: "un",
    categoria: "Bebidas",
    ativo: true,
    flags: { refeicao: false, cesta: true, reducao: false, is: false }
  },
  {
    id: "demo-p6",
    descricao: "Leite UHT Integral - 1L",
    ncm: "0401.10.10",
    unidadePadrao: "l",
    categoria: "Laticínios",
    ativo: true,
    flags: { refeicao: false, cesta: true, reducao: true, is: false }
  },
  {
    id: "demo-p7",
    descricao: "Farinha de Trigo - 1kg",
    ncm: "1101.00.10",
    unidadePadrao: "kg",
    categoria: "Farinhas",
    ativo: true,
    flags: { refeicao: false, cesta: true, reducao: true, is: false }
  },
  {
    id: "demo-p8",
    descricao: "Macarrão Espaguete - 500g",
    ncm: "1902.19.00",
    unidadePadrao: "un",
    categoria: "Massas",
    ativo: true,
    flags: { refeicao: false, cesta: true, reducao: false, is: false }
  },
  {
    id: "demo-p9",
    descricao: "Refrigerante Cola - 2L",
    ncm: "2202.10.00",
    unidadePadrao: "un",
    categoria: "Bebidas",
    ativo: true,
    flags: { refeicao: false, cesta: false, reducao: false, is: true }
  },
  {
    id: "demo-p10",
    descricao: "Combo Refeição Completa",
    ncm: "2106.90.90",
    unidadePadrao: "un",
    categoria: "Refeições",
    ativo: true,
    flags: { refeicao: true, cesta: false, reducao: false, is: false }
  }
];

// ============= Fornecedores Demo =============
export const demoFornecedores: Fornecedor[] = [
  {
    id: "demo-f1",
    nome: "Distribuidora Sul Alimentos",
    cnpj: "12.345.678/0001-01",
    tipo: "distribuidor",
    regime: "normal",
    uf: "SC",
    municipio: "Joinville",
    contato: { nome: "Carlos Silva", email: "carlos@sulalimentos.com.br", telefone: "(47) 3333-1111" },
    ativo: true
  },
  {
    id: "demo-f2",
    nome: "Indústria Paulista de Alimentos",
    cnpj: "23.456.789/0001-02",
    tipo: "industria",
    regime: "normal",
    uf: "SP",
    municipio: "São Paulo",
    contato: { nome: "Ana Costa", email: "ana@ipaulista.com.br", telefone: "(11) 4444-2222" },
    ativo: true
  },
  {
    id: "demo-f3",
    nome: "Atacado Simples Nacional",
    cnpj: "34.567.890/0001-03",
    tipo: "atacado",
    regime: "simples",
    uf: "SP",
    municipio: "Campinas",
    contato: { nome: "José Santos", email: "jose@atacadosimples.com.br", telefone: "(19) 5555-3333" },
    ativo: true
  },
  {
    id: "demo-f4",
    nome: "Cooperativa Rural do Paraná",
    cnpj: "45.678.901/0001-04",
    tipo: "produtor",
    regime: "normal",
    uf: "PR",
    municipio: "Londrina",
    contato: { nome: "Maria Oliveira", email: "maria@cooprural.com.br", telefone: "(43) 6666-4444" },
    ativo: true
  },
  {
    id: "demo-f5",
    nome: "Grãos do Cerrado",
    cnpj: "56.789.012/0001-05",
    tipo: "produtor",
    regime: "presumido",
    uf: "GO",
    municipio: "Goiânia",
    contato: { nome: "Pedro Souza", email: "pedro@graoscerrado.com.br", telefone: "(62) 7777-5555" },
    ativo: true
  },
  {
    id: "demo-f6",
    nome: "Laticínios Minas Gerais",
    cnpj: "67.890.123/0001-06",
    tipo: "industria",
    regime: "normal",
    uf: "MG",
    municipio: "Belo Horizonte",
    contato: { nome: "Fernanda Lima", email: "fernanda@lacticmg.com.br", telefone: "(31) 8888-6666" },
    ativo: true
  },
  {
    id: "demo-f7",
    nome: "Varejo Express",
    cnpj: "78.901.234/0001-07",
    tipo: "varejo",
    regime: "simples",
    uf: "RJ",
    municipio: "Rio de Janeiro",
    contato: { nome: "Roberto Alves", email: "roberto@varejoexpress.com.br", telefone: "(21) 9999-7777" },
    ativo: true
  }
];

// ============= Ofertas Demo =============
export const demoOfertas: OfertaFornecedor[] = [
  // Arroz - 4 ofertas
  {
    id: "demo-o1",
    fornecedorId: "demo-f1",
    produtoId: "demo-p1",
    produtoDescricao: "Arroz Branco Tipo 1 - 5kg",
    preco: 22.50,
    ibs: 4,
    cbs: 2,
    is: 0,
    explanation: "Cesta básica: IBS 4%, CBS 2%, IS isento (NCM 1006.30.11 - Arroz)",
    frete: 1.20,
    unidadeNegociada: "un",
    prazoEntregaDias: 2,
    prazoPagamentoDias: 30,
    pedidoMinimo: 100,
    cadeia: ["Produtor RS", "Beneficiadora SC", "Distribuidora SC", ""],
    flagsItem: { ncm: "1006.30.11", cesta: true, reducao: true },
    ativa: true
  },
  {
    id: "demo-o2",
    fornecedorId: "demo-f2",
    produtoId: "demo-p1",
    produtoDescricao: "Arroz Branco Tipo 1 - 5kg",
    preco: 21.00,
    ibs: 4,
    cbs: 2,
    is: 0,
    explanation: "Cesta básica: IBS 4%, CBS 2%, IS isento (NCM 1006.30.11 - Arroz)",
    frete: 2.50,
    unidadeNegociada: "un",
    prazoEntregaDias: 5,
    prazoPagamentoDias: 45,
    pedidoMinimo: 200,
    cadeia: ["Produtor MT", "Indústria SP", "", ""],
    flagsItem: { ncm: "1006.30.11", cesta: true, reducao: true },
    priceBreaks: [{ quantidade: 500, preco: 20.00 }, { quantidade: 1000, preco: 19.50 }],
    ativa: true
  },
  {
    id: "demo-o3",
    fornecedorId: "demo-f4",
    produtoId: "demo-p1",
    produtoDescricao: "Arroz Branco Tipo 1 - 5kg",
    preco: 20.00,
    ibs: 4,
    cbs: 2,
    is: 0,
    explanation: "Cesta básica: IBS 4%, CBS 2%, IS isento (NCM 1006.30.11 - Arroz)",
    frete: 3.80,
    unidadeNegociada: "un",
    prazoEntregaDias: 7,
    prazoPagamentoDias: 21,
    pedidoMinimo: 50,
    cadeia: ["Produtor PR", "", "", ""],
    flagsItem: { ncm: "1006.30.11", cesta: true, reducao: true },
    ativa: true
  },
  // Óleo de Soja - 3 ofertas
  {
    id: "demo-o4",
    fornecedorId: "demo-f2",
    produtoId: "demo-p2",
    produtoDescricao: "Óleo de Soja Refinado - 900ml",
    preco: 8.90,
    ibs: 7,
    cbs: 3,
    is: 1,
    explanation: "Cesta básica com IS: IBS 7%, CBS 3%, IS 1% (NCM 1507.90.10 - Óleo de Soja)",
    frete: 0.80,
    unidadeNegociada: "un",
    prazoEntregaDias: 3,
    prazoPagamentoDias: 30,
    pedidoMinimo: 300,
    cadeia: ["Produtor GO", "Refinaria SP", "Indústria SP", ""],
    flagsItem: { ncm: "1507.90.10", cesta: true },
    ativa: true
  },
  {
    id: "demo-o5",
    fornecedorId: "demo-f5",
    produtoId: "demo-p2",
    produtoDescricao: "Óleo de Soja Refinado - 900ml",
    preco: 8.50,
    ibs: 7,
    cbs: 3,
    is: 1,
    explanation: "Cesta básica com IS: IBS 7%, CBS 3%, IS 1% (NCM 1507.90.10 - Óleo de Soja)",
    frete: 4.20,
    unidadeNegociada: "un",
    prazoEntregaDias: 10,
    prazoPagamentoDias: 14,
    pedidoMinimo: 100,
    cadeia: ["Produtor GO", "Refinaria GO", "", ""],
    flagsItem: { ncm: "1507.90.10", cesta: true },
    ativa: true
  },
  // Feijão - 2 ofertas
  {
    id: "demo-o6",
    fornecedorId: "demo-f4",
    produtoId: "demo-p3",
    produtoDescricao: "Feijão Carioca Tipo 1 - 1kg",
    preco: 7.80,
    ibs: 4,
    cbs: 2,
    is: 0,
    explanation: "Cesta básica: IBS 4%, CBS 2%, IS isento (NCM 0713.33.19 - Feijão)",
    frete: 1.00,
    unidadeNegociada: "kg",
    prazoEntregaDias: 4,
    prazoPagamentoDias: 28,
    pedidoMinimo: 500,
    cadeia: ["Produtor PR", "", "", ""],
    flagsItem: { ncm: "0713.33.19", cesta: true, reducao: true },
    priceBreaks: [{ quantidade: 1000, preco: 7.50 }],
    ativa: true
  },
  {
    id: "demo-o7",
    fornecedorId: "demo-f3",
    produtoId: "demo-p3",
    produtoDescricao: "Feijão Carioca Tipo 1 - 1kg",
    preco: 8.20,
    ibs: 4,
    cbs: 2,
    is: 0,
    explanation: "Cesta básica: IBS 4%, CBS 2%, IS isento (NCM 0713.33.19 - Feijão)",
    frete: 0.50,
    unidadeNegociada: "kg",
    prazoEntregaDias: 1,
    prazoPagamentoDias: 7,
    pedidoMinimo: 100,
    cadeia: ["Produtor MG", "Atacado SP", "", ""],
    flagsItem: { ncm: "0713.33.19", cesta: true, reducao: true },
    ativa: true
  },
  // Açúcar - 2 ofertas (com IS)
  {
    id: "demo-o8",
    fornecedorId: "demo-f1",
    produtoId: "demo-p4",
    produtoDescricao: "Açúcar Cristal - 1kg",
    preco: 4.50,
    ibs: 12,
    cbs: 5,
    is: 2,
    explanation: "Produto com IS: IBS 12%, CBS 5%, IS 2% (NCM 1701.99.00 - Açúcar)",
    frete: 0.30,
    unidadeNegociada: "kg",
    prazoEntregaDias: 2,
    prazoPagamentoDias: 30,
    pedidoMinimo: 500,
    cadeia: ["Usina SP", "Distribuidora SC", "", ""],
    flagsItem: { ncm: "1701.99.00", cesta: true },
    ativa: true
  },
  {
    id: "demo-o9",
    fornecedorId: "demo-f2",
    produtoId: "demo-p4",
    produtoDescricao: "Açúcar Cristal - 1kg",
    preco: 4.20,
    ibs: 12,
    cbs: 5,
    is: 2,
    explanation: "Produto com IS: IBS 12%, CBS 5%, IS 2% (NCM 1701.99.00 - Açúcar)",
    frete: 0.80,
    unidadeNegociada: "kg",
    prazoEntregaDias: 4,
    prazoPagamentoDias: 45,
    pedidoMinimo: 1000,
    cadeia: ["Usina SP", "Indústria SP", "", ""],
    flagsItem: { ncm: "1701.99.00", cesta: true },
    ativa: true
  },
  // Café - 2 ofertas
  {
    id: "demo-o10",
    fornecedorId: "demo-f6",
    produtoId: "demo-p5",
    produtoDescricao: "Café Torrado e Moído - 500g",
    preco: 18.90,
    ibs: 7,
    cbs: 3,
    is: 0,
    explanation: "Cesta básica: IBS 7%, CBS 3%, IS isento (NCM 0901.21.00 - Café)",
    frete: 1.50,
    unidadeNegociada: "un",
    prazoEntregaDias: 3,
    prazoPagamentoDias: 30,
    pedidoMinimo: 200,
    cadeia: ["Produtor MG", "Torrefadora MG", "", ""],
    flagsItem: { ncm: "0901.21.00", cesta: true },
    ativa: true
  },
  // Leite - 2 ofertas
  {
    id: "demo-o11",
    fornecedorId: "demo-f6",
    produtoId: "demo-p6",
    produtoDescricao: "Leite UHT Integral - 1L",
    preco: 5.20,
    ibs: 4,
    cbs: 2,
    is: 0,
    explanation: "Cesta básica: IBS 4%, CBS 2%, IS isento (NCM 0401.10.10 - Leite)",
    frete: 0.60,
    unidadeNegociada: "l",
    prazoEntregaDias: 2,
    prazoPagamentoDias: 14,
    pedidoMinimo: 1000,
    cadeia: ["Produtor MG", "Laticínios MG", "", ""],
    flagsItem: { ncm: "0401.10.10", cesta: true, reducao: true },
    freightBreaks: [{ quantidade: 2000, frete: 0.40 }],
    ativa: true
  },
  {
    id: "demo-o12",
    fornecedorId: "demo-f4",
    produtoId: "demo-p6",
    produtoDescricao: "Leite UHT Integral - 1L",
    preco: 4.80,
    ibs: 4,
    cbs: 2,
    is: 0,
    explanation: "Cesta básica: IBS 4%, CBS 2%, IS isento (NCM 0401.10.10 - Leite)",
    frete: 1.20,
    unidadeNegociada: "l",
    prazoEntregaDias: 5,
    prazoPagamentoDias: 21,
    pedidoMinimo: 500,
    cadeia: ["Produtor PR", "Laticínios PR", "", ""],
    flagsItem: { ncm: "0401.10.10", cesta: true, reducao: true },
    ativa: true
  },
  // Refrigerante (com IS alto)
  {
    id: "demo-o13",
    fornecedorId: "demo-f1",
    produtoId: "demo-p9",
    produtoDescricao: "Refrigerante Cola - 2L",
    preco: 7.90,
    ibs: 12,
    cbs: 5,
    is: 8,
    explanation: "Bebida açucarada: IBS 12%, CBS 5%, IS 8% (NCM 2202.10.00 - Refrigerante)",
    frete: 0.50,
    unidadeNegociada: "un",
    prazoEntregaDias: 1,
    prazoPagamentoDias: 30,
    pedidoMinimo: 200,
    cadeia: ["Indústria SP", "Distribuidora SC", "", ""],
    flagsItem: { ncm: "2202.10.00" },
    ativa: true
  },
  // Refeição pronta
  {
    id: "demo-o14",
    fornecedorId: "demo-f7",
    produtoId: "demo-p10",
    produtoDescricao: "Combo Refeição Completa",
    preco: 35.00,
    ibs: 4,
    cbs: 2,
    is: 0,
    explanation: "Refeição pronta: IBS 4%, CBS 2%, IS isento (NCM 2106.90.90 - Combo)",
    frete: 0,
    unidadeNegociada: "un",
    prazoEntregaDias: 0,
    prazoPagamentoDias: 0,
    pedidoMinimo: 1,
    cadeia: ["Restaurante RJ", "", "", ""],
    flagsItem: { ncm: "2106.90.90" },
    isRefeicaoPronta: true,
    ativa: true
  }
];

// ============= Receitas Demo =============
export const demoReceitas: Receita[] = [
  { codigo: "REC001", descricao: "Alimentos da Cesta Básica Nacional" },
  { codigo: "REC002", descricao: "Produtos com Alíquota Reduzida" },
  { codigo: "REC003", descricao: "Bebidas Açucaradas (IS)" },
  { codigo: "REC004", descricao: "Refeições Prontas" },
  { codigo: "REC005", descricao: "Produtos Industrializados" }
];

// ============= Regras NCM Demo =============
export const demoRegras: NcmRule[] = [
  {
    ncm: "1006.30.11",
    descricao: "Arroz semibranqueado ou branqueado",
    receita: { codigo: "REC001", descricao: "Alimentos da Cesta Básica Nacional" },
    aliquotas: { ibs: 4, cbs: 2, is: 0 },
    overridesUF: {
      SP: { ibs: 5, cbs: 1.8 },
      RJ: { ibs: 6, cbs: 2, is: 0.5 }
    },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 10
  },
  {
    ncm: "1507.90.10",
    descricao: "Óleo de soja refinado",
    receita: { codigo: "REC001", descricao: "Alimentos da Cesta Básica Nacional" },
    aliquotas: { ibs: 7, cbs: 3, is: 1 },
    overridesUF: {
      SP: { ibs: 8.5, cbs: 2.5 }
    },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 10
  },
  {
    ncm: "0713.33.19",
    descricao: "Feijão comum (Phaseolus vulgaris)",
    receita: { codigo: "REC001", descricao: "Alimentos da Cesta Básica Nacional" },
    aliquotas: { ibs: 4, cbs: 2, is: 0 },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 10
  },
  {
    ncm: "1701.99.00",
    descricao: "Outros açúcares",
    receita: { codigo: "REC003", descricao: "Bebidas Açucaradas (IS)" },
    aliquotas: { ibs: 12, cbs: 5, is: 2 },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 5
  },
  {
    ncm: "0901.21.00",
    descricao: "Café torrado, não descafeinado",
    receita: { codigo: "REC001", descricao: "Alimentos da Cesta Básica Nacional" },
    aliquotas: { ibs: 7, cbs: 3, is: 0 },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 10
  },
  {
    ncm: "0401.10.10",
    descricao: "Leite UHT (longa vida)",
    receita: { codigo: "REC002", descricao: "Produtos com Alíquota Reduzida" },
    aliquotas: { ibs: 4, cbs: 2, is: 0 },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 10
  },
  {
    ncm: "1101.00.10",
    descricao: "Farinha de trigo",
    receita: { codigo: "REC001", descricao: "Alimentos da Cesta Básica Nacional" },
    aliquotas: { ibs: 4, cbs: 2, is: 0 },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 10
  },
  {
    ncm: "1902.19.00",
    descricao: "Outras massas alimentícias não cozidas",
    receita: { codigo: "REC005", descricao: "Produtos Industrializados" },
    aliquotas: { ibs: 7, cbs: 3, is: 0 },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 5
  },
  {
    ncm: "2202.10.00",
    descricao: "Águas, incluindo águas minerais e águas gaseificadas, adicionadas de açúcar",
    receita: { codigo: "REC003", descricao: "Bebidas Açucaradas (IS)" },
    aliquotas: { ibs: 12, cbs: 5, is: 8 },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 1
  },
  {
    ncm: "2106.90.90",
    descricao: "Outras preparações alimentícias",
    receita: { codigo: "REC004", descricao: "Refeições Prontas" },
    aliquotas: { ibs: 4, cbs: 2, is: 0 },
    vigencia: { inicio: "2026-01-01" },
    prioridade: 5
  }
];

// ============= Contexto Demo =============
export const demoContexto = {
  data: new Date().toISOString().split("T")[0],
  uf: "SP",
  municipio: "São Paulo",
  destino: "A" as const,
  regime: "normal" as const,
  produto: "Arroz Branco Tipo 1 - 5kg"
};
