# 08 — EXECUTOR PROMPTS (COLAR DIRETO NO CODEX, UM POR VEZ)

Instrução de uso: cole UM prompt por sessão. Anexe sempre junto: `docs/MEDREV_CONTEXT_FOR_AI.md`, `MEDREV_CONTEXT_FSRS_COMANDO_MENTOR_DOSSIE.md` e o `07_IMPLEMENTATION_MASTERPLAN.md`. Validação SEMPRE ao fim do bloco, nunca antes.

---

## PROMPT CC-0

```txt
Execute somente o BLOCO CC-0 do docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

Não execute blocos futuros. Não redesenhe o produto. Não instale bibliotecas. Não refatore. Não altere NENHUM arquivo em src/, firestore.rules ou package.json.

Contexto: preflight de baseline antes da série de blocos de coerência do core. O ambiente da auditoria não pôde rodar testes; você é o primeiro a registrar o estado verde.

Tarefas:
1. Rode, nesta ordem, capturando saída integral:
   npm run check:mojibake
   npm test -- --watchAll=false
   npm run build
   (Windows + EPERM no Jest: defina TEMP e TMP para .tmp-jest no repo.)
2. Crie docs/fable-master-audit/BASELINE_CC0.md com: branch, git status --short, total de suítes/testes, lista nominal de testes falhando (se houver), warnings de build, tempo de build.
3. Execute o smoke manual de isolamento multiusuário descrito no bloco (login A → dado → logout → login B → nada de A → volta A → dados intactos) e registre o resultado no mesmo arquivo. SE FALHAR: pare imediatamente e reporte — é stop condition.
4. Mova todos os MEDREV_*.md da raiz (exceto README.md e AGENTS.md) para docs/archive/ e crie docs/archive/README.md com 3 linhas indicando que o plano vigente é docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

Critérios de aceite: BASELINE_CC0.md completo; raiz sem planos antigos; smoke de isolamento PASSOU.

Pare se: o smoke de isolamento falhar; ou se houver mais de 5 suítes falhando no baseline (reporte antes de prosseguir a série).

Entregue: 1) arquivos criados/movidos; 2) resumo do baseline; 3) lista de vermelhos; 4) veredito do smoke; 5) divergências em relação ao plano.
```

---

## PROMPT CC-1

```txt
Execute somente o BLOCO CC-1 do docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

Não execute blocos futuros. Não instale bibliotecas. Não refatore fora do escopo. ARQUIVOS PROIBIDOS: src/core/mentorDecisionPolicy.js, src/core/dailyCommandEngine.js, src/core/store.js, src/core/decisionCore.js, src/core/dailyCommandTargetExecutor.js. Arquivo permitido: src/components/Dashboard.jsx (+ testes de componente novos).

Contexto: o Dashboard contém um segundo motor de prioridade (queueFallbackAction, prio 88, ~linhas 1398–1452) que sobrescreve a decisão fresca do Mentor quando pending>0 e a ação é "rest", e sobrescreve o dailyCommand quando type==="rest_or_light_day". A policy já possui fila_do_dia (prio 88); rest fresco com pending vivo indica snapshot stale (tratado no CC-2). O Dashboard NUNCA deve sobrescrever decisão fresca.

Tarefas:
1. Defina isSnapshotUsable = Boolean(activeDecisionSnapshot) (critério de data entra no CC-2).
2. Com snapshot usável: use exclusivamente activeDecisionSnapshot.dailyCommand e primaryAction. Nenhuma consulta ao fallback de fila.
3. Renomeie queueFallbackAction → defensiveQueueFallback; ela só é construída/usada quando !isSnapshotUsable && pending > 0; source: "dashboard-defensive-fallback".
4. Quando o fallback defensivo for exibido, dispare mentor_action_seen com source "dashboard-defensive-fallback" (payload plat/action_type/source).
5. Remova a substituição de rest_or_light_day por fila; rest é exibido como veio do engine.

AO FIM (não antes), escreva os testes e rode:
- Testes: (a) snapshot fresco com rest + pending>0 vivo → rest exibido; (b) snapshot ausente + pending>0 → fallback defensivo com source correto; (c) snapshot de plat diferente → tratado como ausente.
- npm run check:mojibake && npm test -- --watchAll=false && npm run build

Critérios de aceite: 3 cenários passando; testes antigos que assertavam o override atualizados com comentário "CC-1"; grep "dashboard-fallback" no src = 0 ocorrências.

Pare se: precisar tocar qualquer arquivo proibido; ou se um teste de core (não-Dashboard) quebrar.

Entregue: 1) diff de Dashboard.jsx; 2) resumo técnico; 3) testes novos/atualizados; 4) riscos; 5) divergências em relação ao plano.
```

---

## PROMPT CC-2

```txt
Execute somente o BLOCO CC-2 do docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

Não execute blocos futuros. ARQUIVOS PROIBIDOS: src/core/mentorDecisionPolicy.js, src/core/mentorSignals.js, src/core/fsrs.js, src/core/dailyCommandEngine.js, firestore.rules. Permitidos: src/core/decisionCore.js, src/core/store.js (apenas buildDecisionOutputs, call-sites de rebuild e efeito de rollover), src/core/telemetry.js (1 contrato novo), src/components/Dashboard.jsx (apenas o critério isSnapshotUsable), testes.

Contexto: o decisionSnapshot persiste sem data/versão; um snapshot de ontem pode comandar hoje. CC-1 já garantiu que o Dashboard confia no snapshot — agora o snapshot precisa merecer confiança.

Tarefas:
1. buildDecisionCoreSnapshot anexa {generatedAt: ISO, forDate: todayStr(), plat, engineVersion: "decision-core-v2"}.
2. store.js: criar ensureFreshDecisionSnapshot(reason): ausente | plat divergente | forDate !== todayStr() | engineVersion divergente → rebuild + persiste; senão no-op. Telemetria decision_rebuilt {plat, reason} SOMENTE quando rebuild ocorre (adicionar contrato em telemetry.js).
3. Chamar ensureFreshDecisionSnapshot em: pós-hidratação do persist; visibilitychange→visible (um único listener, sem duplicação); e de forma idempotente antes da montagem do Comando.
4. Dashboard: isSnapshotUsable = presença + plat + forDate de hoje + engineVersion correto.
5. Snapshot persistido antigo sem metadados = stale (merge do persist não pode quebrar).

AO FIM, testes e validação:
- Unidade: 4 casos de rebuild + 1 de no-op (com contador provando idempotência/ausência de loop); metadados presentes no snapshot novo; mock de todayStr simulando virada de dia regenera o snapshot.
- npm run check:mojibake && npm test -- --watchAll=false && npm run build

Critérios de aceite: todos acima; zero rebuild em loop; contrato decision_rebuilt validado.

Pare se: precisar alterar qualquer cálculo de decisão; ou tocar arquivo proibido.

Entregue: diffs, resumo, testes, riscos, divergências.
```

---

## PROMPT CC-3

```txt
Execute somente o BLOCO CC-3 do docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

ARQUIVOS PROIBIDOS: src/core/dailyCommandEngine.js, src/core/mentorDecisionPolicy.js, src/core/store.js. Permitidos: src/core/dailyCommandTargetExecutor.js (+ teste), src/core/telemetry.js, src/components/Dashboard.jsx e src/components/ActionInbox.jsx (somente consumo do retorno + disparo de evento).

Contexto: o executor degrada silenciosamente (rota desconhecida → dash + return false sem telemetria; focus sem handler/params → return true falso). Rota quebrada em produção é invisível.

Tarefas:
1. Retorno estruturado {ok, outcome: "handled"|"fallback_view"|"missing_handler"|"unknown_route", route, params}; truthiness compatível via ok.
2. Mapear: rota conhecida+handler → handled; rota conhecida sem handler (focus sem onStudy, settings sem onOpenAjustes, etc.) → missing_handler (fallback de view preservado); rota desconhecida → unknown_route + dash; focus modo fila sem queueItem → missing_handler, NUNCA handled.
3. telemetry.js: mentor_action_target_missing ["plat","route","outcome","source"].
4. Dashboard e ActionInbox: após executar, se outcome !== "handled", disparar mentor_action_target_missing.
5. Antes de finalizar: grep por "executeDailyCommandTarget(" em todo src e ajustar TODOS os call-sites ao novo retorno.

AO FIM: atualizar/criar testes cobrindo os 4 outcomes (mantendo cobertura existente de caso clínico) + testes de disparo do evento; rodar o trio padrão.

Critérios de aceite: zero sucesso falso; contrato validado; rotas canônicas com handlers presentes não mudaram de destino.

Pare se: encontrar call-site cujo comportamento dependa do boolean de forma incompatível e não-trivial — reporte antes.

Entregue: diffs, resumo, testes, riscos, divergências.
```

---

## PROMPT CC-4

```txt
Execute somente o BLOCO CC-4 do docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

ARQUIVOS PROIBIDOS: src/core/fsrsCanonicalShadow.js, src/core/store.js, toda a UI. src/core/fsrs.js é SOMENTE-LEITURA salvo bug comprovado (nesse caso: PARE e reporte antes de alterar). Permitidos: src/core/reviewOutcome.js (só se a paridade provar erro nele), novo src/core/fsrsParity.test.js, docs/fable-master-audit/CC4_DIVERGENCES.md.

Contexto: preview (reviewOutcome) e efeito real (recalcAfterMark) não têm teste de paridade; podem divergir silenciosamente e mentir para o usuário.

Tarefas:
1. fsrsParity.test.js: matriz stepKey (d0,d1,d4,d7,d21,manutencao) × rating (again/hard/good/easy por faixa de acerto) × estado (no prazo, atraso 3d, atraso 15d, adiantado, relearning ativo, tema maduro com lapso). Mínimo 30 cenários.
2. Cada cenário: preview → aplicar → assertar próximo passo, data, fase e flags de relearning idênticos ao preview.
3. Teste de pureza: marcação com shadowContext populado mantém rev.reviewHistory só com eventos oficiais; dados de sombra apenas em fsrsCanonicalShadow.
4. Teste de migração D14: rev com d14 persistido → sem chave d14, sem revisão órfã/duplicada após migração.
5. Divergência encontrada → registrar cenário exato em CC4_DIVERGENCES.md e PARAR (entregar relatório; não corrigir sem aprovação).

AO FIM: rodar o trio padrão.

Critérios de aceite: ≥30 cenários passando OU relatório de divergências entregue com a suíte marcando os casos como test.failing/skip documentado; pureza e migração cobertas.

Entregue: arquivo de teste, CC4_DIVERGENCES.md (mesmo vazio), resumo, riscos, divergências do plano.
```

---

## PROMPT CC-5

```txt
Execute somente o BLOCO CC-5 do docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

Permitido: src/core/store.js e seus testes. PROIBIDO: todos os demais arquivos. PROIBIDO mudar qualquer cálculo, contrato ou comportamento observável.

Contexto: rebuilds de decisão espalhados (≈ linhas 395, 430, 604, 1097, 1146, 1569). Objetivo: gateway único rebuildDecision(state, reason) com telemetria decision_rebuilt (contrato já criado no CC-2) e invariante snapshot+actionInbox sempre escritos juntos (assert via devFlags em dev).

Tarefas:
1. Criar o gateway encapsulando buildDecisionOutputs + persistência conjunta + telemetria.
2. Substituir TODOS os call-sites com reasons descritivos: set_meta, mark_review, rebalance, session_closed, domain_test, day_rollover, inbox_rebuild.
3. Assert de invariante em dev.

AO FIM: suíte do store + trio padrão.

Critérios de aceite: grep "buildDecisionOutputs(" fora do gateway = 0; nenhuma expectativa de teste de comportamento alterada (apenas reasons novos onde aplicável); build verde.

Pare se: qualquer teste de comportamento exigir mudança de expectativa — isso indicaria mudança de comportamento, que é proibida neste bloco.

Entregue: diff, mapa call-site→reason, testes, riscos, divergências.
```

---

## PROMPT CC-6

```txt
Execute somente o BLOCO CC-6 do docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

Permitidos: src/components/Dashboard.jsx, novos arquivos em src/components/dailyCommand/ (DailyCommandCard.jsx, useDailyCommand.js, testes). PROIBIDO: todo src/core.

Contexto: pós CC-1/2/3, extrair o Comando do Dia do monólito Dashboard.jsx SEM mudar comportamento nem visual.

Tarefas:
1. useDailyCommand.js: hook que lê o snapshot pelo contrato de frescor (CC-2), monta o comando (incluindo pendingClosure e fallback defensivo do CC-1) e expõe {command, execute, markSeen}.
2. DailyCommandCard.jsx: render puro, markup e classes idênticos (mover, não reescrever).
3. Dashboard importa e usa; telemetria seen/started/completed preservada byte a byte no payload.

AO FIM: testes de render por tom (alerta/normal/rest) + telemetria; trio padrão; validação manual de paridade visual.

Critérios de aceite: Dashboard.jsx reduz ≥400 linhas; zero mudança visual; zero mudança de payload de telemetria.

Pare se: a extração exigir mudar lógica de decisão.

Entregue: diffs, antes/depois de linhas, testes, riscos, divergências.
```

---

## PROMPT CC-7

```txt
Execute somente o BLOCO CC-7 do docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

Permitidos: src/core/telemetry.js, src/core/metricsRegistry.js, src/core/store.js (somente via gateway rebuildDecision do CC-5), src/components/dailyCommand/*, src/components/StatsPanel.jsx, docs/fable-master-audit/CC7_METRICS_AUDIT.md. PROIBIDOS: mentorDecisionPolicy.js, mentorSignals.js, fsrs.js.

Contexto: medir a qualidade do Mentor (executado/ignorado/ganho) e podar métricas sem ação do Stats.

Tarefas:
1. Contratos novos: mentor_action_ignored ["plat","action_type","source","hours_visible"] (comando visto e dia virou sem started) e mentor_action_outcome ["plat","action_type","delta_metric","window_days"] (delta de acerto/estabilidade no tema-alvo em 7 dias via learningEvents; null permitido).
2. Agregado local (últimos 14 dias) em metricsRegistry; card "Mentor" no StatsPanel com regra de amostra mínima (n<5 → "coletando dados").
3. Auditoria do StatsPanel: anotar a ação que cada métrica exibida justifica; métricas sem ação → seção colapsada "Avançado"; lista final em CC7_METRICS_AUDIT.md.

AO FIM: testes dos contratos + do disparo de ignored em rollover + da regra de amostra mínima; trio padrão.

Critérios de aceite: contratos validados; card respeita amostra mínima; relatório entregue.

Entregue: diffs, relatório, testes, riscos, divergências.
```

---

## PROMPT CC-8

```txt
Execute somente o BLOCO CC-8 do docs/fable-master-audit/07_IMPLEMENTATION_MASTERPLAN.md.

Permitidos: src/components/dailyCommand/*, src/core/copy.js, testes. PROIBIDO: todo o core de decisão.

Contexto: o contrato do Comando já carrega explain[], confidence, riskIfIgnored, expectedBenefit; a UI subexpõe. Explicabilidade é o diferencial nº1.

Tarefas:
1. Card mostra a razão curta sempre; seção expansível "Por que isso agora?" com explain[], sinais e confiança em rótulo humano (alta/média/explorando).
2. riskIfIgnored renderizado quando presente.
3. Varredura de copy: zero jargão cru em UI — "curva de revisão" no lugar de "FSRS"; payloads de telemetria imutáveis.

AO FIM: testes garantindo que todos os tipos de ação renderizam explicação não-vazia; grep "FSRS" nos componentes de UI = 0; trio padrão.

Entregue: diffs, screenshots/descrição visual, testes, riscos, divergências.
```
