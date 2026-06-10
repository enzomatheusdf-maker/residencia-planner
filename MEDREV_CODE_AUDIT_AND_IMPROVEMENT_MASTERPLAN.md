# MEDREV_CODE_AUDIT_AND_IMPROVEMENT_MASTERPLAN

Data da consolidacao: 2026-06-10

Escopo deste documento: auditoria profunda do MedRev e plano de melhoria executavel em blocos. Este arquivo nao implementa codigo; ele organiza o que deve ser feito depois, em ordem, com contratos fechados para execucao por modelo menor.

Regra operacional: antes de qualquer bloco futuro, preservar UTF-8 sem BOM, nao introduzir mojibake e validar com `npm run check:mojibake`. Para execucao em PowerShell, preferir `npm.cmd` quando `npm.ps1` for bloqueado.

## 1. Resumo executivo

Veredicto: **QUASE PRONTO**. O produto esta apto para beta fechado controlado, mas ainda nao esta pronto para beta publico.

O MedRev ja tem uma base de produto acima da media: FSRS-lite real, sombra canonica de FSRS, agenda que usa revisoes reais em vez de prometer datas irreais, mentor alimentado por sinais reais, taxonomia de erros com mapa de acoes, teste de dominio em WIP bem integrado, regras Firestore isoladas por `uid` e localStorage escopado por usuario autenticado.

O problema nao e falta de motores. O problema e que alguns motores ainda nao conversam nos pontos mais importantes para release: teste de dominio nao afeta agenda/mentor para todas as classificacoes, simulado ainda nao entra como item prescritivo no plano, erro clinico nao alimenta a taxonomia, o bundle carrega casos clinicos gerados cedo demais, e a higiene de sessao ainda deixa margem para vazamento local ou merge remoto indevido.

Os 5 maiores riscos:

| Risco | Gravidade | Evidencia | Impacto |
|---|---:|---|---|
| WIP de Teste de Dominio nao finalizado | P0 | `git status --short` mostra 18 arquivos modificados e 4 untracked; `src/core/domainValidation.js:665`, `src/core/store.js:1059`, `src/components/DomainTestModal.jsx:72` | Release nao auditavel e sem baseline estavel. |
| Higiene de sessao e owner guard incompletos | P0 | `src/core/userScope.js:3`, `src/core/userScope.js:43`, `src/core/userScope.js:49`, `src/services/firebase.js:135`, `src/App.js:472`, `src/App.js:536` | Risco de estado anonimo colidir e risco de merge remoto sem bloqueio explicito por dono. |
| Casos clinicos gerados no bundle principal | P0 | `src/constants/generatedClinicalCases.js:1`, `src/constants/caseInstances.js:4`, `src/constants/illnessScripts.js:4`, `src/constants/casosClinicos.js:5`, `src/components/Dashboard.jsx:37` | Penaliza tempo de carregamento antes de o usuario abrir Raciocinio Clinico. |
| Simulado nao prescreve agenda | P0 | `src/core/simStrategy.js:27`, `src/components/Simulados.jsx:381`, `src/components/Simulados.jsx:385`, `src/core/agendaEngine.js:199`, `src/core/mentorDecisionPolicy.js:187` | Simulado vira analise/grafico, mas nao vira compromisso operacional no plano. |
| Erro clinico nao fecha ciclo corretivo | P0 | `src/core/store.js:1504`, `src/core/store.js:1521`, `src/core/store.js:1534`, `src/core/learningEvent.js:24`, `src/core/learningEvent.js:64` | Mentor nao consegue reagir bem a padroes de erro de raciocinio clinico. |

As 5 melhorias de maior retorno:

| Melhoria | Retorno esperado | Por que vem cedo |
|---|---|---|
| Fechar e commitar o WIP do Teste de Dominio | Baseline auditavel | Sem isso, qualquer release mistura feature incompleta com hotfix. |
| Corrigir logout, anon session e ownerUid guard | Seguranca e confianca | Dados de estudo sao sensiveis e multiusuario exige isolamento consistente. |
| Tirar `generatedClinicalCases.js` do bundle principal | Performance perceptivel | Reduz custo inicial do app sem mudar produto. |
| Fazer simulado entrar no plano e no veto de sobrecarga | Produto mais prescritivo | O usuario quer saber o que fazer, nao so ver graficos. |
| Gravar tipo de erro clinico em `learningEvents` | Mentor mais inteligente | Fecha o ciclo pedagogico: diagnosticar -> corrigir -> reexpor. |

Ordem recomendada para beta: `B0 -> B-SEC-1 -> B-PERF-1 -> B-DT-1 -> B-SIM-1 -> B-ERR-1`. Depois disso, abrir beta fechado ampliado. Beta publico so depois de P1 essencial e validacao de performance.

## 2. Mapa completo de funcoes

| Funcao | Arquivos principais | Como funciona hoje | Problema | Melhoria | Prioridade |
|---|---|---|---|---|---|
| Dashboard / Comando do Dia | `src/components/Dashboard.jsx:661`, `src/components/Dashboard.jsx:1263`, `src/components/Dashboard.jsx:1839` | Primeira tela agrega mentor, KPIs, inbox, cronograma, weekly review, Anki e slots clinicos. | Arquivo monolitico, fila do dia aparece em varios formatos, logica de CTA duplicada. | Reduzir Dashboard para orquestrador visual, mover decisoes para motores e componentes menores. | P1 |
| Cronograma | `src/components/Cronograma.jsx:267`, `src/components/Cronograma.jsx:794`, `src/components/Cronograma.jsx:1221` | Lista temas, status e acoes de estudo; ja chama Teste de Dominio em WIP. | Ainda mistura UI, triagem e fluxo de estudo; precisa consumir classificacoes novas sem atalhos. | Integrar status `rescue_needed` e `fragile_base` ao contrato da agenda. | P0/P1 |
| Agenda | `src/core/agendaEngine.js:2`, `src/core/agendaEngine.js:102`, `src/core/agendaEngine.js:166`, `src/core/agendaEngine.js:199` | Junta revisoes FSRS, D0 planejado, atrasadas e simulados cadastrados. | So trata `treat_as_new` como D0; simulado recomendado por estrategia nao entra automaticamente. | Tornar Domain Test e SimulationStrategy fontes formais de itens de agenda. | P0 |
| FSRS-lite | `src/core/fsrs.js`, `src/core/fsrsCanonicalShadow.js`, `src/core/store.js:1139` | Controla passos D0/D1/D4/D7/D21, atrasos, acertos, lapsos e sombra canonica. | Convive com BKT/mastery sem contrato unico de prioridade. | Manter FSRS-lite como scheduler canonico e expor sinais para mastery/forecast sem duplicar scheduler. | P1/P2 |
| Teste de Dominio | `src/core/domainTest.js:44`, `src/core/domainValidation.js:31`, `src/core/domainValidation.js:665`, `src/components/DomainTestModal.jsx:72` | Classifica dominio previo e reconstruiu `rev` do tema conforme resultado. | WIP nao commitado; agenda ainda promove apenas `treat_as_new`. | Fechar contrato de `rescue_needed` e `fragile_base` para agenda, mentor e UI. | P0 |
| Simulados | `src/components/Simulados.jsx:381`, `src/core/simStrategy.js:27`, `src/core/simStrategy.js:135`, `src/core/simStrategy.js:267` | UI calcula recomendacao, proxima data e protocolo. | Recomendacao fica isolada na tela de simulados. | Gerar item de agenda e sinal para mentor; vetar simulado denso em sobrecarga. | P0 |
| Erros | `src/core/errorTaxonomy.js:128`, `src/core/errorActionMap.js`, `src/core/learningEvent.js:24`, `src/core/mentorSignals.js:113` | Erros de revisao e simulado entram na taxonomia e no mentor quando amostra e forte. | Erros clinicos nao entram no mesmo contrato. | Registrar erro clinico como `errors.motivosErro` e `dominantError`. | P0 |
| Raciocinio Clinico | `src/components/RaciocinioClinico.jsx:195`, `src/components/RaciocinioClinico.jsx:581`, `src/core/clinicalReasoningScoring.js:141`, `src/core/clinicalDrillSelector.js:77` | Usa casos, progresso, learningEvents e scoring de competencia. | Progresso existe, mas a causa do erro ainda nao fecha ciclo corretivo comum. | Adicionar captura de tipo de erro clinico e relearning via action inbox, sem segundo scheduler. | P0/P2 |
| Anki | `src/components/AnkiAudit.jsx:8`, `src/components/AnkiAudit.jsx:145`, `src/components/Dashboard.jsx:1688`, `src/core/navigationModel.js:43` | Registra sessao, adesao e cards oriundos de erros. | Recomendacoes podem aparecer sempre; navegacao tem duplicidade de entrada Anki. | Gate por adesao/recencia e unificacao de navigation model. | P1 |
| Estatisticas | `src/components/StatsPanel.jsx:179`, `src/components/StatsPanel.jsx:570`, `src/components/StatsPanel.jsx:625` | Consolida readiness, raciocinio, erros, retencao, Anki e forecast. | Parte da analise tambem aparece no Dashboard; risco de duplicar interpretacao. | Fazer Stats ser o lugar de diagnostico profundo; Dashboard fica acionavel. | P1 |
| Mentor | `src/core/mentorSignals.js:260`, `src/core/mentorSignals.js:343`, `src/core/mentorDecisionPolicy.js:187`, `src/core/decisionCore.js:125` | Consome sinais reais, monta snapshot e ActionInbox. | Simulado recomendado e erro clinico ainda nao entram como sinais completos; sobrecarga precisa vetar simulado denso. | Centralizar decisoes no DecisionCore e eliminar politica paralela na UI. | P0/P1 |
| Taxonomia | `src/core/errorTaxonomy.js:94`, `src/core/errorTaxonomy.js:128`, `src/core/errorActionMap.js` | Normaliza tipos de erro e sugere acoes corretivas. | Taxonomia nao cobre de forma explicita o payload clinico. | Reusar os mesmos tipos, com mapeamento clinico quando necessario. | P0 |
| Seguranca / sincronizacao | `firestore.rules`, `src/core/userScope.js:3`, `src/services/firebase.js:135`, `src/App.js:472`, `src/App.js:536` | Firestore usa uid e estado local e escopado por usuario autenticado. | Logout nao limpa store local do usuario atual; anon fallback e `"default"`; merge remoto nao rejeita owner divergente antes da aplicacao. | Logout sanitiza chave local, anon usa id por sessao e remote load valida `ownerUid`. | P0 |

## 3. Explicacao detalhada do FSRS

O MedRev usa um FSRS-lite pragmatico: cada tema tem uma malha `rev` com etapas D0, D1, D4, D7, D21 e manutencao. A funcao pedagogica e clara: D0 faz aquisicao e recuperacao inicial; D1 verifica esquecimento precoce; D4 e D7 estabilizam a memoria por recuperacao espaçada; D21 testa retencao longa; manutencao so deve acontecer quando ha evidencia real.

O fluxo ideal de um tema e:

1. D0: preteste, leitura ativa, esqueleto, brain dump e questoes.
2. D1: recuperacao curta, com foco em reconstruir sem reler tudo.
3. D4: consolidacao e interleaving leve.
4. D7: questoes de prova, erro estruturado e Anki quando aplicavel.
5. D21: retencao longa, sinal forte para readiness e mentor.
6. Manutencao: revisoes futuras so com alvo real, atraso real e contexto de desempenho.

Essa arquitetura esta correta porque combina tres efeitos pedagogicos robustos: retrieval practice, spacing effect e interleaving. A plataforma nao deve virar um calendario decorativo; ela deve prescrever o proximo ato de recuperacao com base em memoria, erro e carga cognitiva.

Parametros e sinais atuais:

- FSRS-lite mantem a agenda executavel por etapas e atrasos.
- `learningEvent.js` normaliza eventos, acerto, rating e erros (`src/core/learningEvent.js:5`, `src/core/learningEvent.js:24`, `src/core/learningEvent.js:64`).
- `mentorSignals.js` consome true retention, erro dominante e modo operacional (`src/core/mentorSignals.js:260`, `src/core/mentorSignals.js:343`).
- `mastery.js` estima maestria latente com BKT/PFA-lite (`src/core/mastery.js:38`, `src/core/mastery.js:717`), mas nao deve substituir o scheduler FSRS.
- `forecast.js` ja tem gates de amostra para numero forte (`src/core/forecast.js:651`, `src/core/forecast.js:659`, `src/core/forecast.js:674`).

Lapsos e relearning:

- Quando o aluno erra revisao, o tema nao deve apenas "descer nota"; ele deve gerar um motivo de erro, uma acao corretiva e eventualmente um re-encontro clinico.
- O relearning deve continuar dentro do scheduler existente. Nao criar segundo scheduler clinico.
- Para erro por lacuna, usar revisao dirigida; para raciocinio, usar caso clinico/SCT; para distrator, usar contraste entre diferenciais; para descuido, usar protocolo de execucao; para nao visto, reclassificar cobertura.

"Ja domino" e Teste de Dominio:

- O app ja exige triagem minima para dominio previo, incluindo volume e acerto em `domainValidation.js`.
- `domainTest.js` traz classificacoes `rescue_needed`, `treat_as_new` e `fragile_base` (`src/core/domainTest.js:44`, `src/core/domainTest.js:68`, `src/core/domainTest.js:77`).
- `applyDomainTestToTema` aplica o resultado ao tema (`src/core/domainValidation.js:665`).
- A lacuna e que a agenda ainda so promove `treat_as_new` como D0 (`src/core/agendaEngine.js:102`, `src/core/agendaEngine.js:166`). `rescue_needed` e `fragile_base` precisam virar itens explicitos ou sinais de mentor, nao apenas metadados.

Integracao agenda/mentor:

- O scheduler deve continuar determinando "quando revisar".
- O mentor deve determinar "por que esta acao e a melhor agora".
- O DecisionCore deve ser a ponte unica para ActionInbox, Dashboard e Cronograma.

## 4. Fluxo atual do produto

Fluxo atual resumido:

1. Usuario configura perfil, prova, cronograma e plataforma.
2. Escolhe ou recebe tema no Dashboard/Cronograma.
3. Executa ciclo de estudo no FocusMode.
4. `markStep` grava revisao, acerto, questoes, motivos de erro e eventos (`src/core/store.js:1139`, `src/core/store.js:1236`).
5. Agenda calcula revisoes e atrasos (`src/core/agendaEngine.js:2`).
6. Mentor coleta sinais de carga, erro, simulado, clinical cases e mastery (`src/core/mentorSignals.js:298`, `src/core/mentorSignals.js:343`).
7. DecisionCore gera snapshot e ActionInbox (`src/core/decisionCore.js:125`, `src/core/store.js:565`).
8. Dashboard apresenta acao primaria, inbox, KPIs, cronograma e revisoes semanais (`src/components/Dashboard.jsx:1263`, `src/components/Dashboard.jsx:1839`).
9. Simulados sao registrados e analisados na tela de Simulados, com recomendacao local (`src/components/Simulados.jsx:381`, `src/components/Simulados.jsx:385`).
10. Raciocinio Clinico registra casos e atualiza progresso (`src/components/RaciocinioClinico.jsx:581`, `src/core/store.js:1504`).

Onde o fluxo funciona bem:

- Revisoes e agenda nao sao ficticias.
- Mentor ja usa sinais reais em vez de mensagens soltas.
- Erros de revisao e simulado ja viram sinais quando ha amostra.
- Dashboard ja e uma central de comando funcional.

Onde o fluxo quebra:

- Simulado recomendado nao entra como compromisso de agenda.
- Erro clinico nao alimenta a mesma taxonomia de erro.
- Teste de Dominio classifica bem, mas agenda ainda nao usa todas as classificacoes.
- Bundle clinico e carregado antes de necessidade real.
- Logout e merge remoto precisam ficar a prova de troca de usuario.

## 5. Fluxo ideal

Fluxo ideal do produto: **Planejar -> Executar -> Registrar -> Diagnosticar -> Corrigir -> Revisar -> Medir -> Ajustar**.

| Etapa | Como deveria funcionar | Estado atual | Quebra principal |
|---|---|---|---|
| Planejar | Agenda recebe FSRS, simulado recomendado, teste de dominio e carga operacional. | Agenda recebe FSRS, D0, atrasadas e simulados cadastrados. | Simulado recomendado e `rescue_needed`/`fragile_base` nao viram plano completo. |
| Executar | Usuario faz a acao unica de maior retorno. | Dashboard mostra acao primaria e ActionInbox. | Duplicidade de fila aumenta ruido. |
| Registrar | Todo ato relevante vira `learningEvent`. | Revisoes e algumas sessoes viram eventos. | Casos clinicos ainda nao registram erro clinico padronizado. |
| Diagnosticar | Mentor cruza retencao, erro, simulado, dominio e carga. | Muitos sinais ja existem. | Falta simulado prescritivo e erro clinico. |
| Corrigir | Taxonomia aponta acao corretiva concreta. | Erros de questoes ja fazem isso. | Erro clinico nao entra igual. |
| Revisar | FSRS agenda a recuperacao correta. | Revisoes existem. | Relearning de dominio/clinico precisa contrato explicito. |
| Medir | Stats valida readiness, forecast e mastery com amostra. | Stats e forecast existem. | Falta backtest do forecast contra simulados reais. |
| Ajustar | Plano muda com base no diagnostico. | ActionInbox reconstroi acoes. | Simulado e teste de dominio ainda precisam alterar o plano. |

Justificativa pedagogica: um produto de preparacao para residencia precisa reduzir carga cognitiva extrinseca. O aluno nao deveria interpretar cinco paineis; o sistema deve transformar evidencia em proxima acao defensavel.

## 6. Lacunas de integracao

| Nao conversa com | Evidencia | Consequencia | Bloco |
|---|---|---|---|
| `domainTest` -> `agendaEngine` para `rescue_needed` e `fragile_base` | `src/core/domainTest.js:68`, `src/core/domainTest.js:77`, `src/core/agendaEngine.js:102`, `src/core/agendaEngine.js:166` | O diagnostico existe, mas nem sempre vira acao de agenda. | B-DT-1 |
| `simStrategy` -> `agendaEngine` | `src/core/simStrategy.js:27`, `src/core/agendaEngine.js:199`, `src/components/Simulados.jsx:381` | Proxima data recomendada fica na UI, nao no plano do dia. | B-SIM-1 |
| `simStrategy` -> `mentorDecisionPolicy` em sobrecarga | `src/core/mentorDecisionPolicy.js:187`, `src/core/simStrategy.js:62` | Mentor pode nao vetar simulado denso quando a carga esta alta. | B-SIM-1 |
| `RaciocinioClinico` -> `learningEvent.errors` | `src/components/RaciocinioClinico.jsx:581`, `src/core/store.js:1504`, `src/core/learningEvent.js:24` | Padroes clinicos nao viram acao corretiva robusta. | B-ERR-1 |
| `CASOS_CLINICOS` -> bundle inicial | `src/components/Dashboard.jsx:37`, `src/core/store.js:25`, `src/constants/casosClinicos.js:5` | A tela inicial paga custo de dados clinicos gerados. | B-PERF-1 |
| `logout` -> limpeza local | `src/services/firebase.js:135`, `src/App.js:1121`, `src/core/userScope.js:43` | Troca de usuario pode manter store local do uid anterior. | B-SEC-1 |
| `navigationModel` -> Anki unico | `src/core/navigationModel.js:43`, `src/core/navigationModel.js:62` | Duas entradas conceituais para o mesmo destino. | B-HYG-1 |
| `Dashboard` -> `ActionInbox` | `src/components/Dashboard.jsx:1263`, `src/components/ActionInbox.jsx:25` | CTA pode divergir entre tela e inbox. | B-MENTOR-1 |

## 7. Redundancias a remover

1. Fila tripla no Dashboard: acao primaria, `ActionInbox` e `MiniCronogramaWidget` competem por atencao (`src/components/Dashboard.jsx:1263`, `src/components/Dashboard.jsx:1839`, `src/components/Dashboard.jsx:1843`).
2. Logica de CTA duplicada: `runMentorPrimaryAction` no Dashboard e `resolveActionCTA` na ActionInbox (`src/components/Dashboard.jsx:1263`, `src/components/ActionInbox.jsx:25`).
3. Duas implementacoes de EmptyState: `src/components/EmptyState.jsx:3` e `src/components/ui/EmptyState.jsx:5`.
4. Anki duplicado no navigation model: `src/core/navigationModel.js:43` e `src/core/navigationModel.js:62`.
5. WeeklyReview aparece como componente embutido em mais de uma zona do Dashboard (`src/components/Dashboard.jsx:1859`, `src/components/Dashboard.jsx:2199`).
6. Mini-stats no Dashboard e StatsPanel profundo interpretam dimensoes parecidas (`src/components/StatsPanel.jsx:625`, `src/components/Dashboard.jsx:1688`).
7. Forecast/readiness/mastery convivem sem uma explicacao unica de qual numero manda em qual decisao.
8. Casos clinicos sao consumidos em Dashboard, StatsPanel, Store e Mentor mesmo quando a tela clinica nao esta aberta.
9. Recomendacoes Anki podem continuar aparecendo sem gate claro de adesao/recencia.
10. Topic matching ainda depende de strings em varios pontos, aumentando risco de tema certo virar alvo errado.

## 8. Problemas P0/P1/P2/P3

### P0 - bloqueiam beta publico

| Problema | Evidencia | Correcao |
|---|---|---|
| WIP do Teste de Dominio nao estabilizado | `git status --short`; `src/core/domainTest.js`, `src/components/DomainTestModal.jsx`, `src/core/domainValidation.js:665`, `src/core/store.js:1059` | Fechar testes, validar, commitar baseline ou separar branch. |
| `rescue_needed` e `fragile_base` parcialmente invisiveis para agenda | `src/core/domainTest.js:68`, `src/core/domainTest.js:77`, `src/core/agendaEngine.js:102`, `src/core/agendaEngine.js:166` | Adicionar itens e labels de agenda/mentor para recuperacao dirigida. |
| Logout/anon/ownerUid | `src/core/userScope.js:3`, `src/services/firebase.js:135`, `src/App.js:472` | Limpeza local no logout, anon session unica, bloqueio de merge remoto com owner divergente. |
| Bundle clinico pesado no principal | `src/constants/generatedClinicalCases.js:1`, `src/constants/casosClinicos.js:5`, `src/components/Dashboard.jsx:37` | Criar indice leve e carregar casos completos sob demanda. |
| Simulado nao entra no plano | `src/core/simStrategy.js:27`, `src/components/Simulados.jsx:381`, `src/core/agendaEngine.js:199` | Gerar item recomendado e veto em OVERLOAD. |
| Erro clinico nao entra na taxonomia | `src/core/store.js:1504`, `src/core/learningEvent.js:24`, `src/core/mentorSignals.js:113` | Capturar tipo de erro clinico e gravar em `learningEvent.errors`. |

### P1 - alto retorno depois do P0

| Problema | Evidencia | Correcao |
|---|---|---|
| Dashboard monolitico e redundante | `src/components/Dashboard.jsx:661`, `src/components/Dashboard.jsx:2690` | Extrair zonas e manter Dashboard como shell. |
| CTA duplicado | `src/components/Dashboard.jsx:1263`, `src/components/ActionInbox.jsx:25` | ActionInbox/DecisionCore como fonte unica. |
| Navigation/EmptyState duplicados | `src/core/navigationModel.js:43`, `src/core/navigationModel.js:62`, `src/components/EmptyState.jsx:3`, `src/components/ui/EmptyState.jsx:5` | Unificar componentes e rotas. |
| Topic linking por string | `src/core/mastery.js:502`, `src/core/mentorSignals.js:24` | Criar `topicResolver` fino, sem migrar historico. |
| Simulado sem redistribuicao pos-prova | `src/core/simStrategy.js:147`, `src/core/readiness.js:211` | Transformar fraquezas de area em proximos targets. |

### P2 - robustez, previsao e privacidade

| Problema | Evidencia | Correcao |
|---|---|---|
| Forecast sem backtest continuo | `src/core/forecast.js:475`, `src/core/forecast.js:651` | Comparar previsao com simulado seguinte e registrar erro absoluto. |
| BKT/mastery e FSRS sem contrato explicito | `src/core/mastery.js:38`, `src/core/forecast.js:489` | Definir quem agenda, quem mede dominio e quem projeta readiness. |
| Sync last-write-wins ainda fraco | `src/App.js:472`, `src/App.js:536` | Resolver conflito por campo critico, ou pelo menos registrar diff de owner/timestamp. |
| Texto livre sensivel no Firestore | `src/core/store.js:512`, `src/core/store.js:551` | Minimizar reflexoes e brain dumps ou marcar campos locais. |
| Raciocinio Clinico precisa plano proprio RC-* | `MEDREV_RACIOCINIO_CLINICO_FUNCAO_DEFINITIVA.md` | Executar sem criar scheduler paralelo. |

### P3 - depois de produto estavel

| Problema | Caminho recomendado |
|---|---|
| Otimizador FSRS por usuario | So depois de amostra suficiente; manter shadow canonico. |
| Grafo de pre-requisitos | Comecar como sugestao de dependencia, nao como bloqueio duro. |
| What-if de carga e prova | Usar forecast validado, nao fantasia de nota. |
| Personalizacao de dificuldade | Basear em erro, tempo, confianca e estabilidade, sem reescrever FSRS. |

## 9. Arquitetura recomendada

Recomendacao central: evoluir a arquitetura atual, nao reescrever.

| Motor canonico | Ja existe | Inputs | Outputs | Consumidores | Falta | Risco | Prioridade |
|---|---:|---|---|---|---|---|---|
| StudyEvent | 85% | Revisoes, sessao, simulado, caso, Anki | `learningEvents` normalizados | Stats, Mentor, Mastery, Forecast | Emissores uniformes e `schemaVersion` | Medio | P1 |
| ErrorEvent | 80% | `motivosErro`, `dominantError`, questoes erradas | Taxonomia e acao corretiva | Mentor, Stats, ErrorActionCenter | Erro clinico | Alto | P0 |
| TopicBank | 60% | `temas.json`, catalogos, aliases | Tema canonico, area, alias | Simulado, mastery, mentor, cronograma | `topicResolver` fino | Medio | P1 |
| DailyPlanEngine | 85% | FSRS, scheduledTopics, planSetup, simulados cadastrados | Itens de agenda | Dashboard, Cronograma, ActionInbox | Simulado recomendado e Domain Test completo | Alto | P0 |
| SimulationStrategyEngine | 70% | Data da prova, historico de simulados, cobertura | Fase, frequencia, proxima data | Simulados UI | Agenda e Mentor | Alto | P0 |
| ClinicalReasoningEngine | 70% | Casos, progresso, SCT, learningEvents | Score clinico, drill, relearning | Raciocinio, Stats, Mentor | Tipo de erro clinico e RC-* | Alto | P0/P2 |
| MentorDecisionEngine | 85% | Agenda, carga, erro, trueRetention, mastery, simulado | `decisionSnapshot`, ActionInbox | Dashboard, ActionInbox | Veto simulado, gate Anki, forecast signal | Alto | P0/P1 |
| ReadinessPredictionEngine | 75% | Cobertura, simulados, mastery, ritmo, forecast | Score, banda, confianca | Stats, Dashboard | Backtest e calibracao visivel | Medio | P2 |

Contrato entre motores:

- Agenda decide o proximo compromisso executavel.
- Mentor explica e prioriza.
- Stats mede e diagnostica.
- Forecast projeta com incerteza.
- Mastery estima dominio latente.
- FSRS continua sendo o scheduler canonico de revisao.

## 10. Plano em blocos

### B0 - estabilizar e commitar WIP do Teste de Dominio

Objetivo: transformar o WIP atual em baseline auditavel antes de qualquer nova feature.

Justificativa: release sem working tree limpo nao permite saber se regressao veio do bloco atual ou de WIP anterior.

Arquivos permitidos: arquivos ja alterados do WIP de Domain Test e testes correspondentes; nenhum arquivo novo fora do escopo.

Arquivos proibidos: Firebase, bundle clinico, Dashboard refactor, scripts de encoding.

Contrato tecnico:

- Revisar `domainTest.js`, `domainValidation.js`, `DomainTestModal.jsx`, testes e pontos de chamada.
- Garantir que `treat_as_new`, `rescue_needed` e `fragile_base` tenham contratos testados.
- Nao tentar resolver agenda completa neste bloco, exceto se for necessario para teste quebrado ja existente.

Critérios de aceite:

- `git status` fica limpo depois do commit do WIP.
- Testes de Domain Test passam.
- Nenhum arquivo de build, cache ou coverage versionado.

Testes: `npm test -- --watchAll=false`, `npm run check:mojibake`, `npm run build`.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: misturar estabilizacao com feature nova.

Rollback: revert do commit B0.

Prompt pronto para Gemini Flash: ver secao 11.

### B-SEC-1 - higiene de sessao, anon e ownerUid

Objetivo: impedir colisao de sessao anonima, resquicio local pos-logout e merge remoto de outro dono.

Justificativa: produto de estudo contem dados pessoais, desempenho e reflexoes. A confianca do usuario depende de isolamento previsivel.

Arquivos permitidos: `src/core/userScope.js`, `src/services/firebase.js`, `src/App.js`, testes novos ou existentes relacionados a escopo.

Arquivos proibidos: `src/core/store.js` exceto se teste exigir exposicao minima; componentes visuais nao relacionados; regras Firestore salvo bug comprovado.

Contrato tecnico:

- `ANON_FALLBACK_SESSION` nao pode colidir entre usuarios anonimos na mesma maquina.
- Logout deve limpar a chave local do usuario autenticado atual quando for seguro faze-lo.
- Merge remoto deve rejeitar ou ignorar payload com `ownerUid` divergente do `uid` autenticado.
- Backup/export deve manter `ownerUid` coerente.

Critérios de aceite:

- Trocar usuario nao reidrata store do usuario anterior.
- Payload remoto com outro `ownerUid` nao sobrescreve estado local.
- Testes cobrem anon fallback, logout e remote guard.

Testes: unitarios de `userScope`, teste de merge se existir harness, full test.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: apagar dados locais que o usuario esperava manter offline.

Rollback: revert do bloco; nao migrar historico sem backup.

### B-PERF-1 - indice leve de casos e lazy load do gerado

Objetivo: remover `generatedClinicalCases.js` do bundle principal.

Justificativa: Dashboard nao precisa carregar todos os casos clinicos para mostrar preparo do dia. Performance inicial e parte do produto.

Arquivos permitidos: `src/constants/casosClinicos.js`, `src/constants/caseInstances.js`, `src/constants/illnessScripts.js`, `src/components/RaciocinioClinico.jsx`, `src/core/mentorSignals.js`, `src/core/interleavingPlanner.js`, `src/components/Dashboard.jsx`, `src/components/StatsPanel.jsx`, testes.

Arquivos proibidos: conteudo dos casos gerados, algoritmos FSRS, Domain Test.

Contrato tecnico:

- Criar indice leve com `id`, `scriptId`, `tema`, `area`, `title` e metadados minimos.
- Carregar casos completos apenas na tela/fluxo clinico ou quando acao clinica for executada.
- Dashboard e StatsPanel devem usar agregados/progresso sem importar o gerado completo.
- Mentor pode usar indice leve para rotulo, mas nao precisa payload completo.

Critérios de aceite:

- `rg -n "generatedClinicalCases" src/components src/core` nao mostra import indireto no caminho principal.
- Raciocinio Clinico continua abrindo casos completos.
- Build gera chunk clinico separado ou ao menos reduz import estatico do principal.

Testes: smoke de Raciocinio Clinico, StatsPanel, Dashboard, build.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: quebrar referencias de caso em progresso antigo.

Rollback: reverter imports para `CASOS_CLINICOS` completo.

### B-DT-1 - rescue/fragile na agenda e mentor

Objetivo: fazer as classificacoes do Teste de Dominio virarem acao operacional.

Justificativa: triagem diagnostica so tem valor se muda a proxima acao. `fragile_base` e `rescue_needed` pedem recuperacao dirigida, nao plano generico.

Arquivos permitidos: `src/core/agendaEngine.js`, `src/core/mentorSignals.js`, `src/core/mentorDecisionPolicy.js`, `src/core/planExecution.js`, componentes de label de agenda, testes.

Arquivos proibidos: `DomainTestModal.jsx` salvo label minimo, bundle clinico, Firebase.

Contrato tecnico:

- `treat_as_new`: continua entrando como D0.
- `rescue_needed`: gera revisao dirigida ou questoes corretivas antes de avancar.
- `fragile_base`: gera consolidacao conceitual curta antes de D1/D4.
- Mentor deve explicar a classificacao e a conduta.
- PlanExecution deve saber executar labels e targets novos.

Critérios de aceite:

- Testes de agenda cobrem as tres classificacoes.
- ActionInbox escolhe recuperacao quando essa for a maior prioridade.
- UI nao mostra status cru tecnico para usuario final.

Testes: `agendaEngine.test.js`, `mentorSignals.test.js`, `mentorDecisionPolicy.test.js`, `planExecution.test.js`.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: criar excesso de tarefas e inflar fila.

Rollback: feature flag local para ignorar classificacoes nao-D0.

### B-SIM-1 - simulado entra no plano e veto OVERLOAD

Objetivo: transformar recomendacao de simulado em item prescritivo de agenda/mentor.

Justificativa: progress testing calibra desempenho e metacognicao, mas simulado denso tambem consome energia. O sistema deve recomendar e vetar conforme fase e carga.

Arquivos permitidos: `src/core/simStrategy.js`, `src/core/agendaEngine.js`, `src/core/mentorSignals.js`, `src/core/mentorDecisionPolicy.js`, `src/core/planExecution.js`, `src/components/Simulados.jsx`, testes.

Arquivos proibidos: Dashboard refactor amplo, Raciocinio Clinico, store migrations.

Contrato tecnico:

- `getSimRecommendation` deve poder retornar item de plano sem depender da UI.
- Agenda deve incluir "simulado recomendado" quando houver data/fase e nao houver veto.
- Mentor deve vetar simulado denso em `OPERATIONAL_MODE.OVERLOAD`.
- Simulado vencido ou pendente deve ter CTA claro.

Critérios de aceite:

- Sem simulado inicial e prova configurada, plano sugere baseline quando fase permite.
- Em sobrecarga, mentor prioriza revisao/descanso e nao simulado denso.
- Simulado recomendado aparece uma vez, deduplicado.

Testes: simStrategy, agendaEngine, mentorDecisionPolicy, ActionInbox.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: prescrever simulados demais.

Rollback: manter recomendacao apenas na tela de Simulados.

### B-ERR-1 - tipo de erro em casos clinicos

Objetivo: fazer erro clinico alimentar `learningEvent.errors` e mentor.

Justificativa: raciocinio clinico melhora com feedback direcionado: geracao de hipoteses, discriminacao de sinais, priorizacao de conduta e reflexao metacognitiva.

Arquivos permitidos: `src/components/RaciocinioClinico.jsx`, `src/core/store.js`, `src/core/learningEvent.js` se precisar de schemaVersion, `src/core/errorTaxonomy.js`, `src/core/clinicalDrillSelector.js`, testes.

Arquivos proibidos: novo scheduler clinico, reescrita dos casos, Dashboard refactor.

Contrato tecnico:

- Registrar `errors.motivosErro` e `errors.dominantError` para caso clinico.
- Mapear erro clinico para taxonomia existente quando possivel.
- `clinicalDrillSelector` deve usar erro recente para escolher drill.
- Mentor deve reconhecer erro clinico forte apenas com amostra suficiente.

Critérios de aceite:

- Caso clinico errado gera learningEvent com erro.
- Stats/Mentor conseguem enxergar padrao clinico.
- Sem erro selecionado, evento continua compatível.

Testes: store registrarCaso, learningEvent, clinicalDrillSelector, mentorSignals.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: UX obrigar classificacao demais e aumentar friccao.

Rollback: tornar tipo de erro opcional e manter scoring anterior.

### B-HYG-1 - higiene de estado e redundancias pequenas

Objetivo: remover persistencias mortas e duplicidades pequenas antes de refatorar UI.

Justificativa: limpar estado reduz bugs de sincronizacao e evita que o Dashboard carregue decisoes obsoletas.

Arquivos permitidos: `src/core/store.js`, `src/core/navigationModel.js`, `src/components/EmptyState.jsx`, `src/components/ui/EmptyState.jsx`, testes.

Arquivos proibidos: mudar design do Dashboard, alterar FSRS.

Contrato tecnico: remover `proximaAcao` morto se existir, avaliar `decisionSnapshot` fora do partialize se for recalculavel, unificar EmptyState e Anki no navigation model.

Critérios de aceite: nenhuma rota quebrada, testes de navegacao passam, estado persistido migra sem perda.

Testes: navigationModel, ui smoke, store hydration.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: quebrar snapshot usado pelo Dashboard offline.

Rollback: restaurar campos persistidos.

### B-TOPIC-1 - topicResolver fino

Objetivo: reduzir matching textual fragil entre simulado, casos e temas.

Justificativa: acoes corretivas so fazem sentido se apontam para o tema certo.

Arquivos permitidos: novo `src/core/topicResolver.js`, testes, pontos de consumo em simulado/mentor/mastery.

Arquivos proibidos: migracao de historico, renomear ids de temas.

Contrato tecnico: resolver por id quando houver, alias normalizado quando nao houver, e retornar confianca.

Critérios de aceite: matching antigo continua aceito; casos ambiguos retornam baixa confianca.

Testes: topicResolver e consumidores.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: mapear tema errado com confianca alta.

Rollback: fallback para matching antigo.

### B-MENTOR-1 - DecisionCore como fonte unica de acao

Objetivo: eliminar politica paralela de CTA entre Dashboard e ActionInbox.

Justificativa: o aluno deve ver uma recomendacao consistente em todas as telas.

Arquivos permitidos: `src/core/decisionCore.js`, `src/components/ActionInbox.jsx`, `src/components/Dashboard.jsx`, testes.

Arquivos proibidos: reescrever mentor copy inteira, refatorar layout completo.

Contrato tecnico: Dashboard renderiza acao primaria derivada do snapshot; ActionInbox executa o mesmo contrato de CTA.

Critérios de aceite: uma acao primaria por vez, deduplicada, com CTA identico.

Testes: decisionCore, ActionInbox, Dashboard smoke.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: perda de atalhos especificos do Dashboard.

Rollback: manter wrapper de compatibilidade.

### B-SIM-2 - redistribuicao pos-simulado

Objetivo: transformar fraquezas de simulados em ajustes de plano sem destruir FSRS.

Justificativa: simulados sao progress testing; o retorno vem quando o erro muda a pratica seguinte.

Arquivos permitidos: `src/core/simStrategy.js`, `src/core/topicResolver.js`, `src/core/agendaEngine.js`, `src/core/mentorSignals.js`, testes.

Arquivos proibidos: migrar historico ou reordenar todos os temas automaticamente.

Contrato tecnico: gerar recomendacoes de foco por area/tema com confianca, nao reescrever cronograma inteiro.

Critérios de aceite: simulado com area fraca cria acao corretiva limitada e explicavel.

Testes: simStrategy, topicResolver, agenda.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: hiper-reagir a uma prova ruim.

Rollback: desligar redistribuicao e manter apenas analise.

### B-DASH-* - Dashboard conforme plano DASH2

Objetivo: reduzir o Dashboard a Comando do Dia com densidade e hierarquia corretas.

Justificativa: o Dashboard deve reduzir decisao, nao virar relatorio completo.

Arquivos permitidos: `src/components/Dashboard.jsx` e componentes extraidos, conforme `docs/MEDREV_ROADMAP_V2_IMPLEMENTATION_PLAN.md` e plano DASH2.

Arquivos proibidos: motores core, Firebase, FSRS.

Contrato tecnico: uma acao primaria, um resumo de carga, links para diagnostico profundo em Stats.

Critérios de aceite: sem card dentro de card, sem duplicidade de fila, responsivo.

Testes: Dashboard render smoke, Playwright/manual quando houver.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: refactor visual quebrar fluxo.

Rollback: feature flag por componente antigo.

### B-FORECAST-1 - backtest do forecast

Objetivo: medir erro do forecast contra simulados reais posteriores.

Justificativa: previsao educacional sem calibracao vira numero decorativo.

Arquivos permitidos: `src/core/forecast.js`, `src/core/readinessValidation.js`, `src/core/telemetry.js`, StatsPanel, testes.

Arquivos proibidos: mudar formula central sem backtest, prometer nota oficial.

Contrato tecnico: ao registrar simulado, comparar forecast anterior com resultado e guardar erro absoluto.

Critérios de aceite: Stats mostra calibracao como qualidade do modelo, nao garantia.

Testes: forecast/readinessValidation.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: usuarios interpretarem como promessa.

Rollback: esconder backtest da UI e manter registro tecnico.

### B-MASTERY-1 - contrato FSRS x mastery

Objetivo: documentar e aplicar quem decide revisao, dominio e previsao.

Justificativa: BKT estima conhecimento; FSRS agenda memoria. Misturar os dois gera comportamento instavel.

Arquivos permitidos: `src/core/mastery.js`, `src/core/forecast.js`, `src/core/mentorSignals.js`, docs e testes.

Arquivos proibidos: substituir FSRS-lite pelo canonico agora.

Contrato tecnico: FSRS agenda; mastery mede dominio; forecast projeta readiness.

Critérios de aceite: mentor usa mastery como sinal, nao como scheduler.

Testes: mastery, forecast, mentorSignals.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: criar comportamento duplicado.

Rollback: voltar mastery para painel apenas.

### B-RC-* - Raciocinio Clinico definitivo

Objetivo: executar o plano RC-* sem criar scheduler paralelo.

Justificativa: casos clinicos devem treinar discriminacao e conduta, mas a revisao continua no motor comum.

Arquivos permitidos: conforme `MEDREV_RACIOCINIO_CLINICO_FUNCAO_DEFINITIVA.md`.

Arquivos proibidos: novo calendario paralelo de casos.

Contrato tecnico: casos alimentam learningEvents, error taxonomy, drill selector e mentor.

Critérios de aceite: caso clinico errado gera reexposicao adequada e sinal pedagogico.

Testes: RC, clinicalDrillSelector, mentor.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: duplicar fluxo de estudo.

Rollback: manter RC como modulo opt-in.

### B-SYNC-1 - conflitos e privacidade

Objetivo: reduzir risco de perda/sobrescrita e minimizar texto livre sensivel.

Justificativa: sincronizacao precisa ser previsivel antes de publico maior.

Arquivos permitidos: `src/App.js`, `src/services/firebase.js`, `src/core/backup.js`, paineis de seguranca, testes.

Arquivos proibidos: mexer em motores pedagogicos.

Contrato tecnico: conflito relevante gera aviso; campos sensiveis sao minimizados ou explicitamente locais quando possivel.

Critérios de aceite: import/export e sync mantem owner e updatedAt coerentes.

Testes: backup, App sync se houver harness, DataSafetyPanel.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: UX de conflito ficar pesada.

Rollback: manter last-write-wins com aviso.

### P3 - otimizacao avancada

Objetivo: explorar personalizacao FSRS, grafo de pre-requisitos e simulador what-if depois de estabilizar beta.

Justificativa: esses recursos so geram valor depois de dados suficientes e motores confiaveis.

Arquivos permitidos: novos modulos experimentais e testes.

Arquivos proibidos: substituir motores estaveis.

Contrato tecnico: opt-in, com feature flag e sem impacto no plano padrao.

Critérios de aceite: sem regressao de agenda, sem promessa de nota.

Testes: unitarios e comparativos.

Comando de validacao: `npm.cmd test -- --watchAll=false && npm.cmd run check:mojibake && npm.cmd run build`.

Risco: overengineering.

Rollback: remover feature flag.

## 11. Prompts prontos para Gemini Flash

### Prompt B0

```text
Voce esta no repo MedRev. Execute apenas o bloco B0.

Objetivo: estabilizar e commitar o WIP atual do Teste de Dominio, sem implementar nova feature.

Leia: git status, src/core/domainTest.js, src/core/domainValidation.js, src/components/DomainTestModal.jsx, testes relacionados, src/core/agendaEngine.js apenas para entender o contrato atual.

Nao mexa em Firebase, bundle clinico, Dashboard refactor ou scripts de encoding.

Garanta que treat_as_new, rescue_needed e fragile_base tenham contrato testado. Se encontrar bug de teste dentro do WIP, corrija o minimo necessario. Rode npm test -- --watchAll=false, npm run check:mojibake e npm run build. Ao final, reporte arquivos alterados, testes e se o working tree ficou limpo apos commit.
```

### Prompt B-SEC-1

```text
Execute apenas B-SEC-1: higiene de sessao, anon e ownerUid.

Arquivos permitidos: src/core/userScope.js, src/services/firebase.js, src/App.js e testes diretamente relacionados.

Contrato: anon fallback nao pode colidir; logout deve limpar chave local do usuario atual quando seguro; merge remoto com ownerUid divergente deve ser rejeitado/ignorado antes de sobrescrever estado local.

Nao altere motores pedagogicos nem UI ampla. Adicione testes para userScope e guard de owner quando possivel. Valide com npm test -- --watchAll=false, npm run check:mojibake, npm run build.
```

### Prompt B-PERF-1

```text
Execute apenas B-PERF-1: remover generatedClinicalCases.js do bundle principal.

Mapeie a cadeia src/constants/generatedClinicalCases.js -> caseInstances/illnessScripts -> casosClinicos -> Dashboard/Stats/store/mentor. Crie um indice leve para telas principais e carregue dados completos apenas quando Raciocinio Clinico ou fluxo clinico precisar.

Nao edite o conteudo dos casos gerados. Preserve compatibilidade de casosProgresso por id. Teste Dashboard, StatsPanel e Raciocinio Clinico. Valide com npm test -- --watchAll=false, npm run check:mojibake, npm run build.
```

### Prompt B-DT-1

```text
Execute apenas B-DT-1: tornar rescue_needed e fragile_base acionaveis na agenda e mentor.

Arquivos permitidos: agendaEngine, mentorSignals, mentorDecisionPolicy, planExecution, labels de agenda e testes.

Contrato: treat_as_new continua como D0; rescue_needed gera revisao dirigida/questoes corretivas; fragile_base gera consolidacao conceitual curta. ActionInbox e mentor devem explicar a conduta com copy de usuario, nao status tecnico cru.

Nao mexa no modal do Teste de Dominio salvo label minimo. Valide agendaEngine, mentorSignals, mentorDecisionPolicy, planExecution, check:mojibake e build.
```

### Prompt B-SIM-1

```text
Execute apenas B-SIM-1: simulado recomendado entra no plano e mentor veta simulado denso em OVERLOAD.

Arquivos permitidos: simStrategy, agendaEngine, mentorSignals, mentorDecisionPolicy, planExecution, Simulados.jsx e testes.

Contrato: recomendacao de simulado deve virar item deduplicado de agenda quando fase permite; em sobrecarga, mentor prioriza revisao/descanso e nao simulado denso; simulado pendente tem CTA claro.

Nao refatore Dashboard inteiro. Valide com testes de simStrategy, agendaEngine, mentorDecisionPolicy, ActionInbox, check:mojibake e build.
```

### Prompt B-ERR-1

```text
Execute apenas B-ERR-1: registrar tipo de erro em casos clinicos.

Arquivos permitidos: RaciocinioClinico.jsx, store.js, learningEvent.js se precisar de schemaVersion, errorTaxonomy.js, clinicalDrillSelector.js e testes.

Contrato: caso clinico deve poder registrar errors.motivosErro e errors.dominantError usando taxonomia existente; clinicalDrillSelector e mentor devem enxergar erro clinico com amostra suficiente; a classificacao deve ser opcional para nao travar UX.

Nao crie segundo scheduler clinico. Valide com testes de store, learningEvent, clinicalDrillSelector, mentorSignals, check:mojibake e build.
```

### Prompt B-HYG-1

```text
Execute apenas B-HYG-1: limpar redundancias pequenas.

Alvos: navigationModel Anki duplicado, EmptyState duplicado, campos persistidos mortos como proximaAcao se existirem, e decisionSnapshot persistido se for seguro recalcular.

Nao redesenhe Dashboard. Preserve compatibilidade de estado persistido. Adicione testes de navegacao/hydration se necessario. Valide com npm test -- --watchAll=false, npm run check:mojibake e npm run build.
```

### Prompt B-TOPIC-1

```text
Execute apenas B-TOPIC-1: criar topicResolver fino.

Crie src/core/topicResolver.js com resolucao por id, aliases normalizados e confidence. Integre somente nos pontos necessarios de simulado, mentor ou mastery. Nao migre historico e nao renomeie ids de temas.

Casos ambiguos devem retornar baixa confianca. Adicione testes. Valide com npm test -- --watchAll=false, npm run check:mojibake e npm run build.
```

### Prompt B-MENTOR-1

```text
Execute apenas B-MENTOR-1: DecisionCore como fonte unica de acao primaria.

Remova divergencia entre runMentorPrimaryAction no Dashboard e resolveActionCTA na ActionInbox. Dashboard deve renderizar e executar a acao derivada do mesmo contrato de DecisionCore/ActionInbox.

Nao reescreva copy inteira do mentor e nao faca refactor visual amplo. Valide decisionCore, ActionInbox, Dashboard smoke, check:mojibake e build.
```

### Prompt B-SIM-2

```text
Execute apenas B-SIM-2: redistribuicao pos-simulado.

Use simStrategy e topicResolver para transformar fraquezas por area/tema em recomendacoes limitadas e explicaveis. Nao reordene todo o cronograma e nao migre historico.

O sistema deve evitar hiper-reagir a uma prova ruim. Adicione testes de simStrategy/topicResolver/agenda. Valide com npm test -- --watchAll=false, npm run check:mojibake e npm run build.
```

### Prompt B-DASH

```text
Execute apenas o bloco Dashboard DASH2.

Objetivo: Dashboard como Comando do Dia. Uma acao primaria, resumo de carga, proximos compromissos e links para Stats. Reduza duplicidade de ActionInbox/MiniCronograma/WeeklyReview sem alterar motores core.

Nao crie landing page. Nao use cards dentro de cards. Preserve mobile. Valide render smoke, check:mojibake e build.
```

### Prompt B-FORECAST-1

```text
Execute apenas B-FORECAST-1: backtest do forecast.

Ao registrar simulado, compare forecast anterior com resultado real quando existir snapshot aplicavel. Grave erro absoluto e exponha calibracao como qualidade do modelo, nao promessa de nota.

Nao mude formula central sem teste comparativo. Valide forecast, readinessValidation, telemetry, check:mojibake e build.
```

### Prompt B-MASTERY-1

```text
Execute apenas B-MASTERY-1: contrato FSRS x mastery x forecast.

Documente e aplique no codigo: FSRS agenda revisoes; mastery estima dominio latente; forecast projeta readiness com incerteza. Mentor pode consumir mastery como sinal, nao como scheduler.

Nao substitua FSRS-lite pelo canônico agora. Valide mastery, forecast, mentorSignals, check:mojibake e build.
```

### Prompt B-RC

```text
Execute o proximo bloco RC conforme MEDREV_RACIOCINIO_CLINICO_FUNCAO_DEFINITIVA.md.

Regra central: casos clinicos alimentam learningEvents, error taxonomy, drill selector e mentor, mas nao criam segundo scheduler. Reexposicao deve passar pela ActionInbox/agenda existente quando possivel.

Valide testes RC, clinicalDrillSelector, mentor, check:mojibake e build.
```

### Prompt B-SYNC-1

```text
Execute apenas B-SYNC-1: conflitos e privacidade.

Melhore sync/import/export para reduzir sobrescrita silenciosa e minimizar texto livre sensivel. Preserve ownerUid, updatedAt e integridade de backup.

Nao altere motores pedagogicos. Valide backup, sync guard, DataSafetyPanel, check:mojibake e build.
```

## 12. O que NAO fazer

1. Nao reescrever o app.
2. Nao trocar FSRS-lite pelo FSRS canonico agora.
3. Nao criar segundo scheduler para casos clinicos.
4. Nao migrar historico para `topicResolver` no primeiro bloco.
5. Nao transformar forecast em promessa de nota.
6. Nao fazer Dashboard virar relatorio completo.
7. Nao carregar casos clinicos completos na tela inicial.
8. Nao classificar erro clinico como obrigatorio em toda interacao.
9. Nao resolver seguranca com "limpar tudo" sem preservar backup e escopo de usuario.
10. Nao implementar P3 antes de fechar P0/P1.
11. Nao adicionar dependencia pesada para problema resolvivel com utilitario local.
12. Nao usar emoji hardcoded em badges, KPIs ou status critico.
13. Nao versionar `build/`, `coverage/`, `.tmp-jest/`, `.import-*`, `.restore-*` ou caches.

## 13. Critérios finais de excelencia

O produto estara pronto para beta publico quando:

1. Working tree estiver limpo antes da release, com WIP de Domain Test commitado ou removido de forma auditavel.
2. `npm run check:mojibake`, `npm test` e `npm run build` passarem em ambiente limpo.
3. Logout, anon session e ownerUid guard forem cobertos por testes ou validacao manual documentada.
4. Bundle principal nao carregar `generatedClinicalCases.js` antes da necessidade clinica.
5. Teste de Dominio alterar agenda/mentor para `treat_as_new`, `rescue_needed` e `fragile_base`.
6. Simulado recomendado aparecer no plano quando indicado e ser vetado em sobrecarga.
7. Caso clinico registrar erro clinico em contrato comum de `learningEvent.errors`.
8. Dashboard mostrar uma acao primaria coerente com ActionInbox.
9. Stats for o local de diagnostico profundo; Dashboard for o local de decisao do dia.
10. Forecast exibir incerteza e calibracao, nao certeza falsa.
11. Anki Audit recomendar acao com gate de adesao e nao como alerta infinito.
12. TopicResolver reduzir matching textual fragil sem migracao arriscada.
13. Todo bloco futuro tiver rollback claro e testes especificos.

Resposta curta para orientar execucao:

- Decisao: quase pronto; beta fechado sim, beta publico nao.
- Top 5 riscos: WIP Domain Test, higiene de sessao, bundle clinico no principal, simulado fora do plano, erro clinico fora da taxonomia.
- Top 5 melhorias: commitar WIP, owner/session guard, lazy load clinico, simulado no plano, erro clinico em learningEvents.
- Ordem: B0, B-SEC-1, B-PERF-1, B-DT-1, B-SIM-1, B-ERR-1, depois P1/P2/P3.
- Plano mastigado: cada bloco tem objetivo, arquivos permitidos/proibidos, contrato, aceite, testes, validacao, risco, rollback e prompt pronto.
