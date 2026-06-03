# MedRev — Plano Mestre de Implementação do Roadmap V2 (gaps restantes, maturado)

> **Para o Sonnet executar.** Fonte: `MEDREV_MASTER_PRODUCT_ROADMAP_V2.md` + auditoria de código real + correções do Enzo (2026-06-03).
> **Regra geral:** uma fase por vez, commit local entre fases (mensagem por bloco, ex. `DASH2: ...`). **Rodar testes só no FINAL.**

## Context

Auditoria do código real: o esqueleto de navegação já está pronto (`navigationModel.js` → `Hoje / Plano / Simulados / Raciocínio Clínico / Anki Audit / Mais`), SIM1 (estratégia/fases/recomendação) está montado, o registro de simulado em 2 páginas existe, e o `StatsPanel` já tem a ordem de seções e gating de amostra. Este plano cobre **só o que falta**.

**Decisão revista (importante):** o "Preparo estimado" atual **não tem cálculo confiável e deve ser refeito** — não basta tooltip. A Previsão de desempenho passa a ser ancorada em simulados/provas antigas + acerto de questões ponderado por incidência, com banda de confiança e amostra mínima.

### Base científica (fundamenta Simulados e Previsão)
- **Provas práticas são o preditor mais forte** de desempenho na prova real (auto-avaliações tipo NBME: erro de ±5–8 pontos); **2 formas espaçadas ~2 semanas e a média** estreitam a banda de previsão, 3 formas é ainda melhor. → a Previsão deve ancorar em simulados/provas e só virar "número forte" com ≥2–3 registros. ([NBME self-assessment correlation](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7198101/), [multivariate NBME modeling](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10362906/))
- **Quantidade de simulados não é linearmente melhor** — espaçamento e aplicação estratégica importam mais que volume bruto; massar simulados é pior que distribuí-los por semanas/meses. → recomendar cadência espaçada, não "semanal para todos". ([SAEM practice tests](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9897245/), [retrieval/spacing ecológico](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8793259/))
- **Retrieval practice é, por si, preditor de aprovação**; progress testing é longitudinal e desencoraja "binge learning" — serve como trajetória de crescimento, não nota isolada. → fases de simulado = curva de crescimento; pós-simulado (correção/deliberate practice) é o que dá valor. ([retrieval practice preditor](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4673073/), [progress testing](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3540387/))

### Regras herdadas (valem para TODAS as fases)
- Não remover features sem ordem, não instalar libs, não tocar `package-lock.json`, sem push/deploy.
- Sem emojis hardcoded em UI crítica → ícones `lucide-react` (gate `npm run check:mojibake` quebra o build).
- Não vazar ENAMED/Raciocínio Clínico para `vest` (gating por `plat`/`platformFeatures.js`).
- Silos `res`/`vest` por `plat`; estado em `reviewflow-v6` com deep-merge.

---

## Reuso já disponível (NÃO recriar)
- `navigationModel.js`: `PLAN_TAB`, `buildPlanAgendaTarget({date})`, `getPlanTabFromTarget()` — usar para "Ver agenda".
- `errorTaxonomy.js` (taxonomia canônica) + `SIM_ERROR_TYPES` (`Simulados.jsx:54`, 9 tipos) — usar nos dois lugares, sem criar 3ª taxonomia.
- `simStrategy.js getSimRecommendation()` — já dá fase/frequência/próximo simulado.
- `scheduleWizard.js:177 balanceTopicsByArea()` — round-robin ponderado, **estender** para semanas.
- `readiness.js` — incidência ENAMED por área + `readinessSample` (gating). `volume.js:58` — fórmula atual (será substituída na previsão).
- `enamedIntel.js getEnamedContextBadge(area, tema)` — badge de incidência (já no `CronoCard`).
- `AgendaDayDetails.jsx` — já mostra FSRS S/D/R + minutos (estender).
- `DicaContextual.jsx` — banco de dicas rotativo (ampliar conteúdo).
- `achievements.js` — 9 conquistas com critérios. `clinicalReasoningScoring.js` / `illnessScript.js` — motor RC.

---

## FASE 1 — DASH2: Dashboard como porta de entrada

**Arquivos:** `src/components/Dashboard.jsx`, `App.js` (props `onOpenAgenda`/`onOpenAjustes`), `src/components/StatsPanel.jsx` (destino do que sai do dashboard).

**Enxugar o Dashboard — só estas métricas ficam:**
1. **Card Comando do Dia** recebe a **contagem de dias até a prova** (hoje no card de perfil/nível) — mover para cá.
2. **Gráficos de pizza no topo, ao lado do Comando do Dia:**
   - **Questões de hoje:** feitas / meta diária + média de acertos do dia.
   - **Flashcards/Revisões de hoje:** revisados + métricas again/novos do dia + nº de revisões do dia.
   Reusar `MetricRing` (`Dashboard.jsx:1655`); fontes nas sessões do dia / `useMetrics` (não inventar métrica).
3. **Saldo de ritmo** vem para o Dashboard **ao lado de "Questões feitas"**, com legenda em hover explicando faixas (negativo alto = atraso; ~0 = no esperado; positivo moderado = boa margem; positivo extremo = carga exagerada). Hoje rotula "Preparo" em `:1679` sobre `saldoRitmoNorm` — corrigir label/leitura.
4. **Mover para Estatísticas:** análise longa do Mentor + bloco "Avançado" + Volume de questões. No Dashboard, o Mentor fica curto (próxima ação, motivo, tempo, botão).
5. **Ações de hoje = a fila inteligente.** A "fila cronológica" já tem o cálculo inteligente, mas hoje aparece duplicada; consolidar: **as Ações de Hoje devem ordenar TODAS as ações do dia por importância** (vencidas de alto impacto → Anki pendente → revisão crítica → tema novo de alto retorno → simulado/pós-simulado → menores). Remover a lista cronológica redundante.
6. **Weekly Review** sai de "Mais" e passa a aparecer **no Dashboard e em Estatísticas** (`navigationModel.js` MORE_ITEMS → remover de lá; embutir o componente `WeeklyReview` já importado no Dashboard).
7. **Remover "itens de prontidão"** da UI (e o "Avançado" sem ação). Saldo de ritmo permanece; o que sai é o checklist de prontidão sem função.

**Consertar as 3 ações quebradas:**
8. **"Ver agenda"** (`Dashboard.jsx:704`) hoje cai em `setView("crono")` sem aba → usar `buildPlanAgendaTarget({date: todayStr()})` e garantir no `App.js` que `crono` leia `getPlanTabFromTarget` e abra a **subaba Agenda** no dia.
9. **"Ajustar plano"** (`Dashboard.jsx:697`) hoje abre o modal de Ajustes → apontar para o **onboarding/PlanSetup wizard** (reabrir em modo "ajustar").
10. **"Sessão sem fechamento"** (`Dashboard.jsx:1832`) hoje faz `setView("stats")` → abrir o **modal de fechamento da sessão pendente** (`hasPendingClosure` já existe em `:1003`).

**Dica do método:** ampliar `DicaContextual.jsx` para um banco rotativo real (retrieval practice, revisão espaçada, interleaving, como corrigir questão, como fazer simulado, como revisar erro, como usar Anki, D0, raciocínio clínico, lidar com atraso) — **não cair sempre em "flashcards"**; cada dica com `ctaLabel`/`ctaTarget`.

**Critério de aceite:** Dashboard mostra Comando do Dia (com dias p/ prova) + 2 pizzas + saldo de ritmo + ações de hoje inteligentes + weekly review; os 3 botões abrem o destino certo; prontidão/avançado/volume removidos; dicas variadas.

---

## FASE 2 — ANKI2: Anki Audit operacional + Comando do Dia

**Arquivos:** `src/components/AnkiAudit.jsx`, motor do mentor (`mentorDecisionPolicy.js`/autopilot), `Dashboard.jsx`.

1. **"Zerar Anki do dia" no Comando do Dia** quando houver pendência, com `target` executável; **não recomendar se já zerou hoje** (flag de "anki feito hoje" no store).
2. **Registrar sessão Anki direto do Dashboard** (modal já existe em `AnkiAudit.jsx:289`) via atalho no card de Anki pendente.
3. **Adesão diária marcável/desmarcável + streak** visível; mostrar **tempo estimado** nas KPIs (campo `tempo` já coletado em `:299`).

**Critério de aceite:** Comando do Dia sugere zerar Anki só quando pendente e some após registrar; adesão marca/desmarca; streak e tempo visíveis.

---

## FASE 3 — PLAN2: plano/agenda inteligente + banco de temas

**Arquivos:** `src/core/scheduleWizard.js`, `src/components/Cronograma.jsx`, `src/components/AgendaDayDetails.jsx`, `src/core/store.js`, `src/core/readiness.js`.

1. **Distribuição inteligente de áreas na semana.** O Enzo já fez a divisão de semanas por meta de temas/semana; falta **balancear áreas** para não passar uma semana sem certas áreas. Estender `balanceTopicsByArea()` (`scheduleWizard.js:177`) para operar por semana:
   - **MedCof / calendários prontos:** manter a ordem existente `críticas → altas → médias`, mas **garantir ≥1 tema de cada área por semana** quando possível, sem ocultar temas, com overflow p/ semanas seguintes; preservar blocos pedagogicamente dependentes.
   - **Estratégia / importado / custom:** prioridade padrão `Preventiva > Pediatria > GO > Cirurgia Geral > Clínica Médica`, **evoluível para incidência real do ENAMED** (via `readiness.js`) e, no futuro, por prova selecionada.
2. **Popup de detalhamento da Agenda** (clicar data/tarefa). `AgendaDayDetails.jsx` já tem FSRS **S/D/R** + minutos; **adicionar**: o que já foi feito no dia, **desempenho na matéria** (média de acertos do tema/área), **incidência ENAMED/provas selecionadas** (via `getEnamedContextBadge`), histórico recente e **ação recomendada**. Regra FSRS: mostrar só a próxima revisão real, não etapas hipotéticas.
3. **"Plano ativo + prioridades" minimizado por padrão.** Hoje é estado local `showPlanPanel` (`Cronograma.jsx:668`). Persistir `meta.ui.planPriorityExpanded` no store: **abre só na primeira vez após configurar**; depois minimizado; guardar `userCollapsedAt`/`userExpandedAt`.
4. **Card do cronograma com fonte menor** (`CronoCard`, `Cronograma.jsx:69`) para **mostrar tudo que está escrito**: subtítulo menor, `line-clamp` + tooltip/expand do título completo, e exibir área + prioridade + duração + **próxima ação** legível (hoje só step key).
5. **Banco de Temas hierárquico** estilo EstratégiaMed, **com base na hierarquia já existente** (`Cronograma.jsx:515` é flat; `parentTopic` em `:575` só vira texto). Renderizar árvore `Área > Subárea > Tema > Subtema` com: busca, incidência ENAMED, status no plano, adicionar ao plano, **criar caso clínico a partir do tema** (liga na Fase 6), e link de erro de simulado→tema (liga na Fase 4).
6. **Mapa de prioridades calibrado** (hoje descalibrado e confuso, tanto no Estratégia quanto MedCof/importado/custom): mostrar os **temas mais incidentes pelas estatísticas do ENAMED**, **clicáveis**, direcionando ao estudo quando ainda não feitos. **Se o tema não existir** no custom/importado, o sistema **cria e a pessoa confirma para salvar**. (O componente visual do mapa migra para Estatísticas → aba Provas, ver Fase 5; aqui fica a lógica de incidência/seleção.)

**Critério de aceite:** semana não fica monocromática e cobre as áreas; popup da agenda mostra feito+desempenho+FSRS+ENAMED+ação; painel de prioridades lembra estado; card do cronograma legível; Banco em árvore navegável; temas incidentes clicáveis criam tema com confirmação.

---

## FASE 4 — SIM1+SIM2: Estratégia de Simulados + auditoria de erros

**Arquivos:** `src/components/Simulados.jsx`, `src/core/simStrategy.js`, `src/core/errorTaxonomy.js`, store, `StatsPanel.jsx` (destino de gráficos).

**Estratégia de Simulados (primeiro card, funde "quando é o próximo simulado"):**
1. A aba abre com o card **Estratégia de Simulados**: primeiro o texto **"Simulado diagnóstico"**, depois a **calibração**. Funde a função "quando é o próximo simulado" — calcula **a cada quantos dias** fazer e **quando é o próximo**.
2. **Motor de recomendação de cadência** (estender `getSimRecommendation`), fundamentado na ciência acima:
   - Considera temas concluídos, acerto, estabilidade da média, dias até a prova, revisões vencidas, histórico de simulados, carga semanal.
   - **Mantém simulado diagnóstico** e toma ações com base nele.
   - **Sugere, não bloqueia:** dá a opção de iniciar antes com **aviso de que talvez não seja a melhor ação + porquê**; deixa escolher a frequência, mas o sistema **calcula quantos simulados/provas antigas por semana/mês** (espaçados, sem massar).
   - **Tooltip "prova antiga vs. simulado"**: quando usar cada um.
3. **Fases em fluxograma** (tooltip → popup maior): `Construção → Stamina → Stamina+ → Confirmação → Lapidação`, **explicando como a pessoa alcança cada fase** conforme avança (cobertura, consistência de questões, revisões em dia, proximidade da prova) — texto ancorado em ciência/relato de aprovados.
4. **3 estratégias validadas, escolhíveis por perfil:**
   - **(a) Diagnóstico progressivo** — simulados curtos no começo, crescendo com cobertura/acerto (bom p/ iniciantes; alinha com espaçamento e crescimento longitudinal).
   - **(b) Prova antiga orientada por banca** — foco em provas da instituição-alvo (bom p/ quem já sabe a prova; alinha com "teste semelhante ao alvo prediz melhor").
   - **(c) Alta frequência com pós-simulado obrigatório** — reta final; só mantém recomendação alta **se a pessoa corrige os erros** (deliberate practice); sem correção, o sistema reduz a recomendação.
5. **Direcionamento do Mentor** aparece **logo abaixo de "quando fazer o próximo simulado"** (por que fazer/não fazer agora, o que fazer antes, qual ação corretiva pós-simulado).
6. **Níveis sobem** por uma combinação de **acertos × nº de simulados × questões × revisões** (fórmula explicável; não só volume).
7. **"Como fazer este simulado"** vira **botão-tooltip no topo, ao lado de "Registrar sessão"**, abrindo popup fechável (cronometrar, misturar áreas, classificar erros, revisar racional, refazer erradas em 48–72h, usar provas novas p/ prever).

**Registrar simulado — redesign + correção obrigatória:**
8. **Redesign do popup** (selecionáveis feios, sem motion): UI dos selects melhorada + motion; **botão dentro do popup** abrindo **outro popup fechável** que ensina os **tipos de erro** (cards por categoria, exemplo, e **como corrigir cada um**) usando `errorTaxonomy.js`.
9. **Página 1:** todos os campos obrigatórios para avançar — **tipo, nome da prova, instituição/banca, ano (se prova antiga), data, nº questões, acertos, tempo, modo, áreas, meta**; registrar **qual prova/simulado** foi feito (vai p/ Estatísticas e **Banco de Simulados**). A próxima etapa só existe se **todos os campos** estiverem preenchidos.
10. **Página 2 (2/2):** só permite **salvar** se a **quantidade real de erros** for criada nas abas **e diagnosticada** (`erradas.length === realErrors` já existe em `:102` — endurecer o gate e o feedback). Por erro: questão, área, **tema (com busca/autocomplete)**, tipo de erro, nota/fato atômico, criou card?
11. **Linkar erro ao tema do plano** (busca no popup, sugestão por área→tema; se o tema não existir, **criar com confirmação**) — alimenta Plano/Agenda/Estatísticas/Mentor/Raciocínio/caderno de erros. Hoje é texto livre (`:269`).
12. **Cor do aproveitamento** muda conforme acertos se aproximam da meta; ao **alcançar/superar a meta → AZUL escuro + motion + confetes discretos** (animação CSS/SVG, sem lib nova).
13. **Estatísticas de erro** completas (tab "metricas", hoje só índice de descuido/conversão em `:1025`): erros por **tipo / área / tema**, **recorrentes**, **corrigidos**, **cards criados**, impacto na próxima agenda.
14. **D7 = caderno de erros** para quem **não tem** caderno próprio; quem já usa caderno, D7 vira mini-auditoria/checagem (copy condicional).

**Migrações desta aba para Estatísticas (ver Fase 5):** gráfico de simulado realizado, **mapa de prioridades** (→ aba Provas), e **Volume de questões** (→ resumo Aprendizagem). A aba **Elite** só sobrevive como "Provas" **se tiver função real**; senão, remover.

**Critério de aceite:** aba abre em Estratégia (diagnóstico→calibração) com cadência calculada e 3 estratégias; fases explicadas em fluxograma; mentor abaixo do próximo simulado; registro só salva com erros diagnosticados e vinculados a temas; cor/confete na meta; estatísticas de erro completas; gráficos migrados para Stats.

---

## FASE 5 — STATS2: Previsão real + estatísticas redondas

**Arquivos:** `src/components/StatsPanel.jsx`, **novo** `src/core/forecast.js` (ou refazer `volume.js`), `src/core/readiness.js`, `src/components/Modals.jsx` (Ajustes).

1. **Nome da aba** corrigido.
2. **Aprendizagem primeiro**, com as métricas que mais importam no topo: **nº de questões feitas, média de acertos geral e por área, revisões feitas geral e por área** + o que já existe na seção. Auditar a seção para deixá-la redonda (sem cards de baixa amostra disfarçados de certeza).
3. **Previsão de desempenho (refazer o cálculo — o atual não tem sentido):**
   - **Âncora:** média ponderada dos **simulados/provas antigas** (preditor mais forte) + **acerto de questões por área ponderado por incidência ENAMED** + cobertura de temas prioritários + aderência a revisões + calibração. Pesos iniciais sugeridos (ajustáveis): simulados/provas 45%, questões/área 25%, cobertura 15%, aderência 10%, calibração 5% — **mas o número só vira "forte" com amostra mínima**.
   - **Amostra mínima** (reusar `readinessSample`): ≥ ~300 questões, ≥3 áreas com dados, **≥1–2 simulados** (≥2–3 p/ banda mais estreita), ≥14 dias de uso, registros de Anki/revisões. Antes disso: "Coletando base para previsão" + o que falta.
   - **Banda de confiança que estreita com N de simulados** (fundamentado: 2 formas espaçadas + média estreitam; 3 é melhor). Exibir valor + intervalo + amostra usada + última atualização + **tooltip explicativo**.
   - **Gráfico de previsão e aumento ao longo do tempo** (linha + faixa de incerteza + eventos: simulados, mudanças de plano, semanas de atraso). Registrar snapshots periódicos da previsão para a série.
4. **Card exportável de metas com progresso.** Carregar a partir das **metas registradas no início** e mostrar progresso: meta diária de questões, feitas hoje, meta total até a prova, progresso total, dias restantes, ritmo necessário, saldo de ritmo. **Config automática em Ajustes** (`Modals.jsx`): se preencher questões/dia → total = dia × dias até prova; se preencher total → dia = total / dias (com arredondamento). Campos `metaQuestoesDia`/`metaQuestoesTotal` já existem em `:1651`.
5. **Receber o que saiu do Dashboard/Estudar:** análise longa do Mentor + Avançado; **Volume de questões** no resumo de Aprendizagem; **gráfico de simulado** e **mapa de prioridades** na aba **Provas**; Elite só se virar Provas com função real.
6. **Remover** as funções **"Ver mapeamento"** e **"Amostra"** (dev) da UI; remover itens de prontidão remanescentes.

**Critério de aceite:** Aprendizagem no topo com métricas-chave; Previsão com cálculo ancorado em simulados+questões, banda de confiança, amostra e gráfico no tempo; card de metas mostra progresso e auto-calcula; mapeamento/amostra removidos.

---

## FASE 6 — CR9: Raciocínio Clínico integrado

**Arquivos:** `src/components/RaciocinioClinico.jsx`, `src/core/illnessScript.js`, `src/core/fsrs.js`, `src/constants/casosClinicos.js`, store.

1. **Botão "Criar caso clínico" → modal passo a passo estilo D0/D1** (bonito e guiado): caso base → **nova informação 1** → **nova informação 2** → **queixa guia** → **conduta** → **vincular ao tema do cronograma**: escolhe a fonte do cronograma (**ENAMED/eMed, custom, MedCof, importado**) → escolhe a **área** → escolhe o **tema** → salva e vincula. (O modal atual em `:609` é simples; reescrever no padrão passo a passo.)
2. **Botão "Por que usar essa função?"** ao lado de "Criar caso", explicando **illness scripts** e como melhoram a aprendizagem (organização por predisponentes/mecanismo/consequências/conduta; variantes treinam transferência; diferenciais treinam discriminação; SCT treina incerteza).
3. **Integração ao fluxo de revisão FSRS:** o caso vira **variante clínica do tema** e entra em **D7 (diferencial/caderno de erros), D21 (mini-caso), manutenção (SCT/conduta)**. Implementar de verdade o `clinicalCaseMatch` (`illnessScript.js:378` é stub que retorna null) por **área+tema**, e oferecer o caso como atividade quando o tema cai nesses passos.
4. **Melhorar o FSRS do Raciocínio Clínico e o "Preciso relembrar"**: "preciso relembrar" não pune como erro completo — marca baixa confiança, agenda reencontro clínico curto e sugere revisar o illness script antes do caso (`RaciocinioClinico.jsx:314` já dispara; refinar agendamento/score em `clinicalReasoningScoring.js`).
5. (Nav já feito: RC na lateral, Estatísticas em "Mais".)

**Critério de aceite:** criar caso é um wizard passo a passo vinculado a tema real; "por que usar" explica illness script; caso vinculado aparece como variante em D7/D21/manutenção; "preciso relembrar" agenda reencontro sem punir.

---

## FASE 7 — MORE2: Perfil página, Segurança, Conquistas, Pomodoro, Método, Políticas

**Arquivos:** `src/components/Modals.jsx`, `navigationModel.js`, novos componentes, `achievements.js`, `AcademiaMetodo.jsx`, fluxos Firebase auth.

1. **Perfil & Configurações como ABA/página** (não só popup) — e **melhorar a interface do popup** com mais animação e **condição de salvar** que muda o estado. Seções: Perfil, Estudos, Mentor, Conta, Segurança, Aparência.
2. **Perfil:** permitir **avatares e foto de perfil**, configurar **idade, ano/semestre do curso, especialidade pretendida** (e cidade/UF opcional, prova principal, instituições-alvo).
3. **Estudos:** adicionar as **principais provas de residência do Brasil** (ENAMED, USP-SP, UNIFESP, UNICAMP, USP-RP, SUS-SP, SUS-BA, SES-DF, SES-PE, AMRIGS, PSU-MG, SURCE, HCPA, UFRJ, UERJ, IAMSPE, Einstein, Sírio-Libanês, Santa Casa, outra). **Remover "horas disponíveis por dia"** como base do Mentor (`Modals.jsx:1964`) e **integrar o Mentor com a quantidade de temas/dia** (+ dias de estudo, meta de questões, meta de Anki, dias até prova).
4. **Conta:** **mudar senha** (e e-mail), excluir conta, exportar dados (já existem export/delete em `:2044`/`:2083`) e **políticas do site**.
5. **Segurança dos dados — botão "Como funciona?"** explicando cada função (backup, restore, integridade, escopo por usuário, quando usar, riscos, boas práticas). View `data_safety` existe (`navigationModel.js:88`) mas sem conteúdo.
6. **Pomodoro (feature nova):** relógio no **canto inferior esquerdo** com popup de ajustes (tempo de foco, ciclos curtos/longos, pausa, som, associar ao tema atual) + **botão no popup ensinando por que é bom e como usar**. Componente standalone no layout; estado no store; sem lib nova.
7. **Aba Conquistas em "Mais"** (hoje só dentro de Ajustes, `Modals.jsx:1587`): item de nav `conquistas` + view listando `achievements.js`, e **criar mais conquistas**. Ícones lucide, sem gamificação agressiva.
8. **Academia & Método** muito mais detalhada — cada processo como **artigo científico aplicado** (como estudar tema novo, D0, D1/D4/D7/D21, corrigir questões, fazer simulado, usar provas antigas, Anki, Raciocínio Clínico, lidar com atraso, interpretar estatísticas, usar o Mentor) com linguagem médica/didática e referências.
9. **Atualizar o Guia de Uso** para a nova arquitetura.
10. **Criar Políticas do Site** em "Mais".

**Critério de aceite:** Perfil é página completa com avatar/foto/idade/ano/especialidade e provas BR; Mentor sem "horas/dia"; senha/políticas; Segurança com explicador; Pomodoro funcional; Conquistas como view; Academia em formato artigo; guia atualizado.

---

## Itens em aberto (decidir durante a execução, não bloqueiam)
- **Banco** ("não tem função muito bem definida"): proposta — transformá-lo no **Banco de Temas hierárquico** (Fase 3) consumido por Cronograma/Simulados/Raciocínio/Estatísticas; o "Banco" antigo vai para "Mais" só como consulta. Confirmar com o Enzo se quer manter algo além disso.
- **Integração caso clínico ↔ fluxo D0/D1** (Fase 6): o Enzo levantou a dúvida de como integrar; a proposta acima (variante de tema entrando em D7/D21/manutenção) é o caminho — validar UX no preview antes de fechar.

---

## Verificação (rodar só no FINAL, após todas as fases)
1. `npm run check:mojibake` (gate de encoding — bloqueia build).
2. `npm test` (baseline ~99/99; nada deve quebrar).
3. `CI=false npx react-scripts build` (lembrar: `unused-vars` quebram sob `CI=true`).
4. **Preview manual** (gates `devOnly` só somem no build de produção): Dashboard (3 botões + 2 pizzas + saldo + ações inteligentes + weekly review); Anki pelo comando do dia; Agenda com popup completo; distribuição de áreas na semana; registrar simulado com erro vinculado a tema + cor/confete + estatísticas de erro; Stats (Aprendizagem no topo, Previsão com banda + gráfico no tempo, card de metas); criar caso clínico passo a passo e revisão D7/D21; Pomodoro; Conquistas; Academia; Perfil página.

**Commit local entre fases. Sem push/deploy.**
