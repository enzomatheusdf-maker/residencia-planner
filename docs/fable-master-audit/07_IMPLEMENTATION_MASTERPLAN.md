# 07 — IMPLEMENTATION MASTERPLAN (BLOCOS MASTIGADOS PARA O CODEX)

ESTE DOCUMENTO SUBSTITUI qualquer bloco anterior (BLOCO A..P2.x e afins) que conflite com ele. Ordem de execução obrigatória: CC-0 → CC-1 → CC-2 → CC-3 → CC-4 → CC-5 → CC-6 → CC-7 → CC-8. Um bloco por sessão do Codex. Testes e validação SOMENTE ao fim de cada bloco. Comandos de validação padrão (rodar no fim, nesta ordem):

```powershell
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

No Windows, se Jest falhar com EPERM em temp: apontar TEMP/TMP para `.tmp-jest` local.

Regras globais para TODOS os blocos: não instalar bibliotecas; não reescrever FSRS; não alterar firestore.rules; não tocar arquivos proibidos; não "aproveitar para refatorar"; preservar contratos descritos no MEDREV_CONTEXT_FSRS_COMANDO_MENTOR_DOSSIE.md; preferir "curva de revisão" a "FSRS" em copy de UI.

---

## BLOCO CC-0 — Preflight e trava de baseline

**Problema:** a auditoria não pôde executar testes/build (ambiente sem rede). Nenhum bloco pode partir de baseline desconhecido.
**Objetivo:** registrar o estado verde (ou os vermelhos existentes) ANTES de qualquer mudança.
**Resultado para o usuário:** nenhum direto; protege todos os blocos seguintes.
**Dependências:** nenhuma.
**Arquivos permitidos:** criar `docs/fable-master-audit/BASELINE_CC0.md`; mover MDs de planos antigos da raiz para `docs/archive/` (mover, não editar); criar `docs/archive/README.md` (3 linhas: plano vigente é docs/fable-master-audit/07).
**Arquivos proibidos:** qualquer arquivo em `src/`, `firestore.rules`, `package.json`.

**Tarefas:**
1. Rodar os 3 comandos padrão e capturar saída integral.
2. Registrar em BASELINE_CC0.md: branch, `git status --short`, nº de suítes/testes passando e falhando (lista nominal dos falhando), warnings de build, tempo de build.
3. Smoke manual de isolamento multiusuário no mesmo navegador: login usuário A → criar tema → logout → login usuário B → verificar que NADA de A aparece → logout → login A → dados intactos. Registrar resultado com evidência (screenshot ou descrição passo a passo).
4. Mover os MDs `MEDREV_*.md` da raiz (exceto README.md e AGENTS.md) para `docs/archive/`.

**Critérios de aceite:** BASELINE_CC0.md existe e está completo; raiz limpa de planos antigos; smoke de isolamento PASSOU (se falhar: PARAR TUDO e reportar — é stop condition de release).
**Risco:** nenhum (sem mudança de src). **Rollback:** `git checkout`.
**Executor:** Sonnet Low (mecânico) ou Codex.

---

## BLOCO CC-1 — Matar o segundo motor de prioridade do Dashboard

**Problema (achado F1):** `Dashboard.jsx:~1398–1452` cria `queueFallbackAction` (prio 88, source `dashboard-fallback`) que SOBRESCREVE a decisão fresca do Mentor quando `pending > 0` e a ação é `rest`, e sobrescreve `activeDailyCommand` quando `type === "rest_or_light_day"`. A policy JÁ tem `fila_do_dia` (prio 88) e só decide `rest` quando a fila está vazia na visão do snapshot — logo o override só dispara em divergência snapshot×estado vivo, mascarando o bug real (F2) e atropelando rest deliberado.
**Objetivo:** o Dashboard NUNCA sobrescreve uma decisão fresca. Fallback local só quando o snapshot está AUSENTE ou marcado stale.
**Resultado para o usuário:** o rest recomendado é respeitado; fim de comandos contraditórios.
**Dependências:** CC-0.
**Arquivos permitidos:** `src/components/Dashboard.jsx`; `src/components/Dashboard.*.test.*` (criar se necessário em `src/components/__tests__/`).
**Arquivos proibidos:** `mentorDecisionPolicy.js`, `dailyCommandEngine.js`, `store.js`, `decisionCore.js`, `dailyCommandTargetExecutor.js`.

**Tarefas:**
1. Introduzir constante local `isSnapshotUsable = Boolean(activeDecisionSnapshot)` (a noção de stale por data entra no CC-2; aqui o critério é presença+plat, já existente).
2. Alterar a composição: se `isSnapshotUsable`, usar EXCLUSIVAMENTE `activeDailyCommand` (e `primaryAction` para telemetria), sem consultar `queueFallbackAction`.
3. `queueFallbackAction` passa a ser construída e usada SOMENTE quando `!isSnapshotUsable && pending > 0`; renomear para `defensiveQueueFallback` e source para `dashboard-defensive-fallback`.
4. Quando o fallback defensivo for usado, disparar telemetria `mentor_action_seen` com `source: "dashboard-defensive-fallback"` (payload já compatível com o contrato plat/action_type/source).
5. Remover a substituição de `rest_or_light_day` por fila; o comando rest do engine é exibido como veio (copy/labels intactos).
6. Corrigir F6 por consequência: `estimatedMinutes` de fila inteira não aparece mais como ação única fora do fallback defensivo.

**Testes (ao fim):** novos testes de componente/unidade cobrindo: (a) snapshot fresco com rest → rest exibido mesmo com pending>0 vivo; (b) snapshot ausente + pending>0 → fallback defensivo com source correto; (c) snapshot de outro plat → tratado como ausente. Rodar trio de comandos padrão.
**Critérios de aceite:** os 3 cenários acima passam; nenhum teste pré-existente quebrado além dos que assertavam o comportamento antigo (esses devem ser ATUALIZADOS com comentário citando CC-1); grep por `dashboard-fallback` retorna zero (substituído).
**Risco:** usuários com snapshot stale verão rest "errado" até CC-2 — aceito por 1 bloco, é o comportamento honesto. **Rollback:** revert do commit do bloco.
**Executor:** Codex/GPT-5.5 High.

---

## BLOCO CC-2 — Contrato de frescor do decisionSnapshot

**Problema (F2):** snapshot valida `plat` mas não DATA nem versão; rebuilds existem por evento (setMeta, marcação, rebalance, sessão) mas não há gatilho determinístico de virada de dia/retorno ao app. Snapshot de ontem pode comandar hoje.
**Objetivo:** snapshot carrega `{generatedAt, forDate, plat, engineVersion}`; consumidores tratam `forDate !== hoje` como stale; rollover de dia dispara rebuild automático.
**Resultado para o usuário:** abrir o app de manhã mostra a decisão DE HOJE, sempre.
**Dependências:** CC-1.
**Arquivos permitidos:** `src/core/decisionCore.js`, `src/core/store.js` (apenas: buildDecisionOutputs, pontos de rebuild, e um efeito de rollover), `src/components/Dashboard.jsx` (apenas o critério `isSnapshotUsable`), testes correspondentes.
**Arquivos proibidos:** `mentorDecisionPolicy.js`, `mentorSignals.js`, `fsrs.js`, `dailyCommandEngine.js`, `firestore.rules`.

**Tarefas:**
1. Em `decisionCore.buildDecisionCoreSnapshot`, anexar metadados `{generatedAt: ISO, forDate: todayStr(), plat, engineVersion: "decision-core-v2"}` ao snapshot retornado.
2. Em `store.js`, criar função única `ensureFreshDecisionSnapshot(reason)` que: lê snapshot atual; se ausente, plat divergente, `forDate !== todayStr()` ou `engineVersion` divergente → chama buildDecisionOutputs e persiste; senão no-op. Registrar `reason` em telemetria leve apenas quando rebuild ocorre (`decision_rebuilt` com payload `{plat, reason}` — adicionar contrato em telemetry.js).
3. Encadear `ensureFreshDecisionSnapshot` em: inicialização do app pós-hidratação do persist; evento `visibilitychange`→visible (hook no App ou Dashboard, escolher o ponto que NÃO duplique listener); e antes da montagem do Comando no Dashboard (chamada idempotente).
4. Atualizar `isSnapshotUsable` do Dashboard para usar o contrato (presença + plat + forDate de hoje + engineVersion).
5. Migração defensiva: snapshot persistido antigo sem metadados é tratado como stale (não quebrar merge do persist).

**Testes (ao fim):** unidade para `ensureFreshDecisionSnapshot` (4 casos: ausente, plat errado, data velha, versão velha → rebuild; fresco → no-op); teste de que snapshot novo carrega metadados. Trio padrão.
**Critérios de aceite:** simulação manual de virada de dia (mock de todayStr ou ajuste de relógio em teste) regenera o snapshot; nenhum rebuild em loop (no-op comprovado por contador no teste); telemetria `decision_rebuilt` validada no contrato.
**Risco:** rebuild excessivo (custo de CPU) — mitigado pelo no-op idempotente. **Rollback:** revert; metadados extras são ignorados por consumidores antigos.
**Executor:** Codex/GPT-5.5 High.

---

## BLOCO CC-3 — Executor auditável: fim da degradação silenciosa

**Problema (F3):** `dailyCommandTargetExecutor.js` retorna `false` e cai em `setView("dash")` para rota desconhecida, sem telemetria; e `focus` sem params/queueItem cai em `crono` retornando `true` (sucesso falso). Rota quebrada em produção = invisível.
**Objetivo:** todo desfecho do executor é estruturado e telemetrável; nenhum sucesso falso.
**Resultado para o usuário:** CTAs que sempre fazem o que dizem; para o time, alarme imediato de target quebrado.
**Dependências:** CC-2.
**Arquivos permitidos:** `src/core/dailyCommandTargetExecutor.js`, `src/core/dailyCommandTargetExecutor.test.js`, `src/core/telemetry.js` (adicionar contrato de evento), `src/components/Dashboard.jsx` e `src/components/ActionInbox.jsx` (apenas para consumir o retorno estruturado e disparar o evento).
**Arquivos proibidos:** `dailyCommandEngine.js` (mapeamentos), `mentorDecisionPolicy.js`, `store.js`.

**Tarefas:**
1. Mudar o retorno do executor para objeto `{ok: boolean, outcome: "handled"|"fallback_view"|"missing_handler"|"unknown_route", route, params}` mantendo compat: quem hoje só checa truthiness continua funcionando (`ok`).
2. Casos: rota conhecida + handler presente → `handled`; rota conhecida + handler ausente (ex.: `focus` sem onStudy, `settings` sem onOpenAjustes) → `missing_handler` com fallback de view atual preservado; rota desconhecida → `unknown_route` + fallback dash; `focus` modo fila sem queueItem → `missing_handler` (NÃO `handled`).
3. Adicionar contrato em telemetry.js: `mentor_action_target_missing: ["plat", "route", "outcome", "source"]`.
4. Dashboard e ActionInbox: após chamar o executor, se `outcome !== "handled"`, disparar `mentor_action_target_missing`.
5. Atualizar todos os testes do executor para o retorno estruturado (manter cobertura de caso clínico já existente).

**Testes (ao fim):** suíte do executor cobre os 4 outcomes; testes de Dashboard/ActionInbox verificam disparo do evento em outcome ruim. Trio padrão.
**Critérios de aceite:** zero `return true` em caminho sem handler real; contrato de telemetria validado; nenhum CTA existente mudou de destino quando os handlers estão presentes (testes de regressão das rotas canônicas passam).
**Risco:** baixo; mudança de retorno pode quebrar chamadas não mapeadas — grep obrigatório por `executeDailyCommandTarget(` em todo src antes de finalizar. **Rollback:** revert.
**Executor:** Codex/GPT-5.5 High.

---

## BLOCO CC-4 — Paridade FSRS: preview × efeito real, sem regressão silenciosa

**Problema (F9):** `reviewOutcome.js` descreve a transição esperada; `recalcAfterMark` aplica. Não há teste que prove paridade entre os dois — uma mudança em um sem o outro mente para o usuário sobre o que vai acontecer.
**Objetivo:** suíte de paridade que trava o contrato; mais guardas de pureza do histórico oficial.
**Resultado para o usuário:** o preview da revisão sempre corresponde ao efeito real.
**Dependências:** CC-0 (pode rodar em paralelo a CC-1..3, mas manter ordem por segurança).
**Arquivos permitidos:** `src/core/reviewOutcome.js` (somente se a paridade exigir correção — documentar qual lado estava errado), novos arquivos de teste `src/core/fsrsParity.test.js`; `src/core/fsrs.js` PROIBIDO exceto correção de bug comprovado pela paridade (se necessário, parar e reportar antes de alterar).
**Arquivos proibidos:** `fsrsCanonicalShadow.js`, `store.js`, qualquer UI.

**Tarefas:**
1. Criar `fsrsParity.test.js` com matriz de cenários: cada stepKey (d0,d1,d4,d7,d21,manutencao) × ratings (again/hard/good/easy via faixas de acerto) × estados (no prazo, atrasado 3d, atrasado 15d, adiantado, relearning ativo, tema maduro com lapso).
2. Para cada cenário: gerar preview via reviewOutcome, aplicar recalcAfterMark, assertar que (próximo passo, data, fase, flags de relearning) batem com o preview.
3. Teste de pureza: aplicar marcação com `shadowContext` populado e assertar que `rev.reviewHistory` contém apenas eventos oficiais e que dados de sombra ficam exclusivamente em `fsrsCanonicalShadow`.
4. Teste de migração D14: rev persistido com `d14` passa pela função de migração e resulta sem chave d14, sem revisão órfã duplicada.
5. Se divergência for encontrada: PARAR, registrar cenário exato em `docs/fable-master-audit/CC4_DIVERGENCES.md`, e só corrigir o lado errado com aprovação (entregar o relatório primeiro).

**Critérios de aceite:** ≥ 30 cenários de paridade passando; pureza e migração cobertas; relatório de divergências (mesmo vazio) entregue. Trio padrão.
**Risco:** descoberta de divergência real (bom problema). **Rollback:** testes são aditivos.
**Executor:** Codex/GPT-5.5 High.

---

## BLOCO CC-5 — Gateway único de rebuild no store (sem mudança de comportamento)

**Problema (F5):** chamadas a `buildDecisionOutputs`/rebuild espalhadas pelo store (≈ linhas 395, 430, 604, 1097, 1146, 1569). Cada novo evento relevante arrisca esquecer o rebuild e dessincronizar snapshot×inbox.
**Objetivo:** um único ponto `rebuildDecision(reason)` interno chamado por todos os sites atuais; comportamento idêntico, auditabilidade total.
**Dependências:** CC-2 (usa ensureFresh/metadados).
**Arquivos permitidos:** `src/core/store.js`, testes do store.
**Arquivos proibidos:** todos os demais.

**Tarefas:**
1. Criar `rebuildDecision(state, reason)` que encapsula buildDecisionOutputs + persistência do snapshot/inbox + telemetria `decision_rebuilt` (reusar contrato do CC-2).
2. Substituir TODOS os call-sites existentes por essa função passando reasons descritivos (`set_meta`, `mark_review`, `rebalance`, `session_closed`, `domain_test`, `day_rollover`...).
3. Garantir invariante: snapshot e actionInbox são SEMPRE escritos juntos (nunca um sem o outro) — assert em dev via devFlags.
4. Diff de comportamento: nenhum. Proibido mudar qualquer cálculo.

**Critérios de aceite:** grep por `buildDecisionOutputs(` fora do gateway = 0; suíte do store passa sem alteração de expectativas (exceto reasons novos); trio padrão verde.
**Risco:** médio (store é crítico) — por isso escopo cirúrgico e zero mudança de cálculo. **Rollback:** revert.
**Executor:** Codex/GPT-5.5 High.

---

## BLOCO CC-6 — Extrair o container do Comando do Dia do Dashboard

**Problema (F4):** Dashboard.jsx 2.925 linhas mistura cálculo, fallback, telemetria e render do Comando. Pós CC-1/2/3 a lógica encolheu; é a hora de extrair SEM mudar comportamento.
**Objetivo:** novo `src/components/dailyCommand/DailyCommandCard.jsx` (render puro, recebe command+handlers) e `useDailyCommand.js` (hook que lê snapshot via contrato de frescor e devolve {command, execute, telemetry}). Dashboard importa e usa.
**Dependências:** CC-1, CC-2, CC-3.
**Arquivos permitidos:** `src/components/Dashboard.jsx`, novos arquivos em `src/components/dailyCommand/`, testes novos.
**Arquivos proibidos:** core inteiro.

**Tarefas:** mover (não reescrever) a lógica; preservar classes/markup do card pixel-perfect; testes de render dos tons (alert/normal/rest) e de disparo seen/started/completed.
**Critérios de aceite:** Dashboard.jsx reduz ≥400 linhas; snapshot visual igual (validação manual); telemetria intacta; trio padrão.
**Risco:** regressão visual. **Rollback:** revert. **Executor:** Codex High (mover) + Sonnet Low (polimento visual se necessário).

---

## BLOCO CC-7 — Telemetria de qualidade do Mentor (followed/ignored/ganho)

**Problema:** seen/started/completed existem, mas não há notion de IGNORADO nem de ganho pós-ação — sem isso a "qualidade do Mentor" (doc 06) não é mensurável e métricas de Stats não podem ser podadas com critério.
**Objetivo:** instrumentar o loop recomendação→desfecho e produzir um agregado local consultável.
**Dependências:** CC-3, CC-5.
**Arquivos permitidos:** `src/core/telemetry.js`, `src/core/metricsRegistry.js`, `src/core/store.js` (somente via gateway do CC-5), `src/components/Dashboard.jsx`/`dailyCommand/` (disparos), `src/components/StatsPanel.jsx` (1 card novo "Mentor" + auditoria de métricas sem ação).
**Arquivos proibidos:** policy, signals, fsrs.

**Tarefas:**
1. Novos contratos: `mentor_action_ignored` ["plat","action_type","source","hours_visible"] (disparo: comando visto hoje, dia virou sem started) e `mentor_action_outcome` ["plat","action_type","delta_metric","window_days"] (ganho simples: delta de acerto/estabilidade no tema-alvo em 7 dias, calculado a partir de learningEvents — best effort, null permitido).
2. Agregado local em metricsRegistry: executados/ignorados por tipo nos últimos 14 dias; expor no card "Mentor" do Stats com amostra mínima (n<5 → "coletando dados").
3. Auditoria de métricas do StatsPanel: para cada métrica exibida, anotar em comentário a ação que ela justifica; as sem ação → mover para seção colapsada "Avançado" (lista final registrada em `docs/fable-master-audit/CC7_METRICS_AUDIT.md`).

**Critérios de aceite:** contratos validados; ignored dispara em teste de rollover; card Mentor respeita amostra mínima; relatório de auditoria de métricas entregue. Trio padrão.
**Risco:** baixo. **Executor:** Codex High.

---

## BLOCO CC-8 — Explicabilidade do Comando na UI (copy + superfície)

**Problema:** o contrato já carrega explain[], confidence, riskIfIgnored, expectedBenefit — a UI subexpõe isso; explicabilidade é o diferencial nº1 (doc 03).
**Objetivo:** card do Comando exibe razão curta sempre; expansível "Por que isso agora?" com explain[] + sinais + confiança em linguagem humana (sem jargão; "curva de revisão", nunca "FSRS").
**Dependências:** CC-6.
**Arquivos permitidos:** `src/components/dailyCommand/*`, `src/core/copy.js`, testes.
**Arquivos proibidos:** core de decisão.
**Tarefas:** mapa confidence→rótulo (alta/média/explorando); render de riskIfIgnored quando presente; varredura de copy por jargão cru; telemetria `mentor_action_seen` ganha nada (payload imutável).
**Critérios de aceite:** todos os tipos de ação renderizam explicação sem texto vazio; zero "FSRS" em UI; trio padrão.
**Executor:** Sonnet Low.

---

## Mapa de executores
- **Sonnet Low:** CC-0 (mecânico), CC-8, polimento do CC-6.
- **Codex/GPT-5.5 High:** CC-1, CC-2, CC-3, CC-4, CC-5, CC-6, CC-7.
- **Fable 5 de novo:** revisão pós CC-3 (checkpoint de coerência), qualquer divergência do CC-4, decisão de escopo da expansão (P3) e red team pré-beta.
