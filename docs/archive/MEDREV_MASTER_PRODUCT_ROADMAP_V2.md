# MEDREV — Plano Mestre de Produto e Implementação: Dashboard, Plano, Simulados, Estatísticas, Raciocínio Clínico, Anki, Perfil e Método

> **Arquivo sugerido no repo:** `docs/MEDREV_MASTER_PRODUCT_ROADMAP_V2.md`  
> **Data:** 2026-06-03  
> **Objetivo:** amadurecer as ideias levantadas pelo usuário e transformá-las em um plano de produto coerente, implementável em blocos, sem transformar o MedRev em banco de questões nem em dashboard confuso.  
> **Princípio central:** o MedRev precisa ser o sistema operacional do estudo: **planejar → executar → registrar → corrigir → revisar → medir → ajustar**.

---

# 0. Diagnóstico executivo

O MedRev está ficando poderoso, mas o risco atual é **excesso de funções mal posicionadas**.

O usuário já identificou corretamente os problemas:

```txt
1. Dashboard virou mistura de comando, métricas, mentor, agenda e diagnóstico.
2. Agenda e Cronograma ainda não fecham totalmente o loop de execução.
3. Simulados têm potencial alto, mas o fluxo de registro/correção está fraco.
4. Preparo estimado parece número bonito, mas ainda não tem cálculo confiável.
5. Estatísticas acumulam métricas sem hierarquia.
6. Raciocínio clínico é diferencial forte, mas precisa virar fluxo integrado.
7. Anki Audit é mais operacional do que Banco, então merece navegação principal.
8. Banco não tem função clara hoje.
9. Perfil/Ajustes/Segurança estão presos em popups.
10. Guia/Academia/Método ainda não ensinam o método como produto.
```

A direção recomendada é:

```txt
MedRev não é banco de questões.
MedRev não é só planner.
MedRev não é só FSRS.
MedRev é um cockpit de execução diária + revisão inteligente + pós-simulado + raciocínio clínico.
```

---

# 1. Nova arquitetura de navegação

## 1.1 Navegação principal recomendada

Para o estágio atual do produto, a navegação principal deveria ser:

```txt
Hoje
Plano
Simulados
Raciocínio Clínico
Anki Audit
Mais
```

## 1.2 O que vai para Mais

```txt
Estatísticas
Banco de Temas
Perfil e Configurações
Segurança dos Dados
Academia & Método
Guia de Uso
Conquistas
Pomodoro
Políticas do Site
```

## 1.3 Justificativa

### Hoje

Ação diária. Deve responder:

```txt
O que faço agora?
Quantas questões fiz hoje?
Quantas revisões/flashcards fiz hoje?
Meu ritmo está adequado?
Qual é a próxima ação?
```

### Plano

Cronograma, agenda, temas, distribuição por semanas, prioridades e ajustes.

### Simulados

Estratégia de simulados, registro de provas, auditoria de erros, recomendação de frequência, banco de simulados/provas feitas.

### Raciocínio Clínico

Treino prático, illness script, casos clínicos, criação de casos e integração com revisões.

### Anki Audit

Execução e auditoria diária do Anki, porque é uma função operacional recorrente.

### Mais

Tudo que é diagnóstico profundo, configuração, documentação, segurança e histórico.

---

# 2. Dashboard / Hoje

## 2.1 Regra de produto

Dashboard não é estatísticas.

Dashboard deve conter apenas:

```txt
1. Comando do dia.
2. Métricas de execução de hoje.
3. Plano de hoje em ordem inteligente.
4. CTA para a próxima ação.
5. Saldo de ritmo.
6. Atalho para Anki do dia, se pendente.
```

## 2.2 O que remover do Dashboard

Mover para Estatísticas:

```txt
Análise completa do Mentor.
Avançado.
Preparo estimado.
Gargalo ENAMED profundo.
Carga dos próximos 14 dias.
Volume total de questões.
Mapa de prioridade.
Gráficos de simulados.
Estatísticas elite.
```

Remover:

```txt
Itens de prontidão.
Cards que não têm ação.
Métricas sem amostra mínima.
```

## 2.3 Cards principais do Dashboard

### Card 1 — Comando do dia

Deve mostrar:

```txt
Boa noite, Enzo.
Prova em 103 dias.
Comando do dia: Estudar X / Revisar Y / Fazer Anki / Registrar simulado.
Por quê: motivo curto.
Tempo estimado.
Botão primário executável.
Botão secundário: Ver agenda / Ver plano.
```

A contagem regressiva da prova deve sair do card de perfil/nível e ir para o Comando do Dia.

### Card 2 — Questões de hoje

Visual: gráfico circular/pizza.

Dados:

```txt
questões feitas hoje;
meta diária;
média de acertos hoje;
variação em relação à média móvel.
```

### Card 3 — Revisões/Flashcards de hoje

Visual: gráfico circular/pizza.

Dados:

```txt
cards/revisões feitos hoje;
meta diária;
again/erros;
novos;
streak/adesão.
```

### Card 4 — Saldo de ritmo

Substituir “prontidão”.

Exemplo:

```txt
Saldo de ritmo: +12
Você está 12 ações à frente do necessário para o plano atual.
```

Tooltip:

```txt
- negativo alto: está acumulando atraso;
- perto de zero: dentro do esperado;
- positivo moderado: margem boa;
- positivo extremo: talvez esteja exagerando carga.
```

### Card 5 — Plano de hoje

Deve mostrar **as ações do dia em ordem inteligente**, não uma fila cronológica duplicada.

Fontes:

```txt
temas novos planejados;
revisões reais de hoje;
revisões vencidas;
Anki pendente;
simulado/prova agendada;
caso clínico pendente.
```

Ordenação:

```txt
1. tarefas vencidas de alto impacto;
2. Anki pendente, se rotina do usuário exige zerar;
3. revisão crítica;
4. tema novo de alto retorno/menor tempo;
5. simulado/pós-simulado;
6. tarefas menores.
```

## 2.4 Corrigir ações quebradas

### “Ver agenda”

Hoje abre Cronograma. Deve abrir:

```txt
Plano → subaba Agenda
```

Target recomendado:

```js
{ view: "crono", tab: "agenda", date: today }
```

### “Ajustar plano”

Deve abrir:

```txt
Onboarding/PlanSetup Wizard
```

não um modal solto sem contexto.

### “Sessão sem fechamento”

Hoje abre Estatísticas. Deve abrir:

```txt
a sessão não finalizada;
ou popup de retomar/fechar sessão.
```

## 2.5 Dica do método

Não deve ser sempre “flashcards”.

Criar banco rotativo de dicas:

```txt
retrieval practice;
revisão espaçada;
interleaving;
como corrigir questão;
como fazer simulado;
como revisar erro;
como usar Anki;
como fazer D0;
como usar raciocínio clínico;
como lidar com atraso.
```

Modelo:

```js
methodTip = {
  id,
  title,
  body,
  context: "dashboard" | "simulado" | "anki" | "revisao",
  ctaLabel,
  ctaTarget
}
```

---

# 3. Plano / Cronograma / Agenda

## 3.1 Distribuição inteligente das áreas

Você implementou divisão de semanas por meta de temas/semana. Falta distribuir **áreas de forma inteligente** para evitar semana monocromática.

### Regra geral

A semana deve conter variedade mínima de áreas, respeitando:

```txt
1. ordem original do calendário;
2. prioridade do provider;
3. incidência ENAMED/provas;
4. limite de temas por semana;
5. não ocultar temas;
6. overflow para semanas futuras.
```

### Para MedCof / calendários prontos

Seguir a ordem já existente:

```txt
críticas → altas → médias
```

Mas dentro da semana, balancear áreas:

```txt
não deixar 12 temas só de uma área;
intercalar grandes áreas quando possível;
preservar bloco se a sequência for pedagogicamente dependente.
```

### Para Estratégia/importado

Proposta padrão de prioridade ENAMED:

```txt
Preventiva > Pediatria > GO > Cirurgia Geral > Clínica Médica
```

Mas isso deve evoluir para:

```txt
prioridade por incidência real da prova selecionada
```

No futuro, quando outras provas forem cadastradas:

```txt
incidência por instituição/prova selecionada;
peso por área;
peso por subárea;
temas mais cobrados.
```

### Algoritmo sugerido

```js
function distributeBalancedWeek(topics, capacity, weights) {
  // 1. ordenar por prioridade original/provider
  // 2. agrupar por area
  // 3. aplicar round-robin ponderado
  // 4. respeitar dependências se houver
  // 5. overflow para semana seguinte
}
```

## 3.2 Plano ativo + prioridades

A seção “Plano ativo + prioridades” deve:

```txt
abrir automaticamente apenas logo após configurar;
depois abrir minimizada por padrão;
guardar estado do usuário.
```

Estado:

```js
meta.ui.planPriorityExpanded = {
  initialOpenedAt,
  userCollapsedAt,
  userExpandedAt
}
```

## 3.3 Card do cronograma

Problema:

```txt
texto cortado / fonte grande demais.
```

Correções:

```txt
fonte menor em subtítulo;
line-clamp inteligente;
tooltip/expand para título completo;
mostrar área + prioridade + duração + próxima ação.
```

## 3.4 Agenda: popup de detalhamento por dia/tarefa

Ao clicar em uma data ou tarefa na Agenda, abrir detalhamento:

```txt
O que existe neste dia.
O que já foi feito.
Desempenho por matéria.
Parâmetros FSRS do tema.
Incidência ENAMED/provas selecionadas.
Histórico recente.
Ação recomendada.
```

### Popup por tarefa

Campos:

```txt
Tema
Área
Tipo: D0 / D1 / D4 / D7 / D21 / Simulado / Anki / Caso clínico
Tempo estimado
Status
FSRS:
  S = estabilidade
  D = dificuldade
  R = retrievability estimado, se real
Média de acertos do tema
Média de acertos da área
Incidência ENAMED/prova selecionada
Últimas tentativas
Botão executar
Botão reagendar/ajustar, se permitido
```

Regra FSRS:

```txt
Não projetar etapas futuras hipotéticas.
Mostrar apenas próxima revisão real.
```

## 3.5 Banco de temas

Criar Banco de Temas com hierarquia estilo cursinho:

```txt
Área
  Subárea
    Tema
      Subtema
```

Funções:

```txt
buscar tema;
ver incidência ENAMED/provas;
ver status no plano;
adicionar ao plano;
linkar erro de simulado ao tema;
ver revisões e desempenho;
criar caso clínico a partir do tema.
```

O Banco atual deve ir para Mais, mas **Banco de Temas** pode ser chamado internamente por:

```txt
Cronograma
Simulados
Raciocínio Clínico
Estatísticas
```

---

# 4. Simulados

## 4.1 Renomear “Estudar” para “Simulados”

Se a aba atual “Estudar” está concentrando simulado/registro, renomear para:

```txt
Simulados
```

Se ainda houver fluxo de estudo geral dentro dela, separar:

```txt
Plano executa estudo.
Simulados executa provas/sessões.
```

## 4.2 Primeiro card: Estratégia de Simulados

A aba Simulados deve começar com:

```txt
Estratégia de Simulados
```

Conteúdo:

```txt
fase atual;
próximo simulado recomendado;
quando liberar;
por que ainda não é ideal, se não liberou;
opção de iniciar antes com aviso;
frequência recomendada;
tipo recomendado: prova antiga / simulado autoral / bloco por área.
```

## 4.3 Fases do sistema

Tooltip grande em formato fluxograma:

```txt
Construção → Stamina → Stamina+ → Confirmação → Lapidação
```

### Construção

Objetivo:

```txt
construir base e detectar lacunas grandes.
```

Critérios:

```txt
baixa cobertura de temas;
poucos simulados;
acurácia instável;
muito erro de conteúdo.
```

Simulados:

```txt
diagnóstico inicial opcional;
provas antigas parciais;
blocos mistos curtos.
```

### Stamina

Objetivo:

```txt
aguentar prova maior e treinar tempo.
```

Critérios:

```txt
cobertura mínima moderada;
questões semanais consistentes;
revisões em dia.
```

Simulados:

```txt
quinzenais ou mensais;
provas antigas em tempo real.
```

### Stamina+

Objetivo:

```txt
aumentar volume e corrigir padrões de erro.
```

Simulados:

```txt
semanal ou quinzenal, conforme proximidade da prova.
```

### Confirmação

Objetivo:

```txt
confirmar desempenho em provas semelhantes à prova-alvo.
```

Simulados:

```txt
provas antigas da banca/instituição;
simulados completos.
```

### Lapidação

Objetivo:

```txt
reduzir erro recorrente, calibrar tempo e revisar pontos críticos.
```

Simulados:

```txt
mais frequentes, porém com pós-simulado obrigatório.
```

## 4.4 Quando começar simulados

O sistema deve sugerir, não bloquear.

Parâmetros:

```txt
tempo até a prova;
cobertura de temas;
número de questões já feitas;
média de acertos;
estabilidade da média;
revisões vencidas;
histórico de simulados;
carga semanal.
```

### Regras v0

```txt
Se não há simulado:
  recomendar simulado diagnóstico após setup ou após 1–2 semanas de uso.

Se cobertura < 20% e prova distante:
  simulado curto/diagnóstico opcional, não semanal.

Se cobertura 20–50%:
  simulado mensal ou quinzenal.

Se cobertura > 50% ou prova < 90 dias:
  simulado quinzenal/semanal, conforme carga.

Se prova < 45 dias:
  simulado/prova antiga semanal se pós-simulado estiver sendo corrigido.
```

## 4.5 Estratégias de simulado

Permitir o usuário escolher uma estratégia.

### Estratégia 1 — Diagnóstico progressivo

```txt
Boa para iniciantes.
Simulados menores no começo.
Aumenta conforme cobertura e acertos.
```

### Estratégia 2 — Prova antiga orientada por banca

```txt
Boa para quem já sabe a prova-alvo.
Mais provas antigas da instituição/banca.
```

### Estratégia 3 — Alta frequência com pós-simulado obrigatório

```txt
Boa para reta final.
Simulado frequente, mas só se o aluno corrige erros.
Sem correção, o sistema reduz recomendação.
```

Base científica: testes repetidos/progress testing funcionam melhor como avaliação longitudinal e feedback do que como nota isolada. Simulação e prática deliberada dependem de feedback e correção, não só repetição.

## 4.6 Popup “Como fazer este simulado”

Mover o bloco grande “Como fazer este simulado” para um botão:

```txt
Como fazer
```

Perto de:

```txt
Registrar sessão
```

Ao clicar, abrir popup com:

```txt
cronometre;
misture áreas;
não persiga só o número;
classifique erros;
revise racional das erradas;
refaça erradas em 48–72h;
use provas novas para prever desempenho.
```

## 4.7 Registrar simulado — redesign

### Problemas atuais

```txt
interface dos selects feia;
sem motion;
campos não obrigatórios;
registro 2/2 permite salvar sem diagnosticar erros;
não indica prova/simulado feito;
não leva dados para estatísticas direito.
```

### Campos obrigatórios sugeridos

Página 1:

```txt
tipo: simulado / prova antiga / bloco por área;
nome da prova;
instituição/banca;
ano, se prova antiga;
data;
número de questões;
acertos;
tempo total;
modo: cronometrado / sem tempo;
áreas incluídas;
meta de acerto.
```

Página 2:

```txt
quantidade real de erros;
para cada erro:
  questão;
  área;
  tema;
  tipo de erro;
  nota curta/fato atômico;
  criou card? sim/não;
```

Regra:

```txt
não permitir salvar 2/2 se quantidade de erros diagnosticados != erros reais.
```

### Tipos de erro

```txt
lacuna de conteúdo;
raciocínio;
interpretação;
distrator;
descuido;
tempo;
confiança/calibração;
não visto;
conduta/prescrição, apenas residência/raciocínio clínico.
```

Cada tipo deve ter:

```txt
descrição;
exemplo;
ação corretiva;
revisão sugerida;
quando criar card.
```

## 4.8 Cor e recompensa

Aproveitamento do simulado:

```txt
vermelho: muito abaixo da meta;
amarelo: abaixo;
verde: próximo;
azul escuro: meta alcançada/superada.
```

Ao alcançar meta:

```txt
motion;
confetes discretos;
mensagem curta;
não exagerar gamificação.
```

## 4.9 Estatísticas de erros de simulados

Gerar:

```txt
erros por tipo;
erros por área;
erros por tema;
erros recorrentes;
erros corrigidos;
cards criados;
temas adicionados ao plano;
impacto na próxima agenda.
```

## 4.10 Linkar erro ao tema

No popup de erro:

```txt
campo de busca do tema;
sugestão automática por área/tema;
se tema não existir no plano, sistema sugere criar;
usuário confirma para salvar.
```

Isso alimenta:

```txt
Plano;
Agenda;
Estatísticas;
Mentor;
Raciocínio Clínico;
Caderno de erros.
```

## 4.11 D7 como caderno de erros

Regra:

```txt
D7 pode funcionar como revisão de erro para quem não tem caderno de erros próprio.
```

Se o usuário já usa caderno de erros:

```txt
D7 vira checagem de erro/mini auditoria.
```

---

# 5. Preparo estimado e Estatísticas

## 5.1 Preparo estimado atual

Problema:

```txt
O cálculo atual não transmite confiança.
Sem amostra mínima, não deve aparecer como número forte.
```

## 5.2 Nova abordagem

Trocar “Preparo estimado” por:

```txt
Previsão de desempenho
```

e sempre mostrar:

```txt
valor;
intervalo de confiança;
amostra usada;
última atualização;
tooltip explicativo.
```

## 5.3 Não mostrar número forte antes da amostra mínima

Amostra mínima v0:

```txt
questões totais >= 300
e pelo menos 3 áreas com dados
e pelo menos 1 simulado/prova antiga
e pelo menos 14 dias de uso
```

Para simulado/prova:

```txt
mínimo 2 registros para tendência;
mínimo 3–5 para previsão mais confiável.
```

Antes disso:

```txt
Coletando base para previsão.
Complete X questões, Y revisões e pelo menos 1 simulado diagnóstico.
```

## 5.4 Fórmula v0 recomendada

```txt
Previsão = média ponderada de:
1. desempenho em simulados/provas antigas: 45%
2. acerto em questões por área ponderado por incidência: 25%
3. cobertura de temas prioritários: 15%
4. aderência às revisões: 10%
5. calibração/erro recorrente: 5%
```

Com confiança:

```txt
baixa: pouca amostra;
média: amostra parcial;
alta: múltiplos simulados + questões + revisões.
```

## 5.5 Gráfico

Em Estatísticas:

```txt
Previsão ao longo do tempo
linha da previsão;
faixa de incerteza;
eventos: simulados, mudanças de plano, semanas de atraso.
```

## 5.6 Estatísticas — nova ordem

A aba Estatísticas, se ficar em Mais, deve abrir com:

```txt
Aprendizagem
Provas/Simulados
Erros
Revisões
Raciocínio Clínico
Atividade
Validação da previsão
```

### Aprendizagem primeiro

Métricas principais:

```txt
número de questões feitas;
média de acertos geral;
média por área;
revisões feitas geral;
revisões feitas por área;
retenção longa;
carga semanal;
temas concluídos;
cobertura de temas prioritários.
```

### Provas/Simulados

```txt
histórico de simulados;
média móvel;
desempenho por área;
erro por categoria;
provas antigas feitas;
previsão baseada em provas;
mapa de prioridades.
```

### Erros

```txt
tipos de erro;
ações corretivas;
erros recorrentes;
temas mais problemáticos;
card criado/não criado;
tempo até correção.
```

### Remover

```txt
Itens de prontidão.
Aba Elite se não tiver função real.
Cards com baixa amostra disfarçados de certeza.
```

## 5.7 Card exportável de metas

O card de metas deve mostrar progresso:

```txt
meta diária de questões;
questões feitas hoje;
meta total até a prova;
progresso total;
dias restantes;
ritmo necessário;
saldo de ritmo.
```

### Configuração automática

Nos Ajustes:

```txt
meta questões/dia;
meta total de questões.
```

Regra:

```txt
se preencher questões/dia primeiro:
  total = questões/dia * dias até prova

se preencher total primeiro:
  questões/dia = total / dias até prova
```

Permitir arredondamento.

---

# 6. Mentor

## 6.1 Direcionamento do mentor

Mover análise longa do Mentor para Estatísticas.

No Dashboard, Mentor deve ser curto:

```txt
Próxima ação.
Motivo.
Tempo.
Botão.
```

Em Simulados, Mentor deve aparecer abaixo da estratégia de próximo simulado:

```txt
Direcionamento do Mentor
Por que fazer/não fazer simulado agora
O que fazer antes
Qual ação corretiva pós-simulado
```

## 6.2 Cálculo da próxima ação

Usar:

```txt
Agenda do dia;
revisões vencidas;
temas novos;
Anki pendente;
simulado recomendado;
erros dominantes;
incidência ENAMED/prova;
tempo estimado;
saldo de ritmo.
```

## 6.3 Não recomendar sem target

Toda recomendação precisa ter:

```js
target = {
  view,
  action,
  temaId?,
  stepKey?,
  simuladoId?,
}
```

Se não tiver target:

```txt
CTA = Ver plano
```

---

# 7. Raciocínio Clínico

## 7.1 Navegação

Colocar Raciocínio Clínico na aba lateral principal.

Motivo:

```txt
é diferencial do MedRev;
não deve ficar escondido em Mais;
é parte prática do estudo médico.
```

## 7.2 Como integrar com revisão

Fluxo recomendado:

```txt
D1  → recordar estrutura
D4  → illness script
D7  → diferencial / caderno de erros
D21 → mini caso
Manutenção → SCT / conduta / variante
```

## 7.3 Criar caso clínico

Botão:

```txt
Criar caso clínico
```

Ao lado:

```txt
Por que usar?
```

### Modal Criar Caso

Fluxo passo a passo:

```txt
1. Escolher fonte do tema
   - MedRev
   - MedCof
   - Estratégia
   - Importado
   - Custom

2. Escolher área

3. Escolher tema

4. Criar caso base
   - queixa guia;
   - contexto;
   - dados vitais;
   - achados positivos;
   - achados negativos importantes.

5. Nova informação 1
   - dado clínico/laboratorial;
   - impacto esperado na hipótese.

6. Nova informação 2
   - dado que muda conduta ou diagnóstico.

7. Diagnóstico / diferenciais

8. Conduta educacional
   - exames iniciais;
   - manejo inicial;
   - red flags;
   - contraindicações.

9. Rubrica
   - must-not-miss;
   - dados discriminantes;
   - erros comuns.

10. Salvar e vincular ao tema
```

## 7.4 Integração com FSRS

Caso criado vira:

```txt
variante clínica do tema.
```

Pode ser usado em:

```txt
D7;
D21;
manutenção;
erro de raciocínio;
erro de conduta.
```

## 7.5 “Preciso relembrar”

Criar botão em caso clínico:

```txt
Preciso relembrar
```

Ação:

```txt
não pune como erro completo;
marca baixa confiança;
agenda reencontro clínico curto;
sugere revisar illness script antes do caso.
```

## 7.6 Por que usar essa função?

Popup/artigo curto:

```txt
Illness scripts ajudam a organizar diagnósticos por condições predisponentes, mecanismo, consequências e conduta.
Casos variantes treinam transferência.
Diferenciais treinam discriminação.
SCT treina raciocínio sob incerteza.
```

---

# 8. Anki Audit

## 8.1 Navegação

Anki Audit deve substituir Banco na lateral principal.

Banco vai para Mais.

## 8.2 Dashboard

O Comando do Dia pode incluir:

```txt
Zerar Anki do dia
```

Se já zerou:

```txt
não recomendar novamente.
```

Mostrar:

```txt
adesão diária;
streak;
cards revisados;
again;
novos;
tempo estimado.
```

## 8.3 Registrar sessão

Pode ser aberto direto do Dashboard.

Campos:

```txt
cards revisados;
novos;
again;
tempo;
deck;
observação opcional.
```

---

# 9. Perfil, Configurações, Segurança, Pomodoro e Conquistas

## 9.1 Perfil e Configurações como aba/página

Não manter só popup.

Seção:

```txt
Perfil
Estudos
Mentor
Conta
Segurança
Aparência
```

## 9.2 Perfil

Campos:

```txt
avatar;
foto;
nome;
idade;
ano/semestre do curso;
especialidade pretendida;
cidade/UF opcional;
prova principal;
instituições-alvo.
```

## 9.3 Estudos

Adicionar principais provas de residência do Brasil:

```txt
ENAMED;
USP-SP;
UNIFESP;
UNICAMP;
USP-RP;
SUS-SP;
SUS-BA;
SES-DF;
SES-PE;
AMRIGS;
PSU-MG;
SURCE;
HCPA;
UFRJ;
UERJ;
IAMSPE;
Einstein;
Sírio-Libanês;
Santa Casa;
outra.
```

Retirar “horas disponíveis por dia” como base do Mentor se isso conflitar com tópicos/dia.

Melhor:

```txt
Mentor usa:
dias de estudo;
tópicos por dia;
meta de questões;
meta de Anki;
dias até prova.
```

## 9.4 Conta

Funções:

```txt
mudar senha;
e-mail;
excluir conta;
exportar dados;
políticas do site.
```

## 9.5 Segurança dos dados

Adicionar botão:

```txt
Como funciona?
```

Explicar:

```txt
backup;
restore;
integridade;
escopo por usuário;
quando usar;
riscos;
boas práticas.
```

## 9.6 Pomodoro

Adicionar relógio no canto inferior esquerdo.

Configurações:

```txt
tempo de foco;
pausa curta;
pausa longa;
número de ciclos;
som/notificação;
associar ao tema atual.
```

Botão:

```txt
Por que usar?
```

Explicação:

```txt
Pomodoro ajuda a reduzir fricção de início e organizar blocos de foco, mas não substitui retrieval practice, feedback e revisão.
```

## 9.7 Conquistas

Criar em Mais:

```txt
Conquistas
```

Exemplos:

```txt
primeiro D0 concluído;
primeira semana sem atraso;
100 questões;
500 questões;
primeiro simulado;
3 simulados corrigidos;
7 dias de Anki;
primeiro caso clínico;
primeiro erro corrigido;
retenção longa validada.
```

Evitar gamificação agressiva.

---

# 10. Academia & Método

## 10.1 Função

Não deve ser FAQ superficial.

Deve ser quase um mini-artigo científico aplicado ao app.

Seções:

```txt
Como estudar um tema novo
Como fazer D0
Como revisar D1/D4/D7/D21
Como corrigir questões
Como fazer simulado
Como usar provas antigas
Como usar Anki
Como usar Raciocínio Clínico
Como lidar com atraso
Como interpretar estatísticas
Como usar o Mentor
```

## 10.2 Linguagem

```txt
médica;
didática;
prática;
com referências;
com fluxogramas;
sem jargão desnecessário.
```

## 10.3 Guia de uso

Atualizar para refletir nova arquitetura:

```txt
Hoje
Plano
Simulados
Raciocínio Clínico
Anki Audit
Mais
```

---

# 11. Fundamentação científica resumida

## 11.1 Retrieval practice, espaçamento e interleaving

Base para:

```txt
D1/D4/D7/D21;
questões;
revisões;
Anki;
intercalação de áreas no calendário.
```

Estudos e revisões em profissões da saúde indicam que prática distribuída e retrieval practice são estratégias importantes para retenção e desempenho acadêmico, embora a qualidade dos estudos varie.

## 11.2 Simulados e progress testing

Base para:

```txt
simulado diagnóstico;
tendência longitudinal;
não usar um simulado isolado como verdade;
previsão baseada em múltiplas medidas.
```

Progress testing é longitudinal: testes equivalentes aplicados repetidamente ajudam a acompanhar crescimento e competência futura, sendo mais útil como trajetória do que como nota isolada.

## 11.3 Prática deliberada

Base para:

```txt
pós-simulado obrigatório;
classificação de erro;
ação corretiva;
feedback;
raciocínio clínico por rubrica.
```

Prática deliberada exige objetivos claros, repetição focada, feedback e ajuste do próximo treino.

## 11.4 Learning analytics

Base para:

```txt
não mostrar dashboard só por mostrar;
métricas precisam ser acionáveis;
estatísticas devem apoiar planejamento, monitoramento e reflexão.
```

Learning analytics dashboards tendem a funcionar melhor quando transformam dado em feedback acionável; dashboards meramente informativos podem ter pouco efeito.

---

# 12. Roadmap de implementação

## Fase 0 — Correções de confiança

```txt
1. Ver agenda abre Agenda, não Cronograma.
2. Remover amostra DEV e Ver mapeamento.
3. Retirar deck Anki opcional do fluxo principal.
4. Corrigir sessão sem fechamento.
5. Remover prontidão.
6. Corrigir cálculo/visibilidade de preparo estimado.
```

## Fase 1 — Dashboard novo

```txt
1. Comando do dia com dias até prova.
2. Cards circulares:
   - questões;
   - acertos;
   - Anki/revisões;
   - saldo de ritmo.
3. Plano de hoje inteligente.
4. Ajustar plano abre onboarding.
5. Fila cronológica removida/absorvida.
```

## Fase 2 — Plano e Agenda

```txt
1. Distribuição balanceada por área.
2. Prioridade ENAMED por tema/subárea.
3. Agenda com popup de detalhes.
4. Plano ativo minimizado após primeira configuração.
5. Banco de temas hierárquico.
```

## Fase 3 — Simulados

```txt
1. Renomear Estudar para Simulados.
2. Estratégia de simulados.
3. Fases: Construção → Stamina → Stamina+ → Confirmação → Lapidação.
4. Recomendação do próximo simulado.
5. Registro de simulado obrigatório completo.
6. Auditoria de erros.
7. Estatísticas de erros.
8. Provas antigas/simulados no banco.
```

## Fase 4 — Estatísticas

```txt
1. Aprendizagem primeiro.
2. Provas/Simulados.
3. Erros.
4. Revisões.
5. Raciocínio Clínico.
6. Previsão de desempenho com amostra mínima.
7. Card exportável de metas.
```

## Fase 5 — Raciocínio Clínico

```txt
1. Aba lateral.
2. Criar caso clínico.
3. Integrar com tema do cronograma.
4. Variantes por tema.
5. FSRS clínico/preciso relembrar.
6. Rubricas sem IA.
7. Mentor/Agenda/Stats.
```

## Fase 6 — Anki Audit

```txt
1. Aba lateral.
2. Dashboard sugere zerar Anki.
3. Registrar sessão.
4. Streak/adesão.
5. Integração com metas.
```

## Fase 7 — Mais / Perfil / Método

```txt
1. Perfil e Configurações como página.
2. Segurança dos dados explicada.
3. Academia & Método.
4. Guia de uso.
5. Conquistas.
6. Pomodoro.
7. Políticas do site.
```

---

# 13. Blocos recomendados para Codex/Claude

## MASTER0 — Auditoria de navegação e dependências

Sem implementar.

```txt
Auditar App, navigationModel, Dashboard, Cronograma, Simulados, Stats, Banco, AnkiAudit, RaciocinioClinico, More.
Mapear o que vai para lateral e o que vai para Mais.
```

## DASH2 — Dashboard enxuto

```txt
Mover métricas profundas para Stats.
Criar cards circulares de questões/acertos/Anki/saldo.
Plano de hoje inteligente.
Corrigir Ver Agenda/Ajustar Plano/Sessão sem fechamento.
```

## PLAN2 — Agenda e cronograma inteligente

```txt
Distribuição balanceada por área.
Popup de detalhe da agenda.
Plano ativo minimizado.
Card de cronograma compacto.
Banco de temas hierárquico.
```

## SIM1 — Estratégia de simulados

```txt
Renomear aba.
Criar card Estratégia de Simulados.
Fases, próximo simulado, frequência, tooltip.
```

## SIM2 — Registro e auditoria de erros

```txt
Redesign do modal.
Campos obrigatórios.
Tipos de erro.
Link com tema.
Estatísticas de erro.
```

## STATS2 — Estatísticas redondas

```txt
Aprendizagem primeiro.
Previsão de desempenho real.
Provas/Simulados.
Erros.
Revisões.
Remover prontidão.
```

## CR9 — Raciocínio Clínico produto

```txt
Aba lateral.
Criar caso.
Por que usar.
Integração com tema/revisão.
FSRS clínico.
```

## ANKI2 — Anki Audit operacional

```txt
Aba lateral.
Dashboard.
Streak.
Sessão Anki.
```

## MORE2 — Perfil, segurança, conquistas e método

```txt
Perfil/Configurações página.
Segurança dos dados explicada.
Conquistas.
Pomodoro.
Academia & Método.
Guia de uso.
```

---

# 14. O que não fazer agora

```txt
1. Não criar mais métricas antes de corrigir as existentes.
2. Não criar previsão de aprovação falsa.
3. Não colocar simulado semanal para todo mundo.
4. Não deixar Dashboard virar Estatísticas.
5. Não criar PDF parser.
6. Não criar IA corretora agora.
7. Não criar banco de questões.
8. Não criar gamificação agressiva.
9. Não salvar texto clínico sensível sem decisão de privacidade.
10. Não misturar Vestibular com ENAMED/raciocínio clínico.
```

---

# 15. Decisões pendentes

## D1 — Estatísticas no Mais

Recomendação:

```txt
Sim, para MVP atual.
Mas manter acesso fácil via Dashboard quando houver alerta.
```

## D2 — Banco

Recomendação:

```txt
Banco vai para Mais.
Criar Banco de Temas como componente interno do Plano/Simulados/Raciocínio.
```

## D3 — Estudar → Simulados

Recomendação:

```txt
Sim, se o estudo diário já é executado por Hoje/Plano/Agenda.
```

## D4 — Preparo estimado

Recomendação:

```txt
Trocar para Previsão de desempenho.
Não mostrar número forte antes de amostra mínima.
```

## D5 — Raciocínio clínico

Recomendação:

```txt
Aba lateral principal.
É diferencial real do produto.
```

## D6 — Anki Audit

Recomendação:

```txt
Aba lateral principal.
É ação diária, mais útil que Banco.
```

---

# 16. Critério de sucesso do produto após essa rodada

Um usuário novo deve conseguir:

```txt
1. configurar plano;
2. abrir dashboard;
3. ver o que fazer hoje;
4. executar tarefa;
5. registrar questões/simulado/Anki;
6. corrigir erros;
7. ver próxima ação;
8. entender progresso sem dashboard confuso.
```

Se ele ainda abre o app e pensa “onde eu clico?”, o produto ainda não está pronto.

---

# 17. Referências científicas recomendadas

Estas são referências para embasar decisões de método, não para aparecer como jargão na UI.

```txt
1. Trumble E, et al. Systematic review of distributed practice and retrieval practice in health professions education. Adv Health Sci Educ. 2024.
2. Thompson CP, et al. The Effectiveness of Spaced Learning, Interleaving, and Retrieval Practice in Medical Education. JACR. 2023.
3. Schuwirth LWT, van der Vleuten CPM. The use of progress testing. Perspect Med Educ. 2012.
4. McGaghie WC, et al. Lessons for Continuing Medical Education From Simulation Research in Undergraduate and Graduate Medical Education. Chest. 2009.
5. Duvivier RJ, et al. The role of deliberate practice in the acquisition of clinical skills. BMC Med Educ. 2011.
6. Nazim SM, et al. Assessing clinical reasoning skills using Script Concordance Test. 2019.
7. Villagrán I, et al. Enhancing Feedback Uptake and Self-Regulated Learning in Procedural Skills Training: Design and Evaluation of a Learning Analytics Dashboard. Journal of Learning Analytics. 2024.
```

---

# 18. Prioridade final

A ordem mais produtiva agora:

```txt
1. DASH2 — Dashboard enxuto e ações quebradas.
2. PLAN2 — Plano/Agenda inteligente.
3. SIM1/SIM2 — Simulados e auditoria de erros.
4. STATS2 — Estatísticas com previsão real.
5. CR9 — Raciocínio Clínico.
6. ANKI2 — Anki Audit.
7. MORE2 — Perfil/Método/Conquistas/Pomodoro.
```

Comece pelo Dashboard porque ele é a porta de entrada.  
Depois Plano/Agenda porque alimenta o Dashboard.  
Depois Simulados porque alimenta Estatísticas e Previsão.  
Depois Raciocínio Clínico porque é diferencial, mas precisa da base de fluxo funcionando.
