# MEDREV — BLOCO P0: FSRS por Blocos de Conteúdo + Interleaving com Fallback Seguro

> **Executor recomendado:** Gemini 3.5 Flash / modelo pequeno executor  
> **Modo:** agente com aprovação manual, sem refatoração ampla  
> **Objetivo:** corrigir o comportamento inicial do FSRS-lite para respeitar que o MedRev agenda **blocos de conteúdo**, não flashcards atomizados, e transformar a prática intercalada em uma recomendação robusta que funciona mesmo quando não há outros temas de revisão no dia.  
> **Prioridade:** P0 cirúrgico. Não mexer no mentor, dashboard, Action Inbox ou arquitetura geral além do necessário para passar dados corretos.

---

## 0. Leitura obrigatória antes de editar

Este bloco existe porque o problema atual NÃO é simplesmente “colocar FSRS puro”.

O MedRev não agenda cartões atomizados como Anki. Ele agenda **temas/blocos**: Cardiomiopatias, Abdome agudo, DPOC, Síndrome nefrótica, Pré-natal etc. Cada bloco contém múltiplas microinformações, habilidades e tipos de questão.

Portanto:

```txt
Flashcard atomizado:
- 1 unidade de memória relativamente pequena
- FSRS pode estimar S/D/R por cartão
- intervalos podem ser mais livres

Bloco de conteúdo MedRev:
- várias micro-memórias dentro do mesmo tema
- parte factual + parte de aplicação + parte clínica
- acerto em questões é proxy imperfeito
- intervalo inicial não deve ser totalmente livre
```

A decisão correta para P0 é:

```txt
Manter checkpoints pedagógicos D0/D1/D4/D7/D21,
mas transformar D1→D4, D4→D7 e D7→D21 em transições adaptativas com bandas seguras.
```

NÃO implemente FSRS canônico completo agora. NÃO instale dependência nova. NÃO otimize parâmetros por usuário neste bloco. Isso é P1/P2.

---

## 1. Diagnóstico do código atual

### 1.1 Arquivos centrais envolvidos

Você deve trabalhar principalmente nestes arquivos:

```txt
src/core/fsrs.js
src/core/fsrs.test.js
src/core/store.js
src/components/FocusMode.jsx
src/App.js
```

E criar, se necessário:

```txt
src/core/interleavingPlanner.js
src/core/interleavingPlanner.test.js
```

### 1.2 O que já está bom

O projeto já tem um FSRS-lite maduro:

```txt
D0 → D1 → D4 → D7 → D21 → manutenção
S = estabilidade
D = dificuldade
reviewHistory
relearning
manutenção com fsrsRawInterval / maintenanceInterval
```

Não desmonte isso.

### 1.3 Problema P0-A: o início ainda é rígido demais

Em `src/core/fsrs.js`, a função atual:

```js
export function nextInterval(S, baseOffset, desiredRetention = 0.90, maxInterval = 180, D = 0.5) {
  if (baseOffset <= 1) return Math.max(1, baseOffset);
  const difficultyFactor = 1.05 - 0.1 * D;
  const raw = (S / FSRS_FACTOR) * (desiredRetention ** (1 / FSRS_DECAY) - 1) * difficultyFactor;
  const lo = Math.round(baseOffset * 0.85);
  const hi = Math.round(baseOffset * 1.15);
  let val = Math.round(Math.min(Math.max(raw, lo), hi));
  if (maxInterval && val > maxInterval) {
    val = maxInterval;
  }
  return val;
}
```

Hoje, ela prende o intervalo em uma banda de ±15% em torno do `baseOffset`. Além disso, em `recalcAfterMark`, o código usa:

```js
const interval = nextInterval(S_new, nextStep.offset, desiredRetention, maxInterval, D_new);
```

O problema técnico é sutil:

```txt
nextStep.offset é offset absoluto desde D0.
Mas após concluir uma etapa, precisamos de intervalo de transição desde a data atual/revisada.
```

Exemplo:

```txt
D1 concluído hoje → próxima etapa D4 deveria ocorrer em ~2–5 dias.
Mas o código passa nextStep.offset = 4 como se fosse intervalo.
```

Isso é aceitável enquanto tudo era fixo, mas limita demais o FSRS-lite agora que o produto precisa ser mais inteligente.

### 1.4 Problema P0-B: interleaving só aparece quando há siblings por `parentTopic`

Em `src/components/FocusMode.jsx`, existe:

```js
const canInterleave = useMemo(() => {
  if (!tema || !tema.parentTopic) return false;
  const siblingCount = temas.filter(t => t.parentTopic === tema.parentTopic).length;
  return siblingCount >= 3;
}, [tema, temas]);
```

Isso é estreito demais.

Interleaving no MedRev não deve depender apenas de `parentTopic`. Deve responder:

```txt
1. Existe outro tema vencido/para hoje que possa ser misturado?
2. Se não, existe tema próximo de vencer?
3. Se não, existe tema maduro relacionado para contraste?
4. Se não, dá para fazer interleaving interno dentro do próprio tema?
```

A resposta para “e se não tiver mais temas de revisão no dia?” é:

```txt
Não inventar revisão oficial.
Não bloquear o aluno.
Não marcar outro tema como feito.
Recomendar interleaving interno ou leve, sem mexer no calendário oficial.
```

### 1.5 Problema P0-C: `interleaved` parece afetar XP, mas não vira dado histórico confiável

No `FocusMode`, o estado existe:

```js
const [interleaved, setInterleaved] = useState(false);
```

E o `App.js` calcula XP com:

```js
const isInterleaved = !!markData.interleaved;
const xpGained = xpForReview({ acerto, stepKey, isInterleaved });
```

Mas o `markStep` no `store.js` não recebe nem persiste claramente:

```txt
interleaved
interleavingStatus
interleavingPlan
interleavingCandidateIds
```

P0 deve registrar esse dado no histórico, sem transformar candidatos em revisões oficiais.

---

## 2. Decisão de produto: como deve funcionar

### 2.1 Checkpoints continuam existindo

Não renomeie visualmente o ciclo inteiro agora. O usuário ainda entende:

```txt
D0 = estudo + questões
D1 = brain dump
D4 = revisão curta por questões
D7 = consolidação + Anki
D21 = revisão intercalada / longo prazo
Manutenção = recorrência madura
```

Mas internamente, trate D1/D4/D7/D21 como **checkpoints semânticos**, não como datas fixas absolutas.

### 2.2 Política de intervalo inicial

Regra P0:

```txt
D0 → D1: fixo em 1 dia.
D1 → D4: adaptativo entre 2 e 5 dias.
D4 → D7: adaptativo entre 2 e 6 dias.
D7 → D21: adaptativo entre 10 e 21 dias.
D21 → manutenção: já usa manutenção livre por S real; preservar.
```

Justificativa:

```txt
D0→D1 precisa ser rígido porque bloco de conteúdo exige reconsolidação inicial rápida.
As demais transições podem variar, mas dentro de bandas seguras para não destruir a pedagogia.
```

### 2.3 Interleaving vira recomendação com fallback

Interleaving deve ser:

```txt
D21: recomendado forte.
Manutenção: recomendado forte.
D7: recomendado leve/opcional.
D0/D1/D4: não recomendar por padrão neste bloco.
```

Se houver outros temas vencidos/para hoje:

```txt
Mostrar: “Misture com: Tema A, Tema B”.
```

Se não houver outros temas no dia:

```txt
Mostrar: “Sem outras revisões hoje. Faça interleaving interno: contraste diagnóstico diferencial, conduta, complicações e armadilhas do próprio tema.”
```

Se houver tema próximo de vencer:

```txt
Mostrar: “Há tema próximo de vencer. Você pode fazer 2–5 questões de contraste, mas isso não conclui a revisão oficial desse tema.”
```

Regra inegociável:

```txt
Interleaving NUNCA marca outro tema como revisado automaticamente.
```

---

## 3. Não fazer neste bloco

Não faça:

```txt
- Não instalar ts-fsrs, fsrs-rs ou biblioteca externa.
- Não trocar todo o scheduler.
- Não mexer no Action Inbox.
- Não unificar mentorDecisionPolicy com buildActionCandidatesFromState.
- Não criar Student Model/BKT agora.
- Não mexer em ENAMED/TRI agora.
- Não refatorar App.js, Dashboard ou FocusMode por inteiro.
- Não criar banco de questões.
- Não criar temas automaticamente para interleaving.
- Não marcar candidatos de interleaving como done.
- Não fazer reschedule global das revisões antigas.
- Não mexer no fluxo Já Domino/domínio prévio salvo se um teste quebrar diretamente.
```

---

## 4. Implementação P0-A — intervalos adaptativos por transição

### 4.1 Criar política explícita em `src/core/fsrs.js`

Adicionar perto da definição de `STEPS` ou perto de `nextInterval`:

```js
export const LEARNING_TRANSITION_POLICY = Object.freeze({
  d0: { next: "d1", nominal: 1, min: 1, max: 1, fsrsWeight: 0.0 },
  d1: { next: "d4", nominal: 3, min: 2, max: 5, fsrsWeight: 0.25 },
  d4: { next: "d7", nominal: 3, min: 2, max: 6, fsrsWeight: 0.35 },
  d7: { next: "d21", nominal: 14, min: 10, max: 21, fsrsWeight: 0.45 },
});
```

Observação importante:

```txt
Aqui `nominal` é intervalo de transição, não offset absoluto.
```

### 4.2 Criar helpers puros

Adicionar funções puras. Não dependa de React/Zustand aqui.

```js
function clampNumber(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function getQuestionTrustMultiplier(questoes) {
  const q = Number(questoes);
  if (!Number.isFinite(q) || q <= 0) return 0.85;
  if (q >= 20) return 1.0;
  if (q >= 10) return 0.95;
  if (q >= 5) return 0.90;
  return 0.85;
}

function getRatingIntervalMultiplier(rating) {
  if (rating === "easy") return 1.12;
  if (rating === "good") return 1.0;
  if (rating === "hard") return 0.82;
  return 0.75;
}

function getCalibrationMultiplier(previsao, acerto) {
  const p = normalizeAcerto(previsao);
  const a = normalizeAcerto(acerto);
  if (p == null || a == null) return 1.0;
  const gap = p - a;
  if (gap >= 0.30) return 0.80;
  if (gap >= 0.20) return 0.88;
  if (gap >= 0.10) return 0.95;
  if (gap <= -0.20) return 1.05;
  return 1.0;
}

function getImportanceMultiplier(importancia) {
  const value = String(importancia || "").toUpperCase();
  if (value.includes("DIAMANTE")) return 0.90;
  if (value.includes("ALTA")) return 0.95;
  return 1.0;
}
```

### 4.3 Criar função exportada principal

Adicionar em `src/core/fsrs.js`:

```js
export function getAdaptiveLearningInterval({
  doneKey,
  S,
  D,
  acerto,
  rating,
  questoes,
  previsao,
  importancia,
  desiredRetention = 0.90,
  maxInterval = 180,
} = {}) {
  const policy = LEARNING_TRANSITION_POLICY[doneKey];
  if (!policy) return null;

  if (policy.min === policy.max) return policy.min;

  const safeS = Number.isFinite(Number(S)) ? Number(S) : S_BASE[doneKey] || policy.nominal;
  const safeD = Number.isFinite(Number(D)) ? Number(D) : 0.5;
  const fsrsRaw = fsrsRawInterval(safeS, desiredRetention, safeD);

  const blended = (policy.nominal * (1 - policy.fsrsWeight)) + (fsrsRaw * policy.fsrsWeight);
  const ratingMult = getRatingIntervalMultiplier(rating || toRating(acerto));
  const trustMult = getQuestionTrustMultiplier(questoes);
  const calibrationMult = getCalibrationMultiplier(previsao, acerto);
  const importanceMult = getImportanceMultiplier(importancia);

  const adjusted = blended * ratingMult * trustMult * calibrationMult * importanceMult;
  const bounded = Math.round(clampNumber(adjusted, policy.min, Math.min(policy.max, maxInterval || policy.max)));

  return Math.max(1, bounded);
}
```

Notas:

```txt
- O cálculo usa FSRS como força moderadora, não como dono absoluto da data.
- `questoes` baixo reduz confiança no salto.
- overconfidence encurta intervalo.
- tema muito importante encurta um pouco.
- D0→D1 segue fixo.
```

### 4.4 Trocar o cálculo de transição em `recalcAfterMark`

Encontrar este trecho:

```js
const interval = nextInterval(S_new, nextStep.offset, desiredRetention, maxInterval, D_new);
```

Trocar por:

```js
const interval = getAdaptiveLearningInterval({
  doneKey,
  S: S_new,
  D: D_new,
  acerto: acertoNorm,
  rating: effectiveRating,
  questoes: eventStep?.questoes,
  previsao: eventStep?.previsao,
  importancia: rev?.meta?.importancia,
  desiredRetention,
  maxInterval,
}) ?? nextInterval(S_new, nextStep.offset, desiredRetention, maxInterval, D_new);
```

Não remova `nextInterval`. Ela pode continuar existindo como helper legado e para testes antigos.

### 4.5 Passar importância do tema sem quebrar chamadas

Em `src/core/store.js`, após montar `revMarked`, antes de chamar `recalcAfterMark`, acrescente `meta.importancia` no `revMarked` sem alterar schema amplo:

```js
const revMarked = {
  ...t.rev,
  meta: {
    ...(t.rev?.meta || {}),
    importancia: t.importancia,
  },
  [stepKey]: {
    ...currentStep,
    done: true,
    ...
  },
};
```

Isso evita mudar a assinatura de `recalcAfterMark`.

---

## 5. Implementação P0-B — planner de interleaving com fallback

### 5.1 Criar `src/core/interleavingPlanner.js`

Criar arquivo puro, sem React.

```js
import { todayStr } from "./date";

function toDateValue(date) {
  return String(date || "").slice(0, 10);
}

function daysBetween(from, to) {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / 86400000);
}

function getStepDueItems(tema, today) {
  const rev = tema?.rev || {};
  const keys = ["d1", "d4", "d7", "d21", "manutencao"];
  return keys
    .map((key) => {
      const step = rev[key];
      if (!step || step.done) return null;
      const date = toDateValue(step.date || step.scheduledAt);
      if (!date) return null;
      const delta = daysBetween(today, date);
      if (delta == null) return null;
      return { tema, stepKey: key, date, delta };
    })
    .filter(Boolean);
}

function candidateReason(currentTema, candidate, status) {
  const other = candidate.tema;
  if (other.parentTopic && currentTema.parentTopic && other.parentTopic === currentTema.parentTopic) {
    return "mesmo macrotema";
  }
  if (other.esp && currentTema.esp && other.esp === currentTema.esp) {
    return "mesma área";
  }
  if (status === "near_due_only") return "vence em breve";
  if (status === "mature_only") return "contraste maduro";
  return "contraste útil";
}

function toCandidate(currentTema, item, status) {
  return {
    temaId: item.tema.id,
    temaNome: item.tema.nome,
    esp: item.tema.esp,
    parentTopic: item.tema.parentTopic || null,
    stepKey: item.stepKey,
    date: item.date,
    delta: item.delta,
    reason: candidateReason(currentTema, item, status),
    official: false,
  };
}

function getMatureContrastCandidates(currentTema, temas, today) {
  return temas
    .filter((t) => t && t.id !== currentTema?.id)
    .filter((t) => t.rev?.d21?.done || t.rev?.manutencao)
    .map((t) => ({
      tema: t,
      stepKey: t.rev?.manutencao ? "manutencao" : "d21",
      date: today,
      delta: 0,
    }));
}

export function buildInterleavingPlan({ tema, temas = [], stepKey, platKey, today = todayStr() } = {}) {
  if (!tema || !stepKey) {
    return { shouldRecommend: false, mode: "none", status: "invalid", candidates: [] };
  }

  const isStrongStep = stepKey === "d21" || stepKey === "manutencao";
  const isLightStep = stepKey === "d7";
  if (!isStrongStep && !isLightStep) {
    return { shouldRecommend: false, mode: "none", status: "not_applicable", candidates: [] };
  }

  const others = temas.filter((t) => t && t.id !== tema.id);
  const dueItems = others
    .flatMap((t) => getStepDueItems(t, today))
    .filter((item) => item.delta <= 0)
    .sort((a, b) => {
      const sameParentA = a.tema.parentTopic && tema.parentTopic && a.tema.parentTopic === tema.parentTopic ? 0 : 1;
      const sameParentB = b.tema.parentTopic && tema.parentTopic && b.tema.parentTopic === tema.parentTopic ? 0 : 1;
      if (sameParentA !== sameParentB) return sameParentA - sameParentB;
      const sameEspA = a.tema.esp === tema.esp ? 0 : 1;
      const sameEspB = b.tema.esp === tema.esp ? 0 : 1;
      if (sameEspA !== sameEspB) return sameEspA - sameEspB;
      return a.delta - b.delta;
    });

  if (dueItems.length > 0) {
    const candidates = dueItems.slice(0, 3).map((item) => toCandidate(tema, item, "has_due_candidates"));
    return {
      shouldRecommend: true,
      mode: "full",
      status: "has_due_candidates",
      title: "Prática intercalada recomendada",
      message: "Misture algumas questões deste tema com revisões vencidas ou de hoje. Só a revisão atual será concluída oficialmente.",
      candidates,
      officialPolicy: "only_current_review_is_official",
    };
  }

  const nearItems = others
    .flatMap((t) => getStepDueItems(t, today))
    .filter((item) => item.delta > 0 && item.delta <= 3)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 3);

  if (nearItems.length > 0) {
    return {
      shouldRecommend: true,
      mode: "light",
      status: "near_due_only",
      title: "Interleaving leve disponível",
      message: "Não há outra revisão vencida hoje. Use um tema próximo de vencer apenas como contraste, sem marcar essa revisão como concluída.",
      candidates: nearItems.map((item) => toCandidate(tema, item, "near_due_only")),
      officialPolicy: "only_current_review_is_official",
    };
  }

  const mature = getMatureContrastCandidates(tema, others, today).slice(0, 3);
  if (mature.length > 0) {
    return {
      shouldRecommend: true,
      mode: "light",
      status: "mature_only",
      title: "Interleaving de contraste",
      message: "Não há revisões vencidas hoje. Misture 2–5 questões de um tema já estudado para treinar discriminação clínica.",
      candidates: mature.map((item) => toCandidate(tema, item, "mature_only")),
      officialPolicy: "only_current_review_is_official",
    };
  }

  const clinicalCopy = platKey === "res";
  return {
    shouldRecommend: true,
    mode: "self",
    status: "self_only",
    title: "Interleaving interno",
    message: clinicalCopy
      ? "Sem outros temas úteis hoje. Faça contraste interno: diagnóstico diferencial, conduta, complicações, critérios e pegadinhas do próprio tema."
      : "Sem outros temas úteis hoje. Faça contraste interno: conceitos parecidos, exercícios fáceis versus difíceis e erros antigos do próprio tema.",
    candidates: [],
    officialPolicy: "only_current_review_is_official",
  };
}
```

Se o projeto não tiver `todayStr` em `src/core/date`, importe de onde já é usado no código. Não crie uma segunda função de data se já existir helper canônico.

### 5.2 Criar testes do planner

Criar `src/core/interleavingPlanner.test.js`.

Casos mínimos:

```txt
1. Em D21 com outro tema vencido hoje → status has_due_candidates.
2. Exclui o tema atual dos candidatos.
3. Se não há vencidos mas há tema em 1–3 dias → status near_due_only.
4. Se não há vencidos nem próximos mas há tema maduro → status mature_only.
5. Se não há nenhum candidato → status self_only.
6. Nenhum candidato retorna official:true.
7. D4 retorna shouldRecommend:false.
8. D7 retorna recomendação leve.
```

Exemplo de teste:

```js
import { buildInterleavingPlan } from "./interleavingPlanner";

const makeTema = (overrides = {}) => ({
  id: overrides.id || "t1",
  nome: overrides.nome || "Tema",
  esp: overrides.esp || "Clínica Médica",
  parentTopic: overrides.parentTopic || "Cardio",
  rev: overrides.rev || {},
});

test("D21 recomenda candidatos vencidos sem marcar como oficiais", () => {
  const current = makeTema({ id: "current", nome: "IAM" });
  const due = makeTema({
    id: "due",
    nome: "Insuficiência cardíaca",
    rev: { d7: { done: false, date: "2026-06-04" } },
  });

  const plan = buildInterleavingPlan({
    tema: current,
    temas: [current, due],
    stepKey: "d21",
    platKey: "res",
    today: "2026-06-04",
  });

  expect(plan.shouldRecommend).toBe(true);
  expect(plan.status).toBe("has_due_candidates");
  expect(plan.candidates[0].temaId).toBe("due");
  expect(plan.candidates[0].official).toBe(false);
});
```

---

## 6. Implementação P0-C — ligar planner no FocusMode

### 6.1 Substituir `canInterleave`

No `FocusMode.jsx`, importar:

```js
import { buildInterleavingPlan } from "../core/interleavingPlanner";
```

Substituir o `canInterleave` atual por:

```js
const interleavingPlan = useMemo(() => buildInterleavingPlan({
  tema,
  temas,
  stepKey,
  platKey: plat,
}), [tema, temas, stepKey, plat]);

const canInterleave = !!interleavingPlan?.shouldRecommend;
```

Se `plat` não existir nesse escopo, usar o nome real já disponível no componente. Não crie prop nova se já há `platKey`, `platform` ou similar.

### 6.2 Atualizar card visual

Substituir o texto fixo atual:

```jsx
Você tem {temas.filter(t => t.parentTopic === tema.parentTopic).length} subtemas ativos...
```

Por algo dinâmico:

```jsx
<span className="font-bold text-blue-400 block mb-0.5">
  {interleavingPlan.title || "Prática intercalada"}
</span>
<span>{interleavingPlan.message}</span>
{interleavingPlan.candidates?.length > 0 && (
  <ul className="mt-2 space-y-1 text-gray-400">
    {interleavingPlan.candidates.map((c) => (
      <li key={`${c.temaId}-${c.stepKey}`}>
        • {c.temaNome} — {c.reason}
      </li>
    ))}
  </ul>
)}
<p className="mt-2 text-[11px] text-gray-500">
  Apenas a revisão atual será concluída oficialmente.
</p>
```

Regra de UX:

```txt
- D21/manutenção: texto com “recomendado”.
- D7: texto com “opcional”.
- Sem candidatos: não esconder card; mostrar interleaving interno.
```

### 6.3 Passar `interleavingPlan` no markData

Onde o FocusMode já passa:

```js
interleaved
```

adicionar:

```js
interleavingPlan,
interleavingStatus: interleavingPlan?.status,
```

Não precisa salvar o objeto inteiro no estado se ficar pesado. O ideal é passar e o store selecionar campos pequenos.

---

## 7. Implementação P0-D — persistir interleaving no histórico sem criar revisão falsa

### 7.1 Atualizar assinatura de `markStep` no store

Em `src/core/store.js`, mudar:

```js
markStep: (platKey, temaId, stepKey, { acerto, previsao, questoes, motivosErro, erros, tempoMin, ansiedade, cansaco, confianca, dificuldade, foco, c1, c2, c3, c4, c5, modoReduzido, descansoPrescrito }) =>
```

Para incluir:

```js
interleaved,
interleavingStatus,
interleavingPlan,
```

Exemplo:

```js
markStep: (platKey, temaId, stepKey, {
  acerto,
  previsao,
  questoes,
  motivosErro,
  erros,
  tempoMin,
  ansiedade,
  cansaco,
  confianca,
  dificuldade,
  foco,
  c1, c2, c3, c4, c5,
  modoReduzido,
  descansoPrescrito,
  interleaved,
  interleavingStatus,
  interleavingPlan,
}) =>
```

### 7.2 Salvar no step atual

Dentro de `[stepKey]`, adicionar:

```js
interleaved: !!interleaved,
interleavingStatus: interleavingStatus || interleavingPlan?.status || null,
interleavingCandidateIds: Array.isArray(interleavingPlan?.candidates)
  ? interleavingPlan.candidates.map((c) => c.temaId).filter(Boolean).slice(0, 5)
  : [],
```

### 7.3 Passar dados do `App.js`

Em todas as chamadas relevantes de `markStep` e `addTemaStats`, adicionar:

```js
interleaved: !!markData.interleaved,
interleavingStatus: markData.interleavingStatus || markData.interleavingPlan?.status || null,
interleavingCandidateIds: markData.interleavingPlan?.candidates?.map((c) => c.temaId).filter(Boolean).slice(0, 5) || [],
```

Não precisa aplicar em D1 se o FocusMode não envia. Mas não quebra se enviar `false`.

### 7.4 Persistir no `reviewHistory`

Em `src/core/fsrs.js`, localizar `historyBase` dentro de `recalcAfterMark`. Acrescentar campos pequenos:

```js
interleaved: !!eventStep?.interleaved,
interleavingStatus: eventStep?.interleavingStatus || null,
interleavingCandidateIds: Array.isArray(eventStep?.interleavingCandidateIds)
  ? eventStep.interleavingCandidateIds.slice(0, 5)
  : [],
```

Não salve o plano inteiro no histórico.

Regra:

```txt
O histórico guarda o fato de que a revisão foi intercalada.
O calendário não mexe nos candidatos.
```

---

## 8. Implementação P0-E — copy pedagógico

Procure textos que prometem “intervalos fixos cientificamente” ou algo parecido.

Trocar por:

```txt
Checkpoints científicos com datas adaptativas dentro de limites seguros.
```

Ou:

```txt
O MedRev usa checkpoints D0/D1/D4/D7/D21 e ajusta as próximas datas conforme desempenho, carga e estabilidade.
```

Não faça uma varredura cosmética ampla. Alterar só textos próximos ao FSRS, revisão e interleaving.

---

## 9. Testes obrigatórios

### 9.1 Atualizar `src/core/fsrs.test.js`

Adicionar testes para `getAdaptiveLearningInterval`.

Casos mínimos:

```txt
1. D0→D1 sempre retorna 1.
2. D1 hard retorna menor ou igual que D1 easy.
3. D1 fica entre 2 e 5.
4. D4 fica entre 2 e 6.
5. D7 fica entre 10 e 21.
6. Poucas questões não permitem salto máximo fácil.
7. Overconfidence encurta intervalo versus aluno calibrado.
8. maintenanceInterval continua crescendo pelo S real.
9. Testes antigos de relearning/again continuam passando.
```

Exemplo:

```js
test("adaptive learning keeps D0 to D1 fixed", () => {
  expect(getAdaptiveLearningInterval({
    doneKey: "d0",
    S: 10,
    D: 0.2,
    acerto: 1,
    rating: "easy",
    questoes: 40,
  })).toBe(1);
});

test("adaptive learning keeps D1 transition inside safe band", () => {
  const hard = getAdaptiveLearningInterval({
    doneKey: "d1",
    S: 2,
    D: 0.8,
    acerto: 0.6,
    rating: "hard",
    questoes: 10,
  });

  const easy = getAdaptiveLearningInterval({
    doneKey: "d1",
    S: 12,
    D: 0.2,
    acerto: 0.95,
    rating: "easy",
    questoes: 25,
  });

  expect(hard).toBeGreaterThanOrEqual(2);
  expect(easy).toBeLessThanOrEqual(5);
  expect(hard).toBeLessThanOrEqual(easy);
});
```

Se houver teste antigo com nome parecido com:

```txt
nextInterval anchors fixed offsets to a 15 percent band
```

Não delete cegamente. Atualize o teste para dizer que `nextInterval` é helper legado OU crie testes novos para a função adaptativa. O comportamento de produto deve ser medido pela função nova.

### 9.2 Criar `src/core/interleavingPlanner.test.js`

Cobrir os casos do item 5.2.

### 9.3 Testes de integração leve

Se houver teste de `store`, adicionar só um caso pequeno:

```txt
markStep persiste interleaved/interleavingStatus/interleavingCandidateIds no step revisado.
```

Se não houver teste simples de store, não crie suíte complexa neste P0. Foque em `fsrs.test.js` e `interleavingPlanner.test.js`.

---

## 10. Sequência segura de execução

### Fase 0 — preflight sem editar

Rodar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false --runTestsByPath src/core/fsrs.test.js
npm run build
```

Se `--runTestsByPath` falhar por limitação do CRA/Jest, usar:

```bash
npm test -- --watchAll=false src/core/fsrs.test.js
```

Registrar no relatório final:

```txt
- estado do git antes
- testes que já falhavam antes
- build antes
```

### Fase 1 — FSRS adaptativo puro

Editar só:

```txt
src/core/fsrs.js
src/core/fsrs.test.js
```

Rodar:

```bash
npm test -- --watchAll=false --runTestsByPath src/core/fsrs.test.js
npm run check:mojibake
```

### Fase 2 — ligar `rev.meta.importancia` no store

Editar:

```txt
src/core/store.js
```

Rodar:

```bash
npm test -- --watchAll=false --runTestsByPath src/core/fsrs.test.js
npm run check:mojibake
```

### Fase 3 — interleaving planner puro

Criar/editar:

```txt
src/core/interleavingPlanner.js
src/core/interleavingPlanner.test.js
```

Rodar:

```bash
npm test -- --watchAll=false --runTestsByPath src/core/interleavingPlanner.test.js
npm run check:mojibake
```

### Fase 4 — UI e persistência mínima

Editar:

```txt
src/components/FocusMode.jsx
src/App.js
src/core/store.js
src/core/fsrs.js
```

Rodar:

```bash
npm test -- --watchAll=false --runTestsByPath src/core/fsrs.test.js src/core/interleavingPlanner.test.js
npm run check:mojibake
npm run build
```

### Fase 5 — relatório final

O Gemini deve entregar um resumo com:

```txt
1. Arquivos alterados.
2. Funções criadas.
3. Testes criados/alterados.
4. Comandos executados e resultado.
5. Decisões de produto preservadas.
6. Qualquer falha não resolvida.
```

---

## 11. Critérios de aceite

Este bloco só está pronto se tudo abaixo for verdadeiro:

```txt
[ ] D0→D1 continua sempre amanhã.
[ ] D1→D4 varia dentro de 2–5 dias.
[ ] D4→D7 varia dentro de 2–6 dias.
[ ] D7→D21 varia dentro de 10–21 dias.
[ ] hard agenda antes ou igual a easy, nunca depois.
[ ] poucas questões reduzem confiança no salto de intervalo.
[ ] overconfidence reduz intervalo.
[ ] manutenção pós-D21 continua usando S real e não volta para intervalo fixo.
[ ] interleaving aparece em D21/manutenção mesmo sem sibling por parentTopic.
[ ] se não houver outros temas do dia, a UI recomenda interleaving interno.
[ ] candidatos de interleaving nunca são marcados como concluídos automaticamente.
[ ] reviewHistory registra interleaved/status/candidateIds pequenos.
[ ] XP por interleaving continua funcionando.
[ ] npm run check:mojibake passa.
[ ] npm run build passa.
```

---

## 12. Resposta objetiva ao problema conceitual

### “O problema do FSRS não fixo no começo é porque são blocos, não flashcards?”

Sim. Esse é o ponto certo.

Para flashcards, cada item é pequeno e o histórico de respostas representa bem aquela unidade. Para blocos de conteúdo, uma revisão mistura várias subcompetências. Um aluno pode acertar IAM porque domina diagnóstico, mas errar conduta, complicações ou critérios de reperfusão. Por isso, FSRS puro cedo demais pode superestimar estabilidade.

A solução P0 é:

```txt
Não deixar tudo fixo.
Não deixar tudo livre.
Usar checkpoints pedagógicos com bandas adaptativas.
```

### “Interleaving deve ser recomendado, mas e se não tiver mais temas de revisão no dia?”

O sistema deve cair nesta escada:

```txt
1. Misturar com revisões vencidas/de hoje, se existirem.
2. Se não existirem, misturar com tema que vence em até 3 dias, sem concluir oficialmente.
3. Se não existir, misturar com tema maduro já estudado, sem concluir oficialmente.
4. Se não existir, fazer interleaving interno dentro do próprio tema.
```

Nunca crie revisão falsa. Nunca bloqueie o aluno. Nunca marque candidato como feito.

---

## 13. Prompt curto para o Gemini 3.5 Flash

Use este comando se for colar no Gemini junto com este arquivo:

```txt
Você é um engenheiro executor conservador. Implemente apenas o BLOCO P0 descrito neste arquivo.

Objetivo:
1. Tornar os intervalos iniciais do FSRS-lite adaptativos por transição, respeitando que o MedRev agenda blocos de conteúdo, não flashcards atomizados.
2. Criar interleaving planner com fallback: due candidates → near due → mature contrast → self-interleaving.
3. Persistir interleaving no step/reviewHistory sem marcar candidatos como revisados.

Regras:
- Não refatore arquitetura ampla.
- Não instale dependências.
- Não mexa no mentor/action inbox/dashboard.
- Não faça reschedule global.
- Não marque outro tema como done por causa de interleaving.
- Preserve D0→D1 fixo em 1 dia.
- Faça testes puros primeiro.

Arquivos esperados:
- src/core/fsrs.js
- src/core/fsrs.test.js
- src/core/interleavingPlanner.js
- src/core/interleavingPlanner.test.js
- src/components/FocusMode.jsx
- src/App.js
- src/core/store.js

Validação obrigatória:
- npm run check:mojibake
- npm test -- --watchAll=false --runTestsByPath src/core/fsrs.test.js src/core/interleavingPlanner.test.js
- npm run build

Ao final, entregue relatório com arquivos alterados, testes, comandos e riscos restantes.
```

---

## 14. Referências técnicas usadas para a decisão

Estas referências explicam por que o P0 deve ser adaptativo, mas controlado:

```txt
- FSRS usa DSR: retrievability, stability e difficulty, ajustados por histórico de revisão.
- Otimizadores FSRS modernos usam histórico do usuário para encontrar parâmetros; isso é P1/P2, não P0.
- Practice testing e distributed practice têm alta utilidade educacional.
- Interleaving é promissor, mas mais contextual; por isso deve ser recomendado com fallback, não imposto.
- Para habilidades múltiplas, modelos que consideram skill tagging e esquecimento são mais adequados que agendamento genérico puro.
```

Referências para leitura humana:

```txt
Anki Manual — FSRS Parameters / optimizer:
https://docs.ankiweb.net/deck-options.html

Anki FAQ — FSRS, DSR e review history:
https://faqs.ankiweb.net/what-spaced-repetition-algorithm

FSRS4Anki — scheduler + optimizer:
https://github.com/open-spaced-repetition/fsrs4anki

Dunlosky et al., 2013 — effective learning techniques:
https://www.whz.de/fileadmin/lehre/hochschuldidaktik/docs/dunloskiimprovingstudentlearning.pdf

DAS3H — student learning/forgetting model for multi-skill distributed practice:
https://arxiv.org/abs/1905.06873
```

---

## 15. Nota final de arquitetura

Este bloco é P0 porque melhora o motor sem aumentar a entropia.

A unificação maior do produto continua sendo:

```txt
mentorDecisionPolicy como núcleo único de decisão
Action Inbox derivado dele
Dashboard só renderiza decisão, não decide
Student Model em cima de reviewHistory + erros + previsão/acerto
```

Mas isso fica para outro bloco. Aqui a tarefa é menor e mais segura:

```txt
Corrigir a inteligência da próxima data e tornar o interleaving honesto.
```
