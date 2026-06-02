# MEDREV — HOTFIX P1: “Já domino” agenda D7/D14 de verdade e corrige fila/progresso

> **Prioridade:** P0/P1 de UX e confiança  
> **Executor recomendado:** GPT-5.5 / High ou Sonnet High  
> **Objetivo:** corrigir o fluxo de “Já domino” para que ele altere o estado real do tema, mostre a revisão correta na UI e entre corretamente na fila como D7 ou D14, nunca como D1.

---

## 0. Diagnóstico do bug observado

Após registrar “Já domino”, o card muda para:

```txt
STATUS: VALIDADO PREVIAMENTE
Próxima revisão: D14 em 2026-06-16
```

Mas a parte inferior e a fila ainda mostram:

```txt
RO: D1
```

Além disso, vários temas validados ficam com o mesmo cálculo visual/progresso, como se o fluxo estivesse usando um valor default.

Isso indica que o app está fazendo uma destas coisas:

```txt
1. Usa internamente `rev.d1` para armazenar a primeira revisão pós-validação.
2. A UI lê `stepKey === "d1"` e renderiza “D1”, ignorando `dominioPrevio.primeiraRevisao`.
3. A fila inteligente usa o step real (`d1`) em vez do label semântico (`D7` ou `D14`).
4. O progresso/acerto do card usa fallback fixo, provavelmente 50%, em vez do acerto validado.
5. O tema sai visualmente de “não iniciado”, mas a semântica da revisão continua errada.
```

Esse bug quebra confiança: o usuário vê “D14” no status e “D1” na fila/card.

---

## 1. Regra de produto

“Já domino” é **validação de domínio prévio**, não revisão D1.

Depois de validar:

```txt
15+ questões e 80–89% → primeira revisão deve aparecer como D7.
15+ questões e >=90% → primeira revisão deve aparecer como D14.
<15 questões ou <80% → não valida; iniciar D0 normal.
```

O app nunca deve mostrar “RO: D1” para um tema validado previamente cuja primeira revisão é D7 ou D14.

---

## 2. Regra técnica obrigatória

Separar:

```txt
stepKey interno
label semântico exibido ao usuário
data real da próxima revisão
```

Criar helpers canônicos para evitar cada componente calcular de um jeito.

---

## 3. Criar/ajustar helper canônico

Criar ou ajustar em:

```txt
src/core/domainValidation.js
```

ou arquivo equivalente:

```js
export function getDominioPrevioStatus(tema) {}

export function getNextReviewForTema(tema, today = todayStr()) {}

export function getReviewDisplayLabel(tema, stepKey) {}

export function getReviewDisplayMeta(tema, stepKey) {}
```

### 3.1 `getDominioPrevioStatus(tema)`

Retorna:

```js
{
  isValidated: true,
  acerto: 0.92,
  questoes: 15,
  validatedAt: "YYYY-MM-DD",
  firstReviewLabel: "D14",
  firstReviewDate: "YYYY-MM-DD",
}
```

ou:

```js
{ isValidated: false }
```

### 3.2 `getNextReviewForTema(tema)`

Deve retornar a próxima revisão com semântica correta:

```js
{
  stepKey: "d14", // se existir
  label: "D14",
  date: "YYYY-MM-DD",
  source: "dominio_previo",
}
```

ou:

```js
{
  stepKey: "d7",
  label: "D7",
  date: "YYYY-MM-DD",
  source: "dominio_previo",
}
```

Não retornar `label: "D1"` para tema validado.

### 3.3 `getReviewDisplayLabel(tema, stepKey)`

Se tema tem `dominioPrevio.validado === true`, e aquele step é a primeira revisão de domínio prévio, retornar:

```txt
D7
```

ou:

```txt
D14
```

Mesmo que a arquitetura antiga ainda use outro `stepKey` internamente temporariamente.

---

## 4. Implementação recomendada — opção robusta

Evitar usar `d1` como contêiner de D7/D14.

### 4.1 Para 80–89%

Ao validar:

```txt
d0 = validação prévia concluída
d1 = skipped por domínio prévio
d4 = skipped por domínio prévio
d7 = primeira revisão real, date = hoje + 7
d21 = futuro, recalculado depois do d7
```

Estado esperado:

```js
tema.dominioPrevio = {
  validado: true,
  questoes,
  acerto,
  validatedAt,
  primeiraRevisao: "d7",
  primeiraRevisaoLabel: "D7",
  primeiraRevisaoDate,
  source: "ja_domino",
};

tema.rev.d0 = {
  done: true,
  source: "dominio_previo",
  reviewedAt: today,
  acerto,
  questoes,
};

tema.rev.d1 = {
  ...tema.rev.d1,
  done: true,
  skipped: true,
  skipReason: "dominio_previo",
};

tema.rev.d4 = {
  ...tema.rev.d4,
  done: true,
  skipped: true,
  skipReason: "dominio_previo",
};

tema.rev.d7 = {
  ...tema.rev.d7,
  done: false,
  date: addDays(today, 7),
  scheduledAt: addDays(today, 7),
  source: "dominio_previo",
};
```

### 4.2 Para >=90%

Preferência: criar suporte opcional a `d14`.

```js
tema.rev.d14 = {
  done: false,
  date: addDays(today, 14),
  scheduledAt: addDays(today, 14),
  source: "dominio_previo",
  S: 14,
  D: tema.rev?.d0?.D ?? defaultD,
};
```

E marcar D1/D4/D7 como pulados:

```js
d1.skipped = true
d4.skipped = true
d7.skipped = true
```

O próximo item deve ser:

```txt
D14
```

Nunca D1.

Se adicionar `d14` for muito invasivo, é aceitável usar internamente outro step por compatibilidade, mas a fila e a UI devem usar `getNextReviewForTema` e mostrar label D14. O ideal, porém, é suportar `d14` explicitamente.

---

## 5. Corrigir todos os consumidores

Auditar com:

```bash
git grep -n "RO:\|D1\|d1\|nextReview\|proximaRevisao\|próxima revisão\|dominioPrevio\|validado_previo" -- src
```

Corrigir:

```txt
src/components/Cronograma.jsx
src/components/Dashboard.jsx
src/components/FocusMode.jsx
src/core/fsrs.js
src/core/store.js
src/core/useMetrics.js
src/core/mentorSignals.js
src/core/mentorDecisionPolicy.js
src/core/domainValidation.js
```

Qualquer lugar que mostre:

```txt
RO: D1
```

deve passar pelo helper:

```js
getReviewDisplayMeta(tema, stepKey)
```

---

## 6. Corrigir cálculo visual/progresso

O card validado previamente não pode usar fallback fixo.

Para tema validado:

```txt
Mostrar acerto da validação: 85%, 92%, etc.
Mostrar status: Validado previamente.
Mostrar próxima revisão real: D7/D14.
Não mostrar vermelho fixo 50% se não corresponde ao acerto real.
```

Regra:

```js
if (tema.dominioPrevio?.validado) {
  displayAccuracy = tema.dominioPrevio.acerto;
  displayStatus = "Validado previamente";
  nextReview = getNextReviewForTema(tema);
}
```

Se o sparkline não tiver dados reais suficientes:

```txt
mostrar “Aguardando primeira revisão”
```

em vez de gráfico vermelho genérico.

---

## 7. Corrigir fila inteligente

A fila deve usar o helper canônico.

Se `getNextReviewForTema(tema)` retornar D14, a fila deve mostrar:

```txt
RO: D14
```

Se retornar D7:

```txt
RO: D7
```

Não usar `Object.keys(rev).find(...)` sem filtrar skips e sem display label.

Ignorar etapas:

```js
step.skipped === true
```

na fila de revisão.

---

## 8. Corrigir Mentor

Mentor não deve recomendar:

```txt
Fazer D1
```

para tema validado previamente se a próxima revisão é D7/D14.

`mentorSignals` deve usar:

```js
getNextReviewForTema(tema)
```

para montar target e label.

---

## 9. Copy PT-BR

Corrigir textos visíveis:

```txt
STATUS: VALIDADO PREVIAMENTE → Status: validado previamente
Próxima revisão: D14 em 2026-06-16 → Próxima revisão: D14 em 16/06
Use “Revisar” quando vencer ou abra no plano para ajustar. → Quando vencer, use “Revisar” ou ajuste no Plano.
```

Preferir:

```txt
Validado previamente
Próxima revisão: D14 · 16/06
Aguardando primeira revisão
```

Evitar caixa alta gritada.

---

## 10. Testes obrigatórios

Criar/ajustar:

```txt
src/core/domainValidation.test.js
src/core/fsrs.test.js
src/core/mentorSignals.test.js
```

### 10.1 Domínio prévio

```js
test("80 to 89 percent schedules D7 and never D1")
test("90 percent or more schedules D14 and never D1")
test("validated topic skips d1 and d4")
test("validated high-confidence topic skips d1, d4 and d7 when d14 exists")
test("getNextReviewForTema returns D7 for 85 percent")
test("getNextReviewForTema returns D14 for 92 percent")
test("getReviewDisplayLabel never returns D1 for validated previous domain")
```

### 10.2 UI/metrics core

```js
test("validated topic display accuracy uses dominioPrevio.acerto")
test("validated topic without review history shows awaiting first review")
test("skipped steps are ignored by queue")
```

### 10.3 Mentor

```js
test("mentor signal labels validated previous domain as D7 or D14")
test("mentor does not recommend D1 for validated previous domain")
```

---

## 11. QA manual obrigatório

### Caso 1 — 15 questões, 85%

```txt
1. Criar tema novo.
2. Clicar Já domino.
3. Registrar 15 questões e 85%.
4. Card deve mostrar:
   Validado previamente
   Próxima revisão: D7
5. Rodapé/card/fila NÃO pode mostrar RO: D1.
6. Fila deve mostrar D7 quando vencer.
```

### Caso 2 — 15 questões, 92%

```txt
1. Criar tema novo.
2. Clicar Já domino.
3. Registrar 15 questões e 92%.
4. Card deve mostrar:
   Validado previamente
   Próxima revisão: D14
5. Rodapé/card/fila NÃO pode mostrar RO: D1.
6. Fila deve mostrar D14 quando vencer.
```

### Caso 3 — 10 questões, 95%

```txt
Não valida.
Tema continua com Iniciar ciclo hoje.
```

### Caso 4 — 15 questões, 70%

```txt
Não valida.
Tema continua com Iniciar ciclo hoje.
```

---

## 12. Comandos

Antes:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Depois:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
npm run audit:full
```

---

## 13. Critério de aceite

A correção está pronta se:

```txt
Já domino 85% agenda e mostra D7.
Já domino 92% agenda e mostra D14.
Nenhum tema validado mostra RO: D1.
Steps skipped não entram na fila.
Card usa acerto real da validação.
Sparkline não usa 50% fake.
Mentor não recomenda D1 para tema validado.
Copy está em PT-BR natural.
check:mojibake passa.
testes passam.
build passa.
```

---

## 14. Prompt curto para executor

```txt
Execute somente o hotfix do fluxo “Já domino” descrito neste arquivo.

Bug:
Após validar “Já domino”, o card mostra “Próxima revisão: D14”, mas a fila/rodapé mostra “RO: D1” e o progresso fica com cálculo fixo. Corrija a semântica end-to-end.

Objetivo:
“Já domino” 80–89% deve agendar e exibir D7.
“Já domino” >=90% deve agendar e exibir D14.
Nunca mostrar D1 para tema validado previamente.
Ignorar steps skipped na fila.
Usar acerto real da validação no card.
Não usar gráfico 50% fake.

Não implementar P2/P3/P4.
Não mexer em Firebase/Auth/localStorage.
Não criar Activity Log.
Não refatorar Mentor inteiro.
Não instalar libs.
Não fazer commit/deploy/push.

Rode check:mojibake, testes, build e audit:full.
```
