# MEDREV — BLOCO K: FSRS-lite v2, Relearning, Review History, True Retention e Preparação para Auditoria do Mentor

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `high` para execução normal; `xhigh` se houver regressão no store, muitos testes quebrados ou conflito com o Modo Mentor.  
> **Modo:** agent com aprovação manual.  
> **Objetivo:** corrigir e evoluir o scheduler atual inspirado em FSRS sem trocar toda a arquitetura. Implementar hardening do FSRS-lite, histórico real de revisões, relearning, True Retention ponderada, workload por minutos e preparar dados confiáveis para uma auditoria posterior do Mentor.

---

## 0. Contexto técnico

O projeto usa React/CRA + Zustand + Tailwind + Firebase.

O scheduler atual é um **FSRS-lite**, não FSRS completo. Ele combina:

```txt
D0 → D1 → D4 → D7 → D21
+ manutenção pós-D21
+ estabilidade S
+ dificuldade D
+ rating derivado de acerto
+ fila inteligente por desempenho/prova/incidência
```

Comportamento atual observado:

```txt
acerto <55%   → again
55–74%        → hard
75–89%        → good
>=90%         → easy
```

Quando o aluno vai mal (`again`), o sistema atual tende a:

```txt
reabrir a mesma etapa
marcar done=false
agendar a mesma etapa para amanhã
```

Exemplo:

```txt
D7 ruim → D7 volta amanhã
D21 ruim → D21 volta amanhã
```

Ele **não volta para D0 automaticamente**, o que é bom. Porém falta uma política mais rica para falha grave, relearning e recalibração das datas seguintes.

---

## 1. Problemas que este bloco precisa resolver

### P0 — Alta prioridade

1. **Data real da revisão ausente ou inconsistente**
   - `date` representa data agendada.
   - Falta `reviewedAt` / `completedAt` consistente.
   - Retrievability, atraso, mentor e histórico ficam imprecisos.

2. **`acerto == null` não pode virar `good`**
   - Se o aluno marca algo sem acerto/rating, o scheduler não pode assumir bom desempenho.
   - Isso cria falso avanço.

3. **Manutenção salva intervalo potencialmente divergente**
   - Se `nextInt` foi calculado com `maxInterval`/dificuldade, o campo salvo deve refletir `nextInt`.
   - Não salvar `prevInterval * 2` se a data usou outro valor.

4. **True Retention precisa incluir D21 + manutenção**
   - Hoje a retenção longa fica estreita demais.
   - Deve incluir revisões longas e manutenções, ponderadas por número de questões quando disponível.

5. **Workload precisa ser por tempo estimado, não só contagem**
   - 5 revisões D1 não equivalem a 5 revisões D21.
   - O Mentor precisa saber minutos estimados e sobrecarga real.

### P1 — Prioridade alta/média

6. **Criar `reviewHistory`**
   - Guardar eventos de revisão sem sobrescrever evidência antiga.
   - Limitar histórico para evitar crescimento infinito.

7. **Criar estado formal de fase**
   - `learning`
   - `review`
   - `relearning`
   - `maintenance`

8. **Política de falha grave**
   - Falha leve: repetir mesma etapa.
   - Falha grave: voltar 1–2 etapas, mas não necessariamente D0.
   - Recalcular/empurrar etapas futuras para evitar calendário incoerente.

9. **Bônus pequeno de recuperação**
   - Se o aluno entra em relearning e recupera bem, estabilidade pode crescer um pouco mais.
   - Bônus pequeno, não explosivo.

10. **Corrigir bugs periféricos**
   - Exemplo: `fmtMonth` se estiver parseando `YYYY-MM-DD` errado.
   - Corrigir apenas bugs comprovados.

### P2 — Preparação para Mentor

11. Expor sinais confiáveis para o Mentor:
   - atraso real;
   - minutos estimados;
   - fase do tema;
   - status de relearning;
   - risco de sobrecarga;
   - retenção longa ponderada;
   - estabilidade/dificuldade antes/depois;
   - quantidade de revisões por fase.

---

## 2. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Durante a edição:

- Não instalar bibliotecas.
- Não converter tudo para FSRS real agora.
- Não remover D0/D1/D4/D7/D21.
- Não quebrar dados antigos do Zustand/localStorage.
- Não apagar progresso do usuário.
- Não fazer commit/deploy/push.
- Não mascarar teste quebrado.
- Não mexer no Mentor profundamente neste bloco; apenas preparar dados e criar relatório para auditoria posterior.
- Manter UTF-8 sem BOM.
- Não introduzir mojibake.
- Não fazer refactor cosmético amplo.
- Corrigir apenas o necessário para o scheduler ficar confiável.

---

## 3. Arquivos prováveis

Audite e altere conforme arquitetura real:

```txt
src/core/fsrs.js                         [PATCH PRINCIPAL]
src/core/store.js                        [PATCH]
src/core/useMetrics.js                   [PATCH]
src/core/readiness.js                    [PATCH mínimo, se consumir retenção/workload]
src/core/mastery.js                      [PATCH mínimo, se consumir estado/datas]
src/core/mentorAutopilot.js              [PREPARAÇÃO mínima ou apenas adapters]
src/core/fsrs.test.js                    [CRIAR/PATCH]
src/core/scheduler.test.js               [CRIAR se fizer sentido]
src/core/mentorAuditReadiness.js         [NOVO, relatório de sinais para auditoria do Mentor]
src/core/mentorAuditReadiness.test.js    [NOVO]
```

Se algum arquivo não existir, procure equivalente. Não invente duplicata se já houver core equivalente.

---

## 4. FASE K0 — Auditoria inicial do scheduler

Antes de implementar, rode buscas:

```bash
grep -R "function .*fsrs\|buildRev\|recalcAfterMark\|toRating\|nextInterval\|calcTrueRetention\|getRetrievability\|manutencao\|D21\|d21" -n src/core src/components || true
grep -R "markStep\|registrar\|reviewHistory\|reviewedAt\|completedAt\|acerto\|questoes" -n src/core src/components || true
grep -R "getWorkloadProjection\|Carga\|workload\|mentorAutopilot" -n src || true
```

PowerShell equivalente:

```powershell
Select-String -Path "src\**\*" -Pattern "buildRev","recalcAfterMark","toRating","nextInterval","calcTrueRetention","getRetrievability","manutencao","markStep","reviewHistory","reviewedAt","getWorkloadProjection","mentorAutopilot" -CaseSensitive:$false
```

Documente internamente:

```txt
1. onde a revisão é criada;
2. onde o aluno marca revisão;
3. como o rating é derivado;
4. como S/D são atualizados;
5. como datas futuras são calculadas;
6. como manutenção funciona;
7. como True Retention é calculada;
8. como workload entra no Dashboard/Mentor.
```

Não responda ao usuário ainda. Implemente depois da auditoria.

---

## 5. FASE K1 — Datas reais: `reviewedAt`, `scheduledAt` e migração defensiva

### 5.1 Objetivo

Diferenciar:

```txt
scheduledAt/date = quando era para revisar
reviewedAt       = quando realmente revisou
```

### 5.2 Regras

- Não remover `date`, para compatibilidade.
- Adicionar `reviewedAt` quando etapa for marcada como feita.
- Adicionar `scheduledAt` se ainda não existir.
- Em dados antigos:
  - se `done === true` e não há `reviewedAt`, usar `date` como fallback.
  - não fazer migração destrutiva.

### 5.3 Implementação

Ao criar revisão em `buildRev`, cada step deve ter:

```js
{
  date: "...",
  scheduledAt: "...",
  reviewedAt: null,
  done: false,
  acerto: null,
  questoes: null,
  S,
  D,
  motivosErro: []
}
```

Ao marcar etapa concluída:

```js
step.reviewedAt = todayStr()
step.completedAt = todayStr() // opcional, se padrão do app já usa completedAt
```

Se estiver reagendando por `again`:

```js
step.done = false
step.reviewedAt = null
step.acerto = null
step.questoes = null
step.date = addDays(todayStr(), 1)
step.scheduledAt = step.date
```

No `reviewHistory`, o evento deve preservar o `reviewedAt` que acabou de ocorrer, mesmo se a etapa for reaberta.

---

## 6. FASE K2 — Rating seguro: `acerto == null` não vira `good`

### 6.1 Problema

Se `toRating(null)` retorna `good`, qualquer UI incompleta pode avançar o aluno indevidamente.

### 6.2 Regra nova

```js
toRating(null) → null
toRating(undefined) → null
```

Se determinada etapa não usa acerto numérico, ela deve fornecer rating explícito ou score qualitativo:

```txt
Não lembrei → again
Parcial → hard
Lembrei bem → good/easy
```

### 6.3 Implementação

Ajustar `toRating`:

```js
export function toRating(acerto) {
  if (acerto == null || Number.isNaN(Number(acerto))) return null;
  const pct = Number(acerto);
  if (pct < 55) return "again";
  if (pct < 75) return "hard";
  if (pct < 90) return "good";
  return "easy";
}
```

No `recalcAfterMark`:

- Se rating `null`, não recalcular S/D.
- Ou exigir `ratingManual`.
- Não avançar automaticamente.

Retorno recomendado:

```js
{
  ...rev,
  meta: {
    ...rev.meta,
    schedulerWarning: "missing_rating"
  }
}
```

Mas não quebrar UI. Se a UI precisa marcar uma etapa sem questões, solicitar rating manual.

---

## 7. FASE K3 — Review History real

### 7.1 Objetivo

Registrar cada evento de revisão.

Adicionar por tema:

```js
reviewHistory: [
  {
    id: "rev_...",
    stepKey: "d7",
    phaseBefore: "review",
    phaseAfter: "relearning",
    scheduledAt: "2026-06-01",
    reviewedAt: "2026-06-04",
    atrasoDias: 3,
    acerto: 42,
    questoes: 20,
    rating: "again",
    severity: "common" | "severe",
    S_before: 7,
    S_after: 3.1,
    D_before: 0.55,
    D_after: 0.70,
    intervalBefore: 7,
    intervalAfter: 1,
    source: "fsrs-lite",
  }
]
```

### 7.2 Regras

- Limitar a 100 eventos por tema.
- Não sobrescrever eventos antigos.
- Refazer/treino livre, se existir, pode entrar com `official: false`.
- Eventos oficiais entram com `official: true`.

### 7.3 Helpers

Criar no `fsrs.js` ou arquivo core apropriado:

```js
export function appendReviewHistory(temaOrRev, event, limit = 100) {}

export function getLastOfficialReview(history = []) {}

export function getLastReviewForStep(history = [], stepKey) {}
```

Se o histórico fica no tema e não no `rev`, adaptar ao shape real.

---

## 8. FASE K4 — Política de falha: same-step, downgrade e relearning

### 8.1 Objetivo

Substituir a regra simplista “again sempre repete a mesma etapa amanhã” por uma regra mais inteligente.

### 8.2 Severidade

Criar:

```js
export function getAgainSeverity(acerto) {
  if (acerto == null) return null;
  return Number(acerto) < 30 ? "severe" : "common";
}
```

### 8.3 Tabela desejada

| Etapa atual | Again comum | Again grave |
|---|---|---|
| D0 | repetir D0 amanhã | repetir D0 amanhã |
| D1 | repetir D1 amanhã | D0 ou D1 amanhã |
| D4 | repetir D4 amanhã | voltar para D1 amanhã |
| D7 | repetir D7 amanhã | voltar para D4 amanhã |
| D21 | repetir D21 em 2 dias | voltar para D7 amanhã |
| Manutenção | manutenção curta em 3–7 dias | voltar para D7 amanhã |

Regras:

- Não voltar para D0 sempre.
- D0 é aquisição inicial, não punição universal.
- Falha grave em D21/manutenção vira `relearning`.
- Falha comum repete etapa atual.

### 8.4 Função nova

```js
export function resolveAgainPolicy(stepKey, acerto, context = {}) {
  // retorna:
  // {
  //   targetStep: "d7",
  //   delayDays: 1,
  //   phaseAfter: "relearning",
  //   severity: "severe",
  //   shouldPushFuture: true
  // }
}
```

### 8.5 Relearning

Adicionar estado:

```js
phase: "learning" | "review" | "relearning" | "maintenance"
```

Função:

```js
export function inferPhaseFromStep(stepKey, manutencao = false) {
  if (manutencao) return "maintenance";
  if (["d0", "d1", "d4", "d7"].includes(stepKey)) return "learning";
  if (stepKey === "d21") return "review";
  return "learning";
}
```

Quando falha grave em D7/D21/manutenção:

```js
phase = "relearning"
relearning = {
  fromStep: stepKey,
  targetStep,
  startedAt: todayStr(),
  reason: "again_severe"
}
```

### 8.6 Empurrar datas futuras

Se o aluno voltou para uma etapa anterior, empurrar etapas futuras para não ficarem incoerentes.

Exemplo:

```txt
D7 grave → volta para D4 amanhã
D7 novo = D4 + 3 a 5 dias
D21 novo = D7 + 10 a 18 dias
```

Implementar helper conservador:

```js
export function pushFutureStepsAfterDowngrade(rev, targetStep, targetDate, options = {}) {}
```

Regras mínimas:

```js
D1 depois de D0: +1 dia
D4 depois de D1: +3 dias
D7 depois de D4: +3 dias
D21 depois de D7: +14 dias
```

Não alterar steps já concluídos, exceto se forem posteriores e logicamente inválidos? Preferência:

- Steps concluídos permanecem no histórico.
- Steps futuros `done:false` são empurrados.
- Se step posterior já estava `done:true`, não apagar; mas relearning deve criar uma nova trilha/estado. Se isso for complexo, não sobrescrever concluídos, apenas agendar target e manutenção/relearning.

---

## 9. FASE K5 — Estabilidade e bônus de recuperação

### 9.1 Regra atual

`again` reduz S, `easy` aumenta bastante.

### 9.2 Regra nova

Não aumentar agressivamente por recuperação.

Se o tema está em `relearning` e o aluno acerta bem:

```txt
rating = good → S_new *= 1.05
rating = easy → S_new *= 1.10 a 1.15
rating = hard → sem bônus
rating = again → continua relearning
```

Criar:

```js
export function applyRelearningRecoveryBonus(S, rating, context = {}) {
  if (!context?.wasRelearning) return S;
  if (rating === "easy") return S * 1.12;
  if (rating === "good") return S * 1.05;
  return S;
}
```

Aplicar após cálculo normal de S.

Limitar com clamp se já existir.

---

## 10. FASE K6 — Manutenção correta

### 10.1 Correção do intervalo

Quando calcular `nextInt`, salvar:

```js
interval: nextInt
```

Não salvar:

```js
interval: prevInterval * 2
```

a menos que `nextInt === prevInterval * 2`.

Se quiser preservar alvo teórico:

```js
targetInterval: prevInterval * 2
```

### 10.2 Falha em manutenção

Se manutenção `again`:

- comum:
  ```txt
  manutenção curta em 3–7 dias
  phase = maintenance
  ```
- grave:
  ```txt
  voltar para D7 amanhã
  phase = relearning
  ```

Não voltar para D0.

---

## 11. FASE K7 — True Retention ponderada

### 11.1 Objetivo

Incluir:

```txt
D21 + manutenções + revisões longas no reviewHistory
```

### 11.2 Regras

- Só incluir revisões com maturidade suficiente:
  - `stepKey === "d21"`, ou
  - `phase === "maintenance"`, ou
  - `intervalBefore >= 15`, ou
  - `scheduledAt/reviewedAt` com atraso desde última revisão >=15 dias.
- Ponderar por `questoes`, se existir.
- Se `questoes` ausente, peso = 1.
- Ignorar acerto ausente.
- Retornar `null` se não houver dados.

Função:

```js
export function calcTrueRetention(temasOrState, options = {}) {
  // retornar:
  // {
  //   value: 0.82,
  //   pct: 82,
  //   n: 12,
  //   totalQuestoes: 180,
  //   source: "d21+maintenance",
  //   collecting: false
  // }
}
```

Se a API atual espera só número, manter compatibilidade:

```js
export function calcTrueRetentionValue(...) {}
```

ou retornar shape antigo onde usado, adaptando UI.

### 11.3 Texto de UI

Quando sem dados:

```txt
Coletando D21+
```

Quando com dados:

```txt
Retenção longa 82%
```

Não chamar de True Retention se UI para usuário comum estiver em PT-BR.

---

## 12. FASE K8 — Workload por minutos

### 12.1 Custo estimado por etapa

Criar:

```js
export const STEP_ESTIMATED_MINUTES = {
  d0: 45,
  d1: 12,
  d4: 25,
  d7: 30,
  d21: 35,
  manutencao: 25,
  relearning: 20,
};
```

Ajuste se o projeto já usa outros tempos.

### 12.2 `getWorkloadProjection`

Retornar por dia:

```js
{
  date: "YYYY-MM-DD",
  count: 5,
  estimatedMinutes: 130,
  items: [...],
  overload: true,
  overloadLevel: "ok" | "moderate" | "high"
}
```

Critérios sugeridos:

```js
<=60 min ok
61–120 moderate
>120 high
```

Ou usar config do usuário, se existir.

### 12.3 Mentor

Não reescrever o Mentor neste bloco.

Apenas garantir que `mentorAutopilot` consegue consumir:

```js
workloadProjection[].estimatedMinutes
workloadProjection[].overloadLevel
```

Se necessário, criar adapter:

```js
export function getSchedulerSignalsForMentor(state, plat) {}
```

---

## 13. FASE K9 — Retrievability usando revisão real

### 13.1 Problema

Não usar só a data agendada.

### 13.2 Regra

`getRetrievability` deve usar:

```txt
última revisão oficial real
reviewedAt
```

Fallbacks:

1. `reviewHistory` último evento oficial.
2. `step.reviewedAt`.
3. `step.date` em dados antigos concluídos.
4. `tema.createdAt` ou hoje.

### 13.3 Função

```js
export function getLastReviewedAt(tema, stepKey) {}
```

Depois:

```js
elapsedDays = diffDays(todayStr(), lastReviewedAt)
R = Math.exp(-elapsedDays / S)
```

ou fórmula atual equivalente.

---

## 14. FASE K10 — Correções periféricas

Corrigir bugs pequenos comprovados:

### 14.1 `fmtMonth`

Se houver:

```js
const [, m, y] = d.split("-");
```

para data `YYYY-MM-DD`, corrigir:

```js
const [y, m] = d.split("-");
```

### 14.2 Imports não usados

Corrigir warnings óbvios gerados pelas mudanças.

### 14.3 BOM/mojibake

Rodar `npm run check:mojibake`.

---

## 15. FASE K11 — Preparar terreno para auditoria do Mentor

### 15.1 Não refatorar o Mentor ainda

Este bloco deve apenas criar os sinais e um relatório de saúde.

Criar:

```txt
src/core/mentorAuditReadiness.js
```

Funções:

```js
export function collectSchedulerSignalsForMentor(context = {}) {}

export function auditMentorInputCompleteness(context = {}) {}

export function buildMentorAuditSnapshot(context = {}) {}
```

### 15.2 `collectSchedulerSignalsForMentor`

Retornar:

```js
{
  trueRetention: {
    pct,
    n,
    totalQuestoes,
    collecting
  },
  workload: {
    todayMinutes,
    next7DaysMinutes,
    overloadDays,
    maxDayMinutes
  },
  overdue: {
    count,
    maxDelayDays,
    items
  },
  relearning: {
    count,
    items
  },
  stability: {
    medianS,
    lowStabilityCount
  },
  difficulty: {
    highDifficultyCount,
    areas
  },
  reviewHealth: {
    missingReviewedAtCount,
    missingRatingCount,
    historyEvents
  }
}
```

### 15.3 `auditMentorInputCompleteness`

Checar se o Mentor tem dados suficientes:

```js
{
  ok: true/false,
  missing: ["workload", "trueRetention", "calendarProvider"],
  warnings: ["trueRetention ainda coletando", "muitos temas sem reviewHistory"],
  recommendations: [...]
}
```

### 15.4 Objetivo

A próxima auditoria do Mentor deve conseguir responder:

```txt
O Mentor recomenda ações com base em dados reais?
Ele usa atraso real ou data agendada?
Ele considera workload em minutos?
Ele evita tema novo quando há sobrecarga?
Ele sabe quando o aluno está em relearning?
Ele não interpreta retenção coletando como preparo alto?
```

---

## 16. Testes obrigatórios

Criar ou atualizar testes.

### 16.1 `src/core/fsrs.test.js`

Cobrir:

1. `toRating(null)` retorna `null`.
2. D7 com `again` comum repete D7 amanhã.
3. D7 com `again` grave volta para D4 amanhã.
4. D21 com `again` grave entra em relearning.
5. Manutenção com `again` grave volta para D7/relearning.
6. Relearning com `easy` aplica bônus pequeno.
7. Manutenção salva `interval: nextInt`.
8. `reviewedAt` é salvo ao marcar revisão.
9. `reviewHistory` recebe evento.
10. Histórico é limitado.

### 16.2 True Retention

Testar:

1. retorna `null` sem D21/manutenção.
2. inclui D21.
3. inclui manutenção.
4. pondera por questões.
5. ignora acerto ausente.

### 16.3 Workload

Testar:

1. retorna count e estimatedMinutes.
2. D0 pesa mais que D1.
3. marca overload quando passa limite.
4. próximos 7/14 dias funcionam.

### 16.4 Mentor audit readiness

Criar:

```txt
src/core/mentorAuditReadiness.test.js
```

Cobrir:

1. detecta falta de reviewHistory.
2. detecta true retention coletando.
3. calcula overloadDays.
4. lista relearning count.
5. retorna recomendações de auditoria.

---

## 17. QA manual

Depois dos testes:

1. Criar tema novo.
2. Fazer D0 com acerto bom.
3. Confirmar D1/D4/D7/D21.
4. Fazer D7 com 40%.
   - Deve repetir D7 amanhã.
5. Fazer D7 com 20%.
   - Deve voltar para D4 amanhã ou entrar em relearning conforme política.
6. Confirmar que D21 futuro não fica incoerente.
7. Fazer D21 com 20%.
   - Deve entrar em relearning, não voltar D0.
8. Fazer manutenção com erro grave.
   - Deve voltar para D7/relearning.
9. Fazer recuperação com easy.
   - S cresce com bônus pequeno.
10. Ver True Retention coletando antes de D21.
11. Ver True Retention após D21/manutenção.
12. Ver Carga futura com minutos.
13. Confirmar Dashboard/Mentor não quebraram.
14. Confirmar Vestibular não quebrou.
15. Confirmar build.

---

## 18. Comandos finais

Ao fim:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
git status --short
```

Não executar:

```bash
git commit
firebase deploy
git push
```

sem autorização explícita.

---

## 19. Critérios de aceite

Bloco K aprovado se:

- `toRating(null)` não retorna `good`.
- Revisões concluídas têm `reviewedAt`.
- Dados antigos não quebram.
- `reviewHistory` existe e é preenchido.
- Falha comum repete etapa.
- Falha grave regride 1–2 etapas, não sempre D0.
- D21/manutenção grave entram em `relearning`.
- Datas futuras não ficam absurdamente incoerentes.
- Relearning tem bônus pequeno de recuperação.
- Manutenção salva `interval` real.
- True Retention inclui D21 + manutenção e pondera por questões.
- Workload retorna minutos estimados.
- Retrievability usa revisão real.
- Mentor recebe sinais preparados por `mentorAuditReadiness`.
- Testes passam.
- Build passa.
- Mojibake passa.

---

## 20. Nota final ao executor

Não tente transformar o scheduler em FSRS científico completo agora.

A meta é tornar o motor atual confiável:

```txt
datas reais
falha tratada corretamente
relearning sem punição excessiva
retenção longa honesta
workload realista
sinais bons para o Mentor
```

Depois desse bloco, a próxima etapa será auditar o Mentor para garantir que ele usa esses sinais corretamente.
