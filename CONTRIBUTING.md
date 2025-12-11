# Guia de Contribuição

Obrigado por considerar contribuir com o **Mix Credit Guru**! Este documento fornece diretrizes para ajudar você a contribuir de forma eficaz.

---

## 📋 Índice

- [Código de Conduta](#-código-de-conduta)
- [Como Posso Contribuir?](#-como-posso-contribuir)
- [Setup do Ambiente de Desenvolvimento](#-setup-do-ambiente-de-desenvolvimento)
- [Padrões de Código](#-padrões-de-código)
- [Workflow de Pull Request](#-workflow-de-pull-request)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Testes](#-testes)
- [Documentação](#-documentação)

---

## 📜 Código de Conduta

Este projeto adota um Código de Conduta que esperamos que todos os participantes sigam. Por favor, leia e siga estas diretrizes:

- **Seja respeitoso** com outros contribuidores
- **Aceite críticas construtivas** de forma profissional
- **Foque no que é melhor** para a comunidade e o projeto
- **Mostre empatia** com outros membros da comunidade

---

## 🤝 Como Posso Contribuir?

### Reportando Bugs

Antes de criar um bug report:

1. **Verifique as issues existentes** - O bug pode já ter sido reportado
2. **Verifique se é reproduzível** - Tente reproduzir em ambiente limpo
3. **Colete informações** - Browser, OS, passos para reproduzir

**Template de Bug Report:**

```markdown
## Descrição do Bug
Descrição clara e concisa do problema.

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## Comportamento Esperado
O que você esperava que acontecesse.

## Screenshots
Se aplicável, adicione screenshots.

## Ambiente
- OS: [ex: Windows 11]
- Browser: [ex: Chrome 120]
- Versão do projeto: [ex: 1.0.0]

## Contexto Adicional
Qualquer outra informação relevante.
```

### Sugerindo Melhorias

Para sugerir novas funcionalidades:

1. **Verifique se já existe** uma issue similar
2. **Descreva o problema** que a feature resolve
3. **Proponha uma solução** clara e objetiva
4. **Considere alternativas** que você pensou

### Contribuindo com Código

1. Issues marcadas com `good first issue` são ótimas para começar
2. Issues com `help wanted` precisam de contribuidores
3. Sempre comente na issue antes de começar a trabalhar

---

## 🛠 Setup do Ambiente de Desenvolvimento

### Pré-requisitos

| Ferramenta | Versão Mínima | Verificar Instalação |
|------------|---------------|---------------------|
| Node.js | 18.0+ | `node --version` |
| npm | 9.0+ | `npm --version` |
| Git | 2.30+ | `git --version` |

### Passo 1: Fork e Clone

```bash
# 1. Faça fork do repositório no GitHub

# 2. Clone seu fork
git clone https://github.com/SEU-USUARIO/mix-credit-guru.git
cd mix-credit-guru

# 3. Adicione o upstream (repositório original)
git remote add upstream https://github.com/ORIGINAL/mix-credit-guru.git
```

### Passo 2: Instale as Dependências

```bash
# Com npm
npm install

# Ou com Bun (mais rápido)
bun install
```

### Passo 3: Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite com suas credenciais Supabase
```

**Conteúdo do `.env`:**

```env
# Supabase (obrigatório)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui

# Google OAuth (opcional para desenvolvimento)
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
```

### Passo 4: Configure o Supabase Local (Opcional)

Para desenvolvimento completo com backend local:

```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicie o Supabase local
supabase start

# Aplique as migrations
supabase db push

# Para parar
supabase stop
```

### Passo 5: Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`

### Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Preview do build |
| `npm run test:unit` | Executa testes unitários |
| `npm run test:e2e` | Executa testes E2E |
| `npm run lint` | Verifica linting |
| `npm run type-check` | Verifica tipos TypeScript |

---

## 📝 Padrões de Código

### Estrutura de Arquivos

```
src/
├── components/           # Componentes React
│   ├── ComponentName/    # Componente complexo (pasta)
│   │   ├── index.tsx     # Componente principal
│   │   ├── SubComponent.tsx
│   │   └── ComponentName.test.tsx
│   └── SimpleComponent.tsx  # Componente simples (arquivo)
├── hooks/                # Custom hooks
│   └── useHookName.ts
├── lib/                  # Funções utilitárias
│   └── utilName.ts
├── pages/                # Páginas/Rotas
│   └── PageName.tsx
├── store/                # Zustand stores
│   └── useStoreName.ts
└── types/                # Tipos TypeScript
    └── domain.ts
```

### Convenções de Nomenclatura

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componentes | PascalCase | `QuoteWizard.tsx` |
| Hooks | camelCase com `use` | `useCotacaoStore.ts` |
| Funções utilitárias | camelCase | `calculateCredit.ts` |
| Tipos/Interfaces | PascalCase | `interface Supplier` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_SUPPLIERS` |
| Arquivos de teste | `.test.tsx` ou `.spec.ts` | `Button.test.tsx` |

### TypeScript

```typescript
// ✅ BOM - Tipagem explícita
interface SupplierProps {
  id: string;
  name: string;
  regime: SupplierRegime;
  onSelect: (id: string) => void;
}

const SupplierCard: React.FC<SupplierProps> = ({ id, name, regime, onSelect }) => {
  // ...
};

// ❌ EVITE - any
const handleData = (data: any) => { ... }

// ✅ BOM - Use unknown + type guard
const handleData = (data: unknown) => {
  if (isSupplier(data)) {
    // data é tipado como Supplier
  }
};
```

### Componentes React

```tsx
// ✅ BOM - Componente funcional com hooks
import { useState, useCallback, memo } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  title: string;
  onSubmit: (value: string) => void;
}

export const MyComponent = memo(function MyComponent({ title, onSubmit }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(() => {
    onSubmit(value);
  }, [value, onSubmit]);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={handleSubmit}>Enviar</Button>
    </div>
  );
});
```

### Estilização com Tailwind

```tsx
// ✅ BOM - Use tokens do design system
<div className="bg-background text-foreground border-border">
  <span className="text-muted-foreground">Texto secundário</span>
  <Button variant="primary">Ação</Button>
</div>

// ❌ EVITE - Cores hardcoded
<div className="bg-white text-black border-gray-200">
  <span className="text-gray-500">Texto secundário</span>
</div>

// ✅ BOM - Classes organizadas
<div className={cn(
  // Layout
  "flex flex-col gap-4",
  // Sizing
  "w-full max-w-md",
  // Appearance
  "bg-card rounded-lg shadow-sm",
  // Conditional
  isActive && "ring-2 ring-primary"
)}>
```

### Conventional Commits

Use o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Estrutura
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos permitidos:**

| Tipo | Descrição |
|------|-----------|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Apenas documentação |
| `style` | Formatação, sem mudança de código |
| `refactor` | Refatoração de código |
| `perf` | Melhoria de performance |
| `test` | Adição ou correção de testes |
| `chore` | Tarefas de manutenção |
| `ci` | Mudanças em CI/CD |

**Exemplos:**

```bash
feat(cotacao): adiciona filtro por regime tributário
fix(auth): corrige redirecionamento após login
docs(readme): atualiza instruções de setup
refactor(calcs): simplifica cálculo de crédito IBS
test(supplier): adiciona testes para SupplierRow
```

---

## 🔄 Workflow de Pull Request

### 1. Sincronize com Upstream

```bash
# Atualize seu fork com as últimas mudanças
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Crie uma Branch

```bash
# Use prefixos descritivos
git checkout -b feat/nome-da-feature
git checkout -b fix/descricao-do-bug
git checkout -b docs/o-que-documenta
```

### 3. Faça suas Alterações

- Faça commits pequenos e focados
- Escreva mensagens de commit claras
- Adicione testes para novas funcionalidades

### 4. Verifique Qualidade

```bash
# Execute todos os checks antes de submeter
npm run lint
npm run type-check
npm run test:unit
npm run build
```

### 5. Push e Abra o PR

```bash
git push origin feat/nome-da-feature
```

### 6. Template de Pull Request

```markdown
## Descrição
<!-- Descreva as mudanças de forma clara -->

Adiciona funcionalidade X que permite aos usuários Y.

## Tipo de Mudança
- [ ] 🐛 Bug fix (correção que não quebra funcionalidades existentes)
- [ ] ✨ Nova feature (mudança que adiciona funcionalidade)
- [ ] 💥 Breaking change (correção ou feature que quebraria funcionalidade existente)
- [ ] 📚 Documentação (apenas documentação)
- [ ] 🎨 Estilo (formatação, sem mudança de lógica)
- [ ] ♻️ Refatoração (sem mudança de funcionalidade)
- [ ] ⚡ Performance (melhoria de performance)
- [ ] ✅ Testes (adição ou correção de testes)

## Issue Relacionada
<!-- Link para a issue que este PR resolve -->
Closes #123

## Como Testar
<!-- Passos para testar as mudanças -->
1. Checkout desta branch
2. Execute `npm run dev`
3. Navegue até `/cotacao`
4. Verifique que X funciona

## Screenshots (se aplicável)
<!-- Adicione screenshots de mudanças visuais -->

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Fiz self-review do meu código
- [ ] Comentei código complexo
- [ ] Atualizei a documentação
- [ ] Minhas mudanças não geram warnings
- [ ] Adicionei testes que provam que minha correção/feature funciona
- [ ] Testes unitários passam localmente
- [ ] Mudanças dependentes foram mergeadas e publicadas

## Notas para Revisores
<!-- Algo específico que revisores devem saber -->
```

### 7. Processo de Review

1. **Aguarde review** de pelo menos 1 mantenedor
2. **Responda comentários** de forma construtiva
3. **Faça ajustes** solicitados em novos commits
4. **Squash commits** se solicitado antes do merge

### 8. Após o Merge

```bash
# Atualize seu main local
git checkout main
git pull upstream main

# Delete a branch local
git branch -d feat/nome-da-feature

# Delete a branch remota (opcional)
git push origin --delete feat/nome-da-feature
```

---

## 📁 Estrutura do Projeto

### Diretórios Principais

```
mix-credit-guru/
├── src/
│   ├── components/       # Componentes React reutilizáveis
│   │   ├── ui/           # shadcn/ui (não editar diretamente)
│   │   ├── quote/        # Componentes de cotação
│   │   ├── dashboard/    # Componentes do dashboard
│   │   └── shared/       # Componentes compartilhados
│   ├── pages/            # Páginas (1 arquivo = 1 rota)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Funções puras e utilitários
│   ├── store/            # Zustand stores
│   ├── contexts/         # React Contexts
│   ├── types/            # Tipos TypeScript
│   ├── data/             # Dados estáticos (JSON, constantes)
│   └── integrations/     # Integrações externas
├── supabase/
│   ├── functions/        # Edge Functions (Deno)
│   ├── migrations/       # SQL migrations
│   └── seeds/            # Dados de seed
├── tests/
│   ├── e2e/              # Testes Playwright
│   └── fixtures/         # Dados de teste
└── scripts/              # Scripts de automação
```

### Onde Colocar o Quê

| Tipo de Código | Localização |
|----------------|-------------|
| Novo componente UI reutilizável | `src/components/shared/` |
| Componente específico de feature | `src/components/<feature>/` |
| Nova página/rota | `src/pages/` |
| Lógica de negócio pura | `src/lib/` |
| Estado global | `src/store/` |
| Tipos compartilhados | `src/types/domain.ts` |
| Edge Function | `supabase/functions/` |
| Teste unitário | Junto ao arquivo (`.test.tsx`) |
| Teste E2E | `tests/e2e/` |

---

## 🧪 Testes

### Estrutura de Testes

```typescript
// src/components/MyComponent.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('deve renderizar o título corretamente', () => {
    render(<MyComponent title="Teste" />);
    expect(screen.getByText('Teste')).toBeInTheDocument();
  });

  it('deve chamar onSubmit ao clicar no botão', () => {
    const onSubmit = vi.fn();
    render(<MyComponent title="Teste" onSubmit={onSubmit} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
```

### Executando Testes

```bash
# Testes unitários
npm run test:unit

# Com watch mode
npm run test:unit -- --watch

# Com coverage
npm run test:unit -- --coverage

# Testes E2E
npm run test:e2e

# E2E com UI
npx playwright test --ui
```

### Cobertura Mínima

- **Novas features**: 80% de cobertura
- **Bug fixes**: Teste que reproduz o bug
- **Refatorações**: Manter cobertura existente

---

## 📚 Documentação

### Documentando Código

Use JSDoc para funções públicas:

```typescript
/**
 * Calcula o crédito tributário de um fornecedor.
 * 
 * @param supplier - Dados do fornecedor
 * @param scenario - Cenário de transição (2026-2033)
 * @returns Objeto com valores de crédito IBS, CBS e IS
 * 
 * @example
 * ```ts
 * const credit = calculateCredit(supplier, 'transicao');
 * console.log(credit.ibs); // 0.12
 * ```
 */
export function calculateCredit(
  supplier: Supplier,
  scenario: ScenarioType
): CreditResult {
  // ...
}
```

### Atualizando Documentação

Ao fazer mudanças significativas:

1. Atualize o `README.md` se necessário
2. Atualize comentários JSDoc
3. Adicione exemplos de uso quando relevante

---

## ❓ Dúvidas?

- Abra uma [issue](https://github.com/seu-usuario/mix-credit-guru/issues) com a tag `question`
- Participe das [discussões](https://github.com/seu-usuario/mix-credit-guru/discussions)

---

**Obrigado por contribuir! 🎉**
