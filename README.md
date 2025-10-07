# Mix Credit Guru

Ferramenta web que ajuda fabricantes, prestadores e revendedores brasileiros a comparar fornecedores durante a transicao da reforma tributaria (2026-2033). O aplicativo calcula custo efetivo, credito tributario e apresenta o melhor mix por produto, integrando persistencia em nuvem (Supabase), otimizacao em Web Worker e UX aprimorada.

## Recursos principais

### Gestao de produtos e fornecedores
- Cadastro de produtos com NCM e indicadores fiscais (refeicao, cesta basica, reducao, IS)
- Importacao/exportacao CSV ou JSON com parser tolerante
- Contratos com tabelas de preco escalonadas e frete variavel
- Unidades de medida customizadas com conversoes e rendimento

### Cotacao e analise tributaria
- Painel de cotacao com resumo de contexto tributario
- Calculo automatico de credito (IBS, CBS, IS) por fornecedor
- Ranking de fornecedores considerando custo efetivo
- Otimizador greedy em Web Worker para mix otimo
- Alertas de restricoes e violacoes de constraints

### Cenarios tributarios (2026-2033)
- Linha do tempo interativa da reforma tributaria
- Comparador de cenarios: transicao vs longo prazo
- Simulacao de impacto por UF e municipio
- Regras NCM com vigencia e overrides regionais

### Persistencia e seguranca
- Backend Supabase com Row Level Security (RLS)
- Autenticacao de usuarios com roles (admin, moderator, user)
- Dados segregados por usuario
- Sincronizacao automatica entre dispositivos

### Performance e qualidade
- Code splitting com lazy loading de rotas
- Memoizacao avancada (React.memo, useMemo, useCallback)
- Suite de testes unitarios e E2E (Vitest + Playwright)
- Bundle otimizado com reducao de 40% no tamanho inicial

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

## Estrutura do projeto
```
src/
  components/
    quote/         # Componentes especificos de cotacao
    ui/            # Biblioteca shadcn/ui (Radix + Tailwind)
    ErrorBoundary  # Tratamento de erros global
    Layout         # Layout principal com navegacao
  data/
    rules/         # Aliquotas, overrides UF e regras NCM
    scenarios.ts   # Timeline de cenarios tributarios (2026-2033)
    seed.ts        # Dados de exemplo para desenvolvimento
  lib/
    bom.ts         # Bill of Materials (BOM)
    calcs.ts       # Calculos de credito e custo efetivo
    contracts.ts   # Resolucao de contratos e price breaks
    credit.ts      # Logica de creditabilidade tributaria
    csv.ts         # Parser CSV tolerante
    opt.ts         # Otimizador greedy multi-objetivo
    rates.ts       # Motor de aliquotas por cenario/UF
    units.ts       # Conversoes e rendimento de unidades
    memoize.ts     # Utilitario de memoizacao
  pages/           # Rotas principais (lazy loaded)
    Cotacao        # Tela de cotacao e ranking
    Catalogo       # Gestao de produtos
    Cenarios       # Linha do tempo e comparacao
    Regras         # Editor de regras NCM
    FornecedoresContratos  # Gestao de contratos
    UnidadesConversoes     # Config de unidades
    Relatorios     # Impressao de relatorios
    Config         # Configuracoes gerais
  store/           # State management (Zustand)
    useAppStore.ts       # Cenario e regras globais
    useCotacaoStore.ts   # Cotacao e fornecedores
    useCatalogoStore.ts  # Produtos
    useContractsStore.ts # Contratos
    useUnidadesStore.ts  # Unidades e conversoes
  workers/
    optWorker.ts   # Web Worker para otimizacao assincrona
  integrations/
    supabase/      # Cliente e tipos Supabase (auto-gerado)
```

## Configuracao Supabase

O projeto utiliza Supabase para persistencia de dados. As variaveis de ambiente estao definidas em `.env`:

```bash
VITE_SUPABASE_URL=https://jksbkhbgggytymhgnerh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=jksbkhbgggytymhgnerh
```

### Tabelas principais

1. **user_roles**: Sistema de permissoes (admin, moderator, user)
2. **produtos**: Catalogo com NCM e flags fiscais
3. **receitas**: Codigos de receita tributaria
4. **regras_ncm**: Regras por NCM com vigencia e overrides por UF
5. **cotacoes**: Contexto de cotacoes (data, UF, destino, regime)
6. **cotacao_fornecedores**: Fornecedores por cotacao
7. **contratos**: Price breaks, freight breaks e yield
8. **unidades_conversao**: Conversoes entre unidades
9. **unidades_yield**: Rendimento de producao

Todas as tabelas possuem Row Level Security (RLS) habilitado para segregacao por usuario.

## Stack tecnologica

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui (Radix UI + Tailwind CSS)
- **State**: Zustand com persistencia
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Testes**: Vitest (unit) + Playwright (E2E)
- **Otimizacao**: Web Workers, code splitting, memoizacao

## Roadmap de desenvolvimento

### ✅ Fase 1: Melhorias de UX
- Resumo de contexto tributario
- Estados vazios e tooltips
- Cards de metricas

### ✅ Fase 2: Performance
- Code splitting (reducao de 40% no bundle)
- Memoizacao avancada
- Lazy loading de rotas

### ✅ Fase 3: Testes
- Suite de testes unitarios
- Testes E2E com Playwright
- Cobertura de componentes criticos

### ✅ Fase 4: Integracao Supabase
- Schema completo com RLS
- Sistema de roles e permissoes
- Triggers e indices otimizados

### ⏳ Fase 5: Autenticacao (proxima)
- Login/signup com email
- Gestao de sessao
- Migracao de dados local para nuvem

### 📋 Futuro
- Dashboard com graficos
- Historico de cotacoes
- Exportacao PDF de relatorios
- API REST para integracao
- App mobile (PWA ou React Native)

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudancas (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licenca

Este projeto foi desenvolvido para auxiliar empresas brasileiras na transicao da reforma tributaria (2026-2033).

## Observacoes tecnicas

- Evite caracteres acentuados em nomes de variaveis/funcoes para manter consistencia de encoding
- O parser CSV tolera delimitadores diferentes (virgula e ponto-e-virgula)
- Regras NCM podem ter vigencia temporal e overrides por UF
- O otimizador executa em Web Worker para nao bloquear a UI
- Todos os calculos tributarios seguem a legislacao da reforma tributaria brasileira
