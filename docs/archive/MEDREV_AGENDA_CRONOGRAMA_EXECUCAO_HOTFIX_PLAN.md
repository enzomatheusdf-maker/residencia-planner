# MEDREV — Hotfix/Implementação: Agenda, Cronograma, ENAMED, CSV e Execução do Plano

> **Arquivo sugerido no repo:** `docs/MEDREV_AGENDA_CRONOGRAMA_EXECUCAO_HOTFIX_PLAN.md`  
> **Objetivo:** corrigir os problemas atuais de Agenda/Cronograma/Dashboard e fechar o loop operacional: **plano → agenda → mentor → execução → revisão**.  
> **Executor recomendado:** GPT-5.5 High para Agenda/Mentor/Dashboard; GPT-5.4 Medium para CSV/UI/copy.  
> **Regra central:** não projetar revisões FSRS futuras hipotéticas. A Agenda deve mostrar **apenas próxima revisão real agendada**, temas novos planejados, atrasadas e tarefas manuais/simulados reais.

---

# 0. Problemas relatados

## Crash ao clicar em “Ver agenda” no Dashboard

Erro relatado:

```txt
Element type is invalid: got undefined
```

Observação:

```txt
A navegação App → Dashboard → Cronograma/Agenda foi inspecionada estaticamente e os imports parecem resolver.
O erro parece depender de estado runtime específico.
O ErrorBoundary foi colocado como rede de proteção, mas ainda falta encontrar a causa raiz.
```

Necessário:

```txt
Adicionar smoke tests de renderização e diagnóstico de componentes undefined.
Se o erro persistir, coletar o primeiro componente no stack do overlay vermelho.
```

---

## Botões de desenvolvimento vazando

Problemas:

```txt
"Usar amostra de desenvolvimento" aparece para usuário.
"Ver mapeamento" aparece sem utilidade clara.
```

Decisão:

```txt
Esconder ambos atrás de devOnly.
Substituir por estatísticas ENAMED contextualizadas ao calendário/plano ativo.
```

---

## ENAMED genérico

Problemas:

```txt
Recomendação ENAMED é hardcoded/genérica.
Incidência aparece por área, não por tema específico.
O app já possui dados ENAMED_HOTNESS/getEnamedIntel/findHotnessSubarea, mas não estão totalmente ligados ao tema do calendário.
```

Decisão:

```txt
A recomendação deve usar tema/subárea real do item do cronograma.
Se não houver match por tema, fallback para subárea.
Se não houver subárea, fallback para área.
Se não houver dados suficientes, mostrar "coletando".
```

---

## Falta calendário de amostra

Problema:

```txt
Não existe calendário de amostra útil para usuário testar o fluxo.
```

Decisão:

```txt
Adicionar calendário de amostra MedRev, não dev-only, com poucos temas e distribuição real.
Não usar conteúdo proprietário de terceiros.
```

---

## CSV e tutorial ausentes na UI

Problema:

```txt
Parser calendarImportCsv.js já existe, mas falta botão/aba de importação CSV na UI.
Falta template baixável e tutorial de conversão por IA.
```

Decisão:

```txt
Adicionar aba CSV no CalendarImportWizard.
Adicionar upload .csv, textarea, template e instruções.
Não implementar PDF automático.
```

---

## Deck Anki opcional

Problema:

```txt
"Deck Anki opcional" não é core do MedRev e aumenta ruído.
```

Decisão:

```txt
Remover do fluxo principal.
Se mantiver, esconder em Avançado/Mais; não mostrar no onboarding/cronograma principal.
```

---

## Cronogramas prontos não redistribuem

Problema:

```txt
MedCof/Estratégia/providers prontos não mudam disposição conforme número de temas por semana.
Temas de blocos parecem ocultados ou limitados.
```

Decisão:

```txt
Não reduzir nem ocultar temas.
Redistribuir todos os temas para semanas futuras conforme capacidade.
Aplicar limite sugerido de 30 temas/semana.
Mostrar em quantas semanas terminaria.
```

Tempos aproximados:

```txt
D0: 60–90 min
D1: 30 min
D4/D7/D21/manutenção: 30–45 min
```

---

## Agenda está projetando revisões futuras demais

Problema:

```txt
Projetar D1, D4, D7, D21 no calendário antes do aluno concluir cada revisão é falso, porque FSRS pode remarcar datas conforme desempenho.
```

Decisão:

```txt
Agenda deve mostrar apenas:
1. próxima revisão real agendada por tema;
2. revisões vencidas;
3. temas novos planejados;
4. simulados/tarefas manuais reais;
5. weekly review quando liberado.
```

Não mostrar:

```txt
D4, D7, D21 futuros hipotéticos antes da revisão anterior ser concluída.
```

---

## Dashboard não mostra temas novos do dia

Problema:

```txt
O plano de hoje do Dashboard não inclui corretamente temas novos do dia.
```

Decisão:

```txt
Plano de hoje deve combinar:
- revisões reais;
- temas novos planejados para hoje;
- atrasadas;
- simulados/tarefas reais.
```

A prioridade deve ser orientada pelo Mentor:

```txt
maior retorno / menor tempo / urgência / risco de esquecimento.
```

---

## Execução do plano não fecha o loop

Problema:

```txt
Usuário não consegue aceitar plano, abrir plano, entender o que fazer e iniciar com um botão.
```

Decisão:

```txt
Criar fluxo:
Aceitar plano → abrir execução do plano → ver tarefas do dia → iniciar tarefa → concluir → atualizar agenda/mentor.
```

---

# 1. Princípios não negociáveis

```txt
1. Não virar banco de questões.
2. Não criar BI pesado.
3. Não mexer em Data Safety/Auth/Firestore neste bloco.
4. Não reescrever FSRS.
5. Não projetar revisões FSRS futuras hipotéticas.
6. Não misturar ENAMED/Raciocínio Clínico no Vestibular.
7. Não usar conteúdo proprietário de terceiros em calendário de amostra.
8. Não ocultar temas de blocos; apenas distribuir para mais semanas.
9. Não deixar botão DEV visível em produção.
10. Toda ação do Dashboard precisa ter target executável.
```

---

# 2. Ordem recomendada

```txt
AGD0 — Crash "Ver agenda" e smoke tests
AGD1 — agendaEngine next-review-only
AGD2 — Plano de hoje com temas novos + fila inteligente
CAL1 — Redistribuição real dos cronogramas prontos
CSV1 — CSV UI + tutorial + calendário de amostra
ENM1 — ENAMED contextual por tema/subárea
UX1 — Remover DEV buttons e deck Anki do fluxo principal
EXEC1 — Execução do plano: aceitar, abrir, fazer
DASH1 — Dashboard integrando plano de hoje e Agenda
QA1 — testes, mobile, copy e regressão
```

---

# 3. Blocos de implementação para Codex

---

## BLOCO AGD0 — Crash “Ver agenda” + diagnóstico de undefined component

### Modelo recomendado

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/App.js
src/components/Cronograma.jsx
src/components/AgendaMonthGrid.jsx
src/components/AgendaDayDetails.jsx
src/components/AgendaTaskItem.jsx
src/components/ErrorBoundary.jsx
src/components/__tests__/AgendaRender.test.jsx
src/components/__tests__/CronogramaAgendaRender.test.jsx
```

### Arquivos proibidos

```txt
src/core/fsrs.js
src/core/store.js
src/services/firebase.js
firestore.rules
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO AGD0 — Crash "Ver agenda".

Problema:
Ao clicar em "Ver agenda" no Dashboard ocorre:
Element type is invalid: got undefined.
A inspeção estática de imports/lazy não achou erro, e o crash parece depender de estado runtime.

Objetivo:
1. Impedir white-screen com ErrorBoundary.
2. Criar smoke tests de renderização.
3. Adicionar diagnóstico dev-only para componente undefined.
4. Corrigir qualquer import/export incorreto encontrado.

Arquivos permitidos:
- src/App.js
- src/components/Cronograma.jsx
- src/components/AgendaMonthGrid.jsx
- src/components/AgendaDayDetails.jsx
- src/components/AgendaTaskItem.jsx
- src/components/ErrorBoundary.jsx
- src/components/__tests__/AgendaRender.test.jsx
- src/components/__tests__/CronogramaAgendaRender.test.jsx

Não alterar:
- fsrs.js
- store.js
- Firebase/Auth/localStorage
- firestore.rules

Tarefas:
1. Garantir ErrorBoundary envolvendo a view Cronograma/Agenda de Residência e Vestibular com paridade.
2. Criar teste que renderiza Cronograma na aba Plano.
3. Criar teste que renderiza Cronograma na aba Agenda.
4. Criar teste que renderiza AgendaMonthGrid, AgendaDayDetails e AgendaTaskItem isolados com props mínimas.
5. Verificar imports lucide-react usados nesses componentes; remover ícones inexistentes.
6. Verificar default/named exports dos componentes Agenda.
7. Se algum componente vier de map/dicionário, adicionar fallback para componente inválido.
8. Em dev, se algum component resolver undefined, console.error com nome da chave.
9. Não mascarar erro em produção além do ErrorBoundary.

Rode:
npm test -- --watchAll=false src/components/__tests__/AgendaRender.test.jsx src/components/__tests__/CronogramaAgendaRender.test.jsx
npm test -- --watchAll=false
npm run build

Pare e entregue:
- causa encontrada ou "não reproduzido";
- proteção adicionada;
- testes criados;
- se ainda precisar stack do overlay, diga exatamente qual dado coletar.
```

---

## BLOCO AGD1 — agendaEngine next-review-only

### Modelo recomendado

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/agendaEngine.js
src/core/agendaEngine.test.js
```

### Prompt

```txt
Execute somente BLOCO AGD1 — agendaEngine next-review-only.

Problema:
A Agenda não deve projetar D1/D4/D7/D21 futuros hipotéticos, porque o FSRS pode remarcar datas conforme desempenho.

Objetivo:
Alterar agendaEngine para mostrar apenas a próxima revisão real agendada de cada tema.

Arquivos permitidos:
- src/core/agendaEngine.js
- src/core/agendaEngine.test.js

Não alterar:
- fsrs.js
- store.js
- componentes
- Mentor
- Dashboard

Regras:
1. Para cada tema, gerar no máximo 1 item de revisão futura: a próxima etapa pendente real.
2. Não gerar D4 se D1 ainda não foi concluído.
3. Não gerar D7 se D4 ainda não foi concluído.
4. Não gerar D21 se D7 ainda não foi concluído.
5. Revisões vencidas continuam aparecendo como overdue/catchup.
6. Temas novos planejados continuam aparecendo como new_topic.
7. Se tema estiver em relearning, priorizar item de relearning.
8. Se step atual não tiver data real, não inventar.
9. Agenda pode mostrar até 12 meses à frente, mas só com itens reais/planejados.

Testes:
1. Tema com D0 feito e D1 agendado -> gera apenas D1.
2. Tema com D1 pendente e D4 no objeto -> não gera D4 se D1 não concluído.
3. Tema com D1 concluído e D4 agendado -> gera D4.
4. Tema com várias datas futuras hipotéticas -> gera somente próxima pendente.
5. Relearning aparece antes de revisão comum.
6. new_topic não é afetado.

Rode:
npm test -- --watchAll=false src/core/agendaEngine.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO AGD2 — Plano de hoje com temas novos + fila inteligente

### Modelo recomendado

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/agendaEngine.js
src/core/agendaEngine.test.js
src/core/mentorSignals.js
src/core/mentorSignals.test.js
```

### Prompt

```txt
Execute somente BLOCO AGD2 — Plano de hoje com temas novos.

Objetivo:
Garantir que o plano de hoje inclua temas novos planejados para o dia e revisões reais, em ordem inteligente de prioridade.

Arquivos permitidos:
- src/core/agendaEngine.js
- src/core/agendaEngine.test.js
- src/core/mentorSignals.js
- src/core/mentorSignals.test.js

Não alterar:
- Dashboard
- Cronograma UI
- Store
- FSRS
- Firebase/Auth

Tarefas:
1. buildAgendaItems deve incluir new_topic com scheduledDate de hoje.
2. getAgendaDaySummary deve retornar:
   - totalItems;
   - estimatedMinutes;
   - reviewCount;
   - newTopicCount;
   - overdueCount;
   - firstAction;
   - overloaded.
3. Criar/ajustar sortAgendaItemsForDay para priorizar:
   a. relearning;
   b. overdue crítico;
   c. revisão de hoje com alta prioridade/risco;
   d. new_topic com maior retorno/menor tempo;
   e. simulado/pós-simulado;
   f. tarefas manuais.
4. Score de new_topic:
   - prioridade/incidência/ENAMED se disponível;
   - tema crítico > alta > média > baixa;
   - menor tempo estimado ganha leve boost;
   - não deixar tempo sozinho dominar relevância.
5. mentorSignals deve expor agendaTodaySummary e firstAction.
6. Não mostrar ENAMED no Vestibular.

Rode:
npm test -- --watchAll=false src/core/agendaEngine.test.js src/core/mentorSignals.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO CAL1 — Redistribuir cronogramas prontos sem ocultar temas

### Modelo recomendado

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/scheduleWizard.js
src/core/scheduleWizard.test.js
src/core/calendarDistribution.js
src/core/calendarDistribution.test.js
src/components/Cronograma.jsx
src/components/CronogramaSettingsModal.jsx
```

### Prompt

```txt
Execute somente BLOCO CAL1 — Redistribuição real dos cronogramas prontos.

Problema:
Calendários prontos/providers não redistribuem temas conforme número de temas por semana/dia. Temas parecem ocultados/limitados.

Objetivo:
Redistribuir todos os temas para mais semanas conforme capacidade, sem reduzir nem ocultar blocos.

Arquivos permitidos:
- src/core/scheduleWizard.js
- src/core/scheduleWizard.test.js
- src/core/calendarDistribution.js
- src/core/calendarDistribution.test.js
- src/components/Cronograma.jsx
- src/components/CronogramaSettingsModal.jsx

Não alterar:
- FSRS
- Store profundo, exceto meta/calendarSettings via action existente
- Firebase/Auth
- Dashboard
- Mentor

Regras:
1. Limite padrão recomendado: 30 temas novos por semana.
2. Se o bloco/provider tiver mais temas do que a capacidade, empurrar overflow para semanas futuras.
3. Nunca ocultar tema.
4. Nunca apagar tema.
5. Nunca iniciar D0 automaticamente.
6. Mostrar: "Nesse ritmo, você termina os temas em X semanas."
7. Mostrar aviso se exceder 30 temas/semana.
8. D0 estimado:
   - padrão: 75 min;
   - mínimo: 60 min;
   - extenso/crítico: 90 min.
9. Revisões estimadas:
   - D1: 30 min;
   - D4/D7/D21: 30–45 min.
10. A distribuição deve preservar:
   - semana/bloco original quando possível;
   - ordem original;
   - prioridade/incidência.
11. Se usuário escolher menor capacidade, apenas espalhar para mais semanas.

Testes:
- bloco com 60 temas e cap 30/semana -> 2 semanas;
- bloco com 75 temas e cap 30/semana -> 3 semanas;
- nenhum tema é perdido;
- estimatedDuration total aparece;
- warnings corretos.

Rode:
npm test -- --watchAll=false src/core/scheduleWizard.test.js src/core/calendarDistribution.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO CSV1 — CSV UI + tutorial + calendário de amostra

### Modelo recomendado

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/components/CalendarImportWizard.jsx
src/core/calendarImportCsv.js
src/core/calendarProvider.js
src/constants/sampleCalendars.js
src/constants/sampleCalendars.test.js
```

### Prompt

```txt
Execute somente BLOCO CSV1 — CSV UI + tutorial + calendário de amostra.

Problemas:
- Parser CSV existe, mas UI ainda não tem upload/template.
- Não há calendário de amostra.
- PDF automático não deve ser implementado.

Arquivos permitidos:
- src/components/CalendarImportWizard.jsx
- src/core/calendarImportCsv.js
- src/core/calendarProvider.js
- src/constants/sampleCalendars.js
- src/constants/sampleCalendars.test.js

Não alterar:
- Store
- Dashboard
- Mentor
- FSRS
- Firebase/Auth

Tarefas:
1. Adicionar aba CSV no CalendarImportWizard.
2. Upload de .csv.
3. Textarea para colar CSV.
4. Botão "Baixar modelo CSV".
5. Usar CSV_TEMPLATE_HEADER e exemplo de linhas.
6. Mostrar erros/warnings por linha.
7. Preview dos temas antes de confirmar.
8. Adicionar tutorial:
   "Se seu cronograma está em PDF, copie o texto e peça para uma IA converter para CSV no modelo MedRev."
9. Incluir prompt copiável:
   "Transforme este cronograma em CSV com as colunas semana,dia,data,area,tema,subtema,ordem,duracaoMin,prioridade,observacoes. Não invente temas. Se não houver data, deixe vazio."
10. Não implementar PDF automático.
11. Criar calendário de amostra MedRev:
   - 2 a 4 semanas;
   - temas genéricos;
   - não usar conteúdo proprietário;
   - botão "Usar calendário de amostra" visível para usuário novo.
12. Botões de DEV ficam para UX1, não misturar.

Rode:
npm test -- --watchAll=false src/core/calendarImportCsv.test.js src/core/calendarProvider.test.js src/constants/sampleCalendars.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO ENM1 — ENAMED contextual por tema/subárea

### Modelo recomendado

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/enamedIntel.js
src/core/enamedIntel.test.js
src/core/mentorSignals.js
src/core/mentorSignals.test.js
src/components/Dashboard.jsx
src/components/Cronograma.jsx
```

### Prompt

```txt
Execute somente BLOCO ENM1 — ENAMED contextual por tema/subárea.

Problemas:
- Recomendação ENAMED está genérica/hardcoded.
- Incidência aparece só por área.
- Já existem dados ENAMED_HOTNESS/getEnamedIntel/findHotnessSubarea, mas falta ligar ao tema específico do calendário.

Objetivo:
Mostrar estatística ENAMED contextualizada com o tema real do calendário/plano ativo.

Arquivos permitidos:
- src/core/enamedIntel.js
- src/core/enamedIntel.test.js
- src/core/mentorSignals.js
- src/core/mentorSignals.test.js
- src/components/Dashboard.jsx
- src/components/Cronograma.jsx

Não alterar:
- Store
- FSRS
- Firebase/Auth
- Vestibular flow

Tarefas:
1. Criar/ajustar getEnamedTopicIntel(topic, context).
2. Matching:
   - tema exato/normalizado;
   - subárea via findHotnessSubarea;
   - área como fallback;
   - collecting se nada encontrado.
3. Retornar:
   - area;
   - subarea;
   - topicName;
   - incidenceLabel;
   - priorityScore;
   - evidence;
   - recommendation;
   - confidence.
4. Substituir string hardcoded de recomendação ENAMED.
5. No Cronograma, mostrar badge contextual no tema:
   - alta incidência;
   - subárea quente;
   - sem dados suficientes.
6. No Dashboard, "Gargalo ENAMED" deve explicar:
   - tema/subárea;
   - por que é gargalo;
   - qual ação;
   - CTA.
7. Em Vestibular, não mostrar ENAMED.
8. Não inventar dado. Se não tiver match, mostrar "dados insuficientes".

Rode:
npm test -- --watchAll=false src/core/enamedIntel.test.js src/core/mentorSignals.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX1 — Remover DEV buttons e deck Anki do fluxo principal

### Modelo recomendado

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/components/Cronograma.jsx
src/components/CalendarMappingPanel.jsx
src/components/CalendarImportWizard.jsx
src/components/OnboardingWizardV2.jsx
src/core/devFlags.js
```

### Prompt

```txt
Execute somente BLOCO UX1 — remover ruído DEV/Anki do fluxo principal.

Problemas:
- "Usar amostra de desenvolvimento" vaza para usuário.
- "Ver mapeamento" não faz sentido no fluxo principal.
- "Deck Anki opcional" aumenta ruído e não é core.

Objetivo:
Esconder botões DEV e remover Anki opcional do fluxo principal.

Arquivos permitidos:
- src/components/Cronograma.jsx
- src/components/CalendarMappingPanel.jsx
- src/components/CalendarImportWizard.jsx
- src/components/OnboardingWizardV2.jsx
- src/core/devFlags.js

Não alterar:
- Store
- FSRS
- Mentor
- Dashboard
- Firebase/Auth

Tarefas:
1. Criar ou usar devOnly flag:
   - process.env.NODE_ENV !== "production" ou helper já existente.
2. Esconder "Usar amostra de desenvolvimento" atrás de devOnly.
3. Esconder "Ver mapeamento" atrás de devOnly, exceto se houver modo admin explícito.
4. No lugar, mostrar stats ENAMED contextualizadas quando disponíveis.
5. Remover "deck Anki opcional" do fluxo principal.
6. Se precisar manter, mover para Avançado/Mais com copy:
   "Opcional: exportar para Anki".
7. Garantir que nada quebra quando devOnly=false.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO EXEC1 — Execução do plano: aceitar, abrir, fazer

### Modelo recomendado

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/planExecution.js
src/core/planExecution.test.js
src/components/Dashboard.jsx
src/components/Cronograma.jsx
src/components/AgendaDayDetails.jsx
src/components/AgendaTaskItem.jsx
src/core/mentorAutopilot.js
src/core/mentorAutopilot.test.js
```

### Prompt

```txt
Execute somente BLOCO EXEC1 — Execução do plano.

Problema:
O usuário não consegue aceitar plano, abrir plano, entender o que fazer e iniciar com um botão.

Objetivo:
Criar fluxo operacional do plano:
Aceitar → abrir → ver tarefas → iniciar → concluir.

Arquivos permitidos:
- src/core/planExecution.js
- src/core/planExecution.test.js
- src/components/Dashboard.jsx
- src/components/Cronograma.jsx
- src/components/AgendaDayDetails.jsx
- src/components/AgendaTaskItem.jsx
- src/core/mentorAutopilot.js
- src/core/mentorAutopilot.test.js

Não alterar:
- Store profundo, exceto usar actions existentes de aceitar/completePlanSetup se já existem
- FSRS
- Firebase/Auth
- Data Safety

Tarefas:
1. Criar helper buildPlanExecutionState({ agendaTodaySummary, planHealth, mentorAction }).
2. Estados:
   - no_plan;
   - plan_ready_unaccepted;
   - plan_accepted_today;
   - in_progress;
   - done_today;
   - blocked.
3. Dashboard:
   - se plan_ready_unaccepted: botão "Aceitar plano de hoje";
   - após aceitar: mostrar "Abrir plano";
   - ao abrir: listar tarefas do dia;
   - cada tarefa tem botão primário:
     - "Revisar";
     - "Estudar tema";
     - "Registrar simulado";
     - "Ver plano".
4. AgendaTaskItem:
   - usar target executável;
   - se target ausente, fallback "Ver plano".
5. Mentor:
   - não recomendar ação sem target.
6. Não criar Activity Log.
7. Não salvar evento de histórico ainda.
8. Testes para cada estado.

Rode:
npm test -- --watchAll=false src/core/planExecution.test.js src/core/mentorAutopilot.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO DASH1 — Dashboard com plano de hoje e Agenda

### Modelo recomendado

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/components/Dashboard.jsx
src/core/agendaEngine.js
src/core/mentorSignals.js
src/core/planExecution.js
```

### Prompt

```txt
Execute somente BLOCO DASH1 — Dashboard com plano de hoje.

Pré-condição:
AGD1, AGD2 e EXEC1 concluídos.

Objetivo:
Dashboard deve mostrar plano de hoje real com temas novos e revisões, priorizado pelo Mentor, sem virar calendário completo.

Arquivos permitidos:
- src/components/Dashboard.jsx
- src/core/agendaEngine.js
- src/core/mentorSignals.js
- src/core/planExecution.js

Não alterar:
- Store
- FSRS
- Firebase/Auth
- Cronograma settings

Tarefas:
1. Mostrar bloco:
   "Hoje: X tarefas · Y min"
2. Mostrar até 3 tarefas principais:
   - revisão;
   - tema novo;
   - atraso;
   em ordem de prioridade.
3. Botões:
   - Começar primeira tarefa;
   - Ver agenda;
   - Ajustar plano.
4. Se agenda vazia:
   - "Nada pendente hoje"
   - CTA: Ver plano ou Criar cronograma.
5. Se sem plano:
   - CTA: Criar cronograma.
6. Não mostrar "Gargalo ENAMED" genérico.
7. Não mostrar calendário mensal no Dashboard.
8. Manter Avançado colapsado.
9. Não duplicar ActionInbox se o plano de hoje já substitui a fila.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO QA1 — QA final e regressões

### Modelo recomendado

```txt
GPT-5.4 Medium
```

### Prompt

```txt
Execute somente BLOCO QA1 — QA final.

Objetivo:
Rodar varredura de regressão após Agenda/Cronograma/Dashboard.

Não implemente feature nova.

Tarefas:
1. Rodar:
   npm run check:mojibake
   npm test -- --watchAll=false
   npm run build
2. Buscar strings proibidas:
   git grep -n "Usar amostra de desenvolvimento\\|Ver mapeamento\\|deck Anki opcional\\|Element type is invalid\\|FSRS de hoje" -- src
3. Verificar:
   - Dashboard sem crash em Ver agenda;
   - Agenda renderiza;
   - CSV aparece no wizard;
   - ENAMED não aparece no Vestibular;
   - cronograma redistribui sem ocultar temas;
   - Agenda não projeta revisões futuras hipotéticas;
   - plano de hoje mostra temas novos.
4. Se houver warning de import não usado, limpar.
5. Não mexer em Data Safety.

Entregar relatório:
- testes;
- build;
- strings encontradas;
- pendências reais.
```

---

# 4. Critérios globais de pronto

```txt
[ ] Ver agenda não causa crash.
[ ] ErrorBoundary protege a view, mas causa raiz foi testada.
[ ] Agenda mostra só próxima revisão real por tema.
[ ] Agenda inclui temas novos planejados do dia.
[ ] Dashboard mostra plano de hoje com revisões + temas novos.
[ ] Cronogramas prontos redistribuem todos os temas.
[ ] Limite 30 temas/semana aplicado como referência.
[ ] Tempo aproximado aparece.
[ ] CSV importável via UI.
[ ] Template CSV baixável.
[ ] Tutorial CSV/IA presente.
[ ] Calendário de amostra presente.
[ ] Botões DEV escondidos em produção.
[ ] Deck Anki fora do fluxo principal.
[ ] ENAMED contextual por tema/subárea.
[ ] Vestibular sem ENAMED/casos/conduta.
[ ] Execução do plano tem aceitar → abrir → fazer.
[ ] npm test verde.
[ ] npm build verde.
[ ] mojibake verde.
```

---

# 5. Prompt base para cada bloco

```txt
Antes de implementar, leia:
- docs/MEDREV_CONTEXT_FOR_AI.md
- docs/MEDREV_AGENDA_CRONOGRAMA_EXECUCAO_HOTFIX_PLAN.md

Execute somente o BLOCO [NOME].

Não execute blocos futuros.
Não mexa fora dos arquivos permitidos.
Não faça refactor global.
Não instale libs.
Não faça commit, push ou deploy.
Não liste workspace inteiro.
Use git grep/git ls-files.

Se precisar mexer em store.js, Firebase/Auth/localStorage, firestore.rules ou fsrs.js fora do escopo, pare e peça autorização.

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

# 6. Notas para o operador

## Sobre o crash

Ainda é útil coletar o stack exato:

```txt
No overlay vermelho, expandir o primeiro ▶ e copiar o primeiro componente acima dos frames internos do React.
```

Isso deve apontar se o culpado é:

```txt
AgendaMonthGrid
AgendaDayDetails
AgendaTaskItem
Cronograma
algum ícone lucide undefined
algum componente lazy default/named errado
algum map de view retornando undefined
```

## Sobre projeção FSRS

Não aceitar implementação que mostre:

```txt
D1, D4, D7, D21 futuros todos no calendário antes da conclusão da revisão anterior.
```

Isso é falso pedagogicamente.

## Sobre cronogramas prontos

Não reduzir o número de temas.

Certo:

```txt
60 temas com cap 30/semana → termina em 2 semanas.
```

Errado:

```txt
60 temas com cap 30/semana → mostra só 30 e oculta 30.
```

## Sobre PDF

Não implementar PDF agora.

## Sobre ENAMED

Não usar copy genérica:

```txt
"Faça temas de Preventiva porque cai muito."
```

Usar:

```txt
"Indicadores de Saúde aparece como subárea prioritária. Você tem baixa cobertura nesse tema; fazer D0 hoje tem alto retorno."
```
