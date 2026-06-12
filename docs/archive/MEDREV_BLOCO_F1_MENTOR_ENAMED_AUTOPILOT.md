# MEDREV — BLOCO F1: Modo Mentor, Análise ENAMED e Integração Final do Dashboard/Stats/Raciocínio

> **Executor:** Claude Code / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `high`  
> **Modo:** agent, com aprovação manual para comandos destrutivos.  
> **Objetivo:** transformar o MedRev em um sistema de orientação com baixo atrito: o estudante abre o app e recebe a próxima melhor ação. Integrar Dashboard, ENAMED, Raciocínio Clínico, análise de prova e recomendações de tema novo sem transformar o produto em banco de questões.

---

## 0. Tese de produto

O MedRev não deve tentar competir diretamente com banco de questões. O produto é complementar:

```txt
Banco de questões = lugar onde o aluno responde.
MedRev = cérebro que decide o que fazer, quando revisar, onde errar menos e como transformar estudo em retenção + raciocínio.
```

Neste bloco, o app deve reduzir decisão manual. O estudante não deve ter que escolher entre 12 ações. O mentor deve escolher uma ação principal, explicar o motivo e deixar controle avançado em segundo plano.

Fundamentação de produto e aprendizagem:

- Estudantes têm memória de trabalho limitada; a interface não deve competir com o conteúdo.
- Learning analytics dashboards só ajudam quando reduzem custo de inferência e convertem dado em ação.
- Self-regulated learning exige planejamento, monitoramento e reflexão, mas o aluno cansado não consegue fazer isso bem todos os dias.
- O modo mentor deve funcionar como scaffolding: ele guia sem sequestrar autonomia.

---

## 1. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
```

Durante a edição:

- UTF-8 sem BOM.
- Não introduzir mojibake.
- Não instalar libs novas.
- Não fazer `commit`, `deploy` ou `push` neste bloco.
- Não refatorar tooltips/mobile aqui. Isso é F2.
- Não alterar cronograma Estratégia MED aqui. Isso é G.
- Não criar QBank.
- Não criar importador de CSV real agora; preparar estrutura, mas formulário manual vem primeiro.
- Não esconder telas avançadas. O Modo Mentor reduz atrito no Dashboard, mas o usuário avançado mantém controle.

---

## 2. Decisões aprovadas / incorporadas

1. Dashboard continua como **Comando do Dia**.
2. Performance profunda fica em **Estatísticas**.
3. “Prontidão” já deve estar renomeada para algo mais honesto, como **Preparo estimado**.
4. Raciocínio Clínico já salva score no store; agora ele aparece no Dashboard/Stats.
5. O Modo Simples existente deve virar uma experiência melhor: **Modo Mentor**.
6. O Mentor recomenda início de tema novo quando:
   - fila/revisões estão baixas ou zeradas;
   - carga futura está aceitável;
   - há gargalo ENAMED relevante;
   - o tema tem alta incidência e baixa cobertura.
7. Análise da prova ENAMED deve ter:
   - entrada rápida por área;
   - detalhamento opcional por questão;
   - plano pós-prova acionável.
8. O sistema não deve agir automaticamente sem confirmação. O mentor recomenda; o usuário confirma.

---

## 3. Auditoria do estado atual relevante

O código atual já tem sinais importantes:

- `modoSimples` já existe no Zustand e defaulta para `true`.
- `Dashboard.jsx` já recebe `modoSimples` e `toggleModoSimples`.
- `res` e `vest` já têm `cronogramas` no store.
- `Dashboard` já mostra um bloco de cronograma semanal quando `s[plat].cronogramas` existe.
- `RaciocinioClinico` já está importado no `App.js`.
- `meta.modulos.raciocinioClinico` já controla visibilidade/ativação da feature.
- `store.js` ainda tem action antiga `registrarCaso`; se o Bloco E criou `registrarCasoClinico`, preferir a nova. Se não criou, implementar agora de forma compatível.

Este bloco deve se acoplar ao que existe, não reinventar a arquitetura.

---

## 4. Arquitetura-alvo do F1

Criar:

```txt
src/core/mentorAutopilot.js      [NOVO]
src/core/provaAnalyzer.js        [NOVO]
src/core/mentorAutopilot.test.js [NOVO]
src/core/provaAnalyzer.test.js   [NOVO]
src/components/EnamedProvaAnalyzer.jsx [NOVO]
```

Patch:

```txt
src/core/store.js
src/core/readiness.js
src/components/Dashboard.jsx
src/components/StatsPanel.jsx
src/components/RaciocinioClinico.jsx        [mínimo, se necessário]
src/App.js                                  [apenas navegação/props se necessário]
src/components/Sidebar.jsx                  [apenas se faltar item de Stats/ENAMED]
```

Não mexer:

```txt
src/components/Primitives.jsx  [F2]
src/components/FocusMode.jsx   [F2, exceto chamada de próxima ação se extremamente simples]
src/constants/cronogramas.js   [G]
```

---

## 5. Core — `src/core/provaAnalyzer.js`

### 5.1 Objetivo

Transformar resultado de prova/simulado ENAMED em diagnóstico acionável.

Entrada rápida:

```js
{
  id: "simulado-enamed-2026-06-01",
  nome: "Simulado ENAMED 01",
  data: "YYYY-MM-DD",
  tipo: "enamed" | "simulado",
  totalQuestoes: 100,
  acertosTotal: 73,
  porArea: {
    "Clínica Médica": { total: 25, acertos: 18 },
    "Cirurgia": { total: 20, acertos: 13 },
    "GO": { total: 20, acertos: 11 },
    "Pediatria": { total: 20, acertos: 16 },
    "Preventiva": { total: 15, acertos: 12 }
  },
  erros: [
    {
      questao: 17,
      area: "GO",
      subarea: "Gestação Alto Risco",
      tema: "Síndromes Hipertensivas na Gestação",
      tipoErro: "conteudo" | "raciocinio" | "interpretacao" | "distração" | "tempo" | "chute",
      confianca: "baixa" | "media" | "alta",
      tempo: null
    }
  ]
}
```

Saída:

```js
{
  percentualGeral: 73,
  bandas: {
    geral: "adequado" | "alerta" | "critico"
  },
  areas: [
    {
      area: "GO",
      total: 20,
      acertos: 11,
      percentual: 55,
      deficit: 30,
      pesoEstimado: 1.2,
      prioridade: 91,
      status: "critico",
      motivo: "Baixo acerto + alta incidência + baixa cobertura"
    }
  ],
  topGargalos: [...],
  errosPorTipo: {
    conteudo: 4,
    raciocinio: 3,
    interpretacao: 2
  },
  temasParaRevisao: [...],
  recomendacoes: [
    {
      type: "review_topic",
      title: "Revisar Síndromes Hipertensivas na Gestação",
      reason: "Erro em prova + alta incidência + baixa cobertura",
      target: { area, tema }
    }
  ]
}
```

### 5.2 Funções

Implementar funções puras:

```js
export function pct(acertos, total) {}

export function normalizarResultadoProva(resultado = {}) {}

export function analisarProvaEnamed(resultado = {}, contexto = {}) {}

export function calcularPrioridadeAreaProva(areaResult, contexto = {}) {}

export function gerarPlanoPosProva(analise = {}, contexto = {}) {}

export function classificarBandaPercentual(percentual, meta = 80) {}
```

### 5.3 Fórmula de prioridade

Não precisa ser estatisticamente perfeita. Precisa ser explicável.

Use algo como:

```js
prioridade =
  deficitAcerto * 0.35 +
  pesoIncidencia * 0.25 +
  baixaCobertura * 0.20 +
  baixaRetencao * 0.10 +
  recenciaErro * 0.10
```

Normalizar 0–100.

Contexto esperado:

```js
{
  metaAcerto: 80,
  enamedIntel,
  coberturaPorArea,
  retencaoPorArea,
  hotnessPorArea,
  today: "YYYY-MM-DD"
}
```

Fallbacks defensivos se contexto não existir.

### 5.4 Regras

- Não afirmar nota TRI real.
- Não prometer aprovação.
- Não inferir nota de corte precisa.
- Não depender de banco de questões.
- Se só houver acertos por área, gerar análise útil.
- Se houver erros por questão, gerar análise mais fina.

---

## 6. Core — `src/core/mentorAutopilot.js`

### 6.1 Objetivo

Gerar a **próxima melhor ação** do estudante.

Cada ação deve ser um objeto:

```js
{
  type: "review" | "new_topic" | "clinical_case" | "exam_analysis" | "anki" | "rest" | "settings",
  title: "Revisar Síndromes Coronarianas Agudas",
  subtitle: "18 min estimados",
  reason: "Revisão vencida + alta incidência ENAMED",
  explain: [
    "Este tema está vencido no FSRS.",
    "A área tem alta incidência no ENAMED.",
    "Sua carga dos próximos 7 dias está dentro do limite."
  ],
  cta: "Começar agora",
  secondaryCta: "Ver por quê",
  priority: 94,
  estimatedMinutes: 18,
  target: {
    temaId,
    stepKey,
    casoId,
    area,
    tema
  }
}
```

### 6.2 Prioridade recomendada

Ordem de decisão:

1. **Segurança / exaustão / sobrecarga**
   - Se carga futura passou do teto ou há sinal de cansaço, sugerir redução.
2. **Revisões vencidas**
   - Preservar retenção vem antes de tema novo.
3. **Tema novo de alta incidência**
   - Se fila baixa/zerada e carga futura aceitável.
4. **Análise de prova pendente**
   - Se usuário fez simulado/prova e ainda não analisou.
5. **Caso clínico**
   - Se raciocínio ativo e há caso vencido ou ligado ao tema recente.
6. **Anki**
   - Se adesão baixa ou cards recentes sem revisão.
7. **Descanso/recuperação**
   - Se tudo limpo ou risco alto de sobrecarga.

### 6.3 Funções

```js
export function getMentorNextAction(context = {}) {}

export function getMentorTodayPlan(context = {}) {}

export function explainMentorAction(action = {}) {}

export function shouldStartNewTopic(context = {}) {}

export function chooseNewTopicCandidate(context = {}) {}
```

### 6.4 Regra de tema novo

Recomendar tema novo quando:

```txt
totalFilaHoje <= 1
e overdueCount === 0
e cargaFutura7d abaixo do teto
e existe tema não iniciado
e tema tem alta incidência/alta prioridade ENAMED
```

Se houver vários:

Priorizar:

```txt
1. hotness ENAMED
2. baixa cobertura da área
3. proximidade da prova
4. tema com caso clínico seed
5. especialidade com retenção baixa
```

### 6.5 Modo Mentor não pode ser opaco

Toda recomendação deve ter botão/explicação:

```txt
Por que isso agora?
```

Explicação curta, 2–4 bullets.

---

## 7. Store — estado novo

Adicionar em `meta`:

```js
mentorConfig: {
  modo: "mentor", // "mentor" | "manual"
  autoStart: false,
  preferirBaixoAtrito: true,
  maxAcoesDia: 3,
  incluirCasosClinicos: true,
  incluirAnki: true,
  incluirTemaNovo: true
}
```

Adicionar em `s[plat]`:

```js
provasEnamed: []
```

Migration/merge:

```js
provasEnamed: persisted?.provasEnamed || []
```

Actions:

```js
registrarProvaEnamed(platKey, resultado)
atualizarProvaEnamed(platKey, provaId, patch)
removerProvaEnamed(platKey, provaId)
marcarProvaAnalisada(platKey, provaId)
```

`registrarProvaEnamed` deve:

- normalizar resultado;
- chamar `analisarProvaEnamed`;
- salvar `analise`;
- não criar temas automaticamente;
- não marcar revisão automaticamente;
- disponibilizar recomendações para o usuário confirmar.

---

## 8. Componente — `src/components/EnamedProvaAnalyzer.jsx`

### 8.1 Função

Formulário de análise de prova ENAMED/simulado.

Tabs internas:

```txt
Entrada rápida | Erros por questão | Histórico
```

### 8.2 Entrada rápida

Campos:

- Nome da prova/simulado
- Data
- Total de questões
- Acertos totais
- Acertos por área:
  - Clínica Médica
  - Cirurgia
  - GO
  - Pediatria
  - Preventiva

Botão:

```txt
Analisar prova
```

### 8.3 Erros por questão opcional

Tabela manual simples:

```txt
Questão | Área | Tema | Tipo de erro | Confiança
```

Não implementar upload CSV neste bloco. Apenas deixar comentário:

```js
// Futuro: importar CSV/planilha exportada pelo usuário.
```

### 8.4 Resultado

Mostrar:

```txt
Diagnóstico da prova
- Percentual geral
- Área que mais puxou para baixo
- Tipo de erro dominante
- 3 temas para revisar
- 1 caso clínico recomendado, se houver
- Próxima ação do mentor
```

CTAs:

```txt
Criar revisão
Treinar caso clínico
Enviar para o Mentor
```

Se as actions ainda não existirem, CTA deve navegar/filtrar, não criar dado automaticamente.

---

## 9. Dashboard — Modo Mentor real

### 9.1 Substituir “Modo Simples” visual por “Modo Mentor”

Não remover `modoSimples` do store para evitar migração. Apenas mudar UI label.

```txt
Modo Mentor
```

Estados:

- Ligado:
  ```txt
  O Mentor escolhe a próxima ação e mantém métricas profundas em segundo plano.
  ```
- Desligado:
  ```txt
  Controle manual: você vê mais painéis e decide o caminho.
  ```

### 9.2 Hero principal

No Dashboard, acima dos cards:

```txt
Agora
[ação recomendada]

Motivo curto
[Começar agora] [Ver por quê]
```

Ação vem de:

```js
getMentorNextAction(context)
```

Context deve incluir:

- fila inteligente;
- temas;
- meta;
- readinessData;
- enamedIntel;
- casosProgresso;
- provasEnamed;
- cronogramas;
- ankiAdesao;
- gamif/cansaço se existir.

### 9.3 “Ver por quê”

Abrir modal/expansão com:

```txt
Por que o Mentor escolheu isto?
- Revisão vencida há X dias.
- Tema de alta incidência no ENAMED.
- Sua carga futura está dentro do limite.
- Começar tema novo agora não deve gerar sobrecarga.
```

### 9.4 Plano de hoje

Mostrar no máximo 3 ações:

```txt
1. Revisar SCA
2. 10 questões de GO / revisar tema
3. 1 caso clínico de pré-eclâmpsia
```

No Modo Mentor, ocultar painéis profundos atrás de:

```txt
Ver painéis avançados
```

Sem remover acesso.

---

## 10. Integração com Raciocínio Clínico

No Dashboard:

- Mostrar card compacto:
  ```txt
  Raciocínio Clínico
  Score: coletando / 78
  Casos hoje: 2
  Próximo: Apendicite Aguda
  ```
- Não misturar com Preparo estimado.
- Se módulo desligado:
  ```txt
  Ativar treino de raciocínio clínico
  ```
- Se módulo ligado e há caso devido:
  CTA:
  ```txt
  Treinar caso de hoje
  ```

No `StatsPanel`:

- Adicionar seção:
  ```txt
  Raciocínio Clínico
  - Score global
  - cobertura por área
  - últimos casos
  - áreas sem casos vistos
  ```

---

## 11. Integração com ENAMED nas Estatísticas

No `StatsPanel`, adicionar ou reorganizar:

```txt
ENAMED
- Mapa de cobertura
- Gargalos por área
- Análise de prova
- Histórico de provas/simulados
- Plano pós-prova
```

Inserir `<EnamedProvaAnalyzer />` dentro da aba Estatísticas ou em subtela ENAMED, conforme arquitetura atual.

Se `StatsPanel` já estiver grande:

- criar componente filho;
- não entupir o arquivo principal.

---

## 12. Testes obrigatórios

Criar:

```txt
src/core/provaAnalyzer.test.js
src/core/mentorAutopilot.test.js
```

### 12.1 `provaAnalyzer.test.js`

Cobrir:

- calcula percentual geral;
- identifica área com pior déficit;
- aceita entrada sem erros por questão;
- usa erros por questão quando disponíveis;
- não quebra com área faltante;
- gera recomendações.

### 12.2 `mentorAutopilot.test.js`

Cobrir:

- revisão vencida ganha de tema novo;
- tema novo aparece quando fila zerada e carga baixa;
- descanso aparece quando carga futura excede teto;
- caso clínico aparece se módulo ativo e caso devido;
- análise de prova pendente aparece se prova não analisada;
- cada ação tem `reason`, `cta`, `priority`.

---

## 13. Teste manual

Validar:

1. Modo Mentor ligado por padrão.
2. Dashboard mostra uma ação principal, não 10 escolhas.
3. Botão “Ver por quê” funciona.
4. Se houver revisão vencida, ela é recomendada.
5. Se fila zerada, recomenda tema novo relevante.
6. Se prova ENAMED foi cadastrada, mostra análise.
7. Se Raciocínio Clínico ativo, mostra caso devido.
8. Stats mostra análise de prova e histórico.
9. Desligar Modo Mentor revela painéis avançados.
10. Nenhuma ação automática altera plano sem confirmação.

---

## 14. Comandos finais

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

## 15. Critérios de aceite

F1 aprovado se:

- Existe `mentorAutopilot.js`.
- Existe `provaAnalyzer.js`.
- Dashboard tem ação principal do Mentor.
- Modo Simples aparece como **Modo Mentor**.
- Mentor recomenda tema novo quando faz sentido.
- Análise ENAMED por área funciona.
- Detalhamento opcional por questão existe.
- Stats integra análise ENAMED.
- Raciocínio Clínico aparece como métrica/ação separada.
- Preparo estimado não vira uma mistura confusa.
- Testes e build passam.
