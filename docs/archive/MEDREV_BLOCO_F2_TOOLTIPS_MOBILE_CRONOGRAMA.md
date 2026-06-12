# MEDREV — BLOCO F2: Auditoria de Tooltips, Mobile, Modo Foco e Cronograma Semanal da Residência

> **Executor:** Claude Code / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `high`  
> **Modo:** agent, com aprovação manual para comandos destrutivos.  
> **Objetivo:** corrigir problemas transversais de UX: tooltips ilegíveis/fora da tela, balões que não aparecem, Modo Foco estourando no mobile e promessa de “Criar Cronograma” na Residência sem UI real de criação semanal.

---

## 0. Por que este bloco é separado

Este bloco mexe em infraestrutura visual transversal. Não misturar com F1.

Problemas atuais auditados no código enviado:

1. `InfoTooltip` em `src/components/Primitives.jsx` usa `absolute bottom-full left-1/2`, preso ao container pai.
   - Se o pai tiver `overflow-hidden`, o balão corta.
   - Em mobile, pode sair da tela.
   - Depende de clique/blur frágil.
2. Existem tooltips manuais com `group-hover:opacity-100` em `Cronograma.jsx` e `Dashboard.jsx`.
   - Não funcionam bem em touch/mobile.
   - Podem ficar invisíveis por `overflow-hidden`.
3. Há muitos `title=` em elementos importantes.
   - `title` não é adequado para mobile e acessibilidade.
4. `ProgressiveTooltip` usa posicionamento absoluto dentro do wrapper.
   - Pode ser cortado por containers.
   - Não fecha bem em todos os contextos.
5. `TourBalloon` usa portal, mas precisa melhorar safe-area/mobile/altura.
6. `FocusMode.jsx` usa telas `fixed inset-0`, `h-screen`, `overflow-hidden` e cards grandes.
   - Em telas pequenas, partes do Modo Foco podem ficar fora da tela.
   - Botões de ação podem ficar abaixo da dobra.
7. Residência:
   - `Dashboard.jsx` mostra “Criar Cronograma” quando `s[plat].cronogramas` está vazio.
   - Para `plat === "res"`, `App.js` renderiza apenas `Cronograma`.
   - `Cronograma.jsx` tem selector de planos e botão “Novo tema”, mas não tem criador de cronograma semanal.
   - `CronogramaVestHub.jsx` tem aba “Grade Semanal Planejada”, mas é usado apenas no vestibular.
   - `store.js` já suporta `res.cronogramas`; falta UI.
   - Portanto, existe promessa funcional sem caminho real na Residência.

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
- Não fazer `commit`, `deploy` ou `push`.
- Não mexer no motor ENAMED/Mentor aqui.
- Não alterar conteúdo médico.
- Não refatorar Estratégia MED aqui. Isso é Bloco G.
- Usar `createPortal` para overlays.
- Garantir comportamento mobile/touch.
- Respeitar safe-area em iPhone/Android.

---

## 2. Escopo do F2

Patch:

```txt
src/components/Primitives.jsx          [SmartTooltip, InfoTooltip, ProgressiveTooltip, TourBalloon]
src/components/Cronograma.jsx          [remover tooltip manual e usar SmartTooltip]
src/components/Dashboard.jsx           [remover tooltips manuais principais]
src/components/FocusMode.jsx           [mobile/dvh/sticky actions]
src/components/CronogramaVestHub.jsx   [evoluir para hub genérico ou criar equivalente res]
src/components/CronogramaVest.jsx      [extrair/parametrizar grade semanal, se viável]
src/App.js                             [usar hub de cronograma para res também, se implementado]
src/core/store.js                      [pequeno patch se precisar compatibilidade de cronogramas]
src/index.css                          [safe-area/utilidades mobile, se necessário]
```

Criar, se for mais limpo:

```txt
src/components/ui/SmartTooltip.jsx
src/components/CronogramaHub.jsx
src/components/CronogramaSemanal.jsx
```

Se o projeto não usa pasta `ui`, pode manter em `Primitives.jsx`.

---

## 3. SmartTooltip — infraestrutura única

### 3.1 Objetivo

Substituir tooltips quebradas por um componente robusto.

Contrato:

```jsx
<SmartTooltip content="Texto..." placement="auto">
  <button>...</button>
</SmartTooltip>
```

Ou para compatibilidade:

```jsx
<InfoTooltip texto="Texto..." />
```

### 3.2 Requisitos

- Renderizar com `createPortal(document.body)`.
- Calcular posição com `getBoundingClientRect`.
- Reposicionar automaticamente para não sair da viewport.
- `placement="auto"` por padrão.
- Fechar com:
  - `Escape`
  - clique fora
  - scroll
  - resize
  - blur/focus out
- Desktop:
  - abre com hover e foco;
  - também abre com clique.
- Mobile/touch:
  - abre com toque;
  - não depende de hover.
- Acessível:
  - `aria-describedby`
  - `role="tooltip"`
  - botão com `aria-label` quando for ícone.
- Visual:
  - max-width `min(280px, calc(100vw - 24px))`
  - z-index alto e padronizado: `z-[700]` ou CSS `--z-tooltip`
  - texto legível, sem ficar minúsculo demais.
- Nunca bloquear clique principal do card.

### 3.3 Implementação sugerida

Criar `SmartTooltip` em `Primitives.jsx` ou `src/components/ui/SmartTooltip.jsx`.

Pseudocódigo:

```jsx
export function SmartTooltip({
  content,
  children,
  placement = "auto",
  disabled = false,
  className = ""
}) {
  const triggerRef = useRef(null);
  const bubbleRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [resolvedPlacement, setResolvedPlacement] = useState("top");

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bubbleW = Math.min(280, vw - 24);
    const preferred = placement === "auto" ? "top" : placement;

    let top = rect.top - 12;
    let left = rect.left + rect.width / 2;

    let finalPlacement = preferred;

    if (preferred === "top" && rect.top < 120) finalPlacement = "bottom";
    if (preferred === "bottom" && vh - rect.bottom < 120) finalPlacement = "top";

    if (finalPlacement === "top") top = rect.top - 10;
    if (finalPlacement === "bottom") top = rect.bottom + 10;

    left = Math.max(12 + bubbleW / 2, Math.min(vw - 12 - bubbleW / 2, left));

    setCoords({ top, left });
    setResolvedPlacement(finalPlacement);
  }, [placement]);

  // useEffect para open, scroll, resize, keydown, click outside.
}
```

Pode simplificar, mas precisa resolver clipping.

### 3.4 Atualizar InfoTooltip

Manter API atual para não quebrar:

```jsx
export function InfoTooltip({ texto }) {
  return (
    <SmartTooltip content={texto}>
      <button type="button" aria-label="Ajuda" className="...">
        <Info size={13} />
      </button>
    </SmartTooltip>
  );
}
```

### 3.5 Atualizar ProgressiveTooltip

`ProgressiveTooltip` deve usar portal também. Se for complexo, use `SmartTooltip` internamente com `openByDefault={!visto}` e botão “Entendido”.

Contrato sugerido:

```jsx
<SmartTooltip
  content={...}
  open={open}
  onOpenChange={setOpen}
  persistent
  footer={<button>Entendido</button>}
>
  {children}
</SmartTooltip>
```

Se não quiser alterar `SmartTooltip` demais, criar `SmartPopover` separado.

---

## 4. Remover tooltips manuais quebradas

Auditar:

```bash
grep -R "group-hover:opacity-100" -n src/components
grep -R "absolute bottom-full" -n src/components
grep -R "title=" -n src/components
grep -R "InfoTooltip" -n src/components
grep -R "ProgressiveTooltip" -n src/components
```

### 4.1 Cronograma.jsx

O bloco “Viés Metacognitivo” tem tooltip manual:

```jsx
<span className="absolute bottom-full ... group-hover:opacity-100">
```

Substituir por `SmartTooltip`.

Não usar emoji hardcoded novo. Se já existir `⚠️`, pode substituir por `AlertTriangle` de `lucide-react`.

### 4.2 Dashboard.jsx

Substituir tooltips manuais em KPI cards e cards de retenção por `InfoTooltip`/`SmartTooltip`.

### 4.3 `title=`

Regra:

- Se for só label redundante, pode manter.
- Se for explicação importante, trocar por `SmartTooltip`.
- Se for acessibilidade de botão ícone, usar `aria-label`.

---

## 5. TourBalloon mobile

Atualizar `TourBalloon` em `Primitives.jsx`.

Requisitos:

- `z-index` acima de modal/tooltip se for tour: `z-[800]`.
- Container:
  ```txt
  fixed inset-0 p-3 sm:p-4 overflow-y-auto
  ```
- Card:
  ```txt
  max-h-[calc(100dvh-2rem)]
  overflow-y-auto
  pb-[max(1rem,env(safe-area-inset-bottom))]
  ```
- Botão sempre visível:
  - footer sticky dentro do card se o texto for grande.
- Fechar/continuar acessível no mobile.

---

## 6. Modo Foco mobile

### 6.1 Problema

`FocusMode.jsx` usa:

```jsx
<div className="fixed inset-0 ... overflow-hidden">
<main className="flex-1 overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-8">
<div className="... my-auto ... p-6 md:p-8 space-y-6 ...">
```

Em telas menores, o card pode ficar alto demais e os botões podem ficar fora da área confortável.

### 6.2 Correção

Aplicar padrão:

```txt
fixed inset-0 min-h-dvh h-dvh overflow-hidden
header shrink-0
main flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 md:p-8
card w-full max-w-2xl rounded-2xl md:rounded-3xl p-4 md:p-8 my-0 md:my-auto
footer/actions sticky bottom-0 bg-gradient...
pb-[max(1rem,env(safe-area-inset-bottom))]
```

### 6.3 Botões de ação

Nos passos longos do D0/D1:

- Botões principais devem ficar dentro de `sticky bottom-0` em mobile.
- Evitar que textarea + formulário empurre botão para fora.
- Em mobile, usar `max-h` e scroll interno onde necessário.

Exemplo:

```jsx
<div className="sticky bottom-0 -mx-4 mt-4 border-t border-white/5 bg-[#0d0d14]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0">
  ...
</div>
```

### 6.4 Reduzir header no mobile

Header do FocusMode:

- `px-3 py-2 sm:px-6 sm:py-4`
- botão “Pausar Sessão” menor no mobile.
- título não deve quebrar layout.

### 6.5 Testes mobile

Testar viewport:

```txt
375 x 667
390 x 844
414 x 896
360 x 740
```

Checklist:

- botão Pausar aparece;
- card não fica cortado;
- botão principal aparece sem precisar “caçar”;
- teclado virtual não inviabiliza textarea;
- modal/tour não sai da tela.

---

## 7. Cronograma semanal para Residência

### 7.1 Bug/produto atual

O Dashboard promete:

```txt
Criar Cronograma
```

Mas na Residência o usuário vai para `Cronograma.jsx`, que mostra o catálogo MEDCOF e o botão “Novo tema”. Não há criador de grade semanal para `res`, apesar do store já ter `res.cronogramas`.

### 7.2 Correção recomendada

Criar um hub genérico:

```txt
src/components/CronogramaHub.jsx
```

Ele substitui a divisão atual:

- Para `plat === "res"`:
  - Tab 1: `Catálogo de Temas`
  - Tab 2: `Grade Semanal Planejada`
- Para `plat === "vest"`:
  - Tab 1: `Catálogo de Matérias`
  - Tab 2: `Grade Semanal Planejada`

Usar:

```jsx
<Cronograma catalogo={resolveCatalogo(plat, selId)} ... />
<CronogramaSemanal plat={plat} ... />
```

### 7.3 Extrair/parametrizar CronogramaVest

`CronogramaVest.jsx` hoje parece ser o criador/listador da grade semanal. Não mantenha nome “Vest” se ele for usado para Residência.

Opções:

#### Opção A — mais limpa

Renomear/consolidar para:

```txt
src/components/CronogramaSemanal.jsx
```

E manter `CronogramaVest.jsx` como wrapper para compatibilidade:

```jsx
export { default } from "./CronogramaSemanal";
```

#### Opção B — menor risco

Criar `CronogramaSemanal.jsx` copiando a lógica útil de `CronogramaVest.jsx`, mas parametrizada por `plat`.

Recomendação: **Opção B** se o Codex perceber que renomear muitos imports aumenta risco.

### 7.4 Gerador inteligente por plataforma

No gerador semanal:

Se `plat === "res"`:

- Usar `resolveCatalogo("res", cronogramaSel.res)`.
- Matérias-alvo vêm de `CATALOGO_RES`.
- Prioridade:
  - tema não iniciado;
  - alta incidência ENAMED;
  - baixa cobertura;
  - carga futura FSRS aceitável;
  - proximidade da prova.
- Labels:
  ```txt
  Residência Médica
  Tema
  Área
  ENAMED
  ```

Se `plat === "vest"`:

- manter lógica atual com `CATALOGO_VEST`.

### 7.5 Importar PDF/texto

Para Residência, manter importação textual simples:

```txt
SEMANA 1
SEG 12/05
08:00–11:30
Apendicite Aguda
```

Não implementar OCR/PDF real.

### 7.6 Dashboard

Quando `activeCrono` vazio e usuário clica `Criar Cronograma`:

- levar para `view="crono"`;
- abrir aba interna `Grade Semanal Planejada`, se possível.
- Se não for simples passar estado, pelo menos garantir que a aba existe e o usuário a vê.

### 7.7 Store

O store já tem:

```js
addCronograma
deleteCronograma
toggleBloco
updateBlocoConteudo
```

Usar essas actions para `res` também.

Se `addCronograma` sempre usa `id: Date.now()`, ok por enquanto.

---

## 8. Testes obrigatórios

### 8.1 Unitários

Se viável:

```txt
src/components/Primitives.tooltip.test.jsx
```

Mas se o setup de testes de portal for trabalhoso, priorizar teste manual + build.

### 8.2 Teste manual de tooltips

Validar:

1. Tooltip no topo da tela não sai para cima.
2. Tooltip na borda esquerda não sai da viewport.
3. Tooltip na borda direita não sai da viewport.
4. Tooltip dentro de card com `overflow-hidden` não é cortado.
5. Tooltip funciona com clique no mobile.
6. Tooltip fecha com Escape.
7. Tooltip fecha ao clicar fora.
8. ProgressiveTooltip aparece e botão “Entendido” funciona.
9. TourBalloon cabe no mobile.

### 8.3 Teste manual do Modo Foco

Validar em devtools mobile:

1. Entrar no Modo Foco.
2. Pausar Sessão visível.
3. Card inteiro acessível.
4. D0 preparação acessível.
5. D0 passos com botão de avançar acessível.
6. Textarea não quebra layout.
7. Botões ficam visíveis no fim dos formulários.
8. Transição “próximo da fila” cabe na tela.
9. Estados de exaustão cabem na tela.

### 8.4 Teste manual do Cronograma Residência

1. `plat = res`.
2. Ir para Cronograma.
3. Ver tabs:
   - Catálogo de Temas
   - Grade Semanal Planejada
4. Entrar em Grade Semanal.
5. Criar cronograma manual.
6. Criar cronograma inteligente.
7. Ver cronograma no Dashboard.
8. Marcar bloco como concluído.
9. Confirmar persistência em `res.cronogramas`.
10. Confirmar que vestibular não quebrou.

---

## 9. Comandos finais

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

## 10. Critérios de aceite

F2 aprovado se:

- Tooltips não são cortadas por containers.
- InfoTooltip usa portal/posicionamento seguro.
- ProgressiveTooltip não fica fora da tela.
- TourBalloon cabe no mobile.
- Modo Foco não fica fora da tela em mobile.
- Botões principais do Modo Foco são alcançáveis.
- Residência tem aba real de Grade Semanal Planejada.
- Dashboard “Criar Cronograma” leva a uma função existente.
- Store usa `res.cronogramas`.
- Vestibular mantém a grade semanal.
- Build passa.
