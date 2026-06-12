# MEDREV — BLOCO H: Auditoria CEO Sênior + Features Complementares de Alto ROI

> **Executor:** Claude Code / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `very high`  
> **Modo:** agent, com aprovação manual para comandos destrutivos.  
> **Objetivo:** auditar profundamente o produto como CEO/CTO sênior e implementar um conjunto enxuto de features complementares que aumentam retenção, clareza e resultado sem transformar o MedRev em banco de questões.

---

## 0. Tese estratégica

O MedRev não deve competir de frente com MedEvo, Estratégia, UWorld, AMBOSS ou outros bancos de questões.

Esses produtos já têm ou tendem a ter:

```txt
questões
filtros
simulados
ranking
caderno de questões
comentários
estatísticas por assunto
IA acoplada ao banco
```

O MedRev deve vencer em outro eixo:

```txt
decidir o que estudar
reduzir atrito
integrar cronogramas externos
corrigir falsa confiança
transformar erro em plano
revisar no tempo certo
treinar raciocínio clínico
dar fechamento metacognitivo
manter o aluno executando sem colapsar em complexidade
```

Em termos de posicionamento:

```txt
Banco de questões = onde o aluno treina.
MedRev = sistema operacional de preparação médica.
```

Este bloco deve aproveitar features já existentes e criar as que faltam para o app virar camada complementar indispensável.

---

## 1. Princípios de ciência da aprendizagem e produto

Use estes princípios como norte de implementação:

### 1.1 Redução de carga cognitiva

O usuário não deve gastar energia decidindo entre 12 caminhos. O app deve reduzir escolhas e expor apenas a próxima melhor ação.

Regras práticas:

- Uma ação principal por tela.
- Explicação curta do porquê.
- Métricas avançadas escondidas, mas acessíveis.
- Nada de dashboard que o aluno precisa interpretar sozinho.

### 1.2 Retrieval + spacing + feedback

Todo estudo deve tender para:

```txt
recuperar da memória
receber feedback
classificar erro
agendar reencontro
```

Não basta “marcar como feito”.

### 1.3 Metacognição sem fricção

O aluno precisa refletir, mas não pode escrever diário toda hora.

Usar micro-reflexões:

```txt
1 clique
1 escolha
1 frase opcional
```

### 1.4 Complementaridade com bancos de questões

Não construir QBank próprio agora.

Em vez disso, criar pontes:

```txt
“Cole seu resultado”
“Importe erros por tema”
“Transforme erros externos em revisões”
“Conecte erro a tema/caso/flashcard”
```

### 1.5 Produto precisa ser tolerante a baixa energia

Estudante de medicina/residência vive cansaço, ansiedade e excesso de carga. O app precisa ter:

```txt
modo normal
modo mentor
modo energia baixa
modo reta final
```

---

## 2. Auditoria obrigatória antes de implementar

Antes de qualquer patch, rode:

```bash
git status --short
npm run check:mojibake
```

Depois audite o código com buscas:

```bash
grep -R "TODO\|FIXME\|placeholder\|em breve\|coming soon\|coletando\|beta" -n src || true
grep -R "modoSimples\|mentor\|exaust\|cansa\|burnout\|energia" -n src || true
grep -R "erro\|wrapp\|prova\|simulado\|analise\|análise" -n src || true
grep -R "exportar\|backup\|importar\|localStorage" -n src || true
grep -R "gamif\|streak\|conquista\|ranking" -n src || true
grep -R "dominioPrevio\|Já domino\|validacao" -n src || true
grep -R "casosProgresso\|raciocinio\|illness" -n src || true
grep -R "cronogramas\|calendarProvider\|provider" -n src || true
grep -R "onClick={() => {}}\|onClick={null}\|disabled" -n src/components || true
```

PowerShell equivalente:

```powershell
Select-String -Path "src\**\*" -Pattern "TODO","FIXME","placeholder","em breve","coletando","modoSimples","mentor","exaust","cansa","erro","prova","simulado","exportar","backup","importar","localStorage","gamif","streak","dominioPrevio","casosProgresso","raciocinio","cronogramas","calendarProvider","onClick" -CaseSensitive:$false
```

Produza internamente uma lista de:

```txt
features existentes subaproveitadas
botões sem função real
métricas que não alimentam ação
dados no store sem UI
UI sem persistência
persistência sem UI
componentes duplicados
```

Não responda no chat; implemente com base nessa auditoria.

---

## 3. Escopo do Bloco H

Este bloco implementa **features complementares de alto ROI**, não uma reformulação infinita.

Criar:

```txt
src/core/errorTaxonomy.js                 [NOVO]
src/core/errorTaxonomy.test.js            [NOVO]
src/core/actionInbox.js                   [NOVO]
src/core/actionInbox.test.js              [NOVO]
src/core/sessionReflection.js             [NOVO]
src/core/sessionReflection.test.js        [NOVO]
src/core/peakMode.js                      [NOVO]
src/core/peakMode.test.js                 [NOVO]
src/components/ActionInbox.jsx            [NOVO]
src/components/SessionClosureModal.jsx    [NOVO]
src/components/WeeklyReview.jsx           [NOVO]
src/components/DataSafetyPanel.jsx        [NOVO]
```

Patch:

```txt
src/core/store.js
src/core/mentorAutopilot.js
src/core/provaAnalyzer.js
src/components/Dashboard.jsx
src/components/StatsPanel.jsx
src/components/FocusMode.jsx
src/components/EnamedProvaAnalyzer.jsx
src/components/RaciocinioClinico.jsx      [mínimo]
```

Não implementar:

```txt
banco de questões próprio
ranking social
feed social
chat médico livre para diagnóstico real
OCR/PDF parser pesado
importador automático de plataforma externa fechada
IA que responde questão por imagem
gamificação pesada nova
```

---

## 4. Feature H1 — Taxonomia unificada de erros

### 4.1 Por quê

O aluno erra por motivos diferentes. “Errei Cardiologia” é pouco útil.

O app precisa separar:

```txt
não sabia o conteúdo
sabia, mas não reconheceu o padrão
errou interpretação do enunciado
caiu em pegadinha
errou por tempo
chutou
acertou sem confiança
alta confiança e erro
```

Isso alimenta:

- análise ENAMED;
- Mentor;
- revisão FSRS;
- raciocínio clínico;
- fechamento de sessão;
- plano semanal.

### 4.2 Criar `src/core/errorTaxonomy.js`

```js
export const ERROR_TYPE = {
  CONTENT: "conteudo",
  REASONING: "raciocinio",
  INTERPRETATION: "interpretacao",
  DISTRACTION: "distracao",
  TIME: "tempo",
  GUESS: "chute",
  CONFIDENCE_MISMATCH: "confianca_mal_calibrada",
  MEMORY: "memoria",
};

export const ERROR_TYPE_LABEL = {
  [ERROR_TYPE.CONTENT]: "Conteúdo",
  [ERROR_TYPE.REASONING]: "Raciocínio",
  [ERROR_TYPE.INTERPRETATION]: "Interpretação",
  [ERROR_TYPE.DISTRACTION]: "Distração",
  [ERROR_TYPE.TIME]: "Tempo",
  [ERROR_TYPE.GUESS]: "Chute",
  [ERROR_TYPE.CONFIDENCE_MISMATCH]: "Confiança mal calibrada",
  [ERROR_TYPE.MEMORY]: "Memória",
};

export function classifyError(input = {}) {
  const acertou = Boolean(input.acertou);
  const confianca = input.confianca || null;
  const tipoErro = input.tipoErro || null;
  const tempoExcedido = Boolean(input.tempoExcedido);

  if (acertou && confianca === "baixa") return ERROR_TYPE.GUESS;
  if (!acertou && confianca === "alta") return ERROR_TYPE.CONFIDENCE_MISMATCH;
  if (tempoExcedido) return ERROR_TYPE.TIME;
  if (tipoErro) return tipoErro;
  if (!acertou) return ERROR_TYPE.CONTENT;
  return null;
}

export function errorSeverity(error = {}) {
  if (!error) return 0;
  if (error.tipo === ERROR_TYPE.CONFIDENCE_MISMATCH) return 100;
  if (error.tipo === ERROR_TYPE.REASONING) return 90;
  if (error.tipo === ERROR_TYPE.CONTENT) return 75;
  if (error.tipo === ERROR_TYPE.INTERPRETATION) return 65;
  if (error.tipo === ERROR_TYPE.TIME) return 55;
  if (error.tipo === ERROR_TYPE.DISTRACTION) return 45;
  if (error.tipo === ERROR_TYPE.GUESS) return 40;
  return 50;
}

export function summarizeErrors(errors = []) {
  const out = {};
  for (const e of errors) {
    const tipo = e.tipo || classifyError(e) || "outro";
    out[tipo] = (out[tipo] || 0) + 1;
  }
  return out;
}

export function dominantErrorType(errors = []) {
  const summary = summarizeErrors(errors);
  return Object.entries(summary).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}
```

### 4.3 Integrar com `provaAnalyzer.js`

Se F1 já criou `provaAnalyzer`, substituir classificação local por `errorTaxonomy`.

### 4.4 Testes

Criar `errorTaxonomy.test.js`:

- alta confiança + erro → confiança mal calibrada;
- acertou com baixa confiança → chute;
- tempo excedido → tempo;
- agrupa erros;
- identifica tipo dominante.

---

## 5. Feature H2 — Action Inbox: fila única de recomendações

### 5.1 Por quê

Hoje o app pode gerar recomendações de muitos lugares:

```txt
ENAMED
Mentor
Raciocínio Clínico
Cronograma
Já domino
Anki
Carga futura
Prova/simulado
```

Se cada lugar mostrar seu próprio CTA, o aluno volta ao caos.

Criar uma fila única:

```txt
Caixa de Ações
- Revisar SCA hoje
- Validar domínio de Bronquiolite
- Fazer caso de Pré-eclâmpsia
- Analisar simulado ENAMED
```

O Mentor escolhe a principal. A Inbox guarda o resto.

### 5.2 Criar `src/core/actionInbox.js`

Schema:

```js
{
  id: "act_...",
  type: "review" | "new_topic" | "clinical_case" | "exam_analysis" | "domain_validation" | "anki" | "rest",
  title: "Revisar Síndromes Hipertensivas",
  reason: "Alta incidência + erro em prova + baixa cobertura",
  priority: 92,
  source: "mentor" | "enamed" | "raciocinio" | "cronograma" | "manual",
  status: "open" | "accepted" | "dismissed" | "done",
  createdAt: "YYYY-MM-DD",
  dueDate: "YYYY-MM-DD",
  target: {},
}
```

Funções:

```js
export function createAction(input = {}) {}

export function dedupeActions(actions = []) {}

export function sortActions(actions = []) {}

export function buildActionInbox(context = {}) {}

export function pickPrimaryAction(actions = []) {}

export function actionNeedsAttention(action = {}, today) {}
```

Regras:

- Deduplicar por `type + target.tema + target.area + dueDate`.
- Ação vencida sobe prioridade.
- Ações de descanso/sobrecarga podem ganhar prioridade máxima.
- Não criar ação duplicada a cada render.

### 5.3 Store

Adicionar em `meta` ou `s[plat]`:

```js
actionInbox: []
```

Actions:

```js
upsertAction(action)
markActionDone(actionId)
dismissAction(actionId)
acceptAction(actionId)
rebuildActionInboxForToday()
```

Se `actionInbox` for derivável, não precisa persistir tudo. Persistir apenas status do usuário:

```js
actionInboxState: {
  dismissed: {},
  accepted: {},
  done: {}
}
```

Preferência: persistir status, gerar ações derivadas.

### 5.4 UI — `ActionInbox.jsx`

Mostrar no Dashboard:

```txt
Caixa de Ações
[ação principal]
[outras 2 ações]
Ver tudo
```

No Modo Mentor:

- mostrar apenas 1 principal + 2 próximas.
- resto em colapso.

No Modo Manual:

- mostrar lista completa.

---

## 6. Feature H3 — Fechamento de sessão / Exam wrapper leve

### 6.1 Por quê

Exam wrappers e reflexão estruturada ajudam o aluno a transformar resultado em ajuste de estratégia. Mas o app não pode pedir ensaio.

Criar micro-fechamento ao fim de sessão de estudo, prova ou caso.

### 6.2 Criar `src/core/sessionReflection.js`

Schema:

```js
{
  id: "ref_...",
  date: "YYYY-MM-DD",
  source: "focus" | "prova" | "raciocinio" | "cronograma",
  tema: "Apendicite Aguda",
  area: "Cirurgia",
  outcome: "bom" | "medio" | "ruim",
  mainIssue: "conteudo" | "raciocinio" | "tempo" | "energia" | "distracao" | "nenhum",
  confidence: "baixa" | "media" | "alta",
  nextAdjustment: "revisar" | "questoes" | "caso" | "anki" | "descanso" | "manter",
  note: "",
}
```

Funções:

```js
export function createSessionReflection(input = {}) {}

export function summarizeReflections(reflections = [], days = 7) {}

export function suggestAdjustmentFromReflection(reflection = {}) {}

export function reflectionToAction(reflection = {}) {}
```

### 6.3 UI — `SessionClosureModal.jsx`

Após terminar Modo Foco, caso clínico ou análise de prova, abrir modal curto:

```txt
Fechamento rápido

Como foi?
[Bom] [Médio] [Ruim]

O que mais atrapalhou?
[Conteúdo] [Raciocínio] [Tempo] [Distração] [Energia] [Nada]

Próximo ajuste:
[Revisar] [Questões externas] [Caso clínico] [Anki] [Descanso] [Manter]

Nota opcional:
[________]

[Salvar]
[Pular]
```

Regras:

- Pode pular.
- Não bloquear fluxo.
- Se salvo, alimenta Action Inbox e Mentor.
- Não virar diário pesado.

### 6.4 Integrar com `FocusMode.jsx`

Ao finalizar sessão, chamar `SessionClosureModal`.

Se FocusMode já tem fluxo final, adicionar modal como etapa opcional.

### 6.5 Integrar com `RaciocinioClinico.jsx`

Após feedback final do caso, oferecer:

```txt
Salvar fechamento rápido
```

Não duplicar se ficar pesado.

---

## 7. Feature H4 — Weekly Review / Revisão executiva da semana

### 7.1 Por quê

O app precisa de um ritual semanal para ajustar rota sem depender de motivação.

Criar `WeeklyReview.jsx`.

### 7.2 UI

Mostrar aos domingos ou quando usuário clicar:

```txt
Revisão da Semana

1. O que você executou
- sessões concluídas
- revisões feitas
- casos clínicos
- prova/simulado analisado

2. O que travou
- carga alta
- baixa energia
- erros recorrentes
- área mais fraca

3. Plano da próxima semana
- 3 prioridades
- 1 tema novo
- 1 revisão crítica
- 1 caso clínico
```

Botões:

```txt
Aceitar plano
Ajustar manualmente
Pular
```

### 7.3 Core

Pode usar `actionInbox`, `mentorAutopilot`, `provaAnalyzer`, `sessionReflection`.

Funções opcionais em `sessionReflection.js`:

```js
export function buildWeeklyReview(context = {}) {}
```

### 7.4 Store

Salvar:

```js
weeklyReviews: []
```

Não precisa ser complexo.

---

## 8. Feature H5 — Peak Mode / Reta Final

### 8.1 Por quê

Quando a prova se aproxima, o comportamento ideal muda:

- menos tema novo;
- mais revisão;
- mais simulado/análise;
- foco em erros;
- redução de carga nova;
- revisão de alta incidência.

### 8.2 Criar `src/core/peakMode.js`

Funções:

```js
export function diasAteProva(examDate, today) {}

export function getPeakPhase({ examDate, today }) {
  // "base" | "aproximacao" | "reta_final" | "vespera"
}

export function getPeakModePolicy(phase) {}

export function adjustActionForPeakMode(action, policy) {}

export function shouldLimitNewTopics({ phase, backlog, coverage }) {}
```

Política:

```js
base:
  allowNewTopics: true
  maxNewTopicsPerWeek: null

aproximacao (<=60 dias):
  allowNewTopics: true
  maxNewTopicsPerWeek: 4
  reviewBias: +10

reta_final (<=21 dias):
  allowNewTopics: limited
  maxNewTopicsPerWeek: 1
  reviewBias: +25
  examAnalysisBias: +25

vespera (<=3 dias):
  allowNewTopics: false
  reviewBias: +40
  restBias: +30
```

Integrar com Mentor:

- Tema novo só se política permitir.
- Priorizar revisão/erros/simulados perto da prova.

---

## 9. Feature H6 — Data Safety Panel / Segurança dos dados locais

### 9.1 Por quê

O usuário já teve dor com encoding/mojibake e perda de coisas. Produto sério precisa de backup.

Criar `DataSafetyPanel.jsx` em Configurações/Estatísticas avançadas.

Funções:

```txt
Exportar backup JSON
Importar backup JSON
Validar integridade local
Ver tamanho do armazenamento
Limpar caches temporários
```

### 9.2 Regras

- Nunca importar sem confirmação.
- Mostrar preview do backup.
- Não sobrescrever sem aviso.
- Gerar arquivo com data.

### 9.3 Store/core

Se já houver exportação, reaproveitar.

Funções utilitárias:

```js
export function exportMedrevBackup(state) {}

export function validateMedrevBackup(backup) {}

export function importMedrevBackup(backup, options) {}
```

Pode ficar em `src/core/backup.js` se necessário.

---

## 10. Integração com Dashboard / Stats

### 10.1 Dashboard

Adicionar sem poluir:

```txt
Comando do Dia
[ação principal do Mentor]

Caixa de Ações
- 2 próximas ações

Fechamento
- se sessão recente sem reflection: "Fechar sessão anterior"

Reta final
- se <=60 dias da prova: badge discreto e política ativa
```

### 10.2 Stats

Adicionar seções:

```txt
Padrão de erros
- tipo dominante
- alta confiança + erro
- erro por tempo
- erro por raciocínio

Revisão Semanal
- últimas revisões executivas
- ajustes aceitos

Segurança dos dados
- exportar backup
```

Não criar mais 10 KPIs no topo.

---

## 11. Features existentes que devem ser aproveitadas

Durante a auditoria, procure e conecte:

```txt
modoSimples / Modo Mentor
guardrail de exaustão
mentor diagnosis
gamificação/streak
domínio prévio
casosProgresso
provasEnamed
cronogramas
calendarProvider
trueRetention/coletando
Anki/adherence
exportar cartão/dashboard
```

Regra:

- Se já existe dado sem UI, dar UI mínima.
- Se já existe UI sem dado, conectar ao dado real.
- Se já existe função duplicada, consolidar.

---

## 12. Features explicitamente adiadas

Não implementar agora, mas deixar em `docs/ROADMAP_CEO.md` se fizer sentido:

```txt
1. Integração real com APIs de bancos de questões.
2. OCR/importação automática de prints de questão.
3. IA que comenta questões específicas.
4. Comunidade/ranking social.
5. Marketplace de cronogramas.
6. App mobile nativo.
7. Sincronização multi-dispositivo complexa.
8. Recomendador baseado em modelo ML real.
9. Geração automática massiva de casos clínicos.
10. Chat clínico livre para decisão assistencial.
```

Motivo: alto risco, custo alto ou desvio do posicionamento complementar.

---

## 13. Testes obrigatórios

Criar testes:

```txt
src/core/errorTaxonomy.test.js
src/core/actionInbox.test.js
src/core/sessionReflection.test.js
src/core/peakMode.test.js
```

Cobrir:

### errorTaxonomy

- erro com alta confiança vira confiança mal calibrada;
- acerto com baixa confiança vira chute;
- tempo excedido vira tempo;
- dominante é calculado.

### actionInbox

- deduplica ações;
- ordena por prioridade;
- ação vencida sobe;
- escolhe ação principal;
- status dismiss/done remove da fila.

### sessionReflection

- cria reflection válida;
- sumariza últimos 7 dias;
- gera ação recomendada a partir do problema.

### peakMode

- calcula dias até prova;
- fase base/aproximação/reta final/véspera;
- limita tema novo na reta final;
- aumenta prioridade de revisão.

---

## 14. Teste manual

Validar:

1. Finalizar sessão de foco.
2. Modal de fechamento aparece.
3. Salvar reflection.
4. Ver ação derivada na Caixa de Ações.
5. Cadastrar/analisar prova com tipo de erro.
6. Ver Padrão de Erros em Stats.
7. Ver Action Inbox no Dashboard.
8. Marcar ação como feita.
9. Dispensar ação.
10. Simular prova a <=21 dias.
11. Confirmar Peak Mode reduz tema novo.
12. Exportar backup JSON.
13. Validar integridade local.
14. Importar backup com preview.
15. Build final passa.

---

## 15. Comandos finais

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
git status --short
```

Não rodar:

```bash
git commit
firebase deploy
git push
```

---

## 16. Critérios de aceite

Bloco H aprovado se:

- Existe taxonomia unificada de erros.
- Análise ENAMED usa essa taxonomia.
- Existe Action Inbox derivada das recomendações.
- Dashboard mostra ação principal + próximas ações sem poluir.
- Fechamento de sessão existe e é pulável.
- Weekly Review existe ou, se ficar grande, pelo menos core + placeholder funcional real.
- Peak Mode altera recomendações perto da prova.
- Data Safety Panel exporta backup JSON.
- Features existentes subaproveitadas foram conectadas ou documentadas.
- Nenhuma feature nova tenta virar banco de questões.
- Testes passam.
- Build passa.

---

## 17. Nota CEO ao executor

Não faça feature por vaidade.

Prioridade real:

```txt
1. O aluno abre o app e sabe o que fazer.
2. O app transforma erro externo em ação interna.
3. O app protege contra falsa confiança.
4. O app reduz carga mental.
5. O app preserva dados e confiança.
```

Se uma mudança não melhora um desses cinco pontos, não implemente neste bloco.
