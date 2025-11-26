# Edge Functions Testing Guide

Este guia explica como testar as Edge Functions do Mix Credit Guru.

## Arquitetura de Backend

O sistema utiliza 3 Supabase Edge Functions:

1. **tax-engine**: Calcula impostos (IBS, CBS, IS) baseado em NCM e localização
2. **optimizer**: Otimiza alocação de fornecedores usando algoritmo greedy
3. **knowledge-base**: Serve conteúdo educacional contextual

## Fluxo de Dados

```
┌─────────────┐
│ Admin Panel │ → Cria regras fiscais em ncm_rules
└─────────────┘
       ↓
┌─────────────┐
│  Cotação    │ → Preenche contexto (UF, produto, data)
└─────────────┘
       ↓
┌─────────────┐
│calcular()   │ → enrichSuppliersWithTaxes()
└─────────────┘
       ↓
┌─────────────┐
│ tax-engine  │ → Busca regra em ncm_rules e calcula impostos
└─────────────┘
       ↓
┌─────────────┐
│ optimizer   │ → Otimiza mix de fornecedores
└─────────────┘
```

## Testes Automatizados

### 1. Testes Diretos (edge-functions-direct.spec.ts)

Testa as Edge Functions diretamente via HTTP:

```bash
npm run test:e2e -- edge-functions-direct
```

**Cobertura:**
- ✅ tax-engine com regra válida
- ✅ tax-engine sem regra (fallback)
- ✅ tax-engine com campos faltando
- ✅ optimizer com alocação simples
- ✅ optimizer com MOQ constraints
- ✅ knowledge-base com chave válida
- ✅ knowledge-base com chave inválida

### 2. Testes de Fluxo Completo (admin-cotacao-flow.spec.ts)

Testa o fluxo completo através da UI:

```bash
npm run test:e2e -- admin-cotacao-flow
```

**Cobertura:**
- ✅ Admin Panel → Criar regra
- ✅ Cotação → Preencher contexto
- ✅ Cotação → Adicionar fornecedor
- ✅ Cotação → Calcular (chama tax-engine)
- ✅ Cotação → Otimizar (chama optimizer)
- ✅ Admin Panel → Deletar regra

## Testes Manuais

### Setup Inicial

1. **Criar usuário admin:**
   ```sql
   -- No SQL Editor do Supabase
   INSERT INTO user_roles (user_id, role) 
   VALUES ('<seu-user-id>', 'admin');
   ```

2. **Fazer login na aplicação**

### Teste 1: Admin Panel

1. Navegar para `/admin`
2. Verificar que o painel carrega
3. Preencher formulário:
   - NCM: `1006.30.11` (Arroz)
   - UF: `SP`
   - IBS: `8.5%`
   - CBS: `5.5%`
   - IS: `0%`
   - Start Date: Data atual
   - Explanation: `Arroz beneficiado em São Paulo - Redução parcial`
4. Clicar "Add Rule"
5. Verificar que regra aparece na lista

### Teste 2: Tax Engine via Cotação

1. Navegar para `/cotacao`
2. Preencher contexto:
   - Produto: `Arroz Branco`
   - UF: `SP`
   - Data: Data atual
3. Adicionar fornecedor:
   - Nome: `Fornecedor Teste`
   - Preço: `100.00`
   - NCM: `1006.30.11`
4. Clicar "Calcular"
5. **Verificar no Network Tab:**
   - Chamada para `tax-engine` foi feita
   - Response contém `rates: { ibs: 8.5, cbs: 5.5, is: 0 }`
   - Response contém `explanation` com texto da regra

### Teste 3: Optimizer

1. Na mesma cotação, adicionar mais fornecedores:
   - Fornecedor A: Preço `95.00`
   - Fornecedor B: Preço `102.00`
   - Fornecedor C: Preço `98.50`
2. Clicar "Otimizar"
3. **Verificar no Network Tab:**
   - Chamada para `optimizer` foi feita
   - Response contém `allocation` (distribuição)
   - Response contém `cost` (custo total)
   - Fornecedor mais barato (A) recebeu 100% da alocação

## Debugging

### Ver Logs das Edge Functions

**Via Supabase Dashboard:**
1. https://supabase.com/dashboard/project/jksbkhbgggytymhgnerh/functions
2. Selecionar função (tax-engine, optimizer, knowledge-base)
3. Clicar na aba "Logs"

**Via CLI:**
```bash
supabase functions logs tax-engine
supabase functions logs optimizer
supabase functions logs knowledge-base
```

### Logs Comuns

**tax-engine success:**
```
GET /tax-engine
{ ncm: "1006.30.11", uf_destino: "SP", valor: 1000 }
→ { rates: { ibs: 8.5, cbs: 5.5, is: 0 }, ... }
```

**tax-engine no rule found:**
```
GET /tax-engine
{ ncm: "9999.99.99", uf_destino: "RJ", valor: 500 }
→ { rates: { ibs: 0, cbs: 0, is: 0 }, explanation: "No tax rule found..." }
```

**optimizer success:**
```
POST /optimizer
{ quantity: 100, offers: [...] }
→ { allocation: { supplier1: 100 }, cost: 950, violations: [] }
```

### Troubleshooting

#### Edge Function não está sendo chamada

1. **Verificar se função foi deployed:**
   ```bash
   supabase functions list
   ```

2. **Verificar logs de build:**
   - Verificar console do navegador
   - Verificar erros TypeScript

3. **Verificar chamada está usando método correto:**
   ```typescript
   // ✅ CORRETO
   supabase.functions.invoke('tax-engine', { body: {...} })
   
   // ❌ ERRADO
   fetch('/functions/tax-engine', ...)
   ```

#### Erro 401 Unauthorized

- Verificar que `SUPABASE_ANON_KEY` está correta
- Verificar headers de CORS no edge function

#### Erro 404 Not Found

- Verificar nome da função (deve ser exatamente `tax-engine`, `optimizer`, `knowledge-base`)
- Verificar que função foi deployed

#### Database RLS Error

- Verificar que usuário está autenticado
- Verificar políticas RLS na tabela `ncm_rules`

## Próximos Passos

- [ ] Adicionar testes de performance (stress test)
- [ ] Adicionar testes de concorrência
- [ ] Adicionar monitoramento de latência
- [ ] Implementar cache de regras fiscais
- [ ] Adicionar versionamento de regras
