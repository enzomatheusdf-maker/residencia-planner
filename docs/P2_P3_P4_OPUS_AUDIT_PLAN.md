# MEDREV — P2/P3/P4: Plano de Auditoria e Integracao (Opus Thinking)

> **Modo:** planejamento. Nenhuma implementacao foi feita.
> **Fonte de verdade:** `MEDREV_P2_P3_P4_OPUS_ROADMAP.md` e `MEDREV_P2_STATS_METRICS_REGISTRY.md`.
> **Metodo:** auditoria do codigo real via `git grep` / `git ls-files` (sem listar workspace inteiro).
> **Executor de implementacao previsto:** `gpt-5.3-codex` ou Sonnet, por sub-bloco.
> **Data da auditoria:** 2026-06-01. Branch `main`, HEAD `94e97cf5` (feat: P1-A v2 navegacao e dashboard hoje).

---

## 0. Estado do repositorio no momento da auditoria

- Working tree limpo, exceto 2 untracked (os proprios roadmaps `.md`). Nenhum arquivo critico de codigo pendente.
- Scripts disponiveis em `package.json`: `check:mojibake`, `test` (react-scripts), `build` (roda mojibake + build), `start`.
- `docs/` ja existe (`P1_AUDITORIA_INTEGRACAO_UX.md`, `P1_A_NAV_DASHBOARD_DECISIONS.md`, `RELEASE_CHECKLIST.md`).
- **Greenfield confirmado** (nenhum destes arquivos existe ainda):
  - `src/core/metricsRegistry.js` / `.test.js`
  - `src/core/errorActionMap.js` / `.test.js`
  - `src/core/reviewTaskPlanner.js` / `.test.js`
  - `src/core/clinicalReasoningScoring.js` / `.test.js`
  - `src/components/ErrorActionCenter.jsx`, `ErrorActionPrompt.jsx`, `MetricCard.jsx`, `StatsSection.jsx`

---

## 1. Diagnostico do estado atual

### 1.1 Estatisticas (P2)

`src/components/StatsPanel.jsx` (767 linhas) e hoje um **deposito de graficos** sem governanca, confirmando o diagnostico do roadmap. Estrutura atual, em ordem de render:

1. `EnamedMapa` + `AdvancedSection` com `EnamedProvaAnalyzer` (so `plat === "res"`).
2. Card "Padrao de Erros" (dominante / alta confianca+erro / tempo / raciocinio).
3. KPIs (`Preparo estimado`, `Temas`, `Questoes`, `Ciclos`, `Acerto Medio`).
4. Heatmap 12 semanas.
5. Calibracao metacognitiva.
6. Evolucao cronologica de acertos + Forecast FSRS 14 dias.
7. Redacao ENEM (so `plat === "vest"`).
8. Desempenho por especialidade/materia.
9. `AdvancedSection` "Paineis avancados" com `LaunchChecklistPanel` + `WeeklyReview` + `DataSafetyPanel`.

Problemas concretos:

- **Sem secoes nomeadas.** Nao existem as 7 secoes do roadmap (Resumo, Aprendizagem, Erros, Provas/Simulados, Raciocinio Clinico, Atividade, Sistema). Tudo e um stream vertical.
- **Estados "coletando" hardcoded e dispersos.** Ex.: `StatsPanel.jsx:241` (calibracao "Faltam mais X revisoes"), `StatsPanel.jsx:504` (`5 - calibrationData.n`), `StatsPanel.jsx:548` ("Insuficientes dados"). Nao ha regra de confianca central.
- **Sem `metricsRegistry`.** Cada metrica define label/empty/threshold inline. Nenhuma responde de forma padronizada "o que mede / da pra confiar / o que faco".
- **Calculo duplicado de preparo.** `StatsPanel.readinessTrend` (`StatsPanel.jsx:248`) chama `getReadinessData` direto; o Dashboard tambem consome readiness. Risco de divergencia visual entre abas.
- **Raciocinio Clinico ausente de Stats.** Nao ha secao 5 mesmo em `res`.
- **Sistema misturado com aprendizagem.** DataSafety/LaunchChecklist/WeeklyReview ficam num accordion no fim, nao numa secao "Sistema".

### 1.2 Erros (P3)

Existem **tres taxonomias de erro divergentes e nao reconciliadas** — este e o achado mais critico:

| Fonte | Local | Conjunto | Uso |
|---|---|---|---|
| Moderna (canonica) | `src/core/errorTaxonomy.js` | 8 tipos: `conteudo, raciocinio, interpretacao, distracao, tempo, chute, confianca_mal_calibrada, memoria` | `StatsPanel` (card Padrao de Erros), `classifyError`, `summarizeErrors`, `dominantErrorType` |
| Legada | `src/core/readiness.js:181` | 6 tipos: `lacuna, raciocinio, distractor, descuido, nao_visto, interpretacao` | `errorCounts` + `dominantError` no objeto de readiness |
| Reflexao | `src/core/sessionReflection.js:22` (`ALLOWED_ISSUES`) | 7 issues: `conteudo, raciocinio, tempo, energia, distracao, nenhum, memoria` | fechamento de sessao -> `suggestAdjustmentFromReflection` -> ActionInbox |

O roadmap P3 pede uma taxonomia de **12 tipos** (`conteudo, memoria, raciocinio, representacao_problema, diferencial, incerteza_sct, conduta_prescricao, interpretacao, distracao, tempo, confianca_mal_calibrada, estrategia_prova`). Nenhuma das tres cobre isso.

Outros pontos:

- **`errorTaxonomy.js` tem normalizador legado** (`LEGACY_ERROR_MAP`, `errorTaxonomy.js:23`) que ja mapeia `lacuna/nao_visto/distractor/descuido` -> tipos modernos. **Esse e o ponto de ancoragem natural** para unificar a taxonomia em P3 sem perder dados antigos.
- **`readiness.errorCounts` so le `simulados[].questoesErradas`** (`readiness.js:184`), ignorando os erros estruturados de revisoes (`tema.rev[step].erros`) que o `StatsPanel.errorAnalytics` (`StatsPanel.jsx:290`) ja agrega. Ou seja, o "dominantError" do readiness e mais pobre que o do Stats.
- **Mentor NAO consome erro dominante.** `git grep dominantError|erroDominante` em `mentor.js`, `mentorSignals.js`, `mentorDecisionPolicy.js`, `mentorAutopilot.js`, `Dashboard.jsx` retorna vazio. O loop "Mentor usa erro dominante" do criterio de aceite **nao existe hoje**.
- **Loop pos-erro parcialmente montado.** `sessionReflection.reflectionToAction` (`sessionReflection.js:90`) ja gera acoes (`review/exam_analysis/clinical_case/anki/rest`) e o `store.addSessionReflection` (`store.js:376`) ja injeta no ActionInbox. Mas o mapeamento e por `mainIssue` (7 valores), nao por taxonomia de erro de questao, e nao ha tela dedicada de "Centro de Erros".

### 1.3 Raciocinio Clinico (P4)

- **`calcRaciocinioScore` triplicado com formulas e campos divergentes** (confirma a auditoria do roadmap):
  - `RaciocinioClinico.jsx:24` — media simples de `fase2Acerto` e `sctAcerto`.
  - `readiness.js:25` — media ponderada 0.6 `fase2Acerto` / 0.4 `sctAcerto`.
  - `illnessScript.js:424` — media de `notaCaso`.
- **Risco silencioso grave:** `RaciocinioClinico` (`registrarCaso`, ver `RaciocinioClinico.jsx:93-131`) grava `fase1Ok / fase2Acerto / sctAcerto / anamneseCobertura`, mas **nunca grava `notaCaso`**. Logo, `illnessScript.calcRaciocinioScore` retorna `null` na pratica (ramo morto), enquanto a UI mostra a versao nao-ponderada e o readiness usa a ponderada. Tres numeros possiveis para a "mesma" metrica.
- **Casos insuficientes:** `src/constants/casosClinicos.js` tem **apenas 2 casos** (`apendicite-classica`, `pre-eclampsia-grave`).
- **Sem `reviewTaskPlanner` e sem `clinicalCaseMatch`.** Nao ha vinculo do caso clinico com o tema-pai do cronograma nem agendamento por estagio FSRS (D1/D4/D7/D21).
- **Brain dump existe, mas generico.** `FocusMode.jsx` ja tem fluxo `d1` ("D1 BRAIN DUMP FLUX", `FocusMode.jsx:1168`) ligado ao step FSRS, **nao** o brain dump estruturado em 5 campos (definicao/diagnostico/diferenciais/conduta/nao-pode-perder) do roadmap. Nao ha modo de revisao multimodal por estagio.
- **Conduta/prescricao simulada ausente.** `git grep prescric` em FocusMode = vazio.
- **Plataforma ja gateia corretamente.** `platformFeatures.js` expoe `raciocinioClinico/illnessScript/casosClinicos = !isVest`. `App.js:1156` e `BottomNav.jsx:56` exigem `featureEnabled(plat,...) && meta.modulos?.raciocinioClinico === true`. `readiness.js:97` so calcula score se `meta.modulos.raciocinioClinico`. Boa base; P4 deve reusar esse gate, nao criar novo.

---

## 2. Riscos de integracao

| # | Risco | Evidencia | Mitigacao |
|---|---|---|---|
| R1 | **Triplicacao de score** continua e gera numeros diferentes entre Stats/Readiness/UI | `calcRaciocinioScore` em 3 arquivos com campos divergentes | P4-A: 1 fonte canonica em `clinicalReasoningScoring.js`; os outros 2 viram re-export/adaptador. Manter teste de equivalencia. |
| R2 | **Quarta taxonomia de erro.** P3 introduzir 12 tipos sem reconciliar as 3 atuais multiplica o problema | tabela 1.2 | P3-A: `errorActionMap` deve consumir o tipo **canonico de `errorTaxonomy.js`**, estendendo-o (nao criar enum paralelo). Reusar `LEGACY_ERROR_MAP`. |
| R3 | **Divergencia Stats vs Dashboard de "Preparo".** Ambos derivam de readiness por caminhos proprios | `StatsPanel.jsx:248`, readiness consumido em Dashboard | P2: metrica `trueRetention`/`readiness` passa pelo registry; Dashboard e Stats leem o mesmo `evaluateMetric`. Sem dependencia circular (roadmap secao 12). |
| R4 | **Vazamento de medicina no Vestibular.** Nova secao Raciocinio/Erros pode renderizar em `vest` | gate existe mas e por-call-site | P2/P3/P4: toda secao nova consulta `featureEnabled(plat, ...)`/`getMetricsForSection(section, plat)`. Teste explicito "vest nao recebe ENAMED nem Raciocinio". |
| R5 | **Mojibake.** Projeto tem barreira `check:mojibake` no build | `package.json:20,25` | Escrever todos os arquivos novos em UTF-8 limpo; rodar `npm run check:mojibake` antes de qualquer commit (commit fora de escopo aqui). |
| R6 | **`illnessScript.calcRaciocinioScore` e ramo morto** (le `notaCaso` nunca gravado) | `illnessScript.js:424` vs `RaciocinioClinico.jsx:93` | P4-A decide: ou `registrarCaso` passa a gravar `notaCaso` canonico, ou a funcao e descontinuada. Nao deixar 3 contratos. |
| R7 | **ActionInbox dedupe pode engolir acoes corretivas.** `dedupeActions` usa chave `type|tema|area|dueDate` | `actionInbox.js:52` | P3: acoes corretivas devem ter `type`/`target` que nao colidam com revisoes diarias; validar com teste de dedupe. |
| R8 | **Lazy/Suspense em Stats.** `EnamedProvaAnalyzer/WeeklyReview/DataSafetyPanel` sao lazy | `StatsPanel.jsx:14-16` | Ao reorganizar em secoes, preservar os boundaries de Suspense para nao quebrar code-splitting. |
| R9 | **Bloco N (multiusuario) nao concluido.** Roadmap pre-condicao 2 pede nao tocar dados persistentes novos | `MEDREV_BLOCO_N...md` existe | P2/P3/P4 nao criam novas chaves persistidas alem do minimo; reusar `casosProgresso`, `sessionReflections`, `actionInbox`. Activity Log fica pos-N. |
| R10 | **2 casos clinicos** tornam metricas de raciocinio nao confiaveis | `casosClinicos.js` | P4: registry marca `clinicalReasoningScore` como `collecting`/`low_confidence` ate amostra minima; nao mostrar 100% com 1 caso. |

---

## 3. Plano em sequencia (P2 -> P3 -> P4)

Ordem obrigatoria (roadmap secao 3). **Nao executar tudo junto.** Cada sub-bloco e um PR pequeno com build/test/mojibake verdes.

### P2 — Estatisticas e metricas acionaveis

**P2-A — `metricsRegistry` + reorganizacao leve**
- Criar `src/core/metricsRegistry.js` com API do roadmap: `METRIC_STATUS`, `getMetricDefinition`, `evaluateMetric`, `getMetricsForSection(section, plat)`, `formatMetricValue`.
- Metricas obrigatorias (nomes do registry detalhado): `trueRetention, todayWorkloadMinutes, overdueReviews, relearningCount, coverageByArea, simuladoAccuracy, enamedGap, dominantError, clinicalReasoningScore, ankiAdherence, weeklyConsistency`.
- Cada definicao com `{ id, label, shortLabel, section, description, emptyState, confidenceRule, actionWhenLow, platforms }`.
- `dominantError` deve ler o tipo canonico de `errorTaxonomy.js`; `clinicalReasoningScore` deve ter `platforms: ["res"]`.
- Centralizar os "coletando" hardcoded de StatsPanel via `confidenceRule`/`emptyState`.

**P2-B — `StatsPanel` em 7 secoes**
- Refatorar `StatsPanel.jsx` para tabs/segmented (desktop) + accordion (mobile): Resumo, Aprendizagem, Erros, Provas/Simulados, Raciocinio Clinico, Atividade, Sistema.
- Resumo usa registry (max 6 cards: preparo, retencao longa, carga, vencidas, relearning, proxima acao do Mentor).
- Erros: reusar `errorAnalytics` atual; se `errorActionMap` nao existir, placeholder "Centro de Erros sera ativado no P3".
- Raciocinio Clinico: so `res`, com dados existentes; **nao** criar novo `calcRaciocinioScore`.
- Sistema: mover DataSafety/Launch/WeeklyReview para ca, preservando lazy/Suspense.
- Dashboard nao ganha cards novos; le do mesmo registry.

### P3 — Centro de Erros e acoes corretivas

**P3-A — `errorActionMap` (core)**
- Criar `src/core/errorActionMap.js` estendendo a taxonomia canonica de `errorTaxonomy.js` para os 12 tipos do roadmap (acrescentar `representacao_problema, diferencial, incerteza_sct, conduta_prescricao, estrategia_prova`; manter retrocompatibilidade via `LEGACY_ERROR_MAP`).
- Mapa tipo->acao corretiva (ex.: `memoria -> FSRS/Anki`, `raciocinio -> mini caso + problem representation`, `diferencial -> 3 diferenciais + must-not-miss`, `conduta_prescricao -> management station educacional`, `tempo -> bloco cronometrado`, `confianca_mal_calibrada -> estimativa previa + revisao calibrada`).
- Saida deve casar com `actionInbox.createAction` (type/target/priority) para nao quebrar dedupe (R7).

**P3-B — `ErrorActionCenter` + `ErrorActionPrompt` integrados**
- `ErrorActionCenter.jsx`: tela de leitura/acao (errei por que -> o que faco agora), alimentada por `errorActionMap` + `errorTaxonomy.summarizeErrors`.
- `ErrorActionPrompt.jsx`: CTA reutilizavel em pos-sessao e pos-simulado.
- Pontos de integracao (roadmap): Stats secao Erros; Mais como ferramenta; pos-sessao (CTA); pos-simulado (CTA); Mentor (acao corretiva). **Nao** criar aba solta.
- **Fechar o loop do Mentor (R-aceite):** Mentor passa a consumir `dominantError` (hoje ausente) via signal novo em `mentorSignals.js`, alimentando a "proxima melhor acao".

### P4 — Raciocinio Clinico integrado ao FSRS (apenas Residencia)

**P4-A — Unificar `calcRaciocinioScore`**
- Criar `src/core/clinicalReasoningScoring.js` como fonte unica (definir contrato: campos de `casosProgresso` e pesos). Resolver R6: decidir `notaCaso` canonico ou descontinuar.
- `readiness.js`, `RaciocinioClinico.jsx` e `illnessScript.js` passam a importar dessa fonte (re-export/adaptador). Teste de equivalencia para garantir 1 numero.

**P4-B — `reviewTaskPlanner`**
- Criar `src/core/reviewTaskPlanner.js`: mapeia estagio FSRS do tema-pai -> modalidade de revisao (D1 brain dump, D4 illness recall, D7 mini caso, D21 SCT+conduta, manutencao caso rapido). Inclui `clinicalCaseMatch` (caso <-> tema-pai).

**P4-C — `FocusMode` multimodal**
- Estender `FocusMode.jsx` para renderizar a modalidade vinda do `reviewTaskPlanner` quando o tema for clinico e `plat === "res"`. Brain dump estruturado em 5 campos. Reusar gate de plataforma.

**P4-D — Raciocinio Clinico com conduta/prescricao simulada**
- Adicionar fase de conduta/prescricao em `RaciocinioClinico.jsx` (campos do roadmap: estabilizacao, exames, tratamento, doses quando houver checklist, internacao/ambulatorio, red flags, contraindicacoes, seguimento) com aviso obrigatorio "Uso educacional. Nao aplicar em paciente real."
- (Opcional, fora do core de codigo) ampliar `casosClinicos.js` para reduzir R10 — tratar como conteudo, nao bloqueia o codigo.

---

## 4. Arquivos a tocar por fase

| Fase | Criar | Editar | So leitura/refs |
|---|---|---|---|
| P2-A | `src/core/metricsRegistry.js`, `src/core/metricsRegistry.test.js` | — | `readiness.js`, `useMetrics.js`, `errorTaxonomy.js`, `calibration.js` |
| P2-B | `src/components/MetricCard.jsx`*, `src/components/StatsSection.jsx`*, `docs/P2_STATS_DECISIONS.md` | `src/components/StatsPanel.jsx` | `Dashboard.jsx` (garantir que nao engorda), `App.js:1145` |
| P3-A | `src/core/errorActionMap.js`, `src/core/errorActionMap.test.js` | `src/core/errorTaxonomy.js` (estender) | `actionInbox.js`, `sessionReflection.js` |
| P3-B | `src/components/ErrorActionCenter.jsx`, `src/components/ErrorActionPrompt.jsx`, `docs/P3_ERROR_ACTION_DECISIONS.md` | `StatsPanel.jsx` (secao Erros), `FocusMode.jsx`/`EnamedProvaAnalyzer.jsx` (CTA pos-sessao/prova), `mentor.js`/`mentorSignals.js` (consumir dominantError) | `store.js:376,405` (ActionInbox) |
| P4-A | `src/core/clinicalReasoningScoring.js`, `.test.js`, `docs/P4_CLINICAL_REASONING_FSRS_DECISIONS.md` | `readiness.js:25`, `RaciocinioClinico.jsx:24`, `illnessScript.js:424` | `store.js:1132` (`registrarCaso`) |
| P4-B | `src/core/reviewTaskPlanner.js`, `.test.js` | — | `fsrs.js`, `illnessScript.js`, `casosClinicos.js` |
| P4-C | — | `src/components/FocusMode.jsx` | `platformFeatures.js`, `reviewTaskPlanner.js` |
| P4-D | — | `src/components/RaciocinioClinico.jsx` | `casosClinicos.js`, `SessionClosureModal.jsx` |

`*` criar so se ajudar; o roadmap marca `MetricCard`/`StatsSection` como opcionais.

---

## 5. Testes necessarios

**P2 (`metricsRegistry.test.js`):**
- `getMetricDefinition` existe para todas as metricas obrigatorias.
- `trueRetention` -> `collecting` sem `n` suficiente; `low_confidence` com `n` baixo.
- `getMetricsForSection("...", "vest")` nao retorna `enamedGap` nem `clinicalReasoningScore`.
- `clinicalReasoningScore` so em `res`.
- `getMetricsForSection` devolve as secoes corretas.
- `formatMetricValue` nao quebra com `null`.
- Smoke de `StatsPanel` (se houver) atualizado para as 7 secoes.

**P3 (`errorActionMap.test.js`):**
- Todos os 12 tipos tem acao corretiva mapeada.
- Tipos legados (`lacuna, nao_visto, distractor, descuido`) normalizam para o canonico antes de mapear.
- Acao gerada e compativel com `actionInbox.createAction` (campos `type/target/priority`) e nao colide no `dedupeActions`.
- `dominantError` integrado ao Mentor produz a acao esperada (teste de signal).

**P4:**
- `clinicalReasoningScoring.test.js`: um unico score para o mesmo `casosProgresso`; equivalencia entre os call-sites; retorna `null`/`collecting` com amostra insuficiente (R10).
- `reviewTaskPlanner.test.js`: estagio FSRS -> modalidade correta; `clinicalCaseMatch` liga caso ao tema-pai; nada gerado quando `plat === "vest"`.

**Transversal:** `npm test -- --watchAll=false`, `npm run check:mojibake`, `npm run build` verdes ao fim de cada sub-bloco.

---

## 6. Criterios de aceite

Herdados do roadmap (secao 4 global + secao 15 do registry), tornados verificaveis:

- [ ] Stats dividido em 7 secoes nomeadas; cada metrica do Resumo tem valor + confianca + explicacao + acao.
- [ ] `metricsRegistry` existe com testes verdes.
- [ ] Dashboard nao ganhou cards novos e nao tem dependencia circular com Stats.
- [ ] ENAMED nao aparece em `vest`; Raciocinio Clinico nao aparece em `vest`.
- [ ] DataSafety/LaunchChecklist nao poluem a secao Aprendizagem (estao em Sistema).
- [ ] Centro de Erros aparece em Stats/Mais/pos-sessao/pos-simulado/Mentor — nao como aba solta.
- [ ] Erro vira acao corretiva e o Mentor usa o erro dominante (signal novo verificavel).
- [ ] `calcRaciocinioScore` tem fonte unica; os 3 call-sites convergem para o mesmo valor.
- [ ] Raciocinio Clinico entra no FSRS via `reviewTaskPlanner` quando apropriado (so `res`).
- [ ] Conduta/prescricao simulada exibe o aviso "Uso educacional. Nao aplicar em paciente real."
- [ ] `check:mojibake`, testes e build passam em cada sub-bloco.

---

## 7. O que NAO implementar agora

- **Activity Log / calendario historico completo** — fica pos-Bloco N (roadmap secao 0 e registry secao 8).
- **Bloco N (multiusuario/isolamento de dados)** — nao criar novas chaves persistidas; reusar as existentes (R9).
- **Refactor profundo do Mentor** — em P3 apenas adicionar consumo de `dominantError`, sem reescrever a politica de decisao.
- **Firebase/auth/localStorage novos** — fora de escopo.
- **Bibliotecas novas** — proibido instalar libs.
- **Reescrever `errorTaxonomy.js` do zero** — apenas estender (preservar `LEGACY_ERROR_MAP` para nao perder dados antigos).
- **Tudo de uma vez** — respeitar a sequencia P2-A -> P2-B -> P3-A -> P3-B -> P4-A -> P4-B -> P4-C -> P4-D.
- **Commit / push / deploy** — nenhum, nesta auditoria nem implicitamente nas fases (responsabilidade do operador humano).
- **Expandir massa de casos clinicos** como bloqueio de codigo — e tarefa de conteudo; o codigo deve degradar bem com poucos casos (R10).

---

## Apendice — evidencias (file:line)

- Stats sem secoes / coletando hardcoded: `src/components/StatsPanel.jsx:241,290,501,548`.
- 3 taxonomias de erro: `src/core/errorTaxonomy.js:1`, `src/core/readiness.js:181`, `src/core/sessionReflection.js:22`.
- Normalizador legado reusavel: `src/core/errorTaxonomy.js:23`.
- Mentor sem consumo de erro dominante: `git grep dominantError|erroDominante` em mentor* / Dashboard = vazio.
- Loop pos-sessao existente: `src/core/sessionReflection.js:90`, `src/core/store.js:376,405`.
- `calcRaciocinioScore` triplicado: `src/components/RaciocinioClinico.jsx:24`, `src/core/readiness.js:25`, `src/core/illnessScript.js:424`.
- `notaCaso` nunca gravado por `registrarCaso`: `src/components/RaciocinioClinico.jsx:93-131` vs `src/core/illnessScript.js:424`.
- 2 casos clinicos: `src/constants/casosClinicos.js` (`apendicite-classica`, `pre-eclampsia-grave`).
- Brain dump generico ja existente: `src/components/FocusMode.jsx:1168` (`stepKey === "d1"`).
- Gate de plataforma: `src/core/platformFeatures.js:6`, `src/App.js:1156`, `src/components/BottomNav.jsx:56`, `src/core/readiness.js:97`.
</content>
</invoke>
