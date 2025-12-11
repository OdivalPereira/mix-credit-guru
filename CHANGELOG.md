# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Adicionado
- Documentação técnica completa no README.md
- Guia de contribuição (CONTRIBUTING.md)
- Este arquivo CHANGELOG.md

---

## [1.0.0] - 2024-12-11

### Adicionado

#### Autenticação
- Login com email/senha via Supabase Auth
- Login social com Google OAuth
- Recuperação de senha por email
- Proteção de rotas (`ProtectedRoute`, `AdminRoute`)
- Sistema de roles (`admin`, `moderator`, `user`)

#### Dashboard
- Página inicial com KPIs e métricas
- Cards de progresso com animações
- Ações rápidas para navegação
- Indicadores de tendência

#### Cotação
- Wizard de cotação em 4 etapas
- Formulário de contexto (produto, UF, destino, regime)
- Tabela de fornecedores com ranking
- Cálculo automático de crédito (IBS, CBS, IS)
- Otimizador greedy para mix ótimo
- Comparação de cenários lado a lado
- Exportação de resultados

#### Cenários
- Timeline interativa da reforma (2026-2033)
- Simulador de transição por ano
- Comparador de cenários
- Visualização de impacto por UF

#### Cadastros
- CRUD de produtos com NCM e flags fiscais
- Gestão de unidades de medida
- Conversões entre unidades
- Configuração de rendimento (yield)

#### Fornecedores e Contratos
- Cadastro de fornecedores com dados de contato
- Gestão de contratos por produto
- Tabelas de preço escalonadas (price breaks)
- Frete variável por quantidade (freight breaks)

#### Regras Fiscais
- Regras por NCM com vigência
- Overrides regionais por UF
- Importação/exportação JSON
- Priorização de regras

#### Infraestrutura
- Backend Supabase com RLS completo
- Edge Functions (tax-engine, optimizer, knowledge-base)
- Web Worker para otimização pesada
- Sincronização em tempo real

#### UX/UI
- Design responsivo mobile-first
- Tema claro/escuro
- Glossário integrado de termos fiscais
- Tour de boas-vindas para novos usuários
- Toasts e notificações
- Loading states e skeletons

#### Qualidade
- Testes unitários com Vitest
- Testes E2E com Playwright
- TypeScript estrito
- ESLint configurado

### Segurança
- Row Level Security em todas as tabelas
- Segregação de dados por usuário
- Autenticação JWT via Supabase
- Políticas de storage para avatares

---

## [0.9.0] - 2024-11-15

### Adicionado
- Módulo de relatórios básico
- Página de perfil do usuário
- Upload de avatar
- Configurações de conta

### Alterado
- Refatoração do QuoteWizard para melhor performance
- Melhoria na validação de formulários com Zod

### Corrigido
- Bug no cálculo de crédito para regime Simples
- Problema de layout no mobile para tabela de fornecedores

---

## [0.8.0] - 2024-10-20

### Adicionado
- Edge Function `optimizer` para cálculo de mix ótimo
- Edge Function `tax-engine` para cálculos tributários
- Web Worker para otimização client-side
- Memoização avançada com `useMemo` e `useCallback`

### Alterado
- Migração de cálculos pesados para Edge Functions
- Otimização de bundle com code splitting

### Removido
- Cálculos síncronos no main thread

---

## [0.7.0] - 2024-09-25

### Adicionado
- Wizard de cotação completo
- Tabela de fornecedores com ordenação
- Cálculo de custo efetivo
- Indicadores de crédito por fornecedor

### Alterado
- Redesign da página de cotação
- Melhoria na UX do formulário

---

## [0.6.0] - 2024-09-01

### Adicionado
- Módulo de cenários tributários
- Timeline interativa 2026-2033
- Comparador de cenários
- Gráficos com Recharts

### Corrigido
- Erro de timezone em datas de vigência

---

## [0.5.0] - 2024-08-10

### Adicionado
- CRUD de produtos
- CRUD de fornecedores
- Gestão de contratos
- Importação CSV com parser tolerante

### Alterado
- Migração para Zustand para estado global
- Persistência local com localStorage

---

## [0.4.0] - 2024-07-15

### Adicionado
- Integração completa com Supabase
- Sistema de autenticação
- Row Level Security
- Migrations iniciais

### Segurança
- Implementação de RLS em todas as tabelas
- Políticas de acesso por user_id

---

## [0.3.0] - 2024-06-20

### Adicionado
- Estrutura base do projeto
- Configuração Vite + React + TypeScript
- Setup Tailwind CSS
- Componentes shadcn/ui base

---

## [0.2.0] - 2024-06-01

### Adicionado
- Protótipo de navegação
- Layout principal com sidebar
- Páginas placeholder

---

## [0.1.0] - 2024-05-15

### Adicionado
- Inicialização do projeto
- Configuração inicial do repositório
- README básico

---

## Tipos de Mudanças

- `Adicionado` para novas funcionalidades
- `Alterado` para mudanças em funcionalidades existentes
- `Descontinuado` para funcionalidades que serão removidas
- `Removido` para funcionalidades removidas
- `Corrigido` para correções de bugs
- `Segurança` para correções de vulnerabilidades

---

[Unreleased]: https://github.com/seu-usuario/mix-credit-guru/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/seu-usuario/mix-credit-guru/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/seu-usuario/mix-credit-guru/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/seu-usuario/mix-credit-guru/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/seu-usuario/mix-credit-guru/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/seu-usuario/mix-credit-guru/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/seu-usuario/mix-credit-guru/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/seu-usuario/mix-credit-guru/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/seu-usuario/mix-credit-guru/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/seu-usuario/mix-credit-guru/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/seu-usuario/mix-credit-guru/releases/tag/v0.1.0
