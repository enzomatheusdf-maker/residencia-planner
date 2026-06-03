# N0 Data Safety Code Audit

## Escopo auditado

- `src/core/userScope.js`
- `src/core/authSession.js`
- `src/core/userDataMigration.js`
- `src/core/backup.js`
- `src/core/dataIntegrity.js`
- `src/services/userDataPaths.js`
- `src/services/firebase.js`
- `src/components/DataSafetyPanel.jsx`
- `src/core/store.js`
- `firestore.rules`

## Respostas objetivas

1. `localStorage` está escopado por `uid`.
   A chave atual segue `medrev:<env>:user:<uid>:store`.
   Há fallback anônimo por sessão.

2. Na troca de usuário, o app recalcula `scopeKey`, reseta a store, reidrata o escopo novo e protege sync com `assertActiveUserScope`.

3. Chaves legadas conhecidas:
   `reviewflow-v6`, `medrev-store`, `residencia-planner`, `medrev`.

4. `DataSafetyPanel` exporta backup com `ownerUid`.

5. `restore` bloqueia backup de outro `uid`.
   `importMedrevBackup` falha quando `backup.ownerUid !== currentUid`, salvo override explícito.

6. `Firestore Rules` não permitem acesso cruzado entre usuários.
   O owner check é `request.auth.uid == uid`.

7. As rules estavam amplas demais dentro do `uid`; agora os paths explícitos estão limitados a:
   - `/usuarios/{uid}`
   - `/usuarios/{uid}/activityLog/{eventId}`
   - `/usuarios/{uid}/backups/{backupId}`
   - `/usuarios/{uid}/telemetry/{eventId}`
   - `/usuarios/{uid}/calendarImports/{importId}`

8. Telemetria antes enviava `uid` em alguns eventos.
   Agora os call sites usam `safeTrackEvent`, com schema permitido e sem `uid`/texto livre.

9. Cobertura de testes já existente:
   - `src/core/userScope.test.js`
   - `src/core/authSession.test.js`
   - `src/core/userDataMigration.test.js`
   - `src/services/userDataPaths.test.js`

10. Testes ainda desejáveis:
   - troca A -> logout -> B com rehidratação real do persist;
   - restore de backup válido porém com `state` semanticamente inconsistente;
   - sincronização Firebase após troca rápida de conta.

11. Blocos ainda relevantes após este audit:
   - N1: ampliar prova de isolamento end-to-end do persist;
   - N2: evoluir `dataIntegrity` para regras mais profundas de domínio;
   - N4: se quiser beta mais duro, adicionar smoke test de troca de conta + sync real.

## Estado atual

- Escopo local por usuário: presente.
- Migração de store legada: presente.
- Export/import com `ownerUid`: presente.
- Validação estrutural de backup: presente.
- Validação de integridade do estado: presente, mas ainda pode ser aprofundada.
- Rules explícitas por subcoleção: presentes.
- Telemetria sanitizada: presente.

## Risco residual

O principal risco remanescente não é mais o pathing básico; é a falta de prova automatizada mais próxima de fluxo real de troca de conta e restore em cima da store persistida do Zustand.
