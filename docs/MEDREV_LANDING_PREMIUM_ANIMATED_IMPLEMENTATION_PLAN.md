# MedRev — Landing Page Premium Animada — Plano de Implementação

> **Modo:** Opus planeja / Sonnet Low executa.
> **Data:** 2026-06-10
> **Engine de animação:** `framer-motion@12.40.0` (instalado, compatível com React 19).
> **Status:** A Landing já existe e está integrada ao auth. Este plano transforma a versão **estática** atual em uma versão **product-led, animada e com menos texto**, reutilizando componentes que já existem no projeto (`Tabs`, `SegmentedControl`, `useReducedMotion`, `useCountUp`).
> **Regra de ouro:** Não explicar tudo em texto. Mostrar. Reduzir o texto visível em pelo menos 40%.

---

## 1. Auditoria da landing atual / pré-login

### 1.1 Integração de auth (já correta — não mexer)
- `src/App.js`: estado `usuarioLogado` + `authSession`. Listener `monitorarAuth` (`App.js:445`). Timeout de segurança 5s (`App.js:594`).
- Ordem de render: `carregandoAuth` → splash; `!usuarioLogado` → **`<LandingPage onLogin onSignup/>`** + `AuthModal` condicional (`App.js:1067`); autenticado → app.
- CTAs chamam `onLogin = () => openAuthModal("login")` e `onSignup = () => openAuthModal("signup")` (`App.js:306`).
- `AuthModal` (`src/components/AuthModal.jsx`) cobre login/signup/reset. Contrato `{ onSuccess, initialMode, onClose }`. **Não criar segundo sistema de auth.**

### 1.2 Estado atual da `LandingPage.jsx`
Arquivo único `src/components/LandingPage.jsx` (~470 linhas, untracked). Já contém, em **versão estática**:
- Navbar sticky com logo animado (`med-logo-entrance`), âncoras, Entrar, Começar beta.
- Hero com logo flutuante (`med-logo-hero`) + mockup "Comando do dia" (`MockPanel`, 5 linhas estáticas).
- A dor real (grid 5 cards), Antes/Depois (2 colunas estáticas), Como funciona (7 passos), Recursos (grid estático de 9), Método (5 cards), Diferencial (tabela), Para quem é / não é, Beta, Segurança, Sem promessas falsas, FAQ (`<details>`), CTA final com logo completo, Footer.
- Copy já em **português com acentuação correta** (UTF-8). Logo: `public/logo512.png` (ícone) e `public/medrev-full-1024.png` (completo).

### 1.3 Diagnóstico — texto demais, animação de menos
| Sintoma | Onde | Correção |
|---|---|---|
| Hero estático | `MockPanel` | mockup animado (stagger, pulso, barra de progresso, badges) |
| Dor = lista de cards parados | "A dor real" | caos disperso → convergência no scroll |
| Antes/Depois = 2 colunas frias | "Antes e Depois" | toggle `SegmentedControl` + `AnimatePresence` |
| Recursos = grid de 9 parágrafos | "Recursos" | **Tabs** com mini-mockup + ≤3 bullets |
| Sem narrativa de "como pensa" | — | nova seção inputs → motor → próxima ação |
| Método em texto | "Método" | 5 cards curtos + accordion "ver método" |
| Muito parágrafo no mobile | várias | cortar texto ≥40%, virar bullets/tooltips |
| Reveal inexistente no scroll | global | `whileInView` em todas as seções |

### 1.4 Ferramentas já disponíveis no projeto (reutilizar, não recriar)
- **`framer-motion@12.40.0`** — engine principal de animação.
- **`src/components/ui/`**: `Tabs`, `SegmentedControl`, `Card`, `Button`, `Badge`, `Tooltip`, `MetricRing`, `Dialog`, `Sheet`, `Toast`, `Skeleton`, `EmptyState` (barrel em `src/components/ui/index.js`). Usam tokens CSS `--med-*` via estilo inline.
- **Hooks**: `useReducedMotion` (`src/hooks/useReducedMotion.js`, default export), `useCountUp` (`src/hooks/useCountUp.js`, RAF, respeita reduced-motion).
- **Classes CSS** (`src/index.css`): `med-card`, `med-card-interactive`, `med-pressable`, `med-focus-ring`, `med-animate-in`, `med-logo-entrance`, `med-logo-hero`; bloco `@media (prefers-reduced-motion: reduce)` já cobre todas as `med-*`.
- **Tokens CSS**: `--med-surface-0/1/2`, `--med-border-subtle/strong`, `--med-text-strong/muted`, `--med-radius-sm/md/lg`, `--med-duration-fast/base/slow`, `--med-ease-out`.

### 1.5 APIs dos componentes reutilizados (contratos exatos)
```jsx
// Tabs — controlado
<Tabs
  ariaLabel="Recursos do MedRev"
  activeValue={tab}
  onValueChange={setTab}
  tabs={[{ value: "plano", label: "Plano", children: <PainelPlano />, disabled: false }, ...]}
/>

// SegmentedControl — controlado (radiogroup)
<SegmentedControl
  ariaLabel="Antes ou depois do MedRev"
  value={modo}            // "antes" | "depois"
  onChange={setModo}
  options={[{ value: "antes", label: "Antes" }, { value: "depois", label: "Depois" }]}
/>
```

---

## 2. Comparação conceitual com concorrentes (sem copiar)

> Análise de **padrões de mercado** (Medway, MedCof, MedEvo, Estratégia MED, plataformas de Anki/cronograma, bancos de questões). Objetivo: entender convenções e definir a diferenciação do MedRev. **Nenhum texto, marca, layout ou identidade é copiado.**

### 2.1 Padrões observados nas plataformas de preparação médica
| Eixo | Padrão dominante do mercado | Implicação |
|---|---|---|
| **Hero** | Imagem de curso/professor + "Matricule-se" + turma/intensivo | Vende **conteúdo**, não produto |
| **CTA** | "Comprar", "Matricular", gatilho de escassez (vagas, contagem regressiva) | Fricção comercial alta |
| **Mockups** | Pouco produto em movimento; mais banners e fotos | Espaço para diferenciação |
| **Prova social** | **Forte ênfase em "X aprovados", ranking, depoimentos** | MedRev **não** tem isso ainda (e não deve inventar) |
| **Animações** | Carrosséis, contadores, pouca microinteração refinada | Espaço para premium discreto |
| **Densidade de texto** | Alta (descrição de módulos, ementas) | MedRev deve ir ao oposto: mostrar |
| **Números** | Estatísticas de aprovação como argumento central | MedRev troca por **transparência metodológica** |
| **Diferencial** | "Mais questões", "mais horas de vídeo", "professores" | MedRev = **orquestração**, não volume |
| **Mostrar produto** | Screenshots estáticos | MedRev = **mockup vivo** (Comando do Dia) |
| **Reduzir fricção** | Trial/aula grátis, depois paywall | MedRev = **beta 100% gratuito, sem checkout** |

### 2.2 Onde o MedRev se diferencia (wedge)
1. **Não é conteúdo, é sistema.** O concorrente vende aulas/questões; o MedRev orquestra o que o aluno **já usa** (cursinho, Anki, banco). Posicionamento de *camada operacional*, não de *biblioteca*.
2. **Honestidade como contraste.** O mercado satura de "aprovados garantidos". O MedRev assume "**não decide sua aprovação, organiza o próximo passo**" — isso vira diferencial de confiança, não fraqueza.
3. **Product-led.** A prova é o produto em movimento (Comando do Dia, motor de decisão), não foto de professor.
4. **Método explícito.** Prática de recuperação, FSRS, auditoria de erro — vocabulário de ciência da aprendizagem, em cards curtos, não em ementa.
5. **Sem fricção comercial.** Beta gratuito, sem preço, sem checkout — entra direto na experiência.

### 2.3 Substitutos honestos para prova social (já que não há números reais)
- "Beta gratuito, construído com estudantes reais."
- "Sem promessa de aprovação."
- "Você usa seus próprios materiais."
- Mockup funcional como demonstração.
- Clareza metodológica (cards de método).

---

## 3. Nova arquitetura da landing (alvo)

Ordem final (✅ existe / ⬆️ upgrade / ➕ novo):

1. ⬆️ **Navbar premium sticky** — blur intensifica no scroll; menu mobile (`AnimatePresence` + `Sheet`).
2. ⬆️ **Hero + mockup "Comando do Dia" animado** — stagger, pulso na próxima ação, barra de progresso, badges D0/D7/Simulado/Anki.
3. ➕ **O caos antes do MedRev** — cards dispersos convergem para "Plano do dia" no scroll.
4. ⬆️ **Antes vs Depois** — toggle `SegmentedControl` + transição `AnimatePresence`.
5. ➕ **Como o MedRev pensa** — inputs → motor (Mentor de decisão) → próxima ação, com conectores animados.
6. ⬆️ **Feature showcase com Tabs** — substitui o grid de 9; 7 tabs, cada uma com frase + mini-mockup + ≤3 bullets.
7. ⬆️ **Método por trás** — 5 cards curtos + accordion "ver método".
8. ⬆️ **Beta gratuito** — checklist com entrada em sequência + brilho sutil.
9. ✅ **Para quem é / não é** — cards (já ok; reduzir texto).
10. ➕ **Transparência de beta** — 5 cards de confiança (expande "Sem promessas falsas").
11. ⬆️ **FAQ accordion** — animar abertura (height/opacity) respeitando reduced-motion.
12. ⬆️ **CTA final cinematográfico** — logo completo + glow + "Menos improviso. Mais execução."
13. ✅ **Footer**.

**Decisão de arquitetura:** com framer-motion e o crescimento do arquivo, **extrair seções para `src/components/landing/`** (uma seção por arquivo) + um módulo compartilhado `src/components/landing/motion.js` com as `variants`. Isso mantém cada bloco do Sonnet em **um arquivo**, reduz conflito e facilita rollback. `LandingPage.jsx` vira o orquestrador que importa as seções.

---

## 4. Copy final reduzida (UTF-8 com acentos — o gate de mojibake aceita acentuação correta)

> Regra: nenhum parágrafo com mais de 2 linhas no mobile. Preferir bullets curtos.

**Hero**
- Headline: `Seu sistema operacional de estudos para residência médica.`
- Sub: `Cronograma, revisões, erros, simulados, Anki e raciocínio clínico em uma fila diária de execução.`
- Badge: `Beta gratuito para estudantes de Medicina`
- CTA1: `Começar beta gratuito` · CTA2: `Ver como funciona` · Microcopy: `Sem cobrança nesta fase.`

**Mockup Comando do Dia**
- Header: `Comando do dia` · `Hoje: 4 tarefas · 2h20`
- Itens: `1. Revisar Pré-eclâmpsia — D7` / `2. Estudar Tuberculose — D0` / `3. Corrigir 8 erros do simulado` / `4. Zerar Anki`
- Destaque: `Próxima ação: Começar revisão de Pré-eclâmpsia`

**Caos antes do MedRev**
- Título: `O problema não é falta de material. É falta de sistema.`
- Cards: `Cronograma separado` / `Anki separado` / `Simulado vira só nota` / `Erro esquecido` / `Revisão atrasada` / `Estatística sem decisão`
- Centro: `Plano do dia`

**Antes vs Depois** (toggle)
- Antes: `Planilha` / `Banco de questões` / `Anki` / `Simulado` / `Erro` / `Decidir sozinho`
- Depois: `Plano diário` / `Revisão espaçada` / `Erro vira ação` / `Simulado ajusta prioridade` / `Anki na rotina` / `Mentor mostra o próximo passo`

**Como o MedRev pensa**
- Entram: `cronograma · questões · erros · simulados · Anki · revisão · raciocínio clínico`
- Motor (`Mentor de decisão`): `prioridade · tempo disponível · dificuldade · atraso · risco de esquecimento`
- Saída: `Próxima ação`
- Frase: `O MedRev transforma sinais soltos em decisão diária.`

**Feature showcase (Tabs)** — cada tab: 1 frase + ≤3 bullets + mini-mockup
- `Plano`: `Seu cronograma vira fila executável.` — `temas até a prova` / `distribui por prioridade` / `ajusta com seu ritmo`
- `FSRS`: `Revisões por tema no momento certo.` — `D0, D1, D4, D7, D21` / `teste de domínio para temas antigos` / `sem checklist infinito`
- `Erros`: `Cada erro aponta uma ação.` — `classifica o tipo de erro` / `vira tarefa de correção` / `alimenta a prioridade`
- `Simulados`: `O simulado muda o plano.` — `registra desempenho` / `audita por área` / `reordena prioridades`
- `Raciocínio Clínico`: `Treino de decisão, não decoreba.` — `illness scripts` / `diferenciais` / `conduta progressiva`
- `Anki`: `O Anki entra na rotina.` — `adesão e cards do dia` / `novos vs revisados` / `dentro do plano`
- `Estatísticas`: `Métricas que viram decisão.` — `por área e por prova` / `atraso e risco` / `próxima ação clara`

**Método por trás**
- Título: `Um método de estudo, não só um app.`
- Cards: `Prática de recuperação` / `Revisão espaçada` / `Auditoria de erros` / `Feedback direcionado` / `Acompanhamento longitudinal`
- Accordion "ver método": parágrafo científico curto (1–3 linhas) por card.

**Beta gratuito**
- Título: `Beta gratuito. Construído com estudantes reais.`
- Inclui: `Cronograma · Agenda · Revisões · Simulados · Erros · Raciocínio clínico · Anki Audit · Estatísticas`
- CTA: `Participar do beta gratuito` · Aviso: `Algumas funções podem mudar durante o beta.`

**Para quem é / não é**
- É: `quer consistência` / `usa cursinho, Anki ou material próprio` / `cansou de decidir tudo do zero` / `quer transformar erro em plano`
- Não é: `quer promessa de aprovação` / `quer só banco de questões` / `não quer registrar nada` / `quer automação no lugar de estudo ativo`

**Transparência de beta** (5 cards)
- `Sem promessa de aprovação` / `Sem cobrança nesta fase` / `Sem substituir seu cursinho` / `Você usa seus materiais` / `O MedRev organiza a execução`

**FAQ** (accordion): as 7 perguntas já presentes no arquivo.

**CTA final**
- Título: `Entre no beta e ajude a construir uma preparação mais inteligente.`
- Sub: `A direção é clara: transformar estudo médico em um sistema diário de decisão.`
- Botão: `Começar beta gratuito` · Frase final: `Menos improviso. Mais execução.`

---

## 5. Plano visual (estética)

- Dark premium médico-tecnológico: fundos `#05070d` / `#070810` / `#0b1220`; acento `blue-600 → cyan-500`; verde `emerald-300` para "incluído"; âmbar discreto para "não é".
- Cards em vidro: `med-card` / borda `white/8` / `backdrop-blur` pontual; glow moderado por seção (blobs `blur-[120px]` de baixa opacidade — padrão já usado).
- Grid sutil de fundo opcional (CSS `linear-gradient` em máscara radial) — leve, sem poluir.
- Mockups com cara de produto real (chrome de dashboard, badges, barra de progresso).
- **Sem neon excessivo, sem parallax agressivo, sem partículas pesadas.**

---

## 6. Plano de animações (framer-motion)

### 6.1 Configuração global
- Envolver a árvore da landing em `<MotionConfig reducedMotion="user">` **dentro de `LandingPage.jsx`** (não tocar `App.js`). Assim toda animação respeita `prefers-reduced-motion` automaticamente.
- Módulo `src/components/landing/motion.js` exporta `variants` compartilhadas:
```js
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: .5, ease: [0.22, 1, 0.36, 1] } },
};
export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: .08, delayChildren: .05 } },
};
```
- Reveal padrão por seção: `motion.section` com `initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={staggerParent}`; filhos com `variants={fadeUp}`.

### 6.2 Animações por seção
| Seção | Técnica framer-motion |
|---|---|
| Navbar | `useScroll` + `useMotionValueEvent` → alterna classe de blur/opacidade ao passar ~12px |
| Hero mockup | `staggerChildren` nos itens; `animate={{ scale:[1,1.03,1] }}` em loop suave na "próxima ação"; barra de progresso `motion.div` com `whileInView` width 0→% |
| Caos → Plano | itens com `variants` saindo de offsets dispersos (`x/y/rotate`) para `0` no `whileInView`; reduced-motion → só fade |
| Antes/Depois | `SegmentedControl` controla estado; conteúdo em `AnimatePresence mode="wait"` com fade/slide curto |
| Como pensa | conectores como `motion.path`/`motion.div` com `pathLength`/`scaleX` 0→1 em stagger; card central com leve `boxShadow` pulse |
| Tabs showcase | `Tabs` existente + painel em `AnimatePresence` (fade) na troca |
| Método accordion | altura via `motion.div` (`height: auto` animável do framer) |
| Beta checklist | `staggerChildren` nos itens incluídos; glow `boxShadow` estático/suave |
| FAQ | abertura animada (height/opacity) — substituir `<details>` por estado controlado + `AnimatePresence` |
| CTA final | logo com `whileInView` scale-in + glow `med-logo-hero` |

### 6.3 Proibições de animação
- Sem autoplay de vídeo, sem loops agressivos infinitos, sem partículas, sem parallax exagerado, sem libs além de framer-motion.
- Todo loop infinito deve ser sutil (escala ≤1.03, opacidade, sombra) e parar com reduced-motion.

---

## 7. Componentes necessários

Criar em `src/components/landing/` (um arquivo por seção; default export; props só de callbacks `onLogin/onSignup` quando precisar):
```
src/components/landing/motion.js            (variants compartilhadas)
src/components/landing/Navbar.jsx
src/components/landing/Hero.jsx             (inclui ComandoDoDiaMock)
src/components/landing/ChaosSection.jsx
src/components/landing/BeforeAfter.jsx
src/components/landing/HowItThinks.jsx
src/components/landing/FeatureShowcase.jsx  (usa ui/Tabs)
src/components/landing/Method.jsx
src/components/landing/BetaSection.jsx
src/components/landing/Audience.jsx
src/components/landing/Transparency.jsx
src/components/landing/Faq.jsx
src/components/landing/FinalCta.jsx
src/components/landing/Footer.jsx
```
`LandingPage.jsx` importa e orquestra. Reaproveitar `PrimaryButton`/`SecondaryButton`/`SectionIntro` (mover para `landing/primitives.jsx` se forem compartilhados).

---

## 8. Arquivos permitidos x proibidos

| Permitido (Sonnet Low) | Proibido |
|---|---|
| `src/components/LandingPage.jsx` | `src/core/*` (fsrs, store, agendaEngine, scheduleWizard, mentorSignals, userScope…) |
| `src/components/LandingPage.test.jsx` | `src/services/*` (firebase, userDataPaths…) |
| `src/components/landing/*` (novos) | `src/App.js` (já integrado — não tocar) |
| `src/index.css` (append no fim; nunca editar tokens existentes) | `src/components/AuthModal.jsx` |
| `docs/*` | `firestore.rules`, `firebase.json`, Data Safety, `src/components/ui/*` (consumir, não editar) |

**Não instalar bibliotecas** (framer-motion já está). **Não** alterar Firebase/Auth/Firestore/FSRS/Cronograma/Agenda/Store. **Não** criar cobrança/checkout/plano pago. **Não** usar imagem externa (usar `public/logo512.png` e `public/medrev-full-1024.png`).

---

## 9. Blocos para Sonnet Low

> Formato por bloco: objetivo · arquivos permitidos · proibidos · tarefas · comandos · aceite · riscos · rollback · prompt pronto.
> Comandos de validação (todos os blocos): `npm run check:mojibake` · `npm test -- --watchAll=false` · `npm run build`.
> Rollback padrão: `git checkout -- <arquivo>` (ou apagar o arquivo novo).

### BLOCO LP-A1 — Integração pré-login segura + MotionConfig
**Objetivo:** Garantir que a Landing só aparece para não autenticado e habilitar respeito global a reduced-motion via framer-motion, **sem tocar App.js**.
**Permitidos:** `src/components/LandingPage.jsx`. **Proibidos:** `App.js`, core, services, AuthModal, ui.
**Tarefas:**
1. Confirmar que `LandingPage` recebe `onLogin/onSignup` e que o gating em `App.js:1067` já cobre `!usuarioLogado` (somente leitura; não editar App.js).
2. Importar `MotionConfig` de `framer-motion` e envolver o `return` da `LandingPage` com `<MotionConfig reducedMotion="user">…</MotionConfig>`.
3. Smoke: nenhuma regressão de render.
**Aceite:** landing renderiza; testes atuais passam; build ok.
**Riscos:** baixo. **Rollback:** `git checkout -- src/components/LandingPage.jsx`.

### BLOCO LP-A2 — Estrutura `landing/`, variants e tokens
**Objetivo:** Criar o esqueleto modular e as `variants` compartilhadas, sem mudar conteúdo visível ainda.
**Permitidos:** `src/components/landing/*`, `src/components/LandingPage.jsx`, `src/index.css` (append). **Proibidos:** idem A1.
**Tarefas:**
1. Criar `src/components/landing/motion.js` com `fadeUp`, `staggerParent`, `scaleIn` (seção 6.1).
2. Criar `src/components/landing/primitives.jsx` movendo `PrimaryButton`, `SecondaryButton`, `SectionIntro`, `Blob` (export nomeado).
3. Atualizar `LandingPage.jsx` para importar desses primitivos (sem mudar layout).
4. (Opcional) Append no `index.css` de classe utilitária `.med-grid-bg` (grid sutil) se for usar.
**Aceite:** visual idêntico ao atual; testes/build ok.
**Riscos:** import quebrado. **Rollback:** git checkout dos arquivos.

### BLOCO LP-A3 — Hero premium + mockup Comando do Dia animado ⚠️
**Objetivo:** Hero visual com mockup animado (stagger, pulso na próxima ação, barra de progresso, badges).
**Permitidos:** `src/components/landing/Hero.jsx`, `src/components/LandingPage.jsx`. **Proibidos:** idem.
**Tarefas:**
1. Criar `Hero.jsx` com headline/sub/badge/CTAs (copy §4) usando `PrimaryButton`/`SecondaryButton`.
2. `ComandoDoDiaMock`: header `Hoje: 4 tarefas · 2h20`; 4 itens (copy §4) entrando com `staggerChildren`; badges D0/D7/Simulado/Anki (`ui/Badge`).
3. Barra de progresso: `motion.div` `whileInView` width 0→~65%.
4. "Próxima ação": card com `animate={{ scale:[1,1.03,1] }} transition={{ repeat: Infinity, duration: 2.4 }}` (some com reduced-motion via MotionConfig).
5. Manter logo flutuante (`med-logo-hero`).
**Aceite:** hero explica o produto em ~5s; mockup anima; sem overflow 390px; testes/build ok.
**Riscos:** loop infinito ignorando reduced-motion (mitigado por MotionConfig); altura do mockup no mobile. **Rollback:** git checkout.

### BLOCO LP-A4 — Caos antes do MedRev + Antes/Depois ⚠️
**Objetivo:** Seção de caos (convergência) + comparação com toggle.
**Permitidos:** `src/components/landing/ChaosSection.jsx`, `src/components/landing/BeforeAfter.jsx`, `src/components/LandingPage.jsx`. **Proibidos:** idem.
**Tarefas:**
1. `ChaosSection`: 6 cards (copy §4) com `variants` saindo de offsets dispersos (`x/y/rotate`) → `0` no `whileInView`; card central "Plano do dia". Reduced-motion → só fade (garantido pelo MotionConfig + variants sem transform exagerado).
2. `BeforeAfter`: `SegmentedControl` (`value` antes/depois) controla `AnimatePresence mode="wait"`; lista correspondente (copy §4). Coluna "depois" com check cyan/emerald.
3. Inserir ambas em `LandingPage.jsx` (caos substitui a atual "A dor real").
**Aceite:** convergência perceptível; toggle troca conteúdo suave; mobile ok; testes/build ok.
**Riscos:** layout shift na convergência; `AnimatePresence` key incorreta. **Rollback:** git checkout.

### BLOCO LP-A5 — Como o MedRev pensa ⚠️
**Objetivo:** Fluxo inputs → motor (Mentor de decisão) → próxima ação, com conectores animados.
**Permitidos:** `src/components/landing/HowItThinks.jsx`, `src/components/LandingPage.jsx`. **Proibidos:** idem.
**Tarefas:**
1. Três colunas: entradas (7 chips), motor central (card "Mentor de decisão" com 5 critérios), saída ("Próxima ação").
2. Conectores: `motion.div`/SVG `motion.path` com `scaleX`/`pathLength` 0→1 em `whileInView` com stagger.
3. Frase curta de fechamento (copy §4).
**Aceite:** leitura clara do fluxo; anima no scroll; mobile empilha; testes/build ok.
**Riscos:** SVG responsivo complexo (preferir divs + linhas CSS se travar). **Rollback:** git checkout.

### BLOCO LP-A6 — Feature showcase com Tabs
**Objetivo:** Substituir o grid de 9 por `ui/Tabs` (7 tabs) com frase + mini-mockup + ≤3 bullets.
**Permitidos:** `src/components/landing/FeatureShowcase.jsx`, `src/components/LandingPage.jsx`. **Proibidos:** `src/components/ui/*` (consumir só). 
**Tarefas:**
1. Importar `{ Tabs }` de `../ui`. Estado `activeValue` com `useState`.
2. 7 tabs (copy §4): Plano, FSRS, Erros, Simulados, Raciocínio Clínico, Anki, Estatísticas.
3. Cada painel: frase + `≤3` bullets + mini-mockup simples (`med-card`).
4. Envolver troca de painel em `AnimatePresence` (fade curto) — opcional, sem quebrar a11y do `Tabs`.
5. Remover o grid de 9 estático.
**Aceite:** tabs navegáveis por teclado (já no componente); menos texto; testes/build ok.
**Riscos:** duplicar role tab se reembrulhar errado. **Rollback:** git checkout.

### BLOCO LP-A7 — Método + Beta + Transparência
**Objetivo:** Método curto com accordion, Beta com checklist animado, Transparência em 5 cards.
**Permitidos:** `src/components/landing/Method.jsx`, `BetaSection.jsx`, `Transparency.jsx`, `LandingPage.jsx`. **Proibidos:** idem.
**Tarefas:**
1. `Method`: 5 cards curtos (copy §4) + accordion "ver método" (`motion.div` height auto) com 1–3 linhas científicas por card.
2. `BetaSection`: checklist de inclusões com `staggerChildren`; CTA `Participar do beta gratuito`; aviso honesto; **sem preço/checkout**.
3. `Transparency`: 5 cards (copy §4) — substitui/expande "Sem promessas falsas".
**Aceite:** método enxuto; beta sem cobrança; transparência presente; testes/build ok.
**Riscos:** baixo. **Rollback:** git checkout.

### BLOCO LP-A8 — FAQ accordion + CTA final + Footer
**Objetivo:** FAQ animado, CTA cinematográfico, footer sem links quebrados.
**Permitidos:** `src/components/landing/Faq.jsx`, `FinalCta.jsx`, `Footer.jsx`, `LandingPage.jsx`. **Proibidos:** idem.
**Tarefas:**
1. `Faq`: estado controlado + `AnimatePresence` (height/opacity) nas 7 perguntas; um aberto por vez (opcional).
2. `FinalCta`: logo completo (`med-logo-hero`), título/sub (copy §4), botão, frase final `Menos improviso. Mais execução.`.
3. `Footer`: ícone + wordmark; só botões Entrar/Começar beta (não criar Termos/Privacidade se não existirem).
**Aceite:** FAQ abre/fecha animado; CTA forte; sem link morto; testes/build ok.
**Riscos:** baixo. **Rollback:** git checkout.

### BLOCO LP-A9 — Polish mobile, acessibilidade e motion
**Objetivo:** 390px sem overflow, foco visível, headings em ordem, reduced-motion validado.
**Permitidos:** `src/components/landing/*`, `src/components/LandingPage.jsx`, `src/index.css` (append). **Proibidos:** idem.
**Tarefas:**
1. Revisar 390/768/1366/1440px; corrigir grids que estouram; `overflow-x-hidden` no root (já presente).
2. Um único `<h1>` (hero); demais `<h2>/<h3>`; `aria-label` onde o texto não basta; foco via `med-focus-ring`.
3. Validar reduced-motion: com `prefers-reduced-motion`, loops param e reveals viram estado final.
**Aceite:** sem scroll horizontal 390px; foco navegável por teclado; reduced-motion ok; testes/build ok.
**Riscos:** ajuste de grid afetar desktop. **Rollback:** git checkout.

### BLOCO LP-A10 — Testes / build / check final
**Objetivo:** Validar tudo e ampliar o teste.
**Permitidos:** `src/components/LandingPage.test.jsx`, `src/components/landing/*`. **Proibidos:** idem.
**Tarefas:**
1. Ampliar `LandingPage.test.jsx`: presença de headline, CTA "beta gratuito", Tabs (um label), toggle Antes/Depois, "Como o MedRev pensa", "Sem promessa de aprovação"; callbacks `onLogin/onSignup`. Matchers regex tolerantes.
2. Rodar a tríade.
3. Relatório: arquivos, o que foi feito, saída testes/build, riscos.
**Aceite:** `check:mojibake` ok; testes verdes; build ok; nenhum core alterado.
**Riscos:** teste frágil por texto exato (usar regex). **Rollback:** git checkout.

---

## 10. Prompts prontos para Sonnet Low

> Trocar `LP-AX` e colar as Tarefas do bloco. Modelo:

```
Execute somente o BLOCO LP-AX do documento docs/MEDREV_LANDING_PREMIUM_ANIMATED_IMPLEMENTATION_PLAN.md.

Não execute blocos futuros. Não refatore fora do escopo. Não instale bibliotecas (framer-motion já está instalado). Não altere Firebase/Auth/Firestore. Não altere core do MedRev (src/core/*, src/services/*). Não altere src/App.js, src/components/AuthModal.jsx nem src/components/ui/* (apenas consumir).
Use copy em português com acentuação correta (o arquivo atual já usa). Reuse helpers e componentes existentes: PrimaryButton, SecondaryButton, SectionIntro, classes med-*, ui/Tabs, ui/SegmentedControl, ui/Badge, hook useReducedMotion. Toda animação via framer-motion deve respeitar prefers-reduced-motion (a árvore está em <MotionConfig reducedMotion="user">).

Arquivos permitidos:
<colar lista do bloco>

Arquivos proibidos:
src/core/*, src/services/*, src/App.js, src/components/AuthModal.jsx, src/components/ui/*, firestore.rules, firebase.json

Tarefas:
<colar Tarefas do bloco>

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue:
1. arquivos alterados
2. o que foi feito
3. saída de testes/build
4. riscos
```

---

## 11. Testes

`src/components/LandingPage.test.jsx` (Jest + Testing Library, já configurado). Manter/ampliar:
- renderiza headline `sistema operacional de estudos`;
- ≥1 botão `beta gratuito`;
- `onLogin` chamado ao clicar Entrar;
- `onSignup` chamado ao clicar Começar beta;
- (novos) presença de um label de Tabs (ex.: `FSRS`), toggle `Antes`/`Depois`, seção `Como o MedRev pensa`, `Sem promessa de aprovação`.

> Atenção: `framer-motion` em jsdom funciona, mas evite testar animação; teste **presença de conteúdo e callbacks**. Se algum `whileInView` não disparar em jsdom, garantir que o conteúdo é renderizado no DOM (mesmo com opacity 0) para o teste encontrá-lo — usar `initial=false` em testes não é necessário se o texto estiver no DOM.

---

## 12. Critérios de aceite final

- [ ] Parece premium; menos texto visível (≥40% de redução nas seções densas).
- [ ] Animações leves; explica o produto em ~5s.
- [ ] Hero com mockup "Comando do Dia" animado.
- [ ] CTA beta gratuito claro; sem cobrança; sem promessa de aprovação.
- [x] Não autenticado vê landing; autenticado entra no app (já — `App.js:1067`).
- [ ] FAQ accordion; feature showcase em Tabs; Antes/Depois interativo.
- [ ] Mobile 390px sem overflow horizontal; foco visível; reduced-motion respeitado.
- [ ] `check:mojibake` ok; `test` verde; `build` ok.
- [ ] Nenhum arquivo de core/services/App.js/AuthModal/ui alterado.

---

## 13. Ordem de execução

`LP-A1 → LP-A2 → LP-A3 → LP-A4 → LP-A5 → LP-A6 → LP-A7 → LP-A8 → LP-A9 → LP-A10`

Cada bloco para e valida. A1/A2 são fundação; A3–A8 são conteúdo; A9/A10 são fechamento.

---

## 14. Riscos principais

1. **Animação ignorando reduced-motion** → mitigado por `<MotionConfig reducedMotion="user">` (LP-A1) cobrindo toda a árvore.
2. **Layout shift / overflow** nas seções com transform (caos, hero mockup) em 390px → LP-A9 valida.
3. **Regressão de a11y** ao reembrulhar `Tabs` em `AnimatePresence` → manter o componente `Tabs` como dono dos roles; animar só o conteúdo interno.
4. **Crescimento do arquivo** → mitigado pela extração em `src/components/landing/*`.
5. **Teste frágil** por texto exato → regex tolerante.
6. **Sonnet tocar em App.js/ui/core** → proibido explicitamente; integração já pronta.
7. **Bundle maior** com framer-motion → aceitável; já instalado e tree-shakeable.

---

## 15. Blocos que NÃO devem ir para Sonnet Low (exigem modelo melhor / supervisão)

- **LP-A3** (mockup com stagger + loop + barra de progresso) — orquestração de motion sensível; recomendo **Sonnet Medium/Opus** ou revisão atenta.
- **LP-A4 (parte "caos converge")** — variants com offsets/transform e risco de layout shift; **Sonnet Medium**.
- **LP-A5** (conectores animados input→motor→ação) — coordenação SVG/responsiva é a mais complexa; **Sonnet Medium/Opus**.

Seguros para **Sonnet Low**: **LP-A1, LP-A2, LP-A6, LP-A7, LP-A8, LP-A10** (e LP-A9 com atenção a grid). O toggle de LP-A4 (BeforeAfter via `SegmentedControl`) também é seguro para Low; o subcomponente "caos" é a parte que pede modelo melhor.
