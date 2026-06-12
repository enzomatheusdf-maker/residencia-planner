# 04 — PRODUCT STRATEGY & DIFFERENTIATION

## Teste da hipótese estratégica

Hipótese: "MedRev é a camada de orquestração e decisão individualizada entre cursinho, banco, Anki, simulados e rotina."

| Critério | Veredito | Base |
|---|---|---|
| Tecnicamente viável | SIM | A cadeia decisória já existe e está testada (doc 01 §2); falta coerência, não capacidade |
| Pedagogicamente defensável | SIM | É um andaime de SRL (Zimmerman/Panadero) sobre princípios A: retrieval, spacing, feedback (doc 02) |
| Comercialmente diferenciador | SIM, condicionado | Único agnóstico de conteúdo; Medway prova que "prescrever estudo" vende, mas só dentro do pacote dela (doc 03) |
| Comunicável com honestidade | SIM | "Com tudo que o sistema sabe sobre você, qual a ação de maior retorno agora?" — sem prometer aprovação |
| Gera retenção | CONDICIONADO | Retenção vem do loop confiança→execução→ganho percebido; quebra se a recomendação estiver errada/stale (F1/F2) |
| Mais forte que competir em conteúdo | SIM | Competir em conteúdo exige capital de cursinho; orquestração exige software + dados — o terreno do fundador |

**Veredito: hipótese VÁLIDA com duas emendas obrigatórias.**

**Emenda 1 — Cold start.** "Decisão individualizada" não pode depender de semanas de dados. O produto precisa de valor standalone no dia 0: onboarding → plano → primeiro Comando executável em <15 min, com personalização por CONFIGURAÇÃO (nível 1) enquanto coleta comportamento. A escada de personalização: (1) configuração → (2) comportamento → (3) desempenho → (4) longitudinal → (5) predição validada. Cada nível só liga com amostra mínima declarada.

**Emenda 2 — Confiança antes de inteligência.** Uma recomendação errada e visível (rest atropelado, fila fantasma, CTA que cai no dashboard) destrói a tese inteira, porque o produto É a recomendação. Por isso P0 = coerência (CC-1..CC-3), não features novas.

## Identidade estratégica recomendada

> **MedRev: o sistema operacional de decisão do estudante de medicina.** Você escolhe o conteúdo; o MedRev decide o próximo passo, explica o porquê, e aprende com o resultado.

Três pilares de comunicação: (1) Uma ação por vez (Comando do Dia); (2) Explicável (sinais + confiança + risco de ignorar); (3) Honesto (banda, amostra, sem promessa de aprovação).

## O que o MedRev NÃO é (disciplina de escopo)
- Não é cursinho, não produz aula.
- Não é banco de questões em massa (registra resultado de qualquer banco).
- Não é chat de IA motivacional. Mentor = decisão operacional; IA conversacional só quando alimentar sinal ou decisão.
- Não é dashboard de vaidade: métrica sem ação morre (Kill List, doc 05).

## Sobre a expansão de escopo futura (mencionada pelo fundador)
Qualquer expansão deve passar pelo filtro: alimenta sinal do Mentor? altera decisão? melhora execução? Se não, é outro produto ou é adiável (regra já canônica no dossiê — promovida aqui a critério de roadmap). Expansões coerentes com a tese, em ordem de alavancagem: (1) ingestão de mais sinais externos (CSV de bancos de questões, screenshots de simulado, API Anki real); (2) multiusuário B2C beta→pago; (3) tracks adicionais (Revalida usa a mesma espinha); (4) camada IA generativa para explicação/caso — somente sobre o motor determinístico já confiável.
