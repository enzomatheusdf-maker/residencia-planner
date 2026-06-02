# MEDREV — Product Charter e Contexto Permanente para IA

> **Uso:** colar este documento no início de prompts do Claude/Codex ou manter no repositório como `docs/MEDREV_PRODUCT_CHARTER.md`.  
> **Objetivo:** impedir que a IA crie features soltas, piore a UX ou modifique o produto fora da proposta central.  
> **Regra:** qualquer criação, exclusão ou modificação deve respeitar este documento.

---

## 1. O que é o MedRev

O **MedRev** é um sistema operacional de estudo para preparação de residência médica e, opcionalmente, vestibular.

Ele não é o lugar principal onde o aluno resolve milhares de questões.

A tese do produto é:

```txt
Banco de questões = onde o aluno responde.
MedRev = onde o aluno decide o que fazer, registra o que aconteceu, corrige erros e mantém revisão inteligente.
```

O MedRev existe para responder:

```txt
O que eu estudo hoje?
Por que isso é prioridade?
Como faço essa tarefa?
O que eu errei?
O que faço para corrigir?
Quando devo reencontrar esse tema?
Como evito sobrecarga?
Estou evoluindo de verdade?
```

---

## 2. O que o MedRev NÃO é

O MedRev **não** é:

```txt
1. Banco de questões completo.
2. Plataforma para competir com MedQ, MedCof, Estratégia, MedEvo ou bancos de questão.
3. Dashboard de BI cheio de gráfico sem ação.
4. Repositório de métricas bonitas, mas inúteis.
5. App de anotações genérico.
6. App de agenda genérico.
7. Prontuário ou ferramenta assistencial.
8. Ferramenta de prescrição real.
9. Plataforma de IA médica para paciente real.
10. Coleção de features soltas.
11. Produto onde o usuário precisa configurar tudo manualmente.
12. Produto que joga ENAMED/Raciocínio Clínico no Vestibular.
```

Se uma sugestão da IA empurrar o produto para qualquer uma dessas direções, **rejeitar por padrão**.

---

## 3. Persona principal

## Persona A — Estudante de medicina / residência

### Perfil

```txt
Estudante de medicina ou médico recém-formado;
quer passar em residência/ENAMED;
usa banco de questões;
tem muito conteúdo acumulado;
fica ansioso com volume;
não sabe priorizar;
quer uma ação clara para hoje.
```

### Dor principal

```txt
Tenho conteúdo demais, questões demais e métricas demais. Quero saber o que fazer hoje para aumentar minha chance de aprovação.
```

### Jobs to be Done

```txt
Quando eu abro o app, quero saber minha próxima ação.
Quando erro, quero saber que tipo de erro foi e como corrigir.
Quando atraso, quero saber o que recuperar primeiro.
Quando faço simulado, quero transformar o resultado em plano.
Quando estudo tema clínico, quero treinar raciocínio, diferenciais e conduta.
Quando estou sobrecarregado, quero que o sistema reduza a carga.
```

### Valor percebido

```txt
clareza;
priorização;
ação concreta;
segurança;
baixo atrito;
evolução visível;
revisão inteligente;
explicação do porquê.
```

---

## 4. Persona secundária

## Persona B — Vestibulando

### Perfil

```txt
Estudante preparando ENEM, Fuvest, Unicamp ou outra prova;
precisa de cronograma, revisão e análise de simulado;
não precisa de raciocínio clínico nem ENAMED.
```

### Dor principal

```txt
Quero começar rápido, escolher minha prova-alvo e saber o que estudar primeiro.
```

### Vestibular deve ter

```txt
trilha inicial;
prova-alvo;
data ou janela de prova;
simulados;
matéria fraca;
cronograma;
revisão espaçada;
Mentor;
Estatísticas simples.
```

### Vestibular NÃO deve ter

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

Toda feature nova precisa passar por `featureEnabled(plat, feature)`.

---

## 5. Ciclo central do produto

Toda função do MedRev deve se encaixar neste ciclo:

```txt
1. Planejar
2. Executar
3. Registrar
4. Corrigir
5. Reagendar
6. Decidir o próximo passo
```

Se uma feature não participa desse ciclo, ela provavelmente deve ir para:

```txt
Mais;
Stats;
Sistema;
Avançado;
ou ser adiada/removida.
```

---

## 6. Perguntas obrigatórias antes de criar ou modificar qualquer feature

Antes de implementar qualquer coisa, responder:

```txt
1. Para qual persona isso existe?
2. Qual dor real resolve?
3. Em que momento da jornada aparece?
4. Cria qual tarefa?
5. Registra qual dado?
6. Corrige qual erro?
7. Agenda ou altera qual revisão?
8. Alimenta o Mentor?
9. Alimenta Estatísticas?
10. Tem estado vazio claro?
11. Tem CTA claro?
12. Funciona em Residência, Vestibular ou ambos?
13. Pode confundir usuário novo?
14. Deve ficar principal, Stats, Mais, Sistema ou Avançado?
15. Que teste prova que isso funciona?
```

Se a IA não conseguir responder, **não implementar**.

---

## 7. Regra de navegação

A navegação deve ser por jornada, não por módulo interno.

### Navegação principal

```txt
Hoje
Plano
Estudar
Estatísticas
Banco
Mais
```

### O que cada item significa

## Hoje

Tela de decisão diária.

Deve responder:

```txt
O que faço agora?
Por que isso?
Quanto tempo leva?
O que vem depois?
Existe algum alerta?
```

## Plano

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

## Estudar

Execução.

Inclui:

```txt
simulados;
análise de prova;
modo foco;
revisão;
tarefas guiadas.
```

## Estatísticas

Diagnóstico.

Inclui:

```txt
aprendizagem;
erros;
provas/simulados;
raciocínio clínico;
atividade;
sistema.
```

## Banco

Cadastros e bases.

Inclui:

```txt
temas;
casos;
cronogramas;
catálogos.
```

## Mais

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

## 8. Regra do Dashboard / Hoje

O Dashboard não é lugar para todos os gráficos.

A tela **Hoje** deve conter:

```txt
1. Comando do Mentor.
2. Próximas 2 ações.
3. Carga de hoje.
4. Alertas importantes.
5. Avançado colapsado.
```

Não colocar no topo:

```txt
gráficos longos;
painéis avançados;
métricas sem ação;
configuração;
histórico longo;
diagnóstico profundo;
feature experimental.
```

Regra:

```txt
Dashboard = ação.
Stats = diagnóstico.
Mais = ferramenta.
Sistema = configuração/segurança.
```

---

## 9. Regra do Mentor

O Mentor é o motor de decisão do produto.

Ele não é frase motivacional.

Ele deve decidir com base em:

```txt
FSRS;
relearning;
revisões vencidas;
carga de hoje;
cronograma;
prova/simulado;
erro dominante;
raciocínio clínico;
Vestibular/Residência;
sinais de sobrecarga.
```

### Ordem de prioridade

```txt
1. risco de dados/sync/estado inválido;
2. sobrecarga;
3. relearning;
4. revisões vencidas;
5. revisão de hoje;
6. simulado/prova pendente de análise;
7. erro dominante com ação corretiva;
8. caso clínico devido;
9. tema novo se carga permite;
10. descanso/bloco leve.
```

### Regra crítica

Ação do Mentor precisa ter `target` executável.

Se não tiver:

```txt
não pode ser botão principal;
deve virar “Ver plano”;
deve gerar warning interno.
```

---

## 10. Regra das Estatísticas

Stats não é painel de vaidade.

Stats deve explicar:

```txt
o que está acontecendo;
se dá para confiar;
o que fazer.
```

Toda métrica precisa ter:

```txt
label humano;
descrição;
estado vazio;
nível de confiança;
ação recomendada;
plataforma;
seção.
```

### Seções de Stats

```txt
Resumo
Aprendizagem
Erros
Provas/Simulados
Raciocínio Clínico
Atividade
Sistema
```

### Proibido em Stats

```txt
mostrar 100% sem amostra;
mostrar “coletando” sem explicar;
misturar Data Safety com aprendizagem;
mostrar ENAMED no Vestibular;
mostrar Raciocínio Clínico no Vestibular.
```

---

## 11. Regra de erros

Erro precisa virar ação.

Não basta registrar erro.

Fluxo correto:

```txt
errou → classifica → entende → recebe ação corretiva → Mentor usa → revisão/plano ajusta
```

Taxonomia canônica deve ficar em `errorTaxonomy.js`.

Não criar taxonomias paralelas.

`errorActionMap.js` deve mapear:

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
estrategia_prova → análise de simulado/prova.
```

Vestibular não deve receber `conduta_prescricao`.

---

## 12. Regra do Raciocínio Clínico

Raciocínio Clínico não deve ser só uma aba lateral.

Ele deve existir em dois modos:

## Modo 1 — Caso completo

```txt
Vinheta;
Problem representation;
Hipóteses + must-not-miss;
Illness script de memória;
SCT / nova informação;
Conduta e prescrição simulada;
Feedback + reencontro.
```

## Modo 2 — Revisão FSRS multimodal

```txt
D1  → Brain dump estruturado;
D4  → Illness Script recall;
D7  → Mini caso + diferenciais;
D21 → SCT curto + conduta;
Manutenção → caso rápido ou prescrição simulada.
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

---

## 13. Regra do “Já domino”

“Já domino” não marca domínio definitivo.

Ele é uma validação de domínio prévio.

### Critério

```txt
mínimo 15 questões;
mínimo 80% de acerto.
```

### Resultado

```txt
80–89% → agenda primeira revisão em D7;
>=90% → agenda primeira revisão em D14;
<80% ou <15 questões → não valida, iniciar D0.
```

Após validar, o tema deve:

```txt
sair de unstarted;
ter status validado_previo;
registrar dominioPrevio;
mudar card imediatamente;
entrar no ciclo de revisão;
aparecer na fila quando vencer.
```

---

## 14. Regra de copy e linguagem

Português precisa passar confiança.

### Preferir

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
```

### Evitar/substituir

```txt
Dashboard → Hoje;
Cronograma → Plano;
Prontidão → Preparo estimado;
True Retention → Retenção longa;
Modo Simples → Modo Mentor;
Crono → Plano;
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

## 15. Regra de dados e privacidade

Multiusuário é P0.

Dados privados precisam ser escopados por `uid`.

Não criar novos logs ou históricos persistentes se o isolamento de conta não estiver resolvido.

Não criar Activity Log antes do Bloco N.

Arquitetura esperada:

```txt
localStorage:
medrev:<env>:user:<uid>:store

Firestore:
/users/{uid}/state/main
/users/{uid}/activityLog
/users/{uid}/backups
```

---

## 16. Regra de criação, exclusão e modificação

## Criar quando

```txt
resolve dor clara;
encaixa no ciclo do produto;
tem CTA;
registra dado útil;
alimenta Mentor ou Stats;
tem teste;
não aumenta confusão.
```

## Modificar quando

```txt
melhora clareza;
reduz fricção;
unifica lógica duplicada;
corrige estado invisível;
melhora feedback;
preserva compatibilidade.
```

## Excluir/adiar quando

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

## Mover para Mais quando

```txt
é útil, mas ocasional;
é avançado;
é configuração;
é método/guia;
é segurança/sistema.
```

## Mover para Stats quando

```txt
é diagnóstico;
é retrospectivo;
é métrica;
não precisa aparecer todo dia.
```

---

## 17. Regras técnicas para IA

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

## 18. Definition of Done

Uma mudança só está pronta se:

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

## 19. Prompt base para Claude/Codex

Use isto no início de qualquer tarefa:

```txt
Antes de implementar, leia docs/MEDREV_PRODUCT_CHARTER.md.

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
