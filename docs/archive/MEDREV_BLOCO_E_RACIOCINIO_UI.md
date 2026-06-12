# MEDREV — BLOCO E: UI Completa de Raciocínio Clínico ligada ao Cronograma

> **Executor:** Claude Code / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `high`  
> **Modo:** agent, com aprovação manual para comandos destrutivos.  
> **Objetivo:** transformar o motor de Illness Script e o banco de casos em uma experiência real de treino clínico, com fluxo em 6 etapas, fila de casos de hoje, ligação ao cronograma por `temaMedcof`, persistência em Zustand e mobile bem cuidado.

---

## 0. Decisões de produto já aprovadas

Implemente exatamente estas decisões:

1. **Raciocínio Clínico** deve existir como aba/tela própria acessível pela navegação.
2. A tela deve ter:
   - **Casos de hoje**
   - **Biblioteca**
   - **Histórico**
3. Fluxo do caso em **6 etapas**:
   1. Representação do problema
   2. Hipóteses
   3. Script de doença
   4. Nova informação / SCT
   5. Diagnóstico e justificativa
   6. Feedback e reencontro
4. O usuário precisa responder antes de ver feedback.
5. O fluxo deve ser guiado. Não permitir revelar resposta antes de tentativa mínima.
6. Quantidade padrão: **2 casos/dia**.
7. Illness Script Recall deve usar **autoavaliação por seção**:
   - Enabling conditions
   - Fault/fisiopatologia
   - Consequences
   - Management
8. Cada seção usa escala:
   - `0` = Não lembrei
   - `50` = Parcial
   - `100` = Lembrei bem
9. SCT: mostrar **1 a 2 itens por sessão**, para evitar sessão longa.
10. Feedback: **formativo e direto**, sem tom de bajulação.
11. Score de raciocínio deve ser salvo no store, mas o Dashboard só será integrado visualmente no **Bloco F**.
12. Deve existir botão **Refazer caso agora**, mas refazer imediatamente **não deve reagendar** como revisão oficial.
13. Não implementar “modo treino rápido” agora.
14. Biblioteca deve ter filtros simples por:
   - Área
   - Tema
   - Status
   - Dificuldade

---

## 1. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
```

Durante a edição:

- Salvar tudo em **UTF-8 sem BOM**.
- Não usar Windows-1252/Latin-1.
- Não introduzir mojibake.
- Não instalar bibliotecas novas.
- Não fazer `commit`, `deploy` ou `push` neste bloco.
- Não mexer no deploy.
- Não transformar `RaciocinioClinico.jsx` em arquivo gigante descontrolado se o repo já tiver componentes menores.
- Lógica de domínio fica em `src/core/*`.
- UI fica em `src/components/*`.
- Estado persistente fica no Zustand.
- Não misturar score de Raciocínio Clínico ao “Preparo estimado” ainda.
- Não alterar o algoritmo de ENAMED neste bloco.
- Não alterar o banco de casos, exceto para corrigir import/export quebrado.

---

## 2. Escopo do Bloco E

Arquivos prováveis:

```txt
src/components/RaciocinioClinico.jsx        [REWRITE ou PATCH GRANDE]
src/components/RaciocinioCaseSession.jsx    [NOVO, se fizer sentido]
src/components/RaciocinioCaseCard.jsx       [NOVO, se fizer sentido]
src/components/RaciocinioHistory.jsx        [NOVO, se fizer sentido]
src/core/store.js                           [PATCH]
src/core/illnessScript.js                   [PATCH mínimo, só se faltar helper]
src/constants/casosClinicos.js              [IMPORT/EXPORT CHECK]
src/components/Sidebar.jsx                  [PATCH se rota/aba não existir]
src/components/BottomNav.jsx                [PATCH se mobile precisar]
src/App.jsx ou router equivalente           [PATCH se rota/tela precisar]
```

Não faça:

```txt
src/components/Dashboard.jsx                [deixar para Bloco F]
src/components/EnamedMapa.jsx               [não mexer]
src/core/enamedIntel.js                     [não mexer]
firebase deploy                             [não rodar]
git push                                    [não rodar]
```

---

## 3. Inspeção obrigatória antes de codar

Rode buscas para localizar a arquitetura real:

```bash
grep -R "Raciocinio" -n src || true
grep -R "Raciocínio" -n src || true
grep -R "casosProgresso" -n src || true
grep -R "registrarCaso" -n src || true
grep -R "create(" -n src/core/store.js || true
grep -R "modulos" -n src/core/store.js || true
grep -R "Sidebar" -n src/components src || true
grep -R "BottomNav" -n src/components src || true
grep -R "activeTab" -n src || true
grep -R "setTab" -n src || true
grep -R "temaMedcof" -n src || true
grep -R "STEP_DEFINITIONS" -n src || true
grep -R "Âncora" -n src || true
grep -R "Ancora" -n src || true
```

PowerShell equivalente:

```powershell
Select-String -Path "src\**\*" -Pattern "Raciocinio","Raciocínio","casosProgresso","registrarCaso","modulos","Sidebar","BottomNav","activeTab","setTab","temaMedcof","STEP_DEFINITIONS","Âncora","Ancora" -CaseSensitive:$false
```

Documente mentalmente:

- Como a navegação por abas funciona.
- Onde `RaciocinioClinico.jsx` é usado.
- Como `store.js` atualiza `s[plat]`.
- Qual é a chave da plataforma atual (`plat`, `selectedPlat`, `activePlatform`, etc.).
- Se `casosProgresso` já existe no `initialPlat()`.
- Se o Bloco C já criou `src/core/illnessScript.js`.
- Se o Bloco D já criou `src/constants/casosClinicos.js`.

---

## 4. Contrato da tela de Raciocínio Clínico

A tela precisa responder 3 perguntas:

```txt
1. O que treino hoje?
2. Como treino um caso corretamente?
3. O que o resultado muda no meu reencontro futuro?
```

Estrutura visual recomendada:

```txt
Raciocínio Clínico

[Hero]
Treine scripts clínicos, não só memória.
2 casos sugeridos hoje · 1 reencontro · 1 novo

[Tabs]
Casos de hoje | Biblioteca | Histórico

Tab Casos de hoje:
- Card de caso vencido/novo
- Motivo: reencontro, tema do cronograma, área fraca, novo
- Botão: Iniciar caso

Tab Biblioteca:
- Filtros: área, dificuldade, status
- Lista de casos

Tab Histórico:
- Últimos casos feitos
- Nota formativa
- Próximo reencontro
- Botão: Refazer agora
```

Mobile:

- Hero compacto.
- Cards empilhados.
- Botões com alvo de toque confortável.
- Etapas do caso em stepper horizontal simples ou texto `Etapa 2 de 6`.

---

## 5. Store — persistência e actions

### 5.1 Estado esperado

Garanta que `initialPlat()` ou equivalente tenha:

```js
casosProgresso: {}
```

Garanta também merge/migração para usuários antigos:

```js
casosProgresso: persisted?.casosProgresso || {}
```

Se `casosProgresso` já existe, não sobrescrever.

### 5.2 Shape do progresso por caso

Ao registrar uma sessão oficial, salvar:

```js
{
  casoId: "apendicite-classica",
  vistos: 1,
  notaCaso: 78,

  problemRep: "Homem jovem com dor abdominal aguda migratória para FID...",
  problemRepScore: 80,

  hipoteses: ["Apendicite aguda", "Cólica ureteral", "Adenite mesentérica"],
  hipotesesScore: 75,

  illnessRecall: {
    enabling: 100,
    fault: 50,
    consequences: 100,
    management: 50
  },
  illnessRecallScore: 75,

  sctRespostas: [2, -1],
  sctScore: 88,

  diagnosticoFinal: "Apendicite aguda",
  justificativa: "Dor migratória + irritação peritoneal localizada...",
  justificativaScore: 80,
  justificativaOk: true,

  notaCaso: 78,
  rating: "good",
  S: 3.1,
  intervalo: 9,
  proximaData: "YYYY-MM-DD",

  atualizadoEm: "YYYY-MM-DD",
  historico: [
    {
      data: "YYYY-MM-DD",
      notaCaso: 78,
      rating: "good",
      intervalo: 9,
      oficial: true
    }
  ]
}
```

### 5.3 Action obrigatória

Adicionar action no store:

```js
registrarCasoClinico(casoId, payload, options)
```

Assinatura recomendada:

```js
registrarCasoClinico: (casoId, payload = {}, options = {}) => set((state) => {
  // options.oficial !== false => agenda reencontro
})
```

Onde:

```js
options = {
  oficial: true,        // default true
  refazerAgora: false   // se true, não reagenda
}
```

Regras:

- Sessão oficial agenda reencontro.
- Refazer agora salva tentativa no histórico, mas **não altera `S`, `intervalo`, `proximaData`**.
- Não perder histórico anterior.
- Limitar histórico a, por exemplo, 30 entradas por caso para não crescer indefinidamente.
- Não alterar métricas de preparo ENAMED neste bloco.

### 5.4 Action auxiliar opcional

Adicionar selector/action se fizer sentido:

```js
getCasosProgressoAtual()
```

ou apenas usar `useStore((s) => s[plat].casosProgresso)` conforme padrão do repo.

### 5.5 Importar motor do Bloco C

Usar funções do `src/core/illnessScript.js`, ajustando nomes reais:

```js
import {
  scoreProblemRepresentation,
  scoreHipoteses,
  scoreIllnessRecall,
  scoreSct,
  scoreJustificativa,
  scoreCaso,
  agendarReencontro,
  ratingDeNota
} from "./illnessScript";
```

Se algum nome estiver diferente, adapte sem reescrever o motor inteiro.

### 5.6 Pseudocódigo da action

```js
const caso = getCasoClinicoById(casoId);
const prev = state[plat].casosProgresso?.[casoId] || {};

const problemRepScore = scoreProblemRepresentation(payload.problemRep, caso);
const hipotesesScore = scoreHipoteses(payload.hipoteses, caso);
const illnessRecallScore = scoreIllnessRecall(payload.illnessRecall);
const sctScore = scoreSct(payload.sctRespostas, caso);
const justificativaScore = scoreJustificativa(payload.justificativa, caso);
const justificativaOk = justificativaScore >= 60;

const notaCaso = scoreCaso({
  problemRepScore,
  hipotesesScore,
  illnessRecall: illnessRecallScore,
  sctScore,
  justificativaOk
});

const oficial = options?.oficial !== false && !options?.refazerAgora;

const agenda = oficial
  ? agendarReencontro(prev, notaCaso)
  : {
      S: prev.S,
      intervalo: prev.intervalo,
      proximaData: prev.proximaData
    };

const novoRegistro = {
  ...prev,
  vistos: (prev.vistos || 0) + (oficial ? 1 : 0),
  tentativas: (prev.tentativas || 0) + 1,
  notaCaso,
  problemRep: payload.problemRep,
  problemRepScore,
  hipoteses: payload.hipoteses,
  hipotesesScore,
  illnessRecall: payload.illnessRecall,
  illnessRecallScore,
  sctRespostas: payload.sctRespostas,
  sctScore,
  diagnosticoFinal: payload.diagnosticoFinal,
  justificativa: payload.justificativa,
  justificativaScore,
  justificativaOk,
  rating: ratingDeNota(notaCaso),
  ...agenda,
  atualizadoEm: todayStr(),
  historico: [
    ...(prev.historico || []),
    {
      data: todayStr(),
      notaCaso,
      rating: ratingDeNota(notaCaso),
      intervalo: agenda.intervalo || null,
      oficial
    }
  ].slice(-30)
};
```

Ajuste conforme shape real do Zustand.

---

## 6. UI — `RaciocinioClinico.jsx`

### 6.1 Imports esperados

Ajuste nomes conforme repo:

```jsx
import React, { useMemo, useState } from "react";
import {
  Brain,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  History,
  Library,
  Lightbulb,
  RotateCcw,
  Search,
  Stethoscope,
  Target,
  TimerReset
} from "lucide-react";

import { useStore } from "../core/store";
import {
  casosDeHoje,
  coberturaRaciocinioPorArea,
  calcRaciocinioScore
} from "../core/illnessScript";
import { CASOS_CLINICOS } from "../constants/casosClinicos";
```

### 6.2 Estado local da tela

```jsx
const [tab, setTab] = useState("hoje"); // hoje | biblioteca | historico
const [casoAtivo, setCasoAtivo] = useState(null);
const [refazerAgora, setRefazerAgora] = useState(false);

const [filtroArea, setFiltroArea] = useState("Todas");
const [filtroStatus, setFiltroStatus] = useState("Todos");
const [filtroDificuldade, setFiltroDificuldade] = useState("Todas");
const [busca, setBusca] = useState("");
```

### 6.3 Dados derivados

```jsx
const progresso = platState?.casosProgresso || {};
const metaCasosDia = meta?.raciocinioConfig?.metaCasosDia || 2;

const filaHoje = useMemo(() => {
  const areasPrioritarias = readinessData?.priorityList?.map((p) => p.area).filter(Boolean) || [];
  return casosDeHoje(CASOS_CLINICOS, progresso, areasPrioritarias).slice(0, metaCasosDia);
}, [progresso, metaCasosDia, readinessData]);

const raciocinioScore = useMemo(() => calcRaciocinioScore(progresso), [progresso]);

const coberturaArea = useMemo(
  () => coberturaRaciocinioPorArea(CASOS_CLINICOS, progresso),
  [progresso]
);
```

Se `readinessData` não estiver disponível no componente, não force import pesado. Use `[]` como fallback e deixe integração fina para Bloco F.

---

## 7. Componente de sessão: fluxo de 6 etapas

Crie componente local ou arquivo separado:

```jsx
function RaciocinioCaseSession({ caso, progresso, onFinish, onCancel, refazerAgora = false }) {
  // ...
}
```

### 7.1 Estado da sessão

```jsx
const [step, setStep] = useState(0);

const [problemRep, setProblemRep] = useState("");
const [hipoteses, setHipoteses] = useState(["", "", ""]);
const [illnessRecall, setIllnessRecall] = useState({
  enabling: null,
  fault: null,
  consequences: null,
  management: null
});
const [sctRespostas, setSctRespostas] = useState({});
const [diagnosticoFinal, setDiagnosticoFinal] = useState("");
const [justificativa, setJustificativa] = useState("");
const [resultado, setResultado] = useState(null);
```

### 7.2 Itens SCT da sessão

Mostrar só 1 a 2 itens:

```jsx
const sctDaSessao = useMemo(() => {
  return (caso.sct || []).slice(0, 2);
}, [caso]);
```

Não randomizar agora. Randomização dificulta teste/reprodutibilidade.

### 7.3 Validações por etapa

Não permitir avançar sem tentativa mínima:

#### Etapa 1

```js
problemRep.trim().length >= 20
```

Mensagem:

```txt
Escreva pelo menos uma frase curta com idade/sexo, tempo e achados-chave.
```

#### Etapa 2

Pelo menos 2 hipóteses não vazias.

```js
hipoteses.filter(Boolean).length >= 2
```

#### Etapa 3

Todas as quatro seções com valor `0`, `50` ou `100`.

#### Etapa 4

Responder todos os SCT exibidos.

#### Etapa 5

Diagnóstico e justificativa preenchidos:

```js
diagnosticoFinal.trim().length >= 3
justificativa.trim().length >= 20
```

#### Etapa 6

Apenas feedback.

### 7.4 Stepper visual

No topo da sessão:

```txt
Etapa 1 de 6 — Representação do problema
```

Labels:

```js
const STEPS = [
  "Representação",
  "Hipóteses",
  "Script",
  "SCT",
  "Justificativa",
  "Feedback"
];
```

### 7.5 Etapa 1 — Representação do problema

UI:

```txt
Vinheta clínica
[caso.vinheta]

Resuma em uma frase:
[textarea]

Dica: idade/sexo + tempo + padrão + achados-chave + síndrome provável.
```

Não mostrar diferenciais ainda.

### 7.6 Etapa 2 — Hipóteses

UI:

```txt
Liste suas hipóteses em ordem de probabilidade.

1. [input]
2. [input]
3. [input]
+ adicionar hipótese
```

Permitir até 5 hipóteses.

Não mostrar resposta antes de avançar.

### 7.7 Etapa 3 — Illness Script Recall

Mostrar quatro cards:

```txt
Enabling conditions — quem costuma ter?
Fault — qual o defeito/fisiopatologia?
Consequences — como aparece?
Management — o que fazer?
```

Para cada um:

```txt
[Não lembrei] [Parcial] [Lembrei bem]
```

Valores:

```js
0, 50, 100
```

Opcional: textarea curta por seção, mas não obrigatório. Para reduzir fricção, mantenha botões.

### 7.8 Etapa 4 — SCT

Para cada item da sessão:

```txt
Hipótese: X
Nova informação: Y

Isso torna a hipótese:
-2 Muito menos provável
-1 Menos provável
0 Não muda
+1 Mais provável
+2 Muito mais provável
```

Só mostrar racional na etapa de feedback.

### 7.9 Etapa 5 — Diagnóstico e justificativa

UI:

```txt
Diagnóstico final
[input]

Justifique por que esse diagnóstico vence os diferenciais
[textarea]
```

Não mostrar diagnóstico final antes de concluir.

### 7.10 Etapa 6 — Feedback

Ao entrar na etapa 6, calcular resultado chamando store action ou calcular no componente e enviar para store.

Recomendação: chame `registrarCasoClinico` apenas ao clicar em **Finalizar caso**, para evitar salvar caso incompleto.

Fluxo:

1. Usuário preenche etapa 5.
2. Clica `Finalizar caso`.
3. Componente chama `onFinish(payload, { refazerAgora })`.
4. Store calcula scores, agenda se oficial e retorna/atualiza estado.
5. Componente exibe feedback derivado do progresso atualizado.

Se store não retorna resultado, calcule localmente também com o motor para exibir feedback. Mas a fonte persistente deve ser o store.

Feedback deve incluir:

```txt
Score de Raciocínio Clínico: 78
Representação do problema: 80
Hipóteses: 75
Script: 75
SCT: 88
Justificativa: adequada/incompleta

Diagnóstico esperado:
Apendicite aguda

Por que:
[caso.justificativa]

Diferenciais importantes:
- Apendicite aguda — alta — pista
- Cólica ureteral — baixa — pista
- Torção testicular — não pode perder — pista

Illness Script esperado:
Enabling:
...
Fault:
...
Consequences:
...
Management:
...

Reencontro:
D9 · próxima data YYYY-MM-DD
```

Se `refazerAgora === true`:

```txt
Refação salva como treino livre. O reencontro oficial não foi alterado.
```

### 7.11 Tom do feedback

Use direto e formativo:

- Bom:
  ```txt
  Representação específica: você incluiu tempo, padrão e achados-chave.
  ```
- Fraco:
  ```txt
  Representação genérica: faltaram tempo de evolução e achado discriminativo.
  ```
- Must-not-miss:
  ```txt
  Atenção: este caso tinha um diagnóstico que não pode perder. Em prova e na prática, esse diferencial precisa aparecer cedo.
  ```

Evite:

```txt
Parabéns, você arrasou!
```

---

## 8. Cards da fila e biblioteca

### 8.1 Card de caso

Campos visíveis:

```txt
Área · Dificuldade · Status
Título/tema
Vinheta curta truncada
Motivo: reencontro / novo / tema do cronograma
Próximo reencontro, se houver
Último score, se houver

[Iniciar caso]
```

Status:

- `Novo`
- `Reencontro hoje`
- `Em revisão`
- `Treino livre`
- `Concluído`

Não chamar de “dominado”.

### 8.2 Fila “Casos de hoje”

Usar:

```js
casosDeHoje(CASOS_CLINICOS, progresso, areasPrioritarias).slice(0, metaCasosDia)
```

Motivo vem do retorno `motivo`:

- `reencontro`
- `novo`

Se o motor ainda não inclui motivo por tema do cronograma, manter `reencontro/novo`. A ligação fina com cronograma entra mais abaixo.

### 8.3 Biblioteca

Filtros:

```jsx
<select value={filtroArea}>Todas, Clínica Médica, Cirurgia, GO, Pediatria, Preventiva</select>
<select value={filtroDificuldade}>Todas, facil, media, dificil</select>
<select value={filtroStatus}>Todos, novo, visto, reencontro</select>
<input placeholder="Buscar tema ou diagnóstico" />
```

Filtro status:

```js
function getStatusCaso(caso, progresso) {
  const p = progresso?.[caso.id];
  if (!p || !p.vistos) return "novo";
  if (p.proximaData && p.proximaData <= todayStr()) return "reencontro";
  return "visto";
}
```

Importe `todayStr` de `fsrs.js` se necessário.

---

## 9. Integração com cronograma por `temaMedcof`

### 9.1 Selector simples

Criar helper em `src/constants/casosClinicos.js`, se ainda não existir:

```js
export function getCasosClinicosPorTemaMedcof(temaMedcof) {
  return CASOS_CLINICOS.filter((caso) => caso.temaMedcof === temaMedcof);
}
```

O Bloco D já deveria ter criado. Apenas confirme.

### 9.2 CTA contextual

Onde o cronograma/estudo mostra o tema atual, adicionar CTA discreto:

```txt
Treinar caso clínico deste tema
```

Apenas se:

- módulo `raciocinioClinico` estiver ativo; e
- existir caso com `temaMedcof === tema.nome` ou equivalente.

Não fazer patch agressivo em muitos arquivos. Implementação mínima aceitável:

- Dentro da tela Raciocínio Clínico, mostrar seção:
  ```txt
  Casos ligados ao cronograma
  ```
  usando último tema estudado, se o store expõe essa informação.
- Caso o shape do store não esteja claro, deixar a ligação via biblioteca/filtro por `temaMedcof` e documentar no comentário para Bloco F.

### 9.3 Não quebrar a Âncora Clínica

O Bloco D adicionou “Já domino” na Âncora Clínica dos 6 passos. Não remova isso.

Neste bloco, você pode adicionar um segundo CTA na Âncora Clínica:

```txt
Treinar caso clínico deste tema
```

Regras:

- Só aparece se houver caso seed para o `temaMedcof`.
- Não aparece se o aluno já estiver dentro de uma sessão de caso.
- Deve abrir `RaciocinioClinico` com `casoAtivo` ou navegar para a tela com o caso selecionado.
- Se a navegação for complexa, crie callback simples ou mantenha CTA apenas na tela Raciocínio por enquanto.

---

## 10. Navegação

### 10.1 Sidebar

Se o Bloco A já colocou “Raciocínio Clínico” na sidebar, apenas confirme.

Se não existir, adicionar:

```txt
Raciocínio Clínico
```

Ícone sugerido:

```jsx
<Brain size={18} />
```

### 10.2 Bottom nav/mobile

Se houver bottom nav e espaço:

- Incluir Raciocínio apenas se já estava planejado.
- Não lotar o bottom nav. Se já tiver muitas abas, manter Raciocínio na sidebar/menu lateral.

### 10.3 Rota/aba

Respeite o padrão do app:

- Se usa `activeTab`, adicionar valor `"raciocinio"`.
- Se usa router, adicionar rota.
- Se usa sidebar com render condicional, incluir componente.

Não criar React Router novo.

---

## 11. Edge cases obrigatórios

A UI deve lidar com:

### 11.1 Módulo desligado

Se `meta.modulos.raciocinioClinico === false`:

Mostrar tela de ativação:

```txt
Raciocínio Clínico está desativado

Ative para treinar problem representation, hipóteses, illness scripts e SCT com casos ligados ao cronograma.

[Ativar Raciocínio Clínico]
```

Action deve atualizar `meta.modulos.raciocinioClinico = true`.

Se a action de módulo já existe, use-a. Não invente duplicada.

### 11.2 Banco vazio

```txt
Nenhum caso clínico cadastrado ainda.
```

Não quebrar.

### 11.3 Sem progresso

Score global:

```txt
Coletando
```

Não mostrar 100%.

### 11.4 Sem casos de hoje

```txt
Nenhum reencontro vencido hoje. Escolha um caso novo ou treine um caso ligado ao cronograma.
```

### 11.5 Caso sem SCT

O banco deve ter SCT, mas a UI deve ser defensiva:

```txt
Este caso não tem itens SCT cadastrados. Avance para justificativa.
```

Nesse caso `sctScore` pode ser `null` e `scoreCaso` deve ponderar só partes preenchidas.

### 11.6 Refazer agora

- Não reagendar.
- Não contar como `vistos`.
- Pode incrementar `tentativas`.
- Salvar no histórico com `oficial: false`.

---

## 12. Testes obrigatórios

### 12.1 Teste do store

Criar ou atualizar teste, conforme padrão do repo:

```txt
src/core/store.raciocinio.test.js
```

ou adicionar ao teste existente do store.

Cobrir:

1. `registrarCasoClinico` cria progresso do caso.
2. Sessão oficial agenda `proximaData`.
3. Sessão oficial incrementa `vistos`.
4. Refazer agora não altera `proximaData`.
5. Histórico é preservado.
6. Nota fica entre 0 e 100.

Pseudoteste:

```js
test("registrarCasoClinico salva progresso e agenda reencontro", () => {
  const caso = CASOS_CLINICOS[0];

  act(() => {
    useStore.getState().registrarCasoClinico(caso.id, {
      problemRep: "Homem jovem com dor abdominal aguda migratória para fossa ilíaca direita e febre.",
      hipoteses: [caso.diagnosticoFinal, "Cólica ureteral", "Adenite mesentérica"],
      illnessRecall: { enabling: 100, fault: 50, consequences: 100, management: 50 },
      sctRespostas: [caso.sct[0].efeitoPainel],
      diagnosticoFinal: caso.diagnosticoFinal,
      justificativa: caso.justificativa
    });
  });

  const p = useStore.getState()[plat].casosProgresso[caso.id];
  expect(p.notaCaso).toBeGreaterThanOrEqual(0);
  expect(p.notaCaso).toBeLessThanOrEqual(100);
  expect(p.proximaData).toBeTruthy();
  expect(p.vistos).toBe(1);
});
```

Adapte ao padrão real do store.

### 12.2 Teste visual/manual

Validar manualmente:

1. Abrir Raciocínio Clínico.
2. Com módulo desligado, aparece tela de ativação.
3. Ativar módulo.
4. Ver “Casos de hoje”.
5. Iniciar um caso.
6. Não conseguir avançar da etapa 1 sem texto suficiente.
7. Preencher problem representation.
8. Preencher pelo menos 2 hipóteses.
9. Marcar illness recall por seção.
10. Responder SCT.
11. Preencher diagnóstico e justificativa.
12. Finalizar.
13. Ver feedback completo.
14. Confirmar `proximaData`.
15. Voltar à lista e ver status atualizado.
16. Clicar `Refazer agora`.
17. Finalizar refação.
18. Confirmar que `proximaData` oficial não mudou.
19. Testar filtros da biblioteca.
20. Testar mobile.

---

## 13. Comandos finais do bloco

Ao final:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
git status --short
```

Se o teste padrão do repo exigir outro comando, use o padrão real e documente.

Não rodar:

```bash
git commit
firebase deploy
git push
```

---

## 14. Critérios de aceite

O Bloco E está aprovado se:

- A tela **Raciocínio Clínico** existe e abre.
- Módulo desligado mostra CTA de ativação.
- Casos de hoje aparecem com limite padrão de 2.
- Biblioteca tem filtros básicos.
- Histórico mostra tentativas anteriores.
- Fluxo de caso tem 6 etapas.
- Usuário precisa tentar antes de ver feedback.
- Illness Script usa autoavaliação por seção.
- SCT usa 1 a 2 itens por sessão.
- Finalizar caso salva progresso no Zustand.
- Sessão oficial agenda reencontro.
- Refazer agora não reagenda.
- Score de Raciocínio Clínico é salvo.
- Dashboard não é alterado neste bloco.
- `npm run check:mojibake` passa.
- `npm run build` passa.

---

## 15. Nota ao executor

Não construa uma tela de “resposta certa/errada” simplista. O valor da feature está no encadeamento:

```txt
representar problema
→ ranquear hipóteses
→ recuperar script
→ interpretar nova informação
→ justificar diagnóstico
→ reencontrar o caso no futuro
```

Essa sequência precisa ser sentida pelo usuário. O aluno deve sair pensando:

```txt
Eu não apenas lembrei o diagnóstico.
Eu treinei como chegar nele.
```
