# 06 — MAXIMUM RESULT PRODUCT ROADMAP

## North Star Metric
**Comandos do Dia executados por semana ativa por usuário** (proxy direto de "o produto decidiu e o aluno confiou"). Métricas de proteção: (a) taxa de comando ignorado com motivo; (b) divergência decisão-calculada×exibida = 0; (c) tempo de registro por sessão < 90s; (d) retenção W4.

## P0 — Coerência (bloqueia beta) — blocos CC-0..CC-4 do doc 07
Resultado: a decisão exibida é SEMPRE a decisão calculada, fresca, executável e auditável. Gate adicional: teste de troca de conta no mesmo device + LaunchChecklist verde.

## P1 — Confiabilidade estrutural e loop de confiança — CC-5..CC-8
Gateway único de rebuild; container do Comando extraído; telemetria followed/ignored/ganho; explicabilidade na UI; arquivar planos antigos; fundir onboarding.

## P2 — Redução de superfície e fricção
Stats acionáveis (cada métrica → 1 botão); gamificação minimalista honesta; registro de erro <30s; decomposição RaciocinioClinico/Modals/FocusMode pelo método provado em CC-6.

## P3 — Expansão coerente com a tese (inclui o "ampliar escopo" do fundador)
Ingestão de sinais externos (CSV de bancos, import de simulado por foto, ponte Anki real via AnkiConnect/export); track Revalida sobre a mesma espinha; camada IA generativa para explicação de erro e geração de caso SOB o motor determinístico; B2C pago.

## Horizontes
| Horizonte | Foco | Critério de sucesso |
|---|---|---|
| 3 meses | P0+P1 completos; beta fechado (10–30 usuários reais) | NSM medível; 0 stop-conditions ativas; W2 retention >40% no beta |
| 6 meses | P2; beta aberto; primeira validação preditiva interna (forecast × resultado real de simulado) | Erro do forecast dentro da banda em ≥70% dos casos com amostra mínima |
| 12 meses | P3 parcial; monetização beta→pago; 2º track | Conversão beta→pago; churn motivo-rastreado |
| 24 meses | Moat de dados longitudinais; possível B2B (ligas/faculdades) | Decisões do Mentor mensuravelmente melhores que baseline de regra fixa (A/B interno) |

## Experimentos de produto (cada um mata ou valida uma premissa)
1. **Comando único vs lista**: esconder ActionInbox para metade do beta; medir execução e ansiedade reportada. Premissa: 1 ação > menu.
2. **Explicabilidade**: explain[] visível vs oculto; medir taxa de execução. Premissa: explicar aumenta confiança.
3. **Custo de registro**: registro completo vs mínimo (acerto apenas); medir adesão e qualidade de sinal. Premissa: menos campos = mais dados úteis.
4. **Rest deliberado**: quando Mentor recomenda descanso, medir se usuários respeitam e o efeito em adesão na semana seguinte. Premissa: rest aumenta retenção (e exige CC-1 para sequer ser testável).
5. **Cold start**: tempo até primeiro comando executado < 15 min para ≥80% dos novos usuários. Premissa: valor no dia 0.

## Funil de métricas (mínimo a instrumentar no beta)
Aquisição: conversão landing→cadastro→onboarding completo. Ativação: tempo até 1º comando executado; 1º plano; 1ª revisão marcada. Uso: dias ativos/semana; aderência ao plano; backlog médio. Aprendizagem: recorrência de erro por taxonomia; estabilidade média pós-revisão; calibração (confiança×acerto). Mentor: executados/ignorados; target_missing=0; ganho pós-ação (delta de acerto no tema em 7 dias). Retenção: W1/W2/W4; reativação; abandono pós-backlog.
