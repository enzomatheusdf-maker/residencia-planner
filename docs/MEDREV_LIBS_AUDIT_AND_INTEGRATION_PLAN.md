# MEDREV - Auditoria de Bibliotecas e Plano de Integracao

> **Etapa:** decisao + planejamento (Opus). Nada implementado, nada instalado, nenhum arquivo de codigo alterado.
> **Branch auditada:** `rescue/codex-session-01` (working tree limpa no momento da auditoria).
> **Data:** 2026-06-11.
> **Regra de execucao:** Opus decide e planeja. Sonnet Low / Sonnet Medium / Codex (GPT-5.5 High) executam em blocos pequenos.

---

## 0. Aviso de realidade (leia antes de tudo)

O prompt original tratava `framer-motion` e `lucide-react` como "candidatas a instalar". **Isso esta desatualizado.** A auditoria do codigo real mostra que ambas ja estao instaladas E profundamente integradas:

- `lucide-react@^1.16.0` -> importada em **58 arquivos** de `src`. Iconografia ja consistente.
- `framer-motion@^12.40.0` -> importada em **32 arquivos**. Existe um **sistema de motion completo** em `src/components/motion/` (`MotionSection`, `MotionCard`, `MotionButton`, `AnimatedTabs`, `AnimatedAccordion`, `MotionPresence`, `MotionProgressBar`, `motionTokens.js`, `index.js`) e uma **landing animada completa** em `src/components/landing/` (Hero, ChaosSection, BeforeAfter, HowItThinks, FeatureShowcase, Method, BetaSection, Transparency, Faq, FinalCta, Navbar, Footer, `motion.js`).

Ou seja: o "sistema de motion" que o prompt pedia para propor (MotionSection/MotionCard/AnimatedTabs/AnimatedAccordion/motionTokens) **ja existe**. Nao ha o que instalar nem arquitetar ai. Eventual trabalho futuro de motion e **polish**, nao instalacao.

Conclusao honesta: depois de filtrar o que ja existe e o que duplicaria solucao boa, **a quantidade de bibliotecas que vale instalar agora e essencialmente zero**. O que move a agulha agora nao e uma lib nova - e (a) corrigir o Tailwind CDN e (b) usar zod nos limites de dados. Tudo o mais e adiar ou recusar.

---

## 1. Resumo executivo

### Instalar AGORA (novas)
**Nenhuma.** Nenhuma das candidatas justifica instalacao imediata para o beta. As duas que o prompt assumia faltarem (framer-motion, lucide-react) ja estao instaladas e integradas.

> Observacao: se voce quiser obrigatoriamente "comecar instalando algo", o unico item com ROI claro e seguro e **zod** (P1, abaixo) - mas o pre-requisito real de qualidade e o item TW (Tailwind), que nao e uma das candidatas.

### Deixar para DEPOIS (com gatilho claro)
- **zod** - P1. Apenas nos limites de dados (import CSV/JSON, backup/restore, hidratacao de estado persistido). Nao reescrever validacao de formulario existente.
- **react-hook-form + @hookform/resolvers** - P2. So um formulario piloto. Os forms atuais funcionam.
- **recharts** - P2 condicional. So se surgir um tipo de grafico que o SVG custom atual nao faz barato (barras agrupadas, legendas, tooltip rico). Os graficos atuais sao bons.
- **radix-ui** - P2 condicional. So adotar primitivo-a-primitivo SE a auditoria de acessibilidade achar bug real (foco/teclado). Hoje ha lib de overlay propria com testes.

### EVITAR / NAO instalar agora
- **sonner** - duplicaria um sistema de Toast proprio ja funcional, animado e integrado ao store. NAO instalar.
- **@tanstack/react-query** - app e local-first (Zustand + persist); nao ha server-state suficiente. NAO instalar.
- **@tanstack/react-table** - so 2 tabelas no app; cards dominam. NAO instalar (adiar ate BancoDados crescer).
- **cmdk** - sem taxonomia/navegacao estavel; seria feature nova. Adiar (P2/P3).
- **GSAP, Lottie, libs de particulas, MUI, Ant Design, Chakra, Tailwind como dependencia adicional de UI kit, libs de IA, libs de calendario pesadas** - NAO. framer-motion cobre motion; o design system ja e proprio.

### Risco geral
**Baixo**, justamente porque a recomendacao e nao instalar quase nada. O maior risco do projeto hoje nao e falta de biblioteca - e o **Tailwind via CDN de runtime** (`<script src="https://cdn.tailwindcss.com">` em `public/index.html`) num app com `manifest.json` (intencao PWA) indo para beta. Isso e lento, quebra offline, da flash de conteudo sem estilo e nao e recomendado para producao. Ver secao 2 e Bloco LIB-TW.

### Ordem recomendada (resumo)
1. **LIB0** - baseline (medir antes de tocar em qualquer coisa).
2. **LIB-TW** - decidir/migrar Tailwind CDN -> build-time (maior alavancagem real; nao e uma das candidatas, mas e o gargalo de qualidade).
3. **LIB5 (zod)** - schemas de fronteira (import/backup/persistencia).
4. **LIB6 (react-hook-form)** - um form piloto, se justificar.
5. **LIB7 (recharts)** - so se aparecer tipo de grafico novo.
6. **LIB8 (radix)** - so apos achar bug de a11y real.
7. **LIB9** - documentar gatilhos de react-query / react-table / cmdk e seguir adiado.

---

## 2. Estado atual do projeto

### Stack confirmada (`package.json`)
- Create React App (`react-scripts 5.0.1`), **React 19.2** (`react`, `react-dom`).
- **Zustand 5** (`zustand`) com persist (localStorage, chave da memoria de projeto: `reviewflow-v6`).
- **Firebase 12** (auth + Firestore).
- **framer-motion 12.40** e **lucide-react 1.16** (ja instaladas).
- **ts-fsrs 5.4** (motor de revisao espacada).
- Testes: `@testing-library/*` + react-scripts (Jest).
- Sem TypeScript. Sem ESLint dedicado alem de `react-app`. Gate de build: `npm run check:mojibake && react-scripts build`.

### Bibliotecas candidatas - estado real
| Candidata | Ja instalada? | Ja importada em `src`? |
|---|---|---|
| framer-motion | SIM (`^12.40.0`) | SIM (32 arquivos) |
| lucide-react | SIM (`^1.16.0`) | SIM (58 arquivos) |
| zod | nao | nao |
| react-hook-form | nao | nao |
| @hookform/resolvers | nao | nao |
| sonner | nao | nao |
| recharts | nao | nao |
| radix-ui | nao | nao |
| @tanstack/react-query | nao | nao |
| @tanstack/react-table | nao | nao |
| cmdk | nao | nao |

### Componentes/infra que JA existem (e por isso reduzem a necessidade de libs)
- **Design system proprio** em `src/components/ui/`: `Badge`, `Button`, `Card`, `Dialog` (+`DialogFooter`), `EmptyState`, `MetricRing`, `OverlayProvider`, `SegmentedControl`, `Sheet`, `Skeleton`, `Tabs`, `Toast`, `Tooltip`, `index.js`, `utils.js`. Cobertos por testes: `ui.test.jsx`, `overlay.test.jsx`.
- **Sistema de motion proprio** em `src/components/motion/` (ver secao 0).
- **Landing animada completa** em `src/components/landing/`.
- **Hooks de motion/a11y**: `src/hooks/useReducedMotion.js`, `src/hooks/useCountUp.js`. Core: `src/core/motion.js` (+ teste), `src/core/uiTokens.js` (+ teste).
- **Camada de validacao propria** em core: `domainValidation.js` (906 linhas), `readinessValidation.js` (152), `numberInput.js` (74), `dataIntegrity.js` (108).

### Lacunas reais (o que realmente falta - e o que NAO falta)
- **Iconografia:** NAO ha lacuna. lucide ja consistente em 58 arquivos.
- **Motion:** NAO ha lacuna estrutural. Sistema completo ja existe; falta no maximo polish pontual.
- **Feedback (toasts):** NAO ha lacuna de biblioteca. `ui/Toast.jsx` (51 linhas) e um toast completo: portal (`createPortal`), entrada+saida via `AnimatePresence`, `reducedMotion="user"`, tons `success/warning/error/info`, botao de acao, auto-dismiss, `aria-label`. Esta ligado ao **store** (`store.showToast` / `store.dismissToast`) e consumido em App, Dashboard, Cronograma, CronogramaVest, ActionInbox, AcademiaMetodo, DataSafetyPanel, EnamedProvaAnalyzer, FocusMode, Modals, etc. Suporta ate `undo`. **Zero** uso de `alert()`/`confirm()` nativos. (Nota: `OverlayProvider` e um no-op passthrough hoje - irrelevante, pois o estado do toast vive no store, nao em context.)
- **Graficos:** NAO ha lacuna de qualidade. Ha SVG custom de bom nivel: `RetrievabilitySpark.jsx` (curva de retencao FSRS amostrada em ate 40 pontos, gradiente, cor dinamica por retentibilidade) e `StatsPanel.jsx` (1714 linhas; `AccuracyChart` com area+linha+gradiente+pontos animados). Sao acoplados a matematica FSRS - dificil de terceirizar barato.
- **Validacao:** PARCIAL. UI/forms ja validam via core (`validateDomainTestInput`, etc.). Falta **schema formal nos limites de dados externos**: import de calendario CSV/JSON (`calendarImportCsv.js`, `CalendarImportWizard.jsx`), backup/restore (`backup.js`), e hidratacao de estado persistido (`userDataMigration.js`/`dataIntegrity.js`). E ai que zod entra.
- **Forms:** 37 `<input>`, 11 `<select>`, 8 `<textarea>` no app. Padrao atual: `useState` local + chamada a validador do core (ex.: `DomainTestModal.jsx` usa estado `validation` + `validateDomainTestInput`). Funciona; e verboso. Nao e urgente.
- **Tabelas:** so 2 arquivos usam `<table>` (`BancoDados.jsx`, `RaciocinioClinico.jsx`). Cards dominam.
- **Server-state:** app e local-first. `onSnapshot` aparece em `store.js` e `Dashboard.jsx`; apenas 1 `getDocs` no app inteiro. Firestore e sincronizacao/backup atras do store, nao fonte primaria de leitura.
- **Acessibilidade de overlays:** `overlay.test.jsx` cobre Dialog (portal, Esc, manter form sujo aberto), Tooltip (abre no clique), Toast (auto-dismiss), Sheet (delega semantica de dialog). Indica base de a11y existente - precisa auditoria focada antes de considerar radix.

### Achado fora do escopo das candidatas, mas critico
**Tailwind via CDN de runtime.** `public/index.html` carrega `https://cdn.tailwindcss.com`. Existe um `tailwind.config.js` no repo, mas o CDN de runtime nao usa esse arquivo (config so vale se inline no HTML). Consequencias para um beta/PWA: bundle de runtime grande, JIT no cliente, FOUC, dependencia de rede (quebra offline apesar do `manifest.json`), e o proprio aviso da Tailwind de "nao usar em producao". Esta e a decisao de "biblioteca" de maior impacto real - mais do que qualquer candidata da lista. Tratada no Bloco **LIB-TW** (opcional mas fortemente recomendado).

---

## 3. Tabela de decisao

| Biblioteca | Decisao | Por que | Onde usar | Risco | Executor recomendado | Prioridade |
|---|---|---|---|---|---|---|
| framer-motion | JA INSTALADA | 32 arquivos; sistema motion + landing prontos | (ja em uso) | - | Opus (so polish pontual) | - |
| lucide-react | JA INSTALADA | 58 arquivos; iconografia consistente | (ja em uso) | - | Sonnet Low (sweeps pontuais) | - |
| sonner | NAO INSTALAR | duplica `ui/Toast` + `store.showToast` (animado, com undo, integrado) | - | medio (2 sistemas de toast) | - | - |
| zod | INSTALAR DEPOIS | falta schema formal nos limites de dados externos | import CSV/JSON, backup/restore, hidratacao de estado | baixo se additivo; medio se colidir com `dataIntegrity` | **Codex/GPT-5.5 High** | P1 |
| react-hook-form (+resolvers) | INSTALAR DEPOIS (piloto) | forms verbosos mas funcionais; nao urgente | 1 form piloto (Registro de Simulado) | medio (toca store se nao isolar) | Codex/High se tocar store; Sonnet Low se isolado | P2 |
| recharts | ADIAR (condicional) | SVG custom ja cobre as telas; FSRS-acoplado | so grafico novo (barras/legenda/tooltip) | medio (bundle ~100kb; duplicar charts) | Sonnet Medium ou Codex/High | P2 |
| radix-ui | AUDITAR ANTES | overlays proprios com testes; sem bug provado | so primitivo com bug de a11y comprovado | alto se virar refactor global | Opus audita; impl. so depois (Codex/High) | P2 |
| @tanstack/react-query | NAO INSTALAR | app local-first; pouco server-state | - | alto (briga com Zustand persist) | - | adiado |
| @tanstack/react-table | NAO INSTALAR | so 2 tabelas; cards bastam | - | baixo agora; desnecessario | - | adiado |
| cmdk | ADIAR | sem taxonomia/nav estavel; feature nova | - | baixo; fora de foco | - | P2/P3 |
| GSAP/Lottie/particulas/MUI/Ant/Chakra/AI/calendario pesado | NAO INSTALAR | framer-motion cobre; design system proprio | - | alto (conflito/bundle) | - | - |
| (extra) Tailwind CDN -> build | RECOMENDADO | CDN runtime e risco de producao/PWA | toolchain (PostCSS/CRACO) | medio-alto (toolchain) | **Codex/GPT-5.5 High** | P1 |

---

## 4. Ordem segura de instalacao

Regra geral: instalar em grupos pequenos; rodar `check:mojibake` + `test` + `build`; commit de checkpoint; so entao integrar. Nunca instalar tudo de uma vez.

```
1. LIB0    - baseline (medir, sem instalar nada)
2. LIB-TW  - Tailwind CDN -> build-time (decisao/migracao)   [maior alavancagem real]
3. LIB5    - zod (schemas de fronteira)                       [unica candidata com ROI claro agora]
4. LIB6    - react-hook-form + resolvers (1 form piloto)      [so se justificar]
5. LIB7    - recharts (1 grafico novo)                        [so se surgir tipo novo de grafico]
6. LIB8    - radix-ui (decisao apos auditoria de a11y)        [so com bug provado]
7. LIB9    - react-query / react-table / cmdk: documentar gatilhos e manter adiado
```

Blocos que o prompt original numerava como LIB1 (lucide), LIB2 (sonner), LIB3 (motion system), LIB4 (motion na landing) **estao concluidos ou recusados** e por isso nao reaparecem como acao:
- LIB1 (lucide): JA FEITO (instalado + 58 arquivos).
- LIB2 (sonner): RECUSADO (duplicaria o Toast existente).
- LIB3 (motion system): JA FEITO (`src/components/motion/*`).
- LIB4 (motion na landing): JA FEITO (`src/components/landing/*`).

---

## 5. Plano por biblioteca (aprovadas/adiadas)

### 5.1 zod (P1 - unica com ROI claro agora)
- **Objetivo:** validar dados que entram pela fronteira do sistema (arquivos importados, backups e estado persistido) com schema unico, falhando alto (CLAUDE.md: tolerancia zero a falha silenciosa).
- **Comandos:** `npm install zod`
- **Arquivos provaveis (consumo):** `src/core/calendarImportCsv.js`, `src/components/CalendarImportWizard.jsx`, `src/core/backup.js`, `src/core/userDataMigration.js`, `src/core/dataIntegrity.js` (integrar, NAO substituir). Novos: `src/core/schemas/*.js`.
- **Areas de uso:** Import de calendario CSV/JSON; backup export/restore; hidratacao de `reviewflow-v6`.
- **Blocos:** ver LIB5.
- **Testes:** unit de cada schema (valido/invalido/borda); garantir que dado malformado e rejeitado com mensagem, sem corromper store.
- **Aceite:** import/backup invalidos sao bloqueados com erro claro; `test` e `build` verdes; sem regressao em `dataIntegrity.test.js`.
- **Rollback:** `git revert` do bloco; `npm uninstall zod`.

### 5.2 react-hook-form + @hookform/resolvers (P2 - piloto)
- **Objetivo:** reduzir boilerplate/re-render em UM formulario, sem migrar todos.
- **Comandos:** `npm install react-hook-form @hookform/resolvers`
- **Arquivos provaveis:** 1 alvo (sugestao: form de Registro de Simulado em `Simulados.jsx`/`Modals.jsx`). NAO tocar `DomainTestModal` no piloto (acoplado a `domainValidation`).
- **Aceite:** form piloto funciona identico ao anterior; validacao via resolver (zod opcional); demais forms intactos; testes/build verdes.
- **Rollback:** reverter o componente; manter a lib so se houver segundo uso planejado, senao `npm uninstall`.

### 5.3 recharts (P2 - condicional)
- **Objetivo:** so adicionar quando surgir grafico que o SVG custom nao faz barato (barras agrupadas com legenda/tooltip).
- **Comandos:** `npm install recharts`
- **Arquivos provaveis:** UM grafico novo em `StatsPanel.jsx` ou `EnamedProvaAnalyzer.jsx`. NAO substituir `RetrievabilitySpark` nem `AccuracyChart`.
- **Aceite:** novo grafico le dados ja existentes, respeita amostra minima (nao mascarar dado fraco), tema escuro coerente; bundle medido antes/depois.
- **Rollback:** remover o grafico; `npm uninstall recharts`.

### 5.4 radix-ui (P2 - auditar antes)
- **Objetivo:** so substituir um primitivo (Dialog/Tooltip/Tabs/Accordion) se a auditoria achar bug real de foco/teclado/aria.
- **Comandos (so se aprovado):** `npm install @radix-ui/react-dialog` (um pacote por primitivo).
- **Aceite:** primitivo radix com paridade visual (Tailwind) e a11y melhor que o custom, sem refactor global.
- **Rollback:** reverter componente; `npm uninstall`.

### 5.5 Adiadas com gatilho (react-query / react-table / cmdk)
- **react-query** - instalar so se: muitas queries remotas vivas, server-state misturado com Zustand, ou loading/erro/retry ruins. Hoje: nao. Exige Codex/High.
- **react-table** - instalar so se: `BancoDados` crescer e precisar sort/filtro/paginacao server-like. Hoje: nao.
- **cmdk** - instalar so se: TopicBank/taxonomia estavel + navegacao fechada + busca global desejada. Hoje: nao.

---

## 6. Blocos implementaveis

### BLOCO LIB0 - Baseline
**Decisao:** Fazer (sem instalar nada).
**Objetivo:** registrar estado atual (package, build, testes, bundle) para comparar depois de cada bloco.
**Executor recomendado:** Sonnet Low.
**Por que esse executor:** tarefa mecanica de medicao, sem decisao.
**Arquivos permitidos:** nenhum (so leitura/commit de um log opcional em `docs/`).
**Arquivos proibidos:** todo `src/`, `package.json`.
**Comandos:**
```
git status --short
git rev-parse HEAD
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```
**Tarefas:**
1. Rodar os comandos acima e salvar saidas (tamanho do bundle gzip, n. de testes verdes).
2. Confirmar working tree limpa antes de qualquer bloco seguinte.
**Testes:** os proprios comandos.
**Criterios de aceite:** build verde, testes verdes, mojibake OK, baseline anotado.
**Riscos:** nenhum.
**Rollback:** n/a.
**Checkpoint:** anotar `HEAD` e metricas.

---

### BLOCO LIB-TW - Tailwind CDN -> build-time (recomendado, fora das candidatas)
**Decisao:** Recomendado (P1). Nao e uma das libs candidatas, mas e a decisao de dependencia de maior impacto.
**Objetivo:** sair do `cdn.tailwindcss.com` (runtime) para Tailwind compilado no build (PostCSS) - estavel, offline, sem FOUC, bundle menor de runtime.
**Executor recomendado:** Codex/GPT-5.5 High.
**Por que esse executor:** mexe na toolchain do CRA (CRA nao suporta Tailwind nativo; exige CRACO ou config-overrides + PostCSS). Risco de quebrar build/estilos globais.
**Arquivos permitidos:** `package.json`, `public/index.html` (remover o `<script>` do CDN), `tailwind.config.js`, novos `postcss.config.js`/`craco.config.js`, `src/index.css` (diretivas `@tailwind`).
**Arquivos proibidos:** `src/core/*` logica, `src/services/*`, FSRS, store (exceto se import de CSS exigir; justificar).
**Comandos:**
```
npm install -D tailwindcss postcss autoprefixer @craco/craco
# (ou usar craco para CRA; ajustar scripts start/build/test para craco)
```
**Tarefas:**
1. Confirmar todas as classes utilitarias usadas (purge/content paths corretos para nao quebrar estilos).
2. Adicionar diretivas Tailwind ao CSS e config de content.
3. Remover o `<script src="https://cdn.tailwindcss.com">` do `index.html`.
4. Validar visualmente telas-chave (Landing, Dashboard, Cronograma, modais).
**Testes:** `test` + `build`; inspecao visual; medir bundle.
**Criterios de aceite:** zero dependencia de CDN; estilos identicos; build/testes verdes; bundle de runtime menor.
**Riscos:** classes purgadas por engano (content path errado) -> visual quebrado; conflito CRA/CRACO. Alto se feito as pressas.
**Rollback:** `git revert` do bloco; voltar o `<script>` do CDN.
**Checkpoint:** commit dedicado apos validacao visual.

> Nota: se preferir nao mexer na toolchain antes do beta, mantenha o CDN e registre isso como divida tecnica conhecida (P1 pos-beta). Mas e divida real.

---

### BLOCO LIB5 - zod: schemas de fronteira (v0)
**Decisao:** Instalar (P1).
**Objetivo:** schema unico para dados externos (import/backup/persistencia), falha alta e clara.
**Executor recomendado:** Codex/GPT-5.5 High.
**Por que esse executor:** desenho de schema central toca formato de dados persistidos e import - sensivel; precisa raciocinio de arquitetura e integracao com `dataIntegrity`.
**Arquivos permitidos:** novos `src/core/schemas/*.js` + testes; integracao em `src/core/calendarImportCsv.js`, `src/components/CalendarImportWizard.jsx`, `src/core/backup.js`, `src/core/userDataMigration.js`, `src/core/dataIntegrity.js`.
**Arquivos proibidos:** `src/core/fsrs.js`, `agendaEngine.js`, `scheduleWizard.js`, `reviewTaskPlanner.js`, `mentorSignals.js`, `store.js` (logica de estado), `userScope.js`, `services/firebase.js`, regras/JSON do Firebase, FSRS.
**Comandos:**
```
npm install zod
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```
**Tarefas:**
1. Schemas v0: `calendarImport` (CSV/JSON), `backupFile`, `persistedState` (shape do `reviewflow-v6`). Comecar por import (menor blast radius).
2. Aplicar zod no ponto de entrada de cada um, retornando erro tratado (sem corromper store).
3. Integrar com `dataIntegrity` existente (additivo, nao substituir).
4. Testes valido/invalido/borda para cada schema.
**Testes:** unit dos schemas + regressao em `dataIntegrity.test.js`, `calendarImportCsv.test.js`.
**Criterios de aceite:** import/backup malformado bloqueado com mensagem; nada corrompe o store; testes/build verdes.
**Riscos:** schema estrito demais rejeitando dado legitimo antigo; colisao com `dataIntegrity`. Mitigar: schema permissivo no v0, apertar depois.
**Rollback:** `git revert`; `npm uninstall zod`.
**Checkpoint:** commit apos import validado; segundo commit apos backup/persistencia.

---

### BLOCO LIB6 - react-hook-form: um form piloto
**Decisao:** Instalar (P2), so o piloto.
**Objetivo:** validar ganho de RHF em UM form de alto valor e baixo risco.
**Executor recomendado:** Codex/High se o form tocar o store; Sonnet Low se isolado.
**Por que esse executor:** migracao de form que grava no store exige cuidado de integracao.
**Arquivos permitidos:** o componente do form piloto (sugestao: Registro de Simulado) + opcional resolver zod.
**Arquivos proibidos:** demais forms; `DomainTestModal` (acoplado a `domainValidation`); core/store/FSRS/Firebase.
**Comandos:**
```
npm install react-hook-form @hookform/resolvers
npm run check:mojibake && npm test -- --watchAll=false && npm run build
```
**Tarefas:**
1. Migrar so o form piloto para RHF.
2. Validacao via resolver (zod do LIB5, se ja instalado).
3. Garantir paridade de comportamento e de persistencia.
**Testes:** teste do componente piloto; demais forms intactos.
**Criterios de aceite:** form piloto identico ao usuario; menos re-render/boilerplate; testes/build verdes.
**Riscos:** divergencia de comportamento na submissao/persistencia.
**Rollback:** reverter componente; `npm uninstall` se nao houver 2o uso.
**Checkpoint:** commit do piloto.

---

### BLOCO LIB7 - recharts: um grafico novo (condicional)
**Decisao:** Adiar ate existir necessidade de tipo de grafico que o SVG custom nao cobre.
**Objetivo:** um grafico novo (ex.: desempenho por area em barras) sem mexer em calculo.
**Executor recomendado:** Sonnet Medium (grafico isolado) ou Codex/High (se exigir arquitetura de metrica).
**Arquivos permitidos:** UM componente de grafico novo em `StatsPanel.jsx`/`EnamedProvaAnalyzer.jsx`.
**Arquivos proibidos:** `RetrievabilitySpark.jsx`, `AccuracyChart` (manter custom); core de metricas; FSRS.
**Comandos:**
```
npm install recharts
npm run check:mojibake && npm test -- --watchAll=false && npm run build
```
**Tarefas:**
1. Implementar 1 grafico recharts consumindo dados existentes.
2. Respeitar amostra minima (nao mascarar dado fraco).
3. Medir bundle antes/depois.
**Testes:** render do grafico; sem regressao em StatsPanel.
**Criterios de aceite:** grafico util, tema coerente, bundle aceitavel.
**Riscos:** bundle ~100kb; tentacao de migrar charts bons. Evitar.
**Rollback:** remover grafico; `npm uninstall recharts`.
**Checkpoint:** commit do grafico.

---

### BLOCO LIB8 - radix-ui: decisao apos auditoria de a11y
**Decisao:** Auditar antes; instalar so com bug provado.
**Objetivo:** verificar se Dialog/Tooltip/Tabs/Accordion proprios tem bug real de foco/teclado/aria.
**Executor recomendado:** Opus planeja/audita; impl. so depois (Codex/High).
**Arquivos permitidos (auditoria):** so leitura de `src/components/ui/*` e `overlay.test.jsx`/`ui.test.jsx`.
**Arquivos proibidos:** qualquer edicao ate decisao.
**Comandos:** nenhum (auditoria). Se aprovado: `npm install @radix-ui/react-dialog` (um por primitivo).
**Tarefas:**
1. Testar foco/Esc/Tab/aria nos overlays atuais.
2. Decidir por primitivo (nao em bloco gigante).
**Criterios de aceite:** decisao documentada; so adotar radix onde houver ganho real de a11y.
**Riscos:** virar refactor global. Evitar.
**Rollback:** n/a (auditoria).
**Checkpoint:** decisao registrada neste doc.

---

### BLOCO LIB9 - Adiar react-query / react-table / cmdk
**Decisao:** Adiar. Documentar gatilhos.
**Objetivo:** registrar quando reavaliar.
**Executor recomendado:** Opus (decisao) / Sonnet Low (registrar).
**Gatilhos para reabrir:**
- **react-query:** server-state passar a dominar (varias queries vivas, retry/cache/loading ruins com Zustand).
- **react-table:** `BancoDados` precisar sort/filtro/paginacao reais.
- **cmdk:** taxonomia/TopicBank estavel + navegacao fechada + demanda por busca global.
**Criterios de aceite:** gatilhos documentados; nada instalado.

---

## 7. Prompts prontos para execucao

### Prompt - BLOCO LIB0
```
Execute somente o BLOCO LIB0 (baseline). Nao instale nada. Nao altere src/ nem package.json.
Rode e cole as saidas:
  git status --short
  git rev-parse HEAD
  npm run check:mojibake
  npm test -- --watchAll=false
  npm run build
Entregue: HEAD, n. de testes verdes, tamanho do bundle gzip, confirmacao de working tree limpa.
```

### Prompt - BLOCO LIB-TW (Tailwind CDN -> build)
```
Execute somente o BLOCO LIB-TW.
Executor alvo: Codex/GPT-5.5 High.
Nao altere: src/core/* (logica), src/services/*, FSRS, store (logica), Firebase/Auth/Firestore/Data Safety.
Permitido: package.json, public/index.html, tailwind.config.js, postcss.config.js/craco.config.js, src/index.css, scripts npm.
Tarefas:
  1. Configurar Tailwind build-time (CRACO/PostCSS) com content paths corretos.
  2. Adicionar diretivas @tailwind ao CSS.
  3. Remover <script src="https://cdn.tailwindcss.com"> de index.html.
  4. Validar visualmente Landing, Dashboard, Cronograma e modais.
Rode: npm run check:mojibake && npm test -- --watchAll=false && npm run build
Pare e entregue: arquivos alterados, comandos, testes/build, comparacao de bundle, riscos, proximos passos.
Se algum estilo quebrar, NAO force; reverta e relate.
```

### Prompt - BLOCO LIB5 (zod)
```
Execute somente o BLOCO LIB5 (zod, schemas de fronteira).
Executor alvo: Codex/GPT-5.5 High.
Nao instale outras libs. Nao refatore fora do escopo.
Nao altere: src/core/fsrs.js, agendaEngine.js, scheduleWizard.js, reviewTaskPlanner.js, mentorSignals.js, store.js (logica), userScope.js, services/firebase.js, regras/JSON do Firebase, FSRS, Data Safety.
Permitido: novos src/core/schemas/*.js + testes; integracao em calendarImportCsv.js, CalendarImportWizard.jsx, backup.js, userDataMigration.js, dataIntegrity.js (additivo).
Comece pelo schema de import de calendario (menor blast radius). Depois backup e persistencia.
Schemas devem falhar alto e claro, sem corromper o store. Schema permissivo no v0.
Rode: npm install zod && npm run check:mojibake && npm test -- --watchAll=false && npm run build
Pare e entregue: arquivos alterados, comandos, testes/build, riscos, proximos passos.
```

### Prompt - BLOCO LIB6 (react-hook-form, piloto)
```
Execute somente o BLOCO LIB6 (react-hook-form, 1 form piloto).
Executor alvo: Codex/GPT-5.5 High se o form gravar no store; Sonnet Low se isolado.
Migre APENAS um form (Registro de Simulado). Nao migre outros forms. Nao toque DomainTestModal.
Nao altere core/store/FSRS/Firebase alem do necessario para o form piloto (justifique se preciso).
Use resolver (zod do LIB5 se ja instalado). Garanta paridade de comportamento e persistencia.
Rode: npm install react-hook-form @hookform/resolvers && npm run check:mojibake && npm test -- --watchAll=false && npm run build
Pare e entregue: arquivos alterados, comandos, testes/build, riscos, proximos passos.
```

### Prompt - BLOCO LIB7 (recharts, condicional)
```
Execute somente o BLOCO LIB7 (recharts, 1 grafico novo) - SOMENTE se aprovado o tipo de grafico.
Executor alvo: Sonnet Medium (grafico isolado) ou Codex/High.
Adicione UM grafico novo consumindo dados existentes. NAO substitua RetrievabilitySpark nem AccuracyChart.
Respeite amostra minima (nao mascarar dado fraco). Meca o bundle antes/depois.
Rode: npm install recharts && npm run check:mojibake && npm test -- --watchAll=false && npm run build
Pare e entregue: arquivos alterados, comparacao de bundle, testes/build, riscos, proximos passos.
```

---

## 8. Arquivos proibidos por padrao (todos os blocos, salvo justificativa explicita)
```
src/core/fsrs.js
src/core/store.js (logica de estado)
src/core/agendaEngine.js
src/core/scheduleWizard.js
src/core/reviewTaskPlanner.js
src/core/mentorSignals.js
src/core/userScope.js
src/services/firebase.js
src/firebase.js
firestore.rules        (se existir)
firebase.json          (se existir)
```
Tambem nao mexer em: FSRS, Auth, Firestore rules, Data Safety, persistencia (`reviewflow-v6`) - exceto se a lib exigir e estiver justificado no bloco (caso de zod tocando `dataIntegrity`/`userDataMigration` de forma additiva).

---

## 9. Comandos de validacao (sempre)
Ao instalar algo:
```
npm install <pacote>
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```
Depois de cada bloco:
```
git status --short
```
**Nao prosseguir se:** build quebrar; testes quebrarem em area nao relacionada; mojibake novo; auth/login quebrar; app nao carregar; conflito grave de pacote.

---

## 10. Criterios finais de aprovacao
Uma integracao de lib so e aprovada se: melhora experiencia real; nao altera regra de negocio; nao quebra login/build; nao cria dependencia desnecessaria; nao infla bundle de forma irracional; nao duplica solucao boa existente; nao introduz UI kit conflitante; melhora consistencia/feedback/validacao/manutencao; respeita o beta/release.

## 11. O que NAO fazer
Nao instalar tudo de uma vez; nao migrar todos os forms; nao trocar todos os overlays por radix; nao trocar todos os graficos; nao criar command palette agora; nao instalar react-query sem evidencia; nao instalar react-table com cards bastando; nao adicionar UI kit grande; nao adicionar lib de animacao alem de framer-motion; nao criar feature nova em nome de lib; nao mexer em core sensivel sem motivo.

---

## 12. Apendice - evidencias da auditoria (comandos rodados)
- `package.json`: confirma framer-motion 12.40, lucide-react 1.16, zustand 5, firebase 12, ts-fsrs; sem zod/rhf/sonner/recharts/radix/tanstack/cmdk.
- `git grep -l "lucide-react" src` -> 58 arquivos. `git grep -l "framer-motion" src` -> 32 arquivos.
- `git grep -liE "zod|react-hook-form|@hookform|sonner|recharts|@radix-ui|@tanstack|cmdk" src` -> nenhum.
- `<input>`=37, `<select>`=11, `<textarea>`=8. `<table>` em 2 arquivos (BancoDados, RaciocinioClinico).
- `alert(`/`confirm(` nativos = 0.
- Toast: `src/components/ui/Toast.jsx` (51 linhas, portal+AnimatePresence+tons+undo) ligado a `store.showToast`/`dismissToast`, usado em ~10+ componentes.
- Charts custom: `RetrievabilitySpark.jsx`, `StatsPanel.jsx` (1714 linhas, `AccuracyChart`).
- Validacao core: `domainValidation.js` (906), `readinessValidation.js` (152), `numberInput.js` (74), `dataIntegrity.js` (108).
- Firestore: `onSnapshot` em store.js/Dashboard.jsx; 1 `getDocs` no app (local-first).
- Tailwind: via `<script src="https://cdn.tailwindcss.com">` em `public/index.html` (runtime CDN).
```
```
