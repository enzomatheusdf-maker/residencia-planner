# MEDREV — Onboarding v2 (Gerador de Plano) + Motor de Cronograma/Agenda V2 — Plano de Handoff para o Sonnet

> **Modo:** plano (Opus auditou, não implementou nada). Documento mastigado para o Sonnet executar **um bloco por vez**.
> **Decisões do Enzo (2026-06-02):** (1) escopo = **Motor + Onboarding v2 sequenciado**; (2) Agenda **dentro de Plano/Cronograma** (sem novo item de nav); (3) **Wizard v2 unificado** com branch Residência/Vestibular; (4) **beta exige login** — anônimo só demo local.
> **Leia antes:** `docs/MEDREV_CONTEXT_FOR_AI.md` e `docs/MEDREV_CALENDARIO_CRONOGRAMA_V2_WIZARD_PLAN.md`.

---

## Context — por que esta mudança

Hoje o MedRev tem peças boas e desconexas: OnboardingWizard, VestibularStartTrail, Cronograma, Mentor, WeeklyReview, importação. Mas o usuário novo entra e pensa "por onde começo?". O onboarding atual é uma tela de boas-vindas de 3 passos (objetivo / provider / modo) que **não gera plano, não define datas, não distribui temas por dia e não termina numa primeira ação executável**. E o "motor" que faria isso (viabilidade, distribuição, agenda) **não existe no código** — `scheduleWizard.js`, `calendarDistribution.js`, `agendaEngine.js`, `calendarImportCsv.js` estão **ausentes**.

**Resultado pretendido:** o onboarding vira o **ponto de integração do produto**. Termina em 5–8 min com: `planSetup` salvo → temas distribuídos (`scheduledTopics`) → Agenda derivada → Mentor com primeira ação → Dashboard sem tela vazia, mostrando *"Hoje: estude X, ~50 min. Depois disso sua revisão D1 é criada automaticamente."*

Regra-mãe do produto a fechar:
```
Onboarding cria o plano → Cronograma organiza os temas → Agenda distribui o dia →
Mentor escolhe a próxima ação → Dashboard executa → Stats prova se funcionou.
```

---

## 1. Estado atual do onboarding (auditado, com evidência)

### Fluxo Residência — `src/components/OnboardingWizard.jsx`
- 3 passos: **Objetivo** (`GOAL_OPTIONS`: enamed/residencia/ambos, l.5-9,76-95) → **Calendar provider** (medcof/estrategia/custom, l.97-129) → **Modo** (mentor/manual, l.131-149).
- Payload em `onComplete` (l.48-58): `{ step, goal, calendarProvider, mentorMode, modules, completed }`.
- Montado no **App root** (`App.js` l.1001-1006 e dentro do FocusMode l.973-978). Handler `handleOnboardingFinish` (l.930-942) chama `completeOnboarding(choice)`, seta `calendarProvider`, `mentorMode`/`modoSimples`, `setView("dash")`.
- Gate: `onboardingDone || isOnboardingComplete({ onboarding })` (`App.js` l.209-211; `onboardingGate.js:shouldShowGlobalOnboarding`).

### Fluxo Vestibular — `src/components/VestibularStartTrail.jsx` + `src/core/vestibularOnboarding.js`
- 5 passos: exam → examDate → baselineMode → planMode → resumo (l.66-169).
- Escreve `meta.vestibularStart` + `meta.provasAlvo=[targetExam]` + `meta.dataProva=examDate` (l.29-42).
- **Montado DENTRO do Dashboard** (`Dashboard.jsx` l.1607), não no App root. Gate: `shouldShowVestibularStartTrail` (`onboardingGate.js` l.10-14).

### Estado persistido — `src/core/store.js`
- `meta.onboarding` = `{ completed, completedAt, step, goal, calendarProvider, mentorMode, modules{raciocinioClinico,anki,enamed} }` (defaults em `onboarding.js:getOnboardingDefaults`).
- `meta.vestibularStart` = `{ completed, targetExam, examDate, baselineMode, planMode, completedAt }` (l.224).
- Plano hoje só tem: `meta.temasPerWeek` (default 6), `meta.estrategiaStartDate`, `meta.dataProva`, `meta.maxRevisoesDia` (30), `meta.intervaloMaxDias` (180).
- `plat` ("res"/"vest") **não é escolhido no onboarding** — default `"res"` (l.215), trocado manualmente na Sidebar (`Sidebar.jsx:84 setPlat`).
- Actions relevantes: `completeOnboarding` (l.305-320), `setOnboardingDone` (l.297-304), `resetOnboarding` (l.321-328), `saveImportedCalendarTopics`/`saveCustomCalendarTopics` (l.270-283).

### WelcomePopup / DailyBriefing
- `Dashboard.jsx` l.143-199 (WelcomePopup) + `src/core/dailyBriefing.js` (`buildDailyBriefing`, `canShowDailyBriefing`). Gate em `onboardingGate.js:shouldShowDailyBriefing` (só após onboarding+trail). Dismiss por dia/uid em localStorage.

---

## 2. Onde há duplicação ou conflito

| # | Conflito | Evidência |
|---|----------|-----------|
| D1 | **Dois onboardings desalinhados** — res no App root, vest dentro do Dashboard, schemas separados (`meta.onboarding` vs `meta.vestibularStart`), passos diferentes. | `OnboardingWizard.jsx` / `VestibularStartTrail.jsx`+`Dashboard.jsx:1607` |
| D2 | **`plat` desconectado do `goal`** — onboarding pergunta objetivo (enamed/residencia/ambos) mas nunca seta `plat`; vestibular só aparece se o usuário já trocou pra "vest" na Sidebar. Vestibulando novo cai no fluxo de Residência. | `OnboardingWizard` não chama `setPlat`; `store.js:215` |
| D3 | **"calendarProvider" overloaded** — é a escolha do passo 2 do onboarding E o slice `state.calendarProvider{activeId,importedTopics,customTopics}`. Confunde fonte do plano com estado de importação. | `store.js:217-221` |
| D4 | **Pacing sem distribuição** — `meta.temasPerWeek` é um slider que não distribui de fato; Cronograma só agrupa por `semana` importada. Sem dias/tópicos-por-dia/viabilidade. | `Cronograma.jsx:343-365`, `calendarProvider.js` (sem distribuição) |
| D5 | **CSV prometido, inexistente** — `CalendarImportWizard.jsx` aceita só Texto/JSON; `parseCalendarImport` não tem CSV nem template. | `CalendarImportWizard.jsx:47-48`, `calendarProvider.js:235-242` |

---

## 3. Que partes não estão integradas

- **Onboarding → Agenda:** não existe Agenda. Onboarding não produz `scheduledTopics`/`studyDays`/`startDate`/`targetDate`/`scopeMode`. Arquivos `agendaEngine.js`, `scheduleWizard.js`, `calendarDistribution.js` **ausentes**.
- **Onboarding → Mentor:** `mentorSignals.js` não tem `firstActionReady`/`firstActionTarget`/`agendaTodaySummary`/`planHealth` (todos **ausentes**). Usuário novo sem plano cai em `decideMentorAction` → `new_topic` (prio 66) ou `rest` (prio 30) genérico (`mentorDecisionPolicy.js:279-339`).
- **Onboarding → Dashboard:** EmptyState "Comece em 2 minutos" → "Abrir Ajustes/Cronograma" (`Dashboard.jsx:1392-1455`). Não há "Hoje: X tarefas · Ver agenda" alimentado pelo plano.
- **Onboarding → WeeklyReview:** gate já é são (`weeklyReviewGate.js`: sessions≥5 OU volume≥20 OU 1ª atividade ≥7 dias). Mas não conhece `firstPlanCreatedAt` — usa datas de atividade. OK manter; só passar sinais.
- **Onboarding → Data Safety / login:** nenhuma checagem antes de criar plano.
- **Onboarding → "Já domino" / Simulados:** nunca oferecidos no fluxo inicial.

---

## 4. Schema mínimo do Onboarding v2 (sem quebrar dados existentes)

**Princípio:** aditivo. Não renomear/remover `meta.onboarding` nem `meta.vestibularStart` (compat). Adicionar `meta.onboarding.version` e um novo bloco `meta.planSetup`. Persistir **settings + scheduledTopics**; **derivar** agenda/projeções (decisão do doc: não persistir agenda inteira).

```js
// meta.onboarding (estender — manter campos atuais)
meta.onboarding = {
  ...atual,            // completed, completedAt, step, goal, calendarProvider, mentorMode, modules
  version: 2,
  source: "wizard",    // wizard | skipped | importCsv | jaDomino | manual
  dismissedAt: null,   // se pulou
  track: "res" | "vest",   // branch escolhido — ESPELHA e dispara setPlat
}

// meta.planSetup (NOVO — fonte de verdade do plano)
meta.planSetup = {
  completedAt: null,
  startDate: "2026-06-02",
  targetDate: "2026-12-01" | null,
  horizonMode: "target_date" | "duration",
  horizonMonths: 6,
  studyDays: { dom:{active,maxNewTopics}, seg:{...}, ... }, // como CALENDARIO_V2 §2.2
  topicsPerWeek: 18,            // derivado de studyDays
  scopeMode: "essential" | "complete" | "intensive",  // default essential
  minutesPerTopic: 50,         // default 50 (decisão do doc)
  focusMode: "institutions" | "medrev_base" | "user_import",
  institutions: ["ENAMED"],
  simulationPlan: "none" | "diagnostic" | "monthly" | "biweekly" | "weekly_final",
  feasibility: { availableCapacity, totalTopics, ratio, status, warnings:[] },
}

// scheduledTopics (NOVO slice OU dentro de calendarProvider) — D0 distribuído
// item: { temaId, area, scheduledDate, scheduledWeek, distributionReason, priority }
```

> **Gates derivados (criar em `onboardingGate.js`):**
> `isPlanSetupComplete(state)` = `!!meta.planSetup?.completedAt`.
> `shouldShowOnboarding(state)` = mantém regra atual + libera v2.
> Mentor consome `planSetup` + `scheduledTopics` (ver bloco ONB4).

---

## 5. Fluxo de telas recomendado (Wizard v2 unificado, gated no App root)

Camada 1 — **obrigatória, curta** (branch após o passo 1):

```
1. Objetivo            → res | vest  (seta track + setPlat; vest bloqueia ENAMED/clínico)
2. Data-alvo           → data exata | não sei (horizonte 6m) | "estudar por X meses"
3. Fonte do plano      → Cronograma base MedRev | Importar (CSV/texto) | Manual | "Só revisar (Já domino)"
4. Dias + carga        → studyDays + maxNewTopics/dia (copy: "tópico novo = D0; revisões entram depois")
5. Escopo              → Essencial(default) | Completo | Intensivo
6. Preview/Viabilidade → capacidade vs temas vs semanas → diagnóstico + soluções (Plan Feasibility Check)
7. Primeira ação       → "Seu plano está pronto. Hoje: estude X (~50 min)." [Começar] [Ver agenda] [Ver plano]
```

- **Branch Vestibular** (passo 1 = vest): troca passos por exam-alvo (ENEM/Fuvest/Unicamp/outra) + data + matérias fortes/fracas + dias + simulados. **Reusa** a engine de viabilidade/distribuição; **nunca** mostra ENAMED, caso clínico, raciocínio, conduta/prescrição. Aposenta o `VestibularStartTrail` standalone (migra sua lógica `vestibularOnboarding.js` pra dentro do branch).
- **Pular** permitido → `source:"skipped"`, modo limitado com CTA "Configure seu plano para liberar Agenda e Mentor".
- **Modo iniciante** (primeiros dias): esconder avançado (stats complexas, raciocínio avançado, SCT, telemetria, WeeklyReview), mostrar só Hoje/Plano/Agenda/Revisar.

---

## 6. Como salvar estado sem quebrar dados existentes

1. **Aditivo:** novos campos em `meta.planSetup` + `meta.onboarding.version/source/track`. `getOnboardingDefaults` (`onboarding.js`) ganha `planSetup` default `{}` via deep-merge — store já faz deep-merge no persist (`reviewflow-v6`).
2. **Distribuição persistida em `scheduledTopics`** (reusar `calendarProvider.importedTopics`/`customTopics` quando a fonte for import/custom; criar `calendarProvider.scheduledTopics` para o gerado). **Não** persistir agenda mensal — derivar via `agendaEngine`.
3. **Migração suave:** usuário com `meta.onboarding.completed===true` e sem `planSetup` = veterano → **não** reabrir wizard; mostrar banner opcional "Gerar plano com o novo assistente". `onboarding.version` distingue v1/v2.
4. **Login antes de persistir** (decisão 4): no passo 6→7, rodar checagem silenciosa de scope (`userScope.js`/`authSession.js`). Se anônimo: "Antes de criar seu plano, confirme onde salvar seus dados" → login. Anônimo só demo local, sem persistir plano definitivo.
5. **Não tocar** Firebase/Auth/localStorage/FSRS sem autorização explícita por bloco.

---

## 7. Conexão com Agenda / Cronograma / Mentor (decisão: Agenda dentro de Plano)

- **Agenda NÃO é nova view de nav.** Vira **aba/seção dentro da view `crono`** (Plano). `navigationModel.js` mantém PRIMARY_ITEMS atuais (dash/crono/sims/stats/banco/more). Sub-tabs internas em `Cronograma.jsx`: **Plano** (blocos por semana) | **Agenda** (calendário mensal + tarefas do dia). Sem mexer em LEGACY_VIEW_MAP além de garantir `agenda→crono`.
- **Cronograma → Agenda:** Cronograma gera D0 planejado (`scheduledTopics`); FSRS gera revisões reais após D0; `agendaEngine.buildAgendaItems` junta D0 + revisões + atrasadas + simulados + weekly.
- **Onboarding → Mentor:** `mentorSignals.js` ganha `firstAction` (de `getFirstActionAfterOnboarding`) e `agendaTodaySummary` (de `agendaEngine.getAgendaDaySummary`). `mentorDecisionPolicy` usa `firstAction` como target quando não há fila/revisão (substitui o `rest` genérico do novo usuário).
- **Dashboard:** EmptyState passa a mostrar, quando `planSetup` completo, "Hoje: X tarefas · Y min" + [Ver agenda]; quando incompleto, CTA "Configurar plano" abre o Wizard v2.

---

## 8. Diferenças Residência vs Vestibular

| Eixo | Residência | Vestibular |
|------|-----------|-----------|
| Branch passo 1 | track="res", `setPlat("res")` | track="vest", `setPlat("vest")` |
| Provas | ENAMED/instituições | ENEM/Fuvest/Unicamp/outra |
| Bloqueios | — | ENAMED, Raciocínio Clínico, Illness Script, casos, conduta, prescrição, SCT, linguagem médica |
| Fonte do plano | MedRev base / import / custom / Já domino | base vestibular / import / custom |
| Simulados | diagnóstico/quinzenal/mensal | idem, sem item clínico |
| Gating | `featureEnabled(plat, feature)` em toda tela nova | idem — testar "vest sem item clínico" |

Reaproveitar `platformFeatures.js:featureEnabled`. Aposentar `VestibularStartTrail` só **depois** do branch vest estável (mover lógica, não duplicar).

---

## 9. Riscos P0 / P1

**P0**
- **Persistência/multiusuário:** criar plano antes de login pode misturar dados entre contas (CONTEXT §16). Mitigar: login obrigatório antes de `planSetup.completedAt`; checagem de scope no passo 6→7.
- **Regressão do onboarding atual:** o gate v2 não pode prender veterano (`completed===true`) num wizard novo. Mitigar: `version` + migração suave (§6.3) + teste.
- **Vazamento medicina→Vestibular:** branch vest mostrando ENAMED/clínico. Mitigar: `featureEnabled` + teste "vest não tem item clínico".
- **Mojibake:** todo PT-BR novo passa em `npm run check:mojibake`; evitar emojis hardcoded (preferir lucide).

**P1**
- **Wizard gigante** assustando (1200 temas). Mitigar: `scopeMode` default **essential** + aviso forte > 6 tópicos/dia.
- **Agenda como sub-tab** inchando `Cronograma.jsx`. Mitigar: componentes `AgendaMonthGrid`/`AgendaDayDetails` separados, importados na sub-tab.
- **`mentorSignals` quebrando** ao adicionar campos. Mitigar: campos opcionais, defaults seguros, testes de contrato.
- **CSV** com PT-BR/encoding. Mitigar: suportar `,` e `;`, validar colunas obrigatórias, não implementar PDF.

---

## 10. Plano em blocos pequenos (ordem de dependência — Motor → Onboarding)

> Cada bloco: 1 escopo, testes próprios, `check:mojibake` + `npm test --watchAll=false` + `CI=false npx react-scripts build`. **Sem commit/push/deploy/libs.** Parar e entregar relatório ao fim.

### Camada A — Motor (core puro, sem UI)

**MTR1 — agendaEngine** *(base de tudo)*
`buildAgendaItems`, `estimateTaskMinutes`, `sortAgendaItemsForDay`, `groupAgendaByDate`, `getAgendaDaySummary`, `buildAgendaMonth`. Junta revisões FSRS + D0 + atrasadas + simulados + weekly; **casos clínicos só em res**. Horizonte até 365 dias.

**MTR2 — scheduleWizard + calendarDistribution**
`calculateWeeklyCapacity`, `calculatePlanningHorizon`, `calculateFeasibility`, `selectTopicsByScope`, `distributeTopics`, `buildSchedulePreview`, `generateSchedule`. Regras: não ocultar/apagar temas; overflow → próximas datas; respeitar dias ativos e `maxNewTopics`; usar data explícita do tópico quando existir; warnings de inviabilidade; escopos essential/complete/intensive. (Pseudocódigo de distribuição: CALENDARIO_V2 §7.)

**MTR3 — calendarImportCsv**
Parser CSV (colunas `semana,dia,data,area,tema,subtema,ordem,duracaoMin,prioridade,observacoes`; obrigatórios `semana,area,tema`; aceitar `,` e `;`). Template baixável. Reusar `normalizeCalendarTopic` de `calendarProvider.js`. **Sem PDF** — só instrução "copie o texto e peça pra IA converter".

### Camada B — Contrato do Onboarding v2 (sem UI)

**ONB1 — gate + schema + engine de onboarding**
`onboardingGate.js`: `isPlanSetupComplete`, `shouldShowOnboardingV2`. `onboarding.js`: estender defaults com `planSetup`/`version`/`source`/`track` (aditivo). Novo `src/core/onboardingEngine.js`: `buildInitialPlanSetup`, `recommendScopeMode`, `recommendSimulationPlan`, `getFirstActionAfterOnboarding` (puras, reusam MTR2). Store: action `completePlanSetup(planSetup, scheduledTopics)` + `setOnboardingTrack`.

### Camada C — UI

**ONB2 — Wizard v2 (UI) unificado com branch**
`OnboardingWizardV2.jsx` + steps (`StepObjetivo`, `StepData`, `StepFonte`, `StepDiasCarga`, `StepEscopo`, `StepPreview`, `StepPrimeiraAcao`) + branch vest. Montado no App root (substitui montagem do OnboardingWizard atual via gate v2). Passo Objetivo seta `track`+`setPlat`. Passo Preview chama `calculateFeasibility`. Passo final chama `completePlanSetup` + `getFirstActionAfterOnboarding` + `setView`.

**ONB3 — Agenda como sub-tab de Plano**
Sub-tabs em `Cronograma.jsx` (Plano | Agenda). Novos `AgendaMonthGrid.jsx`, `AgendaDayDetails.jsx`, `AgendaTaskItem.jsx` consumindo `agendaEngine`. `navigationModel.js`: garantir alias `agenda→crono` (sem novo item). **Sem** mexer em Dashboard aqui.

**ONB4 — Integração Dashboard/Mentor**
`mentorSignals.js`: + `firstAction`, `agendaTodaySummary`, `planHealth`. `mentorDecisionPolicy.js`: usar `firstAction` como target do novo usuário (no lugar do `rest`/`new_topic` genérico). `Dashboard.jsx`: EmptyState/Hoje mostra "Hoje: X · Y min" + [Ver agenda] quando `planSetup` completo; senão CTA "Configurar plano". WelcomePopup mantido.

**ONB5 — Branch Vestibular + aposentar trail**
Finalizar branch vest no Wizard v2; migrar `vestibularOnboarding.js` para dentro; remover montagem de `VestibularStartTrail` do Dashboard após paridade. Garantir `featureEnabled` em tudo.

> Opcionais pós-MVP (NÃO implementar agora): PDF automático, drag-and-drop de calendário, Google Calendar, push, Activity Log, BI pesado, ranking, social, simulado próprio (só "registrar resultado externo").

---

## 11. Arquivos permitidos / proibidos por bloco

| Bloco | Permitidos (criar/editar) | Proibidos |
|-------|---------------------------|-----------|
| MTR1 | `src/core/agendaEngine.js` (+`.test.js`) | UI, Store, Dashboard, Cronograma, FSRS |
| MTR2 | `src/core/scheduleWizard.js`, `src/core/calendarDistribution.js` (+`.test.js`) | UI, Store |
| MTR3 | `src/core/calendarImportCsv.js` (+`.test.js`), `src/components/CalendarImportWizard.jsx` (add aba CSV) | PDF, Store schema, FSRS |
| ONB1 | `src/core/onboardingGate.js`, `src/core/onboarding.js`, `src/core/onboardingEngine.js` (+tests), `src/core/store.js` (só novas actions aditivas) | Firebase/Auth, FSRS, persistência (chave/migração) |
| ONB2 | `src/components/OnboardingWizardV2*.jsx`, `src/App.js` (troca de montagem via gate) | Dashboard, Mentor core, FSRS, Firebase |
| ONB3 | `src/components/Cronograma.jsx`, `src/components/Agenda*.jsx`, `src/core/navigationModel.js` | Dashboard, Store, FSRS, Mentor |
| ONB4 | `src/components/Dashboard.jsx`, `src/core/mentorSignals.js`, `src/core/mentorDecisionPolicy.js` | FSRS, Store schema, Cronograma |
| ONB5 | `src/components/OnboardingWizardV2*.jsx`, `src/core/vestibularOnboarding.js`, `src/components/VestibularStartTrail.jsx` (remoção), `src/components/Dashboard.jsx` (tirar montagem) | ENAMED/clínico no branch vest |

**Regra global (de AGENTS.md / CONTEXT §20):** se precisar mexer em `store.js` persistência, Firebase/Auth/localStorage ou FSRS fora do escopo → **parar e pedir autorização**. Usar `git grep`/`git ls-files`, nunca varrer node_modules/build/backups.

---

## 12. Testes necessários (por bloco)

- **MTR1:** agrupamento por data; ordenação inteligente (relearning→vencidas→hoje→pós-simulado→D0 crítico→novo→weekly→manual); estimativa de tempo; horizonte 365d; **vest sem item clínico**.
- **MTR2:** capacidade semanal = soma `maxNewTopics`; viabilidade viável/apertado/inviável; overflow para próximas datas; respeita dias ativos; usa data explícita; warnings (`capacity_overflow`, `too_many_topics_per_day`, `no_rest_day`, `target_date_too_close`); escopos essential/complete/intensive.
- **MTR3:** colunas obrigatórias; `,` e `;`; data vazia; linhas inválidas; mapeamento via `normalizeCalendarTopic`.
- **ONB1:** `isPlanSetupComplete` true/false; `buildInitialPlanSetup` defaults (50min, essential, warn>6/dia); `getFirstActionAfterOnboarding` retorna `{temaId, stepKey:"d0", estimatedMinutes}`; defaults aditivos não quebram `getOnboardingDefaults` de meta v1.
- **ONB2:** branch res/vest seta `track`+`plat`; pular → `source:"skipped"`; Preview chama feasibility; final persiste `planSetup` + `scheduledTopics`.
- **ONB3:** sub-tab Agenda renderiza mês atual, hoje destacado, contagem por dia; alias `agenda→crono`.
- **ONB4:** Mentor usa `firstAction` quando sem fila; Dashboard mostra "Hoje: X·Y min"; veterano (v1, sem planSetup) não é preso no wizard.
- **ONB5:** branch vest nunca expõe ENAMED/clínico (`featureEnabled`); paridade com trail antigo antes de remover.

---

## Verificação end-to-end (após cada bloco e no fim)

```bash
npm run check:mojibake
npm test -- --watchAll=false
CI=false npx react-scripts build
```
- **Manual (preview/dev):** novo usuário → Wizard v2 → escolhe res → data → fonte base → dias/carga → escopo essencial → Preview mostra viabilidade → finaliza → Dashboard "Hoje: estude X (~50 min)" + Ver agenda; abrir Plano → sub-tab Agenda mostra D0 distribuído.
- **Branch vest:** repetir escolhendo vest → confirmar ausência de ENAMED/caso clínico/raciocínio.
- **Veterano:** estado com `meta.onboarding.completed===true` sem `planSetup` → NÃO reabre wizard; banner opcional aparece.
- **Lembrete:** gates `devOnly` e diferenças de produção não são observáveis no dev server (NODE_ENV=development) — validar gating sensível via build de produção.
- **Atenção:** unused-vars reais falham build sob `CI=true` (deploy gh-pages) — manter imports limpos.

---

## Ordem de execução recomendada para o Sonnet

```
MTR1 → MTR2 → MTR3 → ONB1 → ONB2 → ONB3 → ONB4 → ONB5
```
Um bloco por vez. Branch + checkpoint antes; test + build + commit local depois. Prompt base de cada bloco: ver §10 de `MEDREV_CALENDARIO_CRONOGRAMA_V2_WIZARD_PLAN.md` (mesma disciplina).
