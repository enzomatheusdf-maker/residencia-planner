# MEDREV — AUDITORIA PÓS P2.3 → P3.1 (Bro__22_)

> Auditoria curta e direta. Comparação `Bro__21_` → `Bro__22_` por leitura de código. **Não rodei testes/build** (node_modules ausente, rede off) — análise estática.

## Veredito: a consolidação landou. Entropia **caiu** neste round.

Diferente do round anterior (que adicionou motores sem o centro consumir), este round **integrou**. Nenhum arquivo novo foi criado — tudo por edição. O órfão `mentorAuditReadiness` foi **removido**.

| Bloco | Status | Evidência (arquivo:linha) |
|---|---|---|
| **P2.3 Mentor consome motores** | ✅ Real | `mentorDecisionPolicy.js`: importa `OPERATIONAL_MODE`; `getMasteryAreaEntries` escolhe área por `masteryGap × incidência` (l.70-82); usa `operationalMode.flags.canStartNewTopic` e `mode === OVERLOAD/RECOVERY/DATA_ISSUE` (l.94-189) em vez de re-derivar inline. |
| **P2.4 Limpeza/sinais** | 🟡 Parcial | `mentorAuditReadiness` removido ✓; `buildActionCandidatesFromState` removido ✓. **Pendente:** `proximaAcao` virou código morto (definido em `mentor.js:666`, **sem chamadas**) e não foi removido; `decisionSnapshot` **ainda persistido** no `partialize` (`store.js:199`) — estado derivável. |
| **P2.5 Logs unificados** | ✅ Real | `migrateTemaStatsToLearningEventsState` (`store.js:104`) + `TEMA_STATS_MIGRATION_FLAG` — converte `temaStats`→`learningEvents` (tags `migrated_temaStats`), idempotente. |
| **P2.6 Sombra coerente** | ✅ Real (corrigida) | `fsrsCanonicalShadow.js`: `getOfficialReplayHistory(tema)` lê `rev.reviewHistory` (filtra `official !== false`), monta `[...historyEvents, current]` e **replaya em ordem** num card — exatamente o replay que faltava. Surge no `DataSafetyPanel.jsx` (dev). |
| **P2.7 Interleaving no mentor** | ✅ Real | `interleaving_block` (`mentorDecisionPolicy.js:405`), disparado com `consolidatedCorpus >= 2` (l.116); `mentorSignals.countConsolidatedCorpusAreas` (l.288). |
| **P3.1 Student model BKT/PFA** | ✅ Real | `mastery.js` (512→995): `updateBayesianMastery(prior, obs, params)` com posterior Bayesiano correto e `slip`/`guess` explícitos (l.337-351); canonicalização de subtópico (`canonicalizeSubtopic`, `ENAMED_HOTNESS`, aliases); `SUBTOPIC_PARAMS_VERSION = "mastery-bkt-pfa-subtopic-v1"`. |

## Residuais a fechar (rápidos, baixo risco)
1. **Remover** `proximaAcao` de `mentor.js` (morto). 
2. **Tirar** `decisionSnapshot` do `partialize` (`store.js:199`) — recomputar, não persistir.
3. Confirmar (rodando) que a suíte de testes passa: `npm ci && npm test -- --watchAll=false && npm run check:mojibake && npm run build`.

## Riscos remanescentes (do round anterior, ainda válidos)
- **Dupla codificação de calibração:** `calibration.js` (métrica) vs `fsrs.getCalibrationMultiplier` (scheduler) — decidir fonte única.
- **BKT params fixos:** `slip/guess` ainda são defaults globais (`guess 0.25 / slip 0.12`); o próximo ganho é informá-los pela `errorTaxonomy` por subtópico (chute↔guess, confiança_mal_calibrada↔slip) — ver bloco no doc de ciência da aprendizagem.

## Conclusão
O MedRev agora é, de fato, mais "organismo único": a decisão consome os motores, a sombra é válida, os logs convergem para um store e a maestria é interpretável por subtópico. **Pode avançar para os blocos de eficiência/UX e de raciocínio clínico** (docs a seguir), pagando os 2 residuais no caminho.
