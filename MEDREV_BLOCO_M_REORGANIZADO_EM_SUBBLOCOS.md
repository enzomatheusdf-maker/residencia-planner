# MEDREV — BLOCO M REORGANIZADO: Auditoria Geral dividida em sub-blocos executáveis

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Estratégia:** não executar o M inteiro. Executar **M0 → M1 → M2 → M3 → M4 → M5**, um por vez.  
> **Pré-condição crítica:** executar o **Bloco N — Multiusuário/Auth/Isolamento de dados** antes de qualquer sub-bloco que registre histórico, activity log, backup ou dados persistentes novos.

---

## 0. Por que o Bloco M original ficou grande demais

O M original junta cinco mudanças de produto diferentes:

```txt
1. arquitetura de informação / sidebar;
2. governança de métricas;
3. centro de erros e ações corretivas;
4. raciocínio clínico v2 dentro do FSRS;
5. calendário histórico/activity log;
6. reorganização de Stats/Mentor.
```

Isso é grande demais para um único patch seguro.

Riscos se executar tudo junto:

```txt
- Codex alucinar arquivos/funções;
- quebrar navegação;
- criar UI sem core;
- criar core sem UI;
- misturar activity log com store ainda sem isolamento por uid;
- poluir Dashboard;
- quebrar Vestibular;
- aumentar muito o bundle;
- gerar dívida nova.
```

Portanto, o Bloco M deve virar uma **série de sub-blocos**, cada um com objetivo claro, testes e critério de aceite.

---

# Ordem correta

## P0 antes de tudo

Executar primeiro:

```txt
Bloco N — Multiusuário/Auth/Isolamento de dados
```

Motivo: Activity log, histórico, backup, calendário e ações corretivas são dados privados. Não faz sentido construir isso se ainda há risco de dados de usuários diferentes se misturarem.

Depois:

```txt
Bloco K — FSRS-lite v2
Bloco L v2 — Mentor Decision Engine pós-FSRS
```

Depois executar M dividido:

```txt
M0 — Auditoria geral sem implementação pesada
M1 — Navegação + arquitetura de informação
M2 — Métricas + Centro de Erros
M3 — Raciocínio Clínico v2 + FSRS multimodal
M4 — Activity Log + Calendário histórico/futuro
M5 — Stats/Mentor unificados + polish final
```

---

# M0 — Auditoria Geral de Integração

## Objetivo

Auditar o produto atual sem sair implementando.

Descobrir:

```txt
- quais features existem;
- quais aparecem na sidebar;
- quais têm core mas não UI;
- quais têm UI mas não persistem;
- quais alimentam o Mentor;
- quais alimentam Stats;
- quais registram eventos;
- onde há duplicidade;
- onde Vestibular está vazando feature médica;
- onde métricas confundem;
- onde Raciocínio Clínico está desconectado.
```

## Arquivos esperados

Não criar feature grande.

Pode criar apenas:

```txt
docs/MEDREV_AUDITORIA_GERAL_M0.md
```

## Comandos de auditoria

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build

grep -R "setView\|view ===\|Sidebar\|BottomNav" -n src || true
grep -R "Raciocinio\|Raciocínio\|illness\|sct\|casosProgresso" -n src || true
grep -R "mentor\|Mentor\|ActionInbox\|proximaAcao" -n src || true
grep -R "metric\|Preparo\|Retenção\|readiness\|coletando" -n src || true
grep -R "erro\|motivoErro\|tipoErro\|errorTaxonomy" -n src || true
grep -R "activityLog\|reviewHistory\|weeklyReviews\|sessionReflection" -n src || true
```

## Entrega

Gerar relatório:

```txt
docs/MEDREV_AUDITORIA_GERAL_M0.md
```

Com tabela:

```txt
Feature | Local UI | Core | Store | Mentor usa? | Stats usa? | Evento registrado? | Problema | Prioridade
```

## Critério de aceite

- Nenhuma feature alterada.
- Relatório claro.
- Lista de P0/P1/P2.
- Próximos sub-blocos priorizados.

---

# M1 — Navegação e arquitetura de informação

## Objetivo

Reduzir a confusão da sidebar sem remover funções.

## Regra de produto

O usuário comum deve ver poucos caminhos:

```txt
Hoje
Plano
Estudar
Estatísticas
Banco de Dados
Mais
```

Dentro de `Mais`:

```txt
Raciocínio Clínico
Simulados / ENAMED
Anki Audit
Weekly Review
Data Safety
Guia
Ajustes
```

## Criar

```txt
src/core/navigationModel.js
src/core/navigationModel.test.js
```

## Schema

```js
{
  id: "today",
  label: "Hoje",
  view: "dash",
  icon: "LayoutDashboard",
  primary: true,
  platforms: ["res", "vest"],
}

{
  id: "clinical-reasoning",
  label: "Raciocínio Clínico",
  view: "raciocinio",
  primary: false,
  group: "more",
  platforms: ["res"],
}
```

## Funções

```js
getPrimaryNavItems(plat, features)
getMoreNavItems(plat, features)
resolveViewLabel(view, plat)
```

## Patch provável

```txt
src/components/Sidebar.jsx
src/components/BottomNav.jsx
src/App.js
src/core/platformFeatures.js
```

## Regras

- Não remover feature.
- Apenas reorganizar.
- Vestibular não deve ver Raciocínio Clínico/ENAMED como item principal.
- Mobile deve ter no máximo 4–5 itens.

## Testes

```txt
res tem Raciocínio em Mais;
vest não tem Raciocínio;
itens principais <= 5;
view antiga continua resolvendo.
```

## Critério de aceite

- Sidebar menos poluída.
- Todas as features continuam acessíveis.
- Mobile fica mais limpo.
- Build/testes passam.

---

# M2 — Métricas e Centro de Erros

## Objetivo

Transformar métricas e erros em orientação concreta.

## Parte A — Métricas

Criar:

```txt
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
```

Schema:

```js
{
  id: "trueRetention",
  label: "Retenção longa",
  shortLabel: "Retenção",
  owner: "fsrs",
  description: "Estimativa baseada em revisões D21+ e manutenção.",
  confidenceRule: "requires_long_reviews",
  emptyState: "Coletando D21+",
  actionWhenLow: "Priorizar revisões longas e reduzir tema novo.",
  dashboardLevel: "compact",
  platforms: ["res", "vest"],
}
```

Regras:

```txt
- Dashboard só mostra métrica que leva a ação.
- Stats explica as métricas.
- Sem dados = coletando, não 100%.
- Baixo n = baixa confiança.
```

## Parte B — Centro de Erros

Criar:

```txt
src/core/errorActionMap.js
src/core/errorActionMap.test.js
src/components/ErrorActionCenter.jsx
```

Tipos mínimos:

```txt
conteudo
memoria
raciocinio
representacao_problema
diferencial
incerteza_sct
conduta_prescricao
interpretacao
distracao
tempo
confianca_mal_calibrada
estrategia_prova
```

Exemplo de ação corretiva:

```js
{
  type: "raciocinio",
  label: "Raciocínio",
  definition: "Você tinha dados, mas não organizou hipóteses ou fechou cedo.",
  correctiveActions: [
    "Fazer caso clínico guiado.",
    "Escrever problem representation.",
    "Listar 3 diferenciais e 1 não-pode-perder.",
    "Fazer SCT curto."
  ],
  preferredTask: "clinical_case",
}
```

## Patch provável

```txt
src/components/StatsPanel.jsx
src/components/EnamedProvaAnalyzer.jsx
src/components/SessionClosureModal.jsx
src/core/provaAnalyzer.js
src/core/errorTaxonomy.js
src/core/mentorAutopilot.js
```

## Regras

- Não criar nova aba principal se a sidebar já estiver cheia.
- Colocar em Estatísticas ou Mais.
- Vestibular usa subset sem “conduta/prescrição”.

## Critério de aceite

- Usuário entende tipos de erro.
- Cada erro tem ação corretiva.
- Mentor consegue usar `preferredTask`.
- Stats mostra erro dominante com recomendação.

---

# M3 — Raciocínio Clínico v2 + FSRS multimodal

## Objetivo

Tirar Raciocínio Clínico do isolamento e integrá-lo ao ciclo de revisão.

## Tese

Raciocínio Clínico deve ter dois modos:

```txt
1. Caso completo
2. Revisão curta dentro do FSRS
```

## Modo A — Caso completo

Fluxo:

```txt
1. Vinheta
2. Problem representation
3. Hipóteses + must-not-miss
4. Illness script de memória
5. SCT / nova informação
6. Conduta e prescrição simulada
7. Diagnóstico final + feedback + reencontro
```

## Modo B — Revisão FSRS multimodal

Para temas clínicos:

```txt
D1: Brain dump estruturado
D4: Illness Script recall
D7: Mini caso + diferenciais
D21: SCT curto + conduta
Manutenção: caso rápido ou prescrição simulada
```

## Criar

```txt
src/core/reviewTaskPlanner.js
src/core/reviewTaskPlanner.test.js
src/core/clinicalReasoningScoring.js
src/core/clinicalReasoningScoring.test.js
```

## Função principal

```js
getReviewTaskForStep({ tema, stepKey, history, errors, platform })
```

Retorna:

```js
{
  taskType: "questions" | "brain_dump" | "illness_script" | "mini_case" | "sct" | "management_station" | "anki",
  title,
  instructions,
  estimatedMinutes,
  requiredInputs,
  scoring,
}
```

## Brain dump estruturado para temas grandes

Campos:

```txt
1. Definição/quadro geral
2. Diagnóstico
3. Diferenciais/armadilhas
4. Conduta
5. Não pode perder
```

## Conduta e prescrição simulada

Campos:

```txt
1. Primeira medida / estabilização
2. Exames iniciais
3. Tratamento inicial
4. Medicações/classes/doses se houver checklist
5. Interna ou ambulatorial?
6. Red flags / contraindicações
7. Seguimento
```

Aviso obrigatório:

```txt
Uso educacional. Não usar para paciente real.
```

## Regras

- Não aplicar illness script a todo tema.
- Aplicar a temas clínicos/síndromes/emergências/casos seed.
- Preventiva conceitual, bioestatística, história do SUS: usar questions/brain dump, não illness script.

## Patch provável

```txt
src/components/RaciocinioClinico.jsx
src/components/FocusMode.jsx
src/core/fsrs.js
src/core/store.js
src/core/casosClinicos.js ou constants/casosClinicos.js
src/core/mentorAutopilot.js
```

## Critério de aceite

- Raciocínio Clínico vira tarefa de revisão quando adequado.
- Conduta/prescrição é cobrada educacionalmente.
- Brain dump é estruturado para temas grandes.
- Erro clínico gera ação corretiva.
- Mentor pode recomendar “mini caso”, “illness script” ou “management station”.

---

# M4 — Activity Log + Calendário histórico/futuro

## Pré-condição obrigatória

Executar **Bloco N** antes.

## Objetivo

Criar um histórico rastreável do que foi feito e do que está por vir.

## Criar

```txt
src/core/activityLog.js
src/core/activityLog.test.js
src/components/ActivityCalendar.jsx
src/components/ActivityDayDrawer.jsx
src/components/ActivityDetailModal.jsx
```

## Schema

```js
{
  id: "actevt_...",
  platform: "res" | "vest",
  type: "fsrs_review" | "focus_session" | "clinical_case" | "exam_analysis" | "anki" | "simulado" | "calendar_import" | "weekly_review" | "mentor_action" | "domain_validation",
  status: "scheduled" | "completed" | "skipped" | "failed" | "rescheduled",
  title: "D7 — Apendicite Aguda",
  startAt: "2026-06-01T08:30:00",
  endAt: "2026-06-01T09:05:00",
  date: "2026-06-01",
  source: "focus_mode",
  target: {
    temaId,
    stepKey,
    casoId,
    provaId,
    actionId
  },
  summary: {
    acerto,
    questoes,
    rating,
    estimatedMinutes,
    actualMinutes,
    errors,
    score
  },
  snapshot: {
    brainDump,
    problemRep,
    hypotheses,
    managementPlan,
    sctAnswers,
    feedback
  },
  createdAt,
  updatedAt
}
```

## Retenção

```js
MAX_ACTIVITY_EVENTS = 5000
MAX_SNAPSHOT_CHARS = 4000
MAX_RICH_DETAIL_DAYS = 30
MAX_HISTORY_MONTHS = 12
```

## Eventos a registrar

```txt
markStep
domínio prévio
caso clínico
Modo Foco
prova/simulado
Anki
importação de calendário
ação do Mentor
Weekly Review
```

## UI

```txt
Calendário
[Hoje] [Semana] [Mês]

Dia expandido:
08:00 — D1 Apendicite
09:10 — Caso Pré-eclâmpsia
14:30 — Simulado ENAMED
```

Clique mostra:

```txt
tipo
tema
etapa
horário
duração
questões/acertos
brain dump
hipóteses
conduta/prescrição
erros
próxima revisão
```

## Critério de aceite

- Mostra passado do último mês com detalhe.
- Mostra histórico até 12 meses resumido.
- Mostra tarefas futuras.
- Clicar abre detalhe.
- Não explode localStorage.
- É user-scoped pelo Bloco N.

---

# M5 — Stats/Mentor unificados + polish final

## Objetivo

Conectar tudo ao Mentor e reorganizar Estatísticas.

## Stats reorganizadas

Tabs/seções:

```txt
Resumo
Aprendizagem
Erros
Raciocínio Clínico
Provas/Simulados
Atividade
Sistema
```

## Mentor deve usar

```txt
activityLog
errorActionMap
reviewTaskPlanner
metricsRegistry
FSRS-lite v2
calendar provider
clinical reasoning
prova/simulado
platformFeatures
```

Exemplos de ação nova:

```txt
"Fazer D7 de Apendicite como mini caso"
"Recuperar SCA com Illness Script de memória"
"Revisar erro de conduta em pré-eclâmpsia"
"Hoje não abra tema novo; sua carga estimada já passou de 120 min"
```

## Regras

- Não criar mais cards no topo do Dashboard.
- Dashboard mostra ação principal e 2 próximas.
- Stats guarda diagnóstico profundo.
- Mentor explica porquê.

## Critério de aceite

- Mentor usa erros e activity log.
- Stats fica organizado por domínio.
- Dashboard fica limpo.
- Vestibular preservado.
- Build/testes passam.

---

# Como executar

## Comando para M0

```txt
Execute somente o M0 do MEDREV_BLOCO_M_REORGANIZADO.md. Não implemente features. Audite e gere docs/MEDREV_AUDITORIA_GERAL_M0.md. Rode check:mojibake, testes e build. Não faça commit, deploy ou push.
```

## Comando para M1

```txt
Execute somente o M1. Reorganize a navegação com navigationModel, sem remover features. Rode check:mojibake, testes e build. Não faça commit, deploy ou push.
```

## Comando para M2

```txt
Execute somente o M2. Crie metricsRegistry e ErrorActionCenter/errorActionMap. Integre sem poluir Dashboard. Rode check:mojibake, testes e build.
```

## Comando para M3

```txt
Execute somente o M3. Implemente reviewTaskPlanner e Raciocínio Clínico v2 integrado ao FSRS. Inclua conduta/prescrição simulada educacional. Rode check:mojibake, testes e build.
```

## Comando para M4

```txt
Execute somente o M4, mas apenas depois do Bloco N. Crie activityLog e calendário histórico/futuro user-scoped. Rode check:mojibake, testes e build.
```

## Comando para M5

```txt
Execute somente o M5. Reorganize Stats e conecte Mentor aos sinais criados. Rode check:mojibake, testes e build.
```

---

# Modelo recomendado

Para M0:

```txt
gpt-5.3-codex
effort: xhigh
```

Para M1–M5:

```txt
gpt-5.3-codex
effort: high
```

Use `xhigh` se mexer simultaneamente em Dashboard + Store + Mentor + Activity Log.

---

# Nota final

O M original era uma visão correta, mas grande demais.

A versão dividida evita o erro clássico:

```txt
mais features soltas
mais confusão
mais dívida técnica
```

A regra agora é:

```txt
cada sub-bloco deve registrar evento, corrigir erro, alimentar métrica e ser usado pelo Mentor.
```
