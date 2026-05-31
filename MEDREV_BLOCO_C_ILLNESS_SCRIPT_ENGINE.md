# MEDREV - BLOCO C: Motor de Raciocínio Clínico / Illness Script

> **Objetivo deste bloco:** criar o motor puro de raciocínio clínico em `src/core/illnessScript.js`, com testes em `src/core/illnessScript.test.js`.
>
> **Escopo fechado:** este bloco NÃO deve mexer em Dashboard, store, readiness, banco de casos, UI de Raciocínio Clínico, deploy, commit ou push.
>
> **Modelo sugerido:** `gpt-5.3-codex`
>
> **Reasoning effort:** `high`
>
> **Modo:** Agent com aprovação manual para comandos.

---

## 0. Contexto e decisões de produto

Estamos construindo um aplicativo para aprendizagem de residência médica/ENAMED com revisão espaçada e treino opcional de raciocínio clínico.

As decisões aprovadas para este bloco são:

1. O Bloco C deve ser **motor puro + testes apenas**.
2. A métrica pública deve ser **Score de Raciocínio Clínico**.
3. Esse score deve ficar **separado** do Preparo ENAMED neste momento.
4. O treino deve ser **formativo**, não punitivo.
5. Illness recall deve começar com **checklist/autoavaliação estruturada**, não correção textual agressiva.
6. Meta padrão futura: **2 casos/dia**, mas a persistência/UI entram em outro bloco.
7. O motor deve expor ordenação de casos por prioridade ENAMED/área fraca via `casosDeHoje(casos, progresso, areasPrioritarias)`.

Pipeline educacional esperado:

1. **Problem Representation:** uma frase com qualificadores semânticos.
2. **Hipóteses ranqueadas:** diferenciais em ordem de probabilidade.
3. **Illness Script Recall:** enabling conditions, fault/fisiopatologia, consequences, management.
4. **SCT / discriminação:** nova informação aumenta ou reduz a hipótese.
5. **Justificativa final:** por que o diagnóstico final vence os diferenciais.
6. **Reencontro espaçado:** caso volta conforme desempenho.

---

## 1. Regras inegociáveis

1. Mantenha todos os arquivos em **UTF-8 sem BOM**.
2. Não introduza mojibake. Rode `npm run check:mojibake` antes de finalizar.
3. Não use PowerShell 5.1 para gravar arquivos com acentos. Se precisar gerar arquivo por script, use Node/Python com `encoding: "utf8"`.
4. `src/core/illnessScript.js` deve ser **puro**:
   - sem React;
   - sem DOM;
   - sem Zustand;
   - sem localStorage;
   - sem Firebase;
   - sem efeito colateral.
5. Não instalar bibliotecas novas.
6. Não alterar `fsrs.js`, exceto se houver erro real de import por nome. Primeiro inspecione exports existentes.
7. Não fazer commit, deploy ou push neste bloco.

---

## 2. Pré-checagem obrigatória

Rode:

```bash
pwd
git status --short
node -v
npm -v
npm run check:mojibake
```

Depois inspecione os exports de `src/core/fsrs.js`:

```bash
node -e "const fs=require('fs'); const p='src/core/fsrs.js'; const t=fs.readFileSync(p,'utf8'); console.log((t.match(/export\s+(function|const|let|var|class)\s+\w+/g)||[]).join('\n'));"
```

Confirme que existem `addDays` e `todayStr`. Se os nomes forem diferentes, adapte apenas os imports de `illnessScript.js`, sem reescrever `fsrs.js` neste bloco.

---

## 3. Criar `src/core/illnessScript.js`

Crie o arquivo abaixo exatamente, ajustando apenas o import de `addDays`/`todayStr` se o projeto tiver nomes diferentes.

```js
// src/core/illnessScript.js
// Motor puro de Raciocínio Clínico (Illness Script).
// Sem React, sem Zustand, sem localStorage e sem efeitos colaterais.
//
// Pipeline formativo:
// 1. Problem representation: 1 frase com qualificadores semânticos.
// 2. Hipóteses ranqueadas: diagnóstico mais provável + diferenciais que não pode perder.
// 3. Illness script recall: enabling conditions, fault, consequences, management.
// 4. SCT: nova informação aumenta ou reduz a hipótese.
// 5. Justificativa final: por que o diagnóstico final vence.
// 6. Reencontro espaçado: agenda o caso conforme desempenho.

import { addDays, todayStr } from "./fsrs";

export const PESO_FASE = Object.freeze({
  problemRep: 0.20,
  hipoteses: 0.20,
  illnessRecall: 0.30,
  sct: 0.20,
  justificativa: 0.10,
});

export const ILLNESS_RECALL_WEIGHTS = Object.freeze({
  enabling: 0.25,
  fault: 0.25,
  consequences: 0.30,
  management: 0.20,
});

export const REENCONTRO_BASE_DIAS = Object.freeze({
  again: 2,
  hard: 4,
  good: 9,
  easy: 16,
});

const SEMANTIC_HINTS = Object.freeze([
  ["agudo", "cronico", "crônico", "subagudo", "subito", "súbito", "insidioso", "progressivo", "intermitente"],
  ["unilateral", "bilateral", "difuso", "localizado", "migratorio", "migratório", "irradiado"],
  ["febril", "afebril", "doloroso", "indolor", "toxemiado", "estavel", "estável", "instavel", "instável"],
  ["jovem", "idoso", "homem", "mulher", "gestante", "lactente", "neonato", "crianca", "criança", "adolescente"],
  ["horas", "dias", "semanas", "meses", "anos", "minutos"],
]);

const DIFICULDADE_RANK = Object.freeze({
  dificil: 0,
  difícil: 0,
  media: 1,
  média: 1,
  facil: 2,
  fácil: 2,
});

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function clamp(n, min = 0, max = 100) {
  const value = Number(n);
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function tokenize(text) {
  return normalize(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function hasApproxMatch(input, target) {
  const a = normalize(input);
  const b = normalize(target);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;

  const aTokens = new Set(tokenize(a));
  const bTokens = tokenize(b);
  if (!aTokens.size || !bTokens.length) return false;

  const hits = bTokens.filter((token) => aTokens.has(token)).length;
  return hits >= Math.max(1, Math.ceil(bTokens.length * 0.6));
}

function differentialMatches(userText, diferencial) {
  if (hasApproxMatch(userText, diferencial?.dx)) return true;
  const aliases = diferencial?.aliases || diferencial?.apelidos || [];
  return aliases.some((alias) => hasApproxMatch(userText, alias));
}

function countKeywordHits(text, keywords = []) {
  const t = normalize(text);
  const normalizedKeywords = keywords.map(normalize).filter(Boolean);
  const hits = normalizedKeywords.filter((kw) => t.includes(kw));
  return { hits: hits.length, total: normalizedKeywords.length, matched: hits };
}

function semanticCoverage(text) {
  const t = normalize(text);
  let categoriasCobertas = 0;
  for (const grupo of SEMANTIC_HINTS) {
    if (grupo.some((hint) => t.includes(normalize(hint)))) categoriasCobertas += 1;
  }
  return categoriasCobertas;
}

/**
 * Analisa uma problem representation de forma formativa.
 * Retorna detalhes para a UI explicar o score sem tratar a heurística como verdade absoluta.
 */
export function analisarProblemRepresentation(texto, caso = {}) {
  const raw = String(texto || "").trim();
  const normalized = normalize(raw);
  if (normalized.length < 12) {
    return {
      score: 0,
      categoriasCobertas: 0,
      keywordHits: 0,
      keywordTotal: caso?.problemRepKeywords?.length || 0,
      concisaoScore: 0,
      copiaVinhetaPenalty: 0,
      feedback: ["Escreva uma frase-síntese com idade/contexto, tempo de evolução, síndrome principal e achados discriminantes."],
    };
  }

  const categoriasCobertas = semanticCoverage(raw);
  const semanticScore = Math.min(1, categoriasCobertas / 3);

  const { hits: keywordHits, total: keywordTotal, matched } = countKeywordHits(raw, caso?.problemRepKeywords || []);
  const keywordScore = keywordTotal ? keywordHits / keywordTotal : 0;

  const palavras = normalized.split(/\s+/).filter(Boolean).length;
  const concisaoScore = palavras <= 35 ? 1 : Math.max(0.35, 1 - (palavras - 35) / 60);

  const vinhetaTokens = new Set(tokenize(caso?.vinheta || ""));
  const userTokens = tokenize(raw);
  const overlap = userTokens.filter((token) => vinhetaTokens.has(token)).length;
  const overlapRatio = userTokens.length ? overlap / userTokens.length : 0;
  const copiaVinhetaPenalty = palavras > 45 && overlapRatio > 0.8 ? 0.15 : 0;

  const rawScore = 0.45 * semanticScore + 0.40 * keywordScore + 0.15 * concisaoScore - copiaVinhetaPenalty;
  const score = Math.round(clamp(rawScore * 100));

  const feedback = [];
  if (categoriasCobertas < 3) feedback.push("Inclua mais qualificadores semânticos: tempo, ritmo, localização, gravidade e perfil do paciente.");
  if (keywordTotal && keywordHits < Math.ceil(keywordTotal * 0.5)) feedback.push("A frase ainda não cobre elementos centrais esperados para este caso.");
  if (palavras > 35) feedback.push("Tente reduzir para uma frase curta; problem representation não é resumo completo da vinheta.");
  if (!feedback.length) feedback.push("Boa síntese: a frase parece curta, qualificada e orientada por achados discriminantes.");

  return {
    score,
    categoriasCobertas,
    keywordHits,
    keywordTotal,
    matchedKeywords: matched,
    concisaoScore: Math.round(concisaoScore * 100),
    copiaVinhetaPenalty: Math.round(copiaVinhetaPenalty * 100),
    feedback,
  };
}

export function scoreProblemRepresentation(texto, caso = {}) {
  return analisarProblemRepresentation(texto, caso).score;
}

/**
 * Analisa hipóteses ranqueadas.
 * userRank: array de strings em ordem de probabilidade.
 * caso.diferenciais: [{ dx, plausibilidade, mustNotMiss, aliases?, pista }]
 */
export function analisarHipoteses(userRank = [], caso = {}) {
  const hipoteses = Array.isArray(userRank) ? userRank.map(String).filter((h) => h.trim()) : [];
  const diferenciais = Array.isArray(caso?.diferenciais) ? caso.diferenciais : [];

  if (!hipoteses.length || !diferenciais.length) {
    return {
      score: 0,
      diagnosticoPrincipalNoTopo: false,
      diagnosticoPrincipalPresente: false,
      mustNotMissCobertos: [],
      mustNotMissAusentes: diferenciais.filter((d) => d.mustNotMiss).map((d) => d.dx),
      feedback: ["Liste as hipóteses em ordem de probabilidade antes de avançar."],
    };
  }

  const principais = diferenciais.filter((d) => d.plausibilidade === "alta");
  const mustNotMiss = diferenciais.filter((d) => d.mustNotMiss);

  const principalTop1 = principais.some((d) => differentialMatches(hipoteses[0], d));
  const principalTop2 = principais.some((d) => hipoteses.slice(0, 2).some((h) => differentialMatches(h, d)));
  const principalAny = principais.some((d) => hipoteses.some((h) => differentialMatches(h, d)));

  let score = 0;
  if (principalTop1) score += 50;
  else if (principalTop2) score += 40;
  else if (principalAny) score += 25;

  const mediaOuAlta = diferenciais.filter((d) => d.plausibilidade === "alta" || d.plausibilidade === "media" || d.plausibilidade === "média");
  const cobertosRelevantes = mediaOuAlta.filter((d) => hipoteses.some((h) => differentialMatches(h, d))).length;
  if (mediaOuAlta.length) score += Math.round((cobertosRelevantes / mediaOuAlta.length) * 25);

  const mustNotMissCobertos = mustNotMiss.filter((d) => hipoteses.some((h) => differentialMatches(h, d))).map((d) => d.dx);
  const mustNotMissAusentes = mustNotMiss.filter((d) => !hipoteses.some((h) => differentialMatches(h, d))).map((d) => d.dx);

  if (mustNotMiss.length === 0) {
    score += 15;
  } else if (mustNotMissAusentes.length === 0) {
    score += 15;
  } else {
    score -= Math.min(35, mustNotMissAusentes.length * 15);
  }

  score = Math.round(clamp(score));

  const feedback = [];
  if (!principalAny) feedback.push("A hipótese mais provável esperada não apareceu na lista.");
  else if (!principalTop2) feedback.push("A hipótese principal apareceu, mas deveria estar mais alta no ranking.");
  if (mustNotMissAusentes.length) feedback.push(`Inclua diagnósticos que não pode perder: ${mustNotMissAusentes.join(", ")}.`);
  if (!feedback.length) feedback.push("Bom ranking: hipótese principal priorizada e diagnósticos de segurança lembrados.");

  return {
    score,
    diagnosticoPrincipalNoTopo: principalTop1,
    diagnosticoPrincipalPresente: principalAny,
    mustNotMissCobertos,
    mustNotMissAusentes,
    feedback,
  };
}

export function scoreHipoteses(userRank = [], caso = {}) {
  return analisarHipoteses(userRank, caso).score;
}

function normalizeChecklistValue(value) {
  if (typeof value === "boolean") return value ? 100 : 0;
  if (typeof value === "number") return clamp(value);
  if (typeof value === "string") {
    const v = normalize(value);
    if (["sim", "ok", "feito", "completo", "bom", "good", "easy"].includes(v)) return 100;
    if (["parcial", "medio", "médio", "hard"].includes(v)) return 60;
    if (["nao", "não", "zero", "again", "ruim"].includes(v)) return 0;
  }
  return 0;
}

/**
 * Pontua illness recall por checklist/autoavaliação.
 * Aceita:
 * - número 0-100;
 * - objeto { enabling, fault, consequences, management } com boolean, número ou rótulo textual.
 */
export function scoreIllnessRecallChecklist(checklist = {}) {
  if (typeof checklist === "number") return Math.round(clamp(checklist));
  if (!checklist || typeof checklist !== "object") return 0;

  const score = Object.entries(ILLNESS_RECALL_WEIGHTS).reduce((acc, [key, weight]) => {
    return acc + normalizeChecklistValue(checklist[key]) * weight;
  }, 0);

  return Math.round(clamp(score));
}

/**
 * SCT: cada resposta do aluno é -2, -1, 0, +1, +2.
 * Compara com efeitoPainel do caso.
 * Diferença 0 = 100; diferença 1 = 75; diferença 2 = 50; diferença 3 = 25; diferença 4 = 0.
 */
export function scoreSct(respostas = {}, caso = {}) {
  const itens = Array.isArray(caso?.sct) ? caso.sct : [];
  if (!itens.length) return null;

  let soma = 0;
  let n = 0;

  itens.forEach((item, idx) => {
    const raw = Array.isArray(respostas) ? respostas[idx] : respostas[idx] ?? respostas[String(idx)];
    const resposta = Number(raw);
    const painel = Number(item?.efeitoPainel);
    if (Number.isNaN(resposta) || Number.isNaN(painel)) return;

    const diff = Math.abs(clamp(resposta, -2, 2) - clamp(painel, -2, 2));
    soma += Math.max(0, 100 - diff * 25);
    n += 1;
  });

  if (!n) return null;
  return Math.round(soma / n);
}

/**
 * Justificativa textual leve por keywords.
 * Não deve ser usada como correção definitiva; serve para feedback formativo inicial.
 */
export function scoreJustificativaKeywords(texto, caso = {}) {
  const keywords = caso?.justificativaKeywords || [];
  if (!keywords.length) return null;
  const { hits, total, matched } = countKeywordHits(texto, keywords);
  return {
    score: Math.round(clamp((hits / total) * 100)),
    hits,
    total,
    matchedKeywords: matched,
  };
}

/**
 * Nota consolidada do caso.
 * Aceita aliases para facilitar integração futura com UI/store.
 */
export function scoreCaso(payload = {}) {
  const problemRepScore = payload.problemRepScore ?? payload.problemRepresentationScore;
  const hipotesesScore = payload.hipotesesScore ?? payload.hypothesesScore;
  const illnessRecall = payload.illnessRecall ?? payload.illnessRecallScore;
  const sctScore = payload.sctScore;

  let justificativaValue = null;
  if (typeof payload.justificativaScore === "number") justificativaValue = clamp(payload.justificativaScore);
  else if (typeof payload.justificativaOk === "boolean") justificativaValue = payload.justificativaOk ? 100 : 40;

  const partes = [
    problemRepScore != null ? { value: clamp(problemRepScore), weight: PESO_FASE.problemRep } : null,
    hipotesesScore != null ? { value: clamp(hipotesesScore), weight: PESO_FASE.hipoteses } : null,
    illnessRecall != null ? { value: clamp(illnessRecall), weight: PESO_FASE.illnessRecall } : null,
    sctScore != null ? { value: clamp(sctScore), weight: PESO_FASE.sct } : null,
    justificativaValue != null ? { value: justificativaValue, weight: PESO_FASE.justificativa } : null,
  ].filter(Boolean);

  if (!partes.length) return null;
  const weightSum = partes.reduce((acc, part) => acc + part.weight, 0);
  return Math.round(partes.reduce((acc, part) => acc + part.value * part.weight, 0) / weightSum);
}

export function ratingDeNota(nota) {
  if (nota == null) return "good";
  const n = Number(nota);
  if (Number.isNaN(n)) return "good";
  if (n < 55) return "again";
  if (n < 70) return "hard";
  if (n < 88) return "good";
  return "easy";
}

/**
 * Agenda reencontro do caso.
 * prev: { S, intervalo }
 * nota: 0-100
 */
export function agendarReencontro(prev = {}, nota) {
  const rating = ratingDeNota(nota);
  const previousStability = Number(prev?.S) > 0 ? Number(prev.S) : 2;
  const ganho = { again: -0.6, hard: 0.1, good: 0.35, easy: 0.6 }[rating];
  const S = Math.max(1, previousStability * Math.exp(ganho));
  const base = REENCONTRO_BASE_DIAS[rating];
  const intervalo = Math.max(2, Math.round((base + S) / 2));

  return {
    rating,
    S,
    intervalo,
    proximaData: addDays(todayStr(), intervalo),
  };
}

function areaPriority(area, areasPrioritarias = []) {
  const normArea = normalize(area);
  const idx = areasPrioritarias.map(normalize).findIndex((a) => a === normArea || normArea.includes(a) || a.includes(normArea));
  return idx >= 0 ? idx : 999;
}

function dificuldadePriority(dificuldade) {
  const key = normalize(dificuldade);
  return DIFICULDADE_RANK[key] ?? 1;
}

/**
 * Retorna casos devidos hoje + casos novos priorizados.
 * Não aplica persistência; a UI/store decide limite e gravação.
 */
export function casosDeHoje(casos = [], progresso = {}, areasPrioritarias = [], options = {}) {
  const hoje = todayStr();
  const limiteNovos = Number.isFinite(options.limiteNovos) ? options.limiteNovos : null;

  const devidos = [];
  const novos = [];

  for (const caso of casos || []) {
    if (!caso?.id) continue;
    const p = progresso?.[caso.id];

    if (p?.proximaData) {
      if (String(p.proximaData) <= hoje) {
        devidos.push({ caso, progresso: p, motivo: "reencontro" });
      }
      continue;
    }

    if (!p || !p.vistos) {
      novos.push({ caso, progresso: null, motivo: "novo" });
    }
  }

  devidos.sort((a, b) => {
    const da = String(a.progresso?.proximaData || "9999-99-99");
    const db = String(b.progresso?.proximaData || "9999-99-99");
    if (da !== db) return da.localeCompare(db);
    return areaPriority(a.caso.area, areasPrioritarias) - areaPriority(b.caso.area, areasPrioritarias);
  });

  novos.sort((a, b) => {
    const areaDelta = areaPriority(a.caso.area, areasPrioritarias) - areaPriority(b.caso.area, areasPrioritarias);
    if (areaDelta !== 0) return areaDelta;
    return dificuldadePriority(a.caso.dificuldade) - dificuldadePriority(b.caso.dificuldade);
  });

  const novosSelecionados = limiteNovos == null ? novos : novos.slice(0, Math.max(0, limiteNovos));
  return [...devidos, ...novosSelecionados];
}

export function calcRaciocinioScore(progresso = {}) {
  const notas = Object.values(progresso || {})
    .filter((p) => p && Number(p.vistos || 0) > 0 && typeof p.notaCaso === "number")
    .map((p) => clamp(p.notaCaso));

  if (!notas.length) return null;
  return Math.round(notas.reduce((acc, nota) => acc + nota, 0) / notas.length);
}

export function coberturaRaciocinioPorArea(casos = [], progresso = {}) {
  const out = {};

  for (const caso of casos || []) {
    if (!caso?.area) continue;
    const area = caso.area;
    if (!out[area]) {
      out[area] = { total: 0, vistos: 0, somaNota: 0, comNota: 0, pctCobertura: 0, notaMedia: null };
    }

    out[area].total += 1;
    const p = progresso?.[caso.id];
    if (Number(p?.vistos || 0) > 0) {
      out[area].vistos += 1;
      if (typeof p.notaCaso === "number") {
        out[area].somaNota += clamp(p.notaCaso);
        out[area].comNota += 1;
      }
    }
  }

  for (const area of Object.keys(out)) {
    const row = out[area];
    row.pctCobertura = row.total ? Math.round((row.vistos / row.total) * 100) : 0;
    row.notaMedia = row.comNota ? Math.round(row.somaNota / row.comNota) : null;
  }

  return out;
}
```

---

## 4. Criar `src/core/illnessScript.test.js`

Crie os testes abaixo. Não faça snapshot test. Teste lógica pura.

```js
// src/core/illnessScript.test.js

import {
  agendarReencontro,
  analisarHipoteses,
  analisarProblemRepresentation,
  casosDeHoje,
  calcRaciocinioScore,
  coberturaRaciocinioPorArea,
  ratingDeNota,
  scoreCaso,
  scoreHipoteses,
  scoreIllnessRecallChecklist,
  scoreJustificativaKeywords,
  scoreProblemRepresentation,
  scoreSct,
} from "./illnessScript";

const casoApendicite = {
  id: "apendicite-classica",
  area: "Cirurgia",
  dificuldade: "media",
  vinheta: "Homem, 24 anos, dor periumbilical há 18h que migrou para fossa ilíaca direita, com anorexia, náusea e febre baixa.",
  problemRepKeywords: ["agudo", "homem jovem", "dor migratória", "fossa ilíaca direita", "febril", "horas"],
  diferenciais: [
    { dx: "Apendicite aguda", plausibilidade: "alta", aliases: ["apendicite"] },
    { dx: "Torção ovariana", plausibilidade: "baixa", mustNotMiss: true },
    { dx: "Cólica ureteral", plausibilidade: "media" },
  ],
  justificativaKeywords: ["migr", "peritone", "fid", "leucocit"],
  sct: [
    { hipotese: "Apendicite aguda", novaInfo: "TC com apendicolito", efeitoPainel: 2 },
    { hipotese: "Apendicite aguda", novaInfo: "USG com apêndice compressível", efeitoPainel: -2 },
  ],
};

describe("illnessScript engine", () => {
  test("scoreProblemRepresentation recompensa síntese com qualificadores e keywords", () => {
    const texto = "Homem jovem com dor aguda migratória para fossa ilíaca direita há horas, febril e com irritação peritoneal.";
    const score = scoreProblemRepresentation(texto, casoApendicite);
    expect(score).toBeGreaterThanOrEqual(70);

    const analise = analisarProblemRepresentation(texto, casoApendicite);
    expect(analise.categoriasCobertas).toBeGreaterThanOrEqual(3);
    expect(analise.keywordHits).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(analise.feedback)).toBe(true);
  });

  test("scoreProblemRepresentation penaliza texto vazio", () => {
    expect(scoreProblemRepresentation("", casoApendicite)).toBe(0);
  });

  test("scoreHipoteses prioriza diagnóstico principal e cobra must-not-miss", () => {
    const bom = scoreHipoteses(["Apendicite", "Torção ovariana", "Cólica ureteral"], casoApendicite);
    const ruim = scoreHipoteses(["Gastroenterite", "Cólica ureteral"], casoApendicite);

    expect(bom).toBeGreaterThan(ruim);

    const analise = analisarHipoteses(["Apendicite", "Cólica ureteral"], casoApendicite);
    expect(analise.mustNotMissAusentes).toContain("Torção ovariana");
    expect(analise.feedback.join(" ")).toMatch(/não pode perder/i);
  });

  test("scoreIllnessRecallChecklist aceita checklist booleano e numérico", () => {
    expect(scoreIllnessRecallChecklist({ enabling: true, fault: true, consequences: true, management: true })).toBe(100);
    expect(scoreIllnessRecallChecklist({ enabling: true, fault: false, consequences: 50, management: "parcial" })).toBeGreaterThan(30);
    expect(scoreIllnessRecallChecklist(82)).toBe(82);
  });

  test("scoreSct compara resposta do aluno ao painel", () => {
    expect(scoreSct([2, -2], casoApendicite)).toBe(100);
    expect(scoreSct([1, -1], casoApendicite)).toBe(75);
    expect(scoreSct([0, 0], casoApendicite)).toBe(50);
  });

  test("scoreJustificativaKeywords retorna cobertura leve por keywords", () => {
    const out = scoreJustificativaKeywords("Dor migratória para FID com sinais peritoneais", casoApendicite);
    expect(out.score).toBeGreaterThanOrEqual(50);
    expect(out.hits).toBeGreaterThanOrEqual(2);
  });

  test("scoreCaso pondera fases preenchidas", () => {
    const score = scoreCaso({
      problemRepScore: 80,
      hipotesesScore: 90,
      illnessRecallScore: 70,
      sctScore: 100,
      justificativaScore: 60,
    });

    expect(score).toBeGreaterThanOrEqual(75);
    expect(score).toBeLessThanOrEqual(90);
    expect(scoreCaso({})).toBeNull();
  });

  test("ratingDeNota usa faixas conservadoras", () => {
    expect(ratingDeNota(40)).toBe("again");
    expect(ratingDeNota(60)).toBe("hard");
    expect(ratingDeNota(80)).toBe("good");
    expect(ratingDeNota(92)).toBe("easy");
  });

  test("agendarReencontro retorna intervalo e próxima data", () => {
    const out = agendarReencontro({ S: 2 }, 92);
    expect(out.rating).toBe("easy");
    expect(out.intervalo).toBeGreaterThanOrEqual(2);
    expect(out.proximaData).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("casosDeHoje coloca reencontros antes de casos novos e prioriza áreas", () => {
    const casos = [
      { id: "cm-1", area: "Clínica Médica", dificuldade: "dificil" },
      { id: "cir-1", area: "Cirurgia", dificuldade: "facil" },
      { id: "ped-1", area: "Pediatria", dificuldade: "media" },
    ];
    const progresso = {
      "ped-1": { vistos: 1, proximaData: "2000-01-01", notaCaso: 75 },
    };

    const fila = casosDeHoje(casos, progresso, ["Clínica Médica"], { limiteNovos: 1 });
    expect(fila[0].caso.id).toBe("ped-1");
    expect(fila[0].motivo).toBe("reencontro");
    expect(fila[1].caso.id).toBe("cm-1");
  });

  test("calcRaciocinioScore e cobertura por área resumem progresso", () => {
    const casos = [
      { id: "a", area: "Cirurgia" },
      { id: "b", area: "Cirurgia" },
      { id: "c", area: "GO" },
    ];
    const progresso = {
      a: { vistos: 1, notaCaso: 80 },
      c: { vistos: 2, notaCaso: 60 },
    };

    expect(calcRaciocinioScore(progresso)).toBe(70);

    const cobertura = coberturaRaciocinioPorArea(casos, progresso);
    expect(cobertura.Cirurgia.pctCobertura).toBe(50);
    expect(cobertura.GO.pctCobertura).toBe(100);
    expect(cobertura.GO.notaMedia).toBe(60);
  });
});
```

---

## 5. Validação obrigatória

Rode:

```bash
npm run check:mojibake
npm test -- --watchAll=false --runTestsByPath src/core/illnessScript.test.js
npm test -- --watchAll=false
npm run build
```

Se `--runTestsByPath` não funcionar por causa da configuração do CRA/Jest, use:

```bash
npm test -- --watchAll=false illnessScript.test.js
```

---

## 6. Critérios de aceite

O bloco só está concluído se:

1. `src/core/illnessScript.js` existe.
2. `src/core/illnessScript.test.js` existe.
3. Nenhum arquivo de UI foi alterado neste bloco.
4. Nenhum arquivo de store/readiness foi alterado neste bloco.
5. `npm run check:mojibake` passa.
6. O teste específico de `illnessScript` passa.
7. `npm test -- --watchAll=false` passa ou, se houver testes legados quebrados, o executor deve documentar exatamente quais falham e provar que não foram quebrados por este bloco.
8. `npm run build` passa.
9. Não houve commit, push ou deploy.

---

## 7. Relatório final esperado do executor

Ao terminar, responda com:

```text
BLOCO C concluído.

Arquivos criados:
- src/core/illnessScript.js
- src/core/illnessScript.test.js

Validações:
- npm run check:mojibake: PASS/FAIL
- npm test -- --watchAll=false --runTestsByPath src/core/illnessScript.test.js: PASS/FAIL
- npm test -- --watchAll=false: PASS/FAIL
- npm run build: PASS/FAIL

Observações:
- Nenhuma alteração de UI/store/readiness neste bloco.
- Sem commit, sem push, sem deploy.
```
