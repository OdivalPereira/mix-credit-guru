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
    "aliquotas": { "ibs": 0, "cbs": 0, "is": 0 },
    "validFrom": "2024-01-01",
    "validTo": "2024-12-31"
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

### Persistência
O estado é armazenado no `localStorage` usando as chaves:

- `cmx_v04_app`: cenário, regras (effective-dated) e receitas.
- `cmx_v04_catalogo`: catálogo de produtos.
- `cmx_v04_cotacao`: dados de cotação, fornecedores e preferências.

## Scripts
Para instalar dependências e executar o projeto localmente:

```bash
npm i
npm run dev
npm run test
```

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
