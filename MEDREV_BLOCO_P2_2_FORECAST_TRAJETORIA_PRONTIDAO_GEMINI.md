# MEDREV — BLOCO P2.2 — FORECAST DE TRAJETÓRIA DE PRONTIDÃO

**Arquivo para implementação por modelo menor:** Gemini 3.5 Flash / Claude Sonnet / Codex executor  
**Prioridade:** P2.2  
**Status:** implementar depois do P2.1.  
**Modo:** implementação cirúrgica, sem UI pesada.  
**Regra-mãe:** este bloco **não substitui o readiness atual**, **não promete aprovação**, **não estima TRI oficial**, **não altera agendamento FSRS**, **não mexe em Firebase/localStorage** e **não cria um motor paralelo fora de `forecast.js`**.

---

## 0. Veredito antes de implementar

O P2.2 correto é:

```txt
Forecast preditivo de prontidão com banda de confiança,
usando Student Model + simulados + data da prova + sinais de ritmo/modo.
```

O P2.2 NÃO é:

```txt
- novo dashboard;
- novo readiness principal;
- cálculo oficial de aprovação;
- simulação real de TRI;
- optimizer FSRS;
- scheduler de interleaving;
- IA conversacional;
- refactor de App/Dashboard/Stats;
- persistência de snapshots;
- novo banco de dados;
- nova dependência.
```

O P2.2 É:

```txt
um motor puro, transparente e testável que responde:

"Com os dados atuais, qual é a trajetória provável de prontidão até a data da prova,
qual a incerteza dessa estimativa e quais fatores estão puxando a previsão para cima ou para baixo?"
```

A palavra importante é **trajetória**, não score estático.

---

## 1. Continuidade do roadmap

Sequência já definida:

```txt
P0   — DecisionCore / verdade única / estabilidade.
P1.1 — FSRS canônico em sombra.
P1.2 — Calibração metacognitiva.
P1.3 — Máquina de modo operacional.
P2.1 — Student Model v1: maestria latente por área/subtópico.
P2.2 — Forecast de trajetória de prontidão.
P2.3 — Scheduler de interleaving real.
```

O P2.1 preparou o MedRev para deixar de pensar apenas em média de acerto e começar a estimar `pMastery` por tema/área. O P2.2 consome essa camada para prever trajetória.

A ordem é intencional:

```txt
Primeiro medir melhor o aluno.
Depois prever trajetória.
Depois alterar plano.
```

Se pular direto para scheduler adaptativo, o sistema começa a decidir com uma métrica ainda instável.

---

## 2. Arquivos revisados antes deste bloco

### Documentos/roadmap

```txt
/mnt/data/medrev_docs/MEDREV_CORE_AUDIT_AND_MASTER_IMPLEMENTATION_PLAN.md
/mnt/data/medrev_docs/MEDREV_PERSONALIZATION_AND_MENTOR_MASTERPLAN.md
/mnt/data/MEDREV_BLOCO_P1_3_MAQUINA_MODO_OPERACIONAL_GEMINI.md
/mnt/data/MEDREV_BLOCO_P2_1_STUDENT_MODEL_MAESTRIA_LATENTE_GEMINI.md
```

Achados relevantes dos documentos:

```txt
- O roadmap mestre diz que core/forecast.js já existe e deve ser evoluído.
- P2.1 declarou explicitamente que não integraria Forecast ainda.
- P1.3 indicou que P2.2 deve usar modos acumulados/contexto operacional para prever aderência e risco de atraso.
- A auditoria apontou que readiness/% atual não deve ser vendido como nota oficial de prova.
```

### Código atual observado

O código já possui:

```txt
src/core/forecast.js
src/core/readiness.js
src/core/mastery.js
```

`forecast.js` atual contém:

```txt
calcPrevisaoDesempenho(...)
calcForecastSample(...)
CONFIDENCE_LABEL
```

Pontos bons:

```txt
- já existe banda de confiança;
- já existe noção de amostra mínima;
- já pesa simulados como âncora;
- já evita quebrar quando faltam componentes.
```

Limitações atuais:

```txt
- não consome Student Model;
- não projeta até data de prova;
- não considera dias restantes;
- não diferencia score atual de score projetado;
- não retorna riscos/assunções explicáveis;
- não separa forecast forte de preview fraco;
- não deixa claro que isso não é nota TRI oficial;
- não tem testes de monotonicidade de trajetória.
```

---

## 3. Fundamentação científica e decisão de produto

### 3.1 Por que simulados/progress testing devem ancorar o forecast

Em educação médica, avaliações longitudinais/progress testing são usadas para monitorar desenvolvimento de conhecimento ao longo do tempo, identificar lacunas precocemente e fornecer feedback formativo. Isso é mais apropriado para previsão de desempenho do que uma única média de estudo isolada.

Decisão de produto:

```txt
Simulados/provas antigas devem ter peso alto no Forecast,
mas a previsão não pode depender só deles porque o MedRev também observa revisão, maestria latente, cobertura, ritmo e calibração.
```

### 3.2 Por que Student Model entra agora

O Student Model v1 estima maestria latente por tema/área. Isso reduz o erro de tratar evidências diferentes como se fossem iguais:

```txt
D0 100% ≠ D21 85%
1 questão ≠ 30 questões
acerto imediato ≠ retenção espaçada
```

Decisão de produto:

```txt
Forecast deve usar pMastery por área como componente de conhecimento latente.
```

### 3.3 Por que forecast precisa de banda de confiança

Modelos preditivos educacionais sofrem com ruído, dados incompletos, viés de amostra e variabilidade individual. A literatura de learning analytics reforça que previsões educacionais devem explicitar incerteza, transparência e limitações.

Decisão de produto:

```txt
Nunca mostrar apenas "78%".
Mostrar:
"Estimativa: 72–82, confiança moderada, baseada em 2 simulados + 480 questões + 4 áreas."
```

### 3.4 Por que não estimar TRI oficial agora

O ENAMED/ENARE usa nota de proficiência/escala própria. Mesmo quando há referência à TRI, o MedRev não tem:

```txt
- parâmetros oficiais dos itens;
- dificuldade/discriminação de cada questão;
- matriz completa calibrada;
- padrão de resposta item a item do aluno em prova oficial.
```

Então o Forecast P2.2 deve ser **TRI-aware**, mas não **TRI-estimator**.

Certo:

```txt
"Proxy interno de prontidão para prova, não nota oficial."
```

Errado:

```txt
"Sua nota TRI prevista é 781."
```

### 3.5 Por que forecast não deve decidir plano ainda

O Forecast P2.2 é uma camada diagnóstica/prognóstica. O scheduler adaptativo vem depois.

Certo:

```txt
forecast -> mostra risco e direção
```

Errado:

```txt
forecast -> altera datas oficiais ou reordena fila automaticamente
```

---

## 4. Escopo técnico

### Arquivos permitidos

```txt
src/core/forecast.js
src/core/forecast.test.js
src/core/readiness.js
src/core/readiness.test.js
```

### Arquivo opcional

```txt
docs/P2_2_FORECAST_TRAJECTORY_DECISIONS.md
```

### Arquivos proibidos

```txt
src/core/fsrs.js
src/core/store.js
src/core/mentorDecisionPolicy.js
src/core/mentorSignals.js
src/core/actionInbox.js
src/core/operationalMode.js
src/core/metricsRegistry.js
src/components/Dashboard.jsx
src/components/StatsPanel.jsx
src/components/Simulados.jsx
src/App.js
src/firebase.js
package.json
package-lock.json
```

### Dependências

```txt
Não instalar nada.
Não usar regressão externa.
Não usar ML lib.
Não usar date-fns/moment.
```

---

## 5. Pré-condições obrigatórias

Antes de implementar, verificar se P2.1 foi aplicado.

`src/core/mastery.js` deve exportar pelo menos:

```txt
estimateStudentMastery
estimateAreaMastery
getWeakMasteryTargets
```

Se esses exports não existirem:

```txt
PARE.
Não invente versões dentro de forecast.js.
Não duplique Student Model.
Responda que P2.1 precisa estar implementado antes do P2.2.
```

Motivo:

```txt
Duplicar maestria dentro de forecast.js recria a entropia que o P0 combateu.
```

---

## 6. Arquitetura-alvo

Fluxo desejado:

```txt
temas + temaStats
        ↓
Student Model P2.1
        ↓
pMastery por tema/área + confiança
        ↓

simulados/provas antigas
        ↓
Simulado Anchor
        ↓

meta.dataProva + ritmo + cobertura + calibração + modo operacional opcional
        ↓
Forecast Engine P2.2
        ↓

forecast = {
  currentScore,
  projectedScore,
  band,
  confidence,
  components,
  areaForecasts,
  risks,
  assumptions,
  warnings,
  isActionable
}
```

---

## 7. Contrato de saída obrigatório

Criar no `forecast.js` uma função principal:

```js
export function estimateReadinessForecast({
  temas = [],
  temaStats = {},
  simulados = [],
  meta = {},
  plat = "res",
  today = null,
  operationalMode = null,
  calibration = null,
} = {}) {
  // retorna ForecastResult
}
```

Shape obrigatório do retorno:

```js
{
  version: "forecast_v1",
  targetDate: "2026-09-13" | null,
  daysUntilExam: number | null,

  currentScore: number | null,      // 0-100, snapshot atual
  projectedScore: number | null,    // 0-100, previsão conservadora até a prova
  band: [number, number] | null,     // intervalo de incerteza ao redor do projectedScore
  bandWidth: number,

  confidence: "insufficient" | "low" | "medium" | "high",
  isActionable: boolean,
  displayMode: "collecting" | "preview" | "forecast",

  sample: {
    nSimulados: number,
    totalQuestions: number,
    areasWithMastery: number,
    activeDays: number,
    hasMinimumForStrongNumber: boolean,
    missing: string[],
  },

  components: {
    simuladoAnchor: number | null,
    masteryIndex: number | null,
    coverageIndex: number | null,
    adherenceIndex: number | null,
    calibrationIndex: number | null,
    timePotential: number | null,
    operationalRisk: number | null,
  },

  weightsUsed: {
    simuladoAnchor: number,
    masteryIndex: number,
    coverageIndex: number,
    adherenceIndex: number,
    calibrationIndex: number,
  },

  areaForecasts: [
    {
      area: string,
      currentMastery: number | null,
      projectedMastery: number | null,
      confidence: "none" | "low" | "medium" | "high",
      weight: number,
      gap: number,
      riskLevel: "low" | "medium" | "high",
      reasons: string[],
    }
  ],

  risks: [
    {
      code: string,
      severity: "info" | "warning" | "critical",
      message: string,
    }
  ],

  assumptions: string[],
  warnings: string[],
  label: string,
  explanation: string,
}
```

---

## 8. Exportações novas em `forecast.js`

Adicionar sem remover exports antigos:

```js
export const FORECAST_CONFIDENCE = Object.freeze({
  INSUFFICIENT: "insufficient",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

export const FORECAST_DISPLAY_MODE = Object.freeze({
  COLLECTING: "collecting",
  PREVIEW: "preview",
  FORECAST: "forecast",
});

export const DEFAULT_FORECAST_WEIGHTS = Object.freeze({
  simuladoAnchor: 0.40,
  masteryIndex: 0.30,
  coverageIndex: 0.15,
  adherenceIndex: 0.10,
  calibrationIndex: 0.05,
});

export function parseExamDate(meta, fallback = null) {}
export function daysBetweenDates(start, end) {}
export function normalizeSimulados(simulados = []) {}
export function calculateSimuladoAnchor(simulados = []) {}
export function calculateForecastSampleV2({ temas, simulados, studentMastery, today }) {}
export function calculateTimePotential(daysUntilExam, operationalMode) {}
export function calculateOperationalRisk(operationalMode) {}
export function calculateForecastBand({ nSimulados, confidence, daysUntilExam, operationalRisk, sample }) {}
export function estimateAreaForecasts({ studentMastery, daysUntilExam, operationalMode, plat }) {}
export function estimateReadinessForecast(params) {}
```

Preservar exports antigos:

```js
calcPrevisaoDesempenho
calcForecastSample
CONFIDENCE_LABEL
```

Eles podem continuar existindo como compatibilidade. Não quebrar imports atuais.

---

## 9. Implementação detalhada

### 9.1 Datas: `parseExamDate` e `daysBetweenDates`

Implementar sem libs externas.

Regras:

```txt
- aceitar meta.dataProva se string YYYY-MM-DD;
- aceitar meta.targetDate se existir;
- aceitar fallback opcional;
- se inválido, retornar null;
- daysUntilExam negativo deve virar 0 em estimateReadinessForecast;
- funções puras e testáveis.
```

Esqueleto:

```js
export function isValidDateStr(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseExamDate(meta = {}, fallback = null) {
  const candidates = [meta?.dataProva, meta?.targetDate, fallback];
  const found = candidates.find(isValidDateStr);
  return found || null;
}

export function daysBetweenDates(startStr, endStr) {
  if (!isValidDateStr(startStr) || !isValidDateStr(endStr)) return null;
  const start = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.round((end - start) / 86400000);
}
```

### 9.2 Normalizar simulados

O código atual usa `s.pct`. Mas simulados podem ter campos variados.

Criar helper robusto:

```js
function getSimuladoPct(s) {
  const candidates = [s?.pct, s?.percentual, s?.acertoPct, s?.scorePct, s?.score];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n)) {
      if (n >= 0 && n <= 1) return Math.round(n * 100);
      if (n >= 0 && n <= 100) return Math.round(n);
    }
  }
  return null;
}
```

`normalizeSimulados` deve retornar:

```js
{
  pct: number,
  date: string | null,
  totalQuestions: number | null,
  source: "simulado"
}
```

Regras:

```txt
- filtrar simulados sem pct válido;
- preservar ordem original se não houver data;
- se houver data, ordenar por data crescente;
- limitar anchor aos últimos 4 válidos.
```

### 9.3 Simulado Anchor

Implementar:

```js
export function calculateSimuladoAnchor(simulados = []) {
  const valid = normalizeSimulados(simulados);
  if (!valid.length) {
    return {
      value: null,
      n: 0,
      recent: [],
      confidence: FORECAST_CONFIDENCE.INSUFFICIENT,
      reason: "no_simulado",
    };
  }

  const recent = valid.slice(-4);
  const weights = recent.map((_, i) => 1 + i * 0.15);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const value = Math.round(
    recent.reduce((sum, item, i) => sum + item.pct * weights[i], 0) / totalWeight
  );

  const n = valid.length;
  const confidence = n >= 3
    ? FORECAST_CONFIDENCE.HIGH
    : n >= 2
      ? FORECAST_CONFIDENCE.MEDIUM
      : FORECAST_CONFIDENCE.LOW;

  return { value, n, recent, confidence, reason: "ok" };
}
```

### 9.4 Student Mastery Component

Importar do `mastery.js`:

```js
import { estimateStudentMastery } from "./mastery";
```

Chamada prevista:

```js
const studentMastery = estimateStudentMastery({ temas, temaStats, context });
```

Como o shape final do P2.1 pode variar, usar adaptadores defensivos:

```js
function getMasteryIndex(studentMastery) {
  const candidates = [
    studentMastery?.pMastery,
    studentMastery?.globalMastery,
    studentMastery?.index,
    studentMastery?.score,
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n)) {
      if (n >= 0 && n <= 1) return Math.round(n * 100);
      if (n >= 0 && n <= 100) return Math.round(n);
    }
  }
  return null;
}
```

Mas atenção:

```txt
Defensivo não significa inventar cálculo.
Se estimateStudentMastery não existir, parar.
Se existir mas retornar shape inesperado, lançar warning e deixar masteryIndex null.
```

### 9.5 Coverage Index

Coverage deve refletir temas iniciados, mas não dominar o forecast.

Implementar:

```js
function calculateCoverageIndex(temas = []) {
  if (!Array.isArray(temas) || temas.length === 0) return null;
  const started = temas.filter(t => !t?.unstarted).length;
  return Math.round((started / temas.length) * 100);
}
```

### 9.6 Adherence Index

Não mexer em store. Usar sinais disponíveis em `meta`, `temas` ou parâmetros.

Fallback simples:

```txt
- se meta.metaQuestoesDia existe e há temas/revisões, tentar estimar ritmo;
- se não houver dado, retornar null;
- não inventar aderência de 100%.
```

Se o projeto já tiver `saldoRitmo` acessível, pode importar de `volume.js`.

Permitido:

```js
import { saldoRitmo } from "./volume";
```

Implementar helper:

```js
function calculateAdherenceIndex({ temas = [], meta = {} } = {}) {
  try {
    if (!meta?.metaQuestoesDia || !Array.isArray(temas) || !temas.length) return null;
    const started = temas.filter(t => !t?.unstarted);
    const startStr = started[0]?.d0 || null;
    const pace = saldoRitmo(temas, meta, startStr);
    if (!pace) return null;
    if (pace.saldo >= 0) return 100;
    const ratio = pace.esperado > 0 ? Math.max(0, pace.feito / pace.esperado) : 1;
    return Math.round(ratio * 100);
  } catch {
    return null;
  }
}
```

### 9.7 Calibration Index

P1.2 criou calibração. P2.2 pode receber `calibration` opcional.

Regras:

```txt
- se calibration.overconfidence alto -> reduzir confiança/banda;
- se calibration.score existe 0-100 -> usar como componente leve;
- se não existe -> null;
- não importar calibration.js se isso criar ciclo.
```

Helper:

```js
function getCalibrationIndex(calibration) {
  const candidates = [calibration?.score, calibration?.calibrationScore, calibration?.index];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
  }
  return null;
}
```

### 9.8 Operational Risk

OperationalMode vem do P1.3 e deve entrar como risco/ajuste de confiança, não como motor decisor.

Implementar:

```js
export function calculateOperationalRisk(operationalMode) {
  const mode = operationalMode?.mode || operationalMode;
  if (!mode) return 0;

  const map = {
    normal: 0,
    prova_proxima: 5,
    recuperacao: 10,
    sobrecarga: 18,
    pausado: 25,
    dados_inconsistentes: 30,
  };

  return map[mode] ?? 0;
}
```

Regras:

```txt
- operationalRisk aumenta banda;
- operationalRisk pode reduzir timePotential;
- operationalRisk deve gerar warning;
- não muda datas nem fila.
```

### 9.9 Time Potential

A previsão até a prova precisa ser conservadora. Não supor crescimento linear infinito.

Implementar:

```js
export function calculateTimePotential(daysUntilExam, operationalMode = null) {
  if (!Number.isFinite(daysUntilExam)) return null;
  if (daysUntilExam <= 0) return 0;

  let base;
  if (daysUntilExam >= 180) base = 12;
  else if (daysUntilExam >= 120) base = 10;
  else if (daysUntilExam >= 90) base = 8;
  else if (daysUntilExam >= 60) base = 6;
  else if (daysUntilExam >= 30) base = 4;
  else if (daysUntilExam >= 14) base = 2;
  else base = 1;

  const risk = calculateOperationalRisk(operationalMode);
  const riskFactor = Math.max(0.55, 1 - risk / 100);

  return Math.round(base * riskFactor);
}
```

Interpretação:

```txt
timePotential = ganho máximo conservador possível no score composto,
não promessa de melhora.
```

### 9.10 Score atual vs score projetado

Calcular `currentScore` com componentes atuais.

Pesos:

```txt
simuladoAnchor: 0.40
masteryIndex:   0.30
coverageIndex:  0.15
adherenceIndex: 0.10
calibration:    0.05
```

Justificativa:

```txt
- simulado ancora em desempenho parecido com prova;
- maestria latente mede conhecimento reaproveitável;
- cobertura evita falso alto em poucas áreas;
- aderência reflete execução do plano;
- calibração entra leve para não punir demais.
```

Função:

```js
function weightedScore(parts, weights = DEFAULT_FORECAST_WEIGHTS) {
  const valid = Object.entries(weights)
    .map(([key, weight]) => ({ key, weight, value: parts[key] }))
    .filter(p => Number.isFinite(p.value));

  if (!valid.length) return null;
  const wsum = valid.reduce((s, p) => s + p.weight, 0);
  return Math.round(valid.reduce((s, p) => s + p.value * (p.weight / wsum), 0));
}
```

Projected score:

```js
const potential = calculateTimePotential(daysUntilExam, operationalMode);
const gap = currentScore != null ? Math.max(0, 100 - currentScore) : 0;
const effectiveGain = currentScore != null && potential != null
  ? Math.min(potential, Math.round(gap * 0.20))
  : 0;
const projectedScore = currentScore != null
  ? Math.min(100, currentScore + effectiveGain)
  : null;
```

Por que `gap * 0.20`?

```txt
Para impedir previsão absurda do tipo 45 → 80 em pouco tempo.
O Forecast não sabe se o aluno vai executar perfeitamente.
Ele deve ser conservador.
```

### 9.11 Banda de confiança

Implementar:

```js
export function calculateForecastBand({
  nSimulados = 0,
  confidence = FORECAST_CONFIDENCE.INSUFFICIENT,
  daysUntilExam = null,
  operationalRisk = 0,
  sample = {},
} = {}) {
  let width;
  if (nSimulados <= 0) width = 18;
  else if (nSimulados === 1) width = 14;
  else if (nSimulados === 2) width = 10;
  else if (nSimulados === 3) width = 7;
  else width = 5;

  if (daysUntilExam != null) {
    if (daysUntilExam > 180) width += 4;
    else if (daysUntilExam > 120) width += 2;
    else if (daysUntilExam < 14) width += 2;
  }

  if (operationalRisk >= 20) width += 4;
  else if (operationalRisk >= 10) width += 2;

  if (!sample?.hasMinimumForStrongNumber) width += 3;

  if (confidence === FORECAST_CONFIDENCE.HIGH) width -= 1;
  if (confidence === FORECAST_CONFIDENCE.INSUFFICIENT) width += 2;

  return Math.max(5, Math.min(24, Math.round(width)));
}
```

### 9.12 Confidence / display mode

Regras:

```txt
insufficient:
- sem simulado e poucos dados de Student Model.

low:
- 1 simulado ou dados fragmentados.

medium:
- 2 simulados ou 1 simulado + bom Student Model + várias áreas.

high:
- 3+ simulados + amostra mínima + várias áreas + sem dados inconsistentes.
```

Display:

```txt
collecting:
- não mostrar número forte.

preview:
- mostrar previsão fraca com aviso.

forecast:
- mostrar banda e explicação.
```

Implementar:

```js
function deriveForecastConfidence({ simAnchor, sample, operationalMode }) {
  const mode = operationalMode?.mode || operationalMode;
  if (mode === "dados_inconsistentes") return FORECAST_CONFIDENCE.INSUFFICIENT;
  if (!simAnchor?.n) return FORECAST_CONFIDENCE.INSUFFICIENT;
  if (simAnchor.n >= 3 && sample?.hasMinimumForStrongNumber) return FORECAST_CONFIDENCE.HIGH;
  if (simAnchor.n >= 2) return FORECAST_CONFIDENCE.MEDIUM;
  return FORECAST_CONFIDENCE.LOW;
}

function deriveDisplayMode(confidence, sample) {
  if (confidence === FORECAST_CONFIDENCE.INSUFFICIENT) return FORECAST_DISPLAY_MODE.COLLECTING;
  if (!sample?.hasMinimumForStrongNumber) return FORECAST_DISPLAY_MODE.PREVIEW;
  return FORECAST_DISPLAY_MODE.FORECAST;
}
```

### 9.13 Sample V2

Amostra mínima conservadora:

```txt
- pelo menos 1 simulado válido;
- pelo menos 300 questões ou evidência equivalente;
- pelo menos 3 áreas com maestria estimada;
- pelo menos 14 dias ativos ou histórico suficiente;
```

Não inventar `activeDays` se não houver histórico. Usar melhor esforço.

```js
export function calculateForecastSampleV2({
  temas = [],
  simulados = [],
  studentMastery = null,
  today = null,
} = {}) {
  const simNorm = normalizeSimulados(simulados);
  const nSimulados = simNorm.length;

  const totalQuestionsFromSims = simNorm.reduce((sum, s) => sum + (Number(s.totalQuestions) || 0), 0);

  const totalQuestionsFromTemas = temas.reduce((sum, t) => {
    const q = Number(t?.questoes || t?.questions || t?.qtdQuestoes || 0);
    return sum + (Number.isFinite(q) ? q : 0);
  }, 0);

  const totalQuestions = Math.max(totalQuestionsFromSims, totalQuestionsFromTemas);

  const areas = studentMastery?.areas || studentMastery?.areaMastery || [];
  const areasArr = Array.isArray(areas) ? areas : Object.values(areas || {});
  const areasWithMastery = areasArr.filter(a => {
    const p = a?.pMastery ?? a?.mastery ?? a?.score;
    return Number.isFinite(Number(p));
  }).length;

  const activeDays = inferActiveDaysFromTemas(temas);

  const missing = [];
  if (nSimulados < 1) missing.push("1 simulado válido");
  if (totalQuestions < 300) missing.push(`${300 - totalQuestions} questões registradas`);
  if (areasWithMastery < 3) missing.push(`${3 - areasWithMastery} áreas com maestria estimada`);
  if (activeDays < 14) missing.push(`${14 - activeDays} dias ativos`);

  return {
    nSimulados,
    totalQuestions,
    areasWithMastery,
    activeDays,
    hasMinimumForStrongNumber: missing.length === 0,
    missing,
  };
}
```

Criar `inferActiveDaysFromTemas` simples, sem persistir nada:

```js
function inferActiveDaysFromTemas(temas = []) {
  const dates = new Set();
  temas.forEach(t => {
    if (typeof t?.d0 === "string") dates.add(t.d0);
    Object.values(t?.rev || {}).forEach(r => {
      if (typeof r?.reviewedAt === "string") dates.add(r.reviewedAt.slice(0, 10));
      if (typeof r?.doneAt === "string") dates.add(r.doneAt.slice(0, 10));
    });
  });
  return dates.size;
}
```

### 9.14 Area Forecasts

Usar Student Model por área. Não criar blueprint ENAMED completo aqui.

Regra:

```txt
Se studentMastery já trouxer peso/área, usar.
Se não trouxer, peso uniforme.
```

```js
export function estimateAreaForecasts({ studentMastery, daysUntilExam, operationalMode, plat = "res" } = {}) {
  const rawAreas = studentMastery?.areas || studentMastery?.areaMastery || [];
  const areas = Array.isArray(rawAreas) ? rawAreas : Object.values(rawAreas || {});
  if (!areas.length) return [];

  const timePotential = calculateTimePotential(daysUntilExam, operationalMode) || 0;
  const risk = calculateOperationalRisk(operationalMode);
  const riskFactor = Math.max(0.55, 1 - risk / 100);

  return areas.map((a) => {
    const current = normalize01or100(a?.pMastery ?? a?.mastery ?? a?.score);
    const currentPct = current == null ? null : Math.round(current * 100);
    const gapPct = currentPct == null ? null : Math.max(0, 100 - currentPct);
    const gain = gapPct == null ? 0 : Math.min(timePotential, Math.round(gapPct * 0.18 * riskFactor));
    const projected = currentPct == null ? null : Math.min(100, currentPct + gain);

    const riskLevel = projected == null
      ? "high"
      : projected < 60
        ? "high"
        : projected < 75
          ? "medium"
          : "low";

    const reasons = [];
    if (projected != null && projected < 60) reasons.push("baixa_maestria_projetada");
    if (a?.confidence === "low") reasons.push("baixa_confianca_da_estimativa");
    if (risk >= 10) reasons.push("risco_operacional_alto");

    return {
      area: a?.area || a?.name || a?.esp || "Área sem nome",
      currentMastery: currentPct,
      projectedMastery: projected,
      confidence: a?.confidence || "low",
      weight: Number.isFinite(Number(a?.weight)) ? Number(a.weight) : 1,
      gap: projected == null ? 100 : Math.max(0, 100 - projected),
      riskLevel,
      reasons,
    };
  }).sort((a, b) => b.gap * b.weight - a.gap * a.weight);
}
```

### 9.15 Risks e warnings

Implementar:

```js
function buildForecastRisks({ sample, simAnchor, operationalMode, daysUntilExam, projectedScore }) {
  const risks = [];
  const mode = operationalMode?.mode || operationalMode;

  if (!simAnchor?.n) {
    risks.push({ code: "no_simulado", severity: "warning", message: "Forecast sem simulado é apenas prévia fraca." });
  }
  if (!sample?.hasMinimumForStrongNumber) {
    risks.push({ code: "small_sample", severity: "warning", message: "Amostra ainda pequena para número forte." });
  }
  if (mode === "sobrecarga") {
    risks.push({ code: "overload", severity: "critical", message: "Sobrecarga aumenta incerteza e reduz ganho provável." });
  }
  if (mode === "recuperacao") {
    risks.push({ code: "recovery_mode", severity: "warning", message: "Há atraso/reaprendizagem; previsão deve ser conservadora." });
  }
  if (daysUntilExam != null && daysUntilExam < 30) {
    risks.push({ code: "exam_close", severity: "warning", message: "Prova próxima: ganho projetado é limitado." });
  }
  if (projectedScore != null && projectedScore < 60) {
    risks.push({ code: "low_projected_score", severity: "critical", message: "Prontidão projetada baixa." });
  }

  return risks;
}
```

Warnings obrigatórios:

```txt
- "Forecast é proxy interno, não nota oficial."
- se plat === "res": "ENAMED/ENARE usa escala de proficiência; este modelo não estima TRI oficial."
```

---

## 10. Integração mínima com `readiness.js`

Importar:

```js
import { estimateReadinessForecast } from "./forecast";
```

Dentro de `getReadinessData`, após calcular os componentes já existentes:

```js
const forecast = estimateReadinessForecast({
  temas,
  temaStats: meta?.temaStats || {},
  simulados,
  meta,
  plat,
  today,
});
```

Mas atenção: provavelmente `temaStats` não está em `meta`. Se `getReadinessData` não recebe `temaStats`, altere assinatura de forma retrocompatível:

```js
export function getReadinessData({ temas, simulados, meta, plat, casosProgresso = {}, temaStats = {}, operationalMode = null, calibration = null }) {
```

E chame:

```js
const forecast = estimateReadinessForecast({
  temas,
  temaStats,
  simulados,
  meta,
  plat,
  today,
  operationalMode,
  calibration,
});
```

Adicionar no retorno:

```js
forecast,
```

Não substituir:

```txt
score
range
preparoEnamed
priorityList
```

Critério:

```txt
readiness antigo continua funcionando.
forecast aparece como campo novo opcional.
```

---

## 11. O que NÃO fazer na integração

Não faça:

```txt
- trocar score por projectedScore;
- mudar range atual para band do Forecast;
- renomear Preparo Estimado no Dashboard;
- mexer no card de Stats;
- alterar Simulados.jsx;
- criar CTA novo;
- persistir forecast;
- salvar snapshot diário;
- disparar notificação;
- reordenar ActionInbox;
- mudar MentorDecisionPolicy.
```

Forecast P2.2 é motor. UI vem depois.

---

## 12. Labels e copy segura

Criar labels no próprio `forecast.js` ou exportar mapa:

```js
export const FORECAST_LABEL = Object.freeze({
  collecting: "Coletando dados",
  preview: "Prévia de trajetória",
  forecast: "Forecast de prontidão",
});
```

Explicações:

```txt
collecting:
"Ainda não há dados suficientes para uma previsão útil. Registre pelo menos 1 simulado e mais revisões espaçadas."

preview:
"Prévia fraca baseada em dados parciais. Use como orientação, não como meta rígida."

forecast:
"Estimativa interna de trajetória até a prova, com banda de incerteza. Não é nota oficial."
```

---

## 13. Testes obrigatórios

Criar `src/core/forecast.test.js` se não existir. Se já existir, expandir.

### 13.1 Datas

Testar:

```txt
parseExamDate usa meta.dataProva válida.
parseExamDate rejeita formato inválido.
daysBetweenDates calcula diferença correta.
data passada vira daysUntilExam 0 no forecast.
```

### 13.2 Simulados

Testar:

```txt
normalizeSimulados aceita pct 0-100.
normalizeSimulados aceita pct 0-1.
normalizeSimulados ignora pct inválido.
calculateSimuladoAnchor pondera últimos 4.
Adicionar simulado recente maior aumenta anchor.
```

### 13.3 Amostra

Testar:

```txt
sem simulado -> confidence insufficient e display collecting.
1 simulado -> low ou preview.
3 simulados + amostra mínima -> high/forecast.
amostra pequena aumenta bandWidth.
```

### 13.4 Student Model

Com mock/fixture de P2.1:

```txt
masteryIndex alto aumenta currentScore.
masteryIndex baixo reduz currentScore.
areaForecasts ordena maior gap ponderado primeiro.
baixa confiança em área vira reason.
```

### 13.5 Monotonicidade

Obrigatório:

```txt
Se todos os componentes melhoram e diasUntilExam é igual, projectedScore não deve cair.
Se adiciona simulado com pct maior, currentScore não deve cair.
Se operationalMode muda de normal para sobrecarga, bandWidth aumenta ou confidence cai.
Se daysUntilExam cai de 120 para 14 com mesmos dados, timePotential não aumenta.
```

### 13.6 Segurança de produto

Testar:

```txt
forecast sempre inclui warning de proxy interno.
plat res inclui warning de não estimar TRI oficial.
sem simulado não retorna displayMode forecast.
forecast não muta inputs.
```

### 13.7 Readiness

Atualizar `readiness.test.js`:

```txt
getReadinessData mantém score antigo.
getReadinessData retorna forecast.
getReadinessData não quebra se forecast não tiver dados.
```

---

## 14. Fixtures sugeridas

### Fixture A — sem dado suficiente

```js
const temas = [];
const simulados = [];
const meta = { dataProva: "2026-09-13" };
```

Esperado:

```txt
projectedScore null ou preview null
confidence insufficient
displayMode collecting
isActionable false
risks inclui no_simulado/small_sample
```

### Fixture B — aluno intermediário

```js
const simulados = [{ pct: 62, data: "2026-05-01", totalQuestions: 100 }];
studentMastery global ~0.58
coverage ~45
adherence ~80
```

Esperado:

```txt
confidence low
displayMode preview
band larga
projectedScore conservador
```

### Fixture C — aluno com boa amostra

```js
simulados = [68, 72, 76]
studentMastery global ~0.74
coverage ~75
adherence ~90
areasWithMastery >= 4
activeDays >= 30
```

Esperado:

```txt
confidence high ou medium
projectedScore > currentScore, mas ganho conservador
band menor que cenário B
```

### Fixture D — sobrecarga

Mesmo da C, mas:

```js
operationalMode = { mode: "sobrecarga" }
```

Esperado:

```txt
band maior
risk overload
projectedScore não aumenta mais que no modo normal
```

---

## 15. Pseudocódigo da função principal

```js
export function estimateReadinessForecast({
  temas = [],
  temaStats = {},
  simulados = [],
  meta = {},
  plat = "res",
  today = null,
  operationalMode = null,
  calibration = null,
} = {}) {
  const todayStr = isValidDateStr(today) ? today : getTodayStrSafe();
  const targetDate = parseExamDate(meta, null);
  const rawDays = targetDate ? daysBetweenDates(todayStr, targetDate) : null;
  const daysUntilExam = rawDays == null ? null : Math.max(0, rawDays);

  const simAnchor = calculateSimuladoAnchor(simulados);

  const context = { operationalMode };
  let studentMastery = null;
  try {
    studentMastery = estimateStudentMastery({ temas, temaStats, context });
  } catch (err) {
    studentMastery = null;
  }

  const masteryIndex = getMasteryIndex(studentMastery);
  const coverageIndex = calculateCoverageIndex(temas);
  const adherenceIndex = calculateAdherenceIndex({ temas, meta });
  const calibrationIndex = getCalibrationIndex(calibration);
  const operationalRisk = calculateOperationalRisk(operationalMode);
  const timePotential = calculateTimePotential(daysUntilExam, operationalMode);

  const sample = calculateForecastSampleV2({ temas, simulados, studentMastery, today: todayStr });

  const components = {
    simuladoAnchor: simAnchor.value,
    masteryIndex,
    coverageIndex,
    adherenceIndex,
    calibrationIndex,
    timePotential,
    operationalRisk,
  };

  const currentScore = weightedScore(components, DEFAULT_FORECAST_WEIGHTS);
  const projectedScore = projectScoreConservatively(currentScore, timePotential);

  const confidence = deriveForecastConfidence({ simAnchor, sample, operationalMode });
  const displayMode = deriveDisplayMode(confidence, sample);
  const bandWidth = calculateForecastBand({
    nSimulados: simAnchor.n,
    confidence,
    daysUntilExam,
    operationalRisk,
    sample,
  });

  const band = projectedScore == null
    ? null
    : [Math.max(0, projectedScore - bandWidth), Math.min(100, projectedScore + bandWidth)];

  const areaForecasts = estimateAreaForecasts({ studentMastery, daysUntilExam, operationalMode, plat });
  const risks = buildForecastRisks({ sample, simAnchor, operationalMode, daysUntilExam, projectedScore });

  const warnings = ["Forecast é proxy interno de estudo, não nota oficial."];
  if (plat === "res") warnings.push("ENAMED/ENARE usa escala de proficiência; este modelo não estima TRI oficial.");

  return {
    version: "forecast_v1",
    targetDate,
    daysUntilExam,
    currentScore,
    projectedScore: displayMode === FORECAST_DISPLAY_MODE.COLLECTING ? null : projectedScore,
    band: displayMode === FORECAST_DISPLAY_MODE.COLLECTING ? null : band,
    bandWidth,
    confidence,
    isActionable: displayMode !== FORECAST_DISPLAY_MODE.COLLECTING,
    displayMode,
    sample,
    components,
    weightsUsed: DEFAULT_FORECAST_WEIGHTS,
    areaForecasts,
    risks,
    assumptions: buildForecastAssumptions({ daysUntilExam, sample, operationalMode }),
    warnings,
    label: FORECAST_LABEL[displayMode] || "Forecast",
    explanation: buildForecastExplanation({ displayMode, confidence, sample }),
  };
}
```

---

## 16. Critérios de aceite

O bloco só está pronto quando:

```txt
[ ] forecast.js preserva exports antigos.
[ ] forecast.js exporta estimateReadinessForecast.
[ ] forecast.js não instala dependência.
[ ] forecast.js consome estimateStudentMastery do P2.1.
[ ] forecast.js diferencia currentScore e projectedScore.
[ ] forecast.js usa meta.dataProva para daysUntilExam.
[ ] forecast.js retorna banda de confiança.
[ ] forecast.js retorna sample/missing.
[ ] forecast.js retorna risks/warnings/assumptions.
[ ] forecast.js não promete aprovação.
[ ] forecast.js não estima TRI oficial.
[ ] readiness.js apenas expõe forecast, sem substituir score.
[ ] readiness.test.js continua passando.
[ ] forecast.test.js cobre monotonicidade.
[ ] build passa.
[ ] check:mojibake passa.
```

---

## 17. Comandos de validação

Rodar:

```bash
npm test -- --watchAll=false src/core/forecast.test.js
npm test -- --watchAll=false src/core/readiness.test.js
npm test -- --watchAll=false
npm run check:mojibake
npm run build
```

Se `check:mojibake` não existir, rode o script equivalente do projeto.

---

## 18. Prompt curto para o executor

```txt
Implemente o BLOCO P2.2 — Forecast de Trajetória de Prontidão.

Objetivo:
Evoluir src/core/forecast.js, que já existe, para um motor puro de previsão de trajetória até a data da prova, usando Student Model P2.1 + simulados + meta.dataProva + amostra mínima + banda de confiança. Expor o forecast em getReadinessData sem substituir o readiness atual.

Arquivos permitidos:
- src/core/forecast.js
- src/core/forecast.test.js
- src/core/readiness.js
- src/core/readiness.test.js
- opcional: docs/P2_2_FORECAST_TRAJECTORY_DECISIONS.md

Pré-condição:
- src/core/mastery.js precisa exportar estimateStudentMastery.
- Se não exportar, pare e avise que P2.1 precisa estar implementado.

Arquivos proibidos:
- fsrs.js
- store.js
- mentorDecisionPolicy.js
- mentorSignals.js
- actionInbox.js
- operationalMode.js
- metricsRegistry.js
- Dashboard.jsx
- StatsPanel.jsx
- Simulados.jsx
- App.js
- firebase.js
- package.json
- package-lock.json

Implementar/preservar:
- preservar calcPrevisaoDesempenho, calcForecastSample e CONFIDENCE_LABEL.
- adicionar estimateReadinessForecast.
- adicionar helpers puros para datas, simulados, sample, banda, areaForecasts e riscos.
- readiness.js deve apenas retornar forecast como campo novo.

Regras:
- Não trocar score antigo por forecast.
- Não persistir forecast.
- Não alterar datas oficiais.
- Não estimar TRI oficial.
- Não prometer aprovação.
- Sem nova dependência.
- Forecast sem simulado = collecting/preview, não número forte.
- Forecast sempre inclui warning de proxy interno.

Testes obrigatórios:
- datas;
- simulados;
- amostra mínima;
- monotonicidade;
- sobrecarga aumenta incerteza;
- sem simulado não vira forecast forte;
- readiness mantém compatibilidade.

Validação final:
- npm test -- --watchAll=false src/core/forecast.test.js
- npm test -- --watchAll=false src/core/readiness.test.js
- npm test -- --watchAll=false
- npm run check:mojibake
- npm run build
```

---

## 19. O que vem depois

Depois do P2.2, o próximo bloco natural é:

```txt
P2.3 — Scheduler de interleaving real
```

Mas P2.3 só deve consumir Forecast como sinal fraco/diagnóstico, não como autoridade absoluta.

Ordem correta:

```txt
Student Model estima maestria.
Forecast estima trajetória.
Scheduler sugere intervenção.
DecisionCore escolhe ação final.
```

---

## 20. Referências científicas usadas para a decisão

1. Moursy et al. 2025 — *A systematic review of progress test as longitudinal assessment in Saudi Arabia*. BMC Medical Education.  
   https://link.springer.com/article/10.1186/s12909-025-06671-4

2. Reberti et al. 2020 — *Progress Test in Medical School: a Systematic Review of the Literature*. Revista Brasileira de Educação Médica.  
   https://www.scielo.br/j/rbem/a/cMgWPtDzDygMW84VDX9kDdR/

3. Almalawi et al. 2024 — *Predictive Models for Educational Purposes: A Systematic Review*. Big Data and Cognitive Computing.  
   https://www.mdpi.com/2504-2289/8/12/187

4. Corbett & Anderson 1995 — *Knowledge tracing: Modeling the acquisition of procedural knowledge*. User Modeling and User-Adapted Interaction.  
   https://act-r.psy.cmu.edu/wordpress/wp-content/uploads/2012/12/893CorbettAnderson1995.pdf

5. Dunlosky et al. 2013 — *Improving Students’ Learning With Effective Learning Techniques*. Psychological Science in the Public Interest.  
   https://pubmed.ncbi.nlm.nih.gov/26173288/

6. INEP 2026 — Edital/cronograma ENAMED 2026: prova em 13 de setembro; uso dos resultados no ENARE.  
   https://www.gov.br/inep/pt-br/centrais-de-conteudo/noticias/enamed/publicado-edital-do-enamed-2026

---

## 21. Decisão final

Implementar P2.2 como:

```txt
Forecast transparente, conservador, com banda de confiança,
ancorado em simulados e Student Model,
exposto como campo novo em readiness,
sem trocar score oficial interno e sem prometer nota oficial.
```

Não implementar como:

```txt
placar de aprovação,
nota TRI prevista,
novo dashboard,
novo scheduler,
ou motor paralelo fora de forecast.js.
```

A função do bloco é transformar o MedRev de um painel que mede o passado em um mentor que começa a projetar o futuro — mas sem fingir precisão que os dados ainda não sustentam.
