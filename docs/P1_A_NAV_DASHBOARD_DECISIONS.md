# P1-A Nav Dashboard Decisions

## 1. Por que Dashboard virou Hoje
- O dashboard foi reposicionado como tela de execucao diaria.
- O topo ficou centrado em comando do Mentor, proximas acoes e carga do dia.
- Blocos de diagnostico profundo foram movidos para uma camada avancada colapsada.

## 2. Nova navegacao desktop
- Primario (max 6): Hoje, Plano, Estudar, Estatisticas, Banco, Mais.
- Recursos avancados foram centralizados em Mais para reduzir competicao visual com tarefas diarias.

## 3. Nova navegacao mobile
- Primario (max 5): Hoje, Plano, Estudar, Stats, Mais.
- BottomNav consome o mesmo navigationModel e abre ferramentas extras via Mais.

## 4. O que ficou primario
- Hoje (`dash`)
- Plano (`crono`)
- Estudar (`sims`)
- Estatisticas (`stats`)
- Banco (`banco`, desktop)
- Mais (`more`)

## 5. O que foi para Mais
- Raciocinio Clinico (Residencia, quando habilitado)
- Anki Audit
- Weekly Review
- Academia / Metodo
- Data Safety
- Launch Checklist
- Guia
- Ajustes

## 6. O que ficou para P1-B
- Correcao formal de fallback/target inexecutavel do Mentor.
- Tratamento de erros e trilha de atividade fora do escopo P1-A.

## 7. Pendencias conhecidas
- Data Safety, Weekly Review e Launch Checklist continuam acessados via Stats (sem view dedicada).
- Guia e Ajustes permanecem como modais, com atalho por Mais.
