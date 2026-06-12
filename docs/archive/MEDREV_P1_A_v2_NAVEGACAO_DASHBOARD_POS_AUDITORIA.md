# MEDREV — P1-A v2: Navegação por Jornada + Dashboard “Hoje” pós-auditoria

> **Executor recomendado:** `gpt-5.3-codex` ou Sonnet  
> **Reasoning effort:** `high`  
> **Modo:** agent com aprovação manual  
> **Origem:** ajustado com base em `docs/P1_AUDITORIA_INTEGRACAO_UX.md`  
> **Objetivo:** corrigir arquitetura de informação e transformar o Dashboard em “Hoje” sem mexer profundamente no Mentor, Stats, Raciocínio Clínico, Activity Log ou persistência.

---

## 0. Diagnóstico real pós-auditoria

A auditoria mostrou que o problema do P1-A **não é refazer o Mentor**.

O Mentor Decision Engine v2 já está implementado e já alimenta o Dashboard via:

```txt
mentorSignals.js
mentorDecisionPolicy.js
mentorAutopilot.js
Dashboard.jsx → comandoDoDia / runMentorPrimaryAction
```

O problema real do P1-A é:

```txt
1. navegação por módulo, não por jornada;
2. labels divergentes entre desktop e mobile;
3. Dashboard ainda mistura comando, métricas, gráficos, atalhos e diagnóstico;
4. recursos ocasionais estão competindo com recursos diários;
5. não existe navigationModel como fonte única;
6. P1-A deve evitar mexer no motor Mentor além do necessário para renderizar o Dashboard.
```

---

## 1. Bloqueio obrigatório antes de mexer

Antes de executar P1-A, conferir se há muitos arquivos untracked/modified.

Rodar:

```bash
git status --short
```

Se aparecerem arquivos críticos untracked como:

```txt
src/core/mentorSignals.js
src/core/mentorDecisionPolicy.js
src/core/mentorAutopilot.js
src/core/mentorSignals.test.js
src/core/mentorDecisionPolicy.test.js
src/core/mentorAutopilot.test.js
```

**não continuar sem snapshot.**

### Opção recomendada

Criar branch/snapshot antes:

```bash
git checkout -b backup/pre-p1a-ux
git add .
git commit -m "backup: snapshot before P1-A UX integration"
```

Se o usuário não quiser commit, parar e pedir confirmação. Não executar P1-A em cima de dezenas de arquivos untracked sem ponto de restauração.

---

## 2. Regras inegociáveis

```txt
Não implementar Centro de Erros.
Não implementar Activity Log.
Não implementar Raciocínio Clínico v2.
Não mexer em Firebase/Auth/localStorage.
Não mexer no Bloco N.
Não reescrever mentorDecisionPolicy.
Não remover features.
Não apagar views antigas.
Não instalar bibliotecas.
Não fazer deploy.
Não fazer push.
Não listar workspace inteiro.
Não usar ls -R, dir /s, tree, find . ou Get-ChildItem -Recurse.
Não varrer node_modules, build, audit, backups, .tmp, .restore ou .import.
```

Use apenas:

```bash
git status --short
git ls-files src package.json
git grep -n "Sidebar\|BottomNav\|setView\|view ===\|activeView\|activeTab" -- src
git grep -n "Dashboard\|comandoDoDia\|mentorNextAction\|mentorTodayPlan\|runMentorPrimaryAction" -- src
git grep -n "Raciocinio\|Raciocínio\|ENAMED\|Simulados\|Anki\|WeeklyReview\|DataSafety\|Ajustes\|Academia" -- src
git grep -n "platformFeatures\|featureEnabled\|getPlatformFeatures" -- src
```

---

## 3. Escopo exato do P1-A

### Criar

```txt
src/core/navigationModel.js
src/core/navigationModel.test.js
docs/P1_A_NAV_DASHBOARD_DECISIONS.md
```

### Alterar

```txt
src/components/Sidebar.jsx
src/components/BottomNav.jsx
src/components/Dashboard.jsx
src/App.js
```

### Evitar alterar

```txt
src/core/mentorDecisionPolicy.js
src/core/mentorSignals.js
src/core/mentorAutopilot.js
src/core/store.js
src/core/fsrs.js
src/components/StatsPanel.jsx
src/components/RaciocinioClinico.jsx
src/components/FocusMode.jsx
```

Se algum ajuste mínimo em App.js for necessário para view `more`, fazer de modo compatível e pequeno.

---

## 4. FASE P1-A0 — Auditoria rápida

Antes de editar, mapear:

```txt
views existentes
views renderizadas no App.js
items da Sidebar
items do BottomNav
views chamadas por setView
features de Residência
features de Vestibular
items avançados
items órfãos
```

Registrar brevemente no relatório final, não criar relatório longo.

---

## 5. FASE P1-A1 — `navigationModel.js`

Criar `src/core/navigationModel.js`.

### Objetivo

Uma fonte única para Sidebar e BottomNav.

### API obrigatória

```js
export const NAV_VIEW = {
  TODAY: "dash",
  PLAN: "crono",
  STUDY: "sims",
  STATS: "stats",
  DATABASE: "banco",
  MORE: "more",

  ACADEMY: "academia",
  CLINICAL_REASONING: "raciocinio",
  ANKI: "anki",
  GUIDE: "guia",
  SETTINGS: "ajustes",
  DATA_SAFETY: "data_safety",
  WEEKLY_REVIEW: "weekly_review",
  LAUNCH_CHECKLIST: "launch_checklist",
};

export function getNavigationItems(plat, features = {}) {}

export function getPrimaryNavItems(plat, features = {}) {}

export function getMoreNavItems(plat, features = {}) {}

export function resolveViewLabel(view, plat = "res") {}

export function normalizeView(view) {}

export function isViewAvailable(view, plat, features = {}) {}
```

### Itens primários

Desktop:

```txt
Hoje        → dash
Plano       → crono
Estudar     → sims
Estatísticas→ stats
Banco       → banco
Mais        → more
```

Mobile:

```txt
Hoje        → dash
Plano       → crono
Estudar     → sims
Stats       → stats
Mais        → more
```

### Itens em Mais

Residência:

```txt
Raciocínio Clínico → raciocinio
Anki Audit         → anki
Weekly Review      → weekly_review
Academia / Método  → academia
Data Safety        → data_safety
Launch Checklist   → launch_checklist
Guia               → guia
Ajustes            → ajustes
```

Vestibular:

```txt
Anki Audit
Weekly Review
Academia / Método
Data Safety
Launch Checklist
Guia
Ajustes
```

Não mostrar para Vestibular:

```txt
Raciocínio Clínico
Illness Script
Casos Clínicos
ENAMED como item médico
```

Obs.: `sims` continua como “Estudar”, mas internamente pode renderizar simulados/ENAMED/res ou simulados/vest.

---

## 6. FASE P1-A2 — Testes do modelo de navegação

Criar `src/core/navigationModel.test.js`.

Cobrir:

```js
test("primary desktop navigation has at most 6 items")
test("mobile primary navigation has at most 5 items")
test("dash label is Hoje")
test("crono label is Plano")
test("sims label is Estudar")
test("raciocinio is in more for residencia")
test("raciocinio is not available for vestibular")
test("settings remains reachable")
test("legacy view labels still resolve")
```

---

## 7. FASE P1-A3 — Refatorar Sidebar

Sidebar deve consumir `getPrimaryNavItems` e `getMoreNavItems`.

### Desktop esperado

```txt
Logo

[Residência] [Vestibular]

Hoje
Plano
Estudar
Estatísticas
Banco
Mais

Rodapé:
Guia
Ajustes
Usuário
```

### Comportamento de Mais

Pode ser:

```txt
accordion dentro da sidebar
```

ou:

```txt
abrir view "more" simples
```

Escolha a menor mudança compatível com o App atual.

### Regras

- Não remover acesso às views.
- Não deixar view sem caminho.
- Não exibir Raciocínio Clínico para Vestibular.
- Não exibir ENAMED médico como primário no Vestibular.
- `Academia` vai para Mais, não item primário.
- `Anki Audit` vai para Mais, não item primário.
- `WeeklyReview`, `DataSafety`, `LaunchChecklist` vão para Mais/Sistema.

---

## 8. FASE P1-A4 — Refatorar BottomNav

BottomNav deve consumir `getPrimaryNavItems`.

### Mobile esperado

```txt
Hoje | Plano | Estudar | Stats | Mais
```

Máximo 5 itens.

### Regras

- Sem `mobileLabel` local divergente.
- Labels vêm de `navigationModel`.
- Área segura inferior.
- Sem overflow.
- Botão Mais acessa ferramentas avançadas.
- Ajustes continua acessível.

---

## 9. FASE P1-A5 — Criar/ajustar view `Mais`

Se o App ainda não tem view `more`, criar render simples.

### Conteúdo da view Mais

```txt
Ferramentas

Raciocínio Clínico       [Residência apenas]
Anki Audit
Weekly Review
Academia / Método
Data Safety
Launch Checklist
Guia
Ajustes
```

Cada item deve ter:

```txt
título
descrição curta
botão Abrir
```

Exemplo:

```txt
Raciocínio Clínico
Treine problem representation, hipóteses e illness scripts.
[Abrir]
```

### Regra

Não criar feature nova. Apenas criar hub de acesso.

---

## 10. FASE P1-A6 — Dashboard vira “Hoje” enxuto

### O que manter no topo

```txt
1. Comando do Mentor
2. Próximas 2 ações
3. Carga de hoje
4. Alertas importantes
5. Avançado colapsado
```

### O que mover para avançado/Stats depois

Não necessariamente implementar o destino agora; apenas colapsar e tirar do topo.

Itens a reduzir:

```txt
heatmap 35 dias
cards de readiness profundos
exportar cartão
painéis detalhados
métricas sem ação imediata
```

### Hero do Mentor

Deve mostrar:

```txt
Comando do Mentor
ação.title
ação.reason ou ação.subtitle
estimatedMinutes
[Começar agora]
[Ver por quê]
```

### Próximas ações

Usar `mentorTodayPlan` se já existe.

Mostrar no máximo 2.

Se `mentorTodayPlan` ainda vier como strings simples, renderizar strings. Não refatorar motor agora.

### Carga de hoje

Usar sinais já existentes:

```txt
todayMinutes
dueTodayCount
overloadLevelToday
relearningCount
```

Se não estiverem disponíveis no Dashboard, derivar de `getWorkloadProjection` de forma leve.

---

## 11. FASE P1-A7 — Não resolver §16 neste bloco, mas não piorar

A auditoria apontou que ação sem target executável ainda pode cair em fallback silencioso.

Esse é P1-B.

No P1-A:

```txt
Não reescrever runMentorPrimaryAction profundamente.
Não criar fallback novo.
Não esconder o problema.
```

Apenas manter comportamento atual, ou no máximo adicionar proteção segura:

```js
if (!target.temaId && action.ctaView === "focus" && !topFilaItem) {
  console.warn("[Mentor] Action without executable target in Dashboard");
  setView("crono");
  return;
}
```

A correção formal fica no P1-B.

---

## 12. FASE P1-A8 — Documentar decisões

Criar:

```txt
docs/P1_A_NAV_DASHBOARD_DECISIONS.md
```

Conteúdo:

```txt
1. Por que Dashboard virou Hoje
2. Nova navegação desktop
3. Nova navegação mobile
4. O que ficou primário
5. O que foi para Mais
6. O que ficou para P1-B
7. Pendências conhecidas
```

---

## 13. Validação obrigatória

Rodar:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
git status --short
```

Se teste/build falhar:

```txt
corrigir se foi causado pelo P1-A
documentar se for pré-existente
não avançar
```

---

## 14. QA manual

### Residência

```txt
1. Sidebar mostra Hoje, Plano, Estudar, Estatísticas, Banco, Mais.
2. Raciocínio Clínico está em Mais.
3. Anki Audit está em Mais.
4. Academia está em Mais.
5. Dashboard mostra Comando do Mentor como foco.
6. Próximas ações aparecem em até 2 itens.
7. Carga de hoje aparece.
8. Avançado está colapsado.
9. Começar agora ainda funciona.
```

### Vestibular

```txt
1. Sidebar/BottomNav não mostram Raciocínio Clínico.
2. Dashboard não fala ENAMED como eixo principal.
3. Estudar abre simulados/fluxo adequado.
4. Plano funciona.
5. Stats funciona.
```

### Mobile

```txt
1. BottomNav tem no máximo 5 itens.
2. Labels não cortam.
3. Mais abre ferramentas.
4. Ajustes acessível.
5. Sem overflow.
```

---

## 15. Critérios de aceite

P1-A aprovado se:

```txt
navigationModel existe e tem testes.
Sidebar e BottomNav usam navigationModel.
Desktop tem no máximo 6 itens primários.
Mobile tem no máximo 5 itens primários.
Dashboard virou “Hoje” visualmente.
Comando do Mentor é o centro.
Métricas profundas saíram do topo ou ficaram colapsadas.
Features antigas seguem acessíveis em Mais/Stats/Banco.
Residência e Vestibular continuam separados.
Nenhuma persistência foi alterada.
check:mojibake passa.
testes passam.
build passa.
```

---

## 16. Prompt curto para execução

```txt
Execute somente o P1-A v2 do arquivo MEDREV_P1_A_v2_NAVEGACAO_DASHBOARD_POS_AUDITORIA.md.

Antes de mexer, confira git status. Se houver mentorSignals/mentorDecisionPolicy/mentorAutopilot ou muitos arquivos untracked sem snapshot/commit, pare e peça confirmação.

Objetivo: criar navigationModel, refatorar Sidebar/BottomNav para navegação por jornada e transformar Dashboard em “Hoje” enxuto.

Não implemente Centro de Erros, Activity Log, Raciocínio Clínico v2, MetricsRegistry ou refactor profundo do Mentor.
Não toque em Firebase/auth/localStorage.
Não liste workspace inteiro.
Use git grep/git ls-files.

Rode check:mojibake, testes e build.
Não faça deploy ou push.
```
