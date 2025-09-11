# Mix Credit Guru

Aplicativo para comparar fornecedores e analisar créditos tributários de produtos, auxiliando empresas durante a reforma tributária brasileira.

## Funcionalidades atuais
- **Catálogo de produtos**: gerencie itens com código NCM e indicadores fiscais, importando ou exportando dados em CSV.
- **Cotação de fornecedores**: calcule IBS, CBS, IS e custo efetivo, com ranking de fornecedores e suporte a importação/exportação.
- **Cenários tributários**: visualize o impacto da reforma em diferentes anos.
- **Regras de crédito**: consulte matriz de creditabilidade e glossário de termos.
- **Configurações e relatórios** adicionais para estudos fiscais.

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
