# AGENTS.md — Regras para agentes/IA neste repositório (MedRev)

## Encoding (PRIORIDADE — evitar regressão de mojibake)

- **Sempre rode `npm run check:mojibake` antes de finalizar** qualquer alteração.
- **Nunca introduza caracteres corrompidos** (sequencias de double-encoding como: A-tilde+cedilha, A-tilde+copyright, d-eth+9F, a-hat+euro, a-hat+box-drawing, e o caractere U+FFFD). Eles surgem quando um arquivo UTF-8 e reaberto/regravado como Windows-1252/Latin-1. Eles surgem quando um arquivo UTF-8 é reaberto/regravado como Windows-1252/Latin-1.
- **Salve todos os arquivos em UTF-8** (sem BOM). Não confie em "auto-detecção" de encoding do editor.
- **Evite emojis hardcoded em strings críticas de UI** (badges, ícones de status, labels). Prefira ícones `lucide-react` (JSX/ASCII, imunes a encoding). Emojis decorativos pontuais são tolerados, mas passam pelo checker.

## Barreira automática

- Há um hook `.githooks/pre-commit` que roda `check:mojibake` e bloqueia commits corrompidos.
- Ele é ativado automaticamente em `npm install` (script `prepare` → `git config core.hooksPath .githooks`).
- **Ativação manual** (se o hook não disparar): `git config core.hooksPath .githooks`.

## Validação antes de entregar

```
npm run check:mojibake
npm test
npm run build
```
(Não há `lint`/`typecheck` dedicados — o projeto é CRA/JavaScript.)

## Não versionar

- Backups/caches: `.tmp-jest/`, `.import-*`, `.restore-*`, `.tmp-encoding-corrigido/` (já no `.gitignore`).
- Não commitar artefatos de `build/`, `coverage/`, `node_modules/`.
