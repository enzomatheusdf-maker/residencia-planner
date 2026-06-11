# MEDREV - Auditoria profunda do Comando do Dia e plano de correcao

## 1. Resumo executivo

O Comando do Dia ainda nao estava confiavel para beta. A UI renderizava uma recomendacao no `Dashboard.jsx`, mas a decisao real vinha de uma cadeia indireta: `store -> decisionCore -> mentorSignals -> mentorDecisionPolicy`, com fallback local no Dashboard e execucao duplicada no `ActionInbox`.

Riscos se lancar assim:

- recomendacao stale apos mudar Ajustes;
- CTA sem destino real ou abrindo a tela errada;
- Anki sugerido mesmo quando a ferramenta configurada nao e Anki;
- raciocinio clinico sugerido fora do modulo correto;
- Rebalancear aparecendo quando o teto de revisoes comporta a fila;
- Dashboard, Agenda, Mentor e ActionInbox divergindo sobre a proxima acao.

Conclusao: precisa de motor canonico, contrato de target executavel e recomputacao centralizada.

## 2. Mapa atual do Comando do Dia

| Arquivo | Funcao/componente | O que faz | Dados que usa | Problema |
|---|---|---|---|---|
| `src/components/Dashboard.jsx` | `comandoDoDia` | Monta copy e botoes da secao principal | `decisionSnapshot`, fila, pendencia de fechamento, fallback local | Mistura UI com decisao e target |
| `src/core/decisionCore.js` | `buildDecisionCoreSnapshot` | Une contexto, acao primaria e ActionInbox | `buildMentorContext`, `decideMentorAction` | Nao retornava contrato canonico de comando |
| `src/core/mentorSignals.js` | `buildMentorContext` | Coleta sinais de plano, agenda, FSRS, simulados, Anki e clinico | store e extras | Alguns ajustes nao viravam bloqueios reais |
| `src/core/mentorDecisionPolicy.js` | `decideMentorAction` | Escolhe acao primaria | contexto do Mentor | Targets legados e regras incompletas |
| `src/components/ActionInbox.jsx` | `resolveActionCTA` | Resolve botao da acao | action legada, fila, setView | Duplica regras do Dashboard |
| `src/core/store.js` | `rebuildActionInboxForToday` | Recalcula snapshot e inbox | estado atual | `setMeta`/toggles nao recalculavam sempre |

## 3. Mapa das configuracoes

| Configuracao | Onde e salva | Onde e alterada | Quem le | Comando respeita? | Problema |
|---|---|---|---|---|---|
| Track `res`/`vest` | `store.plat` | Sidebar/Onboarding/Ajustes | App, Mentor, Dashboard | Parcial | Clinico/ENAMED precisam bloqueio explicito |
| Data da prova | `meta.dataProva` | Ajustes/Onboarding | peakMode, agenda, Mentor | Parcial | Afeta fase, mas nem todo target muda |
| Tempo disponivel | `meta.tempoDisponivel` | Onboarding/Ajustes | Mentor/rebalance | Parcial | Sem contrato de tarefa curta |
| Teto diario | `meta.maxRevisoesDia` | Ajustes | rebalance/Mentor | Parcial | Rebalancear precisava respeitar contagem |
| Anki | `meta.ferramentas.flashcards`, `meta.ankiAdesao` | Ajustes/AnkiAudit | Mentor/AnkiAudit | Parcial | Ferramenta diferente de Anki nao bloqueava sugestao |
| Raciocinio clinico | `meta.modulos.raciocinioClinico` | Ajustes/Onboarding | App/Mentor | Parcial | Contexto podia carregar casos legados |
| Plan setup | `meta.planSetup` | OnboardingV2 | agenda/Mentor | Parcial | Fallback visual fora do motor |
| Temas por dia/semana | `meta.temasPerDay`, `meta.temasPerWeek` | Ajustes/Dashboard | Agenda/UX | Fraco | Nao e limite canonico de comando |
| Provas/areas | `meta.provasAlvo`, `meta.areaPuxouBaixo` | Ajustes | readiness/Mentor | Parcial | Influencia desempate, nao target |

## 4. Fluxo atual

Configuracao muda -> `setMeta`/`toggleModulo` -> persistencia Zustand -> Dashboard `useEffect` tenta rebuild -> `decisionSnapshot` -> `comandoDoDia` local -> CTA local.

Quebras principais: mutacoes de configuracao nao recalculavam o snapshot de forma central, Dashboard e ActionInbox executavam targets com regras diferentes, e Ajustes podia virar `setView("ajustes")`, que nao e view renderizada.

## 5. Fluxo ideal

Store muda -> snapshot e comando canonico sao recalculados -> Dashboard renderiza `dailyCommand` -> ActionInbox converte acao legada para o mesmo contrato -> executor unico abre o destino correto.

## 6. Bugs e inconsistencias

P0:

- CTA sem target canonico.
- Ajustes como view falsa em vez de modal.
- Rebalancear quando `dueTodayCount <= maxRevisoesDia`.

P1:

- Anki recomendado sem conferir `meta.ferramentas.flashcards`.
- Raciocinio clinico sugerido com modulo desligado.
- Recomputation incompleta apos Ajustes.
- Duplicacao Dashboard/ActionInbox.

P2:

- Simulado pendente usa heuristica ampla.
- Temas por dia/semana nao limitam comando.
- Fallbacks de descanso/estatisticas sao genericos.

P3:

- Dias de estudo e disponibilidade granular ainda nao existem como contrato completo.

## 7. Arquitetura recomendada

Implementar:

- `src/core/dailyCommandEngine.js`: motor puro, sem React/store/localStorage.
- `src/core/dailyCommandEngine.test.js`: contrato e regressao.
- `src/core/dailyCommandTargetExecutor.js`: adaptador de UI para executar `target.route`.

O Mentor continua decidindo a acao operacional; o Comando do Dia passa a ser a representacao canonica executavel dessa acao.

## 8. Contrato de dados

Entrada minima:

- `snapshot.today`, `snapshot.plat`, `snapshot.primaryAction`, `snapshot.context`;
- `context.scheduler`, `context.meta`, `context.agendaTodaySummary`, `context.planHealth`;
- opcional `pendingClosure`.

Saida:

```js
{
  id: string,
  type: string,
  title: string,
  reason: string,
  expectedBenefit: string,
  riskIfIgnored: string,
  estimatedMinutes: number,
  priority: number,
  target: { route: string, params?: object },
  sourceSignals: string[],
  blockedReason?: string
}
```

## 9. Integracao com Ajustes

- `maxRevisoesDia`: so permite Rebalancear quando a contagem de revisoes excede o teto configurado.
- `ferramentas.flashcards`: se nao for `Anki`, comando nao pode recomendar Anki.
- `modulos.raciocinioClinico`: se falso, comando nao pode recomendar caso clinico.
- `dataProva` e `tempoDisponivel`: entram no contexto do Mentor e no target canonico.
- `provasAlvo` e `areaPuxouBaixo`: continuam sinais de prioridade, com target executavel.

## 10. Integracao com Dashboard

Dashboard deve renderizar `decisionSnapshot.dailyCommand` ou uma sobreposicao de sessao sem fechamento. O botao principal chama executor unico. Loading/empty state deve cair em `plan_setup` ou `rest_or_light_day`.

## 11. Integracao com Agenda

`target.route = "agenda"` abre Plano na subaba Agenda do dia. `target.route = "focus"` abre revisao/tema especifico. Sem item especifico, usa a primeira tarefa da fila.

## 12. Integracao com Mentor

Mentor segue como motor de sinais e prioridade. Comando do Dia e ActionInbox consomem a mesma decisao canonica; nenhum dos dois deve recriar regras de negocio.

## 13. Blocos de implementacao

### BLOCO CMD0 - Baseline e testes atuais

Objetivo: registrar auditoria e estado antes da troca.
Arquivos permitidos: `docs/MEDREV_COMANDO_DIA_DEEP_AUDIT_AND_FIX_PLAN.md`.
Arquivos proibidos: Firebase, FSRS, `agendaEngine`, `scheduleWizard`.
Tarefas:
1. Registrar mapa atual.
2. Registrar bugs P0-P3.
3. Rodar validacoes.
Comandos: `npm run check:mojibake`, `npm test -- --watchAll=false`, `npm run build`.
Critérios de aceite: documento cobre mapas, fluxo, bugs, arquitetura e blocos.
Riscos: worktree ja sujo.
Rollback: remover o MD.
Executor recomendado: Codex/GPT-5.5 High.
Justificativa do executor: exige auditoria cross-code.

### BLOCO CMD1 - Extrair motor puro dailyCommandEngine

Objetivo: criar funcao pura.
Arquivos permitidos: `src/core/dailyCommandEngine.js`, `src/core/dailyCommandEngine.test.js`.
Arquivos proibidos: Firebase, FSRS, agendaEngine, scheduleWizard.
Tarefas:
1. Adaptar acao do Mentor.
2. Padronizar tipo e target.
3. Criar fallback.
Comandos: `npm run check:mojibake`, `npm test -- --watchAll=false`, `npm run build`.
Critérios de aceite: sem React/store/localStorage.
Riscos: duplicacao temporaria.
Rollback: remover arquivos novos.
Executor recomendado: Codex/GPT-5.5 High.
Justificativa do executor: contrato central.

### BLOCO CMD2 - Contrato canonico de comando

Objetivo: garantir shape fixo.
Arquivos permitidos: motor/teste.
Arquivos proibidos: Firebase/FSRS.
Tarefas:
1. Validar `target.route`.
2. Validar `reason`.
3. Validar fallback.
Comandos: `npm run check:mojibake`, `npm test -- --watchAll=false`, `npm run build`.
Critérios de aceite: comando sempre executavel.
Riscos: naming divergente.
Rollback: adapter legacy.
Executor recomendado: Codex/GPT-5.5 High.
Justificativa do executor: regressao de contrato.

### BLOCO CMD3 - Configuracoes/Ajustes

Objetivo: respeitar preferencias.
Arquivos permitidos: motor, Mentor signals/policy, testes.
Arquivos proibidos: Firebase/FSRS.
Tarefas:
1. Bloquear Anki se ferramenta nao for Anki.
2. Bloquear clinico se modulo desligado ou vestibular.
3. Validar Rebalancear contra teto.
Comandos: `npm run check:mojibake`, `npm test -- --watchAll=false`, `npm run build`.
Critérios de aceite: ajustes mudam comando.
Riscos: dados legados incompletos.
Rollback: defaults conservadores.
Executor recomendado: Codex/GPT-5.5 High.
Justificativa do executor: regras de produto.

### BLOCO CMD4 - Agenda/Plano/FSRS

Objetivo: usar tarefas reais sem mudar agendaEngine.
Arquivos permitidos: motor/teste.
Arquivos proibidos: `agendaEngine`, FSRS.
Tarefas:
1. Mapear revisao para foco.
2. Mapear agenda para Plano/Agenda.
3. Mapear dominio/relearning.
Comandos: `npm run check:mojibake`, `npm test -- --watchAll=false`, `npm run build`.
Critérios de aceite: nenhuma acao impossivel.
Riscos: target antigo incompleto.
Rollback: abrir Plano.
Executor recomendado: Codex/GPT-5.5 High.
Justificativa do executor: integracao de fluxo.

### BLOCO CMD5 - CTAs e destinos

Objetivo: executor unico.
Arquivos permitidos: Dashboard, ActionInbox, executor.
Arquivos proibidos: Firebase/FSRS.
Tarefas:
1. Executar `target.route`.
2. Ajustes abre modal.
3. Agenda abre subaba correta.
Comandos: `npm run check:mojibake`, `npm test -- --watchAll=false`, `npm run build`.
Critérios de aceite: nenhum CTA aponta para view inexistente.
Riscos: acoplamento App.
Rollback: fallback setView.
Executor recomendado: Codex/GPT-5.5 High.
Justificativa do executor: navegacao critica.

### BLOCO CMD6 - Integrar Dashboard

Objetivo: UI renderiza comando canonico.
Arquivos permitidos: Dashboard, decisionCore.
Arquivos proibidos: Firebase/FSRS.
Tarefas:
1. Usar `decisionSnapshot.dailyCommand`.
2. Manter override de fechamento de sessao.
3. Remover decisao paralela.
Comandos: `npm run check:mojibake`, `npm test -- --watchAll=false`, `npm run build`.
Critérios de aceite: mudanca de Ajustes atualiza comando.
Riscos: regressao visual.
Rollback: fallback antigo.
Executor recomendado: Codex/GPT-5.5 High.
Justificativa do executor: UI critica.

### BLOCO CMD7 - Fallbacks e empty states

Objetivo: sem vazio operacional.
Arquivos permitidos: motor/Dashboard/teste.
Arquivos proibidos: Firebase/FSRS.
Tarefas:
1. `plan_setup`.
2. `rest_or_light_day`.
3. `blockedReason`.
Comandos: `npm run check:mojibake`, `npm test -- --watchAll=false`, `npm run build`.
Critérios de aceite: fallback sempre tem target e reason.
Riscos: copy generica.
Rollback: fallback antigo.
Executor recomendado: Codex/GPT-5.5 High.
Justificativa do executor: confiabilidade beta.

### BLOCO CMD8 - Testes de regressao

Objetivo: cobrir casos obrigatorios.
Arquivos permitidos: testes core e UI leves.
Arquivos proibidos: Firebase/FSRS.
Tarefas:
1. Sem plano, sessao aberta, vencidas, tarefa do dia.
2. Simulado pendente, Anki off/feito, vest/res.
3. Dominio, pouco tempo, plano inviavel, target/reason/fallback.
Comandos: `npm run check:mojibake`, `npm test -- --watchAll=false`, `npm run build`.
Critérios de aceite: todos os cenarios passam.
Riscos: CRA lento no Windows.
Rollback: isolar teste do motor.
Executor recomendado: Codex/GPT-5.5 High.
Justificativa do executor: suite de regressao ampla.
