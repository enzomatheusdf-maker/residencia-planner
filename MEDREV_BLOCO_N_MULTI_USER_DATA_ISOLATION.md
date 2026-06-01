# MEDREV — BLOCO N: P0 Multiusuário, Auth, Isolamento de Dados e Migração Segura

> **Executor:** Codex / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `xhigh`  
> **Modo:** agent com aprovação manual.  
> **Objetivo:** corrigir risco crítico de mistura de dados entre contas. Nenhuma feature nova deve avançar antes de garantir isolamento por usuário, por plataforma e por ambiente.

---

## 0. Gravidade

Este bloco é **P0**.

Se uma pessoa entra em outra conta e os dados aparecem/misturam com os dados de outro usuário, o produto tem problema crítico de:

```txt
privacidade
integridade de dados
confiança do usuário
risco de sobrescrever progresso
risco de backup/import contaminado
risco de deploy inseguro
```

Não avançar com novas features até concluir este bloco.

---

## 1. Hipóteses prováveis

Auditar todas:

### H1 — Zustand persist usando chave global

Exemplo problemático:

```js
persist(..., { name: "medrev-store" })
```

Isso salva tudo no `localStorage` igual para qualquer conta no mesmo navegador.

Se o usuário troca de conta, o app pode continuar lendo a mesma store local.

### H2 — Firebase paths sem `uid`

Exemplo problemático:

```txt
/firestore/state/main
/firestore/users/current
/firestore/progresso/res
```

Todos os usuários podem escrever no mesmo documento/coleção.

O correto é algo como:

```txt
/users/{uid}/state
/users/{uid}/platforms/{plat}/...
```

ou:

```txt
/userData/{uid}/...
```

### H3 — Sync local ↔ cloud sem checar `auth.currentUser.uid`

Se o app faz sync após login, mas usa state antigo do localStorage sem resetar/hidratar pelo usuário correto, dados podem ser enviados para a conta errada.

### H4 — `userName`, `profile`, `meta` globais

O store pode ter `meta`, `profile`, `name`, `weeklyReviews`, `enamedAnalises`, `actionInbox`, `activityLog` fora de `users[uid]`.

Isso pode fazer dados de uma conta aparecerem na outra.

### H5 — Firebase Auth mudou, mas Zustand não resetou

Ao trocar usuário:

```txt
onAuthStateChanged
```

precisa:

1. pausar sync;
2. limpar store de sessão;
3. carregar dados do novo uid;
4. só então liberar UI.

### H6 — ambiente/dev/prod compartilhado

Se dev e produção usam mesmo projeto Firebase e mesmos paths, testes locais podem contaminar dados reais.

### H7 — regras do Firestore fracas

Se as rules permitem leitura/escrita ampla:

```js
allow read, write: if request.auth != null;
```

qualquer usuário logado pode acessar caminhos sem uid.

---

## 2. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Durante:

- Não fazer deploy.
- Não fazer push.
- Não apagar dados locais automaticamente sem backup.
- Não migrar dados sem confirmação explícita.
- Não quebrar usuário offline.
- Não quebrar demo/local.
- Não continuar features de UX antes de resolver isolamento.
- Não mascarar mistura com `localStorage.clear()` genérico sem arquitetura.
- Não usar email como chave primária; usar `uid`.
- Não confiar em nome do usuário.
- Não deixar fallback global silencioso para dados privados.

---

## 3. Auditoria obrigatória

Rodar:

```bash
grep -R "persist(" -n src || true
grep -R "localStorage\|sessionStorage" -n src || true
grep -R "firebase\|firestore\|auth\|onAuthStateChanged\|currentUser\|uid" -n src || true
grep -R "collection(\|doc(\|setDoc\|getDoc\|updateDoc\|onSnapshot" -n src services || true
grep -R "users\|userData\|profile\|meta\|weeklyReviews\|enamedAnalises\|activityLog" -n src || true
grep -R "name:" -n src/core/store.js src || true
```

PowerShell:

```powershell
Select-String -Path "src\**\*" -Pattern "persist(","localStorage","sessionStorage","firebase","firestore","auth","onAuthStateChanged","currentUser","uid","collection(","doc(","setDoc","getDoc","updateDoc","onSnapshot","users","userData","profile","meta","weeklyReviews","enamedAnalises","activityLog" -CaseSensitive:$false
```

Também auditar:

```txt
src/core/store.js
src/services/firebase.js
src/services/*
src/firebase.js
firestore.rules
src/App.js
src/hooks/*
```

---

## 4. Critério de arquitetura correta

### 4.1 Todo dado privado deve ser escopado por usuário

O app deve ter uma função única:

```js
getUserScopedStorageKey(uid, env)
getUserDocPath(uid)
```

Exemplo:

```js
export function getUserScopedStorageKey(uid, env = "prod") {
  return `medrev:${env}:user:${uid}:store`;
}
```

### 4.2 LocalStorage não pode ser global

Não usar:

```txt
medrev-store
residencia-planner
medrev
```

para dados privados.

Usar:

```txt
medrev:<env>:user:<uid>:store
```

Para usuário não logado/demo:

```txt
medrev:<env>:anonymous:<anonymousSessionId>:store
```

### 4.3 Cloud Firestore deve ser uid-scoped

Preferência:

```txt
/users/{uid}/appState/main
/users/{uid}/activityLog/{eventId}
/users/{uid}/backups/{backupId}
/users/{uid}/platforms/res
/users/{uid}/platforms/vest
```

Ou state monolítico:

```txt
/users/{uid}/state/main
```

desde que rules protejam.

### 4.4 Auth transition deve resetar/hidratar corretamente

Quando usuário muda:

```txt
oldUid → null → newUid
```

Fluxo correto:

1. `setAuthStatus("loading")`
2. parar listeners antigos;
3. flush/salvar se seguro;
4. resetar store para estado limpo;
5. definir `activeUid`;
6. carregar local/cloud do `newUid`;
7. só renderizar app após hidratação;
8. liberar sync.

---

## 5. Criar core de identidade

Criar:

```txt
src/core/userScope.js
src/core/userScope.test.js
```

Funções:

```js
export function normalizeUid(uid) {}

export function getAppEnvironment() {}

export function getUserScopedStorageKey(uid, env = getAppEnvironment()) {}

export function getAnonymousStorageKey(sessionId, env = getAppEnvironment()) {}

export function getUserRootPath(uid) {}

export function getUserStatePath(uid) {}

export function assertUid(uid) {}

export function isSameUserScope(a, b) {}
```

Exemplo:

```js
export function normalizeUid(uid) {
  return String(uid || "").trim();
}

export function assertUid(uid) {
  const normalized = normalizeUid(uid);
  if (!normalized) throw new Error("Missing authenticated user uid");
  return normalized;
}

export function getUserScopedStorageKey(uid, env = "prod") {
  return `medrev:${env}:user:${assertUid(uid)}:store`;
}

export function getUserRootPath(uid) {
  return ["users", assertUid(uid)];
}
```

---

## 6. Zustand persist: corrigir chave e hidratação

### 6.1 Problema

Zustand persist geralmente define `name` estaticamente.

Isso não é seguro para multiusuário no mesmo navegador.

### 6.2 Opções

#### Opção A — persist por uid com storage customizado

Ideal, mas exige cuidado.

#### Opção B — store local por usuário controlada manualmente

Mais previsível:

- Zustand começa com estado limpo.
- Ao login, chama `loadUserState(uid)`.
- Ao salvar, persiste em `localStorage[getUserScopedStorageKey(uid)]`.

#### Opção C — manter persist global só para dados públicos

Se já for difícil refatorar tudo:

- remover dados privados do persist global;
- persistir apenas:
  ```txt
  theme
  UI settings
  lastView
  ```
- dados privados ficam uid-scoped.

### 6.3 Recomendação

Implementar **B** se o projeto já mistura cloud/local.

Se for manter Zustand persist, adicionar gate:

```js
partialize: (state) => ({
  ui: state.ui,
  settingsPublicas: state.settingsPublicas,
})
```

Dados privados não podem ficar na chave global.

### 6.4 Migration segura

Antes de mudar:

1. detectar store legado global;
2. se há usuário logado atual, oferecer migração para `uid`;
3. não migrar automaticamente se houver risco de ser dado de outra conta;
4. gerar backup JSON antes.

Criar:

```txt
src/core/userDataMigration.js
src/core/userDataMigration.test.js
```

Funções:

```js
detectLegacyGlobalStore()
backupLegacyGlobalStore()
migrateLegacyStoreToUserScope(uid, options)
clearLegacyGlobalStoreAfterConfirm()
```

---

## 7. Firebase paths e rules

### 7.1 Auditar código

Procurar qualquer uso de Firestore sem uid.

Errado:

```js
doc(db, "state", "main")
doc(db, "users", "current")
collection(db, "activityLog")
```

Correto:

```js
doc(db, "users", uid, "state", "main")
collection(db, "users", uid, "activityLog")
```

### 7.2 Criar helper

```txt
src/services/userDataPaths.js
```

```js
import { doc, collection } from "firebase/firestore";
import { db } from "./firebase";
import { assertUid } from "../core/userScope";

export function userStateDoc(uid) {
  return doc(db, "users", assertUid(uid), "state", "main");
}

export function userActivityCollection(uid) {
  return collection(db, "users", assertUid(uid), "activityLog");
}

export function userBackupCollection(uid) {
  return collection(db, "users", assertUid(uid), "backups");
}
```

Obrigar todo código a usar helpers.

### 7.3 Firestore rules

Auditar `firestore.rules`.

Rules mínimas:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Se houver docs públicos, separar claramente:

```js
match /public/{document=**} {
  allow read: if true;
  allow write: if false;
}
```

Não usar regra ampla:

```js
allow read, write: if request.auth != null;
```

---

## 8. Auth guard e troca de usuário

Criar/ajustar:

```txt
src/hooks/useAuthScope.js
src/core/authSession.js
src/core/authSession.test.js
```

### 8.1 Estado necessário

```js
auth: {
  uid: null,
  email: null,
  status: "loading" | "authenticated" | "anonymous" | "signed_out",
  hydrated: false,
  scopeKey: null,
}
```

### 8.2 Fluxo

```js
onAuthStateChanged(auth, async (user) => {
  setAuthLoading();

  stopUserListeners(oldUid);

  if (!user) {
    resetPrivateState();
    loadAnonymousState();
    setSignedOutOrAnonymous();
    return;
  }

  const uid = user.uid;
  const scopeKey = getUserScopedStorageKey(uid);

  resetPrivateState();
  const localState = loadLocalUserState(uid);
  const cloudState = await loadCloudUserState(uid);

  hydrateUserState(resolveState(localState, cloudState));

  startUserListeners(uid);
  setAuthenticated(uid);
});
```

### 8.3 UI

Enquanto `auth.hydrated === false`:

```txt
Carregando seus dados...
```

Não renderizar Dashboard com store antiga.

---

## 9. Sincronização local/cloud

### 9.1 Regra

Toda escrita precisa validar:

```js
if (activeUid !== auth.currentUser.uid) throw
```

### 9.2 Debounce

Se houver autosave, garantir:

- salva no uid atual;
- cancela autosave pendente ao trocar usuário;
- não salva estado antigo no uid novo.

Criar:

```js
export function assertActiveUserScope(activeUid, currentUid) {}
```

---

## 10. ActivityLog, backups e imports

Todos devem ser user-scoped.

### 10.1 Backup

Export deve conter:

```js
{
  schema: "medrev-backup-v1",
  ownerUid: uid,
  exportedAt,
  appVersion,
  data
}
```

Import deve avisar:

```txt
Este backup pertence ao uid X. Você está logado como uid Y.
Importar mesmo assim?
```

Por padrão: bloquear import de UID diferente.

### 10.2 ActivityLog

Nunca global.

```txt
/users/{uid}/activityLog
```

### 10.3 Calendar imports

Cronogramas importados também são dados privados.

```txt
/users/{uid}/calendarImports
```

---

## 11. Teste manual obrigatório

### Teste multiusuário no mesmo navegador

1. Login com usuário A.
2. Criar tema A.
3. Fazer revisão A.
4. Ver localStorage key:
   ```txt
   medrev:<env>:user:<uidA>:store
   ```
5. Logout.
6. Login com usuário B.
7. Confirmar que tema A não aparece.
8. Criar tema B.
9. Confirmar localStorage key:
   ```txt
   medrev:<env>:user:<uidB>:store
   ```
10. Logout B.
11. Login A.
12. Confirmar que tema A voltou e tema B não aparece.

### Teste com duas abas

1. Aba 1: usuário A.
2. Aba 2: logout/login usuário B.
3. Aba 1 deve detectar mudança ou pausar sync.
4. Nenhum dado de A pode ser salvo em B.

### Teste cloud

No Firestore:

```txt
/users/uidA/...
/users/uidB/...
```

Dados não podem se misturar.

---

## 12. Testes automatizados

Criar:

```txt
src/core/userScope.test.js
src/core/authSession.test.js
src/core/userDataMigration.test.js
src/services/userDataPaths.test.js
```

Cobrir:

- `getUserScopedStorageKey` inclui uid;
- uid ausente lança erro;
- paths incluem uid;
- auth transition reseta private state;
- autosave com uid divergente é bloqueado;
- backup com uid diferente é bloqueado;
- legacy store é detectado;
- migração não roda sem confirmação.

---

## 13. UI de diagnóstico

Adicionar em Ajustes/Data Safety:

```txt
Sessão e dados
Usuário atual: email/uid
Escopo local: medrev:prod:user:<uid>:store
Última hidratação: horário
Último sync: horário
Status: isolado / risco detectado
```

Botões:

```txt
Exportar backup desta conta
Verificar isolamento
Migrar dados locais legados
Limpar dados locais desta conta
```

Não oferecer “limpar tudo” sem aviso grande.

---

## 14. Critérios de aceite

Bloco N aprovado se:

- localStorage privado é uid-scoped;
- Firebase paths são uid-scoped;
- troca de usuário reseta/hidrata antes de mostrar UI;
- usuário B não vê dados do usuário A;
- usuário A não sobrescreve dados do usuário B;
- rules Firestore impedem acesso cruzado;
- backup/import tem ownerUid;
- dados legados globais são detectados;
- migração exige confirmação;
- testes passam;
- build passa;
- mojibake passa.

---

## 15. Comando para o Codex

```txt
Execute o MEDREV_BLOCO_N_MULTI_USER_DATA_ISOLATION.md. Este é P0. Primeiro audite store, auth, localStorage, Firebase paths e firestore.rules. Depois implemente isolamento por uid, migração defensiva e testes. Pare ao primeiro erro de teste/build causado por alteração recente. Não faça commit, deploy ou push.
```
