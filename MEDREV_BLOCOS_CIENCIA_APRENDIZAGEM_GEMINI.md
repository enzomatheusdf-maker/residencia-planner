# MEDREV — BLOCOS DE CIÊNCIA DA APRENDIZAGEM (MASTIGADO PARA MODELOS MENORES)

> Execução pós-consolidação (P2.3→P3.1 já feitos). Cada bloco: objetivo, evidência, arquivos permitidos/proibidos, contrato, regras de segurança, critérios de aceite, testes e **prompt pronto**. Pequenos, isolados, sem refactor global. Sempre terminar com `npm test -- --watchAll=false && npm run check:mojibake && npm run build`.
>
> Os blocos abaixo incluem itens do roadmap de eficiência + **funções novas de ciência da aprendizagem** que fecham lacunas da auditoria. O Raciocínio Clínico tem doc próprio (`MEDREV_RACIOCINIO_CLINICO_REDESIGN_GEMINI.md`); o método de flashcards tem guia próprio (`MEDREV_GUIA_FLASHCARDS_MEDICINA.md`).

**Ordem sugerida:** B1 (limpeza residual) → B2 (retenção-alvo) → B3 (params BKT) → B4 (loop erro→prática) → B5 (if-then/adesão) → B6 (crescimento/UX) → B7 (confundíveis) → B8 (motor de flashcards).

---

## B1 — Fechar residuais da consolidação
**Objetivo:** remover `proximaAcao` (morto) e tirar `decisionSnapshot` do `partialize` (estado derivável persistido).
**Evidência:** higiene; estado derivável não deve persistir (recomputar evita divergência entre sessões).
**Permitidos:** `core/mentor.js`, `core/store.js`. **Proibidos:** resto.
**Contrato:** apagar `proximaAcao` (confirmar `git grep` zero chamadas); remover `"decisionSnapshot"` da lista do `partialize` (`store.js:199`); manter `decisionSnapshot` em memória (recomputado por `rebuildDecisionSnapshot`).
**Segurança:** não alterar lógica de decisão.
**Aceite:** `git grep proximaAcao` vazio; `decisionSnapshot` não aparece no `partialize`; testes passam.
**Prompt:**
```
Arquivos permitidos: src/core/mentor.js, src/core/store.js. Nada além disso.
1. git grep proximaAcao — confirme que só aparece na definição/testes. Apague a função proximaAcao de mentor.js e seu teste.
2. Em store.js, remova "decisionSnapshot" da função partialize (l.~199). Mantenha o campo em memória (já é recomputado por rebuildDecisionSnapshot).
Rode npm test -- --watchAll=false ; npm run check:mojibake ; npm run build. Reporte.
```

---

## B2 — Política de retenção-alvo (carga ÷ conhecimento)
**Objetivo:** substituir `desiredRetention = 0.90` fixo por alvo recomendado por fase, minimizando carga/conhecimento.
**Evidência:** FSRS minimiza a razão workload/knowledge; 85–90% é o ponto prático; >95% ~dobra a carga por ganho ínfimo (open-spaced-repetition, *The Optimal Retention*).
**Permitidos:** `core/retentionPolicy.js` (novo, +test); pontos de chamada do FSRS em `core/store.js`/`core/fsrs.js` apenas para **passar** o parâmetro (as funções já aceitam `desiredRetention`).
**Proibidos:** mudar `LEARNING_TRANSITION_POLICY` (bandas da escada inicial intocadas — blocos ≠ átomos); rodar optimizer de parâmetros.
**Contrato:** `recommendDesiredRetention({ examPhase, overload, history }) -> { desiredRetention, rationale }`. Regras: base 0.88; `reta_final`/`vespera` → 0.92 (temas quentes); fase inicial pode 0.85; **sob sobrecarga, nunca subir**. Aplicar só na **manutenção** (não nos passos d0–d21).
**Segurança:** sem optimizer (precisa de sombra coerente — feita — **e** ≥1.000 revisões). Escada inicial fixa por banda.
**Aceite:** manutenção usa o alvo da policy; reta final ≥ base; sobrecarga não eleva alvo; testes.
**Prompt:**
```
Crie src/core/retentionPolicy.js (+ teste). NÃO altere LEARNING_TRANSITION_POLICY nem rode optimizer.
1. Exporte recommendDesiredRetention({examPhase, overload, history}) => {desiredRetention, rationale}.
   base=0.88; se examPhase ∈ {reta_final,vespera} => 0.92; se fase inicial e sem sobrecarga => 0.85; se overload => não subir (no máximo base).
2. No store/fsrs, nos pontos que chamam maintenanceInterval/nextInterval para MANUTENÇÃO, passe desiredRetention vindo da policy (as funções já aceitam o parâmetro). NÃO toque nos passos d0–d7–d21.
Testes: reta final >= base; overload não eleva. Rode test+mojibake+build.
```

---

## B3 — Parâmetros BKT informados pela taxonomia de erro (slip/guess por subtópico)
**Objetivo:** sair de `slip/guess` fixos globais (`mastery.js`: guess 0.25 / slip 0.12) para valores **estimados por subtópico** a partir dos erros reais: `guess`↔chute (acertar sem saber), `slip`↔confiança_mal_calibrada (errar sabendo).
**Evidência:** BKT/PFA (Corbett & Anderson; Pavlik) — slip/guess são os parâmetros interpretáveis; estimá-los do log melhora a maestria latente e a calibração. Mapear à `errorTaxonomy` mantém o moat de transparência.
**Permitidos:** `core/mastery.js` (+test), `core/errorTaxonomy.js` (só leitura).
**Proibidos:** `forecast.js`, `readiness.js`, mentor (apenas consomem).
**Contrato:** `estimateSubtopicParams(events) -> { [subtopic]: { slip, guess, n } }`. `guess` ← frequência de acerto marcado como "chute"/confiança baixa; `slip` ← frequência de erro com confiança alta (confiança_mal_calibrada). Suavização (priors globais) quando `n` pequeno. `updateBayesianMastery` passa a aceitar params por subtópico.
**Segurança:** `n` pequeno ⇒ usar priors globais (não inventar parâmetro). Não deixar slip/guess fora de [0.01, 0.45]. Compatível com estado antigo.
**Aceite:** subtópico com muitos "chutes" tem `guess` alto e maestria sobe **menos** por acerto; subtópico com "errar sabendo" tem `slip` alto e maestria cai **menos** por erro; priors quando `n<min`.
**Prompt:**
```
Arquivos permitidos: src/core/mastery.js (+test), leitura de core/errorTaxonomy.js. Não toque em forecast/readiness/mentor.
1. Exporte estimateSubtopicParams(events) => { [subtopic]: {slip, guess, n} }.
   guess = P(acerto | erro_tipo=chute OU confianca baixa); slip = P(erro | confianca alta / confianca_mal_calibrada).
   Suavize com priors globais (guess 0.25 / slip 0.12) quando n < minSamples. Limite a [0.01,0.45].
2. Faça updateBayesianMastery aceitar params por subtópico (fallback aos defaults). Mantenha as funções públicas antigas (compat).
Testes sintéticos: muitos chutes => guess alto => acerto sobe pouco; errar-sabendo => slip alto => erro derruba pouco; n pequeno => priors.
Rode test+mojibake+build.
```

---

## B4 — Loop erro → prática deliberada (fato vira card; raciocínio vira caso)
**Objetivo:** quando o aluno erra, gerar automaticamente a ação corretiva certa pelo **tipo de erro**: lacuna de **conteúdo** → flashcard atômico; falha de **raciocínio** → caso/illness script. Fecha o ciclo de prática deliberada que hoje é fraco.
**Evidência:** deliberate practice = tarefa no limite + feedback + correção dirigida (Ericsson); diagnóstico melhora treinando **justificativa** e contraste (Mamede); a `errorActionMap` já existe — falta automatizar a saída.
**Permitidos:** `core/errorActionMap.js` (+test), `core/learningEvent.js` (seletor de erros recentes). 
**Proibidos:** UI nesta etapa (só a função pura que decide a ação); FSRS.
**Contrato:** `recommendRemediationFromError(event) -> { kind: "flashcard" | "case" | "illness_script", payload }`. Erro de conteúdo/fato ⇒ `flashcard` (semente: o fato específico). Erro de raciocínio/diagnóstico/conduta ⇒ `case`/`illness_script` no tema. Usa `dominantError` + `motivosErro`.
**Segurança:** não duplicar a taxonomia (consumir `errorTaxonomy`/`errorActionMap`). Não criar flashcard sem o fato específico (evitar card vago).
**Aceite:** erro "lacuna de conteúdo" → `flashcard`; erro "premature closure"/raciocínio → `case`; erro de calibração → flag de calibração (não card).
**Prompt:**
```
Arquivos permitidos: src/core/errorActionMap.js (+test), src/core/learningEvent.js (adicionar getRecentErrorEvents). Sem UI, sem FSRS.
1. Exporte recommendRemediationFromError(event) => {kind, payload}.
   Use dominantError/motivosErro: conteúdo/fato => kind:"flashcard" (payload = fato específico do erro);
   raciocínio/diagnóstico/conduta => kind:"case" ou "illness_script" (payload = tema);
   calibração => kind:"calibration_flag".
2. NÃO reimplemente a taxonomia — consuma errorTaxonomy/errorActionMap.
Testes: um evento de cada tipo retorna o kind certo. Rode test+mojibake+build.
```

---

## B5 — Implementation intentions + lembretes contextuais (adesão)
**Objetivo:** plano "Quando [gatilho], então abro o MedRev e faço a fila"; lembrete no gatilho; mentor reajusta quando adesão cai.
**Evidência:** if-then plans ~dobram a adesão; lembretes amplificam e formam hábito (Gollwitzer; ACT-R/JMIR). Manter **revisável** (rigidez reduz flexibilidade).
**Permitidos:** `core/studyPlanIntentions.js` (novo, +test); integração com o sistema de lembretes/agenda existente; config no store (poucos campos).
**Proibidos:** persistir como log; linguagem de culpa.
**Contrato:** `createIntention({cue, action, window})`, `nextReminderFor(intention, today, adherence)`. Detecta queda de adesão via `learningEvents` e sinaliza ao mentor para sugerir ajuste do plano.
**Segurança:** autonomia (o aluno define o gatilho); plano editável; sem "você perdeu tudo".
**Aceite:** intenção criada gera próximo lembrete coerente; adesão baixa marca `needsReplan`.
**Prompt:**
```
Crie src/core/studyPlanIntentions.js (+teste) e integre ao sistema de lembretes existente. Config no store (poucos campos), não log.
createIntention({cue, action, window}); nextReminderFor(intention, today, adherence).
Se adesão dos últimos 7 dias < limiar, retorne needsReplan:true (o mentor sugere ajustar — nunca culpar).
Testes: criação + needsReplan. Rode test+mojibake+build.
```

---

## B6 — Métricas de crescimento + reference frames (UX)
**Objetivo:** o aluno **ver que melhorou** (vs si mesmo e vs meta 13/09), com ação em cada métrica.
**Evidência:** LADs mudam comportamento com reference frames + visualização de crescimento + feedback acionável (Journal of Learning Analytics; de Vreugd 2025).
**Permitidos:** `core/growthMetrics.js` (novo, +test); `components/StatsPanel.jsx`/`Dashboard.jsx` (consumir).
**Proibidos:** prometer nota/TRI; reference frame social como default.
**Contrato:** `computeGrowth(events, {window}) -> { retentionDelta, calibrationDelta, masteryByAreaDelta, vsGoal }`. Cada métrica do painel ganha moldura ("vs você há 30 dias" / "vs meta") + botão de ação.
**Segurança:** default = frame interno (você-vs-você); evitar ansiedade comparativa.
**Aceite:** deltas corretos vs janela anterior; cada card tem CTA; sem promessa de aprovação.
**Prompt:**
```
Crie src/core/growthMetrics.js (+teste). Consuma learningEvents. Exporte computeGrowth(events,{window}) =>
{retentionDelta, calibrationDelta, masteryByAreaDelta, vsGoal}. Em StatsPanel/Dashboard, adicione a cada métrica
uma moldura "vs você há 30 dias" e "vs meta 13/09" + um botão de ação. Default = comparação ao próprio passado.
NÃO prometa nota/TRI. Testes do cálculo de delta. Rode test+mojibake+build.
```

---

## B7 — Detector de casos/temas confundíveis (alimenta interleaving e raciocínio)
**Objetivo:** identificar conjuntos de temas/diagnósticos **confundíveis** (mesmo macrotema/diferencial) para (a) interleaving de alto valor e (b) modo contraste do Raciocínio Clínico.
**Evidência:** interleaving rende mais com itens **confundíveis** (Brunmair & Richter, 2019); contraste de diagnósticos treina discriminação (Mamede; CBCR).
**Permitidos:** `core/confusableSets.js` (novo, +test); consumido por `interleavingPlanner.js` e (depois) pelo Raciocínio Clínico.
**Proibidos:** marcar conclusão; alterar datas.
**Contrato:** `buildConfusableSets(temas, casos) -> [{ key, members: [...], reason }]`. Agrupa por `parentTopic`/diferenciais compartilhados (ex.: dor torácica: SCA × TEP × dissecção × pericardite).
**Segurança:** sets são sugestão de prática, não agendamento.
**Aceite:** temas com diferenciais comuns caem no mesmo set; `interleavingPlanner` prioriza membros do mesmo set.
**Prompt:**
```
Crie src/core/confusableSets.js (+teste). buildConfusableSets(temas, casos) => [{key, members, reason}],
agrupando por parentTopic e por diferenciais compartilhados (use o campo diferenciais dos casos quando houver).
Faça interleavingPlanner priorizar candidatos do MESMO set acima de "mesma área". NÃO marque conclusão nem mude datas.
Testes: dor torácica agrupa SCA/TEP/dissecção. Rode test+mojibake+build.
```

---

## B8 — Motor de flashcards (atômico, cloze, ancorado em imagem, agendado por FSRS)
**Objetivo:** flashcards como unidade de 1ª camada (fatos), atômicos, com cloze e âncora visual, agendados pelo MESMO FSRS-Lite dos temas. (Método detalhado no guia próprio.)
**Evidência:** volume de flashcards prediz desempenho em prova (Step 1: ~1700 cards ≈ +1 ponto; preditor independente); princípio da informação mínima (Wozniak); superioridade da imagem/distintividade (Shepard; Von Restorff); efeito de geração (criar o próprio cartão).
**Permitidos:** `core/flashcardEngine.js` (novo, +test); reusar `fsrs.js` (scheduler) e `learningEvent.js` (log). UI mínima depois.
**Proibidos:** criar um 2º scheduler (reusar FSRS-Lite); cards multi-cloze pesados (1 lacuna por cartão por padrão).
**Contrato:** `createCard({ front, back, cloze, image, subtopic, sourceErrorId })`; `scheduleCard`/`reviewCard` delegando ao FSRS-Lite; validação de atomicidade (1 fato; cloze único por padrão). Liga ao B4 (erro→card).
**Segurança:** card sem fato específico é rejeitado; subtópico canonizado (reusa `mastery.canonicalizeSubtopic`); âncora visual opcional, nunca obrigatória.
**Aceite:** card multi-fato é sinalizado para dividir; review agenda pelo FSRS; card gerado por erro (B4) carrega `sourceErrorId`.
**Prompt:**
```
Crie src/core/flashcardEngine.js (+teste). REUSE o FSRS-Lite (fsrs.js) — NÃO crie outro scheduler.
createCard({front, back, cloze, image, subtopic, sourceErrorId}) com validação de atomicidade (1 fato; 1 cloze por padrão;
sinalize cards multi-fato para dividir). scheduleCard/reviewCard delegam a recalcAfterMark do FSRS-Lite e logam via learningEvent.
Canonize subtopic via mastery.canonicalizeSubtopic. Integre com recommendRemediationFromError (B4): erro de conteúdo => card semente.
Testes: rejeita card vago; multi-fato sinalizado; review agenda; sourceErrorId preservado. Rode test+mojibake+build.
```

---

### Notas de sequência
- **B2/B6** dão retorno percebido rápido (eficiência + crescimento visível). **B3/B4/B8** fecham o ciclo erro→modelo→prática. **B7** habilita interleaving de diferenciais e o modo contraste do Raciocínio Clínico (doc próprio).
- Itens do roadmap já especificados e **não** repetidos aqui: orçamento de tempo (P4.5), feedback elaborado (P4.4) — ver `MEDREV_ROADMAP_EFICIENCIA_E_EXPERIENCIA_POS_CONSOLIDACAO.md`.
- **Não fazer ainda:** optimizer de parâmetros FSRS (precisa ≥1.000 revisões); reference frame social default; flashcard de tudo (ver guia — é contraproducente).
