# MEDREV_BLOCO_P2_1_STUDENT_MODEL_MAESTRIA_LATENTE_GEMINI.md

## BLOCO P2.1 — Student Model v1: Maestria latente por área/subtópico

> Executor sugerido: Gemini 3.5 Flash / modelo pequeno, com escopo estrito.  
> Modo: implementação cirúrgica.  
> Objetivo: evoluir `src/core/mastery.js` de classificador por thresholds para um **Student Model v1** determinístico, testável e compatível com o código atual.  
> Não instalar dependências. Não mexer em UI. Não mexer em agendamento oficial. Não persistir estado novo.

---

## 0. Resumo executivo

O P2.1 é o primeiro bloco em que o MedRev começa a “conhecer” o aluno de forma explícita.

Até agora, o sistema sabe:

```txt
- quais temas existem;
- quais revisões foram feitas;
- qual foi o acerto em cada etapa;
- qual estabilidade/dificuldade FSRS-Lite foi calculada;
- se o tema está em D0/D1/D4/D7/D21/manutenção;
- alguns sinais de pessoa/modo operacional vindos de P1.3.
```

Mas o código atual de `mastery.js` ainda responde de forma grosseira:

```txt
aprendendo / consolidando / dominado
```

usando thresholds fixos de média de acerto, D7/D21 e estabilidade.

O P2.1 transforma isso em:

```txt
estimateTopicMastery(tema, stats, context)
estimateAreaMastery(temas, temaStats, context)
estimateStudentMastery({ temas, temaStats, context })
getWeakMasteryTargets(...)
```

com uma estimativa latente `pMastery` de 0 a 1, nível interpretável, confiança da estimativa e motivos explicáveis.

A função antiga `getEstadoDominio` deve continuar existindo para compatibilidade, mas deve passar a ser um wrapper fino sobre o novo motor.

---

## 1. Onde este bloco entra no roadmap

Sequência já realizada/projetada:

```txt
P0   — DecisionCore / verdade única / estabilidade.
P1.1 — FSRS canônico em sombra.
P1.2 — Calibração metacognitiva.
P1.3 — Máquina de modo operacional.
P2.1 — Student Model v1: maestria latente por área/subtópico.
```

O P2.1 NÃO é:

```txt
- optimizer FSRS;
- forecast até a prova;
- scheduler de interleaving real;
- centro de erros;
- readiness TRI;
- dashboard novo;
- IA conversacional;
- Activity Log;
- persistência nova.
```

O P2.1 É:

```txt
um motor puro de estimativa de maestria.
```

Ele prepara:

```txt
P2.2 — Forecast preditivo de prontidão.
P2.3 — Scheduler de interleaving real.
P3   — Erro → ação corretiva → revisão.
P4   — Raciocínio clínico integrado por subtópico/skill.
```

---

## 2. Base científica e decisão de produto

### 2.1 Por que não usar só média de acerto?

Média de acerto mistura evidências de qualidade diferente:

```txt
D0 ≠ D21
1 questão ≠ 30 questões
acerto imediato ≠ acerto após espaçamento
100% com uma revisão ≠ domínio estável
```

Para o MedRev, “maestria” não deve significar apenas acerto médio.

Deve significar:

```txt
probabilidade de o aluno dominar aquele subtópico de forma reutilizável.
```

A consequência técnica:

```txt
A função de domínio precisa pesar evidência espaçada, maturidade, repetição, amostra e estabilidade.
```

---

### 2.2 Por que BKT-like, e não BKT completo?

Bayesian Knowledge Tracing modela a probabilidade latente de conhecimento do aluno ao longo de tentativas sucessivas. O modelo clássico usa parâmetros como:

```txt
p(L0)  — conhecimento inicial
p(T)   — probabilidade de aprender após tentativa
p(G)   — probabilidade de acertar por chute
p(S)   — probabilidade de errar apesar de saber
```

Mas o MedRev ainda não tem um dataset limpo por skill/item suficiente para treinar parâmetros por subtópico.

Portanto, P2.1 implementa um **BKT-like determinístico**:

```txt
- usa a matemática bayesiana básica;
- aceita acerto contínuo 0–1;
- usa parâmetros fixos conservadores;
- não treina parâmetros;
- não cria dependência externa;
- não persiste estado;
- gera estimativa explicável e testável.
```

Isso evita o erro clássico de produto: instalar um “motor adaptativo” sofisticado antes de ter dados limpos e contratos estáveis.

---

### 2.3 Por que preservar o classificador antigo?

Porque o código atual já importa:

```txt
getEstadoDominio
getProntidaoGlobal
```

em componentes existentes, especialmente no fluxo de cronograma/vestibular.

Então o P2.1 não deve quebrar assinatura pública.

Regra:

```txt
Funções antigas continuam exportadas.
Funções antigas passam a chamar o novo motor.
Nenhuma UI precisa saber que o motor mudou.
```

---

## 3. Auditoria do código atual

Arquivo atual:

```txt
src/core/mastery.js
```

Funções existentes:

```txt
getEstadoDominio(tema, stats = [])
getProntidaoGlobal(temas, temaStats = {})
```

Uso encontrado:

```txt
src/components/CronogramaVest.jsx
```

Problemas do estado atual:

```txt
1. Maestria é classe discreta, não probabilidade latente.
2. D0, D1, D4, D7 e D21 entram principalmente por média/threshold.
3. Não existe confiança da estimativa.
4. Não existe explicação estruturada.
5. Não existe agregação robusta por área/subtópico.
6. O motor não retorna alvos fracos priorizáveis.
7. Não há caminho limpo para Forecast/Mentor consumirem o dado.
8. O threshold de “dominado” está parcialmente correto, mas rígido.
```

Pontos positivos do código atual:

```txt
1. É puro.
2. É pequeno.
3. Não depende de React.
4. Já diferencia aprendendo/consolidando/dominado.
5. Já exige D21 + estabilidade + revisões espaçadas para dominado.
6. É um bom lugar para evoluir sem espalhar lógica.
```

Decisão:

```txt
Evoluir mastery.js, não criar outro arquivo paralelo tipo studentModel.js agora.
```

Motivo:

```txt
Evita o mesmo erro que o P0 combateu: múltiplas fontes de verdade.
```

---

## 4. Escopo estrito

### 4.1 Arquivos permitidos

```txt
src/core/mastery.js
src/core/mastery.test.js
```

Opcional, se o projeto exigir documentação interna:

```txt
docs/P2_1_STUDENT_MODEL_MASTERY_DECISIONS.md
```

### 4.2 Arquivos proibidos

```txt
src/core/fsrs.js
src/core/forecast.js
src/core/readiness.js
src/core/mentorDecisionPolicy.js
src/core/mentorSignals.js
src/core/actionInbox.js
src/core/metricsRegistry.js
src/core/store.js
src/components/StatsPanel.jsx
src/components/Dashboard.jsx
src/components/Cronograma.jsx
src/components/CronogramaVest.jsx
src/App.js
package.json
package-lock.json
firebase.js
localStorage / persistência
```

### 4.3 Proibições explícitas

Não fazer:

```txt
- instalar biblioteca BKT;
- instalar biblioteca de ML;
- alterar datas de revisão;
- trocar FSRS-Lite;
- usar ts-fsrs para decidir maestria;
- criar nova aba;
- criar novo card de UI;
- salvar pMastery no tema;
- mudar schema de estado;
- mexer em Firebase;
- alterar readiness;
- alterar Mentor;
- alterar ActionInbox;
- alterar métricas exibidas;
- fazer refactor amplo;
- “limpar” mastery.js de forma destrutiva;
- renomear getEstadoDominio;
- renomear getProntidaoGlobal.
```

---

## 5. Contrato público esperado

Adicionar exports em `src/core/mastery.js`:

```js
export const MASTERY_LEVELS = Object.freeze({
  LEARNING: "aprendendo",
  CONSOLIDATING: "consolidando",
  MASTERED: "dominado",
});

export const MASTERY_CONFIDENCE = Object.freeze({
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

export const DEFAULT_MASTERY_PARAMS = Object.freeze({
  prior: 0.30,
  learn: 0.08,
  guess: 0.25,
  slip: 0.12,
  minEvidenceForMedium: 3,
  minEvidenceForHigh: 5,
  masteredThreshold: 0.85,
  consolidatingThreshold: 0.65,
});

export function updateBayesianMastery(prior, observation, params = DEFAULT_MASTERY_PARAMS) {}

export function collectMasteryEvidence(tema, stats = []) {}

export function estimateTopicMastery(tema, stats = [], context = {}) {}

export function estimateAreaMastery(temas = [], temaStats = {}, context = {}) {}

export function estimateStudentMastery({ temas = [], temaStats = {}, context = {} } = {}) {}

export function getWeakMasteryTargets({ temas = [], temaStats = {}, context = {}, limit = 5 } = {}) {}
```

Manter exports antigos:

```js
export function getEstadoDominio(tema, stats = []) {}
export function getProntidaoGlobal(temas, temaStats = {}) {}
```

---

## 6. Modelo de dados de saída

### 6.1 `estimateTopicMastery`

Deve retornar:

```js
{
  topicId: tema.id ?? null,
  topicName: tema.nome ?? tema.titulo ?? "Tema",
  area: tema.esp ?? tema.area ?? "Geral",
  subtopic: tema.subtopico ?? tema.subarea ?? tema.nome ?? "Tema",

  pMastery: 0.0,           // 0–1
  level: "aprendendo",    // aprendendo|consolidando|dominado
  confidence: "low",      // none|low|medium|high

  evidenceCount: 0,
  spacedEvidenceCount: 0,
  matureEvidenceCount: 0,
  highQualityEvidenceCount: 0,

  latestStep: null,
  latestAccuracy: null,
  latestStability: null,

  memoryStrength: null,    // proxy 0–1 derivado de S/etapa, se disponível
  difficulty: null,        // proxy 0–1 derivado de D, se disponível

  reasons: [],             // strings estáveis para explicabilidade/testes
  warnings: [],            // baixa amostra, D0 only etc.

  raw: {
    prior: 0.30,
    paramsVersion: "mastery-bkt-lite-v1"
  }
}
```

### 6.2 `estimateAreaMastery`

Deve retornar objeto por área:

```js
{
  Preventiva: {
    area: "Preventiva",
    pMastery: 0.72,
    level: "consolidando",
    confidence: "medium",
    totalTopics: 12,
    topicsWithEvidence: 9,
    masteredTopics: 3,
    consolidatingTopics: 4,
    learningTopics: 5,
    coverage: 0.75,
    weakTopics: [...],
    topRiskReasons: [...]
  }
}
```

### 6.3 `estimateStudentMastery`

Deve retornar:

```js
{
  global: {
    pMastery: 0.0,
    level: "aprendendo",
    confidence: "low",
    totalTopics: 0,
    topicsWithEvidence: 0,
    masteredTopics: 0,
    coverage: 0,
  },
  byArea: {},
  byTopic: [],
  weakTargets: [],
  paramsVersion: "mastery-bkt-lite-v1"
}
```

---

## 7. Como calcular evidência

### 7.1 Fontes de evidência aceitas

A função `collectMasteryEvidence(tema, stats)` deve olhar:

```txt
1. tema.rev[step]
2. stats[] legado, quando existir
```

Não assumir formato perfeito.

Deve ignorar evidências inválidas:

```txt
- acerto null/undefined/NaN;
- step desconhecido;
- item sem done quando vier de tema.rev;
- objetos malformados.
```

### 7.2 Steps conhecidos

Usar ordem:

```js
const STEP_ORDER = ["d0", "d1", "d4", "d7", "d21", "manutencao"];
```

Aceitar também aliases defensivos:

```txt
maintenance → manutencao
D0/D1/D4/D7/D21 → d0/d1/d4/d7/d21
```

### 7.3 Peso por etapa

Sugestão conservadora:

```js
const STEP_WEIGHT = {
  d0: 0.45,
  d1: 0.75,
  d4: 1.00,
  d7: 1.20,
  d21: 1.55,
  manutencao: 1.70,
};
```

Justificativa:

```txt
D0 mede aprendizagem imediata.
D1 mede retenção curta.
D4/D7 medem recuperação espaçada intermediária.
D21/manutenção medem recuperação mais próxima de retenção longa.
```

### 7.4 Evidência madura

Definir:

```txt
matureEvidence = step em d21 ou manutencao.
spacedEvidence = step diferente de d0.
highQualityEvidence = acerto >= 0.80 em step diferente de d0.
```

### 7.5 Questões/amostra

Se o evento tiver `questoes`:

```txt
questoes >= 20 → peso de confiança +15%
questoes 10–19 → peso neutro
questoes 1–9 → peso de confiança -10%
sem questoes → neutro
```

Atenção:

```txt
Não aumentar pMastery diretamente por número de questões.
Aumentar confiança da evidência, não transformar volume em conhecimento.
```

---

## 8. Fórmula BKT-like

Implementar função pura:

```js
export function updateBayesianMastery(prior, observation, params = DEFAULT_MASTERY_PARAMS) {
  // prior: 0–1
  // observation: {
  //   acerto: 0–1,
  //   stepWeight: number,
  //   evidenceWeight: number,
  // }
}
```

### 8.1 Normalização

```js
const p = clamp01(prior);
const a = clamp01(observation.acerto);
const stepWeight = Math.max(0.1, observation.stepWeight ?? 1);
const evidenceWeight = Math.max(0.1, observation.evidenceWeight ?? 1);
```

### 8.2 Bayes para resposta correta

```js
posteriorCorrect =
  (p * (1 - slip)) /
  ((p * (1 - slip)) + ((1 - p) * guess));
```

### 8.3 Bayes para resposta incorreta

```js
posteriorIncorrect =
  (p * slip) /
  ((p * slip) + ((1 - p) * (1 - guess)));
```

### 8.4 Acerto contínuo

Como o MedRev registra `acerto` contínuo 0–1, não converter tudo para binário.

Usar mistura:

```js
posterior = (a * posteriorCorrect) + ((1 - a) * posteriorIncorrect);
```

### 8.5 Aprendizagem após tentativa

```js
const effectiveLearn = clamp01(learn * stepWeight * evidenceWeight);
const afterLearning = posterior + ((1 - posterior) * effectiveLearn);
```

### 8.6 Segurança numérica

```txt
- clamp final em 0–1;
- se denominador for 0, retornar prior;
- se qualquer input inválido, retornar prior;
- não lançar exceção com objeto malformado.
```

---

## 9. Como estimar tópico

Pseudo-implementação:

```js
export function estimateTopicMastery(tema, stats = [], context = {}) {
  const evidence = collectMasteryEvidence(tema, stats);

  let p = DEFAULT_MASTERY_PARAMS.prior;
  const reasons = [];
  const warnings = [];

  for (const ev of evidence) {
    p = updateBayesianMastery(p, {
      acerto: ev.acerto,
      stepWeight: ev.stepWeight,
      evidenceWeight: ev.evidenceWeight,
    });
  }

  const counts = summarizeEvidence(evidence);
  const latest = getLatestEvidence(evidence);
  const confidence = deriveMasteryConfidence(counts, latest, context);
  const memoryStrength = deriveMemoryStrength(latest, tema);
  const difficulty = deriveDifficulty(latest, tema);

  const level = deriveMasteryLevel({
    pMastery: p,
    confidence,
    counts,
    latest,
    memoryStrength,
  });

  return { ... };
}
```

### 9.1 Regra de nível

```txt
DOMINADO somente se:
- pMastery >= 0.85;
- confidence é medium ou high;
- matureEvidenceCount >= 1;
- highQualityEvidenceCount >= 2;
- spacedEvidenceCount >= 2.
```

```txt
CONSOLIDANDO se:
- pMastery >= 0.65;
- evidenceCount >= 2;
- spacedEvidenceCount >= 1.
```

Caso contrário:

```txt
APRENDENDO.
```

### 9.2 Regras anti-ilusão

Não classificar como dominado quando:

```txt
- só existe D0;
- só existe uma revisão;
- existe 100% em uma única sessão;
- não há D21/manutenção;
- confidence low/none;
- acerto alto, mas evidência sem espaçamento.
```

Adicionar reasons/warnings:

```txt
"d0_only"
"single_evidence"
"no_mature_evidence"
"low_sample"
"high_spaced_accuracy"
"mature_success"
"recent_lapse"
"low_confidence"
```

---

## 10. Como estimar confiança

A confiança da estimativa não é a mesma coisa que maestria.

Exemplo:

```txt
pMastery 0.90 com 1 evidência → alta maestria aparente, baixa confiança.
pMastery 0.72 com 8 evidências → maestria moderada, confiança alta.
```

Implementar:

```js
function deriveMasteryConfidence(counts, latest, context = {}) {
  if (counts.evidenceCount === 0) return "none";
  if (counts.evidenceCount < 3) return "low";
  if (counts.matureEvidenceCount >= 1 && counts.spacedEvidenceCount >= 2) return "high";
  return "medium";
}
```

### 10.1 OperacionalMode como modificador leve

Se P1.3 já tiver `operationalMode` disponível no futuro, aceitar no `context`, mas não depender dele.

Exemplo:

```js
context.operationalMode = {
  mode: "sobrecarga" | "recuperacao" | "normal" | ...
}
```

Regra P2.1:

```txt
operationalMode não altera pMastery.
operationalMode só pode adicionar warning/reason ou reduzir confidence no máximo 1 nível.
```

Motivo:

```txt
Cansaço/sobrecarga altera confiabilidade do desempenho observado, mas não deve apagar conhecimento latente.
```

Implementação opcional:

```txt
Se context.operationalMode.mode === "sobrecarga":
  adicionar warning "operational_overload_may_reduce_reliability".
  se confidence === high, rebaixar para medium.
```

Não fazer mais que isso agora.

---

## 11. Agregação por área e subtópico

### 11.1 Área

Agrupar por:

```js
tema.esp ?? tema.area ?? "Geral"
```

Cálculo:

```txt
pMastery da área = média ponderada dos pMastery dos tópicos com evidência.
coverage = tópicos com evidência / total de tópicos da área.
level = derivado de pMastery + coverage + confidence.
```

Regra anti-falso domínio de área:

```txt
Área não pode ser dominada se coverage < 0.60.
Área não pode ter confidence high se menos de 5 tópicos com evidência.
```

### 11.2 Subtópico

Agrupar por:

```js
tema.subtopico ?? tema.subarea ?? tema.nome ?? tema.id
```

Se não houver subtópico real no dataset, o próprio tema vira subtópico.

Não inventar taxonomia nova.

### 11.3 Weak targets

`getWeakMasteryTargets` deve retornar temas prioritários fracos sem depender de incidência ENAMED ainda.

Ordenar por:

```txt
1. menor pMastery;
2. menor confidence;
3. maior número de lapses/erros recentes;
4. se empate, manter ordem original.
```

Saída:

```js
[
  {
    topicId,
    topicName,
    area,
    subtopic,
    pMastery,
    level,
    confidence,
    reasons,
    suggestedFocus: "revisao_ativa" | "reaprendizagem" | "questoes" | "manter"
  }
]
```

Sugestão de foco:

```txt
pMastery < 0.45 → reaprendizagem
0.45–0.65 → revisão ativa
0.65–0.80 com baixa confiança → questões
>=0.80 → manter
```

---

## 12. Compatibilidade com funções antigas

### 12.1 `getEstadoDominio`

Substituir lógica interna por:

```js
export function getEstadoDominio(tema, stats = []) {
  return estimateTopicMastery(tema, stats).level;
}
```

Mas preservar comportamento esperado:

```txt
sem tema/rev → aprendendo
D7 + acerto médio ok → consolidando
D21 + estabilidade alta + duas revisões boas → dominado
```

A nova lógica pode ser mais conservadora, mas não deve ficar mais permissiva.

### 12.2 `getProntidaoGlobal`

Pode continuar existindo com estrutura semelhante, mas deve usar `estimateAreaMastery` ou `estimateStudentMastery` internamente.

Manter retorno atual:

```js
{
  index,
  acertoMedioGeral,
  pctAreasProntas,
  sugerirModoProva
}
```

Não adicionar campos obrigatórios que quebrem consumidores.

Opcional:

```js
return {
  index,
  acertoMedioGeral,
  pctAreasProntas,
  sugerirModoProva,
  masteryModel // opcional, não exigido por UI
}
```

Mas se houver risco de quebrar snapshots, não adicionar campo novo.

---

## 13. Testes obrigatórios

Criar/atualizar:

```txt
src/core/mastery.test.js
```

### 13.1 Testes de contrato

```js
test("exports publicos existem")
test("estimateTopicMastery nao quebra com tema null")
test("estimateTopicMastery retorna objeto com campos esperados")
test("funcoes nao mutam tema original")
```

### 13.2 Testes de BKT-like

```js
test("updateBayesianMastery aumenta p apos acerto alto")
test("updateBayesianMastery reduz p apos acerto baixo")
test("updateBayesianMastery lida com acerto continuo")
test("updateBayesianMastery faz clamp entre 0 e 1")
test("updateBayesianMastery nao lanca com input invalido")
```

### 13.3 Testes anti-falso domínio

```js
test("tema apenas com D0 100% continua aprendendo")
test("tema com uma unica evidencia alta nao vira dominado")
test("tema sem D21/manutencao nao vira dominado")
test("tema com D21 alto, estabilidade alta e duas revisoes espacadas vira dominado")
test("lapse recente impede dominado")
```

### 13.4 Testes de compatibilidade

```js
test("getEstadoDominio retorna aprendendo sem rev")
test("getEstadoDominio retorna consolidando para D7 adequado")
test("getEstadoDominio retorna dominado para D21 maduro")
test("getProntidaoGlobal preserva shape antigo")
```

### 13.5 Testes de agregação

```js
test("estimateAreaMastery agrupa por esp")
test("area com coverage baixo nao fica dominada")
test("estimateStudentMastery retorna global/byArea/byTopic/weakTargets")
test("getWeakMasteryTargets ordena do mais fraco para o menos fraco")
```

### 13.6 Testes de OperationalMode opcional

```js
test("operationalMode sobrecarga nao altera pMastery")
test("operationalMode sobrecarga adiciona warning de confiabilidade")
```

Se o P1.3 ainda não foi implementado no código real, criar o teste usando objeto literal simples em `context`.

---

## 14. Fixtures recomendadas para testes

### 14.1 Tema sem evidência

```js
const temaVazio = {
  id: "tema-vazio",
  nome: "Tema vazio",
  esp: "Clínica Médica",
  rev: {}
};
```

### 14.2 Tema D0 100%

```js
const temaD0Only = {
  id: "tema-d0",
  nome: "D0 perfeito",
  esp: "Clínica Médica",
  rev: {
    d0: { done: true, acerto: 1.0, S: 1.0, D: 0.4 }
  }
};
```

Esperado:

```txt
level = aprendendo
warning inclui d0_only ou no_mature_evidence
```

### 14.3 Tema consolidando

```js
const temaConsolidando = {
  id: "tema-cons",
  nome: "Tema consolidando",
  esp: "Preventiva",
  rev: {
    d0: { done: true, acerto: 0.90, S: 1.0, D: 0.5 },
    d1: { done: true, acerto: 0.82, S: 2.0, D: 0.48 },
    d4: { done: true, acerto: 0.78, S: 5.0, D: 0.46 },
    d7: { done: true, acerto: 0.80, S: 9.0, D: 0.45 }
  }
};
```

Esperado:

```txt
level = consolidando
pMastery >= 0.65
level != dominado
```

### 14.4 Tema dominado

```js
const temaDominado = {
  id: "tema-dom",
  nome: "Tema dominado",
  esp: "Cirurgia",
  rev: {
    d0: { done: true, acerto: 0.90, S: 1.0, D: 0.5 },
    d1: { done: true, acerto: 0.86, S: 2.2, D: 0.48 },
    d4: { done: true, acerto: 0.84, S: 5.5, D: 0.46 },
    d7: { done: true, acerto: 0.88, S: 10.0, D: 0.44 },
    d21: { done: true, acerto: 0.86, S: 18.0, D: 0.42 }
  }
};
```

Esperado:

```txt
level = dominado
matureEvidenceCount >= 1
highQualityEvidenceCount >= 2
confidence = high ou medium
```

### 14.5 Tema com lapse recente

```js
const temaLapse = {
  id: "tema-lapse",
  nome: "Tema com recaída",
  esp: "Pediatria",
  rev: {
    d0: { done: true, acerto: 0.90, S: 1.0, D: 0.5 },
    d1: { done: true, acerto: 0.88, S: 2.0, D: 0.48 },
    d4: { done: true, acerto: 0.86, S: 5.0, D: 0.46 },
    d7: { done: true, acerto: 0.40, S: 2.0, D: 0.65 }
  }
};
```

Esperado:

```txt
level != dominado
reason inclui recent_lapse
pMastery menor que temaConsolidando
```

---

## 15. Critérios de aceite

O bloco só está pronto se:

```txt
1. mastery.js exporta as novas funções.
2. getEstadoDominio continua funcionando.
3. getProntidaoGlobal continua funcionando.
4. Testes cobrem BKT-like, anti-falso domínio, agregação e compatibilidade.
5. Nenhum arquivo proibido foi alterado.
6. Nenhuma dependência foi instalada.
7. Nenhuma data oficial de revisão muda.
8. Nenhuma UI muda.
9. npm test -- --watchAll=false passa.
10. npm run check:mojibake passa.
11. npm run build passa.
```

---

## 16. Plano de implementação passo a passo

### Passo 1 — Criar constantes

Em `mastery.js`, adicionar:

```js
export const MASTERY_LEVELS = Object.freeze(...);
export const MASTERY_CONFIDENCE = Object.freeze(...);
export const DEFAULT_MASTERY_PARAMS = Object.freeze(...);
const PARAMS_VERSION = "mastery-bkt-lite-v1";
const STEP_ORDER = [...];
const STEP_WEIGHT = {...};
```

### Passo 2 — Utilitários puros

Adicionar helpers internos:

```js
function clamp01(value, fallback = 0) {}
function safeNumber(value, fallback = null) {}
function normalizeStepKey(step) {}
function getTopicArea(tema) {}
function getTopicSubtopic(tema) {}
function getTopicName(tema) {}
function confidenceDowngrade(confidence) {}
```

Não exportar helpers internos a menos que os testes precisem muito.

### Passo 3 — Coletar evidências

Implementar `collectMasteryEvidence(tema, stats)`.

Retorno sugerido:

```js
[
  {
    source: "tema.rev" | "stats",
    step: "d7",
    acerto: 0.82,
    S: 9.0,
    D: 0.46,
    questoes: 20,
    stepWeight: 1.2,
    evidenceWeight: 1.0,
    mature: false,
    spaced: true,
    highQuality: true
  }
]
```

Ordenar evidências pela ordem lógica dos steps.

### Passo 4 — Implementar update bayesiano

Implementar `updateBayesianMastery` conforme seção 8.

### Passo 5 — Estimar tópico

Implementar `estimateTopicMastery`.

### Passo 6 — Compatibilidade

Reescrever `getEstadoDominio` como wrapper.

Revisar `getProntidaoGlobal` para usar o novo motor sem alterar shape.

### Passo 7 — Agregação

Implementar:

```js
estimateAreaMastery
estimateStudentMastery
getWeakMasteryTargets
```

### Passo 8 — Testes

Criar/atualizar `mastery.test.js` com os testes acima.

### Passo 9 — Rodar validação

```bash
npm test -- --watchAll=false src/core/mastery.test.js
npm test -- --watchAll=false
npm run check:mojibake
npm run build
```

---

## 17. Código de referência parcial — não copiar cegamente

Use como orientação, não como obrigação literal.

```js
export function updateBayesianMastery(prior, observation = {}, params = DEFAULT_MASTERY_PARAMS) {
  const p = clamp01(prior, params.prior);
  const a = clamp01(observation.acerto, null);
  if (a == null) return p;

  const guess = clamp01(params.guess, 0.25);
  const slip = clamp01(params.slip, 0.12);
  const learn = clamp01(params.learn, 0.08);

  const denomCorrect = (p * (1 - slip)) + ((1 - p) * guess);
  const denomIncorrect = (p * slip) + ((1 - p) * (1 - guess));
  if (denomCorrect <= 0 || denomIncorrect <= 0) return p;

  const posteriorCorrect = (p * (1 - slip)) / denomCorrect;
  const posteriorIncorrect = (p * slip) / denomIncorrect;
  const posterior = (a * posteriorCorrect) + ((1 - a) * posteriorIncorrect);

  const stepWeight = Math.max(0.1, Number(observation.stepWeight) || 1);
  const evidenceWeight = Math.max(0.1, Number(observation.evidenceWeight) || 1);
  const effectiveLearn = clamp01(learn * stepWeight * evidenceWeight, learn);

  return clamp01(posterior + ((1 - posterior) * effectiveLearn));
}
```

Atenção:

```txt
Se esse código ficar longo demais, priorize clareza e testes.
Não use magia estatística sem teste.
Não use datas complexas agora.
```

---

## 18. O que NÃO fazer neste bloco

Não fazer:

```txt
- “melhorar” o readiness agora;
- “aproveitar” para alterar StatsPanel;
- “aproveitar” para mudar Mentor;
- “aproveitar” para mudar agenda;
- “aproveitar” para criar persistência;
- “aproveitar” para integrar Forecast;
- “aproveitar” para mexer no ENAMED/TRI;
- “aproveitar” para criar Knowledge Graph;
- “aproveitar” para mudar taxonomia de erro;
- “aproveitar” para mudar Raciocínio Clínico.
```

Este bloco é pequeno de propósito.

O ganho real é criar uma fonte confiável para os blocos seguintes.

---

## 19. Por que isso é melhor que o classificador atual

Antes:

```txt
Tema → média de acerto + D7/D21 + S → classe discreta
```

Depois:

```txt
Tema → evidências espaçadas → estimativa latente → confiança → nível → explicação
```

Antes, o sistema só dizia:

```txt
“consolidando”
```

Depois, ele consegue dizer:

```txt
pMastery: 0.72
level: consolidando
confidence: medium
reason: high_spaced_accuracy, no_mature_evidence
suggestedFocus: questões
```

Isso é o começo do “gêmeo digital” do estudante.

---

## 20. Prompt curto para o executor

```txt
Implemente o BLOCO P2.1 — Student Model v1: Maestria Latente por Área/Subtópico.

Objetivo:
Evoluir src/core/mastery.js de classificador discreto por thresholds para um motor puro, BKT-like e determinístico de maestria latente, sem mexer em UI, store, FSRS, readiness, mentor, persistência ou package.json.

Arquivos permitidos:
- src/core/mastery.js
- src/core/mastery.test.js
- opcional: docs/P2_1_STUDENT_MODEL_MASTERY_DECISIONS.md

Arquivos proibidos:
- fsrs.js
- forecast.js
- readiness.js
- mentorDecisionPolicy.js
- mentorSignals.js
- actionInbox.js
- metricsRegistry.js
- store.js
- Dashboard.jsx
- StatsPanel.jsx
- App.js
- package.json
- Firebase/localStorage

Implementar exports novos:
- MASTERY_LEVELS
- MASTERY_CONFIDENCE
- DEFAULT_MASTERY_PARAMS
- updateBayesianMastery
- collectMasteryEvidence
- estimateTopicMastery
- estimateAreaMastery
- estimateStudentMastery
- getWeakMasteryTargets

Preservar exports antigos:
- getEstadoDominio
- getProntidaoGlobal

Regras:
- Não persistir pMastery.
- Não alterar datas oficiais.
- Não instalar libs.
- Não criar UI.
- Não classificar como dominado com D0 only ou uma única evidência.
- Dominado exige pMastery >= 0.85, confiança medium/high, D21/manutenção e pelo menos duas evidências espaçadas boas.
- OperationalMode pode entrar apenas como context opcional, reduzindo confiança/warning, nunca alterando pMastery.

Testes obrigatórios:
- BKT-like aumenta com acerto alto e reduz com acerto baixo.
- D0 100% não vira dominado.
- Uma evidência alta não vira dominado.
- D21 maduro + estabilidade alta + duas revisões boas vira dominado.
- Lapse recente impede dominado.
- Agregação por área funciona.
- getEstadoDominio mantém compatibilidade.
- getProntidaoGlobal mantém shape antigo.
- Funções não mutam input.

Validação final:
- npm test -- --watchAll=false src/core/mastery.test.js
- npm test -- --watchAll=false
- npm run check:mojibake
- npm run build
```

---

## 21. Checklist final do executor

Antes de responder que terminou:

```txt
[ ] Li src/core/mastery.js atual.
[ ] Preservei getEstadoDominio.
[ ] Preservei getProntidaoGlobal.
[ ] Não mexi em arquivos proibidos.
[ ] Não instalei dependências.
[ ] Implementei updateBayesianMastery.
[ ] Implementei collectMasteryEvidence.
[ ] Implementei estimateTopicMastery.
[ ] Implementei estimateAreaMastery.
[ ] Implementei estimateStudentMastery.
[ ] Implementei getWeakMasteryTargets.
[ ] Testei falso domínio D0 only.
[ ] Testei falso domínio por uma única evidência.
[ ] Testei domínio maduro D21.
[ ] Testei lapse recente.
[ ] Testei agregação por área.
[ ] Testei compatibilidade.
[ ] Rodei testes.
[ ] Rodei check:mojibake.
[ ] Rodei build.
```

---

## 22. Próximo bloco natural

Depois de P2.1, NÃO ir direto para dashboard.

Próximo bloco recomendado:

```txt
P2.2 — Forecast usa Student Model + simulados + data da prova para prever prontidão com banda de confiança.
```

Só depois:

```txt
P2.3 — Scheduler de interleaving real com base em fraqueza latente + vencimento FSRS + modo operacional.
```

Motivo:

```txt
Primeiro medir o aluno.
Depois prever trajetória.
Depois alterar o plano.
```

Essa ordem reduz risco de criar um mentor “inteligente” que decide com base em métrica instável.

---

## 23. Bibliografia científica usada para a decisão

Use estas referências para entender o desenho, não para ornamentar:

1. Corbett & Anderson, 1995 — Knowledge tracing: Modeling the acquisition of procedural knowledge. Base clássica do BKT.
2. Yudelson, Koedinger & Gordon, 2013 — Individualized Bayesian Knowledge Tracing Models. Mostra valor de individualização, mas isso fica para fase posterior.
3. Badrinath, Wang & Pardos, 2021 — pyBKT. Mostra BKT como modelo prático de estimativa de maestria, mas P2.1 não deve instalar biblioteca.
4. Dunlosky et al., 2013 — Improving Students’ Learning With Effective Learning Techniques. Fundamenta o peso maior de retrieval practice e distributed practice.
5. McGaghie et al., 2011/2014 — Mastery learning e deliberate practice em educação médica. Fundamenta padrões explícitos de domínio e amostra mínima antes de declarar competência.

---

## 24. Decisão final

Implementar o P2.1 como:

```txt
Student Model v1 puro, BKT-like, determinístico, compatível e sem persistência.
```

Não implementar como:

```txt
novo dashboard,
novo mentor,
novo scheduler,
novo banco de dados,
novo algoritmo treinado,
novo readiness.
```

A função do bloco é criar a camada que os próximos motores vão consumir.

