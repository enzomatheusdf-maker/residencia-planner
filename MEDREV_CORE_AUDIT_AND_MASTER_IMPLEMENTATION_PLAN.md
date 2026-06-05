# MEDREV — AUDITORIA DE NÚCLEO E PLANO MESTRE DE IMPLEMENTAÇÃO

> Auditoria baseada em leitura direta do código-fonte (`Bro/src`, ~40.800 linhas, 49 arquivos de teste), dos documentos de contexto (`MEDREV_CONTEXT_FOR_AI.md`, `COPY_GUIDE_PT_BR.md`, roadmaps) e de pesquisa de evidência em ciência da aprendizagem e do cenário competitivo brasileiro (junho/2026).
> Nada foi implementado. Nenhum código foi alterado. Este documento é diagnóstico e projeto.

---

## 1. Resumo executivo

O MedRev **não é** um protótipo. É um sistema maduro, com uma camada de lógica (`core/`) genuinamente bem arquitetada: fontes canônicas únicas de verdade (`metricsRegistry`, `errorTaxonomy`, `errorActionMap`, `clinicalReasoningScoring`, `domainValidation`, `reviewTaskPlanner`, `mentorDecisionPolicy`), funções puras testáveis e 49 arquivos de teste. A disciplina de "não criar taxonomia/score paralelo" prescrita no `MEDREV_CONTEXT_FOR_AI.md` foi, em grande parte, respeitada dentro de `core/`.

Os três "bugs críticos" históricos foram, na prática, **resolvidos ou muito atenuados**:

- **Teto de intervalo** — `maintenanceInterval()` agora cresce livremente pelo S real via `fsrsRawInterval()`, com piso de 15 dias e teto configurável (`meta.intervaloMaxDias = 180`). Não há mais "manutenção remarcando +5d".
- **Auto-100% sem input** — o D1 (Brain Dump) deriva o acerto dos campos auto-reportados como esquecidos (`d1ForgotFields` em `FocusMode.jsx`: 0 esquecidos → 1.0; 1 → 0.85; 2 → 0.65; 3+ → 0.40).
- **Persistência só em localStorage** — há isolamento por `uid` (`userScope`, `authSession`), `localStorage` escopado, sync com Firebase com debounce e flush em `beforeunload`, e exportação de backup.

Portanto, **o problema do MedRev hoje não é falta de feature nem bug grave**. É **entropia de integração**: o produto cresceu por blocos (há 33 documentos `.md` de planejamento na raiz, dois "engines de mentor" coexistindo, três superfícies de diagnóstico, dois wizards de onboarding) e o risco real é o que o próprio `MEDREV_CONTEXT_FOR_AI.md` já antecipou: **confusão, redundância e métrica/decisão sem fonte única**.

A pergunta-guia — *"o produto funciona como um único organismo?"* — tem hoje uma resposta honesta: **funciona como dois organismos parcialmente sobrepostos disputando o mesmo corpo.** A prioridade do plano mestre é unificar o "núcleo de decisão" e podar o legado, antes de adicionar qualquer motor novo.

---

## 2. O que está excelente (preservar e proteger)

1. **Camada `core/` com fonte única de verdade.** `metricsRegistry.js` governa toda métrica (label, descrição, estado-vazio, regra de confiança, ação quando ruim, threshold, plataforma). `errorTaxonomy.js` + `errorActionMap.js` formam um pipeline erro→ação clinicamente fundamentado e sem enum paralelo. `clinicalReasoningScoring.js` e `domainValidation.js` são canônicos. Isso é raro e valioso.

2. **Política de relapso FSRS (G1–G4) genuinamente sofisticada.** `recalcAfterMark()` + `resolveAgainPolicy()` tratam lapso de tema maduro (D21/manutenção < 60%) como *again*, relapsando para D0/D1 com **estabilidade semeada** (`relapseSeedStability`: herda 30–45% do S antigo em vez de resetar para `S_BASE`). Isso está alinhado com a filosofia real do FSRS ("lapso reduz S, não zera") e é melhor do que o SM-2 do Anki.

3. **Integração ciência↔produto na retenção por área.** `getRetencaoArea()` usa `MACRO_PESO_ENAMED` para subir a retenção desejada em áreas de maior incidência (até 0,92). É personalização baseada em blueprint de prova — exatamente o tipo de decisão que diferencia o produto.

4. **Mentor de decisão (`mentorDecisionPolicy.decideMentorAction`) explicável e ordenado.** Cascata de prioridade (warning de dados → sobrecarga → relearning → vencidas → fila do dia → análise de simulado → erro dominante → gargalo ENAMED → caso clínico → tema novo → descanso) que segue quase à risca a "ordem de decisão recomendada" do contexto, com contrato de ação completo (`id/type/priority/title/subtitle/reason/explain/cta/ctaView/estimatedMinutes/confidence/safety/target`).

5. **Progressão clínica multimodal mapeada ao FSRS.** `reviewTaskPlanner.js`: D1→Brain Dump, D4→Illness Recall, D21→Mini-caso, manutenção→SCT+conduta. É a operacionalização correta de illness scripts e Script Concordance Test dentro do ciclo de revisão.

6. **Separação de plataforma (res/vest) disciplinada.** `platformFeatures`, `navigationModel` (com `onlyPlat`, `requiresFeature`) e `ERROR_TYPE_PLATFORMS` impedem vazamento de medicina para o Vestibular (`conduta_prescricao` é `["res"]`).

7. **Cultura de teste e funções puras.** Boa parte de `core/` não importa React nem Zustand e é testada isoladamente. Isso torna o sistema auditável e refatorável com baixo risco.

---

## 3. Os 10 maiores gargalos

| # | Gargalo | Evidência no código | Impacto |
|---|---------|---------------------|---------|
| 1 | **Dois motores de "próxima ação"** | `store.buildActionCandidatesFromState` (+`actionInbox`/`buildActionInbox`) **e** `mentorDecisionPolicy.decideMentorAction`. Ambos derivam vencidas/pendentes/clínico/tema-novo de sinais parecidos; ambos aparecem no Dashboard. | Podem discordar. Duas lógicas de prioridade para manter. É o risco que o próprio contexto já alertou ("ActionInbox não deve competir com o Comando do Mentor"). |
| 2 | **Três superfícies de diagnóstico** | `metricsRegistry` (canônica, no Stats) **vs** `getMentorDiagnosis` (legado, ~300 linhas em `mentor.js`, ainda usado em Dashboard+Stats) **vs** `decideMentorAction`. | Verdade paralela. `getMentorDiagnosis` é narrativa legada que pode contradizer a métrica canônica. |
| 3 | **FSRS-Lite com parâmetros fixos** | `fsrs.js`: `FSRS_DECAY=-0.5`, `S_BASE` fixo, `updateStability/updateDifficulty` com constantes hard-coded. Não usa `reviewHistory` (que é rico) para reotimizar nada. A fase de aprendizado (D0→D21) é, na prática, **ladder fixo** (`nextInterval` clampa em `±15%` do offset). | O FSRS só "morde" de fato na manutenção. A promessa de "repetição espaçada adaptativa" é parcial. Dados ricos coletados e não explorados. |
| 4 | **God-components** | `Modals.jsx` 2.712, `Dashboard.jsx` 2.634, `FocusMode.jsx` 1.822, `StatsPanel.jsx` 1.574 linhas. | Manutenção difícil, re-render caro, dois "produtos" (simples/completo) dentro do mesmo arquivo via `!modoSimples &&`. |
| 5 | **`App.js` como orquestrador-deus** | 1.418 linhas: auth + sync Firebase + hidratação + merge remoto + gamificação + conquistas + analytics + roteamento. `handleFocusModeCompleteStep` sozinho tem ~250 linhas misturando markStep, stats, XP, badges, frases do mentor e tracking. | Acoplamento alto; regressões fáceis; lógica de negócio presa na UI raiz. |
| 6 | **Proliferação de flags de modo** | `focusMode`, `modoSimples`, `mentorMode`, `modoProva`, `meta.peakModePhase`, `vestibularStart.planMode`, `meta.onboarding`. `modoSimples` ≈ `mentorMode` e são acoplados em `App.handleOnboardingFinish`. | Estados sobrepostos e ambíguos; difícil raciocinar sobre "em que modo o usuário está". |
| 7 | **Sprawl de onboarding** | `onboarding.js` + `onboardingEngine.js` + `onboardingGate.js` + `vestibularOnboarding.js` + `OnboardingWizard.jsx` (v1) + `OnboardingWizardV2.jsx`. v1 e v2 **ambos** plugados em `App.js` via gates. | Dois fluxos de primeira-impressão vivos. Caminho de ativação confuso de manter. |
| 8 | **Dado de domínio dentro do motor** | A lista `MEDCOF` (26 blocos, centenas de tópicos) está **dentro de `fsrs.js`**. | Acopla dado estático ao algoritmo; infla o arquivo central; viola separação dado/lógica. |
| 9 | **Módulos órfãos/legados** | `mentorAuditReadiness.js` não é importado por ninguém (só pelo próprio teste). `proximaAcao` em `mentor.js` está morto. `mentor.js` tem 42 KB misturando vivo (`getMentorPhrase`, `getMentorDiagnosis`, `isExhaustionDetected`) e morto. | Peso morto, confusão de "qual mentor é o de verdade". |
| 10 | **Resolução de conflito last-write-wins + IDs frágeis** | `App.js` decide sync por comparação de `updatedAt`; `store.merge()` é complexo; IDs são `Date.now()` / `Date.now()+Math.random()` (float). | Risco de merge silencioso e colisão de ID em uso multi-dispositivo. O multiusuário existe, mas a reconciliação é a parte frágil. |

---

## 4. Problemas de integração ("o organismo único")

- **Dois engines de decisão (Gargalo 1).** É o problema de integração número um. A "fila inteligente" (`useFilaInteligente`), o `actionInbox` derivado no store e o `decideMentorAction` do mentor v2 são três cálculos de "o que importa agora" que não compartilham um único núcleo. O Dashboard renderiza o Comando do Mentor (v2) **e** `<ActionInbox>` lado a lado (`Dashboard.jsx` linha ~1758), exatamente o que o contexto pediu para evitar.

- **Acoplamento por string-matching.** `store.addSim` e `addQuestaoErrada` criam temas automaticamente comparando `t.nome.toLowerCase() === subtopico.toLowerCase()`. `reviewTaskPlanner.findClinicalCaseForTema` casa caso↔tema por substring de nome/área. Um typo ou variação de grafia gera tema duplicado ou perde o casamento de caso. É integração "por convenção textual", não por chave estável.

- **Inversão de camadas.** `core/mentorSignals.js` importa `calcTrueRetentionDetailed` de `hooks/useMetrics.js`. Núcleo dependendo de hook (camada de UI) é inversão de dependência — quebra a pureza que o resto de `core/` mantém.

- **Efeitos colaterais escondidos em setters do store.** `finalizarValidacaoDominioPrevio` (Já domino) chama `rebuildActionInboxForToday()` e semeia `casosProgresso` (re-encontro clínico) dentro do mesmo fluxo; `markStep` semeia caso clínico em relapso maduro. A lógica é boa, mas está enterrada em mutações de estado, difícil de testar e de prever.

- **Métrica definida mas não computada.** `enamedGap` existe em `metricsRegistry` mas é passado como `null` fixo em `StatsPanel.jsx` (`evaluateMetric("enamedGap", null, ...)`). Promessa de UI sem motor por trás.

---

## 5. Problemas de UX

- **Duas superfícies de "o que fazer".** Comando do Mentor + ActionInbox competem por atenção na tela Hoje. Para o aluno ansioso (a persona principal), duas recomendações principais é exatamente o ruído que o produto promete eliminar.

- **Dois produtos em um arquivo.** O `modoSimples` esconde/mostra grandes blocos via `!modoSimples &&` dentro do `Dashboard.jsx` (2.634 linhas). O "Modo Mentor/Simples" é a decisão de UX mais importante do app e está implementada como condicional espalhada, não como duas experiências desenhadas.

- **Tiles mortos na aba Mais.** `MoreToolsHub` (em `App.js`) mostra "Blocos planejados" (Conquistas/Pomodoro/Políticas) como cards **não funcionais**. Mostrar o que ainda não existe gera ruído e quebra confiança.

- **Vazamento de jargão e acentuação inconsistente.** O `COPY_GUIDE_PT_BR.md` existe justamente porque termos crus (FSRS, Relearning, True Retention, Bleeding Score) vazam. Há `npm run check:mojibake`, mas muitas strings visíveis em `core/` ainda estão sem acento ("revisoes", "Raciocinio", "Acao corretiva", "Padrao" em `mentorDecisionPolicy.js`; rótulos em `metricsRegistry.js` como "Retencao longa"). Se essas strings chegam à UI, ferem o glossário.

- **`getMentorPhrase` motivacional como toast.** Frases do mentor disparam por `setTimeout` em vários pontos de `handleFocusModeCompleteStep`. Bom para reforço, mas há risco de empilhamento de toasts e de o "mentor" parecer frase de motivação (o contexto pede o oposto: mentor = decisão, não frase).

---

## 6. Problemas de arquitetura

- **God-components + God-orchestrator** (Gargalos 4 e 5): a lógica de negócio mora na UI raiz. Extrair `handleFocusModeCompleteStep`, os efeitos de sync/hidratação e a gamificação para hooks/serviços dedicados é a maior alavanca de manutenibilidade.

- **Dado no motor** (Gargalo 8): `MEDCOF` deveria estar em `constants/`, não em `fsrs.js`.

- **Persistência: merge complexo + last-write-wins** (Gargalo 10): `store.merge()` faz migrações inline (ex.: `dataProva "2026-10-25" → "2026-09-13"`, fusão de `d14`→`d21`). Funciona, mas é o ponto mais arriscado para corrupção silenciosa em sync concorrente. Falta um número de versão de schema explícito e migrações nomeadas.

- **Higiene de repositório.** Estão versionados: `.import-medrev` (624 KB), `.restore-bro10` (1,4 MB), `build/` (8,4 MB) e **33 documentos `.md` de planejamento na raiz**. O `.gitignore` existe, mas esses artefatos escaparam. Isso polui o repositório, infla diffs e confunde qualquer IA/colaborador sobre "qual é o código de verdade".

- **Inversão de camada hooks↔core** (Seção 4).

---

## 7. Problemas pedagógicos

- **Espaçamento adaptativo é parcial.** Pré-D21, o intervalo é ladder fixo (`nextInterval` clampa em ±15% do offset). A literatura de *desirable difficulties* (Bjork) e de FSRS sugere que o ganho vem de ajustar o intervalo ao S/D **individuais**; hoje o S/D mal afeta o agendamento até a manutenção.

- **Sem otimização por usuário.** O FSRS canônico moderno (v6/v7) usa parâmetros **treináveis no log do próprio usuário**, com benchmarks de ~20–30% menos revisões para a mesma retenção. O MedRev usa parâmetros fixos e **já guarda o `reviewHistory` necessário** para treinar — mas não treina.

- **Loop de calibração incompleto.** O app captura `confianca`, `previsao` (previsão de acerto), `ansiedade`, `cansaco`, `foco` no `markStep`, e tem o tipo de erro `confianca_mal_calibrada`. Mas não transforma isso em **score/curva de calibração** (confiança × acerto real). A metacognição (Self-Regulated Learning) está coletada e subutilizada.

- **"Interleaved" é rótulo, não motor.** O D21 se chama "Interleaved" (`STEPS`), mas não há scheduler que misture áreas/temas intencionalmente. Interleaving (Rohrer & Taylor) é um dos ganhos mais baratos e está só nominalmente presente.

- **Sem modelo de maestria por subtópico.** A "prontidão" (`readiness.js`) é heurística. Não há estimativa latente de domínio por área/subtópico (estilo Bayesian Knowledge Tracing), apesar de o app ter as observações (acertos por step, por simulado, por área) para isso.

- **Descasamento com a métrica real da prova (TRI).** Confirmado em junho/2026: o ENARE 2026/2027 classifica Acesso Direto pela **nota TRI do ENAMED** (Teoria de Resposta ao Item), não pela contagem bruta de acertos. O "Preparo estimado" e o `readiness` pensam em **% de acerto**, que não modela dificuldade/discriminação de item. A noção de "preparo" do MedRev precisa, no mínimo, sinalizar que a prova-alvo é pontuada por TRI.

- **Integridade do Brain Dump.** O portão de conclusão do D1 é "≥ 10 caracteres" somados (`FocusMode.jsx`), e o `acerto` só cai se o aluno marcar campos como esquecidos. É sistema de honra com porta fraca; e o bloco de XP em `App.js` ainda trata D1 como `acerto = 1.0` para atribuição de XP, divergindo do `acerto` que vai para o FSRS.

---

## 8. Motores que faltam (resumo; detalhe no Documento 2)

1. **Modelo de memória por usuário** — FSRS canônico treinado no `reviewHistory` (substituir o FSRS-Lite fixo).
2. **Modelo de maestria (Student Model)** — domínio latente por área/subtópico (BKT-like), alimentando readiness e mentor.
3. **Motor de calibração** — confiança × acerto → feedback metacognitivo e ajuste de risco.
4. **Forecast preditivo de prontidão** — projeção até a data da prova, ciente de TRI e de incidência ENAMED.
5. **Scheduler de interleaving real** — mistura intencional de áreas no D21+ e em blocos de questões.
6. **Núcleo único de decisão** — substituindo os dois engines de "próxima ação".
7. **Grafo de conhecimento / pré-requisitos** sobre os subtópicos ENAMED (os concorrentes já falam em "600 subtemas").

---

## 9. O que remover

- `mentorAuditReadiness.js` (órfão) — confirmar com `git grep` e remover.
- `proximaAcao` em `mentor.js` (morto) — remover; a próxima ação é do `mentorDecisionPolicy`.
- `.import-medrev/`, `.restore-bro10/`, `build/` do versionamento (ajustar `.gitignore`; manter backups fora do repo).
- "Blocos planejados" (tiles não funcionais) do `MoreToolsHub`.
- Um dos dois wizards de onboarding (consolidar em V2; aposentar v1).
- A longo prazo: `getMentorDiagnosis` legado, **dobrando** sua função numa "visão narrativa sobre as métricas canônicas" em vez de cálculo paralelo.

> Atenção: o contexto pede **não** criar Activity Log/histórico persistente novo antes do isolamento multiusuário estar 100%. Remoções de dado devem respeitar isso.

---

## 10. O que simplificar

1. **Dois engines → um núcleo de decisão.** Extrair um único `decisionCore` (entrada: estado normalizado; saída: lista priorizada de ações com o contrato atual). Comando do Mentor = `decisions[0]`; ActionInbox = `decisions[1..n]`. Uma fonte, duas vistas.
2. **Três superfícies de diagnóstico → uma.** `metricsRegistry` é a verdade; "diagnóstico do mentor" vira **renderização** dessas métricas, não recálculo.
3. **Flags de modo → uma máquina de estado.** Um único `modoOperacao` (ex.: `mentor` | `manual` | `foco` | `prova`) derivando os booleanos atuais, em vez de 6 flags soltos.
4. **God-components → componentes de feature.** Quebrar Dashboard/Modals/FocusMode/StatsPanel; extrair efeitos de `App.js` para `hooks/` e `services/`.
5. **Dado fora do motor.** `MEDCOF` e correlatos para `constants/`.
6. **Persistência versionada.** `schemaVersion` explícito + migrações nomeadas (substituindo as migrações inline do `merge`).

---

## 11. Roadmap P0 / P1 / P2 / P3

> Princípio do contexto: branch + checkpoint + backup antes; test + build + audit + commit local depois. Escopos pequenos. Sem refactor gigante de uma vez.

### P0 — Verdade única e estabilidade (fundação; não-negociável)
- Unificar o núcleo de decisão (matar a duplicação de lógica de prioridade entre store e mentor).
- Fechar o isolamento multiusuário e o gate de Activity Log (pré-requisito do contexto).
- Versionar schema de estado + migrações nomeadas; sinal de schema no backup.
- Higiene de repositório (remover `build/`, dirs duplicados, organizar `docs/`).
- Remover órfãos/mortos (`mentorAuditReadiness`, `proximaAcao`).
- Passada de acentuação/jargão nas strings visíveis de `core/` (alinhar ao `COPY_GUIDE`).
- Flag de "prova pontuada por TRI" no perfil/onboarding (não muda cálculo ainda; muda copy e expectativa).

### P1 — Mentor de verdade (memória individual + clareza)
- Adotar FSRS canônico (`ts-fsrs`) no front e o otimizador sobre o `reviewHistory` do usuário (gradual, atrás de flag, comparando contra o FSRS-Lite).
- Motor de calibração (confiança × acerto) → score + ação corretiva ligada ao `confianca_mal_calibrada`.
- Colapsar flags de modo numa máquina de estado.
- Quebrar `Dashboard.jsx` e extrair efeitos de `App.js`.

### P2 — Student Model (o app começa a "conhecer" o aluno)
- Maestria latente por área/subtópico (BKT-like), alimentando `readiness` e o mentor.
- Forecast preditivo de prontidão até a data da prova, ciente de incidência ENAMED.
- Scheduler de interleaving real.
- Loop erro→ação reforçado (uma única passagem erro→ação→revisão→reagendamento, sem string-matching frágil; usar IDs estáveis).

### P3 — Digital Twin e vantagem competitiva
- Ingestão bank-agnostic (importar resultados de Q-bank/Anki/simulados externos como sinais).
- Grafo de conhecimento/pré-requisitos sobre os subtópicos.
- Planejamento "what-if" (simular cenários de plano até a prova).

---

## 12. Blocos implementáveis para modelos menores

> O repositório já usa a convenção `MEDREV_BLOCO_*`. Mantenha-a: 1 bloco = escopo pequeno, arquivos permitidos explícitos, arquivos proibidos, testes que provam, sem refactor global. Exemplos de blocos derivados deste plano:

- **BLOCO P0-1 — Decisão única (parte A):** extrair `core/decisionCore.js` puro que recebe `mentorContext` e devolve `decisions[]` ordenadas. *Tocar:* novo arquivo + teste. *Não tocar:* UI. *Prova:* testes de ordenação iguais ao `decideMentorAction` atual.
- **BLOCO P0-2 — Decisão única (parte B):** `mentorDecisionPolicy` e `actionInbox` passam a consumir `decisionCore`. *Prova:* Dashboard mostra Comando = `decisions[0]` e Inbox = `decisions[1..]`, sem discordância.
- **BLOCO P0-3 — Higiene:** ajustar `.gitignore`, remover `build/`/dirs duplicados, mover docs `.md` para `docs/`. *Prova:* `git ls-files` limpo; build ok.
- **BLOCO P0-4 — Órfãos:** remover `mentorAuditReadiness.js` e `proximaAcao`. *Prova:* build + testes passam; `git grep` confirma zero referências.
- **BLOCO P0-5 — Acentos/copy:** varredura de strings visíveis em `core/` contra o glossário. *Prova:* `check:mojibake` + revisão manual de labels.
- **BLOCO P0-6 — Schema versionado:** `schemaVersion` + migrações nomeadas substituindo migrações inline do `merge`. *Prova:* teste de migração de estado antigo→novo.
- **BLOCO P1-1 — FSRS canônico (sombra):** rodar `ts-fsrs` em paralelo ao FSRS-Lite, logar divergências, sem trocar o agendamento. *Prova:* relatório de divergência.
- **BLOCO P1-2 — Calibração:** `core/calibration.js` (já existe arquivo!) computa curva confiança×acerto e expõe métrica em `metricsRegistry`. *Prova:* teste com dados sintéticos.
- **BLOCO P1-3 — Máquina de modo:** `modoOperacao` derivando os flags atuais. *Prova:* testes de transição.
- **BLOCO P2-1 — Maestria por área:** `core/mastery.js` (já existe!) evolui para estimativa latente por subtópico. *Prova:* teste de atualização bayesiana.
- **BLOCO P2-2 — Forecast:** `core/forecast.js` (já existe!) projeta prontidão até `meta.dataProva`. *Prova:* teste de monotonicidade.

> Observação: o código já tem `calibration.js`, `mastery.js`, `forecast.js` — provavelmente embriões dos motores que faltam. Auditar o que cada um já faz antes de criar novo (evitar 4º arquivo paralelo).

---

## 13. O que NÃO fazer

- **Não** virar banco de questões nem competir em volume (MedCof/Medway/Estratégia já ganham nesse eixo). O MedRev perde se entrar nesse jogo.
- **Não** adicionar feature sem responder: para qual persona, qual dor, onde na jornada, qual tarefa cria, qual dado registra, como o Mentor usa, como o Stats usa, qual teste prova.
- **Não** criar Activity Log / histórico persistente novo antes de o isolamento multiusuário estar fechado (Bloco N do contexto).
- **Não** vazar medicina (Illness Script, SCT, conduta, ENAMED) para o Vestibular.
- **Não** criar quarta taxonomia, segundo score, terceiro engine de decisão. A disciplina de fonte única é o ativo do projeto — proteja-a.
- **Não** transformar o "mentor" em chatbot motivacional como núcleo. A vantagem é o **modelo transparente e explicável**, não a conversa.
- **Não** adicionar mais um wizard de onboarding. Consolidar, não somar.
- **Não** otimizar prematuramente a UI antes de unificar o núcleo de decisão (P0) — caso contrário a refatoração visual se faz duas vezes.

---

### Apêndice — Inventário rápido (o que foi lido)
`App.js` (1.418), `core/store.js` (1.460), `core/fsrs.js` (954), `core/mentor.js` (737), `core/mentorSignals.js`, `core/mentorDecisionPolicy.js`, `core/mentorAutopilot.js`, `core/reviewTaskPlanner.js`, `core/navigationModel.js`, `core/metricsRegistry.js`, `core/errorTaxonomy.js`, `core/errorActionMap.js`, `core/domainValidation.js` (parcial), `core/illnessScript.js` (parcial), `core/enamedIntel.js` (parcial), `components/FocusMode.jsx` (trechos D1/brain dump), `components/Dashboard.jsx` (composição mentor+inbox), `components/StatsPanel.jsx` (uso de `metricsRegistry`), `constants/enamedIncidencia.js`, estrutura completa de `src/`, `package.json`, e os documentos de contexto.
