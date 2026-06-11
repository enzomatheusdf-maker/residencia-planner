# MedRev — Framer Motion System (Landing + Plataforma) — Plano de Implementação

> **Modo:** Opus planeja / Sonnet executa em blocos pequenos.
> **Data:** 2026-06-10
> **Engine:** `framer-motion@12.40.0` (já instalado; compatível React 19). **Nenhuma outra lib.**
> **Escopo:** sistema visual de movimento e polish premium. **Não** alterar regra de negócio, FSRS, dados, auth, persistência.
> **Relação com outros docs:** o detalhamento da Landing animada vive em `docs/MEDREV_LANDING_PREMIUM_ANIMATED_IMPLEMENTATION_PLAN.md`. Aqui o **FM2** referencia aquele plano; este documento cobre a **plataforma inteira** + o sistema global de motion.

---

## 1. Auditoria atual da UI

### 1.1 Stack e suporte a motion já existente
- `framer-motion@12.40.0` instalado. Ícones: `lucide-react`. Sem GSAP/Lottie/react-spring.
- **Hook `useReducedMotion`** já existe: `src/hooks/useReducedMotion.js` (default export). `useCountUp` já respeita reduced-motion internamente.
- **CSS de motion** em `src/index.css`: keyframes `medFadeUp`, `medScaleIn`, `medLogoIn/Float/Glow`, `confetti-*`, `scale-up`, `fade-in`, `draw-checkmark`; classes `med-animate-in`, `med-animate-scale`, `med-card-interactive`, `med-pressable`, `med-focus-ring`, `med-logo-*`. **Bloco `@media (prefers-reduced-motion: reduce)` já desliga as `med-*`.**
- Tokens CSS: `--med-duration-fast/base/slow`, `--med-ease-out`, `--med-surface-0/1/2/solid`, `--med-border-subtle/strong`, `--med-text-strong/muted`, `--med-radius-sm/md/lg/xl`, `--med-z-modal/toast`.

### 1.2 Biblioteca de UI (`src/components/ui/`)
`Button`, `Card`, `Badge`, `Tabs`, `SegmentedControl`, `Dialog`, `Sheet`, `Toast`, `Tooltip`, `MetricRing`, `Skeleton`, `EmptyState`, `OverlayProvider` (barrel `index.js`). Estilo via tokens `--med-*` (inline) e Tailwind.

**Estado de animação dos overlays (importante para FM1):**
- `Dialog` já entra com `med-animate-scale`, tem focus-trap, `body overflow hidden`, fecha no Esc/backdrop, **mas faz `if (!open) return null` → sem animação de saída** (desmonta na hora).
- `Sheet` é um `Dialog` com `mobileSheet`. `Toast` entra com `med-animate-in`, auto-dismiss, **sem saída animada**.
- `Tabs`/`SegmentedControl` são controlados, acessíveis (roles, setas), **sem transição de conteúdo**.
- **Conclusão:** o maior ganho de motion nos overlays é **animação de saída** via `AnimatePresence` — alta alavancagem (centraliza em 2 arquivos), porém exige editar `ui/*` (exceção justificada) e há `ui/overlay.test.jsx` protegendo.

### 1.3 Mapa de telas/áreas (componentes reais)
| Área | Componentes |
|---|---|
| **Landing** | `LandingPage.jsx` (+ `LandingPage.test.jsx`) |
| **Shell / Navegação** | `Sidebar.jsx`, `BottomNav.jsx`, `App.js` (view switch), `core/navigationModel.js` (lógica — proibido) |
| **Dashboard / Hoje** | `Dashboard.jsx`, `ActionInbox.jsx`, `MetricCard.jsx`, `DicaContextual.jsx`, `SessionClosureModal.jsx`, `PomodoroWidget.jsx`, `FocusMode.jsx` |
| **Agenda / Cronograma** | `AgendaDayDetails.jsx`, `AgendaMonthGrid.jsx`, `AgendaTaskItem.jsx`, `Cronograma.jsx`, `CronogramaVest.jsx`, `CronogramaVestHub.jsx`, `CalendarImportWizard.jsx`, `CalendarMappingPanel.jsx`, `CalendarProviderSelector.jsx` |
| **FSRS / Revisões / Teste de Domínio** | `DomainTestModal.jsx`, `WeeklyReview.jsx`, `RetrievabilitySpark.jsx`, `SessaoPage.jsx` |
| **Simulados / Erros** | `Simulados.jsx`, `EnamedProvaAnalyzer.jsx`, `EnamedMapa.jsx`, `ErrorActionCenter.jsx`, `ErrorActionPrompt.jsx` |
| **Raciocínio Clínico / Anki** | `RaciocinioClinico.jsx`, `ClinicalTaskPanel.jsx`, `ConceitoCard.jsx`, `AnkiAudit.jsx` |
| **Estatísticas / Conquistas** | `StatsPanel.jsx`, `Conquistas.jsx`, `TrilhaJornada.jsx`, `MetricCard.jsx` |
| **Onboarding** | `OnboardingWizard.jsx`, `OnboardingWizardV2.jsx`, `VestibularStartTrail.jsx`, `AcademiaMetodo.jsx` |
| **Overlays compartilhados** | `Modals.jsx`, `ui/Dialog.jsx`, `ui/Sheet.jsx`, `ui/Toast.jsx`, `ui/Tooltip.jsx`, `ui/OverlayProvider.jsx` |
| **Banco de temas** | `BancoDados.jsx` |

### 1.4 Integração de auth (não tocar)
`App.js:1067`: `!usuarioLogado` → `LandingPage`; autenticado → app. CTAs via `openAuthModal`. `AuthModal` intacto.

---

## 2. Diagnóstico — onde o app parece estático

1. **Landing** quase toda estática (tratada no plano dedicado).
2. **Overlays sem saída animada** → fecham "secos" (desmontam na hora).
3. **Entrada de tela/área sem transição** → troca de view é instantânea e "crua".
4. **Dashboard** não comunica hierarquia por movimento (cards aparecem todos juntos).
5. **Cards/CTAs** sem microinteração consistente (hover/press) fora da Landing.
6. **Tabs/conteúdo** trocam sem transição.
7. **Steps** (Onboarding, Teste de Domínio, Simulado wizard) sem transição entre passos.
8. **Feedback de ação** (classificar revisão, registrar simulado, erro→ação) sem reforço visual.

---

## 3. Estratégia de motion design

**Princípio:** o movimento serve à narrativa `Planejar → Executar → Registrar → Corrigir → Revisar → Medir → Ajustar`. Cada animação responde a uma destas perguntas: *guia atenção? mostra hierarquia? dá feedback? fluidifica navegação?* Se não, não anima.

**Abordagem em camadas (do global ao específico):**
1. **Camada base (FM1):** tokens + componentes utilitários (`MotionSection`, `MotionCard`, `MotionButton`, `AnimatedTabs`, `AnimatedAccordion`, `MotionPresence`). Nada nas telas muda ainda.
2. **Camada overlay (FM1 estendido):** saída animada padronizada em `Dialog`/`Toast` via `AnimatePresence` (exceção `ui/*`).
3. **Camada Landing (FM2):** vitrine product-led.
4. **Camada app (FM3–FM9):** aplicar os utilitários área por área, sempre **substituindo** padrões estáticos por `MotionCard`/`MotionSection`, sem reescrever lógica.
5. **Camada polish (FM10):** mobile, a11y, reduced-motion, performance.

**Regra de adoção:** Sonnet **não escreve `motion.*` solto** nas telas — usa os utilitários da camada base. Isso garante consistência de duração/easing/reduced-motion e evita "carnaval".

---

## 4. Regras globais de animação

- **Durações curtas.** Navegação/feedback: 0.16–0.28s. Reveal de seção: até 0.45s. Page fade: ≤0.55s e só opacity.
- **Só propriedades baratas:** `opacity`, `transform`, `scale`, `x`, `y`, `rotate` leve. **Evitar** animar `width`/`height` (exceto accordion pontual), `box-shadow` pesada, `filter` pesado, `layout` em listas/grids grandes.
- **`whileInView` com `viewport={{ once: true }}`** para reveal — anima uma vez, não a cada scroll.
- **Stagger curto** (≤0.08s entre filhos, ≤6–8 itens). Listas longas: animar só os primeiros itens visíveis ou nada.
- **Loops** só sutis (escala ≤1.03, opacity, sombra) e **somente** em 1 elemento de destaque por tela (ex.: "próxima ação"). Nunca em métricas/gráficos.
- **Reduced-motion sempre:** via `<MotionConfig reducedMotion="user">` no topo de cada árvore animada **+** checagem `useReducedMotion()` nos utilitários para zerar deslocamento/stagger/loops.
- **Sem `layout` global.** `layout`/`layoutId` só em transições pequenas e isoladas (ex.: underline de tab), nunca em calendário/listas grandes.
- **Nada de:** partículas, parallax pesado, confetti exagerado, autoplay de vídeo, animação em todo elemento, delay que atrase produtividade.

---

## 5. Tokens de movimento — `src/components/motion/motionTokens.js`

```js
export const motionDurations = { fast: 0.16, normal: 0.28, slow: 0.45, page: 0.55 };
export const motionEasing = { standard: [0.22, 1, 0.36, 1], gentle: "easeOut" };

export const motionVariants = {
  fadeUp:  { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } },
  fadeIn:  { hidden: { opacity: 0 },         visible: { opacity: 1 } },
  scaleIn: { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } },
};

export const staggerParent = (stagger = 0.06, delayChildren = 0.04) => ({
  hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren } },
});

// Helper para reduced-motion: retorna variants "estáticas" (só opacity) quando reduzido.
export const reduced = (variant) => ({
  hidden: { opacity: 0 }, visible: { opacity: 1 },
});
```
> Alinhar os números aos tokens CSS `--med-duration-*` para coerência com as classes `med-*` já existentes.

---

## 6. Componentes utilitários — `src/components/motion/`

Contratos (todos usam `useReducedMotion`; quando reduzido, caem para fade/opacity ou estático):

| Componente | Arquivo | Contrato/Comportamento |
|---|---|---|
| `MotionSection` | `MotionSection.jsx` | `whileInView` + `viewport once` + `fadeUp`/`staggerParent`. Para seções de Landing e topos de página. Props: `as`, `stagger`, `className`, `children`. |
| `MotionCard` | `MotionCard.jsx` | hover `y:-3` + `scale:1.01`, tap `scale:0.98`; **hover desabilitado no touch/mobile** e em reduced-motion. Aceita `as`, `interactive`. |
| `MotionButton` | `MotionButton.jsx` | hover `scale:1.015`, tap `scale:0.98`, `med-focus-ring`. Wrapper de `ui/Button` ou `<button>`. |
| `AnimatedTabs` | `AnimatedTabs.jsx` | usa `ui/Tabs` para roles/teclado; anima **só o conteúdo** do painel com `AnimatePresence` (fade curto) + underline opcional `layoutId`. Não reembrulhar os roles. |
| `AnimatedAccordion` | `AnimatedAccordion.jsx` | `height/opacity` via framer (`height: auto`), `aria-expanded`, teclado. Para FAQ/detalhes. |
| `MotionPresence` | `MotionPresence.jsx` | wrapper fino de `AnimatePresence` com `mode="wait"` e defaults de fade — para steps e troca de painéis. |

> **Não** criar nova lib de UI. Estes utilitários **consomem** `ui/*` e framer-motion.

---

## 7. Plano por área (alvos concretos)

> Para cada área: **substituir** padrões estáticos pelos utilitários. Sem reescrever lógica, sem tocar core.

- **Landing (FM2):** ver `MEDREV_LANDING_PREMIUM_ANIMATED_IMPLEMENTATION_PLAN.md` (hero+mockup, dor, Antes/Depois, Como pensa, Tabs, beta, FAQ, CTA).
- **Shell/Nav (FM3):** `Sidebar.jsx` (highlight ativo com `layoutId`, item hover), `BottomNav.jsx` (item ativo), menu/sidebar mobile abrir/fechar com `AnimatePresence`/slide. **Page transition opcional**: fade ≤0.18–0.28s — ver §10 sobre risco em `App.js`.
- **Dashboard (FM4):** `Dashboard.jsx` topo com `MotionSection`; `ActionInbox`/`MetricCard` em `MotionCard` com stagger curto; "Comando do Dia" em destaque; progresso diário anima **uma vez** (`useCountUp` + barra); "sessão sem fechamento" entra com destaque sutil (sem piscar). Sem loops em todos os cards.
- **Agenda/Cronograma (FM5):** `AgendaTaskItem` hover/press via `MotionCard`; `AgendaDayDetails` abre com `MotionPresence`; tarefas do dia em stagger curto; mudança de dia/mês com fade leve; estados vazio/carregando com `fadeIn`. **Não** aplicar `layout` em `AgendaMonthGrid` (grade grande → risco de lag).
- **FSRS/Revisões/Teste de Domínio (FM6):** feedback ao classificar revisão (check/badge `scale-up`); transição de status D0/D1/D4/D7/D21 (badge troca com fade); `DomainTestModal` em steps com `MotionPresence`; card de próxima revisão entra com `scaleIn`. **Lógica FSRS intocada — motion só visual.**
- **Simulados/Erros (FM7):** `Simulados.jsx` wizard em steps (`MotionPresence`); resultado pós-simulado com reveal; `ErrorActionCenter`/`ErrorActionPrompt` chips com `MotionCard`; transição erro→recomendação reforçando "erro virou ação"; progress bars animam uma vez; microcelebração **discreta** ao bater meta (sem confetti pesado).
- **Raciocínio Clínico/Anki (FM8):** `RaciocinioClinico`/`ClinicalTaskPanel` steps e revelar hipóteses/diferenciais com `MotionPresence`; feedback de rubrica; `AnkiAudit` registro/streak/cards com stagger curto e estado "Anki zerado hoje". Sem animar texto clínico longo.
- **Estatísticas (FM9):** `StatsPanel` tabs via `AnimatedTabs`; cards/gráficos entram com `MotionSection` (uma vez); progress bars uma vez; "amostra insuficiente" com `fadeIn`. **Não** animar gráficos em loop nem mascarar dado fraco.
- **Onboarding (FM9):** `OnboardingWizard`/`OnboardingWizardV2` steps com `MotionPresence`; preview do plano e callout do primeiro passo com reveal. Área de **alta** percepção premium — caprichar, sem atrasar.
- **Overlays (FM1):** padronizar entrada+saída de `Dialog`/`Sheet`/`Toast`/`Tooltip`/dropdown/accordion.

---

## 8. Arquivos permitidos x proibidos

| Permitido (Sonnet) | Proibido (sem justificativa Opus) |
|---|---|
| `src/components/motion/*` (novos) | `src/core/fsrs.js`, `store.js`, `agendaEngine.js`, `scheduleWizard.js`, `reviewTaskPlanner.js`, `mentorSignals.js`, `userScope.js`, `navigationModel.js`, demais `core/*` de lógica |
| `src/components/LandingPage.jsx` + `landing/*` | `src/services/*` (firebase, userDataPaths) |
| Componentes de tela ao aplicar utilitários (Dashboard, Agenda, Simulados, Stats, etc. — **só JSX de apresentação**) | `src/App.js` (exceto inserção única de PageTransition no FM3, se aprovada) |
| `src/components/ui/Dialog.jsx`, `Toast.jsx` (**exceção FM1**: animação de saída) | `src/components/AuthModal.jsx` |
| `src/index.css` (append no fim) | `firestore.rules`, `firebase.json`, Data Safety, persistência |

**Exceções justificadas pelo Opus:**
1. **`ui/Dialog.jsx` + `ui/Toast.jsx` (FM1):** necessárias para saída animada via `AnimatePresence` — alta alavancagem (afeta todos os modais/sheets). Protegidas por `ui/overlay.test.jsx`; rodar testes obrigatório.
2. **`App.js` (FM3, opcional):** inserção **única e mínima** de um `<MotionPresence>`/fade ao redor do switch de view. Só se não quebrar layout nem atrasar navegação; caso contrário, **pular**.

---

## 9. Blocos para Sonnet Low

> Formato completo por bloco abaixo. Comandos padrão em todos: `npm run check:mojibake` · `npm test -- --watchAll=false` · `npm run build`. Rollback padrão: `git checkout -- <arquivo>` ou apagar arquivo novo.

### BLOCO FM0 — Instalação e validação
**Objetivo:** Confirmar `framer-motion` instalado e build verde (já instalado@12.40.0 — bloco vira verificação).
**Arquivos permitidos:** `package.json` (somente se faltar a dep). **Proibidos:** todo o resto.
**Tarefas:**
1. Confirmar `framer-motion` em `package.json` e `node_modules` (já presente).
2. `npm run build` para baseline verde.
**Comandos:** `npm run build`
**Critérios de aceite:** build passa; dep presente.
**Riscos:** nenhum. **Rollback:** n/a.
**Prompt pronto:**
```
Execute somente o BLOCO FM0. Não execute blocos futuros. Apenas verifique se framer-motion está instalado (package.json + node_modules) e rode npm run build. Não altere telas. Entregue: status da dep, saída do build, riscos.
```

### BLOCO FM1 — Motion tokens, utilitários e saída de overlays
**Objetivo:** Base global de motion + animação de saída padronizada nos overlays, sem alterar telas de negócio.
**Arquivos permitidos:** `src/components/motion/*` (novos), `src/components/ui/Dialog.jsx`, `src/components/ui/Toast.jsx`, `src/index.css` (append). **Proibidos:** core, services, App.js, AuthModal, demais `ui/*`.
**Tarefas:**
1. Criar `motionTokens.js` (§5).
2. Criar `MotionSection`, `MotionCard`, `MotionButton`, `AnimatedTabs`, `AnimatedAccordion`, `MotionPresence` (§6), todos com `useReducedMotion`.
3. Em `ui/Dialog.jsx`: introduzir `AnimatePresence` para **animar a saída** (fade+scale do painel, fade do backdrop). Manter focus-trap, Esc, backdrop, `aria-*`. Não mudar a API pública.
4. Em `ui/Toast.jsx`: saída com slide/fade via `AnimatePresence`.
5. Garantir reduced-motion (sem deslocamento/scale; só opacity).
**Critérios de aceite:** utilitários compilam; `ui/overlay.test.jsx` e demais testes passam; nenhum comportamento de negócio muda; reduced-motion ok; build ok.
**Riscos:** `AnimatePresence` exige manter o nó montado durante a saída — refatorar o `return null` do Dialog com cuidado para não quebrar focus-trap nem os testes de overlay. **Rollback:** git checkout dos arquivos.
**Prompt pronto:**
```
Execute somente o BLOCO FM1. Não execute blocos futuros. Não refatore fora do escopo. Não instale libs. Não altere Firebase/Auth/Firestore nem core do MedRev. Motion apenas visual.
Arquivos permitidos: src/components/motion/* (novos), src/components/ui/Dialog.jsx, src/components/ui/Toast.jsx, src/index.css (append).
Arquivos proibidos: src/core/*, src/services/*, src/App.js, src/components/AuthModal.jsx, demais src/components/ui/*.
Tarefas: (1) criar motionTokens.js conforme §5; (2) criar MotionSection/MotionCard/MotionButton/AnimatedTabs/AnimatedAccordion/MotionPresence conforme §6, todos com useReducedMotion; (3) animar saída do ui/Dialog com AnimatePresence mantendo focus-trap/Esc/aria e a API pública; (4) animar saída do ui/Toast; (5) garantir reduced-motion.
Rode: npm run check:mojibake / npm test -- --watchAll=false / npm run build.
Pare e entregue: 1) arquivos alterados; 2) o que foi feito; 3) testes/build; 4) riscos; 5) próximos passos.
```

### BLOCO FM2 — Landing Page premium animada
**Objetivo:** Implementar a Landing conforme o plano dedicado.
**Arquivos permitidos:** `src/components/LandingPage.jsx`, `src/components/landing/*`, `src/components/LandingPage.test.jsx`, `src/index.css` (append). **Proibidos:** core, services, App.js, AuthModal, ui/* (consumir).
**Tarefas:** seguir `docs/MEDREV_LANDING_PREMIUM_ANIMATED_IMPLEMENTATION_PLAN.md` (blocos LP-A1..LP-A10), usando os utilitários do FM1.
**Critérios de aceite:** landing mais visual, menos texto; hero com mockup animado; FAQ accordion; tabs com transição; reduced-motion ok; testes/build ok.
**Riscos:** ver plano da Landing. **Rollback:** git checkout.
**Prompt pronto:** usar os prompts do plano da Landing, garantindo import dos utilitários `src/components/motion/*`.

### BLOCO FM3 — AppShell e navegação
**Objetivo:** Motion na navegação sem atrasar nada.
**Arquivos permitidos:** `src/components/Sidebar.jsx`, `src/components/BottomNav.jsx`, `src/components/motion/*`; **`src/App.js` só para inserção única e opcional de PageTransition**. **Proibidos:** core (`navigationModel.js`), services, AuthModal.
**Tarefas:**
1. `Sidebar`: highlight do item ativo com `layoutId` (underline/pill), hover sutil via `MotionButton`.
2. `BottomNav`: item ativo idem.
3. Sidebar/menu mobile abrir/fechar com `AnimatePresence` (slide ≤0.24s).
4. (Opcional) fade ≤0.18–0.28s entre views via `MotionPresence` em **um único ponto** de `App.js`. Se quebrar layout ou atrasar, **pular**.
**Critérios de aceite:** navegação fluida e instantânea; item ativo claro; mobile abre/fecha suave; sem atraso perceptível; testes/build ok.
**Riscos:** page transition em `App.js` pode piscar/atrasar — manter opcional e mínima. **Rollback:** git checkout.
**Prompt pronto:**
```
Execute somente o BLOCO FM3. Não execute blocos futuros. Não altere core (navigationModel), services nem auth. Motion apenas visual; navegação não pode atrasar.
Arquivos permitidos: src/components/Sidebar.jsx, src/components/BottomNav.jsx, src/components/motion/*, e no máximo UMA inserção mínima em src/App.js para PageTransition (pular se quebrar/atrasar).
Tarefas: highlight ativo com layoutId na Sidebar e BottomNav; abrir/fechar menu mobile com AnimatePresence (≤0.24s); page fade opcional ≤0.28s.
Rode: npm run check:mojibake / npm test -- --watchAll=false / npm run build.
Entregue: arquivos, o que foi feito, testes/build, riscos, próximos passos.
```

### BLOCO FM4 — Dashboard / Hoje (cockpit)
**Objetivo:** Dashboard com hierarquia por movimento.
**Arquivos permitidos:** `src/components/Dashboard.jsx`, `ActionInbox.jsx`, `MetricCard.jsx`, `DicaContextual.jsx`, `src/components/motion/*`. **Proibidos:** core (`mentorSignals`, `store`), services.
**Tarefas:**
1. Topo com `MotionSection`; "Comando do Dia" em destaque (`scaleIn`).
2. Cards principais (`ActionInbox`, `MetricCard`) em `MotionCard` com stagger curto.
3. Progresso diário anima **uma vez** (`useCountUp` + barra).
4. "Sessão sem fechamento"/alertas entram com destaque sutil (sem piscar/loop).
**Critérios de aceite:** parece cockpit; sem loops em todos os cards; Dashboard não fica lento; testes/build ok.
**Riscos:** stagger longo se houver muitos cards — limitar aos visíveis. **Rollback:** git checkout.
**Prompt pronto:** (modelo §14, arquivos acima).

### BLOCO FM5 — Agenda / Cronograma
**Objetivo:** Motion em tarefas, detalhe e troca de dia/mês.
**Arquivos permitidos:** `AgendaTaskItem.jsx`, `AgendaDayDetails.jsx`, `AgendaMonthGrid.jsx` (só hover/fade), `Cronograma.jsx`, `src/components/motion/*`. **Proibidos:** `core/agendaEngine.js`, `scheduleWizard.js`, services.
**Tarefas:**
1. `AgendaTaskItem` hover/press com `MotionCard`.
2. `AgendaDayDetails` abre com `MotionPresence`; tarefas do dia em stagger curto.
3. Mudança de dia/mês com fade leve; estados vazio/carregando com `fadeIn`.
4. **Não** aplicar `layout` em `AgendaMonthGrid` (grade grande).
**Critérios de aceite:** calendário não fica pesado; sem lag ao trocar mês; testes/build ok.
**Riscos:** lag no grid → proibido `layout`/stagger grande. **Rollback:** git checkout.
**Prompt pronto:** (modelo §14).

### BLOCO FM6 — FSRS / Revisões / Teste de Domínio
**Objetivo:** Feedback visual nos fluxos de revisão.
**Arquivos permitidos:** `DomainTestModal.jsx`, `WeeklyReview.jsx`, `RetrievabilitySpark.jsx`, `SessaoPage.jsx`, `src/components/motion/*`. **Proibidos:** `core/fsrs.js`, `reviewTaskPlanner.js`, `reviewOutcome.js`, services.
**Tarefas:**
1. Feedback ao classificar revisão (check/badge `scale-up`).
2. Transição de status D0/D1/D4/D7/D21 (badge com fade).
3. `DomainTestModal` em steps com `MotionPresence`.
4. Card de próxima revisão com `scaleIn`.
**Critérios de aceite:** **lógica FSRS intocada**; `DomainTestModal.test.jsx` passa; testes/build ok.
**Riscos:** tocar acidentalmente em cálculo — só JSX de apresentação. **Rollback:** git checkout.
**Prompt pronto:** (modelo §14, reforçar "não alterar cálculo FSRS").

### BLOCO FM7 — Simulados e Auditoria de Erros
**Objetivo:** Motion em registro, steps, resultados e erro→ação.
**Arquivos permitidos:** `Simulados.jsx`, `EnamedProvaAnalyzer.jsx`, `ErrorActionCenter.jsx`, `ErrorActionPrompt.jsx`, `src/components/motion/*`. **Proibidos:** core de simulado/análise, services.
**Tarefas:**
1. Wizard/registro em steps (`MotionPresence`).
2. Resultado pós-simulado com reveal; progress bars uma vez.
3. Chips/tipos de erro com `MotionCard`; transição erro→recomendação.
4. Microcelebração **discreta** ao bater meta (sem confetti pesado).
**Critérios de aceite:** lógica de simulado intocada; sem exagero visual; testes/build ok.
**Riscos:** microcelebração virar carnaval — manter discreta. **Rollback:** git checkout.
**Prompt pronto:** (modelo §14).

### BLOCO FM8 — Raciocínio Clínico e Anki Audit
**Objetivo:** Motion em steps clínicos e registro Anki.
**Arquivos permitidos:** `RaciocinioClinico.jsx`, `ClinicalTaskPanel.jsx`, `ConceitoCard.jsx`, `AnkiAudit.jsx`, `src/components/motion/*`. **Proibidos:** dados clínicos (`constants/*`, `core/*`), services.
**Tarefas:**
1. Steps do caso e revelar hipóteses/diferenciais com `MotionPresence`.
2. Feedback de rubrica; progresso D1/D4/D7/D21.
3. `AnkiAudit`: registro/streak/cards em stagger curto; estado "Anki zerado hoje".
**Critérios de aceite:** sem distração no texto clínico; testes/build ok.
**Riscos:** animar texto longo demais — evitar. **Rollback:** git checkout.
**Prompt pronto:** (modelo §14).

### BLOCO FM9 — Estatísticas e Onboarding
**Objetivo:** Motion em tabs/cards/progresso e steps do onboarding.
**Arquivos permitidos:** `StatsPanel.jsx`, `Conquistas.jsx`, `TrilhaJornada.jsx`, `OnboardingWizard.jsx`, `OnboardingWizardV2.jsx`, `VestibularStartTrail.jsx`, `src/components/motion/*`. **Proibidos:** `core/onboardingEngine.js`/`onboardingGate.js`, `useMetrics`, cálculo de métricas, services.
**Tarefas:**
1. `StatsPanel` tabs via `AnimatedTabs`; cards/gráficos entram uma vez (`MotionSection`).
2. Progress bars uma vez; "amostra insuficiente" com `fadeIn` (não mascarar dado fraco).
3. Onboarding steps com `MotionPresence`; preview do plano e callout do 1º passo com reveal.
**Critérios de aceite:** gráficos não animam em loop; onboarding premium e sem atraso; testes/build ok.
**Riscos:** animação escondendo dado fraco — proibido. **Rollback:** git checkout.
**Prompt pronto:** (modelo §14).

### BLOCO FM10 — Polish global, a11y e performance
**Objetivo:** Revisar tudo.
**Arquivos permitidos:** `src/components/motion/*`, telas já animadas (ajustes finos), `src/index.css` (append). **Proibidos:** core, services, auth.
**Tarefas:**
1. Mobile 390px e desktop 1366px sem overflow horizontal.
2. Reduced-motion: loops param, reveals viram estado final, navegação ok.
3. Foco visível, contraste, navegação por teclado em tabs/accordions/modais.
4. Performance: sem `layout` em listas/grids grandes; Dashboard/calendário fluidos.
5. Checagem manual da §12.
**Critérios de aceite:** lista da §17 satisfeita.
**Riscos:** regressão de layout em telas grandes. **Rollback:** git checkout.
**Prompt pronto:** (modelo §14).

---

## 10. Prompts prontos para Sonnet Low (modelo geral)

```
Execute somente o BLOCO FMX.
Não execute blocos futuros. Não refatore fora do escopo. Não instale bibliotecas extras.
Não altere Firebase/Auth/Firestore. Não altere core do MedRev. Não altere regras de negócio. Motion apenas visual.
Use os utilitários de src/components/motion/* (não escrever motion.* solto nas telas). Toda animação respeita prefers-reduced-motion.

Arquivos permitidos: <colar do bloco>
Arquivos proibidos: src/core/*, src/services/*, src/App.js, src/components/AuthModal.jsx, firestore.rules, firebase.json

Tarefas: <colar do bloco>

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue:
1. arquivos alterados;
2. o que foi feito;
3. testes/build;
4. riscos;
5. próximos passos.
```

---

## 11. Testes e validações

- **Automático (todo bloco):** `npm run check:mojibake` · `npm test -- --watchAll=false` · `npm run build`.
- **Testes sensíveis a vigiar:** `ui/overlay.test.jsx` (FM1), `DomainTestModal.test.jsx` (FM6), `ActionInbox.test.jsx`/`AgendaRender.test.jsx`/`CronogramaAgendaRender.test.jsx` (FM4/FM5).
- **jsdom + framer-motion:** testar **conteúdo e callbacks**, não animação. Garantir que o conteúdo exista no DOM mesmo durante animação (não depender de `whileInView` em teste).
- **Manual (FM10):** mobile 390px, desktop 1366px, sem overflow horizontal, teclado, foco visível, reduced-motion, login intacto, gating landing correto, Dashboard/calendário fluidos, modais abrindo/fechando.

---

## 12. Checklist manual (FM10)

390px · 1366px · sem overflow-x · teclado · foco visível · reduced-motion · login ok · autenticado não vê landing · não autenticado vê landing · Dashboard não lento · calendário leve · modais abrem/fecham.

---

## 13. Critérios de aceite finais

framer-motion instalado · build/mojibake ok · landing mais visual/menos texto · hero com mockup animado · CTAs com microinteração · FAQ accordion animado · tabs com transição · app logado premium · Dashboard cockpit · modais/drawers/toasts padronizados (entrada+saída) · cards com hover discreto · reduced-motion respeitado · mobile fluido · motion não atrapalha execução · nenhuma regra de negócio/core sensível alterada sem justificativa · sem loop infinito agressivo · sem dependência além de framer-motion.

---

## 14. Ordem exata de execução e checkpoints

`FM0 → FM1 → FM2 → FM3 → FM4 → FM5 → FM6 → FM7 → FM8 → FM9 → FM10`

**Git checkpoint (commit) recomendado após:**
- **FM1** (base + overlays) — fundação reutilizável; commitar antes de espalhar.
- **FM2** (landing) — entregável visível isolado.
- **FM3** (shell) — afeta navegação global.
- **FM4** e **FM6** — áreas sensíveis (Dashboard, FSRS); commit por área facilita rollback.
- **FM10** (polish final).

> Como o projeto tem histórico de trabalho sem commit ([[medrev-pending-blocks]]), **commitar por bloco** aqui é especialmente importante para rollback granular.

---

## 15. Classificação de risco por bloco (qual modelo)

| Bloco | Modelo recomendado | Porquê |
|---|---|---|
| FM0 | Sonnet Low | verificação trivial |
| **FM1** | **Sonnet Medium** | refatorar saída do `Dialog` com `AnimatePresence` sem quebrar focus-trap/testes |
| FM2 | Low (partes) / Medium (mock, caos, "como pensa") | ver plano da Landing |
| **FM3** | **Sonnet Medium** | `layoutId` + risco de page transition em `App.js` |
| FM4 | Sonnet Low/Medium | stagger e "uma vez" exigem cuidado, mas escopo de apresentação |
| FM5 | **Sonnet Medium** | risco de performance no calendário |
| FM6 | **Sonnet Medium** | proximidade da lógica FSRS; steps no modal |
| FM7 | Sonnet Low/Medium | wizard em steps |
| FM8 | Sonnet Low | apresentação, baixo risco |
| FM9 | Sonnet Low/Medium | tabs de stats + steps de onboarding |
| **FM10** | **Sonnet Medium** | julgamento de a11y/performance global |

**Seguros para Sonnet Low:** FM0, FM8, e partes de FM2/FM4/FM7/FM9.
**Exigem Sonnet Medium (ou Opus/supervisão):** FM1, FM3, FM5, FM6, FM10 (e os subcomponentes complexos da Landing).
