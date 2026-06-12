# MEDREV — P2/P3/P4: Roadmap de Integração UX pós-P1-A

> **Executor inicial:** Claude Code / Opus Thinking em modo planejamento  
> **Executor de implementação:** `gpt-5.3-codex` ou Sonnet, por sub-bloco  
> **Objetivo:** continuar a reorganização do MedRev depois do P1-A, atacando a experiência de “usuário entra e fica perdido”.  
> **Regra:** este arquivo é um roadmap. O Opus deve auditar e planejar antes de qualquer implementação.

---

## 0. Diagnóstico

O P1-A melhora a primeira camada da experiência:

```txt
Hoje
Plano
Estudar
Estatísticas
Banco
Mais
```

Isso reduz a sensação de “muitas abas”. Mas **não resolve sozinho** o problema principal: o usuário ainda pode ficar perdido dentro das funções se:

```txt
Stats continuar parecendo depósito de gráfico;
Mentor recomendar ação sem explicar bem;
erros não virarem ação corretiva;
raciocínio clínico continuar como aba lateral;
simulado não criar plano;
revisão não explicar por que aquele formato foi escolhido;
calendário/histórico não mostrar o que foi feito e o que vem depois.
```

Portanto, depois do P1-A, a sequência correta é:

```txt
P2 — Estatísticas + métricas com governança + explicação acionável
P3 — Centro de Erros + ações corretivas + fechamento do loop pós-sessão/prova
P4 — Raciocínio Clínico integrado ao FSRS + revisão multimodal
```

Activity Log / calendário histórico deve ficar para depois do Bloco N de multiusuário.

---

## 1. Pré-condições obrigatórias

Antes de P2/P3/P4:

```txt
1. Snapshot/commit de segurança.
2. Bloco N resolvido ou, no mínimo, não tocar em dados persistentes novos.
3. P1-A concluído ou em fase final.
4. Mentor v2 commitado/estabilizado.
5. Build/test/check:mojibake passando.
```

Rodar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Se houver arquivos críticos untracked, parar e pedir snapshot.

---

## 2. Como o Opus Thinking deve trabalhar

Você está em modo planejamento.

Não implemente ainda.

Não edite arquivos.

Não liste o workspace inteiro.

Use apenas comandos escopados:

```bash
git status --short
git ls-files src package.json docs
git grep -n "StatsPanel\|Preparo\|Retenção\|readiness\|metric\|coletando\|AdvancedSection" -- src
git grep -n "erro\|motivoErro\|tipoErro\|errorTaxonomy\|ActionInbox\|sessionReflection" -- src
git grep -n "Raciocinio\|Raciocínio\|illness\|sct\|casosProgresso\|calcRaciocinioScore" -- src
git grep -n "mentorNextAction\|mentorTodayPlan\|mentorDecisionPolicy\|target\|explain" -- src
git grep -n "featureEnabled\|platformFeatures\|plat === \"vest\"\|plat === 'vest'" -- src
```

Criar somente:

```txt
docs/P2_P3_P4_OPUS_AUDIT_PLAN.md
```

com diagnóstico e plano em sequência.

---

# P2 — Estatísticas e Métricas Acionáveis

## Objetivo

Transformar Estatísticas de “depósito de gráficos” em **área de diagnóstico compreensível**.

## Problema

Stats mistura:

```txt
readiness
ENAMED
weekly review
data safety
launch checklist
heatmap
painéis avançados
métricas sem ação
```

O usuário não sabe:

```txt
o que significa;
se dá para confiar;
o que fazer com aquilo.
```

## Resultado esperado

Stats deve ser organizada em seções:

```txt
1. Resumo
2. Aprendizagem
3. Erros
4. Provas/Simulados
5. Raciocínio Clínico
6. Atividade
7. Sistema
```

## Entregáveis P2

```txt
src/core/metricsRegistry.js
src/core/metricsRegistry.test.js
src/components/StatsPanel.jsx
docs/P2_STATS_DECISIONS.md
```

## Métricas mínimas no registry

```txt
retencaoLonga
cargaHoje
revisoesVencidas
relearningAberto
coberturaCronograma
acertoSimulado
erroDominante
calibracaoConfianca
raciocinioScore
adesaoAnki
```

Cada métrica deve ter:

```js
{
  id,
  label,
  description,
  emptyState,
  confidenceRule,
  actionWhenLow,
  dashboardLevel,
  statsSection,
  platforms,
}
```

## Regra de UX

Toda métrica deve responder:

```txt
O que mede?
Dá para confiar?
O que faço se estiver ruim?
```

Se não responder, não entra no topo.

---

# P3 — Centro de Erros e Ações Corretivas

## Objetivo

Fechar o loop:

```txt
errei → classifiquei → entendi → recebi ação corretiva → Mentor usa → FSRS/Plano agenda
```

## Problema

Hoje o sistema registra `motivosErro`, `tipoErro` e reflexões, mas o usuário não tem uma tela clara para entender:

```txt
errei por conteúdo?
memória?
raciocínio?
interpretação?
tempo?
conduta?
confiança?
o que faço agora?
```

## Entregáveis P3

```txt
src/core/errorActionMap.js
src/core/errorActionMap.test.js
src/components/ErrorActionCenter.jsx
src/components/ErrorActionPrompt.jsx
docs/P3_ERROR_ACTION_DECISIONS.md
```

## Taxonomia mínima

```txt
conteudo
memoria
raciocinio
representacao_problema
diferencial
incerteza_sct
conduta_prescricao
interpretacao
distracao
tempo
confianca_mal_calibrada
estrategia_prova
```

## Mapa ação corretiva

Exemplos:

```txt
conteudo → revisão curta + questões externas
memoria → FSRS/Anki
raciocinio → mini caso + problem representation
diferencial → listar 3 diferenciais + must-not-miss
conduta_prescricao → management station educacional
tempo → bloco cronometrado
confianca_mal_calibrada → estimativa prévia + revisão calibrada
```

## Integrações

P3 deve integrar com:

```txt
FocusMode
EnamedProvaAnalyzer
sessionReflection
ActionInbox
Mentor
Stats
```

## Regra

Não criar Centro de Erros como mais uma aba solta. Ele deve aparecer:

```txt
em Stats → seção Erros;
em Mais → como ferramenta;
no pós-sessão → CTA;
no pós-simulado → CTA;
no Mentor → ação corretiva.
```

---

# P4 — Raciocínio Clínico integrado ao FSRS

## Objetivo

Transformar Raciocínio Clínico de módulo lateral em **modo de revisão quando fizer sentido**.

## Problema

Hoje o raciocínio clínico existe, mas não fecha o loop com o tema pai e o FSRS. A auditoria identificou:

```txt
calcRaciocinioScore triplicado;
clinicalCaseMatch ausente;
reviewTaskPlanner ausente;
brain dump genérico;
conduta/prescrição simulada ausente;
casos insuficientes.
```

## Entregáveis P4

```txt
src/core/reviewTaskPlanner.js
src/core/reviewTaskPlanner.test.js
src/core/clinicalReasoningScoring.js
src/core/clinicalReasoningScoring.test.js
src/components/RaciocinioClinico.jsx
src/components/FocusMode.jsx
docs/P4_CLINICAL_REASONING_FSRS_DECISIONS.md
```

## Dois modos

### Modo 1 — Caso completo

```txt
1. Vinheta
2. Problem representation
3. Hipóteses + must-not-miss
4. Illness script de memória
5. SCT / nova informação
6. Conduta e prescrição simulada
7. Feedback + reencontro
```

### Modo 2 — Revisão FSRS multimodal

```txt
D1  → Brain dump estruturado
D4  → Illness Script recall
D7  → Mini caso + diferenciais
D21 → SCT curto + conduta
Manutenção → Caso rápido / prescrição simulada
```

## Brain dump estruturado

Para temas grandes:

```txt
1. Definição / quadro geral
2. Diagnóstico
3. Diferenciais
4. Conduta
5. Não pode perder
```

## Conduta/prescrição simulada

Campos:

```txt
estabilização
exames iniciais
tratamento inicial
medicações/classes/doses quando houver checklist
internação ou ambulatório
red flags
contraindicações
seguimento
```

Aviso obrigatório:

```txt
Uso educacional. Não aplicar em paciente real.
```

## Regra de plataforma

P4 é apenas Residência.

Para Vestibular:

```txt
não renderizar Raciocínio Clínico;
não usar illness script;
não usar casos clínicos;
não usar conduta médica.
```

---

## 3. Ordem de execução recomendada

```txt
P2-A — metricsRegistry + reorganização leve de Stats
P2-B — Stats com seções e explicações
P3-A — errorActionMap
P3-B — ErrorActionCenter integrado ao pós-sessão/prova
P4-A — unificar calcRaciocinioScore
P4-B — reviewTaskPlanner
P4-C — FocusMode multimodal
P4-D — Raciocínio Clínico com conduta/prescrição simulada
```

Não executar tudo junto.

---

## 4. Critério de aceite global

P2/P3/P4 aprovados se:

```txt
Stats explica métricas e ações;
Erro vira ação corretiva;
Mentor usa erro dominante;
Raciocínio Clínico entra no FSRS quando apropriado;
Dashboard não ganha mais cards soltos;
Vestibular não recebe medicina indevida;
Build/test/mojibake passam;
Usuário novo entende o que fazer.
```

---

## 5. Prompt para Opus Thinking

```txt
Aja como engenheiro de software sênior, designer de produto sênior e pesquisador em ciência da aprendizagem médica.

Você está em modo planejamento. Não implemente nada.

Use o arquivo MEDREV_P2_P3_P4_OPUS_ROADMAP.md como fonte de verdade.

Audite o código real com git grep/git ls-files, sem listar o workspace inteiro.

Objetivo: criar docs/P2_P3_P4_OPUS_AUDIT_PLAN.md com:
1. diagnóstico do estado atual de Stats, Erros e Raciocínio Clínico;
2. riscos de integração;
3. plano P2, P3 e P4 em sequência;
4. arquivos a tocar em cada fase;
5. testes necessários;
6. critérios de aceite;
7. o que NÃO implementar agora.

Não faça commit, deploy ou push.
Não instale libs.
Não edite arquivos de implementação.
```
