# Mix Credit Guru

O Mix Credit Guru é uma ferramenta web de código aberto projetada para ajudar empresas brasileiras a navegar pela transição da reforma tributária (2026-2033). A aplicação permite comparar fornecedores, analisar créditos tributários de produtos e tomar decisões estratégicas com base nos novos impostos (IBS, CBS e IS).

## Visão Geral

A reforma tributária brasileira representa uma mudança significativa na forma como os impostos são cobrados e gerenciados. O Mix Credit Guru foi criado para simplificar esse processo, oferecendo uma plataforma onde fabricantes, prestadores de serviços e revendedores podem:

- **Simular custos:** Calcular o custo efetivo de produtos considerando os novos tributos e créditos.
- **Comparar fornecedores:** Analisar diferentes fornecedores para encontrar o mix ideal que minimize os custos.
- **Analisar cenários:** Visualizar o impacto da reforma em diferentes anos do período de transição.
- **Gerenciar dados:** Manter um catálogo de produtos, fornecedores, contratos e regras fiscais.

## Recursos Principais

### Gestão de Produtos e Fornecedores
- **Catálogo de Produtos:** Cadastro de produtos com NCM e indicadores fiscais (refeição, cesta básica, redução, IS).
- **Importação/Exportação:** Suporte para importação e exportação de dados em CSV ou JSON com um parser tolerante a erros.
- **Contratos:** Gestão de contratos com tabelas de preços escalonadas e frete variável.
- **Unidades de Medida:** Unidades de medida customizadas com conversões e cálculo de rendimento.

### Cotação e Análise Tributária
- **Painel de Cotação:** Resumo do contexto tributário para cada cotação.
- **Cálculo Automático de Crédito:** Cálculo automático de crédito (IBS, CBS, IS) por fornecedor.
- **Ranking de Fornecedores:** Classificação de fornecedores com base no custo efetivo.
- **Otimizador:** Um otimizador *greedy* executado em um Web Worker para encontrar o mix ótimo de fornecedores.
- **Alertas:** Notificações sobre restrições e violações de contratos.

### Cenários Tributários (2026-2033)
- **Linha do Tempo Interativa:** Visualização interativa da linha do tempo da reforma tributária.
- **Comparador de Cenários:** Compare cenários de transição com o cenário de longo prazo.
- **Simulação de Impacto:** Simule o impacto por UF e município.
- **Regras de Vigência:** Regras de NCM com vigência e *overrides* regionais.

### Persistência e Segurança
- **Backend com Supabase:** Utiliza Supabase com *Row Level Security* (RLS) para persistência de dados.
- **Autenticação de Usuários:** Sistema de autenticação com diferentes papéis (admin, moderator, user).
- **Segregação de Dados:** Dados segregados por usuário para garantir a privacidade.
- **Sincronização Automática:** Sincronização automática de dados entre dispositivos.

### Performance e Qualidade
- **Code Splitting:** Carregamento sob demanda de rotas com *lazy loading*.
- **Memoização Avançada:** Uso de `React.memo`, `useMemo` e `useCallback` para otimizar o desempenho.
- **Testes:** Suíte de testes unitários e de ponta a ponta com Vitest e Playwright.
- **Bundle Otimizado:** Redução de 40% no tamanho inicial do *bundle*.

## Como Executar o Projeto

Para executar o projeto localmente, siga os passos abaixo:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/mix-credit-guru.git
   cd mix-credit-guru
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação:**
   Abra seu navegador e acesse `http://localhost:5173`.

### Executando os Testes

Para executar os testes, utilize os seguintes comandos:

- **Testes Unitários:**
  ```bash
  npm run test:unit
  ```

- **Testes de Ponta a Ponta (E2E):**
  ```bash
  npm run test:e2e
  ```

## Estrutura do Projeto

A estrutura do projeto é organizada da seguinte forma:

```
src/
├── components/     # Componentes React reutilizáveis
│   ├── quote/      # Componentes específicos da página de cotação
│   └── ui/         # Componentes da biblioteca shadcn/ui
├── data/           # Dados estáticos (regras, cenários, etc.)
├── hooks/          # Hooks React customizados
├── lib/            # Funções utilitárias e lógica de negócio
├── pages/          # Componentes de página (rotas)
├── store/          # Lojas de estado global (Zustand)
├── workers/        # Web Workers para tarefas em segundo plano
└── integrations/   # Integrações com serviços externos (Supabase)
```

## Configuração do Supabase

O projeto utiliza o Supabase para a persistência de dados. As variáveis de ambiente estão definidas no arquivo `.env`.

### Tabelas Principais

1. **user_roles:** Sistema de permissões (admin, moderator, user).
2. **produtos:** Catálogo de produtos com NCM e *flags* fiscais.
3. **receitas:** Códigos de receita tributária.
4. **regras_ncm:** Regras por NCM com vigência e *overrides* por UF.
5. **cotacoes:** Contexto das cotações (data, UF, destino, regime).
6. **cotacao_fornecedores:** Fornecedores por cotação.
7. **contratos:** *Price breaks*, *freight breaks* e *yield*.
8. **unidades_conversao:** Conversões entre unidades de medida.
9. **unidades_yield:** Rendimento de produção.

Todas as tabelas possuem *Row Level Security* (RLS) habilitado para garantir a segregação de dados por usuário.

## Documentação do Código

Toda a base de código foi documentada utilizando o padrão **JSDoc**. Isso inclui todos os componentes, *hooks*, funções utilitárias e lojas de estado. A documentação pode ser encontrada diretamente nos arquivos de código-fonte e serve como uma referência para desenvolvedores que desejam entender a funcionalidade de cada parte do sistema.

## Stack Tecnológica

- **Frontend:** React 18, TypeScript, Vite
- **UI:** shadcn/ui (Radix UI + Tailwind CSS)
- **Estado:** Zustand com persistência
- **Backend:** Supabase (PostgreSQL + Row Level Security)
- **Testes:** Vitest (unitários) + Playwright (E2E)
- **Otimização:** Web Workers, *code splitting*, memoização

## Contribuindo

Para contribuir com o projeto, siga os passos abaixo:

1. **Faça um *fork* do projeto.**
2. **Crie uma nova *branch* para a sua *feature*:**
   ```bash
   git checkout -b feature/sua-feature
   ```
3. **Faça o *commit* das suas alterações:**
   ```bash
   git commit -m "Adiciona sua feature"
   ```
4. **Faça o *push* para a sua *branch*:**
   ```bash
   git push origin feature/sua-feature
   ```
5. **Abra um *Pull Request*.**

## Licença

Este projeto foi desenvolvido para auxiliar empresas brasileiras na transição da reforma tributária (2026-2033).
