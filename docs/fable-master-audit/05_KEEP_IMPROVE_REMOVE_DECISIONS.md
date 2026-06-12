# 05 — KEEP / IMPROVE / REMOVE — DECISÕES FUNÇÃO POR FUNÇÃO

Legenda de decisão: MANTER · MELHORAR · FUNDIR · SIMPLIFICAR · REMOVER · ADIAR · CRIAR. Prioridade: P0 bloqueia beta; P1 pós-beta imediato; P2 trimestre; P3 oportunista.

## Tabela mestra

| Função | Estado real | Decisão | Prioridade | Por quê / métrica |
|---|---|---|---|---|
| Cadeia decisória (signals→policy→command→executor) | funcional, F1–F3 | **MELHORAR** | **P0** | É o produto. Métrica: 0 divergências decisão-calculada × decisão-exibida em telemetria (CC-1/2/3) |
| Executor de targets | funcional, degradação silenciosa | MELHORAR | P0 | Evento `mentor_action_target_missing` = 0 em produção (CC-3) |
| FSRS-lite + sombra canônica | funcional e correto | **MANTER** (testes de paridade) | P0 (só testes) | Não reescrever. Paridade preview×efeito (CC-4). Sombra permanece diagnóstico |
| Segurança multiusuário | funcional | MANTER + teste de release | P0 | Teste de troca de conta no mesmo device passa = gate de beta |
| Comando do Dia (UI) | funcional, copy ok | MELHORAR (explicabilidade) | P1 | Exibir explain[]/confiança/risco — taxa de execução do comando ↑ (CC-8) |
| Dashboard.jsx | monólito 2.925 linhas | SIMPLIFICAR (extrair container do Comando) | P1 | Sem mudança de comportamento; diff de snapshot de render (CC-6) |
| store.js | deus-objeto 1.890 linhas | SIMPLIFICAR (gateway único de rebuild) | P1 | CC-5; zero mudança de contrato |
| Onboarding V1 × V2 | duplicado | **FUNDIR** (manter V2, deletar V1 após confirmação de rota morta) | P1 | -1 superfície de manutenção |
| Telemetria de decisão | parcial (seen/started/completed) | MELHORAR (followed/ignored/ganho) | P1 | Constrói a métrica de qualidade do Mentor (CC-7) |
| Agenda + projeção de carga | funcional | MANTER | — | Não projeta datas hipotéticas ✔ |
| Teste de Domínio | funcional | MANTER | — | Gate de mastery com evidência B |
| Simulados/provaAnalyzer/enamedIntel | funcional | MANTER | — | Alimenta policy ✔ |
| Erros (taxonomia→ação) | funcional | MANTER; MELHORAR fricção de registro | P2 | Tempo de registro de erro < 30s |
| Raciocínio clínico (motor) | funcional | MANTER | — | Diferencial 4 (doc 03) |
| RaciocinioClinico.jsx | monólito 3.007 linhas | SIMPLIFICAR | P2 | Só após CC-6 provar o método |
| Stats/forecast/readiness | funcional com guardas | SIMPLIFICAR superfície | P2 | Cada métrica exibida precisa ter ação associada; as sem ação → seção "avançado" ou remoção |
| Gamificação (Conquistas, Trilha, gamif, achievements) | funcional, isolado | **SIMPLIFICAR agressivo** | P2 | Evidência C (doc 02); manter no máximo streak honesto + marcos de domínio; remover XP/badges por volume |
| p3WhatIf | a auditar consumo | ADIAR ou REMOVER | P2 | Se nenhum consumidor real: remover |
| peakMode/operationalMode | funcional | MANTER | — | Sinal do Mentor ✔ |
| WeeklyReview | funcional | MANTER | — | Loop Medir→Ajustar |
| Calendar providers/import | funcional | MANTER | — | Pilar do agnosticismo |
| LaunchChecklistPanel/launchReadiness | funcional | MANTER como gate REAL de release | P0 (uso) | Beta só abre com checklist verde |
| Pipeline de casos (raiz: casos_gerados, codex_lotes, JSONs) | fora do app | **MOVER** p/ `tools/` ou repo separado | P1 | Higiene; não é produto |
| ~45 MDs de planos antigos na raiz | ruído | **ARQUIVAR** em `docs/archive/` | P1 | Anti-confusão de agentes; doc 07 é o plano vigente |
| IA conversacional no Mentor | inexistente | **ADIAR** | P3 | Só sobre motor já confiável (doc 04) |
| Notificações/push | inexistente | ADIAR | P3 | Depois de provar valor do Comando |

## Kill List explícita (remover/esconder/adiar)

1. Override `queueFallbackAction` como sobrescritor de decisão fresca (Dashboard) — morre em CC-1 (vira fallback estrito de snapshot ausente/stale).
2. `estimatedMinutes` de fila inteira apresentado como ação única (F6) — morre com 1.
3. Onboarding V1 — após confirmar que nenhuma rota o renderiza.
4. Métricas de Stats sem ação associada (auditoria item a item dentro de CC-7; critério: "que botão essa métrica justifica?").
5. XP/badges por volume de atividade — incentivo perverso documentado para o perfil grinder.
6. `p3WhatIf` se sem consumidor.
7. MDs de plano antigos da raiz → `docs/archive/` (com README de 3 linhas dizendo que o plano vigente é `docs/fable-master-audit/07`).
8. Qualquer texto de UI que exponha "FSRS" cru → "curva de revisão" (já é regra; varrer copy).
9. Promessas implícitas de aprovação em qualquer copy da Landing.

## Onde estaria o overengineering (não fazer)
- Trocar FSRS-lite por ts-fsrs como motor principal agora.
- Reescrever store para Redux/RTK ou criar camada de eventos genérica.
- Student Model bayesiano completo antes de ter usuários gerando dados.
- Microfrontends/decomposição total dos 4 monólitos de uma vez.
