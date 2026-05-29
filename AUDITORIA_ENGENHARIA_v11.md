# Auditoria de Engenharia v11 — MedRev / Bro (Foco: Vestibular, Estudo, UX & Retenção)

**Documento de execução para o Antigravity.** Continuação da auditoria v10 (já implementada: catálogo do vestibular desacoplado, `CronogramaVestHub`, forecast FSRS, testes do core, sync status, backups movidos). Esta auditoria ataca os 11 pontos levantados após o uso real.

> Convenção: 🔴 crítico · 🟠 importante · 🟡 melhoria. **Onde** = arquivo:trecho. Código é direção, não literal.
> Princípio geral: **o app nasceu médico (residência) e o vestibular foi "encaixado" por cima.** Vários textos, passos e métricas ainda são clínicos. O trabalho aqui é tornar o vestibular um cidadão de primeira classe, não um tema pintado de roxo.

---

## 1. 🔴 Expandir tópicos e subtópicos do vestibular (com hierarquia de 2 níveis)

**Onde:** `src/constants/catalogos.js` (`CATALOGO_VEST`).

**Estado atual:** 9 matérias, ~70 tópicos "rasos" (1 nível). Para residência o MEDCOF tem ~300 tópicos detalhados; o vestibular está pobre em comparação e sem subtópicos.

**Problema de modelo de dados:** hoje cada entrada é `[nome, area, prioridade]` — uma lista plana. Não há como representar "Mecânica → Cinemática → MRU / MRUV / Queda livre". O aluno de vestibular pensa em **matéria → tópico → subtópico**, e a revisão espaçada funciona melhor com unidades pequenas (um subtópico = um card de ciclo D0→D21).

**Correção esperada (2 fases):**

**(A) Estender o schema do catálogo para suportar subtópicos**, mantendo retrocompatibilidade com o MEDCOF (que continua plano):
```js
// Novo formato opcional: o 3º elemento pode ser prioridade (string, legado)
// OU um objeto { prio, subs: [...] }. O Cronograma.jsx detecta e renderiza.
{ b: 2, nome: "Física", t: [
  ["Mecânica", "Exatas", { prio: "Alta", subs: [
    "Cinemática (MRU, MRUV, Queda Livre)",
    "Vetores e Movimento 2D",
    "Leis de Newton e Aplicações",
    "Trabalho, Energia e Potência",
    "Quantidade de Movimento e Colisões",
    "Estática e Hidrostática",
    "Gravitação Universal",
  ]}],
  ["Termologia", "Exatas", { prio: "Alta", subs: [
    "Temperatura e Dilatação", "Calorimetria", "Mudanças de Estado",
    "Gases Ideais", "Termodinâmica (1ª e 2ª Lei)",
  ]}],
  // ...
]},
```

**(B) Popular o catálogo de verdade.** Cobertura mínima recomendada por área (ENEM/UFG/UnB/EsPCEx — ajustar prioridade conforme `meta.provasAlvo`):

- **Matemática:** Conjuntos e Lógica · Funções (afim, quadrática, modular, exponencial, logarítmica) · Trigonometria · Sequências (PA/PG) · Matrizes/Determinantes/Sistemas · Análise Combinatória · Probabilidade · Estatística · Geometria Plana · Geometria Espacial · Geometria Analítica · Números Complexos · Polinômios · Matemática Financeira.
- **Física:** Mecânica (subtópicos acima) · Termologia · Óptica · Ondulatória · Eletrostática · Eletrodinâmica · Eletromagnetismo · Física Moderna.
- **Química:** Atomística · Tabela Periódica · Ligações · Geometria Molecular · Funções Inorgânicas · Reações Inorgânicas · Estequiometria · Soluções · Termoquímica · Cinética · Equilíbrio (iônico, pH, Ks) · Eletroquímica · Química Orgânica (funções, isomeria, reações) · Radioatividade.
- **Biologia:** Citologia · Bioquímica · Metabolismo (fotossíntese, respiração) · Histologia · Genética (1ª/2ª lei, ligação, sexual) · Biotecnologia · Evolução · Ecologia · Botânica · Zoologia (invertebrados, vertebrados) · Fisiologia Humana (todos os sistemas) · Microbiologia · Imunologia · Programas de saúde.
- **História:** Pré-Colombiana e Colônia · Brasil Império · Brasil República (Velha, Vargas, JK, Ditadura, Nova República) · Antiguidade · Idade Média · Moderna (Absolutismo, Renascimento, Reformas) · Revoluções (Inglesa, Francesa, Industrial) · Séc. XIX (Imperialismo) · Guerras Mundiais · Guerra Fria · História recente.
- **Geografia:** Cartografia · Geologia/Relevo/Solos · Climatologia · Hidrografia · Vegetação/Domínios · Geografia Agrária · Industrialização · Urbanização · População/Demografia · Geopolítica · Globalização · Questões Ambientais · Geografia do Brasil (regiões).
- **Filosofia:** Antiga (Sócrates, Platão, Aristóteles) · Medieval · Moderna (Racionalismo, Empirismo, Contratualismo, Kant) · Contemporânea · Ética · Política.
- **Sociologia:** Clássicos (Marx, Weber, Durkheim) · Cultura e Ideologia · Trabalho · Movimentos Sociais · Cidadania e Direitos · Globalização.
- **Português/Gramática:** Fonologia · Morfologia (classes) · Sintaxe (período simples/composto, regência, concordância, crase) · Semântica · Pontuação · Variação Linguística · Funções da Linguagem.
- **Literatura:** Trovadorismo→Modernismo (todas as escolas) · Análise de obras obrigatórias (lista por vestibular) · Gêneros literários · Figuras de linguagem.
- **Interpretação/Linguagens:** Gêneros textuais · Coesão/Coerência · Inferência · Tipologia textual.
- **Língua Estrangeira:** Inglês e Espanhol (estratégias de leitura, falsos cognatos, tempos verbais).
- **Redação:** ver itens 2.6/3 abaixo.

**Critério de aceite:** clicar numa matéria mostra tópicos; clicar/expandir um tópico mostra subtópicos iniciáveis individualmente. Total ≥ ~250 unidades iniciáveis no vestibular.

---

## 2. 🔴 Os passos de estudo do vestibular são idênticos aos da medicina (e não deveriam)

**Onde:** `src/constants/stepDefinitions.js`, consumido por `FocusMode.jsx` e `SessaoPage.jsx`.

**Problema:** `STEP_DEFINITIONS` é 100% clínico e fixo para as duas plataformas:
- "Vá ao **MedEvo**", "Pesquise o tema", "Apendicite com abscesso", cloze médico.
- Esqueleto mental pede **Epidemiologia / Fisiopatologia / Conduta / Complicações** — vocabulário de doença, sem sentido para "Função Quadrática" ou "Revolução Francesa".
- Brain Dump D1 (em `FocusMode.jsx`) tem campos fixos `epidemiologia / fisiopatologia / diagnostico / conduta / complicacoes`.

**Como deveria ser — pesquisa de métodos de estudo aplicáveis ao vestibular:**
A técnica de base (recuperação ativa + espaçamento) é a mesma; **o roteiro de cada D0 deve mudar por plataforma e idealmente por tipo de matéria.** Sugestão de passos para vestibular, ancorados em evidência:

1. **Pré-teste / Sondagem (10 min)** — resolver 3–5 questões do tópico *antes* de estudar (pretesting effect, Roediger & Karpicke). Para exatas: questões resolvidas comentadas; para humanas: questões de interpretação.
2. **Estudo Ativo (aula/leitura) (40–50 min)** — assistir/ler com a técnica de "pergunta-missão" e mini brain-dump entre blocos. Para **exatas**, trocar por **resolução guiada**: ver o conceito → refazer o exemplo sozinho → comparar.
3. **Mapa / Esqueleto (10 min)** — material fechado, montar a estrutura do tópico. Adaptar os campos por área:
   - **Exatas:** "Fórmulas-chave · Quando aplicar · Pegadinhas comuns · Unidades".
   - **Humanas:** "Contexto (causas) · Processo · Consequências · Conceitos-chave · Conexões com atualidades".
   - **Linguagens/Literatura:** "Características da escola · Autores/Obras · Trechos-modelo · Como cai na prova".
4. **Brain Dump (3–5 min)** — escrever de memória; campos dinâmicos conforme o esqueleto acima.
5. **Questões + Categorização de erro (25 min)** — bateria de questões, registrar acerto e *causa de cada erro* (ver item 4).
6. **Flashcards / Síntese (10 min)** — Anki para exatas (fórmulas, datas, conceitos) ou resumo-relâmpago para humanas.

**Correção esperada (arquitetura):**
1. Tornar `STEP_DEFINITIONS` uma **função/seletor por plataforma e área**:
```js
// stepDefinitions.js
export const STEP_DEFINITIONS_RES = [ ... ]; // o atual (médico)
export const STEP_DEFINITIONS_VEST_EXATAS = [ ... ];
export const STEP_DEFINITIONS_VEST_HUMANAS = [ ... ];
export const STEP_DEFINITIONS_VEST_REDACAO = [ ... ]; // ver item 3
export function getStepDefinitions(plat, esp) {
  if (plat === "res") return STEP_DEFINITIONS_RES;
  if (esp === "Redação") return STEP_DEFINITIONS_VEST_REDACAO;
  if (esp === "Exatas" || esp === "Ciências da Natureza") return STEP_DEFINITIONS_VEST_EXATAS;
  return STEP_DEFINITIONS_VEST_HUMANAS;
}
```
2. `FocusMode.jsx` e `SessaoPage.jsx` passam a chamar `getStepDefinitions(plat, tema.esp)` em vez de importar a constante única. **Atenção:** hoje `FocusMode` indexa `STEP_DEFINITIONS[d0StepIdx]` e o Brain Dump D1 tem campos hardcoded — ambos precisam ler a definição ativa.
3. Os campos do Brain Dump D1 viram dinâmicos (vêm do passo "esqueleto" da definição ativa), não fixos clínicos.
4. Trocar toda menção a "MedEvo" por um **campo configurável de "plataforma de questões"** no perfil (item 9) — ex.: o aluno de vestibular usa "Estuda Mais", "QConcursos", caderno próprio. Default neutro: "seu banco de questões".

**Critério de aceite:** iniciar um D0 de "Função Quadrática" mostra passos de exatas (fórmulas/pegadinhas), nunca "Epidemiologia/MedEvo".

---

## 3. 🟠 Conteúdos de Artes (Cênicas, Visuais, Música) ausentes do catálogo

**Onde:** `CATALOGO_VEST`.

**Problema:** os 24 temas-seed antigos tinham Artes (Música/Visuais/Cênicas), mas o novo `CATALOGO_VEST` não traz Arte como matéria. ENEM e vários vestibulares cobram Arte dentro de Linguagens.

**Correção esperada:** adicionar bloco **Artes** (área `"Linguagens"` para herdar a cor, ou criar área `"Artes"` própria — se criar, **adicionar a chave em `ESP_COLORS` e em `ESPS_VEST`**, senão sai cinza):
```js
{ b: 10, nome: "Artes", t: [
  ["Artes Visuais: Pré-História ao Renascimento", "Linguagens", "Média"],
  ["Artes Visuais: Barroco, Neoclássico, Moderno", "Linguagens", "Média"],
  ["Arte Brasileira (Barroco Mineiro, Modernismo, Semana de 22)", "Linguagens", "Alta"],
  ["Música: Elementos e História", "Linguagens", "Baixa"],
  ["Música Brasileira (Choro, Samba, Bossa Nova, MPB)", "Linguagens", "Média"],
  ["Artes Cênicas: Teatro Grego ao Contemporâneo", "Linguagens", "Baixa"],
  ["Teatro Brasileiro e Cinema", "Linguagens", "Baixa"],
  ["Vanguardas Europeias (Cubismo, Surrealismo, etc.)", "Linguagens", "Alta"],
]},
```
Também adicionar **Redação como fluxo próprio** (já está no catálogo como bloco 9, mas precisa do roteiro de passos do item 2 — corrigir uma redação não é "resolver 20 questões e marcar %"; é escrever → autoavaliar pelas 5 competências → revisar).

---

## 4. 🔴 Registro de erros raso + registro do D0/revisão pede % em vez de acertos

Dois problemas juntos, ambos em `FocusMode.jsx` (bloco `["d4","d7","d21"]`, ~565–610) e no schema de `rev[step]`.

### 4.1 O sistema pede a porcentagem (slider) e deveria calcular
**Estado atual:** um `<input type="range">` de 0–100% onde o aluno *arrasta* o acerto. Isso é impreciso, dá trabalho e mistura percepção com realidade.

**Correção esperada:** capturar **acertos** e **total**, e o sistema calcula a %:
```jsx
// estado: const [questoes,setQuestoes]=useState(""); const [acertos,setAcertos]=useState("");
const total = +questoes || 0;
const certas = Math.min(+acertos || 0, total);
const pct = total > 0 ? Math.round((certas/total)*100) : null;

<Field label="Questões resolvidas"><input type="number" value={questoes} .../></Field>
<Field label="Quantas você acertou?"><input type="number" max={total} value={acertos} .../></Field>
{pct != null && <div>Acerto calculado: <strong className={corPorFaixa(pct)}>{pct}%</strong></div>}
```
- `handleCompleteReview` passa `acerto: pct/100` (mantém o contrato com `markStep`/FSRS, que espera fração 0–1).
- Validar: `acertos ≤ questoes`; bloquear confirmar se vazio.
- O slider some. Opcional: para D1 (brain dump) não há questões — manter como está.

### 4.2 O registro de erro é raso (5 checkboxes globais)
**Estado atual:** quando acerto < 75%, aparecem 5 checkboxes (`lacuna / raciocinio / distractor / descuido / nao_visto`) que valem para a sessão inteira — não por questão, sem qual assunto, sem anotação. O `Simulados.jsx` já tem um modelo melhor (questão a questão), mas o ciclo D0→D21 não.

**Correção esperada — registro de erro estruturado por questão:**
Permitir adicionar N erros, cada um com:
```js
{
  id, subtopico: "",          // qual assunto específico
  tipoErro: "lacuna|raciocinio|distractor|descuido|nao_visto|interpretacao",
  anotacao: "",               // o que aprendi / o que confundi
  virouCard: false,           // marcou pra fazer flashcard
  revisado: false,            // corrigiu depois
}
```
- UI: lista compacta "+" para adicionar erro, com `subtopico` (autocomplete dos subtópicos do tema — ver item 1), `tipoErro` (chips), `anotacao` (input curto). Para vestibular adicionar tipo **"interpretação"** (errar por leitura do enunciado).
- Persistir em `rev[step].erros = [...]` (além do `motivosErro` legado, que pode virar derivado).
- Esses erros alimentam: a **Estatística** (item 7 — "seus erros são 40% interpretação"), o **Anki Audit** (cards a criar = erros com `virouCard`) e o **Mentor**.
- Erros marcados `virouCard` e não `revisado` voltam como pendência (lapso) na fila.

**Critério de aceite:** ao terminar uma revisão com erros, o aluno vê depois *em que subtópico* errou e *por quê*, não só "errou em Matemática".

---

## 5. 🔴 Mentor não diz quanto tempo fica calibrando, nem explica como liberar o uso

**Onde:** `src/core/mentor.js` (`getMentorDiagnosis`, gate `totalSessions < 7`), exibido no Dashboard.

**Estado atual:** mensagem "Estou calibrando. Complete as primeiras sessões para eu aprender seu perfil." — não diz **quantas faltam**, nem **o que cada nível desbloqueia**, nem **o que conta como sessão**. O usuário fica no escuro (sua tela 4 mostra exatamente isso).

**Correção esperada — transparência total do progresso de calibração:**
1. Mostrar contador explícito e barra de progresso: `X de 7 sessões concluídas` (a função já calcula `rem`, só falta expor o total e o atual).
2. Explicar **o que destrava em cada marco**, com linguagem clara:
   - **0–6 sessões (Calibração):** "Estou conhecendo seu ritmo. Faltam **N sessões** para eu liberar seus primeiros diagnósticos (melhor horário de estudo, áreas mais fracas)."
   - **7+ (Diagnóstico Ativo):** "Diagnósticos liberados: horário ótimo, área mais fraca, tendência de acerto, viés de confiança."
   - **30+ (Projeção):** "Liberada a **projeção de desempenho** para o dia da prova."
3. Definir e exibir **o que conta como "sessão"**: uma etapa (D0/D1/D4/D7/D21) concluída. Deixar isso escrito no card.
4. Adicionar tooltip/linha "Como funciona?" no card do Mentor explicando o ciclo D0→D21 em 1 frase.

```js
// retorno na fase de calibração:
return {
  status: "calibracao",
  total: 7, atual: totalSessions, restantes: rem,
  message: `Estou calibrando seu perfil (${totalSessions}/7 sessões). Faltam ${rem} ${rem===1?"sessão":"sessões"} para liberar seus primeiros diagnósticos. Cada etapa de estudo concluída (D0, D1, D4, D7 ou D21) conta como uma sessão.`,
  desbloqueios: [
    { em: 7,  o_que: "Melhor horário, área mais fraca, tendência e viés de confiança" },
    { em: 30, o_que: "Projeção de desempenho para a prova" },
  ],
};
```
**Critério de aceite:** o aluno sempre sabe quantas sessões faltam e o que vai ganhar.

---

## 6. 🟠 Mensagens da plataforma precisam ser muito mais explicativas (o que é, como funciona, como desbloquear)

**Onde:** transversal — `HelpModal`/`Guia de Uso` (`Modals.jsx`), Dashboard vazio, cards de KPI, onboarding, tooltips.

**Problema:** termos como "D0/D1/D4/D7/D21", "FSRS", "True Retention", "Fila Inteligente", "RO: D0", "Viés Metacognitivo" aparecem sem explicação. Um aluno novo não sabe o que fazer nem por quê.

**Correção esperada:**
1. **Glossário in-app** no Guia de Uso, com 1 frase por termo: o que é D0→D21, o que é revisão espaçada, o que é True Retention (acerto nas revisões tardias D21), o que é a Fila Inteligente (ordena o que revisar por urgência×importância×fraqueza).
2. **Tooltips `(i)`** em todo KPI (o Dashboard já tem ícones `Info`/`(i)` — popular com texto real). Ex.: "Acerto Médio: média de acerto em todas as etapas com questões registradas."
3. **Estados vazios explicativos**: quando não há temas/fila/stats, dizer *o próximo passo concreto* ("Vá ao Catálogo → escolha um tópico → Iniciar Ciclo Hoje"), não só um ícone.
4. **Primeiro D0**: micro-tour já existe (`tourStep`); garantir que explique o ciclo inteiro e que o vestibular tenha o tour com tema de vestibular (já parcialmente feito — demo "Funções e Gráficos").
5. Padronizar voz: clara, direta, sem jargão clínico no vestibular.

---

## 7. 🟠 Estatísticas dizem pouco

**Onde:** `StatsPanel.jsx`.

**Estado atual:** KPIs básicos, melhor/pior área, forecast 14d (bom), desempenho por especialidade. Mas: "Análise de Provas" do vestibular é um placeholder vazio; não usa os dados ricos de erro (item 4); sem heatmap de consistência; sem evolução temporal; sem métricas de eficiência.

**Correção esperada (adicionar):**
1. **Heatmap de consistência (estilo GitHub, ~12 semanas)** — dias estudados. (O `calcStreaks` já existe; falta o grid.) Forte gatilho de hábito.
2. **Evolução do acerto no tempo** (linha) — usar `temaStats`/`completedAt` que já são gravados.
3. **Diagnóstico de erros** (depende do item 4): distribuição por `tipoErro` ("42% dos seus erros são interpretação", "30% lacuna de conteúdo") e por subtópico mais errado. Reusar `calcMetricasElite` (já calcula índice de descuido, velocidade, taxa de conversão) — hoje só roda em Simulados; trazer para Stats.
4. **True Retention** e **Bleeding areas** (já existem em `useMetrics`) — expor aqui com explicação.
5. **Análise de Provas do vestibular**: preencher `PROVA_STATS` com ENEM/UFG/UnB/FUVEST (incidência por área, tópicos quentes). Hoje só há dados de residência.
6. **Projeção para a prova** (item 5, marco 30+): mostrar a projeção do Mentor aqui também, com a data-alvo (`meta.dataProva`).

---

## 8. 🟠 Grade Semanal não é efetiva

**Onde:** `CronogramaVest.jsx` (grade), `CronogramaCecilia_MEGA.jsx` (grade fixa legada).

**Problema:** a grade gera dias com blocos genéricos vazios ("BLOCO DE FOCO 1") sem ligação com os tópicos do catálogo nem com a fila FSRS. É um checklist manual desconectado — o aluno preenche na mão e nada conversa com o resto do app (sua tela 3 mostra blocos vazios).

**Correção esperada — fazer a grade gerar de verdade:**
1. **Gerador inteligente**: dado `meta.dataProva`, dias/horas disponíveis por dia e os tópicos priorizados do catálogo, distribuir automaticamente: bloco de **novos D0** + bloco de **revisões da fila FSRS do dia** (`calcFilaInteligente`) + bloco de **questões/simulado**. Encaixar Redação semanal se for vestibular.
2. **Vincular bloco ↔ tema**: cada bloco aponta para tópicos reais; concluir o bloco abre o Modo Foco daquele tema (não um checkbox solto que não mexe no FSRS — corrigir o débito do Cecilia, ver item 11).
3. **Mostrar a carga real**: integrar com o forecast (item 7) — "hoje a grade tem 9 revisões + 2 novos = ~2h".
4. **Aposentar `CronogramaCecilia_MEGA`** de vez (já estava recomendado na v10; o `CronogramaVestHub` usa `CronogramaVest`, mas o arquivo Cecilia ainda existe e cria temas com etapas falsas se chamado).

**Critério de aceite:** "Novo Planejamento" gera uma semana já preenchida com tópicos do catálogo e revisões do dia; concluir um item da grade reflete no progresso FSRS.

---

## 9. 🟠 Perfil deve ser clicável e conter Ajustes + dados que melhoram o uso

**Onde:** `Sidebar.jsx` (card de perfil "fixo, sem popup"), `Modals.jsx` (`AjustesModal`).

**Estado atual:** o card do usuário no rodapé da sidebar **não é clicável** (só o botão de logout funciona). Ajustes é um item separado. Não há onde o aluno informar dados que personalizariam o app.

**Correção esperada:**
1. Tornar o card de perfil **clicável** → abre um painel/modal de Perfil com abas: **Perfil · Ajustes · Dados de Estudo · Conta**.
2. **Dados que melhoram o uso** (persistir em `meta`/novo `perfil`):
   - Vestibular(es)-alvo (`provasAlvo`) e **data da prova** (`dataProva`) — alimentam contagem regressiva, priorização e projeção.
   - **Horas disponíveis por dia / dias da semana** — alimentam o gerador da grade (item 8) e o teto de novos D0.
   - **Meta diária** de revisões/questões (já existe `metaDiaria`).
   - **Plataforma de questões preferida** (substitui "MedEvo" hardcoded — item 2).
   - **Áreas de maior dificuldade** (auto-preenchível pelo Mentor, editável).
   - **Horário preferido de estudo** (cruza com o insight de horário do Mentor).
3. Mover o conteúdo do `AjustesModal` para dentro como uma aba (não duplicar).
4. **Itens de conta que faltam** (já recomendados na v10, reforçar): reset de senha, exportar/importar dados, **excluir conta (LGPD)**.

**Critério de aceite:** clicar no avatar abre o painel; preencher "data da prova" e "horas/dia" muda a contagem regressiva e a grade.

---

## 10. 🟠 Dashboard precisa ser mais compacto e bem disposto (referência MedEvo, adaptado a SRS)

**Onde:** `Dashboard.jsx` (748 linhas, layout vertical com cards grandes empilhados — `max-w-4xl/5xl mx-auto`, hero gigante de boas-vindas).

**Comparação com o MedEvo (tela 5):** o MedEvo concentra no topo, em uma faixa compacta: saudação + semana (heatmap mini) + ofensiva + "jogo do dia"; e logo abaixo uma linha de 3 KPIs (Questões, Tempo, Cards) e um painel único "Revisões Pendentes" com 2 botões grandes (Cards / Erros). Densidade alta, tudo "acima da dobra".

**Estado atual do MedRev:** muito espaço vazio, hero de boas-vindas ocupa meia tela, KPIs (Acerto/Dominados/True Retention) ficam **abaixo da dobra**, "Iniciar Foco" é o foco mas o resto está esparramado.

**Correção esperada — redesenhar o topo do Dashboard (adaptado à revisão espaçada):**
1. **Faixa superior compacta** (uma linha em desktop): saudação + data · streak/ofensiva · mini-heatmap da semana (7 quadrados) · contagem regressiva da prova.
2. **Linha de KPIs compacta** (3–4 cards pequenos, acima da dobra): Revisões hoje (X) · Acerto médio · Dominados (D21) · True Retention — cada um com tooltip `(i)`.
3. **Card de ação principal** "Você tem N revisões hoje" + botão **Iniciar Foco** (manter, é o coração do SRS) — equivalente ao "Revisões Pendentes" do MedEvo, mas orientado à fila FSRS, não a "596 cards/700 erros".
4. **Mentor** abaixo, compacto (1–2 linhas + barra de calibração do item 5).
5. **Forecast mini** (7 dias) como faixa, link para Stats.
6. Reduzir paddings (`p-8/p-12` → `p-4/p-5`), tirar o hero gigante quando já há temas, usar grid de 2–3 colunas em vez de empilhar. Densidade tipo MedEvo, **sem** copiar a semântica de "cards/erros" — aqui a unidade é a etapa de revisão.

**Critério de aceite:** ao abrir o Dashboard com temas ativos, tudo que importa (saudação, streak, KPIs, ação principal) cabe sem rolar em tela de notebook.

---

## 11. 🟡 Retenção / "vício saudável" na plataforma (engajamento)

Transversal. O app já tem base boa (streak, confetti, marcos, Mentor). O que falta para fechar o loop de hábito (gatilho → ação → recompensa → investimento):

1. **Streak com proteção**: "freeze"/dia de folga (1 por semana) para não punir o aluno por um dia perdido — evita abandono pós-quebra de streak. Aviso de "streak em risco" já existe (bom).
2. **Heatmap de consistência visível** no Dashboard e Stats (item 7/10) — ver o calendário preencher é um dos gatilhos mais fortes.
3. **Metas e marcos com celebração** (já há confetti em D21 e marcos 7/14/30/100/200) — adicionar marcos de streak (7/30/100 dias) e de questões.
4. **Recompensa diária clara**: ao zerar a fila do dia, tela de "missão cumprida" + frase do Mentor (já existe parcialmente em `meta_diaria`).
5. **Resumo semanal** ("essa semana você revisou 23 tópicos, +5% de acerto em Química") — e-mail/push se houver PWA.
6. **Notificação/lembrete diário** (PWA push ou e-mail) — SRS vive de constância. (Recomendado na v10.)
7. **"Próxima melhor ação" sempre visível** — o Dashboard já sugere o tema de maior impacto; manter isso como CTA único e óbvio (reduz fricção de decisão).
8. **Progresso tangível**: barra "X% do edital coberto" por matéria (quantos subtópicos já entraram em ciclo) — dá sensação de avanço concreto rumo à prova.
9. Evitar dark patterns: nada que gere ansiedade tóxica; o objetivo é constância sustentável, não culpa.

---

## ORDEM DE EXECUÇÃO SUGERIDA

1. **2 + 4.1** (passos por plataforma + acerto calculado em vez de slider) — corrige o que está conceitualmente errado no fluxo de estudo.
2. **1 + 3** (catálogo profundo com subtópicos + Artes) — a base de conteúdo do vestibular.
3. **4.2** (registro de erro estruturado) — destrava as estatísticas.
4. **5 + 6** (Mentor transparente + textos explicativos) — onboarding/clareza.
5. **9** (perfil clicável + dados de estudo) — alimenta grade e projeção.
6. **8** (grade semanal efetiva, ligada ao catálogo e à fila).
7. **7 + 10** (estatísticas ricas + dashboard compacto).
8. **11** (engajamento) — contínuo.

---

## RESUMO POR DEMANDA

| Sua demanda | Item | Severidade |
|---|---|---|
| Expandir tópicos/subtópicos do vestibular | 1 | 🔴 |
| Passos de estudo do vest = medicina (errado) | 2 | 🔴 |
| Artes (cênicas/visuais/música) | 3 | 🟠 |
| Registro de erros raso | 4.2 | 🔴 |
| D0/revisão pede % e não acertos (sistema deveria calcular) | 4.1 | 🔴 |
| Mentor não diz tempo de calibração | 5 | 🔴 |
| Mensagens pouco explicativas / como liberar uso | 6 | 🟠 |
| Estatísticas dizem pouco | 7 | 🟠 |
| Grade semanal não efetiva | 8 | 🟠 |
| Perfil não clicável / faltam dados do usuário | 9 | 🟠 |
| Dashboard mal disposto (ref. MedEvo, adaptar a SRS) | 10 | 🟠 |
| Vício saudável / experiência do usuário | 11 | 🟡 |
