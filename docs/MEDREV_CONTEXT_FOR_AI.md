# MEDREV — Visão Geral Completa para Claude/Codex

> **Coloque este arquivo em:** `docs/MEDREV_CONTEXT_FOR_AI.md`  
> **Uso:** peça para Claude/Codex ler este documento antes de qualquer auditoria ou implementação.  
> **Objetivo:** dar uma visão geral de produto, persona, marketing, arquitetura, pastas, dados, regras de UX e limites técnicos para que a IA consiga mexer no MedRev sem criar features soltas ou quebrar integrações.

---

## 1. Resumo executivo

O **MedRev** é um sistema operacional de estudo para preparação de residência médica e, opcionalmente, vestibular.

Ele não é um banco de questões. Ele é a camada que organiza, prioriza, registra, interpreta e corrige o estudo do aluno.

A tese central:

```txt
Banco de questões = onde o aluno responde.
MedRev = onde o aluno decide o que fazer, registra o que aconteceu, corrige erros e mantém revisão inteligente.
```

O MedRev deve responder diariamente:

```txt
O que eu estudo hoje?
Por que isso é prioridade?
Quanto tempo vai levar?
Como executo essa tarefa?
O que eu errei?
Que tipo de erro foi?
O que faço para corrigir?
Quando devo rever esse tema?
Estou evoluindo de verdade?
Estou sobrecarregado?
```

O produto deve parecer menos um “dashboard cheio de recurso” e mais um **mentor operacional**:

```txt
Planejar → Executar → Registrar → Corrigir → Reagendar → Decidir próximo passo
```

---

## 2. O que o MedRev é

O MedRev é:

```txt
1. Sistema de revisão inteligente.
2. Mentor de próxima ação.
3. Organizador de cronograma e prioridades.
4. Camada complementar ao banco de questões.
5. Ferramenta de diagnóstico de erros.
6. Ferramenta de revisão espaçada.
7. Plataforma de raciocínio clínico educacional.
8. Painel de evolução acionável.
9. Produto de baixo atrito para saber o que fazer hoje.
```

Ele deve ajudar o aluno a:

```txt
priorizar temas;
não se perder no volume;
corrigir erros de forma prática;
não revisar cedo ou tarde demais;
evitar sobrecarga;
entender desempenho;
usar simulados para gerar plano;
treinar raciocínio clínico quando fizer sentido;
manter consistência.
```

---

## 3. O que o MedRev NÃO é

O MedRev não é:

```txt
1. Banco de questões completo.
2. Concorrente direto de MedQ, MedCof, Estratégia, MedEvo ou bancos de questões.
3. Dashboard de BI cheio de gráfico sem ação.
4. App genérico de agenda.
5. App genérico de anotações.
6. Prontuário médico.
7. Ferramenta assistencial.
8. Ferramenta de prescrição real.
9. IA médica para paciente real.
10. Coleção de features soltas.
11. Produto em que o usuário precisa configurar tudo manualmente.
12. Produto que mistura Vestibular com ENAMED/Raciocínio Clínico.
```

Se uma implementação empurrar o MedRev para esses caminhos, rejeitar por padrão.

---

## 4. Visão de marketing e posicionamento

### 4.1 Frase curta

```txt
MedRev transforma revisão, simulados e erros em uma próxima ação clara para aprovação.
```

### 4.2 Posicionamento

```txt
O MedRev não substitui seu banco de questões. Ele organiza seu estudo, prioriza o que fazer, interpreta seus erros e cria um ciclo inteligente de revisão.
```

### 4.3 Benefício principal

```txt
Você abre o app e sabe exatamente o que fazer agora, por que isso importa e quando reencontrar o tema.
```

### 4.4 Diferenciais

```txt
1. Mentor de próxima ação.
2. Revisão espaçada com lógica FSRS-like.
3. “Já domino” com validação e entrada inteligente no ciclo.
4. Diagnóstico de erros com ação corretiva.
5. Raciocínio clínico integrado ao ciclo de revisão.
6. Cronogramas por provider: MEDCOF, Estratégia e Custom.
7. Separação clara entre Residência e Vestibular.
8. Estatísticas acionáveis, não só gráficos.
```

---

## 5. Personas

### 5.1 Persona A — Estudante de medicina / residência

**Perfil**

```txt
Estudante de medicina ou médico recém-formado.
Quer passar em residência/ENAMED.
Usa banco de questões.
Tem ansiedade com volume de conteúdo.
Não sabe priorizar.
Quer saber o que fazer hoje.
```

**Dor principal**

```txt
Tenho conteúdo demais, questões demais e métricas demais. Quero saber o que fazer hoje para aumentar minha chance de aprovação.
```

**Jobs to be Done**

```txt
Quando eu abro o app, quero saber minha próxima ação.
Quando erro, quero saber que tipo de erro foi e como corrigir.
Quando atraso revisão, quero saber o que recuperar primeiro.
Quando faço simulado, quero transformar resultado em plano.
Quando estudo tema clínico, quero treinar raciocínio e conduta.
Quando estou sobrecarregado, quero que o sistema reduza minha carga.
```

**O que valoriza**

```txt
clareza;
priorização;
ação concreta;
segurança;
baixo atrito;
evolução visível;
explicação do porquê;
revisão inteligente.
```

**O que não quer**

```txt
mais um dashboard confuso;
gráfico sem ação;
mais uma lista manual de tarefas;
linguagem ruim;
ter que configurar tudo sozinho;
feature bonita, mas sem consequência.
```

---

### 5.2 Persona B — Vestibulando

**Perfil**

```txt
Estudante de ENEM, Fuvest, Unicamp ou outra prova.
Precisa de cronograma, simulados, matéria fraca e revisão.
Não precisa de raciocínio clínico nem ENAMED.
```

**Dor principal**

```txt
Quero começar rápido, escolher minha prova-alvo e saber o que estudar primeiro.
```

**Vestibular deve ter**

```txt
trilha inicial;
prova-alvo;
data/janela da prova;
simulados;
matéria fraca;
cronograma;
revisão espaçada;
Mentor;
Estatísticas simples.
```

**Vestibular não deve ter**

```txt
ENAMED como eixo principal;
Raciocínio Clínico;
Illness Script;
Casos clínicos;
Conduta médica;
Prescrição;
SCT médico;
linguagem de residência médica.
```

Toda feature nova deve respeitar `featureEnabled(plat, feature)`.

---

## 6. Jornada central do usuário

### 6.1 Ciclo diário ideal

```txt
1. Usuário abre o app.
2. Tela Hoje mostra Comando do Mentor.
3. Usuário entende por que aquela ação foi escolhida.
4. Usuário clica em Começar.
5. Executa revisão, estudo, simulado ou tarefa clínica.
6. Registra desempenho/erro.
7. Sistema classifica consequência.
8. Sistema agenda próxima revisão.
9. Mentor atualiza próxima ação.
10. Stats mostra diagnóstico depois, não antes.
```

### 6.2 Ciclo de erro

```txt
errou → classificou erro → recebeu ação corretiva → Mentor usa → revisão/plano ajusta
```

### 6.3 Ciclo de simulado

```txt
simulado → análise → áreas fracas → erro dominante → ação corretiva → revisão/tema novo
```

### 6.4 Ciclo de raciocínio clínico

```txt
tema clínico → revisão adequada → problem representation → diferenciais → caso → conduta educacional → feedback
```

---

## 7. Navegação ideal

A navegação deve ser por jornada, não por módulo interno.

```txt
Hoje
Plano
Estudar
Estatísticas
Banco
Mais
```

### Hoje

Tela de ação diária.

Deve responder:

```txt
O que faço agora?
Por que isso?
Quanto tempo leva?
O que vem depois?
Existe algum alerta?
```

Conteúdo ideal:

```txt
Comando do Mentor;
próximas 2 ações;
carga curta;
alertas acionáveis;
avançado colapsado.
```

### Plano

Cronograma e calendário-base.

Inclui:

```txt
MEDCOF;
Estratégia;
Custom;
temas;
prioridades;
“Já domino”;
tema novo recomendado.
```

### Estudar

Execução.

Inclui:

```txt
modo foco;
revisões;
simulados;
análise de prova;
tarefas guiadas;
raciocínio clínico quando for ação de revisão.
```

### Estatísticas

Diagnóstico.

Inclui:

```txt
Resumo;
Aprendizagem;
Erros;
Provas/Simulados;
Raciocínio Clínico;
Atividade;
Sistema.
```

### Banco

Cadastro/base.

Inclui:

```txt
temas;
casos;
cronogramas;
catálogos;
mapeamentos;
dados-base.
```

### Mais

Ferramentas ocasionais.

Inclui:

```txt
Raciocínio Clínico;
Anki Audit;
Weekly Review;
Data Safety;
Launch Checklist;
Guia;
Ajustes;
Academia/Método.
```

---

## 8. Regras de UX

### 8.1 Dashboard / Hoje

Dashboard não é lugar para todos os gráficos.

**Deve conter:**

```txt
1. Comando do Mentor.
2. Próximas 2 ações.
3. Carga de hoje em frase curta.
4. Alertas importantes.
5. Avançado colapsado.
```

**Não deve conter no topo:**

```txt
gráficos longos;
painéis avançados;
métricas sem ação;
histórico longo;
diagnóstico profundo;
feature experimental;
configurações;
debug.
```

Regra:

```txt
Dashboard = ação.
Stats = diagnóstico.
Mais = ferramenta.
Sistema = configuração/segurança.
```

### 8.2 ActionInbox

ActionInbox não deve competir com o Comando do Mentor.

Ele deve ser tratado como:

```txt
execução do plano;
fila subordinada;
não como segunda recomendação principal.
```

### 8.3 Cards e métricas

Evitar cards soltos que aumentem ansiedade. Toda métrica deve ter consequência.

---

## 9. Mentor

O Mentor é o motor de decisão. Não é frase motivacional.

### Deve usar

```txt
FSRS/curva de revisão;
revisões vencidas;
relearning/reaprendendo;
carga de hoje;
cronograma/provider;
simulado/prova;
erro dominante;
raciocínio clínico;
plataforma: Residência ou Vestibular;
sinais de sobrecarga.
```

### Ordem de decisão recomendada

```txt
1. risco de dados/sync/estado inválido;
2. sobrecarga;
3. reaprendendo;
4. revisões vencidas;
5. revisão de hoje;
6. simulado/prova pendente de análise;
7. erro dominante com ação corretiva;
8. caso clínico devido;
9. tema novo se carga permite;
10. descanso/bloco leve.
```

### Contrato de ação

Ação do Mentor precisa ter:

```txt
id;
type;
priority;
title;
subtitle;
reason;
explain;
cta;
ctaView;
estimatedMinutes;
confidence;
target;
source.
```

Regra crítica:

```txt
Ação sem target executável não pode ser botão principal.
```

Se não tiver target:

```txt
mostrar “Ver plano”;
gerar warning interno.
```

---

## 10. Estatísticas

Stats deve explicar o que está acontecendo, se dá para confiar e o que fazer.

### Seções

```txt
Resumo
Aprendizagem
Erros
Provas/Simulados
Raciocínio Clínico
Atividade
Sistema
```

### Toda métrica deve ter

```txt
label humano;
descrição;
estado vazio;
nível de confiança;
ação recomendada;
plataforma;
seção.
```

### Evitar

```txt
100% sem amostra;
“coletando” sem explicar;
ENAMED no Vestibular;
Raciocínio Clínico no Vestibular;
Data Safety misturado com aprendizagem;
debug no fluxo normal;
jargão cru como FSRS, Relearning, Overload, True Retention.
```

### Métricas importantes

```txt
Preparo estimado;
Retenção longa;
Carga de hoje/semana;
Revisões vencidas;
Reaprendendo;
Cobertura por área;
Acerto de simulados;
Erro dominante;
Score de raciocínio clínico;
Consistência semanal;
Saúde do sistema.
```

---

## 11. Erros e ações corretivas

Erro precisa virar ação.

### Fluxo correto

```txt
errou → classifica → entende → recebe ação corretiva → Mentor usa → revisão/plano ajusta
```

### Fonte canônica

A taxonomia canônica deve ficar em:

```txt
src/core/errorTaxonomy.js
```

Não criar taxonomias paralelas.

`errorActionMap.js` deve mapear tipos para ações.

### Tipos de erro

```txt
conteudo;
memoria;
raciocinio;
representacao_problema;
diferencial;
incerteza_sct;
conduta_prescricao;
interpretacao;
distracao;
tempo;
confianca_mal_calibrada;
estrategia_prova;
chute.
```

### Ações esperadas

```txt
conteudo → revisão curta + questões externas;
memoria → FSRS/Anki;
raciocinio → mini caso + problem representation;
representacao_problema → one-liner + dados discriminantes;
diferencial → 3 diferenciais + must-not-miss;
incerteza_sct → SCT curto;
conduta_prescricao → management station educacional;
interpretacao → leitura diagnóstica;
distracao → checklist/bloco cronometrado;
tempo → bloco cronometrado;
confianca_mal_calibrada → estimativa prévia + revisão calibrada;
estrategia_prova → análise de prova/simulado.
```

Vestibular não deve receber `conduta_prescricao`.

---

## 12. Raciocínio Clínico

Raciocínio Clínico não deve ser só uma aba lateral.

### Modo 1 — Caso completo

```txt
Vinheta;
Problem representation;
Hipóteses + must-not-miss;
Illness script de memória;
SCT/nova informação;
Conduta e prescrição simulada;
Feedback + reencontro.
```

### Modo 2 — Revisão FSRS multimodal

Progressão atual sugerida:

```txt
D1  → Brain dump estruturado;
D4  → Raciocínio diagnóstico / illness recall;
D7  → Diferenciais e armadilhas;
D21 → Mini caso clínico;
Manutenção → SCT/conduta avançada futuramente.
```

### Brain dump estruturado

Para temas grandes, não usar “escreva tudo que lembra”.

Usar:

```txt
1. Definição/quadro geral;
2. Diagnóstico;
3. Diferenciais;
4. Conduta;
5. Não pode perder.
```

### Conduta/prescrição

Apenas simulação educacional.

Aviso obrigatório:

```txt
Uso educacional. Não aplicar em paciente real.
```

### Score

Fonte canônica:

```txt
src/core/clinicalReasoningScoring.js
```

Não criar novo `calcRaciocinioScore` paralelo.

---

## 13. “Já domino”

“Já domino” é validação de domínio prévio.

Não é domínio definitivo.

### Critério

```txt
mínimo 15 questões;
mínimo 80% de acerto.
```

### Resultado

```txt
80–89% → primeira revisão D7;
>=90% → primeira revisão D14;
<80% ou <15 questões → não valida; iniciar D0.
```

### Após validar

O tema deve:

```txt
sair de unstarted;
ter status validado_previo;
registrar dominioPrevio;
mudar card imediatamente;
entrar no ciclo de revisão;
aparecer na fila quando vencer;
nunca mostrar RO: D1 se a primeira revisão é D7/D14.
```

---

## 14. Copy e linguagem

Português visível precisa passar confiança.

### Usar

```txt
Hoje;
Plano;
Estudar;
Preparo estimado;
Retenção longa;
Modo Mentor;
Carga de hoje;
Revisões vencidas;
Coletando revisões longas;
Ação corretiva;
Domínio prévio;
Validação;
Raciocínio diagnóstico.
```

### Evitar/substituir

```txt
Dashboard → Hoje;
Cronograma → Plano;
Prontidão → Preparo estimado;
True Retention → Retenção longa;
Modo Simples → Modo Mentor;
FSRS → Curva de revisão;
Relearning → Reaprendendo;
Overload → Carga alta;
Bleeding Score → Risco de esquecimento;
Analise → Análise;
Acao → Ação;
Nao → Não;
Voce → Você;
Faca → Faça;
calendario → calendário;
validacao → validação;
dominio → domínio.
```

IDs internos podem permanecer. Labels visíveis devem seguir o glossário.

---

## 15. Dados e estado

### Tema

Um tema tende a ter:

```txt
id;
nome;
esp/área;
prioridade;
provider;
status;
unstarted;
rev;
dominioPrevio;
metadata.
```

### Revisão

A estrutura `rev` contém etapas como:

```txt
d0;
d1;
d4;
d7;
d21;
maintenance;
reviewHistory;
relearning;
stability;
difficulty.
```

A IA não deve assumir que todo step existe. Deve usar helpers.

### Domínio prévio

```txt
dominioPrevio.validado;
questoes;
acerto;
validatedAt;
primeiraRevisao;
primeiraRevisaoLabel;
primeiraRevisaoDate;
source.
```

### Mentor

Sinais esperados:

```txt
dueReviews;
overdueReviews;
relearningItems;
todayWorkload;
dominantError;
calendarProvider;
platform;
nextAction.
```

### Erros

```txt
tipo;
origem;
temaId;
area;
data;
ação corretiva;
confidence.
```

### Raciocínio clínico

```txt
casoId;
temaId;
problemRepresentationScore;
hypothesisScore;
illnessScriptScore;
sctScore;
managementScore;
safetyScore;
overallScore.
```

### Activity Log

Activity Log ainda deve ser tratado com cuidado.

Só criar depois de resolver multiusuário/Bloco N.

---

## 16. Dados, privacidade e multiusuário

Multiusuário é P0.

Dados privados devem ser escopados por `uid`.

Arquitetura esperada:

```txt
localStorage:
medrev:<env>:user:<uid>:store

Firestore:
/users/{uid}/state/main
/users/{uid}/activityLog
/users/{uid}/backups
```

Não criar novos logs/históricos persistentes se isolamento por conta não estiver resolvido.

---

## 17. Arquitetura de pastas conhecida/inferida

> Esta seção é baseada no estado discutido do projeto. Se algum arquivo não existir, a IA deve registrar como ausente e continuar.

### Raiz

```txt
package.json
package-lock.json
README.md
AGENTS.md
firestore.rules
firebase.json
.env.example
```

### `src/`

Pasta principal do app React.

```txt
src/App.js
src/App.css
```

`App.js` costuma orquestrar:

```txt
auth;
view atual;
sidebar/bottom nav;
plataforma res/vest;
hidratação de store;
sync;
render das telas.
```

### `src/components/`

Componentes de UI.

Arquivos importantes discutidos:

```txt
Dashboard.jsx
Sidebar.jsx
BottomNav.jsx
Cronograma.jsx
FocusMode.jsx
StatsPanel.jsx
RaciocinioClinico.jsx
ErrorActionCenter.jsx
ErrorActionPrompt.jsx
VestibularStartTrail.jsx
Modals.jsx
RetrievabilitySpark.jsx
ActionInbox.jsx
DataSafetyPanel.jsx
LaunchChecklistPanel.jsx
WeeklyReview.jsx
```

### `src/core/`

Lógica de produto.

Arquivos importantes:

```txt
store.js
fsrs.js
domainValidation.js
mentorSignals.js
mentorDecisionPolicy.js
mentorAutopilot.js
metricsRegistry.js
errorTaxonomy.js
errorActionMap.js
clinicalReasoningScoring.js
reviewTaskPlanner.js
navigationModel.js
platformFeatures.js
copy.js
vestibularOnboarding.js
calendarProvider.js
provaAnalyzer.js
enamedIntel.js
sessionReflection.js
actionInbox.js
userScope.js
authSession.js
userDataMigration.js
readiness.js
illnessScript.js
```

### `src/constants/`

Dados estáticos.

Possíveis arquivos:

```txt
casosClinicos.js
calendarios.js
temas.js
```

### `src/services/`

Integrações externas.

Possíveis arquivos:

```txt
firebase.js
userDataPaths.js
```

### `src/hooks/`

Hooks reutilizáveis.

Possíveis arquivos:

```txt
useMetrics.js
useAuthScope.js
```

### `scripts/`

Automação local.

Arquivos conhecidos:

```txt
audit.mjs
check-mojibake.mjs
audit-encoding.mjs
backup.ps1
checkpoint.ps1
pre-ai.ps1
```

### `docs/`

Documentação de produto e handoff para IA.

Arquivos recomendados:

```txt
MEDREV_PRODUCT_CHARTER.md
MEDREV_CONTEXT_FOR_AI.md
PRODUCT_PERSONA_UX_AUDIT.md
MEDREV_PROTOCOLO_SOLO_CLAUDE_CODEX.md
P2_STATS_DECISIONS.md
P3_ERROR_ACTION_DECISIONS.md
P4_REVIEW_TASK_PLANNER_DECISIONS.md
```

---

## 18. Função dos principais módulos

### `store.js`

Estado global, provavelmente Zustand.

Regras:

```txt
não mexer sem necessidade;
não alterar persistência sem autorização;
não misturar usuários;
não criar estado paralelo.
```

### `fsrs.js`

Lógica de revisão, estabilidade, dificuldade, fases e datas.

Regras:

```txt
usar helpers;
não quebrar D0/D1/D4/D7/D21;
não mostrar step bruto se display semântico for diferente.
```

### `domainValidation.js`

Fluxo “Já domino”.

Deve garantir D7/D14 corretos.

### `mentorSignals.js`

Constrói sinais para o Mentor.

### `mentorDecisionPolicy.js`

Decide prioridade do Mentor.

### `mentorAutopilot.js`

Orquestra outputs do Mentor.

### `metricsRegistry.js`

Fonte canônica das métricas.

### `errorTaxonomy.js`

Fonte canônica dos tipos de erro.

### `errorActionMap.js`

Mapeia erro para ação corretiva.

### `clinicalReasoningScoring.js`

Fonte canônica do score de raciocínio clínico.

### `reviewTaskPlanner.js`

Escolhe tarefa de revisão conforme tema, step, plataforma, erros e casos.

### `navigationModel.js`

Fonte canônica de navegação.

### `platformFeatures.js`

Gating entre Residência e Vestibular.

### `copy.js`

Glossário e labels PT-BR.

### `vestibularOnboarding.js`

Trilha inicial do Vestibular.

---

## 19. Regras para criar, modificar ou excluir

### Criar quando

```txt
resolve dor clara;
encaixa no ciclo do produto;
tem CTA;
registra dado útil;
alimenta Mentor ou Stats;
tem teste;
não aumenta confusão.
```

### Modificar quando

```txt
melhora clareza;
reduz fricção;
unifica lógica duplicada;
corrige estado invisível;
melhora feedback;
preserva compatibilidade.
```

### Excluir/adiar quando

```txt
duplica outra função;
é só visual;
não tem ação;
não tem persona clara;
cria métrica sem decisão;
confunde usuário novo;
vaza medicina para Vestibular;
exige persistência antes do Bloco N.
```

### Mover para Mais quando

```txt
é útil, mas ocasional;
é avançado;
é configuração;
é método/guia;
é segurança/sistema.
```

### Mover para Stats quando

```txt
é diagnóstico;
é retrospectivo;
é métrica;
não precisa aparecer todo dia.
```

---

## 20. Regras técnicas para IA

Antes de editar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Não usar:

```txt
ls -R
dir /s
tree
find .
Get-ChildItem -Recurse
busca em node_modules/build/audit/backups
```

Usar:

```bash
git grep
git ls-files
```

Depois de editar:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
npm run audit:full
```

Não fazer:

```txt
commit;
deploy;
push;
instalar libs;
refactor gigante;
mexer em múltiplas fases sem autorização.
```

---

## 21. Como a IA deve trabalhar

### Preferir ajustes pontuais

Bom:

```txt
Corrija somente D21 do reviewTaskPlanner.
Atualize testes desse arquivo.
Não toque no FocusMode.
```

Ruim:

```txt
Implemente P2, P3, P4 e melhore o app inteiro.
```

### Escopos ideais

Hotfix:

```txt
1 arquivo;
1 comportamento;
1 teste.
```

Feature pequena:

```txt
2 a 5 arquivos;
sem refactor global.
```

Auditoria:

```txt
Opus/Thinking;
sem implementação.
```

---

## 22. Definition of Done

Uma mudança está pronta se:

```txt
tem propósito por persona;
tem CTA claro;
não aumenta navegação;
não cria métrica solta;
não quebra Vestibular;
não vaza medicina para Vestibular;
não cria taxonomia paralela;
não cria score paralelo;
passa mojibake;
passa testes;
passa build;
tem QA manual descrito.
```

---

## 23. Prompts base para Claude/Codex

### 23.1 Prompt base antes de qualquer implementação

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Você deve respeitar o que o MedRev é e o que não é.

Não crie features soltas.
Não crie dashboards sem ação.
Não crie métricas sem explicação.
Não crie taxonomias paralelas.
Não crie lógica médica no Vestibular.
Não mexa em persistência sem autorização.
Não crie Activity Log antes do isolamento multiusuário.

Toda mudança deve responder:
- Para qual persona?
- Qual dor resolve?
- Onde aparece na jornada?
- Qual tarefa cria?
- Qual dado registra?
- Qual ação corretiva gera?
- Como o Mentor usa?
- Como Stats usa?
- Qual teste prova?

Se não souber responder, pare e peça decisão.
```

### 23.2 Prompt base de hotfix

```txt
Execute somente este hotfix:

[descrever comportamento exato]

Arquivos permitidos:
[listar arquivos]

Não alterar:
[listar módulos proibidos]

Critérios:
[listar testes/resultado esperado]

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare ao final e entregue relatório.
```

### 23.3 Prompt base de auditoria

```txt
Aja como auditor sênior de produto, UX e engenharia.

Não implemente nada.

Leia docs/MEDREV_CONTEXT_FOR_AI.md.

Audite somente:
[área]

Entregue:
1. diagnóstico;
2. o que está correto;
3. o que está quebrado;
4. riscos;
5. ações em ordem;
6. arquivos a tocar;
7. arquivos proibidos;
8. testes.

Não edite arquivos.
```

---

## 24. Prioridades atuais do produto

Ordem segura:

```txt
1. Recuperação/checkpoint do estado atual.
2. Hotfix Já domino D7/D14, se ainda não passou.
3. P1 Clareza inicial, se ainda houver ruído no Hoje.
4. P2 Stats diagnóstico.
5. P3 Erro dominante e ação corretiva.
6. P4 Raciocínio clínico integrado.
7. Bloco N multiusuário, se ainda não resolvido.
8. Activity Log / calendário histórico.
9. Polish final.
```

Antes de cada item:

```txt
branch + checkpoint + backup
```

Depois de cada item:

```txt
test + build + audit + commit local
```

---

## 25. Observações finais

O MedRev já tem muitas funções. O risco agora não é falta de feature.

O risco é:

```txt
confusão;
redundância;
jargão;
métrica sem ação;
feature solta;
regressão;
dados misturados;
Vestibular contaminado por medicina;
Raciocínio Clínico virando brinquedo lateral.
```

A IA deve preferir:

```txt
integrar;
simplificar;
reclassificar;
colapsar;
explicar;
testar;
preservar.
```

Em caso de dúvida, não implementar. Perguntar.
