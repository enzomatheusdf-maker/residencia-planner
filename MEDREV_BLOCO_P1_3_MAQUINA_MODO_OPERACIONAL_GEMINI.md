# MEDREV — BLOCO P1.3 — MÁQUINA DE MODO OPERACIONAL

**Arquivo para implementação por modelo menor:** Gemini 3.5 Flash / Claude Sonnet / Codex executor  
**Prioridade:** P1.3  
**Status:** implementar depois do P1.1/P1.2 ou em paralelo seguro, desde que o P0 de decisão única não tenha sido quebrado  
**Regra de segurança:** este bloco **não persiste novo estado**, **não muda datas de revisão**, **não muda FSRS**, **não altera Firebase/localStorage** e **não troca a decisão principal do Mentor**.

---

## 0. Veredito antes de implementar

O P1.3 do roadmap mestre é:

```txt
BLOCO P1-3 — Máquina de modo:
modoOperacao derivando os flags atuais.
Prova: testes de transição.
```

A decisão correta é criar um módulo puro que derive um **modo operacional canônico** a partir dos sinais já existentes.

O erro a evitar é criar mais um booleano persistido, por exemplo:

```txt
modoSobrecarga: true
modoRecuperacao: false
modoProvaProxima: true
```

Isso aumentaria a entropia que o P0 tentou reduzir.

A arquitetura certa é:

```txt
Estado persistido atual + sinais derivados
        ↓
deriveOperationalMode(...)
        ↓
modoOperacao derivado e explicável
        ↓
Mentor / Dashboard / Stats consomem uma leitura única
```

O `modoOperacao` deve ser **derivado**, não salvo.

---

## 1. Arquivos revisados antes deste bloco

### Roadmap e documentos

```txt
/mnt/data/medrev_docs/MEDREV_CORE_AUDIT_AND_MASTER_IMPLEMENTATION_PLAN.md
/mnt/data/medrev_docs/MEDREV_PERSONALIZATION_AND_MENTOR_MASTERPLAN.md
/mnt/data/MEDREV_P0_COMPLETO_ORQUESTRACAO_DECISAO_E_EVIDENCIAS.md
/mnt/data/MEDREV_BLOCO_P1_1_FSRS_CANONICO_SOMBRA_GEMINI.md
/mnt/data/MEDREV_BLOCO_P1_2_CALIBRACAO_METACOGNITIVA_GEMINI.md
/mnt/data/medrev_src/Bro/MEDREV_BLOCO_F1_MENTOR_ENAMED_AUTOPILOT.md
/mnt/data/medrev_src/Bro/MEDREV_BLOCO_K_FSRS_LITE_V2_MENTOR_PREP.md
```

### Código atual

```txt
src/core/store.js
src/core/mentorSignals.js
src/core/mentorSignals.test.js
src/core/mentorDecisionPolicy.js
src/core/peakMode.js
src/core/fsrs.js
src/core/actionInbox.js
src/core/metricsRegistry.js
src/components/Dashboard.jsx
src/components/ActionInbox.jsx
```

### Achados concretos no código

1. O estado atual tem vários flags e modos espalhados:

```txt
focusMode
modoSimples
mentorMode
modoProva
meta.peakModePhase
meta.pausadoAte
sprint.ativa
sessionReflections
scheduler.overloadLevelToday
scheduler.overloadDays
scheduler.relearningCount
scheduler.overdueCount
```

2. `peakMode.js` já deriva fase pela data da prova:

```txt
base
aproximacao
reta_final
vespera
```

3. `mentorSignals.js` já calcula os principais sinais de carga:

```txt
todayMinutes
overloadLevelToday
overloadDays
overdueCount
dueTodayCount
relearningCount
missingRatingWarnings
missingReviewedAtCount
trueRetentionPct
```

4. `mentorDecisionPolicy.js` já usa uma cascata de segurança:

```txt
dados inconsistentes
sobrecarga
relearning
vencidas
fila do dia
simulado pendente
erro dominante
gargalo ENAMED
caso clínico
tema novo
descanso
```

5. `Dashboard.jsx` ainda calcula localmente algumas leituras paralelas, por exemplo:

```txt
peakPhase
peakPolicy
peakModeAtivo
semanaDeProva
todayLoadSignals
todayLoadSummary
```

Isso não é grave, mas o objetivo do P1.3 é começar a reduzir duplicação.

---

## 2. Fundamentação científica do P1.3

### 2.1 Por que uma máquina de modo é pedagogicamente correta

Um mentor adaptativo não deve apenas ordenar tarefas. Ele precisa reconhecer o **estado operacional do estudante**:

```txt
normal
recuperação
sobrecarga
prova próxima
pausado
dados inconsistentes
```

Isso não é “gamificação”. É governança de carga cognitiva, autorregulação e segurança de decisão.

A literatura de Self-Regulated Learning descreve aprendizagem efetiva como um ciclo de planejamento, monitoramento e ajuste. Logo, o sistema precisa reconhecer quando o aluno está em condição normal, quando precisa recuperar atrasos, quando a carga está excessiva e quando a proximidade da prova muda a estratégia.

Fonte central:

- Zimmerman, 2002 — *Becoming a Self-Regulated Learner: An Overview*.  
  https://people.bath.ac.uk/edspd/Weblinks/PGCES%20ULL%20articles/Learning%20to%20Learn/Zimmerman%202002%20TiP.pdf

Implicação para o MedRev:

```txt
modoOperacao é a camada que transforma sinais brutos em estado de autorregulação.
Sem isso, o app continua com vários sinais corretos, mas sem uma leitura unificada.
```

### 2.2 Por que sobrecarga deve ser modo, não apenas alerta

Cognitive Load Theory sustenta que a memória de trabalho é limitada e que aprendizagem pode ser prejudicada quando a carga excede a capacidade do aprendiz. Em educação médica, isso é ainda mais relevante porque as tarefas são complexas, têm alta carga intrínseca e exigem integração de múltiplos elementos.

Fontes centrais:

- Sweller, 2019 — *Cognitive Architecture and Instructional Design: 20 Years Later*.  
  https://link.springer.com/article/10.1007/s10648-019-09465-5
- Leppink, 2015 — *The evolution of cognitive load theory and its application to medical education*.  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4456454/
- Young et al., 2014 — *Cognitive Load Theory: Implications for medical education*.  
  https://med.virginia.edu/faculty-affairs/wp-content/uploads/sites/458/2016/04/2014-6-14-1.pdf

Implicação para o MedRev:

```txt
Se há sobrecarga, o app não deve apenas mostrar “carga alta”.
Ele deve operar em modo de contenção:
- bloquear tema novo;
- priorizar revisões críticas;
- reduzir expansão;
- recomendar descanso/recuperação quando necessário.
```

### 2.3 Por que recuperação deve ser modo separado de sobrecarga

Sobrecarga e recuperação não são a mesma coisa.

```txt
Sobrecarga = volume/carga excedendo capacidade operacional.
Recuperação = há instabilidade cognitiva: vencidas, relearning, queda de desempenho ou atraso relevante.
```

Um aluno pode estar em recuperação sem estar sobrecarregado hoje. Exemplo:

```txt
1 revisão vencida há 5 dias
20 minutos de carga hoje
sem excesso de minutos
```

Nesse caso, o modo correto não é “sobrecarga”; é “recuperação”.

A prática de recuperação ativa e a repetição espaçada são intervenções de alta utilidade. O modo de recuperação deve orientar o aluno a fechar lacunas antes de abrir frente nova.

Fonte central:

- Dunlosky et al., 2013 — *Improving Students’ Learning With Effective Learning Techniques*.  
  https://pubmed.ncbi.nlm.nih.gov/26173288/

Implicação para o MedRev:

```txt
Recuperação ativa deve vir antes de expansão quando há tema instável ou revisão vencida.
Isso não é punição; é proteção da curva de retenção.
```

### 2.4 Por que prova próxima deve ser modo, mas não deve atropelar segurança

A proximidade da prova muda a estratégia: menos conteúdo novo, mais revisão, mais análise de prova/simulado, mais descanso e controle de carga. Porém, isso não deve apagar sinais mais críticos.

Ordem segura:

```txt
dados inconsistentes > pausado > sobrecarga > recuperação > prova próxima > normal
```

Isso significa:

```txt
Se a prova está próxima, mas há sobrecarga alta:
modoOperacao = sobrecarga
examPhase = reta_final ou vespera
```

A fase da prova continua registrada, mas o modo principal precisa refletir o risco mais urgente.

---

## 3. Tese de produto

O P1.3 transforma o MedRev de:

```txt
um app com vários indicadores corretos
```

para:

```txt
um sistema que sabe em que regime o aluno está operando hoje.
```

A diferença é grande.

Sem máquina de modo:

```txt
- o Dashboard fala de carga;
- o Mentor fala de revisão;
- o Peak Mode fala de prova;
- o ActionInbox fala de fila;
- Stats fala de desempenho.
```

Com máquina de modo:

```txt
Todos consomem a mesma leitura:
“Hoje o aluno está em recuperação.”
“Hoje o aluno está em sobrecarga.”
“Hoje o aluno está em prova próxima, mas sem atraso.”
```

Isso prepara o P2/P3 para Student Model e Digital Twin sem criar caos.

---

## 4. Escopo do P1.3

### Implementar agora

```txt
1. Criar src/core/operationalMode.js.
2. Criar src/core/operationalMode.test.js.
3. Derivar modoOperacao com função pura.
4. Integrar modoOperacao em buildMentorContext.
5. Adicionar testes em mentorSignals.test.js para confirmar que o contexto expõe o modo.
6. Opcional: Dashboard pode usar o label derivado no resumo de carga, mas sem refactor grande.
```

### Não implementar agora

```txt
1. Não persistir modoOperacao no store.
2. Não criar novos booleans no Zustand.
3. Não mudar FSRS.
4. Não mudar datas de revisão.
5. Não reordenar mentorDecisionPolicy de forma ampla.
6. Não mexer em ActionInbox.
7. Não criar tela nova.
8. Não criar Activity Log.
9. Não trocar PeakMode; apenas consumir a fase dele.
10. Não fazer refactor visual amplo no Dashboard.
```

---

## 5. Arquivos permitidos e proibidos

### Permitidos

```txt
src/core/operationalMode.js                 # novo
src/core/operationalMode.test.js            # novo
src/core/mentorSignals.js                   # adicionar operationalMode ao contexto
src/core/mentorSignals.test.js              # testar exposição no contexto
```

### Permitidos apenas se extremamente simples

```txt
src/components/Dashboard.jsx                # usar label do modo se já estiver disponível
```

Se mexer no Dashboard começar a abrir cascata de refactor, **não mexer**.

### Proibidos

```txt
src/core/store.js
src/core/fsrs.js
src/core/actionInbox.js
src/core/mentorDecisionPolicy.js
src/core/metricsRegistry.js
src/firebase.js
package.json
package-lock.json
```

Observação:

```txt
mentorDecisionPolicy.js fica proibido neste bloco para manter P1.3 como telemetria/normalização.
A ação do Mentor já tem cascata própria. O P1.3 prepara consumo futuro sem trocar decisão principal.
```

---

## 6. Contrato do módulo operationalMode

Criar:

```txt
src/core/operationalMode.js
```

Exportar:

```js
export const OPERATIONAL_MODE = {
  DATA_ISSUE: "dados_inconsistentes",
  PAUSED: "pausado",
  OVERLOAD: "sobrecarga",
  RECOVERY: "recuperacao",
  EXAM_NEAR: "prova_proxima",
  NORMAL: "normal",
};

export const EXPERIENCE_MODE = {
  FOCUS: "foco",
  MENTOR: "mentor",
  MANUAL: "manual",
};

export function deriveExperienceMode(input = {}) { ... }

export function deriveOperationalMode(input = {}) { ... }
```

O output de `deriveOperationalMode` deve seguir este shape:

```js
{
  mode: "sobrecarga",
  label: "Sobrecarga",
  severity: "caution",
  rank: 80,
  reasonCodes: ["overload_today_high", "overload_days_ge_2"],
  explain: [
    "Carga alta detectada hoje.",
    "Há múltiplos dias sobrecarregados no horizonte."
  ],
  examPhase: "base",
  experienceMode: "mentor",
  flags: {
    canStartNewTopic: false,
    shouldPreferReview: true,
    shouldPreferRecovery: false,
    shouldSuggestRest: true,
    shouldReduceVolume: true,
    shouldPreferExamPractice: false,
  },
  policy: {
    newTopicBias: -50,
    reviewBias: 25,
    recoveryBias: 10,
    examPracticeBias: 0,
    restBias: 20,
  },
  source: "operational-mode-v1"
}
```

### Campos obrigatórios

```txt
mode
label
severity
rank
reasonCodes
explain
examPhase
experienceMode
flags
policy
source
```

### Severidades permitidas

```txt
critical
caution
info
ok
```

### Modo principal permitido

```txt
dados_inconsistentes
pausado
sobrecarga
recuperacao
prova_proxima
normal
```

### Fase de prova permitida

Usar `getPeakPhase` de `peakMode.js`:

```txt
base
aproximacao
reta_final
vespera
```

Não reinventar a fase de prova.

---

## 7. Regras de prioridade da máquina

A prioridade deve ser determinística:

```txt
1. dados_inconsistentes
2. pausado
3. sobrecarga
4. recuperacao
5. prova_proxima
6. normal
```

### 7.1 Dados inconsistentes

Entrar em `dados_inconsistentes` se:

```txt
scheduler.missingRatingWarnings > 0
OU
scheduler.missingReviewedAtCount > 0
```

Motivo:

```txt
Se os dados de revisão estão inconsistentes, qualquer recomendação inteligente fica contaminada.
```

Output esperado:

```js
{
  mode: "dados_inconsistentes",
  label: "Dados de revisão inconsistentes",
  severity: "critical",
  flags: {
    canStartNewTopic: false,
    shouldPreferReview: false,
    shouldPreferRecovery: false,
    shouldSuggestRest: false,
    shouldReduceVolume: true,
    shouldPreferExamPractice: false,
  },
  policy: {
    newTopicBias: -100,
    reviewBias: 0,
    recoveryBias: 0,
    examPracticeBias: 0,
    restBias: 0,
  }
}
```

### 7.2 Pausado

Entrar em `pausado` se:

```txt
meta.pausadoAte >= today
```

Usar comparação segura de string `YYYY-MM-DD`.

Output esperado:

```js
{
  mode: "pausado",
  label: "Plano pausado",
  severity: "info",
  flags: {
    canStartNewTopic: false,
    shouldPreferReview: false,
    shouldPreferRecovery: false,
    shouldSuggestRest: true,
    shouldReduceVolume: true,
    shouldPreferExamPractice: false,
  }
}
```

### 7.3 Sobrecarga

Entrar em `sobrecarga` se qualquer condição forte ocorrer:

```txt
scheduler.overloadLevelToday === "high"
OU
scheduler.overloadDays >= 2
OU
scheduler.todayMinutes > userAvailableMinutes * 1.2, quando userAvailableMinutes existir
OU
scheduler.todayMinutes > 120, quando userAvailableMinutes não existir
```

Condição moderada opcional:

```txt
scheduler.overloadLevelToday === "moderate" E scheduler.overloadDays >= 1
```

Output esperado:

```js
{
  mode: "sobrecarga",
  label: "Sobrecarga",
  severity: "caution",
  flags: {
    canStartNewTopic: false,
    shouldPreferReview: true,
    shouldPreferRecovery: false,
    shouldSuggestRest: true,
    shouldReduceVolume: true,
    shouldPreferExamPractice: false,
  }
}
```

### 7.4 Recuperação

Entrar em `recuperacao` se:

```txt
scheduler.relearningCount > 0
OU
scheduler.overdueCount > 0
OU
scheduler.maxDelayDays >= 3
```

Não usar `dueTodayCount > 0` para recuperação.

Motivo:

```txt
Ter revisão hoje é normal.
Ter vencida, atraso relevante ou relearning é recuperação.
```

Output esperado:

```js
{
  mode: "recuperacao",
  label: "Recuperação",
  severity: "caution",
  flags: {
    canStartNewTopic: false,
    shouldPreferReview: true,
    shouldPreferRecovery: true,
    shouldSuggestRest: false,
    shouldReduceVolume: true,
    shouldPreferExamPractice: false,
  }
}
```

### 7.5 Prova próxima

Entrar em `prova_proxima` se:

```txt
examPhase === "aproximacao"
OU
examPhase === "reta_final"
OU
examPhase === "vespera"
```

Mas apenas se não houver:

```txt
dados inconsistentes
pausa ativa
sobrecarga
recuperação
```

Output esperado:

```js
{
  mode: "prova_proxima",
  label: "Prova próxima",
  severity: "info",
  flags: {
    canStartNewTopic: examPhase === "aproximacao",
    shouldPreferReview: true,
    shouldPreferRecovery: false,
    shouldSuggestRest: examPhase === "vespera",
    shouldReduceVolume: examPhase === "reta_final" || examPhase === "vespera",
    shouldPreferExamPractice: true,
  }
}
```

### 7.6 Normal

Entrar em `normal` se nada acima ocorrer.

Output esperado:

```js
{
  mode: "normal",
  label: "Normal",
  severity: "ok",
  flags: {
    canStartNewTopic: true,
    shouldPreferReview: false,
    shouldPreferRecovery: false,
    shouldSuggestRest: false,
    shouldReduceVolume: false,
    shouldPreferExamPractice: false,
  }
}
```

---

## 8. Experience mode separado do Operational mode

Não misturar UI com pedagogia.

### `experienceMode`

Derivar assim:

```txt
focusMode === true → foco
modoSimples === true OU mentorMode === true → mentor
caso contrário → manual
```

Função:

```js
export function deriveExperienceMode({ focusMode, modoSimples, mentorMode } = {}) {
  if (focusMode) return EXPERIENCE_MODE.FOCUS;
  if (modoSimples || mentorMode) return EXPERIENCE_MODE.MENTOR;
  return EXPERIENCE_MODE.MANUAL;
}
```

### Por que separar

Um aluno pode estar em:

```txt
experienceMode = foco
operationalMode = recuperacao
```

Isso significa:

```txt
Ele está usando a interface de foco, mas pedagogicamente o plano está em recuperação.
```

Outro aluno pode estar em:

```txt
experienceMode = manual
operationalMode = sobrecarga
```

Isso significa:

```txt
Ele prefere controle manual, mas o sistema ainda sabe que a carga está alta.
```

---

## 9. Implementação sugerida — operationalMode.js

Código orientativo. Adaptar ao padrão real do projeto, mas manter contrato.

```js
import { getPeakPhase } from "./peakMode";

export const OPERATIONAL_MODE = Object.freeze({
  DATA_ISSUE: "dados_inconsistentes",
  PAUSED: "pausado",
  OVERLOAD: "sobrecarga",
  RECOVERY: "recuperacao",
  EXAM_NEAR: "prova_proxima",
  NORMAL: "normal",
});

export const EXPERIENCE_MODE = Object.freeze({
  FOCUS: "foco",
  MENTOR: "mentor",
  MANUAL: "manual",
});

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function isDateActiveUntil(dateStr, today) {
  if (!dateStr || !today) return false;
  return String(dateStr) >= String(today);
}

export function deriveExperienceMode({ focusMode, modoSimples, mentorMode } = {}) {
  if (focusMode) return EXPERIENCE_MODE.FOCUS;
  if (modoSimples || mentorMode) return EXPERIENCE_MODE.MENTOR;
  return EXPERIENCE_MODE.MANUAL;
}

function buildMode(partial) {
  return {
    mode: partial.mode || OPERATIONAL_MODE.NORMAL,
    label: partial.label || "Normal",
    severity: partial.severity || "ok",
    rank: safeNumber(partial.rank, 10),
    reasonCodes: Array.isArray(partial.reasonCodes) ? partial.reasonCodes : [],
    explain: Array.isArray(partial.explain) ? partial.explain : [],
    examPhase: partial.examPhase || "base",
    experienceMode: partial.experienceMode || EXPERIENCE_MODE.MENTOR,
    flags: {
      canStartNewTopic: true,
      shouldPreferReview: false,
      shouldPreferRecovery: false,
      shouldSuggestRest: false,
      shouldReduceVolume: false,
      shouldPreferExamPractice: false,
      ...(partial.flags || {}),
    },
    policy: {
      newTopicBias: 0,
      reviewBias: 0,
      recoveryBias: 0,
      examPracticeBias: 0,
      restBias: 0,
      ...(partial.policy || {}),
    },
    source: "operational-mode-v1",
  };
}

export function deriveOperationalMode(input = {}) {
  const scheduler = input.scheduler || {};
  const meta = input.meta || {};
  const today = input.today;
  const examPhase = input.examPhase || getPeakPhase({ examDate: meta.dataProva, today });
  const experienceMode = deriveExperienceMode(input);
  const userAvailableMinutes = input.userAvailableMinutes == null
    ? null
    : safeNumber(input.userAvailableMinutes, 0);

  const missingRatingWarnings = safeNumber(scheduler.missingRatingWarnings);
  const missingReviewedAtCount = safeNumber(scheduler.missingReviewedAtCount);
  const todayMinutes = safeNumber(scheduler.todayMinutes);
  const overloadDays = safeNumber(scheduler.overloadDays);
  const relearningCount = safeNumber(scheduler.relearningCount);
  const overdueCount = safeNumber(scheduler.overdueCount);
  const maxDelayDays = safeNumber(scheduler.maxDelayDays);
  const overloadLevelToday = scheduler.overloadLevelToday || "ok";

  if (missingRatingWarnings > 0 || missingReviewedAtCount > 0) {
    return buildMode({
      mode: OPERATIONAL_MODE.DATA_ISSUE,
      label: "Dados de revisão inconsistentes",
      severity: "critical",
      rank: 100,
      examPhase,
      experienceMode,
      reasonCodes: [
        missingRatingWarnings > 0 ? "missing_rating_warnings" : null,
        missingReviewedAtCount > 0 ? "missing_reviewed_at" : null,
      ].filter(Boolean),
      explain: [
        "Há revisões concluídas com dados faltando.",
        "Corrigir o histórico vem antes de otimizar o plano.",
      ],
      flags: {
        canStartNewTopic: false,
        shouldReduceVolume: true,
      },
      policy: {
        newTopicBias: -100,
      },
    });
  }

  if (isDateActiveUntil(meta.pausadoAte, today)) {
    return buildMode({
      mode: OPERATIONAL_MODE.PAUSED,
      label: "Plano pausado",
      severity: "info",
      rank: 90,
      examPhase,
      experienceMode,
      reasonCodes: ["paused_until_active"],
      explain: ["O plano está pausado até a data configurada."],
      flags: {
        canStartNewTopic: false,
        shouldSuggestRest: true,
        shouldReduceVolume: true,
      },
      policy: {
        newTopicBias: -100,
        restBias: 30,
      },
    });
  }

  const exceedsAvailable = userAvailableMinutes > 0 && todayMinutes > userAvailableMinutes * 1.2;
  const exceedsDefault = userAvailableMinutes == null && todayMinutes > 120;
  const highOverload = overloadLevelToday === "high" || overloadDays >= 2 || exceedsAvailable || exceedsDefault;
  const moderateOverload = overloadLevelToday === "moderate" && overloadDays >= 1;

  if (highOverload || moderateOverload) {
    return buildMode({
      mode: OPERATIONAL_MODE.OVERLOAD,
      label: "Sobrecarga",
      severity: "caution",
      rank: 80,
      examPhase,
      experienceMode,
      reasonCodes: [
        overloadLevelToday === "high" ? "overload_today_high" : null,
        overloadLevelToday === "moderate" ? "overload_today_moderate" : null,
        overloadDays >= 2 ? "overload_days_ge_2" : null,
        moderateOverload ? "moderate_plus_future_overload" : null,
        exceedsAvailable ? "exceeds_available_minutes" : null,
        exceedsDefault ? "exceeds_default_minutes" : null,
      ].filter(Boolean),
      explain: [
        "A carga estimada está acima do ideal para hoje.",
        "Tema novo deve ficar em segundo plano até estabilizar a fila.",
      ],
      flags: {
        canStartNewTopic: false,
        shouldPreferReview: true,
        shouldSuggestRest: true,
        shouldReduceVolume: true,
      },
      policy: {
        newTopicBias: -50,
        reviewBias: 25,
        restBias: 20,
      },
    });
  }

  if (relearningCount > 0 || overdueCount > 0 || maxDelayDays >= 3) {
    return buildMode({
      mode: OPERATIONAL_MODE.RECOVERY,
      label: "Recuperação",
      severity: "caution",
      rank: 70,
      examPhase,
      experienceMode,
      reasonCodes: [
        relearningCount > 0 ? "relearning_active" : null,
        overdueCount > 0 ? "overdue_reviews" : null,
        maxDelayDays >= 3 ? "max_delay_ge_3" : null,
      ].filter(Boolean),
      explain: [
        "Há revisão vencida ou tema em reaprendizado.",
        "Recuperação ativa vem antes de abrir frente nova.",
      ],
      flags: {
        canStartNewTopic: false,
        shouldPreferReview: true,
        shouldPreferRecovery: true,
        shouldReduceVolume: true,
      },
      policy: {
        newTopicBias: -40,
        reviewBias: 25,
        recoveryBias: 30,
      },
    });
  }

  if (["aproximacao", "reta_final", "vespera"].includes(examPhase)) {
    const finalPhase = examPhase === "reta_final" || examPhase === "vespera";
    return buildMode({
      mode: OPERATIONAL_MODE.EXAM_NEAR,
      label: "Prova próxima",
      severity: "info",
      rank: 60,
      examPhase,
      experienceMode,
      reasonCodes: [`exam_phase_${examPhase}`],
      explain: [
        "A data da prova está próxima.",
        finalPhase
          ? "Priorize revisão, simulado e descanso; evite expansão agressiva."
          : "Comece a aumentar o peso de prova e revisão sem abandonar avanço planejado.",
      ],
      flags: {
        canStartNewTopic: examPhase === "aproximacao",
        shouldPreferReview: true,
        shouldSuggestRest: examPhase === "vespera",
        shouldReduceVolume: finalPhase,
        shouldPreferExamPractice: true,
      },
      policy: {
        newTopicBias: examPhase === "aproximacao" ? -10 : -50,
        reviewBias: finalPhase ? 35 : 15,
        examPracticeBias: finalPhase ? 30 : 20,
        restBias: examPhase === "vespera" ? 30 : 10,
      },
    });
  }

  return buildMode({
    mode: OPERATIONAL_MODE.NORMAL,
    label: "Normal",
    severity: "ok",
    rank: 10,
    examPhase,
    experienceMode,
    reasonCodes: ["stable"],
    explain: ["Sem sobrecarga, atraso crítico ou restrição de prova detectada."],
  });
}
```

---

## 10. Integração em mentorSignals.js

Adicionar import:

```js
import { deriveOperationalMode } from "./operationalMode";
```

No `buildMentorContext`, depois de calcular `scheduler` e `userAvailableMinutes`, criar:

```js
const operationalMode = deriveOperationalMode({
  scheduler,
  meta,
  today,
  plat,
  focusMode: state.focusMode,
  modoSimples: state.modoSimples,
  mentorMode: state.mentorMode,
  modoProva: state.modoProva,
  userAvailableMinutes,
});
```

Adicionar no retorno:

```js
operationalMode,
```

Resultado:

```js
return {
  plat,
  today,
  meta,
  calendarProvider: state.calendarProvider || {},
  actionInbox: state.actionInbox || [],
  sessionReflections: state.sessionReflections || [],
  scheduler,
  operationalMode,
  ...
};
```

Não mudar `decideMentorAction` agora.

Motivo:

```txt
P1.3 cria fonte única de modo.
P1.4/P2 pode fazer o Mentor consumir policy/bias de modo.
Neste bloco, a prova é exposição e transição determinística.
```

---

## 11. Integração opcional no Dashboard

Só fazer se for mudança pequena.

Hoje existe resumo local como:

```txt
todayLoadSummary = "X revisões · Y min · carga alta"
```

Pode passar a incluir:

```txt
Modo: Recuperação
```

Mas sem criar card novo.

Exemplo de copy:

```txt
3 revisões · 45 min · Recuperação
```

Ou badge pequeno:

```txt
Modo: Recuperação
```

Não mostrar termos crus como:

```txt
operationalMode
relearning
overload
peak mode
```

Copy humana:

```txt
dados_inconsistentes → Ajustar dados
ausado              → Plano pausado
sobrecarga          → Sobrecarga
recuperacao         → Recuperação
prova_proxima       → Prova próxima
normal              → Normal
```

Se o Dashboard ficar complicado, pular essa etapa e deixar apenas no contexto do Mentor.

---

## 12. Testes obrigatórios

Criar:

```txt
src/core/operationalMode.test.js
```

### 12.1 Normal

```js
test("modo normal quando não há risco", () => {
  const out = deriveOperationalMode({
    today: "2026-06-04",
    meta: { dataProva: "2026-12-01" },
    scheduler: {
      overloadLevelToday: "ok",
      overloadDays: 0,
      todayMinutes: 30,
      overdueCount: 0,
      relearningCount: 0,
      missingRatingWarnings: 0,
      missingReviewedAtCount: 0,
    },
    modoSimples: true,
  });
  expect(out.mode).toBe(OPERATIONAL_MODE.NORMAL);
  expect(out.flags.canStartNewTopic).toBe(true);
  expect(out.experienceMode).toBe(EXPERIENCE_MODE.MENTOR);
});
```

### 12.2 Dados inconsistentes vencem tudo

```js
test("dados inconsistentes têm prioridade máxima", () => {
  const out = deriveOperationalMode({
    today: "2026-06-04",
    meta: { dataProva: "2026-06-10" },
    scheduler: {
      missingRatingWarnings: 1,
      overloadLevelToday: "high",
      overloadDays: 3,
      overdueCount: 4,
      relearningCount: 2,
    },
  });
  expect(out.mode).toBe(OPERATIONAL_MODE.DATA_ISSUE);
  expect(out.severity).toBe("critical");
  expect(out.flags.canStartNewTopic).toBe(false);
});
```

### 12.3 Pausado vence sobrecarga/recuperação, mas perde para dados inconsistentes

```js
test("pausado vence sobrecarga se dados estiverem ok", () => {
  const out = deriveOperationalMode({
    today: "2026-06-04",
    meta: { pausadoAte: "2026-06-10", dataProva: "2026-09-13" },
    scheduler: {
      overloadLevelToday: "high",
      overloadDays: 3,
      missingRatingWarnings: 0,
      missingReviewedAtCount: 0,
    },
  });
  expect(out.mode).toBe(OPERATIONAL_MODE.PAUSED);
  expect(out.flags.shouldSuggestRest).toBe(true);
});
```

### 12.4 Sobrecarga

```js
test("sobrecarga quando carga de hoje é alta", () => {
  const out = deriveOperationalMode({
    today: "2026-06-04",
    meta: { dataProva: "2026-12-01" },
    scheduler: {
      overloadLevelToday: "high",
      overloadDays: 0,
      todayMinutes: 150,
    },
  });
  expect(out.mode).toBe(OPERATIONAL_MODE.OVERLOAD);
  expect(out.flags.canStartNewTopic).toBe(false);
  expect(out.flags.shouldSuggestRest).toBe(true);
});
```

### 12.5 Sobrecarga por minutos disponíveis

```js
test("sobrecarga quando carga excede tempo disponível em 20%", () => {
  const out = deriveOperationalMode({
    today: "2026-06-04",
    meta: { dataProva: "2026-12-01" },
    userAvailableMinutes: 60,
    scheduler: {
      overloadLevelToday: "ok",
      overloadDays: 0,
      todayMinutes: 80,
    },
  });
  expect(out.mode).toBe(OPERATIONAL_MODE.OVERLOAD);
  expect(out.reasonCodes).toContain("exceeds_available_minutes");
});
```

### 12.6 Recuperação

```js
test("recuperação quando há relearning", () => {
  const out = deriveOperationalMode({
    today: "2026-06-04",
    meta: { dataProva: "2026-12-01" },
    scheduler: {
      overloadLevelToday: "ok",
      overloadDays: 0,
      relearningCount: 1,
      overdueCount: 0,
    },
  });
  expect(out.mode).toBe(OPERATIONAL_MODE.RECOVERY);
  expect(out.flags.shouldPreferRecovery).toBe(true);
});
```

### 12.7 Revisão de hoje não é recuperação

```js
test("revisão de hoje sem atraso não vira recuperação", () => {
  const out = deriveOperationalMode({
    today: "2026-06-04",
    meta: { dataProva: "2026-12-01" },
    scheduler: {
      overloadLevelToday: "ok",
      overloadDays: 0,
      dueTodayCount: 3,
      overdueCount: 0,
      relearningCount: 0,
      maxDelayDays: 0,
    },
  });
  expect(out.mode).toBe(OPERATIONAL_MODE.NORMAL);
});
```

### 12.8 Prova próxima

```js
test("prova próxima quando fase é reta_final e não há riscos maiores", () => {
  const out = deriveOperationalMode({
    today: "2026-06-04",
    meta: { dataProva: "2026-06-20" },
    scheduler: {
      overloadLevelToday: "ok",
      overloadDays: 0,
      overdueCount: 0,
      relearningCount: 0,
      missingRatingWarnings: 0,
      missingReviewedAtCount: 0,
    },
  });
  expect(out.mode).toBe(OPERATIONAL_MODE.EXAM_NEAR);
  expect(out.examPhase).toBe("reta_final");
  expect(out.flags.shouldPreferExamPractice).toBe(true);
});
```

### 12.9 Sobrecarga vence prova próxima

```js
test("sobrecarga vence prova próxima", () => {
  const out = deriveOperationalMode({
    today: "2026-06-04",
    meta: { dataProva: "2026-06-20" },
    scheduler: {
      overloadLevelToday: "high",
      overloadDays: 2,
      overdueCount: 0,
      relearningCount: 0,
    },
  });
  expect(out.examPhase).toBe("reta_final");
  expect(out.mode).toBe(OPERATIONAL_MODE.OVERLOAD);
});
```

### 12.10 Experience mode

```js
test("experience mode foco tem prioridade sobre mentor/manual", () => {
  expect(deriveExperienceMode({ focusMode: true, modoSimples: true })).toBe(EXPERIENCE_MODE.FOCUS);
  expect(deriveExperienceMode({ focusMode: false, modoSimples: true })).toBe(EXPERIENCE_MODE.MENTOR);
  expect(deriveExperienceMode({ focusMode: false, modoSimples: false, mentorMode: false })).toBe(EXPERIENCE_MODE.MANUAL);
});
```

---

## 13. Teste de integração em mentorSignals.test.js

Adicionar teste simples:

```js
test("buildMentorContext expõe operationalMode derivado", () => {
  const today = "2026-06-04";
  const state = {
    plat: "res",
    meta: { tempoDisponivel: 1, dataProva: "2026-12-01" },
    calendarProvider: { activeId: "medcof" },
    focusMode: false,
    modoSimples: true,
    mentorMode: true,
    res: {
      temas: [],
      simulados: [],
      casosProgresso: {},
    },
    enamedAnalises: [],
    actionInbox: [],
    sessionReflections: [],
  };

  const context = buildMentorContext(state, "res", { today });

  expect(context.operationalMode).toBeDefined();
  expect(context.operationalMode.mode).toBe("normal");
  expect(context.operationalMode.experienceMode).toBe("mentor");
});
```

Adicionar cenário de sobrecarga com tema fake se necessário, ou usar `extras` apenas se o código permitir injetar scheduler. Se `buildMentorContext` não aceitar scheduler externo, não criar atalho hacky; testar `deriveOperationalMode` diretamente no arquivo próprio.

---

## 14. Critérios de aceite

P1.3 está aprovado se:

```txt
1. src/core/operationalMode.js existe.
2. src/core/operationalMode.test.js existe.
3. deriveOperationalMode é função pura.
4. deriveOperationalMode não lê localStorage/Firebase/window.
5. deriveOperationalMode não muta input.
6. modoOperacao não é persistido no Zustand.
7. buildMentorContext retorna operationalMode.
8. operationalMode contém mode, label, severity, reasonCodes, flags, policy.
9. Testes cobrem: normal, dados inconsistentes, pausado, sobrecarga, recuperação, prova próxima, precedência e experienceMode.
10. npm test -- --watchAll=false passa.
11. npm run build passa.
12. npm run check:mojibake passa.
```

---

## 15. O que reportar ao final

O executor deve devolver:

```txt
1. Arquivos alterados.
2. Resumo da máquina de modo criada.
3. Lista de modos implementados.
4. Como a precedência foi testada.
5. Se Dashboard foi alterado ou não.
6. Resultado dos comandos:
   - npm run check:mojibake
   - npm test -- --watchAll=false
   - npm run build
7. Qualquer teste quebrado antes/depois.
```

Formato:

```txt
P1.3 implementado.

Arquivos:
- src/core/operationalMode.js
- src/core/operationalMode.test.js
- src/core/mentorSignals.js
- src/core/mentorSignals.test.js

Modos:
- dados_inconsistentes
- pausado
- sobrecarga
- recuperacao
- prova_proxima
- normal

Precedência testada:
- dados > pausa > sobrecarga > recuperação > prova próxima > normal

Comandos:
- check:mojibake: OK
- test: OK
- build: OK
```

---

## 16. Armadilhas a evitar

### 16.1 Não persistir `modoOperacao`

Errado:

```js
set({ modoOperacao: "sobrecarga" })
```

Certo:

```js
const operationalMode = deriveOperationalMode(context)
```

### 16.2 Não criar novo motor de decisão

Errado:

```js
if (operationalMode.mode === "sobrecarga") return novaAcaoMentor(...)
```

Certo no P1.3:

```js
context.operationalMode = operationalMode
```

O consumo decisório fica para bloco futuro.

### 16.3 Não duplicar PeakMode

Errado:

```js
if (diasAteProva < 30) phase = "final"
```

Certo:

```js
const examPhase = getPeakPhase({ examDate: meta.dataProva, today })
```

### 16.4 Não chamar revisão de hoje de recuperação

Errado:

```js
if (dueTodayCount > 0) mode = "recuperacao"
```

Certo:

```js
if (relearningCount > 0 || overdueCount > 0 || maxDelayDays >= 3) mode = "recuperacao"
```

Revisão de hoje é rotina normal, não crise.

### 16.5 Não misturar modo de interface com modo pedagógico

Errado:

```txt
modoOperacao = foco
```

Certo:

```txt
experienceMode = foco
operationalMode.mode = recuperacao/sobrecarga/normal/etc.
```

---

## 17. Como isso conversa com P1.1 e P1.2

### P1.1 — FSRS sombra

P1.1 gera divergências entre FSRS-Lite e FSRS canônico. P1.3 não usa isso ainda.

Futuro:

```txt
Se shadow divergence alta + overload → modo sobrecarga ganha confiança maior.
Se shadow divergence baixa + fila estável → modo normal com maior segurança.
```

### P1.2 — Calibração metacognitiva

P1.2 calcula se o aluno superestima/subestima desempenho. P1.3 não deve depender obrigatoriamente disso.

Futuro:

```txt
Se overconfidence alta + acerto baixo → modo recuperação pode ganhar reasonCode "overconfidence_risk".
```

Não implementar agora para evitar acoplamento prematuro.

---

## 18. Roadmap imediatamente posterior

Depois do P1.3, os próximos blocos naturais são:

```txt
P1.4 — MentorDecisionPolicy consome operationalMode.policy como bias, sem reescrever a cascata.
P1.5 — Dashboard troca cálculos locais de carga/peak por operationalMode quando possível.
P2.1 — Student Model usa operationalMode histórico como componente Pessoa.
P2.2 — Forecast usa modos acumulados para prever aderência e risco de atraso.
```

Mas não pular para isso agora.

---

## 19. Prompt curto para o executor

```txt
Implemente o BLOCO P1.3 — Máquina de Modo Operacional.

Objetivo:
Criar uma função pura deriveOperationalMode que derive um modo operacional canônico a partir dos sinais já existentes do MedRev, sem persistir novo estado e sem mudar o Mentor Decision Engine.

Arquivos permitidos:
- src/core/operationalMode.js
- src/core/operationalMode.test.js
- src/core/mentorSignals.js
- src/core/mentorSignals.test.js

Arquivo opcional:
- src/components/Dashboard.jsx, apenas se for uma mudança mínima de copy/badge.

Arquivos proibidos:
- src/core/store.js
- src/core/fsrs.js
- src/core/actionInbox.js
- src/core/mentorDecisionPolicy.js
- src/core/metricsRegistry.js
- src/firebase.js
- package.json
- package-lock.json

Modos obrigatórios:
- dados_inconsistentes
- pausado
- sobrecarga
- recuperacao
- prova_proxima
- normal

Precedência obrigatória:
dados_inconsistentes > pausado > sobrecarga > recuperacao > prova_proxima > normal

Separar:
- operationalMode.mode = estado pedagógico/operacional
- experienceMode = foco/mentor/manual

Regras:
1. Não persistir modoOperacao.
2. Não criar booleans novos no store.
3. Não mexer em FSRS.
4. Não mudar datas oficiais.
5. Não reordenar mentorDecisionPolicy.
6. Não mexer em ActionInbox.
7. Não criar UI pesada.
8. Usar getPeakPhase de peakMode.js.
9. Testar transições e precedência.
10. build/test/check:mojibake devem passar.
```

---

## 20. Referências usadas

1. Zimmerman BJ. *Becoming a Self-Regulated Learner: An Overview*. Theory Into Practice, 2002.  
   https://people.bath.ac.uk/edspd/Weblinks/PGCES%20ULL%20articles/Learning%20to%20Learn/Zimmerman%202002%20TiP.pdf

2. Panadero E. *A Review of Self-regulated Learning: Six Models and Four Directions for Research*. Frontiers in Psychology, 2017.  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC5408091/

3. Dunlosky J et al. *Improving Students’ Learning With Effective Learning Techniques*. Psychological Science in the Public Interest, 2013.  
   https://pubmed.ncbi.nlm.nih.gov/26173288/

4. Sweller J, van Merrienboer JJG, Paas F. *Cognitive Architecture and Instructional Design: 20 Years Later*. Educational Psychology Review, 2019.  
   https://link.springer.com/article/10.1007/s10648-019-09465-5

5. Leppink J. *The evolution of cognitive load theory and its application to medical education*. Perspectives on Medical Education, 2015.  
   https://pmc.ncbi.nlm.nih.gov/articles/PMC4456454/

6. Young JQ et al. *Cognitive Load Theory: Implications for medical education*. Medical Teacher, 2014.  
   https://med.virginia.edu/faculty-affairs/wp-content/uploads/sites/458/2016/04/2014-6-14-1.pdf

7. Kabudi T, Pappas I, Olsen DH. *AI-enabled adaptive learning systems: A systematic mapping of the literature*. Computers and Education: Artificial Intelligence, 2021.  
   https://www.sciencedirect.com/science/article/pii/S2666920X21000114

---

## 21. Frase-guia

> O P1.3 não manda o aluno estudar diferente ainda. Ele dá ao MedRev uma linguagem única para dizer em que regime o aluno está: normal, recuperação, sobrecarga ou prova próxima. Sem isso, todo motor futuro vira mais um remendo em cima de sinais espalhados.
