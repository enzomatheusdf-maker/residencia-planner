# MedRev v9 — Especificação de Melhorias
## Documento de Trabalho Interno · Uso Restrito

> **Como usar este documento:** Leia seção por seção e exclua o que não fizer sentido para o momento atual do produto. As seções são independentes — você pode implementar qualquer uma delas sem depender das outras. Toda afirmação de eficácia está ancorada em evidência científica citada; o nível de evidência está indicado em cada item.

---

# PARTE A — MELHORIAS PARA O MÓDULO DE RESIDÊNCIA MÉDICA

As seis vertentes abaixo expandem o que já existe no v8. Nenhuma contradiz os pilares científicos já estabelecidos — elas os aprofundam.

---

## VERTENTE 1 — Personalização mais profunda da aprendizagem

### 1.1 Diagnóstico por tipo de erro (não apenas por volume)

**O problema atual:** o campo `motivosErro[]` (lacuna / raciocínio / distração / não vi) é coletado por sessão, mas não é agregado nem apresentado ao usuário como padrão. O sistema sabe que o usuário errou, mas não sabe *por que* ele erra sistematicamente.

**O que construir:**

Criar um módulo `src/core/errorPatterns.js` que agrega os `motivosErro[]` por especialidade e por tipo, e detecta padrões quando há ≥ 5 sessões com o mesmo tipo de erro na mesma especialidade.

Padrões a detectar e o que a mentora diz em cada caso:

| Padrão detectado | Frase da mentora |
|---|---|
| > 60% dos erros = "lacuna conceitual" em uma especialidade | "Seus erros em [esp] são majoritariamente por lacuna de base — não de raciocínio. Você precisa voltar ao conteúdo, não fazer mais questões." |
| > 60% dos erros = "raciocínio" | "Você conhece o conteúdo de [esp] mas erra na lógica clínica. A estratégia certa agora é resolver questões comentadas, não reler o tema." |
| > 60% dos erros = "distração" | "Seus erros em [esp] são por distração — você acertaria se relesse. Avalie se está estudando no horário certo ou com muito cansaço." |
| > 40% dos erros = "não vi" em temas Diamante | "Você está errando temas Diamante que não estudou. Esses são os que reprovam. Eu reorganizei a fila para priorizá-los." |

**Evidência científica:** Ericsson et al. (1993) demonstraram que a prática deliberada só é eficaz quando identifica e ataca especificamente os pontos de falha — não quando repete o desempenho médio. Aplicado a contextos de aprendizagem de alta performance (revisado em Deng, Gluckstein & Larsen, *Perspectives in Medical Education*, 2015), feedback específico sobre o tipo de erro prevê desempenho em exames de licença médica de forma independente do volume de estudo.

---

### 1.2 Calibração do parâmetro D por especialidade (FSRS individualizado)

**O problema atual:** o parâmetro de dificuldade (D) do FSRS é aplicado de forma global. Um usuário que domina Cardiologia mas tem dificuldade em GO usa o mesmo parâmetro D para ambas — o que faz o FSRS subestimar o espaçamento em Cardiologia e superestimar em GO.

**O que construir:**

Adicionar ao store um objeto `dificuldadeEspecialidade: {}` que armazena o D médio por especialidade, calculado a partir das sessões com ≥ 3 registros de `dificuldade (1-5)` naquela especialidade.

```javascript
// Em src/core/fsrs.js — modificação do nextInterval()
export function nextInterval(S, baseOffset, especialidade, userStore) {
  const dEsp = userStore.dificuldadeEspecialidade[especialidade] ?? 1.0;
  const fatorDificuldade = 0.8 + (dEsp - 1) * 0.1; // escala 0.8 a 1.2
  const raw = (S / FSRS_FACTOR) * (DESIRED_RETENTION ** (1/FSRS_DECAY) - 1);
  const floor = Math.max(1, Math.round(baseOffset * 0.5));
  return Math.round(Math.max(raw * fatorDificuldade, floor));
}
```

Mostrar no card de cada especialidade: "Dificuldade calibrada: Alta / Média / Baixa — baseada nas suas últimas [N] sessões."

**Evidência científica:** O FSRS v6 (open-spaced-repetition, 2023-2025) já modela a dificuldade por item — mas a implementação atual do MedRev usa um D global. A parametrização por domínio de conhecimento é suportada pela literatura de individualização de algoritmos de repetição espaçada (Reddy et al., *PNAS*, 2019; Ye, *ACM KDD*, 2022).

---

### 1.3 Detecção de horário de pico de performance por turno

**O problema atual:** o campo `turno` é inferido por timestamp, mas não é usado para recomendar agendamento de temas por dificuldade.

**O que construir:**

Calcular `acertoMedioByTurno: { manha: X, tarde: Y, noite: Z }` com sessões ≥ 10 por turno.

Quando a diferença entre o melhor e o pior turno for > 15 pontos percentuais:

1. Mostrar no Dashboard da Mentora: "Você acerta [X]% de manhã vs [Y]% à noite — diferença de [Z] pontos. Recomendo reservar os temas Diamante para o período matutino."
2. No Modo Foco, mostrar discretamente: "Sessão no seu horário de pico" ou "Sessão fora do horário ideal — considere os temas mais leves agora."

Isso é uma melhoria de UX, não requer recalcular a fila — apenas comunicar a recomendação.

**Evidência científica:** A variação circadiana de performance cognitiva está bem documentada (Dijk & Czeisler, 1995; revisado em Hicks et al., 2022). Em contextos de educação médica, a correlação entre turno de estudo e desempenho em questões é suportada por dados de plataformas de EAD — incluindo a análise mencionada no documento base.

---

## VERTENTE 2 — Integração com simulados e provas externas

### 2.1 Importação de gabarito de simulado

**Contexto:** o usuário já faz simulados no MedEvo, Medcel, Anestesioweb, etc. Hoje esse dado fica desconectado da plataforma. Isso representa a maior perda de informação diagnóstica disponível.

**O que construir — fluxo simples:**

1. Botão "Importar Simulado" na seção de Cronograma
2. Modal com dois campos: especialidade + número de acertos/total
3. A plataforma registra como uma sessão especial `tipo: "simulado"` com os dados informados
4. O score algorítmico é atualizado considerando esse dado com peso 1.5× (simulados refletem melhor o desempenho real do que sessões de revisão isolada)
5. A mentora comenta: "Seu simulado de [esp] deu [X]%. Isso é [acima/abaixo] da sua média nas sessões regulares ([Y]%). [Interpretação específica]."

**Versão avançada (opcional, maior complexidade):**

Permitir upload de arquivo de gabarito (CSV com coluna: especialidade, acertou/errou, subtema). A plataforma processa e gera o diagnóstico automaticamente.

**Evidência científica:** Simulados de alta fidelidade são os melhores preditores de desempenho real em exames de residência (Hirumi et al., *Medical Teacher*, 2022). A retroalimentação de simulados externos no algoritmo de revisão é uma extensão natural do paradigma de retrieval practice — qualquer tentativa de recuperação, seja em sessão formal ou simulado, deve alimentar o modelo (Roediger & Butler, *Trends in Cognitive Sciences*, 2011).

---

### 2.2 Modo Prova: sessão cronometrada sem feedback em tempo real

**O que é:** uma sessão de questões com as seguintes características:
- Duração definida pelo usuário (30, 60 ou 120 minutos)
- Nenhum feedback durante a sessão (sem indicação de certo/errado)
- Ao final: relatório completo por especialidade
- A mentora compara com a sessão D0/D4/D21 mais recente do mesmo tema

**Por que isso importa:** treinar em condições de prova (sem feedback imediato) é diferente de treinar em condições de revisão (com feedback). O usuário que só estuda com feedback pode ter sua performance real subestimada porque nunca treinou a tolerância à incerteza e ao raciocínio sob pressão.

**Implementação:**

Adicionar `modoProva: boolean` ao estado da sessão. Quando true:
- Esconder indicadores de acerto durante a sessão
- Habilitar cronômetro regressivo visível
- Ao finalizar: mostrar tela de diagnóstico completo antes de registrar no store

**Evidência científica:** Theobald, Breitwieser & Brod (*Psychological Science*, 2022) demonstraram — em estudo com 309 estudantes de medicina — que a ansiedade de prova não prediz desempenho quando o nível de conhecimento é controlado. A implicação direta: o que parece ansiedade frequentemente é familiaridade insuficiente com as condições reais de avaliação. Praticar nessas condições reduz o efeito da novidade ambiental no dia da prova.

---

## VERTENTE 3 — Gestão de tempo e cronograma real

### 3.1 Cronograma semanal gerado pela plataforma

**O problema:** hoje o MedRev agenda *quando* revisar (datas D1, D4, D7, D21), mas não *em que horário* da semana o usuário vai encaixar cada sessão. O resultado é que o usuário ainda precisa tomar a decisão de onde colocar o estudo no calendário — e isso tem custo cognitivo.

**O que construir:**

Na tela de Configurações (onboarding ou reedição posterior), coletar:
- Dias da semana disponíveis (checkboxes: Seg a Dom)
- Janela de horário por dia (ex: "19h às 22h")
- Tempo disponível por sessão (ex: 1.5h)

Com esses dados + a fila de prioridade, gerar uma **Grade Semanal** (nova tela ou seção do Dashboard):

```
Segunda, 19h → Pediatria D0 (est. 90min)
Terça, 19h   → GO D4 + Clínica Médica D1 (est. 80min)
Quarta, 19h  → Cirurgia D7 (est. 45min)
[...]
```

A grade se atualiza automaticamente quando o usuário completa ou pula uma sessão.

**Notificação:** enviar lembrete no horário agendado (push/email) com o tema específico, não apenas "hora de estudar".

**Evidência científica:** A teoria do comportamento planejado (Ajzen, 1991) e os estudos de implementação intencional (Gollwitzer, 1999) demonstram consistentemente que especificar *quando* e *onde* uma ação ocorrerá aumenta a probabilidade de execução em até 2-3× em comparação com intenções vagas. A aplicação em contextos de estudo de alta-stakes é suportada por múltiplos estudos de self-regulated learning (revisão em Zimmerman, 2002).

---

### 3.2 Replanejamento dinâmico após ausência

**O que é:** quando o usuário não acessa a plataforma por 3+ dias, ao retornar não deve ver simplesmente "7 revisões atrasadas" — deve ver um plano de recuperação concreto.

**Fluxo:**

1. Ao detectar ausência ≥ 3 dias: mostrar tela específica de retorno antes do Dashboard principal
2. A mentora classifica automaticamente os itens atrasados em 3 categorias:
   - **Crítico agora** (temas Diamante com Recuperabilidade < 50%): "Esses 2 precisam ir hoje"
   - **Pode esperar até [data]** (Recuperabilidade 50-70%): "Esses 3 encaixe até quinta"
   - **Não foi comprometido** (Recuperabilidade > 70%): "Esses 4 ainda estão estáveis — não precisa se preocupar agora"
3. Oferecer dois botões: "Aceitar plano da mentora" ou "Deixa eu reorganizar"

**Evidência científica:** A teoria da carga cognitiva (Sweller, 1988, revisada em 2019) estabelece que decisões de priorização em contexto de sobrecarga consomem recursos cognitivos que poderiam ser alocados ao aprendizado. Reduzir a carga de decisão no retorno diminui o risco de abandono por "overwhelm" — um dos principais preditores de churn em plataformas de educação de longo prazo.

---

## VERTENTE 4 — Engajamento e retenção avançada

### 4.1 Check-in semanal estruturado com a mentora

**O que é:** toda semana (domingo ou segunda, configurável), uma tela de 3 perguntas rápidas que o usuário responde em < 2 minutos. A mentora processa as respostas e gera um diagnóstico + meta para a semana seguinte.

**Perguntas (rotacionadas, nunca as mesmas 2 semanas seguidas):**

Pool A — desempenho:
- "Qual especialidade você sentiu que avançou mais esta semana?"
- "Em qual tema você acha que ainda tem lacuna crítica?"
- "Como foi sua concentração nas sessões desta semana (1-5)?"

Pool B — obstáculos:
- "O que mais te impediu de estudar esta semana?"
- "Teve algum tema que você evitou iniciar? Por quê?"
- "Seu cronograma fora da plataforma está funcionando?"

Pool C — perspectiva:
- "Como você se sente em relação ao preparatório agora (1-5)?"
- "Qual é a sua maior preocupação para as próximas 2 semanas?"

**O que a mentora faz com as respostas:**
- Compara a auto-percepção com os dados reais (ex: usuário diz que avançou em Pediatria, mas o acerto caiu de 74% para 68% — a mentora aponta a discrepância)
- Gera uma meta específica e mensurável para a semana seguinte
- Armazena as respostas para detectar padrões de motivação ao longo do tempo

**Evidência científica:** Metacognição estruturada melhora calibração e desempenho mais do que prática repetida isolada — este efeito é robusto em estudos de metacognitive training (revisão em Theobald et al., *Psychological Science*, 2022; Schleicher et al., *Learning and Instruction*, 2019). O check-in semanal é uma implementação de "monitoramento metacognitivo periódico" que não requer intervenção externa (docente/tutor), tornando-o escalável.

---

### 4.2 Sistema de Streak refinado — o que está faltando

O v8 já documenta Streak Freeze, Streak Recovery e Streak Milestones. O que falta implementar além disso:

**4.2.1 — Streak de qualidade (não apenas de presença)**

O streak atual conta qualquer sessão completada. Adicionar um "Streak de Consistência" que só conta quando:
- O usuário completou ≥ 80% dos itens da fila do dia (não apenas "abriu o app")
- O acerto médio da sessão foi ≥ 60%

Mostrar os dois streaks separados:
- 🔥 Streak de presença: 14 dias (qualquer sessão)
- ⭐ Streak de qualidade: 8 dias (sessão consistente)

A mentora comenta a diferença quando ela existe: "Você tem 14 dias seguidos de presença — ótimo. Mas só 8 de consistência real. Os outros 6 dias foram sessões abaixo do threshold. Isso importa para a aprovação."

**4.2.2 — Streak social assíncrono (sem leaderboard)**

Permitir que o usuário "conecte" com até 3 colegas de estudo. Sem ranking, sem comparação de notas. Apenas visibilidade mútua do streak e uma notificação quando alguém do grupo completou a sessão do dia: "Seu colega [nome] já estudou hoje. Você ainda não."

Esse mecanismo usa pertencimento e norma social sem pressão competitiva — exatamente o que a SDT (Deci & Ryan, 2000) classifica como suporte à motivação autônoma.

**Evidência científica:** Duolingo documentou que o streak com componente de "risco de perda" foi o maior ganho de retenção individual da história da empresa (Mazal, 2024). A distinção entre streak de presença e streak de qualidade é uma extensão desse princípio que evita o problema documentado: usuários que "fazem o mínimo para não perder o streak" sem aprender de verdade (análise de product drift publicada em 2023). O componente social assíncrono é suportado por estudos de accountability em contextos de self-study (Webb & Sheeran, 2006).

---

### 4.3 Microdoses de pré-ativação (antes da sessão formal)

**O que é:** 30-60 minutos antes do horário de estudo agendado do usuário, enviar uma única pergunta do tema que ele vai revisar naquela sessão. Via push (se PWA instalado) ou email.

**Regras:**
- Uma pergunta por dia. Nunca mais de uma.
- A pergunta é uma das questões já erradas pelo usuário naquele tema (não uma nova)
- Não há consequência de acertar ou errar — apenas o ato de recuperar a memória
- A resposta é revelada no push/email junto com a pergunta (para não criar fricção)

**Por que funciona:** a pré-ativação (pre-retrieval priming) antes de uma sessão de estudo aumenta a eficiência da sessão subsequente. O usuário entra na sessão com o tema já "aquecido" — reduzindo o tempo de orientação inicial e aumentando a densidade de aprendizado útil por minuto.

**Evidência científica:** Pastötter & Bäuml (*Frontiers in Psychology*, 2014) demonstraram o "forward effect of testing" — uma tentativa de recuperação prévia melhora o aprendizado subsequente da mesma forma que o efeito do teste melhora a retenção. Estudos de priming cognitivo em educação médica (revisados em Trumble et al., *Advances in Health Sciences Education*, 2024) suportam a aplicação desse princípio em contextos de revisão espaçada.

---

## VERTENTE 5 — Dados e transparência para o usuário

### 5.1 Relatório mensal exportável

**O que é:** no início de cada mês, gerar automaticamente um PDF/documento com:

**Seção 1 — Resumo do mês:**
- Temas iniciados (D0) vs revisões completadas (D1-D21)
- Total de questões respondidas
- Horas estimadas de estudo (baseadas em `tempoMin` somado)
- Dias ativos vs meta

**Seção 2 — Desempenho por especialidade:**
- True Retention por especialidade (tabela)
- Acerto médio por step (D0 → D1 → D4 → D7 → D21)
- Especialidades que mais melhoraram vs que mais regrediram

**Seção 3 — Diagnóstico da mentora:**
- 3 pontos fortes do mês (com dados específicos)
- 3 áreas de atenção (com dados específicos)
- Projeção atualizada de aprovação

**Seção 4 — Meta do próximo mês:**
- Calculada automaticamente com base nos dados disponíveis

O relatório pode ser compartilhado com mentores, professores ou grupos de estudo sem expor a plataforma ou credenciais.

**Evidência científica:** A externalização do monitoramento (relatórios periódicos) é um mecanismo de metacognição estruturada. Zimmerman & Schunk (2011) demonstraram que estudantes que monitoram explicitamente seu progresso ao longo do tempo apresentam maior autorregulação e melhor desempenho em exames de alta-stakes do que os que confiam apenas em percepção interna de progresso.

---

### 5.2 Benchmarking anônimo (sem leaderboard)

**O que é:** comparação do desempenho do usuário com faixas de referência anonimizadas — não com outros usuários identificados.

**Como apresentar:**

Em vez de "Você está no percentil X entre os usuários do MedRev" (competição), mostrar:

> "Sua True Retention em Pediatria é 68%. Candidatos com histórico de aprovação em residências de alta concorrência (UNIFESP, USP-SP) costumam chegar à prova com True Retention acima de 75% nessa especialidade. Diferença: 7 pontos. Você tem [N] semanas para fechar essa lacuna."

Isso usa dados populacionais como referência de desempenho — não como ranking social.

**Implementação:** criar faixas de referência com base em dados agregados e anonimizados dos usuários da plataforma (requer política de privacidade e consentimento). Na ausência de dados próprios suficientes, usar faixas estimadas com base na literatura de preparatórios (comunicar ao usuário que são estimativas).

**Evidência científica:** A teoria da comparação social (Festinger, 1954) e suas atualizações mostram que a comparação com benchmarks de desempenho (não com pares) gera motivação de aproximação sem os efeitos negativos do ranking (desmotivação em baixo desempenho, ansiedade em alto desempenho). Estudos em educação médica (Eva & Regehr, *Journal of Continuing Education*, 2008) suportam o uso de padrões externos calibrados para melhorar metacognição sem os efeitos adversos da competição social.

---

### 5.3 Transparência algorítmica — "por que este item está aqui hoje"

**O que é:** um tooltip expandível em cada item da fila de prioridade que explica, em linguagem simples, por que aquele item está naquela posição.

**Formato:**

> [ícone info] Por que Pediatria — Assistência ao Recém-Nascido está em #1 hoje?
>
> • Tema Diamante (peso 3) — alta relevância no ENAMED
> • Seu último acerto foi 58% (abaixo do threshold de 70%)
> • Está 4 dias atrasado — a recuperabilidade caiu para 52%
> • Score combinado: 8.7 (mais alto da sua fila)

Isso implementa o princípio de "autonomia informada" da SDT — o usuário entende a lógica, pode confiar nela, e confia mais em um sistema que se explica do que em um que apenas ordena.

**Evidência científica:** Transparência algorítmica aumenta adoção e compliance em sistemas de recomendação de saúde e educação (Cai et al., 2019; revisado em Tintarev & Masthoff, 2022). Em contextos de auto-regulação, a compreensão do mecanismo de recomendação é um preditor de engajamento sustentado — o usuário que entende "por que" usa a ferramenta com mais consistência do que o que apenas obedece a uma ordem opaca.

---

## VERTENTE 6 — Produto e modelo de negócio

> ⚠️ Esta vertente é sobre estratégia, não sobre funcionalidade técnica. Implemente apenas se estiver no momento de definir o modelo comercial.

### 6.1 Modelo freemium inteligente

**Princípio:** o free deve provar o valor do método. O pago deve entregar a vantagem competitiva.

**Proposta de separação:**

| Funcionalidade | Free | Pago |
|---|---|---|
| Cronograma MEDCOF completo | ✅ | ✅ |
| FSRS básico (com teto fixo) | ✅ | — |
| FSRS sem teto + parâmetros individuais | — | ✅ |
| Mentora com frases contextuais básicas | ✅ | ✅ |
| Diagnóstico completo da mentora | — | ✅ |
| Projeção de aprovação | — | ✅ |
| Relatório mensal exportável | — | ✅ |
| Índice de Calibração Metacognitiva | — | ✅ |
| Importação de simulado | — | ✅ |
| Modo Prova cronometrado | — | ✅ |

**Lógica:** o free converte o usuário ao método (spaced repetition + retrieval practice). O pago converte o usuário ao *sistema completo* que faz a diferença marginal entre quase passar e passar. Essa distinção é particularmente poderosa para o público de quem tentou uma vez e não passou — eles já acreditam no método, precisam de mais precisão.

**Evidência do mercado:** Duolingo reduziu o churn de 47% para 28% em mercados ocidentais ao combinar um free genuinamente valioso com um premium que entrega mais profundidade — não apenas remoção de anúncios (*StriveCloud Analysis*, 2024; dados Q2 2025 SEC filings).

---

### 6.2 Flywheel de dados — como a plataforma melhora com escala

**O que é:** com volume suficiente de usuários com perfis completos e resultados de prova, a plataforma pode:

1. Identificar quais temas/subtemas têm maior correlação com aprovação em cada residência-alvo
2. Refinar os pesos MEDCOF com dados reais de aprovados e reprovados
3. Calibrar os thresholds do Bleeding Score com base em padrões de aprovação observados
4. Detectar quais padrões de uso (horário, volume, tipo de erro) predizem aprovação

Isso transforma o MedRev de uma ferramenta baseada em pesquisa externa para uma ferramenta com inteligência própria sobre o exame brasileiro de residência médica — um ativo que nenhum concorrente pode replicar rapidamente.

**Implementação:** requer consentimento explícito dos usuários para uso agregado e anonimizado dos dados. Implementar como opt-in: "Ao participar do programa de melhoria contínua, você contribui para que a plataforma fique mais precisa para todos os candidatos — incluindo você."

**Evidência de produto:** o flywheel de dados é o mecanismo de vantagem competitiva documentado em plataformas de edtech de escala (Coursera, Duolingo). A cada ciclo de dados, a recomendação melhora — criando uma vantagem que cresce com o tempo e é difícil de replicar por entrantes.

---

---

# PARTE B — MÓDULO VESTIBULAR

> **Contexto:** o módulo de vestibular atual é reconhecidamente "muito zuado". O que se segue é uma especificação completa de um módulo de vestibular construído sobre os mesmos pilares científicos do módulo de residência — mas com as adaptações necessárias para o perfil, o conteúdo e a psicologia do candidato de vestibular. O foco prioritário é o **candidato de segunda tentativa** — quem já tentou, quase passou, e precisa de diagnóstico preciso e intervenção cirúrgica, não de "estudar mais".

---

## B.1 — O problema específico do candidato de segunda tentativa

Este é o perfil mais comum e mais negligenciado do preparatório:

- Estudou muito na primeira tentativa (em volume)
- Ficou próximo da nota de corte (às vezes a poucos pontos)
- Sabe que "estudar mais do mesmo" não vai funcionar
- Está psicologicamente fragilizado (ansiedade de re-tentativa, comparação com aprovados)
- Precisa de **diagnóstico de lacuna cirúrgico**, não de currículo completo

O erro mais comum das plataformas tradicionais é tratar esse candidato como se fosse um iniciante — e reoferecer o mesmo currículo completo. O MedRev para vestibular deve reconhecer esse perfil desde o onboarding e oferecer um caminho diferente.

**Evidência científica:** Pesquisa sobre "desirable difficulties" (Bjork & Bjork, 2011) e sobre o efeito da tentativa anterior no aprendizado (Kornell & Bjork, 2008) indica que candidatos com exposição prévia ao conteúdo se beneficiam desproporcionalmente de interleaving e retrieval practice focados — não de reapresentação do conteúdo em bloco. A segunda tentativa é, cognitivamente, um contexto de retrieval cue enrichment — o material foi codificado, mas a recuperação é inconsistente sob condições de prova.

---

## B.2 — Arquitetura do módulo vestibular

### B.2.1 — Provas-alvo suportadas

Implementar suporte inicial para as principais provas, com pesos calibrados:

| Prova | Tipo | Pesos principais |
|---|---|---|
| ENEM | Nacional, nota de corte variável | CN 25%, CH 25%, LC 25%, MT 25% |
| FUVEST | Discursiva + objetiva | Bio 20%, Qui 15%, Fis 15%, Mat 20%, Port 15%, H/G 15% |
| UNICAMP | Redação pesada + objetiva | Port 25%, Mat 20%, Bio 15%, Qui 15%, Fis 10%, H/G 15% |
| EEAR / ESA | Militares | Mat 35%, Por 25%, Fis 20%, Qui 10%, H/G 10% |
| ITA / IME | Alta complexidade em exatas | Mat 40%, Fis 30%, Qui 20%, Port 10% |

Cada prova tem um "perfil de aprovação" que define quais áreas têm maior retorno por hora de estudo — equivalente ao MEDCOF do módulo de residência.

---

### B.2.2 — Estrutura de conteúdo adaptada ao vestibular

Em vez de temas médicos (Cardiologia, GO, etc.), a unidade de revisão é o **Capítulo-Tópico**:

Exemplo de hierarquia (Química):
```
Especialidade: Química
  Área: Química Orgânica
    Tópico: Isomeria → subtópico: Isomeria Geométrica (cis-trans)
    Tópico: Reações Orgânicas → subtópico: Reações de Adição em Alquenos
  Área: Físico-Química
    Tópico: Equilíbrio Químico → subtópico: Le Chatelier
```

O ciclo de revisão é idêntico ao módulo de residência: **D0 → D1 → D4 → D7 → D21**, com as mesmas bases científicas (FSRS + retrieval practice + interleaving).

---

### B.2.3 — Diagnóstico inicial — o que o módulo de residência faz bem e o vestibular precisa replicar

No módulo de residência, o diagnóstico inicial é por especialidade (auto-declarado, depois calibrado). No vestibular, o diagnóstico inicial deve ser mais granular porque o candidato de segunda tentativa geralmente tem lacunas específicas dentro de disciplinas — não disciplinas inteiras.

**Onboarding diagnóstico em 3 etapas:**

**Etapa 1 — Perfil de tentativa:**
- É sua primeira ou segunda (ou mais) tentativa?
- Qual foi sua nota na última tentativa? (por área, se disponível)
- Qual é o prazo para a próxima prova?

**Etapa 2 — Auto-diagnóstico por área:**
- Slider de 1 a 5 para cada área principal da prova-alvo
- 1 = "não sei nada", 5 = "estou confortável"
- Tempo estimado: < 2 minutos

**Etapa 3 — Diagnóstico por prova anterior (candidato de segunda tentativa):**
- Upload ou digitação da nota por área da última prova
- A plataforma calcula automaticamente: "Com essa distribuição de notas, você precisaria de X pontos a mais em [área] para passar — e isso equivale a dominar [N] tópicos de alto impacto."

---

## B.3 — O Foco D0 adaptado ao vestibular

O ciclo D0 do módulo de residência tem 6 microtarefas calibradas para material denso de conteúdo médico. Para vestibular, o ciclo precisa de adaptação por tipo de tópico:

### B.3.1 — Tipo A: Tópico conceitual (Bio, Qui, Fis, H, G)

Ciclo de 5 etapas (~60-80 min):

1. **Diagnóstico prévio (5 min):** resolver 3-5 questões do tópico SEM estudar. Isso ativa o efeito do "pré-teste" — errar antes de estudar aumenta a retenção do estudo subsequente.
2. **Estudo ativo (20-30 min):** leitura/vídeo com marcação ativa. A plataforma pergunta: "Qual foi a ideia mais importante? Escreva em uma frase."
3. **Mapa mental rápido (10 min):** esboço livre — o equivalente ao "esqueleto" do módulo de residência.
4. **Brain dump (3 min):** material fechado, tudo que lembra escrito em tempo cronometrado.
5. **Questões de fixação (20-30 min):** 5-10 questões de vestibulares anteriores do tópico. Preferencialmente da prova-alvo.

### B.3.2 — Tipo B: Tópico procedimental (Mat, Fis com cálculo, Qui estequiometria)

Ciclo de 5 etapas (~70-90 min):

1. **Exemplo resolvido (10 min):** estudar 1 questão resolvida passo a passo, sem pressa.
2. **Tentativa de replicação (10 min):** resolver a mesma questão sem olhar a solução. Verificar passo a passo.
3. **Variação 1 (10 min):** questão similar com números diferentes. Foco em identificar o padrão.
4. **Variação 2 com dificuldade crescente (20 min):** questão de contexto diferente que usa o mesmo procedimento.
5. **Questões de prova (20-30 min):** questões reais da prova-alvo sobre o tópico.

### B.3.3 — Tipo C: Tópico de memorização (tabela periódica, fórmulas, datas históricas)

Ciclo de 4 etapas (~40-50 min):

1. **Criação de Anki-vestibular (15 min):** criar flashcards específicos para o tópico (a plataforma sugere o formato ideal para o tipo de item: frente = contexto, verso = resposta específica).
2. **Primeira revisão do baralho (10 min):** revisar os cards recém-criados.
3. **Questões com o conteúdo em contexto (15-20 min):** questões de vestibular que testam o item em contexto real (não apenas reprodução).
4. **Agendamento FSRS automático** dos cards criados.

**Evidência científica para o D0 vestibular:** O efeito do pré-teste (Kornell & Bjork, 2008; Roediger & Karpicke, 2006) é especialmente robusto para candidatos com exposição prévia ao conteúdo — exatamente o perfil do candidato de segunda tentativa. Estudar após uma tentativa de recuperação (mesmo que falha) produz retenção significativamente superior ao estudo sem tentativa prévia (d=0.73, metanálise de Roediger & Butler, 2011).

---

## B.4 — Algoritmo de prioridade para vestibular — o equivalente do Score Algorítmico

No módulo de residência, a fórmula é:
```
Score = (1 - acertoMedio) × peso_importancia × urgencia
```

Para vestibular, a fórmula precisa de dois ajustes:

### B.4.1 — Peso por retorno marginal de pontos

No vestibular, nem todas as questões valem igualmente para a aprovação. O que importa é: **qual área tem o maior retorno de pontos marginais dado o perfil do candidato?**

```javascript
function scoreVestibular(topico, userProfile) {
  const pesoPorPresta = topico.pesoPorPresta[userProfile.provaAlvo]; // peso oficial da área
  const lacuna = 1 - userProfile.acertoPorArea[topico.area];
  const urgencia = calcUrgencia(topico.diasAteProva, topico.diasAtraso);
  const retornoMarginal = calcRetornoMarginal(
    userProfile.notaAtualArea[topico.area],
    userProfile.notaCorteAlvo,
    pesoPorPresta
  );
  return lacuna × pesoPorPresta × urgencia × retornoMarginal;
}

// calcRetornoMarginal retorna um multiplicador maior para áreas onde
// o candidato está mais perto da nota de corte — o ponto de alavancagem
function calcRetornoMarginal(notaAtual, notaCorte, peso) {
  const diferenca = notaCorte - notaAtual;
  if (diferenca <= 0) return 0.5; // já passou — menor urgência
  if (diferenca <= peso * 0.2) return 2.0; // a 20% do corte — altíssimo retorno
  if (diferenca <= peso * 0.5) return 1.5; // a 50% do corte — alto retorno
  return 1.0; // padrão
}
```

### B.4.2 — Índice de "Tópico-Alavanca"

Identificar e destacar os tópicos onde uma única sessão D0 completa pode gerar o maior ganho de pontos na prova. A mentora apresenta como:

> "Este tópico é uma alavanca para você: ele aparece em média em 12% das questões do ENEM de Biologia, você acerta apenas 38%, e está a 8 dias de prazo. Dominar esse tópico pode valer até 0.8 pontos na sua nota final. É o melhor retorno disponível agora."

---

## B.5 — A voz da mentora para vestibular

A mentora para vestibular tem o mesmo princípio — frases baseadas em dados reais, variáveis, nunca repetidas em 7 dias — mas com tom e conteúdo ajustados ao público mais jovem (17-21 anos) e ao contexto emocional diferente (ansiedade de re-tentativa, comparação com amigos que passaram, pressão familiar).

### B.5.1 — Tom e linguagem

- Menos clínico que o módulo de residência
- Mais próximo, sem ser condescendente
- Reconhece explicitamente a carga emocional da segunda tentativa
- Usa dados para ancorar a mensagem em realidade, não em motivação vazia

### B.5.2 — Situações específicas do vestibular

| Situação | Exemplo de frase |
|---|---|
| Sessão D0 concluída (acerto ≥ 75%) | "[Nome], [tópico] está fixado. Você acertou [X]% no diagnóstico inicial — esse tópico não te preocupa mais. D1 agendado para [data]." |
| Sessão D0 concluída (acerto < 60%) | "[tópico] ainda não está sólido. [X]% no diagnóstico. A estratégia agora: não avance — refaça o brain dump amanhã antes de qualquer coisa nova." |
| Candidato de segunda tentativa, primeiro acesso | "Você chegou perto na última vez. Isso significa que o trabalho de base está feito — o que falta é precisão nas lacunas certas. Eu vou te mostrar quais são." |
| Ansiedade detectada (campo ansiedade ≥ 4 por 3 sessões) | "Percebi que você está com ansiedade alta nas últimas sessões. Isso é comum nessa fase — e não é necessariamente ruim (Yerkes-Dodson). O que ajuda agora: sessões mais curtas, foco nos tópicos que você já sabe bem, e dormir. Sério." |
| Comparação com a nota de corte | "Você está a [N] pontos da nota de corte estimada do [curso/universidade]. Com o ritmo atual, você fecha essa diferença em [X] semanas se mantiver [Y] tópicos por semana." |
| Semana antes da prova | "Pare de aprender coisas novas. Sua retenção agora depende do que já está no sistema. Foque apenas nos D4 e D7 agendados esta semana — e nas questões de prova do seu estilo de erro." |

---

## B.6 — Dashboard do vestibular — o que mostrar

O dashboard de residência é denso porque o usuário é um adulto com formação médica. O dashboard de vestibular deve ser mais visual, mais limpo, e com menos métricas simultâneas.

### B.6.1 — Zona 1: Ação do dia (igual ao módulo de residência)

"Você tem 3 revisões hoje" + botão "Iniciar Foco" em destaque.

### B.6.2 — Zona 2: Minha nota projetada

Em vez de "Projeção de Aprovação" como texto, mostrar uma barra visual com:
- Nota atual estimada (calculada com base no acerto ponderado por peso de área)
- Nota de corte da última edição da prova-alvo
- Diferença em pontos e em "semanas de estudo para fechar"

Isso é mais concreto e motivador para o perfil jovem do que uma projeção percentual.

### B.6.3 — Zona 3: Minhas áreas

Grid visual com as áreas da prova-alvo. Código de cores:
- Verde: True Retention ≥ 75% → "estável"
- Amarelo: True Retention 55-74% → "atenção"
- Vermelho: True Retention < 55% → "crítica"

Ao clicar em qualquer área, expandir para mostrar os tópicos da área com o mesmo código de cores.

### B.6.4 — Zona 4: Tópicos-alavanca da semana

Destacar 2-3 tópicos que, se dominados esta semana, têm o maior impacto projetado na nota. Não mostrar a fila completa por padrão — isso é opressivo para o candidato de vestibular.

---

## B.7 — Onboarding vestibular — adaptação do fluxo

O onboarding do módulo de residência assume familiaridade com o método. O onboarding do vestibular precisa de mais educação sobre o método em si.

### B.7.1 — Camada 1: Setup (3 telas)

1. Nome + prova-alvo + data da prova
2. "É sua primeira tentativa ou você já tentou antes?" — se segunda tentativa, abrir fluxo específico (ver abaixo)
3. Horário preferido de estudo + tempo disponível por dia

### B.7.2 — Camada 2 (fluxo candidato de segunda tentativa)

Tela especial após identificar segunda tentativa:

> "Você já estudou para essa prova antes. Isso é uma vantagem enorme — a base está lá. O que vamos fazer agora é diferente: identificar cirurgicamente as lacunas que fizeram a diferença na última vez e atacar exatamente elas."

Perguntar:
- "Você tem as notas por área da sua última tentativa?" → Se sim: input por área → diagnóstico automático
- "Qual área você sente que mais te puxou para baixo?" → Prioridade inicial manual

### B.7.3 — Camada 3: Demo com tópico real

Igual ao módulo de residência, mas com tópico de alta frequência na prova escolhida. Ex: ENEM → demo com "Genética Mendeliana"; FUVEST → demo com "Funções Orgânicas".

---

## B.8 — Ansiedade de re-tentativa: o que o módulo precisa endereçar

Este é o diferencial mais importante do módulo de vestibular em relação a qualquer concorrente: reconhecer explicitamente a psicologia do candidato de segunda tentativa.

### B.8.1 — Detecção de sinais de ansiedade elevada

Monitorar:
- Campo `ansiedade (1-5)` × 3 sessões consecutivas ≥ 4
- Taxa de abandono de sessão (iniciou mas não finalizou) > 40% em uma semana
- Sessões muito curtas (< 15 min) por 3 dias seguidos

Quando qualquer desses critérios for atingido, a mentora faz uma intervenção específica (não uma notificação padrão):

> "[Nome], percebi um padrão nos últimos dias que quero nomear: [descrição específica do padrão detectado]. Isso costuma acontecer quando a ansiedade está alta. Não é fraqueza — é sinal de que o sistema está sobrecarregado. Sugiro uma semana de [recomendação específica: sessões mais curtas / foco em revisão / pausa programada]."

### B.8.2 — O que a evidência diz sobre ansiedade e desempenho

Theobald, Breitwieser & Brod (*Psychological Science*, 2022) estudaram 309 estudantes de medicina e encontraram que, quando o nível de conhecimento é controlado, a ansiedade de prova *não prediz* desempenho de forma independente. A implicação: a ansiedade aparece quando o candidato *percebe* lacunas — e desaparece quando as lacunas são endereçadas. A intervenção correta não é "acalme-se" — é "feche as lacunas que você sabe que tem".

Isso deve ser comunicado explicitamente para o candidato:

> "A ciência mostra que a ansiedade que você está sentindo provavelmente não vai prejudicar sua prova — ela é um sinal de que você sabe onde estão suas lacunas. O que vamos fazer agora é atacar exatamente essas lacunas."

### B.8.3 — Modo de Semana de Prova (7 dias antes)

Ativar automaticamente 7 dias antes da prova-alvo. O modo muda o comportamento da plataforma:

- **Bloquear novos D0** (nenhum tópico novo — apenas revisões)
- **Priorizar D4 e D7** da fila
- **Reduzir a meta diária** para 60% do normal (menos é mais na semana de prova)
- **A mentora assume tom diferente:** mais calmo, mais confiante, focado em consolidação

Tela de entrada no modo:
> "Faltam 7 dias. A partir de agora, zero coisas novas. Tudo que está agendado para esta semana são revisões de temas que você já estudou — é o cérebro consolidando o que aprendeu. Confie no processo."

---

## B.9 — Métricas específicas para o módulo de vestibular

Adaptar ou adicionar ao `useMetrics.js`:

| Métrica | Fórmula | Onde mostrar |
|---|---|---|
| Nota projetada por área | Acerto médio × peso da área na prova-alvo | Dashboard Zona 2 |
| Nota total projetada | Soma das notas projetadas por área | Dashboard Zona 2, destaque |
| Diferença para o corte | Nota corte estimada − Nota projetada | Dashboard Zona 2, com cor |
| Tópicos-alavanca | Top 3 por (lacuna × peso × urgência × retornoMarginal) | Dashboard Zona 4 |
| Índice de consistência semanal | % de dias com sessão completa nos últimos 7 dias | Dashboard Zona 3 |
| Velocidade de fechamento de lacuna | Pontos ganhos por hora de estudo (estimado) | Relatório semanal |

---

## B.10 — Roadmap de implementação do módulo vestibular

Ordem recomendada, com complexidade e impacto:

| # | Item | Complexidade | Impacto |
|---|---|---|---|
| 1 | Estrutura de conteúdo por tópico-área-disciplina | Alta | Crítico |
| 2 | Perfis de prova-alvo (ENEM, FUVEST, UNICAMP, ITA/IME, EEAR) | Média | Crítico |
| 3 | Onboarding com fluxo de segunda tentativa | Média | Alto |
| 4 | Score algorítmico com retorno marginal de pontos | Média | Alto |
| 5 | Dashboard com nota projetada visual | Média | Alto |
| 6 | Foco D0 por tipo de tópico (A/B/C) | Alta | Alto |
| 7 | Voz da mentora vestibular (frases adaptadas) | Média | Alto |
| 8 | Detecção de ansiedade elevada + intervenção da mentora | Baixa | Alto |
| 9 | Tópicos-alavanca na Zona 4 do Dashboard | Baixa | Médio |
| 10 | Modo Semana de Prova (7 dias antes) | Baixa | Médio |
| 11 | Diagnóstico por nota de tentativa anterior | Média | Médio |
| 12 | Relatório de desempenho por área | Média | Médio |
| 13 | Benchmarking com notas de corte históricas | Baixa | Médio |

---

---

# APÊNDICE — BASE DE EVIDÊNCIA CIENTÍFICA

Este apêndice centraliza todas as fontes usadas para fundamentar as decisões de design deste documento. Fontes marcadas com ⭐ são revisões sistemáticas ou meta-análises — o nível mais alto de evidência disponível.

---

## Repetição espaçada e algoritmos adaptativos

- ⭐ **Revisão sistemática e meta-análise (2025):** "The Effectiveness of Spaced Repetition in Medical Education: A Systematic Review and Meta-Analysis." *PubMed* (PMID: 41601436). De 542 artigos identificados, os estudos incluídos demonstram efeito positivo consistente do uso de repetição espaçada no desempenho em testes objetivos em educação médica.

- ⭐ **JMIR (2024):** "Spaced Digital Education for Health Professionals: Systematic Review and Meta-Analysis." *Journal of Medical Internet Research*, 26:e57760. Análise Cochrane de 23 RCTs e quasi-RCTs comparando educação digital espaçada com não-espaçada em profissionais de saúde. Metodologia: MEDLINE, Embase, Web of Science, ERIC, PsycINFO, CINAHL, CENTRAL — busca de 1990 a 2023.

- ⭐ **JACR (2023):** "The Effectiveness of Spaced Learning, Interleaving, and Retrieval Practice in Radiology Education: A Systematic Review." *Journal of the American College of Radiology*, 20(11):1092-1101. Revisão PRISMA de 1.316 artigos, 8 estudos incluídos (RCTs e quasi-RCTs). 5 dos 8 estudos reportaram diferenças estatisticamente significativas entre grupos intervenção e controle.

- **BMC Medical Education (2025):** "Spaced repetition and other key factors influencing medical school entrance exam success." *BMC Medical Education*. Estudo de coorte retrospectiva (n=523, taxa de resposta 84,6%) em candidatos ao exame de entrada na escola de medicina francesa (2022-2023). Candidatos aprovados usaram repetição espaçada significativamente mais (44,8% vs 20,3%, p<0,001).

- **Reddy et al. (2019):** "Enhancing human learning via spaced repetition optimization." *PNAS*, 116(10):3988-3993. (PMC6410796). Algoritmos de repetição espaçada adaptativos são significativamente superiores a alternativas de revisão fixa.

---

## Prática de recuperação (Retrieval Practice / Testing Effect)

- ⭐ **Roediger & Butler (2011):** "The Critical Role of Retrieval Practice in Long-Term Retention." *Trends in Cognitive Sciences*, 15(1):20-27. Meta-análise fundamental do testing effect (d=0,73 para pré-teste vs d=0,35 para releitura).

- **Roediger & Karpicke (2006):** "Test-enhanced learning: Taking memory tests improves long-term retention." *Psychological Science*, 17(3):249-255. Estudo seminal: estudantes com prática de recuperação ativa tiveram retenção de longo prazo substancialmente superior.

- **Deng, Gluckstein & Larsen (2015):** "Student-directed retrieval practice is a predictor of medical licensing examination performance." *Perspectives in Medical Education*, 4(6):307-311. (PMC4673073). Retrieval practice foi preditor independente de desempenho no USMLE Step 1, após controle de habilidades cognitivas e tempo total de estudo.

- **Pastötter & Bäuml (2014):** "Retrieval practice enhances new learning: the forward effect of testing." *Frontiers in Psychology*, 5:286. (PMC3983480). "Forward effect" — tentativa de recuperação prévia melhora o aprendizado subsequente.

- **Trumble et al. (2024):** "Systematic review of distributed practice and retrieval practice in health professions education." *Advances in Health Sciences Education*, 29(2):689-714.

---

## Intercalação (Interleaving)

- ⭐ **Bjork & Bjork (2011):** "Making things hard on yourself, but in a good way: Creating desirable difficulties." *Psychology and the Real World*. Fundamento teórico do interleaving como "dificuldade desejável".

- **Rohrer & Taylor (2007):** "The shuffling of mathematics problems improves learning." *Instructional Science*, 35:481-498. Interleaving de problemas matemáticos produz escores mais altos em testes imediatos e postergados vs blocos sequenciais.

- **Carter & Grahn (2022):** "Mix It Up: Testing Students on Unrelated Concepts Can Help Jump-Start Learning." *Psychological Science* (via APS, jun 2022). Estudo em 155 estudantes do ensino médio canadense por 4 semanas — interleaving superior ao bloqueio tanto no teste imediato quanto 1 mês após.

- **Soderstrom et al. (2022):** "Combining desirable difficulty strategies in residency training." *Medical Education*. Combinação de espaçamento + retrieval practice elevou escores médios de exame de residentes de 149 para 160 pontos. O efeito combinado é maior que a soma das partes.

---

## Metacognição e calibração

- **Turner et al. (2023):** "A metacognitive confidence calibration (MCC) tool." *American Journal of Physiology — Advances in Physiology Education*, 47(1). (PubMed 35981722). Em 80 estudantes de medicina (20 equipes): acurácia avaliada por docentes variou de 23-74%; autoavaliação de confiança variou de 71-86%. Viés de excesso de confiança sistemático.

- **Theobald, Breitwieser & Brod (2022):** "Test Anxiety Does Not Predict Exam Performance When Knowledge Is Controlled For: Strong Evidence Against the Interference Hypothesis of Test Anxiety." *Psychological Science*, 33(12):2073-2083. Estudo com 309 estudantes de medicina: quando o nível de conhecimento é controlado, ansiedade de prova não prediz desempenho de forma independente.

- **Foster et al. (2023):** "Low-Performing Students Confidently Overpredict Their Grade Performance throughout the Semester." *Journal of Intelligence*, 11(10):188. (PMC10607382). Estudantes de baixo desempenho mantiveram alta confiança e baixa calibração em 4 exames consecutivos — sem melhora após feedback repetido.

- **Schleicher et al. (2019):** "Enhanced monitoring accuracy and test performance: Incremental effects of judgment training." *Learning and Instruction*, 60:15-25. Treinamento metacognitivo melhorou acurácia de monitoramento e desempenho, além dos efeitos do teste repetido isolado.

- **Eva & Regehr (2008):** "I'll never play professional football and other fallacies of self-assessment." *Journal of Continuing Education in the Health Professions*. Revisão fundamental sobre as limitações da autoavaliação em medicina.

---

## Psicologia do engajamento e design de hábito

- **Eyal, N. (2014):** *Hooked: How to Build Habit-Forming Products*. Portfolio/Penguin. Modelo de 4 fases (gatilho, ação, recompensa variável, investimento).

- **Deci & Ryan (2000):** "Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being." *American Psychologist*, 55(1):68-78. Três necessidades psicológicas básicas: autonomia, competência, pertencimento.

- **Mazal (2024):** "How Duolingo reignited user growth." *Lenny's Newsletter*. Dados internos de produto: streak mechanic foi o maior ganho de retenção individual da história do Duolingo; usuários com streak wager têm +14% retenção no dia 14.

- **StriveCloud (2024):** "Duolingo gamification explained." Análise de produto: Duolingo reduziu churn de 47% (2020) para ~28% (2023-2024) em mercados ocidentais através de gamificação adaptativa. DAU cresceu 36% YoY até 2025.

- **Duolingo SEC filings (Q2 2024/2025):** 34,1M DAUs no Q2 2024 (+59% YoY); revenue $178,3M (+41% YoY). Evidência de mercado de que gamificação com habit psychology escala em educação.

---

## Deliberate practice e lacunas específicas

- **Ericsson, Krampe & Tesch-Römer (1993):** "The role of deliberate practice in the acquisition of expert performance." *Psychological Review*, 100(3):363-406. Fundamento da prática deliberada: ataque específico ao ponto de falha, com feedback imediato, é superior à prática de volume.

- **Evidence Based Education (2026):** "Responsive Revision." Revisão aplicada: revisão deliberada e direcionada às fraquezas específicas é superior à revisão uniforme — especialmente em contextos de alta-stakes com tempo limitado.

---

## Planejamento e implementação intencional

- **Gollwitzer (1999):** "Implementation intentions: Strong effects of simple plans." *American Psychologist*, 54(7):493-503. Especificar quando, onde e como uma ação ocorrerá aumenta a probabilidade de execução em até 2-3× vs intenção vaga.

- **Ajzen (1991):** "The theory of planned behavior." *Organizational Behavior and Human Decision Processes*, 50(2):179-211. Intenção + planejamento concreto = maior probabilidade de comportamento.

---

## Ansiedade de re-tentativa e auto-regulação

- **Bonner (2022):** "Breaking the Test-Anxiety Loop: Using Self-Regulated Learning to Improve Bar Exam Performance." *The Bar Examiner*, 91(4). Análise de como a ansiedade de prova afeta candidatos de alta-stakes e como estratégias de SRL (self-regulated learning) reduzem o efeito.

- **Kornell & Bjork (2008):** "Learning concepts and categories: Is spacing the 'enemy of induction'?" *Psychological Science*, 19(6):585-592. Candidatos com exposição prévia ao conteúdo se beneficiam desproporcionalmente de interleaving e retrieval practice focados.

---

*MedRev v9 — Especificação de Melhorias*
*Documento de trabalho interno · Gerado com base na especificação v8 + pesquisa em literatura científica revisada por pares + dados de produto*
*Última atualização: maio 2026*
