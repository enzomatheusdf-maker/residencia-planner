# MEDREV — Auditoria Profunda do Código Atual nas Funções Críticas e Plano Integrado

> **Arquivo sugerido no repo:** `docs/MEDREV_CODE_AUDIT_SAFETY_UX_VALIDATION_PLAN.md`  
> **Fonte analisada:** `Bro (19).zip`  
> **Escopo:** Data Safety, escopo por usuário, Firestore, backup/restore, onboarding, welcome/resumo do dia, Dashboard mobile, inputs numéricos, tooltips, Weekly Review, Gargalo ENAMED, telemetria/validação do preparo estimado.  
> **Objetivo:** transformar o estado real do código em um plano cirúrgico para GPT-5.4/GPT-5.5/Claude implementar sem alucinar.

---

## 0. Limitação da auditoria

A análise foi feita por inspeção estática do código extraído do ZIP.

Não foi possível rodar a suíte localmente neste ambiente porque o ZIP não trouxe `node_modules` e `react-scripts` não está instalado no sandbox:

```txt
sh: 1: react-scripts: not found
```

Portanto, a validação final deve ser feita no seu ambiente com:

```powershell
npm install
npm run check:mojibake
npm test -- --watchAll=false
npm run build
npm run audit
```

Observação: no `package.json` atual existe `audit`, mas **não existe `audit:full`**. Muitos prompts antigos mandam rodar `npm run audit:full`; isso precisa ser corrigido ou adicionado.

---

# 1. Diagnóstico executivo

O código já avançou bastante. Não estamos no zero.

Já existem:

```txt
userScope.js
authSession.js
userDataMigration.js
userDataPaths.js
firestore.rules
DataSafetyPanel.jsx
backup.js
navigationModel.js com Data Safety em Mais
WeeklyReview.jsx
OnboardingWizard.jsx
VestibularStartTrail.jsx
WelcomePopup dentro do Dashboard
SmartTooltip/InfoTooltip em Primitives.jsx
reviewTaskPlanner atualizado para D21 mini_case
```

Mas ainda há lacunas importantes.

## P0 — antes de lançamento aberto

```txt
1. Data Safety está parcialmente implementado, mas ainda não é robusto o bastante para beta aberto.
2. localStorage já tem chave por uid, mas o fluxo de troca de usuário/hidratação ainda precisa de teste de isolamento end-to-end.
3. Firestore Rules estão escopadas por uid, mas ainda amplas dentro de /usuarios/{uid}; devem ser endurecidas e documentadas.
4. Backup/restore existe, mas a verificação de integridade ainda é superficial; falta dataIntegrity real.
5. Telemetria atual usa Firebase Analytics diretamente e envia uid em alguns eventos; falta sanitização e opt-out.
6. Dashboard mobile ainda mistura ação, diagnóstico e avançado.
7. Onboarding e resumo do dia têm estados paralelos e podem reaparecer/sumir de forma errada.
8. Inputs numéricos aceitam strings inválidas porque dependem de `type=number`, `parseInt` e `+e.target.value`.
9. Tooltips dependem de hover/click simples e fecham no scroll; mobile precisa de bottom sheet/popover seguro.
10. Weekly Review aparece cedo demais e gera conteúdo genérico.
```

---

# 2. Estado real por área

---

## 2.1 Data Safety / escopo de usuário

### Arquivos relevantes

```txt
src/core/userScope.js
src/core/authSession.js
src/core/userDataMigration.js
src/services/userDataPaths.js
src/services/firebase.js
src/core/store.js
src/components/DataSafetyPanel.jsx
src/core/backup.js
firestore.rules
```

### O que está bom

`userScope.js` já cria chave local por ambiente e uid:

```js
getUserScopedStorageKey(uid, env) -> medrev:<env>:user:<uid>:store
```

E chave anônima:

```js
getAnonymousStorageKey(sessionId, env) -> medrev:<env>:anonymous:<sessionId>:store
```

`authSession.js` já monta sessão com `scopeKey` e bloqueia sync divergente com:

```js
assertActiveUserScope(activeUid, currentUid)
```

`App.js` já faz uma sequência importante no login/logout:

```txt
1. detecta uid atual;
2. calcula scopeKey;
3. setAuthSession(...hydrated:false);
4. resetStore();
5. useStore.persist.setOptions({ name: scopeKey });
6. useStore.persist.rehydrate();
7. carrega Firebase se usuário autenticado;
8. salva/mescla conforme updatedAt.
```

`services/firebase.js` também valida uid antes de escrever:

```js
assertWriteScope(uid)
```

Isso é bom. Já reduz bastante o risco de vazamento entre contas.

### O que ainda está frágil

#### 1. Store ainda nasce com chave anônima default

Em `store.js`:

```js
const DEFAULT_PERSIST_SCOPE_KEY = getAnonymousStorageKey(getOrCreateAnonymousSessionId());

persist(..., {
  name: DEFAULT_PERSIST_SCOPE_KEY,
  storage: createJSONStorage(() => localStorage),
})
```

Isso é aceitável, mas precisa de teste end-to-end garantindo que:

```txt
usuário A loga -> carrega escopo A;
usuário A desloga -> não deixa dados A visíveis;
usuário B loga -> não carrega dados A;
usuário anônimo -> não herda dados de usuário autenticado.
```

Hoje a proteção existe, mas não há prova suficiente.

#### 2. Paths usam coleção `usuarios`, não `/users/{uid}`

`userScope.js` define:

```js
const USER_COLLECTION = "usuarios";
```

`userDataPaths.js` retorna paths como:

```txt
["usuarios", uid]
["usuarios", uid, "activityLog"]
["usuarios", uid, "backups"]
```

Isso não é errado, mas todos os docs novos falam em `/users/{uid}`. Precisa escolher uma convenção.

Recomendação:

```txt
Manter "usuarios" se já está em produção/dev e não quiser migração agora.
Mas documentar que o path canônico atual é /usuarios/{uid}.
Não misturar /users e /usuarios.
```

#### 3. `firestore.rules` está owner-only, mas amplo dentro do usuário

Atual:

```js
match /usuarios/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;

  match /{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
}
```

Isso impede outro usuário de ler/escrever dados de outro uid. Bom.

Mas ainda permite qualquer escrita dentro de qualquer subpath do próprio usuário. Para beta pequeno, isso é aceitável. Para lançamento, melhor restringir por subcoleções permitidas:

```txt
/usuarios/{uid}
/usuarios/{uid}/activityLog/{eventId}
/usuarios/{uid}/backups/{backupId}
/usuarios/{uid}/telemetry/{eventId}
/usuarios/{uid}/calendarImports/{importId}
```

#### 4. DataSafetyPanel é real, mas verificação é superficial

`DataSafetyPanel.jsx` já faz:

```txt
Exportar backup JSON
Importar backup JSON
Validar local
Migrar legado
Limpar caches temporários
Mostrar UID atual
Mostrar escopo local
Mostrar store legada
Mostrar tamanho local
```

Mas a validação usa `validateMedrevBackup` de `backup.js`, que checa estrutura geral:

```txt
version
schema
ownerUid
meta/res/vest object
contagem de temas
```

Falta validar integridade do estado:

```txt
temas array;
tema.id;
tema.nome;
rev object;
datas válidas;
domínio prévio coerente;
D7/D21/D14 sem contradição;
reviewHistory;
acertos normalizados;
steps inválidos.
```

#### 5. Duplicação de backup no Ajustes e em DataSafetyPanel

Há backup/import/migração também em `Modals.jsx` dentro do modal de Ajustes. Isso cria duas fontes de verdade para Data Safety.

Recomendação:

```txt
DataSafetyPanel deve ser a fonte principal.
Ajustes pode ter apenas um botão: "Abrir Segurança dos dados".
```

---

## 2.2 Telemetria / validação do preparo estimado

### Estado atual

Não existem arquivos:

```txt
src/core/telemetry.js
src/core/readinessValidation.js
src/core/dataIntegrity.js
```

A telemetria atual está espalhada em `services/firebase.js`, `App.js`, `Dashboard.jsx` e `Simulados.jsx`.

`services/firebase.js` usa Firebase Analytics:

```js
export async function trackEvent(name, params = {}) {
  const analytics = await getAnalyticsSafe();
  logEvent(analytics, name, params);
}
```

Eventos atuais encontrados:

```txt
retorno_d7 / retorno_d1
primeira_revisao
revisoes_zeradas_dia
dominio_previo_avaliado
onboarding_done
simulado_registrado
```

### Problema P0/P1

Alguns eventos enviam `uid` explicitamente nos params, por exemplo:

```js
trackEvent("primeira_revisao", { uid: usuarioLogado?.uid, step: stepKey, plat });
```

Isso não é ideal para uma instrumentação privada. Mesmo que Firebase Analytics já tenha user/session internamente, o app não deveria colocar `uid` no payload de evento operacional.

Também não há:

```txt
opt-out;
sanitização central;
bloqueio de texto livre;
eventos de aderência ao Mentor;
snapshots de readiness;
comparação readiness vs simulado.
```

### Decisão

Antes de qualquer telemetria nova:

```txt
1. criar src/core/telemetry.js;
2. sanitizar payload;
3. remover uid de payloads;
4. criar flag de opt-out;
5. criar eventos mínimos;
6. não criar BI pesado.
```

---

## 2.3 Dashboard mobile

### Arquivo principal

```txt
src/components/Dashboard.jsx
```

### Estado atual observado no código

O Dashboard tem:

```txt
Comando do Mentor
top bar com provider/importar/consistência/prova
ActionInbox
Avançado colapsável
KPIs dentro do Avançado
Gargalo ENAMED / Raciocínio clínico
MiniCronogramaWidget dentro do Avançado
WeeklyReview dentro do Avançado
WelcomePopup
VestibularStartTrail
TourBalloon
```

### Problemas confirmados pelo código e prints

#### 1. Top bar mobile está carregada demais

No hero, linhas do `Dashboard.jsx` mostram:

```txt
Provider: ...
Importar
Consistência
Prova
Reta final
Editar nome
```

Isso explica o print: no mobile a barra superior não comporta tudo.

#### 2. Revisão & Cronograma está dentro do Avançado

No código, `MiniCronogramaWidget` aparece dentro de:

```jsx
{showAdvanced && (
  <>
    KPIs
    Gargalo ENAMED
    MiniCronogramaWidget
    WeeklyReview
  </>
)}
```

Isso confirma o bug: `Revisão & Cronograma` é operacional, mas está escondido dentro de Avançado.

#### 3. WeeklyReview também está no Avançado e aparece cedo

`WeeklyReview` é renderizado sempre que `showAdvanced` está aberto. O próprio componente monta planos mesmo com poucos dados, gerando:

```txt
0 sessões;
a definir;
sem bloqueio dominante;
funções genéricas.
```

#### 4. Gargalo ENAMED é inespecífico

O card usa:

```js
readinessData.priorityList[0].area
coverage
retention
```

Mas não explica:

```txt
por que é gargalo;
qual evidência usou;
qual ação tomar;
qual tema específico;
se a amostra é suficiente.
```

#### 5. "FSRS/Curva de revisão hoje" vs "Fila cronológica" confunde

O código ainda usa labels como:

```txt
Curva de revisão hoje
Cronograma
Fila de hoje
```

A distinção operacional precisa virar:

```txt
Revisões de hoje
Próximas revisões
Plano da semana
```

#### 6. Avançado vira depósito de tudo

O `Advanced` contém coisas que não deveriam estar juntas:

```txt
KPIs
gargalo
raciocínio clínico
revisão & cronograma
weekly review
```

Isso é a causa da sensação de confusão no mobile.

---

## 2.4 Tooltips mobile

### Arquivo principal

```txt
src/components/Primitives.jsx
```

`SmartTooltip` usa:

```txt
onMouseEnter
onMouseLeave
onClick
position fixed
fecha no scroll
fecha no resize
```

### Problema

No mobile:

```txt
não existe hover;
o tooltip pode abrir e fechar de forma instável;
scroll fecha imediatamente;
posição calculada pode ficar ruim em cards dentro de containers scrolláveis;
não há bottom sheet;
não há fundo clicável;
não há X no tooltip.
```

### Decisão

No mobile, `InfoTooltip` deve abrir como:

```txt
bottom sheet pequeno;
ou popover centralizado;
com X;
fecha por backdrop;
não fecha só porque a página scrollou;
não ultrapassa viewport.
```

---

## 2.5 Inputs numéricos

### Arquivo principal

```txt
src/components/Modals.jsx
```

### Estado atual

Há vários inputs do tipo `number` com `parseInt`, `parseFloat` ou `+e.target.value`:

```jsx
<Input type="number" ... onChange={(e) => saveMeta({ metaDiaria: +e.target.value })} />
<Input type="number" ... onChange={(e) => saveMeta({ maxRevisoesDia: parseInt(e.target.value, 10) || 30 })} />
```

### Problema

`type="number"` não é suficiente. Dependendo do browser/mobile, o usuário ainda pode digitar:

```txt
O10
1e5
-
.
```

Além disso, os fallbacks com `||` podem transformar valor legítimo `0` em default incorreto em alguns campos.

### Decisão

Criar helper canônico:

```txt
src/core/numberInput.js
src/core/numberInput.test.js
```

E usar em todos os inputs críticos.

---

## 2.6 Onboarding e trilha inicial

### Arquivos relevantes

```txt
src/core/onboarding.js
src/components/OnboardingWizard.jsx
src/core/vestibularOnboarding.js
src/components/VestibularStartTrail.jsx
src/components/Dashboard.jsx
src/core/store.js
```

### Estado atual

Há dois sistemas paralelos:

```txt
meta.onboarding / onboardingDone
meta.vestibularStart
```

`OnboardingWizard` completa `meta.onboarding`.

`VestibularStartTrail` depende de:

```js
isVestibularStartComplete(meta)
```

que só verifica:

```js
meta.vestibularStart.completed === true
```

### Problema

Isso explica a sensação de “trilha inicial configurada toda hora”.

O usuário pode completar um onboarding geral, mas a trilha específica do vestibular continuar incompleta. Ou o app pode não ter uma regra unificada para decidir:

```txt
mostrar onboarding geral;
mostrar trilha vestibular;
mostrar resumo do dia;
não mostrar nada.
```

### Decisão

Criar helper canônico:

```txt
src/core/onboardingGate.js
```

Com funções:

```js
shouldShowGlobalOnboarding(state)
shouldShowVestibularStartTrail(state)
shouldShowDailyBriefing(state)
markOnboardingDismissed(...)
markDailyBriefingDismissed(...)
```

---

## 2.7 WelcomePopup / Resumo do dia

### Estado atual

`Dashboard.jsx` tem `WelcomePopup`, mas a exibição depende de:

```js
const SESSION_KEY = "medrev_welcome_shown";
sessionStorage.getItem(SESSION_KEY)
```

### Problemas

```txt
1. A chave não é por uid.
2. A chave não é por dia.
3. Pode sumir pelo resto da sessão mesmo se o usuário trocar de conta.
4. Não existe dismissal diário.
5. Não usa o escopo local seguro.
6. Compete com onboarding/tour.
```

### Decisão

Substituir por `DailyBriefing`:

```txt
src/core/dailyBriefing.js
src/core/dailyBriefing.test.js
src/components/DailyBriefingCard.jsx
```

Regras:

```txt
mostrar no primeiro acesso do dia;
não mostrar se onboarding obrigatório está ativo;
não mostrar se dismissado hoje;
chave por uid/data;
não ser modal agressivo por padrão;
conteúdo: revisões, minutos, prioridade, atraso, CTA.
```

---

## 2.8 Weekly Review

### Estado atual

`WeeklyReview.jsx` calcula tudo localmente e chama `buildWeeklyReview`.

Ele aparece no Dashboard quando Advanced está aberto, sem critério mínimo de maturidade.

### Problemas

```txt
1. Aparece cedo demais.
2. Gera plano genérico.
3. Ações são sempre exibidas, mesmo sem contexto.
4. "Focar área fraca" pode aparecer sem área real.
5. "Selecionar temas", "Importar cronograma", "Já domino" aparecem como menu genérico.
```

### Decisão

Criar gating:

```txt
min 7 dias desde início
OU 5 sessões
OU 20 revisões/questões
```

Antes disso:

```txt
Sua revisão semanal será liberada após alguns dias de uso. Por enquanto, conclua o primeiro ciclo.
```

Ações devem ser condicionais:

```txt
sem cronograma -> Importar/criar cronograma;
sem sessões -> Começar primeiro ciclo;
área fraca real -> Focar área fraca;
tema não iniciado -> Usar Já domino;
revisão vencida -> Recuperar atrasadas.
```

---

## 2.9 Já domino

### Estado atual

`domainValidation.js` usa:

```txt
80–89% -> D7
>=90% -> D21
```

O copy em `Modals.jsx` também fala:

```txt
D7 (80–89%) ou D21 (90%+)
```

### Atenção estratégica

Em planos anteriores, foi discutido D14 para >=90%. O código atual consolidou D21. Isso precisa ser uma decisão explícita.

### Recomendação

Para evitar retrabalho:

```txt
Manter o comportamento atual D21 se essa foi a decisão mais recente.
Atualizar todos os docs antigos que ainda falem D14.
Ou, se você quiser voltar para D14, fazer bloco específico.
```

No momento, **não mexer nisso junto com UX/Data Safety**.

---

# 3. Plano integrado atualizado

## Ordem correta agora

```txt
0. Checkpoint/backup local.
1. Se testes estiverem quebrados: corrigir primeiro.
2. UX1 — inputs numéricos seguros.
3. UX3 — onboarding/trilhas não repetirem.
4. UX4 — resumo do dia por uid/dia.
5. UX2 — tooltips mobile.
6. UX5 — Dashboard mobile e hierarquia.
7. UX6 — Weekly Review útil/contextual.
8. UX7 — Gargalo ENAMED específico.
9. N0 — auditoria final Data Safety.
10. N1/N2/N3/N4 — endurecimento Data Safety.
11. V1 — telemetry privada mínima.
12. V2 — validação do preparo estimado.
13. Beta fechado.
```

Se for lançar para estudantes reais, inverta UX e Data Safety assim:

```txt
1. Testes verdes.
2. N0–N4 Data Safety.
3. UX1/UX3/UX4/UX5.
4. V1/V2.
5. Beta fechado.
```

Minha recomendação direta:

```txt
Faça UX1 e UX3 agora porque são pequenos e afetam confiança.
Depois faça N0–N4 antes de qualquer beta real.
```

---

# 4. Blocos mastigados para implementação

---

## BLOCO CHECK — Normalizar scripts de validação

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
package.json
scripts/audit.mjs
```

### Problema

Prompts antigos usam `npm run audit:full`, mas o script não existe.

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO CHECK — normalizar scripts de validação.

Problema:
O package.json atual possui "audit", mas não possui "audit:full". Muitos fluxos/prompt mandam rodar "npm run audit:full", causando erro operacional.

Arquivos permitidos:
- package.json
- scripts/audit.mjs, apenas se necessário

Tarefas:
1. Adicionar script:
   "audit:full": "node scripts/audit.mjs"
2. Opcionalmente adicionar:
   "audit:quick": "node scripts/audit.mjs"
3. Não alterar lógica do app.
4. Não instalar libs.
5. Não mexer em src.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build
npm run audit:full

Pare e entregue relatório.
```

---

## BLOCO UX1 — Inputs numéricos seguros

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/core/numberInput.js
src/core/numberInput.test.js
src/components/Modals.jsx
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX1 — inputs numéricos seguros.

Problema confirmado no código:
Modals.jsx usa vários <Input type="number"> com parseInt/parseFloat/+e.target.value. Isso permite casos como "O10", "1e5", "-", "." e strings inválidas em campos de ajuste.

Objetivo:
Criar sanitização/validação numérica centralizada e aplicar nos campos críticos de Ajustes e "Já domino".

Arquivos permitidos:
- src/core/numberInput.js
- src/core/numberInput.test.js
- src/components/Modals.jsx

Não alterar:
- fsrs.js
- store.js
- Dashboard
- Stats
- Firebase/Auth/localStorage

Tarefas:
1. Criar helper sanitizeNumericInput(value, options).
2. Converter "O" e "o" para "0".
3. Remover caracteres não numéricos.
4. Bloquear notação científica.
5. Permitir decimal apenas quando allowDecimal=true.
6. Aplicar min/max.
7. Preservar zero quando zero é válido.
8. Aplicar nos campos:
   - meta de acerto;
   - teto diário de revisões;
   - intervalo máximo;
   - meta diária de revisões;
   - meta diária de questões;
   - meta total de questões;
   - dias personalizados de pausa;
   - "Já domino": total de questões e acertos.
9. Mostrar erro curto se valor inválido.
10. Adicionar testes.

Rode:
npm test -- --watchAll=false src/core/numberInput.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX2 — Onboarding e trilhas não repetirem

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/onboardingGate.js
src/core/onboardingGate.test.js
src/core/onboarding.js
src/core/vestibularOnboarding.js
src/components/Dashboard.jsx
src/components/OnboardingWizard.jsx
src/components/VestibularStartTrail.jsx
src/core/store.js apenas se for necessário adicionar campos de estado já dentro de meta
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX2 — onboarding e trilhas não repetirem.

Problema confirmado:
Existem estados paralelos:
- onboardingDone/meta.onboarding;
- meta.vestibularStart.
A trilha inicial pode aparecer repetidamente porque a regra de exibição não está centralizada.

Objetivo:
Criar gating canônico para onboarding geral, trilha vestibular e resumo do dia.

Arquivos permitidos:
- src/core/onboardingGate.js
- src/core/onboardingGate.test.js
- src/core/onboarding.js
- src/core/vestibularOnboarding.js
- src/components/Dashboard.jsx
- src/components/OnboardingWizard.jsx
- src/components/VestibularStartTrail.jsx
- src/core/store.js apenas se necessário dentro de meta

Não alterar:
- Firebase/Auth/localStorage paths
- FSRS
- Mentor decision policy
- Stats
- FocusMode

Tarefas:
1. Criar shouldShowGlobalOnboarding(state/context).
2. Criar shouldShowVestibularStartTrail(state/context).
3. Regras:
   - onboarding geral aparece só se setup realmente não foi concluído;
   - trilha vestibular aparece só em plat="vest" e se meta.vestibularStart.completed !== true;
   - se o usuário dismissou hoje, não mostrar de novo hoje;
   - se há plano ativo e primeira ação possível, não bloquear Dashboard com onboarding.
4. Persistir completedAt/dismissedAt/version dentro de meta.onboarding e meta.vestibularStart quando aplicável.
5. Permitir reabrir manualmente via Ajustes/Mais, se já houver ação de reset.
6. Adicionar testes:
   - usuário novo sem plano -> mostra;
   - usuário com plano -> não mostra;
   - dismissado hoje -> não mostra;
   - vestibular completo -> não mostra;
   - residência não mostra trilha vestibular.

Rode:
npm test -- --watchAll=false src/core/onboardingGate.test.js src/core/onboarding.test.js src/core/vestibularOnboarding.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX3 — Resumo do dia por usuário e por data

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/dailyBriefing.js
src/core/dailyBriefing.test.js
src/components/Dashboard.jsx
src/components/DailyBriefingCard.jsx ou componente equivalente
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX3 — Resumo do dia.

Problema confirmado:
WelcomePopup usa SESSION_KEY global "medrev_welcome_shown", em sessionStorage, sem uid e sem data. Isso faz o resumo sumir ou reaparecer de forma errada.

Objetivo:
Criar Resumo do dia leve, por uid/data, que aparece no máximo uma vez ao dia e não compete com o Comando do Mentor.

Arquivos permitidos:
- src/core/dailyBriefing.js
- src/core/dailyBriefing.test.js
- src/components/Dashboard.jsx
- src/components/DailyBriefingCard.jsx ou adaptar WelcomePopup se preferir

Não alterar:
- Mentor decision policy
- FSRS
- Store persist profunda
- Firebase/Auth/localStorage paths

Tarefas:
1. Criar buildDailyBriefing({ state, context }).
2. Conteúdo:
   - N revisões hoje;
   - tempo estimado;
   - prioridade do dia;
   - atraso se houver;
   - CTA Começar agora;
   - CTA secundário Ver plano.
3. Criar chave de dismissal:
   medrev:<env>:user:<uid>:dailyBriefing:<YYYY-MM-DD>
   ou usar scopeKey atual + data.
4. Não mostrar se onboarding obrigatório estiver ativo.
5. Não mostrar se dismissado no dia.
6. Não abrir como modal agressivo por padrão; preferir card leve/top banner.
7. Remover dependência de SESSION_KEY global.
8. Adicionar testes.

Rode:
npm test -- --watchAll=false src/core/dailyBriefing.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX4 — Tooltips mobile como bottom sheet

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/components/Primitives.jsx
src/components/Dashboard.jsx somente se necessário
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX4 — tooltips mobile.

Problema confirmado:
SmartTooltip usa hover/click e fecha no scroll. No mobile, tooltips do Dashboard/Avançado não aparecem ou aparecem fora da tela.

Objetivo:
Em mobile, InfoTooltip deve abrir por tap como bottom sheet/popover seguro.

Arquivos permitidos:
- src/components/Primitives.jsx
- src/components/Dashboard.jsx somente se precisar ajustar uso

Não alterar:
- lógica de métricas
- Mentor
- FSRS
- Store

Tarefas:
1. Detectar mobile por viewport ou media query.
2. Desktop mantém tooltip atual.
3. Mobile:
   - abre por tap;
   - renderiza bottom sheet ou popover centralizado;
   - tem X;
   - tem backdrop clicável;
   - não ultrapassa viewport;
   - não fecha imediatamente no scroll dentro da página.
4. Garantir z-index acima dos cards.
5. Garantir acessibilidade básica: role dialog/tooltip, aria-label.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX5 — Dashboard mobile: hierarquia e compactação

### Modelo

```txt
GPT-5.5 High
```

### Arquivo permitido

```txt
src/components/Dashboard.jsx
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX5 — Dashboard mobile compacto.

Problemas confirmados no código:
1. Top bar do hero mostra provider, importar, consistência, prova e reta final no mesmo bloco.
2. Revisão & Cronograma está dentro de showAdvanced.
3. WeeklyReview está dentro de showAdvanced.
4. Gargalo ENAMED está no Dashboard, mas inespecífico.
5. Dashboard mistura ação, diagnóstico e projeção.

Objetivo:
Reorganizar a hierarquia visual do Dashboard sem mexer no motor do Mentor.

Arquivo permitido:
- src/components/Dashboard.jsx

Não alterar:
- mentorDecisionPolicy.js
- mentorSignals.js
- fsrs.js
- store.js
- StatsPanel
- FocusMode
- Firestore/Auth/localStorage

Nova ordem mobile:
1. Comando do Mentor / caixa principal de ação.
2. ActionInbox como "Fila do plano" curta.
3. Revisão & Cronograma compacto fora do Avançado.
4. Continuar estudando, se houver.
5. Atalhos principais, se já existirem.
6. Avançado colapsado com KPIs diagnósticos.

Tarefas:
1. Mover MiniCronogramaWidget para fora de showAdvanced.
2. Posicionar logo abaixo de ActionInbox/caixa de ações.
3. Remover WeeklyReview do Dashboard inicial; se mantiver, exibir apenas via gating do bloco UX6.
4. Em mobile, top bar deve mostrar só:
   - saudação/título;
   - carga curta;
   - menu compacto de ações.
5. Mover provider/importar/consistência/prova para menu/linha secundária colapsável.
6. Remover "Carga de revisões próximos 14 dias" do Dashboard se existir; isso pertence ao Plano/Stats.
7. Renomear:
   - "Curva de revisão hoje" -> "Revisões de hoje"
   - "Fila cronológica" -> "Próximas revisões"
8. Evitar mostrar "Revisões de hoje" e "Próximas revisões" no mesmo bloco.
9. Não remover funcionalidades; apenas reclassificar/colapsar.
10. Garantir layout mobile sem overflow horizontal.

Rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX6 — Weekly Review útil e ações contextuais

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/components/WeeklyReview.jsx
src/core/weeklyReviewGate.js
src/core/weeklyReviewGate.test.js
src/core/sessionReflection.js somente se necessário
src/components/Dashboard.jsx somente para renderização/gating
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX6 — Weekly Review útil e ações contextuais.

Problema confirmado:
WeeklyReview aparece cedo demais e gera frases como "0 sessões", "a definir" e ações genéricas.

Objetivo:
Exibir Weekly Review só quando houver dados mínimos e tornar ações contextuais.

Arquivos permitidos:
- src/components/WeeklyReview.jsx
- src/core/weeklyReviewGate.js
- src/core/weeklyReviewGate.test.js
- src/core/sessionReflection.js apenas se necessário
- src/components/Dashboard.jsx apenas para gating/render

Não alterar:
- Store
- FSRS
- Mentor core
- Stats
- Firebase/Auth

Regras:
Weekly Review só aparece se:
- pelo menos 7 dias desde início; ou
- pelo menos 5 sessões concluídas; ou
- pelo menos 20 revisões/questões registradas.

Antes disso:
mostrar estado vazio curto:
"Sua revisão semanal será liberada após alguns dias de uso. Por enquanto, conclua o primeiro ciclo."

Ajustes contextuais:
- sem cronograma -> Importar/criar cronograma;
- sem sessões -> Começar primeiro ciclo;
- área fraca real -> Focar área fraca;
- temas não iniciados -> Usar Já domino;
- revisões vencidas -> Recuperar atrasadas;
- sem dado -> não mostrar ação genérica.

Tarefas:
1. Criar helper canShowWeeklyReview.
2. Criar helper buildContextualWeeklyActions.
3. Remover "a definir" quando não há dado; usar estado vazio honesto.
4. Adicionar testes.

Rode:
npm test -- --watchAll=false src/core/weeklyReviewGate.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

## BLOCO UX7 — Gargalo ENAMED específico

### Modelo

```txt
GPT-5.4 Medium
```

### Arquivos permitidos

```txt
src/core/enamedIntel.js
src/core/enamedIntel.test.js
src/components/Dashboard.jsx
src/core/mentorSignals.js somente se já fornece o sinal
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO UX7 — Gargalo ENAMED específico.

Problema confirmado:
O card "Gargalo ENAMED" mostra só área/cobertura/acerto. Isso é inespecífico e não gera ação clara.

Objetivo:
Tornar o gargalo explicável e acionável.

Arquivos permitidos:
- src/core/enamedIntel.js
- src/core/enamedIntel.test.js
- src/components/Dashboard.jsx
- src/core/mentorSignals.js somente se necessário para expor sinal já existente

Não alterar:
- Store
- FSRS
- StatsPanel
- Raciocínio Clínico
- Vestibular

Tarefas:
1. Criar ou ajustar função getEnamedBottleneckExplanation.
2. Retornar:
   - area;
   - motivo;
   - evidencias;
   - actionLabel;
   - target/view;
   - confidence;
   - collecting true/false.
3. Se não houver dados suficientes, mostrar:
   "Ainda coletando gargalos"
   "Faça pelo menos X sessões ou Y questões para estimar."
4. Não mostrar ENAMED no Vestibular.
5. CTA:
   - se target existe, navegar;
   - se não, "Ver plano".

Exemplo:
Gargalo ENAMED
Preventiva
Motivo: baixa cobertura e poucos acertos coletados.
Ação: faça 15 questões de indicadores de saúde ou revise o próximo tema vencido.

Rode:
npm test -- --watchAll=false src/core/enamedIntel.test.js
npm test -- --watchAll=false
npm run build

Pare e entregue relatório.
```

---

# 5. Blocos Data Safety revisados a partir do código real

---

## BLOCO N0 — Auditoria Data Safety no repo atual

### Modelo

```txt
GPT-5.5 High ou Claude Opus Planning
```

### Prompt

```txt
Antes de implementar, leia docs/MEDREV_CONTEXT_FOR_AI.md.

Execute somente BLOCO N0 — Auditoria Data Safety do código atual.

Não implemente nada.

Contexto:
O código já possui userScope.js, authSession.js, userDataMigration.js, userDataPaths.js, firestore.rules, DataSafetyPanel.jsx e backup.js. A tarefa é auditar o que já existe e apontar lacunas, não recriar do zero.

Use apenas:
git status --short
git ls-files src firebase.json firestore.rules docs scripts package.json
git grep -n "localStorage\\|sessionStorage\\|persist(\\|createJSONStorage\\|firestore\\|firebase\\|auth\\|uid\\|scopeKey\\|userScope\\|DataSafety\\|trackEvent" -- src firestore.rules firebase.json package.json

Não use ls -R, dir /s, tree, find . ou Get-ChildItem -Recurse.

Crie:
docs/N0_DATA_SAFETY_CODE_AUDIT.md

O relatório deve responder:
1. localStorage está realmente escopado por uid?
2. o que acontece ao trocar de usuário?
3. quais chaves legadas existem?
4. DataSafetyPanel exporta/importa com ownerUid?
5. restore bloqueia backup de outro uid?
6. Firestore rules permitem acesso cruzado?
7. rules estão amplas demais dentro do uid?
8. trackEvent envia uid ou dados sensíveis?
9. quais testes cobrem isolamento?
10. quais testes faltam?
11. quais blocos N1-N4 ainda são necessários?

Não edite código.
```

---

## BLOCO N1 — Testes end-to-end de isolamento local

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/userScope.test.js
src/core/authSession.test.js
src/core/userDataMigration.test.js
src/core/storeScope.test.js ou teste equivalente
```

### Prompt

```txt
Execute somente BLOCO N1 — testes de isolamento local.

Objetivo:
Provar com testes que dados de usuários diferentes não se misturam no localStorage/Zustand persist.

Arquivos permitidos:
- src/core/userScope.test.js
- src/core/authSession.test.js
- src/core/userDataMigration.test.js
- src/core/storeScope.test.js, se necessário criar

Não alterar:
- App.js
- store.js
- Firebase
- UI

Tarefas:
1. Testar build de chave por uid.
2. Testar chave anônima por sessionId.
3. Testar que uid A e uid B geram chaves diferentes.
4. Testar que chaves legadas são detectadas.
5. Testar que migração não sobrescreve target existente.
6. Testar que import/migração exige confirmação.
7. Se viável, criar teste unitário de helper de persist scope sem renderizar React.

Rode:
npm test -- --watchAll=false src/core/userScope.test.js src/core/authSession.test.js src/core/userDataMigration.test.js
npm test -- --watchAll=false
npm run build
```

---

## BLOCO N2 — dataIntegrity real

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/dataIntegrity.js
src/core/dataIntegrity.test.js
src/components/DataSafetyPanel.jsx
src/core/backup.js somente se necessário integrar validação
```

### Prompt

```txt
Execute somente BLOCO N2 — dataIntegrity real.

Objetivo:
Adicionar verificação de integridade do estado do MedRev e conectar ao DataSafetyPanel.

Arquivos permitidos:
- src/core/dataIntegrity.js
- src/core/dataIntegrity.test.js
- src/components/DataSafetyPanel.jsx
- src/core/backup.js somente se necessário

Não alterar:
- FSRS
- Store
- Mentor
- Stats
- Firebase/Auth paths

Tarefas:
1. Criar validateStateIntegrity(state).
2. Criar validateTemaIntegrity(tema).
3. Verificar:
   - res.temas e vest.temas arrays;
   - tema.id;
   - tema.nome;
   - tema.rev object;
   - datas ISO-like;
   - steps desconhecidos;
   - dominioPrevio coerente;
   - primeira revisão de domínio prévio não exibida como D1;
   - reviewHistory array quando existir;
   - acerto normalizável;
   - ownerUid, se existir.
4. DataSafetyPanel deve mostrar:
   - OK;
   - warnings;
   - críticos;
   - resumo por quantidade.
5. Restore deve rodar validateStateIntegrity antes de aplicar.
6. Não criar Activity Log.

Rode:
npm test -- --watchAll=false src/core/dataIntegrity.test.js
npm test -- --watchAll=false
npm run build
```

---

## BLOCO N3 — Firestore Rules mais explícitas

### Modelo

```txt
GPT-5.4 Medium ou GPT-5.5 High
```

### Arquivos permitidos

```txt
firestore.rules
src/services/userDataPaths.js
src/services/userDataPaths.test.js
```

### Prompt

```txt
Execute somente BLOCO N3 — Firestore Rules explícitas.

Objetivo:
Manter owner-only por uid, mas tornar os paths e rules mais explícitos.

Arquivos permitidos:
- firestore.rules
- src/services/userDataPaths.js
- src/services/userDataPaths.test.js

Não alterar:
- App.js
- store.js
- Firebase service
- UI
- Activity Log

Decisão:
O projeto atual usa coleção "usuarios". Não migrar para "users" neste bloco.

Tarefas:
1. Manter /usuarios/{uid}.
2. Permitir somente quando request.auth.uid == uid.
3. Definir explicitamente:
   - /usuarios/{uid}
   - /usuarios/{uid}/activityLog/{eventId}
   - /usuarios/{uid}/backups/{backupId}
   - /usuarios/{uid}/telemetry/{eventId}
   - /usuarios/{uid}/calendarImports/{importId}
4. Bloquear catch-all fora desses paths.
5. userDataPaths deve expor:
   - userStatePath(uid)
   - userActivityPath(uid)
   - userBackupPath(uid)
   - userCalendarImportPath(uid)
   - userTelemetryPath(uid)
6. Testes devem garantir uid obrigatório.
7. Não implementar Activity Log nem Telemetry ainda.

Rode:
npm test -- --watchAll=false src/services/userDataPaths.test.js
npm test -- --watchAll=false
npm run build
```

---

## BLOCO V1 — Telemetria privada mínima e sanitizada

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/telemetry.js
src/core/telemetry.test.js
src/services/firebase.js
src/App.js
src/components/Dashboard.jsx
src/components/Simulados.jsx
```

### Prompt

```txt
Execute somente BLOCO V1 — Telemetria privada mínima.

Problema confirmado:
Eventos trackEvent estão espalhados e alguns enviam uid no payload. Não há sanitização central nem opt-out.

Objetivo:
Criar camada de telemetria privada mínima, sanitizada, com opt-out e sem texto livre.

Arquivos permitidos:
- src/core/telemetry.js
- src/core/telemetry.test.js
- src/services/firebase.js
- src/App.js
- src/components/Dashboard.jsx
- src/components/Simulados.jsx

Não alterar:
- FSRS
- Store persist profundo
- DataSafetyPanel
- Activity Log
- UI grande

Regras:
1. Não enviar uid no payload.
2. Não enviar texto livre clínico.
3. Não enviar conteúdo de questão.
4. Payload deve ser sanitizado.
5. Deve existir flag disabled/opt-out.
6. Eventos mínimos:
   - activation_first_plan_created
   - activation_first_review_done
   - mentor_action_seen
   - mentor_action_started
   - mentor_action_completed
   - review_completed
   - simulation_result_recorded
   - readiness_snapshot
   - readiness_vs_simulado_result
7. Substituir chamadas diretas críticas de trackEvent por wrapper seguro.
8. Não criar dashboard de BI.

Rode:
npm test -- --watchAll=false src/core/telemetry.test.js
npm test -- --watchAll=false
npm run build
```

---

## BLOCO V2 — Validação do preparo estimado

### Modelo

```txt
GPT-5.5 High
```

### Arquivos permitidos

```txt
src/core/readinessValidation.js
src/core/readinessValidation.test.js
src/core/metricsRegistry.js
src/components/StatsPanel.jsx
```

### Prompt

```txt
Execute somente BLOCO V2 — validação do preparo estimado.

Objetivo:
Criar estrutura leve para comparar preparo estimado com resultado real de simulado/prova.

Arquivos permitidos:
- src/core/readinessValidation.js
- src/core/readinessValidation.test.js
- src/core/metricsRegistry.js
- src/components/StatsPanel.jsx

Não alterar:
- FSRS
- Store persistence profunda
- Mentor decision policy
- Telemetry além do wrapper já criado

Tarefas:
1. Criar createReadinessSnapshot.
2. Criar compareReadinessToSimulado.
3. Calcular erro absoluto:
   abs(preparoEstimado - resultadoReal)
4. Classificar:
   - coletando;
   - alinhado;
   - superestimado;
   - subestimado.
5. Stats deve mostrar estado simples:
   "Ainda coletando validação"
   ou "Preparo estimado acima/abaixo do resultado real".
6. Não usar para decisão automática ainda.
7. Não criar BI pesado.

Rode:
npm test -- --watchAll=false src/core/readinessValidation.test.js
npm test -- --watchAll=false
npm run build
```

---

# 6. Ordem final recomendada para você executar

## Se quer corrigir bugs visíveis primeiro

```txt
CHECK
UX1
UX2
UX3
UX4
UX5
UX6
UX7
N0
N1
N2
N3
V1
V2
```

## Se quer segurança antes de qualquer estudante real

```txt
CHECK
N0
N1
N2
N3
V1
UX1
UX2
UX3
UX4
UX5
UX6
UX7
V2
Beta fechado
```

Minha recomendação prática:

```txt
1. CHECK
2. UX1
3. UX2
4. N0
5. N1
6. N2
7. N3
8. UX5
9. V1
10. V2
```

Porque UX1/UX2 são bugs de confiança e não mexem em persistência profunda.

---

# 7. Prompt base para GPT-5.4/5.5

```txt
Antes de implementar, leia:
- docs/MEDREV_CONTEXT_FOR_AI.md
- docs/MEDREV_CODE_AUDIT_SAFETY_UX_VALIDATION_PLAN.md

Execute somente o BLOCO [NOME].

Não execute blocos futuros.
Não mexa fora dos arquivos permitidos.
Não faça refactor global.
Não instale libs.
Não faça commit, push ou deploy.
Não liste workspace inteiro.
Use git grep/git ls-files.

Se precisar mexer em store.js, Firebase/Auth/localStorage ou paths de persistência fora do escopo, pare e peça autorização.

Ao final rode:
npm run check:mojibake
npm test -- --watchAll=false
npm run build

Pare e entregue relatório:
- arquivos alterados;
- o que mudou;
- testes;
- build;
- riscos;
- pendências.
```

---

# 8. Modelo por bloco

```txt
CHECK: GPT-5.4 Medium
UX1: GPT-5.4 Medium
UX2 onboarding: GPT-5.5 High
UX3 daily briefing: GPT-5.5 High
UX4 tooltip: GPT-5.4 Medium
UX5 dashboard: GPT-5.5 High
UX6 weekly review: GPT-5.4 Medium
UX7 gargalo: GPT-5.4 Medium
N0 auditoria: GPT-5.5 High / Claude Opus Planning
N1 testes isolamento: GPT-5.5 High
N2 dataIntegrity: GPT-5.5 High
N3 rules/paths: GPT-5.4 Medium ou GPT-5.5 High
V1 telemetry: GPT-5.5 High
V2 readiness validation: GPT-5.5 High
```

---

# 9. Alertas finais

## Não mexer agora

```txt
Activity Log
notificações
editor de casos
compartilhamento colaborativo
BI pesado
novos painéis de Stats
novo motor FSRS
```

## Cuidado com docs antigas

Há documentos antigos falando D14 para “Já domino” alto. O código atual usa D21. Antes de mandar IA mexer nisso, decidir explicitamente:

```txt
Manter D21?
Voltar para D14?
```

Não misturar essa decisão com Data Safety ou Dashboard.

## Cuidado com Analytics

Antes de beta real, remover `uid` dos payloads de eventos.

## Cuidado com backup duplicado

Centralizar backup/restore em DataSafetyPanel. Ajustes deve apontar para Data Safety, não duplicar lógica.

---

# 10. Critério de pronto para beta fechado

```txt
npm test verde.
npm build verde.
check:mojibake verde.
localStorage por uid testado.
Firestore owner-only.
DataSafetyPanel exporta/importa/valida.
Restore bloqueia uid divergente.
Dashboard mobile sem overflow.
Onboarding não aparece repetidamente.
Resumo do dia aparece no máximo 1x/dia por usuário.
Inputs numéricos seguros.
Tooltips mobile funcionam.
Telemetria sem uid no payload e com opt-out.
Vestibular sem ENAMED/Raciocínio Clínico.
```
