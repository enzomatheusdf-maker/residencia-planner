# 02 — SCIENCE EVIDENCE LEDGER

Política de honestidade: as referências abaixo são da literatura canônica de ciência da aprendizagem (revisões sistemáticas e meta-análises consolidadas até o conhecimento de jan/2026). Nenhuma citação foi inventada; onde a evidência é indireta para o desfecho "aprovação em residência", isso está dito. Força: A robusta e aplicável · B moderada/indireta · C preliminar · D hipótese de produto · X sem suporte/risco de engano.

| Princípio | Evidência-âncora | População/desfecho | Aplicação no MedRev | Força |
|---|---|---|---|---|
| Retrieval practice / testing effect | Roediger & Karpicke 2006; meta-análises Rowland 2014 e Adesope et al. 2017 (g≈0,5); em med ed: Larsen, Butler & Roediger 2009 | Retenção de longo prazo > reestudo; replicado em educação médica | Questões como evento central; Teste de Domínio; drills clínicos. O app deve PUXAR para teste, não para releitura | A |
| Prática espaçada/distribuída | Cepeda et al. 2006 (meta, 254 estudos); Kerfoot et al. (spaced education RCTs em med ed) | Retenção; efeito de intervalo ótimo dependente do prazo | Curva d0→d21→manutenção + FSRS-lite adaptativo | A |
| Scheduler adaptativo (FSRS/modelos de memória) | Linha DSR/FSRS (Ye, Su et al., 2022–2024; benchmarks abertos do projeto open-spaced-repetition) | Previsão de recall superior a SM-2 em logs reais de flashcards | Sombra canônica como auditoria; CUIDADO: validado para cards atômicos, não para "tema" multimodal — manter como diagnóstico (decisão já correta no código) | B (p/ tema como unidade) |
| Interleaving | Rohrer & Taylor 2007; meta Brunmair & Richter 2019 (d≈0,42, heterogêneo) | Discriminação entre categorias/problemas | `interleavingPlanner` + ação prio na policy; melhor para temas confundíveis (`confusableSets` é aplicação correta) | B |
| Dificuldades desejáveis | Bjork & Bjork (framework) | Conceitual, amplamente corroborado | Justifica não suavizar demais a fila; rest deliberado ≠ falha | B |
| Carga cognitiva | Sweller; Sweller/van Merriënboer/Paas revisões | Design instrucional | Kill List do doc 05: menos superfícies simultâneas; Dashboard = 1 ação | A (princípio) |
| Feedback | Hattie & Timperley 2007; Wisniewski et al. 2020 | Efeito médio alto, condicional à qualidade | Comentário pós-questão, rubrica dos casos, `explain[]` do Mentor | A |
| Metacognição/calibração | Dunlosky et al. 2013; literatura de judgments of learning | Estudantes calibram mal; monitoramento melhora escolha de estudo | `calibration.js` + Brain Dump do Teste de Domínio; mostrar confiança×acerto | B |
| Aprendizagem autorregulada (SRL) | Zimmerman; Panadero 2017 (revisão de modelos) | Ciclo planejar-executar-refletir prediz desempenho | O ciclo do MedRev É um andaime de SRL — este é o enquadramento científico do produto inteiro | A (princípio) |
| Mastery learning | Kulik, Kulik & Bangert-Drowns 1990 (meta) | Ganhos consistentes quando avanço é condicionado a domínio | Teste de Domínio como gate de avanço/resgate | B |
| Prática deliberada | Ericsson et al. 1993 + críticas (Macnamara et al.) | Forte em domínios estruturados; efeito menor que o mito | Drills dirigidos por erro dominante; não prometer mágica | B |
| Progress testing / avaliação longitudinal | Schuwirth & van der Vleuten (med ed) | Medição longitudinal reduz cramming, melhora retenção | Simulados periódicos + trajetória do forecast | B |
| Illness scripts / raciocínio clínico | Schmidt & Rikers 2007; Custers 2015 | Modelo dominante de expertise diagnóstica | Reconstrução de script em 7 compartimentos + drills de aplicação | B |
| Script Concordance Test | Charlin et al. | Mede raciocínio sob incerteza; críticas psicométricas conhecidas | Usar como formato de exercício, não como métrica de alta confiança | C |
| Knowledge tracing (BKT/PFA) | Corbett & Anderson 1995; Pavlik et al. 2009 | Previsão de acerto em tutores; exige volume de dados | `mastery.js` — exibir como estimativa com incerteza; nunca como veredito | B/C |
| Aprender com erros | Metcalfe 2017 (revisão) | Erros + feedback corretivo beneficiam aprendizagem | Taxonomia de erros → ação corretiva (já implementado) | B |
| Dashboards de learning analytics | Bodily & Verbert 2017; Matcha et al. 2020 (revisões) | Evidência de impacto em aprendizagem é FRACA; risco de vaidade | Justifica cortar métricas sem ação (Kill List); dashboard deve prescrever, não exibir | B (contra excesso) |
| Gamificação | Sailer & Homner 2020 (meta): efeitos pequenos, heterogêneos, novidade decai | Motivação/engajamento, não aprendizagem | Conquistas/Trilha: SIMPLIFICAR; jamais XP por volume (incentivo perverso p/ perfil do usuário-alvo) | C |
| Previsão de nota/prontidão | Sem evidência direta para "previsão de aprovação" em residência BR | — | Manter banda+amostra+confiança (já existe); proibir promessa de aprovação | D |

## Limitações honestas (usar no marketing e no produto)

1. Quase toda a base é sobre retenção/desempenho em teste, não sobre aprovação em concurso de residência. Dizer: "aplicamos os princípios com melhor evidência"; nunca: "comprovado que aprova".
2. FSRS por TEMA (não por card) é extrapolação — o código já trata isso corretamente como sombra/diagnóstico. Validar com dados próprios antes de promover a motor principal.
3. Efeitos médios escondem variação individual; o Student Model existe exatamente para personalizar — mas precisa de amostra mínima (princípio 7) antes de afirmar qualquer coisa.
4. Registrar dados tem custo metacognitivo; cada campo de registro novo precisa pagar o próprio aluguel (métrica: tempo de registro por sessão < 90s).
