# Mix Credit Guru

Ferramenta web que ajuda fabricantes, prestadores e revendedores brasileiros a comparar fornecedores durante a transicao da reforma tributaria. O aplicativo calcula custo efetivo, credito tributario e apresenta o melhor mix por produto utilizando dados locais (Zustand + localStorage) e otimizacao em Web Worker.

## Recursos principais
- Cadastro de produtos com NCM e indicadores fiscais.
- Painel de cotacao com importacao/exportacao CSV ou JSON, ranking e simulacao otimizada.
- Linha do tempo de cenarios tributarios conectada ao motor de aliquotas.
- Editor de regras (JSON) com vigencia, creditos e sobreposicoes por UF.
- Telas de contratos, unidades e comparador de cenarios para normalizar custos e validar mixes.
- Relatorios impressos e memoria local persistida.

## Como executar
```bash
npm install
npm run dev
```

Executar testes:
```bash
npm run test:unit
npm run test:e2e
```

## Estrutura
```
src/
  components/      # UI reutilizavel (shadcn) e widgets de cotacao
  data/            # Arquivos de aliquotas, overrides e seeds
  lib/             # Calculos de creditos, taxas, otimizador e utilitarios
  pages/           # Telas principais (cotacao, catalogo, regras, etc.)
  store/           # Stores Zustand com persistencia local
  workers/         # Web worker para a otimizacao greedy
```

## Configuracao Supabase
Defina no arquivo `.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```
Se os valores estiverem ausentes o cliente nao sera instanciado e uma mensagem de aviso sera exibida no console.

## Notas
- Projeto Vite + React 18 + TypeScript.
- UI baseada em shadcn/ui (Radix) e Tailwind.
- Testes com Vitest e Playwright.
- Evite caracteres acentuados ao editar arquivos para manter consistencia de encoding.
