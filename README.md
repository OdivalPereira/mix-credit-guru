# Mix Credit Guru

Aplicativo para comparar fornecedores e analisar créditos tributários de produtos, auxiliando empresas durante a reforma tributária brasileira.

## Funcionalidades atuais
- **Catálogo de produtos**: gerencie itens com código NCM e indicadores fiscais, importando ou exportando dados em CSV.
- **Cotação de fornecedores**: calcule IBS, CBS, IS e custo efetivo, com ranking de fornecedores e suporte a importação/exportação.
- **Cenários tributários**: visualize o impacto da reforma em diferentes anos.
- **Regras de crédito**: consulte matriz de creditabilidade e glossário de termos.
- **Configurações e relatórios** adicionais para estudos fiscais.

## Guia de uso

### Regras de crédito (JSON)
- Acesse a página **Regras** para editar a matriz de creditabilidade.
- Utilize **Importar JSON** para carregar um arquivo no formato:

```json
[
  {
    "ncm": "0000.00.00",
    "descricao": "Produto",
    "receita": { "codigo": "01", "descricao": "Exemplo" },
    "aliquotas": { "ibs": 0, "cbs": 0, "is": 0 }
  }
]
```
- Use **Exportar JSON** para salvar as regras atuais ou **Recarregar regras** para restaurar o arquivo padrão.

### Cenários tributários
- Na página **Cenários** selecione o período desejado no menu suspenso.
- O cenário escolhido é aplicado nos cálculos e permanece salvo entre sessões.

### Receitas
- Em **Receitas** cadastre códigos e descrições para montar o mix.
- Os três fornecedores com menor custo efetivo são usados para calcular custos por porção.

### Relatórios
- Após realizar uma cotação, acesse **Relatórios** e clique em **Imprimir/Salvar PDF** para gerar um relatório com fornecedores vencedores, comparativo de custos e receitas cadastradas.

### Importação e exportação
- **Regras de crédito**: botões de importação/exportação em JSON na própria página.
- **Catálogo de produtos**: importação/exportação em CSV (colunas `descricao,ncm,refeicao,cesta,reducao,is`).
- **Cotação de fornecedores**: importação/exportação em CSV ou JSON contendo contexto e fornecedores.

### Conversões de unidade e yield
- Acesse **Unidades & Conversões** para cadastrar fatores entre unidades como `kg → g` ou `l → ml` e definir o fator de multiplicação aplicado nos cálculos.
- Utilize o botão **Nova conversão** para informar unidade de origem, destino e fator numérico. Conversões podem ser removidas individualmente na tabela.
- Na mesma tela é possível cadastrar configurações de **yield/rendimento** que relacionam uma unidade de entrada (ex.: `kg`) com a unidade de saída comercializada (ex.: `un`) e o rendimento esperado.
- Rendimentos cadastrados são utilizados tanto nas normalizações exibidas no comparador de cenários quanto nos contratos de fornecedores para ajustar o custo efetivo.

### Contratos com degraus e faixas de frete
- Em **Contratos** cadastre fornecedores informando SKU, unidade principal, preço base e as conversões específicas do contrato.
- Utilize **Adicionar degrau** para criar faixas de quantidade com preços diferenciados (`priceBreaks`); cada degrau exige quantidade mínima múltipla do passo configurado.
- Registre **Faixas de frete** para modelar cobranças logísticas escalonadas com base no volume adquirido.
- Para cada contrato é possível associar um yield dedicado (entrada, saída e rendimento) aproveitando as conversões cadastradas, garantindo que o otimizador normaliza todos os custos com a mesma unidade de comparação.

### Restrições e preferências de otimização
- Ao exportar o JSON de contratos ou cenários, utilize a propriedade `prefs` do objeto `CompareRequest` para informar o objetivo (`custo` ou `credito`), o número máximo de fornecedores vencedores e a lista de `constraints` com limites mínimo/máximo por fornecedor.
- As ofertas enviadas ao otimizador (estrutura `Offer` em `src/lib/opt.ts`) aceitam atributos como `moq`, `step`, `capacity` e `share`; já o campo `budget` pode ser informado no payload para limitar o gasto total.
- Ajustar essas preferências ajuda a simular cenários conservadores (por exemplo limitar exposição a um fornecedor específico) ou agressivos (maximizando crédito fiscal mesmo com degraus mais caros).

### Comparador de cenários
- A página **Comparar cenários** permite escolher dois cenários salvos e analisá-los lado a lado, exibindo totais normalizados e o fornecedor vencedor por item.
- Use os seletores de **Cenário base** e **Cenário comparação** para alternar combinações rapidamente, e o botão **Recalcular custo normalizado** para aplicar novamente conversões e rendimentos após ajustes em contratos ou unidades.
- O resumo financeiro mostra variação absoluta e percentual entre os cenários e sinaliza alertas de restrição identificados durante a otimização.

### Violações retornadas pelo otimizador
- Ao executar a otimização, o motor retorna uma lista de `violations` sempre que alguma condição não pôde ser atendida integralmente.
- As mensagens destacam situações como `degrau não atendido` (quantidade mínima do degrau não alcançada), `MOQ não atendido`, `Capacidade insuficiente`, `Orçamento insuficiente` ou `Participação insuficiente` quando limites de share são violados.
- Utilize esses alertas para revisar contratos, ajustar quantidades mínimas ou ampliar orçamento antes de confirmar o mix recomendado.

### Persistência
O estado é armazenado no `localStorage` usando as chaves:

- `cmx_v03_app`: cenário, regras e receitas.
- `cmx_v03_catalogo`: catálogo de produtos.
- `cmx_v03_cotacao`: dados de cotação e fornecedores.

## Scripts
Para instalar dependências e executar o projeto localmente:

```bash
npm i
npm run dev
npm run test
npm run test:unit
npm run test:e2e
```

- Os testes unitários são escritos com **Vitest** (pasta `src/lib/__tests__` e `src/store/__tests__`). Utilize `npm run test:unit` para executá-los em modo batch.
- Os testes de ponta a ponta usam **Playwright** (pasta `tests/e2e`). Rode `npm run test:e2e` para validar os fluxos principais pelo navegador controlado.

## Principais dependências
- React
- Zustand
- shadcn/ui (Radix UI)
- React Router
- @tanstack/react-query
- Supabase
- Tailwind CSS
- Vite
- Vitest

## Como posso editar este código?
Há várias maneiras de editar sua aplicação.

### Usando o Lovable
Acesse o [projeto no Lovable](https://lovable.dev/projects/d1d85843-2938-403f-ad05-864d69c4c33d) e comece a editar. As alterações feitas via Lovable são automaticamente commitadas neste repositório.

### Usando seu IDE preferido
Clone este repositório, faça mudanças localmente e envie os commits:

```sh
# Clonar o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instalar dependências
npm i

# Rodar o servidor de desenvolvimento
npm run dev
```

### Editando direto no GitHub
- Navegue até o arquivo desejado e clique em "Edit".
- Faça as alterações e realize o commit.

### Usando GitHub Codespaces
- Clique no botão "Code" e abra um novo Codespace.
- Edite os arquivos e envie suas alterações quando terminar.
