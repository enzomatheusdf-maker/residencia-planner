# 01 — SYSTEM MAP & FEATURE INVENTORY

Fonte de verdade: código do ZIP `Bro` lido diretamente (não documentação). Onde documentação e código divergem, o código prevaleceu e a divergência está registrada na §6.

## 1. Baseline técnico (Fase 0)

| Item | Valor |
|---|---|
| Stack | React 19.2, Zustand 5 (persist/localStorage), Firebase 12 (Auth+Firestore), CRACO, Tailwind 3.4, framer-motion, ts-fsrs 5.4, zod 4 |
| Arquivos src | 268 JS/JSX (142 em `core`, 54 componentes) |
| Testes | 72 suítes (`*.test.js`) — NÃO executados nesta auditoria (sem rede p/ npm install); executar no preflight CC-0 |
| Linhas | ~50.760 em src |
| Deploy | gh-pages (`homepage: enzomatheusdf-maker.github.io/residencia-planner`) |
| Scripts | check:mojibake, audit:*, build (mojibake gate antes do craco build), test, deploy |
| Maiores arquivos | RaciocinioClinico.jsx 3.007 · Dashboard.jsx 2.925 · Modals.jsx 2.773 · FocusMode.jsx 2.075 · store.js 1.890 · StatsPanel.jsx 1.714 · fsrs.js 1.219 · mastery.js 1.084 |
| Lixo na raiz | ~45 MDs de planos antigos + `casos_gerados/`, `codex_lotes/`, JSONs de pipeline. Não são produto; ver Kill List (doc 05) |

## 2. Cadeia central (verificada, não presumida)

```text
store.js (estado + persist)
  └─ buildDecisionOutputs() → decisionCore.buildDecisionCoreSnapshot()
       ├─ mentorSignals.buildMentorContext()      [427 linhas — agrega FSRS, agenda, simulados, erros, casos, Anki, plano, modo]
       ├─ mentorDecisionPolicy.decideMentorAction() [prioridades 100→30 confirmadas: inconsistência 100, sobrecarga 95, relearning 94, vencidas 92/91, fila_do_dia 88, simulado 82, análise 80, erro dominante 78, ENAMED/fraca 76, caso clínico 72, tema novo 67/66, anki 40, rest 30]
       ├─ buildMentorTodayPlan()
       ├─ dailyCommandEngine.buildDailyCommand()  [rotas canônicas + fallbacks continue_session / plan_setup / rest_or_light_day]
       └─ actionInbox.buildActionInboxFromDecisionCore()
Dashboard.jsx ──┐
ActionInbox.jsx ─┴─> dailyCommandTargetExecutor.executeDailyCommandTarget(handlers)
```

Confirmações positivas:
- ActionInbox usa o MESMO executor (ActionInbox.jsx:6,33). Sem executor paralelo. ✔
- `ajustes` nunca é view renderizada; vira rota `settings` + `onOpenAjustes({initialTab})` (executor). ✔
- Telemetria `mentor_action_seen/started/completed` com contrato de payload validado em `telemetry.js:6-8` e disparada no Dashboard (1482/1498/1619). ✔
- `mentorAutopilot.js` NÃO é motor duplicado — é adapter de contexto legado sobre a mesma policy. ✔
- App.js bloqueia view `raciocinio` quando módulo desativado (App.js:403). Princípio 14 parcialmente cumprido. ✔

## 3. Achados críticos (numerados — referenciados pelos blocos do doc 07)

**F1 — Segundo motor de prioridade no Dashboard (P0).** `Dashboard.jsx:1398–1452`: `queueFallbackAction` (prio 88, source `dashboard-fallback`) substitui a ação do Mentor quando `pending > 0` e (a) não há ação OU (b) a ação é `rest`; e substitui o `dailyCommand` quando seu tipo é `rest_or_light_day`. Como a policy JÁ possui `fila_do_dia` em prio 88 e só chega em `rest` quando a fila está vazia NA VISÃO DO SNAPSHOT, o disparo desse override com snapshot presente significa uma única coisa: o snapshot está stale/divergente do estado vivo. O band-aid esconde o bug de frescor e viola "o Mentor sabe não recomendar" (um rest deliberado pós-sobrecarga seria atropelado). Correção em CC-1 + CC-2.

**F2 — Staleness do decisionSnapshot (P0).** `activeDecisionSnapshot = decisionSnapshot?.plat === plat ? ... : null` valida plat mas NÃO valida data. Snapshot persistido de ontem pode comandar o dia de hoje até algum evento disparar rebuild. Rebuilds confirmados em: setMeta (store:395), rebuildActionInboxForToday (604), rebalance (1097/1146), conclusão de sessão/domínio (1569). Falta gatilho determinístico de rollover de dia / retorno de foco do app. Correção em CC-2.

**F3 — Degradação silenciosa do executor (P0).** `dailyCommandTargetExecutor.js`: rota desconhecida → `setView("dash")` + `return false`, sem telemetria. Em produção, um target quebrado seria invisível. Além disso `focus` sem `temaId/stepKey` e sem `queueItem` cai em `setView("crono")` retornando `true` — sucesso falso. Correção em CC-3 (evento `mentor_action_target_missing` + resultado estruturado).

**F4 — Monólitos de UI (P1).** Os 4 arquivos-monstro concentram o risco de regressão. Dashboard mistura: cálculo de fallback, montagem do Comando, telemetria e render. Decomposição com escopo cirúrgico em CC-6 (somente após CC-1..CC-3, nunca junto).

**F5 — store.js como deus-objeto (P1).** 1.890 linhas com merge de migração extenso (1811–1880). Os pontos de rebuild estão espalhados; CC-5 cria um gateway único `rebuildDecision(reason)` sem mudar comportamento.

**F6 — Mistura de unidades no Comando.** `estimatedMinutes` do fallback do Dashboard usa `Math.max(20, exibidosHojeMinutes)` — estimativa de fila inteira apresentada como se fosse uma ação. Morre junto com F1.

**F7 — Forecast tem guarda de amostra** (`sem_dado`, banda, nSimulados em forecast.js:584–645). Princípio 7 atendido no motor; resta garantir que a UI nunca mostre número sem a banda/amostra (verificação em CC-7).

**F8 — Segurança multiusuário.** firestore.rules: default-deny com `isOwner(uid)` por subcoleção ✔. `userScope.js`: `assertUid`, `assertOwnerUidMatchesScope`, persist key local por sessão anônima (store:43) ✔. Risco residual: troca de conta no MESMO navegador — precisa de teste de regressão dedicado (CC-0 inclui smoke manual; teste automatizado é critério de release no doc 06).

**F9 — Pureza do histórico FSRS.** `appendReviewHistory` com limite 100; sombra escreve em `fsrsCanonicalShadow` separado do `reviewHistory` oficial (fsrs.js:300–320) ✔. CC-4 adiciona testes de paridade preview (`reviewOutcome`) × efeito real (`recalcAfterMark`) para impedir regressão silenciosa.

**F10 — Compat D14 viva e correta.** Migração funde `rev.d14` em `d21` sem órfãos (fsrs.js:1071–1130; domainValidation.js:804–806). Não reintroduzir D14.

## 4. Inventário por domínio (estado real)

| Domínio | Arquivos-chave | Estado real | Nota |
|---|---|---|---|
| Auth/pré-login | LandingPage(+test), AuthModal, authSession | funcional e integrado | beta gate via entitlements.js |
| Onboarding | OnboardingWizard, OnboardingWizardV2, onboarding*, vestibularOnboarding | funcional; **duplicado** (V1×V2) | decidir e matar um (doc 05) |
| Banco de temas | temas.json, BancoDados, confusableSets | funcional e integrado | taxonomia é ativo de moat |
| Cronograma/plano | Cronograma, CronogramaVest(+Hub), scheduleWizard, calendarDistribution, calendarProvider, CalendarImportWizard | funcional e integrado | import CSV + providers |
| Agenda | agendaEngine, AgendaMonthGrid/DayDetails/TaskItem | funcional e integrado | não projeta passos hipotéticos futuros (ordem d1..manutencao usada p/ sort, não p/ inventar datas) ✔ |
| FSRS | fsrs.js, fsrsCanonicalShadow, fsrsShadowReport, reviewOutcome, retentionPolicy | funcional e integrado | FSRS-lite real + sombra ts-fsrs |
| Teste de Domínio | domainTest, domainValidation, DomainTestModal | funcional e integrado | classifica e reaponta primeira revisão |
| Comando do Dia | dailyCommandEngine, dailyCommandTargetExecutor | funcional e integrado | F3 pendente |
| Mentor | mentorSignals, mentorDecisionPolicy, mentor, mentorAutopilot, decisionCore | funcional e integrado | F1/F2 pendentes |
| Simulados | Simulados.jsx, provaAnalyzer, provasStats, simStrategy, EnamedProvaAnalyzer, enamedIntel | funcional e integrado | alimenta sinais do Mentor |
| Erros | errorTaxonomy, errorPatterns, errorActionMap, ErrorActionCenter/Prompt | funcional e integrado | erro dominante → ação corretiva (prio 78) ✔ |
| Raciocínio clínico | RaciocinioClinico.jsx, illnessScript, clinicalCaseGenerator, clinicalDrillSelector, clinicalReasoningScoring | funcional; monólito de UI | pipeline de casos fora do app (raiz) |
| Anki Audit | AnkiAudit.jsx, sinais no mentor | funcional e integrado | prio 40 na policy ✔ |
| Stats/forecast | StatsPanel, metricsRegistry, forecast, readiness(+validation), calibration, mastery, growthMetrics | funcional; risco de excesso | F7; auditar acionabilidade (doc 05) |
| Gamificação | gamif, achievements, Conquistas, TrilhaJornada | funcional, isolado | candidata a SIMPLIFICAR (evidência fraca, doc 02) |
| Sessão | SessaoPage, FocusMode, sessionClosure, sessionReflection, PomodoroWidget | funcional e integrado | fechamento pendente vira comando ✔ |
| Segurança/dados | userScope, userDataPaths(+test), userDataMigration, backup, dataIntegrity, DataSafetyPanel, firestore.rules | funcional e integrado | F8 |
| Launch | launchReadiness, LaunchChecklistPanel, entitlements, growthMetrics | funcional | usar como gate real |
| Modo operacional | operationalMode, peakMode, p3WhatIf, weeklyReviewGate, WeeklyReview | funcional | p3WhatIf: auditar consumo real (doc 05) |

## 5. Ciclo de aprendizagem — onde fecha e onde vaza

Planejar(crono/wizard ✔) → Executar(FocusMode/Sessão ✔) → Registrar(learningEvent/temaStats ✔) → Diagnosticar(errorTaxonomy/provaAnalyzer ✔) → Corrigir(errorActionMap→policy prio 78 ✔) → Revisar(FSRS ✔) → Medir(stats/mastery/forecast ✔) → Ajustar(replan_intention→settings ✔)

Vazamentos: (a) decisão exibida pode divergir da decisão calculada (F1/F2) — o elo Medir→Ajustar quebra exatamente no ponto mais visível do produto; (b) recomendações ignoradas não geram aprendizado do sistema (telemetria existe, agregação/consumo não — CC-7); (c) excesso de superfícies de medição (Stats+Conquistas+Trilha+Forecast) compete por atenção sem hierarquia de ação.

## 6. Divergências documentação × código

| Doc dizia | Código mostra | Tratamento |
|---|---|---|
| "ActionInbox deve consumir a mesma decisão" como pendência implícita | Já consome (mesmo executor) | Doc 07 não recria a tarefa |
| Dossiê proíbe "segundo motor no Dashboard" | Existe (F1) | CC-1 |
| "Comando nunca vazio; fallback do Dashboard é exceção defensiva" | Fallback ativo sobrescreve decisão fresca tipo rest | CC-1 reduz a exceção ao caso snapshot ausente/stale |
| Planos antigos (BLOCO A..P2.2) na raiz | Vários já implementados | Doc 07 declara-se substituto; mover MDs antigos p/ docs/archive |
