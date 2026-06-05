# MEDREV — BLOCO P1.1 — FSRS CANÔNICO EM MODO SOMBRA

**Arquivo para implementação por modelo menor:** Gemini 3.5 Flash / Claude Sonnet / Codex executor  
**Prioridade:** P1.1  
**Status:** Implementável depois do P0 de unificação decisória  
**Regra de segurança:** este bloco **não muda nenhuma data oficial de revisão**.

---

## 0. Objetivo em uma frase

Rodar o **FSRS canônico (`ts-fsrs`) em paralelo** ao FSRS-Lite atual do MedRev, registrando previsões e divergências no `reviewHistory`, sem substituir o scheduler oficial, sem ativar otimizador e sem mexer nos checkpoints pedagógicos D0/D1/D4/D7/D21.

---

## 1. Contexto do produto

O MedRev não agenda flashcards atomizados. Ele agenda **blocos de conteúdo médico**, com passos pedagógicos:

- `d0` — estudo + questões;
- `d1` — brain dump;
- `d4` — questões;
- `d7` — questões + Anki;
- `d21` — interleaving;
- `manutencao` — revisões posteriores.

Por isso, o FSRS canônico **não deve assumir imediatamente o controle do calendário**. Ele foi desenhado para modelar memória item-a-item. No MedRev, um “tema” pode conter múltiplas habilidades, subtemas, erros clínicos e lacunas conceituais.

A decisão correta para P1.1 é:

> **usar o FSRS canônico como observador científico, não como autoridade operacional.**

---

## 2. O que este bloco implementa

### Implementa

1. Instalação do pacote `ts-fsrs`.
2. Adapter puro para converter um tema/revisão do MedRev em um “card” compatível com `ts-fsrs`.
3. Função pura para calcular previsão canônica em sombra.
4. Registro da previsão shadow dentro de cada evento do `reviewHistory`.
5. Relatório puro de divergências FSRS-Lite vs FSRS canônico.
6. Testes unitários focados em segurança.
7. Feature flag para ligar/desligar sombra sem quebrar produção.

### Não implementa

1. Não troca `recalcAfterMark` como fonte oficial.
2. Não altera `date`/`scheduledAt` oficiais.
3. Não remove FSRS-Lite.
4. Não ativa optimizer.
5. Não treina parâmetros por usuário.
6. Não reescreve o fluxo D0/D1/D4/D7/D21.
7. Não mexe no mentor/ActionInbox além de eventualmente consumir relatório depois.

---

## 3. Evidência e justificativa científica

### 3.1 Por que usar FSRS canônico?

O FSRS moderno modela três estados de memória:

- **Difficulty (D):** quão difícil é o item para o aluno;
- **Stability (S):** quanto tempo a memória tende a durar;
- **Retrievability (R):** probabilidade estimada de lembrar hoje.

O FSRS é superior ao SM-2 clássico porque usa histórico de revisão e pode ter parâmetros ajustados ao padrão real do usuário. Isso é alinhado ao objetivo do MedRev de virar mentor individualizado.

### 3.2 Por que modo sombra primeiro?

Porque o MedRev trabalha com **blocos multi-habilidade**, não cartões isolados. A literatura de learning analytics e modelos de agendamento adaptativo mostra que quando o item envolve múltiplas habilidades, o modelo precisa considerar relações item-skill e esquecimento por habilidade. Um tema como “Sepse”, “Pré-natal” ou “Dor torácica” não é uma única unidade de memória.

Então o risco de trocar direto o scheduler é alto:

- pode alongar demais temas complexos;
- pode encurtar demais temas fáceis porém extensos;
- pode tratar um bloco inteiro como se fosse um único card;
- pode quebrar o método pedagógico que já existe.

### 3.3 Decisão P1.1

Rodar em sombra permite medir:

- onde o FSRS-Lite está mais conservador;
- onde o FSRS canônico sugeriria intervalos maiores;
- onde o FSRS canônico sugeriria regressão;
- quais áreas/steps divergem mais;
- se “tema como card” é um adapter aceitável.

Só depois disso faz sentido discutir P1.2/P2:

- optimizer;
- parâmetros por usuário;
- split de tema em subtópicos;
- skill tagging;
- scheduler híbrido.

---

## 4. Fontes de verdade atuais no código

Antes de implementar, leia estes arquivos:

```txt
src/core/fsrs.js
src/core/fsrs.test.js
src/core/reviewOutcome.js
src/core/reviewTaskPlanner.js
src/core/domainValidation.js
src/core/store.js
src/components/FocusMode.jsx
src/components/RetrievabilitySpark.jsx
package.json
```

Pontos importantes já existentes:

- `src/core/fsrs.js` possui `recalcAfterMark`, `appendReviewHistory`, `toRating`, `updateStability`, `updateDifficulty`, `maintenanceInterval`, `fsrsRawInterval`.
- `reviewHistory` já existe e é limitado a 100 eventos.
- `recalcAfterMark` é a função oficial que altera o estado de revisão.
- `toRating(acerto)` mapeia porcentagem para `again/hard/good/easy`.
- `doneKey`, `scheduledAt`, `reviewedAt`, `intervalAfter`, `S_before`, `S_after`, `D_before`, `D_after` já aparecem no evento oficial.

---

## 5. Instalação

### Comando

```bash
npm install ts-fsrs
```

### Observação importante

A documentação atual do `ts-fsrs` informa que o pacote requer Node.js `>=20.0.0`. Verifique o `.nvmrc` do projeto antes de instalar.

Se o projeto estiver em Node 18, não force gambiarra. Pare e registre:

```txt
P1.1 bloqueado: ts-fsrs atual requer Node >=20. Atualizar runtime antes.
```

---

## 6. Feature flag

Criar ou ajustar:

```txt
src/core/devFlags.js
```

Adicionar:

```js
export const FSRS_CANONICAL_SHADOW_ENABLED = true;
```

Se o arquivo já tiver padrão próprio de flags, seguir o padrão existente. Não criar segundo sistema de flags.

---

## 7. Novo arquivo: adapter shadow

Criar:

```txt
src/core/fsrsCanonicalShadow.js
```

### Responsabilidade

Este arquivo deve ser **puro**:

- recebe `tema`, `rev`, `doneKey`, `acerto` e metadados;
- converte rating MedRev → rating `ts-fsrs`;
- cria/reconstrói um card shadow;
- calcula previsão do FSRS canônico;
- retorna um objeto serializável;
- não altera o tema;
- não chama Zustand;
- não acessa localStorage;
- não chama Firebase;
- não altera datas oficiais.

---

## 8. Contrato do evento shadow

Cada evento oficial do `reviewHistory` deve poder receber um campo:

```js
fsrsCanonicalShadow: {
  enabled: true,
  adapterVersion: "topic-as-card-v1",
  package: "ts-fsrs",
  input: {
    temaId: "...",
    stepKey: "d4",
    acerto: 0.82,
    ratingLite: "good",
    reviewedAt: "2026-06-04",
    scheduledAt: "2026-06-01",
    atrasoDias: 3,
    phaseBefore: "learning"
  },
  output: {
    ratingCanonical: "Good",
    elapsedDays: 3,
    due: "2026-06-09",
    scheduledDays: 5,
    stability: 5.42,
    difficulty: 6.31,
    retrievability: 0.87,
    state: "Review"
  },
  comparison: {
    liteIntervalAfter: 4,
    canonicalIntervalAfter: 5,
    diffDays: 1,
    absDiffDays: 1,
    direction: "canonical_later",
    severity: "low"
  },
  warnings: []
}
```

### Regra

Se o shadow falhar, o evento oficial continua sendo salvo normalmente:

```js
fsrsCanonicalShadow: {
  enabled: true,
  failed: true,
  error: "mensagem curta",
  adapterVersion: "topic-as-card-v1"
}
```

Nunca quebrar revisão oficial por falha do shadow.

---

## 9. Mapeamento de rating

No MedRev:

```js
again = acerto < 0.55
hard  = acerto >= 0.55 && acerto < 0.75
good  = acerto >= 0.75 && acerto < 0.90
easy  = acerto >= 0.90
```

No `ts-fsrs`, usar `Rating`.

Mapeamento:

```js
again -> Rating.Again
hard  -> Rating.Hard
good  -> Rating.Good
easy  -> Rating.Easy
```

Preservar a regra de lapso maduro do FSRS-Lite:

- se `doneKey` for `d21` ou `manutencao`;
- e `acerto < 0.60`;
- o Lite força `effectiveRating = again`.

Para comparação honesta, o shadow deve registrar:

```js
ratingLite
ratingCanonicalInput
matureLapseAppliedByLite
```

Decisão P1.1:

- por padrão, o shadow usa o **mesmo `effectiveRating` do Lite** para comparar scheduler, não classificação;
- opcionalmente guardar `rawRatingFromAcerto` para auditoria.

---

## 10. Reconstrução do card shadow

### Problema

`ts-fsrs` espera um card com estado interno. O MedRev não armazena card FSRS canônico ainda.

### Solução P1.1

Criar adapter `topic-as-card-v1`:

1. Se o tema já tiver `rev.meta.fsrsCanonicalCard`, usar esse card como base.
2. Se não tiver, criar card vazio com `createEmptyCard()`.
3. Aplicar `scheduler.next(card, reviewedDate, rating)` somente para o evento atual.
4. Retornar o card atualizado como sugestão shadow.
5. **Não persistir o card em `rev.meta` neste bloco**, salvo se isso for necessário para comparação consistente. Preferência P1.1: persistir apenas no evento `reviewHistory`.

### Por que não persistir card global agora?

Porque persistir card shadow em `rev.meta` já começa a criar um segundo scheduler com estado próprio. P1.1 deve ser observacional.

### Alternativa permitida

Se o `ts-fsrs` exigir continuidade para previsões úteis, persistir em:

```js
rev.meta.fsrsCanonicalShadowCard
```

Mas com estas regras:

- não usado para datas oficiais;
- não usado por UI principal;
- não usado pelo mentor;
- marcado com `shadowOnly: true`;
- coberto por teste garantindo que `date` oficial não muda.

---

## 11. Cálculo de divergência

Criar função pura:

```js
export function compareLiteVsCanonical({ liteIntervalAfter, canonicalIntervalAfter })
```

Retorno:

```js
{
  liteIntervalAfter: 4,
  canonicalIntervalAfter: 6,
  diffDays: 2,
  absDiffDays: 2,
  direction: "canonical_later",
  severity: "low"
}
```

### Severidade

```txt
absDiffDays 0–1    -> low
absDiffDays 2–6    -> moderate
absDiffDays >= 7   -> high
```

### Direção

```txt
canonical_later   -> FSRS canônico mandaria revisar depois
canonical_earlier -> FSRS canônico mandaria revisar antes
same              -> sem diferença relevante
unknown           -> não foi possível comparar
```

---

## 12. Integração com `recalcAfterMark`

Arquivo:

```txt
src/core/fsrs.js
```

### Onde integrar

No final dos ramos de `recalcAfterMark`, onde hoje já existe:

```js
nextRev.reviewHistory = appendReviewHistory(nextRev, {
  ...historyBase,
  phaseAfter,
  intervalAfter: interval,
}, 100);
```

### Como integrar sem quebrar

Criar helper puro:

```js
function withCanonicalShadow(historyEvent, context) {
  if (!FSRS_CANONICAL_SHADOW_ENABLED) return historyEvent;
  try {
    return {
      ...historyEvent,
      fsrsCanonicalShadow: buildFsrsCanonicalShadow(context),
    };
  } catch (error) {
    return {
      ...historyEvent,
      fsrsCanonicalShadow: {
        enabled: true,
        failed: true,
        adapterVersion: "topic-as-card-v1",
        error: String(error?.message || error).slice(0, 160),
      },
    };
  }
}
```

### Atenção

Não fazer import circular. Se `fsrsCanonicalShadow.js` importar de `fsrs.js` e `fsrs.js` importar dele, quebra.

Para evitar isso:

- mover helpers genéricos pequenos para `src/core/fsrsShared.js`; ou
- duplicar mapeamentos mínimos no shadow; ou
- passar tudo que o shadow precisa por parâmetro.

Recomendação P1.1:

> evitar refactor grande. Passar `rating/effectiveRating/acerto/scheduledAt/reviewedAt/intervalAfter` por parâmetro e manter `fsrsCanonicalShadow.js` quase independente.

---

## 13. Forma segura de montar o shadow

Pseudoestrutura:

```js
// src/core/fsrsCanonicalShadow.js
import { createEmptyCard, fsrs, Rating } from "ts-fsrs";

export const FSRS_CANONICAL_ADAPTER_VERSION = "topic-as-card-v1";

export function mapLiteRatingToCanonical(rating) {
  if (rating === "again") return Rating.Again;
  if (rating === "hard") return Rating.Hard;
  if (rating === "good") return Rating.Good;
  if (rating === "easy") return Rating.Easy;
  return null;
}

export function compareLiteVsCanonical({ liteIntervalAfter, canonicalIntervalAfter }) {
  const lite = Number(liteIntervalAfter);
  const canonical = Number(canonicalIntervalAfter);
  if (!Number.isFinite(lite) || !Number.isFinite(canonical)) {
    return {
      liteIntervalAfter: Number.isFinite(lite) ? lite : null,
      canonicalIntervalAfter: Number.isFinite(canonical) ? canonical : null,
      diffDays: null,
      absDiffDays: null,
      direction: "unknown",
      severity: "unknown",
    };
  }

  const diff = canonical - lite;
  const abs = Math.abs(diff);
  return {
    liteIntervalAfter: lite,
    canonicalIntervalAfter: canonical,
    diffDays: diff,
    absDiffDays: abs,
    direction: diff > 0 ? "canonical_later" : diff < 0 ? "canonical_earlier" : "same",
    severity: abs <= 1 ? "low" : abs <= 6 ? "moderate" : "high",
  };
}

export function buildFsrsCanonicalShadow({
  tema,
  stepKey,
  acerto,
  ratingLite,
  effectiveRating,
  scheduledAt,
  reviewedAt,
  atrasoDias,
  phaseBefore,
  liteIntervalAfter,
}) {
  const canonicalRating = mapLiteRatingToCanonical(effectiveRating || ratingLite);
  if (!canonicalRating) {
    return {
      enabled: true,
      adapterVersion: FSRS_CANONICAL_ADAPTER_VERSION,
      failed: true,
      error: "missing_canonical_rating",
    };
  }

  const scheduler = fsrs();
  const card = createEmptyCard(new Date(scheduledAt || reviewedAt));
  const result = scheduler.next(card, new Date(reviewedAt), canonicalRating);
  const nextCard = result.card;

  const canonicalDue = nextCard.due ? new Date(nextCard.due) : null;
  const reviewDate = new Date(reviewedAt);
  const canonicalIntervalAfter = canonicalDue
    ? Math.max(0, Math.round((canonicalDue - reviewDate) / 86400000))
    : null;

  return {
    enabled: true,
    adapterVersion: FSRS_CANONICAL_ADAPTER_VERSION,
    package: "ts-fsrs",
    input: {
      temaId: tema?.id ?? null,
      stepKey,
      acerto,
      ratingLite,
      effectiveRating,
      reviewedAt,
      scheduledAt,
      atrasoDias,
      phaseBefore,
    },
    output: {
      ratingCanonical: String(canonicalRating),
      due: canonicalDue ? canonicalDue.toISOString().slice(0, 10) : null,
      scheduledDays: canonicalIntervalAfter,
      stability: serializeNumber(nextCard.stability),
      difficulty: serializeNumber(nextCard.difficulty),
      retrievability: serializeNumber(nextCard.retrievability),
      state: String(nextCard.state ?? ""),
    },
    comparison: compareLiteVsCanonical({
      liteIntervalAfter,
      canonicalIntervalAfter,
    }),
    warnings: ["topic_as_card_adapter_not_authoritative"],
  };
}

function serializeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
}
```

Ajuste nomes conforme API real do `ts-fsrs` instalada. Não invente se a API diferir: confira `node_modules/ts-fsrs` ou a documentação local após instalação.

---

## 14. Novo relatório de divergências

Criar:

```txt
src/core/fsrsShadowReport.js
```

### Função principal

```js
export function buildFsrsShadowReport(temas = [])
```

### Entrada

Lista de temas do estado.

### Saída

```js
{
  totalEvents: 0,
  shadowEvents: 0,
  failedEvents: 0,
  highDivergenceEvents: 0,
  moderateDivergenceEvents: 0,
  averageAbsDiffDays: 0,
  byStep: {
    d1: { count: 0, averageAbsDiffDays: 0, high: 0 },
    d4: { count: 0, averageAbsDiffDays: 0, high: 0 },
    d7: { count: 0, averageAbsDiffDays: 0, high: 0 },
    d21: { count: 0, averageAbsDiffDays: 0, high: 0 },
    manutencao: { count: 0, averageAbsDiffDays: 0, high: 0 }
  },
  byDirection: {
    canonical_later: 0,
    canonical_earlier: 0,
    same: 0,
    unknown: 0
  },
  topDivergences: []
}
```

### Top divergences

No máximo 20 eventos:

```js
{
  temaId,
  temaNome,
  stepKey,
  reviewedAt,
  liteIntervalAfter,
  canonicalIntervalAfter,
  diffDays,
  absDiffDays,
  direction,
  severity
}
```

### Regras

- Função pura.
- Não renderiza UI.
- Não altera estado.
- Ignora eventos sem `fsrsCanonicalShadow`.
- Conta falhas separadamente.

---

## 15. UI mínima permitida

P1.1 não precisa de UI. Se quiser expor algo, fazer apenas painel técnico escondido em dev/debug.

Permitido:

- card pequeno em `StatsPanel` ou painel de auditoria;
- texto “FSRS canônico em sombra: X eventos comparados”.

Proibido:

- mostrar ao aluno duas datas concorrentes;
- dizer “a data correta seria...”;
- mudar copy do mentor para usar shadow;
- sugerir que o FSRS canônico já é melhor para blocos do MedRev.

---

## 16. Testes obrigatórios

Criar:

```txt
src/core/fsrsCanonicalShadow.test.js
src/core/fsrsShadowReport.test.js
```

Adicionar testes em:

```txt
src/core/fsrs.test.js
```

### Teste 1 — mapeamento de rating

```txt
again -> Rating.Again
hard -> Rating.Hard
good -> Rating.Good
easy -> Rating.Easy
rating inválido -> null
```

### Teste 2 — comparação de divergência

```txt
lite 4, canonical 5 -> diff +1, low, canonical_later
lite 7, canonical 3 -> diff -4, moderate, canonical_earlier
lite 21, canonical 40 -> diff +19, high, canonical_later
lite null -> unknown
```

### Teste 3 — shadow não altera datas oficiais

Dado um `rev` com `d4.date`, marcar `d1`. Após `recalcAfterMark`:

- a data oficial calculada pelo Lite continua igual ao esperado antigo;
- existe `reviewHistory[n].fsrsCanonicalShadow`;
- nenhum `rev.dX.date` vem do shadow.

### Teste 4 — falha do shadow não quebra revisão

Mockar `buildFsrsCanonicalShadow` para lançar erro. Esperado:

- `recalcAfterMark` retorna `nextRev` válido;
- `reviewHistory` tem evento oficial;
- `fsrsCanonicalShadow.failed === true`.

### Teste 5 — relatório agrega corretamente

Dado temas com eventos shadow:

- conta total;
- conta falhas;
- calcula média;
- separa por step;
- lista top divergences ordenado por `absDiffDays` desc.

---

## 17. Critérios de aceite

O bloco só está concluído se todos forem verdadeiros:

```txt
[ ] npm install ts-fsrs realizado sem quebrar build.
[ ] Node >=20 confirmado ou bloqueio registrado.
[ ] src/core/fsrsCanonicalShadow.js criado.
[ ] src/core/fsrsShadowReport.js criado.
[ ] recalcAfterMark registra shadow dentro do evento reviewHistory.
[ ] Nenhuma data oficial passa a depender do ts-fsrs.
[ ] Nenhuma UI principal mostra data shadow como recomendação ao aluno.
[ ] Testes novos passam.
[ ] Testes antigos de fsrs.js continuam passando.
[ ] npm run build passa.
[ ] npm test -- --watchAll=false passa ou, se o projeto exigir modo interativo, registrar comando equivalente usado.
```

---

## 18. Comandos de validação

```bash
npm install
npm install ts-fsrs
npm test -- --watchAll=false src/core/fsrsCanonicalShadow.test.js
npm test -- --watchAll=false src/core/fsrsShadowReport.test.js
npm test -- --watchAll=false src/core/fsrs.test.js
npm run build
```

Se o ambiente CRA não aceitar filtro por arquivo, usar:

```bash
npm test -- --watchAll=false
npm run build
```

---

## 19. Onde o modelo menor costuma errar

### Erro 1 — trocar scheduler oficial

Não fazer:

```js
nextDate = fsrsCanonicalDue;
```

O correto:

```js
nextDate = liteDate;
historyEvent.fsrsCanonicalShadow = shadow;
```

### Erro 2 — criar novo estado global

Não criar:

```js
canonicalReviewsStore
fsrsCanonicalStore
shadowSchedulerState
```

P1.1 deve usar `reviewHistory`.

### Erro 3 — colocar optimizer

Não instalar agora:

```bash
npm install @open-spaced-repetition/binding
```

O binding/optimizer fica para P1.2/P2, depois de confirmar que os logs shadow fazem sentido.

### Erro 4 — tratar tema como flashcard real sem aviso

Todo evento shadow deve carregar:

```js
warnings: ["topic_as_card_adapter_not_authoritative"]
```

### Erro 5 — expor a data shadow ao aluno

P1.1 é auditoria interna. O aluno não deve ver duas datas.

---

## 20. Saída esperada ao final

Depois de algumas revisões reais, o MedRev deve conseguir responder:

1. Em quais steps o FSRS-Lite diverge mais do FSRS canônico?
2. O FSRS canônico tende a sugerir revisões mais cedo ou mais tarde?
3. D1/D4/D7 devem continuar em bandas fixas ou podem ser relaxados?
4. A manutenção atual está conservadora demais?
5. O adapter “tema como card” é aceitável ou precisa de subtópicos?
6. Vale ativar optimizer por usuário depois?

---

## 21. Decisão para P1.2

Só avance para P1.2 se houver pelo menos:

```txt
>= 100 eventos shadow reais
>= 20 eventos de manutenção/d21
>= 3 áreas médicas com dados
falhas shadow < 5%
nenhuma quebra de build/teste
```

Se as divergências forem altas demais em D1/D4/D7, não significa que o Lite está errado. Pode significar que “tema como card” é adapter fraco para blocos grandes.

---

## 22. Resumo operacional para colar no executor

```txt
Implemente o BLOCO P1.1 FSRS canônico em modo sombra.

Regras absolutas:
1. Não trocar o scheduler oficial.
2. Não alterar datas oficiais.
3. Não ativar optimizer.
4. Não expor data shadow ao aluno.
5. Registrar previsão e divergência apenas no reviewHistory.
6. Criar funções puras e testes.

Arquivos principais:
- package.json
- src/core/devFlags.js
- src/core/fsrsCanonicalShadow.js
- src/core/fsrsShadowReport.js
- src/core/fsrs.js
- src/core/fsrs.test.js
- src/core/fsrsCanonicalShadow.test.js
- src/core/fsrsShadowReport.test.js

Validação:
- npm install ts-fsrs
- npm test -- --watchAll=false
- npm run build
```

---

## 23. Referências técnicas e científicas usadas

1. Open Spaced Repetition — `ts-fsrs` documentation: https://open-spaced-repetition.github.io/ts-fsrs/
2. Open Spaced Repetition — `ts-fsrs` GitHub: https://github.com/open-spaced-repetition/ts-fsrs
3. Anki Manual — FSRS deck options and parameter optimization: https://docs.ankiweb.net/deck-options.html
4. Open Spaced Repetition — FSRS algorithm repository: https://github.com/open-spaced-repetition/free-spaced-repetition-scheduler
5. Dunlosky et al. Improving Students’ Learning With Effective Learning Techniques. Psychological Science in the Public Interest, 2013.
6. Choffin et al. DAS3H: Modeling Student Learning and Forgetting for Optimally Scheduling Distributed Practice of Skills, 2019.
7. Reddy et al. Unbounded Human Learning: Optimal Scheduling for Spaced Repetition, 2016.

---

## 24. Frase de segurança final

> O objetivo do P1.1 não é provar que o FSRS canônico é melhor que o FSRS-Lite no MedRev. O objetivo é criar telemetria confiável para descobrir, com dados reais, onde o scheduler atual deve ou não evoluir.
