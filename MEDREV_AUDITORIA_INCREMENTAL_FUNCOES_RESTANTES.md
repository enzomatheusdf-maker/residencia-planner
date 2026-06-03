# MEDREV — Auditoria Incremental Pós-Implementação: Funções Restantes

> **Premissa corrigida:** a auditoria anterior é tratada como **baseline já implementado**. Este documento **não** tenta reaplicar o plano antigo. O foco agora é o que falta para o produto virar um sistema executável de estudo: histórico real, ações do mentor acionáveis, calendário/importação madura, fechamento de sessão útil, backup, multiusuário e hardening de lançamento.
>
> **Código auditado:** `Bro (18).zip`.
>
> **Leitura obrigatória antes de implementar:** `docs/MEDREV_CONTEXT_FOR_AI.md`, `docs/MEDREV_PRODUCT_CHARTER.md`, `src/core/platformFeatures.js`, `src/core/store.js`, `src/core/actionInbox.js`, `src/core/sessionReflection.js`.
>
> **Regra anti-regressão:** não refazer FSRS/Interface/Raciocínio/Estatísticas da auditoria anterior salvo quando for necessário para conectar as novas funções. Cada etapa abaixo é pequena, com arquivos permitidos/proibidos e DoD.

---

## 0. O que foi corrigido no escopo

Eu havia confundido o arquivo de auditoria anterior com trabalho ainda não aplicado. A leitura correta é:

1. **A auditoria anterior é baseline.** Não gastar token implementando de novo os mesmos blocos.
2. **Nova auditoria = camada de produto que falta em volta do core:** o aluno precisa saber o que fez, o mentor precisa mandar para uma ação real, a agenda importada precisa ser confiável, o fechamento de sessão precisa virar dado, e o backup/multiusuário precisa proteger tudo.
3. **Não criar “features bonitas” sem contrato de execução.** Toda função nova deve responder: que evento registra, que ação gera, onde aparece, como é recuperada e como é testada.

---

## 1. Sumário executivo — achados novos

### P0 — implementar antes de adicionar mais tela

| Prioridade | Achado | Evidência no código | Risco de produto | Correção proposta |
|---|---|---|---|---|
| P0 | **Não existe Activity Log global.** Existem `reviewHistory`, `sessionReflections`, `weeklyReviews`, análises ENAMED e progresso de caso, mas nada forma uma linha do tempo única. | `store.js` tem `sessionReflections` e `weeklyReviews`, mas não `activityLog`; `userDataPaths.js` já prevê `activityLog`, não usado. | O app não consegue explicar “o que aconteceu”, gerar weekly review robusto, debugar mentor, nem reconstruir jornada do usuário. | Criar `src/core/activityLog.js`, persistir `activityLog` no store, logar eventos principais e expor UI simples. |
| P0 | **Action Inbox gera ações sem execução real.** | `ActionInbox.jsx:6-17` só executa `target.temaId+stepKey` ou `target.view`. Mas `actionInbox.js`/`store.js` geram `target:{tema:"fila_vencida"}`, `{area}`, `{casoId}` etc. | Mentor recomenda, mas o botão “Iniciar” some ou vira “Marcar feito” sem ação concreta. Isso destrói confiança. | Criar contrato de target/CTA centralizado; fazer cada ação sair com rota executável. |
| P0 | **Fechamento de sessão salva reflexão, mas não vira evento canônico nem plano confiável.** | `sessionReflection.js` cria reflexão e ação; `Dashboard.jsx` detecta `hasPendingClosure`, mas botão manda para `stats`, não reabre fechamento. | O usuário fecha sessão, mas o app não transforma isso em aprendizado operacional. | Integrar `SessionClosureModal` ao ActivityLog e corrigir CTA de sessão pendente. |
| P0 | **Importação de calendário é funcional, mas rasa.** | `CalendarImportWizard.jsx` aceita texto/JSON; `CalendarMappingPanel.jsx` é display-only; `Cronograma.jsx` ainda mostra “Usar amostra de desenvolvimento”. | Usuário importa cronograma real, mas não corrige mapeamento; em produção aparece ferramenta dev; confiança cai. | Import v2: overrides manuais, snapshot, log, esconder sample dev. |
| P1 | **Weekly Review existe, mas deveria nascer do Activity Log.** | `WeeklyReview.jsx` usa reflexões/action inbox/casos/análises, mas não linha do tempo canônica. | Review semanal vira opinião parcial, não auditoria do estudo. | Recalcular com `activityLog` + reflexões. |
| P1 | **Backup não inclui Activity Log porque ele não existe.** | `backup.js` inclui `sessionReflections` e `weeklyReviews`; sem `activityLog`. | Perde histórico e auditabilidade em troca de dispositivo/conta. | Estender backup schema. |
| P1 | **Multiusuário está bem desenhado, mas incompleto para a nova camada.** | `userScope.js`, `userDataPaths.js` e `firestore.rules` já têm base por usuário. | Se ActivityLog entrar errado, mistura usuário anônimo/autenticado. | Persistir primeiro no store escopado; Firestore subcollection fica etapa futura. |

---

## 2. Fundamentação externa usada para decidir o plano

Esta auditoria incremental usa quatro critérios de produto, não só “mais features”:

1. **Revisão espaçada precisa de dado operacional confiável.** O manual do Anki recomenda 90% como retenção desejada padrão e alerta que elevar retenção aumenta a carga rapidamente; isso reforça que o MedRev precisa medir carga, execução e atrasos antes de tentar “forçar mais retenção”. Fonte: Anki Manual — Deck Options, seção FSRS.
2. **FSRS moderno suporta adiantamento/atraso e se adapta ao histórico do usuário.** Isso torna um Activity Log estruturado valioso para auditoria futura e, depois, possível otimização de parâmetros. Fonte: open-spaced-repetition/free-spaced-repetition-scheduler.
3. **Learning analytics só ajuda quando é acionável.** Revisões recentes de Learning Analytics Dashboards mostram que dashboards crus podem impor carga cognitiva sem melhorar desempenho; feedback motivacional e visualizações de baixa inferência tendem a ser mais úteis. Fonte: revisão MDPI 2025 sobre learning analytics dashboards.
4. **Raciocínio clínico e SCT funcionam melhor com resposta + feedback + comparação.** A etapa incremental não deve criar mais telas soltas; deve registrar resposta, feedback, conduta, incerteza e evolução. Fonte: literatura sobre illness scripts e Script Concordance Test em educação médica.

**Implicação de engenharia:** antes de expandir tela, criar uma espinha dorsal de eventos e ações. Sem isso, o mentor vira texto motivacional e as estatísticas viram painel decorativo.

---

## 3. Arquitetura-alvo incremental

### 3.1 Estado atual simplificado

Hoje o app tem vários “minibancos”:

```txt
Tema.rev[step].reviewHistory     -> histórico local do tema
sessionReflections[]             -> fechamento de sessão
weeklyReviews[]                  -> revisão semanal
casosProgresso{}                 -> progresso em casos clínicos
analisesEnamed[]                 -> análise de prova
simulados[]                      -> simulados
calendario/importedTopics        -> cronograma importado
```

O problema é que eles não conversam em uma linha do tempo.

### 3.2 Estado-alvo

Criar um **Activity Log canônico**:

```txt
activityLog[]
  ├─ fsrs_review
  ├─ focus_session
  ├─ session_reflection
  ├─ mentor_action
  ├─ clinical_case
  ├─ exam_analysis
  ├─ calendar_import
  ├─ weekly_review
  ├─ backup
  └─ domain_validation
```

Esse log não substitui os estados especializados. Ele é um **índice operacional** para:

- timeline do aluno;
- Weekly Review confiável;
- depuração do mentor;
- métricas de consistência;
- backup/auditoria;
- futuras sincronizações incrementais.

---

## 4. Etapa A — Activity Log Core

### Objetivo

Criar o núcleo de eventos sem mexer na UI. Depois disso, cada ação importante do app deixa uma trilha.

### Arquivos permitidos

- `src/core/activityLog.js` **novo**
- `src/core/activityLog.test.js` **novo**
- `src/core/store.js`
- `src/core/backup.js`

### Arquivos proibidos

- componentes grandes (`Dashboard.jsx`, `StatsPanel.jsx`, `Cronograma.jsx`) nesta etapa;
- FSRS matemático;
- Firebase service.

### 4.1 Criar `src/core/activityLog.js`

```js
// src/core/activityLog.js

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function toIsoDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toIsoDateTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function slug(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

export const ACTIVITY_EVENT_TYPE = Object.freeze({
  FSRS_REVIEW: "fsrs_review",
  FOCUS_SESSION: "focus_session",
  SESSION_REFLECTION: "session_reflection",
  MENTOR_ACTION: "mentor_action",
  CLINICAL_CASE: "clinical_case",
  EXAM_ANALYSIS: "exam_analysis",
  CALENDAR_IMPORT: "calendar_import",
  WEEKLY_REVIEW: "weekly_review",
  BACKUP: "backup",
  DOMAIN_VALIDATION: "domain_validation",
});

export const ACTIVITY_EVENT_STATUS = Object.freeze({
  DONE: "done",
  OPEN: "open",
  ACCEPTED: "accepted",
  DISMISSED: "dismissed",
  SKIPPED: "skipped",
  ERROR: "error",
});

export const MAX_ACTIVITY_EVENTS = 1500;

export function buildActivityId(input = {}) {
  if (input.id) return input.id;
  const type = input.type || "event";
  const date = input.date || toIsoDate();
  const target = input.target || {};
  const seed = [
    type,
    input.source || "app",
    target.temaId || target.casoId || target.actionId || target.providerId || target.id || input.title || "item",
    target.stepKey || target.view || "",
    input.createdAt || date,
  ].join("|");
  return `log_${slug(seed).slice(0, 96)}`;
}

export function createActivityEvent(input = {}) {
  const createdAt = input.createdAt || toIsoDateTime();
  const date = input.date || toIsoDate(createdAt);
  const type = input.type || ACTIVITY_EVENT_TYPE.FOCUS_SESSION;

  return {
    id: buildActivityId({ ...input, createdAt, date, type }),
    type,
    status: input.status || ACTIVITY_EVENT_STATUS.DONE,
    title: String(input.title || "Evento registrado").trim(),
    summary: String(input.summary || "").trim(),
    source: input.source || "app",
    date,
    createdAt,
    target: input.target && typeof input.target === "object" ? input.target : {},
    metrics: input.metrics && typeof input.metrics === "object" ? input.metrics : {},
    meta: input.meta && typeof input.meta === "object" ? input.meta : {},
  };
}

export function upsertActivityEvent(events = [], event) {
  if (!event) return Array.isArray(events) ? events : [];
  const normalized = createActivityEvent(event);
  const withoutSame = (Array.isArray(events) ? events : []).filter((item) => item?.id !== normalized.id);
  return capActivityLog([...withoutSame, normalized]);
}

export function capActivityLog(events = [], max = MAX_ACTIVITY_EVENTS) {
  const normalized = (Array.isArray(events) ? events : [])
    .filter(Boolean)
    .map((item) => createActivityEvent(item));
  return sortActivityEvents(normalized).slice(0, max);
}

export function sortActivityEvents(events = []) {
  return [...events].sort((a, b) => {
    const byTime = String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
    if (byTime !== 0) return byTime;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

export function getActivityEventsForDate(events = [], date = toIsoDate()) {
  return sortActivityEvents(events).filter((event) => event.date === date);
}

export function summarizeActivity(events = [], { from, to } = {}) {
  const list = sortActivityEvents(events).filter((event) => {
    if (from && event.date < from) return false;
    if (to && event.date > to) return false;
    return true;
  });

  const byType = {};
  const byStatus = {};
  let studyMinutes = 0;
  let reviewsDone = 0;
  let clinicalCases = 0;
  let examAnalyses = 0;

  for (const event of list) {
    byType[event.type] = (byType[event.type] || 0) + 1;
    byStatus[event.status] = (byStatus[event.status] || 0) + 1;
    studyMinutes += Number(event.metrics?.minutes || 0) || 0;
    if (event.type === ACTIVITY_EVENT_TYPE.FSRS_REVIEW) reviewsDone += 1;
    if (event.type === ACTIVITY_EVENT_TYPE.CLINICAL_CASE) clinicalCases += 1;
    if (event.type === ACTIVITY_EVENT_TYPE.EXAM_ANALYSIS) examAnalyses += 1;
  }

  return {
    total: list.length,
    byType,
    byStatus,
    studyMinutes,
    reviewsDone,
    clinicalCases,
    examAnalyses,
  };
}

export function activityFromFsrsReview({ tema, stepKey, step, platKey }) {
  if (!tema || !stepKey || !step) return null;
  return createActivityEvent({
    type: ACTIVITY_EVENT_TYPE.FSRS_REVIEW,
    title: `Revisao concluida: ${tema.nome || tema.id || "tema"}`,
    summary: `${String(stepKey).toUpperCase()} concluido${step?.acerto != null ? ` com ${Math.round(Number(step.acerto) * 100)}%` : ""}.`,
    source: "fsrs",
    date: step.reviewedAt || step.date || toIsoDate(),
    target: {
      temaId: tema.id,
      stepKey,
      area: tema.area || "",
      platKey: platKey || "",
    },
    metrics: {
      acerto: step.acerto ?? null,
      stability: step.S ?? null,
      difficulty: step.D ?? null,
    },
    meta: {
      status: step.status || "",
      atrasoDias: step.atrasoDias ?? null,
      rating: step.rating || "",
    },
  });
}

export function activityFromMentorAction(action, status = ACTIVITY_EVENT_STATUS.OPEN) {
  if (!action) return null;
  return createActivityEvent({
    type: ACTIVITY_EVENT_TYPE.MENTOR_ACTION,
    status,
    title: action.title || "Acao do mentor",
    summary: action.reason || "",
    source: action.source || "mentor",
    date: action.dueDate || action.createdAt || toIsoDate(),
    target: {
      ...(action.target || {}),
      actionId: action.id,
      actionType: action.type,
    },
    metrics: {
      priority: action.priority ?? null,
    },
  });
}
```

### 4.2 Criar `src/core/activityLog.test.js`

```js
import {
  ACTIVITY_EVENT_TYPE,
  capActivityLog,
  createActivityEvent,
  getActivityEventsForDate,
  summarizeActivity,
  upsertActivityEvent,
} from "./activityLog";

describe("activityLog core", () => {
  test("normaliza evento minimo", () => {
    const event = createActivityEvent({ title: "Teste" });
    expect(event.id).toMatch(/^log_/);
    expect(event.title).toBe("Teste");
    expect(event.status).toBe("done");
  });

  test("upsert substitui mesmo id", () => {
    const a = createActivityEvent({ id: "x", title: "A" });
    const b = createActivityEvent({ id: "x", title: "B" });
    const list = upsertActivityEvent([a], b);
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("B");
  });

  test("filtra eventos por data", () => {
    const events = [
      createActivityEvent({ id: "a", date: "2026-06-01", title: "A" }),
      createActivityEvent({ id: "b", date: "2026-06-02", title: "B" }),
    ];
    expect(getActivityEventsForDate(events, "2026-06-02")).toHaveLength(1);
  });

  test("sumariza revisoes e minutos", () => {
    const events = [
      createActivityEvent({ type: ACTIVITY_EVENT_TYPE.FSRS_REVIEW, metrics: { minutes: 20 } }),
      createActivityEvent({ type: ACTIVITY_EVENT_TYPE.CLINICAL_CASE, metrics: { minutes: 10 } }),
    ];
    const summary = summarizeActivity(events);
    expect(summary.total).toBe(2);
    expect(summary.reviewsDone).toBe(1);
    expect(summary.clinicalCases).toBe(1);
    expect(summary.studyMinutes).toBe(30);
  });

  test("limita tamanho do log", () => {
    const events = Array.from({ length: 20 }, (_, i) => createActivityEvent({ id: `e${i}`, title: `E${i}` }));
    expect(capActivityLog(events, 5)).toHaveLength(5);
  });
});
```

### 4.3 Patch em `store.js`

#### Importar helpers

No topo de `src/core/store.js`, adicionar:

```js
import {
  ACTIVITY_EVENT_STATUS,
  ACTIVITY_EVENT_TYPE,
  activityFromFsrsReview,
  activityFromMentorAction,
  capActivityLog,
  createActivityEvent,
  upsertActivityEvent,
} from "./activityLog";
```

#### Estado inicial

No estado inicial, perto de `sessionReflections`/`weeklyReviews`, adicionar:

```js
activityLog: [],
```

#### Métodos novos

Adicionar junto dos métodos de action/reflection:

```js
logActivityEvent: (event) =>
  set((s) => ({
    activityLog: upsertActivityEvent(s.activityLog || [], event),
  })),

appendActivityEvents: (events = []) =>
  set((s) => ({
    activityLog: capActivityLog([...(s.activityLog || []), ...events]),
  })),
```

#### Atualizar `markStep`

No retorno de `markStep`, depois de montar `temasAtualizados`, criar evento:

```js
const updatedTema = temasAtualizados.find((tema) => tema.id === temaId);
const completedStep = updatedTema?.rev?.[stepKey];
const reviewEvent = activityFromFsrsReview({
  tema: updatedTema,
  stepKey,
  step: completedStep,
  platKey: s.plat,
});
```

No objeto retornado por `set`, incluir:

```js
activityLog: reviewEvent
  ? upsertActivityEvent(s.activityLog || [], reviewEvent)
  : (s.activityLog || []),
```

> **Cuidado:** não logar antes do `recalcAfterMark`, senão o evento fica sem `S`, `D`, `reviewedAt` e acerto final.

#### Atualizar `addSessionReflection`

Dentro de `addSessionReflection`, depois de `const action = reflectionToAction(normalized);`, criar:

```js
const reflectionEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.SESSION_REFLECTION,
  title: normalized.tema ? `Fechamento: ${normalized.tema}` : "Fechamento de sessao",
  summary: normalized.mainIssue === "nenhum" ? "Sessao registrada." : `Ponto principal: ${normalized.mainIssue}.`,
  source: normalized.source || "focus",
  date: normalized.date,
  target: {
    reflectionId: normalized.id,
    tema: normalized.tema || "",
    area: normalized.area || "",
  },
  metrics: {
    confidence: normalized.confidence,
    outcome: normalized.outcome,
  },
  meta: {
    nextAdjustment: normalized.nextAdjustment,
    note: normalized.note || "",
  },
});
```

No retorno, incluir:

```js
activityLog: capActivityLog([
  ...(s.activityLog || []),
  reflectionEvent,
  activityFromMentorAction(action, ACTIVITY_EVENT_STATUS.OPEN),
].filter(Boolean)),
```

#### Atualizar ações do mentor

Em `acceptAction`, `dismissAction`, `markActionDone`, além de atualizar `actionInboxState`, logar o status:

```js
const action = (s.actionInbox || []).find((item) => item.id === actionId);
const event = activityFromMentorAction(action, ACTIVITY_EVENT_STATUS.ACCEPTED); // ou DONE/DISMISSED
return {
  actionInboxState: { ... },
  activityLog: event ? upsertActivityEvent(s.activityLog || [], event) : (s.activityLog || []),
};
```

#### Partialize/persistência

Em `partialize`, incluir:

```js
activityLog: s.activityLog,
```

No reset/merge de usuário, onde já entram `sessionReflections` e `weeklyReviews`, adicionar:

```js
activityLog: persisted.activityLog ?? initial.activityLog,
```

### 4.4 Patch em `backup.js`

Em `createBackupPayload`:

```js
activityLog: state.activityLog ?? [],
```

Em `inspectBackupPayload`:

```js
const activityLog = Array.isArray(backup.activityLog) ? backup.activityLog.length : 0;
```

E retornar:

```js
activityLog,
```

Em `restoreStateFromBackup`:

```js
activityLog: backup.activityLog ?? [],
```

### DoD da Etapa A

- `activityLog.test.js` verde.
- `check:mojibake` verde.
- Marcar uma revisão cria um evento `fsrs_review`.
- Fechar sessão cria `session_reflection` e `mentor_action`.
- Aceitar/concluir/dispensar ação registra status no log.
- Exportar backup inclui `activityLog`.

---

## 5. Etapa B — Timeline de atividade

### Objetivo

Criar uma visualização simples, útil e barata: “o que eu fiz hoje/semana”. Não é dashboard avançado. É linha do tempo operacional.

### Arquivos permitidos

- `src/components/ActivityTimeline.jsx` **novo**
- `src/components/StatsPanel.jsx` ou `src/App.js`/`navigationModel.js` se decidir abrir por “Mais”

### Recomendação de produto

Primeiro colocar em **Estatísticas > Atividade**. Depois, se ficar bom, adicionar item em “Mais”. Não criar nova aba principal.

### 5.1 Criar `ActivityTimeline.jsx`

```jsx
// src/components/ActivityTimeline.jsx
import React, { useMemo, useState } from "react";
import { Activity, CalendarDays, CheckCircle2, Clock, Target } from "lucide-react";
import { useStore } from "../core/store";
import { getActivityEventsForDate, summarizeActivity, toIsoDate } from "../core/activityLog";
import EmptyState from "./EmptyState";

const TYPE_LABELS = {
  fsrs_review: "Revisao",
  focus_session: "Sessao",
  session_reflection: "Fechamento",
  mentor_action: "Mentor",
  clinical_case: "Caso clinico",
  exam_analysis: "Prova",
  calendar_import: "Calendario",
  weekly_review: "Weekly Review",
  backup: "Backup",
  domain_validation: "Dominio previo",
};

function shiftDate(iso, days) {
  const base = iso ? new Date(`${iso}T12:00:00`) : new Date();
  base.setDate(base.getDate() + days);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
}

export default function ActivityTimeline({ initialDate }) {
  const activityLog = useStore((s) => s.activityLog || []);
  const [selectedDate, setSelectedDate] = useState(initialDate || toIsoDate());

  const events = useMemo(
    () => getActivityEventsForDate(activityLog, selectedDate),
    [activityLog, selectedDate]
  );

  const weekSummary = useMemo(() => {
    const from = shiftDate(selectedDate, -6);
    return summarizeActivity(activityLog, { from, to: selectedDate });
  }, [activityLog, selectedDate]);

  return (
    <section className="bg-[var(--surface-1)] border border-white/5 rounded-3xl p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-black">Linha do tempo</p>
          <h3 className="text-lg font-black text-white">Atividade registrada</h3>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
          className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="rounded-2xl bg-black/20 border border-white/5 p-3">
          <CalendarDays size={15} className="text-blue-300 mb-1" />
          <p className="text-xl font-black text-white">{weekSummary.total}</p>
          <p className="text-[10px] text-gray-500 font-bold">eventos em 7 dias</p>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/5 p-3">
          <CheckCircle2 size={15} className="text-emerald-300 mb-1" />
          <p className="text-xl font-black text-white">{weekSummary.reviewsDone}</p>
          <p className="text-[10px] text-gray-500 font-bold">revisoes</p>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/5 p-3">
          <Target size={15} className="text-purple-300 mb-1" />
          <p className="text-xl font-black text-white">{weekSummary.clinicalCases}</p>
          <p className="text-[10px] text-gray-500 font-bold">casos</p>
        </div>
        <div className="rounded-2xl bg-black/20 border border-white/5 p-3">
          <Clock size={15} className="text-amber-300 mb-1" />
          <p className="text-xl font-black text-white">{weekSummary.studyMinutes}</p>
          <p className="text-[10px] text-gray-500 font-bold">min estimados</p>
        </div>
      </div>

      {!events.length ? (
        <EmptyState
          icon={Activity}
          title="Sem eventos neste dia"
          description="Quando voce revisar, fechar sessoes, importar calendario ou executar acoes do mentor, tudo aparece aqui."
        />
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blue-300 font-black">
                    {TYPE_LABELS[event.type] || event.type}
                  </p>
                  <h4 className="text-sm font-black text-white">{event.title}</h4>
                  {event.summary && <p className="text-[11px] text-gray-400 mt-1">{event.summary}</p>}
                </div>
                <span className="text-[10px] text-gray-500 font-bold">{event.status}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

### 5.2 Integrar em `StatsPanel.jsx`

Import lazy:

```jsx
const ActivityTimeline = React.lazy(() => import("./ActivityTimeline"));
```

Na seção `atividade`, adicionar abaixo dos cartões existentes:

```jsx
<Suspense fallback={<div className="text-sm text-gray-500">Carregando atividade...</div>}>
  <ActivityTimeline />
</Suspense>
```

### DoD da Etapa B

- `Stats > Atividade` mostra timeline.
- Se não há eventos, aparece empty state.
- Depois de uma revisão, a timeline do dia mostra o evento.
- Sem nova aba principal.

---

## 6. Etapa C — Action Inbox com contrato executável

### Objetivo

Toda ação do mentor deve ter uma rota. Sem isso, a UI promete e não entrega.

### Diagnóstico de código

`ActionInbox.jsx` só entende:

```js
target.temaId + target.stepKey
// ou
target.view
```

Mas o core gera:

```js
target: { tema: "fila_vencida" }
target: { tema: "fila_do_dia" }
target: { area: "..." }
target: { casoId }
target: { tema, temaId }
```

Resultado: várias ações não têm CTA. O usuário só consegue “marcar feito”, que é uma saída falsa.

### Arquivos permitidos

- `src/core/actionInbox.js`
- `src/core/store.js`
- `src/components/ActionInbox.jsx`

### 6.1 Adicionar helper de execução em `actionInbox.js`

```js
export function resolveActionExecution(action = {}) {
  const target = action.target || {};

  if (target.temaId && target.stepKey) {
    return {
      kind: "study",
      label: "Iniciar",
      temaId: target.temaId,
      stepKey: target.stepKey,
    };
  }

  if (target.view) {
    return {
      kind: "view",
      label: target.label || "Abrir",
      view: target.view,
    };
  }

  if (target.casoId) {
    return {
      kind: "view",
      label: "Abrir caso",
      view: "raciocinio",
      params: { casoId: target.casoId },
    };
  }

  if (action.type === "rest") {
    return {
      kind: "noop",
      label: "Registrar descanso",
    };
  }

  return null;
}
```

### 6.2 Garantir que as ações saiam com target certo

Em `store.js`, criar helper perto de `buildActionCandidatesFromState`:

```js
function findFirstDueReview(temas = [], today, mode = "today") {
  for (const tema of temas) {
    const rev = tema?.rev || {};
    for (const stepKey of ["d0", "d1", "d4", "d7", "d21", "manutencao"]) {
      const step = rev[stepKey];
      if (!step || step.status === "done") continue;
      if (!step.date) continue;
      if (mode === "overdue" && step.date < today) return { temaId: tema.id, stepKey };
      if (mode === "today" && step.date <= today) return { temaId: tema.id, stepKey };
    }
  }
  return null;
}
```

Dentro de `buildActionCandidatesFromState`, trocar targets genéricos:

#### Revisões vencidas

De:

```js
target: { tema: "fila_vencida" },
```

Para:

```js
const firstOverdue = findFirstDueReview(state.temas || [], today, "overdue");
// ...
target: firstOverdue
  ? { ...firstOverdue, queue: "overdue" }
  : { view: "dash", queue: "overdue" },
```

#### Fila de hoje

```js
const firstToday = findFirstDueReview(state.temas || [], today, "today");
// ...
target: firstToday
  ? { ...firstToday, queue: "today" }
  : { view: "dash", queue: "today" },
```

#### Área fraca ENAMED

```js
target: { view: "sims", area: latestEnamed.resumo.areaCritica },
```

#### Caso clínico

Se já existe `casoId`, manter:

```js
target: { view: "raciocinio", casoId },
```

#### Tema novo

```js
target: { view: "crono", area: latestEnamed?.resumo?.areaCritica || "" },
```

### 6.3 Atualizar `ActionInbox.jsx`

Importar:

```js
import { resolveActionExecution } from "../core/actionInbox";
```

Substituir `resolveActionCTA` local por:

```jsx
function executeAction(action, execution, { onStudy, setView, markActionDone }) {
  if (!execution) return;
  if (execution.kind === "study" && onStudy) {
    onStudy(execution.temaId, execution.stepKey || "d0");
    return;
  }
  if (execution.kind === "view" && setView) {
    setView(execution.view);
    return;
  }
  if (execution.kind === "noop") {
    markActionDone && markActionDone(action.id);
  }
}
```

No render:

```jsx
const primaryExecution = resolveActionExecution(primary);
```

Botão:

```jsx
{primaryExecution && (
  <button
    type="button"
    onClick={() => executeAction(primary, primaryExecution, { onStudy, setView, markActionDone })}
    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold border-none cursor-pointer inline-flex items-center gap-1"
  >
    <Play size={12} /> {primaryExecution.label}
  </button>
)}
```

Para ações secundárias, renderizar o botão também. Hoje elas só têm “Marcar feito” e “Dispensar”; isso mantém as recomendações secundárias pouco úteis.

### DoD da Etapa C

- Ação “Resolver revisões vencidas” abre uma revisão real.
- Ação “Fechar fila de hoje” abre uma revisão real.
- Ação de caso clínico abre `raciocinio`.
- Ação de área fraca abre `sims` ou `crono`, não fica sem CTA.
- Ações aceitas/concluídas/dispensadas aparecem no Activity Log.

---

## 7. Etapa D — Fechamento de sessão como dado de aprendizagem

### Objetivo

Fechamento de sessão não deve ser “modal bonitinho”. Deve virar dado que alimenta ação, weekly review e timeline.

### Diagnóstico

- `SessionClosureModal.jsx` já existe.
- `sessionReflection.js` normaliza outcome, issue, confidence e ajuste.
- `addSessionReflection` salva reflexão e gera uma action.
- Porém, sem Activity Log, isso não vira evento operacional.
- `Dashboard.jsx` detecta pendência (`hasPendingClosure`), mas o CTA atual manda para `stats`, o que não resolve a pendência.

### Arquivos permitidos

- `src/components/Dashboard.jsx`
- `src/components/SessionClosureModal.jsx` somente se precisar prop nova
- `src/core/store.js` já modificado na Etapa A

### 7.1 Corrigir CTA de sessão pendente no Dashboard

No Dashboard, criar estado:

```jsx
const [closureOpen, setClosureOpen] = useState(false);
```

No alerta de sessão pendente, trocar:

```jsx
onClick={() => setView("stats")}
```

por:

```jsx
onClick={() => setClosureOpen(true)}
```

No fim do componente, renderizar:

```jsx
<SessionClosureModal
  open={closureOpen}
  onClose={() => setClosureOpen(false)}
  source="dashboard"
/>
```

Se `SessionClosureModal` exige props específicas de tema/sessão, passe fallback:

```jsx
session={{ source: "dashboard", tema: "", area: "" }}
```

### 7.2 Melhorar taxonomia do fechamento sem inventar sistema paralelo

O `sessionReflection.js` usa:

```js
conteudo, raciocinio, tempo, energia, distracao, nenhum, memoria
```

Isso é bom para fechamento rápido. Não expandir demais. O erro seria tentar colocar 20 categorias e matar adesão.

Adicionar somente um campo opcional:

```js
intensity: "baixa" | "media" | "alta"
```

Mas **não fazer agora** se isso exigir mexer na UI. Primeiro estabilizar Activity Log.

### DoD da Etapa D

- Se há sessão pendente, o CTA abre fechamento, não estatísticas.
- Fechar sessão aparece na timeline.
- Fechar sessão gera ação executável no Action Inbox.
- Weekly Review passa a enxergar a reflexão.

---

## 8. Etapa E — Importação de calendário v2

### Objetivo

Transformar a importação em uma função confiável para cronogramas reais, sem depender de amostra dev e sem mapeamento caixa-preta.

### Diagnóstico de código

- `CalendarImportWizard.jsx` aceita texto/JSON e gera preview.
- `calendarProvider.js` normaliza e tenta mapear tópicos.
- `CalendarMappingPanel.jsx` só mostra mapeamento; não permite corrigir.
- `Cronograma.jsx` mostra botão “Usar amostra de desenvolvimento”, perigoso em produção.

### Arquivos permitidos

- `src/core/calendarProvider.js`
- `src/components/CalendarImportWizard.jsx`
- `src/components/CalendarMappingPanel.jsx`
- `src/components/Cronograma.jsx`
- `src/core/store.js`
- `src/core/calendarProvider.test.js`

### 8.1 Esconder amostra de desenvolvimento

Em `Cronograma.jsx`, envolver o botão:

```jsx
{process.env.NODE_ENV !== "production" && (
  <button ...>
    Usar amostra de desenvolvimento
  </button>
)}
```

Ou melhor, usar feature flag explícita:

```js
const SHOW_DEV_CALENDAR_SAMPLE = process.env.NODE_ENV !== "production";
```

### 8.2 Criar overrides manuais de mapeamento

Em `calendarProvider.js`, adicionar suporte a `mappingOverrides`:

```js
export function applyCalendarMappingOverrides(importedTopics = [], overrides = {}) {
  return importedTopics.map((topic) => {
    const override = overrides?.[topic.id] || overrides?.[topic.rawTitle];
    if (!override) return topic;
    return {
      ...topic,
      matchedTemaId: override.temaId || topic.matchedTemaId,
      matchedTemaNome: override.temaNome || topic.matchedTemaNome,
      matchConfidence: override.confidence ?? 1,
      matchSource: "manual",
    };
  });
}
```

### 8.3 Store para overrides

No estado:

```js
calendarMappingOverrides: {},
```

Método:

```js
saveCalendarMappingOverride: (importedTopicId, override) =>
  set((s) => ({
    calendarMappingOverrides: {
      ...(s.calendarMappingOverrides || {}),
      [importedTopicId]: {
        temaId: override.temaId,
        temaNome: override.temaNome,
        confidence: 1,
        updatedAt: new Date().toISOString(),
      },
    },
  })),
```

No `partialize`:

```js
calendarMappingOverrides: s.calendarMappingOverrides,
```

### 8.4 UI de correção em `CalendarMappingPanel.jsx`

Hoje o painel é display-only. Transformar em tabela com seletor simples:

```jsx
export default function CalendarMappingPanel({ importedTopics = [], medcofTemas = [], onSaveOverride }) {
  return (
    <div className="space-y-2">
      {importedTopics.map((topic) => (
        <div key={topic.id || topic.rawTitle} className="rounded-xl border border-white/5 bg-black/20 p-3">
          <p className="text-sm font-bold text-white">{topic.rawTitle || topic.nome}</p>
          <p className="text-[11px] text-gray-400">Match atual: {topic.matchedTemaNome || "Sem match"}</p>
          <select
            className="mt-2 w-full bg-black/30 border border-white/10 rounded-lg px-2 py-2 text-xs text-white"
            value={topic.matchedTemaId || ""}
            onChange={(event) => {
              const tema = medcofTemas.find((item) => item.id === event.target.value);
              if (!tema || !onSaveOverride) return;
              onSaveOverride(topic.id || topic.rawTitle, {
                temaId: tema.id,
                temaNome: tema.nome,
              });
            }}
          >
            <option value="">Selecionar tema...</option>
            {medcofTemas.map((tema) => (
              <option key={tema.id} value={tema.id}>{tema.nome}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
```

### 8.5 Logar importação

Quando salvar importação no store:

```js
const importEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.CALENDAR_IMPORT,
  title: "Calendario importado",
  summary: `${topics.length} topicos importados; ${matchedCount} com match automatico.`,
  source: "calendar_import",
  target: { providerId: "user_imported" },
  metrics: {
    totalTopics: topics.length,
    matchedTopics: matchedCount,
    unmatchedTopics: topics.length - matchedCount,
  },
});
```

### DoD da Etapa E

- Em produção, amostra dev não aparece.
- Usuário consegue corrigir match de tópico importado.
- Override persiste.
- Reabrir Cronograma mantém correções.
- Importação aparece no Activity Log.
- Backup inclui overrides.

---

## 9. Etapa F — Weekly Review baseado em eventos

### Objetivo

Fazer o Weekly Review parar de depender só de reflexões soltas e action inbox. Ele deve auditar a semana real.

### Arquivos permitidos

- `src/core/sessionReflection.js`
- `src/components/WeeklyReview.jsx`
- `src/core/store.js`

### 9.1 Estender `buildWeeklyReview` para receber `activityLog`

Em `sessionReflection.js`:

```js
import { summarizeActivity } from "./activityLog";
```

Dentro de `buildWeeklyReview`:

```js
const activitySummary = summarizeActivity(context.activityLog || [], {
  from: shiftDays(today, -6),
  to: today,
});
```

Trocar `executed` por:

```js
executed: {
  sessions: context.sessionsCompleted ?? summary.total,
  revisoes: context.revisoesDone ?? activitySummary.reviewsDone,
  casosClinicos: context.clinicalCases ?? activitySummary.clinicalCases,
  provasAnalisadas: context.examAnalyses ?? activitySummary.examAnalyses,
  minutos: activitySummary.studyMinutes,
},
```

Adicionar:

```js
activitySummary,
```

### 9.2 Salvar Weekly Review no Activity Log

Em `saveWeeklyReview` no store, após normalizar review:

```js
const weeklyReviewEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.WEEKLY_REVIEW,
  title: "Weekly Review concluido",
  summary: `${normalized.executed?.revisoes || 0} revisoes, ${normalized.executed?.casosClinicos || 0} casos, ${normalized.executed?.provasAnalisadas || 0} provas.`,
  source: "weekly_review",
  date: normalized.date,
  target: { weeklyReviewId: normalized.id },
  metrics: normalized.executed || {},
});
```

No retorno:

```js
activityLog: upsertActivityEvent(s.activityLog || [], weeklyReviewEvent),
```

### DoD da Etapa F

- Weekly Review mostra números coerentes com Activity Log.
- Salvar Weekly Review cria evento.
- Sem eventos suficientes, o review mostra “coletando dados”, não inventa diagnóstico.

---

## 10. Etapa G — Data Safety e backup v2

### Objetivo

Garantir que as novas camadas não sejam perdidas e que o usuário tenha confiança para evoluir o app.

### Arquivos permitidos

- `src/core/backup.js`
- `src/components/DataSafetyPanel.jsx`
- `src/App.js`
- `src/core/navigationModel.js`

### 10.1 Backup schema version

Em `backup.js`, elevar versão:

```js
const BACKUP_SCHEMA_VERSION = 2;
```

Garantir campos:

```js
activityLog: state.activityLog ?? [],
calendarMappingOverrides: state.calendarMappingOverrides ?? {},
```

### 10.2 Data Safety direto em “Mais”

A aba “Sistema” não deve ser dependência de produção. `navigationModel.js` já tem labels para `data_safety`, mas `MORE_ITEMS` não expõe corretamente. Adicionar:

```js
{
  view: "data_safety",
  label: "Seguranca de Dados",
  description: "Backup, exportacao e integridade dos seus dados.",
},
```

Em `App.js`, render direto:

```jsx
{view === "data_safety" && (
  <DataSafetyPanel />
)}
```

E remover a regra que redireciona `data_safety` para `statsSection("sistema")`.

### 10.3 Logar backup/export/import

Quando exportar backup, chamar:

```js
logActivityEvent(createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.BACKUP,
  title: "Backup exportado",
  source: "data_safety",
  target: { action: "export" },
}));
```

Quando importar:

```js
logActivityEvent(createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.BACKUP,
  title: "Backup importado",
  source: "data_safety",
  target: { action: "import" },
}));
```

### DoD da Etapa G

- Backup exportado contém `activityLog` e overrides.
- Import restaura timeline.
- Data Safety abre em “Mais”, sem depender da seção Sistema.
- Backup export/import aparece no Activity Log.

---

## 11. Etapa H — Multiusuário e sincronização segura

### Objetivo

Não quebrar usuários anônimos/autenticados quando `activityLog` entrar.

### Diagnóstico

A base está boa:

- `userScope.js` cria chave por usuário.
- `userDataPaths.js` já prevê `getUserActivityPath(uid)`.
- `firestore.rules` restringe `/usuarios/{uid}` ao próprio usuário.

### Decisão recomendada

**Não criar subcoleção Firestore agora.** Primeiro persistir `activityLog` no mesmo Zustand escopado e no backup. Motivo: reduz risco e mantém merge remoto/local atual.

Subcoleção futura só quando:

- `activityLog` passar de 1500 eventos com frequência;
- sync remoto ficar pesado;
- houver auditoria de conflitos.

### Patch mínimo em `App.js`

Onde o estado remoto/local é serializado, incluir:

```js
activityLog: state.activityLog,
calendarMappingOverrides: state.calendarMappingOverrides,
```

Onde mergeia dados remotos:

```js
activityLog: dados.activityLog || [],
calendarMappingOverrides: dados.calendarMappingOverrides || {},
```

### DoD da Etapa H

- Login troca escopo e mantém Activity Log do usuário correto.
- Logout não mistura dados do usuário autenticado com anônimo.
- Backup de usuário A não aparece para usuário B.

---

## 12. Etapa I — Raciocínio clínico: registrar atividade sem refazer banco de casos

### Objetivo

Não reabrir a auditoria antiga de casos/illness script. Aqui o foco é registrar atividade e deixar ação executável.

### Diagnóstico

- `RaciocinioClinico.jsx` tem abas boas: Illness Scripts, Casos, SCT, Anamnese, Conduta.
- `managementScore` existe na UI.
- `ClinicalTaskPanel.jsx` ainda guarda respostas em estado local no ZIP auditado, mas isso pertence à auditoria anterior.

### Patch incremental

Sempre que um caso clínico for registrado em `casosProgresso`, logar:

```js
const clinicalEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.CLINICAL_CASE,
  title: `Caso clinico: ${caso?.tema || casoId}`,
  summary: `Fase ${fase || ""} concluida.`,
  source: "raciocinio",
  target: { casoId, tema: caso?.tema || "", area: caso?.area || "" },
  metrics: {
    fase2Acerto: progresso?.fase2Acerto ?? null,
    sctAcerto: progresso?.sctAcerto ?? null,
    managementScore: progresso?.managementScore ?? null,
  },
});
```

### DoD da Etapa I

- Concluir caso/SCT/conduta cria evento `clinical_case`.
- Action Inbox consegue abrir `raciocinio` quando recomendar caso.
- Weekly Review contabiliza casos pela timeline.

---

## 13. Etapa J — ENAMED/provas: fechar o ciclo de análise

### Objetivo

Análise de prova não deve ficar só como registro. Deve gerar ação, evento e retorno ao cronograma.

### Arquivos permitidos

- `src/core/store.js`
- componente de análise ENAMED/simulados correspondente
- `src/core/actionInbox.js`

### Patch em `registrarAnaliseEnamed`

Depois de salvar análise:

```js
const examEvent = createActivityEvent({
  type: ACTIVITY_EVENT_TYPE.EXAM_ANALYSIS,
  title: "Analise ENAMED registrada",
  summary: analysis?.resumo?.areaCritica
    ? `Area critica: ${analysis.resumo.areaCritica}.`
    : "Prova analisada.",
  source: "enamed",
  target: {
    area: analysis?.resumo?.areaCritica || "",
    analysisId: analysis?.id || "",
  },
  metrics: {
    score: analysis?.score ?? null,
    totalQuestoes: analysis?.totalQuestoes ?? null,
  },
});
```

Gerar ação executável:

```js
createAction({
  type: "new_topic",
  title: "Atacar area fraca da prova",
  reason: `Sua ultima analise apontou ${areaCritica}.`,
  priority: 96,
  source: "enamed",
  target: { view: "crono", area: areaCritica },
});
```

### DoD da Etapa J

- Registrar análise ENAMED aparece na timeline.
- Action Inbox direciona para Cronograma filtrado/área, ou pelo menos abre Cronograma.
- Weekly Review conta prova analisada.

---

## 14. Etapa K — Remover dependências dev da experiência de produção

### Objetivo

Cortar ruído de sistema/desenvolvimento na experiência final.

### Itens obrigatórios

1. `Cronograma.jsx`: esconder “Usar amostra de desenvolvimento” em produção.
2. `StatsPanel.jsx`: se a aba “Sistema” ainda existir no branch atual, remover ou manter apenas em dev real. Como a auditoria anterior já cobria isso, aqui só fazer checagem.
3. `navigationModel.js`: “Mais” deve expor ferramentas úteis ao usuário, não debug.
4. `LaunchChecklistPanel`: manter `devOnly` ou esconder em produção.
5. Strings visíveis: não usar “FSRS”, “overload”, “debug”, “dev sample” para usuário final.

### Comando de varredura

```bash
git grep -nE "Sistema|dev|debug|amostra de desenvolvimento|FSRS|overload|Data Safety|LaunchChecklist" src
```

### DoD da Etapa K

- Usuário final não vê amostra de desenvolvimento.
- Usuário final não vê aba Sistema.
- Data Safety aparece como ferramenta de segurança, não painel dev.
- Launch Checklist não aparece para usuário comum.

---

## 15. Ordem recomendada de implementação

### Bloco 1 — Espinha dorsal

1. **Etapa A — Activity Log Core**
2. **Etapa C — Action Inbox executável**
3. **Etapa D — Fechamento de sessão como dado**

> Depois desse bloco, o app para de “falar” e começa a “executar”.

### Bloco 2 — Produto utilizável

4. **Etapa B — Timeline de atividade**
5. **Etapa E — Importação de calendário v2**
6. **Etapa G — Data Safety/backup v2**

### Bloco 3 — Consolidação

7. **Etapa F — Weekly Review baseado em eventos**
8. **Etapa H — Multiusuário seguro**
9. **Etapa I — Raciocínio clínico registra atividade**
10. **Etapa J — ENAMED/provas fecha ciclo**
11. **Etapa K — Hardening de produção**

---

## 16. Prompts prontos para implementação por blocos

### Prompt 1 — Activity Log + Action Inbox

```txt
Você é um engenheiro sênior React/Zustand. Implemente apenas o Bloco 1 do arquivo MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md.

Escopo:
1. Criar src/core/activityLog.js e src/core/activityLog.test.js.
2. Integrar activityLog ao src/core/store.js.
3. Logar eventos de revisão FSRS, fechamento de sessão e ações do mentor.
4. Corrigir ActionInbox para que toda ação com target executável tenha CTA real.

Regras:
- Não mexer no motor matemático do FSRS.
- Não refatorar Dashboard inteiro.
- Não alterar shape de casos clínicos.
- Não criar nova aba principal.
- Manter strings novas visíveis com UTF-8 correto ou escapes unicode se necessário.
- Rodar npm run check:mojibake, npm test -- --watchAll=false e npm run build.

Entrega:
- Código implementado.
- Lista de arquivos alterados.
- Testes criados/atualizados.
- QA manual: marcar revisão, fechar sessão, aceitar ação, ver eventos no store.
```

### Prompt 2 — Timeline + Backup + Data Safety

```txt
Implemente o Bloco 2 do arquivo MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md.

Escopo:
1. Criar ActivityTimeline.jsx.
2. Integrar timeline em Stats > Atividade.
3. Estender backup.js para incluir activityLog e calendarMappingOverrides.
4. Expor DataSafetyPanel em Mais como data_safety, sem depender de Stats > Sistema.
5. Logar export/import de backup como evento.

Proibido:
- Não mexer no motor FSRS.
- Não criar subcoleção Firestore.
- Não mostrar LaunchChecklist para usuário final.

Rodar:
npm run check:mojibake && npm test -- --watchAll=false && npm run build
```

### Prompt 3 — Calendário v2

```txt
Implemente a Etapa E do arquivo MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md.

Escopo:
1. Esconder "Usar amostra de desenvolvimento" em produção.
2. Criar suporte a calendarMappingOverrides.
3. Transformar CalendarMappingPanel em painel corrigível com select de temas MEDCOF.
4. Persistir overrides no store e backup.
5. Logar calendar_import no Activity Log.
6. Criar testes para applyCalendarMappingOverrides.

Proibido:
- Não implementar OCR/PDF agora.
- Não instalar dependências novas.
- Não alterar a base MEDCOF.
```

### Prompt 4 — Weekly Review + ENAMED + clínico

```txt
Implemente as Etapas F, I e J do arquivo MEDREV_AUDITORIA_INCREMENTAL_FUNCOES_RESTANTES.md.

Escopo:
1. Weekly Review deve usar summarizeActivity(activityLog).
2. Salvar Weekly Review cria evento weekly_review.
3. Concluir caso clínico/SCT/conduta cria evento clinical_case.
4. Registrar análise ENAMED cria evento exam_analysis e ação executável para Cronograma/Sims.

Proibido:
- Não reescrever RaciocinioClinico.jsx inteiro.
- Não alterar shape dos casos clínicos.
- Não refazer score clínico da auditoria anterior.
```

---

## 17. Checklist de QA manual

### Activity Log

- [ ] Marque D0/D1/D4 de um tema.
- [ ] Abra `Stats > Atividade`.
- [ ] Verifique se aparecem eventos `Revisao`.
- [ ] Feche sessão.
- [ ] Verifique se aparece `Fechamento`.
- [ ] Aceite uma ação do mentor.
- [ ] Verifique se aparece `Mentor` com status `accepted`.

### Action Inbox

- [ ] Gere revisão vencida.
- [ ] Ação “Resolver revisões vencidas” deve ter botão `Iniciar`.
- [ ] Clique e confirme que abre FocusMode no tema correto.
- [ ] Gere ação de caso clínico.
- [ ] Clique e confirme que abre Raciocínio Clínico.
- [ ] Gere ação de área fraca e confirme que abre Cronograma/Sims.

### Calendário

- [ ] Importar texto simples com 3 tópicos.
- [ ] Ver preview.
- [ ] Corrigir manualmente 1 match.
- [ ] Recarregar app e confirmar override.
- [ ] Confirmar evento `Calendario importado` na timeline.
- [ ] Em build de produção, botão de amostra dev não aparece.

### Backup

- [ ] Exportar backup.
- [ ] Confirmar JSON com `activityLog`.
- [ ] Importar backup em estado limpo.
- [ ] Timeline reaparece.

### Multiusuário

- [ ] Usar anônimo e gerar eventos.
- [ ] Fazer login.
- [ ] Verificar que eventos do anônimo não vazam automaticamente sem merge pretendido.
- [ ] Logout retorna escopo anônimo.

---

## 18. Riscos e decisões que NÃO devem ser tomadas agora

### Não instalar `ts-fsrs` agora

Apesar de o ecossistema `ts-fsrs` estar ativo e ter scheduler/optimizer, isso não resolve o problema atual. O gargalo é execução e telemetria, não trocar biblioteca. Além disso, a stack atual é CRA/Zustand; instalar biblioteca nova sem necessidade aumenta risco. Deixe para uma etapa futura de otimização com dados reais.

### Não criar Firestore subcollection agora

`userDataPaths.js` já prevê `activityLog`, mas criar subcoleção antes do log estabilizar aumenta complexidade de merge/sync. Primeiro store + backup. Depois subcoleção.

### Não transformar Weekly Review em rede social de estatísticas

Weekly Review deve responder:

1. o que executei;
2. o que travou;
3. qual ajuste vem primeiro;
4. qual ação abre agora.

Qualquer coisa além disso entra em “avançado”.

### Não expandir fechamento de sessão demais

Fechamento de sessão precisa levar menos de 20 segundos. Se ficar clínico demais, o aluno não usa.

---

## 19. Definition of Done global

Para qualquer bloco:

- [ ] `npm run check:mojibake` verde.
- [ ] `npm test -- --watchAll=false` verde ou falhas documentadas como pré-existentes.
- [ ] `npm run build` verde.
- [ ] Nenhuma string dev visível para usuário final.
- [ ] Toda ação do mentor tem target executável ou é explicitamente `noop`.
- [ ] Toda função nova cria evento no Activity Log.
- [ ] Backup exporta/importa estado novo.
- [ ] Não vaza feature de residência para vestibular sem `platformFeatures`.
- [ ] Não cria taxonomia paralela se já existe core para isso.
- [ ] Sem commit/deploy automático.

---

## 20. Conclusão técnica

O próximo salto do MedRev não é adicionar mais cards. É criar **auditabilidade operacional**.

A sequência certa é:

```txt
Activity Log -> Action Inbox executável -> Fechamento útil -> Timeline -> Calendário corrigível -> Backup -> Weekly Review real
```

Isso transforma o MedRev de “app com bons módulos” em **sistema de estudo que lembra, decide, executa e explica**. Depois disso, faz sentido voltar para refinamentos de FSRS, score clínico e dashboards avançados com dados reais.

---

## 21. Fontes externas consultadas

- Anki Manual — Deck Options / FSRS: retenção desejada, carga e uso correto de Again.
- open-spaced-repetition/free-spaced-repetition-scheduler: dificuldade, estabilidade, recuperabilidade e adaptação a histórico.
- ts-fsrs README: ecossistema JS/TS de scheduler/optimizer FSRS.
- Revisão MDPI 2025 sobre Learning Analytics Dashboards: feedback acionável e baixa inferência.
- Literatura de illness scripts e Script Concordance Test em educação médica: raciocínio sob incerteza, feedback estruturado e scripts de expert.
- AMBOSS e plataformas de estudo médico: referência de posicionamento para ferramenta clínica/exame, não como banco de questões substituto.
