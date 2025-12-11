# Mix Credit Guru

<div align="center">

![Mix Credit Guru](https://img.shields.io/badge/Mix%20Credit%20Guru-v1.0-blue)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-green)

**Ferramenta web de código aberto para navegação da reforma tributária brasileira (2026-2033)**

[Demo](https://mix-credit-guru.lovable.app) · [Documentação](https://docs.lovable.dev) · [Reportar Bug](https://github.com/seu-usuario/mix-credit-guru/issues)

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Modelo de Dados](#-modelo-de-dados)
- [Funcionalidades](#-funcionalidades)
- [Configuração do Ambiente](#-configuração-do-ambiente)
- [Executando o Projeto](#-executando-o-projeto)
- [Testes](#-testes)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Edge Functions](#-edge-functions)
- [Segurança](#-segurança)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Visão Geral

O **Mix Credit Guru** é uma plataforma completa para ajudar empresas brasileiras a navegar pela transição da reforma tributária (2026-2033). A aplicação permite:

- **Simular custos** considerando os novos tributos (IBS, CBS, IS)
- **Comparar fornecedores** para encontrar o mix ideal
- **Analisar cenários** ao longo do período de transição
- **Otimizar compras** com algoritmo inteligente
- **Gerenciar dados** fiscais, produtos e contratos

### Público-Alvo

| Perfil | Uso Principal |
|--------|---------------|
| **Fabricantes** | Análise de crédito tributário na cadeia produtiva |
| **Distribuidores** | Otimização de mix de fornecedores |
| **Prestadores de Serviço** | Simulação de impacto no custo de insumos |
| **Contadores** | Planejamento tributário para clientes |

---

## 🏗 Arquitetura

### Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   React     │  │  Zustand    │  │  TanStack   │  │   shadcn    │    │
│  │   Router    │  │   Stores    │  │   Query     │  │     UI      │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
│                              │                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
│  │  Web Worker │  │    Vite     │  │  Tailwind   │                      │
│  │ (Optimizer) │  │   (Build)   │  │    CSS      │                      │
│  └─────────────┘  └─────────────┘  └─────────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         SUPABASE / LOVABLE CLOUD                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                       EDGE FUNCTIONS (Deno)                      │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  │  │ tax-engine  │  │  optimizer  │  │    knowledge-base       │  │    │
│  │  │ (Cálculos)  │  │ (Alocação)  │  │  (Conteúdo Educativo)   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                         POSTGRESQL                               │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  │  │     RLS     │  │   Triggers  │  │       Functions         │  │    │
│  │  │  (Security) │  │ (Automação) │  │   (has_role, etc.)      │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐    │
│  │   Auth Service   │  │  Storage Buckets │  │   Realtime Sync    │    │
│  │  (Email/Google)  │  │    (Avatars)     │  │   (Subscriptions)  │    │
│  └──────────────────┘  └──────────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados - Cotação

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────────┐
│  Usuário │───▶│  QuoteWizard │───▶│  tax-engine │───▶│  Cálculo   │
│          │    │   (React)    │    │   (Edge)    │    │  Alíquotas │
└──────────┘    └──────────────┘    └─────────────┘    └────────────┘
                       │                                      │
                       ▼                                      ▼
                ┌──────────────┐    ┌─────────────┐    ┌────────────┐
                │   Zustand    │◀───│  optimizer  │◀───│ Mix Ótimo  │
                │    Store     │    │   (Edge)    │    │            │
                └──────────────┘    └─────────────┘    └────────────┘
                       │
                       ▼
                ┌──────────────┐
                │  PostgreSQL  │
                │  (Persist)   │
                └──────────────┘
```

---

## 🛠 Stack Tecnológica

### Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.3 | Framework UI |
| **TypeScript** | 5.0+ | Tipagem estática |
| **Vite** | 5.0+ | Build tool & dev server |
| **Tailwind CSS** | 3.4 | Estilização utility-first |
| **shadcn/ui** | latest | Componentes UI (Radix UI) |
| **Zustand** | 4.5 | Gerenciamento de estado global |
| **TanStack Query** | 5.x | Cache e sincronização de dados |
| **React Hook Form** | 7.x | Formulários performáticos |
| **Zod** | 3.x | Validação de schemas |
| **Recharts** | 2.x | Gráficos e visualizações |
| **React Router** | 6.x | Roteamento SPA |

### Backend (Supabase/Lovable Cloud)

| Componente | Tecnologia | Propósito |
|------------|------------|-----------|
| **Database** | PostgreSQL 15 | Persistência de dados |
| **Auth** | Supabase Auth | Autenticação (Email/Google) |
| **Storage** | Supabase Storage | Armazenamento de arquivos |
| **Edge Functions** | Deno | Lógica serverless |
| **Realtime** | WebSockets | Sincronização em tempo real |

### Qualidade & Testes

| Ferramenta | Propósito |
|------------|-----------|
| **Vitest** | Testes unitários |
| **Playwright** | Testes E2E |
| **ESLint** | Linting |
| **TypeScript** | Type checking |

---

## 📊 Modelo de Dados

### Diagrama ER

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    profiles     │       │   user_roles    │       │   fornecedores  │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK, FK)     │──┐    │ id (PK)         │       │ id (PK)         │
│ full_name       │  │    │ user_id (FK)    │───────│ user_id (FK)    │
│ avatar_url      │  │    │ role (enum)     │       │ nome            │
│ company         │  │    │ created_at      │       │ cnpj            │
│ phone           │  └────│                 │       │ tipo (enum)     │
│ created_at      │       └─────────────────┘       │ regime (enum)   │
│ updated_at      │                                 │ uf              │
└─────────────────┘                                 │ municipio       │
                                                    │ contato_*       │
                                                    │ ativo           │
                                                    └────────┬────────┘
                                                             │
┌─────────────────┐       ┌─────────────────┐                │
│    produtos     │       │    contratos    │────────────────┘
├─────────────────┤       ├─────────────────┤
│ id (PK)         │───────│ id (PK)         │
│ user_id (FK)    │       │ user_id (FK)    │
│ descricao       │       │ produto_id      │
│ ncm             │       │ fornecedor_id   │
│ unidade_padrao  │       │ preco_base      │
│ flag_refeicao   │       │ unidade         │
│ flag_cesta      │       │ price_breaks    │
│ flag_reducao    │       │ freight_breaks  │
│ flag_is         │       │ yield_config    │
└─────────────────┘       │ conversoes      │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────────┐
│    cotacoes     │       │ cotacao_fornecedores│
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │───────│ id (PK)             │
│ user_id (FK)    │       │ cotacao_id (FK)     │
│ nome            │       │ nome                │
│ produto         │       │ tipo                │
│ data_cotacao    │       │ regime              │
│ uf              │       │ preco               │
│ municipio       │       │ frete               │
│ destino         │       │ ibs                 │
│ regime          │       │ cbs                 │
│ scenario        │       │ is_aliquota         │
└─────────────────┘       │ flags_item          │
                          │ cadeia              │
                          └─────────────────────┘

┌─────────────────┐       ┌─────────────────┐
│   regras_ncm    │       │    ncm_rules    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ user_id (FK)    │
│ ncm             │       │ ncm             │
│ descricao       │       │ uf              │
│ receita_codigo  │       │ date_start      │
│ aliquota_ibs    │       │ date_end        │
│ aliquota_cbs    │       │ aliquota_ibs    │
│ aliquota_is     │       │ aliquota_cbs    │
│ overrides_uf    │       │ aliquota_is     │
│ vigencia_*      │       │ explanation_md  │
│ prioridade      │       └─────────────────┘
└─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│unidades_conversao       │  unidades_yield │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ user_id (FK)    │
│ de (enum)       │       │ entrada (enum)  │
│ para (enum)     │       │ saida (enum)    │
│ fator           │       │ rendimento      │
└─────────────────┘       └─────────────────┘
```

### Enums

| Enum | Valores |
|------|---------|
| `app_role` | `admin`, `moderator`, `user` |
| `supplier_tipo` | `industria`, `distribuidor`, `produtor`, `atacado`, `varejo` |
| `supplier_regime` | `normal`, `simples`, `presumido` |
| `destinacao_tipo` | `A`, `B`, `C`, `D`, `E` |
| `unit_type` | `un`, `kg`, `g`, `l`, `ml`, `ton` |

---

## ✨ Funcionalidades

### Módulos Principais

| Módulo | Descrição | Rota |
|--------|-----------|------|
| **Dashboard** | Visão geral com KPIs e ações rápidas | `/` |
| **Cotação** | Wizard de cotação com otimizador | `/cotacao` |
| **Cenários** | Simulador de transição 2026-2033 | `/cenarios` |
| **Cadastros** | CRUD de produtos e unidades | `/cadastros` |
| **Fornecedores** | Gestão de fornecedores e contratos | `/fornecedores-contratos` |
| **Regras** | Regras NCM com vigência e overrides | `/regras` |
| **Relatórios** | Relatórios e exportação | `/relatorios` |
| **Perfil** | Configurações do usuário | `/perfil` |
| **Admin** | Painel administrativo | `/admin` |

### Funcionalidades de Destaque

- ✅ **Autenticação** - Email/senha + Google OAuth + Recuperação de senha
- ✅ **Wizard de Cotação** - 4 etapas com validação
- ✅ **Otimizador Greedy** - Web Worker para mix ótimo
- ✅ **Simulador de Cenários** - Timeline interativa
- ✅ **Importação CSV/JSON** - Parser tolerante a erros
- ✅ **Glossário Integrado** - Termos fiscais explicados
- ✅ **Tour de Boas-vindas** - Onboarding guiado
- ✅ **Modo Escuro** - Tema claro/escuro

---

## ⚙ Configuração do Ambiente

### Pré-requisitos

- **Node.js** 18+ ou **Bun** 1.0+
- **Git**
- Conta no **Supabase** (ou Lovable Cloud)

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/mix-credit-guru.git
cd mix-credit-guru
```

### 2. Instale as Dependências

```bash
# Com npm
npm install

# Ou com Bun
bun install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# Opcional - Google OAuth
GOOGLE_CLIENT_ID=seu-google-client-id
GOOGLE_CLIENT_SECRET=seu-google-client-secret
```

### 4. Configure o Supabase

#### 4.1 Crie um novo projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Configure nome, senha e região

#### 4.2 Execute as Migrations

As migrations estão em `supabase/migrations/`. Execute-as no SQL Editor do Supabase ou via CLI:

```bash
# Instale o Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Execute migrations
supabase db push
```

#### 4.3 Configure Authentication

1. **Email/Password**: Habilitado por padrão
2. **Google OAuth**: 
   - Vá em Authentication > Providers > Google
   - Configure Client ID e Secret do Google Cloud Console
   - Adicione redirect URL: `https://seu-projeto.supabase.co/auth/v1/callback`

#### 4.4 Configure Storage (Opcional)

O bucket `avatars` já está configurado para fotos de perfil.

---

## 🚀 Executando o Projeto

### Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:5173
```

### Build para Produção

```bash
# Gere o build
npm run build

# Preview do build
npm run preview
```

### Deploy

O projeto pode ser deployado via:

- **Lovable**: Clique em "Publish" no editor
- **Vercel/Netlify**: Conecte o repositório GitHub
- **Self-hosted**: Sirva os arquivos de `dist/`

---

## 🧪 Testes

### Testes Unitários

```bash
# Execute todos os testes unitários
npm run test:unit

# Com watch mode
npm run test:unit -- --watch

# Com coverage
npm run test:unit -- --coverage
```

### Testes E2E

```bash
# Instale os browsers do Playwright
npx playwright install

# Execute os testes E2E
npm run test:e2e

# Com UI mode
npx playwright test --ui

# Gere relatório HTML
npx playwright test --reporter=html
```

### Estrutura de Testes

```
src/
├── components/__tests__/     # Testes de componentes
├── lib/__tests__/            # Testes de funções utilitárias
├── store/__tests__/          # Testes de stores Zustand
tests/
├── e2e/                      # Testes end-to-end
└── fixtures/                 # Dados de teste
```

---

## 📁 Estrutura do Projeto

```
mix-credit-guru/
├── public/                    # Arquivos estáticos
│   └── robots.txt
├── scripts/                   # Scripts de geração de dados
├── src/
│   ├── components/           # Componentes React
│   │   ├── auth/             # Componentes de autenticação
│   │   ├── cadastros/        # Componentes de cadastro
│   │   ├── dashboard/        # Componentes do dashboard
│   │   ├── donation/         # Modal de doação
│   │   ├── onboarding/       # Wizard de setup
│   │   ├── quote/            # Wizard de cotação
│   │   ├── shared/           # Componentes compartilhados
│   │   └── ui/               # shadcn/ui components
│   ├── contexts/             # React Contexts
│   │   ├── AuthContext.tsx   # Contexto de autenticação
│   │   ├── GlossaryContext   # Contexto do glossário
│   │   └── MeusDadosContext  # Contexto de dados do usuário
│   ├── data/                 # Dados estáticos
│   │   ├── rules/            # Regras NCM em JSON
│   │   ├── scenarios.ts      # Cenários de transição
│   │   └── lookups.ts        # Tabelas de lookup
│   ├── hooks/                # Custom React Hooks
│   ├── integrations/         # Integrações externas
│   │   └── supabase/         # Cliente e tipos Supabase
│   ├── lib/                  # Funções utilitárias
│   │   ├── calcs.ts          # Cálculos tributários
│   │   ├── opt.ts            # Algoritmo de otimização
│   │   ├── credit.ts         # Cálculo de crédito
│   │   ├── rates.ts          # Lookup de alíquotas
│   │   └── validation.ts     # Validações
│   ├── pages/                # Componentes de página
│   ├── services/             # Clientes de API
│   ├── store/                # Zustand stores
│   ├── workers/              # Web Workers
│   └── types/                # Tipos TypeScript
├── supabase/
│   ├── functions/            # Edge Functions (Deno)
│   │   ├── optimizer/        # Otimizador de mix
│   │   ├── tax-engine/       # Motor de cálculo fiscal
│   │   ├── knowledge-base/   # Base de conhecimento
│   │   └── ai-setup/         # Setup inteligente
│   ├── migrations/           # Migrations SQL
│   └── seeds/                # Seeds de dados
├── tests/
│   └── e2e/                  # Testes Playwright
├── .env                      # Variáveis de ambiente
├── index.html                # HTML template
├── tailwind.config.ts        # Configuração Tailwind
├── vite.config.ts            # Configuração Vite
└── package.json
```

---

## ⚡ Edge Functions

### Funções Disponíveis

| Função | Endpoint | Propósito |
|--------|----------|-----------|
| `tax-engine` | `POST /tax-engine` | Calcula alíquotas IBS, CBS e IS |
| `optimizer` | `POST /optimizer` | Encontra mix ótimo de fornecedores |
| `knowledge-base` | `GET /knowledge-base` | Retorna conteúdo educativo |
| `ai-setup` | `POST /ai-setup` | Setup inteligente com IA |

### Exemplo - tax-engine

**Request:**
```json
POST /functions/v1/tax-engine
{
  "ncm": "2106.90.10",
  "uf": "SP",
  "data": "2027-01-15",
  "destino": "A",
  "regime": "normal"
}
```

**Response:**
```json
{
  "ibs": 0.12,
  "cbs": 0.088,
  "is": 0.0,
  "reducao": 0.6,
  "explanation": "Alíquota reduzida para alimentação..."
}
```

### Deploy de Edge Functions

```bash
# Via Supabase CLI
supabase functions deploy tax-engine
supabase functions deploy optimizer

# Via Lovable
# As funções são deployadas automaticamente
```

---

## 🔒 Segurança

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado. Exemplo para `produtos`:

```sql
-- Usuários podem ver apenas seus próprios produtos
CREATE POLICY "Users can view their own produtos"
ON produtos FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem inserir apenas com seu user_id
CREATE POLICY "Users can insert their own produtos"
ON produtos FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Sistema de Roles

```sql
-- Função para verificar role
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
```

### Proteção no Frontend

```tsx
// Rota protegida (requer autenticação)
<Route path="/cotacao" element={
  <ProtectedRoute>
    <Cotacao />
  </ProtectedRoute>
} />

// Rota admin (requer role admin)
<Route path="/admin" element={
  <AdminRoute>
    <AdminPanel />
  </AdminRoute>
} />
```

---

## 🤝 Contribuindo

### Como Contribuir

1. **Fork** o repositório
2. **Clone** seu fork:
   ```bash
   git clone https://github.com/seu-usuario/mix-credit-guru.git
   ```
3. **Crie uma branch** para sua feature:
   ```bash
   git checkout -b feature/minha-feature
   ```
4. **Faça suas alterações** seguindo os padrões do projeto
5. **Escreva testes** para novas funcionalidades
6. **Commit** suas alterações:
   ```bash
   git commit -m "feat: adiciona minha feature"
   ```
7. **Push** para seu fork:
   ```bash
   git push origin feature/minha-feature
   ```
8. **Abra um Pull Request**

### Padrões de Código

- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/)
  - `feat:` nova funcionalidade
  - `fix:` correção de bug
  - `docs:` documentação
  - `refactor:` refatoração
  - `test:` testes
  
- **TypeScript**: Tipagem estrita, evite `any`
- **Componentes**: Funcionais com hooks
- **Estilização**: Tailwind CSS com design system tokens
- **Testes**: Cobertura mínima de 80% para nova lógica

### Estrutura de PRs

```markdown
## Descrição
Breve descrição da mudança

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] Sem breaking changes
```

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 🙏 Agradecimentos

- [Lovable](https://lovable.dev) - Plataforma de desenvolvimento
- [Supabase](https://supabase.com) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS

---

<div align="center">

**Desenvolvido com ❤️ para auxiliar empresas brasileiras na transição da reforma tributária**

[⬆ Voltar ao topo](#mix-credit-guru)

</div>
