# MEDREV — P2/P3/P4 REVISADO PELA AUDITORIA OPUS

> **Fonte base:** `P2_P3_P4_OPUS_AUDIT_PLAN.md`  
> **Executor de implementação:** `gpt-5.3-codex` ou Sonnet  
> **Reasoning effort:** `high`; usar `xhigh` apenas se mexer em Store + Mentor + Stats + FocusMode no mesmo bloco  
> **Regra:** não executar tudo de uma vez. Implementar em sub-blocos pequenos, com testes entre cada etapa.  
> **Prioridade atual:** rodar antes apenas o hotfix de “Já domino”, português/copy e trilha inicial do Vestibular.

---

## 0. Decisão após auditoria

A auditoria mudou o plano original.

O plano antigo dizia:

```txt
P2 — Estatísticas
P3 — Centro de Erros
P4 — Raciocínio Clínico
```

Isso continua correto, mas agora sabemos os problemas reais:

```txt
1. StatsPanel é um depósito vertical de componentes, sem seções claras.
2. Existem três taxonomias de erro divergentes.
3. calcRaciocinioScore está triplicado e inconsistente.
4. Mentor não consome erro dominante.
5. Raciocínio Clínico não conversa com o FSRS.
6. Não existe metricsRegistry, errorActionMap nem reviewTaskPlanner.
7. Vestibular está bem gateado hoje, mas qualquer feature nova pode vazar medicina se não usar featureEnabled.
```

Portanto, o plano revisado é:

```txt
P2-A — Metrics Registry
P2-B — StatsPanel em 7 seções
P3-A — Unificar taxonomia de erro + errorActionMap
P3-B — ErrorActionCenter + integração pós-sessão/prova/Mentor
P4-A — Unificar score de raciocínio clínico
P4-B — reviewTaskPlanner
P4-C — FocusMode multimodal
P4-D — Conduta/prescrição simulada no Raciocínio Clínico
```

**Não executar P4 antes de P3.**  
O Raciocínio Clínico depende de erro clínico bem classificado.

**Não executar P3 antes de P2-A.**  
Stats precisa de governança para receber erro sem virar outra bagunça.

---

## 1. Pré-condições obrigatórias

Antes de qualquer sub-bloco:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Se houver arquivos untracked críticos:

```txt
mentorSignals
mentorDecisionPolicy
mentorAutopilot
navigationModel
hotfix de domínio/copy/vestibular
```

fazer snapshot/commit antes.

Não fazer:

```txt
commit
deploy
push
instalar libs
mexer em Firebase/Auth/localStorage
criar Activity Log
```

Activity Log fica **pós-Bloco N**.

---

# P2 — Estatísticas e Metrics Registry

## 2. Diagnóstico auditado

A auditoria mostrou que `StatsPanel.jsx` tem cerca de 767 linhas e renderiza, em sequência, ENAMED, padrão de erros, KPIs, heatmap, calibração, forecast, redação ENEM, desempenho por área e painéis avançados.

Problema: isso é um **stream vertical de componentes heterogêneos**, não uma área de diagnóstico.

Também foi confirmado:

```txt
metricsRegistry não existe.
"coletando" está hardcoded.
Raciocínio Clínico não tem seção.
Sistema/DataSafety/LaunchChecklist estão misturados com aprendizagem.
```

---

## P2-A — Criar Metrics Registry

### Objetivo

Centralizar a definição das métricas para que toda métrica tenha:

```txt
o que mede
se dá para confiar
estado vazio
ação recomendada
plataforma
seção
```

### Criar

```txt
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
```

### API

```js
export const METRIC_STATUS = {
  COLLECTING: "collecting",
  LOW_CONFIDENCE: "low_confidence",
  OK: "ok",
  WARNING: "warning",
  CRITICAL: "critical",
};

export function getMetricDefinition(id) {}

export function evaluateMetric(id, value, context = {}) {}

export function getMetricsForSection(section, plat = "res") {}

export function formatMetricValue(id, value, context = {}) {}
```

### Métricas obrigatórias

```txt
trueRetention
todayWorkloadMinutes
overdueReviews
relearningCount
coverageByArea
simuladoAccuracy
enamedGap
dominantError
clinicalReasoningScore
ankiAdherence
weeklyConsistency
```

### Definição padrão

```js
{
  id: "trueRetention",
  label: "Retenção longa",
  shortLabel: "Retenção",
  section: "resumo",
  description: "Estimativa baseada em revisões D21+ e manutenção.",
  emptyState: "Coletando revisões longas",
  confidenceRule: ({ n }) => n >= 5,
  actionWhenLow: "Priorize revisões longas e reduza temas novos por enquanto.",
  platforms: ["res", "vest"],
}
```

### Regras

```txt
Não mostrar 100% com baixa amostra.
Não mostrar ENAMED no Vestibular.
Não mostrar Raciocínio Clínico no Vestibular.
Não duplicar cálculo de readiness.
Não criar dependência circular com Dashboard.
```

### Testes

```js
test("all mandatory metrics have definitions")
test("trueRetention returns collecting without enough data")
test("vest does not receive enamedGap")
test("vest does not receive clinicalReasoningScore")
test("formatMetricValue does not break with null")
test("getMetricsForSection returns section metrics")
```

---

## P2-B — Reorganizar StatsPanel em 7 seções

### Objetivo

Transformar Estatísticas em diagnóstico.

### Alterar

```txt
src/components/StatsPanel.jsx
```

Criar se ajudar:

```txt
src/components/MetricCard.jsx
src/components/StatsSection.jsx
docs/P2_STATS_DECISIONS.md
```

### Nova estrutura

```txt
1. Resumo
2. Aprendizagem
3. Erros
4. Provas/Simulados
5. Raciocínio Clínico
6. Atividade
7. Sistema
```

### Seção 1 — Resumo

Mostrar no máximo:

```txt
Preparo estimado
Retenção longa
Carga de hoje/semana
Revisões vencidas
Relearning aberto
Próxima ação do Mentor
```

Cada card deve ter:

```txt
valor
estado de confiança
descrição curta
ação recomendada
```

### Seção 2 — Aprendizagem

```txt
retenção por área
cobertura por área
temas iniciados/consolidados
FSRS por fase: learning/review/relearning/maintenance
carga futura por minutos
```

### Seção 3 — Erros

Antes do P3:

```txt
erro dominante
erros recentes
alta confiança + erro
tempo
raciocínio
CTA: Centro de Erros será ativado no P3
```

Depois do P3:

```txt
ErrorActionCenter embutido ou linkado
ação corretiva recomendada
```

### Seção 4 — Provas/Simulados

Residência:

```txt
ENAMED / residência
área crítica
gap por área
questões erradas
análise detalhada
```

Vestibular:

```txt
simulados
matéria fraca
evolução de acertos
prova-alvo
```

### Seção 5 — Raciocínio Clínico

Residência apenas.

Antes do P4:

```txt
dados existentes
score, se confiável
casos feitos
casos pendentes
estado coletando se amostra baixa
```

Não criar novo cálculo aqui.

### Seção 6 — Atividade

Antes do Activity Log:

```txt
reviewHistory
sessionReflections
weeklyReviews
enamedAnalises/simulados
heatmap simples
dias ativos
```

Não criar calendário completo.

### Seção 7 — Sistema

Mover para cá:

```txt
DataSafetyPanel
LaunchChecklistPanel
WeeklyReview
integridade
backup
status de sync/auth, se existir
```

### Testes/QA

```txt
Stats mostra 7 seções.
Vestibular não mostra ENAMED.
Vestibular não mostra Raciocínio Clínico.
DataSafety está em Sistema.
Métrica coletando tem explicação.
Build/test/mojibake passam.
```

---

# P3 — Centro de Erros e Ações Corretivas

## 3. Diagnóstico auditado

A auditoria encontrou **três taxonomias de erro divergentes**:

```txt
1. errorTaxonomy.js — moderna/canônica: 8 tipos.
2. readiness.js — legada: lacuna, raciocinio, distractor, descuido, nao_visto, interpretacao.
3. sessionReflection.js — reflexão: conteudo, raciocinio, tempo, energia, distracao, nenhum, memoria.
```

O roadmap pedia 12 tipos.

Erro crítico: se criarmos uma quarta taxonomia, piora tudo.

A solução é:

```txt
estender errorTaxonomy.js
preservar LEGACY_ERROR_MAP
fazer errorActionMap consumir a taxonomia canônica
```

Outro achado importante:

```txt
Mentor hoje não consome erro dominante.
```

P3 deve corrigir isso.

---

## P3-A — Estender taxonomia e criar errorActionMap

### Criar

```txt
src/core/errorActionMap.js
src/core/errorActionMap.test.js
```

### Alterar

```txt
src/core/errorTaxonomy.js
```

### Regra principal

Não criar enum paralelo.

Usar `errorTaxonomy.js` como fonte canônica.

### Tipos canônicos finais

```txt
conteudo
memoria
raciocinio
representacao_problema
diferencial
incerteza_sct
conduta_prescricao
interpretacao
distracao
tempo
confianca_mal_calibrada
estrategia_prova
chute
```

Observação:

```txt
chute pode permanecer como tipo técnico legado/canônico se já existir.
energia e nenhum devem ser tratados como reflection issue, não necessariamente erro de questão.
```

### Compatibilidade legada

Manter mapeamentos:

```txt
lacuna → conteudo
nao_visto → conteudo
distractor → diferencial ou interpretacao
descuido → distracao
raciocinio → raciocinio
interpretacao → interpretacao
```

### errorActionMap

Cada tipo deve gerar:

```js
{
  type,
  label,
  definition,
  correctiveActions,
  preferredTask,
  mentorActionType,
  fsrsEffect,
  platforms
}
```

Exemplos:

```txt
conteudo → revisão curta + questões externas
memoria → FSRS/Anki
raciocinio → mini caso + problem representation
representacao_problema → escrever one-liner + dados discriminantes
diferencial → listar 3 diferenciais + must-not-miss
incerteza_sct → SCT curto
conduta_prescricao → management station educacional
interpretacao → treino de leitura diagnóstica
distracao → bloco cronometrado com checklist
tempo → bloco cronometrado
confianca_mal_calibrada → estimativa prévia + revisão calibrada
estrategia_prova → análise de prova/simulado
```

### Testes

```js
test("all canonical error types have corrective action")
test("legacy lacuna maps to conteudo")
test("legacy distractor maps safely")
test("conduta_prescricao is res only")
test("vest does not receive clinical management task")
test("generated corrective action is compatible with actionInbox")
test("dedupe does not drop corrective actions incorrectly")
```

---

## P3-B — ErrorActionCenter + integração real

### Criar

```txt
src/components/ErrorActionCenter.jsx
src/components/ErrorActionPrompt.jsx
docs/P3_ERROR_ACTION_DECISIONS.md
```

### Alterar

```txt
src/components/StatsPanel.jsx
src/components/FocusMode.jsx
src/components/EnamedProvaAnalyzer.jsx
src/core/mentorSignals.js
src/core/mentorDecisionPolicy.js
```

### Onde aparece

Não criar aba solta.

O Centro de Erros deve aparecer:

```txt
Stats → seção Erros
Mais → ferramenta
Pós-sessão → CTA
Pós-simulado → CTA
Mentor → ação corretiva quando erro dominante é forte
```

### Fluxo após sessão

Depois de FocusMode com erros:

```txt
Sessão concluída.
Erro dominante: Raciocínio.
Ação recomendada: mini caso + problem representation.
[Ver ação corretiva]
```

### Fluxo após simulado

Depois de EnamedProvaAnalyzer:

```txt
Seu erro dominante foi Interpretação.
Ação recomendada: treino de leitura diagnóstica.
[Ver ações]
```

### Mentor

Adicionar em `mentorSignals`:

```js
dominantError
dominantErrorAction
recentErrorPattern
```

Adicionar em `mentorDecisionPolicy`:

```txt
erro dominante com ação corretiva entra depois de prova/simulado pendente e antes de caso clínico/tema novo
```

Não reescrever o Mentor inteiro.

### Critério de aceite

```txt
Erro vira ação.
Mentor usa erro dominante.
Stats seção Erros mostra ação corretiva.
Pós-sessão mostra CTA.
Pós-simulado mostra CTA.
Vestibular recebe ações compatíveis.
Conduta/prescrição não aparece no Vestibular.
```

---

# P4 — Raciocínio Clínico integrado ao FSRS

## 4. Diagnóstico auditado

A auditoria encontrou:

```txt
calcRaciocinioScore triplicado.
illnessScript.js usa notaCaso, mas RaciocinioClinico não grava notaCaso.
RaciocinioClinico grava fase1Ok, fase2Acerto, sctAcerto, anamneseCobertura.
readiness usa fórmula 0.6 fase2 + 0.4 SCT.
UI usa média simples.
Só existem 2 casos clínicos.
Não existe reviewTaskPlanner.
Não existe clinicalCaseMatch.
Brain dump D1 existe, mas é genérico.
Conduta/prescrição simulada ausente.
```

Logo, P4 precisa começar por score, não por UI.

---

## P4-A — Unificar score de raciocínio clínico

### Criar

```txt
src/core/clinicalReasoningScoring.js
src/core/clinicalReasoningScoring.test.js
```

### Alterar

```txt
src/core/readiness.js
src/core/illnessScript.js
src/components/RaciocinioClinico.jsx
src/core/store.js, se necessário
```

### Decisão técnica

Definir contrato único.

Opção recomendada:

```js
{
  problemRepresentationScore,
  hypothesisScore,
  illnessScriptScore,
  sctScore,
  managementScore,
  safetyScore,
  overallScore
}
```

Enquanto dados antigos usam:

```js
fase1Ok
fase2Acerto
sctAcerto
anamneseCobertura
```

Criar adaptador:

```js
normalizeClinicalReasoningProgress(progress)
calculateClinicalReasoningScore(progress)
```

### Fórmula inicial

Sem conduta ainda:

```txt
fase2Acerto 60%
sctAcerto 40%
```

Com conduta no futuro:

```txt
problem representation 20%
hypotheses/differential 25%
illness script recall 20%
SCT 20%
management/safety 15%
```

Mas não aplicar peso de campo inexistente.

### Testes

```js
test("returns null with insufficient data")
test("legacy fase2Acerto/sctAcerto produces expected score")
test("RaciocinioClinico and readiness use the same score")
test("does not show high confidence with only one case")
test("vest returns null or unavailable")
```

---

## P4-B — reviewTaskPlanner

### Criar

```txt
src/core/reviewTaskPlanner.js
src/core/reviewTaskPlanner.test.js
```

### Objetivo

Escolher o tipo de tarefa de revisão conforme:

```txt
tema
stepKey FSRS
erros recentes
plataforma
disponibilidade de caso clínico
```

### API

```js
export function getReviewTaskForStep({ tema, stepKey, history, errors, platform, features }) {}
```

### Retorno

```js
{
  taskType,
  title,
  instructions,
  estimatedMinutes,
  requiredInputs,
  scoring,
  target,
}
```

### Mapeamento inicial

Residência, tema clínico:

```txt
D1 → brain_dump_structured
D4 → illness_script_recall
D7 → mini_case_differential
D21 → sct_management
maintenance → quick_case_or_management
```

Tema não clínico:

```txt
questions
brain_dump_structured
anki
```

Vestibular:

```txt
questions
brain_dump_structured
simulado_review
anki
```

Nunca:

```txt
illness_script
clinical_case
management_station
```

para Vestibular.

### clinicalCaseMatch

Criar helper:

```js
findClinicalCaseForTema(tema, casos, options)
```

Base inicial:

```txt
temaId
temaNormalizado
areaCanonica
keywords
```

Se não houver caso:

```txt
usar mini caso genérico apenas se seguro;
senão cair para questions/brain_dump.
```

### Testes

```js
test("D1 clinical topic returns structured brain dump")
test("D7 clinical topic returns mini case if case exists")
test("D21 clinical topic returns sct_management")
test("vest never returns clinical_case")
test("non clinical topic falls back to questions or brain dump")
```

---

## P4-C — FocusMode multimodal

### Alterar

```txt
src/components/FocusMode.jsx
```

### Objetivo

FocusMode deixa de ser só questões/brain dump genérico.

Ele deve renderizar tarefa vinda de `reviewTaskPlanner`.

### D1 — Brain dump estruturado

Campos:

```txt
1. Definição / quadro geral
2. Diagnóstico
3. Diferenciais
4. Conduta
5. Não pode perder
```

### D4 — Illness Script Recall

Campos:

```txt
Epidemiologia/contexto
Fisiopatologia resumida
Quadro típico
Achados discriminantes
Diagnósticos diferenciais
Conduta inicial
Armadilhas
```

### D7 — Mini caso + diferenciais

Campos:

```txt
problem representation
3 hipóteses
must-not-miss
exame inicial
conduta inicial
```

### D21 — SCT + conduta

Campos:

```txt
hipótese inicial
nova informação
muda probabilidade?
conduta
red flags
```

### Regras

```txt
Só Residência.
Só se meta.modulos.raciocinioClinico === true.
Fallback para fluxo atual se reviewTaskPlanner não retornar tarefa clínica.
Não quebrar questões/acertos.
Não alterar FSRS profundamente.
```

---

## P4-D — Conduta/prescrição simulada em Raciocínio Clínico

### Alterar

```txt
src/components/RaciocinioClinico.jsx
src/core/clinicalReasoningScoring.js
src/constants/casosClinicos.js, se necessário
```

### Adicionar fase

```txt
Conduta e prescrição simulada
```

Campos:

```txt
estabilização
exames iniciais
tratamento inicial
medicações/classes/doses quando houver checklist
internação ou ambulatório
red flags
contraindicações
seguimento
```

### Aviso obrigatório

```txt
Uso educacional. Não aplicar em paciente real.
```

### Score

Adicionar:

```txt
managementScore
safetyScore
dispositionScore
contraindicationScore
```

Se o caso não tiver checklist:

```txt
não pontuar dose específica;
avaliar estrutura do plano.
```

### Critério de aceite

```txt
Raciocínio Clínico cobra conduta.
Score usa mesma fonte canônica.
Erro de conduta_prescricao pode ir para ErrorActionCenter.
Nada aparece no Vestibular.
```

---

# Ordem final de execução

## Agora

Antes de P2/P3/P4:

```txt
HOTFIX — Já domino + copy PT-BR + trilha vestibular
```

Depois:

```txt
P2-A — metricsRegistry
P2-B — StatsPanel em 7 seções
P3-A — errorActionMap + taxonomia unificada
P3-B — ErrorActionCenter + Mentor usando erro dominante
P4-A — clinicalReasoningScoring
P4-B — reviewTaskPlanner
P4-C — FocusMode multimodal
P4-D — conduta/prescrição simulada
```

---

# Prompt curto para executor

```txt
Execute o plano revisado do arquivo MEDREV_P2_P3_P4_REVISADO_PELA_AUDITORIA.md.

Não execute tudo de uma vez. Comece por P2-A.

Regra:
- cada sub-bloco deve rodar check:mojibake, testes e build;
- não instale libs;
- não mexa em Firebase/auth/localStorage;
- não crie Activity Log;
- não faça commit, deploy ou push;
- não liste workspace inteiro.

Ordem:
P2-A → P2-B → P3-A → P3-B → P4-A → P4-B → P4-C → P4-D.
```
