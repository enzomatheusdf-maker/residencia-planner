# MEDREV — UI Premium System V3: Auditoria Visual, Design System, Motion e Implementação em Blocos

> **Arquivo sugerido no repo:** `docs/MEDREV_UI_PREMIUM_SYSTEM_V3.md`  
> **Objetivo:** levar a interface do MedRev para outro nível visual e operacional, com aparência premium, motion discreto, componentes consistentes, mobile forte e sem “cara de IA”.  
> **Stack assumida:** React CRA + Zustand + CSS/Tailwind/classes utilitárias + lucide-react.  
> **Regra:** não instalar biblioteca nova nesta rodada. Criar sistema visual primeiro; migrar telas depois.

---

## 0. Diagnóstico executivo

A interface atual já tem identidade: dark mode, cards, azul/ciano, verde, roxo e uma estética de cockpit. O problema é que ela ainda parece uma soma de componentes criados em momentos diferentes.

Sintomas principais:

```txt
1. Muitos cards competem visualmente.
2. Glow/brilho aparece demais e perde valor.
3. Badges, botões e métricas têm estilos diferentes por tela.
4. Popups e modais variam muito em estrutura, padding e botões.
5. Dashboard mistura ação, diagnóstico e ferramentas.
6. Tooltips e overlays ainda são frágeis em mobile.
7. Alguns componentes têm cara de protótipo: selects pretos, modal duro, bordas inconsistentes, CTA sem hierarquia.
8. Motion quase não tem linguagem: algumas coisas entram bruscas, outras não animam, outras pulam layout.
9. A interface tem excesso de texto comprimido sem boa hierarquia tipográfica.
10. Falta um design system real: tokens, superfícies, z-index, motion, overlays e componentes base.
```

A solução não é “colocar mais animação”. A solução é:

```txt
tokens visuais + componentes premium + motion controlado + hierarquia por jornada.
```

Visual-alvo:

```txt
clínico;
escuro;
rápido;
preciso;
premium;
sem neon excessivo;
sem cara de template IA;
com microinterações úteis;
com sensação de sistema operacional de estudos.
```

---

## 1. Princípios de design premium para o MedRev

### 1.1 Menos glow, mais material

Glow deve aparecer apenas para:

```txt
ação principal;
estado de conquista;
meta alcançada;
alerta forte;
item selecionado.
```

Não usar glow em todos os cards.

### 1.2 Uma ação primária por região

Cada bloco deve ter no máximo uma ação primária.

Exemplo:

```txt
Comando do Dia:
Primário: Começar agora
Secundário: Ver agenda
Terciário: Ver por quê
```

### 1.3 Dados só aparecem se forem acionáveis

Se uma métrica não gera ação, ela vai para Estatísticas ou Mais.

Dashboard mostra:

```txt
o que fazer;
quanto falta hoje;
se está no ritmo;
primeira ação.
```

### 1.4 Motion tem função

Animação deve comunicar:

```txt
entrada de informação;
mudança de estado;
sucesso;
erro;
transição de tela;
expansão/colapso;
press/hover;
prioridade.
```

Não animar por enfeite.

### 1.5 Sem cara de IA

Evitar:

```txt
gradientes aleatórios;
ícones demais;
texto motivacional genérico;
cards gigantes com frases vagas;
emoji em excesso;
glow em todo lugar;
layout dashboard SaaS genérico.
```

Usar:

```txt
copy específica;
hierarquia clara;
microcopy operacional;
tons sóbrios;
feedback preciso;
componentes consistentes;
motion curto.
```

---

## 2. Auditoria do código/interface atual

### 2.1 Arquivos críticos conhecidos

```txt
src/App.js
src/App.css
src/index.css
src/components/Dashboard.jsx
src/components/Cronograma.jsx
src/components/AgendaMonthGrid.jsx
src/components/AgendaDayDetails.jsx
src/components/AgendaTaskItem.jsx
src/components/Simulados.jsx
src/components/StatsPanel.jsx
src/components/RaciocinioClinico.jsx
src/components/FocusMode.jsx
src/components/Modals.jsx
src/components/Primitives.jsx
src/components/Sidebar.jsx
src/components/BottomNav.jsx
src/components/DataSafetyPanel.jsx
src/components/WeeklyReview.jsx
src/core/navigationModel.js
src/core/store.js
```

### 2.2 Problemas confirmados em auditorias anteriores

#### Dashboard

O Dashboard concentra:

```txt
Comando do Mentor;
top bar com provider/importar/consistência/prova;
ActionInbox;
Avançado;
KPIs;
Gargalo ENAMED;
Raciocínio Clínico;
MiniCronogramaWidget;
WeeklyReview;
WelcomePopup;
VestibularStartTrail;
TourBalloon.
```

Isso deixa a tela pesada e pouco premium.

#### Tooltips

Problemas:

```txt
InfoTooltip preso ao container;
tooltips manuais com group-hover;
title= em elementos importantes;
ProgressiveTooltip absoluto;
mobile/touch inconsistente;
z-index frágil.
```

#### FocusMode

Problemas:

```txt
fixed inset-0;
h-screen;
overflow-hidden;
cards grandes;
botões possivelmente abaixo da dobra no mobile.
```

#### Modais

Problemas:

```txt
estrutura diferente em cada modal;
selects feios;
falta motion;
falta estado de validação;
falta footer sticky padronizado;
botões não têm hierarquia uniforme.
```

#### Cronograma / Cards

Problemas:

```txt
texto cortado;
fonte grande;
muitos badges;
card não mostra tudo;
visual de prioridade compete com ação.
```

#### Estatísticas

Problemas:

```txt
métrica demais;
seções com peso igual;
preparo estimado sem confiança;
layout de diagnóstico profundo competindo com Dashboard.
```

---

## 3. Sistema visual alvo

### 3.1 Linguagem visual

Nome interno:

```txt
MedRev Clinical Command
```

Palavras-chave:

```txt
preciso;
calmo;
profundo;
clínico;
tático;
rápido;
confiável.
```

### 3.2 Tokens CSS

Adicionar em `src/App.css` ou `src/index.css`:

```css
:root {
  --med-bg-0: #05070d;
  --med-bg-1: #080b13;
  --med-bg-2: #0d1320;

  --med-surface-0: rgba(255,255,255,0.035);
  --med-surface-1: rgba(255,255,255,0.055);
  --med-surface-2: rgba(255,255,255,0.075);
  --med-surface-solid: #111827;

  --med-border-subtle: rgba(255,255,255,0.08);
  --med-border-strong: rgba(255,255,255,0.14);

  --med-text-strong: #f8fafc;
  --med-text: #dbe4f0;
  --med-text-muted: #94a3b8;
  --med-text-faint: #64748b;

  --med-blue: #3b82f6;
  --med-blue-strong: #2563eb;
  --med-cyan: #06b6d4;
  --med-green: #10b981;
  --med-amber: #f59e0b;
  --med-red: #ef4444;
  --med-purple: #8b5cf6;

  --med-focus-ring: rgba(59,130,246,0.45);

  --med-radius-xs: 8px;
  --med-radius-sm: 12px;
  --med-radius-md: 16px;
  --med-radius-lg: 22px;
  --med-radius-xl: 28px;

  --med-shadow-soft: 0 18px 60px rgba(0,0,0,0.28);
  --med-shadow-card: 0 16px 40px rgba(0,0,0,0.22);
  --med-shadow-popover: 0 24px 80px rgba(0,0,0,0.42);

  --med-ease-out: cubic-bezier(.16, 1, .3, 1);
  --med-ease-in: cubic-bezier(.7, 0, .84, 0);
  --med-ease-standard: cubic-bezier(.2, 0, 0, 1);

  --med-duration-fast: 120ms;
  --med-duration-base: 180ms;
  --med-duration-slow: 260ms;

  --z-base: 1;
  --z-sticky: 30;
  --z-dropdown: 100;
  --z-popover: 300;
  --z-tooltip: 400;
  --z-overlay: 600;
  --z-modal: 700;
  --z-toast: 900;
}
```

### 3.3 Regra de cor

```txt
Azul: ação principal / navegação / informação.
Verde: concluído / OK / progresso saudável.
Âmbar: atenção / prazo / carga.
Vermelho: erro / vencido / risco.
Roxo: raciocínio clínico / estratégia avançada.
Ciano: simulado / desempenho.
Cinza: neutro / coletando / desativado.
```

### 3.4 Tipografia

Sem instalar fonte nova nesta rodada.

Usar stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Escala:

```css
--text-xs: 11px;
--text-sm: 12px;
--text-base: 14px;
--text-md: 16px;
--text-lg: 20px;
--text-xl: 28px;
--text-2xl: 36px;
```

Regras:

```txt
Títulos de seção: 12px uppercase, letter-spacing 0.12em.
Título de card: 16–20px, bold.
Número principal: 32–48px, bold.
Texto explicativo: 12–14px, line-height 1.55.
Badge: 10–11px, uppercase, bold.
```

---

## 4. Motion system

### 4.1 Regras de motion

```txt
1. Animar preferencialmente opacity e transform.
2. Evitar animar width, height, top, left, box-shadow pesado.
3. Respeitar prefers-reduced-motion.
4. Duração curta: 120–260ms para interação.
5. Entrada pode ter stagger leve, máximo 50ms entre itens.
6. Feedback de sucesso pode ter 360–600ms, mas discreto.
7. Não usar parallax.
8. Não animar tudo ao mesmo tempo.
```

### 4.2 CSS base

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
}

@keyframes medFadeUp {
  from {
    opacity: 0;
    transform: translate3d(0, 8px, 0) scale(.985);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes medScaleIn {
  from {
    opacity: 0;
    transform: scale(.965);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.med-animate-in {
  animation: medFadeUp var(--med-duration-slow) var(--med-ease-out) both;
}

.med-animate-scale {
  animation: medScaleIn var(--med-duration-base) var(--med-ease-out) both;
}

.med-pressable {
  transform: translateZ(0);
  transition:
    transform var(--med-duration-fast) var(--med-ease-standard),
    background-color var(--med-duration-fast) var(--med-ease-standard),
    border-color var(--med-duration-fast) var(--med-ease-standard),
    opacity var(--med-duration-fast) var(--med-ease-standard);
}

.med-pressable:hover {
  transform: translate3d(0, -1px, 0);
}

.med-pressable:active {
  transform: translate3d(0, 0, 0) scale(.985);
}

.med-focus-ring:focus-visible {
  outline: 2px solid var(--med-focus-ring);
  outline-offset: 3px;
}
```

### 4.3 View Transition API progressiva

Criar helper:

```js
export function withViewTransition(fn) {
  if (typeof document !== "undefined" && document.startViewTransition) {
    document.startViewTransition(fn);
    return;
  }
  fn();
}
```

Uso:

```js
withViewTransition(() => setView("crono"));
```

Não depender disso para o app funcionar.

---

## 5. Componentes base premium

Criar pasta:

```txt
src/components/ui/
```

Arquivos:

```txt
Button.jsx
Card.jsx
Badge.jsx
MetricRing.jsx
Dialog.jsx
Sheet.jsx
Tooltip.jsx
SegmentedControl.jsx
Tabs.jsx
Toast.jsx
Skeleton.jsx
EmptyState.jsx
ProgressBar.jsx
KpiTile.jsx
CommandCard.jsx
index.js
```

Se a pasta `ui/` for considerada refactor grande, começar em `src/components/Primitives.jsx`, mas a pasta `ui/` é o caminho correto.

---

## 5.1 Button

Contrato:

```jsx
<Button variant="primary" size="md" iconLeft={Play} loading={false}>
  Começar agora
</Button>
```

Variantes:

```txt
primary
secondary
ghost
danger
success
outline
soft
```

Tamanhos:

```txt
xs
sm
md
lg
icon
```

Regras:

```txt
Botão primário sempre forte.
Botão secundário nunca compete.
Botão desabilitado explica motivo por tooltip quando necessário.
Loading não muda tamanho do botão.
```

### Código de referência

```jsx
import React from "react";

const VARIANTS = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white border-blue-400/30 shadow-[0_14px_40px_rgba(37,99,235,.25)]",
  secondary: "bg-white/[.06] hover:bg-white/[.09] text-slate-100 border-white/10",
  ghost: "bg-transparent hover:bg-white/[.06] text-slate-300 border-transparent",
  success: "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400/30",
  danger: "bg-red-600 hover:bg-red-500 text-white border-red-400/30",
  outline: "bg-transparent hover:bg-white/[.05] text-slate-200 border-white/15",
  soft: "bg-blue-500/10 hover:bg-blue-500/15 text-blue-200 border-blue-400/15",
};

const SIZES = {
  xs: "h-8 px-3 text-[11px]",
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
  icon: "h-10 w-10 p-0",
};

export default function Button({
  as: Comp = "button",
  variant = "secondary",
  size = "md",
  iconLeft: IconLeft,
  iconRight: IconRight,
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}) {
  return (
    <Comp
      className={[
        "med-pressable med-focus-ring inline-flex items-center justify-center gap-2 rounded-xl border font-bold",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant] || VARIANTS.secondary,
        SIZES[size] || SIZES.md,
        className,
      ].join(" ")}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : null}
      {!loading && IconLeft ? <IconLeft size={16} /> : null}
      {children}
      {!loading && IconRight ? <IconRight size={16} /> : null}
    </Comp>
  );
}
```

---

## 5.2 Card

Variantes:

```txt
default
elevated
interactive
selected
critical
success
glass
```

Contrato:

```jsx
<Card variant="elevated" tone="blue" interactive>
  ...
</Card>
```

CSS:

```css
.med-card {
  position: relative;
  border: 1px solid var(--med-border-subtle);
  background:
    linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.028)),
    var(--med-surface-0);
  border-radius: var(--med-radius-lg);
  box-shadow: var(--med-shadow-card);
}

.med-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(255,255,255,.08), transparent 35%);
  opacity: .6;
}
```

Sem glow por padrão. Glow só em selected/success/primary.

---

## 5.3 MetricRing

Substituir gráficos improvisados de pizza/donut por componente único.

Contrato:

```jsx
<MetricRing
  value={questoesHoje}
  max={metaQuestoesDia}
  label="Questões"
  sublabel="Hoje"
  tone="blue"
/>
```

Código de referência:

```jsx
export default function MetricRing({
  value = 0,
  max = 1,
  label,
  sublabel,
  tone = "blue",
  size = 76,
}) {
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const deg = Math.round(pct * 360);
  const colorMap = {
    blue: "var(--med-blue)",
    green: "var(--med-green)",
    amber: "var(--med-amber)",
    red: "var(--med-red)",
    purple: "var(--med-purple)",
    cyan: "var(--med-cyan)",
  };
  const color = colorMap[tone] || colorMap.blue;

  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-full grid place-items-center"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} ${deg}deg, rgba(255,255,255,.08) 0deg)`,
        }}
      >
        <div className="rounded-full bg-slate-950/90 grid place-items-center" style={{ width: size - 16, height: size - 16 }}>
          <span className="text-lg font-black text-white">{value}</span>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[.14em] text-slate-400 font-black">{label}</p>
        {sublabel ? <p className="text-xs text-slate-500 mt-1">{sublabel}</p> : null}
      </div>
    </div>
  );
}
```

---

## 5.4 Dialog / Sheet

A UI atual tem popups inconsistentes. Criar shell único.

### Desktop

```txt
max-width 560–720px;
backdrop blur;
header;
body;
footer sticky;
close button;
motion scale/fade.
```

### Mobile

```txt
bottom sheet;
max-height: calc(100dvh - safe-area);
footer sticky;
scroll interno;
touch target grande;
safe-area bottom.
```

Contrato:

```jsx
<Dialog open={open} onClose={close} title="Registrar simulado" description="...">
  ...
</Dialog>
```

Requisitos:

```txt
trap focus;
Esc fecha;
click fora fecha se não houver formulário sujo;
role dialog;
aria-labelledby;
aria-describedby.
```

---

## 5.5 SmartTooltip

Infra premium:

```txt
desktop: popover pequeno;
mobile: sheet/popover;
portal;
viewport aware;
não cortar;
não depender de hover.
```

Contrato:

```jsx
<SmartTooltip title="Saldo de ritmo" content="...">
  <button aria-label="Ajuda sobre saldo de ritmo">...</button>
</SmartTooltip>
```

---

## 6. Layout premium por tela

## 6.1 Hoje / Dashboard

Novo layout:

```txt
[CommandCard grande]
[Daily metrics row: Questões | Acertos | Revisões/Anki | Saldo]
[Plano de hoje — 3 ações principais]
[Continuar sessão, se houver]
[Weekly Review, se liberado]
```

### CommandCard

```txt
card grande;
ação primária;
motivo curto;
tempo estimado;
dias até prova;
anel lateral discreto.
```

Evitar:

```txt
muitos badges na top bar;
provider/importar/consistência/prova competindo.
```

### Daily metrics

```txt
Questões hoje;
Acertos hoje;
Anki/revisões;
Saldo de ritmo.
```

### Motion

```txt
CommandCard entra primeiro.
Métricas entram com stagger 40ms.
Plano de hoje entra depois.
```

---

## 6.2 Plano / Cronograma / Agenda

Layout:

```txt
Header compacto:
  Plano ativo
  Fonte
  Ajustar plano
  Importar

Subtabs:
  Plano
  Agenda
  Temas

Plano:
  semanas
  cards menores
  fonte menor
  truncamento inteligente
  prioridade e duração

Agenda:
  calendário mensal
  detalhes do dia
  popup de tarefa
```

Cards de tema:

```txt
área em micro-label;
título com line-clamp 2;
prioridade pequena;
duração estimada;
estado FSRS pequeno;
CTA claro.
```

Exemplo:

```txt
[Clínica Médica] [Alta] [D0 75min]
Hipertensão Arterial Sistêmica — Parte 1
Próxima ação: Estudar D0
```

---

## 6.3 Simulados

Primeiro card:

```txt
Estratégia de Simulados
Fase atual: Construção/Stamina...
Próximo simulado recomendado
Critério para liberar
CTA: Registrar simulado / Agendar prova antiga
```

Modal registrar simulado:

```txt
stepper 1/2;
inputs alinhados;
selects customizados;
validação inline;
footer sticky;
motion de troca de etapa;
erro por questão em cards.
```

Tipo de erro:

```txt
nome;
descrição;
exemplo;
ação corretiva.
```

---

## 6.4 Raciocínio Clínico

Visual próprio:

```txt
roxo discreto;
cards de caso;
illness script em colunas;
rubrica em checklist;
timeline da revisão clínica.
```

Botões:

```txt
Criar caso
Por que usar?
Treinar caso recomendado
```

---

## 6.5 Estatísticas

Visual menos dashboard SaaS, mais relatório clínico.

Primeira tela:

```txt
Aprendizagem
Provas/Simulados
Erros
Revisões
Raciocínio Clínico
Atividade
```

Não mostrar “Preparo estimado” como número absoluto sem amostra. Usar:

```txt
Previsão de desempenho — coletando
ou
Previsão com intervalo.
```

---

## 6.6 Perfil e Configurações

Transformar popup em página.

Layout:

```txt
Sidebar interna:
  Perfil
  Estudos
  Mentor
  Conta
  Segurança
  Aparência

Conteúdo:
  cards organizados;
  inputs premium;
  avatar;
  salvar com estado dirty.
```

---

## 7. Blocos de implementação

## UI0 — Auditoria visual e inventário de componentes

### Objetivo

Mapear componentes duplicados antes de mexer.

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
docs/UI0_VISUAL_CODE_AUDIT.md
```

### Prompt

```txt
Execute somente UI0 — Auditoria visual.

Não implemente nada.

Use:
git status --short
git ls-files src/components src/core src/App.css src/index.css
git grep -n "className=.*rounded\|className=.*bg-\|SmartTooltip\|InfoTooltip\|Modal\|Dialog\|fixed inset\|h-screen\|overflow-hidden\|group-hover\|title=" -- src/components src/App.css src/index.css

Não use ls -R, dir /s, tree, find . ou Get-ChildItem -Recurse.

Crie docs/UI0_VISUAL_CODE_AUDIT.md com:
1. lista de botões duplicados;
2. cards duplicados;
3. modais duplicados;
4. tooltips duplicadas;
5. inputs/selects problemáticos;
6. padrões de cor soltos;
7. z-index soltos;
8. animações existentes;
9. telas mais frágeis em mobile;
10. plano de migração UI1–UI12.

Não edite código.
```

---

## UI1 — Design tokens e CSS base

### Objetivo

Criar base visual premium sem mudar telas ainda.

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/App.css
src/index.css
src/core/uiTokens.js
src/core/uiTokens.test.js
```

### Prompt

```txt
Execute somente UI1 — Design tokens e CSS base.

Objetivo:
Criar tokens visuais, motion base, reduced motion, z-index scale e utilitários premium sem alterar telas.

Arquivos permitidos:
- src/App.css
- src/index.css
- src/core/uiTokens.js
- src/core/uiTokens.test.js

Não alterar:
- componentes
- Store
- FSRS
- Firebase/Auth

Tarefas:
1. Adicionar CSS variables:
   - cores;
   - superfícies;
   - bordas;
   - radius;
   - sombras;
   - z-index;
   - motion duration/easing.
2. Adicionar classes:
   - med-card;
   - med-card-interactive;
   - med-button-reset;
   - med-pressable;
   - med-focus-ring;
   - med-animate-in;
   - med-animate-scale;
   - med-surface;
   - med-glass.
3. Adicionar prefers-reduced-motion.
4. Criar uiTokens.js com tokens exportáveis para JS.
5. Testar que tokens principais existem.

Rode:
npm test -- --watchAll=false src/core/uiTokens.test.js
npm run check:mojibake
npm run build
```

---

## UI2 — Componentes base em `src/components/ui`

### Objetivo

Criar primitivos premium sem migrar todas as telas ainda.

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/components/ui/Button.jsx
src/components/ui/Card.jsx
src/components/ui/Badge.jsx
src/components/ui/MetricRing.jsx
src/components/ui/SegmentedControl.jsx
src/components/ui/Tabs.jsx
src/components/ui/EmptyState.jsx
src/components/ui/Skeleton.jsx
src/components/ui/index.js
src/components/ui/ui.test.jsx
```

### Prompt

```txt
Execute somente UI2 — Componentes base.

Objetivo:
Criar componentes reutilizáveis premium para substituir botões/cards/badges improvisados.

Arquivos permitidos:
- src/components/ui/Button.jsx
- src/components/ui/Card.jsx
- src/components/ui/Badge.jsx
- src/components/ui/MetricRing.jsx
- src/components/ui/SegmentedControl.jsx
- src/components/ui/Tabs.jsx
- src/components/ui/EmptyState.jsx
- src/components/ui/Skeleton.jsx
- src/components/ui/index.js
- src/components/ui/ui.test.jsx

Não alterar telas existentes ainda.

Requisitos:
1. Button com variants: primary, secondary, ghost, danger, success, outline, soft.
2. Button com sizes: xs, sm, md, lg, icon.
3. Card com variants: default, elevated, interactive, selected, critical, success.
4. Badge com tones: blue, green, amber, red, purple, neutral.
5. MetricRing com conic-gradient.
6. SegmentedControl acessível por teclado.
7. Tabs simples controladas.
8. EmptyState e Skeleton consistentes.
9. Todos com className pass-through.
10. Todos respeitam med-focus-ring e med-pressable.

Rode:
npm test -- --watchAll=false src/components/ui/ui.test.jsx
npm run build
```

---

## UI3 — Overlay system: Dialog, Sheet, Tooltip, Toast

### Objetivo

Unificar popups, modais, tooltips e feedback.

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/components/ui/Dialog.jsx
src/components/ui/Sheet.jsx
src/components/ui/Tooltip.jsx
src/components/ui/Toast.jsx
src/components/ui/OverlayProvider.jsx
src/components/ui/index.js
src/components/Primitives.jsx
src/components/ui/overlay.test.jsx
```

### Prompt

```txt
Execute somente UI3 — Overlay system.

Objetivo:
Criar sistema de overlay premium com portal, mobile-safe, acessível e com motion.

Arquivos permitidos:
- src/components/ui/Dialog.jsx
- src/components/ui/Sheet.jsx
- src/components/ui/Tooltip.jsx
- src/components/ui/Toast.jsx
- src/components/ui/OverlayProvider.jsx
- src/components/ui/index.js
- src/components/Primitives.jsx para adaptar SmartTooltip/InfoTooltip à nova infra
- src/components/ui/overlay.test.jsx

Não alterar:
- Dashboard
- Cronograma
- Simulados
- Store
- FSRS

Requisitos Dialog:
1. createPortal(document.body).
2. Backdrop.
3. Focus trap básico.
4. Esc fecha.
5. Close button.
6. Header/body/footer.
7. Footer sticky.
8. Mobile vira Sheet se prop mobileSheet=true.
9. Não fecha por clique fora se formDirty=true.

Requisitos Tooltip:
1. Desktop popover.
2. Mobile bottom sheet/popover.
3. Auto-placement.
4. Não cortar por overflow.
5. Não depender de hover em touch.
6. aria correto.

Requisitos Toast:
1. success/warning/error/info.
2. portal.
3. auto-dismiss.
4. reduced motion.

Rode:
npm test -- --watchAll=false src/components/ui/overlay.test.jsx
npm run build
```

---

## UI4 — Motion utilities e transição de tela

### Objetivo

Criar motion consistente sem biblioteca nova.

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/core/motion.js
src/core/motion.test.js
src/hooks/useReducedMotion.js
src/hooks/useReducedMotion.test.js
src/App.js
src/App.css
```

### Prompt

```txt
Execute somente UI4 — Motion utilities.

Objetivo:
Criar helpers de motion e ViewTransition progressive enhancement.

Arquivos permitidos:
- src/core/motion.js
- src/core/motion.test.js
- src/hooks/useReducedMotion.js
- src/hooks/useReducedMotion.test.js
- src/App.js apenas para aplicar withViewTransition em setView se seguro
- src/App.css

Não alterar:
- lógica de rotas
- Store
- FSRS

Tarefas:
1. Criar useReducedMotion.
2. Criar withViewTransition(fn).
3. Criar getStaggerStyle(index, stepMs=40).
4. Criar classes CSS para route-enter/card-enter.
5. Aplicar transição suave em troca de view se não quebrar.
6. Respeitar prefers-reduced-motion.

Rode:
npm test -- --watchAll=false src/core/motion.test.js src/hooks/useReducedMotion.test.js
npm run build
```

---

## UI5 — Dashboard premium

### Objetivo

Migrar Dashboard para visual premium, sem mudar motor.

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/components/Dashboard.jsx
src/components/DashboardCommandCard.jsx
src/components/DashboardDailyMetrics.jsx
src/components/DashboardTodayPlan.jsx
src/components/ui/*
```

### Prompt

```txt
Execute somente UI5 — Dashboard premium.

Objetivo:
Reorganizar visualmente o Dashboard com componentes UI novos, sem alterar lógica de Mentor/FSRS.

Arquivos permitidos:
- src/components/Dashboard.jsx
- src/components/DashboardCommandCard.jsx
- src/components/DashboardDailyMetrics.jsx
- src/components/DashboardTodayPlan.jsx
- src/components/ui/* apenas uso/import
- src/App.css se precisar pequenas classes

Não alterar:
- mentorSignals
- mentorAutopilot
- fsrs
- store
- StatsPanel

Nova hierarquia:
1. CommandCard.
2. DailyMetrics: Questões, Acertos, Revisões/Anki, Saldo.
3. Plano de hoje com até 3 ações.
4. Continuar sessão, se existir.
5. WeeklyReview só se liberado.
6. Avançado fora do Dashboard ou colapsado no final.

Tarefas visuais:
1. Remover excesso de badges do topo.
2. Mover provider/importar para menu secundário.
3. Usar MetricRing.
4. Usar Button/Card/Badge.
5. Adicionar motion leve de entrada.
6. Mobile sem overflow.
7. CTA primário único.
8. "Ver agenda" com target correto se já existir.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

---

## UI6 — Plano/Agenda premium

### Objetivo

Melhorar Cronograma e Agenda visualmente.

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/components/Cronograma.jsx
src/components/AgendaMonthGrid.jsx
src/components/AgendaDayDetails.jsx
src/components/AgendaTaskItem.jsx
src/components/CronogramaSettingsModal.jsx
src/components/ui/*
```

### Prompt

```txt
Execute somente UI6 — Plano/Agenda premium.

Objetivo:
Aplicar sistema visual premium ao Plano/Agenda sem alterar motores.

Arquivos permitidos:
- src/components/Cronograma.jsx
- src/components/AgendaMonthGrid.jsx
- src/components/AgendaDayDetails.jsx
- src/components/AgendaTaskItem.jsx
- src/components/CronogramaSettingsModal.jsx
- src/components/ui/* apenas uso/import
- src/App.css se necessário

Não alterar:
- scheduleWizard
- agendaEngine
- fsrs
- store
- Firebase/Auth

Tarefas:
1. Cards de tema mais compactos.
2. Fonte menor e line-clamp inteligente.
3. Títulos completos em tooltip premium.
4. Badges padronizados.
5. Agenda com dias mais legíveis.
6. Dia selecionado com destaque sem glow excessivo.
7. Popup/detalhe de tarefa usando Dialog/Sheet.
8. Modal Ajustar Cronograma usando Dialog/Sheet.
9. Mobile touch-friendly.
10. Empty states bonitos.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

---

## UI7 — Simulados premium

### Objetivo

Redesenhar fluxo de Simulados e modal de registro.

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/components/Simulados.jsx
src/components/SimuladoRegisterModal.jsx
src/components/ErrorTypeGuideModal.jsx
src/components/ui/*
```

### Prompt

```txt
Execute somente UI7 — Simulados premium.

Objetivo:
Melhorar interface de Simulados, registro e auditoria de erros sem alterar core de cálculo.

Arquivos permitidos:
- src/components/Simulados.jsx
- src/components/SimuladoRegisterModal.jsx se existir/criar
- src/components/ErrorTypeGuideModal.jsx se criar
- src/components/ui/*
- src/App.css se necessário

Não alterar:
- store profundo
- simStrategy core
- errorTaxonomy core
- Firebase/Auth

Tarefas:
1. Card "Estratégia de Simulados" visualmente forte.
2. Botão "Como fazer" vira tooltip/dialog grande.
3. Registrar simulado com stepper 1/2.
4. Selects customizados.
5. Campos obrigatórios com validação.
6. Página 2 de erros em cards.
7. Botão "Entenda os tipos de erro" abre modal.
8. Cores de aproveitamento por meta.
9. Confete discreto se meta alcançada usando CSS, sem lib.
10. Motion de step.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

---

## UI8 — Estatísticas premium

### Objetivo

Transformar Estatísticas em relatório acionável.

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/components/StatsPanel.jsx
src/components/StatsSection.jsx
src/components/MetricCard.jsx
src/components/ui/*
```

### Prompt

```txt
Execute somente UI8 — Estatísticas premium.

Objetivo:
Reorganizar visualmente Estatísticas com foco em aprendizagem, provas, erros e revisão.

Arquivos permitidos:
- src/components/StatsPanel.jsx
- src/components/StatsSection.jsx se criar
- src/components/MetricCard.jsx se criar
- src/components/ui/*
- src/App.css se necessário

Não alterar:
- metricsRegistry
- readiness core
- store
- fsrs

Tarefas:
1. Aprendizagem primeiro.
2. Cards com estado: coletando, baixo, ok, atenção.
3. Previsão de desempenho com intervalo/estado de confiança.
4. Gráficos simples e limpos.
5. Abas menores e mais legíveis.
6. Remover visual de "sistema".
7. Empty states melhores.
8. Tooltips usando UI3.
9. Mobile responsivo.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

---

## UI9 — Raciocínio Clínico premium

### Objetivo

Dar identidade visual ao diferencial clínico.

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/components/RaciocinioClinico.jsx
src/components/ClinicalTaskPanel.jsx
src/components/ClinicalCaseBuilderModal.jsx
src/components/ui/*
```

### Prompt

```txt
Execute somente UI9 — Raciocínio Clínico premium.

Objetivo:
Melhorar visual de casos, illness script, rubricas e criação de caso.

Arquivos permitidos:
- src/components/RaciocinioClinico.jsx
- src/components/ClinicalTaskPanel.jsx
- src/components/ClinicalCaseBuilderModal.jsx se existir/criar
- src/components/ui/*
- src/App.css se necessário

Não alterar:
- clinical scoring core
- reviewTaskPlanner
- store
- fsrs

Tarefas:
1. Identidade roxa discreta.
2. Cards de caso compactos.
3. Illness script em grid.
4. Rubrica em checklist premium.
5. Botão "Por que usar?" com Dialog.
6. Criar caso com stepper.
7. Mobile-first.
8. Aviso educacional fixo e discreto.
9. Estados vazio/coletando.
10. Motion leve.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

---

## UI10 — Perfil e Configurações como página premium

### Objetivo

Tirar configuração de popup e criar tela séria.

### Modelo

cisamente:

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/components/ProfileSettingsPage.jsx
src/components/ProfileSection.jsx
src/components/SettingsSection.jsx
src/components/AccountSection.jsx
src/components/DataSafetyPanel.jsx
src/core/navigationModel.js
src/App.js
src/components/ui/*
```

### Prompt

```txt
Execute somente UI10 — Perfil e Configurações premium.

Objetivo:
Criar página Perfil & Configurações usando componentes UI, mantendo o popup antigo apenas como atalho se necessário.

Arquivos permitidos:
- src/components/ProfileSettingsPage.jsx
- src/components/ProfileSection.jsx
- src/components/SettingsSection.jsx
- src/components/AccountSection.jsx
- src/components/DataSafetyPanel.jsx apenas visual/entrypoint
- src/core/navigationModel.js
- src/App.js
- src/components/ui/*

Não alterar:
- Auth provider
- Firestore rules
- Store persist paths

Tarefas:
1. Página com abas: Perfil, Estudos, Mentor, Conta, Segurança, Aparência.
2. Avatar/foto placeholder premium.
3. Inputs padronizados.
4. Dirty state e botão salvar.
5. Segurança dos dados com botão "Como funciona?".
6. Conta com placeholders seguros para mudar senha/políticas se não houver backend.
7. Mobile responsivo.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

---

## UI11 — Polimento global: empty states, loading, confetti, microcopy

### Objetivo

Remover sensação de protótipo.

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/components/*
src/components/ui/*
src/App.css
src/core/copy.js
```

### Prompt

```txt
Execute somente UI11 — Polimento global.

Objetivo:
Padronizar empty states, loading states, microcopy e feedback de sucesso.

Arquivos permitidos:
- src/components/*
- src/components/ui/*
- src/App.css
- src/core/copy.js

Não alterar:
- core de cálculo
- store
- Firebase/Auth

Tarefas:
1. Empty states com título, descrição e CTA.
2. Skeletons em telas com dados.
3. Feedback de sucesso padronizado.
4. Confete CSS discreto apenas para metas importantes.
5. Microcopy sem jargão.
6. Remover emojis decorativos em labels críticos.
7. Padronizar "coletando dados".
8. Garantir que botões desabilitados expliquem por quê.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

---

## UI12 — QA visual e performance

### Objetivo

Validar que a interface premium não quebrou performance, mobile ou acessibilidade.

### Modelo

```txt
GPT-5.4 Medium
```

### Prompt

```txt
Execute somente UI12 — QA visual e performance.

Não implemente feature nova.

Tarefas:
1. Rodar:
   npm run check:mojibake
   npm test -- --watchAll=false
   npm run build
2. Buscar:
   git grep -n "title=\|group-hover\|h-screen\|overflow-hidden\|z-\[999\]\|alert(" -- src
3. Verificar:
   - mobile 390px;
   - desktop 1440px;
   - sidebar colapsada;
   - modo foco;
   - modal simulado;
   - modal ajustes;
   - agenda;
   - dashboard;
   - stats;
   - raciocínio clínico.
4. Procurar overflow horizontal.
5. Conferir prefers-reduced-motion.
6. Conferir foco visível.
7. Conferir CTAs sem target.
8. Remover imports não usados.
9. Entregar relatório com P0/P1/P2.

Não mexer em Data Safety, FSRS ou Store.
```

---

## 8. Critérios globais de pronto

```txt
[ ] Existe design token central.
[ ] Botões principais usam Button.
[ ] Cards novos usam Card.
[ ] Tooltips usam portal e funcionam no mobile.
[ ] Modais usam Dialog/Sheet.
[ ] Dashboard tem hierarquia clara.
[ ] Plano/Agenda têm cards compactos e legíveis.
[ ] Simulados têm modal premium com validação.
[ ] Estatísticas parecem relatório, não despejo de cards.
[ ] Raciocínio Clínico tem identidade visual.
[ ] Perfil/Configurações virou página.
[ ] prefers-reduced-motion funciona.
[ ] Não há overflow horizontal em mobile.
[ ] Foco visível existe.
[ ] Não há title= em interações críticas.
[ ] Build passa.
[ ] Tests passam.
[ ] Mojibake passa.
```

---

## 9. O que não fazer

```txt
1. Não instalar Framer Motion/Motion agora.
2. Não instalar Radix/Headless UI agora.
3. Não redesenhar lógica junto com UI.
4. Não mexer em FSRS.
5. Não mexer em Data Safety.
6. Não mudar rotas grandes sem bloco próprio.
7. Não trocar toda a paleta sem tokens.
8. Não colocar glow em tudo.
9. Não usar emoji como sistema visual.
10. Não criar novo dashboard antes de limpar o atual.
```

---

## 10. Observação sobre bibliotecas externas

No futuro, considerar:

```txt
Radix UI:
  Dialog, Tooltip, Popover, Tabs, Select, DropdownMenu.

Motion:
  layout animations, shared element transitions, gestures.
```

Mas agora a recomendação é:

```txt
Sem dependência nova.
CSS + React + portal + View Transition API progressiva.
```

Motivo:

```txt
1. reduz risco de build;
2. reduz bundle;
3. mantém Codex focado;
4. evita refactor gigante;
5. resolve 80% do problema visual.
```

---

## 11. Ordem recomendada

```txt
UI0 — Auditoria visual
UI1 — Tokens/CSS
UI2 — Componentes base
UI3 — Overlay system
UI4 — Motion utilities
UI5 — Dashboard
UI6 — Plano/Agenda
UI7 — Simulados
UI8 — Estatísticas
UI9 — Raciocínio Clínico
UI10 — Perfil/Configurações
UI11 — Polimento global
UI12 — QA
```

Ordem mínima para ganhar aparência premium rápido:

```txt
UI1 → UI2 → UI3 → UI5 → UI7 → UI12
```

Ordem mais segura:

```txt
UI0 → UI1 → UI2 → UI3 → UI4 → checkpoint → telas
```

---

## 12. Prompt base para Codex

```txt
Antes de implementar, leia:
- docs/MEDREV_CONTEXT_FOR_AI.md
- docs/MEDREV_UI_PREMIUM_SYSTEM_V3.md

Execute somente o BLOCO UI[X].

Não execute blocos futuros.
Não mexa fora dos arquivos permitidos.
Não faça refactor global.
Não instale libs.
Não faça commit, push ou deploy.
Não liste workspace inteiro.
Use git grep/git ls-files.

Se precisar mexer em store.js, Firebase/Auth/localStorage, firestore.rules, fsrs.js ou motores de produto fora do escopo, pare e peça autorização.

Ao final rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório:
- arquivos alterados;
- o que mudou;
- testes;
- build;
- riscos;
- pendências;
- próximo bloco recomendado.
```
