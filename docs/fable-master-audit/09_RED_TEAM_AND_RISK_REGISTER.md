# 09 — RED TEAM & RISK REGISTER

## Dez razões pelas quais a estratégia pode falhar

1. **O custo de registrar mata o valor de decidir.** A tese depende de sinais; sinais dependem do aluno alimentar o sistema. Se registrar erro/sessão custa mais que o ganho percebido, o Mentor decide no escuro e a confiança colapsa. (Mitigação: SLA de registro <90s/sessão; experimento 3 do doc 06.)
2. **"Mentor é só regra disfarçada."** Verdade hoje — e está OK enquanto for explicável e correto. Vira fraqueza se o marketing prometer inteligência que o motor não tem. (Mitigação: comunicar como sistema de decisão explicável, não como IA mágica.)
3. **FSRS por tema é uma extrapolação não validada.** A evidência é por card atômico; "tema" é um agregado multimodal. Se as datas estiverem sistematicamente erradas, toda a agenda perde credibilidade. (Mitigação: a sombra canônica já existe — usar o relatório de divergência como experimento contínuo; CC-4 trava paridade interna.)
4. **Amostra de um.** O produto foi moldado pelo próprio fundador — usuário extremo, grinder, construtor. O aluno mediano pode achar o sistema exigente demais. (Mitigação: beta com 10–30 usuários reais ANTES de qualquer aposta de escala; modo simples já existe no código.)
5. **Cold start mal resolvido** faz o primeiro Comando parecer genérico → churn no dia 1. (Mitigação: emenda 1 do doc 04; experimento 5.)
6. **Concorrente copia o discurso em uma sprint de marketing.** Medway já fala "prescrever estudo". O que não copiam rápido é o agnosticismo (canibaliza o pacote deles) e o histórico do aluno. (Mitigação: ancorar a marca no que eles estruturalmente não podem fazer.)
7. **Fadiga de dashboard.** A literatura de learning analytics (doc 02) mostra que dashboards raramente mudam aprendizagem. O MedRev tem 4+ superfícies de métricas. (Mitigação: Kill List; CC-7 poda por acionabilidade.)
8. **Beta valida engajamento, não aprendizagem.** Usuários podem amar e não aprender mais. (Mitigação: métricas de aprendizagem do doc 06 — recorrência de erro, estabilidade pós-revisão — desde o dia 1 do beta.)
9. **Manutenção solo.** 50k linhas, 4 monólitos, um fundador em ano de prova. Qualquer bug crítico em produção compete com o ENAMED. (Mitigação: beta fechado pequeno; congelamento de features fora dos blocos; LaunchChecklist como gate.)
10. **Risco regulatório/é-tico de previsão.** "Previsão de prontidão" mal comunicada vira promessa de aprovação implícita — dano reputacional e ético. (Mitigação: banda+amostra+confiança obrigatórias; copy auditada na Kill List item 9.)

## Cinco premissas que precisam de teste (e o teste)

| Premissa | Teste |
|---|---|
| Aluno quer UMA ação, não um menu | Experimento 1 (doc 06) |
| Explicação aumenta execução | Experimento 2 |
| Registro mínimo gera sinal suficiente | Experimento 3 |
| Rest deliberado melhora adesão semanal | Experimento 4 (depende de CC-1) |
| Valor percebido em <15 min | Experimento 5 |

## Sinais de que uma função deve ser removida
Métrica sem botão associado; configuração que nenhum motor lê; CTA com `mentor_action_target_missing` recorrente; feature com <5% de uso no beta após 4 semanas; qualquer tela que aumente o tempo até a primeira ação do dia.

## Riscos éticos, de privacidade e de confiança
1. **Dados sensíveis de desempenho acadêmico** — escopo por uid já desenhado (F8); manter texto clínico livre fora de telemetria; backup/restore testados antes do beta.
2. **LGPD**: beta precisa de termos mínimos + finalidade declarada de telemetria; exportação e exclusão de dados do usuário (backup.js cobre exportação; exclusão precisa de fluxo — adicionar ao gate de beta aberto, não fechado).
3. **Honestidade preditiva**: nunca exibir previsão sem amostra; nunca prometer aprovação (princípios 7 e 13 — já codificados no forecast, vigiar na copy).
4. **Dependência psicológica do sistema**: o produto deve reduzir ansiedade decisória, não criar compulsão por métricas; gamificação minimalista é decisão deliberada (doc 05).

## Status das stop conditions (do prompt original)

| Stop condition | Status na auditoria |
|---|---|
| Mistura de dados entre usuários | Não encontrada em código; smoke obrigatório no CC-0 |
| Perda silenciosa de progresso | Merge de persist defensivo presente; backup existe; teste de restore = gate de beta |
| CTAs críticos sem target | Rotas canônicas completas; degradação silenciosa corrigida no CC-3 |
| Comando do Dia frequentemente incorreto | RISCO ATIVO até CC-1/CC-2 — é o bloqueio de publicação |
| Datas de revisão falsas | Não encontradas; agenda não projeta passos hipotéticos |
| Configurações ignoradas | Módulos respeitados (ex.: raciocínio gated no App.js); auditoria completa por config fica no CC-7/copy |
| Build instável | Desconhecido até CC-0 |
| Ausência de recuperação de dados | backup.js + DataSafetyPanel existem; restore testado = gate |
| Previsões enganosas | Guardas presentes no motor (F7) |
| Fluxos impossíveis no mobile | Não auditado nesta rodada — incluir validação manual mobile no checkpoint pós CC-3 |

**Veredito red team:** a estratégia sobrevive à crítica SE (a) P0 sair antes de qualquer usuário externo, (b) o beta medir aprendizagem e não só uso, (c) o escopo permanecer congelado fora dos blocos até pós-ENAMED do fundador. O maior risco do projeto não está no código: está em expandir escopo antes de validar o core com gente de verdade.
