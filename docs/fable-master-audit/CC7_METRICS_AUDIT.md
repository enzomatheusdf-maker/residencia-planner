# CC7 — Auditoria de Métricas do StatsPanel

**Data:** 2026-06-12  
**Critério:** Para cada métrica exibida, identificar a ação concreta que ela justifica.  
**Regra:** "Se essa métrica ficasse num range ruim por 1 semana, qual é a ação concreta?" Se não há resposta → seção colapsada **Avançado**.

---

## Métricas com ação direta (mantidas em destaque)

| ID / Seção | Métrica | Ação concreta quando ruim |
|---|---|---|
| `trueRetention` / revisoes | Retenção longa (D21+/manutenção) | Priorizar revisões longas; reduzir temas novos |
| `overdueReviews` / revisoes | Revisões vencidas | Fechar fila atrasada ANTES de tema novo |
| `relearningCount` / revisoes | Reaprendendo | Fechar relearnings antes de abrir temas novos |
| `coverageByArea` / aprendizagem | Cobertura do cronograma | Iniciar temas prioritários do cronograma |
| `confidenceCalibration` / aprendizagem | Calibração metacognitiva | Estimar desempenho antes de responder; comparar com resultado real |
| `simuladoAccuracy` / provas | Acerto em simulados | Analisar erros por tipo e área; reduzir lacunas |
| `enamedGap` / provas | Gap ENAMED | Focar áreas com maior gap; usar mapa ENAMED |
| `dominantError` / erros | Tipo de erro dominante | Treino dirigido ao tipo dominante (lacuna → mais estudo; descuido → lentidão intencional) |
| `clinicalReasoningScore` / raciocinio | Score de raciocínio clínico | Treinar mais casos clínicos; reexposição com script |
| `ankiAdherence` / atividade | Adesão ao Anki | Manter Anki diário — mesmo 10 min protegem retenção |
| `weeklyConsistency` / atividade | Consistência semanal | Estudar pelo menos 5 dias por semana |
| `mentorQuality` / mentor (CC-7) | Taxa de execução do Mentor | Revisar o Comando do Dia antes de iniciar sessão; baixa taxa = perda de ganho sistemático |

---

## Métricas informacionais sem ação direta → seção Avançado

| Métrica | Local anterior | Motivo | Ação adicionada |
|---|---|---|---|
| **Sessões registradas** | Atividade (destaque) | Contador puro; não há threshold de alerta. Um número alto ou baixo não gera ação imediata. | Movido para `AdvancedSection` em Atividade + seção Mentor (Avançado) |
| **Revisões executivas** | Atividade (destaque) | Mesmo caso. Volume de revisões semanais é contexto, não alarme. | Movido para `AdvancedSection` em Atividade + seção Mentor (Avançado) |

---

## Métricas parcialmente acionáveis (mantidas, com caveats)

| Métrica | Caveato |
|---|---|
| **Evolução cronológica de acertos** (gráfico SVG) | Informacional — suporta visual a `coverageByArea`/`trueRetention`; não tem threshold próprio. Mantida porque orienta inspeção manual de tendência. |
| **Forecast FSRS 14 dias** (barras) | Informacional — orienta planejamento de tempo de estudo. Sem alerta algorítmico. Mantida porque a carga futura alta sugere reduzir temas novos agora. |
| **Desempenho por especialidade** (barras) | Indiretamente acionável: área com acerto < 65% → estudar mais aquela área. Mantida em destaque por ser a view mais direta de gap por especialidade. |
| **Calibração metacognitiva** (detalhamento bias) | Os números de bias% amplificam `confidenceCalibration`. Mantidos; ação = calibração já cobre. |
| **Preparo estimado do plano** (em Aprendizagem) | Duplicado com Validação. Mantido em Aprendizagem porque usuários iniciantes chegam por lá. |

---

## Novas métricas adicionadas em CC-7

| ID | Seção | Ação |
|---|---|---|
| `mentorQuality` | `mentor` | Taxa de execução < 40% → "Revise o Comando do Dia antes de estudar" |

---

## Contratos de telemetria adicionados

```
mentor_action_ignored  ["plat", "action_type", "source", "hours_visible"]
  Disparo: comando foi visto (seen) num dia anterior sem started correspondente.
  hours_visible: diff em horas entre seenAt e o disparo (cap 48h).

mentor_action_outcome  ["plat", "action_type", "delta_metric", "window_days"]
  Disparo: best-effort, null permitido.
  window_days: sempre 7.
  delta_metric: delta de acerto/estabilidade no tema-alvo em 7 dias (learningEvents).
```

---

## Notas de implementação

- `mentorEvents[]` é persistido no Zustand store (pruned a 30 dias).
- `recordMentorEvent(event)` é a única action de escrita; não usa `rebuildDecision` (CC-5) porque não afeta o snapshot de decisão.
- Rollover detection roda uma vez por mount do hook `useDailyCommand` via `useRef(rolledOverRef)`.
- Amostra mínima: `MENTOR_QUALITY_MIN_SAMPLE = 5` (constante exportada de `metricsRegistry.js`).
