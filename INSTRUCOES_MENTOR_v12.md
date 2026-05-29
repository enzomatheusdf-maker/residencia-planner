# MedRev / Bro — Auditoria de Engenharia v12

**Documento de execução para o Antigravity (Hélio).** Continuação da v11. Cada item traz: **diagnóstico** (o que está errado, com arquivo:trecho), **correção esperada** (direção de código, não literal), **critério de aceite** e, quando aplicável, **fundamento científico**.

> Convenção de prioridade: 🔴 bug crítico / quebra de fluxo · 🟠 importante · 🟡 melhoria.
> Princípio reafirmado: **o app não é um banco de questões.** É um *mentor de aprendizagem* construído sobre um motor FSRS (revisão espaçada) + diagnóstico metacognitivo. O banco de questões é apenas a *fonte de prática*; o produto é a inteligência que decide **o que revisar, quando e por quê**. Toda decisão de UI/feature deve reforçar essa promessa, não diluí-la.

---

## SUMÁRIO DOS PROBLEMAS RELATADOS

| # | Problema relatado | Item neste doc |
|---|---|---|
| 1 | Cronograma abre "borrado" e não inicia o ciclo | §1 🔴 |
| 2 | Abas das Configurações feias | §2 🟠 |
| 3 | Faltam subtópicos (principalmente vestibular) | §3 🔴 |
| 4 | No mobile não dá pra trocar Vestibular/Residência | §4 🔴 |
| 5 | Dashboard precisa ficar mais compacto (mobile + PC) | §5 🟠 |
| 6 | Funções dos prints mal otimizadas (Simulados, etc.) | §6 🟠 |
| 7 | Aprofundar a mentoria com ciência da aprendizagem | §7 + §8 🟡 |
| — | Dívidas técnicas encontradas na auditoria | §9 🟡 |

---

## §1 🔴 Cronograma "borrado" que não inicia o ciclo

### Diagnóstico (causa-raiz confirmada lendo o código)

O efeito "borrado + não inicia" **só acontece durante o tour de onboarding** (`tourStep === "crono"`). A sequência é:

1. `App.js` finaliza o onboarding e seta `setTourStep("crono")` + `setView("crono")`.
2. `Cronograma.jsx` (linhas ~98–139), quando `tourStep === "crono"`, renderiza um **card DEMO** + um `<TourBalloon>`. O resto da grade real fica visualmente atrás do balão (sensação de "borrado").
3. O **botão do card demo** (linha ~114) chama:
   ```js
   onStep(plat === "vest" ? "demo-funcoes" : "demo-apendicite", "d0")
   ```
   Isso seta `targetedFocusItem = { temaId: "demo-funcoes" }` e `focusMode = true` — **mas NÃO muda `tourStep` para `"focus"`**.
4. Em `FocusMode.jsx` (linhas 17–49), o branch que monta o tema demo **só dispara quando `tourStep === "focus"`**. Como ainda está `"crono"`, ele cai em `temas.find(x => x.id === "demo-funcoes")` → não existe → `activeReviewItem = null`.
5. Resultado: `FocusMode` renderiza o estado vazio **"🎉 Fila Totalmente Limpa!"** (linha 210) → beco sem saída. O usuário interpreta como "não inicia".

> O `<TourBalloon onNext>` (linha 134) faz certo: seta `"focus"` **antes** de chamar `onStep`. O **botão do card demo não faz isso** — é a inconsistência exata.

### Correção esperada

**(A) Em `Cronograma.jsx`**, o `onClick` do botão do card demo deve espelhar o `onNext` do balão (setar `"focus"` antes do `onStep`):
```jsx
onClick={() => {
  setTourStep("focus");
  onStep(plat === "vest" ? "demo-funcoes" : "demo-apendicite", "d0");
}}
```

**(B) Blindagem defensiva em `FocusMode.jsx`** (para nunca mais cair no beco se um `targetedItem` apontar para id inexistente): tratar ids `demo-*` como demo independentemente do `tourStep`, e logar warning:
```js
if (targetedItem) {
  const t = temas.find(x => x.id === targetedItem.temaId);
  if (t) return { tema: t, stepKey: targetedItem.stepKey };
  if (String(targetedItem.temaId).startsWith("demo-")) return DEMO_ITEM(plat); // fallback
  console.warn("FocusMode: targetedItem sem tema correspondente", targetedItem);
}
```

**(C) Remover a sensação de "borrado"**: durante `tourStep === "crono"`, em vez de renderizar a grade real *atrás* do balão, esconder a grade (`hidden`) e mostrar **apenas** o card demo + balão, centralizados. Quando o tour termina, a grade real aparece limpa. Isso elimina o "fundo borrado".

### Critério de aceite
- Concluir onboarding → Cronograma mostra **só** o demo + balão (sem grade borrada atrás).
- Clicar em "Iniciar Ciclo de Estudos" no demo → entra no Modo Foco do tema demo (D0), **nunca** em "Fila Limpa".
- Fora do tour, clicar "Iniciar Ciclo Hoje" em qualquer card real → inicia D0 daquele tema normalmente.

---

## §2 🟠 Interface das abas de Configurações (AjustesModal)

### Diagnóstico
`Modals.jsx` → `AjustesModal` (linha ~1097). As abas (linhas 1231–1245) são `flex-1` com `border-b-2`. No mobile (print 10) ficam apertadas, os emojis nos labels (`"👤 Perfil"`, `"⚙ Ajustes"`) brigam com o texto e o conjunto fica "pesado". O conteúdo das tabs usa muitos blocos `bg-white/5 rounded-2xl p-4` empilhados sem hierarquia visual clara.

### Correção esperada
1. **Separar ícone de texto**: usar ícones `lucide-react` (User, Settings, BookOpen, Lock) em vez de emoji embutido na string. Abas viram coluna ícone-em-cima-texto-embaixo no mobile, lado-a-lado no desktop.
2. **Pill tabs** em vez de `border-b-2`: container `bg-black/40 rounded-xl p-1`, aba ativa com `bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-lg shadow`. (Mesma linguagem visual dos botões primários — consistência.)
3. **Scroll horizontal das abas no mobile** se não couberem (`overflow-x-auto` + `snap-x`), nunca quebrar/comprimir.
4. **Hierarquia interna**: cada seção (`bg-white/[0.03]`) com header de seção `text-[11px] uppercase tracking-wider text-gray-500` + ícone pequeno; espaçamento `space-y-5` entre seções, `space-y-3` dentro.
5. **Sticky header + footer** no modal: título e botão de fechar fixos no topo, área de conteúdo com `overflow-y-auto`. Já existe `max-h-[60vh]` no conteúdo (linha 1248) — manter, mas garantir que o header das tabs também fique sticky.
6. Reaproveitar isso como um **componente `<Tabs>` em `Primitives.jsx`** (ver §6.3) para padronizar com as tabs do Simulados e do CronogramaVestHub.

### Critério de aceite
- Mobile (≤640px): abas legíveis, sem texto cortado; trocar de aba não causa "pulo" de layout.
- Aparência alinhada ao resto do app (gradiente violet→pink nos estados ativos).

---

## §3 🔴 Subtópicos (tópico → subtópico) — principalmente Vestibular

### Diagnóstico — **a maior parte do trabalho de dados JÁ ESTÁ FEITA**
`src/constants/catalogos.js` **já implementa** o schema de 2 níveis pedido na v11: cada entrada do `CATALOGO_VEST` é `[nome, esp, { prio, subs: [...] }]` e os `subs` **já estão populados** (Matemática, Física, Química, Bio, História, Geo, Filo, Socio, Linguagens, Redação, Artes). Há `parseCatalogEntry()` e `getSubtopics()` prontos.

**O problema é só de UI**: `Cronograma.jsx` (linhas 197–242) renderiza um card por **tópico** e **ignora completamente os `subs`**. O aluno nunca vê nem inicia um subtópico. Ou seja: os dados existem, a tela não os expõe.

### Correção esperada

**(A) `Cronograma.jsx` — card de tópico expansível para subtópicos.**
Ao renderizar cada `[nome, esp, prioOrObj]`, usar `parseCatalogEntry()`. Se `subs.length > 0`:
- O card mostra o nome do tópico + um contador `▸ {subs.length} subtópicos` + chevron.
- Expandir o card revela a lista de subtópicos. **Cada subtópico é uma unidade iniciável** com seu próprio botão "Iniciar Ciclo Hoje" e sua própria barra de progresso D0→D21.
- Cada subtópico iniciado vira um `tema` no store com `nome = "{Tópico} — {Subtópico}"`, `esp`, `prio` herdada do tópico (editável), e o campo novo `parentTopic` (ver B). Reaproveitar a lógica existente de `onIniciarTema` (App.js linha 698) — ela já faz find-or-create.
- Mostrar progresso agregado do tópico: `X/Y subtópicos iniciados`, com mini-barra.

**(B) Modelo de dados — adicionar `parentTopic` ao tema** (retrocompatível; default `null`).
Em `addTema` (store.js linha 155) já se faz spread de `tema`, então basta o caller passar `parentTopic`. Serve para: agrupar subtemas na UI, agregar estatísticas por tópico, e alimentar interleaving (§7.2).

**(C) Reaproveitar para Residência (opcional, fase 2).** O MEDCOF é plano hoje. Não precisa subdividir agora, mas o mesmo componente de card deve degradar graciosamente quando `subs` está vazio (= comportamento atual de card único). **Não quebrar residência.**

**(D) Busca e filtros** (campo `q` linha 142) devem casar também no nome do subtópico, não só do tópico.

### Critério de aceite
- Vestibular: clicar numa matéria → tópicos; expandir um tópico → subtópicos; iniciar um subtópico cria um ciclo D0→D21 individual.
- ≥ 250 unidades iniciáveis no vestibular (já há esse volume nos `subs`).
- Residência continua funcionando exatamente como antes.

### Fundamento científico (por que subtópicos importam)
Unidades menores são pré-condição para **interleaving** e **spacing** eficazes. A meta-análise de Brunmair & Richter (2019, *Psychological Bulletin*, g = 0.42; 59 estudos) mostra que o ganho do interleaving é **maior quando os itens são similares mas distintos** — exatamente a relação entre subtópicos de um mesmo tópico (ex. "Função afim" vs "Função quadrática"). Tópicos grandes e monolíticos impedem o contraste discriminativo que produz o efeito. Para matemática especificamente, o efeito de interleaving fica em torno de g = 0.34 (Brunmair & Richter, 2019), e é **maior para alunos de menor desempenho** (edworkingpapers AI23-876; ~0,29 DP de ganho de retenção curto prazo, concentrado na base da distribuição) — público relevante de vestibular.

---

## §4 🔴 Trocar Vestibular ⇄ Residência no mobile

### Diagnóstico
O switcher de plataforma existe **só no `Sidebar.jsx`** (linhas 56–66), que tem `hidden md:flex` (linha 46). Logo, **no mobile não há como trocar**. O `BottomNav.jsx` não tem o toggle. O `AjustesModal` também **não tem** controle de plataforma (só mostra a plataforma atual como label, linha 1261).

### Correção esperada (modelo "decidir no início, trocar só nos Ajustes")
Você pediu: definir no início e depois só trocar via Ajustes. Implementar assim:

**(A) Onboarding** já define a plataforma (`OnboardingModal`, `setPlat(foco)`). Manter.

**(B) Remover a troca casual do mobile** — não colocar o toggle no BottomNav (poluiria a navegação e induz troca acidental). Em vez disso:

**(C) Adicionar um seletor de plataforma no `AjustesModal`, aba Perfil**, logo abaixo do card de identidade:
```jsx
<Field label="Foco de Estudo Ativo">
  <div className="grid grid-cols-2 gap-2 bg-black/40 rounded-xl p-1">
    {[["res","Residência"],["vest","Vestibular"]].map(([k,l]) => (
      <button onClick={() => { setPlat(k); /* toast: troca confirmada */ }}
        className={plat===k ? "ativo-gradiente" : "inativo"}>{l}</button>
    ))}
  </div>
  <p className="hint">Trocar o foco muda todo o painel, cronograma e métricas.</p>
</Field>
```
`setPlat` já existe no store (linha 92) e o `AjustesModal` já desestrutura `plat` do store — basta puxar `setPlat` também.

**(D) Desktop**: manter o switcher no Sidebar (é cômodo lá), mas garantir consistência — ambos chamam o mesmo `setPlat`.

> Decisão de produto: trocar de plataforma é uma ação rara e de alto impacto (zera o contexto visível). Escondê-la em Ajustes evita troca acidental no mobile e cumpre exatamente o fluxo que você descreveu.

### Critério de aceite
- Mobile: usuário consegue trocar de plataforma via Ajustes → Perfil; o painel inteiro reflete a troca.
- Não há toggle de plataforma exposto na navegação principal do mobile (só em Ajustes).

---

## §5 🟠 Dashboard mais compacto (mobile + PC) — referência MedEvo

### Diagnóstico
`Dashboard.jsx` é grande (64KB). Os KPIs ficam num `grid grid-cols-2 md:grid-cols-4 gap-3` (linha 558) e abaixo vêm vários blocos altos (ação recomendada, diagnóstico do mentor com barra de calibração, cards de nível 7/30). No mobile isso vira **scroll longo**; no PC sobra espaço horizontal ocioso. Você quer densidade tipo "tudo num campo de visão".

### Correção esperada
1. **KPIs como faixa densa**: reduzir padding (`p-3`), número grande mas card mais baixo; no mobile 2×2 fixo, no desktop 4 colunas + a "Ação Recomendada" como 5º card-CTA na mesma linha quando couber (`xl:grid-cols-5`).
2. **`modoSimples` como verdadeiro "modo compacto"**: hoje ele só esconde alguns blocos (`!modoSimples && ...`, linhas 944/1113). Reforçar: em `modoSimples` o Dashboard cabe em ~1 tela — KPIs + Ação Recomendada + MiniCronograma. O resto (diagnóstico longo, heatmap, níveis) vira **acordeões colapsados** ("Ver diagnóstico completo ▾").
3. **MiniCronogramaWidget** (linha 157) deve ser o foco do mobile: lista enxuta dos "pendentes hoje" com botão de iniciar direto, sem precisar ir ao Cronograma.
4. **Densidade tipográfica**: títulos de seção menores (`text-[11px] uppercase tracking-wider`), menos `gap-5` → `gap-3`/`gap-4`, remover cards decorativos que não carregam dado acionável.
5. **Grid responsivo de 12 colunas** no desktop (já existe `lg:grid-cols-12` na linha 909) — usar para colocar diagnóstico ao lado dos KPIs em telas largas, não empilhado.

### Critério de aceite
- Mobile em `modoSimples`: KPIs + ação + próximos itens cabem sem rolar mais que ~1,5 tela.
- Desktop: sem grandes vazios horizontais; informação acionável priorizada acima da dobra.
- Toggle `modoSimples` muda visivelmente a densidade (não só esconde 2 blocos).

---

## §6 🟠 Funções dos prints mal otimizadas

### 6.1 Registro de Simulado (print 8) — `Simulados.jsx` → `SimRegistroModal`
**Diagnóstico:** no mobile o modal pág 1/2 fica espremido; campos `Tempo/Ansiedade/Cansaço` num `grid-cols-3` (linha 48) ficam minúsculos; `total` já vem preenchido `100` mas `acertos` vazio — ok, mas não há validação visual de `acertos ≤ total`.
**Correção:**
- `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (empilha no mobile).
- Validar `acertos ≤ total` (bloquear "Próxima Etapa" + mensagem inline).
- Mostrar o **% de acerto em tempo real** assim que `total` e `acertos` estão preenchidos (feedback imediato).
- Ansiedade/Cansaço: virar 3 botões-pílula (Baixa/Normal/Alta) em vez de `<select>` — mais rápido no toque e visualmente coerente.

### 6.2 Simulados — estado vazio (print 9)
Está ok funcionalmente. Melhoria: o card de "Nenhum simulado registrado" pode trazer 1 linha explicando **por que** registrar (o mentor usa ansiedade/cansaço/tempo para calibrar alertas — conecta com §7).

### 6.3 Padronizar Tabs (Simulados, Ajustes, CronogramaVestHub)
**Diagnóstico:** há **três** implementações diferentes de "tabs" (Simulados `activeTab`, AjustesModal, CronogramaVestHub `subView`), cada uma com estilo próprio. Inconsistência visual.
**Correção:** criar `<Tabs items={[{k,label,icon}]} active onChange />` em `Primitives.jsx` e usar nos três lugares. Estilo pill-gradiente único.

### Critério de aceite
- Registro de simulado usável no mobile, com validação e % em tempo real.
- Um único componente de Tabs em todo o app.

---

## §7 🟡 Aprofundar a mentoria com ciência da aprendizagem

> Núcleo do produto. Tudo abaixo é **direção baseada em evidência**; cada item cita a base. Implementar incrementalmente — nenhum depende do outro.

### 7.1 Fila inteligente com peso de "dificuldade desejável" (desirable difficulty)
**Hoje:** `calcFilaInteligente` (hooks/useMetrics) ordena por atraso/importância. **Evidência:** retrieval practice rende mais quando a recuperação é **difícil mas bem-sucedida** (Bjork; Rowland 2014, *Psych. Bulletin*, g = 0.50 vs releitura). O FSRS já modela isso via estabilidade `S` e retrievabilidade alvo `DESIRED_RETENTION = 0.90` (fsrs.js linha 46).
**Ação:** expor na fila um sinal de "este item está no ponto ótimo de revisão" (retrievabilidade estimada ~0,85–0,90) e priorizá-lo sobre itens triviais (R≈1) ou já perdidos (R muito baixo, que viram "reaprender", não "revisar"). Frase do mentor: *"Estes 3 itens estão no ponto exato de esquecimento — revisá-los agora rende o dobro."*

### 7.2 Interleaving guiado entre subtópicos
**Evidência:** Brunmair & Richter (2019) g = 0.42; melhor quando itens são **similares mas distintos** (subtópicos de um mesmo tópico) e para alunos de menor desempenho. **Ação:** quando o aluno tem ≥3 subtópicos iniciados num mesmo tópico, o Modo Foco pode propor uma **sessão intercalada** ("misturar Função afim + quadrática + modular") em vez de bloco único. Marcar a sessão como `interleaved: true` para medir efeito. **Cautela honesta:** o efeito em provas cumulativas de longo prazo é pequeno/instável (edworkingpapers AI23-876: ~0,04 DP, IC cruza zero) — então **oferecer como opção, não impor**, e nunca prometer milagre.

### 7.3 Diagnóstico por *tipo* de erro (já especificado na v9, ainda não implementado)
O campo `motivosErro[]` (lacuna/raciocínio/distração/não-vi) é coletado mas **não agregado**. Criar `src/core/errorPatterns.js` que detecta padrão dominante por especialidade (≥5 sessões) e gera frase específica:
- >60% "lacuna" → *"Seus erros em X são de base, não de raciocínio. Volte ao conteúdo, não faça mais questões."*
- >60% "raciocínio" → *"Você sabe o conteúdo mas erra na lógica. Faça questões comentadas, não releia."*
- >60% "distração" → *"Erros por desatenção em X. Reveja horário/cansaço."*
**Evidência:** prática deliberada exige feedback que ataca o ponto de falha específico (Ericsson 1993; rev. médica Deng/Gluckstein/Larsen, *Perspectives in Med Ed*, 2015).

### 7.4 Calibração metacognitiva (viés confiança × acerto) — ampliar
Já existe detecção de viés (mentor.js insight D; Cronograma badge "Viés Metacognitivo"). **Ampliar:** mostrar no Dashboard um pequeno gráfico "confiança declarada vs acerto real" ao longo do tempo. **Evidência:** calibração metacognitiva prediz desempenho independentemente do volume; over-confidence é preditor de erro em prova.

### 7.5 Timing de feedback
**Evidência (nuance honesta):** para vocabulário/L2 o timing de feedback tem efeito pequeno e inconsistente (meta-análise L2, d≈0.14); para conceitos complexos, feedback **imediato após tentativa de recuperação** tende a ajudar. **Ação:** manter feedback imediato no Modo Foco (já é o caso), mas **não** investir esforço grande aqui — o ganho marginal é baixo. Registrar a recomendação para não "otimizar" no lugar errado.

### 7.6 Honestidade do produto
Onde a evidência é fraca/contestada (interleaving em prova cumulativa, timing de feedback, efeito de teste em matemática — g=0.18 com IC cruzando zero, Springer 2025), **o mentor não deve prometer ganhos garantidos.** Tom: "evidência sugere", não "está provado". Isso protege a credibilidade do produto e do usuário.

---

## §8 🟡 Banco de frases do mentor — qualidade

**Diagnóstico:** `mentor.js` tem bom volume de frases, mas algumas ainda são "clínicas" no vestibular (herança residência→vest). **Ação:** revisar frases para que `plat === "vest"` nunca use jargão médico; garantir que `{prova}`, `{tema}`, `{data}` interpolem corretamente. Adicionar variantes para os novos eventos: `sessao_interleaved`, `erro_padrao_detectado`, `item_ponto_otimo`.

---

## §9 🟡 Dívidas técnicas encontradas na auditoria

1. **`addDays` usa `toISOString().slice(0,10)`** (fsrs.js linha 12) após criar a data com `T12:00:00`. Em fusos a oeste de GMT isso pode regredir 1 dia. Já há o mitigador `T12:00:00`, mas padronizar **toda** formatação de data via `todayStr()`/helper local, nunca `toISOString` direto, para evitar drift de fuso.
2. **`recalcAfterMark` importado mas não usado em `store.js`** (linha 6) — limpar imports mortos.
3. **Demo ids mágicos** (`"demo-funcoes"`, `"demo-apendicite"`) espalhados em Cronograma e FocusMode — centralizar numa constante `DEMO_TEMA_ID(plat)` em fsrs.js ou um `constants/demo.js`.
4. **Três implementações de Tabs** (ver §6.3) — consolidar.
5. **Persistência**: `partialize` (store.js linha 422) **não persiste `sprint`** — a Sprint Semanal de Foco é perdida no reload. Adicionar `sprint` ao `partialize` e ao `merge`.
6. **`ErrorBoundary`** envolve só Cronograma-vest e Simulados (App.js). Envolver também Dashboard e StatsPanel (os mais pesados) para não derrubar a tela inteira.
7. **Acessibilidade**: vários `onClick` em `<div>` (cards do Cronograma) sem `role="button"`/`tabIndex`/`onKeyDown`. Ao menos os de ação primária ("Iniciar Ciclo") já são `<button>` — manter o padrão e migrar os divs clicáveis.

---

## ORDEM DE EXECUÇÃO SUGERIDA

1. **§1** (bug do ciclo — quebra o primeiro contato do usuário). 🔴
2. **§4** (troca de plataforma no mobile — bloqueia metade do público). 🔴
3. **§3** (subtópicos — dados já prontos, só UI; maior ganho percebido). 🔴
4. **§2 + §6.3** (tabs/configurações — rápido, padroniza visual). 🟠
5. **§5** (dashboard compacto). 🟠
6. **§6.1/6.2** (simulados). 🟠
7. **§7 + §8** (mentoria/ciência — incremental, contínuo). 🟡
8. **§9** (dívidas — junto com os itens acima quando tocar nos arquivos). 🟡

---

## REFERÊNCIAS CIENTÍFICAS (para citar no produto/mentor quando útil)

- Rowland (2014), *Psychological Bulletin* — retrieval practice vs releitura, g = 0.50 [0.42, 0.58], 159 effect sizes.
- Brunmair & Richter (2019), *Psychological Bulletin* — interleaving g = 0.42 [0.34, 0.50]; matemática g ≈ 0.34; melhor com itens similares-mas-distintos.
- Firth et al. (2021), *Review of Education* — interleaving, memória até g = 0.65, transferência até g = 0.66; melhor quando diferenças entre itens são sutis.
- Meta-análise de spacing/retrieval em matemática (Springer, 2025) — spacing g = 0.28 (course-embedded g = 0.24; isolado g = 0.43); teste vs releitura g = 0.18 (IC cruza zero — **não robusto em matemática**).
- STEM courses single-paper MA (Int. J. STEM Ed., 2024) — spacing promissor mas dependente de design e de o aluno **olhar o feedback**.
- edworkingpapers AI23-876 — interleaving em sala: +0,29 DP curto prazo, ~0,04 DP cumulativo de fim de ano (não significativo); maior ganho na base da distribuição.
- Ericsson et al. (1993) + Deng, Gluckstein & Larsen (*Perspectives in Medical Education*, 2015) — prática deliberada e feedback específico por tipo de erro predizem desempenho em exames de licença.

> **Regra editorial:** quando o mentor citar ciência, usar "evidência sugere/aponta", indicar que efeitos variam por contexto, e nunca prometer aprovação garantida. A força do produto é a honestidade calibrada — coerente com o próprio conceito de calibração metacognitiva que ele ensina.
