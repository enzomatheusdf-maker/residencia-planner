# Auditoria de Engenharia & Plano de Melhorias — MedRev / Bro

**Documento de execução para o Antigravity.**
Stack detectada: React 19 + Zustand 5 (persist/localStorage) + Firebase (Auth + Firestore) + Tailwind (CRA, react-scripts 5). Engine própria de revisão espaçada (FSRS-Lite) em `src/core/fsrs.js`.

> Como ler: cada item tem **Severidade** (🔴 crítico / 🟠 importante / 🟡 melhoria), **Onde** (arquivo:linha aproximada), **Problema**, **Correção esperada** e, quando útil, **Critério de aceite**. Os blocos de código são *direção de implementação*, não literal a colar — adapte aos nomes reais do arquivo.

---

## 0. Mapa mental do app (para contexto)

- Duas plataformas no mesmo store: `plat: "res"` (residência médica) e `plat: "vest"` (vestibular). Cada uma tem `{ temas, simulados, ankiLog, cronogramas }`.
- O ciclo de revisão espaçada é `D0 → D1 → D4 → D7 → D21` (`STEPS` em `fsrs.js`), com estabilidade `S` por etapa e reagendamento via `recalcAfterMark`.
- "Tópico" = `tema` (objeto com `rev` = mapa das 5 etapas). É a unidade central.
- Residência tem **catálogo navegável de tópicos** (`Cronograma.jsx` lê a constante `MEDCOF`). Vestibular **não tem** — cai no `CronogramaCecilia_MEGA.jsx`, uma grade de horários fixa de 22 semanas.

---

## 1. PROBLEMAS CRÍTICOS (corrigir primeiro)

### 1.1 🔴 Vestibular não tem catálogo de tópicos / criação de tópicos por área
**Onde:** `App.js` (~linha 470, render de `view === "crono"`), `Cronograma.jsx`, `CronogramaCecilia_MEGA.jsx`.

**Problema:**
No `App.js`, a rota de cronograma é bifurcada por plataforma:
```jsx
{view === "crono" && plat === "res"  && <Cronograma ... />}      // catálogo MEDCOF navegável
{view === "crono" && plat === "vest" && <CronogramaCecilia />}   // grade de horários fixa, sem catálogo
```
Resultado: no vestibular o usuário **não consegue navegar/iniciar tópicos por matéria** como na residência. Só existem os 24 temas *seed* (hardcoded em `initialVestibularPlat`) e a criação manual avulsa via `TemaModal`. Não há banco de tópicos do vestibular equivalente ao `MEDCOF`, nem UI para criar tópicos novos dentro de uma matéria.

Além disso, `Cronograma.jsx` está **acoplado à constante `MEDCOF`** (`import { MEDCOF } from "../core/fsrs"` e `MEDCOF.map(...)` direto no JSX), então não dá para reusar no vestibular sem refatorar.

**Correção esperada (2 partes):**

**(A) Desacoplar o catálogo do componente.** Transformar `Cronograma.jsx` em um componente genérico que recebe o catálogo por prop, e criar um catálogo de vestibular.

1. Criar `src/constants/catalogos.js`:
```js
// Catálogo de tópicos por plataforma. Mesmo formato do MEDCOF:
// blocos => { b: <numero>, t: [[nome, area, prioridade], ...] }
export { MEDCOF as CATALOGO_RES } from "../core/fsrs"; // ou mover MEDCOF para cá

export const CATALOGO_VEST = [
  { b: 1, nome: "Matemática", t: [
    ["Funções e Gráficos", "Exatas", "Alta"],
    ["Geometria Plana", "Exatas", "Alta"],
    ["Geometria Espacial", "Exatas", "Média"],
    ["Trigonometria", "Exatas", "Alta"],
    ["Análise Combinatória e Probabilidade", "Exatas", "Alta"],
    ["Estatística", "Exatas", "Média"],
    ["Matrizes, Determinantes e Sistemas", "Exatas", "Média"],
    ["Progressões (PA/PG)", "Exatas", "Média"],
    ["Números Complexos e Polinômios", "Exatas", "Baixa"],
  ]},
  { b: 2, nome: "Física", t: [
    ["Cinemática", "Exatas", "Alta"],
    ["Dinâmica (Leis de Newton)", "Exatas", "Alta"],
    ["Energia e Trabalho", "Exatas", "Alta"],
    ["Hidrostática", "Exatas", "Média"],
    ["Termologia e Termodinâmica", "Exatas", "Alta"],
    ["Óptica", "Exatas", "Média"],
    ["Ondulatória", "Exatas", "Média"],
    ["Eletrostática", "Exatas", "Alta"],
    ["Eletrodinâmica", "Exatas", "Alta"],
    ["Eletromagnetismo", "Exatas", "Média"],
  ]},
  { b: 3, nome: "Química", t: [
    ["Atomística e Tabela Periódica", "Ciências da Natureza", "Alta"],
    ["Ligações Químicas", "Ciências da Natureza", "Alta"],
    ["Estequiometria", "Ciências da Natureza", "Alta"],
    ["Soluções", "Ciências da Natureza", "Média"],
    ["Termoquímica", "Ciências da Natureza", "Média"],
    ["Cinética e Equilíbrio Químico", "Ciências da Natureza", "Alta"],
    ["Eletroquímica", "Ciências da Natureza", "Média"],
    ["Química Orgânica: Funções", "Ciências da Natureza", "Alta"],
    ["Reações Orgânicas", "Ciências da Natureza", "Média"],
    ["Radioatividade", "Ciências da Natureza", "Baixa"],
  ]},
  { b: 4, nome: "Biologia", t: [
    ["Citologia", "Ciências da Natureza", "Alta"],
    ["Bioquímica Celular", "Ciências da Natureza", "Média"],
    ["Genética", "Ciências da Natureza", "Alta"],
    ["Evolução", "Ciências da Natureza", "Alta"],
    ["Ecologia", "Ciências da Natureza", "Alta"],
    ["Fisiologia Humana", "Ciências da Natureza", "Alta"],
    ["Botânica", "Ciências da Natureza", "Média"],
    ["Zoologia", "Ciências da Natureza", "Média"],
    ["Microbiologia e Imunologia", "Ciências da Natureza", "Média"],
  ]},
  { b: 5, nome: "História", t: [
    ["Brasil Colônia", "Humanas", "Alta"],
    ["Brasil Império", "Humanas", "Alta"],
    ["Brasil República", "Humanas", "Alta"],
    ["Era Vargas e Ditadura Militar", "Humanas", "Alta"],
    ["Idade Média e Moderna", "Humanas", "Média"],
    ["Revoluções (Industrial, Francesa)", "Humanas", "Alta"],
    ["Guerras Mundiais e Guerra Fria", "Humanas", "Alta"],
  ]},
  { b: 6, nome: "Geografia", t: [
    ["Geopolítica Mundial", "Humanas", "Alta"],
    ["Geografia do Brasil", "Humanas", "Alta"],
    ["Climatologia e Domínios Morfoclimáticos", "Humanas", "Média"],
    ["Urbanização", "Humanas", "Média"],
    ["Agropecuária e Indústria", "Humanas", "Média"],
    ["Questões Ambientais", "Humanas", "Alta"],
    ["Demografia", "Humanas", "Média"],
  ]},
  { b: 7, nome: "Filosofia e Sociologia", t: [
    ["Filosofia Antiga", "Humanas", "Média"],
    ["Filosofia Moderna e Contratualismo", "Humanas", "Alta"],
    ["Ética e Política", "Humanas", "Alta"],
    ["Sociologia Clássica (Marx, Weber, Durkheim)", "Humanas", "Alta"],
    ["Cultura e Indústria Cultural", "Humanas", "Média"],
    ["Movimentos Sociais e Cidadania", "Humanas", "Média"],
  ]},
  { b: 8, nome: "Linguagens e Português", t: [
    ["Interpretação de Texto", "Linguagens", "Alta"],
    ["Gramática: Sintaxe", "Linguagens", "Alta"],
    ["Gramática: Morfologia", "Linguagens", "Média"],
    ["Figuras de Linguagem", "Linguagens", "Média"],
    ["Variação Linguística", "Linguagens", "Alta"],
    ["Funções da Linguagem", "Linguagens", "Alta"],
    ["Literatura: Escolas Literárias", "Linguagens", "Alta"],
    ["Análise de Obras Obrigatórias", "Linguagens", "Alta"],
  ]},
  { b: 9, nome: "Redação", t: [
    ["Estrutura Dissertativo-Argumentativa", "Redação", "Diamante"],
    ["Repertório Sociocultural", "Redação", "Alta"],
    ["Proposta de Intervenção (C5)", "Redação", "Diamante"],
    ["Coesão e Coerência (C4)", "Redação", "Alta"],
    ["Treino Cronometrado", "Redação", "Alta"],
  ]},
];
```
> Observação: refine essa lista com o aluno. O foco do app parece ser UFG/UnB/ENEM/EsPCEx — ajuste prioridades conforme as provas-alvo em `meta.provasAlvo`. As áreas (`"Exatas"`, `"Ciências da Natureza"`, `"Humanas"`, `"Linguagens"`, `"Redação"`) **devem bater exatamente** com `ESPS_VEST` e com as chaves de `ESP_COLORS` em `fsrs.js`, senão a cor sai cinza.

2. Refatorar `Cronograma.jsx` para receber `catalogo` por prop, com fallback ao MEDCOF para não quebrar a residência:
```jsx
import { CATALOGO_RES, CATALOGO_VEST } from "../constants/catalogos";

export default function Cronograma({ onStep, onEdit, onIniciarTema, catalogo }) {
  const { plat, ... } = useStore();
  const cat = catalogo || (plat === "vest" ? CATALOGO_VEST : CATALOGO_RES);
  // ...trocar todos os `MEDCOF.map(...)` por `cat.map(...)`
  // usar `bl.nome || ("Bloco " + bl.b)` no cabeçalho do bloco (MEDCOF não tem `nome`, o vest tem)
}
```

3. No `App.js`, decidir o que o vestibular mostra na aba "crono". Recomendação: **uma sub-navegação com 2 modos** — "Tópicos" (o catálogo navegável) e "Grade semanal" (a `CronogramaVest` genérica, ver 1.2). O `CronogramaCecilia_MEGA` vira opção legada/oculta.
```jsx
{view === "crono" && (
  <ErrorBoundary>
    {plat === "res"
      ? <Cronograma onStep={...} onEdit={...} onIniciarTema={...} />
      : <CronogramaVestHub onStep={...} onEdit={...} onIniciarTema={...} />}
  </ErrorBoundary>
)}
```
Onde `CronogramaVestHub` é um wrapper com tabs: `<Cronograma catalogo={CATALOGO_VEST} .../>` e `<CronogramaVest/>`.

**Critério de aceite:**
- No vestibular, a aba Cronograma mostra blocos por matéria (Matemática, Física, …) com os tópicos dentro, exatamente como a residência mostra o MEDCOF.
- Clicar em "Iniciar Ciclo Hoje" num tópico do catálogo cria o `tema` e abre o Modo Foco (mesmo fluxo de `onIniciarTema` já existente no `App.js`).
- Tópicos já iniciados aparecem como `CronoCard` com as 5 etapas; não iniciados aparecem como card tracejado.

---

### 1.2 🔴 `CronogramaCecilia_MEGA` é hardcoded e cria temas com schema divergente
**Onde:** `CronogramaCecilia_MEGA.jsx` (linhas 1–55, 320–345).

**Problema:**
- A grade de 22 semanas é 100% fixa em `DADOS_SEMANAS` (todo dia tem o mesmo texto genérico "CdM aulas + Estuda"). Não é editável pelo usuário e está amarrada a um plano específico (Cecília).
- Cria temas com `id` string `cronograma-${semana}-${dia}-${bloco}` e usa as chaves `b1/b2/b3` como se fossem etapas (`markStep(plat, tema.id, modalAberto.bloco, ...)`), mas `markStep`/`buildRev`/`recalcAfterMark` só conhecem `d0/d1/d4/d7/d21`. **Isso quebra o motor FSRS**: marcar `b1` não reagenda nada e polui `temas` com objetos cujo `rev` não tem as etapas esperadas — o que pode estourar em `BancoDados`, `Dashboard` e `useMetrics` (todos fazem `t.rev[s.key].done` assumindo as 5 etapas).
- O ID string também colide conceitualmente com `Date.now()` usado em outros lugares.

**Correção esperada:**
- **Aposentar** `CronogramaCecilia_MEGA` como tela default do vestibular. O planejamento semanal genérico já existe e é melhor: `CronogramaVest.jsx` (com criação manual, importação de PDF e `toggleBloco` que não mexe no FSRS). Use-o.
- Se quiser manter a grade Cecília como "template", converta-a num **cronograma gerado** via `gerarCronogramaVazio` + preenchimento, salvo em `vest.cronogramas` — nunca como `temas` com `rev` falso.
- **Garantir invariante:** todo objeto em `plat.temas` tem `rev` com as 5 chaves de `STEPS`. Adicionar guarda defensiva (ver 2.3).

**Critério de aceite:**
- Nenhum `tema` com `rev` sem `d0..d21` é criado.
- `BancoDados`/`Dashboard` não quebram ao abrir o vestibular após uso da grade.

---

### 1.3 🔴 Race condition entre persist do Zustand e carregamento do Firebase (risco de perda de dados)
**Onde:** `App.js` (~125–210, `monitorarAuth`), `store.js` (`merge`), `firebase.js` (`fazerLogout` faz `localStorage.clear()`).

**Problema:**
Há **três fontes de verdade** competindo: estado inicial *seed*, `localStorage` (persist do Zustand) e Firestore. No `onAuthStateChanged`, o código sobrescreve o store inteiro com os dados do Firebase (`useStore.setState({ res: dados.res, vest: ..., ... })`). Se o Firebase responder com um snapshot mais **antigo** que o `localStorage` (ex.: o debounce de 3s não chegou a sincronizar antes de fechar a aba), o estado local recente é **descartado**. Não há comparação de timestamps/versão. O `merge` do persist tenta proteger só o `vest.temas` vazio, mas não resolve o conflito local-vs-remoto.

Além disso `fazerLogout` chama `localStorage.clear()` (apaga tudo do domínio, não só a chave do app) e `resetStore` zera o estado — se a última sincronização falhou, há perda.

**Correção esperada:**
1. Versionar o estado salvo: adicionar `updatedAt: Date.now()` (ou contador monotônico `rev`) ao payload sincronizado e ao persist local.
2. No carregamento, **mesclar por timestamp**, não sobrescrever cegamente:
```js
const localState = useStore.getState();
const remote = resultado.dados;
const remoteNewer = (remote.updatedAt ?? 0) > (localState.updatedAt ?? 0);
const fonte = remoteNewer ? remote : localState;
// aplicar `fonte` para res/vest/meta/etc; manter a contagem mais alta
```
3. `fazerLogout`: trocar `localStorage.clear()` por remoção só da chave do app (`localStorage.removeItem("reviewflow-v6")`) e **forçar um flush síncrono** da sincronização antes do `signOut` (o `App.js` já tenta isso no `onLogout`, mas garanta que o `await sincronizarComFirebase` complete antes do `resetStore`).
4. Garantir flush ao fechar a aba: `beforeunload`/`visibilitychange` → sincroniza imediatamente (sem esperar o debounce de 3s).

**Critério de aceite:**
- Estudar offline, fechar a aba antes de 3s e reabrir logado **não perde** o progresso.
- Login em outro device traz o snapshot mais recente, não um antigo.

---

### 1.4 🔴 Credenciais Firebase versionadas no repositório
**Onde:** `.env` presente no zip (deveria estar só em `env.example`).

**Problema:** O arquivo `.env` com as chaves reais do Firebase foi commitado. Mesmo que `REACT_APP_*` vá para o bundle do cliente (são públicas por natureza no Firebase Web), versionar o `.env` é má prática e dificulta rotação. O risco real está nas **Firestore Security Rules**, não na chave em si.

**Correção esperada:**
1. Remover `.env` do versionamento; manter só `env.example`. Confirmar que `.gitignore` ignora `.env` (verificar — o `.gitignore` existe mas confirme a entrada).
2. **Revisar as Security Rules do Firestore** para que cada usuário só leia/escreva o próprio doc:
```
match /usuarios/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```
Sem isso, qualquer um com a config (que está no bundle) pode ler/escrever a coleção inteira.

**Critério de aceite:** um usuário autenticado não consegue ler o documento de outro `uid`.

---

## 2. PROBLEMAS IMPORTANTES

### 2.1 🟠 `markD0FromCronograma` está com comportamento contraditório
**Onde:** `store.js` (~245).
**Problema:** a função se chama "markD0" mas **não marca** `done` — só muda a data do D0 para hoje e força `done: false`. O nome engana e nenhum componente parece usá-la (o fluxo real é `handleStudyTrigger` → FocusMode). Ou é dead code, ou está incompleta.
**Correção:** decidir — se for "reagendar D0 para hoje", renomear para `reagendarD0Hoje`; se for "iniciar agora", deve abrir o Foco. Remover se for dead code.

### 2.2 🟠 `optimize` pode comprimir etapas para o mesmo dia
**Onde:** `store.js` (~290).
**Problema:** ao puxar etapas atrasadas para hoje, várias etapas não-feitas de um mesmo tema podem cair em `todayStr()`/`hoje+1`, ignorando os offsets FSRS (D4, D7, D21). Isso fura o espaçamento, que é a tese do produto.
**Correção:** ao reescalonar, respeitar o intervalo mínimo entre etapas consecutivas (usar `nextInterval`/offsets), encadeando a partir da última etapa feita, não empilhando tudo em 1–2 dias.

### 2.3 🟠 Falta guarda defensiva de `rev` em todo lugar que itera `STEPS`
**Onde:** `BancoDados.jsx`, `Dashboard.jsx`, `useMetrics.js`, `Cronograma.jsx`.
**Problema:** acessos diretos `t.rev[s.key].done` assumem que `rev` e cada etapa existem. Temas legados/migrados (ver 1.2) ou um campo ausente derrubam a tela inteira (só o `ErrorBoundary` em volta de alguns componentes salva).
**Correção:**
1. Criar `normalizeTema(t)` em `fsrs.js` que garante `rev` completo:
```js
export function normalizeTema(t) {
  const rev = t.rev || {};
  STEPS.forEach(s => {
    if (!rev[s.key]) rev[s.key] = { date: t.d0 ? addDays(t.d0, s.offset) : todayStr(), done:false, acerto:null, questoes:null, S:S_BASE[s.key], motivosErro:[] };
  });
  return { ...t, rev };
}
```
2. Rodar `normalizeTema` no `merge` do persist e no carregamento do Firebase, sobre cada tema de `res.temas` e `vest.temas`. Assim toda a UI pode confiar no schema.

### 2.4 🟠 Sincronização reativa duplicada e possivelmente cara
**Onde:** `App.js` (~215–245).
**Problema:** `useStore.subscribe` dispara em **qualquer** mudança de estado (inclusive abrir modal, mudar `view` se estivesse no store, etc.) e reescreve o documento inteiro a cada 3s. Em Firestore isso é 1 write do doc completo por janela — custo e quota desnecessários, e sobrescreve campos que outra aba possa ter mudado.
**Correção:** assinar só as fatias que importam (zustand permite selector no subscribe) e/ou comparar com o último payload enviado antes de escrever. Considerar `updateDoc` com campos específicos em vez de `setDoc(merge)` do objeto todo.

### 2.5 🟠 Parser de PDF do cronograma é frágil
**Onde:** `CronogramaVest.jsx` (`parsePDFText`, ~18–70).
**Problema:** o parser depende de horários fixos (`07:00|08:00|11:30|12:30|16:00`) e de uma distribuição "linhas / 7 dias" por fatiamento (`Math.ceil(linhas.length/7)`), o que vai embaralhar conteúdo em qualquer PDF que fuja do layout exato da Cecília. Falha silenciosa: gera blocos com conteúdo trocado sem avisar.
**Correção:** (a) tornar os horários/estrutura de blocos **configuráveis** no modal de importação; (b) validar o resultado e mostrar um *preview* editável antes de salvar (o usuário confere a semana 1 antes de gerar 22); (c) se a detecção falhar, cair no modo manual com aviso claro.

### 2.6 🟠 Áudios ambientes apontam para URLs de demonstração (não são chuva/lofi)
**Onde:** `FocusMode.jsx` (~150–165).
**Problema:** "rain" e "lofi" apontam para `SoundHelix-Song-*.mp3` (faixas de demo aleatórias), o que entrega uma experiência quebrada/confusa. Também dependem de rede externa.
**Correção:** hospedar arquivos próprios (loops curtos de chuva/ruído branco/lofi livres de direitos) em `public/audio/` e referenciar localmente, ou remover a opção até ter os assets. Evitar `console.log` em produção no catch.

### 2.7 🟠 Mistura de idioma/encoding e `App_restored.js` órfão
**Onde:** `src/App_restored.js`, comentários gerais.
**Problema:** existe um `App_restored.js` no `src` (provável backup) — confunde build e manutenção. Há também strings com acentuação inconsistente em alguns pontos.
**Correção:** remover `App_restored.js` (e qualquer `*_MEGA`/`*_restored` não usado) do `src`; mover backups para fora da árvore de build.

---

## 3. MELHORIAS DE FUNÇÃO (o que o produto pede para ser sério em revisão espaçada)

### 3.1 🟡 Reagendamento honesto pós-revisão ("Again/Hard/Good/Easy")
**Onde:** `FocusMode.jsx` (D4/D7/D21 usam um slider de % de acerto), `fsrs.js` (`toRating`, `updateStability`).
**Hoje:** o acerto vira rating por faixa (`<0.55 again`, etc.) e a estabilidade evolui. Funciona, mas o usuário não tem controle direto da dificuldade percebida e o "Again" não **reinsere** o card no mesmo dia.
**Melhoria:** ao marcar uma revisão com acerto baixo (`again`), além de reduzir `S`, **reagendar a própria etapa para hoje/+1 dia** (lapso), em vez de só empurrar a próxima. É o comportamento esperado de SRS. Critério: um tema com `again` reaparece na fila inteligente no mesmo dia.

### 3.2 🟡 Limite/carga diária e "spread" de novos tópicos
**Onde:** `useMetrics.calcFilaInteligente`, Dashboard.
**Melhoria:** já existe `meta.metaDiaria`. Adicionar:
- Teto de **novos** D0 por dia (evita o usuário iniciar 15 tópicos e afogar a fila de revisões nos dias seguintes).
- Quando a fila do dia excede a capacidade, sugerir adiar os de menor `score` e priorizar `overdue` + alta importância (a ordenação já existe; falta a UI de "carga vs capacidade").

### 3.3 🟡 Previsão de carga futura (forecast)
**Melhoria:** com as datas das etapas não-feitas, dá para projetar quantas revisões caem por dia nas próximas 2–4 semanas (gráfico de barras). Isso é o que o aluno usa para saber se vai conseguir manter o ritmo até a prova (`meta.dataProva`). Componente novo em `StatsPanel`.

### 3.4 🟡 Editar tópico do catálogo (prioridade/importância) sem precisar iniciá-lo
**Onde:** `Cronograma.jsx` cards tracejados.
**Melhoria:** permitir marcar prioridade/importância e "pular" (marcar como não-cairá-na-minha-prova) um tópico do catálogo antes de iniciar, persistindo essa escolha por plataforma. Hoje só dá para iniciar.

### 3.5 🟡 Busca global e atalhos
**Melhoria:** uma busca única (Cmd/Ctrl+K) que encontra tópicos por nome em qualquer matéria e leva direto ao card/fila. O app já tem busca local em 3 telas distintas — unificar.

---

## 4. O QUE NÃO PODERIA FALTAR (lacunas de plataforma)

| # | Lacuna | Severidade | Nota |
|---|--------|-----------|------|
| 4.1 | **Reset de senha** (esqueci minha senha) | 🟠 | `firebase/auth` tem `sendPasswordResetEmail`. Hoje não há recuperação — usuário que esquece a senha perde a conta. |
| 4.2 | **Exclusão de conta / LGPD** | 🟠 | Não há como o usuário apagar os próprios dados. Adicionar "excluir conta e dados" (apaga doc Firestore + `deleteUser`). |
| 4.3 | **Indicador de estado de sincronização** | 🟠 | Usuário não sabe se os dados subiram. Mostrar "salvo ✓ / salvando… / offline" no header. |
| 4.4 | **Backup/exportação real** | 🟡 | `exportKey`/`importKey` (base64) existem no store mas não há UI clara. Expor "Exportar dados (JSON)" e "Importar" nos Ajustes. |
| 4.5 | **Onboarding do vestibular** | 🟠 | O onboarding e o tour (`tourStep`) usam tema demo "Apendicite" (residência). No vestibular o tour fica fora de contexto. Tornar o tour sensível a `plat`. |
| 4.6 | **PWA / uso offline** | 🟡 | App de estudo diário se beneficia muito de funcionar offline e ser "instalável". CRA suporta service worker; avaliar habilitar. |
| 4.7 | **Acessibilidade básica** | 🟡 | Botões com só ícone (Trash2, Edit2) sem `aria-label`; contraste de alguns cinzas (#374151 sobre #111113) abaixo do recomendado; tamanhos de fonte muito pequenos (10–11px) em texto informativo. |
| 4.8 | **Testes** | 🟡 | Só há `App.test.js` boilerplate. O núcleo (`fsrs.js`, `useMetrics.js`, `mentor.js`) é funcional puro e **fácil de testar** — priorizar testes de `recalcAfterMark`, `nextInterval`, `calcFilaInteligente`, `calcStreaks`. |
| 4.9 | **Notificações/lembrete diário** | 🟡 | Núcleo de SRS depende de constância. Lembrete (push PWA ou e-mail) de "X revisões hoje". |

---

## 5. QUALIDADE DE CÓDIGO (transversal)

- **Console.logs de produção:** há vários (`monitorarAuth`, `FocusMode`, catches). Remover ou trocar por um logger condicionado a `process.env.NODE_ENV !== "production"`.
- **`alert()`/`window.confirm()`:** usados em `CronogramaVest` e cards. Substituir por modais/toasts consistentes com o resto da UI (o app já tem `Toast`, `Modal`).
- **IDs por `Date.now()` e `Date.now()+Math.random()`:** risco de colisão em loops rápidos (`importTemas` usa `Date.now()+Math.random()` — ok, mas padronize). Usar `crypto.randomUUID()`.
- **`JSON.parse(JSON.stringify(...))`** para clonar cronograma (`toggleBloco`/`updateBlocoConteudo`): funciona, mas em cronogramas grandes é caro e perde tipos. Aceitável agora; trocar por update imutável direcionado se houver lentidão.
- **Datas como string `YYYY-MM-DD`:** consistente e bom. Mas `diffDays`/`new Date(b)-new Date(a)` sem hora pode sofrer com timezone; `addDays` já usa `T12:00:00` (correto) — alinhar `diffDays` para o mesmo padrão.
- **Acoplamento de constantes de domínio:** `MEDCOF`, cores, pesos e listas de áreas estão todos em `fsrs.js`. À medida que cresce, separar `domain/` (catálogos, cores, importâncias) do `core/fsrs.js` (só matemática de SRS e datas).
- **`partialize` vs payload do Firebase divergem:** o persist salva um conjunto de chaves e o `sincronizarComFirebase` (no `onLogout`) salva outro (inclui `temas` solto, que não existe na raiz do store). Unificar a forma do snapshot numa única função `buildSnapshot(state)` usada por persist e por Firebase, para não divergirem.

---

## 6. ORDEM DE EXECUÇÃO SUGERIDA

1. **1.4** (segurança: tirar `.env`, fechar regras Firestore) — rápido e de risco alto.
2. **2.3 + 1.2** (normalizar `rev`, aposentar grade hardcoded) — estabiliza a base antes de mexer no resto.
3. **1.1** (catálogo de tópicos do vestibular + desacoplar `Cronograma`) — a feature principal que você pediu.
4. **1.3** (race condition de sync) — protege dados do usuário.
5. **2.x** restantes (optimize, sync reativa, parser de PDF).
6. **4.1/4.2/4.3/4.5** (reset de senha, exclusão, indicador de sync, tour por plataforma).
7. **3.x** (melhorias de SRS: lapso/again, carga diária, forecast).
8. **5** (limpeza) e **4.8** (testes do núcleo) em paralelo, contínuo.

---

## 7. RESUMO DA RESPOSTA À SUA PERGUNTA

- **Cronograma do vestibular:** hoje cai numa grade fixa (`CronogramaCecilia_MEGA`) que cria "temas" com etapas falsas (`b1/b2/b3`) e fura o motor FSRS. Substituir pela `CronogramaVest` genérica (semanal, editável, importável) e por um **catálogo de tópicos navegável** (item 1.1).
- **Criação de tópicos no vestibular (inexistente):** resolvida no item **1.1** — catálogo `CATALOGO_VEST` + `Cronograma.jsx` desacoplado por prop, reaproveitando o fluxo de "Iniciar Ciclo" que já existe na residência. Para tópicos fora do catálogo, o `TemaModal` manual já cobre (já lê `ESPS_VEST`); só falta dar a porta de entrada por matéria.
- **O que não poderia faltar:** reset de senha, exclusão de conta/LGPD, indicador de sincronização, backup/export, tour sensível à plataforma, e testes do núcleo de SRS (seção 4).
