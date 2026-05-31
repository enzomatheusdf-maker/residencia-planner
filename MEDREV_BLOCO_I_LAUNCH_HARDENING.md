# MEDREV — BLOCO I: Hardening do Lançamento, Onboarding, UX de Baixo Atrito e Release Gate

> **Executor:** Claude Code / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `very high`  
> **Modo:** agent com aprovação manual para comandos destrutivos.  
> **Objetivo:** preparar o MedRev para lançamento sem remover features existentes. O foco é estabilidade, clareza, onboarding, mobile, estados vazios, rotas, botões, persistência, testes e deploy seguro.

---

## 0. Tese do bloco

Os blocos A–H adicionam muita capacidade ao produto:

```txt
Dashboard Comando do Dia
Modo Mentor
ENAMED Intel
Análise de prova
Cronogramas MEDCOF / Estratégia / Custom
Raciocínio clínico com illness script
Banco de casos
Já domino
Action Inbox
Peak Mode
Weekly Review
Data Safety
Tooltips/mobile corrigidos
```

O risco agora não é falta de feature. O risco é:

```txt
produto poderoso demais
usuário cansado
muitas escolhas
primeiro uso confuso
feature quebrada escondida
mobile com fluxo difícil
deploy sem validação
```

Este bloco deve transformar a V1 em uma experiência lançável.

Regra de ouro:

```txt
Não remover features existentes.
Não esconder para sempre.
Não simplificar destruindo capacidade.
Apenas organizar, guiar, colapsar o avançado e criar caminho claro de primeiro uso.
```

---

## 1. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Durante a edição:

- Não remover features implementadas.
- Não apagar arquivos/rotas/componentes sem prova de que estão mortos.
- Não instalar bibliotecas novas.
- Não fazer refactor cosmético amplo.
- Não introduzir mojibake.
- Manter UTF-8 sem BOM.
- Não quebrar MEDCOF, Estratégia, Custom, ENAMED, Raciocínio Clínico, Modo Foco ou Cronograma.
- Não transformar feature avançada em inacessível; apenas colocar atrás de “Avançado”, “Ver detalhes” ou “Configurações”.
- Não fazer commit/deploy/push antes do Release Gate final.
- Se qualquer build/teste falhar, pare e corrija antes de avançar.

---

## 2. Resultado esperado do lançamento

Usuário novo deve conseguir, em menos de 2 minutos:

```txt
1. Entrar no app.
2. Escolher objetivo.
3. Escolher calendário-base.
4. Ativar Modo Mentor.
5. Ver a próxima melhor ação.
6. Começar um estudo/revisão/caso sem entender toda a arquitetura.
```

Usuário avançado deve conseguir:

```txt
1. Ver estatísticas completas.
2. Importar cronograma.
3. Analisar prova ENAMED.
4. Usar Raciocínio Clínico.
5. Ver Action Inbox.
6. Configurar módulos.
7. Exportar backup.
```

---

## 3. Escopo do Bloco I

Criar, se ainda não existirem:

```txt
src/core/launchReadiness.js                [NOVO]
src/core/launchReadiness.test.js           [NOVO]
src/core/onboarding.js                     [NOVO]
src/core/onboarding.test.js                [NOVO]
src/components/OnboardingWizard.jsx        [NOVO]
src/components/EmptyState.jsx              [NOVO]
src/components/AdvancedSection.jsx         [NOVO]
src/components/LaunchChecklistPanel.jsx    [NOVO]
src/components/ErrorBoundary.jsx           [NOVO, se não existir]
```

Patch provável:

```txt
src/core/store.js
src/components/Dashboard.jsx
src/components/StatsPanel.jsx
src/components/CronogramaHub.jsx
src/components/RaciocinioClinico.jsx
src/components/EnamedProvaAnalyzer.jsx
src/components/ActionInbox.jsx
src/components/DataSafetyPanel.jsx
src/components/Sidebar.jsx
src/components/BottomNav.jsx
src/App.js
src/index.css
```

Não criar:

```txt
novo banco de questões
OCR
chat médico livre
ranking social
integração paga externa
ML real
app mobile nativo
```

---

## 4. Auditoria obrigatória antes de implementar

Rode:

```bash
grep -R "TODO\|FIXME\|placeholder\|em breve\|coming soon" -n src || true
grep -R "onClick={() => {}}\|onClick={null}\|disabled" -n src/components || true
grep -R "throw new Error\|console.error\|console.warn" -n src || true
grep -R "localStorage" -n src || true
grep -R "window\." -n src || true
grep -R "document\." -n src || true
grep -R "title=" -n src/components || true
grep -R "z-\[999\]\|z-\[9999\]\|overflow-hidden" -n src/components || true
```

PowerShell equivalente:

```powershell
Select-String -Path "src\**\*" -Pattern "TODO","FIXME","placeholder","em breve","coming soon","onClick={() => {}}","onClick={null}","disabled","throw new Error","console.error","console.warn","localStorage","window.","document.","title=" -CaseSensitive:$false
```

Mapeie:

```txt
botões sem função
telas sem estado vazio
features sem onboarding
rotas inacessíveis
métricas sem explicação
tooltips restantes com title
componentes que quebram mobile
erros de build/teste
```

Corrija o que for necessário para lançamento. Não faça refactor amplo.

---

## 5. Feature I1 — Onboarding Wizard de 3 passos

### 5.1 Objetivo

Criar um onboarding curto que configure o mínimo para o Modo Mentor funcionar.

Tela aparece se:

```js
meta.onboarding?.completed !== true
```

### 5.2 Estado no store

Adicionar em `meta`:

```js
onboarding: {
  completed: false,
  completedAt: null,
  step: 0,
  goal: null, // "enamed" | "residencia" | "ambos"
  calendarProvider: null, // "medcof" | "estrategia_extensivo_user" | "custom"
  mentorMode: true,
  modules: {
    raciocinioClinico: true,
    anki: false,
    enamed: true
  }
}
```

Migration:

```js
onboarding: persisted?.onboarding || defaultOnboarding
```

Não sobrescrever usuário antigo.

### 5.3 `src/core/onboarding.js`

Criar funções puras:

```js
export function getOnboardingDefaults(existingMeta = {}) {}

export function applyOnboardingChoice(meta = {}, choice = {}) {}

export function isOnboardingComplete(meta = {}) {}

export function getRecommendedDefaultsForGoal(goal) {}
```

Regras:

- Para `enamed`: ativar ENAMED, Modo Mentor, calendário MEDCOF default.
- Para `residencia`: ativar residência/cronograma, Modo Mentor.
- Para `ambos`: ativar ENAMED + residência.
- Raciocínio Clínico pode vir ativo, mas aparecer como recurso complementar.
- Anki desligado por padrão, salvo se já estiver configurado.

### 5.4 `OnboardingWizard.jsx`

3 passos:

#### Passo 1 — Objetivo

```txt
Qual é seu foco agora?

[ENAMED]
[Residência médica]
[Os dois]
```

Subtexto:

```txt
Isso muda o peso das recomendações do Mentor. Você pode alterar depois.
```

#### Passo 2 — Calendário-base

```txt
Como você quer organizar os temas?

[MEDCOF]
[Estratégia MED — importar meu cronograma]
[Personalizado]
```

Se escolher Estratégia:

- mostrar CTA para importar agora;
- permitir “configurar depois” sem travar.

#### Passo 3 — Modo de uso

```txt
Como você quer começar?

[Modo Mentor recomendado]
O app escolhe a próxima melhor ação.

[Modo Manual]
Você vê mais painéis e decide.
```

Default: Modo Mentor.

Botão final:

```txt
Entrar no MedRev
```

### 5.5 Regras UX

- Onboarding pulável, mas com aviso:
  ```txt
  Você pode pular, mas o Mentor terá menos contexto.
  ```
- Não bloquear acesso ao app.
- Usuário antigo com dados não deve perder nada.
- Em mobile, cada passo deve caber em viewport com scroll seguro.

---

## 6. Feature I2 — Estados vazios de lançamento

Criar componente genérico:

```jsx
<EmptyState
  icon={...}
  title="..."
  description="..."
  primaryAction={{ label, onClick }}
  secondaryAction={{ label, onClick }}
/>
```

Usar em:

### Dashboard sem dados

```txt
Comece em 2 minutos
1. Escolha um calendário.
2. Deixe o Mentor montar a primeira ação.
3. Faça uma sessão curta.
```

CTA:

```txt
Configurar agora
```

### Cronograma sem calendário

```txt
Nenhum cronograma ativo
Escolha MEDCOF, importe Estratégia MED ou crie um personalizado.
```

### ENAMED sem prova

```txt
Ainda sem análise de prova
Você pode começar com acertos por área. Não precisa cadastrar questão por questão.
```

### Raciocínio sem casos feitos

```txt
Treine seu primeiro caso clínico
Comece com um caso ligado ao seu cronograma ou um caso recomendado pelo Mentor.
```

### Action Inbox vazia

```txt
Nada urgente agora
Quando houver revisão, prova analisada ou caso vencido, o Mentor colocará aqui.
```

---

## 7. Feature I3 — Progressive disclosure sem remover features

Criar `AdvancedSection.jsx`:

```jsx
<AdvancedSection
  title="Painéis avançados"
  defaultOpen={false}
  storageKey="dashboard-advanced-panels"
>
  ...
</AdvancedSection>
```

Usar para:

- métricas profundas do Dashboard;
- análise detalhada ENAMED por questão;
- mapeamento avançado de calendário;
- Action Inbox completa;
- Data Safety;
- Weekly Review antigo/histórico.

Regras:

- Se a feature é importante para tarefa atual, não esconder.
- Se é diagnóstico/profundidade, colapsar.
- Estado aberto/fechado pode persistir no localStorage ou store.

---

## 8. Feature I4 — Launch Readiness Core

Criar `src/core/launchReadiness.js`.

Objetivo: gerar uma checklist interna do estado do app.

Funções:

```js
export function checkLaunchReadiness(context = {}) {}

export function summarizeLaunchRisks(checks = []) {}

export function getLaunchChecklistItems(context = {}) {}
```

Checks sugeridos:

```js
[
  {
    id: "onboarding",
    label: "Onboarding configurado",
    status: "ok" | "warn" | "fail",
    reason: "..."
  },
  {
    id: "calendar-provider",
    label: "Calendário-base selecionado",
    status: ...
  },
  {
    id: "mentor-action",
    label: "Mentor gera ação principal",
    status: ...
  },
  {
    id: "enamed",
    label: "ENAMED Intel disponível",
    status: ...
  },
  {
    id: "raciocinio",
    label: "Raciocínio Clínico acessível",
    status: ...
  },
  {
    id: "backup",
    label: "Backup/exportação disponível",
    status: ...
  }
]
```

### `LaunchChecklistPanel.jsx`

Mostrar apenas em Configurações/Stats avançado ou ambiente dev/admin.

Não poluir Dashboard do usuário comum.

---

## 9. Feature I5 — Error Boundary e fallback de crash

Se o app ainda não tiver Error Boundary, criar:

```txt
src/components/ErrorBoundary.jsx
```

Com:

```txt
Algo deu errado nesta tela.
[Recarregar]
[Exportar backup, se possível]
[Voltar ao Dashboard]
```

Regras:

- Não mostrar stack trace em produção.
- Mostrar stack em desenvolvimento.
- Tentar preservar dados via backup local se possível.
- Envolver rotas/telas principais em `App.js`.

---

## 10. Feature I6 — Navegação de lançamento

Auditar Sidebar/BottomNav.

### Regras

No desktop:

```txt
Dashboard
Cronograma
Modo Foco / Estudar
Raciocínio Clínico
Estatísticas
Configurações
```

Se houver muitas features:

- ENAMED fica dentro de Estatísticas ou seção própria se já existir.
- Data Safety fica em Configurações/Avançado.
- Weekly Review fica em Dashboard ou Estatísticas.

No mobile:

- máximo 4–5 itens no bottom nav.
- Preferência:
  ```txt
  Hoje
  Cronograma
  Estudar
  Stats
  Mais
  ```

Dentro de “Mais”:

```txt
Raciocínio Clínico
ENAMED
Configurações
Backup
```

Não remover tela. Apenas reorganizar.

---

## 11. Feature I7 — QA de botões e rotas

Criar uma checklist manual no próprio MD e, se possível, um helper dev.

Auditar botões principais:

```txt
Dashboard:
- Começar agora
- Ver por quê
- Ativar Modo Mentor
- Ver painéis avançados

Cronograma:
- Estudar
- Já domino
- Criar cronograma
- Importar calendário
- Trocar provider

Modo Foco:
- Pausar
- Avançar
- Concluir
- Voltar

Raciocínio:
- Iniciar caso
- Avançar etapa
- Finalizar caso
- Refazer agora

ENAMED:
- Analisar prova
- Salvar resultado
- Enviar para Mentor

Action Inbox:
- Aceitar
- Marcar feito
- Dispensar

Configurações:
- Exportar backup
- Importar backup
```

Nenhum botão central pode ficar sem ação real.

---

## 12. Feature I8 — Polimento de textos críticos

Revisar copy para reduzir confusão:

Trocar:

```txt
Prontidão
```

por:

```txt
Preparo estimado
```

Trocar:

```txt
True Retention
```

por:

```txt
Retenção longa
```

Quando sem dados:

```txt
Coletando D21+
```

Trocar:

```txt
Modo Simples
```

por:

```txt
Modo Mentor
```

Trocar frases vagas:

```txt
Seu ritmo está equilibrado
```

por ação concreta:

```txt
Mantenha revisões hoje. Não iniciar tema novo se passar de X revisões futuras.
```

Regras:

- Texto deve responder “e agora?”.
- Evitar jargão quando não necessário.
- Não inflar confiança com 100% quando há pouco dado.

---

## 13. Feature I9 — Performance e bundle sanity

Sem instalar libs, fazer auditoria simples:

- remover imports não usados;
- evitar recalcular arrays grandes a cada render sem `useMemo`;
- evitar loops pesados no Dashboard;
- evitar salvar estado gigante em cada tecla;
- debounce simples em inputs grandes, se já houver helper;
- limitar históricos:
  - casos clínicos: 30 por caso;
  - action inbox: status recente;
  - weekly reviews: últimos 52;
  - provas: sem limite rígido, mas não duplicar análise em render.

Rodar:

```bash
npm run build
```

Observar warnings.

Não fazer otimização prematura agressiva.

---

## 14. Feature I10 — Release Gate final

Criar seção no repo:

```txt
docs/RELEASE_CHECKLIST.md
```

Se não houver pasta docs, criar.

Conteúdo:

```txt
# Release Checklist MedRev

## Automático
- npm run check:mojibake
- npm test -- --watchAll=false
- npm run build

## Manual desktop
- Dashboard
- Cronograma
- Modo Foco
- Raciocínio Clínico
- ENAMED
- Estatísticas
- Configurações

## Manual mobile
- 390x844
- 375x667
- 414x896

## Dados
- exportar backup
- importar backup teste
- trocar calendário sem apagar progresso

## Deploy
- commit
- firebase deploy
- push
```

No fim do Bloco I, se tudo passar e o usuário autorizar, executar:

```bash
git add .
git commit -m "chore: harden MVP launch flow"
npm run build
firebase deploy
git push
```

**Mas só executar commit/deploy/push se o usuário confirmar explicitamente no Codex.**

---

## 15. Testes obrigatórios

Criar:

```txt
src/core/onboarding.test.js
src/core/launchReadiness.test.js
```

Testar:

### onboarding

- defaults para ENAMED;
- defaults para residência;
- onboarding completo;
- não sobrescreve meta existente.

### launchReadiness

- fail quando não há calendário;
- warn quando ENAMED sem prova;
- ok quando mentor gera ação;
- backup disponível;
- checklist retorna itens ordenados.

Rode também todos os testes existentes.

---

## 16. Teste manual de fluxo completo

Simular usuário novo:

```txt
1. Limpar localStorage em ambiente dev.
2. Abrir app.
3. Ver onboarding.
4. Escolher ENAMED + MEDCOF + Modo Mentor.
5. Entrar no Dashboard.
6. Ver ação principal.
7. Abrir Cronograma.
8. Clicar em Já domino em tema não iniciado.
9. Validar 12/15.
10. Ver D7.
11. Abrir Raciocínio Clínico.
12. Fazer primeiro caso.
13. Ver score e reencontro.
14. Abrir ENAMED.
15. Cadastrar prova por área.
16. Ver análise.
17. Voltar ao Dashboard.
18. Ver Mentor usando a análise.
19. Exportar backup.
20. Testar mobile.
```

Simular usuário antigo:

```txt
1. Usar localStorage existente.
2. Abrir app.
3. Não perder progresso.
4. Onboarding não sobrescrever dados.
5. Rotas antigas funcionam.
```

---

## 17. Comandos finais

Antes de terminar:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
git status --short
```

Se tudo passar, gerar relatório:

```txt
Arquivos alterados
Arquivos criados
Testes rodados
Build status
Warnings restantes
Checklist manual pendente
Recomendação de deploy
```

Não fazer deploy sem confirmação.

---

## 18. Critérios de aceite

Bloco I aprovado se:

- Nenhuma feature existente foi removida.
- Onboarding curto existe.
- Estados vazios guiam o usuário.
- Modo Mentor é o caminho default de baixo atrito.
- Features avançadas continuam acessíveis.
- Botões centrais têm ação real.
- Error Boundary protege o app.
- Release checklist existe.
- Build passa.
- Testes passam.
- App está mais fácil para usuário novo.
- App ainda é poderoso para usuário avançado.

---

## 19. Nota final ao executor

O objetivo deste bloco não é impressionar com mais funcionalidades.

É fazer o usuário pensar:

```txt
Eu abri o app e ele me disse exatamente o que fazer.
Eu entendi o porquê.
Eu consegui começar.
```

Esse é o lançamento.
