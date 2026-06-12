# MEDREV — BLOCO P1.2 — CALIBRAÇÃO METACOGNITIVA ACIONÁVEL

**Arquivo para implementação por modelo menor:** Gemini 3.5 Flash / Claude Sonnet / Codex executor  
**Prioridade:** P1.2  
**Status:** implementar depois do P1.1 ou em paralelo seguro, pois não depende do scheduler oficial  
**Regra de segurança:** este bloco **não muda datas de revisão, FSRS, Firebase, localStorage, Mentor Decision Engine nem ActionInbox**.

---

## 0. Veredito antes de implementar

O P1.2 do roadmap mestre **não é optimizer FSRS**.

O roadmap original definiu:

```txt
BLOCO P1-1 — FSRS canônico em sombra.
BLOCO P1-2 — Calibração: core/calibration.js computa curva confiança×acerto e expõe métrica em metricsRegistry.
BLOCO P1-3 — Máquina de modo.
```

Então o P1.2 correto é transformar a calibração metacognitiva de um card simples em um **motor interpretável de confiança vs desempenho**, reaproveitando dados já coletados:

```txt
previsao  → estimativa prévia do aluno
acerto    → desempenho real
questoes  → peso/amostra
stepKey   → contexto da revisão
tema/esp  → área ou matéria
completedAt/reviewedAt → data
```

O objetivo não é criar uma feature nova. O objetivo é fazer o MedRev entender uma coisa que banco de questões normalmente não entende:

> O aluno sabe quando sabe? Ou está confiante demais / confiante de menos?

---

## 1. Arquivos revisados antes deste bloco

Antes de escrever este P1.2, foram revisados os documentos e o código atual:

### Roadmap e docs

```txt
/mnt/data/medrev_docs/MEDREV_CORE_AUDIT_AND_MASTER_IMPLEMENTATION_PLAN.md
/mnt/data/medrev_docs/MEDREV_PERSONALIZATION_AND_MENTOR_MASTERPLAN.md
/mnt/data/MEDREV_BLOCO_P1_1_FSRS_CANONICO_SOMBRA_GEMINI.md
/mnt/data/MEDREV_P0_COMPLETO_ORQUESTRACAO_DECISAO_E_EVIDENCIAS.md
/mnt/data/medrev_src/Bro/docs/P2_P3_P4_OPUS_AUDIT_PLAN.md
/mnt/data/medrev_src/Bro/docs/MEDREV_CONTEXT_FOR_AI.md
```

### Código atual

```txt
src/core/calibration.js
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
src/components/StatsPanel.jsx
src/core/store.js
src/components/FocusMode.jsx
package.json
.nvmrc
```

Achados concretos:

1. `.nvmrc` está em Node `20`, então não há bloqueio de runtime para P1.1/P1.2.
2. `src/core/calibration.js` já existe, mas é pequeno demais: calcula só erro absoluto médio, viés médio e tendência.
3. `StatsPanel.jsx` já importa `calcCalibration` e renderiza “Calibração Metacognitiva”.
4. `metricsRegistry.js` já existe e governa métricas, mas **não tem métrica de calibração**.
5. `metricsRegistry.test.js` tem lista obrigatória; ela deve ser atualizada para incluir a nova métrica.
6. `FocusMode.jsx` já salva `previsao` como proporção 0–1 quando preenchida.
7. `store.js` preserva `previsao`, `acerto`, `questoes`, `ansiedade`, `cansaco`, `confianca`, `foco` no step concluído.
8. `temaStats` recebe stats por tema em `addTemaStats`, mas o P1.2 deve aceitar dados antigos e incompletos.

---

## 2. Fundamentação científica do P1.2

### 2.1 Por que calibração metacognitiva importa

Self-regulated learning envolve cognição, metacognição, comportamento, motivação e afeto. Ou seja: estudar bem não é só acertar questão; é monitorar o próprio desempenho e escolher a próxima ação com base nesse monitoramento.

Fonte central:

- Panadero, 2017 — *A Review of Self-regulated Learning: Six Models and Four Directions for Research*.  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC5408091/

Implicação para o MedRev:

```txt
previsao e acerto não são enfeite.
Eles são sinal de autorregulação.
O Mentor deve saber se o aluno superestima ou subestima o próprio domínio.
```

### 2.2 Por que não basta mostrar “acerto médio”

O aluno pode ter 75% de acerto com 95% de confiança/previsão. Isso não é igual a 75% de acerto com 70% de previsão.

No primeiro caso há risco de **excesso de confiança**: o aluno acha que domina e pode parar cedo demais. No segundo, pode haver **subestimação**: o aluno sabe mais do que acha e talvez esteja gastando energia demais em tema já suficiente.

Fontes centrais:

- Bjork et al., 2013 — *Self-regulated learning: beliefs, techniques, and illusions*.  
  https://pubmed.ncbi.nlm.nih.gov/23020639/
- Bol & Hacker, 2012 — *Calibration Research: Where Do We Go from Here?*  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC3408109/

Implicação para o MedRev:

```txt
Acerto médio mede desempenho.
Calibração mede se o aluno sabe interpretar o próprio desempenho.
São métricas diferentes e complementares.
```

### 2.3 Por que isso é especialmente relevante em medicina

Na educação médica, calibração de confiança importa porque decisões clínicas exigem saber quando agir, quando pedir ajuda, quando revisar hipótese e quando reconhecer incerteza.

Fontes centrais:

- Cleary et al., 2019 — estudo com estudantes de medicina em simulação de paciente virtual, avaliando viés e acurácia de calibração.  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC6775028/
- Garbayo et al., 2023 — ferramenta de metacognitive confidence calibration para raciocínio diagnóstico em simulação.  
  https://pubmed.ncbi.nlm.nih.gov/35981722/
- Jaspan et al., 2022 — confiança e calibração em treinamento de radiologia diagnóstica.  
  https://pubmed.ncbi.nlm.nih.gov/33408052/

Implicação para o MedRev:

```txt
Para Residência, calibração é parte do raciocínio clínico e da segurança cognitiva.
Para Vestibular, calibração é parte de estratégia de prova e gestão de energia.
A métrica serve para res e vest, mas sem vazar conteúdo médico para vest.
```

### 2.4 Como medir sem exagerar cientificamente

O MedRev trabalha com sessões de revisão e blocos, não com item binário isolado. Portanto:

- `previsao` é probabilidade estimada de desempenho na sessão;
- `acerto` é proporção real de acerto na sessão;
- a diferença `previsao - acerto` mede viés;
- o erro absoluto médio mede precisão de previsão;
- erro quadrático médio pode ser usado como perda probabilística aproximada, mas deve ser chamado com cuidado.

Decisão de nomenclatura:

```txt
Usar "meanSquaredCalibrationLoss" ou "brierLikeLoss".
Não vender como Brier Score estrito quando acerto é proporção de sessão, não desfecho binário puro.
```

---

## 3. Objetivo em uma frase

Evoluir `src/core/calibration.js` para um motor puro que calcula **precisão de previsão, viés, perda quadrática, buckets de confiabilidade, tendência e ação recomendada**, e expor a métrica `confidenceCalibration` no `metricsRegistry` e no card de Stats.

---

## 4. Escopo do P1.2

### Implementa

1. Reescrever `src/core/calibration.js` mantendo compatibilidade com `calcCalibration`.
2. Criar `src/core/calibration.test.js`.
3. Adicionar métrica `confidenceCalibration` ao `src/core/metricsRegistry.js`.
4. Atualizar `src/core/metricsRegistry.test.js`.
5. Ajustar o card de calibração em `src/components/StatsPanel.jsx` para consumir o resultado novo sem hardcode excessivo.
6. Preservar aliases antigos `precisao` e `vies` para não quebrar UI.
7. Gerar mensagens acionáveis sem mexer no Mentor Decision Engine.

### Não implementa

1. Não mexe em FSRS oficial.
2. Não altera datas de revisão.
3. Não instala biblioteca nova.
4. Não cria Activity Log.
5. Não cria Student Model completo.
6. Não muda Firebase/localStorage/schema persistido.
7. Não muda ActionInbox.
8. Não muda `mentorDecisionPolicy`.
9. Não cria nova aba.
10. Não mistura Raciocínio Clínico no Vestibular.

---

## 5. Arquivos permitidos e proibidos

### Permitidos

```txt
src/core/calibration.js
src/core/calibration.test.js
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
src/components/StatsPanel.jsx
```

### Permitidos somente se o build exigir

```txt
src/core/mentor.js
```

Motivo: `StatsPanel` usa `getMentorPhrase` para frase de calibração. Preferir não mexer.

### Proibidos

```txt
src/core/fsrs.js
src/core/store.js
src/core/mentorDecisionPolicy.js
src/core/mentorSignals.js
src/core/actionInbox.js
src/core/readiness.js
src/firebase.js
src/App.js
src/components/FocusMode.jsx
src/components/Dashboard.jsx
package.json
package-lock.json
```

Se precisar tocar em qualquer proibido, parar e pedir decisão.

---

## 6. Contrato novo de `calibration.js`

### 6.1 Entrada aceita

`calcCalibration(stats)` deve continuar aceitando o que já recebe hoje:

```js
const flatStats = Object.values(temaStats || {}).flat();
calcCalibration(flatStats);
```

Mas deve ser tolerante a eventos vindos de revisão:

```js
{
  previsao: 0.8,        // ou 80
  acerto: 0.7,          // ou 70
  questoes: 20,
  stepKey: "d4",
  esp: "Clínica Médica",
  completedAt: "2026-06-04T...",
  reviewedAt: "2026-06-04"
}
```

### 6.2 Saída esperada

```js
{
  status: "coletando" | "baixa_confianca" | "ok",
  n: 12,
  minRequired: 10,
  minPreview: 5,
  score: 84,
  precisao: 84,                  // alias legado
  meanAbsoluteErrorPct: 16,
  rootMeanSquaredErrorPct: 19,
  meanSquaredCalibrationLoss: 0.036,
  brierLikeLoss: 0.036,          // alias documentado como aproximado
  biasPct: 12,
  vies: 12,                      // alias legado
  tendencia: "excesso_confianca" | "subestima" | "calibrado",
  severity: "ok" | "warning" | "critical",
  action: "...",
  interpretation: "...",
  buckets: [
    {
      id: "80-100",
      label: "80–100%",
      n: 4,
      meanPredictionPct: 88,
      meanAccuracyPct: 72,
      gapPct: 16,
      tendency: "excesso_confianca"
    }
  ],
  samples: [] // opcional; por padrão não retornar para não pesar UI
}
```

### 6.3 Status

```txt
n < 5      -> coletando
5 <= n <10 -> baixa_confianca
n >= 10   -> ok
```

Por quê?

```txt
5 eventos permitem preview.
10 eventos permitem alerta inicial.
15+ eventos devem ser requisito futuro para o Mentor usar como decisão forte.
```

---

## 7. Implementação mastigada — `src/core/calibration.js`

Substituir o arquivo atual por uma versão mais robusta, preservando `calcCalibration`.

```js
// src/core/calibration.js
// Metacognitive calibration: compara previsão prévia do aluno com desempenho real.
// P1.2: módulo puro, sem React, sem Zustand, sem persistência.

export const CALIBRATION_STATUS = Object.freeze({
  COLLECTING: "coletando",
  LOW_CONFIDENCE: "baixa_confianca",
  OK: "ok",
});

export const CALIBRATION_TREND = Object.freeze({
  OVERCONFIDENT: "excesso_confianca",
  UNDERCONFIDENT: "subestima",
  CALIBRATED: "calibrado",
});

export const CALIBRATION_SEVERITY = Object.freeze({
  OK: "ok",
  WARNING: "warning",
  CRITICAL: "critical",
});

export const DEFAULT_CALIBRATION_OPTIONS = Object.freeze({
  minPreview: 5,
  minRequired: 10,
  calibratedBiasTolerance: 0.10,
  warningMae: 0.25,
  criticalMae: 0.35,
  returnSamples: false,
});

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

export function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n > 1 && n <= 100) return Math.max(0, Math.min(1, n / 100));
  return Math.max(0, Math.min(1, n));
}

export function normalizeCalibrationSample(raw = {}, index = 0) {
  if (!raw || typeof raw !== "object") return null;

  const prediction = clamp01(raw.previsao ?? raw.prediction ?? raw.expected ?? raw.confidencePrediction);
  const accuracy = clamp01(raw.acerto ?? raw.accuracy ?? raw.percentual ?? raw.result);

  if (prediction == null || accuracy == null) return null;

  const weightRaw = Number(raw.questoes ?? raw.questions ?? raw.weight ?? 1);
  const weight = Number.isFinite(weightRaw) && weightRaw > 0 ? Math.min(100, weightRaw) : 1;

  return {
    id: raw.id || `${raw.temaId || "sample"}_${raw.stepKey || "step"}_${raw.completedAt || raw.reviewedAt || index}`,
    prediction,
    accuracy,
    error: prediction - accuracy,
    absError: Math.abs(prediction - accuracy),
    squaredError: (prediction - accuracy) ** 2,
    weight,
    temaId: raw.temaId ?? null,
    temaNome: raw.temaNome ?? raw.nome ?? null,
    esp: raw.esp ?? raw.area ?? raw.materia ?? null,
    stepKey: raw.stepKey ?? raw.step ?? null,
    date: raw.completedAt ?? raw.reviewedAt ?? raw.date ?? null,
  };
}

export function getCalibrationStatus(n, options = {}) {
  const opts = { ...DEFAULT_CALIBRATION_OPTIONS, ...options };
  if (n < opts.minPreview) return CALIBRATION_STATUS.COLLECTING;
  if (n < opts.minRequired) return CALIBRATION_STATUS.LOW_CONFIDENCE;
  return CALIBRATION_STATUS.OK;
}

export function classifyCalibrationTrend(bias, options = {}) {
  const opts = { ...DEFAULT_CALIBRATION_OPTIONS, ...options };
  if (bias > opts.calibratedBiasTolerance) return CALIBRATION_TREND.OVERCONFIDENT;
  if (bias < -opts.calibratedBiasTolerance) return CALIBRATION_TREND.UNDERCONFIDENT;
  return CALIBRATION_TREND.CALIBRATED;
}

export function classifyCalibrationSeverity(meanAbsError, options = {}) {
  const opts = { ...DEFAULT_CALIBRATION_OPTIONS, ...options };
  if (meanAbsError >= opts.criticalMae) return CALIBRATION_SEVERITY.CRITICAL;
  if (meanAbsError >= opts.warningMae) return CALIBRATION_SEVERITY.WARNING;
  return CALIBRATION_SEVERITY.OK;
}

function weightedMean(samples, selector) {
  const totalWeight = samples.reduce((sum, sample) => sum + sample.weight, 0);
  if (totalWeight <= 0) return null;
  return samples.reduce((sum, sample) => sum + selector(sample) * sample.weight, 0) / totalWeight;
}

function pct(value) {
  if (!Number.isFinite(Number(value))) return null;
  return Math.round(Number(value) * 100);
}

export function buildCalibrationBuckets(samples = []) {
  const buckets = [
    { id: "0-20", min: 0, max: 0.2, label: "0–20%" },
    { id: "20-40", min: 0.2, max: 0.4, label: "20–40%" },
    { id: "40-60", min: 0.4, max: 0.6, label: "40–60%" },
    { id: "60-80", min: 0.6, max: 0.8, label: "60–80%" },
    { id: "80-100", min: 0.8, max: 1.000001, label: "80–100%" },
  ];

  return buckets.map((bucket) => {
    const items = samples.filter((sample) => sample.prediction >= bucket.min && sample.prediction < bucket.max);
    const meanPrediction = items.length ? weightedMean(items, (sample) => sample.prediction) : null;
    const meanAccuracy = items.length ? weightedMean(items, (sample) => sample.accuracy) : null;
    const gap = meanPrediction != null && meanAccuracy != null ? meanPrediction - meanAccuracy : null;

    return {
      id: bucket.id,
      label: bucket.label,
      n: items.length,
      meanPredictionPct: pct(meanPrediction),
      meanAccuracyPct: pct(meanAccuracy),
      gapPct: pct(gap),
      tendency: gap == null ? null : classifyCalibrationTrend(gap),
    };
  });
}

export function getCalibrationAction(result = {}) {
  if (!result || result.status === CALIBRATION_STATUS.COLLECTING) {
    const remaining = Math.max(0, (result.minPreview || DEFAULT_CALIBRATION_OPTIONS.minPreview) - (result.n || 0));
    return `Registre previsão antes das revisões. Faltam ${remaining} ${remaining === 1 ? "sessão" : "sessões"} para o primeiro sinal.`;
  }

  if (result.status === CALIBRATION_STATUS.LOW_CONFIDENCE) {
    const remaining = Math.max(0, (result.minRequired || DEFAULT_CALIBRATION_OPTIONS.minRequired) - (result.n || 0));
    return `Continue estimando antes de responder. Faltam ${remaining} ${remaining === 1 ? "sessão" : "sessões"} para análise confiável.`;
  }

  if (result.tendencia === CALIBRATION_TREND.OVERCONFIDENT) {
    return "Antes de avançar tema, force recuperação ativa e explique por que a alternativa correta é correta. Seu risco é falsa sensação de domínio.";
  }

  if (result.tendencia === CALIBRATION_TREND.UNDERCONFIDENT) {
    return "Use o resultado real para reduzir retrabalho: se acertou bem, mantenha revisão programada e evite repetir conteúdo cedo demais.";
  }

  return "Boa calibração. Continue registrando previsão antes da sessão para preservar autoconsciência do desempenho.";
}

export function getCalibrationInterpretation(result = {}) {
  if (!result || result.status === CALIBRATION_STATUS.COLLECTING) {
    return "Ainda há poucos dados para comparar previsão e resultado real.";
  }

  if (result.status === CALIBRATION_STATUS.LOW_CONFIDENCE) {
    return "Já existe um sinal inicial, mas a amostra ainda é pequena. Use como feedback leve, não como diagnóstico definitivo.";
  }

  if (result.tendencia === CALIBRATION_TREND.OVERCONFIDENT) {
    return "Suas previsões estão acima do desempenho real. Isso sugere risco de encerrar estudo cedo demais.";
  }

  if (result.tendencia === CALIBRATION_TREND.UNDERCONFIDENT) {
    return "Suas previsões estão abaixo do desempenho real. Isso sugere insegurança ou gasto excessivo de tempo em temas já suficientes.";
  }

  return "Sua previsão está próxima do desempenho real. Isso ajuda o Mentor a confiar mais nas suas autoavaliações.";
}

export function calcCalibration(stats, options = {}) {
  const opts = { ...DEFAULT_CALIBRATION_OPTIONS, ...options };
  if (!Array.isArray(stats)) {
    return {
      status: CALIBRATION_STATUS.COLLECTING,
      n: 0,
      minPreview: opts.minPreview,
      minRequired: opts.minRequired,
      score: null,
      precisao: null,
      meanAbsoluteErrorPct: null,
      rootMeanSquaredErrorPct: null,
      meanSquaredCalibrationLoss: null,
      brierLikeLoss: null,
      biasPct: null,
      vies: null,
      tendencia: CALIBRATION_TREND.CALIBRATED,
      severity: CALIBRATION_SEVERITY.OK,
      buckets: buildCalibrationBuckets([]),
      action: getCalibrationAction({ n: 0, minPreview: opts.minPreview, minRequired: opts.minRequired, status: CALIBRATION_STATUS.COLLECTING }),
      interpretation: "Sem dados de calibração ainda.",
    };
  }

  const samples = stats
    .map((item, index) => normalizeCalibrationSample(item, index))
    .filter(Boolean);

  const n = samples.length;
  const status = getCalibrationStatus(n, opts);

  if (n === 0) {
    return {
      status,
      n,
      minPreview: opts.minPreview,
      minRequired: opts.minRequired,
      score: null,
      precisao: null,
      meanAbsoluteErrorPct: null,
      rootMeanSquaredErrorPct: null,
      meanSquaredCalibrationLoss: null,
      brierLikeLoss: null,
      biasPct: null,
      vies: null,
      tendencia: CALIBRATION_TREND.CALIBRATED,
      severity: CALIBRATION_SEVERITY.OK,
      buckets: buildCalibrationBuckets(samples),
      action: getCalibrationAction({ n, minPreview: opts.minPreview, minRequired: opts.minRequired, status }),
      interpretation: "Sem dados de calibração ainda.",
      ...(opts.returnSamples ? { samples } : {}),
    };
  }

  const meanAbsError = weightedMean(samples, (sample) => sample.absError);
  const meanSquaredCalibrationLoss = weightedMean(samples, (sample) => sample.squaredError);
  const rmse = Math.sqrt(meanSquaredCalibrationLoss);
  const bias = weightedMean(samples, (sample) => sample.error);
  const tendencia = classifyCalibrationTrend(bias, opts);
  const severity = classifyCalibrationSeverity(meanAbsError, opts);
  const score = Math.max(0, Math.min(100, Math.round((1 - meanAbsError) * 100)));

  const result = {
    status,
    n,
    minPreview: opts.minPreview,
    minRequired: opts.minRequired,
    score,
    precisao: score,
    meanAbsoluteErrorPct: pct(meanAbsError),
    rootMeanSquaredErrorPct: pct(rmse),
    meanSquaredCalibrationLoss: Number(meanSquaredCalibrationLoss.toFixed(4)),
    brierLikeLoss: Number(meanSquaredCalibrationLoss.toFixed(4)),
    biasPct: pct(bias),
    vies: pct(bias),
    tendencia,
    severity,
    buckets: buildCalibrationBuckets(samples),
  };

  return {
    ...result,
    action: getCalibrationAction(result),
    interpretation: getCalibrationInterpretation(result),
    ...(opts.returnSamples ? { samples } : {}),
  };
}
```

---

## 8. Testes — `src/core/calibration.test.js`

Criar arquivo novo.

```js
// src/core/calibration.test.js
import {
  CALIBRATION_STATUS,
  CALIBRATION_TREND,
  clamp01,
  normalizeCalibrationSample,
  calcCalibration,
  buildCalibrationBuckets,
} from "./calibration";

describe("calibration — normalizacao", () => {
  test("clamp01 aceita 0-1", () => {
    expect(clamp01(0.8)).toBe(0.8);
  });

  test("clamp01 aceita 0-100", () => {
    expect(clamp01(80)).toBe(0.8);
  });

  test("normalizeCalibrationSample ignora item sem previsao", () => {
    expect(normalizeCalibrationSample({ acerto: 0.7 })).toBeNull();
  });

  test("normalizeCalibrationSample calcula erro previsao - acerto", () => {
    const sample = normalizeCalibrationSample({ previsao: 0.9, acerto: 0.7, questoes: 20 });
    expect(sample.error).toBeCloseTo(0.2);
    expect(sample.absError).toBeCloseTo(0.2);
    expect(sample.weight).toBe(20);
  });
});

describe("calcCalibration — status e metricas", () => {
  test("retorna coletando para array vazio", () => {
    const result = calcCalibration([]);
    expect(result.status).toBe(CALIBRATION_STATUS.COLLECTING);
    expect(result.n).toBe(0);
    expect(result.score).toBeNull();
  });

  test("retorna coletando com menos de 5 amostras", () => {
    const result = calcCalibration([
      { previsao: 0.8, acerto: 0.7 },
      { previsao: 0.7, acerto: 0.7 },
      { previsao: 0.6, acerto: 0.8 },
      { previsao: 0.9, acerto: 0.8 },
    ]);
    expect(result.status).toBe(CALIBRATION_STATUS.COLLECTING);
    expect(result.n).toBe(4);
  });

  test("retorna baixa_confianca com 5 a 9 amostras", () => {
    const stats = Array.from({ length: 7 }, () => ({ previsao: 0.8, acerto: 0.7 }));
    const result = calcCalibration(stats);
    expect(result.status).toBe(CALIBRATION_STATUS.LOW_CONFIDENCE);
    expect(result.n).toBe(7);
  });

  test("retorna ok com 10+ amostras", () => {
    const stats = Array.from({ length: 10 }, () => ({ previsao: 0.8, acerto: 0.75 }));
    const result = calcCalibration(stats);
    expect(result.status).toBe(CALIBRATION_STATUS.OK);
    expect(result.n).toBe(10);
  });

  test("detecta excesso de confianca", () => {
    const stats = Array.from({ length: 10 }, () => ({ previsao: 0.9, acerto: 0.65 }));
    const result = calcCalibration(stats);
    expect(result.tendencia).toBe(CALIBRATION_TREND.OVERCONFIDENT);
    expect(result.vies).toBe(25);
    expect(result.score).toBe(75);
  });

  test("detecta subestimacao", () => {
    const stats = Array.from({ length: 10 }, () => ({ previsao: 0.55, acerto: 0.8 }));
    const result = calcCalibration(stats);
    expect(result.tendencia).toBe(CALIBRATION_TREND.UNDERCONFIDENT);
    expect(result.vies).toBe(-25);
  });

  test("detecta calibrado dentro da tolerancia", () => {
    const stats = Array.from({ length: 10 }, () => ({ previsao: 0.72, acerto: 0.70 }));
    const result = calcCalibration(stats);
    expect(result.tendencia).toBe(CALIBRATION_TREND.CALIBRATED);
    expect(result.score).toBe(98);
  });

  test("pondera por numero de questoes", () => {
    const result = calcCalibration([
      { previsao: 1.0, acerto: 0.0, questoes: 1 },
      { previsao: 0.8, acerto: 0.8, questoes: 20 },
      ...Array.from({ length: 8 }, () => ({ previsao: 0.8, acerto: 0.8, questoes: 20 })),
    ]);
    expect(result.score).toBeGreaterThan(90);
  });
});

describe("buildCalibrationBuckets", () => {
  test("gera 5 buckets fixos", () => {
    const buckets = buildCalibrationBuckets([]);
    expect(buckets).toHaveLength(5);
    expect(buckets.map((b) => b.id)).toEqual(["0-20", "20-40", "40-60", "60-80", "80-100"]);
  });

  test("agrega previsao e acerto no bucket correto", () => {
    const result = calcCalibration([
      ...Array.from({ length: 10 }, () => ({ previsao: 0.85, acerto: 0.7 })),
    ]);
    const high = result.buckets.find((b) => b.id === "80-100");
    expect(high.n).toBe(10);
    expect(high.gapPct).toBe(15);
  });
});
```

---

## 9. Adicionar métrica ao `metricsRegistry.js`

Adicionar à lista `DEFINITIONS`:

```js
{
  id: "confidenceCalibration",
  label: "Calibração da confiança",
  shortLabel: "Calibração",
  section: "aprendizagem",
  description: "Alinhamento entre previsão prévia de desempenho e acerto real nas sessões.",
  emptyState: "Registre previsão antes das revisões para medir calibração.",
  confidenceRule: ({ n = 0 }) => n >= 10,
  actionWhenLow: "Antes de responder, estime seu desempenho. Depois compare previsão e acerto real.",
  warningThreshold: 75,
  criticalThreshold: 60,
  higherIsBetter: true,
  unit: "%",
  platforms: ["res", "vest"],
}
```

### Atualizar `metricsRegistry.test.js`

No array `REQUIRED`, adicionar:

```js
"confidenceCalibration",
```

Adicionar testes específicos:

```js
describe("confidenceCalibration — governanca", () => {
  test("existe no registry", () => {
    const def = getMetricDefinition("confidenceCalibration");
    expect(def).not.toBeNull();
    expect(def.section).toBe("aprendizagem");
    expect(def.platforms).toContain("res");
    expect(def.platforms).toContain("vest");
  });

  test("fica LOW_CONFIDENCE com n < 10", () => {
    const result = evaluateMetric("confidenceCalibration", 82, { n: 7 });
    expect(result.status).toBe(METRIC_STATUS.LOW_CONFIDENCE);
    expect(result.confident).toBe(false);
  });

  test("fica OK com n >= 10 e score bom", () => {
    const result = evaluateMetric("confidenceCalibration", 85, { n: 10 });
    expect(result.status).toBe(METRIC_STATUS.OK);
    expect(result.confident).toBe(true);
  });

  test("fica WARNING abaixo de 75", () => {
    const result = evaluateMetric("confidenceCalibration", 70, { n: 12 });
    expect(result.status).toBe(METRIC_STATUS.WARNING);
  });

  test("fica CRITICAL abaixo de 60", () => {
    const result = evaluateMetric("confidenceCalibration", 55, { n: 12 });
    expect(result.status).toBe(METRIC_STATUS.CRITICAL);
  });
});
```

---

## 10. Ajuste mínimo no `StatsPanel.jsx`

### 10.1 Manter cálculo atual, mas enriquecer

O trecho atual:

```js
const calibrationData = useMemo(() => {
  const flatStats = Object.values(temaStats || {}).flat();
  return calcCalibration(flatStats);
}, [temaStats]);
```

Pode permanecer.

Adicionar logo depois:

```js
const calibrationMetric = useMemo(() => {
  return evaluateMetric("confidenceCalibration", calibrationData?.score ?? null, {
    n: calibrationData?.n || 0,
  });
}, [calibrationData]);
```

### 10.2 Corrigir frase de coleta

Trocar:

```js
if (!calibrationData || calibrationData.status === "coletando") {
  const remaining = 5 - (calibrationData?.n || 0);
  return `Ainda reunindo dados. Faltam mais ${remaining} ${remaining === 1 ? "revisao" : "revisoes"} com previsao preenchida.`;
}
```

Por:

```js
if (!calibrationData || calibrationData.status !== "ok") {
  return calibrationData?.action || calibrationMetric?.action || "Continue registrando previsão antes das revisões.";
}
```

### 10.3 Atualizar UI do card sem refactor grande

No card de “Calibração Metacognitiva”, preservar layout, mas trocar hardcodes:

- Onde aparece `Coletando dados — faltam {5 - calibrationData.n}` usar:

```js
const remaining = Math.max(0, (calibrationData?.minRequired || 10) - (calibrationData?.n || 0));
```

Texto:

```txt
{calibrationData.status === "coletando"
  ? `Coletando dados — faltam ${Math.max(0, (calibrationData.minPreview || 5) - calibrationData.n)} sessões para o primeiro sinal.`
  : calibrationData.status === "baixa_confianca"
  ? `Sinal inicial — faltam ${remaining} sessões para análise confiável.`
  : calibrationData.interpretation}
```

- Barra de progresso:

```js
style={{ width: `${Math.min(100, ((calibrationData?.n || 0) / (calibrationData?.minRequired || 10)) * 100)}%` }}
```

- Card “Precisao de Previsao” deve usar:

```js
calibrationData.score ?? calibrationData.precisao
```

- Card “Vies de Confianca” deve usar:

```js
calibrationData.biasPct ?? calibrationData.vies
```

- Frase do mentor deve usar:

```js
calibrationData.action || calibrationMentorPhrase
```

### 10.4 Não criar gráfico novo agora

Não renderizar buckets em P1.2 se isso aumentar UI. O cálculo fica no core para P2. Em StatsPanel, só exibir no máximo:

```txt
Precisão de previsão
Viés de confiança
Ação recomendada
Status de confiança da métrica
```

---

## 11. Regras de UX/copy

Usar estas traduções visíveis:

```txt
confidenceCalibration -> Calibração da confiança
score -> Precisão de previsão
biasPct -> Viés de confiança
excesso_confianca -> Excesso de confiança
subestima -> Subestimação
calibrado -> Calibrado
baixa_confianca -> Sinal inicial
coletando -> Coletando dados
```

Evitar:

```txt
Brier Score
ECE
metacognitive monitoring
reliability curve
mean squared calibration loss
```

Esses termos podem existir no core/docs, mas não na UI do aluno.

---

## 12. Critérios de aceite

P1.2 está aprovado se:

```txt
1. calcCalibration continua importável com o mesmo nome.
2. Dados antigos sem previsao/acerto não quebram.
3. n < 5 retorna status coletando.
4. 5 <= n < 10 retorna baixa_confianca.
5. n >= 10 retorna ok.
6. Excesso de confiança é detectado quando previsão média supera acerto real >10 p.p.
7. Subestimação é detectada quando previsão média fica abaixo do acerto real >10 p.p.
8. score/precisao preservam compatibilidade com StatsPanel.
9. vies preserva compatibilidade com StatsPanel.
10. metricsRegistry possui confidenceCalibration.
11. confidenceCalibration aparece em res e vest.
12. StatsPanel não quebra quando calibrationData.status é baixa_confianca.
13. Nenhum arquivo proibido foi tocado.
14. npm test passa.
15. npm run build passa.
16. npm run check:mojibake passa.
```

---

## 13. Comandos de validação

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false src/core/calibration.test.js src/core/metricsRegistry.test.js
npm test -- --watchAll=false
npm run build
```

Se CRA não aceitar filtro por arquivo:

```bash
npm test -- --watchAll=false
npm run build
```

---

## 14. Onde o modelo menor costuma errar

### Erro 1 — confundir `confianca` com `previsao`

Não fazer:

```js
prediction = raw.confianca;
```

Correto:

```js
prediction = raw.previsao;
```

`confianca` é rótulo ordinal (`Baixa`, `Média`, `Alta`). `previsao` é a estimativa numérica do aluno.

---

### Erro 2 — criar nova store

Não criar:

```js
calibrationStore
metacognitionState
studentSelfModel
```

P1.2 usa dados já existentes.

---

### Erro 3 — mexer no Mentor Decision Engine

Não fazer:

```js
if (calibrationData.tendencia === "excesso_confianca") primaryAction = ...
```

Isso é P1.3/P2. O P1.2 só calcula e exibe.

---

### Erro 4 — prometer diagnóstico absoluto

Não escrever na UI:

```txt
Você é superconfiante.
Seu problema é confiança.
```

Escrever:

```txt
Suas previsões estão acima do desempenho real nas últimas sessões.
```

---

### Erro 5 — chamar perda quadrática de Brier Score estrito

Como `acerto` é proporção por sessão, usar:

```txt
meanSquaredCalibrationLoss
brierLikeLoss
```

Não vender como Brier Score estatístico puro na UI.

---

## 15. Saída esperada após implementar

O MedRev passa a responder:

```txt
1. O aluno prevê bem o próprio desempenho?
2. Ele superestima o que sabe?
3. Ele subestima o que sabe?
4. A métrica já tem amostra suficiente?
5. Que ação simples deve tomar se a calibração estiver ruim?
```

Isso prepara os blocos futuros:

```txt
P1.3 — modo operacional: normal / recuperação / sobrecarga / prova próxima.
P2 — Stats mais acionáveis e governadas.
P2/P3 — Centro de Erros com confiança mal calibrada.
P2/P3 — Student Model com componente Pessoa.
```

---

## 16. Resumo operacional para colar no executor

```txt
Implemente o BLOCO P1.2 — Calibração Metacognitiva Acionável.

Objetivo:
Evoluir core/calibration.js para calcular precisão de previsão, viés, perda quadrática aproximada, buckets e ação recomendada, usando previsao × acerto já existentes.

Arquivos permitidos:
- src/core/calibration.js
- src/core/calibration.test.js
- src/core/metricsRegistry.js
- src/core/metricsRegistry.test.js
- src/components/StatsPanel.jsx

Arquivos proibidos:
- src/core/fsrs.js
- src/core/store.js
- src/core/mentorDecisionPolicy.js
- src/core/mentorSignals.js
- src/core/actionInbox.js
- src/core/readiness.js
- src/firebase.js
- package.json
- package-lock.json

Regras:
1. Não mudar FSRS.
2. Não mudar datas oficiais.
3. Não criar store nova.
4. Não mexer em persistência.
5. Não mexer no Mentor Decision Engine.
6. Manter calcCalibration exportado.
7. Preservar aliases precisao e vies.
8. Adicionar confidenceCalibration ao metricsRegistry.
9. Criar testes sintéticos.
10. Build/test/check:mojibake devem passar.
```

---

## 17. Referências usadas

1. Panadero E. *A Review of Self-regulated Learning: Six Models and Four Directions for Research*. Frontiers in Psychology, 2017.  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC5408091/

2. Bjork RA, Dunlosky J, Kornell N. *Self-regulated learning: beliefs, techniques, and illusions*. Annual Review of Psychology, 2013.  
   https://pubmed.ncbi.nlm.nih.gov/23020639/

3. Bol L, Hacker DJ. *Calibration Research: Where Do We Go from Here?* Frontiers in Psychology, 2012.  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC3408109/

4. Cleary TJ et al. *First-year medical students' calibration bias and accuracy across clinical reasoning activities*. Advances in Health Sciences Education, 2019.  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC6775028/

5. Garbayo LS et al. *A metacognitive confidence calibration tool to help medical students scaffold diagnostic reasoning in decision-making during high-fidelity patient simulations*. Advances in Physiology Education, 2023.  
   https://pubmed.ncbi.nlm.nih.gov/35981722/

6. Jaspan O et al. *Implications for Diagnostic Radiology Training From the Perspective of Confidence Calibration*. Journal of the American College of Radiology, 2022.  
   https://pubmed.ncbi.nlm.nih.gov/33408052/

---

## 18. Frase de segurança final

> O P1.2 não decide o que o aluno deve estudar. Ele melhora a qualidade do sinal que, mais tarde, permitirá ao Mentor decidir melhor. Sem calibração, o app sabe se o aluno acertou; com calibração, o app começa a saber se o aluno entende o próprio acerto.
