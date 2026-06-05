# MEDREV — P0 COMPLETO: ORQUESTRAÇÃO ÚNICA, CONTRATO DE EVENTOS E FSRS POR BLOCOS

> **Executor recomendado:** Gemini 3.5 Flash / modelo executor pequeno  
> **Modo:** conservador, em fases, com testes antes/depois  
> **Objetivo:** completar o verdadeiro P0 do MedRev sem abrir feature nova: tornar o produto um organismo único de decisão, corrigir o scheduling inicial para blocos de conteúdo, registrar sinais de aprendizagem de forma consistente e impedir que Dashboard, Action Inbox, Mentor e FSRS decidam coisas conflitantes.  
> **Relação com o documento anterior:** o arquivo `MEDREV_BLOCO_P0_FSRS_BLOCOS_INTERLEAVING_GEMINI.md` cobre o sub-bloco P0-C. Este documento cobre o P0 inteiro.

---

## 0. Veredito honesto

O documento anterior **não contemplou todo o P0**.

Ele contemplou bem este pedaço:

```txt
P0-C — FSRS por blocos de conteúdo + interleaving com fallback seguro
```

Mas o P0 que emerge da auditoria do Claude é maior. A prioridade real apontada foi:

```txt
P0-A — reduzir entropia de decisão: um único núcleo decide a próxima ação.
P0-B — criar contrato mínimo de eventos de aprendizagem.
P0-C — corrigir FSRS inicial para blocos + interleaving honesto.
P0-D — alinhar Dashboard/Action Inbox ao núcleo único.
P0-E — blindar métricas e copy contra promessas falsas, especialmente readiness/% versus TRI.
```

A ordem correta é:

```txt
1. P0-A/P0-D: decisão única.
2. P0-B: evento único de aprendizagem.
3. P0-C: FSRS por blocos e interleaving.
4. P0-E: métricas/copy de segurança.
```

Motivo: se você melhora o FSRS antes de unificar a decisão, o app fica mais inteligente em um ponto, mas continua com **dois cérebros** competindo: `mentorDecisionPolicy` e `buildActionCandidatesFromState`.

---

## 1. Base científica usada para esta decisão

### 1.1 O que é evidência forte e entra em P0

#### Retrieval practice / testing effect

A evidência é forte o suficiente para orientar produto agora: testar/recuperar informação melhora retenção de longo prazo, não apenas mede conhecimento. Portanto, o MedRev deve privilegiar tarefas que geram recuperação ativa, não apenas leitura ou checklist.

Fontes centrais:

- Roediger & Karpicke, 2006 — Test-enhanced learning: taking memory tests improves long-term retention.  
  https://pubmed.ncbi.nlm.nih.gov/16507066/
- Dunlosky et al., 2013 — Improving students' learning with effective learning techniques.  
  https://pubmed.ncbi.nlm.nih.gov/26173288/

Implicação P0:

```txt
O decisionCore deve priorizar revisão vencida, questões, brain dump e correção ativa antes de “conteúdo novo” quando houver instabilidade.
```

#### Distributed practice / spacing

A evidência é forte: distribuir prática no tempo é superior a massificar estudo. Mas o tamanho do intervalo depende do alvo de retenção, do histórico e do tipo de material.

Fontes centrais:

- Cepeda et al., 2006 — Distributed practice in verbal recall tasks: review and quantitative synthesis.  
  https://pubmed.ncbi.nlm.nih.gov/16719566/
- Dunlosky et al., 2013.  
  https://pubmed.ncbi.nlm.nih.gov/26173288/

Implicação P0:

```txt
Manter D0/D1/D4/D7/D21 como checkpoints semânticos é defensável.
Tornar as transições adaptativas em bandas seguras é melhor que fixar tudo.
```

#### FSRS / DSR model

FSRS modela memória por DSR: Difficulty, Stability e Retrievability. O próprio manual do Anki descreve que FSRS usa histórico de revisão para aprender padrões do usuário e ajustar parâmetros; cada cartão tem seu próprio estado de memória.

Fontes centrais:

- Anki Manual — FSRS optimizer e desired retention.  
  https://docs.ankiweb.net/deck-options.html
- Anki FAQ — FSRS e DSR.  
  https://faqs.ankiweb.net/what-spaced-repetition-algorithm
- Open Spaced Repetition — FSRS algorithm.  
  https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm

Implicação P0:

```txt
FSRS canônico é item-level/card-level.
MedRev agenda topic-level/block-level.
Logo, P0 não deve instalar “FSRS puro” para blocos; deve usar FSRS como sinal moderador dentro de bandas pedagógicas.
```

#### Interleaving

Interleaving é promissor, especialmente quando ajuda discriminação entre categorias próximas. Mas a evidência é mais dependente de contexto do que retrieval practice e spacing.

Fontes centrais:

- Birnbaum et al., 2013 — Why interleaving enhances inductive learning.  
  https://pubmed.ncbi.nlm.nih.gov/23138567/
- Dunlosky et al., 2013.  
  https://pubmed.ncbi.nlm.nih.gov/26173288/

Implicação P0:

```txt
Interleaving deve ser recomendado com fallback, não imposto.
Interleaving não deve marcar outro tema como concluído.
```

#### Student modeling / BKT / learning analytics

BKT é um dos modelos interpretáveis mais investigados para estimar domínio de habilidades. Modelos modernos podem prever melhor, mas muitas vezes perdem interpretabilidade. Para o MedRev, interpretabilidade importa porque o usuário precisa confiar no mentor.

Fontes centrais:

- Twenty-five years of Bayesian Knowledge Tracing.  
  https://dl.acm.org/doi/10.1007/s11257-023-09389-4
- BKT-LSTM: Efficient Student Modeling.  
  https://arxiv.org/abs/2012.12218
- Educational data mining and learning analytics: updated survey.  
  https://arxiv.org/abs/2402.07956
- Bienkowski et al., 2012 — Enhancing teaching and learning through educational data mining and learning analytics.  
  https://files.eric.ed.gov/fulltext/ED611199.pdf

Implicação P0:

```txt
Não criar Student Model completo agora.
Criar contrato de eventos agora, porque sem dados limpos P1/P2 vira chute.
```

#### Self-regulated learning

SRL envolve cognição, metacognição, comportamento, motivação e afeto. Portanto, `previsao`, `confianca`, `ansiedade`, `cansaco`, `foco` não são enfeites; são sinais de autorregulação e calibração.

Fonte central:

- Panadero, 2017 — A Review of Self-regulated Learning: Six Models and Four Directions.  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC5408091/

Implicação P0:

```txt
O evento de aprendizagem precisa preservar previsão/acerto/confiança/cansaço/foco.
Esses sinais não devem ficar espalhados em campos inconsistentes.
```

#### Cognitive Load Theory e clinical reasoning

Cognitive Load Theory orienta reduzir carga extrínseca e graduar complexidade; illness scripts ajudam a organizar raciocínio clínico. Isso afeta o Mentor: quando há sobrecarga, ele deve reduzir frente nova; quando há estabilidade, pode recomendar casos clínicos/contrastes.

Fontes centrais:

- Cognitive Load Theory: implications for medical education — AMEE Guide.  
  https://cris.maastrichtuniversity.nl/ws/files/73014084/merrienboer_2014_cognitive_load_theory_implications.pdf
- Using cognitive load theory to tailor clinical reasoning training.  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC11498955/
- Lubarsky et al., 2015 — Using script theory to cultivate illness script formation.  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4795084/
- Xu et al., 2021 — Methods to improve diagnostic reasoning in undergraduate medical education.  
  https://pmc.ncbi.nlm.nih.gov/articles/PMC8390726/

Implicação P0:

```txt
O Mentor deve decidir com regra de segurança: fila instável/sobrecarga antes; caso clínico quando fila estiver estável.
```

---

## 2. Diagnóstico técnico do P0 real

### 2.1 O que o documento anterior já cobre

O arquivo anterior cobre:

```txt
- D0→D1 fixo.
- D1→D4 adaptativo em 2–5 dias.
- D4→D7 adaptativo em 2–6 dias.
- D7→D21 adaptativo em 10–21 dias.
- Interleaving em D21/manutenção.
- Fallback: vencidos → próximos → maduros → interno.
- Persistência leve de interleaved/status/candidateIds.
- Não marcar candidatos como revisados.
```

Isso é correto e deve permanecer.

### 2.2 O que ficou faltando para P0 completo

Faltou o coração arquitetural:

```txt
- transformar mentorDecisionPolicy em núcleo único de próxima ação;
- impedir buildActionCandidatesFromState de gerar uma política paralela;
- fazer ActionInbox consumir a decisão do mentor em vez de competir com ela;
- criar contrato de learningEvent para todos os módulos relevantes;
- separar “evento observacional” de “evento que impacta agenda”;
- proteger métricas/copy de promessas indevidas, especialmente readiness e TRI.
```

---

## 3. P0-A — Decision Core único

### 3.1 Problema

Hoje existem pelo menos dois motores de decisão:

```txt
1. src/core/mentorDecisionPolicy.js
   - decideMentorAction
   - buildMentorTodayPlan
   - lógica mais limpa, explícita e explicável

2. src/core/store.js
   - buildActionCandidatesFromState
   - gera candidatos para ActionInbox diretamente no store
   - duplica prioridades de revisão, ENAMED, domínio prévio etc.
```

Além disso, Dashboard usa diagnóstico legado:

```txt
src/components/Dashboard.jsx importa getMentorDiagnosis de src/core/mentor.js
src/components/StatsPanel.jsx também usa getMentorDiagnosis
```

Isso cria três superfícies:

```txt
- diagnóstico legado;
- decisão v2;
- action inbox paralelo.
```

### 3.2 Decisão P0

A política P0 é:

```txt
mentorDecisionPolicy é a fonte de verdade.
ActionInbox vira renderização/adaptação da decisão.
Dashboard não decide; Dashboard exibe.
Store não cria regra pedagógica nova; Store chama/adapta decisionCore.
```

### 3.3 O que implementar

Criar arquivo:

```txt
src/core/decisionCore.js
```

Responsabilidade:

```txt
- receber estado bruto mínimo;
- montar contexto com buildMentorContext;
- chamar decideMentorAction e buildMentorTodayPlan;
- devolver objeto único: primaryAction, todayPlan, inboxActions, diagnosticsLite.
```

Interface sugerida:

```js
export function buildDecisionCoreSnapshot(state = {}, options = {}) {
  return {
    today,
    context,
    primaryAction,
    todayPlan,
    inboxActions,
    diagnosticsLite,
    warnings,
  };
}
```

### 3.4 Regras de prioridade P0

A ordem deve ser a do `mentorDecisionPolicy`, não a do store:

```txt
1. inconsistência de dados de revisão;
2. sobrecarga/carga cognitiva;
3. relearning;
4. revisões vencidas;
5. revisões de hoje;
6. análise de simulado pendente;
7. erro dominante corrigível;
8. gargalo ENAMED/área crítica;
9. caso clínico/raciocínio;
10. tema novo;
11. manutenção leve/descanso.
```

Essa ordem combina:

```txt
- retrieval/spacing: revisão vencida antes de conteúdo novo;
- CLT: sobrecarga bloqueia expansão;
- deliberate practice: erro dominante gera tarefa corretiva;
- clinical reasoning: caso clínico entra quando há estabilidade mínima.
```

### 3.5 O que NÃO fazer

```txt
- Não apagar ActionInbox.
- Não apagar getMentorDiagnosis neste bloco.
- Não refatorar Dashboard inteiro.
- Não criar IA conversacional.
- Não inventar recomendação por LLM.
- Não mudar visual global.
```

P0 é adaptação, não cirurgia estética.

### 3.6 Implementação mastigada para Gemini

#### Passo 1 — criar adapter de ação

Criar em `src/core/decisionCore.js`:

```js
import { buildMentorContext } from "./mentorSignals";
import { decideMentorAction, buildMentorTodayPlan } from "./mentorDecisionPolicy";
import { createAction, buildActionInbox } from "./actionInbox";
import { todayStr } from "./fsrs";

function mentorActionToInboxAction(action = {}, today = todayStr()) {
  if (!action || !action.title) return null;
  return createAction({
    id: action.id,
    type: action.type || "mentor",
    title: action.title,
    reason: action.reason || action.subtitle || "Direcionamento do Mentor.",
    priority: action.priority || 80,
    source: action.source || "mentor-v2",
    dueDate: today,
    target: action.target || {},
  });
}

export function buildDecisionCoreSnapshot(state = {}, options = {}) {
  const today = options.today || todayStr();
  const plat = state.plat || "res";
  const temas = state[plat]?.temas || [];

  const context = buildMentorContext({
    temas,
    plat,
    meta: state.meta || {},
    temaStats: state.temaStats || {},
    enamedAnalises: state.enamedAnalises || [],
    sessionReflections: state.sessionReflections || [],
    calendarProvider: state.calendarProvider || {},
  });

  const primaryAction = decideMentorAction(context);
  const todayPlan = buildMentorTodayPlan(context);
  const primaryInboxAction = mentorActionToInboxAction(primaryAction, today);

  const planActions = Array.isArray(todayPlan?.actions)
    ? todayPlan.actions.map((a) => mentorActionToInboxAction(a, today)).filter(Boolean)
    : [];

  const inboxActions = [primaryInboxAction, ...planActions].filter(Boolean);

  return {
    today,
    plat,
    context,
    primaryAction,
    todayPlan,
    inboxActions,
    diagnosticsLite: {
      safety: primaryAction?.safety || "ok",
      decisionType: primaryAction?.type || "none",
      priority: primaryAction?.priority || 0,
      confidence: primaryAction?.confidence || null,
    },
    warnings: [],
  };
}

export function buildActionInboxFromDecisionCore(state = {}, options = {}) {
  const snapshot = buildDecisionCoreSnapshot(state, options);
  return buildActionInbox({
    today: snapshot.today,
    actions: snapshot.inboxActions,
    actionInboxState: state.actionInboxState,
  });
}
```

Atenção: se `buildMentorContext` tiver assinatura diferente no código real, adapte ao mínimo possível. Não reescreva `mentorSignals.js`.

#### Passo 2 — alterar `rebuildActionInboxForToday`

Em `src/core/store.js`, trocar o miolo de `rebuildActionInboxForToday` para chamar `buildActionInboxFromDecisionCore`.

Antes:

```js
const snapshot = buildActionCandidatesFromState(s, today);
...
const nextInbox = buildActionInbox({ actions: snapshot.candidates, ... });
```

Depois:

```js
const nextInbox = buildActionInboxFromDecisionCore(s, { today });
```

Preservar `actionInboxState`.

Se precisar manter metadados de peak mode:

```js
const phase = getPeakPhase({ examDate: s.meta?.dataProva, today });
```

Não use mais `snapshot.candidates` como política principal.

#### Passo 3 — manter função antiga como legado privado

Não apagar `buildActionCandidatesFromState` de imediato. Marcar comentário:

```js
// LEGACY: manter temporariamente para rollback/testes antigos.
// Não usar para gerar a política principal do ActionInbox.
```

#### Passo 4 — testes

Criar:

```txt
src/core/decisionCore.test.js
```

Casos mínimos:

```txt
1. Se há revisão vencida, primaryAction é revisão/revisão vencida.
2. ActionInbox gerado tem a ação do mentor-v2.
3. Não duplica ação de revisão vencida por store + mentor.
4. Se há sobrecarga, sobrecarga vem antes de tema novo.
5. Se há sessionReflection ruim/energia, a decisão respeita descanso/sobrecarga quando o contexto já sinaliza isso.
```

---

## 4. P0-B — Contrato mínimo de Learning Event

### 4.1 Problema

Hoje o MedRev coleta sinais excelentes, mas espalhados:

```txt
- reviewHistory no FSRS;
- steps de revisão;
- temaStats;
- simulados;
- sessionReflections;
- erros/motivosErro;
- previsão/acerto;
- ansiedade/cansaço/confiança/foco;
- raciocínio clínico/casos.
```

Sem contrato único, P1/P2 de Student Model vira gambiarra.

### 4.2 Decisão P0

Criar evento comum, mas sem migração global pesada:

```txt
LearningEvent é append-only, pequeno, tolerante a campos ausentes.
Nem todo LearningEvent mexe na agenda.
```

### 4.3 Schema mínimo

Criar:

```txt
src/core/learningEvent.js
```

Schema lógico:

```js
{
  id: string,
  date: "YYYY-MM-DD",
  timestamp: number,
  source: "review" | "study" | "simulado" | "clinical_case" | "anki_audit" | "session_reflection" | "manual",
  plat: "res" | "vest",
  topicId: string | null,
  topicName: string | null,
  area: string | null,
  stepKey: string | null,
  officialSchedulingImpact: boolean,

  performance: {
    acerto: number | null,
    previsao: number | null,
    questoes: number | null,
    rating: "again" | "hard" | "good" | "easy" | null,
  },

  regulation: {
    confianca: number | null,
    ansiedade: number | null,
    cansaco: number | null,
    foco: number | null,
    tempoMin: number | null,
  },

  errors: {
    motivosErro: string[],
    dominantError: string | null,
  },

  tags: string[],
  meta: object
}
```

### 4.4 Implementação mínima

Criar funções puras:

```js
export function createLearningEvent(input = {}) { ... }
export function appendLearningEvent(events = [], eventInput = {}, limit = 1000) { ... }
export function summarizeLearningEvents(events = []) { ... }
```

Em P0, registrar eventos apenas em:

```txt
- markStep/revisão oficial;
- sessionReflection;
- simulado/análise ENAMED se já houver ponto simples de integração;
- clinical case completion se já houver handler claro.
```

Se o handler de simulado/caso estiver complexo, deixar `TODO P1` documentado. Não sair caçando por todo o app.

### 4.5 Regra crítica

```txt
reviewHistory continua existindo.
LearningEvent não substitui FSRS agora.
LearningEvent é camada analítica para Mentor/Student Model futuro.
```

---

## 5. P0-C — FSRS por blocos + Interleaving

Usar o documento anterior como implementação oficial:

```txt
MEDREV_BLOCO_P0_FSRS_BLOCOS_INTERLEAVING_GEMINI.md
```

Ajuste de posição no roadmap:

```txt
Só aplicar depois de P0-A/P0-D ou junto em branch separada.
```

Motivo:

```txt
Se ActionInbox ainda usar política antiga, ele pode recomendar algo incoerente com a nova agenda FSRS.
```

---

## 6. P0-D — Dashboard e ActionInbox como consumidores, não decisores

### 6.1 Problema

Dashboard importa múltiplas fontes:

```txt
- getMentorDiagnosis de mentor.js;
- getMentorNextAction/getMentorTodayPlan de mentorAutopilot;
- ActionInbox separado;
- readiness separado;
- métricas próprias.
```

Isso é aceitável como transição, mas não como P0 final.

### 6.2 Decisão P0

```txt
Dashboard pode calcular métricas visuais.
Dashboard não deve decidir “o que fazer agora”.
ActionInbox deve exibir decisionCore.
```

### 6.3 Implementação segura

No store, adicionar estado:

```js
decisionSnapshot: null,
```

Adicionar action:

```js
rebuildDecisionSnapshot: () => set((s) => ({
  decisionSnapshot: buildDecisionCoreSnapshot(s),
}))
```

`rebuildActionInboxForToday` pode chamar também:

```js
const decisionSnapshot = buildDecisionCoreSnapshot(s, { today });
const nextInbox = buildActionInbox(...decisionSnapshot.inboxActions...);
return { actionInbox: nextInbox, decisionSnapshot, meta: ... };
```

No Dashboard:

```txt
- usar decisionSnapshot.primaryAction para o comando principal, se já houver área de comando;
- manter getMentorDiagnosis apenas como diagnóstico legado visual, sem controlar CTA principal;
- ActionInbox continua renderizando `state.actionInbox`.
```

Não mexer no layout grande.

---

## 7. P0-E — Readiness, ENAMED/TRI e copy de segurança

### 7.1 Problema

A auditoria registrou que ENARE/ENAMED usa nota TRI, enquanto o app usa readiness/% como proxy. Mesmo que o detalhe de 2026 mude no futuro, a regra de produto continua: **não vender readiness como predição oficial de aprovação**.

### 7.2 Decisão P0

P0 não precisa criar motor TRI.

P0 precisa evitar promessa falsa:

```txt
- readiness atual = proxy interno de preparo;
- não é nota ENAMED;
- não é TRI;
- não é probabilidade de aprovação;
- não substitui simulado/prova.
```

### 7.3 Copy sugerido

Trocar textos agressivos por:

```txt
Preparo estimado do plano
```

Tooltip:

```txt
Estimativa interna baseada em revisões, desempenho registrado e cobertura. Não representa nota TRI oficial nem probabilidade de aprovação.
```

Se houver card com `% de aprovação`, remover ou renomear para:

```txt
Sinal de prontidão
```

### 7.4 Teste/cópia

Adicionar teste de copy se já existir suíte de `copy.test.js`:

```txt
- não deve aparecer “nota TRI estimada” se não houver motor TRI;
- não deve aparecer “probabilidade de aprovação”;
- readiness deve ser descrito como estimativa/proxy.
```

---

## 8. Ordem de execução recomendada

### Branch 1 — P0-A/P0-D Decision Core

Arquivos prováveis:

```txt
src/core/decisionCore.js
src/core/decisionCore.test.js
src/core/store.js
src/components/Dashboard.jsx     # mínimo possível
src/components/ActionInbox.jsx   # idealmente nada ou quase nada
```

Validação:

```bash
npm test -- --watchAll=false --runTestsByPath src/core/mentorDecisionPolicy.test.js src/core/actionInbox.test.js src/core/decisionCore.test.js
npm run check:mojibake
npm run build
```

### Branch 2 — P0-B Learning Event

Arquivos prováveis:

```txt
src/core/learningEvent.js
src/core/learningEvent.test.js
src/core/store.js
src/core/fsrs.js
```

Validação:

```bash
npm test -- --watchAll=false --runTestsByPath src/core/learningEvent.test.js src/core/fsrs.test.js
npm run check:mojibake
npm run build
```

### Branch 3 — P0-C FSRS/interleaving

Usar documento anterior.

Validação:

```bash
npm test -- --watchAll=false --runTestsByPath src/core/fsrs.test.js src/core/interleavingPlanner.test.js
npm run check:mojibake
npm run build
```

### Branch 4 — P0-E copy/readiness

Arquivos prováveis:

```txt
src/core/readiness.js
src/components/Dashboard.jsx
src/core/copy.test.js
```

Validação:

```bash
npm test -- --watchAll=false --runTestsByPath src/core/copy.test.js
npm run check:mojibake
npm run build
```

---

## 9. Critérios de aceite do P0 completo

```txt
[ ] ActionInbox não recebe mais candidatos de uma política paralela do store.
[ ] mentorDecisionPolicy/decisionCore é a fonte principal da próxima ação.
[ ] Dashboard não apresenta CTA principal conflitante com ActionInbox.
[ ] buildActionCandidatesFromState está legado ou removido com segurança.
[ ] LearningEvent existe e registra pelo menos revisões oficiais.
[ ] LearningEvent distingue officialSchedulingImpact true/false.
[ ] reviewHistory continua funcionando e alimentando FSRS.
[ ] FSRS inicial por blocos usa bandas adaptativas, não intervalos totalmente livres.
[ ] Interleaving tem fallback e não marca candidatos como revisados.
[ ] Readiness é descrito como proxy interno, não TRI/aprovação.
[ ] Testes de fsrs, actionInbox, mentorDecisionPolicy e decisionCore passam.
[ ] npm run check:mojibake passa.
[ ] npm run build passa.
```

---

## 10. O que NÃO entra em P0

```txt
- BKT completo.
- Digital Twin completo.
- Otimizador FSRS personalizado por usuário.
- TRI real.
- IA conversacional.
- Refatorar Dashboard inteiro.
- Remover mentor.js inteiro.
- Migrar todos os dados históricos.
- Criar banco de questões.
- Criar caso clínico em massa.
- Redesenhar UI premium.
```

Esses itens podem ser P1/P2, mas se entrarem agora vão destruir o foco.

---

## 11. Prompt único para Gemini 3.5 Flash implementar P0-A/P0-D

```txt
Você é um engenheiro executor conservador trabalhando no MedRev. Implemente SOMENTE o P0-A/P0-D: criar um decisionCore único e fazer ActionInbox/Store consumirem a decisão do mentor v2, sem refatoração ampla de UI.

Contexto:
- Hoje há duas políticas de próxima ação: buildActionCandidatesFromState no store e mentorDecisionPolicy.
- A fonte de verdade deve ser mentorDecisionPolicy.
- ActionInbox deve renderizar ações derivadas do decisionCore, não uma política paralela.
- Dashboard pode continuar exibindo métricas e diagnóstico legado, mas CTA principal/ActionInbox não devem conflitar.

Tarefas:
1. Criar src/core/decisionCore.js com:
   - buildDecisionCoreSnapshot(state, options)
   - buildActionInboxFromDecisionCore(state, options)
   - adapter mentorActionToInboxAction
2. Usar buildMentorContext + decideMentorAction + buildMentorTodayPlan.
3. Alterar rebuildActionInboxForToday em src/core/store.js para usar decisionCore.
4. Preservar actionInboxState: done/dismissed/accepted.
5. Não apagar buildActionCandidatesFromState; marcar como LEGACY se não for mais usado.
6. Criar src/core/decisionCore.test.js.

Testes mínimos:
- revisão vencida gera ação primária de revisão;
- sobrecarga tem prioridade sobre tema novo;
- ActionInbox gerado contém fonte mentor-v2;
- não duplica ação de revisão por política do store;
- mantém accepted/dismissed/done do actionInboxState.

Proibições:
- Não refatorar Dashboard inteiro.
- Não alterar visual premium.
- Não mexer em FSRS neste bloco.
- Não criar IA conversacional.
- Não instalar dependências.
- Não migrar dados antigos.

Validação obrigatória:
- npm test -- --watchAll=false --runTestsByPath src/core/mentorDecisionPolicy.test.js src/core/actionInbox.test.js src/core/decisionCore.test.js
- npm run check:mojibake
- npm run build

Ao final, entregue relatório com arquivos alterados, testes, comandos executados e riscos remanescentes.
```

---

## 12. Prompt único para Gemini 3.5 Flash implementar P0-B

```txt
Você é um engenheiro executor conservador trabalhando no MedRev. Implemente SOMENTE o P0-B: contrato mínimo de LearningEvent, sem substituir reviewHistory e sem alterar o algoritmo FSRS.

Objetivo:
Criar uma camada append-only de eventos de aprendizagem que permita Student Model futuro sem quebrar o app atual.

Tarefas:
1. Criar src/core/learningEvent.js com:
   - createLearningEvent(input)
   - appendLearningEvent(events, input, limit)
   - summarizeLearningEvents(events)
2. Criar src/core/learningEvent.test.js.
3. Integrar em markStep para registrar um evento source='review' quando uma revisão oficial for concluída.
4. O evento deve preservar:
   - topicId/topicName/area/plat/stepKey/date/timestamp
   - officialSchedulingImpact=true
   - acerto/previsao/questoes/rating
   - confianca/ansiedade/cansaco/foco/tempoMin
   - motivosErro/dominantError quando disponíveis
5. Não substituir reviewHistory.
6. Limitar lista a 1000 eventos.

Proibições:
- Não criar BKT.
- Não criar Digital Twin.
- Não alterar FSRS.
- Não migrar todos os eventos antigos.
- Não alterar UI.
- Não instalar dependências.

Validação obrigatória:
- npm test -- --watchAll=false --runTestsByPath src/core/learningEvent.test.js src/core/fsrs.test.js
- npm run check:mojibake
- npm run build

Ao final, entregue relatório com arquivos alterados, testes, comandos executados e riscos remanescentes.
```

---

## 13. Conclusão operacional

O P0 completo não é “colocar mais inteligência”.

O P0 completo é:

```txt
fazer a inteligência existente parar de se contradizer.
```

A sequência certa:

```txt
1. DecisionCore único.
2. LearningEvent mínimo.
3. FSRS por blocos + interleaving.
4. Readiness/copy honesta.
```

Depois disso, P1 pode começar de forma séria:

```txt
- Student Model interpretável;
- calibração previsão vs acerto;
- personalização por perfil;
- FSRS optimizer por usuário;
- motor de raciocínio clínico conectado ao cronograma;
- progress testing e TRI/proxy mais robusto.
```

Sem esse P0, qualquer P1 vira mais uma camada em cima da entropia.
