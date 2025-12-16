---
description: Executa um ciclo de trabalho da equipe de agentes (Arquiteto -> Devs -> QA)
---

Para executar a equipe configurada no `antigravity.config.json` e coordenada pelo `team_coordination.md`, siga este loop:

1.  **Ler Status**: Verifique o arquivo `team_coordination.md` para identificar qual agente está **[ACTIVE]**.
2.  **Identificar Tarefa**: Leia a coluna "Tarefa Atual" e o "Backlog de Implementação" para saber o que deve ser feito.
3.  **Executar (Roleplay)**:
    *   Assuma a persona do agente ativo (leia suas instruções no `antigravity.config.json`).
    *   Realize o trabalho (criar arquivos, rodar comandos, editar código).
4.  **Atualizar Status**:
    *   Edite o `team_coordination.md`.
    *   Marque o item do backlog como concluído `[x]`.
    *   Mude o status do agente atual para `[WAITING]`.
    *   Defina o próximo agente lógico como **[ACTIVE]** e atribua a próxima tarefa do backlog.

**Exemplo de Comando**: "Antigravity, execute o próximo ciclo da equipe."
