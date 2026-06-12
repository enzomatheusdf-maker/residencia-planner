# MEDREV — P2: Redesign da Aba Estatísticas + Metrics Registry

> **Executor inicial:** Opus Thinking em modo planejamento  
> **Executor posterior:** `gpt-5.3-codex` ou Sonnet  
> **Reasoning effort:** `high`; usar `xhigh` se mexer em Stats + Mentor + Dashboard juntos  
> **Objetivo:** transformar a aba Estatísticas em área de diagnóstico, explicação e ação. Não deve ser painel confuso de cards.

---

## 0. Diagnóstico

A aba Estatísticas hoje tende a funcionar como depósito de componentes:

```txt
readiness
ENAMED
EnamedMapa
EnamedProvaAnalyzer
WeeklyReview
DataSafety
LaunchChecklist
heatmap
painéis avançados
```

O usuário entra e não sabe:

```txt
Qual métrica importa?
O que significa?
Dá para confiar?
O que fazer agora?
```

A auditoria P1 identificou `metricsRegistry` ausente e estados "coletando" hardcoded espalhados. Portanto, P2 deve criar governança de métricas e reorganizar Stats.

---

## 1. Escopo

### Implementar

```txt
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
src/components/StatsPanel.jsx
src/components/MetricCard.jsx       [se não existir]
src/components/StatsSection.jsx     [se ajudar]
docs/P2_STATS_DECISIONS.md
```

### Não implementar

```txt
Activity Log completo
Centro de Erros completo
Raciocínio Clínico v2
Refactor profundo do Mentor
Firebase/auth/localStorage
```

---

## 2. Nova arquitetura da aba Estatísticas

Stats deve ter 7 seções:

```txt
1. Resumo
2. Aprendizagem
3. Erros
4. Provas/Simulados
5. Raciocínio Clínico
6. Atividade
7. Sistema
```

Pode ser:

```txt
tabs
accordion
cards com navegação interna
```

Preferência: tabs/segmented control no topo em desktop e accordion no mobile se necessário.

---

## 3. Seção 1 — Resumo

Objetivo: responder “como estou de verdade?”

Mostrar no máximo:

```txt
Preparo estimado
Retenção longa
Carga semanal
Revisões vencidas
Relearning aberto
Próxima melhor ação do Mentor
```

Não mostrar gráfico complexo.

Cada card deve ter:

```txt
valor
estado de confiança
explicação curta
ação recomendada
```

Exemplo:

```txt
Retenção longa
Coletando D21+
Ainda preciso de revisões longas para estimar retenção real.
Ação: mantenha as revisões; evite interpretar isso como nota.
```

---

## 4. Seção 2 — Aprendizagem

Mostrar:

```txt
retenção por área
cobertura por área
temas iniciados/consolidados
FSRS: learning/review/relearning/maintenance
carga futura por minutos
```

Ação:

```txt
"Reduzir tema novo"
"Priorizar revisões longas"
"Recuperar temas em relearning"
```

---

## 5. Seção 3 — Erros

Nesta fase P2, se ErrorActionCenter ainda não existir, criar apenas placeholders funcionais de leitura, não a feature completa.

Mostrar:

```txt
erro dominante
erro por área
erros recentes
confiança mal calibrada, se houver dados
CTA: Ver ações corretivas
```

Se `errorActionMap` ainda não existe:

```txt
mostrar "Centro de Erros será ativado no P3"
```

Não criar lógica duplicada. P3 cria o core definitivo.

---

## 6. Seção 4 — Provas/Simulados

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

Regra:

```txt
ENAMED não aparece no Vestibular.
```

---

## 7. Seção 5 — Raciocínio Clínico

Residência apenas.

Mostrar:

```txt
score de raciocínio
casos feitos
casos devidos
score por fase:
- problem representation
- hipóteses
- illness recall
- SCT
- conduta/prescrição
```

Se P4 ainda não foi implementado:

```txt
mostrar seção simples com dados existentes;
não inventar métricas;
não criar calcRaciocinioScore duplicado.
```

Vestibular:

```txt
não mostrar esta seção.
```

---

## 8. Seção 6 — Atividade

Antes do Activity Log completo:

```txt
usar dados existentes:
reviewHistory
sessionReflections
weeklyReviews
enamedAnalises
simulados
```

Mostrar:

```txt
dias ativos
sessões recentes
heatmap simples
volume semanal
```

Não criar calendário histórico completo aqui. Isso é P1-E/Pós-N.

---

## 9. Seção 7 — Sistema

Mover para cá:

```txt
DataSafetyPanel
LaunchChecklistPanel
WeeklyReview
debug de integridade
backup
status de sync/auth, se existir
```

Se a UX ficar pesada:

```txt
Data Safety e Launch Checklist podem ir para Mais > Sistema.
```

---

## 10. Metrics Registry

Criar `src/core/metricsRegistry.js`.

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

### Definição mínima

```js
{
  id: "trueRetention",
  label: "Retenção longa",
  shortLabel: "Retenção",
  section: "resumo",
  description: "Estimativa baseada em revisões D21+ e manutenção.",
  emptyState: "Coletando D21+",
  confidenceRule: ({ n }) => n >= 5,
  actionWhenLow: "Priorize revisões longas e reduza tema novo.",
  platforms: ["res", "vest"],
}
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

---

## 11. Regras de UX para métricas

Toda métrica deve ter:

```txt
label humano
descrição curta
estado vazio
confiança
ação recomendada
plataforma
seção
```

Proibido:

```txt
mostrar 100% sem amostra
mostrar métrica sem explicação
misturar ENAMED no Vestibular
colocar Data Safety no meio de aprendizagem
exibir painel técnico no topo
```

---

## 12. Integração com Dashboard

Dashboard “Hoje” não deve importar tudo de Stats.

Dashboard pode mostrar apenas:

```txt
1. carga de hoje
2. revisões vencidas
3. relearning
4. retenção longa se confiável
```

Stats guarda a explicação profunda.

Não criar dependência circular.

---

## 13. Testes obrigatórios

Criar/ajustar:

```txt
src/core/metricsRegistry.test.js
```

Cobrir:

```txt
metricDefinition existe para métricas obrigatórias
trueRetention retorna collecting sem n suficiente
trueRetention retorna low_confidence com n baixo
vest não recebe ENAMED
clinicalReasoningScore só res
getMetricsForSection retorna seções corretas
formatMetricValue não quebra null
```

Se houver teste de StatsPanel, atualizar smoke.

---

## 14. QA manual

### Residência

```txt
Abrir Estatísticas.
Ver seções: Resumo, Aprendizagem, Erros, Provas, Raciocínio, Atividade, Sistema.
ENAMED aparece em Provas.
Raciocínio aparece.
Data Safety está em Sistema.
Métrica "coletando" tem explicação.
```

### Vestibular

```txt
Abrir Estatísticas.
Não aparece ENAMED.
Não aparece Raciocínio Clínico.
Aparecem Simulados, Aprendizagem, Atividade, Sistema.
```

### Mobile

```txt
Seções acessíveis.
Sem scroll infinito confuso.
Cards com explicação curta.
```

---

## 15. Critérios de aceite

P2 aprovado se:

```txt
metricsRegistry existe e tem testes.
StatsPanel está dividido em seções.
Dashboard não fica mais pesado.
Métricas têm emptyState/confidence/action.
ENAMED não aparece no Vestibular.
Raciocínio não aparece no Vestibular.
DataSafety/LaunchChecklist não poluem aprendizagem.
check:mojibake passa.
testes passam.
build passa.
```

---

## 16. Prompt curto para execução

```txt
Execute somente o P2 do arquivo MEDREV_P2_STATS_METRICS_REGISTRY.md.

Objetivo: reorganizar a aba Estatísticas em seções e criar metricsRegistry.
Não implemente Activity Log, Centro de Erros completo, Raciocínio Clínico v2 ou Firebase/auth.
Não mexa profundamente no Mentor.
Não liste workspace inteiro.
Use git grep/git ls-files.

Crie metricsRegistry + testes.
Reorganize StatsPanel em:
Resumo, Aprendizagem, Erros, Provas/Simulados, Raciocínio Clínico, Atividade, Sistema.

Preserve Residência e Vestibular.
Rode check:mojibake, testes e build.
Não faça commit, deploy ou push.
```
