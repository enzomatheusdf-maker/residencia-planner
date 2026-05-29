**MedRev**

Especificação Técnica e Metodológica Completa

v8.0 — Guia para Desenvolvimento

*Documento confidencial • Uso interno*

| RESUMO EXECUTIVO O MedRev não deve ser mais um banco de questões com um cronograma colado. Ele deve ser a mentora algorítmica que o estudante de residência médica não tem acesso fácil: aquela que diz o que estudar, quando, quanto tempo dedicar — e por quê. Este documento define, com base em evidências científicas e em padrões de engajamento das plataformas mais viciantes do mundo, cada funcionalidade, decisão de design e dado a ser coletado para que o sistema alcance esse objetivo. *Fontes: literatura de ciência cognitiva (Roediger & Karpicke 2006; Bjork 1994; Ebbinghaus 1885/1964); FSRS v4-6 (open-spaced-repetition, 2023-2025); Nir Eyal — Hooked Model (2014); Self-Determination Theory (Deci & Ryan 2000); estudos de medicina-educação (PubMed, JACR 2023; Adv Health Sci Educ 2024); dados de engajamento Duolingo (Mazal 2024); análise do código-fonte MedRev v7.1.* |
| ----- |

# **PARTE 1 — A CIÊNCIA POR TRÁS DO MÉTODO**

Toda decisão de design e funcionalidade do MedRev deve ser ancorada nesta fundação. O desenvolvedor (Antigravity) deve entender não apenas o que fazer, mas por que cada elemento existe — caso contrário, refatorações futuras podem destruir os mecanismos que tornam o sistema eficaz.

## **1.1 O Problema Central do Estudante de Residência**

O estudante médico brasileiro enfrenta um paradoxo: tem mais conteúdo para estudar do que tempo disponível, e, ao mesmo tempo, dedica energia a revisões de temas que já domina enquanto negligencia os que realmente ameaçam sua aprovação. O MedRev precisa resolver exatamente esse paradoxo — ser o GPS do estudo, não o mapa.

**O erro mais fatal na preparação para residência** é iniciar o cronograma sem diagnóstico prévio de conhecimento. Você pode estar dedicando tempo igual a áreas que domina razoavelmente e negligenciando as muito fracas. Preparação sem diagnóstico é como tratar paciente sem exame físico.

## **1.2 Os Quatro Pilares da Aprendizagem de Alta Performance**

### **Pilar 1 — Espaçamento (Spacing Effect)**

A curva do esquecimento de Ebbinghaus (1885) demonstrou que a memória decai exponencialmente após o aprendizado inicial. A revisão espaçada — revisar no momento certo antes do esquecimento — é a intervenção mais validada da psicologia cognitiva para memória de longo prazo.

| *Algoritmos de repetição espaçada adaptativos são significativamente superiores às alternativas de revisão fixa. O espaçamento ótimo varia por item e por desempenho individual — um sistema robusto precisa personalizar o intervalo, não fixá-lo.* Enhancing human learning via spaced repetition optimization — PNAS (Reddy, Labutov, Joachims et al., Cornell University) |
| :---- |

O FSRS (Free Spaced Repetition Scheduler) v4-6 — implementado no MedRev como 'FSRS-Lite' — é o estado da arte atual. Ele modela três variáveis para cada tema:

* Estabilidade (S): quão lentamente o item é esquecido — aumenta com cada revisão bem-sucedida

* Dificuldade (D): complexidade intrínseca do material

* Recuperabilidade (R): probabilidade atual de recordar — é ela que determina quando revisar

| ⚠️ BUG | O MedRev v7.1 trava o intervalo máximo em 1.8× o offset base (Math.min). Isso destrói o benefício do FSRS: temas dominados nunca chegam a 60-90-120 dias, sobrecarregando a fila com revisões desnecessárias. Corrigir isso é a prioridade \#1 técnica. |
| :---: | :---- |

### **Pilar 2 — Prática de Recuperação (Retrieval Practice / Testing Effect)**

| *Estudantes que praticaram recuperação ativa obtiveram retenção de longo prazo substancialmente superior em relação aos que releram o material. O efeito do teste é um dos fenômenos mais robustos da psicologia cognitiva (d=0.73 para pré-teste vs d=0.35 para reler).* Roediger & Karpicke (2006) — Journal of Experimental Psychology: General |
| :---- |

| *O uso de retrieval practice (Anki, flashcards, questões) foi preditor independente de desempenho no USMLE Step 1, mesmo após controle de habilidades cognitivas e tempo de estudo total.* Student-directed retrieval practice predicts medical licensing exam performance — Medical Education (2015) |
| :---- |

Implicação para o MedRev: o Foco D0 com 6 microtarefas (pré-teste → leitura ativa → esqueleto → brain dump → questões → Anki) não é decoração — cada etapa é uma intervenção de recuperação validada. O brain dump D1 e as sessões D4/D7 são o espaçamento sobre essa recuperação.

### **Pilar 3 — Intercalação (Interleaving)**

| *Interleaving ('desejável dificuldade' de Bjork) melhora a aprendizagem indutiva e a transferência de conhecimento para contextos novos. Na medicina, isso é diretamente equivalente à capacidade de resolver casos clínicos atípicos — exatamente o que a prova de residência exige.* The application of spacing and interleaving approaches in the classroom — Chartered College of Teaching (2024) |
| :---- |

| *Combinar espaçamento \+ retrieval practice em treinamento de residentes elevou os escores médios de exame de 149 para 160 pontos. O efeito combinado é maior que a soma das partes.* Combining desirable difficulty strategies in residency training — Soderstrom et al. (2022), Medical Education |
| :---- |

O 'Interleaved' do D21 no MedRev é a implementação disso — mas está apenas agendado, não instruído. A plataforma deve orientar ativamente como fazer a revisão intercalada, não apenas dizer 'revise hoje'.

### **Pilar 4 — Metacognição e Calibração**

| *Em um estudo com 80 estudantes de medicina, a acurácia média avaliada por docentes variou entre 23-74%, enquanto a autoavaliação de confiança ficou entre 71-86%. Resultado: os estudantes são sistematicamente superconfiantes sobre o que sabem. Esse viés de excesso de confiança é a causa raiz de marcar um tema como 'dominado' quando ele ainda é uma lacuna crítica.* A metacognitive confidence calibration (MCC) tool — PubMed (2023) |
| :---- |

O MedRev captura acerto percentual por sessão, mas não detecta ativamente esse viés. Quando o estudante registra 80% de acerto em D4 mas 55% em D21, há um problema de metacognição que a plataforma deve nomear explicitamente — não apenas mostrar o número.

# **PARTE 2 — ARQUITETURA DE ENGAJAMENTO (POR QUE O USUÁRIO VOLTA TODO DIA)**

Não basta ter um método correto se o estudante não usa a plataforma. Esta parte aplica os princípios que tornam redes sociais e apps como Duolingo literalmente viciantes — mas a serviço da aprovação na residência, não do tempo de tela gratuito.

## **2.1 O Modelo Hooked (Nir Eyal, 2014\)**

Todo produto que cria hábito segue um ciclo de quatro fases. O MedRev precisa implementar cada uma delas conscientemente:

| Fase | O que Duolingo faz | O que MedRev deve fazer |
| :---- | :---- | :---- |
| 1\. Gatilho | Notificação personalizada: 'Você está a 1 lição de manter seu streak de 14 dias' | Email/push: 'Você tem 3 revisões críticas hoje — Pediatria está atrasada 2 dias'. Enviado no horário pessoal de estudo (aprendido nos primeiros 7 dias) |
| 2\. Ação | Uma lição em 2 minutos — mínimo atrito possível | Modo Foco: um botão, uma tarefa, começa em \<5 segundos |
| 3\. Recompensa Variável | Chests com XP variável, ligas, mascote que reage | Feedback pós-sessão com frase da 'mentora' personalizada ao desempenho real |
| 4\. Investimento | O streak faz você querer proteger o progresso | Cada sessão completa enriquece o modelo preditivo — plataforma fica 'mais sua' com o tempo |

## **2.2 Streak e Aversão à Perda**

| *Duolingo descobriu que usuários com streak de 10 dias tinham probabilidade de abandono dramaticamente menor. Uma única feature — a notificação de 'streak em risco' — foi o maior ganho de retenção individual da história da empresa. Usuários que apostam no streak têm 14% mais retenção no dia 14\.* How Duolingo reignited user growth — Jorge Mazal, Lenny's Newsletter (2024) |
| :---- |

O MedRev tem um streak visual (heatmap 35 dias \+ banner de fogo). O que falta:

* Notificação de streak em risco (enviada 2h antes do horário-limite do usuário)

* 'Streak Freeze' para emergências — o usuário ganha 1 por semana de consistência

* Streak Milestone: ao atingir 7, 21, 30, 60 dias — celebração especial e desbloqueio de insight da mentora

* Streak Recovery: perdeu o streak? A mentora mostra o streak anterior e diz 'Você chegou em X dias antes. Já está em 1 de volta. A meta é bater o recorde.'

## **2.3 Autonomia, Competência e Pertencimento (SDT)**

| *Motivação intrínseca sustentada requer três necessidades psicológicas: autonomia (sentir que escolho), competência (sentir que sou bom nisso) e pertencimento (sentir que faço parte de algo). Apps que fornecem feedback informacional (não apenas avaliativo) e escolha real geram maior engajamento de longo prazo que os que apenas premiam com pontos.* Self-Determination Theory — Deci & Ryan (2000). American Psychologist, 55(1), 68-78 |
| :---- |

O MedRev satisfaz parcialmente a competência (métricas de acerto) mas ignora autonomia e pertencimento:

* Autonomia: deixar o usuário escolher o horário de notificação, a meta diária mínima, quais especialidades priorizar no sprint — e a plataforma confirma essas escolhas com frases que devolvem o controle

* Competência: cada sessão deve terminar com uma frase específica sobre o que o usuário demonstrou ser bom naquele dia — não apenas 'parabéns'. Ex: 'Sua acurácia em GO passou de 68% para 74% esta semana. O D7 de Assistência ao Pré-Natal foi o ponto de virada.'

* Pertencimento: a mentora tem personalidade. Ela se lembra de sessões anteriores. Ela nota ausências. Ela celebra vitórias pequenas. Ela não é um dashboard — é uma voz.

## **2.4 Recompensas Variáveis e Dopamina**

Recompensas previsíveis não sustentam engajamento — recompensas variáveis sim. É o mecanismo das slot machines, e também do TikTok e do feed do Instagram. Para o MedRev:

* A frase da mentora pós-sessão nunca é a mesma. Ela varia com base no desempenho real — e às vezes aparece com um insight inesperado ('Notei que você vai muito melhor de manhã: 82% de acerto vs 61% à noite.')

* 'Insight do dia': uma descoberta sobre o perfil de aprendizado do usuário revelada após completar a fila do dia — aparece como surpresa, não como seção fixa

* Desbloqueio progressivo: funcionalidades avançadas (True Retention, Bleeding Score, Zonas de Alerta) aparecem à medida que o usuário tem dados suficientes para que façam sentido — não todas de uma vez

# **PARTE 3 — COLETA DE DADOS E INDIVIDUALIZAÇÃO DA JORNADA**

A mentora só é boa se conhece o estudante. Esta seção define quais dados coletar, como coletá-los sem atritar a experiência, e o que fazer com cada um deles. Todos os dados devem servir para uma única finalidade: fazer a próxima recomendação mais precisa que a anterior.

## **3.1 Arquitetura de Dados — O que Coletar**

### **Dados Estáticos (coletados no onboarding)**

* Nome e data da prova-alvo

* Provas-alvo (ENAMED, USP-SP, UNIFESP, etc.) com pesos de importância

* Horário preferido de estudo (manhã / tarde / noite)

* Tempo disponível por dia (em horas)

* Plataforma de questões principal (MedEvo, Medcel, etc.)

* Nível de conhecimento inicial por especialidade (auto-declarado, depois calibrado)

### **Dados por Sessão (coletados ao finalizar cada step D0-D21)**

| Campo | Como coletar | Para que usar |
| :---- | :---- | :---- |
| acerto (%) | Input numérico ou slider | Atualizar estabilidade FSRS e True Retention |
| questoes (n) | Input numérico | Calcular volume total e velocidade acertos/hora |
| tempoMin | Cronômetro automático no Modo Foco | Calcular eficiência e detectar sessões muito curtas |
| ansiedade (1-5) | Emoji rápido pós-sessão (opcional) | Correlacionar ansiedade com desempenho |
| cansaco (1-5) | Emoji rápido pós-sessão (opcional) | Detectar horários com baixo rendimento |
| confianca (1-5) | Pergunta única: 'Como você se sente sobre esse tema?' | Detectar viés metacognitivo (comparar com acerto real) |
| dificuldade (1-5) | Pergunta única pós-sessão | Ajustar parâmetro D no FSRS individual |
| motivosErro\[\] | Checklist: lacuna / raciocínio / distração / não vi | Gerar diagnóstico por tipo de erro (não apenas volume) |
| turno | Inferido do timestamp da sessão | Recomendar horário ótimo de estudo |

| 📌 REGRA | Nunca pedir mais de 2 campos opcionais por sessão. Rotacionar quais campos opcionais aparecem para não criar fadiga. Campos obrigatórios: apenas acerto e questões. |
| :---: | :---- |

### **Dados de Comportamento (coletados passivamente pelo sistema)**

* Horário exato de cada sessão → detectar horário pico de performance

* Tempo entre início da sessão e primeiro input → detectar procrastinação de abertura

* Taxa de abandono (sessões iniciadas mas não finalizadas) por horário e especialidade

* Padrão de streak: dias da semana com maior taxa de falha → recomendar 'dia de folga estratégico'

* Correlação confianca × acerto: se consistentemente confiança \> acerto → alerta de viés metacognitivo

* Velocidade de progressão por especialidade vs média esperada MEDCOF

## **3.2 O Modelo Preditivo da Mentora — Cálculos Necessários**

Com os dados acima, o sistema calcula — em tempo real — os seguintes índices que alimentam as recomendações:

| 🎯 Score Algorítmico (já existe, refinar)  \[REFINAR\] Fórmula atual: (1 \- acertoMedio) × peso\_importancia × urgencia. Adicionar: × (1 \+ dias\_atraso/7) para aumentar urgência progressivamente. Incluir fator\_turno: se o usuário vai melhor de manhã, temas diamante devem ir para o turno matutino. |
| :---- |

| 🩸 Bleeding Score por Especialidade (já existe, sem ação)  \[REFINAR\] Já calculado em calcBleedingScore(). Falta: quando uma especialidade está \<60% por 2+ semanas, a mentora deve bloquear marcação de novos temas nela e forçar rerevisão dos fracos. Implementar threshold de 60% como gatilho de alerta crítico. |
| :---- |

| 🧠 Índice de Calibração Metacognitiva (NOVO)  \[NOVO\] Para cada tema: comparar confianca média declarada com acerto real. Se delta \> 20pts por 2 sessões seguidas, o usuário está superestimando o domínio. Gerar alerta: 'Você declarou confiança 4/5 em GO mas está acertando 58%. Isso é o padrão do examinando que é reprovado por excesso de confiança.' |
| :---- |

| ⏱️ Eficiência (acertos/hora)  \[NOVO\] Calcular acertos por hora de sessão (já tem tempoMin e questoes/acerto). Comparar com meta ENAMED (40 certas/hora). Mostrar evolução semanal. Quando abaixo de 30: 'Sua velocidade está 25% abaixo do mínimo para o ENAMED. Analise se está relendo questões ou ficando preso em raciocínio.' |
| :---- |

| 📅 Projeção de Aprovação (usa calcProjecao — sem destaque)  \[NOVO\] Com o ritmo atual, quantos temas Diamante terão todos os steps D0-D21 concluídos até a data da prova? Mostrar como headline da home. 'No ritmo atual: 74% dos Diamantes dominados na prova. Faltam 12 semanas. Os 8 temas críticos que ainda não iniciou estão listados abaixo.' |
| :---- |

## **3.3 A Personalização Progressiva — Como a Plataforma Aprende**

A jornada de personalização tem três fases. O sistema deve comunicar ao usuário em qual fase está:

| Fase | Dados disponíveis | O que a mentora pode fazer | Comunicar ao usuário |
| :---- | :---- | :---- | :---- |
| Fase 1 (Dias 1-7) | Apenas declarações do onboarding | Recomendar ordem MEDCOF por prioridade da prova-alvo | 'Estou calibrando. Complete as primeiras sessões para eu aprender seu perfil.' |
| Fase 2 (Dias 8-30) | 10+ sessões completas com dados biométricos | Detectar horário ótimo, especialidades fortes/fracas, taxa de calibração | 'Já conheço seu ritmo. Ajustei a fila para seus horários de pico.' |
| Fase 3 (30+ dias) | Padrões de esquecimento individuais, viés metacog. | Personalizar parâmetros FSRS por tema, prever riscos de abandono, alertar viés | 'Perfil completo. A fila agora é 100% sua.' |

# **PARTE 4 — ESPECIFICAÇÃO DE FUNCIONALIDADES (O QUE CONSTRUIR)**

Esta seção descreve cada funcionalidade com critérios de aceitação precisos. O Antigravity deve implementar na ordem de prioridade indicada.

## **PRIORIDADE 1 — Correções Técnicas Críticas (Sem isso, tudo mais é inútil)**

### **F1.1 — Correção do Motor FSRS**

| 🔴 CRÍTICO | BUG: nextInterval() trava o teto em baseOffset × 1.8, destruindo o espaçamento de longo prazo. Temas dominados nunca chegam a intervalos acima de \~40 dias. |
| :---: | :---- |

Correção — substituir a função em src/core/fsrs.js:

// ANTES (com bug):export function nextInterval(S, baseOffset) {  const raw \= (S / FSRS\_FACTOR) \* (DESIRED\_RETENTION \*\* (1/FSRS\_DECAY) \- 1);  return Math.round(Math.min(Math.max(raw, baseOffset\*0.5), baseOffset\*1.8));}// DEPOIS (corrigido):export function nextInterval(S, baseOffset) {  const raw \= (S / FSRS\_FACTOR) \* (DESIRED\_RETENTION \*\* (1/FSRS\_DECAY) \- 1);  const floor \= Math.max(1, Math.round(baseOffset \* 0.5));  return Math.round(Math.max(raw, floor)); // sem teto}

Também corrigir os deltas de updateStability para crescimento mais agressivo em acertos:

// ANTES: { again: \-0.8, hard: 0.05, good: 0.3, easy: 0.7 }// DEPOIS (calibrado para exames médicos de alta-retenção):const deltas \= { again: \-0.8, hard: 0.1, good: 0.5, easy: 1.0 };

### **F1.2 — Corrigir markD0FromCronograma**

| 🔴 CRÍTICO | BUG: Clicar 'Iniciar Ciclo Hoje' no Cronograma marca D0 com acerto: 1.0 automático, sem o usuário ter feito nada. Isso polui True Retention e Acerto Médio com dados falsos, fazendo a mentora dar conselhos errados. |
| :---: | :---- |

Correção: markD0FromCronograma deve apenas registrar que o ciclo foi iniciado (data D0 \= hoje), sem marcar done=true. O done=true só ocorre quando o usuário finaliza a SessaoPage com acerto registrado.

### **F1.3 — Persistência de Dados (Firebase como fonte de verdade)**

| 🔴 CRÍTICO | Dado importante: o store Zustand persiste em localStorage ('reviewflow-v6'). Trocar de navegador, limpar cache ou usar outro dispositivo \= perda de 150 dias de dados de revisão. Para um usuário estudando para prova em outubro, isso é catastrófico. |
| :---: | :---- |

Solução: sincronizar o estado Zustand com Firestore em tempo real. Estratégia recomendada:

1. Firebase Authentication (já existe) → autenticar usuário

2. Na hydration do Zustand, carregar dados do Firestore se disponíveis

3. A cada markStep/addTema/addSim, fazer write para Firestore em background (sem bloquear UI)

4. Fallback gracioso: se offline, usar localStorage; sync ao reconectar

5. Definir Security Rules: autenticado só lê/escreve os próprios dados (users/{uid}/data)

## **PRIORIDADE 2 — A Voz da Mentora**

Este é o coração do diferencial do MedRev. A mentora não é um chatbot — é um conjunto de regras que geram frases contextuais baseadas nos dados reais do usuário.

### **F2.1 — Engine de Frases da Mentora**

Implementar um módulo src/core/mentora.js que recebe o estado atual do usuário e retorna frases contextuais. As frases devem:

* Usar o nome do usuário

* Referenciar dados específicos (tema, especialidade, acerto real, data)

* Nunca repetir a mesma frase em 7 dias

* Ter 3-5 variações por situação (randomizadas)

* Tom: direto, sem paternalismo, como um colega residente aprovado

Situações que disparam frases da mentora:

| Situação | Exemplo de frase gerada |
| :---- | :---- |
| Sessão concluída (acerto ≥ 80%) | '{Nome}, {tema} está consolidado. Acerto {X}% — acima da meta. O FSRS agendou D7 para {data}. No ritmo atual você domina esse tema antes da prova.' |
| Sessão concluída (acerto 60-79%) | '{tema} está progredindo. {X}% é sólido, mas a meta é 80%. O que mais te pegou? Revise os erros por raciocínio antes do D7 — não deixa pra depois.' |
| Sessão concluída (acerto \< 60%) | '{tema} está sangrando. {X}% é abaixo do threshold crítico. Eu bloqueei a progressão — você refaz o D0 antes de avançar. Esse é exatamente o tema que reprova.' |
| Tema atrasado \> 3 dias | '{tema} está {N} dias atrasado. A curva de esquecimento já reduziu a retriebabilidade. Quanto mais espera, mais precisa revisar. Hoje. Agora.' |
| Streak atingido (7, 21, 30 dias) | '{N} dias seguidos. Isso não é motivação — é sistema. Você já internalizou o ritmo. A partir daqui o estudo fica mais fácil, não mais difícil.' |
| Viés metacognitivo detectado | 'Você declarou confiança 4/5 em {esp}, mas está acertando {X}%. Delta de {D} pontos por {N} sessões. Isso é excesso de confiança — o maior inimigo da aprovação.' |
| Sessão concluída (primeiro acesso do dia) | 'Começou\! O primeiro passo é o mais difícil. Você tem {N} itens na fila. Isso vai levar aprox. {T} minutos.' |
| Meta diária batida | 'Fila zerada. Você fez {N} questões hoje. Cada questão hoje é uma questão que você vai acertar na prova.' |

| 📌 IMPLEMENTAÇÃO | A engine de frases deve ser pura (sem efeitos colaterais). Recebe: { userName, tema, acerto, streak, especialidade, diasAtraso, confiancaMedia } → retorna string. Manter um Set de frases recentes por usuário para evitar repetição. Pode ser local — não precisa de IA externa. |
| :---: | :---- |

### **F2.2 — Painel 'Diagnóstico da Mentora' (nova seção no Dashboard)**

Substituir ou complementar o dashboard vazio de 0/0 por uma seção de diagnóstico ativo. Deve aparecer sempre, mesmo com poucos dados:

* Dias 1-7: 'Ainda estou aprendendo seu perfil. Complete mais {N} sessões para eu gerar seu primeiro diagnóstico.'

* Dias 8-30: 3 insights baseados em dados reais (horário, especialidade mais fraca, tendência de acerto)

* Dia 30+: Diagnóstico completo com projeção de aprovação, alertas críticos e recomendação da semana

### **F2.3 — CycleCompleteModal com Diagnóstico Real**

O modal atual apenas mostra 'Ciclo Completo\! Acerto Médio: X%'. Expandir para:

* Gráfico de evolução de acerto por step (D0 → D1 → D4 → D7 → D21)

* Comparação com a média do usuário nessa especialidade

* Frase da mentora baseada na curva (melhorou? estabilizou? regrediu?)

* Próxima ação recomendada (qual tema iniciar agora com base no score algorítmico)

## **PRIORIDADE 3 — Modo Foco de Verdade**

### **F3.1 — Modo Foco como Sessão Única**

O Modo Foco atual apenas colapsa a barra lateral. O Modo Foco v8 é uma tela completamente diferente:

* Tela cheia. Sem sidebar, sem navbar, sem cards de métricas.

* Mostra: nome do tema (especialidade colorida), step atual (D0/D1/D4/D7/D21), instrução da etapa, cronômetro.

* A mentora escolhe automaticamente o item de maior score na fila — o usuário não escolhe.

* Ao finalizar, transição suave para o próximo item da fila (sem voltar ao dashboard).

* Botão de saída discreto (canto superior): 'Pausar sessão'.

* Som ambiente opcional (lofi, chuva, silêncio) — preferência salva.

| 💡 POR QUÊ | A fadiga de decisão é o maior assassino da consistência. Cada vez que o usuário precisa escolher 'o que estudar agora', gasta energia cognitiva que deveria ir para o conteúdo. O Modo Foco elimina essa decisão completamente. É a diferença entre 'abrir o app e estudar' vs 'abrir o app, avaliar a fila, decidir, iniciar'. |
| :---: | :---- |

### **F3.2 — Integração da SessaoPage no Modo Foco**

A SessaoPage (microtarefas do D0) deve ser incorporada ao Modo Foco com:

* Cronômetro por step (pré-definido: pré-teste 10min, leitura 45min, esqueleto 10min, brain dump 3min, questões 25min, Anki 10min)

* Alerta sonoro suave ao terminar o tempo de cada step

* Barra de progresso visual das 6 etapas

* Botão 'Estou levando mais tempo' (estende o timer sem quebrar o fluxo)

## **PRIORIDADE 4 — Onboarding Interativo e Contextual**

### **F4.1 — Onboarding 'Mãos na Massa' (2 camadas)**

O onboarding atual coleta cadastro. O novo ensina o método fazendo. Estrutura:

CAMADA 1 — Setup rápido (3 telas, não 5):

6. Nome \+ prova-alvo (data e instituição)

7. Horário preferido de estudo \+ tempo disponível/dia

8. Plataforma de questões principal

CAMADA 2 — Tour 'live' com tema-demo (Apendicite Aguda):

9. Tela do Cronograma → balão animado: 'Esse é o Cronograma MEDCOF. Cada card é um tema com ciclos D0→D21. Clique em Iniciar Ciclo no tema de Apendicite para eu mostrar como funciona.'

10. SessaoPage do demo → balão: 'Esse é o Foco D0. São 6 etapas científicas. Cada etapa tem uma razão — clique em Análise de Evidência para ver o porquê.'

11. Finalizar demo → balão no Dashboard: 'Viu as datas de D1, D4, D7, D21 que apareceram? Eu calculei quando você vai esquecer e agendei as revisões. Você nunca mais decide quando revisar — eu decido.'

12. Confetti \+ frase da mentora: 'Você completou o demo. Agora faça de verdade. Qual tema quer iniciar primeiro?'

| 📌 TÉCNICO | O tema-demo usa dados hardcoded (não salva no store real). Ao final, o tour chama setOnboardingDone() e limpa os dados de demo. Usar react-joyride ou implementação própria com portals React para os balões. |
| :---: | :---- |

### **F4.2 — Tooltips Contextuais Progressivos (não apenas no Help)**

Regra: a primeira vez que o usuário vê cada elemento importante, aparece um tooltip contextual único (não repetível). Implementar com um Set de 'vistos' no store:

| Elemento | Tooltip contextual (primeira vez) |
| :---- | :---- |
| Fila de Prioridade Inteligente | 'Esse score é: importância do tema × quanto você errou × urgência. Quanto maior, mais precisa estudar agora. Eu recalculo a cada sessão.' |
| True Retention D21 | 'Essa é sua retenção real: acertos nas revisões de 21+ dias. É o único número que importa de verdade — o que você vai lembrar na prova.' |
| Bleeding Score | 'Essas são suas especialidades com pior desempenho relativo. Se você continuar ignorando, vão sangrar pontos na prova.' |
| Brain Dump D1 | 'Material fechado, 5 minutos, escreva tudo. Não precisa ser perfeito. O esforço de lembrar é o que consolida — não a qualidade do que saiu.' |
| Análise de Evidência Científica | 'Cada etapa do Foco D0 tem uma fonte de pesquisa cognitiva. Clique para ver por que fazemos cada coisa — não é protocolo arbitrário.' |

# **PARTE 5 — DESIGN DE INTERFACE E EXPERIÊNCIA**

## **5.1 Princípios de Design do MedRev**

| Princípio | O que significa | Como implementar |
| :---- | :---- | :---- |
| Zero decisão desnecessária | O usuário nunca deve parar para pensar 'o que faço agora?' | A home sempre mostra UMA ação principal em destaque. Modo Foco elimina a escolha de tema. |
| Densidade progressiva | Novatos veem menos; experts veem mais | modoSimples já existe. Adicionar Fase 1/2/3 de personalização que desbloqueia features gradualmente. |
| Feedback imediato e específico | Cada ação tem retorno visual ou textual em \<200ms | Animações de conclusão, frases da mentora, atualização visual do score. |
| Hierarquia cromática rigorosa | Uma cor por função, sem exceções | Violeta \= ação primária; Verde \= sucesso/dominado; Vermelho \= alerta/urgência; Cinza \= secundário. |
| Legibilidade acima de estética | Dark mode com contraste adequado | Verificar contraste WCAG AA em todos os textos. Usar font-size mínimo 13px para labels. |

## **5.2 Anatomia da Home (Dashboard v8)**

O Dashboard deve ser repensado com uma hierarquia clara de 4 zonas:

* ZONA 1 — Ação do dia (topo, 100% da largura): 'Você tem 5 revisões hoje' \+ botão 'Iniciar Foco' em destaque total. Se fila zerada: celebração \+ projeção.

* ZONA 2 — Diagnóstico da Mentora (faixa central): 2-3 insights da semana. Nunca vazia (usa texto de calibração nos primeiros 7 dias).

* ZONA 3 — Métricas (grid 3 colunas): apenas as 3 mais relevantes. Acerto Médio / Temas Dominados / True Retention. Tooltip explicativo em cada uma.

* ZONA 4 — Detalhe (rodapé): Fila completa, heatmap, bleeding score — colapsável para não sobrecarregar o estado inicial.

| 📌 ESTADO VAZIO | Quando temas \= 0: mostrar APENAS o CTA de onboarding (tour \+ 'iniciar primeiro tema'). Todos os cards de métrica devem desaparecer — mostrar 0/0 em 8 lugares diferentes é paralisante e sem significado. |
| :---: | :---- |

## **5.3 Micro-interações Essenciais**

* Ao concluir um step: animação suave de checkmark \+ som opcional (tick) \+ atualização instantânea do score

* Ao atingir meta diária: confetti leve (não excessivo) \+ frase da mentora

* Ao detectar streak em risco: badge pulsante na navbar (não popup intrusivo)

* Ao abrir tema com viés metacognitivo detectado: borda âmbar no card \+ tooltip explicativo

* Loading states: esqueletos animados (não spinners) para todas as listas

## **5.4 Remover Ruído Visual**

Elementos a remover ou esconder por padrão:

* 'v7 • 1.07' dentro da SessaoPage — versão só aparece em Settings

* 'v7.1' no header — remover completamente da interface do usuário

* Cards de métrica com valor '—' ou '0/0' quando não há dados — substituir por CTA

* Saturation de cores: todos os elementos secundários devem usar tons de cinza, não 6 cores vibrantes competindo

* Labels em UPPERCASE TRACKING no Dashboard: reduzir tracking para 0.05em (legibilidade)

# **PARTE 6 — ROADMAP DE IMPLEMENTAÇÃO**

Ordem de execução recomendada, com estimativas de complexidade e impacto:

| \# | Funcionalidade | Complexidade | Impacto | Arquivo(s) principal(is) |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Corrigir nextInterval() (sem teto) | Baixa | Crítico | src/core/fsrs.js |
| 2 | Corrigir markD0FromCronograma | Baixa | Crítico | src/core/store.js |
| 3 | Firebase como fonte de verdade | Alta | Crítico | src/services/firebase.js \+ store.js |
| 4 | Engine de frases da mentora (src/core/mentora.js) | Média | Alto | mentora.js (novo) \+ Dashboard.jsx \+ Modals.jsx |
| 5 | Índice de Calibração Metacognitiva | Média | Alto | useMetrics.js \+ Dashboard.jsx |
| 6 | Projeção de Aprovação na home | Média | Alto | useMetrics.js (calcProjecao) \+ Dashboard.jsx |
| 7 | Modo Foco (tela cheia, sem decisão) | Alta | Alto | FocusMode.jsx (novo) \+ App.js |
| 8 | Onboarding 2 camadas (tour interativo) | Alta | Alto | Modals.jsx (OnboardingModal) \+ nova lógica de tour |
| 9 | Tooltips contextuais progressivos | Média | Médio | store.js (Set de vistos) \+ todos os componentes |
| 10 | Cronômetro automático na SessaoPage | Baixa | Médio | SessaoPage.jsx \+ stepDefinitions.js |
| 11 | Painel de Diagnóstico da Mentora | Média | Médio | Dashboard.jsx \+ mentora.js |
| 12 | Notificação de streak em risco | Alta | Médio | Requer PWA ou email — nova infraestrutura |
| 13 | CycleCompleteModal com gráfico de evolução | Média | Médio | Modals.jsx |
| 14 | Hierarquia cromática rigorosa (violet/red/green) | Baixa | Médio | index.css \+ todos os componentes |
| 15 | Streak Freeze \+ Streak Recovery | Média | Médio | store.js \+ Dashboard.jsx |
| 16 | Eficiência (acertos/hora) \+ meta ENAMED | Baixa | Médio | useMetrics.js \+ StatsPanel.jsx |
| 17 | Score horário (turno ótimo de estudo) | Média | Baixo | useMetrics.js \+ store.js |
| 18 | Estado vazio redesenhado (zero temas) | Baixa | Baixo | Dashboard.jsx |

## **6.1 O que NÃO construir**

Para manter o foco no que diferencia o MedRev:

* Banco de questões integrado — o MedEvo já faz isso melhor e o usuário não precisa trocar

* Chat com IA em tempo real — a voz da mentora via regras é mais previsível e menos propensa a alucinação

* Leaderboard social — você estuda para residência, não para bater o amigo; isso cria ansiedade improdutiva

* Vídeoaulas integradas — fora do escopo; redirecionar para a plataforma de conteúdo

* Modo offline completo — localStorage já resolve o básico; sincronização lazy é suficiente

# **PARTE 7 — REFERÊNCIAS CIENTÍFICAS**

Todas as afirmações de design e método neste documento são baseadas nas seguintes fontes:

### **Ciência Cognitiva e Aprendizagem**

* Ebbinghaus, H. (1885/1964). Memory: A contribution to experimental psychology. Dover.

* Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249-255.

* Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties. Psychology and the Real World.

* Reddy, S., Labutov, I., Joachims, T., & Banerjee, S. (2016). Unbounded Human Learning: Optimal Scheduling for Spaced Repetition. Cornell University (KDD 2016).

* Reddy, S., et al. (2019). Enhancing human learning via spaced repetition optimization. PNAS, 116(10), 3988-3993. PMC6410796.

* Pastötter, B., & Bäuml, K-H. T. (2014). Retrieval practice enhances new learning: the forward effect of testing. Frontiers in Psychology, 5, 286\. PMC3983480.

* Eglington, L.G., & Kang, S.H.K. (2017). Interleaving benefits learning in autistic individuals. Frontiers in Psychology. (Interleaving in categorization learning).

### **Educação Médica e Repetição Espaçada**

* Deng, F., et al. (2015). Student-directed retrieval practice is a predictor of medical licensing examination performance. Perspectives in Medical Education, 4(6), 307-311.

* Trumble, E., Lodge, J., Mandrusiak, A., & Forbes, R. (2024). Systematic review of distributed practice and retrieval practice in health professions education. Advances in Health Sciences Education, 29(2), 689-714.

* Cooper, S., et al. (2023). The Effect of Spaced Repetition Learning Through Anki on Medical Board Exam Performance. University Library System, University of Pittsburgh.

* Gilbert, M. M., et al. (2023). A Cohort Study Assessing the Impact of Anki as a Spaced Repetition Tool on Academic Performance in Medical School. Medical Science Educator, 33(4), 955-962. PMC10403443.

* Wothe, J. K., et al. (2023). Academic and Wellness Outcomes Associated with use of Anki Spaced Repetition Software in Medical School. Journal of Medical Education and Curricular Development. PMC10176558.

* Systematic Review, JACR (2023). The Effectiveness of Spaced Learning, Interleaving, and Retrieval Practice in Radiology Education. J Am Coll Radiol, 20, 1092-1101.

### **Metacognição**

* Bielaczyc, K., Pirolli, P.L., & Brown, A.L. (1995). Training in self-explanation and self-regulation strategies. Cognition and Instruction, 13(2), 221-252.

* Eva, K. W., & Regehr, G. (2008). 'I'll never play professional football' and other fallacies of self-assessment. Journal of Continuing Education in the Health Professions.

* Turner, M. et al. (2023). A metacognitive confidence calibration (MCC) tool. American Journal of Physiology \- Advances in Physiology Education, 47(1). PubMed 35981722\.

### **Psicologia do Engajamento e Design de Produto**

* Eyal, N. (2014). Hooked: How to Build Habit-Forming Products. Portfolio/Penguin.

* Deci, E. L., & Ryan, R. M. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. American Psychologist, 55(1), 68-78.

* Mazal, J. (2024). How Duolingo reignited user growth. Lenny's Newsletter. (Dados internos de engajamento: streak mechanic, D14 retention \+14% com streak wager).

* Chou, Y-K. (2015). Actionable Gamification: Beyond Points, Badges, and Leaderboards. Octalysis Media.

* Fogg, B.J. (2009). A behavior model for persuasive design. Proceedings of the 4th International Conference on Persuasive Technology.

### **FSRS e Algoritmos de Repetição Espaçada**

* open-spaced-repetition/free-spaced-repetition-scheduler. GitHub (2023-2025). FSRS v4-6 — Free Spaced Repetition Scheduler.

* open-spaced-repetition/fsrs4anki. GitHub Wiki — The Optimal Retention (2024).

* RemNote Documentation (2025). The FSRS Spaced Repetition Algorithm. help.remnote.com.

* Ye, Z. (2022). A Stochastic Shortest Path Algorithm for Optimizing Spaced Repetition Scheduling. ACM KDD 2022\. (FSRS mathematical foundation).

MedRev v8.0 — Especificação Técnica

*Gerado com base em auditoria do código-fonte v7.1 \+ pesquisa em literatura científica revisada por pares*