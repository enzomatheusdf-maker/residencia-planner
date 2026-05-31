# MedRev — Arquivos com Encoding Corrigido (a partir da Bro__9, usando a Bro__8 como referência)

## O que foi feito
Comparei a sua versão **boa antiga** (Bro__8, sem mojibake) com a **atual** (Bro__9, corrompida) e descobri o seguinte:

1. **A corrupção entrou entre as duas versões.** A Bro__8 está 100% correta; a Bro__9 acumulou 13.651 sequências de mojibake (acentos/emojis quebrados) ao ser salva com codificação dupla por algum editor.
2. **A Bro__9 NÃO pode ser descartada.** Entre v8 e v9 houve trabalho real (redesign de UI, count-up, entitlements, e mudanças de lógica). Restaurar a v8 perderia tudo isso.
3. **A única mudança de lógica no Modals.jsx** foi a função `iniciarFérias` → `iniciarFerias` (sem acento), feita de forma consistente (store + Modals). **Foi preservada.**

Então corrigi **somente o encoding** da Bro__9, preservando toda a lógica nova, e usei a Bro__8 como dicionário de texto correto onde o conserto automático não alcançava.

## Resultado
- **13 arquivos corrigidos** (pasta `src/`). **Zero texto visível corrompido.**
- Resíduo restante: apenas arte decorativa de comentários (`// ─────`), que **não afeta o app**. Pode ser deixada ou limpa depois.
- Lógica nova intacta (`iniciarFerias`, redesign, etc.).

## Como aplicar
Substitua os arquivos correspondentes no seu projeto Bro__9 pelos desta pasta:
```
src/App.js
src/components/AcademiaMetodo.jsx
src/components/BottomNav.jsx
src/components/Cronograma.jsx
src/components/CronogramaVest.jsx
src/components/Dashboard.jsx
src/components/FocusMode.jsx
src/components/Modals.jsx
src/components/Primitives.jsx
src/components/SessaoPage.jsx
src/components/Simulados.jsx
src/constants/stepDefinitions.js
src/core/store.js
```
> **Não** sobrescreva arquivos que não estão aqui (AuthModal, DicaContextual, mentor.js, simStrategy.js, etc. tinham só mudanças de lógica, sem corrupção relevante de texto visível — deixe os seus da Bro__9).

## Prevenção (importante — senão o bug volta)
Copie para a raiz do projeto os dois arquivos inclusos:
- **`.editorconfig`** — força UTF-8, LF, sem espaços finais.
- **`.gitattributes`** — normaliza fim de linha.

E no seu editor garanta **UTF-8 (sem BOM)**. No VS Code: `"files.encoding": "utf8"`, `"files.autoGuessEncoding": false`.

## Depois de aplicar
1. `npm run build` e `npm test` (eu não consegui rodar — ambiente sem rede; valide aí).
2. Conferir visualmente: Dashboard ("Carga de Revisões", "Próximos 14 dias"), Onboarding/Ajustes/Ajuda (Modals), Cronograma, Prontidão — acentos e emojis corretos.
3. Apagar `src/components/CronogramaCecilia_MEGA.jsx` (código morto, já removido na Bro__9 de qualquer forma).

## Nota de transparência
A correção foi validada byte a byte e por inspeção das strings visíveis. Não rodei o build por falta de rede no meu ambiente. Os emojis 🤝/🕊️ no Dashboard (ícones de estado social/streak) foram inferidos por contexto — confira se ficaram coerentes com o uso pretendido.
