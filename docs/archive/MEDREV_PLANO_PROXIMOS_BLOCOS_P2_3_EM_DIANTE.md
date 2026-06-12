# MEDREV — PLANO DE PRÓXIMOS BLOCOS (P2.3 EM DIANTE)

> Plano mastigado para modelos menores (Gemini Flash / Sonnet menor / Codex). Cada bloco é pequeno, com arquivos permitidos/proibidos, contrato, regras de segurança, critérios de aceite, testes e **prompt pronto para colar**.
> Convenção do repo: `branch + checkpoint + backup` antes; `npm test -- --watchAll=false && npm run check:mojibake && npm run build` depois. Um bloco = um comportamento. Sem refactor global.

## Sequência recomendada (e por quê)

A auditoria mostrou: **decisão unificada (bom), mas a decisão não usa os motores novos, e a camada de dados acumulou dívida.** Portanto, **antes de qualquer P3 de feature, consolide:**

1. **P2.3 — Mentor consome `operationalMode` + `mastery`** *(fecha o loop decisão↔motores — o bloco mais importante)*
2. **P2.4 — Limpeza e restauração de sinais** *(dead code, órfãos, sinais perdidos, snapshot não-persistido)*
3. **P2.5 — Unificar logs de evento** *(`learningEvents` canônico; depreciar `temaStats`)*
4. **P2.6 — Sombra FSRS historicamente coerente** *(pré-requisito de qualquer troca de scheduler)*
5. **P2.7 — Interleaving como ação do Mentor + priorização maestria×incidência**
6. **P3.1 — Student Model → BKT/PFA explícito por subtópico** *(slip/guess)*

## O que NÃO fazer ainda

- **Não** trocar o scheduler oficial para o FSRS canônico (a sombra ainda é inválida — corrija em P2.6 primeiro).
- **Não** rodar o optimizer do FSRS (sem evidência de sombra coerente + amostra suficiente).
- **Não** adicionar 5º log de eventos, 3º cálculo de calibração, ou novo motor de "próxima ação".
- **Não** deixar forecast/readiness prometerem aprovação ou nota TRI.
- **Não** persistir `modoOperacao` nem `decisionSnapshot`.
- **Não** deixar interleaving marcar conclusão oficial (já está correto — não regredir).
- **Não** começar bank-agnostic (P3) antes de P2.3–P2.6.

---

## BLOCO P2.3 — Mentor consome modo operacional e maestria

**Arquivo do bloco:** `MEDREV_BLOCO_P2_3_MENTOR_CONSOME_MODO_E_MAESTRIA.md`

### Objetivo
Fazer a decisão do mentor (`decideMentorAction`) consumir as `flags`/`policy` de `operationalMode` e os sinais de `mastery`, em vez de re-derivar sobrecarga/recuperação inline. Eliminar a lógica paralela e fazer a inteligência nova **mudar a próxima ação**.

### Justificativa
A auditoria provou que `operationalMode` e `mastery` foram construídos mas **não são consumidos pela decisão**: `mentorDecisionPolicy.js` ficou inalterado e re-deriva sobrecarga/relearning inline. É a maior causa de "inteligência decorativa" e de duplicação de lógica de estado.

### Evidência científica
- Mastery learning (Bloom) e student modeling/BKT (Corbett & Anderson, 1995): a próxima atividade deve ser função da **maestria estimada por componente**, não de regra fixa.
- Cognitive load (Sweller): em sobrecarga, reduzir volume e priorizar consolidação — exatamente o que `operationalMode.policy` codifica.

### Arquivos permitidos
- `src/core/mentorDecisionPolicy.js` (alterar)
- `src/core/mentorSignals.js` (garantir que `context.operationalMode` e `context.mastery` existem; já importa operationalMode)
- `src/core/mentorDecisionPolicy.test.js` (atualizar/expandir)

### Arquivos proibidos
- `src/core/store.js`, `src/components/*`, `src/core/decisionCore.js`, `src/core/fsrs.js`, `src/core/operationalMode.js`, `src/core/mastery.js` (apenas **consumir**, não alterar).

### Contrato técnico
- `decideMentorAction(context)`:
  - Ler `const opMode = context.operationalMode` (já no contexto). Se `opMode.flags.canStartNewTopic === false`, **não** emitir `new_topic`.
  - Substituir as checagens inline de sobrecarga/relearning/overdue pela **leitura de `opMode.mode`** (precedência já vem pronta por rank), mantendo as mesmas mensagens/CTA já existentes. Não recriar limiares.
  - Para escolher a área de `new_topic`/foco, usar `context.mastery` (menor maestria × maior incidência) como preferência, com fallback ao comportamento atual.
- **Preservar** o contrato de ação atual (`id/type/priority/title/subtitle/reason/explain/cta/ctaView/estimatedMinutes/confidence/safety/target`).

### Regras de segurança
- Precedência de segurança **inalterada**: dados inconsistentes > sobrecarga > recuperação > fila > … (usar `opMode.rank`).
- Não introduzir nova fonte de verdade de "modo". `operationalMode` passa a ser a **única**.
- Sem decisão tomada dentro de `operationalMode` ou `mastery` — eles entregam sinais; a decisão continua em `decideMentorAction`.

### Critérios de aceite
- `mentorDecisionPolicy.js` não contém mais cálculo próprio de overload/relearning (lê de `opMode`).
- Com `opMode.flags.canStartNewTopic=false`, nenhuma saída `new_topic`.
- Em maestria baixa numa área quente, a ação de tema novo/foco aponta para essa área.
- Comportamento idêntico ao atual nos casos sem modo crítico (regressão zero).

### Testes obrigatórios
- Unit: dado `context` com `opMode.mode=overload`, retorna `workload_relief`/`review`, nunca `new_topic`.
- Unit: dado `opMode.mode=normal` + mastery baixa em "Cardiologia" (incidência alta), `new_topic.target.area="Cardiologia"`.
- Regressão: casos antigos do `mentorDecisionPolicy.test.js` continuam passando.

### Prompt pronto (colar no modelo menor)
```
Você vai alterar APENAS src/core/mentorDecisionPolicy.js, src/core/mentorSignals.js e
src/core/mentorDecisionPolicy.test.js. NÃO toque em mais nenhum arquivo.

Contexto: operationalMode.js (NÃO ALTERAR) exporta deriveOperationalMode(input) que retorna
{ mode, rank, flags:{canStartNewTopic, shouldPreferReview, shouldPreferRecovery,
shouldReduceVolume, shouldPreferExamPractice}, policy:{newTopicBias,...}, explain }.
mastery.js (NÃO ALTERAR) estima maestria por área/subtópico com incerteza.

1. Em mentorSignals.js (buildMentorContext): garanta que o context inclui
   operationalMode (derive com deriveOperationalMode usando scheduler+meta+today já disponíveis)
   e mastery (chame a API pública de mastery.js para o plat atual). Não altere mais nada.

2. Em decideMentorAction(context) (mentorDecisionPolicy.js):
   - Use context.operationalMode para os branches de segurança (dados inconsistentes, sobrecarga,
     recuperação) em vez de recalcular de scheduler. Mantenha títulos/CTA atuais.
   - Se context.operationalMode.flags.canStartNewTopic === false, NUNCA retorne uma ação type:"new_topic".
   - Quando for sugerir new_topic ou foco de área, escolha a área com MENOR maestria e MAIOR
     incidência usando context.mastery; mantenha o fallback atual se mastery vier vazio.
   - PRESERVE exatamente o formato do objeto de ação (id, type, priority, title, subtitle, reason,
     explain, cta, ctaView, estimatedMinutes, confidence, safety, target).

3. Atualize mentorDecisionPolicy.test.js: adicione testes (a) overload => nunca new_topic;
   (b) normal + mastery baixa em área de alta incidência => new_topic.target.area = essa área;
   garanta que os testes antigos continuam passando.

NÃO crie novo arquivo. NÃO persista nada. NÃO altere store/UI/fsrs.
Ao final rode: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build
e reporte o resultado.
```

---

## BLOCO P2.4 — Limpeza e restauração de sinais

**Arquivo do bloco:** `MEDREV_BLOCO_P2_4_LIMPEZA_E_RESTAURACAO_SINAIS.md`

### Objetivo
Remover dead code e órfãos, restaurar os sinais perdidos na decisão (exhaustion/readiness) e garantir que estado derivável (`decisionSnapshot`) não seja persistido.

### Justificativa
Auditoria: `buildActionCandidatesFromState` (dead), `proximaAcao` (dead), `mentorAuditReadiness.js` (órfão), `fsrsShadowReport.js` (órfão no app); sinais `lowEnergy/exhaustionDetected/readinessData` deixaram de chegar à decisão (`store.js:494` constrói snapshot só com `{today}`).

### Evidência
- Higiene de software: dead code e fontes de verdade duplicadas são a principal origem de regressão silenciosa (princípio reforçado pelo próprio `MEDREV_CONTEXT_FOR_AI.md`).

### Arquivos permitidos
- `src/core/store.js` (restaurar sinais no snapshot; tirar `decisionSnapshot` do `partialize` se estiver lá; remover def. de `buildActionCandidatesFromState`)
- `src/core/mentor.js` (remover `proximaAcao`)
- `src/core/mentorAuditReadiness.js` + `.test.js` (remover, se `git grep` confirmar zero uso)
- `src/core/fsrsShadowReport.js` (decidir: ligar ao app OU mover para `__dev__`/remover; ver P2.6)

### Arquivos proibidos
- Tudo que mexa em lógica de decisão/FSRS/mastery/forecast (este bloco é só limpeza + fiação de sinais).

### Contrato técnico
- No `buildDecisionCoreSnapshot` chamado pelo store, passar `readinessData`, `lowEnergy`, `exhaustionDetected` (computar exhaustion via `isExhaustionDetected` já existente em `mentor.js`; readiness via `getReadinessData`).
- Remover `decisionSnapshot` do `partialize` (deve ser recomputado, não persistido). Manter `learningEvents` persistido (é log primário).
- Apagar `buildActionCandidatesFromState` e `proximaAcao`. Remover `mentorAuditReadiness*` se órfão confirmado.

### Regras de segurança
- Antes de remover qualquer função/arquivo: `git grep <nome>` e confirmar zero referências (exceto testes do próprio módulo, que saem juntos).
- Não alterar comportamento de decisão além de **devolver** os sinais que existiam no `Bro__20_`.

### Critérios de aceite
- `git grep buildActionCandidatesFromState | proximaAcao | mentorAuditReadiness` → vazio.
- `decisionSnapshot` não aparece em `partialize`.
- A decisão volta a reagir a exaustão/readiness (teste).
- build + testes passam.

### Testes obrigatórios
- Unit: snapshot construído pelo store inclui `context.readinessData != null` quando há dados; `exhaustionDetected=true` quando `isExhaustionDetected` detecta.
- Regressão: suíte existente passa.

### Prompt pronto
```
Tarefa de LIMPEZA. Arquivos permitidos: src/core/store.js, src/core/mentor.js,
src/core/mentorAuditReadiness.js (+test), src/core/fsrsShadowReport.js. NÃO toque em mais nada.

1. Em store.js, no ponto onde se chama buildDecisionCoreSnapshot(s, { today }):
   passe também readinessData (use getReadinessData com os temas/sims/meta/plat atuais),
   lowEnergy e exhaustionDetected (use isExhaustionDetected de core/mentor.js).
2. Em store.js, remova "decisionSnapshot" da função partialize (se existir lá). Mantenha learningEvents.
3. Em store.js, apague a função @deprecated buildActionCandidatesFromState (confirme com git grep que não é chamada).
4. Em core/mentor.js, apague a função proximaAcao (confirme git grep zero uso fora de teste).
5. Rode "git grep mentorAuditReadiness". Se só aparecer no próprio arquivo e no seu teste,
   delete src/core/mentorAuditReadiness.js e src/core/mentorAuditReadiness.test.js.
6. NÃO mexa em fsrsShadowReport ainda (será tratado no bloco P2.6) — apenas confirme se é importado.

Ao final: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build. Reporte.
```

---

## BLOCO P2.5 — Unificar logs de evento

**Arquivo do bloco:** `MEDREV_BLOCO_P2_5_UNIFICAR_LOGS_EVENTO.md`

### Objetivo
Tornar `learningEvents` o log canônico de eventos de estudo e **depreciar** `temaStats` (migrando leitura), eliminando a sobreposição de 4 logs persistidos.

### Justificativa
Auditoria: `learningEvents` + `temaStats` + `reviewHistory` + `sessionReflections` coexistem; `temaStats` e `learningEvents` registram quase a mesma coisa por revisão. Persistir 4 logs infla Firebase e cria ambiguidade de verdade.

### Evidência
- Learning analytics: um **event store** único e bem-tipado é pré-requisito para student modeling/forecast confiáveis (dados fragmentados degradam qualquer modelo).

### Arquivos permitidos
- `src/core/learningEvent.js` (adicionar seletores que substituam o uso de `temaStats`)
- Consumidores de `temaStats` (apenas trocar a fonte de leitura) — listar via `git grep temaStats`
- `src/core/store.js` (parar de **escrever** `temaStats`; manter campo por compat de leitura por 1 versão)

### Arquivos proibidos
- `reviewHistory` (do `fsrs.js`) — é o log do scheduler, fica. `sessionReflections` — propósito distinto, fica.

### Contrato técnico
- `learningEvent.js` ganha seletores: `getEventsByTema(events, temaId)`, `summarizeByArea(events)`, etc., suficientes para cobrir o que `temaStats` servia.
- Migração: ao hidratar, se houver `temaStats` antigo e `learningEvents` vazio, **converter** `temaStats`→`learningEvents` uma vez (migração nomeada). Não duplicar daí em diante.
- `addTemaStats` deixa de escrever (ou vira no-op marcado deprecated) — só `appendLearningEvent`.

### Regras de segurança
- **Compatibilidade com dados antigos é obrigatória**: ler `temaStats` legado na migração; nunca perder histórico.
- Sem mudança de UI nesta etapa além da troca de fonte.

### Critérios de aceite
- Após migração, telas que liam `temaStats` leem de `learningEvents` e mostram o mesmo.
- `temaStats` não recebe novas escritas.
- Estado antigo (`Bro__20_`) hidrata sem perder histórico (teste de migração).

### Testes obrigatórios
- Migração `temaStats`→`learningEvents` idempotente (rodar 2x não duplica).
- Seletores retornam o mesmo agregado que `temaStats` retornava (teste com fixture).

### Prompt pronto
```
Arquivos permitidos: src/core/learningEvent.js, src/core/store.js e os consumidores diretos de
temaStats (descubra com: git grep temaStats). NÃO toque em fsrs.js (reviewHistory fica) nem em
sessionReflections.

1. Em learningEvent.js, adicione seletores puros: getEventsByTema(events, temaId),
   summarizeByArea(events, plat), e o que mais for preciso para cobrir o que temaStats fornecia.
2. Em store.js: adicione uma migração nomeada (no merge/hydrate) que, se learningEvents estiver vazio
   e existir temaStats antigo, converta cada entrada de temaStats em um LearningEvent via createLearningEvent.
   Torne a migração idempotente (marque migratedTemaStats:true em meta).
3. Em store.js: faça addTemaStats parar de escrever novos dados (no-op deprecated); mantenha o campo
   temaStats para leitura legada por compatibilidade.
4. Troque os consumidores de temaStats para lerem de learningEvents pelos novos seletores.

Compatibilidade com dados antigos é OBRIGATÓRIA. Escreva testes de migração (idempotência + paridade
de agregados). Ao final: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build. Reporte.
```

---

## BLOCO P2.6 — Sombra FSRS historicamente coerente

**Arquivo do bloco:** `MEDREV_BLOCO_P2_6_SOMBRA_FSRS_HISTORICAMENTE_COERENTE.md`

### Objetivo
Corrigir a sombra para **replayar o histórico do tema** num card canônico persistente (em vez de `createEmptyCard` por evento), e ligar `fsrsShadowReport` a uma tela de dev para que a divergência seja observável e válida.

### Justificativa
Auditoria: `fsrsCanonicalShadow.js` cria card vazio a cada evento → o intervalo canônico é sempre "primeira revisão", então a divergência registrada **não tem validade** para embasar troca futura. `fsrsShadowReport` é órfão.

### Evidência
- FSRS/DSR (open-spaced-repetition): o intervalo canônico depende de **estabilidade acumulada**; só replay do histórico produz comparação válida.
- Boas práticas de shadow deployment: a sombra só serve se for fiel ao que o sistema-alvo faria.

### Arquivos permitidos
- `src/core/fsrsCanonicalShadow.js` (replay), `.test.js`
- `src/core/fsrsShadowReport.js` (expor agregação), `.test.js`
- Uma tela/painel de dev existente (ex.: `DataSafetyPanel.jsx` ou um painel atrás de `devFlags`) para exibir o relatório — **sem** alterar fluxo do usuário comum.

### Arquivos proibidos
- Qualquer escrita em datas oficiais. O scheduler oficial **continua** o FSRS-Lite. **Nada** de optimizer.

### Contrato técnico
- `buildFsrsCanonicalShadow` passa a aceitar o **histórico** do tema e a replayar: mantém um `card` canônico, aplica `scheduler.next(card, date, rating)` **em sequência** por cada evento oficial, e só então registra o intervalo/divergência do último passo.
- `fsrsShadowReport` agrega divergências (média, p50/p90, % de passos onde |Δintervalo| > X) e é exibido só sob `FSRS_CANONICAL_SHADOW_ENABLED`/dev.

### Regras de segurança
- Observador puro: zero efeito em datas oficiais (manter `officialPolicy`).
- Não trocar scheduler. Não rodar optimizer.

### Critérios de aceite
- Para um tema com N revisões, o card canônico passou por N `next()` em ordem (teste).
- O relatório de divergência é consumido por ao menos uma superfície (dev).
- Datas oficiais inalteradas (teste de não-regressão do FSRS-Lite).

### Testes obrigatórios
- Replay determinístico: mesma sequência → mesma trajetória canônica.
- Não-mutação: rodar sombra não altera `rev[*].date` oficiais.

### Prompt pronto
```
Arquivos permitidos: src/core/fsrsCanonicalShadow.js (+test), src/core/fsrsShadowReport.js (+test),
e um painel de DEV existente protegido por devFlags. NÃO altere o scheduler oficial. NÃO rode optimizer.
NÃO mude datas oficiais.

1. Em fsrsCanonicalShadow.js: em vez de createEmptyCard por evento, implemente replay:
   receba o reviewHistory do tema, crie UM card canônico (createEmptyCard) e aplique
   scheduler.next(card, reviewedDate, rating) em ORDEM para cada evento oficial, atualizando o card.
   Registre a divergência (intervalo canônico vs intervalo Lite) do passo mais recente.
   Mantenha adapterVersion e officialPolicy. Continue observador-puro.
2. Em fsrsShadowReport.js: agregue divergências (média, mediana, p90, % |Δ|>3 dias).
3. Exiba o relatório SOMENTE sob FSRS_CANONICAL_SHADOW_ENABLED, num painel de dev existente.
   NÃO toque no fluxo do usuário comum.

Testes: replay determinístico; sombra não altera nenhuma data oficial em rev.
Ao final: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build. Reporte.
```

---

## BLOCO P2.7 — Interleaving como ação do Mentor

**Arquivo do bloco:** `MEDREV_BLOCO_P2_7_INTERLEAVING_ACAO_MENTOR.md`

### Objetivo
Quando a fila do dia está vazia e há corpus consolidado, o **Mentor** passa a recomendar um **bloco de prática intercalada** (usando `interleavingPlanner`), em vez de cair direto em `new_topic`/`rest`.

### Justificativa
Auditoria: `interleavingPlanner` é íntegro (não marca conclusão, não mexe datas) mas só aparece no FocusMode. A recomendação pedagógica não chega à tela Hoje quando a fila zera — que é exatamente quando interleaving rende mais.

### Evidência
- Interleaving melhora discriminação e transferência (Rohrer & Taylor, 2007; Brunmair & Richter, meta-análise, 2019). Em prova cumulativa (ENAMED), discriminar entre condições similares é o que a banca cobra.
- Desirable difficulties (Bjork): recuperação espaçada e intercalada sobre material consolidado > releitura passiva.

### Arquivos permitidos
- `src/core/mentorDecisionPolicy.js` (adicionar branch `interleaving_block`)
- `src/core/mentorSignals.js` (expor sinal "corpus consolidado disponível")
- `.test.js` correspondentes

### Arquivos proibidos
- `interleavingPlanner.js` (apenas consumir — já está correto), `fsrs.js`, `store.js` de escrita.

### Contrato técnico
- Novo `type: "interleaving_block"` em `decideMentorAction`, posicionado **após** consolidação/recuperação e **na faixa do new_topic**: dispara quando `opMode.flags.canStartNewTopic` e fila do dia vazia e há ≥2 áreas com temas consolidados (D21+/manutenção). Caso não haja corpus, mantém `new_topic` (construir cobertura).
- `target` aponta para iniciar uma sessão de interleaving (ctaView `focus`), priorizando maestria baixa × incidência alta.

### Regras de segurança
- **Não** marcar conclusão de outras revisões (o planner já garante `official:false`).
- Quando não houver corpus consolidado (usuário novo), **não** recomendar interleaving — recomendar tema novo (cobertura primeiro).

### Critérios de aceite
- Fila vazia + ≥2 áreas consolidadas ⇒ ação `interleaving_block`.
- Fila vazia + sem corpus ⇒ `new_topic` (não interleaving).
- Nenhuma revisão alheia é marcada concluída.

### Testes obrigatórios
- Unit dos dois cenários acima + garantia de `official:false` propagado.

### Prompt pronto
```
Arquivos permitidos: src/core/mentorDecisionPolicy.js, src/core/mentorSignals.js e seus testes.
NÃO altere interleavingPlanner.js (já está correto), nem fsrs.js, nem store.js.

1. Em mentorSignals.js: adicione ao context um sinal consolidatedCorpus = nº de áreas com >=1 tema
   consolidado (rev.d21.done ou rev.manutencao). 
2. Em decideMentorAction: adicione um branch type:"interleaving_block" que dispara quando:
   opMode.flags.canStartNewTopic === true E fila do dia vazia (dueTodayCount==0 && overdueCount==0)
   E context.consolidatedCorpus >= 2 áreas. Priorize área de menor maestria × maior incidência.
   ctaView:"focus". Coloque-o na faixa de prioridade do new_topic, mas ANTES de new_topic.
   Se consolidatedCorpus < 2, mantenha o new_topic atual (cobertura primeiro).
3. PRESERVE o contrato de ação. NÃO marque nenhuma revisão como concluída.

Testes: (a) fila vazia + 2 áreas consolidadas => interleaving_block; (b) fila vazia + sem corpus => new_topic.
Ao final: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build. Reporte.
```

---

## BLOCO P3.1 — Student Model → BKT/PFA explícito por subtópico

**Arquivo do bloco:** `MEDREV_BLOCO_P3_1_STUDENT_MODEL_BKT_PFA.md`

### Objetivo
Evoluir `mastery.js` do heurístico atual para um modelo **interpretável** estilo BKT/PFA por **subtópico**, com parâmetros `slip`/`guess` mapeados à taxonomia de erro existente, retornando `P(domina)` + incerteza.

### Justificativa
A maestria atual é evidence-weighted (boa v1), mas não modela `slip`/`guess` explicitamente nem normaliza por subtópico. Os concorrentes já falam em "600 subtemas".

### Evidência
- BKT (Corbett & Anderson, 1995): 4 parâmetros interpretáveis (prior, learn, slip, guess); base de tutores adaptativos e ligada a mastery learning. PFA (Pavlik, Cen & Koedinger, 2009) adiciona dificuldade do item e contagem de tentativas.
- Modelos profundos (DKT/SAKT) batem BKT em AUC mas **predizem acerto do próximo item, não maestria de KC, e são caixa-preta** (surveys de interpretabilidade de KT, 2021–2025). Para o MedRev — cujo **fosso é a transparência** — BKT/PFA é a escolha certa; DKT não.
- Mapeamento direto: `slip` ↔ `confianca_mal_calibrada` (errar sabendo); `guess` ↔ `chute` (acertar sem saber) — a `errorTaxonomy` já distingue exatamente esses sinais.

### Arquivos permitidos
- `src/core/mastery.js` (+test), `src/constants/enamedIncidencia.js` (mapa de subtópicos, só leitura/ampliação)

### Arquivos proibidos
- `forecast.js`/`readiness.js`/mentor (apenas **consomem** mastery; não acoplar o modelo a eles).

### Contrato técnico
- `mastery.js` expõe `estimateMastery(events, { unit: "subtopic" })` retornando, por subtópico: `pKnown` (0–1), `confidence`/`sampleQuality`, e `params` (slip, guess) usados.
- Atualização incremental BKT por evento; `slip`/`guess` informados pela `errorTaxonomy` (não fixos arbitrários).
- Normalização de subtópico via mapa canônico (string livre → subtópico ENAMED).

### Regras de segurança
- D0 isolado nunca gera `pKnown` alto (preservar regra atual).
- Sem evidência espaçada → status "insuficiente", não fraqueza.
- Modelo **não** decide agenda nem readiness — só estima e entrega incerteza.
- Compatibilidade com dados antigos.

### Critérios de aceite
- `pKnown` por subtópico com banda/incerteza; sobe só com evidência espaçada repetida.
- `guess` alto não infla maestria; `slip` alto não a derruba ingenuamente.
- Funções antigas de mastery preservadas (compat).

### Testes obrigatórios
- Sequências sintéticas: acertos espaçados ⇒ `pKnown` sobe; chute (acerto+confiança baixa) ⇒ `pKnown` quase não sobe; slip (erro+confiança alta) ⇒ `pKnown` cai pouco; D0 100% isolado ⇒ `pKnown` baixo + status insuficiente.

### Prompt pronto
```
Arquivos permitidos: src/core/mastery.js (+test) e src/constants/enamedIncidencia.js (apenas
ampliar mapa de subtópicos). NÃO toque em forecast.js, readiness.js, mentor ou store.

Implemente um modelo BKT/PFA INTERPRETÁVEL por subtópico (NÃO use rede neural / DKT):
1. estimateMastery(events, {unit:"subtopic"}) retorna por subtópico { pKnown, confidence,
   sampleQuality, params:{slip,guess,learn,prior} }.
2. Atualização incremental tipo BKT a cada evento. Use a taxonomia de erro existente para informar
   slip (errar com confiança alta => confianca_mal_calibrada) e guess (acertar com confiança baixa => chute).
3. Normalize tema/área livre para subtópico canônico via enamedIncidencia.
4. PRESERVE as regras: D0 isolado não gera pKnown alto; sem evidência espaçada => status insuficiente;
   retorne sempre incerteza/qualidade da amostra. Mantenha as funções públicas antigas (compat).
NÃO faça mastery decidir agenda/readiness.

Testes sintéticos: acertos espaçados sobem pKnown; chute quase não sobe; slip cai pouco;
D0 100% isolado => pKnown baixo + insuficiente. Compat com estado antigo.
Ao final: npm test -- --watchAll=false ; npm run check:mojibake ; npm run build. Reporte.
```

---

## Depois disso (não antes): P3.2 — Ingestão bank-agnostic

Só após P2.3–P3.1 estáveis. Importar resultados de Q-bank/Anki/simulados externos como `LearningEvent`s (source externo) — é o moat estratégico (ver `MEDREV_PERSONALIZATION_AND_MENTOR_MASTERPLAN.md`), mas depende do log unificado (P2.5) e do student model (P3.1) prontos. Não abrir agora.
