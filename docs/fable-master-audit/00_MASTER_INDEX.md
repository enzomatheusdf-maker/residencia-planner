# 00 — MASTER INDEX | Auditoria Mestra MedRev (Fable 5)

Data: 2026-06-11 | Base: ZIP `Bro` (268 arquivos src, 72 suítes de teste, ~50.7k linhas)
Limitação declarada: ambiente sem rede para `npm install` — testes/build NÃO foram executados nesta auditoria; toda validação roda na máquina do executor ao FIM de cada bloco.

## Decisão de prontidão

**QUASE PRONTO.** O ciclo central existe e está majoritariamente conectado (store → decisionCore → mentorSignals → mentorDecisionPolicy → dailyCommandEngine → Dashboard/ActionInbox → executor). Não foi encontrada mistura de dados entre usuários nem CTA crítico sem rota. O que bloqueia publicação aberta NÃO é falta de feature — é **coerência de decisão** (um segundo motor de prioridade vivo dentro do Dashboard.jsx) e **frescor do snapshot de decisão**. Resolvidos os blocos CC-1 a CC-3, o produto está apto a beta fechado.

## Maiores conclusões

1. **O FSRS é real.** `fsrs.js` implementa S/D/retrievability, relearning com política de severidade, workload, histórico oficial e sombra canônica `ts-fsrs`. Não é agenda fixa renomeada. D14 foi removido COM migração de dados persistidos (linhas 1071–1130). Veredito raro e positivo.
2. **Existe um segundo motor de prioridade no Dashboard** (`queueFallbackAction`, prio 88, Dashboard.jsx ~1398–1452) que sobrescreve a decisão do Mentor mesmo quando o snapshot existe e decidiu `rest`. Isso viola o princípio "o Mentor sabe não recomendar" e mascara o problema real: staleness do `decisionSnapshot`. É o P0 número 1.
3. **A unificação de execução está correta**: Dashboard e ActionInbox chamam o mesmo `executeDailyCommandTarget`. Porém o executor degrada silenciosamente (retorna `false` e cai em `dash`) sem telemetria — rota quebrada nunca seria detectada em produção.
4. **Segurança multiusuário está desenhada de verdade**: regras Firestore com default-deny, `assertUid`, `assertOwnerUidMatchesScope`, chave de persist local separada por sessão anônima. Falta apenas teste de regressão de troca de conta no mesmo device como critério de release.
5. **O risco dominante não é científico nem competitivo — é manutenção.** 4 arquivos-monstro (RaciocinioClinico 3.007, Dashboard 2.925, Modals 2.773, FocusMode 2.075 linhas) concentram a UI crítica. Decomposição é P1, nunca junto com mudança de comportamento.
6. **A hipótese estratégica é válida com emenda**: orquestração/decisão individualizada é defensável e diferenciada, MAS o produto precisa entregar valor standalone no dia 1 (cold start) — a promessa não pode depender de semanas de dados. Ver doc 04.
7. **A raiz do repo tem ~45 planos antigos.** Todo plano novo deve declarar o que SUBSTITUI. O doc 07 desta suíte substitui qualquer bloco anterior que conflite.

## Ordem de leitura

| # | Doc | Para quem |
|---|-----|-----------|
| 1 | `01_SYSTEM_MAP_AND_FEATURE_INVENTORY.md` | Você + Fable em rodadas futuras |
| 2 | `05_KEEP_IMPROVE_REMOVE_DECISIONS.md` | Você (decisões e Kill List) |
| 3 | `07_IMPLEMENTATION_MASTERPLAN.md` | **Codex** (blocos mastigados) |
| 4 | `08_EXECUTOR_PROMPTS.md` | **Codex** (prompts prontos, 1 por bloco) |
| 5 | `09_RED_TEAM_AND_RISK_REGISTER.md` | Você (antes de qualquer launch) |
| 6 | `02_SCIENCE_EVIDENCE_LEDGER.md` | Fundamenta copy e roadmap |
| 7 | `03_COMPETITIVE_INTELLIGENCE.md` | Posicionamento |
| 8 | `04_PRODUCT_STRATEGY_AND_DIFFERENTIATION.md` | Posicionamento |
| 9 | `06_MAXIMUM_RESULT_PRODUCT_ROADMAP.md` | Horizonte 3–24 meses |

## Regra de operação para o Codex

- Executar UM bloco por vez, na ordem do doc 07.
- Testes e validação SOMENTE ao fim de cada bloco (decisão do dono do produto): implementar → escrever/ajustar testes → rodar `npm run check:mojibake && npm test -- --watchAll=false && npm run build`.
- Nunca tocar arquivo listado como proibido no bloco.
- Parar e reportar se qualquer critério de aceite falhar.
