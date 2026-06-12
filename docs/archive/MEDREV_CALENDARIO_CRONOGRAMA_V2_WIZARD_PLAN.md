# MEDREV — Reformulação do MD de Agenda e Cronograma: Wizard de Planejamento, Calendário Operacional e Integração com Mentor

> **Arquivo sugerido no repo:** `docs/MEDREV_CALENDARIO_CRONOGRAMA_V2_WIZARD_PLAN.md`  
> **Objetivo:** reformular o plano anterior de Agenda/Cronograma para incluir um gerador guiado de cronograma no estilo dos prints enviados: dias de estudo, tópicos por dia, duração até a prova, foco/instituições, preview/análise e geração final.  
> **Princípio:** Cronograma não é só uma lista de temas. Cronograma é o plano de D0. Agenda é a projeção diária de D0 + revisões FSRS + simulados + pendências. Mentor é a decisão de prioridade em cima disso.

---

# 0. Nova visão do módulo

O módulo deve ser dividido em 3 camadas:

```txt
1. Criador de Cronograma
   Configura capacidade, dias, duração, foco, escopo e gera um plano.

2. Cronograma / Plano
   Mostra os blocos, semanas, temas distribuídos, provider/importação e ajustes.

3. Agenda
   Mostra o que fazer em cada dia: D0 planejado, revisões FSRS, simulados, atrasadas e tarefas manuais.
```

A diferença crítica:

```txt
Cronograma = o que existe para estudar e quando iniciar cada tema.
Agenda = o que fazer em cada dia, incluindo revisões.
Mentor = qual dessas coisas fazer agora.
```

---

# 1. Problema que este bloco resolve

Hoje o MedRev tem provider, cronogramas, importação e lista de temas, mas ainda falta um gerador operacional:

```txt
1. O aluno não configura a própria capacidade com clareza.
2. "Temas por semana" não distribui de verdade por dia.
3. Ajustar cronograma parece configurar números, mas não mostra consequência.
4. A Agenda não deriva claramente do cronograma.
5. O usuário não entende se consegue fechar o plano até a prova.
6. Cronograma importado/manual não ganha uma distribuição confiável.
```

O usuário precisa ver:

```txt
Você escolheu estudar 6 dias.
Você quer fazer 4 tópicos na segunda, 3 na terça...
Com 672 tópicos, isso fecha em 24 semanas.
Com sua prova em 18 semanas, está inviável.
Soluções:
- aumentar tópicos/dia;
- reduzir escopo;
- priorizar temas de alta incidência;
- estender prazo;
- usar modo intensivo.
```

---

# 2. Novo fluxo: Criador de Cronograma

## 2.1 Quando aparece

O Criador de Cronograma deve aparecer quando:

```txt
1. usuário novo ainda não tem plano ativo;
2. usuário clica em "Criar cronograma";
3. usuário clica em "Recriar cronograma";
4. usuário importa CSV e quer distribuir no calendário;
5. usuário muda data da prova ou dias de estudo e precisa recalcular.
```

Não deve aparecer toda hora no Dashboard.

Depois de concluído, o usuário vê apenas:

```txt
Plano ativo
Agenda
Ajustar cronograma
```

---

# 3. Wizard do Criador de Cronograma

## Etapas recomendadas

```txt
1. Dias
2. Tópicos
3. Semanas / Data da prova
4. Foco
5. Preview
6. Análise / Gerar
```

---

## Etapa 1 — Dias

### Objetivo

Selecionar os dias da semana em que o aluno consegue estudar.

### UI

Baseada no print:

```txt
Marque os dias que você consegue estudar
[Dom] [Seg] [Ter] [Qua] [Qui] [Sex] [Sáb]
```

### Estado

```js
studyDays: {
  dom: { active: true },
  seg: { active: true },
  ter: { active: true },
  qua: { active: true },
  qui: { active: true },
  sex: { active: true },
  sab: { active: true }
}
```

### Feedback

```txt
7 dias selecionados.
No próximo passo, você define quantos tópicos quer estudar em cada dia.
```

### Regras

```txt
1. Pelo menos 1 dia precisa estar ativo.
2. Se o usuário marca todos os dias, mostrar aviso leve:
   "Estudar todos os dias é possível, mas reserve margem para revisão e descanso."
3. Não tratar domingo como obrigatório.
```

---

## Etapa 2 — Tópicos por dia

### Objetivo

Definir capacidade de temas novos por dia, variando por dia.

### UI

Como no print:

```txt
Quantos tópicos por dia?
Domingo: 1 2 3 4 6 8 10
Segunda: 1 2 3 4 6 8 10
...
```

### Estado

```js
studyDays: {
  dom: { active: true, maxNewTopics: 2 },
  seg: { active: true, maxNewTopics: 4 },
  ter: { active: true, maxNewTopics: 4 },
  qua: { active: true, maxNewTopics: 3 },
  qui: { active: true, maxNewTopics: 4 },
  sex: { active: true, maxNewTopics: 2 },
  sab: { active: true, maxNewTopics: 2 }
}
```

### Cálculo

```js
topicsPerWeek = sum(activeDay.maxNewTopics)
```

### Feedback

```txt
28 tópicos por semana
7 dias de estudo
```

### Explicação

Cada tópico inclui, por padrão:

```txt
material/aula/resumo;
questões comentadas;
flashcards/anotações, se o usuário usar.
```

### Importante

O campo “tópicos por dia” representa **D0 / temas novos**, não revisões.

Revisões são adicionadas por FSRS depois que o D0 é concluído.

---

## Etapa 3 — Semanas ou data da prova

### Objetivo

Definir o horizonte do plano e checar viabilidade.

### UI

Como no print:

```txt
Quantas semanas até a prova?
Modo:
- Duração
- Data-alvo

Unidade:
- Meses
- Semanas

Atalhos:
1 mês, 2 meses, 3 meses, 6 meses, 12 meses, 24 meses
```

### Estado

```js
planningHorizon: {
  mode: "duration" | "target_date",
  months: 10,
  weeks: 43,
  targetDate: "2026-09-13"
}
```

### Cálculos

```js
availableWeeks = diffWeeks(startDate, targetDate)
availableCapacity = topicsPerWeek * availableWeeks
totalTopics = count(selectedTopics)
feasibilityRatio = availableCapacity / totalTopics
```

### Feedback

Se viável:

```txt
Sua meta configurada: 10 meses
672 tópicos cabem em 24 semanas.
Você tem 43 semanas. Há margem para revisão e consolidação.
```

Se apertado:

```txt
672 tópicos cabem em 24 semanas.
Você tem 20 semanas. Plano apertado: aumente tópicos/dia ou reduza escopo.
```

Se inviável:

```txt
672 tópicos não cabem no tempo atual.
Soluções:
- aumentar tópicos por dia;
- selecionar mais dias;
- reduzir escopo;
- priorizar temas de alta incidência;
- usar modo intensivo.
```

---

## Etapa 4 — Foco

### Objetivo

Escolher como os temas serão priorizados.

### UI

Como no print:

```txt
Última configuração: foco nas suas instituições ou usar cronograma pronto?

Opções:
1. Focado nas minhas instituições
2. Cronograma base MedRev
3. Importado pelo usuário
```

### Não usar nomes de terceiros no produto final

Evitar:

```txt
Cronograma do Dr. Will
Estratégia
MedCof
```

A menos que o usuário importou manualmente e o nome seja privado/local.

### Opções seguras

```txt
Focado nas minhas instituições
Usa incidência e pesos das provas selecionadas.

Cronograma base MedRev
Usa distribuição geral por grandes áreas e temas de alta prevalência.

Importado pelo usuário
Usa o CSV/texto que o usuário trouxe.
```

### Estado

```js
planningFocus: {
  mode: "institutions" | "medrev_base" | "user_import",
  institutions: ["ENAMED", "SES-DF"],
  weightsMode: "incidence" | "balanced" | "custom"
}
```

### Regras

```txt
1. Se não houver dados de incidência por instituição, mostrar:
   "Usaremos prioridade geral até haver dados suficientes."
2. Não prometer "milhares de questões reais" se o banco interno não existe.
3. Não inventar prevalência.
4. Se usar dados de incidência internos, documentar a fonte.
```

Copy recomendada:

```txt
Usaremos seus pesos de prova e prioridade dos temas para ordenar o plano.
```

---

## Etapa 5 — Preview

### Objetivo

Mostrar o resultado antes de gerar.

### UI

Como no print:

```txt
Confira e bora gerar!

43 semanas
1204 tópicos no total

Resumo:
- Carga semanal: 28 tópicos por semana
- Dias de estudo: 7 dias
- Total do cronograma: 1204 tópicos em 43 semanas
- Modo de geração: focado em instituições selecionadas
```

### Alerta importante

Se o número total de tópicos for muito alto, mostrar aviso:

```txt
1204 tópicos é um plano muito amplo.
Considere começar por "Essencial" ou "Alta incidência" para reduzir sobrecarga.
```

### Modos de escopo

Adicionar uma seleção antes de gerar:

```txt
Escopo do plano:
- Essencial: temas críticos e alta incidência
- Completo: todos os temas selecionados
- Intensivo: alta carga, menos margem de revisão
```

### Estado

```js
scopeMode: "essential" | "complete" | "intensive"
```

### Regra

Não forçar 1204 tópicos para todo usuário. Isso pode destruir aderência.

---

## Etapa 6 — Análise / Gerar cronograma

### Objetivo

Gerar o cronograma final e informar riscos.

### Output

```js
generatedSchedule: {
  id,
  name,
  createdAt,
  startDate,
  targetDate,
  sourceMode,
  scopeMode,
  totalTopics,
  totalWeeks,
  topicsPerWeek,
  studyDays,
  weeks: [
    {
      weekIndex,
      startDate,
      endDate,
      topics: [...]
    }
  ],
  warnings: [...]
}
```

### Warnings

```txt
capacity_overflow
too_many_topics_per_day
no_rest_day
high_review_load_expected
target_date_too_close
insufficient_incidence_data
```

### Depois de gerar

O app deve levar o usuário para:

```txt
Plano/Cronograma com o bloco da semana atual aberto
```

E o Dashboard passa a mostrar:

```txt
Hoje: abrir primeiro tema do cronograma
```

---

# 4. Ajustar Cronograma vs Criar Cronograma

São fluxos diferentes.

## Criar Cronograma

Fluxo de onboarding/plano novo:

```txt
Dias → Tópicos → Semanas/Data → Foco → Preview → Gerar
```

## Ajustar Cronograma

Fluxo para plano já existente:

```txt
Ajustar Cronograma
- dias de estudo
- tópicos por dia
- carga diária máxima
- revisões automáticas
- máximo de revisões por tópico
- adicionar semanas
- redistribuir temas futuros
- preservar progresso
```

### Regra

Ajustar cronograma **não deve reembaralhar temas já concluídos**.

Deve permitir:

```txt
1. redistribuir apenas temas não iniciados;
2. manter semanas passadas travadas;
3. recalcular agenda futura;
4. avisar impacto.
```

---

# 5. Agenda mensal integrada

A Agenda usa o cronograma gerado.

## Fontes da Agenda

```txt
1. D0 planejado no cronograma.
2. Revisões FSRS reais após D0 concluído.
3. Revisões atrasadas.
4. Simulados agendados/manual.
5. Weekly Review, se liberado.
6. Tarefas manuais futuras.
```

## Horizonte

```txt
Hoje até 12 meses à frente.
Pode mostrar 1 mês para trás apenas para contexto.
```

## Interação

```txt
Clicar no dia: mostra tarefas do dia.
Hover desktop: preview curto.
Tap mobile: seleciona dia.
```

## Detalhe do dia

Ordem inteligente:

```txt
1. Relearning / reaprendendo
2. Revisões vencidas críticas
3. Revisões de hoje
4. Pós-simulado
5. D0 de tema crítico
6. Tema novo comum
7. Weekly Review
8. Manual
```

---

# 6. CSV e importação

## CSV deve entrar no Wizard

O usuário pode escolher:

```txt
Gerar com temas MedRev
Importar CSV
Colar texto estruturado
```

## Template CSV

```csv
semana,dia,data,area,tema,subtema,ordem,duracaoMin,prioridade,observacoes
Semana 1,Seg,,Cardiologia,Hipertensão Arterial Sistêmica,Diagnóstico e classificação,1,50,alta,
Semana 1,Ter,,Cirurgia,Trauma,Avaliação inicial e vias aéreas,2,60,alta,
Semana 1,Qua,,GO,Pré-natal,Assistência ao pré-natal,3,50,media,
```

## Instrução para IA

Mostrar no modal:

```txt
Copie seu cronograma e peça para uma IA:
"Transforme este cronograma em CSV com as colunas:
semana,dia,data,area,tema,subtema,ordem,duracaoMin,prioridade,observacoes.
Não invente temas. Se não houver data, deixe vazio."
```

## PDF

Não implementar PDF automático agora.

Copy:

```txt
PDFs variam muito. Para evitar erro de cronograma, copie o texto do PDF e converta para CSV usando o modelo.
```

---

# 7. Algoritmo de distribuição

## Entrada

```js
{
  topics,
  startDate,
  targetDate,
  studyDays,
  focusMode,
  scopeMode,
  maxDailyItems,
  autoScheduleReviews
}
```

## Saída

```js
{
  scheduledTopics,
  weeks,
  dailyPlan,
  warnings,
  summary
}
```

## Regra principal

```txt
Não ocultar temas.
Não apagar temas.
Não iniciar tema automaticamente.
Apenas planejar D0.
```

## Pseudocódigo

```js
function distributeTopics({ topics, startDate, studyDays }) {
  const sorted = sortByPriorityWeekAndOrder(topics);
  const days = buildActiveStudyDays(startDate, studyDays);
  const output = [];

  let pointer = 0;

  for (const topic of sorted) {
    while (days[pointer].remainingNewTopics <= 0) {
      pointer++;
    }

    output.push({
      ...topic,
      scheduledDate: days[pointer].date,
      scheduledWeek: days[pointer].weekIndex,
      scheduledDayLabel: days[pointer].label,
      distributionReason: "capacity"
    });

    days[pointer].remainingNewTopics -= 1;
  }

  return output;
}
```

## Prioridade

Ordenar por:

```txt
1. semana original/importada;
2. prioridade/incidência;
3. ordem do CSV;
4. área crítica;
5. nome.
```

Se `focusMode = institutions`:

```txt
peso da instituição entra antes da ordem geral.
```

Se `scopeMode = essential`:

```txt
filtrar ou empurrar baixa prioridade para depois.
```

---

# 8. Integrações obrigatórias

## Dashboard → Agenda

Dashboard deve mostrar:

```txt
Hoje: X tarefas · Y min
Botão: Ver agenda
```

Se Mentor não tiver target específico:

```txt
CTA seguro = Ver agenda
```

## Agenda → Mentor

Mentor recebe:

```js
agendaTodaySummary: {
  totalItems,
  estimatedMinutes,
  overdueCount,
  criticalCount,
  firstAction,
  overloaded
}
```

## Cronograma → Agenda

Cronograma gera:

```txt
D0 planejado
```

FSRS gera:

```txt
revisões reais depois do D0
```

## Weekly Review → Agenda

Weekly Review usa:

```txt
planejado vs executado;
dias sobrecarregados;
tarefas perdidas;
ajuste da próxima semana.
```

---

# 9. Blocos de implementação revisados

## CAL0 — Auditoria/contrato

Sem implementação.

```txt
Auditar arquivos existentes de Cronograma, CalendarProvider, Dashboard, Store, WeeklyReview e Mentor.
Criar docs/CAL0_AGENDA_CRONOGRAMA_CODE_AUDIT.md.
```

---

## CAL1 — Modelos e engine da Agenda

Arquivos:

```txt
src/core/agendaEngine.js
src/core/agendaEngine.test.js
```

Funções:

```js
buildAgendaItems
estimateTaskMinutes
sortAgendaItemsForDay
groupAgendaByDate
getAgendaDaySummary
buildAgendaMonth
```

---

## CAL2 — Engine do Criador de Cronograma

Arquivos:

```txt
src/core/scheduleWizard.js
src/core/scheduleWizard.test.js
src/core/calendarDistribution.js
src/core/calendarDistribution.test.js
```

Funções:

```js
calculateWeeklyCapacity
calculatePlanningHorizon
calculateFeasibility
selectTopicsByScope
distributeTopics
buildSchedulePreview
generateSchedule
```

---

## CAL3 — Wizard de Criar Cronograma

Arquivos:

```txt
src/components/ScheduleWizard.jsx
src/components/ScheduleWizardStepDays.jsx
src/components/ScheduleWizardStepTopics.jsx
src/components/ScheduleWizardStepHorizon.jsx
src/components/ScheduleWizardStepFocus.jsx
src/components/ScheduleWizardStepPreview.jsx
src/components/ScheduleWizardStepAnalyze.jsx
src/components/Cronograma.jsx
```

Não mexer em Dashboard.

---

## CAL4 — CSV/template

Arquivos:

```txt
src/core/calendarImportCsv.js
src/core/calendarImportCsv.test.js
src/components/CalendarImportWizard.jsx
```

---

## CAL5 — Tela Agenda

Arquivos:

```txt
src/components/Agenda.jsx
src/components/AgendaMonthGrid.jsx
src/components/AgendaDayDetails.jsx
src/components/AgendaTaskItem.jsx
src/App.js
src/core/navigationModel.js
```

---

## CAL6 — Integração Dashboard/Mentor

Arquivos:

```txt
src/components/Dashboard.jsx
src/core/mentorSignals.js
src/core/mentorAutopilot.js
src/core/agendaEngine.js
```

---

## CAL7 — Ajustar Cronograma

Arquivos:

```txt
src/components/CronogramaSettingsModal.jsx
src/components/Cronograma.jsx
src/core/scheduleWizard.js
src/core/calendarDistribution.js
```

---

## CAL8 — Weekly Review com Agenda

Arquivos:

```txt
src/components/WeeklyReview.jsx
src/core/weeklyReviewGate.js
src/core/sessionReflection.js
src/core/agendaEngine.js
```

---

# 10. Prompts revisados para Codex

## Prompt base

```txt
Antes de implementar, leia:
- docs/MEDREV_CONTEXT_FOR_AI.md
- docs/MEDREV_CALENDARIO_CRONOGRAMA_V2_WIZARD_PLAN.md

Execute somente o BLOCO CAL[X].

Não execute blocos futuros.
Não mexa fora dos arquivos permitidos.
Não faça refactor global.
Não instale libs.
Não faça commit, push ou deploy.
Não liste workspace inteiro.
Use git grep/git ls-files.

Se precisar mexer em store.js, Firebase/Auth/localStorage ou FSRS fora do escopo, pare e peça autorização.

Ao final rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório:
- arquivos alterados;
- o que mudou;
- testes;
- build;
- riscos;
- pendências;
- próximo bloco recomendado.
```

---

## Prompt CAL1 — agendaEngine

```txt
Execute somente CAL1.

Criar src/core/agendaEngine.js e src/core/agendaEngine.test.js.

Implementar:
- buildAgendaItems
- estimateTaskMinutes
- sortAgendaItemsForDay
- groupAgendaByDate
- getAgendaDaySummary
- buildAgendaMonth

Agenda deve juntar:
- revisões FSRS;
- D0 planejado;
- atrasadas;
- simulados;
- weekly review;
- casos clínicos apenas em Residência.

Não alterar UI, Store, Dashboard, Cronograma ou FSRS.

Testar:
- agrupamento por data;
- ordenação inteligente;
- estimativa de tempo;
- horizonte até 365 dias;
- vestibular sem item clínico.
```

---

## Prompt CAL2 — scheduleWizard engine

```txt
Execute somente CAL2.

Criar:
- src/core/scheduleWizard.js
- src/core/scheduleWizard.test.js
- src/core/calendarDistribution.js
- src/core/calendarDistribution.test.js

Implementar:
- calculateWeeklyCapacity
- calculatePlanningHorizon
- calculateFeasibility
- selectTopicsByScope
- distributeTopics
- buildSchedulePreview
- generateSchedule

Regras:
- não ocultar temas;
- overflow vai para próximas datas;
- respeitar dias ativos;
- respeitar maxNewTopics por dia;
- usar data explícita do tópico quando existir;
- gerar warnings de inviabilidade;
- escopos: essential, complete, intensive.

Não alterar UI nem Store.
```

---

## Prompt CAL3 — ScheduleWizard UI

```txt
Execute somente CAL3.

Criar componentes do Wizard:
- ScheduleWizard.jsx
- ScheduleWizardStepDays.jsx
- ScheduleWizardStepTopics.jsx
- ScheduleWizardStepHorizon.jsx
- ScheduleWizardStepFocus.jsx
- ScheduleWizardStepPreview.jsx
- ScheduleWizardStepAnalyze.jsx

Integrar em Cronograma.jsx apenas como botão "Criar cronograma" / "Recriar cronograma".

Etapas:
1. Dias
2. Tópicos
3. Semanas/Data
4. Foco
5. Preview
6. Análise/Gerar

Não mexer em Dashboard, Mentor, FSRS ou Firebase.

Ao gerar, salvar configuração usando APIs existentes do store/meta/calendarProvider quando possível.
Se precisar criar novo slice complexo, pare e peça autorização.
```

---

## Prompt CAL4 — CSV

```txt
Execute somente CAL4.

Criar importação CSV com template baixável.

Arquivos:
- src/core/calendarImportCsv.js
- src/core/calendarImportCsv.test.js
- src/components/CalendarImportWizard.jsx

Colunas:
semana,dia,data,area,tema,subtema,ordem,duracaoMin,prioridade,observacoes

Obrigatórios:
semana, area, tema

Suportar vírgula e ponto-e-vírgula.

Não implementar PDF automático.
Adicionar instrução para converter PDF/texto em CSV com IA.
```

---

## Prompt CAL5 — Agenda UI

```txt
Execute somente CAL5.

Criar tela Agenda:
- Agenda.jsx
- AgendaMonthGrid.jsx
- AgendaDayDetails.jsx
- AgendaTaskItem.jsx

Integrar view agenda em App/navigationModel.

Requisitos:
- mês atual correto;
- hoje destacado;
- data selecionada;
- navegar até 12 meses à frente;
- contagem de itens por dia;
- densidade/carga por indicador;
- hover preview desktop;
- tap mobile;
- detalhes abaixo com tarefas em ordem inteligente;
- CTAs para revisar, abrir plano ou simulado.

Não mexer em FSRS, Store ou Mentor.
```

---

## Prompt CAL6 — Dashboard/Mentor

```txt
Execute somente CAL6.

Integrar Agenda ao Dashboard e Mentor.

Arquivos:
- Dashboard.jsx
- mentorSignals.js
- mentorAutopilot.js
- agendaEngine.js

Criar agendaTodaySummary:
- totalItems
- estimatedMinutes
- overdueCount
- criticalCount
- firstAction
- overloaded

Dashboard:
- mostrar "Hoje: X tarefas · Y min";
- botão "Ver agenda";
- se Mentor não tiver target específico, CTA seguro = Agenda.

Mentor:
- se agenda overloaded, sugerir recuperação/redução;
- se agendaFirstAction existe, usar como próximo target quando fizer sentido.
```

---

## Prompt CAL7 — Ajustar Cronograma

```txt
Execute somente CAL7.

Criar/ajustar modal Ajustar Cronograma.

Arquivos:
- CronogramaSettingsModal.jsx
- Cronograma.jsx
- scheduleWizard.js
- calendarDistribution.js

Funções:
- dias de estudo;
- tópicos por dia;
- carga diária máxima;
- revisões automáticas;
- máximo de revisões por tópico;
- adicionar semanas;
- preview;
- redistribuir apenas temas não iniciados;
- preservar semanas passadas;
- mostrar impacto antes de aplicar.
```

---

## Prompt CAL8 — Weekly Review com Agenda

```txt
Execute somente CAL8.

Weekly Review deve usar agendaEngine para:
- plannedThisWeek;
- completedThisWeek;
- missedItems;
- overloadedDays;
- nextWeekProjection.

Ações contextuais:
- recuperar atrasadas;
- reduzir temas novos;
- aumentar capacidade;
- importar cronograma;
- usar Já domino;
- agendar simulado.

Não mostrar "a definir".
Não criar Activity Log.
```

---

# 11. Perguntas pendentes

Antes de implementar CAL2/CAL3, decidir:

```txt
1. "1 tópico" representa quanto tempo padrão? 30, 45 ou 60 min?
2. Em alta carga, você aceita 8–10 tópicos/dia ou quer limitar por segurança?
3. "Focado nas minhas instituições" vai usar pesos reais já existentes ou prioridade genérica por enquanto?
4. Escopo "Essencial" deve filtrar temas ou apenas jogar baixa prioridade para depois?
5. O generatedSchedule deve ser persistido inteiro ou derivado de importedTopics + settings?
```

Recomendação inicial:

```txt
1 tópico = 50 min padrão.
Limitar aviso forte acima de 6 tópicos/dia.
Foco por instituições usa prioridade genérica até dados reais.
Essencial filtra temporariamente temas baixa prioridade.
Persistir settings + scheduledTopics, não agenda completa.
