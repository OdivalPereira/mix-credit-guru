# Protocolo de Coordenação - Equipe Antigravity

Este arquivo controla o fluxo de trabalho da equipe de agentes do Mix Credit Guru.

**Regra de Ouro**: Apenas o agente com o status **[ACTIVE]** deve executar ações. Os outros devem aguardar. Ao terminar sua tarefa, o agente deve atualizar este arquivo passando o token **[ACTIVE]** para o próximo responsável.

---

## Status da Equipe

| Agente | Status | Tarefa Atual |
| :--- | :--- | :--- |
| **Arquiteto** | [WAITING] | Monitorar implementação. |
| **Frontend** | [WAITING] | Aguardando novos requisitos. |
| **Backend** | [WAITING] | Aguardando diretrizes. |
| **QA** | [WAITING] | QA da Fase 4 concluído. Aguardando nova versão. |

---

## Backlog de Implementação (Roadmap)

### Fase 1: Fundação Híbrida & Hidratação
- [x] **Arquiteto**: Definir o schema JSON exato que o Backend deve enviar para o Frontend (Hydration Payload).
- [x] **Backend**: Criar Edge Function (ou endpoint) `get-tax-rules` que retorna o payload otimizado.
- [x] **Frontend**: Implementar serviço de `HydrationService` que busca e salva no IndexedDB/LocalStorage.
- [x] **Frontend**: Atualizar `useCotacaoStore` para ler do LocalStorage ao invés dos JSONs estáticos.

### Fase 2: Performance e Limites
- [x] **Frontend**: Implementar verificação de limites (ex: máx. 50 fornecedores no plano Free).
- [x] **QA**: Testar o comportamento da app quando o limite é atingido.

### Fase 3: Contexto Global & Templates
- [x] **Frontend**: Criar UI em `/config` para "Regime Global".
- [x] **Frontend**: Adicionar botão de "Download Template" na tela de Importação.

### Fase 4: Modo Demo (Sem Cadastro)
- [x] **Frontend**: Atualizar `AuthContext` com estado `isDemo` e função `enterDemoMode`.
- [x] **Frontend**: Ajustar `ProtectedRoute` para permitir acesso se `isDemo` for verdadeiro.
- [x] **Frontend**: Adicionar botão "Testar sem cadastro" na tela de Login (`/auth`).
- [x] **Frontend**: Criar componente `AuthGate` (ou lógica equivalente) para bloquear ações.
- [x] **Frontend**: Proteger ações de criação/importação na `SupplierTable` e popular dados de exemplo.

---

## Log de Execução

*   **[2025-12-16] Arquiteto**: Equipe inicializada. Aguardando primeira análise do plano.
*   **[2025-12-16] QA**: Roadmap de implementação (Fases 1, 2 e 3) concluído e verificado com sucesso.
*   **[2025-12-16] Frontend**: Fase 4 (Demo Mode) implementada. Restrições e dados de exemplo adicionados. Entregue para QA.
