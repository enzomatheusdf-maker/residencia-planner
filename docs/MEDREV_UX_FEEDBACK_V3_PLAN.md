# MedRev — Feedback de UX V3 (11 itens)

> Plano de implementacao para o Sonnet executar. **1 commit por fase**, testes/build **so no final**.
> Aprovado por Enzo em 2026-06-03 (Opus planejou em modo plano).

## Contexto

Enzo revisou o app rodando (residencia-planner) e listou 11 ajustes de UX a partir de screenshots das abas Plano, Banco de Temas e Simulados. Os problemas: widgets sobrepostos, secoes de dashboard redundantes que repetem "o que fazer hoje" de 3 jeitos, ferramentas de dev vazando na UI, configuracao de metas sem auto-calculo, Banco de Temas com layout quebrado/nao-colapsavel, e a aba Simulados misturando estrategia + estatisticas que deveriam estar nas Estatisticas. O Mapa de Prioridades atual tem calculo de dominio/incidencia sem sentido e nao direciona ao estudo.

### Decisoes do Enzo (2026-06-03)
1. O Mapa de Prioridades recalibrado vive **so** em Estatisticas -> Provas (removido de Simulados e da aba estudar).
2. Aba Simulados apos a migracao = **Estrategia + Historico + Registrar**.
3. Volume de Questoes vai para a secao **Aprendizagem**; previsao/ritmo/erros/Mapa vao para a secao **Provas**.

### Regras herdadas (NAO violar)
- Nao remover features alem das pedidas; nao instalar libs; nao tocar `package-lock.json`; nao push/deploy.
- Nao vazar ENAMED/Raciocinio Clinico para a plataforma `vest` (gating via `plat`).
- Evitar emojis hardcoded em UI critica — preferir icones `lucide-react`.
- Stack: CRA + React 19, JS (sem TS), Zustand+persist (`reviewflow-v6`), Tailwind, lucide-react.

### Validacao final (so depois da ultima fase)
1. `npm run check:mojibake` — sem digrafos de double-encoding.
2. `CI=false npx react-scripts build` — build passa (gates `devOnly` so observaveis em producao).
3. `npm test` — suite verde.

---

## Fase 1 — Dashboard: pomodoro + consolidacao de "hoje" (itens 1, 5, 6)

**Arquivos:** `src/components/PomodoroWidget.jsx`, `src/components/Sidebar.jsx`, `src/components/Dashboard.jsx`, `src/hooks/useMetrics.js`.

1. **Pomodoro sobrepondo o perfil (item 1):** `PomodoroWidget.jsx:81-98` usa `fixed bottom-20 left-4 z-40`, colidindo com o card de perfil do `Sidebar.jsx:156-214` (canto inferior esquerdo). Reposicionar para nao cobrir o perfil — mover o widget para fora da coluna da sidebar (ex.: `bottom-4 right-4`, ou ancorar dentro do header/area de conteudo, nao sobre a sidebar). Garantir que com sidebar expandida e recolhida nao haja sobreposicao.

2. **Remover "Execucao do plano" redundante (item 6):** A secao "Plano de hoje" (`Dashboard.jsx:1839-1850`) duplica o que "Comando do dia" (`Dashboard.jsx:1162-1170`) e a fila ja dizem. Remover a secao redundante; manter **um** "Comando do dia" (comando unico do Mentor) como cabecalho de intencao.

3. **"Acoes de hoje" inteligente, absorvendo a Fila Cronologica (item 5):** A "Fila Cronologica" (`Dashboard.jsx:2627-2710`) renderiza `[...overdue, ...today_]` em ordem cronologica burra. A inteligencia ja existe em `calcFilaInteligente(temas, plat, meta)` (`useMetrics.js:69-149`, ordena por `score` em :148), mas hoje so aparece em "Fila de Prioridade Inteligente" gated p/ res + 30 sessoes (`Dashboard.jsx:2587-2603`).
   - **Unificar:** uma unica lista "Acoes de hoje" que usa a ordenacao de `calcFilaInteligente` para **todas** as acoes do dia (vencidas + de hoje) por importancia. Remover o card "Fila Cronologica" separado.
   - Remover o gating de 30 sessoes para a ordenacao inteligente (degradar com elegancia quando ha poucos dados — fallback p/ ordem cronologica internamente, mas uma secao so).

**Commit:** `feat(dashboard): pomodoro fora do perfil + acoes de hoje unica ordenada por importancia`

---

## Fase 2 — Mover "Analise de Desempenho" do Mentor para Estatisticas -> Aprendizagem (item 3)

**Arquivos:** `src/components/Dashboard.jsx` (ZONA 2, :2349-2461), `src/components/StatsPanel.jsx` (secao `aprendizagem`, :733-937), `src/core/mentor.js` (`getMentorDiagnosis`).

- Extrair o painel "Analise de Desempenho" (badge de fase, insights nao-criticos, projecao) de `Dashboard.jsx:2349-2461` e renderiza-lo na secao **`aprendizagem`** do `StatsPanel.jsx`. Reusar `getMentorDiagnosis()` (ja consumido via `diag`) + `nonCriticalInsights` + `totalSessions` — passar como props ou recalcular no StatsPanel a partir das mesmas fontes.
- Manter no Dashboard apenas alertas criticos (fadiga/vies), se existirem — nao migrar esses.

**Commit:** `refactor(stats): analise de desempenho do mentor migrada p/ Aprendizagem`

---

## Fase 3 — Meta de questoes com auto-calculo (item 4)

**Arquivos:** `src/core/store.js` (`metaQuestoesDia`/`metaQuestoesTotal`, :137), `src/components/Modals.jsx` (Ajustes, :1710-1717), `src/components/Dashboard.jsx` (card "Questoes hoje", :1708-1726).

- Hoje os dois campos sao independentes (`Modals.jsx:1710-1717`). Tornar **vinculados**: ao preencher um, o outro e calculado a partir dos **dias restantes ate `meta.dataProva`** (`metaQuestoesTotal = metaQuestoesDia x diasRestantes` e vice-versa). Marcar qual foi o ultimo editado pelo usuario (campo "fonte", ex.: `meta.metaQuestoesFonte: "dia" | "total"`) para recalcular o derivado quando dias/data mudarem, sem sobrescrever a escolha do usuario.
- Reusar o padrao de "Autocalcular" ja existente (botao de auto-calculo de max revisoes, `Modals.jsx:~1705`) e o helper `saveMetaNumber`.
- Dashboard "Questoes hoje" (`:1708-1726`) ja le `meta.metaQuestoesDia` no `MetricRing` — sem mudanca, so validar.

**Commit:** `feat(ajustes): meta de questoes dia<->total com auto-calculo por dias-p/-prova`

---

## Fase 4 — Remover botoes de dev do Plano (item 2)

**Arquivos:** `src/components/Cronograma.jsx`.

- Remover "Ver mapeamento" e "Usar amostra de desenvolvimento" (`Cronograma.jsx:764-782`, bloco `devOnly`). Limpar codigo morto: labels `DEV_MAPPING_LABEL`/`DEV_SAMPLE_LABEL` (:28-29), estado `showMappingPanel` (:225) e seus setters, import lazy de `CalendarMappingPanel` (:27) e a chamada `getDevProviderSeed()` se nao usada em outro lugar (verificar com grep antes de remover o import de `calendarProvider.js`).

**Commit:** `chore(plano): remove botoes dev ver-mapeamento/amostra + codigo morto`

---

## Fase 5 — Banco de Temas: layout + colapso + responsivo (item 7)

**Arquivos:** `src/components/Cronograma.jsx` (secao Banco, :539-677).

1. **Header quebrado (:541-570):** o titulo "BANCO DE TEMAS" sobrepoe/quebra junto da busca. Corrigir o flex (`flex flex-col lg:flex-row`): adicionar `min-w-0`/`flex-shrink-0` nos filhos corretos, garantir que a busca nao comprima o titulo, e layout mobile-first coerente.
2. **Tooltip ausente:** adicionar `InfoTooltip` (ja usado no Plano, `Cronograma.jsx:43`) junto ao titulo do Banco explicando o que e.
3. **Blocos colapsaveis:** os agrupamentos por area/subarea (:572-663) nao sao redutiveis. Reusar o padrao de colapso ja existente (`openBlocks`/`toggleBlock`, :265/:318-330) criando estado por area (ex.: `bancoAreaExpanded`) com handler de clique no cabecalho de area. Persistir opcionalmente em `meta.ui` se desejado, senao estado local basta.
4. **Grid responsivo (:586):** ajustar `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` e padding dos cards (:596) para boa distribuicao em PC e mobile (2 col em md, 3-4 em xl/2xl; garantir `min-w-0` nos cards e wrap de badges sem overflow).

**Commit:** `fix(banco-temas): header, tooltip, blocos colapsaveis e grid responsivo`

---

## Fase 6 — Simulados: fundir estrategia + cadencia; migrar o resto (itens 8, 9)

**Arquivos:** `src/components/Simulados.jsx`, `src/core/simStrategy.js`.

1. **Primeiro card unico "Estrategia de Simulados" (item 9):** fundir "Proximo simulado" (`Simulados.jsx:598-605`) + "Estrategia de Simulados" (`:776-829`). Ordem do conteudo:
   1. Texto **"Simulado diagnostico"** (baseline / quando `nSim === 0`).
   2. Calibracao (apos o diagnostico, o que o sistema aprende).
   3. Cadencia: a cada quantos dias fazer o simulado (`frequenciaRecomendada` de `getSimRecommendation`, `simStrategy.js:27-119`).
   4. **Proxima data do simulado** — implementar calculo novo em `simStrategy.js`: `proxima = data do ultimo simulado + intervalo da frequencia`; exibir contagem de dias ate la. (Hoje so ha texto, sem data calculada — `getSimuladoGuidance` em `simStrategy.js:242-266`.)
2. **O que SOBRA em Simulados:** card de Estrategia (acima) + **Historico de Simulados** (`:1013-1094`) + botao **Registrar** (modal `SimRegistroModal`). Remover/limpar as abas/cards que migram. Reavaliar o menu de tabs (`:589-595`): `painel`/`correcao`/`area`/`metricas` — `metricas` (Erros avancados) migra; manter as demais que fizerem sentido com o conteudo restante.
3. **Migrar para Estatisticas (ver Fase 7):**
   - Previsao de desempenho (`:651-690`) -> Provas.
   - Equilibrio de Ritmo (`:724-758`) -> Provas.
   - Volume de Questoes "para aprendizagem" (`:692-722`) -> **Aprendizagem**.
   - Mapa de Prioridade da Prova Alvo (`:865-1011`) -> Provas (rebuild, Fase 7).
   - Aba "Erros avancados" (`activeTab === "metricas"`, `statsErros` :404-424) -> Provas.

**Commit:** `feat(simulados): card unico estrategia(diagnostico->calibracao->cadencia->proxima data); remove cards migrados`

---

## Fase 7 — Estatisticas -> Provas: destino das migracoes + Mapa de Prioridades recalibrado (itens 8, 10, 11)

**Arquivos:** `src/components/StatsPanel.jsx` (secoes `provas` :984-1017 e `aprendizagem` :733-937), `src/core/readiness.js` (:100-166), `src/core/enamedIntel.js`, `src/core/provasStats.js` (`findHotnessSubarea`), `src/constants/enamedIncidencia.js` (`ENAMED_HOTNESS`, `ENAMED_MACRO_QUESTOES`), `src/core/store.js` (acao de criar tema).

1. **Receber os cards migrados:**
   - Secao **Provas:** previsao de desempenho, equilibrio de ritmo, erros avancados (`statsErros`/`analytics`), e o Mapa recalibrado.
   - Secao **Aprendizagem:** Volume de Questoes "para aprendizagem" (reusar `totalQuestoesFeitas`, `meta.metaQuestoesTotal`).
   - Reusar os imports ja existentes (`getReadinessData`, `saldoRitmo`, `totalQuestoesFeitas`, taxonomia de erros).

2. **Rebuild do Mapa de Prioridades (itens 10 + 8) — vive SO aqui:**
   - **Problema atual** (`readiness.js:100-166`): `fraqueza=1.0` quando `retention===null` infla prioridade de areas sem historico; `hotFactor` opaco; usa `examData.temasQuentes` (PROVA_STATS) em vez do `ENAMED_HOTNESS` numerico; itens nao clicaveis.
   - **Novo calculo:** incidencia ancorada em `ENAMED_HOTNESS` + `ENAMED_MACRO_QUESTOES` via `findHotnessSubarea`/`getEnamedContextBadge` (`enamedIntel.js:234-250`) — os temas **mais incidentes do ENAMED** ordenam o mapa. Dominio: nao assumir fraqueza maxima sem dados (separar "sem dados" de "fraco"); ponderar por tamanho de amostra.
   - **Clicavel -> estudar (item 10):** cada tema incidente e clicavel; ao clicar, navega para estudar o tema. Reusar `handleFocarArea`/`handleAdicionarFila` (`Simulados.jsx:467-509`) como referencia da acao de "estudar/ativar".
   - **Criar tema quando ausente:** quando o tema incidente nao existe no provider custom/importado, o sistema **cria** e a pessoa **confirma para salvar**. Funciona em todos os providers (estrategia/medcof/importado/custom). Reusar/estender a acao de store que adiciona tema (ex.: `saveImportedCalendarTopics`) — confirmar a acao exata no `store.js` na execucao.
   - **Gating vest:** ENAMED so para `plat === "res"`; manter a variante atual (ou fallback PROVA_STATS) para vest sem vazar ENAMED.

3. **Erros avancados nas estatisticas (item 11):** mover a analise de `statsErros` (porTipo/porArea/temasRecorrentes/conversao D7, `Simulados.jsx:404-424`) para a secao Provas do StatsPanel. O fluxo de **registro** de erros continua em Simulados (`SimRegistroModal`); so a **analise/output** vai para estatisticas.

**Commit:** `feat(stats-provas): recebe previsao/ritmo/erros + Mapa de Prioridades ENAMED clicavel que cria tema; volume em Aprendizagem`

---

## Sequencia de commits (1 por fase)

Fase 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7. Commit local entre fases. As Fases 6 e 7 sao acopladas (migracao) — Fase 6 remove de Simulados, Fase 7 recebe em StatsPanel; sao commits consecutivos, mas a 7 nao deve quebrar a 6.

## Verificacao manual (dev server, no final)

- Pomodoro nao cobre o perfil (sidebar expandida e recolhida).
- Dashboard tem so "Comando do dia" + uma "Acoes de hoje" ordenada por importancia.
- Analise de Desempenho aparece em Estatisticas/Aprendizagem.
- Metas dia<->total auto-calculam ao editar um lado.
- Botoes de dev sumiram do Plano.
- Banco de Temas com header correto, tooltip, blocos colapsaveis e grid bem distribuido (testar via resize PC/mobile).
- Simulados = Estrategia(diagnostico->calibracao->cadencia->proxima data) + Historico + Registrar.
- Estatisticas/Provas recebe previsao/ritmo/erros + Mapa recalibrado clicavel que cria tema ao confirmar; Volume em Aprendizagem.

## Fora de escopo

Varredura de jargao (FSRS/True Retention/Bleeding Score/Prontidao/illness script) — frente separada, nao tocada aqui.
