# MEDREV - Contexto atualizado para IA: FSRS, Comando do Dia e Mentor

Atualizado em: 2026-06-11

Este arquivo complementa `docs/MEDREV_CONTEXT_FOR_AI.md` e deve ser lido antes de qualquer alteracao que toque revisoes, Dashboard/Hoje, ActionInbox, Agenda, Mentor, Ajustes ou fluxo de estudo. Ele consolida o estado atual do codigo para evitar que novos agentes tratem planos antigos como se ainda fossem pendencias.

## 1. Resumo executivo

O MedRev ja tem uma cadeia central para decidir a proxima acao do aluno:

```text
store -> decisionCore -> mentorSignals -> mentorDecisionPolicy -> dailyCommandEngine -> Dashboard/ActionInbox -> dailyCommandTargetExecutor
```

O Mentor continua sendo o motor de decisao. O Comando do Dia e a representacao canonica, renderizavel e executavel dessa decisao. A ActionInbox deve consumir a mesma decisao, sem criar uma segunda politica de prioridade.

O FSRS atual e um motor proprio `FSRS-lite` com adaptacao por dificuldade, estabilidade, atraso/adiantamento, relearning, workload e historico oficial. Existe tambem uma sombra canonica com `ts-fsrs` em `fsrsCanonicalShadow.js`, usada como adaptador de comparacao/override quando o contexto permite, mas a agenda operacional ainda depende do contrato local de tema como unidade de revisao.

## 2. Estado atual confirmado no codigo

### Arquivos centrais

| Area | Arquivo | Papel atual |
| --- | --- | --- |
| Estado e persistencia | `src/core/store.js` | Guarda temas, meta, inbox, snapshot de decisao e chama rebuilds apos eventos relevantes. |
| FSRS-lite | `src/core/fsrs.js` | Agenda revisoes, calcula workload, dificuldade, estabilidade, relearning e historico. |
| Sombra canonica FSRS | `src/core/fsrsCanonicalShadow.js` | Reexecuta historico oficial via `ts-fsrs` e compara/gera override limitado. |
| Preview de revisao | `src/core/reviewOutcome.js` | Descreve transicao esperada antes/depois de marcar revisao. |
| Sinais do Mentor | `src/core/mentorSignals.js` | Agrega FSRS, agenda, simulados, erros, casos clinicos, Anki, plano e modo operacional. |
| Politica do Mentor | `src/core/mentorDecisionPolicy.js` | Escolhe uma acao primaria priorizada e explicavel. |
| Snapshot unificado | `src/core/decisionCore.js` | Une contexto, acao primaria, plano do dia, Comando do Dia e ActionInbox. |
| Comando do Dia | `src/core/dailyCommandEngine.js` | Converte acao do Mentor em contrato canonico executavel. |
| Executor de destino | `src/core/dailyCommandTargetExecutor.js` | Resolve `target.route` para handlers de UI. |
| UI principal | `src/components/Dashboard.jsx` | Renderiza o Comando do Dia e registra telemetria de acao vista/iniciada/concluida. |
| Caixa de acoes | `src/components/ActionInbox.jsx` | Executa acoes pelo mesmo executor do Comando do Dia. |

### Testes existentes relevantes

| Suite | Cobertura principal |
| --- | --- |
| `src/core/fsrs.test.js` | Datas, `buildRev`, rating, intervalo, workload, D14 removido, relearning e regressao de passos. |
| `src/core/fsrsCanonicalShadow.test.js` | Mapeamento de ratings, replay canonico, serializacao, comparacao e override. |
| `src/core/mentorSignals.test.js` | Workload, relearning, warnings, labels de dominio, provider, modo operacional e erros clinicos. |
| `src/core/mentorDecisionPolicy.test.js` | Prioridade do Mentor, bloqueios, ENAMED/Vestibular, interleaving, Anki, casos clinicos e targets. |
| `src/core/dailyCommandEngine.test.js` | Contrato executavel do Comando, rotas, fallback, plano incompleto e views falsas. |
| `src/core/dailyCommandTargetExecutor.test.js` | Execucao de rotas canonicas, especialmente caso clinico. |

## 3. Contrato do FSRS

### Unidade operacional

No MedRev, a unidade operacional e o `tema`. Cada tema possui `rev` com passos:

```text
d0 -> d1 -> d4 -> d7 -> d21 -> manutencao
```

O passo D14 foi removido da progressao principal. Nao reintroduzir D14 sem migracao explicita de dados, testes e impacto na UI.

### Campos minimos por passo

Cada etapa em `tema.rev[stepKey]` deve preservar, quando aplicavel:

```text
date
scheduledAt
reviewedAt
done
skipped
skipReason
phase
S
D
acerto
questoes
completedAt
```

O historico oficial fica em `rev.reviewHistory`. Eventos de sombra ou diagnostico nao devem corromper o historico oficial nem se misturar com revisoes reais.

### Funcoes de agenda

Principais funcoes em `src/core/fsrs.js`:

- `buildRev(d0, esp)`: cria a estrutura inicial da curva do tema.
- `recalcAfterMark(rev, doneKey, acerto, desiredRetention, maxInterval, esp, shadowContext)`: recalcula o proximo estado apos marcar uma revisao.
- `getWorkloadProjection(temas, numDays)`: agrega revisoes pendentes, vencidas e minutos estimados.
- `getEstimatedMinutesForStep(stepKey, step)`: define carga por etapa, incluindo relearning/manutencao.
- `getRetrievability(tema, stepKey)`: estima recuperabilidade com base em estabilidade e tempo.
- `toRating(acerto)`: converte desempenho em rating operacional.

### Politica de rating e relearning

O rating vem do desempenho (`acerto`) e pode virar `again`, `hard`, `good` ou `easy`. Em temas maduros, desempenho abaixo do limiar de lapso deve acionar recuperacao em vez de avancar a curva como se fosse apenas uma revisao dificil.

Relearning tem prioridade operacional alta:

- nao deve abrir tema novo enquanto houver recuperacao critica;
- deve manter `targetStep`, `startedAt`, `phase` e dados suficientes para o Mentor explicar o motivo;
- deve ser contabilizado em `collectMentorSchedulerSignals`.

### Carga e sobrecarga

`getWorkloadProjection` converte revisoes em carga estimada. O nivel de carga usa minutos:

```text
ate 60 min: ok
61-120 min: moderate
acima de 120 min: high
```

Revisoes vencidas sao deslocadas para hoje na projecao. Isso e intencional: o Mentor precisa decidir com base no que o aluno precisa resolver agora, nao em uma agenda passada.

### Sombra canonica com ts-fsrs

`src/core/fsrsCanonicalShadow.js` usa:

```text
FSRS_CANONICAL_ADAPTER_VERSION = "topic-as-card-v1"
FSRS_CANONICAL_OFFICIAL_POLICY = "official_scheduler_with_lite_fallback"
```

Ela trata cada tema como um card canonico para comparar a agenda local com `ts-fsrs`. Essa camada e util para auditoria e aproximacao futura, mas tem uma limitacao importante: o modelo canonico de card unico nao representa perfeitamente a estrutura multimodal do MedRev por tema/etapa/caso.

Regra pratica:

- Pode usar a sombra para diagnostico, comparacao e override limitado quando `shadowContext` tem tema/historico suficientes.
- Nao substituir o motor FSRS-lite inteiro sem plano de migracao de dados.
- Nao instalar ou trocar biblioteca de scheduler por impulso; o gargalo atual tende a ser contrato, execucao e telemetria, nao apenas formula matematica.

## 4. Contrato do Mentor

### Papel

O Mentor nao e copy motivacional. Ele e o motor de decisao de proxima acao.

Entrada principal:

```text
buildMentorContext(state, plat, extras)
```

Saida principal:

```text
decideMentorAction(context)
```

### Sinais usados pelo Mentor

`buildMentorContext` agrega:

- fila FSRS, atrasos, carga, relearning e warnings;
- agenda do dia e proxima acao apos onboarding;
- modo operacional e disponibilidade em minutos;
- plano, calendario ativo e provider;
- ENAMED/area critica para residencia;
- materia fraca para vestibular;
- simulados recomendados ou pendentes de analise;
- erros dominantes e acao corretiva;
- casos clinicos pendentes quando o modulo esta ativo;
- Anki habilitado e feito hoje;
- intencao de estudo e necessidade de replano;
- maestria estimada e corpus consolidado.

### Ordem de prioridade atual

A politica atual em `mentorDecisionPolicy.js` segue esta ordem aproximada:

1. Inconsistencia de dados de revisao.
2. Sobrecarga realmente aliviavel por rebalanceamento.
3. Relearning ativo.
4. Revisao vencida.
5. Intencao de estudo que precisa replano.
6. Fila do dia.
7. Simulado recomendado ou analise pendente, se fila estiver segura.
8. Acao corretiva por erro dominante.
9. Gargalo ENAMED ou materia fraca.
10. Caso clinico pendente.
11. Primeiro tema ou tema novo estrategico.
12. Interleaving quando ha corpus consolidado.
13. Bloco rapido de Anki quando aplicavel.
14. Descanso ativo ou bloco leve.

Essa ordem existe para evitar que o app recomende expansao de cobertura enquanto ha dado quebrado, sobrecarga, relearning ou atraso.

### Formato minimo da acao do Mentor

Toda acao deve ter:

```text
id
type
priority
title
subtitle
reason
explain[]
cta
ctaView
estimatedMinutes
confidence
safety
source
target
```

`target` pode ser legado, mas deve ser conversivel pelo `dailyCommandEngine` para `target.route`.

## 5. Contrato do Comando do Dia

### Papel

O Comando do Dia e o contrato canonico para exibir e executar a acao primaria. Ele nao deve decidir prioridade sozinho. Ele recebe a decisao do Mentor e a transforma em um objeto de UI/execucao.

Entrada principal:

```text
buildDailyCommand({
  snapshot,
  pendingClosure,
  requirePlanSetup,
  action,
  context
})
```

Saida esperada:

```text
id
type
title
reason
subtitle
expectedBenefit
riskIfIgnored
estimatedMinutes
priority
target: { route, params }
sourceSignals[]
blockedReason
primaryLabel
secondaryLabel
tone
explain[]
source
legacyAction
```

### Rotas canonicas

`dailyCommandEngine` reconhece rotas como:

```text
dashboard
focus
agenda
plan
settings
simulations
stats
anki
clinical
session_closure
```

Mapeamentos importantes:

- `temaId + stepKey` -> `focus`.
- `close_today_queue` -> `focus` com `mode: "queue"`.
- `rebalance_workload` -> `dashboard`.
- `replan_intention` -> `settings` com aba `ajustes`.
- `simulation` e `analyze_exam` -> `simulations`.
- `anki_quick_block` -> `anki`.
- `audit_review_data` e acao corretiva -> `stats`.
- `start_new_topic` -> `plan`.
- `interleaving_block` -> `focus`.
- `clinical_case` -> `clinical`.

Regra critica: `ajustes` nao e view renderizada. Deve virar rota `settings` com parametros adequados.

### Fallbacks

O Comando do Dia nunca deve ser vazio:

- sessao sem fechamento ganha `continue_session`;
- plano incompleto ganha `plan_setup`;
- ausencia de urgencia ganha `rest_or_light_day`;
- quando o snapshot esta ausente mas ha fila pendente, o Dashboard ainda pode criar fallback de fila, mas isso deve continuar sendo excecao defensiva.

## 6. DecisionCore e store

`buildDecisionCoreSnapshot` monta o pacote unificado:

```text
context = buildMentorContext(...)
primaryAction = decideMentorAction(context)
todayPlan = buildMentorTodayPlan(context)
dailyCommand = buildDailyCommand(...)
actionInbox = buildActionInboxFromDecisionCore(...)
```

`store.js` mantem `decisionSnapshot` e `actionInbox`. Alteracoes em meta e eventos relevantes devem reconstruir ambos.

Pontos ja conectados:

- `setMeta` chama `buildDecisionOutputs`.
- `rebuildActionInboxForToday` recalcula snapshot, inbox e fase de prova.
- `rebalanceTodayWorkload` recalcula snapshot/inbox mesmo quando nada foi movido.
- conclusao de sessao e testes de dominio acionam rebuild.
- marcacao de revisao usa `recalcAfterMark` e depois chama rebuild.

Ao editar a store, preservar a regra: snapshot e inbox precisam ficar coerentes entre si.

## 7. Dashboard, ActionInbox e telemetria

O Dashboard usa:

- `decisionSnapshot.dailyCommand` como fonte primaria do Comando do Dia;
- `buildPendingClosureCommand` quando ha sessao sem fechamento;
- `legacyActionToDailyCommand` para fallback quando necessario;
- `executeDailyCommandTarget` para o botao principal.

Eventos de telemetria esperados:

```text
mentor_action_seen
mentor_action_started
mentor_action_completed
```

Payload minimo:

```text
plat
action_type
source
```

ActionInbox tambem chama `executeDailyCommandTarget`. Isso e deliberado: ActionInbox nao deve ter um executor paralelo.

## 8. Regras para futuras alteracoes

### Pode mexer sem autorizacao especial

- copy do Comando do Dia;
- labels e explicacoes do Mentor, preservando `target`;
- novos testes unitarios nos motores puros;
- ajustes em `dailyCommandEngine` para mapear targets existentes;
- melhorias de telemetria que nao mudem PII nem contrato de eventos.

### Exige cuidado e testes direcionados

- `mentorDecisionPolicy.js`, porque muda prioridade diaria do aluno;
- `mentorSignals.js`, porque altera a percepcao do Mentor;
- `dailyCommandTargetExecutor.js`, porque pode quebrar CTA;
- `store.js`, porque pode dessincronizar snapshot, inbox e persistencia;
- `fsrs.js`, porque altera agenda real e carga futura.

### Evitar

- reimplementar FSRS do zero sem migracao;
- tratar o Comando do Dia como card decorativo;
- criar um segundo motor de prioridade dentro do Dashboard;
- fazer ActionInbox decidir destino diferente do Comando do Dia;
- projetar no calendario revisoes futuras hipoteticas D1/D4/D7/D21 antes da revisao real;
- expor jargao cru para usuario final quando houver copy melhor: preferir "curva de revisao" a "FSRS" na UI.

## 9. Checklist de validacao para agentes

Antes de finalizar alteracoes nessa area:

```powershell
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Para mudancas pequenas e direcionadas, rodar tambem a suite especifica:

```powershell
npm test -- --watchAll=false src/core/fsrs.test.js src/core/fsrsCanonicalShadow.test.js src/core/mentorSignals.test.js src/core/mentorDecisionPolicy.test.js src/core/dailyCommandEngine.test.js src/core/dailyCommandTargetExecutor.test.js
```

No Windows, se Jest falhar com `EPERM` em pasta temporaria, usar `TEMP` e `TMP` apontando para uma pasta local do repo, por exemplo `.tmp-jest`.

## 10. Leitura obrigatoria antes de mexer

1. `docs/MEDREV_CONTEXT_FOR_AI.md`
2. `docs/MEDREV_COMANDO_DIA_DEEP_AUDIT_AND_FIX_PLAN.md`
3. `src/core/fsrs.js`
4. `src/core/fsrsCanonicalShadow.js`
5. `src/core/mentorSignals.js`
6. `src/core/mentorDecisionPolicy.js`
7. `src/core/decisionCore.js`
8. `src/core/dailyCommandEngine.js`
9. `src/core/dailyCommandTargetExecutor.js`
10. `src/core/store.js`
11. `src/components/Dashboard.jsx`
12. `src/components/ActionInbox.jsx`

## 11. Estado mental correto para proximos agentes

Nao partir da premissa de que "falta criar o Comando do Dia". Ele ja existe como motor e executor. A tarefa futura tipica e auditar coerencia, melhorar sinais, fechar rotas incompletas e validar UX.

Nao partir da premissa de que "basta trocar para ts-fsrs". O projeto ja tem uma sombra canonica, mas a arquitetura do MedRev usa tema/etapa/casos/agenda como produto. A troca de scheduler exige plano de dados, comparacao historica e garantia de que a experiencia diaria nao regrediu.

Nao partir da premissa de que "Mentor e texto". Mentor e decisao operacional. Se uma nova feature nao alimenta sinais, nao altera decisao ou nao melhora execucao, provavelmente ela pertence a outro modulo ou deve ser adiada.
