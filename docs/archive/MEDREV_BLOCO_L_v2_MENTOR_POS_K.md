# MEDREV — BLOCO L v2: Mentor Decision Engine pós-FSRS-lite v2

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `xhigh`  
> **Modo:** agent com aprovação manual.  
> **Objetivo:** refatorar o Mentor para usar dados reais do FSRS-lite v2, corrigindo antes as inconsistências detectadas no delta do Bloco K. O Mentor deve virar motor de decisão explicável, com sinais confiáveis de revisão, workload, relearning, retenção longa, calendário/provider, ENAMED, Vestibular, casos clínicos e Action Inbox.

---

## 0. Diagnóstico pós-Bloco K

O Bloco K avançou bastante:

- `getWorkloadProjection` agora retorna objeto por dia com `count`, `estimatedMinutes`, `items`, `overload` e `overloadLevel`.
- `toRating(null)` agora retorna `null`.
- `buildRev` e `normalizeTema` passaram a incluir `scheduledAt`, `reviewedAt`, `phase`, `reviewHistory` e `relearning`.
- `recalcAfterMark` ganhou política de `again`, `relearning`, `reviewHistory`, manutenção com `interval` real e bônus de recuperação.
- `calcTrueRetention` passou a usar histórico e ponderação por questões.
- Build e mojibake passaram no delta enviado.

Mas há correções obrigatórias antes de auditar/implementar o Mentor.

---

## 1. P0/P1 antes do Mentor

### 1.1 Bug: falha grave pode deixar a etapa original como `done: true`

No fluxo atual do delta:

```txt
D7 grave → targetStep D4
```

Mas `markStep` marca D7 como `done:true` antes de chamar `recalcAfterMark`. Em `recalcAfterMark`, quando a política manda voltar para D4, o código agenda D4, mas não garante que D7 volte para `done:false`.

Risco:

```txt
O aluno falha D7, entra em relearning, mas D7 continua registrado como concluído.
```

Isso quebra:

- fila;
- retrievability;
- Mentor;
- readiness;
- true retention futura;
- coerência do cronograma.

#### Correção obrigatória

Em qualquer `rating === "again"`:

1. Registrar o evento no `reviewHistory`.
2. Limpar o estado operacional da etapa original falhada:
   ```js
   nextRev[doneKey] = {
     ...nextRev[doneKey],
     done: false,
     reviewedAt: null,
     completedAt: null,
     acerto: null,
     questoes: null,
     lastFailedAt: now,
     lastFailedAcerto: normalizeAcerto(acerto),
     lastFailedRating: "again",
   };
   ```
3. Se `policy.targetStep !== doneKey`, limpar/reabrir também as etapas futuras dependentes, pelo menos:
   ```txt
   targetStep, steps depois do targetStep até d21, manutenção se existir e estiver futura
   ```
4. Preservar resultado antigo apenas no `reviewHistory`.

Regra de produto:

```txt
Histórico guarda o que aconteceu.
Estado operacional mostra o que falta fazer.
```

---

### 1.2 Bug: `rating == null` ainda pode deixar step `done:true`

No delta, `toRating(null)` retorna `null`, mas `store.markStep` já marcou a etapa como `done:true` antes de `recalcAfterMark`.

Quando `recalcAfterMark` detecta `rating == null`, ele retorna `rev` com `schedulerWarning`, mas não desfaz o `done:true`.

Risco:

```txt
Etapa sem acerto/rating pode sumir da fila sem atualização S/D.
```

#### Correção obrigatória

Escolher uma das duas abordagens:

##### Opção A — bloquear no store

Em `markStep`, antes de marcar `done:true`:

```js
if (acerto == null && ratingManual == null) {
  // não marca a etapa como feita
  // registra warning/toast se houver mecanismo
  return state;
}
```

##### Opção B — reverter em `recalcAfterMark`

Se `rating == null`:

```js
return {
  ...rev,
  [doneKey]: {
    ...rev[doneKey],
    done: false,
    reviewedAt: null,
    completedAt: null,
    acerto: null,
    questoes: null,
  },
  meta: {
    ...(rev.meta || {}),
    schedulerWarning: "missing_rating",
  },
};
```

Recomendação: **Opção B + teste**, porque protege qualquer chamada futura.

---

### 1.3 True Retention deve ignorar eventos `official:false`

O cálculo novo de retenção longa percorre `reviewHistory`, mas precisa ignorar explicitamente tentativas não oficiais:

```js
if (event.official === false) continue;
```

Risco:

```txt
Refazer caso/revisão livre ou treino não oficial pode inflar ou derrubar a retenção longa.
```

Corrigir em `calcTrueRetentionDetailed`.

---

### 1.4 `mentorAuditReadiness.js` está untracked e não foi incluído no diff completo

No audit enviado, aparecem:

```txt
?? src/core/mentorAuditReadiness.js
?? src/core/mentorAuditReadiness.test.js
```

Mas o `git diff` padrão não inclui conteúdo de arquivos untracked. Então ainda não dá para auditar a implementação desses arquivos.

#### Correção do script de auditoria

Atualizar `scripts/audit.mjs` para também incluir untracked relevantes:

```js
run("Untracked files", "git ls-files --others --exclude-standard");

appendFileSync(out, "\n## Untracked file contents\n\n", "utf8");
const untracked = execSync("git ls-files --others --exclude-standard", { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((f) => f.startsWith("src/") || f.startsWith("scripts/") || f.endsWith(".md"));

for (const file of untracked) {
  appendFileSync(out, `\n### ${file}\n\n\`\`\`txt\n`, "utf8");
  appendFileSync(out, readFileSync(file, "utf8"), "utf8");
  appendFileSync(out, "\n```\n", "utf8");
}
```

---

## 2. Bloco L agora deve consumir o FSRS-lite v2

O Mentor não deve mais raciocinar em cima de contagens simples.

### 2.1 Workload mudou de shape

Antes:

```js
projection[date] = 3;
```

Agora:

```js
projection[date] = {
  date,
  count,
  estimatedMinutes,
  items,
  overload,
  overloadLevel,
};
```

Qualquer código do Mentor que faça:

```js
Object.values(proj).reduce((a, b) => a + b, 0)
```

está errado.

Deve fazer:

```js
Object.values(proj).reduce((sum, day) => sum + (day?.estimatedMinutes || 0), 0)
```

ou para contagem:

```js
Object.values(proj).reduce((sum, day) => sum + (day?.count || 0), 0)
```

### 2.2 Mentor deve ler sinais do scheduler

Criar/ajustar `src/core/mentorSignals.js` para retornar:

```js
{
  scheduler: {
    workloadProjection,
    todayCount,
    todayMinutes,
    next7DaysMinutes,
    overloadLevelToday,
    overloadDays,
    maxDayMinutes,

    overdueCount,
    dueTodayCount,
    maxDelayDays,
    nextDueItem,

    relearningCount,
    relearningItems,

    missingRatingWarnings,
    missingReviewedAtCount,
    reviewHistoryEvents,

    trueRetentionPct,
    trueRetentionN,
    trueRetentionTotalQuestoes,
    trueRetentionCollecting,
  }
}
```

### 2.3 Mentor deve distinguir “coletando” de dado confiável

Se `trueRetentionCollecting === true`, o Mentor não pode interpretar como preparo alto ou baixo. Ele deve dizer:

```txt
Retenção longa ainda coletando; vou priorizar revisões vencidas, carga e desempenho recente.
```

---

## 3. Política de decisão do Mentor pós-K

A ordem de prioridade deve ser:

```txt
P0 — dados inválidos / scheduler warning crítico
P1 — sobrecarga alta
P2 — relearning
P3 — revisões vencidas
P4 — revisão de hoje
P5 — prova/simulado pendente de análise
P6 — gargalo ENAMED ou matéria fraca
P7 — caso clínico devido
P8 — tema novo se carga permite
P9 — Anki/check rápido
P10 — descanso/bloco leve
```

### 3.1 Bloqueio de tema novo

Nunca recomendar tema novo se:

```js
scheduler.overloadLevelToday === "high"
scheduler.overloadDays >= 2
scheduler.relearningCount > 0
scheduler.overdueCount > 0
scheduler.todayMinutes > userAvailableMinutes * 1.2
```

Fallback se não houver `userAvailableMinutes`:

```txt
>120 minutos hoje = alta carga
```

### 3.2 Relearning ganha de tema novo

Se há `relearningItems`:

```txt
Ação principal: recuperar tema instável
Motivo: queda significativa recente; recuperar agora custa menos do que abrir tema novo.
```

### 3.3 Revisões vencidas ganham de ENAMED

Se há revisão vencida, o Mentor não deve pular direto para hot topic ENAMED.

```txt
Preservar retenção primeiro; depois gargalo ENAMED.
```

### 3.4 Caso clínico só para Residência

Se `plat === "vest"`:

- não sugerir caso clínico;
- não sugerir illness script;
- não sugerir ENAMED como ação principal.

### 3.5 Vestibular

Para `plat === "vest"`, usar:

```txt
revisão vencida
matéria fraca em simulado
tema novo do cronograma
carga futura
proximidade da prova
descanso
```

---

## 4. Arquitetura-alvo do Mentor

Criar/ajustar:

```txt
src/core/mentorSignals.js
src/core/mentorDecisionPolicy.js
src/core/mentorAutopilot.js
src/core/mentorSignals.test.js
src/core/mentorDecisionPolicy.test.js
src/core/mentorAutopilot.test.js
```

Manter:

```txt
src/core/mentor.js
```

Mas `mentor.js` deve virar camada legada/narrativa:

```txt
frases
voz
diagnóstico textual
compatibilidade com Dashboard antigo
```

Não deve ser o motor principal de próxima ação.

---

## 5. Schema único de ação

Toda ação do Mentor deve ter:

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
  source,
  target,
}
```

Exemplo:

```js
{
  type: "relearning",
  priority: 96,
  title: "Recuperar Apendicite Aguda",
  reason: "Tema entrou em reaprendizado após queda em D7.",
  explain: [
    "Você teve queda significativa em uma revisão longa.",
    "Abrir tema novo agora aumentaria a carga futura.",
    "Recuperar em 24–48h tende a custar menos tempo."
  ],
  cta: "Recuperar agora",
  ctaView: "focus",
  estimatedMinutes: 20,
  safety: "caution",
  target: {
    temaId,
    stepKey: "d4",
    phase: "relearning"
  }
}
```

---

## 6. Ajustes obrigatórios no Bloco L original

Substituir o início do Bloco L anterior por estas pré-fases:

### L0 — Validar pós-K

Antes de qualquer Mentor:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Depois rodar testes específicos:

```bash
npm test -- --watchAll=false --testPathPattern=fsrs
npm test -- --watchAll=false --testPathPattern=useMetrics
npm test -- --watchAll=false --testPathPattern=mentorAuditReadiness
```

Se `testPathPattern` não funcionar no CRA, usar o teste completo.

### L0.1 — Corrigir bug de etapa falhada ainda concluída

Adicionar testes:

```js
test("D7 severe again clears D7 operational done state", () => {
  const updated = recalcAfterMark(markedD7, "d7", 0.2);
  expect(updated.d7.done).toBe(false);
  expect(updated.d4.done).toBe(false);
  expect(updated.phase).toBe("relearning");
});

test("D21 severe again clears D21 operational done state", () => {
  const updated = recalcAfterMark(markedD21, "d21", 0.2);
  expect(updated.d21.done).toBe(false);
  expect(updated.d7.done).toBe(false);
});
```

### L0.2 — Corrigir rating ausente

Adicionar teste:

```js
test("missing rating does not leave step completed", () => {
  const updated = recalcAfterMark(markedD1WithoutAcerto, "d1", null);
  expect(updated.d1.done).toBe(false);
  expect(updated.meta.schedulerWarning).toBe("missing_rating");
});
```

### L0.3 — True Retention ignora treino livre

Adicionar teste:

```js
test("true retention ignores unofficial review events", () => {
  const temas = [{
    rev: {
      reviewHistory: [
        { stepKey: "d21", acerto: 1, questoes: 100, official: false },
      ],
    },
  }];
  expect(calcTrueRetention(temas)).toBeNull();
});
```

---

## 7. Dashboard depois do Mentor

O Dashboard deve usar:

```js
buildMentorContext(state, plat)
getMentorNextAction(context)
getMentorTodayPlan(context)
```

A ação principal deve ser a fonte do “Comando do Dia”.

Não chamar diretamente `proximaAcao` como motor principal, exceto como wrapper legado.

---

## 8. Testes mínimos do Mentor v2

Criar/atualizar:

```txt
src/core/mentorSignals.test.js
src/core/mentorAutopilot.test.js
src/core/mentorDecisionPolicy.test.js
```

Cobrir:

1. sobrecarga alta bloqueia tema novo;
2. relearning ganha de tema novo;
3. revisão vencida ganha de ENAMED;
4. true retention coletando não vira preparo alto;
5. ação sempre tem `target`;
6. ação sempre tem `explain`;
7. `plat === "vest"` não gera ação ENAMED;
8. `plat === "vest"` não gera caso clínico;
9. provider ativo influencia tema novo;
10. ação de prova pendente aparece quando fila está segura.

---

## 9. Critérios de aceite v2

Este Bloco L v2 só está aprovado se:

- bugs pós-K foram corrigidos;
- etapa falhada não permanece `done:true`;
- rating ausente não conclui etapa;
- true retention ignora eventos não oficiais;
- Mentor lê workload por minutos;
- Mentor lê relearning;
- Mentor lê true retention com estado `collecting`;
- Mentor bloqueia tema novo em sobrecarga;
- Mentor separa Residência e Vestibular;
- Dashboard usa autopilot real;
- `mentor.js` não é mais o motor principal da próxima ação;
- testes passam;
- build passa;
- mojibake passa.

---

## 10. Comando para o executor

Execute esta versão depois do Bloco K:

```txt
Corrija primeiro as inconsistências pós-K listadas neste Bloco L v2. Depois refatore o Mentor para consumir os sinais novos. Pare ao primeiro erro de teste/build causado por alteração recente e corrija antes de avançar. Não faça commit, deploy ou push.
```
