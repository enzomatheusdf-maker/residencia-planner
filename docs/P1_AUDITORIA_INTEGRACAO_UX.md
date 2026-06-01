# MedRev — P1: Auditoria de Integração UX, Mentor e Estatísticas

> **Gerado por:** Claude Code (Opus 4.8 → Sonnet 4.6) em modo auditoria  
> **Data:** 2026-06-01  
> **Fonte de verdade:** `MEDREV_P1_INTEGRACAO_UX_MENTOR_STATS.md`  
> **Regra:** este documento é somente leitura e planejamento. Não executar tudo de uma vez.

---

## 1. Diagnóstico executivo

### Achado principal que reorienta o P1

O MD de referência diagnosticava "Mentor é camada em cima do app" e "Stats sem governança". A auditoria do código real revela o oposto no eixo Mentor:

**O Mentor Decision Engine v2 já está implementado e já é o herói do Dashboard.**

Os arquivos `src/core/mentorSignals.js`, `src/core/mentorDecisionPolicy.js` e `src/core/mentorAutopilot.js` — todos **untracked / sem commit** — implementam o schema obrigatório (§15 do MD) e a ordem de decisão (§14) quase verbatim. O Dashboard os consome em `comandoDoDia`/`runMentorPrimaryAction` (`Dashboard.jsx:1199-1242`).

**O valor real do P1 desloca-se para:**

| Problema real (auditado) | Gravidade |
|---|---|
| Arquitetura de informação por módulo, não por jornada | Alta |
| §16 (target executável obrigatório) não imposta | Alta |
| `calcRaciocinioScore` triplicado com fórmulas divergentes | Alta |
| Centro de Erros inexistente como tela | Alta |
| Motor Mentor v2 sem commit — sem ponto de restauração | Crítico |
| `metricsRegistry` ausente; "coletando" hardcoded espalhado | Média |
| Activity Log bloqueado por Bloco N (multiusuário) | Baixa (dependência) |

### O que NÃO é problema (contrário ao diagnóstico inicial)

- O Mentor **já é** o motor central; não é "camada em cima".
- O gating Vestibular já funciona corretamente via `featureEnabled`/`getPlatformFeatures` (`platformFeatures.js`).
- `reviewHistory`, `sessionReflections`, `weeklyReviews`, `enamedAnalises` já são registrados.
- Build passa (`npm run build` — 363 kB gzip, lazy/code-split ativo), `npm test` 99/99, `check:mojibake` OK.

---

## 2. Mapa de features existentes

| Feature | Tela atual (view key) | Core | Store | Persistência | Mentor usa? | Stats usa? | Problema | Ação recomendada |
|---|---|---|---|---|---|---|---|---|
| Dashboard "Hoje" | `dash` | `mentorAutopilot`, `readiness`, `useMetrics` | sim (`reviewflow-v6`) | local + Firebase | é o consumidor | parcial | mistura comando + métricas + avançado | virar "Hoje" enxuto — P1-A |
| Cronograma | `crono` | `calendarProvider`, `calendarProviders` | sim | sim | sim (`new_topic→crono`) | — | é "Plano"; nome técnico | renomear jornada → **Plano** — P1-A |
| Academia/Método | `academia` | `metodo`, `achievements` | sim | sim | não | não | feature lateral; `CONCEITOS_METODO` com unused-var | mover p/ **Mais** — P1-A |
| Banco de Dados | `banco` | `catalogos`, `cronogramas` | sim | sim | não | não | ok | manter como **Banco de Dados** |
| Estatísticas | `stats` | `readiness`, `calibration`, `provasStats`, `enamedIntel` | sim | sim | lê readiness | núcleo | depósito de gráfico; sem metricsRegistry | reorganizar em 7 seções — P1-B |
| Simulados/ENAMED | `sims` | `provaAnalyzer`, `enamedIntel`, `simStrategy` | `enamedAnalises[]` | sim | sim (`exam_analysis`) | sim | ok; base de **Estudar** | manter primário |
| Anki Audit | `anki` | `errorTaxonomy` | sim | sim | sim (`anki_check`) | parcial | primário demais para uso ocasional | mover p/ **Mais** — P1-A |
| Raciocínio Clínico | `raciocinio` (lazy, gated) | `illnessScript`, `casosClinicos` | `casosProgresso` | sim | sim (`clinical_case`) | parcial | aba lateral; `calcRaciocinioScore` triplicado; não injeta no FSRS; ~2 casos semeados; `clinicalCaseMatch` ausente | integrar ao FSRS — P1-D |
| FocusMode | overlay `z-[200]` | `fsrs`, `sessionReflection`, `errorTaxonomy` | sim | sim | alvo de CTAs (`ctaView: "focus"`) | — | brain dump não-faseado por step | brain dump estruturado — P1-D |
| Action Inbox | dentro de `dash` | `actionInbox` | `actionInbox[]` | sim | espelha `mentorAction` | — | sem tela de ação corretiva por tipo de erro | base do Centro de Erros — P1-C |
| Weekly Review | dentro de `stats` | `sessionReflection` | `weeklyReviews[]` | sim | lê reflections | sim | ok | mover p/ **Mais** — P1-A |
| Mentor Engine v2 | — (motor puro) | `mentorSignals` + `mentorDecisionPolicy` + `mentorAutopilot` | lê estado | n/a | **é o motor** | indireto | **untracked sem commit**; §16 não imposta; `proximaAcao` legado coexiste | commitar + impor §16 — P1-B |
| ENAMED/Provas Analyzer | `sims`/`stats` | `enamedIntel`, `provaAnalyzer`, `EnamedProvaAnalyzer` | `enamedAnalises[]` | sim | sim | sim | gating vest OK | manter, gated por `featureEnabled` |
| Peak Mode | — | `peakMode` | sim | sim | não | não | módulo autônomo não integrado | verificar se deve ser mencionado no Mentor |
| Data Safety | dentro de `stats` | `backup` | sim | sim | não | não | ok | mover p/ **Mais** — P1-A |
| Onboarding | modal/wizard | `onboarding` | sim | sim | não | não | ok | manter |
| Launch Checklist | dentro de `stats` | `launchReadiness` | sim | sim | não | não | diagnóstico interno | mover p/ **Mais** — P1-A |
| Activity Log | **ausente** | — | — | — | — | — | não existe | somente pós-Bloco N — P1-E |
| `navigationModel` | **ausente** | — | — | — | — | — | nav diverge desktop/mobile | criar — P1-A |
| `metricsRegistry` | **ausente** | — | — | — | — | — | "coletando" hardcoded | criar — P1-B |
| `errorActionMap` | **ausente** | — | — | — | — | — | sem mapa erro→ação | criar — P1-C |
| `reviewTaskPlanner` | **ausente** | — | — | — | — | — | raciocínio fora do FSRS | criar — P1-D |

---

## 3. Fluxos atuais do usuário

### Fluxo A — Execução de revisão (fluxo principal)

```
login → dash
  → comandoDoDia (mentorNextAction)
  → runMentorPrimaryAction()
    → onStudy(temaId, stepKey)   [se target.temaId + target.stepKey]
    → setView(ctaView)           [fallback silencioso — §16 violada]
  → FocusMode overlay
    → brain dump (campos genéricos, não faseados por step)
    → motivosErro[] registrados (tipoErro como string)
    → createSessionReflection()
    → rebuildActionInboxForToday()
```

**Loop não fecha:** `motivosErro` gravado na revisão não abre tela de ação corretiva — o usuário não sabe "errei por quê / o que faço agora?".

### Fluxo B — Abertura de tema novo

```
dash → mentor sugere new_topic → setView("crono")
  → Cronograma (provider ativo: MEDCOF / Estratégia / Custom)
  → Adicionar tema → FocusMode D0
```

**Loop não fecha:** calendarProvider.js usa whitelist `AREA_SET` de 21 áreas — área fora da lista vira tema sem especialidade correta.

### Fluxo C — Análise de simulado

```
sims → EnamedProvaAnalyzer → questoesErradas com tipoErro
  → enamedAnalises[] salvo
  → rebuildActionInboxForToday()
```

**Loop não fecha:** análise de simulado não agenda automaticamente reencontro de revisão para os temas das questões erradas — FSRS não é acionado pelo resultado da prova.

---

## 4. Problemas de arquitetura de informação

### NAV atual (Sidebar.jsx:14-23)

```js
// Organizado por MÓDULO
{ k: "dash",      label: "Dashboard"     }
{ k: "crono",     label: "Cronograma"    }
{ k: "academia",  label: "Academia"      }
{ k: "banco",     label: "Banco de Dados"}
{ k: "stats",     label: "Estatísticas"  }
{ k: "sims",      label: "Simulados"     }
{ k: "anki",      label: "Anki Audit"    }
{ k: "raciocinio",label: "Raciocínio"    }
```

**Problema:** lista 8 módulos internos. O usuário vê opções, não jornadas. Não distingue o que é obrigatório diário do que é ocasional.

### Divergência desktop/mobile

`BottomNav.jsx:37-46` define `primaryKeys` e `mobileLabel` de forma ad-hoc:

```js
const primaryKeys = ["dash", "crono", "sims", "stats"];
const mobileLabel = (key) => {
  if (key === "dash")  return "Hoje";
  if (key === "crono") return "Crono";
  if (key === "sims")  return "Estudar";
  if (key === "stats") return "Stats";
  return fallback.split(" ")[0];
};
```

A sidebar chama "Dashboard" o que o mobile chama "Hoje"; chama "Cronograma" o que o mobile chama "Crono"; chama "Simulados" o que o mobile chama "Estudar". **Fonte única de verdade ausente.**

### Modelo novo proposto

```
Desktop sidebar (ordem por jornada):
  Hoje          (dash)
  Plano         (crono)
  Estudar       (sims)
  Estatísticas  (stats)
  Banco         (banco)
  Mais ▸

Mobile BottomNav:
  Hoje | Plano | Estudar | Stats | Mais ▸

Dentro de Mais:
  Raciocínio Clínico
  Anki Audit
  Weekly Review
  Academia / Método
  Data Safety
  Launch Checklist
  Guia
  Ajustes
```

**Arquivo a criar:** `src/core/navigationModel.js` (+ `navigationModel.test.js`) como fonte única — tanto Sidebar quanto BottomNav o importam.

---

## 5. Problemas do Dashboard

### O que está certo (não mexer)

- `comandoDoDia` já usa `mentorNextAction` como ação primária (`Dashboard.jsx:1202-1223`).
- `runMentorPrimaryAction` já resolve `target.temaId + target.stepKey → onStudy` (`Dashboard.jsx:1225-1242`).
- Readiness gauge com trend delta7 já existe.
- `filaInteligente`, `topFilaItem`, sobrecarga — sinalizações corretas.

### O que deve ser corrigido / movido

| Item | Localização atual | Destino |
|---|---|---|
| Painéis avançados (`showDetailedPanels`) | topo do Dashboard | Stats ou Avançado colapsado |
| Heatmap 35 dias (`days` array) | Dashboard.jsx:1244 | Stats → aba Atividade |
| Canvas readiness card (exportarCartaoProntidao) | Dashboard.jsx:1254 | Stats ou Ajustes |
| `showCompleto` toggle | Dashboard.jsx:868 | remover em favor de modoSimples consistente |
| Atividade recente detalhada | Dashboard | Stats → Atividade (pós-Bloco N) |

### Layout ideal do Dashboard "Hoje"

```
1. Saudação + data
2. Comando do Mentor
   - título
   - motivo (subtitle/reason)
   - tempo estimado
   - botão Começar (CTA primário)
   - botão Ver por quê (explain[])
3. Próximas 2 ações (fila)
4. Carga de hoje (todayMinutes, dueTodayCount, overloadLevel)
5. Alertas (relearning, coletando, sync/auth)
6. Avançado colapsado
```

---

## 6. Problemas do Mentor

### O que está certo (não mexer)

O motor `mentorDecisionPolicy.js` implementa corretamente (evidência: código lido):

| Prioridade | Tipo | Priority score |
|---|---|---|
| 1 | `scheduler_warning` (dados inválidos) | 100 |
| 2 | `workload_relief` (sobrecarga alta) | 95 |
| 3 | `relearning` | 94 |
| 4 | `revisao_vencida` | 92 |
| 5 | `fila_do_dia` | 88 |
| 6 | `exam_analysis` | 80 |
| 7 | `enamed_critico` / `vestibular_materia_fraca` | 76 |
| 8 | `clinical_case` | 72 |
| 9 | `new_topic` | 66 |
| 10 | `anki_check` (res) / `rest` | 40/30 |

Schema da ação (`buildAction`) já tem: `id`, `type`, `priority`, `title`, `subtitle`, `reason`, `explain[]`, `cta`, `ctaView`, `estimatedMinutes`, `confidence`, `safety`, `target`, `source`. **§15 do MD cumprido.**

### O que está errado

**§16 não imposta** (`Dashboard.jsx:1225-1242`):

```js
// Código atual — fallback silencioso
const runMentorPrimaryAction = useCallback(() => {
  const action = mentorNextAction || {};
  const target = action.target || {};
  if (target.temaId && target.stepKey && onStudy) {
    onStudy(target.temaId, target.stepKey);
    return;
  }
  const view = action.ctaView || target.view || "dash";
  if (view === "focus") { /* tenta topFilaItem, senão setView("dash") */ }
  if (setView) setView(view);  // ← navega mesmo sem target executável
}, [...]);
```

**Deveria ser:**

```
se target.temaId + target.stepKey → onStudy (executável)
se target.action → handler específico (executável)
se ctaView é "focus" + topFilaItem → onStudy (executável)
senão → rebaixar para "Ver plano" + console.warn interno
```

**Dívida legada:** `proximaAcao` em `src/core/mentor.js:696` coexiste com o motor v2. É chamado por `mentor.upgrade.smoke.test.js` mas não pelo Dashboard. Deve ser mantido para não quebrar testes, documentado como legado, e gradualmente substituído.

**Arquivos sem commit:** `mentorSignals.js`, `mentorDecisionPolicy.js`, `mentorAutopilot.js` e seus tests estão todos untracked. Risco: perda total em reset ou conflito.

---

## 7. Problemas das Estatísticas

### Estrutura atual (StatsPanel.jsx)

Contém em sequência (sem hierarquia clara):
- personalStats por especialidade
- Heatmap 12 semanas
- EnamedMapa (gated)
- EnamedProvaAnalyzer (lazy, gated)
- WeeklyReview (lazy)
- DataSafetyPanel (lazy)
- LaunchChecklistPanel
- AdvancedSection

**Problema:** é um scroll longo com itens heterogêneos — diagnóstico, dados brutos, segurança, revisão semanal, análise de prova.

### Ausência de `metricsRegistry`

Estados "coletando" estão hardcoded em múltiplos pontos:

```js
// Dashboard.jsx:130
trueRetentionStatus: hasRetencaoLonga ? "ativa" : "coletando"

// Dashboard.jsx:1695
{acertoMedio != null ? "revisões concluídas" : "coletando dados"}

// EnamedMapa.jsx:20,54
return "coletando";
{preparo == null ? "coletando" : `${preparo}%`}

// readiness.js (implícito): trueRetention null = coletando
```

Cada métrica deveria ter:

```js
{
  id: "trueRetention",
  label: "Retenção real",
  description: "Acerto médio nos passos D7+ do FSRS",
  confidenceRule: (n) => n >= 10,   // mínimo de dados
  emptyState: "Coletando — faça ao menos 10 revisões em D7+",
  actionWhenLow: "Revisar temas de retenção baixa nas Stats",
  dashboardLevel: "secondary",       // não no topo
  platforms: ["res", "vest"]
}
```

### Reorganização proposta

```
Stats
├── Resumo        — score Preparo, trend, erros dominantes
├── Aprendizagem  — retenção, cobertura, ritmo por especialidade
├── Erros         — errorTaxonomy, heatmap, padrão dominante
├── Raciocínio    — score clínico, cobertura por área (res only)
├── Provas        — EnamedMapa + EnamedProvaAnalyzer (res only)
├── Atividade     — heatmap de sessões, streak (→ pós-Bloco N enriquece)
└── Sistema       — DataSafetyPanel, LaunchChecklist, WeeklyReview
```

---

## 8. Problemas do Raciocínio Clínico

### `calcRaciocinioScore` triplicado

| Arquivo | Fórmula |
|---|---|
| `src/core/readiness.js:25-38` | média de `(fase2Acerto * 0.6 + sctAcerto * 0.4)` |
| `src/core/illnessScript.js:424-432` | usa `PESO_FASE` e `clamp` — mais robusto |
| `src/components/RaciocinioClinico.jsx:24-36` | mesma lógica de readiness.js mas recalculada local |

**Fonte canônica:** `illnessScript.js:424`. As outras duas devem importar desta.

### Ausências críticas

| Ausência | Impacto |
|---|---|
| `clinicalCaseMatch` (vínculo caso↔tema) | Mentor não sabe qual tema originou o caso; FSRS não agenda reencontro clínico |
| `reviewTaskPlanner` | Raciocínio não injeta etapas (D1/D4/D7/D21) no FSRS do tema pai |
| Brain dump faseado | FocusMode usa campos genéricos — não diferencia D1 (livre) de D4 (illness recall) |
| ~2 casos semeados | Banco de casos insuficiente para cobertura real |
| Conduta/prescrição simulada | Prevista no MD §30 mas ausente |

### Dois modos planejados (não implementados)

**Modo 1 — Caso completo** (`raciocinio` view):
```
Vinheta → Problem representation → Hipóteses + must-not-miss
→ Illness script de memória → SCT / nova info → Conduta simulada → Feedback
```

**Modo 2 — Dentro do FSRS** (via `reviewTaskPlanner`):
```
D1:          brain dump estruturado (5 campos)
D4:          illness script recall por checklist
D7:          mini-caso + diferenciais
D21:         SCT curto + conduta
Manutenção:  caso rápido / prescrição simulada
```

---

## 9. Problemas do calendário/provider

### Parser frágil em `calendarProvider.js`

`AREA_SET` é whitelist estática de 21 áreas. Cabeçalho fora da lista → tema sem especialidade correta. Solução: heurística genérica de cabeçalho (identificar padrão "Área:", "Especialidade:", bullets com hífen, etc.).

### Histórico de atividade inexistente

Não há registro de "o que foi feito, em que horário, com qual resultado" por dia. UI de calendário histórico está totalmente ausente. **Bloqueado por Bloco N** (multiusuário / isolamento por uid).

---

## 10. Problemas do Vestibular

### O que está correto

`getPlatformFeatures("vest")` já bloqueia:

```js
enamed: false,
raciocinioClinico: false,
illnessScript: false,
casosClinicos: false,
```

Gating aplicado em: `Sidebar.jsx`, `BottomNav.jsx`, `App.js:1099`, `platformFeatures.test.js`.

### Risco do P1

Toda nova tela criada no P1 deve declarar seu flag em `platformFeatures.js` e ser consultada via `featureEnabled(plat, feature)` antes de renderizar. Risco: `ErrorActionCenter` e `ActivityLog` não têm flags declarados ainda — podem vazar para vest se não gateados.

### O que Vestibular deve receber do P1

```
navigationModel    — sim (jornada adaptada)
Dashboard Hoje     — sim (Mentor já funciona para vest)
Centro de Erros    — sim (erros de simulado vest)
metricsRegistry    — sim (métricas vest-específicas)
Activity Log       — sim (pós-Bloco N)
```

```
Raciocínio Clínico — NÃO
ENAMED             — NÃO
Illness Script     — NÃO
Casos Clínicos     — NÃO
```

---

## 11. Dados registrados hoje

| Dado | Onde fica | Formato |
|---|---|---|
| Histórico de revisão por step | `tema.rev.reviewHistory[]` | `{ date, acerto, questoes, stepKey, ... }` |
| Sessões de estudo | `sessionReflections[]` | `{ date, temaId, stepKey, motivosErro[], ... }` |
| Revisões semanais | `weeklyReviews[]` | `{ date, reflections, ... }` |
| Análises de prova | `enamedAnalises[]` | `{ data, areaCritica, questoesErradas[], ... }` |
| Progresso em casos | `casosProgresso` | `{ [casoId]: { vistos, proximaData, fase2Acerto, sctAcerto } }` |
| Erros por revisão | `tema.rev[step].motivosErro[]` | `string[]` (tipoErro) |
| Gamificação | `gamif` | `{ xp, level, streakCurrent, ... }` |
| Meta do aluno | `meta` | `{ dataProva, temasPerWeek, tempoDisponivel, provasAlvo, modulos, ... }` |

Persistência: Zustand persist `reviewflow-v6` (localStorage) + Firebase Firestore (por uid, quando logado).

---

## 12. Dados que deveriam ser registrados

| Dado necessário | Por quê | Bloqueio |
|---|---|---|
| Activity log unificado por evento | Calendário histórico, diagnóstico longitudinal | Bloco N |
| Timestamp + duração por sessão | Relatório de tempo real, curva de fadiga | Bloco N |
| Vínculo `clinicalCaseMatch` (caso ↔ tema pai) | Mentor sabe quando agendar reencontro clínico no FSRS do tema | P1-D |
| Estimativa-prévia-de-confiança por revisão | Detectar erro de calibração (confiança alta + acerto baixo) | P1-D |
| Agendamento de reencontro clínico no FSRS | Raciocínio integrado ao motor de espaçamento | P1-D |
| Ação corretiva por tipo de erro | Fechar o loop erro → próximo passo | P1-C |

---

## 13. O que deve ser principal (acesso diário)

```
Hoje        (dash)     — Comando do Mentor + carga + alertas
Plano       (crono)    — cronograma ativo, tema novo
Estudar     (sims)     — simulados, análise, ENAMED (res) / simulado vest
Estatísticas(stats)    — diagnóstico em 7 seções
Banco       (banco)    — cadastros, temas, casos, cronogramas
```

---

## 14. O que vai para Mais/Avançado (acesso ocasional)

```
Raciocínio Clínico   — uso semanal/quinzenal
Anki Audit           — uso semanal
Weekly Review        — uso semanal
Academia / Método    — uso esporádico
Data Safety          — uso esporádico
Launch Checklist     — uso pontual
Guia                 — referência
Ajustes              — configuração
```

---

## 15. Plano de implementação em sub-blocos

### Pré-condições obrigatórias (antes de qualquer P1)

```
P0-snapshot  — branch backup/pre-auditoria-j2 + commit dos A–J2 untracked
Bloco K      — FSRS-lite v2 (estabilizar antes de integrar raciocínio)
Bloco L v2   — Mentor Decision Engine (commitar mentorSignals/Policy/Autopilot)
Bloco N      — multiusuário, auth, uid, isolamento (pré-condição de Activity Log)
```

**Sem P0-snapshot não criar nada.** Hoje não há ponto de restauração para os ~50 arquivos untracked/modified.

---

### P1-A — Navegação por jornada + Dashboard "Hoje"

**Escopo:**

```
src/core/navigationModel.js       (novo — fonte única)
src/core/navigationModel.test.js  (novo)
src/components/Sidebar.jsx        (refatorar: consumir navigationModel)
src/components/BottomNav.jsx      (refatorar: consumir navigationModel, remover mobileLabel ad-hoc)
src/components/Dashboard.jsx      (enxugar topo: mover heatmap/avançado p/ Stats)
```

**Critério de aceite:**
- `navigationModel` exporta a lista canônica de itens com `key`, `label`, `jornada`, `primary`, `featureFlag`.
- Sidebar e BottomNav mostram labels idênticos (sem `mobileLabel` local).
- Dashboard "Hoje" responde em 10s: Comando → carga → alertas.
- Nenhum item removido — apenas reclassificado entre principal/Mais.

---

### P1-B — Mentor + Stats mínimos

**Escopo:**

```
src/core/mentorDecisionPolicy.js  (impor §16: target sem executável → "Ver plano" + warning)
src/core/metricsRegistry.js       (novo — cada métrica com confidenceRule/emptyState/actionWhenLow)
src/components/StatsPanel.jsx     (reorganizar em 7 seções com tabs/accordion)
src/core/mentor.js                (marcar proximaAcao como @deprecated, não remover)
```

**Critério de aceite:**
- Ação sem `target` executável muda `cta` para "Ver plano" e emite `console.warn("[Mentor] §16: ação sem target executável")`.
- `metricsRegistry` tem ao menos 6 métricas declaradas (trueRetention, cobertura, acertoSimulado, saldoRitmo, adesaoAnki, raciocinioScore).
- Stats exibe 7 seções navegáveis.
- Motor v2 tem commit local antes dessa edição.

---

### P1-C — Centro de Erros

**Escopo:**

```
src/core/errorActionMap.js              (novo — mapa tipo→ação corretiva)
src/components/ErrorActionCenter.jsx   (novo — tela de consolidação)
src/components/FocusMode.jsx           (pós-sessão: link para ErrorActionCenter se motivosErro)
src/components/EnamedProvaAnalyzer.jsx (pós-análise: link para ErrorActionCenter)
```

**Mapa mínimo (errorActionMap):**

| Tipo de erro | Ação corretiva |
|---|---|
| `lacuna` | Revisão curta + questões externas |
| `raciocinio` | Mini-caso + problem representation |
| `distractor` | 3 diferenciais + must-not-miss |
| `descuido` | Bloco cronometrado |
| `nao_visto` | D0 imediato do tema |
| `interpretacao` | Questões de leitura diagnóstica |
| `confianca` | Revisão com estimativa prévia |

**Critério de aceite:**
- Após FocusMode com motivosErro, Dashboard mostra badge "Ver ação corretiva".
- `ErrorActionCenter` exibe tipo de erro + ação + botão CTA.
- Gated por `featureEnabled` — vest e res ambos recebem.

---

### P1-D — Raciocínio Clínico integrado ao FSRS

**Escopo:**

```
src/core/reviewTaskPlanner.js         (novo — injeta steps clínicos no tema pai)
src/core/illnessScript.js             (fonte canônica de calcRaciocinioScore)
src/core/readiness.js                 (remover calcRaciocinioScore local, importar de illnessScript)
src/components/RaciocinioClinico.jsx  (remover calcRaciocinioScore local, importar de illnessScript)
src/components/FocusMode.jsx          (brain dump faseado por step via reviewTaskPlanner)
```

**Brain dump estruturado (5 campos, step D1):**

```
1. Definição / quadro geral
2. Diagnóstico
3. Diferenciais
4. Conduta
5. Não pode perder (must-not-miss)
```

**Aviso obrigatório em conduta/prescrição:**

```
⚠️ Uso educacional. Não aplicar em paciente real.
```

**Critério de aceite:**
- `calcRaciocinioScore` tem única fonte (`illnessScript.js`); `readiness.js` e `RaciocinioClinico.jsx` importam dela.
- FocusMode em step D1 mostra campos estruturados; D4 mostra illness script recall; D7 mostra mini-caso.
- `reviewTaskPlanner` gera tarefas clínicas para o tema pai quando `modulos.raciocinioClinico = true`.
- Nenhuma feature de raciocínio vaza para vest.

---

### P1-E — Activity Log / Calendário (somente pós-Bloco N)

**Pré-condição:** Bloco N entregue e com commit.

**Escopo:**

```
src/core/activityLog.js              (novo)
src/components/ActivityCalendar.jsx  (novo — calendário histórico/futuro)
src/components/ActivityDayModal.jsx  (novo — detalhe por dia)
```

**Tipos de evento:**

```
fsrs_review | focus_session | clinical_case | exam_analysis
anki | simulado | calendar_import | weekly_review
mentor_action | domain_validation
```

**Retenção:**

```
Últimos 30 dias = detalhe rico por evento
Até 12 meses   = resumo pesquisável (contagem por tipo/dia)
```

**Critério de aceite:**
- Clique em dia do calendário mostra lista de eventos com tema, horário, duração, resultado.
- Integrado com `markStep`, `createSessionReflection`, `addEnamedAnalise`.
- Gated por auth (uid): sem Bloco N, a tela não carrega.

---

## Critério de aceite do P1 completo (§39 do MD)

- [x] Mapa completo de features — **esta seção 2**
- [x] Lista do que fica principal — **seção 13**
- [x] Lista do que vai para Mais/Avançado — **seção 14**
- [x] Nova arquitetura do Dashboard — **seção 5**
- [x] Nova arquitetura das Stats — **seção 7**
- [x] Regra de decisão do Mentor — **seção 6**
- [x] Plano para Raciocínio Clínico no FSRS — **seção 8 + P1-D**
- [x] Plano para Centro de Erros — **seção + P1-C**
- [x] Plano para Activity Log — **seção + P1-E**
- [x] Sequência segura de implementação — **seção 15**
