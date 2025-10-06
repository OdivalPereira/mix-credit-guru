# Change log resumido

## Refino das bases
- Correcoes de tipos em `src/lib/units.ts` e `src/pages/Catalogo.tsx`.
- Componentizacao da pagina de cotacao com `QuoteForm`, `SupplierRow`, `SupplierTable` e `OptimizationProgress`.
- Error boundary global com fallback amigavel.
- Otimizacoes de performance: uso consistente de `useCallback`, `useMemo`, `React.memo` e configuracao do `QueryClient`.

## Validações e UX
- Validacao do formulario de cotacao com React Hook Form + Zod.
- Mensagens de erro padronizadas e sincronizacao com Zustand.
- Progress bar para monitorar a otimizacao.

## Testes
- Suite Vitest cobrindo componentes principais, stores e funcoes de negocio.
- Setup de `@testing-library/jest-dom`, `user-event` e `window.matchMedia` mockado.
- Playwright para fluxos ponta a ponta.

## Proximos passos sugeridos
- Persistir dados de catalogo/contratos em Supabase.
- Autenticacao e historico de cotacoes.
- Exportacao de relatorios com layout final.
