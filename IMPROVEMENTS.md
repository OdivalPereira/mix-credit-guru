# Changelog e Melhorias - Mix Credit Guru

## v0.5.0 - Integracao Supabase (2025-01-07)

### Backend e Persistencia
- **Schema completo Supabase** com 9 tabelas principais:
  - `user_roles`: Sistema de permissoes (admin, moderator, user)
  - `produtos`: Catalogo com NCM e flags fiscais
  - `receitas`: Codigos de receita tributaria
  - `regras_ncm`: Regras por NCM com vigencia e overrides por UF
  - `cotacoes`: Contexto de cotacoes
  - `cotacao_fornecedores`: Fornecedores por cotacao
  - `contratos`: Price breaks, freight breaks, yield
  - `unidades_conversao`: Conversoes entre unidades
  - `unidades_yield`: Configuracao de rendimento

### Seguranca
- Row Level Security (RLS) habilitado em todas as tabelas
- Funcao `has_role()` com SECURITY DEFINER para evitar recursao
- Policies segregadas por usuario (auth.uid())
- Triggers automaticos para `updated_at`
- Indices otimizados para queries frequentes

### Tipos Enumerados
- `app_role`: admin | moderator | user
- `unit_type`: un | kg | g | l | ml | ton
- `supplier_tipo`: industria | distribuidor | produtor | atacado | varejo
- `supplier_regime`: normal | simples | presumido
- `destinacao_tipo`: A | B | C | D | E

### Proximos Passos
- Implementar autenticacao (login/signup)
- Migrar stores de localStorage para Supabase
- Criar hooks customizados para CRUD
- Adicionar sincronizacao offline/online

### Arquivos Atualizados
- `supabase/migrations/*`: Schema SQL completo
- `agent.md`: Documentacao de todas as fases
- `README.md`: Arquitetura e roadmap detalhado
- `IMPROVEMENTS.md`: Changelog estruturado

---

## v0.4.0 - Expansao de Cobertura de Testes (2025-01-07)

### Testes Unitarios Adicionados
- `ErrorBoundary.test.tsx`: Validacao de captura de erros e renderizacao de fallback
- `QuoteForm.test.tsx`: Testes de campos do formulario, validacao e submissao
- `OptimizationProgress.test.tsx`: Estados de otimizacao (idle, running, completed)
- `SupplierRow.test.tsx`: Renderizacao de fornecedores e formatacao de valores
- `useCotacaoStore.test.ts`: Logica de negocio da store de cotacoes

### Infraestrutura de Testes
- Setup global em `src/test/setup.ts` com mock de `window.matchMedia`
- Configuracao do Vitest para ambiente jsdom
- Tipos TypeScript para testing-library (`vitest.d.ts`)
- Dependencias adicionadas: `@testing-library/jest-dom`, `@testing-library/user-event`

### Impacto
- Maior confianca nas mudancas de codigo
- Deteccao precoce de regressoes
- Documentacao viva dos comportamentos esperados

---

## v0.3.0 - Otimizacoes de Performance (2025-01-07)

### Code Splitting
- Lazy loading implementado em todas as rotas principais:
  - `Cotacao`, `Catalogo`, `Cenarios`, `Regras`, `Relatorios`, `Config`
- Componente `<Suspense>` com fallback de carregamento
- **Reducao estimada de 40% no bundle inicial**

### Memoizacao Avancada
- `React.memo` aplicado em `QuoteForm` e `OptimizationProgress`
- `useMemo` para derivacao de `resultado.itens` e `numericFields`
- `useCallback` para `handleImportCSV` e `handleImportJSON`

### Impacto
- Reducao de re-renders desnecessarios
- Carregamento inicial mais rapido
- Melhor experiencia em conexoes lentas

### Arquivos Modificados
- `src/App.tsx`: Lazy loading de rotas
- `src/components/quote/QuoteForm.tsx`: Memoizacao
- `src/components/quote/OptimizationProgress.tsx`: Memoizacao
- `src/pages/Cotacao.tsx`: useMemo e useCallback

---

## v0.2.0 - Melhorias de UX na Cotacao (2025-01-07)

### Componentes Novos
- `QuoteContextSummary.tsx`: Painel compacto de contexto tributario
  - Cards com data, UF, municipio, destino, regime
  - Badges visuais para identificacao rapida

### Melhorias na Tabela de Fornecedores
- Menu de acoes agrupado (importar/exportar)
- Tooltips informativos em botoes
- Estado vazio com orientacoes para iniciantes
- Botao de otimizacao destacado

### Cards de Metricas
- Fornecedores ativos
- Melhor custo efetivo
- Credito medio disponivel
- Ultima otimizacao executada

### Alertas Inteligentes
- Exibicao condicional de restricoes
- Avisos apenas quando relevante
- Menos ruido visual

### Arquivos Modificados
- `src/components/quote/QuoteContextSummary.tsx` (novo)
- `src/pages/Cotacao.tsx`: Cards e alertas
- `src/components/quote/SupplierTable.tsx`: Menu e tooltips
- `src/components/quote/SupplierRow.tsx`: Ajustes visuais
- `src/components/Layout.tsx`: Container ajustado

---

## v0.1.0 - Base do Projeto

### Funcionalidades Core
- Parser CSV tolerante a diferentes delimitadores
- Contratos com price breaks e freight breaks
- Comparador de cenarios tributarios
- Otimizador greedy em Web Worker
- Persistencia local com Zustand

### Stack Inicial
- React 18 + TypeScript
- Vite para bundling
- shadcn/ui + Tailwind CSS
- Zustand para state management
- Vitest + Playwright para testes