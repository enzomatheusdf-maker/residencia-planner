# MEDREV — Prompt para Auditoria de Produto por Persona, UX e Coerência

> **Executor recomendado:** Claude Opus Thinking / Claude Code em modo planejamento  
> **Executor posterior:** Sonnet ou `gpt-5.3-codex`, fase por fase  
> **Objetivo:** melhorar o site/app com base na persona real, decidindo o que faz sentido, o que confunde, o que deve ser principal, o que deve ir para Mais/Stats/Avançado e o que deve ser removido/adiado.

---

## 0. Contexto

O MedRev é uma plataforma complementar para preparação de residência médica e, opcionalmente, vestibular.

Ele não deve ser um banco de questões.

A proposta correta é:

```txt
Banco de questões = onde o aluno responde.
MedRev = sistema operacional de estudo.
```

O MedRev deve ajudar o aluno a:

```txt
saber o que estudar agora;
revisar no momento certo;
corrigir erros;
interpretar prova/simulado;
evitar sobrecarga;
desenvolver raciocínio clínico;
manter histórico e progresso;
confiar no plano.
```

Problema atual percebido:

```txt
muita função;
experiência confusa;
métricas demais;
sidebar cheia;
Mentor e Stats competindo;
raciocínio clínico lateral;
Vestibular sem trilha clara;
copy/PT-BR inconsistente;
algumas features parecem boas no papel, mas não ficam claras para o usuário.
```

Este trabalho deve responder:

```txt
O que faz sentido para a persona?
O que não faz sentido?
O que deve ficar no fluxo principal?
O que deve ir para Mais/Avançado?
O que deve ir para Stats?
O que deve ser removido, escondido ou adiado?
O que deve ser explicado melhor?
Qual é a experiência ideal do primeiro uso?
```

---

## 1. Personas

### Persona A — Estudante de medicina / residência

Perfil:

```txt
Aluno de medicina ou médico recém-formado;
quer passar em residência/ENAMED;
usa ou já usa banco de questões;
tem ansiedade pelo volume de conteúdo;
não sabe priorizar;
quer um sistema que diga o próximo passo.
```

Dor principal:

```txt
Tenho conteúdo demais, questões demais e métricas demais. Quero saber o que fazer hoje para aumentar minha chance de aprovação.
```

Jobs to be done:

```txt
Quando eu abro o app, quero saber minha próxima ação.
Quando erro uma questão, quero saber que tipo de erro foi e como corrigir.
Quando atraso revisão, quero saber o que recuperar primeiro.
Quando faço simulado, quero transformar isso em plano.
Quando estudo um tema clínico, quero treinar raciocínio e conduta, não só decorar.
Quando estou sobrecarregado, quero que o sistema reduza a carga.
```

Valor percebido:

```txt
clareza;
priorização;
ação concreta;
segurança;
evolução visível;
revisão inteligente;
explicação do porquê;
baixo atrito.
```

O que essa persona não quer:

```txt
mais um dashboard cheio de gráfico;
mais uma lista manual de tarefas;
métrica sem explicação;
feature bonita mas sem consequência;
configuração demais antes de entender valor;
linguagem ruim ou amadora.
```

---

### Persona B — Vestibulando

Perfil:

```txt
Estudante que se prepara para ENEM/Fuvest/Unicamp/outros;
precisa de cronograma, revisão e análise de simulado;
não precisa de ENAMED, raciocínio clínico, illness script ou conduta médica.
```

Dor principal:

```txt
Quero começar rápido, saber minha prova-alvo, o que estudar primeiro e como revisar.
```

Regra:

Vestibular não deve exibir:

```txt
ENAMED como eixo;
Raciocínio Clínico;
Illness Script;
Casos clínicos;
Conduta médica;
Prescrição.
```

Vestibular deve exibir:

```txt
trilha inicial;
prova-alvo;
simulados;
matéria fraca;
cronograma;
revisão espaçada;
Mentor;
Estatísticas simples.
```

---

## 2. Tarefa do Opus Thinking

Você está em **modo planejamento**.

Não implemente nada.

Não edite arquivos.

Não faça commit, deploy ou push.

Não instale bibliotecas.

Não liste o workspace inteiro.

Use apenas comandos escopados:

```bash
git status --short
git ls-files src package.json docs
git grep -n "Sidebar\|BottomNav\|Dashboard\|StatsPanel\|Mentor\|Raciocinio\|Raciocínio\|Vestibular\|ENAMED\|Simulados\|Anki\|WeeklyReview\|DataSafety\|Onboarding" -- src
git grep -n "Prontidão\|True Retention\|Modo Simples\|Analise\|Acao\|Nao\|Voce\|Faca\|validacao\|dominio\|calendario" -- src
git grep -n "featureEnabled\|platformFeatures\|plat === \"vest\"\|plat === 'vest'" -- src
git grep -n "mentorNextAction\|mentorTodayPlan\|target\|ctaView\|explain" -- src
git grep -n "metricsRegistry\|errorActionMap\|reviewTaskPlanner\|clinicalReasoningScoring" -- src
```

Criar somente:

```txt
docs/PRODUCT_PERSONA_UX_AUDIT.md
```

---

## 3. O que auditar

### 3.1 Primeira impressão

Responder:

```txt
O usuário entende o que é o MedRev em 10 segundos?
O Dashboard/Hoje diz o que fazer agora?
A navegação está por jornada ou por módulo?
A pessoa sabe onde clicar primeiro?
A plataforma parece confiável?
O português passa segurança?
```

### 3.2 Fluxo de primeiro uso

Auditar separadamente:

```txt
Residência:
1. primeiro login;
2. configurar plano;
3. primeira ação do Mentor;
4. primeira revisão;
5. primeiro erro;
6. primeiro simulado.

Vestibular:
1. escolher prova-alvo;
2. escolher data;
3. registrar ou não simulado;
4. primeira recomendação;
5. primeiro plano;
6. primeira revisão.
```

### 3.3 Coerência das features

Para cada feature, classificar:

```txt
Core diário
Diagnóstico
Ferramenta avançada
Configuração
Sistema
Remover/adiar
```

Features a avaliar:

```txt
Hoje/Dashboard
Plano/Cronograma
Estudar/Simulados
Estatísticas
Banco de Dados
Raciocínio Clínico
Illness Script
Já domino
Mentor
Action Inbox
Centro de Erros
Anki Audit
Weekly Review
Peak Mode
Data Safety
Launch Checklist
Guia
Onboarding
Activity Log futuro
Vestibular Start Trail
```

### 3.4 Avaliar se cada feature responde

```txt
Qual problema resolve?
Para qual persona?
Em que momento da jornada aparece?
Cria tarefa?
Registra dado?
Gera ação corretiva?
Alimenta o Mentor?
Alimenta Stats?
Fica no fluxo principal ou avançado?
```

### 3.5 Avaliar o que não faz sentido

Procurar:

```txt
feature que duplica outra;
métrica que não muda decisão;
painel técnico demais;
card que só aumenta ansiedade;
termo pouco claro;
função avançada aparecendo cedo demais;
item médico vazando no Vestibular;
configuração antes do valor;
botão sem consequência visível;
ação sem feedback.
```

---

## 4. Saída obrigatória

Criar `docs/PRODUCT_PERSONA_UX_AUDIT.md` com:

### 4.1 Diagnóstico executivo

```txt
O produto está claro?
O usuário novo fica perdido?
Qual é o maior problema de UX?
Qual é o maior problema de produto?
Qual é o maior problema técnico que afeta UX?
```

### 4.2 Personas e jornadas

Tabela:

```txt
Persona | Objetivo | Dor | Primeira ação ideal | O que não deve ver cedo
```

### 4.3 Mapa de features por valor

Tabela:

```txt
Feature | Persona | Valor real | Momento certo | Local ideal | Problema atual | Decisão
```

Decisões possíveis:

```txt
Manter principal
Mover para Mais
Mover para Stats
Unificar
Colapsar
Adiar
Remover do fluxo
```

### 4.4 Navegação ideal

Propor:

```txt
Hoje
Plano
Estudar
Estatísticas
Banco
Mais
```

E justificar o que fica em cada item.

### 4.5 Dashboard/Hoje ideal

Desenhar:

```txt
Comando do Mentor
Próximas 2 ações
Carga de hoje
Alertas
Avançado colapsado
```

Indicar o que deve sair.

### 4.6 Stats ideal

Indicar seções:

```txt
Resumo
Aprendizagem
Erros
Provas/Simulados
Raciocínio Clínico
Atividade
Sistema
```

Indicar quais métricas entram e quais saem.

### 4.7 Mentor ideal

Definir:

```txt
o que o Mentor deve decidir;
o que ele não deve decidir;
como explicar a recomendação;
quando não recomendar tema novo;
quando recomendar descanso;
quando recomendar erro/ação corretiva;
quando recomendar raciocínio clínico.
```

### 4.8 Raciocínio Clínico

Responder:

```txt
deve ficar no fluxo principal?
deve ser modo de revisão?
quando aparece?
quais temas usam?
como cobrar conduta/prescrição?
como evitar complexidade cedo demais?
```

### 4.9 Vestibular

Responder:

```txt
a trilha inicial existe?
o aluno entende como começar?
o que deve ser escondido?
o que deve aparecer?
qual é a jornada ideal?
```

### 4.10 Copy e linguagem

Listar:

```txt
termos ruins;
termos a substituir;
tom correto;
frases que precisam ser reescritas;
padrão PT-BR.
```

### 4.11 Top 10 mudanças de maior impacto

Classificar por:

```txt
impacto no usuário
esforço
risco técnico
prioridade
```

### 4.12 Plano de implementação

Separar em:

```txt
P1 — clareza inicial
P2 — Stats e métricas
P3 — erros e ações corretivas
P4 — raciocínio clínico integrado
P5 — histórico/calendário pós-Bloco N
P6 — polish final
```

Para cada uma:

```txt
objetivo
arquivos prováveis
o que fazer
o que não fazer
testes
critério de aceite
```

---

## 5. Regras de decisão de produto

### Manter no fluxo principal se:

```txt
é usado diariamente;
gera próxima ação;
reduz dúvida;
tem CTA claro;
é essencial para começar.
```

### Mover para Mais se:

```txt
é útil, mas ocasional;
é avançado;
é configuração;
é diagnóstico secundário;
pode confundir usuário novo.
```

### Mover para Stats se:

```txt
é diagnóstico;
é retrospectivo;
explica desempenho;
não precisa ser visto todo dia.
```

### Colapsar se:

```txt
é útil para power user;
mas polui a tela inicial.
```

### Adiar/remover do fluxo se:

```txt
não tem ação clara;
não alimenta Mentor;
duplica outra função;
não tem persona clara;
exige muito esforço cognitivo cedo.
```

---

## 6. Importante: não confundir melhoria de UX com feature nova

O objetivo agora não é criar mais coisas.

O objetivo é:

```txt
menos telas competindo;
menos métricas soltas;
menos texto ruim;
mais orientação;
mais consequência visível;
mais coerência com a persona.
```

Se a solução proposta for “criar mais uma aba”, rejeite por padrão.

Preferir:

```txt
integrar;
reclassificar;
colapsar;
explicar melhor;
transformar em ação do Mentor.
```

---

## 7. Prompt curto para o Opus

```txt
Aja como engenheiro de software sênior, designer de produto sênior e pesquisador em ciência da aprendizagem médica.

Você está em modo planejamento. Não implemente nada.

Eu não quero só corrigir bugs. Quero que você avalie o produto pela persona: o que faz sentido, o que não faz, o que confunde, o que deveria ser principal, o que deveria ir para Mais/Stats/Avançado e como o usuário deve entender o app.

Use o arquivo MEDREV_PRODUCT_PERSONA_UX_AUDIT_PROMPT.md como fonte de verdade.

Audite o código com git grep/git ls-files, sem listar workspace inteiro.

Crie docs/PRODUCT_PERSONA_UX_AUDIT.md com:
- diagnóstico executivo;
- personas e jornadas;
- mapa de features por valor;
- navegação ideal;
- Dashboard/Hoje ideal;
- Stats ideal;
- Mentor ideal;
- Raciocínio Clínico;
- Vestibular;
- copy/PT-BR;
- top 10 mudanças de maior impacto;
- plano de implementação em fases.

Não edite arquivos de implementação.
Não faça commit, deploy ou push.
Não instale libs.
```
