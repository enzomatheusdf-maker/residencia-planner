# MEDREV — P1: Integração Geral de UX, Mentor, Estatísticas e Funções

> **Executor inicial:** Opus Thinking / Claude Code em modo planejamento  
> **Executor posterior:** gpt-5.3-codex / Sonnet por sub-blocos  
> **Objetivo:** parar a expansão caótica de features e reorganizar o MedRev como um produto integrado, simples de usar, acionável e confiável.  
> **Status:** este documento é para auditoria e plano mestre. Não executar tudo de uma vez.

---

## 0. Diagnóstico brutal

O MedRev já tem ideias fortes demais para ser tratado como um app comum:

```txt
FSRS-lite
Mentor
ENAMED / Simulados
Cronograma MEDCOF / Estratégia / Custom
Raciocínio Clínico
Illness Script
Já domino
Anki Audit
Stats
Weekly Review
Action Inbox
Peak Mode
Backup
Onboarding
```

Mas a experiência atual está com um problema clássico de produto em crescimento:

```txt
muitas funções
pouca hierarquia
métrica demais
decisão espalhada
sidebar pesada
Mentor ainda não parece dono da experiência
Stats não explicam o que fazer
Raciocínio Clínico parece módulo lateral
calendário não fecha o loop
erros não viram ação clara
```

O produto está caminhando para virar:

```txt
um painel cheio de recursos
```

quando deveria virar:

```txt
um sistema que diz o que fazer, por quê, como fazer e quando reencontrar.
```

Este P1 existe para integrar o produto.

---

## 1. Tese de produto

O MedRev não deve ser organizado por “features”.

Ele deve ser organizado pelo ciclo real de aprendizagem:

```txt
1. Planejar
2. Executar
3. Registrar
4. Corrigir
5. Reagendar
6. Decidir o próximo passo
```

A interface deve refletir esse ciclo.

### Regra central

Toda função precisa responder:

```txt
Qual tarefa ela cria?
Qual dado ela registra?
Qual erro ela identifica?
Qual ação corretiva ela recomenda?
Qual revisão futura ela agenda?
Como o Mentor usa isso?
```

Se uma feature não responde a isso, ela deve ser:

```txt
1. integrada;
2. colapsada;
3. movida para Avançado;
4. ou removida do fluxo principal.
```

---

## 2. Prioridade real

Antes deste P1, executar P0:

```txt
Bloco N — multiusuário, auth, uid, localStorage, Firebase e isolamento de dados
```

Sem isso, não criar:

```txt
activity log
histórico detalhado
calendário de atividades
backup novo
registro longitudinal
```

Depois estabilizar:

```txt
Bloco K — FSRS-lite v2
Bloco L v2 — Mentor Decision Engine
```

Depois executar P1 dividido.

---

## 3. O que o Opus Thinking deve fazer

Você está em **modo planejamento**.

Não implemente ainda.

Audite o código real e produza um plano cirúrgico.

### Não fazer

```txt
não editar arquivos
não criar componentes
não instalar libs
não fazer commit
não fazer deploy
não fazer push
não listar workspace inteiro
não varrer node_modules/build/audit/backups
```

### Usar apenas comandos escopados

```bash
git status --short
git ls-files src package.json firestore.rules firebase.json .firebaserc
git grep -n "setView\|view ===\|Sidebar\|BottomNav" -- src
git grep -n "mentor\|Mentor\|proximaAcao\|mentorAutopilot\|mentorSignals" -- src
git grep -n "StatsPanel\|Preparo\|Retenção\|readiness\|metric\|coletando" -- src
git grep -n "Raciocinio\|Raciocínio\|illness\|sct\|casosClinicos\|problem" -- src
git grep -n "erro\|tipoErro\|motivoErro\|errorTaxonomy\|ActionInbox" -- src
git grep -n "reviewHistory\|activityLog\|sessionReflection\|weeklyReviews" -- src
git grep -n "platformFeatures\|featureEnabled\|plat === \"vest\"\|plat === 'vest'" -- src
```

Se algum arquivo não existir, registrar como ausente e continuar.

---

## 4. Entrega esperada do Opus

Criar apenas:

```txt
docs/P1_AUDITORIA_INTEGRACAO_UX.md
```

Com estas seções:

```txt
1. Diagnóstico executivo
2. Mapa de features existentes
3. Fluxos atuais do usuário
4. Problemas de arquitetura de informação
5. Problemas do Dashboard
6. Problemas do Mentor
7. Problemas das Estatísticas
8. Problemas do Raciocínio Clínico
9. Problemas do calendário/provider
10. Problemas do Vestibular
11. Dados registrados hoje
12. Dados que deveriam ser registrados
13. O que deve ser principal
14. O que deve ir para Mais/Avançado
15. Plano de implementação em sub-blocos
```

Tabela obrigatória:

```txt
Feature | Tela atual | Core | Store | Persistência | Mentor usa? | Stats usa? | Problema | Ação recomendada
```

---

# PARTE A — Arquitetura de informação

## 5. Problema atual

A sidebar está representando módulos internos, não jornadas do usuário.

Isso gera sensação de produto pesado.

O usuário entra e vê muitas opções, mas não sabe:

```txt
o que fazer agora
o que é obrigatório
o que é avançado
o que é diagnóstico
o que é execução
```

## 6. Modelo novo de navegação

### Desktop

```txt
Hoje
Plano
Estudar
Estatísticas
Banco de Dados
Mais
```

### Mobile

```txt
Hoje
Plano
Estudar
Stats
Mais
```

### Dentro de Mais

```txt
Raciocínio Clínico
ENAMED / Simulados
Anki Audit
Weekly Review
Data Safety
Guia
Ajustes
```

## 7. Regra

Não remover features.

Reclassificar:

```txt
Principal = usado diariamente
Mais = usado ocasionalmente
Stats = diagnóstico
Banco de Dados = cadastros, temas, casos, cronogramas
Ajustes = configuração
```

## 8. Arquivos prováveis

```txt
src/components/Sidebar.jsx
src/components/BottomNav.jsx
src/App.js
src/core/platformFeatures.js
src/core/navigationModel.js
```

Criar depois:

```txt
src/core/navigationModel.js
src/core/navigationModel.test.js
```

Mas nesta etapa o Opus só planeja.

---

# PARTE B — Dashboard deve virar “Hoje”

## 9. Problema atual

O Dashboard mistura:

```txt
comando do dia
métricas
cards
atalhos
diagnóstico
alertas
features avançadas
```

Isso cria ruído.

## 10. Nova função do Dashboard

Dashboard deve responder em 10 segundos:

```txt
O que faço agora?
Por que isso?
Quanto tempo vai levar?
O que vem depois?
```

## 11. Layout ideal

```txt
HOJE

1. Comando do Mentor
   - ação principal
   - motivo
   - tempo estimado
   - botão Começar
   - botão Ver por quê

2. Próximas 2 ações
   - revisão vencida
   - caso clínico / simulado / tema novo

3. Carga de hoje
   - minutos estimados
   - revisões
   - sobrecarga se houver

4. Alertas importantes
   - relearning
   - dados coletando
   - problema de sync/auth

5. Avançado colapsado
```

## 12. O que sair do topo do Dashboard

Mover para Stats ou Avançado:

```txt
gráficos profundos
métricas sem ação
análises longas
painéis de prova detalhados
configuração de calendário
histórico longo
```

---

# PARTE C — Mentor como dono da experiência

## 13. Problema atual

O Mentor ainda parece uma camada em cima do app, não o motor central.

Ele precisa ser a ponte entre:

```txt
FSRS
cronograma
erros
prova/simulado
raciocínio clínico
atividade recente
carga futura
plataforma
```

## 14. Regra de decisão

Ordem da ação principal:

```txt
1. problema de segurança/sync/dado inválido
2. sobrecarga alta
3. relearning
4. revisão vencida
5. revisão de hoje
6. prova/simulado pendente de análise
7. erro dominante com ação corretiva
8. caso clínico devido
9. tema novo se carga permite
10. descanso/bloco leve
```

## 15. Schema obrigatório de ação

```js
{
  id,
  type,
  priority,
  title,
  subtitle,
  reason,
  explain: [],
  cta,
  ctaView,
  estimatedMinutes,
  confidence,
  safety,
  target,
  source
}
```

## 16. Regra crítica

Se ação não tem `target` executável, ela não pode ser botão principal.

Ela vira:

```txt
Ver plano
```

e deve gerar warning interno.

## 17. Arquivos prováveis

```txt
src/core/mentorSignals.js
src/core/mentorDecisionPolicy.js
src/core/mentorAutopilot.js
src/core/mentor.js
src/components/Dashboard.jsx
```

---

# PARTE D — Estatísticas como diagnóstico

## 18. Problema atual

Stats tende a virar depósito de gráfico.

Isso é ruim.

Stats deve ser diagnóstico, não cockpit diário.

## 19. Organização ideal

```txt
Resumo
Aprendizagem
Erros
Raciocínio Clínico
Provas/Simulados
Atividade
Sistema
```

## 20. Métricas precisam de governança

Criar depois:

```txt
src/core/metricsRegistry.js
```

Cada métrica deve ter:

```js
{
  id,
  label,
  description,
  confidenceRule,
  emptyState,
  actionWhenLow,
  dashboardLevel,
  platforms
}
```

## 21. Métricas do Dashboard

Só:

```txt
ação do Mentor
carga de hoje
revisões vencidas
relearning
retenção longa se confiável
```

## 22. Métricas de Stats

Tudo que é diagnóstico profundo:

```txt
retenção por área
erros
prova
raciocínio
atividade
cobertura
calendário
sistema
```

---

# PARTE E — Centro de erros e ações corretivas

## 23. Problema atual

O app pode registrar erro, mas o usuário ainda não tem um local claro para entender:

```txt
errei por quê?
o que faço agora?
isso vira revisão, caso, Anki, questão ou descanso?
```

## 24. Tipos mínimos

```txt
Conteúdo
Memória
Raciocínio
Representação do problema
Diferencial
Incerteza/SCT
Conduta/prescrição
Interpretação
Distração
Tempo
Confiança mal calibrada
Estratégia de prova
```

## 25. Mapa de ações corretivas

Exemplo:

```txt
Conteúdo → revisão curta + questões externas
Memória → FSRS/Anki
Raciocínio → mini caso + problem representation
Diferencial → 3 diferenciais + must-not-miss
Conduta/prescrição → management station
Tempo → bloco cronometrado
Confiança mal calibrada → revisão com estimativa prévia
```

## 26. Arquivos futuros

```txt
src/core/errorActionMap.js
src/components/ErrorActionCenter.jsx
```

---

# PARTE F — Raciocínio Clínico precisa ser integrado ao FSRS

## 27. Problema atual

Raciocínio Clínico como aba separada não resolve o fluxo.

Ele deve aparecer quando o aluno precisa.

## 28. Dois modos

### Modo 1 — caso completo

```txt
1. Vinheta
2. Problem representation
3. Hipóteses + must-not-miss
4. Illness script de memória
5. SCT / nova informação
6. Conduta e prescrição simulada
7. Feedback + reencontro
```

### Modo 2 — revisão dentro do FSRS

```txt
D1: Brain dump estruturado
D4: Illness Script recall
D7: Mini caso + diferenciais
D21: SCT curto + conduta
Manutenção: caso rápido / prescrição simulada
```

## 29. Brain dump para temas grandes

Não usar “escreva tudo que lembra”.

Usar:

```txt
1. definição/quadro geral
2. diagnóstico
3. diferenciais
4. conduta
5. não pode perder
```

## 30. Prescrição/conduta

Obrigatório como simulação educacional.

Campos:

```txt
estabilização
exames iniciais
tratamento inicial
medicações/classes/doses quando checklist existir
internação ou ambulatório
red flags
contraindicações
seguimento
```

Aviso:

```txt
Uso educacional. Não usar para paciente real.
```

## 31. Arquivos futuros

```txt
src/core/reviewTaskPlanner.js
src/core/clinicalReasoningScoring.js
src/components/RaciocinioClinico.jsx
src/components/FocusMode.jsx
```

---

# PARTE G — Calendário e histórico de atividades

## 32. Pré-condição

Só depois do Bloco N.

## 33. Problema atual

O aluno precisa saber:

```txt
o que está por vir
o que foi feito
em que horário
com qual resultado
qual detalhe foi registrado
```

## 34. Activity Log

Criar depois:

```txt
src/core/activityLog.js
```

Tipos:

```txt
fsrs_review
focus_session
clinical_case
exam_analysis
anki
simulado
calendar_import
weekly_review
mentor_action
domain_validation
```

## 35. Histórico

```txt
últimos 30 dias = detalhe rico
até 12 meses = resumo pesquisável
```

## 36. UI futura

```txt
Calendário
Hoje / Semana / Mês

Dia expandido:
08:00 — D1 Apendicite
09:10 — Caso Pré-eclâmpsia
14:30 — Simulado ENAMED
```

Clique mostra:

```txt
tema
etapa
horário
duração
questões/acertos
brain dump
hipóteses
conduta
erros
próxima revisão
```

---

# PARTE H — Vestibular

## 37. Regra

Vestibular não deve receber:

```txt
ENAMED como eixo principal
Raciocínio Clínico
Illness Script
Casos clínicos
Conduta médica
```

Vestibular deve receber:

```txt
cronograma
simulados
matéria fraca
revisão espaçada
Mentor
Activity Log
Stats próprias
```

## 38. Qualquer feature nova deve passar por

```js
featureEnabled(plat, feature)
```

---

# PARTE I — Plano de implementação depois da auditoria

## P1-A — Navegação + Dashboard Hoje

Escopo:

```txt
navigationModel
Sidebar/BottomNav
Dashboard enxuto
Comando do Mentor principal
```

## P1-B — Mentor + Stats mínimos

Escopo:

```txt
mentorAction executável
Stats reorganizada em seções
metricsRegistry
```

## P1-C — Centro de Erros

Escopo:

```txt
errorActionMap
ErrorActionCenter
integração com provas/casos/session reflection
```

## P1-D — Raciocínio Clínico integrado

Escopo:

```txt
reviewTaskPlanner
brain dump estruturado
illness script no FSRS
conduta/prescrição simulada
```

## P1-E — Activity Log / Calendário

Escopo:

```txt
activityLog
calendar histórico/futuro
detail modal
integração com markStep/caso/simulado/Anki
```

---

## 39. Critério de aceite do plano P1

O plano P1 está pronto quando o Opus entregar:

```txt
1. mapa completo de features;
2. lista do que fica principal;
3. lista do que vai para Mais/Avançado;
4. nova arquitetura do Dashboard;
5. nova arquitetura das Stats;
6. regra de decisão do Mentor;
7. plano para Raciocínio Clínico no FSRS;
8. plano para Centro de Erros;
9. plano para Activity Log;
10. sequência segura de implementação.
```

---

## 40. Prompt para o Opus Thinking

Cole no Opus:

```txt
Aja como engenheiro de software sênior, designer de produto sênior e pesquisador em ciência da aprendizagem médica.

Você está em modo planejamento. Não implemente nada.

O MedRev está com funções demais e experiência ruim: sidebar cheia, métricas confusas, Mentor ainda pouco integrado, Stats mal hierarquizadas, Raciocínio Clínico lateral, erros sem ação corretiva clara e funções pouco conectadas.

Use o arquivo MEDREV_P1_INTEGRACAO_UX_MENTOR_STATS.md como fonte de verdade.

Primeiro audite o código com comandos escopados usando git grep/git ls-files. Não liste o workspace inteiro.

Depois gere docs/P1_AUDITORIA_INTEGRACAO_UX.md com:
- diagnóstico executivo;
- mapa de features;
- problemas de UX;
- problemas de arquitetura;
- plano de navegação;
- plano de Dashboard;
- plano de Mentor;
- plano de Stats;
- plano de Centro de Erros;
- plano de Raciocínio Clínico integrado ao FSRS;
- plano de Activity Log;
- plano separado para Vestibular;
- sequência de implementação em sub-blocos.

Não faça commit, deploy ou push.
Não instale libs.
Não edite arquivos de implementação.
```
