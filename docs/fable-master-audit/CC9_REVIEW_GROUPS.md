# BLOCO CC-9 — GRUPO DE REVISÃO (Já domino em lote + curva co-agendada)

Pertence à suíte `docs/fable-master-audit/`. Extensão de escopo solicitada pelo fundador. Depende da coerência do core: só executar APÓS CC-1..CC-5 (toca store, agenda e snapshot de decisão). Não substitui nenhum bloco anterior; adiciona.

## Contexto auditado (fonte: código do ZIP)
- Unidade de revisão = `tema` (regra dura). `tema.rev` é a curva FSRS individual.
- Catálogo `MEDCOF` (`src/core/fsrs.js`) agrupa por `b` (bloco semanal multi-área, ~15 tópicos). Esse campo NÃO dirige FSRS/agenda/scheduling — é rótulo morto no motor. Logo, "bloco" é grosso demais e não está fiado.
- Caso do usuário: "Avaliação Global do Hemograma + Anemias Hipoproliferativas I + Anemias Hipoproliferativas II" = 3 temas IRMÃOS (`parentTopic: null`), entregues como 1 aula no MedCof, mas viram 3 curvas independentes que derivam entre si.
- `parentTopic` JÁ é o primitivo de agrupamento, consumido por `confusableSets.js` e `interleavingPlanner.js`.
- Já domino é por tema: `finalizarValidacaoDominioPrevio(plat, temaId, {questoes, acertos})` → `applyDominioPrevioToTema` ancora d0=hoje e define 1ª revisão. Não há cluster nem co-agendamento.

## Decisão de design (e o que foi REJEITADO)
- REJEITADO: fundir os 3 temas numa única `rev`. Quebra tudo que é keyado em temaId (mentor/agenda/maestria/erros/casos/stats) e piora a abstração lossy (lapso em um sub arrasta os outros; "domino" mascara fraqueza pontual).
- ESCOLHIDO: **grupo de revisão** que mantém N curvas por tema e funde apenas a AÇÃO e a ÂNCORA. Externamente 1 curva; internamente N. Lossless para maestria/erro/caso.
- Agrupamento **selecionável pelo usuário** (zero curadoria dos 364 temas; generaliza a qualquer provider). Defaults curados ficam para um bloco futuro opcional.

**Problema:** temas que o cursinho entrega como um bloco único viram curvas fragmentadas; o já domino precisa ser repetido tema a tema e as revisões derivam de data.
**Objetivo:** permitir agrupar temas num "grupo de revisão" e (a) aplicar já domino em lote e (b) co-agendar as revisões do grupo numa única tarefa expansível, sem mudar a unidade FSRS.
**Resultado para o usuário:** seleciona o bloco, marca já domino uma vez, e revisa o bloco como uma única curva.

**Dependências:** CC-1, CC-2, CC-3, CC-4, CC-5 (core coerente + gateway de rebuild + executor auditável).
**Arquivos permitidos:**
- `src/core/reviewGroups.js` (NOVO — pure: criar/ler/validar grupos, derivar a tarefa co-agendada, propagar rating)
- `src/core/store.js` (somente: estado `reviewGroups` por plat; ações `createReviewGroup`, `applyJaDominoToGroup`, `markGroupReview`; SEMPRE via gateway `rebuildDecision` do CC-5)
- `src/core/agendaEngine.js` (somente: colapsar itens de um grupo na mesma data numa entrada única expansível — sem inventar datas hipotéticas)
- `src/core/dailyCommandEngine.js` (somente: target novo `focus` com `params.groupId`)
- `src/core/dailyCommandTargetExecutor.js` (somente: resolver `groupId` → handler de grupo, usando o retorno estruturado do CC-3)
- UI: `src/components/Cronograma.jsx` e/ou `src/components/FocusMode.jsx` (seleção múltipla + botão "Já domino no bloco" + tarefa expansível); testes correspondentes
**Arquivos proibidos:** `src/core/fsrs.js` (NÃO mexer no motor; reusar `applyDominioPrevioToTema`/`recalcAfterMark`), `src/core/mentorDecisionPolicy.js`, `src/core/mentorSignals.js`, `firestore.rules`, `fsrsCanonicalShadow.js`.

**Funções atuais reutilizadas (não duplicar):** `finalizarValidacaoDominioPrevio`, `applyDominioPrevioToTema`, `recalcAfterMark`, `getDominioPrevioStatus`, `rebuildDecision` (CC-5), retorno estruturado do executor (CC-3).

**Tarefas numeradas:**
1. `reviewGroups.js` (pure): modelo `{ id, plat, nome, temaIds: [], criadoEm, anchorStrategy: "same_day" }`. Funções: `createGroup`, `validateGroup` (temas existem, mesmo plat, ≥2 temas), `getGroupForTema`, `deriveGroupReviewTask(group, temas, today)` (retorna a próxima data co-agendada = a MAIS PRÓXIMA entre os sub-temas, com a lista de sub-itens e o stepKey de cada um), `propagateRating(group, temas, acerto)` (mapeia o rating único para cada `recalcAfterMark` por tema; permite override por sub-tema).
2. store: estado `reviewGroups` por plat no persist (merge defensivo — ausência = []). Ações:
   - `createReviewGroup(plat, {nome, temaIds})` → valida e grava; chama `rebuildDecision(state, "review_group_created")`.
   - `applyJaDominoToGroup(plat, groupId, {questoesPorTema|questoesShared, acertosPorTema|acertosShared})` → para cada tema do grupo chama a MESMA lógica de `finalizarValidacaoDominioPrevio` (reusar, não reimplementar), todos ancorados em `todayStr()` para sincronizar as curvas; 1 rebuild ao final (não N).
   - `markGroupReview(plat, groupId, {acerto, overrides})` → para cada tema aplica `recalcAfterMark` no stepKey vigente do tema (via `propagateRating`); overrides permitem rating diferente por sub-tema (ex.: lapso só em Hipo II); 1 rebuild ao final.
3. agenda: quando ≥2 temas de um grupo caem na MESMA data, colapsar numa entrada única `{type:"group_review", groupId, subItems:[...]}` expansível. Nunca projetar datas futuras hipotéticas (manter regra do dossiê). Datas divergentes → mostrar a co-agendada (a mais próxima) e alinhar as demais ao aplicar o rating do grupo.
4. dailyCommandEngine: aceitar `target.params.groupId` mapeando para rota `focus` (modo grupo). Sem novo motor de prioridade.
5. executor: resolver `groupId` chamando `handlers.onStudyGroup(groupId)`; ausência de handler → `missing_handler` (contrato CC-3), nunca sucesso falso.
6. UI: na Cronograma/FocusMode, seleção múltipla de temas não-iniciados do mesmo bloco/área → botão "Já domino no bloco" (lote) e, para temas já em curva, "Agrupar revisão". Tarefa de revisão do grupo aparece como 1 item que expande nos sub-temas; rating único com opção "ajustar por tema". Copy: "grupo de revisão" / "curva de revisão", nunca "FSRS".

**Testes unitários (ao fim do bloco):**
- `reviewGroups.test.js`: validateGroup (mesmo plat, ≥2 temas, temas existentes); deriveGroupReviewTask escolhe a data mais próxima; propagateRating gera N recalcs com override por sub-tema.
- store: applyJaDominoToGroup ancora todos os temas em hoje e dispara 1 rebuild; markGroupReview com override aplica rating diferente só no sub-tema alvo; persist de reviewGroups sobrevive a merge.
- agenda: 2 temas do grupo na mesma data colapsam em 1 entrada expansível; datas divergentes mostram a co-agendada.
- executor: groupId sem handler → missing_handler (não handled).

**Testes de integração:** fluxo completo "selecionar 3 temas → já domino no bloco → 1 tarefa de revisão co-agendada → rating único → 3 curvas avançam sincronizadas"; e o caminho de divergência (override só em Hipo II mantém os outros 2 na curva e rebaixa apenas o alvo).

**Validação manual:** reproduzir o caso Hemograma+Hipo I+Hipo II no cronograma MedCof; confirmar 1 ação de já domino, 1 item de revisão, e que maestria/erros continuam por tema.

**Comandos (ao fim):**
```
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

**Critérios de aceite:**
- Nenhuma alteração em `fsrs.js`; curvas continuam por tema (grep confirma N `rev` independentes).
- Já domino em lote dispara exatamente 1 rebuild de decisão.
- Revisão do grupo co-agendada aparece como 1 item expansível; rating único propaga; override por sub-tema funciona.
- Executor trata groupId pelo contrato estruturado (CC-3); zero sucesso falso.
- Maestria, erros e casos clínicos seguem resolvidos por tema (sem regressão).

**Métrica pós-release:** nº de grupos criados/usuário; redução de itens de revisão duplicados por dia; taxa de uso do "já domino no bloco" vs por-tema.
**Risco:** médio (toca store + agenda). Mitigado: motor FSRS intocado; reusa lógica de domínio existente; 1 rebuild; agenda só colapsa, não inventa datas.
**Rollback:** revert do commit; `reviewGroups` ausente faz o app voltar ao comportamento por-tema (grupos são aditivos).
**Checkpoint:** revisão Fable após o bloco (toca agenda + decisão).
**Executor recomendado:** Codex/GPT-5.5 High (core/store/agenda) + Sonnet Low (seleção múltipla e tarefa expansível na UI).

---

## PROMPT CC-9 (colar no Codex após CC-1..CC-5)

```txt
Execute somente o BLOCO CC-9 (docs/fable-master-audit/CC9_REVIEW_GROUPS.md).

Pré-requisito: CC-1..CC-5 já concluídos. Não execute outros blocos. Não instale bibliotecas. PROIBIDO alterar src/core/fsrs.js, mentorDecisionPolicy.js, mentorSignals.js, fsrsCanonicalShadow.js, firestore.rules. Reuse a lógica de domínio existente (applyDominioPrevioToTema / finalizarValidacaoDominioPrevio / recalcAfterMark) — NÃO reimplemente FSRS.

Objetivo: grupo de revisão que mantém N curvas por tema e funde apenas a AÇÃO (já domino em lote) e a ÂNCORA (revisão co-agendada). NÃO fundir as curvas num único rev.

Tarefas: seguir as 6 tarefas numeradas do bloco (reviewGroups.js pure; estado+ações no store SEMPRE via rebuildDecision do CC-5; colapso na agenda sem datas hipotéticas; target groupId no engine; executor estruturado do CC-3; UI de seleção múltipla + tarefa expansível). Agrupamento selecionável pelo usuário (sem curadoria). Copy: "grupo de revisão"/"curva de revisão", nunca "FSRS".

AO FIM (não antes): escrever os testes listados (reviewGroups, store, agenda, executor) + integração do fluxo completo e do caminho de override; rodar:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Critérios de aceite: fsrs.js intocado; já domino em lote = 1 rebuild; revisão do grupo = 1 item expansível com rating propagável e override por sub-tema; executor trata groupId sem sucesso falso; maestria/erros/casos seguem por tema.

Pare se: precisar fundir curvas num único rev; precisar tocar arquivo proibido; ou se a agenda exigir projetar datas futuras hipotéticas.

Entregue: 1) arquivos alterados; 2) resumo técnico; 3) testes; 4) riscos; 5) diferenças em relação ao plano.
```
