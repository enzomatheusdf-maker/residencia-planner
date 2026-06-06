# MEDREV — PRE-RELEASE IMPLEMENTATION MASTERPLAN

> Documento de auditoria + plano mastigado para beta aberto. Opus pensou; o Sonnet Low executa bloco a bloco.
> Auditoria por leitura de código real (`residencia-planner`), em 2026-06-06. Cada bloco é pequeno, isolado,
> com arquivos permitidos/proibidos, comandos de teste e critérios de aceite. **Regra de ouro: o executor não
> toma decisão de produto — só executa o que está escrito.**
>
> Convenção de validação ao fim de TODO bloco:
> ```
> npm test -- --watchAll=false
> npm run check:mojibake
> npm run build
> ```

---

## 1. Resumo executivo

**Está pronto para beta aberto? → QUASE.**

O MedRev **fecha o ciclo** Planejar → Executar → Registrar → Diagnosticar erro → Corrigir → Revisar → Medir →
Ajustar. Os motores existem, são consumidos pela decisão e a maioria dos blocos planejados (RC-0→RC-7, B1→B8,
parte do P4) **já está implementada**. A entropia caiu nos últimos rounds: `learningEvents` é o log canônico,
`temaStats` está deprecado com migração idempotente, o Mentor consome `operationalMode` + `mastery`, a sombra
FSRS replaya histórico, e o raciocínio clínico tem `IllnessScript` como entidade de 1ª classe com Drills
0/A/B/C, SCT e `confusableSets`.

**Por que "quase" e não "sim":** restam ajustes de **clareza de decisão e gates de UX** que afetam a primeira
impressão do beta — sendo o mais grave o **bug do Comando do Dia** (Rebalancear sequestrava a fila do dia),
**corrigido nesta sessão** (ver §9 BLOCO P0-1, já aplicado). Os demais P0 são pequenos e de baixo risco.

**Por que não é "não":** não há lacuna arquitetural. Não falta motor. Não há promessa de nota/aprovação/TRI.
O vestibular não vê ENAMED/raciocínio clínico. Multiusuário tem isolamento por uid. Build e 673 testes verdes.

---

## 2. O que já está bom o suficiente (NÃO MEXER agora)

Evite overengineering. Tudo abaixo foi confirmado por código e **não precisa de trabalho para o beta**:

| Área | Evidência |
|---|---|
| **Raciocínio Clínico** | `IllnessScript` 1ª classe (`constants/illnessScripts.js`, `constants/caseInstances.js`); Drills 0/A/B/C (`core/clinicalDrillSelector.js`); SCT na pipeline; `core/confusableSets.js`; scoring (`core/clinicalReasoningScoring.js`). Gated fora do vestibular (`core/platformFeatures.js`: `raciocinioClinico: !isVest`). |
| **FSRS-Lite** | `core/fsrs.js`: D0/D1/D4/D7/D21/manutenção, relearning (`resolveAgainPolicy`, `MATURE_LAPSE_THRESHOLD`), "Já domino" (`dominio_previo`), `recalcAfterMark`, `appendReviewHistory`. |
| **Student model BKT/PFA** | `core/mastery.js`: `updateBayesianMastery`, slip/guess estimados por subtópico (`estimateSubtopicParams`, clamp [0.01,0.45], priors quando n<10), `canonicalizeSubtopic`, `SUBTOPIC_PARAMS_VERSION`. |
| **Log unificado** | `learningEvents` canônico; `addTemaStats` é no-op deprecado; migração idempotente (`migrateTemaStatsToLearningEventsState`, `TEMA_STATS_MIGRATION_FLAG`). |
| **Mentor consome motores** | `core/mentorDecisionPolicy.js` lê `operationalMode` + `mastery`; escolhe área por `masteryGap × incidência` (`pickMasteryIncidenceArea`). |
| **Sombra FSRS coerente** | `core/fsrsCanonicalShadow.js` replaya `reviewHistory` em ordem; exibida só em dev. |
| **Simulados** | 6 fases (`core/simStrategy.js`: Construção→Stamina→Stamina+→Confirmação→Lapidação→reta final); erro de simulado tipado vira card (`Simulados.jsx`). |
| **Taxonomia de erro** | `core/errorTaxonomy.js` (12 tipos, MANAGEMENT res-only); `errorActionMap.js` com `recommendRemediationFromError`; `errorPatterns.js`. |
| **Retenção-alvo (B2)** | `core/retentionPolicy.js` (`recommendDesiredRetention`). |
| **Adesão/if-then (B5)** | `studyPlanIntention` + `nextReminderFor` + `replan_intention` no mentor. |
| **Gamificação não-coercitiva** | `core/gamif.js`: streak com recuperação por token; XP secundário. |
| **Residuais B1** | `proximaAcao` removido; `decisionSnapshot` fora do `partialize` (recomputado). |

---

## 3. Os problemas restantes (priorizados)

Formato: **descrição · impacto usuário · impacto método · dificuldade · risco · prioridade · recomendação.**

1. **[RESOLVIDO nesta sessão] Rebalancear sequestra a fila do dia.** A ação `workload_relief` (prio 95)
   disparava por sinal de horizonte (`overloadDays>=2`) e retornava cedo, escondendo "Começar revisão"/"Executar
   fila de hoje" para sempre. · Usuário travado sem ação executável · Quebra o "Executar" do ciclo · Baixa ·
   Médio · **P0** · **Feito** (BLOCO P0-1).
2. **Dupla codificação de calibração.** `core/calibration.js` (métrica metacognitiva) vs
   `fsrs.getCalibrationMultiplier` (ajuste de intervalo). · Baixo (interno) · Risco de divergência conceitual ·
   Baixa · Baixo · **P1** · Documentar fonte única; não fundir agora.
3. **`desiredRetention=0.90` fixo nos passos de aprendizado.** Só a manutenção consome `retentionPolicy`. ·
   Nulo hoje · Eficiência subótima · Baixa · Baixo · **P2** · Avaliar passar alvo só onde já aceita o parâmetro.
4. **Leitura dupla `temaStats`↔`learningEvents`.** Alguns consumidores ainda derivam de `temaStats` via
   `getTemaStatsFromLearningEvents`. · Nulo · Ambiguidade de verdade · Baixa · Baixo · **P2** · Mapear leitores
   residuais; não migrar no beta.
5. **Readiness/preparo sem guard de amostra mínima na UI.** `getReadinessData` retorna score mesmo com amostra
   ínfima; `FORECAST_CONFIDENCE` existe mas o consumidor precisa checá-lo. · Médio (engana) · Mede sem base ·
   Baixa · Médio · **P0** · Garantir que a UI mostra "coletando" abaixo do mínimo.
6. **Remediação erro→card não cria o artefato automaticamente.** `recommendRemediationFromError` devolve
   `{kind, payload}` mas nenhuma ação de store cria o flashcard/caso. · Médio · "Corrigir" fica manual · Média ·
   Médio · **P1** · Fechar o loop com criação opt-in (sem IA corretora).
7. **Comando do Dia pode ter cards/CTA redundantes.** Vários botões secundários (ver §4). · Baixo/Médio ·
   Carga cognitiva · Baixa · Baixo · **P1** · Consolidar/mover para "Mais".
8. **Aviso `act()` em `App.js:568`** (setState fora de `act` em teste). · Nulo runtime · Ruído de teste ·
   Baixa · Baixo · **P2** · Envolver em `act`/cleanup.
9. **Forecast determinístico (sem relapse).** `getWorkloadProjection` assume revisões cumpridas. · Baixo ·
   Subestima carga se lapso alto · Média · Baixo · **P2** · Documentar como premissa; não mexer no beta.
10. **Onboarding: time-to-value.** Confirmar primeira sessão útil <5 min sem loop. · Alto (ativação) · Adesão ·
    Média · Médio · **P0** · Smoke do fluxo novo-usuário (ver §9 BLOCO P0-3).
11. **Botão dev visível em produção?** `DataSafetyPanel`/sombra atrás de flags — confirmar que não vaza. ·
    Baixo · Confiança · Baixa · Médio · **P0** · Verificar `devFlags` no build.
12. **Métrica inútil no Dashboard?** Revisar se há número sem ação. · Baixo · Clareza · Baixa · Baixo · **P1**.
13. **`firstAction` vs `new_topic`** podem coexistir confusamente para usuário novo. · Baixo · Clareza · Baixa ·
    Baixo · **P2** · Verificar precedência.
14. **Anki: parar de recomendar quando já feito hoje.** Confirmar que o card some após "Zerar Anki hoje". ·
    Baixo · Clareza · Baixa · Baixo · **P1**.
15. **Data Safety para beta.** Classificar pronto/não-pronto (ver §11). · Alto se falhar · Confiança · — ·
    Alto · **P0 (verificação, não código)**.

**Os 5 P0 do beta:** (1) bug Rebalancear [feito], (5) guard de amostra na UI de readiness, (10) onboarding
sem loop <5 min, (11) sem botão dev no build, (15) Data Safety verificada.

---

## 4. O que remover ou mover para "Mais"

Auditar no `components/Dashboard.jsx` (lista de botões mapeada na auditoria):

- **Manter no Dashboard (âncora):** Comando do Dia (ação primária + "Ver por quê"), card de Anki quando devido,
  e no máximo 1 card de readiness com CTA.
- **Candidatos a mover para "Mais"/Estatísticas:** "Modo Simples" (config), "Mentor · Análise completa"
  (detalhe), painéis de readiness/qualidade duplicados quando já há Comando do Dia, badges informativos sem CTA.
- **Regra:** todo card que fica precisa de **um** botão com `target` executável. Card sem ação → Estatísticas.
- **Não transformar o Dashboard em Estatísticas:** mover métrica pura, manter ação.

> Decisão de produto fica com você; o BLOCO P1 de UX (§9) só executa o que for marcado aqui.

---

## 5. Mapa de integração atual

| Módulo | O que gera | Onde salva | Quem consome | Problema | Ação recomendada |
|---|---|---|---|---|---|
| Revisão/Estudo | `LearningEvent` | `state.learningEvents` (persistido) | mastery, readiness, mentor, stats | leitura dupla c/ temaStats | mapear leitores residuais (P2) |
| FSRS-Lite | datas/steps `rev` | `plat.temas[].rev` | scheduler, agenda, mentor | retenção fixa nos passos | passar alvo onde aceito (P2) |
| Erro | tipo + ação corretiva | event + `errorActionMap` | mentor, stats | card não criado auto | loop opt-in (P1, BLOCO E1) |
| Simulado | resultado + erros | `plat.simulados` | simStrategy, readiness, stats | — | ok |
| Raciocínio clínico | drill + maestria compart. | `casosProgresso` + events | mentor, stats | — | ok |
| Mastery (BKT) | `pKnown`/incerteza | derivado (não persistido) | mentor, readiness | — | ok |
| operationalMode | modo+flags | derivado | mentor | — | ok |
| Mentor decision | ação primária | `decisionSnapshot` (memória) | Dashboard, ActionInbox | (bug rebalance) | **corrigido** |
| Readiness | score+confidence | derivado | Dashboard, stats | UI sem guard amostra | gate UI (P0, BLOCO R1) |
| Rebalance | move carga de hoje | `rev.date` + `meta.lastWorkloadRebalance` | mentor | só alivia hoje | ok pós-fix |

---

## 6. Fluxo ideal do método (etapa → arquivos → lacunas)

1. **Planejar** — onboarding/cronograma → `core/onboardingEngine.js`, `core/calendarDistribution.js`,
   `constants/cronogramas.js`. Lacuna: confirmar time-to-value (P0).
2. **Executar** — Comando do Dia / FocusMode → `Dashboard.jsx`, `mentorDecisionPolicy.js`, `SessaoPage.jsx`.
   Lacuna: clareza de CTA (corrigida no P0-1).
3. **Registrar** — marca revisão → `store.js` (`appendLearningEvent`), `fsrs.recalcAfterMark`. OK.
4. **Diagnosticar erro** — taxonomia → `errorTaxonomy.js`, `errorPatterns.js`. OK.
5. **Corrigir** — `errorActionMap.recommendRemediationFromError` → flashcard/caso. Lacuna: criação automática
   (P1, BLOCO E1).
6. **Revisar** — FSRS-Lite agenda. OK.
7. **Medir** — `readiness.js`, `growthMetrics`, `StatsPanel.jsx`. Lacuna: guard de amostra na UI (P0, BLOCO R1).
8. **Ajustar** — mentor + `studyPlanIntention` replan. OK.

---

## 7. Arquitetura final recomendada (motores canônicos — já existem)

| Motor canônico | Implementação atual | Objetivo | Risco | Prioridade |
|---|---|---|---|---|
| `StudyEvent` | `core/learningEvent.js` | log único de eventos | baixo | mantido |
| `ErrorEvent` | embutido no LearningEvent + `errorTaxonomy` | diagnosticar erro | baixo | mantido |
| `TopicBank` | `constants/catalogos.js` + `enamedIncidencia.js` (aliases) | taxonomia Área→Sub→Tema→Subtema | baixo | mantido |
| `DailyPlanEngine` | `mentorDecisionPolicy.js` + `reviewTaskPlanner.js` | próxima ação executável | médio | **corrigido** |
| `SimulationStrategyEngine` | `core/simStrategy.js` | fase + próximo simulado | baixo | mantido |
| `ClinicalReasoningEngine` | `illnessScript.js` + `clinicalDrillSelector.js` | drills/scripts | baixo | mantido |
| `MentorDecisionEngine` | `decisionCore.js` + `mentorDecisionPolicy.js` | orquestra os sinais | médio | mantido |
| `ReadinessPredictionEngine` | `readiness.js` + `forecast.js` | preparo c/ confiança | médio | gate UI (P0) |

**Não criar motores novos.** O trabalho de beta é *polir* o consumo, não adicionar arquitetura.

---

## 8. Roadmap P0 / P1 / P2 / P3

- **P0 (obrigatório antes do beta aberto):** P0-1 fix Rebalancear [feito] · R1 guard de amostra na UI ·
  P0-3 onboarding sem loop <5 min · DEV1 sem botão dev no build · DS-CHECK Data Safety verificada.
- **P1 (primeiras semanas):** E1 loop erro→card opt-in · UX1 limpeza de cards/CTA do Dashboard · ANKI1 parar de
  recomendar Anki quando já feito · calibração fonte única (doc).
- **P2 (crescimento):** leitura dupla temaStats · retenção-alvo nos passos · act() em App.js · firstAction vs
  new_topic.
- **P3 (longo prazo):** ingestão bank-agnostic (P4.8) — só com log + student model maduros; forecast com relapse.

---

## 9. Blocos implementáveis para Sonnet Low

> Cada bloco é pequeno e seguro. **Não** redesenhar arquitetura. **Não** instalar libs. **Não** commit/push.

### BLOCO P0-1 — Fix do Comando do Dia (Rebalancear vs Fila do dia) — **JÁ APLICADO**
**Objetivo:** o Rebalancear só aparece quando HOJE está acima da capacidade e há o que mover; senão cai na fila
do dia / revisão vencida.
**Status:** implementado e validado nesta sessão (673 testes verdes, build verde). Documentado para rollback.
**Arquivos tocados:** `core/mentorSignals.js` (expõe `lastWorkloadRebalance`, `rebalanceTargetMinutes`,
`rebalanceMaxItems`), `core/mentorDecisionPolicy.js` (gate `shouldRecommendRebalance`), `core/store.js`
(`rebalanceTodayWorkload` reconstrói snapshot mesmo com `movedCount===0`), `core/mentorDecisionPolicy.test.js`.
**Critérios de aceite (cumpridos):** hoje leve sem fila → não mostra Rebalancear; rebalanceou e nada moveu →
cai na fila; hoje pesado com itens móveis → ainda mostra Rebalancear (sem regressão).
**Rollback:** reverter os 4 arquivos; sintoma de quebra = "Começar revisão" some após rebalancear.

### BLOCO R1 — Guard de amostra mínima na UI de readiness/preparo — **P0**
**Objetivo:** nunca exibir "preparo estimado" forte sem amostra mínima; mostrar "coletando".
**Arquivos permitidos:** `components/StatsPanel.jsx`, `components/Dashboard.jsx` (só leitura de
`FORECAST_CONFIDENCE`/`confidence`). **Proibidos:** `core/readiness.js`, `core/forecast.js` (lógica), store.
**Tarefas:** 1) onde o score é renderizado, ler `confidence`/`FORECAST_CONFIDENCE`; 2) se `INSUFFICIENT`/abaixo
do mínimo, renderizar rótulo "coletando" em vez de número/porcentagem forte; 3) manter o "não é nota oficial".
**Testes:** smoke render do StatsPanel com amostra 0 e amostra suficiente.
**Aceite:** amostra ínfima → "coletando", nunca % de preparo destacado. **Rollback:** reverter o componente.

### BLOCO E1 — Loop erro→card opt-in (sem IA corretora) — **P1**
**Objetivo:** ao registrar erro de conteúdo, oferecer criar flashcard semente via
`recommendRemediationFromError` (kind `flashcard`), com confirmação do usuário.
**Arquivos permitidos:** `components/ErrorActionPrompt.jsx` (ou `ErrorActionCenter.jsx`), `core/store.js`
(ação que cria card delegando ao `flashcardEngine`). **Proibidos:** `errorTaxonomy.js`, `errorActionMap.js`
(só consumir), `fsrs.js`. **Tarefas:** 1) consumir `recommendRemediationFromError(event)`; 2) se
`kind==="flashcard"`, mostrar CTA "Criar card deste erro"; 3) no confirm, chamar criação via `flashcardEngine`
com `sourceErrorId`. **Proibido criar card sem o fato específico.** **Testes:** unit do fluxo kind→CTA.
**Aceite:** erro de conteúdo oferece card; erro de raciocínio NÃO oferece card (oferece caso); nada cru salvo.

### BLOCO UX1 — Consolidar cards/CTA do Dashboard — **P1**
**Objetivo:** garantir que todo card tem ação com `target`; mover métrica pura para "Mais"/Estatísticas.
**Arquivos permitidos:** `components/Dashboard.jsx`. **Proibidos:** core/*. **Tarefas:** 1) listar botões;
2) remover/mover os marcados na §4; 3) garantir `target` em cada CTA restante. **Aceite:** sem botão sem
handler; sem card sem ação; Comando do Dia continua a âncora. **Rollback:** reverter o componente.

### BLOCO ANKI1 — Não recomendar Anki quando já feito hoje — **P1**
**Objetivo:** o card/ação de Anki some após "Zerar Anki hoje".
**Arquivos permitidos:** `components/Dashboard.jsx`, `components/AnkiAudit.jsx` (leitura de adesão do dia).
**Proibidos:** core/*. **Tarefas:** 1) checar `ankiAdesao.datas` inclui hoje; 2) ocultar a recomendação se sim.
**Aceite:** após marcar Anki, recomendação some até o próximo dia.

### BLOCO DEV1 — Sem superfícies de dev no build de produção — **P0 (verificação + gate)**
**Objetivo:** confirmar que `DataSafetyPanel`/sombra/flags de dev não aparecem para usuário comum no build.
**Arquivos permitidos:** `core/devFlags.js` (só leitura), componente que monta o painel (só guard). **Tarefas:**
1) confirmar guard por `devFlags`; 2) se vazar, condicionar render a flag desligada por padrão em produção.
**Aceite:** build de produção não expõe painel de dev. **Sem alterar Data Safety real.**

---

## 10. Prompts prontos para Sonnet Low

### Prompt — BLOCO R1
```
Execute somente BLOCO R1. Nao execute blocos futuros. Nao refatore fora do escopo. Nao instale libs. Nao commit.
Arquivos permitidos: src/components/StatsPanel.jsx, src/components/Dashboard.jsx (apenas leitura de confidence).
Arquivos proibidos: src/core/readiness.js, src/core/forecast.js, src/core/store.js.
Tarefas:
1) Onde o score de preparo/readiness e renderizado, leia confidence / FORECAST_CONFIDENCE.
2) Se for INSUFFICIENT (ou abaixo do minimo), renderize "coletando" em vez de % forte.
3) Mantenha o aviso "nao e nota oficial".
Rode: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build.
Pare e entregue relatorio com o diff e o resultado dos comandos.
```

### Prompt — BLOCO E1
```
Execute somente BLOCO E1. Nao execute blocos futuros. Nao instale libs. Nao commit.
Arquivos permitidos: src/components/ErrorActionPrompt.jsx, src/core/store.js (acao de criar card via flashcardEngine).
Arquivos proibidos: src/core/errorTaxonomy.js, src/core/errorActionMap.js (apenas consumir), src/core/fsrs.js.
Tarefas:
1) Consuma recommendRemediationFromError(event).
2) Se kind === "flashcard", mostre CTA "Criar card deste erro".
3) No confirm, crie o card via flashcardEngine com sourceErrorId e o fato especifico (nunca card vago).
4) Erro de raciocinio NAO oferece card (oferece caso/illness_script).
Rode: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build.
Pare e entregue relatorio.
```

### Prompt — BLOCO UX1
```
Execute somente BLOCO UX1. So mexa em src/components/Dashboard.jsx. Nao mexa em core/*. Nao instale libs. Nao commit.
Tarefas:
1) Liste os botoes do Dashboard.
2) Remova/mova para "Mais" os cards/CTAs marcados na secao 4 do masterplan.
3) Garanta que todo CTA restante tem target executavel; nenhum card sem acao.
Rode: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build.
Pare e entregue relatorio.
```

### Prompt — BLOCO ANKI1
```
Execute somente BLOCO ANKI1. Arquivos permitidos: src/components/Dashboard.jsx, src/components/AnkiAudit.jsx (leitura).
Nao mexa em core/*. Nao instale libs. Nao commit.
Tarefas:
1) Verifique se ankiAdesao.datas inclui hoje.
2) Se sim, oculte a recomendacao de Anki no Dashboard ate o proximo dia.
Rode: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build.
Pare e entregue relatorio.
```

### Prompt — BLOCO DEV1
```
Execute somente BLOCO DEV1. Arquivos permitidos: leitura de src/core/devFlags.js e o componente que monta o painel de dev.
Nao altere a logica de Data Safety. Nao instale libs. Nao commit.
Tarefas:
1) Confirme que DataSafetyPanel/sombra estao atras de devFlags.
2) Se vazarem no build de producao, condicione o render a flag desligada por padrao.
Rode: npm run build e confirme que o painel de dev nao aparece para usuario comum.
Pare e entregue relatorio.
```

---

## 11. Ordem exata de execução

```
1. BLOCO P0-1  (FEITO nesta sessao — checkpoint/commit aqui)
2. BLOCO R1    (guard de amostra na UI)
3. BLOCO DEV1  (sem dev no build)
4. BLOCO P0-3  (verificacao de onboarding — ver secao 12, smoke; nao e codigo)
5. DS-CHECK    (Data Safety — verificacao, secao 13; nao e codigo)
   --- aqui: rodar build completo + checkpoint; NAO seguir para beta se algo P0 falhar ---
6. BLOCO ANKI1
7. BLOCO E1
8. BLOCO UX1
   --- checkpoint final + build completo ---
```

- **Sonnet Low pode fazer:** R1, ANKI1, DEV1, UX1 (mudanças locais, escopo fechado).
- **Sonnet Medium/High:** E1 (toca store + componente + flashcardEngine; mais integração).
- **Opus de novo:** qualquer decisão de produto (o que remover na §4), calibração fonte única, forecast com
  relapse, ingestão bank-agnostic (P3).
- **Checkpoint/commit:** após P0-1, após o bloco de P0 (passo 5), e no fim.
- **Build completo:** nos dois checkpoints. **Não prosseguir para beta** se P0 falhar.

---

## 12. Test strategy

- **Unitários:** decisão do mentor (feito), retentionPolicy, mastery (slip/guess), errorActionMap, simStrategy,
  clinicalDrillSelector, confusableSets.
- **Integração:** `decisionCore` (snapshot ↔ inbox), store (rebalance reconstrói snapshot — coberto).
- **Smoke render:** Dashboard, StatsPanel (amostra 0 e suficiente — BLOCO R1), RaciocinioClinico.
- **Target executável:** toda ação do mentor tem `target` (teste existente "ação sempre tem target").
- **Agenda:** não projeta FSRS futuro falso (projeção é determinística a partir de `rev` real — documentado).
- **FSRS:** D0/D1/D4/D7/D21/manutenção/relearning (suite `fsrs.test.js`).
- **Simulados:** fases e erro→card.
- **Raciocínio clínico:** scoring e seleção de drill; **gated fora do vestibular** (teste de plataforma).
- **Stats:** guard de amostra (BLOCO R1).
- **Vestibular sem ENAMED:** `platformFeatures` (testes existentes).
- **Data Safety:** isolamento por uid (`userScope`, `userDataPaths`, `userDataMigration` — suites existentes).

Comando único de regressão: `npm test -- --watchAll=false` (69 suites / 673 testes hoje, verdes).

---

## 13. Critérios finais de publicação (checklist)

- [ ] Usuário novo entende o app em <5 min (P0-3 smoke).
- [x] Dashboard mostra ação clara (Comando do Dia, pós P0-1).
- [x] Toda ação tem `target`.
- [x] Agenda não mente FSRS (projeção determinística do `rev` real, sem futuro hipotético salvo).
- [ ] Erro vira ação executável (parcial: recomendação existe; criação auto via BLOCO E1).
- [x] Simulado altera o plano (simStrategy + erro→card).
- [ ] Estatísticas respeitam amostra mínima na UI (BLOCO R1).
- [x] Raciocínio clínico não aparece no vestibular.
- [x] Multiusuário seguro (isolamento por uid) — confirmar em DS-CHECK.
- [x] Build verde.
- [x] Testes verdes (673).
- [ ] Mobile aceitável (smoke manual).
- [ ] Onboarding sem loop (P0-3).
- [ ] Sem botão dev visível (BLOCO DEV1).
- [x] Sem métrica inútil destacada no Dashboard sem ação (revisar em UX1).

### Data Safety — classificação para beta (sem implementar)
- **Pronto:** isolamento por uid (`services/userDataPaths.js`, `core/userScope.js`), migração de dados de
  usuário (`core/userDataMigration.js`), `localStorage`/Firestore por uid.
- **Verificar antes do beta (DS-CHECK, não-código):** Firestore rules de produção; backup/restore; integridade
  (`core/dataIntegrity.js`) acionável; que nenhum texto clínico sensível seja salvo sem autorização.
- **Bloco separado (não no beta):** qualquer mudança em Auth/Firestore/rules é P0 próprio, fora deste plano.

---

### Regras inegociáveis dos blocos (recapitulação)
Não criar IA corretora · não criar banco de questões · não criar PDF parser · não projetar FSRS futuro falso ·
não mostrar preparo sem amostra mínima · não misturar ENAMED/raciocínio clínico no vestibular · não transformar
Dashboard em Estatísticas · não salvar texto clínico sensível sem autorização · não deixar CTA sem target · não
criar feature sem conectar ao método.
