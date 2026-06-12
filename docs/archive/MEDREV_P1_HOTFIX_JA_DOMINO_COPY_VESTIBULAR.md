# MEDREV — P1-HOTFIX: “Já domino” funcional, Português consistente e Trilha inicial do Vestibular

> **Executor recomendado:** `gpt-5.3-codex` ou Sonnet  
> **Reasoning effort:** `high`  
> **Modo:** agent com aprovação manual  
> **Prioridade:** antes de P2/P3/P4  
> **Objetivo:** corrigir três falhas de experiência que quebram confiança do usuário:  
> 1. “Já domino” não altera nada visível após registro;  
> 2. textos/português ruins nas implementações;  
> 3. Vestibular não tem trilha clara de início.

---

## 0. Por que este hotfix vem antes do P2/P3/P4

A auditoria P2/P3/P4 confirmou problemas estruturais em Stats, Erros e Raciocínio Clínico, mas estes três problemas são mais urgentes para uso real:

```txt
Usuário clica “Já domino” e nada muda → perde confiança.
Usuário vê português ruim → produto parece amador.
Usuário de Vestibular entra e não sabe começar → abandona antes de usar.
```

Portanto:

```txt
P1-HOTFIX → P2 Stats → P3 Erros → P4 Raciocínio
```

Não continuar com Stats/Erros/Raciocínio antes de corrigir estes fluxos de entrada e confiança.

---

## 1. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Durante:

```txt
Não instalar libs.
Não mexer em Firebase/Auth/localStorage.
Não criar Activity Log.
Não refatorar Stats inteiro.
Não refatorar Mentor inteiro.
Não remover features.
Não fazer commit/deploy/push.
Não listar workspace inteiro.
Não usar ls -R, dir /s, tree, find . ou Get-ChildItem -Recurse.
Manter UTF-8 sem BOM.
Não introduzir mojibake.
```

Usar comandos escopados:

```bash
git grep -n "Já domino\|Ja domino\|dominio\|domínio\|validacao\|validação\|buildRevComDominio\|DOMINIO_PREVIO" -- src
git grep -n "vest\|Vestibular\|simulado\|trilha\|onboarding\|primeiro acesso\|modo mentor" -- src
git grep -n "Prontidão\|prontidao\|True Retention\|coletando\|Analise\|Acao\|Nao\|Voce\|Faca\|calendario" -- src
git grep -n "unstarted\|buildRev\|markStep\|addTema\|updateTema\|saveTema" -- src/core src/components
```

---

# PARTE A — Corrigir “Já domino” end-to-end

## 2. Diagnóstico provável

O usuário registra “Já domino”, mas nada muda visualmente ou funcionalmente.

Causas prováveis:

```txt
1. validação calcula resultado, mas não grava no tema correto;
2. tema continua `unstarted: true`;
3. `rev` não é substituído por `buildRevComDominio`;
4. datas D7/D14 são criadas, mas UI ainda mostra card antigo;
5. store não chama save/update persistente;
6. modal fecha sem toast/feedback;
7. “Já domino” cria tema temporário, mas não vincula ao tema do cronograma;
8. acerto está em 0–1 em um lugar e 0–100 em outro;
9. o cronograma importado/tema provider não tem `temaId` real;
10. Mentor/Fila não enxerga a primeira revisão gerada.
```

## 3. Comportamento esperado do produto

Quando o aluno clica em **Já domino**:

### 3.1 Antes da validação

Mostrar explicação:

```txt
Use se você já estudou este tema antes.
Você fará uma validação curta. Se for bem, o app pula a exposição inicial e agenda uma revisão.
```

Critério:

```txt
mínimo 15 questões
mínimo 80% de acerto
```

### 3.2 Se não validar

Se:

```txt
questões < 15
ou acerto < 80%
```

Resultado:

```txt
não marcar como dominado
manter/iniciar D0 normal
mostrar orientação:
“Melhor iniciar pelo estudo guiado. Este tema ainda não está seguro para pular a exposição inicial.”
```

### 3.3 Se validar 80–89%

Resultado:

```txt
status: validado_previo
unstarted: false
d0.done: true como validação prévia
primeira revisão: D7
não contar como domínio definitivo
não inflar streak
mostrar card:
“Validado. Próxima revisão em D7.”
```

### 3.4 Se validar >=90%

Resultado:

```txt
status: validado_previo
unstarted: false
d0.done: true como validação prévia
primeira revisão: D14
não contar como domínio definitivo
mostrar card:
“Validado com alta segurança. Próxima revisão em D14.”
```

---

## 4. Arquivos prováveis

Auditar e corrigir:

```txt
src/core/domainValidation.js
src/core/store.js
src/core/fsrs.js
src/components/Cronograma.jsx
src/components/Dashboard.jsx
src/components/FocusMode.jsx
src/components/Modals.jsx
src/components/DomainValidationModal.jsx   [se existir]
src/core/domainValidation.test.js           [criar/ajustar]
```

---

## 5. Contrato de dados esperado

Ao validar domínio prévio, o tema deve ficar assim:

```js
{
  id,
  nome,
  esp,
  unstarted: false,
  status: "validado_previo",
  dominioPrevio: {
    validado: true,
    questoes: 15,
    acerto: 0.86,
    validatedAt: "YYYY-MM-DD",
    primeiraRevisao: "d7",
    source: "ja_domino"
  },
  rev: {
    d0: {
      done: true,
      reviewedAt: "YYYY-MM-DD",
      scheduledAt: "YYYY-MM-DD",
      acerto: 0.86,
      questoes: 15,
      source: "dominio_previo"
    },
    d1: {
      done: false,
      date: "YYYY-MM-DD", // D7 ou D14, conforme regra existente
      scheduledAt: "YYYY-MM-DD"
    },
    reviewHistory: [
      {
        stepKey: "d0",
        source: "dominio_previo",
        rating: "good" | "easy",
        acerto: 0.86,
        questoes: 15,
        official: true
      }
    ]
  }
}
```

Se a arquitetura atual usa `buildRevComDominio`, manter compatibilidade, mas garantir que a UI enxergue:

```txt
unstarted: false
próxima revisão visível
histórico mínimo
toast de sucesso
```

---

## 6. Correções obrigatórias

### 6.1 Criar função única de aplicação

Criar/ajustar no core:

```js
export function applyDominioPrevioToTema(tema, resultado, options = {}) {}
```

Ela deve:

```txt
validar questão/acerto;
normalizar acerto 0–1;
criar ou atualizar `rev`;
setar `unstarted: false`;
setar `status: validado_previo`;
registrar `dominioPrevio`;
registrar reviewHistory;
retornar tema atualizado.
```

### 6.2 Store deve usar essa função

No store, criar/ajustar action:

```js
registrarDominioPrevio(plat, temaId, resultado)
```

ou adaptar existente.

Ela deve:

```txt
encontrar tema real por id;
aplicar applyDominioPrevioToTema;
substituir tema no array;
persistir;
rebuildActionInboxForToday se existir;
mostrar toast/evento se mecanismo existir.
```

### 6.3 Tema de provider/importado

Se “Já domino” for clicado em tema ainda não materializado no banco:

```txt
1. criar tema real;
2. aplicar domínio prévio nele;
3. vincular providerTopicId/origem;
4. atualizar UI do cronograma.
```

Não registrar em objeto temporário sem persistir.

### 6.4 UI feedback obrigatório

Após sucesso:

```txt
Tema validado.
Próxima revisão: D7 em DD/MM.
```

ou:

```txt
Tema validado com alta segurança.
Próxima revisão: D14 em DD/MM.
```

Após falha:

```txt
Validação insuficiente.
Comece pelo estudo guiado para proteger sua base.
```

### 6.5 Card deve mudar

O card não pode continuar igual.

Depois de validar, ele deve mostrar:

```txt
Status: Validado previamente
Próxima revisão: D7/D14
Botão: Fazer revisão quando vencer / Ver no plano
```

---

## 7. Testes obrigatórios de “Já domino”

Criar/ajustar:

```txt
src/core/domainValidation.test.js
```

Cobrir:

```js
test("rejects dominio previo with fewer than 15 questions")
test("rejects dominio previo below 80 percent")
test("80 to 89 percent schedules first review at D7")
test("90 percent or more schedules first review at D14")
test("validated topic is no longer unstarted")
test("validated topic receives dominioPrevio metadata")
test("validated topic receives reviewHistory event")
test("acerto can be input as 85 or 0.85")
test("does not mark as mastered/dominado definitivo")
```

Se houver store tests:

```js
test("registrarDominioPrevio updates the real topic in store")
test("registrarDominioPrevio works for provider/imported topic")
```

---

# PARTE B — Corrigir português e copy do produto

## 8. Problema

As implementações estão com português ruim, sem acento, termos mistos e inconsistência de linguagem.

Isso destrói confiança.

Exemplos a procurar:

```txt
Analise → Análise
Acao → Ação
Nao → Não
Voce → Você
Faca → Faça
calendario → calendário
validacao → validação
dominio → domínio
Prontidão → Preparo estimado
True Retention → Retenção longa
Modo Simples → Modo Mentor
Crono → Plano
Dashboard → Hoje
```

## 9. Criar glossário central

Criar:

```txt
src/core/copy.js
src/core/copy.test.js
docs/COPY_GUIDE_PT_BR.md
```

### 9.1 `copy.js`

Exportar labels principais:

```js
export const COPY = {
  views: {
    dash: "Hoje",
    crono: "Plano",
    sims: "Estudar",
    stats: "Estatísticas",
    banco: "Banco",
    more: "Mais",
  },
  metrics: {
    readiness: "Preparo estimado",
    trueRetention: "Retenção longa",
    workload: "Carga de hoje",
  },
  actions: {
    startNow: "Começar agora",
    seeWhy: "Ver por quê",
    configurePlan: "Configurar plano",
    jaDomino: "Já domino",
  },
};
```

### 9.2 `COPY_GUIDE_PT_BR.md`

Definir padrão:

```txt
Dashboard → Hoje
Cronograma → Plano
Simulados → Estudar quando for navegação
Prontidão → Preparo estimado
True Retention → Retenção longa
Modo Simples → Modo Mentor
Coletando D21+ → Coletando revisões longas
```

## 10. Correção por busca

Corrigir textos visíveis em:

```txt
src/components
src/core se retorna copy para UI
```

Não mexer em IDs internos se quebrar compatibilidade.

Exemplo:

```txt
view key: "dash" permanece
label: "Hoje"
```

## 11. Teste simples de copy

Criar teste que bloqueia strings ruins visíveis mais comuns:

```js
const FORBIDDEN_VISIBLE_COPY = [
  "Prontidão",
  "True Retention",
  "Modo Simples",
  "Analise ",
  "Acao ",
  "Nao ",
  "Voce ",
  "Faca ",
  "calendario",
  "validacao",
  "dominio",
];
```

Aplicar apenas em arquivos de componentes, evitando falso positivo em docs/fixtures se necessário.

---

# PARTE C — Trilha inicial do Vestibular

## 12. Problema

Vestibular não tem trilha clara de início.

O aluno entra e não sabe:

```txt
1. qual prova escolher;
2. como montar plano;
3. se precisa fazer simulado;
4. o que estudar primeiro;
5. como o Mentor decide;
6. como o FSRS entra.
```

P1-A organiza navegação, mas Vestibular precisa de **first-run journey**.

---

## 13. Resultado esperado para Vestibular

Ao entrar pela primeira vez em `plat === "vest"`:

```txt
1. Escolher prova-alvo
2. Definir data ou janela da prova
3. Escolher trilha inicial
4. Fazer ou registrar simulado diagnóstico
5. Gerar plano inicial
6. Receber primeira ação do Mentor
```

---

## 14. Criar trilha de início

Criar/ajustar:

```txt
src/core/vestibularOnboarding.js
src/core/vestibularOnboarding.test.js
src/components/VestibularStartTrail.jsx
```

Não criar nova persistência complexa antes do Bloco N. Usar `meta` existente se já persistido.

## 15. Estado mínimo

Em `meta` ou `state.vest.meta`, conforme arquitetura atual:

```js
vestibularStart: {
  completed: false,
  targetExam: null, // "ENEM" | "Fuvest" | "Unicamp" | "Outro"
  examDate: null,
  baselineMode: null, // "simulado" | "sem_simulado"
  planMode: null, // "mentor" | "manual"
  completedAt: null,
}
```

Se já houver onboarding geral, integrar sem duplicar.

---

## 16. Fluxo de UI

### Passo 1 — Prova-alvo

```txt
Qual prova você quer priorizar?

[ENEM]
[Fuvest]
[Unicamp]
[Outra]
```

### Passo 2 — Data

```txt
Quando é a prova ou quando você quer estar pronto?

[Selecionar data]
[Não sei ainda]
```

### Passo 3 — Diagnóstico

```txt
Você já tem um simulado recente?

[Sim, quero registrar]
[Não, começar sem simulado]
```

### Passo 4 — Modo

```txt
Como quer começar?

[Modo Mentor]
O app escolhe a próxima melhor ação.

[Manual]
Eu escolho por matéria.
```

### Passo 5 — Primeira ação

Gerar:

```txt
Comece por:
- revisar matéria fraca se simulado existe;
- iniciar tema de alta prioridade se não existe;
- configurar plano se não há plano;
- fazer simulado diagnóstico se faltam dados.
```

---

## 17. Dashboard do Vestibular

Se `plat === "vest"` e `vestibularStart.completed !== true`:

Mostrar no Dashboard/Hoje:

```txt
Configure sua trilha de Vestibular
Leva 2 minutos. Isso permite que o Mentor monte sua primeira ação.
[Começar trilha]
```

Não mostrar ENAMED/Raciocínio.

---

## 18. Mentor no Vestibular

Garantir que o Mentor para Vestibular prioriza:

```txt
1. revisão vencida;
2. simulado pendente/análise de simulado;
3. matéria fraca;
4. tema novo do plano;
5. carga/sobrecarga;
6. descanso.
```

Não usar:

```txt
ENAMED
Raciocínio Clínico
Illness Script
Casos clínicos
Conduta médica
```

---

## 19. Testes obrigatórios de Vestibular

Criar:

```txt
src/core/vestibularOnboarding.test.js
```

Cobrir:

```js
test("vestibular start is incomplete by default")
test("selecting target exam stores target")
test("simulado baseline path recommends registering simulado")
test("without simulado recommends plan setup or first topic")
test("mentor mode is default")
test("clinical reasoning is never recommended for vest")
test("ENAMED is never recommended for vest")
```

Se houver navigation tests:

```js
test("vest primary nav does not include raciocinio")
test("vest dashboard shows start trail when incomplete")
```

---

# PARTE D — Ordem de implementação

Executar nesta ordem:

```txt
1. Já domino funcional
2. Português/copy central
3. Trilha inicial do Vestibular
```

Motivo:

```txt
Já domino quebrado = bug funcional.
Português ruim = perda de confiança.
Vestibular sem trilha = abandono inicial.
```

---

# PARTE E — QA manual

## 20. QA Já domino

```txt
1. Criar tema novo.
2. Clicar Já domino.
3. Registrar 10 questões, 90% → deve rejeitar por menos de 15.
4. Registrar 15 questões, 70% → deve rejeitar por acerto.
5. Registrar 15 questões, 85% → deve validar e agendar D7.
6. Registrar 15 questões, 92% → deve validar e agendar D14.
7. Card deve mudar imediatamente.
8. Reabrir app e confirmar persistência.
9. Mentor/fila deve enxergar a próxima revisão.
```

## 21. QA Português

```txt
1. Abrir Dashboard/Hoje.
2. Abrir Plano.
3. Abrir Estudar.
4. Abrir Estatísticas.
5. Abrir Mais.
6. Conferir labels principais.
7. Rodar busca por termos proibidos.
8. check:mojibake passa.
```

## 22. QA Vestibular

```txt
1. Trocar para Vestibular.
2. Dashboard mostra trilha inicial se incompleta.
3. Completar trilha.
4. Mentor gera primeira ação.
5. Não aparece ENAMED.
6. Não aparece Raciocínio Clínico.
7. Plano funciona.
8. Simulados aparecem como caminho de diagnóstico.
```

---

# PARTE F — Critérios de aceite

Aprovado se:

```txt
“Já domino” muda o estado do tema e a UI imediatamente.
“Já domino” agenda D7/D14 corretamente.
“Já domino” não marca domínio definitivo.
Tema validado sai de unstarted.
Português visível foi corrigido nas telas principais.
Glossário PT-BR existe.
Vestibular tem trilha inicial clara.
Mentor do Vestibular não recomenda medicina.
check:mojibake passa.
testes passam.
build passa.
```

---

# Prompt curto para execução

```txt
Execute o arquivo MEDREV_P1_HOTFIX_JA_DOMINO_COPY_VESTIBULAR.md.

Prioridade:
1. Corrigir “Já domino” end-to-end.
2. Corrigir português/copy visível e criar glossário PT-BR.
3. Criar trilha inicial do Vestibular.

Não implemente P2/P3/P4 agora.
Não mexa em Firebase/auth/localStorage.
Não crie Activity Log.
Não refatore Stats inteiro.
Não refatore Mentor inteiro.
Não liste workspace inteiro.
Use git grep/git ls-files.

Rode check:mojibake, testes e build.
Não faça commit, deploy ou push.
```
