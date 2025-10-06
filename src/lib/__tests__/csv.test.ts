import { describe, it, expect } from "vitest";

import { readFornecedoresCSV, readProdutosCSV } from "@/lib/csv";

describe("CSV helpers", () => {
  it("parses fornecedores with quotes and semicolon delimiter", () => {
    const csv = [
      'nome;tipo;regime;preco;ibs;cbs;is;frete',
      '"Fornecedor A";"industrial";"normal";"100,50";"5";"2";"0";"12,3"',
      "",
      '"Fornecedor B";"distribuidor";"simples";"75";"0";"0";"0";"8"',
    ].join("\n");

    const fornecedores = readFornecedoresCSV(csv);

    expect(fornecedores).toHaveLength(2);
    expect(fornecedores[0]).toMatchObject({
      nome: "Fornecedor A",
      tipo: "industrial",
      regime: "normal",
      preco: 100.5,
      ibs: 5,
      cbs: 2,
      is: 0,
      frete: 12.3,
    });
    expect(fornecedores[1]).toMatchObject({
      nome: "Fornecedor B",
      tipo: "distribuidor",
      regime: "simples",
      preco: 75,
      frete: 8,
    });
  });

  it("parses produtos e ignora linhas incompletas", () => {
    const csv = [
      "descricao,ncm,refeicao,cesta,reducao,is",
      'Produto 1,"1006.30.11",1,1,0,0',
      "Produto 2, ,0,0,0,0",
      "Produto 3,1507.90.10,0,0,1,0",
    ].join("\n");

    const produtos = readProdutosCSV(csv);

    expect(produtos).toHaveLength(2);
    expect(produtos[0]).toMatchObject({
      descricao: "Produto 1",
      ncm: "1006.30.11",
      flags: { refeicao: true, cesta: true, reducao: false, is: false },
    });
    expect(produtos[1]).toMatchObject({
      descricao: "Produto 3",
      ncm: "1507.90.10",
      flags: { reducao: true },
    });
  });
});
